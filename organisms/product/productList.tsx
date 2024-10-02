import {
    faBarcode,
    faBars,
    faFolderTree,
    faPlus,
    faSquareCheck,
    faTrashCan,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    Dropdown,
    Pagination,
    Space,
    Tabs,
} from 'antd';
import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { ProductCatalogInfoResp } from '@api/responseModels/product/productCatalogInfoResp';
import { ProductCategoryListResp } from '@api/responseModels/product/productCategoryListResponse';
import { ProductCategoryResp } from '@api/responseModels/product/productCategoryResponse';
import { ProductListResp } from '@api/responseModels/product/productListResponse';
import { ProductResp } from '@api/responseModels/product/productResponse';
import { CRMAPIManager } from '@classes/crmApiManager';
import { messageService } from '@classes/messageService';
import { SettingsManager } from '@classes/settingsManager';
import { GlobalConstants } from '@constants/global';
import { TProduct } from 'types/product';
import { TProductCategory } from 'types/productCategory';
import { Loader } from '@atoms/loader';
import { ProductCategoryPicker } from '../pickers/productCategoryPicker';
import { CategoryPickerUsage } from '@enums/categoryPickerUsage';
import { store as pStore } from '@molecules/paginationControls/pageSizeStore';
import { observer } from 'mobx-react';
import { ProductServicesFilter } from '@organisms/productServicesFilter/productServicesFilter';
import { FilterStore } from '@organisms/productServicesFilter/filterStore';
import { ProductParams, CategoryParams } from 'types/getParams';
import { HeaderListBreadcrumbs } from '@molecules/breadcrumbs/listsBreadcrumbs/HeaderListBreadcrumbs';
import { ServiceProductList } from '@molecules/renderList/serviceProductList';
import { TMetadata } from 'types/metadata';
import { ShowMoreButton } from '@molecules/paginationControls/showMoreButton';
import { debounce } from '../../../utils/functions';
import { useNavigate } from 'react-router';
import { Common } from '@classes/commonMethods';
import { rootStore } from '@store/rootStore/instanse';
import { OptionsMenu } from '@molecules/OptionsMenu';
import { LastIdStore } from '@pages/lastIdStore';

const filterStore = new FilterStore();
const filter = filterStore.filter;

