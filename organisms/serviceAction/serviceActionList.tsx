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
import { Breadcrumb, Button, Col, Dropdown, Input, List, Menu, Pagination, Row } from 'antd';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { TMetadata } from 'types/metadata';
import { ServiceActionListResp } from '../../../api/responseModels/service/serviceActionListResponse';
import { ServiceActionResp } from '../../../api/responseModels/service/serviceActionResponse';
import { CRMAPIManager } from '../../../classes/crmApiManager';
import { messageService } from '../../../classes/messageService';
import { SettingsManager } from '../../../classes/settingsManager';
import { GlobalConstants } from '../../../constants/global';
import { TServiceAction } from '../../../types/serviceAction';
import { Loader } from '../../atoms/loader';
import { store as pStore } from '@molecules/paginationControls/pageSizeStore';
import { PageSizeChanger } from '@molecules/paginationControls/pageSizeChanger';
import { CreateServiceActionDialog } from '../dialogs/createServiceActionDialog';
import { ShowMoreButton } from '@molecules/paginationControls/showMoreButton';
import { ListViewChanger } from '@molecules/listViewChanger/listViewChanger';
const { Search } = Input;

type TProps = {
    setActivePivot: React.Dispatch<React.SetStateAction<string>>;
    setLastServiceActionId: React.Dispatch<React.SetStateAction<number>>;
};

const ServiceActionList = ({ setActivePivot, setLastServiceActionId }: TProps): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [serviceActionList, setServiceActionList] = useState<Array<TServiceAction>>([]);
    const [selecting, setSelecting] = useState<boolean>(false);
    const [selectList, setSelectList] = useState<Array<{ id: number; name: string }>>([]);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [currentMeta, setCurrentMeta] = useState<TMetadata>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);

    async function getServiceActionList(page: number = currentPage, addition: boolean = false) {
        setIsLoading(true);
        try {
            const creds = SettingsManager.getConnectionCredentials();
            const serActList = await CRMAPIManager.request<ServiceActionListResp>(async (api) => {
                return await api.getServiceActionList(creds.crmID, page, pStore.pS);
            });
            if (serActList.errorMessages) throw serActList.errorMessages;
            if (addition) {
                setServiceActionList(sal => [...sal, ...serActList.data.data]);
            }
            else {
                setServiceActionList(serActList.data.data);
            }
            setCurrentMeta(serActList.data.meta);
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
    }

    async function handleShowMore() {
        await getServiceActionList(currentPage + 1, true);
        setCurrentPage(pageNumber => pageNumber + 1);
    }

    async function handleChangePage(newPage: number) {
        await getServiceActionList(newPage);
        setCurrentPage(newPage);
    }

    function openCard(id: number) {
        setLastServiceActionId(id);
        setActivePivot(GlobalConstants.ActivePivotServiceActionProfileValue);
    }

    async function deleteSelected() {
        setIsLoading(true);
        const creds = SettingsManager.getConnectionCredentials();
        while (selectList.length != 0) {
            const target = selectList.pop();
            try {
                const del = await CRMAPIManager.request<ServiceActionResp>(async (api) => {
                    return await api.removeServiceAction(target.id, creds.crmID);
                });
                if (del.errorMessages) throw del.errorMessages;
                messageService.sendSuccess('Запись удалена');
            } catch (errors) {
                messageService.sendErrorList(errors);
            }
            setSelectList((oldList) => oldList.filter((sli) => sli != target));
        }
        await getServiceActionList(1);
        setCurrentPage(1);
        setIsLoading(false);
    }

    function handleCreateServiceAction() {
        setIsDialogOpen(true);
    }

    function handleActionClick(actionId: number, actionName: string) {
        if (selecting) {
            !selectList.find((sli) => sli.id == actionId)
                ? setSelectList((oldList) => [...oldList, { id: actionId, name: actionName }])
                : setSelectList((oldList) => oldList.filter((sli) => sli.id != actionId));
        } else {
            openCard(actionId);
        }
    }

    useEffect(() => {
        getServiceActionList();
    }, []);

    useEffect(() => {
        if(currentMeta?.total == null || currentMeta?.total == 0) return;
        let newPage = Math.ceil(currentMeta.from / pStore.pS);
        getServiceActionList(newPage).then(() => {
            setCurrentPage(newPage);
        })
    }, [pStore.pS]);

    return (
        <div id="app-service-action-list">
            {isLoading && <Loader />}
            <CreateServiceActionDialog
                isModalOpen={isDialogOpen}
                setIsModalOpen={setIsDialogOpen}
                setLastServiceActionId={setLastServiceActionId}
                setActivePivot={setActivePivot}
            />
            <div className="functional-container">
                <Dropdown.Button
                    className="functional-menu"
                    icon={
                        selecting ? <p>{selectList.length}</p> : <FontAwesomeIcon icon={faBars} />
                    }
                    overlay={
                        <Menu
                            items={
                                selecting
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
                                              label: 'Создать действие',
                                              icon: <FontAwesomeIcon icon={faPlus} />,
                                              onClick: handleCreateServiceAction,
                                          },
                                          {
                                              key: 'selection',
                                              label: 'Выбор элементов',
                                              icon: <FontAwesomeIcon icon={faSquareCheck} />,
                                              onClick: () => {
                                                  setSelecting(true);
                                              },
                                          },
                                      ]
                            }
                        />
                    }
                    placement="topRight"
                    type={selecting ? 'primary' : 'default'}
                />
            </div>
            <Row className="breadcrumb-header">
                <Col className="header-location">
                    <span>Действия услуг</span>
                    <span className="header-location__quantity">
                        {currentMeta && ` (${currentMeta.total}) `}
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
                        <Breadcrumb.Item
                            onClick={() =>
                                setActivePivot(GlobalConstants.ActivePivotCRMProfileValue)
                            }
                        >
                            <FontAwesomeIcon icon={faHouse} />
                        </Breadcrumb.Item>
                        <Breadcrumb.Item>
                            <FontAwesomeIcon icon={faUserGear} />
                            <span className="crumb-name">Действия услуг</span>
                        </Breadcrumb.Item>
                    </Breadcrumb>
                </Col>
                <Col>
                    <PageSizeChanger />
                    <ListViewChanger />
                </Col>
            </Row>
            <List
                className="service-action-card-list"
                dataSource={serviceActionList}
                itemLayout="horizontal"
                renderItem={(item) => (
                    <List.Item className="service-action-card">
                        <Row onClick={() => handleActionClick(item.id, item.name)}>
                            <Col>
                                <Row>
                                    <Col>
                                        <h3 className="title" onClick={() => openCard(item.id)}>
                                            {item.name}
                                        </h3>
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
                                            selectList.find((sli) => sli.id == item.id)
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
};

export { ServiceActionList };
