import { HeaderListBreadcrumbs } from '@molecules/breadcrumbs/listsBreadcrumbs/HeaderListBreadcrumbs';
import {
    faBars,
    faFolderTree,
    faPlus,
    faSquareCheck,
    faTrashCan,
    faWandMagicSparkles,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ListViewChanger } from '@molecules/listViewChanger/listViewChanger';
import { RenderCategoryList } from '@molecules/renderList/categoryList';
import {
    Dropdown,
    Menu,
    Pagination,
    Tabs,
} from 'antd';
import { useEffect, useState, useRef } from 'react';
import { CRMTotalResp } from '../../../api/responseModels/crm/crmTotalResponse';
import { ServiceCategoryListResp } from '../../../api/responseModels/service/serviceCategoryListResponse';
import { ServiceCategoryResp } from '../../../api/responseModels/service/serviceCategoryResponse';
import { CRMAPIManager } from '../../../classes/crmApiManager';
import { messageService } from '../../../classes/messageService';
import { SettingsManager } from '../../../classes/settingsManager';
import { GlobalConstants } from '../../../constants/global';
import { TService } from '../../../types/service';
import { TServiceCategory } from '../../../types/serviceCategory';
import { Loader } from '../../atoms/loader';
import { store as pStore } from '@molecules/paginationControls/pageSizeStore';
import { PageSizeChanger } from '@molecules/paginationControls/pageSizeChanger';
import { ShowMoreButton } from '@molecules/paginationControls/showMoreButton';
import { TMetadata } from 'types/metadata';
import { useNavigate } from 'react-router';
import { Common } from '@classes/commonMethods';
import { FilterStore } from '@organisms/productServicesFilter/filterStore';
import { ServiceParams } from 'types/getParams';
import { observer } from 'mobx-react';
import { LastIdStore } from '@pages/lastIdStore';
const filterStore = new FilterStore();
const filter = filterStore.filter;

