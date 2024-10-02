import { faCheck, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Alert, Avatar, Breadcrumb, Button, Col, List, Modal, Pagination, Row } from 'antd';
import React, { SyntheticEvent, useEffect, useState } from 'react';

import { ServiceCategoryListResp } from '@api/responseModels/service/serviceCategoryListResponse';
import { ServiceCategoryResp } from '@api/responseModels/service/serviceCategoryResponse';
import { CRMAPIManager } from '@classes/crmApiManager';
import { SettingsManager } from '@classes/settingsManager';
import { TServiceCategory } from 'types/serviceCategory';
import { Loader } from '@atoms/loader';
import { CategoryPickerUsage } from '@enums/categoryPickerUsage';
import { TService } from 'types/service';
import { ServiceIncludedCategoriesResp } from '@api/responseModels/service/serviceIncludedCategoriesResp';
import { GlobalConstants } from '@constants/global';
import { TMetadata } from 'types/metadata';
import { LastIdStore } from '@pages/lastIdStore';
import { ShowMoreButton } from '@molecules/paginationControls/showMoreButton';

type TProps = {
    isModalOpen: boolean;
    setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    currentCategorySelected?: TServiceCategory;
    setCurrentCategorySelected?: (sel: TServiceCategory) => void;
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
        parent_service_category_id: number;
    };
    useCase: CategoryPickerUsage;
};