const ProductList = observer((): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [productList, setProductList] = useState<
        Array<TProduct & { category: TProductCategory }>
    >([]);
    const [productCategoryList, setProductCategoryList] = useState<
        Array<
            TProductCategory & {
                products: Array<TProduct>;
                categories: Array<TProductCategory>;
            }
        >
    >([]);
    const [currentTotal, setCurrentTotal] = useState<{ price: number; quantity: number }>();
    const [selecting, setSelecting] = useState<boolean>(false);
    const [categoryPath, setCategoryPath] = useState<Array<{ id: number; name: string }>>([]);
    const [productCategoryOpen, setProductCategoryOpen] = useState<boolean>(false);
    const [selectElemList, setSelectElemList] = useState<
        Array<{ id: number; name: string; parentId: number | null }>
    >([]);
    const [selectCatList, setSelectCatList] = useState<
        Array<{ id: number; name: string; parentId: number | null }>
    >([]);
    const creds = SettingsManager.getConnectionCredentials();
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [currentCategoryPage, setCurrentCategoryPage] = useState<number>(1);
    const [currentMeta, setCurrentMeta] = useState<TMetadata>(null);
    const [currentCategoryMeta, setCurrentCategoryMeta] = useState<TMetadata>(null);
    const tabNumber = useRef<string>('');

    function onChangeTab(key: string) {
        if (key == '3') filterStore.changeDeleted('only');
        else {
            filterStore.changeDeleted('null');
        }
        tabNumber.current = key;
    }

    async function getProductList(page: number = currentPage, addition: boolean = false) {
        setIsLoading(true);
        try {
            const creds = SettingsManager.getConnectionCredentials();
            const params: ProductParams = {
                crm_id: creds.crmID,
                category_id: LastIdStore.lastProductCategoryId ?? '',
                sort_by: filter.sortBy,
                sort_direction: filter.sortDirection,
                query: filter.query,
                filters: {
                    created_at: [...filter.createdDates],
                    updated_at: [...filter.updatedDates],
                    price: [...filter.price],
                    deleted: filter.deleted,
                },
                page,
                per_page: pStore.pS,
            };
            Object.keys(params.filters).filter(
                (key) => params.filters[key] === null && delete params.filters[key]
            );
            const prodList = await CRMAPIManager.request<ProductListResp>(async (api) => {
                return await api.getProductList(params);
            });
            if (prodList.errorMessages) {
                setProductList([]);
                throw prodList.errorMessages;
            }
            if (addition) {
                setProductList((pl) => [...pl, ...prodList.data.data]);
            } else {
                setProductList(prodList.data.data);
            }
            setCurrentMeta(prodList.data.meta);
            const total = await CRMAPIManager.request<ProductCatalogInfoResp>(async (api) => {
                return await api.getProductCatalogInfo(creds.crmID, LastIdStore.lastProductCategoryId);
            });
            if (total.errorMessages) throw total.errorMessages;
            setCurrentTotal(total.data.data);
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
    }

    async function getProductCategoryList(
        page: number = currentPage,
        addition: boolean = false
    ) {
        setIsLoading(true);
        try {
            const creds = SettingsManager.getConnectionCredentials();
            const prodCatList = await CRMAPIManager.request<ProductCategoryListResp>(
                async (api) => {
                    const params: CategoryParams = {
                        crm_id: creds.crmID,
                        category_id: LastIdStore.lastProductCategoryId ?? '',
                        sort_by: filter.sortBy,
                        sort_direction: filter.sortDirection,
                        filters: {
                            created_at: [...filter.createdDates],
                            deleted: filter.deleted,
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
            } 
            else{
                setProductCategoryList(prodCatList.data.data);
            }
            setCurrentCategoryMeta(prodCatList.data.meta);
            if (categoryPath.length == 0 && LastIdStore.lastProductCategoryId != null) {
                let tProdCat = null;
                let tCurFolderId = LastIdStore.lastProductCategoryId;
                let tPath = [];
                while (tCurFolderId != null) {
                    tProdCat = await CRMAPIManager.request<ProductCategoryResp>(async (api) => {
                        return await api.getProductCategory(tCurFolderId, creds.crmID);
                    });
                    tPath = [{ id: tCurFolderId, name: tProdCat.data.data.name }, ...tPath];
                    tCurFolderId = tProdCat.data.data.parent_product_category_id;
                }
                setCategoryPath(tPath);
            }
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
    }
    
    async function handleShowMoreProducts() {
        await getProductList(currentPage + 1, true);
        setCurrentPage(pageNumber => pageNumber + 1);
    }

    async function handleShowMoreCategories() {
        await getProductCategoryList(currentCategoryPage + 1, true);
        setCurrentCategoryPage(pageNumber => pageNumber + 1);
    }

    async function handleChangePage(newPage: number) {
        await getProductList(newPage);
        setCurrentPage(newPage);
    }

    function openCard(id: number) {
        LastIdStore.setLastProductId(id);
        navigate(`/lk/worker/crm/${creds.crmID}/products/${id}`);
    }

    async function openCategoryCard(id: number | null, back = false) {
        if (id != null) navigate(`/lk/worker/crm/${creds.crmID}/products/nav/${id}`);
        else navigate(`/lk/worker/crm/${creds.crmID}/products`);
        LastIdStore.setLastProductCategoryId(id);
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
            const category = productCategoryList.find((pc) => pc.id == id);
            tPath.push({ id: id, name: category?.name });
        }
        setCategoryPath(tPath);

        await getProductList(1);
        await getProductCategoryList(1);
        setCurrentPage(1);
        setCurrentCategoryPage(1);
    }

    async function deleteSelected() {
        setIsLoading(true);
        const creds = SettingsManager.getConnectionCredentials();
        while (selectElemList.length != 0) {
            const target = selectElemList.pop();
            try {
                const del = await CRMAPIManager.request<ProductResp>(async (api) => {
                    rootStore.orderStore.deleteItem(target.id, 'product');
                    return await api.removeProduct(target.id, creds.crmID);
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
                const del = await CRMAPIManager.request<ProductCategoryResp>(async (api) => {
                    return await api.removeProductCategory(target.id, creds.crmID);
                });
                if (del.errorMessages) throw del.errorMessages;
            } catch (errors) {
                messageService.sendErrorList(errors);
            }
            setSelectCatList((oldList) => oldList.filter((sli) => sli.id != target.id));
        }
        await getProductList(1);
        await getProductCategoryList(1);
        setCurrentPage(1);
        setCurrentCategoryPage(1);
    }

    async function restoreSelected() {
        setIsLoading(true);
        const creds = SettingsManager.getConnectionCredentials();
        while (selectElemList.length != 0) {
            const target = selectElemList.pop();
            try {
                const del = await CRMAPIManager.request<ProductResp>(async (api) => {
                    return await api.restoreProduct(target.id, creds.crmID);
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
                const del = await CRMAPIManager.request<ProductCategoryResp>(async (api) => {
                    return await api.restoreProductCategory(target.id, creds.crmID);
                });
                if (del.errorMessages) throw del.errorMessages;
            } catch (errors) {
                messageService.sendErrorList(errors);
            }
            setSelectCatList((oldList) => oldList.filter((sli) => sli.id != target.id));
        }
        await getProductList(1);
        await getProductCategoryList(1);
        setCurrentPage(1);
        setCurrentCategoryPage(1);
    }

    async function moveSelected(to: TProductCategory) {
        setIsLoading(true);
        const creds = SettingsManager.getConnectionCredentials();
        try {
            if (selectElemList.length > 0) {
                const mv = await CRMAPIManager.request<any>(async (api) => {
                    return await api.updateProductCategories(
                        creds.crmID,
                        selectElemList.map((li) => {
                            return { id: li.id, product_category_id: to.id };
                        })
                    );
                });
                if (mv.errorMessages) throw mv.errorMessages;
                setSelectElemList((_) => []);
                // rootStore.orderStore.reset();
            }
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        try {
            if (selectCatList.length > 0) {
                const mv = await CRMAPIManager.request<any>(async (api) => {
                    return await api.updateProductParentCategories(
                        creds.crmID,
                        selectCatList.map((li) => {
                            return {
                                id: li.id,
                                parent_product_category_id: to.id,
                            };
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
        await getProductList(1);
        await getProductCategoryList(1);
        setCurrentPage(1);
        setCurrentCategoryPage(1);
    }

    function handleCreateProduct() {
        navigate(`/lk/worker/crm/${creds.crmID}/products/create`);
    }

    function handleCreateProductCategory() {
        navigate(`/lk/worker/crm/${creds.crmID}/product-category/create`);
    }

    const handleSearchChange = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
        filterStore.changeQuery(e.target.value);
    }, 500);

    function beforeMountProductList() {
        Common.checkUserBelongToCrm(GlobalConstants.CrmOrderinUrl).then((res) => {
            if (!res) navigate(`/lk/worker/crm/${creds.crmID}`);
        });
        if (location.pathname.includes("nav")) {
            const path = location.pathname.split('/');
            LastIdStore.setLastProductCategoryId(Number(path[path.length - 1]));
        }
        else {
            LastIdStore.setLastProductCategoryId(null);
        }
        getProductList().then(() => {
            getProductCategoryList();
        });
    }

    useEffect(() => {
        beforeMountProductList();
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
        if (currentMeta?.total) {
            let newPage = Math.ceil(currentMeta.from / pStore.pS);
            getProductList(newPage).then(() => {
                setCurrentPage(newPage);
            });
        }
        if (currentCategoryMeta?.total) {
            let newPage = Math.ceil(currentCategoryMeta.from / pStore.pS);
            getProductCategoryList(newPage).then(() => {
                setCurrentCategoryPage(newPage);
            });
        }
    }, [pStore.pS]);

    useEffect(() => {
        const list = [];
        productList.forEach((product) => {
            if (rootStore.orderStore.products[product.id]) {
                list.push({id: product.id, name: product.name, parentId: product.category?.id});
            }
        })
        setSelectElemList(prev => [...prev, ...list]);
    }, [productList]);

    return (
        <div id="app-product-list">
            {isLoading && <Loader />}
            {productCategoryOpen && (
                <ProductCategoryPicker
                    isModalOpen={productCategoryOpen}
                    setIsModalOpen={setProductCategoryOpen}
                    setCurrentCategorySelected={(sel: TProductCategory) => {
                        moveSelected(sel);
                    }}
                    selectedCatList={selectCatList}
                    selectedElemList={selectElemList}
                    useCase={CategoryPickerUsage.transfer}
                />
            )}
            <div className="functional-container">
                {!(tabNumber.current == '3') ? (
                    <Dropdown.Button
                        className="functional-menu"
                        icon={
                            selecting ? (
                                <p>{selectElemList.length + selectCatList.length}</p>
                            ) : (
                                <FontAwesomeIcon className='btn-icon' icon={faBars} />
                            )
                        }
                        menu={{items: selecting
                            ? [
                                {
                                    key: 'move',
                                    label: 'Переместить',
                                    icon: <FontAwesomeIcon icon={faFolderTree} />,
                                    disabled:
                                        selectCatList.length === 0 &&
                                        selectElemList.length === 0,
                                    onClick: () => {
                                        setProductCategoryOpen(true);
                                    },
                                },
                                {
                                    key: 'delete',
                                    danger: true,
                                    label: 'Удалить',
                                    icon: <FontAwesomeIcon icon={faTrashCan} />,
                                    disabled:
                                        selectCatList.length === 0 &&
                                        selectElemList.length === 0,
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
                                    },
                                },
                            ] : [
                                {
                                    key: 'createCategory',
                                    label: 'Создать категорию',
                                    icon: <FontAwesomeIcon icon={faPlus} />,
                                    onClick: handleCreateProductCategory,
                                },
                                {
                                    key: 'createElement',
                                    label: 'Создать товар',
                                    icon: <FontAwesomeIcon icon={faPlus} />,
                                    onClick: handleCreateProduct,
                                },
                                {
                                    key: 'selection',
                                    label: 'Выбор элементов',
                                    icon: (
                                        <FontAwesomeIcon icon={faSquareCheck} />
                                    ),
                                    onClick: () => {
                                        setSelecting(true);
                                    },
                                },
                            ]
                        }}
                        placement="topRight"
                        type={selecting ? 'primary' : 'default'}
                    />
                ) : (
                    <Dropdown.Button
                        className="functional-menu"
                        icon={
                            selecting ? (
                                <p>{selectElemList.length + selectCatList.length}</p>
                            ) : (
                                <FontAwesomeIcon icon={faBars} />
                            )
                        }
                        menu={{items: selecting
                            ? [
                                {
                                    key: 'move',
                                    label: 'Переместить',
                                    icon: <FontAwesomeIcon icon={faFolderTree} />,
                                    disabled:
                                        selectCatList.length === 0 &&
                                        selectElemList.length === 0,
                                    onClick: () => {
                                        setProductCategoryOpen(true);
                                    },
                                },
                                {
                                    key: 'restore',
                                    danger: true,
                                    label: 'Восстановить',
                                    icon: <FontAwesomeIcon icon={faTrashCan} />,
                                    disabled:
                                        selectCatList.length === 0 &&
                                        selectElemList.length === 0,
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
                                    },
                                },
                            ] : [
                                {
                                    key: 'createCategory',
                                    label: 'Создать категорию',
                                    icon: <FontAwesomeIcon icon={faPlus} />,
                                    onClick: handleCreateProductCategory,
                                },
                                {
                                    key: 'createElement',
                                    label: 'Создать товар',
                                    icon: <FontAwesomeIcon icon={faPlus} />,
                                    onClick: handleCreateProduct,
                                },
                                {
                                    key: 'selection',
                                    label: 'Выбор элементов',
                                    icon: (
                                        <FontAwesomeIcon icon={faSquareCheck} />
                                    ),
                                    onClick: () => {
                                        setSelecting(true);
                                    },
                                },
                            ]
                        }}
                        placement="topRight"
                        type={selecting ? 'primary' : 'default'}
                    />
                )}
            </div>
            <HeaderListBreadcrumbs
                dataTotal={currentTotal?.quantity}
                title={'Товары'}
                dataTitle={'Товары'}
                dataIcon={faBarcode}
                dataPrice={currentTotal?.price}
                flag={true}
                isProduct={true}
                categoryPath={categoryPath}
                openCategoryCard={openCategoryCard}
                onSearch={handleSearchChange}
                searchPlaceHolder='По товарам'
            >
                <Space>
                    <ProductServicesFilter store={filterStore} />
                    <OptionsMenu />
                </Space>
            </HeaderListBreadcrumbs>
                
            <Tabs
                items={[
                    {
                        label: 'Товары',
                        key: '1',
                        children: (
                            <ServiceProductList
                                productCategoryList={productCategoryList}
                                serviceCategoryList={null}
                                productList={productList}
                                serviceList={null}
                                selecting={selecting}
                                selectCatList={selectCatList}
                                selectElemList={selectElemList}
                                currentCategoryPage={currentCategoryPage}
                                currentCategoryMeta={currentCategoryMeta}
                                handleShowMoreCategories={handleShowMoreCategories}
                                setSelectCatList={setSelectCatList}
                                setSelectElemList={setSelectElemList}
                                openCategoryCard={openCategoryCard}
                                openCard={openCard}
                            />
                        ),
                    },
                    {
                        label: 'Корзина',
                        key: '3',
                        children: (
                            <ServiceProductList
                                productCategoryList={productCategoryList}
                                serviceCategoryList={null}
                                productList={productList}
                                serviceList={null}
                                selecting={selecting}
                                selectCatList={selectCatList}
                                selectElemList={selectElemList}
                                currentCategoryPage={currentCategoryPage}
                                currentCategoryMeta={currentCategoryMeta}
                                handleShowMoreCategories={handleShowMoreCategories}
                                setSelectCatList={setSelectCatList}
                                setSelectElemList={setSelectElemList}
                                openCategoryCard={openCategoryCard}
                                openCard={openCard}
                            />
                        ),
                    },
                ]}
                onChange={(key) => {
                    onChangeTab(key);
                }}
            />
            { currentMeta && currentPage < currentMeta.last_page && <ShowMoreButton onClick={handleShowMoreProducts} text='Показать ещё' /> }
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

export { ProductList };
