import { faCheck, faListCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Alert, Avatar, Breadcrumb, Button, Col, List, Modal, Pagination, Row } from 'antd';
import React, { SyntheticEvent, useEffect, useState } from 'react';
import { ProductCategoryListResp } from '@api/responseModels/product/productCategoryListResponse';
import { ProductCategoryResp } from '@api/responseModels/product/productCategoryResponse';
import { CRMAPIManager } from '@classes/crmApiManager';
import { SettingsManager } from '@classes/settingsManager';
import { TProductCategory } from 'types/productCategory';
import { Loader } from '@atoms/loader';
import { CategoryPickerUsage } from '@enums/categoryPickerUsage';
import { ProductIncludedCategoriesResp } from '@api/responseModels/product/productIncludedCategoriesResp';
import { TProduct } from 'types/product';
import { GlobalConstants } from '@constants/global';
import { LastIdStore } from '@pages/lastIdStore'
import { TMetadata } from 'types/metadata';
import { ShowMoreButton } from '@molecules/paginationControls/showMoreButton';

type TProps = {
    isModalOpen: boolean;
    setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    currentCategorySelected?: TProductCategory;
    setCurrentCategorySelected?: (sel: TProductCategory) => void;
    selectedCatList?: Array<{
        id: number;
        name: string;
        parentId: number | null;
    }>;
    selectedElemList?: Array<{
        id: number;
        name: string;
        parentId: number | null;
    }>;
    categoryData?: {
        id: number;
        subCategoriesId: Array<number>;
        parent_product_category_id: number;
    };
    useCase: CategoryPickerUsage;
};

