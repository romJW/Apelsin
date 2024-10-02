import {
    faBars,
    faCheck,
    faHouse,
    faPlus,
    faSquareCheck,
    faTrashCan,
    faUserGear,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    Breadcrumb,
    Button,
    Col,
    Dropdown,
    Input,
    List,
    Pagination,
    Row,
    Space,
    Tabs,
} from 'antd';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfileListResp } from '../../../api/responseModels/profile/profileListResponse';
import { ProfileResp } from '../../../api/responseModels/profile/profileResponse';
import { CRMAPIManager } from '../../../classes/crmApiManager';
import { messageService } from '../../../classes/messageService';
import { SettingsManager } from '../../../classes/settingsManager';
import { TSpecialty } from '../../../types/specialty';
import { Loader } from '../../atoms/loader';
import { CreateSpecialtyDialog } from '../dialogs/createSpecialtyDialog';
import { PageSizeChanger } from '@molecules/paginationControls/pageSizeChanger';
import { ShowMoreButton } from '@molecules/paginationControls/showMoreButton';
import { TMetadata } from 'types/metadata';
import { store as pStore } from '@molecules/paginationControls/pageSizeStore';
import { ListViewChanger } from '@molecules/listViewChanger/listViewChanger';
import { GlobalConstants } from '@constants/global';
import { Common } from '@classes/commonMethods';
import { FilterStore } from '@organisms/productServicesFilter/filterStore';
import { observer } from 'mobx-react';
import { SpecialtyParams } from 'types/getParams'
import { LastIdStore } from '@pages/lastIdStore';
const { Search } = Input;
const filterStore = new FilterStore();
const filter = filterStore.filter;

