import { HeaderListBreadcrumbs } from '@molecules/breadcrumbs/listsBreadcrumbs/HeaderListBreadcrumbs';
import {
    faBars,
    faFolderTree,
    faListCheck,
    faPlus,
    faSquareCheck,
    faTrashCan,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ListViewChanger } from '@molecules/listViewChanger/listViewChanger';
import { RenderCategoryList } from '@molecules/renderList/categoryList';
import {
    Dropdown,
    Pagination,
    Tabs,
} from 'antd';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TMetadata } from 'types/metadata';
import { ProductCategoryListResp } from '../../../api/responseModels/product/productCategoryListResponse';
import { ProductCategoryResp } from '../../../api/responseModels/product/productCategoryResponse';
import { CRMAPIManager } from '../../../classes/crmApiManager';
import { messageService } from '../../../classes/messageService';
import { SettingsManager } from '../../../classes/settingsManager';
import { GlobalConstants } from '../../../constants/global';
import { TProduct } from '../../../types/product';
import { TProductCategory } from '../../../types/productCategory';
import { Loader } from '../../atoms/loader';
import { store as pStore } from '@molecules/paginationControls/pageSizeStore';
import { PageSizeChanger } from '@molecules/paginationControls/pageSizeChanger';
import { ShowMoreButton } from '@molecules/paginationControls/showMoreButton';
import { Common } from '@classes/commonMethods';
import { FilterStore } from '@organisms/productServicesFilter/filterStore';
import { ProductParams, } from 'types/getParams';
import { observer } from 'mobx-react';
import { LastIdStore } from '@pages/lastIdStore';


const filterStore = new FilterStore();
const filter = filterStore.filter;

