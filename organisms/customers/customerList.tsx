import {
    faBars,
    faPlus,
    faSquareCheck,
    faTrashCan,
    faXmark,
    faUser,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    Dropdown,
    Pagination,
    Space,
    Tabs,
} from 'antd';
import { observer } from 'mobx-react';
import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
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
import { columnViewStore as vStore } from '@molecules/listViewChanger/listViewStore';
import { store as pStore } from '@molecules/paginationControls/pageSizeStore';
import { CustomerFilter } from '@organisms/customersFilter/customersFilter';
import { FilterStore } from '@organisms/customersFilter/filterStore';
import { CustomerParams } from 'types/getParams';
import { RenderUserList } from '@molecules/renderList/userList';
import { HeaderListBreadcrumbs } from '@molecules/breadcrumbs/listsBreadcrumbs/HeaderListBreadcrumbs';
import { ShowMoreButton } from '@molecules/paginationControls/showMoreButton';
import { TMetadata } from 'types/metadata';
import { debounce } from '../../../utils/functions';
import { Common } from '@classes/commonMethods';
import { OptionsMenu } from '@molecules/OptionsMenu';

const filterStore = new FilterStore();
const filter = filterStore.filter;

const CustomerList = observer((): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [workerList, setWorkerList] = useState<Array<TUser>>([]);
    const [currentMeta, setCurrentMeta] = useState<TMetadata>(null);
    const [selecting, setSelecting] = useState<boolean>(false);
    const [selectList, setSelectList] = useState<Array<{ id: number; name: string }>>([]);
    const [inviteWorkerOpen, setInviteWorkerOpen] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const navigate = useNavigate();
    const creds = SettingsManager.getConnectionCredentials();
    const tabNumber = useRef<string>('');

    function onChangeTab(key: string) {
        if (key == '3') filterStore.changeDeleted('only');
        else {
            filterStore.changeDeleted('null');
        }
        tabNumber.current = key;
    }

    async function getCustomerList(page: number = currentPage, addition: boolean = false) {
        setIsLoading(true);
        try {
            const customerList = await CRMAPIManager.request<UserListResp>(async (api) => {
                const params: CustomerParams = {
                    crm_id: creds.crmID,
                    sort_by: filter.sortBy,
                    sort_direction: filter.sortDirection,
                    filters: {
                        created_at: [...filter.createdDates],
                        updated_at: [...filter.updatedDates],
                        deleted: filter.deleted,
                        profile: "customer",
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
            if (customerList.errorMessages) {
                setWorkerList([]);
                throw customerList.errorMessages;
            }
            if (addition) {
                setWorkerList((cl) => [...cl, ...customerList.data.data]);
            } else {
                setWorkerList(customerList.data.data);
            }
            setCurrentMeta(customerList.data.meta);
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
    }

    async function handleShowMore() {
        await getCustomerList(currentPage + 1, true);
        setCurrentPage((pageNumber) => pageNumber + 1);
    }

    async function handleChangePage(newPage: number) {
        await getCustomerList(newPage);
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
            } catch (err) {
                messageService.sendError(target.name + ': ' + err.message);
            }
            setSelectList((oldList) => oldList.filter((sli) => sli != target));
        }
        await getCustomerList(1);
        setCurrentPage(1);
        setIsLoading(false);
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
        await getCustomerList(1);
        setCurrentPage(1);
        setIsLoading(false);
        navigate(``);
    }
    
    function beforeMountCustomerList() {
        Common.checkUserBelongToCrm(GlobalConstants.CrmOrderinUrl).then((res) => {
            if (!res) navigate(`/lk/worker/crm/${creds.crmID}`);
        });
        if (localStorage.getItem('invitationIsSent')) {
            localStorage.removeItem('invitationIsSent');
            messageService.sendSuccess('Клиент добавлен');
        }
        getCustomerList();
    }

    

    useEffect(() => {
        beforeMountCustomerList();
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
        let newPage = Math.ceil(currentMeta.from / pStore.pS);
        getCustomerList(newPage).then(() => {
            setCurrentPage(newPage);
        });
    }, [pStore.pS]);

    return (
        <div id="app-worker-list">
            {isLoading && <Loader />}
            <CreateWorkerDialog
                isModalOpen={inviteWorkerOpen}
                setIsModalOpen={setInviteWorkerOpen}
                isCustomer={true}
                getCustomerList={getCustomerList}
            />
            <div className="functional-container">
                {!(tabNumber.current == '3') ? (
                    <Dropdown.Button
                        className="functional-menu"
                        icon={
                            selecting ? (
                                <p>{selectList.length}</p>
                            ) : (
                                <FontAwesomeIcon className='btn-icon' icon={faBars} />
                            )
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
                                    label: 'Создать клиента',
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
                    />

                ) : (
                    <Dropdown.Button
                        className="functional-menu"
                        icon={
                            selecting ? (
                                <p>{selectList.length}</p>
                            ) : (
                                <FontAwesomeIcon className='btn-icon' icon={faBars} />
                            )
                        }
                        menu={{items: selecting
                            ? [
                                    {
                                        key: 'delete',
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
                                        label: 'Создать клиента',
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
                    />
                )}

            </div>

            <HeaderListBreadcrumbs
                dataTotal={currentMeta?.total}
                title={'Клиенты'}
                dataTitle={'Клиенты'}
                dataIcon={faUser}
                dataPrice={null}
                flag={false}
                isProduct={false}
                categoryPath={null}
                openCategoryCard={null}
                onSearch={handleSearchChange}
                searchPlaceHolder='По клиентам'
            >
                <Space>
                    <CustomerFilter store={filterStore} />
                    <OptionsMenu />
                </Space>
            </HeaderListBreadcrumbs>
            <Tabs
                items={[
                    {
                        label: 'Клиенты',
                        key: '1',
                        children: (
                            <RenderUserList
                                inviteStatus={InvitationStatuses.accepted}
                                userList={workerList}
                                selecting={selecting}
                                selectList={selectList}
                                setSelectList={setSelectList}
                                isWorker={false}
                                col={vStore.col}
                            />
                        ),
                    },
                    {
                        label: 'Корзина',
                        key: '3',

                        children: (
                            <RenderUserList
                                inviteStatus={InvitationStatuses.accepted}
                                userList={workerList}
                                selecting={selecting}
                                selectList={selectList}
                                setSelectList={setSelectList}
                                isWorker={false}
                                col={vStore.col}
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

export { CustomerList };