const ServiceCategoryList = observer((): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [serviceCategoryList, setServiceCategoryList] = useState<
        Array<TServiceCategory & { services: Array<TService>; categories: Array<TServiceCategory> }>
    >([]);
    const [selecting, setSelecting] = useState<boolean>(false);
    const [selectList, setSelectList] = useState<Array<{ id: number; name: string }>>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [currentMeta, setCurrentMeta] = useState<TMetadata>(null);
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
    async function getServiceCategoryList(page: number = currentPage, addition: boolean = false) {
        setIsLoading(true);
        try {
            const creds = SettingsManager.getConnectionCredentials();
            const servCatList = await CRMAPIManager.request<ServiceCategoryListResp>(
                async (api) => {
                    const params: ServiceParams = {
                        crm_id: creds.crmID,
                        category_id: LastIdStore.lastServiceCategoryId ?? '',
                        sort_by: filter.sortBy,
                        sort_direction: filter.sortDirection,
                        filters: {
                            created_at: [...filter.createdDates],
                            updated_at: [...filter.updatedDates],
                            price: [...filter.price],
                            deleted: filter.deleted,
                        },
                        query: filter.query,
                        page,
                        per_page: pStore.pS,
                    };
                    Object.keys(params.filters).filter(
                        (key) => params.filters[key] === null && delete params.filters[key]
                    );
                    return await api.getServiceCategoryList(params);
                }
            );
            if (servCatList.errorMessages) throw servCatList.errorMessages;
            if (addition) {
                setServiceCategoryList((scl) => [...scl, ...servCatList.data.data]);
            } else {
                setServiceCategoryList(servCatList.data.data);
            }
            setCurrentMeta(servCatList.data.meta);
            const total = await CRMAPIManager.request<CRMTotalResp>(async (api) => {
                return await api.getCRMTotal(creds.crmID);
            });
            if (total.errorMessages) throw total.errorMessages;
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
    }

    async function handleShowMore() {
        await getServiceCategoryList(currentPage + 1, true);
        setCurrentPage((pageNumber) => pageNumber + 1);
    }

    async function handleChangePage(newPage: number) {
        await getServiceCategoryList(newPage);
        setCurrentPage(newPage);
    }

    async function deleteSelected() {
        setIsLoading(true);
        const creds = SettingsManager.getConnectionCredentials();
        while (selectList.length != 0) {
            const target = selectList.pop();
            try {
                const del = await CRMAPIManager.request<ServiceCategoryResp>(async (api) => {
                    return await api.removeServiceCategory(target.id, creds.crmID);
                });
                if (del.errorMessages) throw del.errorMessages;
            } catch (errors) {
                messageService.sendErrorList(errors);
            }
            setSelectList((oldList) => oldList.filter((sli) => sli.id != target.id));
        }
        await getServiceCategoryList(1);
        setCurrentPage(1);
        setIsLoading(false);
    }
    async function restoreSelected() {
        setIsLoading(true);
        const creds = SettingsManager.getConnectionCredentials();
        while (selectList.length != 0) {
            const target = selectList.pop();
            try {
                const del = await CRMAPIManager.request<ServiceCategoryResp>(async (api) => {
                    return await api.restoreServiceCategory(target.id, creds.crmID);
                });
                if (del.errorMessages) throw del.errorMessages;
            } catch (errors) {
                messageService.sendErrorList(errors);
            }
            setSelectList((oldList) => oldList.filter((sli) => sli.id != target.id));
        }
        await getServiceCategoryList(1);
        setCurrentPage(1);
        setIsLoading(false);
    }
    function handleCreateServiceCategory() {
        LastIdStore.setLastServiceCategoryId(-1);
        navigate(`/lk/worker/crm/${creds.crmID}/service-categories/create`);
    }
    
    function beforeMountServiceCategoryList() {
        Common.checkUserBelongToCrm(GlobalConstants.CrmOrderinUrl).then((res) => {
            if (!res) navigate(`/lk/worker/crm/${creds.crmID}`);
        });
        getServiceCategoryList();
    }

    useEffect(() => {
        beforeMountServiceCategoryList();
    }, [filter.deleted]);

    useEffect(() => {
        if (currentMeta?.total == null || currentMeta?.total == 0) return;
        let newPage = Math.ceil(currentMeta.from / pStore.pS);
        getServiceCategoryList(newPage).then(() => {
            setCurrentPage(newPage);
        });
    }, [pStore.pS]);

    return (
        <div id="app-service-category-list">
            {isLoading && <Loader />}
            <div className="functional-container">
                {!(tabNumber.current == '3') ? (
                    <Dropdown.Button
                        className="functional-menu"
                        icon={
                            selecting ? (
                                <p>{selectList.length}</p>
                            ) : (
                                <FontAwesomeIcon icon={faBars} />
                            )
                        }
                        overlay={
                            <Menu
                                items={
                                    selecting
                                        ? [
                                              {
                                                  key: 'move',
                                                  label: 'Переместить',
                                                  icon: <FontAwesomeIcon icon={faFolderTree} />,
                                                  disabled: true,
                                              },
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
                                                  key: 'createCategory',
                                                  label: 'Создать категорию',
                                                  icon: <FontAwesomeIcon icon={faPlus} />,
                                                  onClick: handleCreateServiceCategory,
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
                ) : (
                    <Dropdown.Button
                        className="functional-menu"
                        icon={
                            selecting ? (
                                <p>{selectList.length}</p>
                            ) : (
                                <FontAwesomeIcon icon={faBars} />
                            )
                        }
                        overlay={
                            <Menu
                                items={
                                    selecting
                                        ? [
                                              {
                                                  key: 'move',
                                                  label: 'Переместить',
                                                  icon: <FontAwesomeIcon icon={faFolderTree} />,
                                                  disabled: true,
                                              },
                                              {
                                                  key: 'restore',
                                                  danger: true,
                                                  label: 'Восстановитьт',
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
                                                  key: 'createCategory',
                                                  label: 'Создать категорию',
                                                  icon: <FontAwesomeIcon icon={faPlus} />,
                                                  onClick: handleCreateServiceCategory,
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
                )}
            </div>

            <HeaderListBreadcrumbs
                dataTotal={currentMeta?.total}
                title={'Категории услуг'}
                dataTitle={'Категории услуг'}
                dataIcon={faWandMagicSparkles}
                dataPrice={null}
                flag={false}
                isProduct={false}
                categoryPath={null}
                openCategoryCard={null}
                searchPlaceHolder='По категориям'
            >
                <>
                    <PageSizeChanger />
                    <ListViewChanger />
                </>
            </HeaderListBreadcrumbs>
            <Tabs
                items={[
                    {
                        label: 'Категории услуг',
                        key: '1',
                        children: (
                            <RenderCategoryList
                                dataService={serviceCategoryList}
                                dataProducts={null}
                                selectList={selectList}
                                selecting={selecting}
                                route={`/lk/worker/crm/${creds?.crmID}/services`}
                                routeCard={`/lk/worler/crm/${creds?.crmID}/service-categories`}
                                setLastCategoryId={LastIdStore.setLastServiceCategoryId}
                                setSelectList={setSelectList}
                            />
                        ),
                    },
                    {
                        label: 'Корзина',
                        key: '3',
                        children: (
                            <RenderCategoryList
                                dataService={serviceCategoryList}
                                dataProducts={null}
                                selectList={selectList}
                                selecting={selecting}
                                route={`/lk/worker/crm/${creds?.crmID}/services`}
                                routeCard={`/lk/worler/crm/${creds?.crmID}/service-categories`}
                                setLastCategoryId={LastIdStore.setLastServiceCategoryId}
                                setSelectList={setSelectList}
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

export { ServiceCategoryList };