const ProductCategoryList = observer((): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [productCategoryList, setProductCategoryList] = useState<
        Array<TProductCategory & { products: Array<TProduct>; categories: Array<TProductCategory> }>
    >([]);
    const [selecting, setSelecting] = useState<boolean>(false);
    const [selectList, setSelectList] = useState<Array<{ id: number; name: string }>>([]);
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [currentMeta, setCurrentMeta] = useState<TMetadata>(null);
    const creds = SettingsManager.getConnectionCredentials();
    const tabNumber = useRef<string>('');
    
    async function handleShowMore() {
        await getProductCategoryList(currentPage + 1, true);
        setCurrentPage((pageNumber) => pageNumber + 1);
    }

    function onChangeTab(key: string) {
        if (key == '3') filterStore.changeDeleted('only');
        else {
            filterStore.changeDeleted('null');
        }
        tabNumber.current = key;
    }

    async function handleChangePage(newPage: number) {
        await getProductCategoryList(newPage);
        setCurrentPage(newPage);
    }

    async function getProductCategoryList(page: number = currentPage, addition: boolean = false) {
        setIsLoading(true);
        try {
            const creds = SettingsManager.getConnectionCredentials();
            const prodCatList = await CRMAPIManager.request<ProductCategoryListResp>(
                async (api) => {
                    const params: ProductParams = {
                        crm_id: creds.crmID,
                        category_id: null,
                        sort_by: filter.sortBy,
                        sort_direction: filter.sortDirection,
                        filters: {
                            created_at: [...filter.createdDates],
                            deleted: filter.deleted,
                            price: filter.price,
                        },
                        page,
                        per_page: pStore.pS,
                    };
                    Object.keys(params.filters).filter(
                        (key) => params.filters[key] === null && delete params.filters[key]
                    );
                    return await api.getProductCategoryList(params);
                }
            );
            if (prodCatList.errorMessages) throw prodCatList.errorMessages;
            if (addition) {
                setProductCategoryList((pcl) => [...pcl, ...prodCatList.data.data]);
            } else {
                setProductCategoryList(prodCatList.data.data);
            }
            setCurrentMeta(prodCatList.data.meta);
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
    }

    async function deleteSelected() {
        setIsLoading(true);
        const creds = SettingsManager.getConnectionCredentials();
        while (selectList.length != 0) {
            const target = selectList.pop();
            try {
                const del = await CRMAPIManager.request<ProductCategoryResp>(async (api) => {
                    return await api.removeProductCategory(target.id, creds.crmID);
                });
                if (del.errorMessages) throw del.errorMessages;
            } catch (errors) {
                messageService.sendErrorList(errors);
            }
            setSelectList((oldList) => oldList.filter((sli) => sli != target));
        }
        await getProductCategoryList(1);
        setCurrentPage(1);
        setIsLoading(false);
    }

    async function restoreSelected() {
        setIsLoading(true);
        const creds = SettingsManager.getConnectionCredentials();
        while (selectList.length != 0) {
            const target = selectList.pop();
            try {
                const del = await CRMAPIManager.request<ProductCategoryResp>(async (api) => {
                    return await api.restoreProductCategory(target.id, creds.crmID);
                });
                if (del.errorMessages) throw del.errorMessages;
            } catch (errors) {
                messageService.sendErrorList(errors);
            }
            setSelectList((oldList) => oldList.filter((sli) => sli != target));
        }
        await getProductCategoryList(1);
        setCurrentPage(1);
        setIsLoading(false);
    }

    function handleCreateProductCategory() {
        LastIdStore.setLastProductCategoryId(-1);
        navigate(`/lk/worker/crm/${creds.crmID}/product-category/create`);
    }

    function beforeMountCategoryList() {
        Common.checkUserBelongToCrm(GlobalConstants.CrmOrderinUrl).then((res) => {
            if (!res) navigate(`/lk/worker/crm/${creds.crmID}`);
        });
        getProductCategoryList();
    }

    useEffect(() => {
        beforeMountCategoryList();
    }, [
        filter.sortBy,
        filter.sortDirection,
        filter.createdDates,
        filter.updatedDates,
        filter.deleted,
        filter.price,
        filter.query,
    ]);

    useEffect(() => {
        if (currentMeta?.total == null || currentMeta?.total == 0) return;
        let newPage = Math.ceil(currentMeta.from / pStore.pS);
        getProductCategoryList(newPage).then(() => {
            setCurrentPage(newPage);
        });
    }, [pStore.pS]);

    return (
        <div id="app-product-category-list">
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
                                      onClick: handleCreateProductCategory,
                                  },
                                  {
                                      key: 'selection',
                                      label: 'Выбор элементов',
                                      icon: <FontAwesomeIcon icon={faSquareCheck} />,
                                      onClick: () => {
                                          setSelecting(true);
                                      },
                                  },
                              ],
                    }}
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
                                      key: 'move',
                                      label: 'Переместить',
                                      icon: <FontAwesomeIcon icon={faFolderTree} />,
                                      disabled: true,
                                  },
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
                                      key: 'createCategory',
                                      label: 'Создать категорию',
                                      icon: <FontAwesomeIcon icon={faPlus} />,
                                      onClick: handleCreateProductCategory,
                                  },
                                  {
                                      key: 'selection',
                                      label: 'Выбор элементов',
                                      icon: <FontAwesomeIcon icon={faSquareCheck} />,
                                      onClick: () => {
                                          setSelecting(true);
                                      },
                                  },
                              ],
                    }}
                    placement="topRight"
                    type={selecting ? 'primary' : 'default'}
                />
                )}

            </div>

            <HeaderListBreadcrumbs
                dataTotal={currentMeta?.total}
                title={'Категории товаров'}
                dataTitle={'Категории товаров'}
                dataIcon={faListCheck}
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
                        label: 'Категории товаров',
                        key: '1',
                        children: (
                            <RenderCategoryList
                                dataService={null}
                                dataProducts={productCategoryList}
                                selectList={selectList}
                                selecting={selecting}
                                route={`/lk/worker/crm/${creds?.crmID}`}
                                routeCard={`/lk/worker/crm/${creds?.crmID}/product-category`}
                                setLastCategoryId={LastIdStore.setLastProductCategoryId}
                                setSelectList={setSelectList}
                            />
                        ),
                    },
                    {
                        label: 'Корзина',
                        key: '3',
                        children: (
                            <RenderCategoryList
                                dataService={null}
                                dataProducts={productCategoryList}
                                selectList={selectList}
                                selecting={selecting}
                                route={`/lk/worker/crm/${creds?.crmID}`}
                                routeCard={`/lk/worker/crm/${creds?.crmID}/product-category`}
                                setLastCategoryId={LastIdStore.setLastProductCategoryId}
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

export { ProductCategoryList };