const SpecialtyList = observer((): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [specialtyList, setSpecialtyList] = useState<Array<TSpecialty>>([]);
    const [selecting, setSelecting] = useState<boolean>(false);
    const [selectList, setSelectList] = useState<Array<{ id: number; name: string }>>([]);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const creds = SettingsManager.getConnectionCredentials();
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [currentMeta, setCurrentMeta] = useState<TMetadata>(null);
    const tabNumber = useRef<string>('');

    async function getSpecialtyList(page: number = currentPage, addition: boolean = false) {
        setIsLoading(true);
        try {
            const creds = SettingsManager.getConnectionCredentials();
            const specList = await CRMAPIManager.request<ProfileListResp>(async (api) => {
                const params: SpecialtyParams = {
                    crm_id: creds.crmID,
                    sort_by: filter.sortBy,
                    sort_direction: filter.sortDirection,
                    filters: {
                        created_at: [...filter.createdDates],
                        updated_at: [...filter.updatedDates],
                        deleted: filter.deleted,
                    },
                    query: filter.query,
                    page,
                    per_page: pStore.pS,
                };
                Object.keys(params.filters).filter(
                    (key) => params.filters[key] === null && delete params.filters[key]
                );
                return await api.getProfileList(params);
            });
            if (specList.errorMessages) throw specList.errorMessages;
            if (addition) {
                setSpecialtyList((sl) => [...sl, ...specList.data.data]);
            } else {
                setSpecialtyList(specList.data.data);
            }
            setCurrentMeta(specList.data.meta);
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
    }

    async function handleShowMore() {
        await getSpecialtyList(currentPage + 1, true);
        setCurrentPage((pageNumber) => pageNumber + 1);
    }

    async function handleChangePage(newPage: number) {
        await getSpecialtyList(newPage);
        setCurrentPage(newPage);
    }

    function openCard(id: number) {
        LastIdStore.setLastSpecialtyId(id);
        navigate(`/lk/worker/crm/${creds.crmID}/specialties/${id}`);
    }

    function onChangeTab(key: string) {
        if (key == '3') filterStore.changeDeleted('only');
        else {
            filterStore.changeDeleted('null');
        }
        tabNumber.current = key;
    }
    
    async function deleteSelected() {
        setIsLoading(true);
        const creds = SettingsManager.getConnectionCredentials();
        while (selectList.length != 0) {
            const target = selectList.pop();
            try {
                const del = await CRMAPIManager.request<ProfileResp>(async (api) => {
                    return await api.removeProfile(target.id, creds.crmID);
                });
                if (del.errorMessages) throw del.errorMessages;
                messageService.sendSuccess('Запись удалена');
            } catch (errors) {
                messageService.sendErrorList(errors);
            }
            setSelectList((oldList) => oldList.filter((sli) => sli != target));
        }
        await getSpecialtyList(1);
        setCurrentPage(1);
        setIsLoading(false);
    }

    async function restoreSelected() {
        setIsLoading(true);
        const creds = SettingsManager.getConnectionCredentials();
        while (selectList.length != 0) {
            const target = selectList.pop();
            try {
                const del = await CRMAPIManager.request<ProfileResp>(async (api) => {
                    return await api.restoreProfile(target.id, creds.crmID);
                });
                if (del.errorMessages) throw del.errorMessages;
                messageService.sendSuccess('Запись удалена');
            } catch (errors) {
                messageService.sendErrorList(errors);
            }
            setSelectList((oldList) => oldList.filter((sli) => sli != target));
        }
        await getSpecialtyList(1);
        setCurrentPage(1);
        setIsLoading(false);
    }

    function handleCreateSpecialty() {
        setIsDialogOpen(true);
    }

    function handleSpecialtyClick(specialtyId: number, specialtyName: string) {
        if (selecting) {
            !selectList.find((sli) => sli.id == specialtyId)
                ? setSelectList((oldList) => [...oldList, { id: specialtyId, name: specialtyName }])
                : setSelectList((oldList) => oldList.filter((sli) => sli.id != specialtyId));
        } else {
            openCard(specialtyId);
        }
    }
    function beforeMountSpeacialtyList() {
        Common.checkUserBelongToCrm(GlobalConstants.CrmOrderinUrl).then((res) => {
            if (!res) navigate(`/lk/worker/crm/${creds.crmID}`);
        });
        getSpecialtyList();
    }

    useEffect(() => {
        beforeMountSpeacialtyList();
    }, [filter.deleted]);

    useEffect(() => {
        if (currentMeta?.total == null || currentMeta?.total == 0) return;
        let newPage = Math.ceil(currentMeta.from / pStore.pS);
        getSpecialtyList(newPage).then(() => {
            setCurrentPage(newPage);
        });
    }, [pStore.pS]);

    return (
        <div id="app-specialty-list">
            <CreateSpecialtyDialog
                isModalOpen={isDialogOpen}
                setIsModalOpen={setIsDialogOpen}
            />
            {isLoading && <Loader />}
            <div className="functional-container">
                {!(tabNumber.current == '3') ? (
                    <Dropdown.Button
                    className="functional-menu"
                    icon={
                        selecting ? <p>{selectList.length}</p> : <FontAwesomeIcon icon={faBars} />
                    }
                    menu={{
                        items: selecting
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
                                    key: 'createElement',
                                    label: 'Создать профиль',
                                    icon: <FontAwesomeIcon icon={faPlus} />,
                                    onClick: handleCreateSpecialty,
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
                        selecting ? <p>{selectList.length}</p> : <FontAwesomeIcon icon={faBars} />
                    }
                    menu={{
                        items: selecting
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
                                    key: 'createElement',
                                    label: 'Создать профиль',
                                    icon: <FontAwesomeIcon icon={faPlus} />,
                                    onClick: handleCreateSpecialty,
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
            <Row className="breadcrumb-header">
                <Col className="header-location">
                    <span>Профили</span>
                    <span className="header-location__quantity">
                        {currentMeta && ` (${currentMeta?.total}) `}
                    </span>
                </Col>
                <Col className="header-search">
                    <Search
                        allowClear
                        className="header-search-input"
                        onSearch={async (value) => {
                            if (value == null || value == '') return;
                            // TODO: search
                        }}
                    />
                </Col>
            </Row>
            <Row className="breadcrumbs-controls">
                <Col className="breadcrumbs">
                    <Breadcrumb>
                        <Breadcrumb.Item onClick={() => navigate(`/lk/worker/crm/${creds.crmID}`)}>
                            <FontAwesomeIcon icon={faHouse} />
                        </Breadcrumb.Item>
                        <Breadcrumb.Item>
                            <FontAwesomeIcon icon={faUserGear} />
                            <span className="crumb-name">Профили</span>
                        </Breadcrumb.Item>
                    </Breadcrumb>
                </Col>
                <Col>
                    <Space>
                        <PageSizeChanger />
                        <ListViewChanger />
                    </Space>
                </Col>
            </Row>
            <Tabs
                items={[
                    {
                        label: 'Профили',
                        key: '1',
                        children: (
                            <List
                                className="specialty-card-list"
                                dataSource={specialtyList}
                                itemLayout="horizontal"
                                renderItem={(item) => (
                                    <List.Item className="specialty-card">
                                        <Row
                                            onClick={() => handleSpecialtyClick(item.id, item.name)}
                                        >
                                            <Col>
                                                <Row>
                                                    <Col>
                                                        <h3 className="title">{item.name}</h3>
                                                    </Col>
                                                    <Col>
                                                        <h3 className="code">{item.code}</h3>
                                                    </Col>
                                                </Row>
                                            </Col>
                                            {selecting && (
                                                <Col className="select-button">
                                                    <Button
                                                        icon={<FontAwesomeIcon icon={faCheck} />}
                                                        shape="circle"
                                                        type={
                                                            selectList.find(
                                                                (sli) => sli.id == item.id
                                                            )
                                                                ? 'primary'
                                                                : 'default'
                                                        }
                                                    />
                                                </Col>
                                            )}
                                        </Row>
                                    </List.Item>
                                )}
                            />
                        ),
                    },
                    {
                        label: 'Корзина',
                        key: '3',
                        children: (
                            <List
                                className="specialty-card-list"
                                dataSource={specialtyList}
                                itemLayout="horizontal"
                                renderItem={(item) => (
                                    <List.Item className="specialty-card">
                                        <Row
                                            onClick={() => handleSpecialtyClick(item.id, item.name)}
                                        >
                                            <Col>
                                                <Row>
                                                    <Col>
                                                        <h3 className="title">{item.name}</h3>
                                                    </Col>
                                                    <Col>
                                                        <h3 className="code">{item.code}</h3>
                                                    </Col>
                                                </Row>
                                            </Col>
                                            {selecting && (
                                                <Col className="select-button">
                                                    <Button
                                                        icon={<FontAwesomeIcon icon={faCheck} />}
                                                        shape="circle"
                                                        type={
                                                            selectList.find(
                                                                (sli) => sli.id == item.id
                                                            )
                                                                ? 'primary'
                                                                : 'default'
                                                        }
                                                    />
                                                </Col>
                                            )}
                                        </Row>
                                    </List.Item>
                                )}
                            />
                        ),
                    },
                ]}
                onChange={(key) => {
                    onChangeTab(key);
                }}
            />

            { currentMeta && currentPage < currentMeta.last_page && <ShowMoreButton onClick={handleShowMore} text='Показать ещё' /> }

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

export { SpecialtyList };
