import {
    faBars,
    faPlus,
    faSquareCheck,
    faTrashCan,
    faUserTie,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    Dropdown,
    Space,
    Tabs,
    Pagination,
} from 'antd';

import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { observer } from 'mobx-react';
import { useNavigate } from 'react-router-dom';
import { UserListResp } from '@api/responseModels/user/userListResponse';
import { UserResp } from '@api/responseModels/user/userResponse';
import { CRMAPIManager } from '@classes/crmApiManager';
import { messageService } from '@classes/messageService';
import { SettingsManager } from '@classes/settingsManager';
import { GlobalConstants } from '@constants/global';
import { TUser } from 'types/user';
import { Loader } from '@atoms/loader';
import { InvitationStatuses } from '@enums/invitationStatuses';
import { CreateWorkerDialog } from '../dialogs/createWorkerDialog';
import { columnViewStore } from '@molecules/listViewChanger/listViewStore';
import { FilterStore } from '@organisms/workersFilter/filterStore';
import { WorkersFilter } from '@organisms/workersFilter/workersFilter';
import { WorkerParams } from 'types/getParams';
import { RenderUserList } from '@molecules/renderList/userList';
import { HeaderListBreadcrumbs } from '@molecules/breadcrumbs/listsBreadcrumbs/HeaderListBreadcrumbs';
import { Common } from '@classes/commonMethods';
import { TMetadata } from 'types/metadata';
import { store as pStore } from '@molecules/paginationControls/pageSizeStore';
import { ShowMoreButton } from '@molecules/paginationControls/showMoreButton';
import { debounce } from '../../../utils/functions';
import { OptionsMenu } from '@molecules/OptionsMenu';

const filterStore = new FilterStore();
const filter = filterStore.filter;