const ProductCategoryPicker = ({
    isModalOpen,
    setIsModalOpen,
    currentCategorySelected,
    setCurrentCategorySelected,
    selectedCatList,
    selectedElemList,
    categoryData,
    useCase,
}: TProps): JSX.Element => {
    const creds = SettingsManager.getConnectionCredentials();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [productCategoryList, setProductCategoryList] = useState<
        Array<TProductCategory & { categories: Array<TProductCategory> }>
    >([]);
    const [selectedProductCategory, setSelectedProductCategory] = useState<TProductCategory>(null);
    const [lastError, setLastError] = useState<string>(null);
    const [currentFolderId, setCurrentFolderId] = useState<number>();
    const [categoryPath, setCategoryPath] = useState<Array<{ id: number; name: string }>>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [currentMeta, setCurrentMeta] = useState<TMetadata>(null);

    async function getInitialProductCategoryList() {
        setIsLoading(true);
        try {
            const initProdCatId = LastIdStore.lastProductCategoryId == -1 ? null : LastIdStore.lastProductCategoryId;
            setCurrentFolderId(initProdCatId);
            const prodCatList = await CRMAPIManager.request<ProductCategoryListResp>(
                async (api) => {
                    return await api.getProductCategoryList({
                        crm_id: creds.crmID,
                        category_id: initProdCatId,
                        sort_by: "name",
                        sort_direction: "asc",
                        filters: {
                            created_at: ["", ""],
                            deleted: "null",
                        },
                        page: 1,
                        per_page: 50
                    });
                }
            );
            if (prodCatList.errorMessages) throw new Error(prodCatList.errorMessages[0]);
            setCurrentMeta(prodCatList.data.meta);
            const filteredArr = await filterCategoryListByUseCase(prodCatList.data.data, creds.crmID);
            setProductCategoryList(filteredArr);

            await adjustBreadcrumbs(initProdCatId);
        } catch (err) {
            setLastError(err.message);
        }
        setIsLoading(false);
    }

    async function getProductCategoryListById(id: number, page: number = currentPage, addition: boolean = false) {
        setIsLoading(true);
        try {
            const prodCatList = await CRMAPIManager.request<ProductCategoryListResp>(
                async (api) => {
                    return await api.getProductCategoryList({
                        crm_id: creds.crmID,
                        category_id: id,
                        sort_by: "name",
                        sort_direction: "asc",
                        filters: {
                            created_at: ["", ""],
                            deleted: "null",
                        },
                        page: page,
                        per_page: 50
                    });
                }
            );
            if (prodCatList.errorMessages) throw new Error(prodCatList.errorMessages[0]);
            setCurrentMeta(prodCatList.data.meta);
            const filteredArr = await filterCategoryListByUseCase(prodCatList.data.data, creds.crmID);
            if (addition) {
                setProductCategoryList((pcl) => [...pcl, ...filteredArr]);
            } else {
                setProductCategoryList(filteredArr);
            }

            await adjustBreadcrumbs(id);
        } catch (err) {
            setLastError(err.message);
        }
        setIsLoading(false);
    }

    async function adjustBreadcrumbs(id: number): Promise<void> {
        if (categoryPath.length == 0 && id != null) {
            let tProdCat = null;
            let tCurFolderId = id;
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
    }

    async function filterCategoryListByUseCase(
        prodCatList: Array<
            TProductCategory & {
                products: TProduct[];
                categories: TProductCategory[];
            }
        >,
        crmID: number
    ): Promise<Array<
        TProductCategory & {
            products: TProduct[];
            categories: TProductCategory[];
        }
    >> {
        switch (useCase) {
            case CategoryPickerUsage.transfer:
                const disabledCatIdArr = await getDisabledCatList(crmID);
                const filteredCategoryList = prodCatList.filter(
                    (cat) => !disabledCatIdArr.includes(cat.id)
                );
                return filteredCategoryList;

            case CategoryPickerUsage.editCategory:
                const includedCategoriesIdList = await getIncludedCategories(
                    crmID,
                    categoryData.id
                );
                const filteredCatList = prodCatList.filter((cat) => {
                    const isNotSameId = cat.id !== categoryData.id;
                    const isNotParentId = cat.id !== categoryData.parent_product_category_id;
                    return (
                        isNotSameId && isNotParentId && !includedCategoriesIdList.includes(cat.id)
                    );
                });
                return filteredCatList;

            case CategoryPickerUsage.createCategoryOrCreateOrEditProductOrService:
                if (!currentCategorySelected) {
                    return prodCatList;
                } else {
                    const filteredCatArr = prodCatList.filter(
                        (cat) => currentCategorySelected.id !== cat.id
                    );
                    return filteredCatArr;
                }
        }
    }

    function handlePickerOK() {
        setCurrentCategorySelected(selectedProductCategory);
        setIsModalOpen(false);
    }

    async function openCategoryCard(id: number, back = false) {
        setCurrentFolderId(id);
        const tPath = categoryPath;
        if (back) {
            for (let i = tPath.length - 1; i >= 0; i--) {
                if (tPath[i].id != id) tPath.pop();
            }
        } else {
            const category = productCategoryList.find((sc) => sc.id == id);
            tPath.push({ id: id, name: category?.name });
        }
        setCategoryPath(tPath);
        setCurrentPage(1);
        await getProductCategoryListById(id, 1);
    }

    function handlePickerCancel() {
        setIsModalOpen(false);
    }

    function handleSelectButtonClick(
        e: SyntheticEvent,
        category: TProductCategory & { categories: Array<TProductCategory> }
    ) {
        e.stopPropagation();
        selectedProductCategory?.id == category.id
            ? setSelectedProductCategory(null)
            : setSelectedProductCategory(category);
    }

    async function getIncludedCategories(crmID: number, catId: number): Promise<Array<number>> {
        const includedCategoriesIdList = await CRMAPIManager.request<ProductIncludedCategoriesResp>(
            async (api) => {
                return await api.getAllIncludedProductCategories(crmID, catId);
            }
        );
        if (includedCategoriesIdList.errorMessages)
            throw new Error(includedCategoriesIdList.errorMessages[0]);
        return includedCategoriesIdList.data.data;
    }

    async function getDisabledCatList(crmID: number): Promise<Array<number>> {
        let disabledCatIdList = [];
        for (const cat of selectedCatList) {
            disabledCatIdList.push(cat.id);
            if (cat.parentId) {
                disabledCatIdList.push(cat.parentId);
            }
            const includedCategoriesIdList = await getIncludedCategories(crmID, cat.id);
            disabledCatIdList = [...disabledCatIdList, ...includedCategoriesIdList];
        }
        selectedElemList.forEach((el) => {
            if (el.parentId) {
                disabledCatIdList.push(el.parentId);
            }
        });
        return disabledCatIdList;
    }

    const handleButtonUpdateClick = async () => {
        await getProductCategoryListById(currentFolderId);
    };

    async function handleChangePage(newPage: number) {
        await getProductCategoryListById(currentFolderId, newPage);
        setCurrentPage(newPage);
    }

    async function handleShowMore() {
        await getProductCategoryListById(currentFolderId, currentPage + 1, true);
        setCurrentPage((pageNumber) => pageNumber + 1);
    }

    useEffect(() => {
        getInitialProductCategoryList();
    }, []);

    return (
        <Modal
            className="product-category-picker"
            title="Выбор категории товаров"
            open={isModalOpen}
            onOk={handlePickerOK}
            onCancel={handlePickerCancel}
            cancelText="Отмена"
        >
            {isLoading && <Loader />}
            {lastError && (
                <Alert
                    className="picker-alert"
                    message={lastError}
                    type="error"
                    closable
                    onClose={() => setLastError(null)}
                />
            )}
            <Row className="picker-controls">
                <Col>
                    <Button onClick={handleButtonUpdateClick} type="default">
                        Обновить
                    </Button>
                </Col>
            </Row>
            <Row className="breadcrumbs-controls">
                <Col className="breadcrumbs">
                    <Breadcrumb>
                        <Breadcrumb.Item onClick={async () => await openCategoryCard(null, true)}>
                            <FontAwesomeIcon icon={faListCheck} />
                            <span className="crumb-name">Категории товаров</span>
                        </Breadcrumb.Item>
                        {categoryPath.map((el) => (
                            <Breadcrumb.Item
                                key={el.id}
                                onClick={async () => await openCategoryCard(el.id, true)}
                            >
                                <span className="crumb-name">{el.name}</span>
                            </Breadcrumb.Item>
                        ))}
                    </Breadcrumb>
                </Col>
            </Row>
            <List
                className="product-category-card-list"
                dataSource={productCategoryList}
                itemLayout="horizontal"
                renderItem={(item) => (
                    <List.Item className="product-category-card">
                        <Row onClick={() => openCategoryCard(item.id)}>
                            <Col>
                                <Avatar
                                    className="avatar"
                                    src={`${GlobalConstants.BaseUrlForImg}${item.picture}`}
                                />
                            </Col>
                            <Col>
                                <Row>
                                    <Col>
                                        <h3 className="title">{item.name}</h3>
                                    </Col>
                                    <Col>
                                        <h3 className="quantity">
                                            {'(' + item.categories.length + ')'}
                                        </h3>
                                    </Col>
                                </Row>
                            </Col>
                            <Col className="button-select">
                                <Button
                                    icon={<FontAwesomeIcon icon={faCheck} />}
                                    onClick={(e) => handleSelectButtonClick(e, item)}
                                    shape="circle"
                                    type={
                                        item.id ===
                                        (selectedProductCategory as TProductCategory)?.id
                                            ? 'primary'
                                            : 'default'
                                    }
                                />
                            </Col>
                        </Row>
                    </List.Item>
                )}
            />
            {currentMeta && currentPage < currentMeta.last_page && (
                <ShowMoreButton onClick={handleShowMore} text="Показать ещё" />
            )}
            <Pagination
                current={currentPage}
                defaultCurrent={1}
                onChange={handleChangePage}
                pageSize={50}
                showSizeChanger={false}
                total={currentMeta?.total ?? 1}
            />
        </Modal>
    );
};

export { ProductCategoryPicker };
