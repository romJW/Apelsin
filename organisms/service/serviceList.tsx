import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { ServiceCategoryListResp } from '../../../api/responseModels/service/serviceCategoryListResponse';
import { ServiceCategoryResp } from '../../../api/responseModels/service/serviceCategoryResponse';
import { ServiceListResp } from '../../../api/responseModels/service/serviceListResponse';
import { ServiceResp } from '../../../api/responseModels/service/serviceResponse';
import { CRMAPIManager } from '../../../classes/crmApiManager';
import { messageService } from '../../../classes/messageService';
import { SettingsManager } from '../../../classes/settingsManager';
import { GlobalConstants } from '../../../constants/global';
import { TService } from '../../../types/service';
import { TServiceCategory } from '../../../types/serviceCategory';
import { FilterStore } from '@organisms/productServicesFilter/filterStore';
import { observer } from 'mobx-react';
import { CategoryParams, ServiceParams } from 'types/getParams';
import { store as pStore } from '@molecules/paginationControls/pageSizeStore';
import { TMetadata } from 'types/metadata';
import { debounce } from '../../../utils/functions';
import { useNavigate } from 'react-router';
import { Common } from '@classes/commonMethods';
import { rootStore } from '@store/rootStore/instanse';
import { ServiceCatalogInfoResp } from '@api/responseModels/service/serviceCatalogInfoResp';
import { LastIdStore } from '@pages/lastIdStore';
import { ServiceCategoryPicker } from '@organisms/pickers/serviceCategoryPicker';
import { Loader } from '@atoms/loader';
import { CategoryPickerUsage } from '@enums/categoryPickerUsage';
import { faBars, faCartArrowDown, faFolderTree, faTrashCan, faXmark, faPlus, faSquareCheck, faScrewdriverWrench } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { OptionsMenu } from '@molecules/OptionsMenu';
import { HeaderListBreadcrumbs } from '@molecules/breadcrumbs/listsBreadcrumbs/HeaderListBreadcrumbs';
import { ShowMoreButton } from '@molecules/paginationControls/showMoreButton';
import { ServiceProductList } from '@molecules/renderList/serviceProductList';
import { ProductServicesFilter } from '@organisms/productServicesFilter/productServicesFilter';
import { Dropdown, Pagination, Space, Tabs } from 'antd';

const filterStore = new FilterStore();
const filter = filterStore.filter;