const ServiceCategoryPicker = ({
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
    const [serviceCategoryList, setServiceCategoryList] = useState<
        Array<TServiceCategory & { categories: Array<TServiceCategory> }>
    >([]);
    const [selectedServiceCategory, setSelectedServiceCategory] = useState<TServiceCategory>(null);
    const [lastError, setLastError] = useState<string>(null);
    const [currentFolderId, setCurrentFolderId] = useState<number>();
    const [categoryPath, setCategoryPath] = useState<Array<{ id: number; name: string }>>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [currentMeta, setCurrentMeta] = useState<TMetadata>(null);
    
    async function getInitialServiceCategoryList() {
        setIsLoading(true);
        try {
            const initServCatId = LastIdStore.lastServiceCategoryId == -1 ? null : LastIdStore.lastServiceCategoryId;
            setCurrentFolderId(initServCatId);
            const servCatList = await CRMAPIManager.request<ServiceCategoryListResp>(
                async (api) => {
                    return await api.getServiceCategoryList({
                        crm_id: creds.crmID,
                        category_id: initServCatId,
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
            if (servCatList.errorMessages) throw new Error(servCatList.errorMessages[0]);
            setCurrentMeta(servCatList.data.meta);
            const filteredArr = await filterCategoryListByUseCase(servCatList.data.data, creds.crmID);
            setServiceCategoryList(filteredArr);

            await adjustBreadcrumbs(initServCatId);
        
        } catch (err) {
            setLastError(err.message);
        }
        setIsLoading(false);
    }

    async function getServiceCategoryListById(id: number, page: number = currentPage, addition: boolean = false) {
        setIsLoading(true);
        try {
            const servCatList = await CRMAPIManager.request<ServiceCategoryListResp>(
                async (api) => {
                    return await api.getServiceCategoryList({
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
            if (servCatList.errorMessages) throw new Error(servCatList.errorMessages[0]);
            setCurrentMeta(servCatList.data.meta);
            const filteredArr = await filterCategoryListByUseCase(servCatList.data.data, creds.crmID);
            if (addition) {
                setServiceCategoryList((pcl) => [...pcl, ...filteredArr]);
            } else {
                setServiceCategoryList(filteredArr);
            }

            await adjustBreadcrumbs(id);
        } catch (err) {
            setLastError(err.message);
        }
        setIsLoading(false);
    }

    async function adjustBreadcrumbs(id: number): Promise<void> {
        if (categoryPath.length == 0 && id != null) {
            let tServCat = null;
            let tCurFolderId = id;
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
    }

    async function filterCategoryListByUseCase(
        servCatList: Array<
            TServiceCategory & {
                services: TService[];
                categories: TServiceCategory[];
            }
        >,
        crmID: number
    ): Promise<Array<
        TServiceCategory & {
            services: TService[];
            categories: TServiceCategory[];
        }
    >> {
        switch (useCase) {
            case CategoryPickerUsage.transfer:
                const disabledCatIdArr = await getDisabledCatList(crmID);
                const filteredCategoryList = servCatList.filter(
                    (cat) => !disabledCatIdArr.includes(cat.id)
                );
                return filteredCategoryList;

            case CategoryPickerUsage.editCategory:
                const includedCategoriesIdList = await getIncludedCategories(
                    crmID,
                    categoryData.id
                );
                const filteredCatList = servCatList.filter((cat) => {
                    const isNotSameId = cat.id !== categoryData.id;
                    const isNotParentId = cat.id !== categoryData.parent_service_category_id;
                    return (
                        isNotSameId && isNotParentId && !includedCategoriesIdList.includes(cat.id)
                    );
                });
                return filteredCatList;

            case CategoryPickerUsage.createCategoryOrCreateOrEditProductOrService:
                if (!currentCategorySelected) {
                    return servCatList;
                } else {
                    const filteredCatArr = servCatList.filter(
                        (cat) => currentCategorySelected.id !== cat.id
                    );
                    return filteredCatArr;
                }
        }
    }

    function handlePickerOK() {
        setCurrentCategorySelected(selectedServiceCategory);
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
            const category = serviceCategoryList.find((sc) => sc.id == id);
            tPath.push({ id: id, name: category?.name });
        }
        setCategoryPath(tPath);
        setCurrentPage(1);
        await getServiceCategoryListById(id, 1);
    }

    function handlePickerCancel() {
        setIsModalOpen(false);
    }

    function handleSelectButtonClick(
        e: SyntheticEvent,
        category: TServiceCategory & { categories: Array<TServiceCategory> }
    ) {
        e.stopPropagation();
        selectedServiceCategory?.id == category.id
            ? setSelectedServiceCategory(null)
            : setSelectedServiceCategory(category);
    }

    async function getIncludedCategories(crmID: number, catId: number): Promise<Array<number>> {
        const includedCategoriesIdList = await CRMAPIManager.request<ServiceIncludedCategoriesResp>(
            async (api) => {
                return await api.getAllIncludedServiceCategories(crmID, catId);
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
        await getServiceCategoryListById(currentFolderId);
    };

    async function handleChangePage(newPage: number) {
        await getServiceCategoryListById(currentFolderId, newPage);
        setCurrentPage(newPage);
    }

    async function handleShowMore() {
        await getServiceCategoryListById(currentFolderId, currentPage + 1, true);
        setCurrentPage((pageNumber) => pageNumber + 1);
    }

    useEffect(() => {
        getInitialServiceCategoryList();
    }, []);

    return (
        <Modal
            className="service-category-picker"
            title="Выбор категории услуг"
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
                            <FontAwesomeIcon icon={faWandMagicSparkles} />
                            <span className="crumb-name">Категории услуг</span>
                        </Breadcrumb.Item>
                        {categoryPath.map(({ id, name }) => (
                            <Breadcrumb.Item
                                key={id}
                                onClick={async () => await openCategoryCard(id, true)}
                            >
                                <span className="crumb-name">{name}</span>
                            </Breadcrumb.Item>
                        ))}
                    </Breadcrumb>
                </Col>
            </Row>
            <List
                className="service-category-card-list"
                dataSource={serviceCategoryList}
                itemLayout="horizontal"
                renderItem={(item) => {
                    return (
                        <List.Item className="service-category-card">
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
                                <Col className="select-button">
                                    <Button
                                        icon={<FontAwesomeIcon icon={faCheck} />}
                                        onClick={(e) => handleSelectButtonClick(e, item)}
                                        shape="circle"
                                        type={
                                            item.id == selectedServiceCategory?.id
                                                ? 'primary'
                                                : 'default'
                                        }
                                    />
                                </Col>
                            </Row>
                        </List.Item>
                    );
                }}
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

export { ServiceCategoryPicker };