const WorkerList = observer((): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [workerList, setWorkerList] = useState<Array<TUser>>([]);
    const [selecting, setSelecting] = useState<boolean>(false);
    const [selectList, setSelectList] = useState<Array<{ id: number; name: string }>>([]);
    const [inviteWorkerOpen, setInviteWorkerOpen] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [currentMeta, setCurrentMeta] = useState<TMetadata>(null);
    const tabNumber = useRef<string>('')
    const navigate = useNavigate();
    const creds = SettingsManager.getConnectionCredentials();

    async function getWorkerList(page: number = currentPage, addition = false) {
        setIsLoading(true);
        try {
            const creds = SettingsManager.getConnectionCredentials();
            const workerList = await CRMAPIManager.request<UserListResp>(async (api) => {
                const params: WorkerParams = {
                    crm_id: creds.crmID,
                    sort_by: filter.sortBy,
                    sort_direction: filter.sortDirection,
                    filters: {
                        created_at: [...filter.createdDates],
                        updated_at: [...filter.updatedDates],
                        deleted: filter.deleted,
                        profile: 'worker',
                    },
                    query: filter.query,
                    page,
                    per_page: pStore.pS,
                };
                Object.keys(params.filters).filter(
                    (key) => params.filters[key] === null && delete params.filters[key]
                );
                return await api.getUserList(params);
            });
            if (workerList.errorMessages) {
                setWorkerList([]);
                throw workerList.errorMessages;
            }
            if (addition) {
                setWorkerList((wl) => [...wl, ...workerList.data.data]);
            } else {
                setWorkerList(workerList.data.data);
            }
            setCurrentMeta(workerList.data.meta);
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
    }

    async function handleShowMore() {
        await getWorkerList(currentPage + 1, true);
        setCurrentPage((pageNumber) => pageNumber + 1);
    }

    async function handleChangePage(newPage: number) {
        await getWorkerList(newPage);
        setCurrentPage(newPage);
    }

    async function deleteSelected() {
        setIsLoading(true);
        const creds = SettingsManager.getConnectionCredentials();
        while (selectList.length != 0) {
            const target = selectList.pop();
            try {
                const del = await CRMAPIManager.request<UserResp>(async (api) => {
                    return await api.removeUser(String(target.id), creds.crmID);
                });
                if (del.errorMessages) throw del.errorMessages;
            } catch (errors) {
                messageService.sendErrorList(errors);
            }
            setSelectList((oldList) => oldList.filter((sli) => sli != target));
        }
        await getWorkerList(1);
        setCurrentPage(1);
        setIsLoading(false);
        navigate(``);
    }
    async function restoreSelected() {
        setIsLoading(true);
        const creds = SettingsManager.getConnectionCredentials();
        while (selectList.length != 0) {
            const target = selectList.pop();
            try {
                const restored = await CRMAPIManager.request<UserResp>(async (api) => {
                    return await api.restoreUser(String(target.id), creds.crmID);
                });
                if (restored.errorMessages) throw restored.errorMessages;
            } catch (errors) {
                messageService.sendErrorList(errors);
            }
            setSelectList((oldList) => oldList.filter((sli) => sli != target));
        }
        await getWorkerList(1);
        setCurrentPage(1);
        setIsLoading(false);
        navigate(``);
    }

    const handleSearchChange = debounce((e: React.ChangeEvent<HTMLInputElement>) => {

        filterStore.changeQuery(e.target.value);
    }, 500);

    function beforeMountWorkerList() {
        Common.checkUserBelongToCrm(GlobalConstants.CrmOrderinUrl).then((res) => {
            if (!res) navigate(`/lk/worker/crm/${creds.crmID}`);
        });
        if (localStorage.getItem('invitationIsSent')) {
            localStorage.removeItem('invitationIsSent');
            messageService.sendSuccess('Приглашение отправлено');
            getWorkerList();
        }
        getWorkerList();
    }
    
    function onChangeTab(key: string){
        if (key == '3') filterStore.changeDeleted('only');
        else {
            filterStore.changeDeleted('null');
        }
        tabNumber.current = key;
    };

    useEffect(() => {
        beforeMountWorkerList();
    }, [
        filter.sortBy,
        filter.sortDirection,
        filter.updatedDates,
        filter.createdDates,
        filter.query,
        filter.deleted,

    ]);

    useEffect(() => {
        if (currentMeta?.total == null || currentMeta?.total == 0) return;
        const newPage = Math.ceil(currentMeta.from / pStore.pS);
        getWorkerList(newPage).then(() => {
            setCurrentPage(newPage);
        });
    }, [pStore.pS]);

    return (
        <div id="app-worker-list">
            {isLoading && <Loader />}
            <CreateWorkerDialog
                isModalOpen={inviteWorkerOpen}
                setIsModalOpen={setInviteWorkerOpen}
                isCustomer={false}
                getCustomerList={getWorkerList}
            />
            <div className="functional-container">
                {!(tabNumber.current == '3') ? (<Dropdown.Button
                className="functional-menu"
                icon={
                    selecting ? <p>{selectList.length}</p> : <FontAwesomeIcon className='btn-icon' icon={faBars} />
                }
                menu={{items: selecting
                    ? [
                        {
                            key: 'delete',
                            danger: true,
                            label: 'Удалить',
                            icon: <FontAwesomeIcon icon={faTrashCan} />,
                            onClick: deleteSelected,
                        },
                        {
                            key: 'abort',
                            label: 'Отмена',
                            icon: <FontAwesomeIcon icon={faXmark} />,
                            onClick: () => {
                                setSelecting(false);
                                setSelectList([]);
                            },
                        },
                    ]
                : [
                        {
                            key: 'createGroup',
                            label: 'Создать группу',
                            icon: <FontAwesomeIcon icon={faPlus} />,
                            disabled: true,
                        },
                        {
                            key: 'createElement',
                            label: 'Пригласить пользователя',
                            icon: <FontAwesomeIcon icon={faPlus} />,
                            onClick: () => {
                                setInviteWorkerOpen(true);
                            },
                        },
                        {
                            key: 'selection',
                            label: 'Выбор элементов',
                            icon: <FontAwesomeIcon icon={faSquareCheck} />,
                            onClick: () => {
                                setSelecting(true);
                            },
                        },
                    ]}}
                placement="topRight"
                type={selecting ? 'primary' : 'default'}
            />):
            (<Dropdown.Button
            className="functional-menu"
            icon={
                selecting ? <p>{selectList.length}</p> : <FontAwesomeIcon className='btn-icon' icon={faBars} />
            }
            menu={{items: selecting
                ? [
                    {
                        key: 'restore',
                        danger: true,
                        label: 'Восстановить',
                        icon: <FontAwesomeIcon icon={faTrashCan} />,
                        onClick: restoreSelected,
                    },
                    {
                        key: 'abort',
                        label: 'Отмена',
                        icon: <FontAwesomeIcon icon={faXmark} />,
                        onClick: () => {
                            setSelecting(false);
                            setSelectList([]);
                        },
                    },
                ]
                : [
                    {
                        key: 'createGroup',
                        label: 'Создать группу',
                        icon: <FontAwesomeIcon icon={faPlus} />,
                        disabled: true,
                    },
                    {
                        key: 'createElement',
                        label: 'Пригласить пользователя',
                        icon: <FontAwesomeIcon icon={faPlus} />,
                        onClick: () => {
                            setInviteWorkerOpen(true);
                        },
                    },
                    {
                        key: 'selection',
                        label: 'Выбор элементов',
                        icon: <FontAwesomeIcon icon={faSquareCheck} />,
                        onClick: () => {
                            setSelecting(true);
                        },
                    },
                ]}}
            placement="topRight"
                type={selecting ? 'primary' : 'default'}
            />)
        }
            </div>
            <HeaderListBreadcrumbs
                dataTotal={currentMeta?.total}
                title={'Сотрудники'}
                dataTitle={'Сотрудники'}
                dataIcon={faUserTie}
                dataPrice={null}
                flag={false}
                isProduct={false}
                categoryPath={null}
                openCategoryCard={null}
                onSearch={handleSearchChange}
                searchPlaceHolder='По сотрудникам'
            >
                <Space>
                    <WorkersFilter store={filterStore} />
                    <OptionsMenu />
                </Space>
            </HeaderListBreadcrumbs>
            <Tabs
                items={[
                    {
                        label: 'Работают',
                        key: '1',
                        children: (
                            <RenderUserList
                                setSelectList={setSelectList}
                                inviteStatus={InvitationStatuses.accepted}
                                userList={workerList}
                                selecting={selecting}
                                selectList={selectList}
                                isWorker={true}
                                col={columnViewStore.col}
                            />
                        ),
                    },
                    {
                        label: 'Приглашенные',
                        key: '2',
                        children: (
                            <RenderUserList
                                inviteStatus={InvitationStatuses.pending}
                                userList={workerList}
                                selecting={selecting}
                                selectList={selectList}
                                setSelectList={setSelectList}
                                isWorker={true}
                                col={columnViewStore.col}
                            />
                        ),
                    },
                    {
                        label: 'Корзина',
                        key: '3',
                        children: (
                            <RenderUserList
                                inviteStatus={InvitationStatuses.pending}
                                userList={workerList}
                                selecting={selecting}
                                selectList={selectList}
                                setSelectList={setSelectList}
                                isWorker={true}
                                col={columnViewStore.col}
                            />
                        ),
                    },
                ]}
                onChange={(key) => {
                    onChangeTab(key);
                }}
            />
            {currentMeta && currentPage < currentMeta.last_page && (
                <ShowMoreButton onClick={handleShowMore} text="Показать ещё" />
            )}
            <Pagination
                current={currentPage}
                defaultCurrent={1}
                onChange={handleChangePage}
                pageSize={pStore.pS}
                showSizeChanger={false}
                total={currentMeta?.total ?? 1}
            />
        </div>
    );
});

export { WorkerList };