const ServiceList = observer((): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [serviceList, setServiceList] = useState<
        Array<TService & { category: TServiceCategory }>
    >([]);
    const [serviceCategoryList, setServiceCategoryList] = useState<
        Array<
            TServiceCategory & {
                services: Array<TService>;
                categories: Array<TServiceCategory>;
            }
        >
    >([]);
    const [currentTotal, setCurrentTotal] = useState<{ price: number, quantity: number }>();
    const [selecting, setSelecting] = useState<boolean>(false);
    const [categoryPath, setCategoryPath] = useState<Array<{ id: number; name: string }>>([]);
    const [serviceCategoryOpen, setServiceCategoryOpen] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [currentCategoryPage, setCurrentCategoryPage] = useState<number>(1);
    const [currentMeta, setCurrentMeta] = useState<TMetadata>();
    const [currentCategoryMeta, setCurrentCategoryMeta] = useState<TMetadata>();
    const [selectElemList, setSelectElemList] = useState<
        Array<{ id: number; name: string; parentId: number | null }>
    >([]);
    const [selectCatList, setSelectCatList] = useState<
        Array<{ id: number; name: string; parentId: number | null }>
    >([]);
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
    
    async function moveSelected(to: TServiceCategory) {
        setIsLoading(true);
        const creds = SettingsManager.getConnectionCredentials();
        try {
            if (selectElemList.length > 0) {
                const mv = await CRMAPIManager.request<any>(async (api) => {
                    return await api.updateServiceCategories(
                        creds.crmID,
                        selectElemList.map((li) => {
                            return { id: li.id, service_category_id: to.id };
                        })
                    );
                });
                if (mv.errorMessages) throw mv.errorMessages;
                setSelectElemList((_) => []);
            }
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        try {
            if (selectCatList.length > 0) {
                const mv = await CRMAPIManager.request<any>(async (api) => {
                    return await api.updateServiceParentCategories(
                        creds.crmID,
                        selectCatList.map((li) => {
                            return { id: li.id, parent_service_category_id: to.id };
                        })
                    );
                });
                if (mv.errorMessages) throw mv.errorMessages;
                setSelectCatList((_) => []);
            }
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
        await getServiceList(1);
        await getServiceCategoryList(1);
        setCurrentPage(1);
        setCurrentCategoryPage(1);
    }

    function openCard(id: number) {
        LastIdStore.setLastServiceId(id);
        navigate(`/lk/worker/crm/${creds.crmID}/services/${id}`)
    }

    async function getServiceList(page: number = currentPage, addition: boolean = false) {
        setIsLoading(true);
        try {
            const creds = SettingsManager.getConnectionCredentials();
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
            Object.keys(params.filters).filter(key => params.filters[key] === null && delete params.filters[key])
            const servList = await CRMAPIManager.request<ServiceListResp>(async (api) => {
                return await api.getServiceList(params);
            });
            if (servList.errorMessages) {
                setServiceList([]);
                throw servList.errorMessages;
            }
            if (addition){
                setServiceList(sl => [...sl, ...servList.data.data]);
            }
            else {
                setServiceList(servList.data.data);
            }
            setCurrentMeta(servList.data.meta);
            const total = await CRMAPIManager.request<ServiceCatalogInfoResp>(async (api) => {
                return await api.getServiceCatalogInfo(creds.crmID, LastIdStore.lastServiceCategoryId);
            });
            if (total.errorMessages) throw total.errorMessages;
            setCurrentTotal(total.data.data);
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
    }

    async function getServiceCategoryList(page: number = currentPage, addition: boolean = false) {
        setIsLoading(true);
        try {
            const creds = SettingsManager.getConnectionCredentials();
            const servCatList = await CRMAPIManager.request<ServiceCategoryListResp>(
                async (api) => {
                    const params: CategoryParams = {
                        crm_id: creds.crmID,
                        category_id: LastIdStore.lastServiceCategoryId ?? '',
                        sort_by: filter.sortBy,
                        sort_direction: filter.sortDirection,
                        filters: {
                            created_at: [...filter.createdDates],
                            deleted: filter.deleted,
                        },
                        query: filter.query,
                        page,
                        per_page: pStore.pS,
                    };
                    Object.keys(params.filters).filter(key => params.filters[key] === null && delete params.filters[key])
                    return await api.getServiceCategoryList(params);

                }
            );
            if (servCatList.errorMessages) throw servCatList.errorMessages;
            if (addition){
                setServiceCategoryList(scl => [...scl, ...servCatList.data.data]);
            }
            else {
                setServiceCategoryList(servCatList.data.data);
            }
            setCurrentCategoryMeta(servCatList.data.meta);
            if (categoryPath.length == 0 && LastIdStore.lastServiceCategoryId != null) {
                let tServCat = null;
                let tCurFolderId = LastIdStore.lastServiceCategoryId;
                let tPath = [];
                while (tCurFolderId != null) {
                    tServCat = await CRMAPIManager.request<ServiceCategoryResp>(async (api) => {
                        return await api.getServiceCategory(tCurFolderId, creds.crmID);
                    });
                    tPath = [{ id: tCurFolderId, name: tServCat.data.data.name }, ...tPath];
                    tCurFolderId = tServCat.data.data.parent_service_category_id;
                }
                setCategoryPath(tPath);
            }
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
    }

    async function openCategoryCard(id: number | null, back = false) {
        if (id != null) navigate(`/lk/worker/crm/${creds.crmID}/services/nav/${id}`);
        else navigate(`/lk/worker/crm/${creds.crmID}/services`);
        LastIdStore.setLastServiceCategoryId(id);
        const tPath = [...categoryPath];
        if (back) {
            for (let i = tPath.length - 1; i >= 0; i--) {
                if (tPath[i].id !== id) {
                    tPath.pop();
                } else {
                    break;
                }
            }
        } else {
            const category = serviceCategoryList.find((sc) => sc.id == id);
            tPath.push({ id: id, name: category?.name });
        }
        setCategoryPath(tPath);

        await getServiceList(1);
        await getServiceCategoryList(1);
        setCurrentPage(1);
        setCurrentCategoryPage(1);
    }

    async function deleteSelected() {
        setIsLoading(true);
        const creds = SettingsManager.getConnectionCredentials();
        while (selectElemList.length != 0) {
            const target = selectElemList.pop();
            try {
                rootStore.orderStore.deleteItem(target.id, 'services');
                const del = await CRMAPIManager.request<ServiceResp>(async (api) => {
                    return await api.removeService(target.id, creds.crmID);
                });
                if (del.errorMessages) throw del.errorMessages;
            } catch (errors) {
                messageService.sendErrorList(errors);
            }
            setSelectElemList((oldList) => oldList.filter((sli) => sli.id != target.id));
        }
        while (selectCatList.length != 0) {
            const target = selectCatList.pop();
            try {
                const del = await CRMAPIManager.request<ServiceCategoryResp>(async (api) => {
                    return await api.removeServiceCategory(target.id, creds.crmID);
                });
                if (del.errorMessages) throw del.errorMessages;
            } catch (errors) {
                messageService.sendErrorList(errors);
            }
            setSelectCatList((oldList) => oldList.filter((sli) => sli.id != target.id));
        }
        await getServiceList(1);
        await getServiceCategoryList(1);
        setCurrentPage(1);
        setCurrentCategoryPage(1);
    }

    async function restoreSelected() {
        setIsLoading(true);
        const creds = SettingsManager.getConnectionCredentials();
        while (selectElemList.length != 0) {
            const target = selectElemList.pop();
            try {
                const del = await CRMAPIManager.request<ServiceResp>(async (api) => {
                    return await api.restoreService(target.id, creds.crmID);
                });
                if (del.errorMessages) throw del.errorMessages;
            } catch (errors) {
                messageService.sendErrorList(errors);
            }
            setSelectElemList((oldList) => oldList.filter((sli) => sli.id != target.id));
        }
        while (selectCatList.length != 0) {
            const target = selectCatList.pop();
            try {
                const del = await CRMAPIManager.request<ServiceCategoryResp>(async (api) => {
                    return await api.restoreServiceCategory(target.id, creds.crmID);
                });
                if (del.errorMessages) throw del.errorMessages;
            } catch (errors) {
                messageService.sendErrorList(errors);
            }
            setSelectCatList((oldList) => oldList.filter((sli) => sli.id != target.id));
        }
        await getServiceList(1);
        await getServiceCategoryList(1);
        setCurrentPage(1);
        setCurrentCategoryPage(1);
    }

    async function handleShowMoreServices() {
        await getServiceList(currentPage + 1, true);
        setCurrentPage(pageNumber => pageNumber + 1);
    }

    async function handleChangePage(newPage: number) {
        await getServiceList(newPage);
        setCurrentPage(newPage);
    }

    async function handleShowMoreCategories() {
        await getServiceCategoryList(currentCategoryPage + 1, true);
        setCurrentCategoryPage(pageNumber => pageNumber + 1);
    }

    function handleCreateService() {
        navigate(`/lk/worker/crm/${creds.crmID}/services/create`);
    }

    function handleCreateServiceCategory() {
        navigate(`/lk/worker/crm/${creds.crmID}/service-categories/create`);
    }

    function beforeMountServiceList() {
        Common.checkUserBelongToCrm(GlobalConstants.CrmOrderinUrl).then((res) => {
            if(!res) navigate(`/lk/worker/crm/${creds.crmID}`);
        });
        if (location.pathname.includes("nav")) {
            const path = location.pathname.split('/');
            LastIdStore.setLastServiceCategoryId(Number(path[path.length - 1]));
        }
        else {
            LastIdStore.setLastServiceCategoryId(null);
        }
        getServiceList().then(() => {
            getServiceCategoryList();
        });
    }

    const handleSearchChange = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
        filterStore.changeQuery(e.target.value)
    }, 500)

    useEffect(() => {
        beforeMountServiceList();
    }, [
        filter.sortBy,
        filter.sortDirection,
        filter.createdDates,
        filter.updatedDates,
        filter.deleted,
        filter.price,
        filter.deleted,
        filter.query
    ]);

    useEffect(() => {
        if(currentMeta?.total) {
            let newPage = Math.ceil(currentMeta.from / pStore.pS);
            getServiceList(newPage).then(() => {
                setCurrentPage(newPage);
            });
        }
        if(currentCategoryMeta?.total) {
            let newPage = Math.ceil(currentCategoryMeta.from / pStore.pS);
            getServiceCategoryList(newPage).then(() => {
                setCurrentCategoryPage(newPage);
            });
        }
    }, [pStore.pS]);

    useEffect(() => {
        const list = [];
        serviceList.forEach((service) => {
            if (rootStore.orderStore.services[service.id]) {
                list.push({id: service.id, name: service.name, parentId: service.category?.id})
            }
        })
        setSelectElemList(prev => [...prev, ...list]);
    }, [serviceList])

    return (
        <div id="app-service-list">
            {isLoading && <Loader />}
            {serviceCategoryOpen && (
                <ServiceCategoryPicker
                    isModalOpen={serviceCategoryOpen}
                    setIsModalOpen={setServiceCategoryOpen}
                    setCurrentCategorySelected={(sel: TServiceCategory) => {
                        moveSelected(sel);
                    }}
                    selectedCatList={selectCatList}
                    selectedElemList={selectElemList}
                    useCase={CategoryPickerUsage.transfer}
                />
            )}
            <div className="functional-container">
            {!(tabNumber.current == '3') ? ( <Dropdown.Button
                    className="functional-menu"
                    icon={
                        selecting ? (
                            <p>{rootStore.orderStore.allEntitiesCount}</p>
                        ) : (
                            <FontAwesomeIcon className='btn-icon' icon={faBars} />
                        )
                    }
                    menu={{items:
                        selecting ? [
                            {
                                key: 'order',
                                label: 'Добавить в заказ',
                                icon: <FontAwesomeIcon className='btn-icon' icon={faCartArrowDown} />,
                                disabled: true
                            },
                            {
                                key: 'move',
                                label: 'Переместить',
                                icon: <FontAwesomeIcon icon={faFolderTree} />,
                                disabled:
                                    selectCatList.length === 0 &&
                                    rootStore.orderStore.orderList.services.length === 0 ||
                                    rootStore.orderStore.orderList.products.length > 0,
                                onClick: () => {
                                    setServiceCategoryOpen(true);
                                },
                            },
                            {
                                key: 'delete',
                                danger: true,
                                label: 'Удалить',
                                icon: <FontAwesomeIcon icon={faTrashCan} />,
                                disabled:
                                    selectCatList.length === 0 &&
                                    rootStore.orderStore.orderList.services.length === 0 ||
                                    rootStore.orderStore.orderList.products.length > 0,
                                onClick: deleteSelected,
                            },
                            {
                                key: 'abort',
                                label: 'Отмена',
                                icon: <FontAwesomeIcon icon={faXmark} />,
                                onClick: () => {
                                    setSelecting(false);
                                    setSelectElemList([]);
                                    setSelectCatList([]);
                                    rootStore.orderStore.reset();
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
                                key: 'createElement',
                                label: 'Создать услугу',
                                icon: <FontAwesomeIcon icon={faPlus} />,
                                onClick: handleCreateService,
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
                    }}
                    placement="topRight"
                    type={selecting ? 'primary' : 'default'}
                />):
                (<Dropdown.Button
                    className="functional-menu"
                    icon={
                        selecting ? (
                            <p>{rootStore.orderStore.allEntitiesCount}</p>
                        ) : (
                            <FontAwesomeIcon className='btn-icon' icon={faBars} />
                        )
                    }
                    menu={{items:
                        selecting ? [
                            {
                                key: 'order',
                                label: 'Добавить в заказ',
                                icon: <FontAwesomeIcon icon={faCartArrowDown} />,
                                disabled: true
                            },
                            {
                                key: 'move',
                                label: 'Переместить',
                                icon: <FontAwesomeIcon icon={faFolderTree} />,
                                disabled:
                                    selectCatList.length === 0 &&
                                    rootStore.orderStore.orderList.services.length === 0 ||
                                    rootStore.orderStore.orderList.products.length > 0,
                                onClick: () => {
                                    setServiceCategoryOpen(true);
                                },
                            },
                            {
                                key: 'restore',
                                danger: true,
                                label: 'Восстановить',
                                icon: <FontAwesomeIcon icon={faTrashCan} />,
                                disabled:
                                    selectCatList.length === 0 &&
                                    rootStore.orderStore.orderList.services.length === 0 ||
                                    rootStore.orderStore.orderList.products.length > 0,
                                onClick: restoreSelected,
                            },
                            {
                                key: 'abort',
                                label: 'Отмена',
                                icon: <FontAwesomeIcon icon={faXmark} />,
                                onClick: () => {
                                    setSelecting(false);
                                    setSelectElemList([]);
                                    setSelectCatList([]);
                                    rootStore.orderStore.reset();
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
                                key: 'createElement',
                                label: 'Создать услугу',
                                icon: <FontAwesomeIcon icon={faPlus} />,
                                onClick: handleCreateService,
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
                    }}
                    placement="topRight"
                    type={selecting ? 'primary' : 'default'}
                />)
    }
            </div>
            <HeaderListBreadcrumbs
                dataTotal={currentTotal?.quantity}
                title={'Услуги'}
                dataTitle={'Услуги'}
                dataIcon={faScrewdriverWrench}
                dataPrice={currentTotal?.price}
                flag={true}
                isProduct={false}
                categoryPath={categoryPath}
                openCategoryCard={openCategoryCard}
                onSearch={handleSearchChange}
                searchPlaceHolder='По услугам'
            >
                <Space>
                    <ProductServicesFilter store={filterStore} />
                    <OptionsMenu />
                </Space>
            </HeaderListBreadcrumbs>
            <Tabs
                items={[
                    {
                        label: 'Услуги',
                        key: '1',
                        children: (
                            <ServiceProductList
                                productCategoryList={null}
                                serviceCategoryList={serviceCategoryList}
                                productList={null}
                                serviceList={serviceList}
                                selecting={selecting}
                                selectCatList={selectCatList}
                                selectElemList={selectElemList}
                                setSelectCatList={setSelectCatList}
                                setSelectElemList={setSelectElemList}
                                openCategoryCard={openCategoryCard}
                                openCard={openCard}
                                currentCategoryMeta={currentCategoryMeta}
                                currentCategoryPage={currentCategoryPage}
                                handleShowMoreCategories={handleShowMoreCategories}
                            />
                        ),
                    },
                    {
                        label: 'Корзина',
                        key: '3',
                        children: (
                            <ServiceProductList
                                productCategoryList={null}
                                serviceCategoryList={serviceCategoryList}
                                productList={null}
                                serviceList={serviceList}
                                selecting={selecting}
                                selectCatList={selectCatList}
                                selectElemList={selectElemList}
                                setSelectCatList={setSelectCatList}
                                setSelectElemList={setSelectElemList}
                                openCategoryCard={openCategoryCard}
                                openCard={openCard}
                                currentCategoryMeta={currentCategoryMeta}
                                currentCategoryPage={currentCategoryPage}
                                handleShowMoreCategories={handleShowMoreCategories}
                            />
                        ),
                    },
                ]}
                onChange={(key) => {
                    onChangeTab(key);
                }}
            />
            { currentMeta && currentPage < currentMeta.last_page && <ShowMoreButton onClick={handleShowMoreServices} text='Показать ещё' /> }
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

export { ServiceList };
