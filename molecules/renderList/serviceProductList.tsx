import { ProductCard } from '@atoms/listsCard/serviceProductCards/cards/productCard';
import { ServiceCard } from '@atoms/listsCard/serviceProductCards/cards/serviceCard';
import { ProductCategoryCard } from '@atoms/listsCard/serviceProductCards/categoryCards/productCategoryCard';
import { ServiceCategoryCard } from '@atoms/listsCard/serviceProductCards/categoryCards/serviceCategoryCard';
import { columnViewStore } from '@molecules/listViewChanger/listViewStore';
import { ShowMoreButton } from '@molecules/paginationControls/showMoreButton';
import { List } from 'antd';
import { observer } from 'mobx-react-lite';
import React, { SyntheticEvent } from 'react';
import { TMetadata } from 'types/metadata';
import { TProduct } from 'types/product';
import { TProductCategory } from 'types/productCategory';
import { TService } from 'types/service';
import { TServiceCategory } from 'types/serviceCategory';

type Props = {
    productCategoryList: Array<TProductCategory & { products: Array<TProduct>;  categories: Array<TProductCategory> }> | null,
    serviceCategoryList: Array<TServiceCategory & { services: Array<TService>; categories: Array<TServiceCategory> }> | null,
    productList: Array<TProduct & { category: TProductCategory }> | null,
    serviceList: Array<TService & { category: TServiceCategory }> | null,
    selecting: boolean,
    selectCatList: Array<{ id: number; name: string; parentId: number | null }>,
    selectElemList: Array<{ id: number; name: string; parentId: number | null }>,
    currentCategoryMeta: TMetadata,
    currentCategoryPage: number,
    handleShowMoreCategories: () => Promise<void>,
    setSelectCatList: React.Dispatch<React.SetStateAction<Array<{ id: number; name: string; parentId: number | null }>>>,
    setSelectElemList: React.Dispatch<React.SetStateAction<Array<{ id: number; name: string; parentId: number | null }>>>,
    openCategoryCard: (id: number | null, back: boolean) => void | null,
    openCard: (id: number) => void | null
}

const ServiceProductList = observer(({
    productCategoryList,
    serviceCategoryList,
    productList,
    serviceList,
    selecting,
    selectCatList,
    selectElemList,
    currentCategoryMeta,
    currentCategoryPage,
    handleShowMoreCategories,
    setSelectCatList,
    setSelectElemList,
    openCategoryCard,
    openCard
}: Props) => {
    function handleCategorySelectButtonClick(
        e: SyntheticEvent,
        categoryId: number,
        categoryName: string,
        parentId: number | null
    ) {
        e.stopPropagation();
        !selectCatList.find((sli) => sli.id == categoryId)
            ? setSelectCatList((oldList) => [
                ...oldList,
                { id: categoryId, name: categoryName, parentId },
            ])
            : setSelectCatList((oldList) => oldList.filter((sli) => sli.id != categoryId));
    }

    function handleProductSelectButtonClick(
        e: SyntheticEvent,
        productId: number,
        productName: string,
        parentId: number | null
    ) {
        e.stopPropagation();
        !selectElemList.find((sli) => sli.id == productId)
            ? setSelectElemList((oldList) => [
                ...oldList,
                { id: productId, name: productName, parentId },
            ])
            : setSelectElemList((oldList) => oldList.filter((sli) => sli.id != productId));
    }

    const dataCategoryList = productCategoryList ? productCategoryList : serviceCategoryList;
    const dataList = productList ? productList : serviceList;


    return (
        <>
            {dataCategoryList.length > 0 && (
                <List
                    className="product-category-card-list"
                    /// Не требует исправления
                    dataSource={dataCategoryList}
                    itemLayout="horizontal"
                    renderItem={(item) => (
                        <List.Item className="product-category-card">
                            {productCategoryList ? (
                                <ProductCategoryCard 
                                    data={item}
                                    selecting={selecting}
                                    selectCatList={selectCatList}
                                    openCategoryCard={openCategoryCard}
                                    handleCategorySelectButtonClick={handleCategorySelectButtonClick}
                                />
                            ) : (
                                <ServiceCategoryCard 
                                    /// Не требует исправления
                                    data={item}
                                    selecting={selecting}
                                    selectCatList={selectCatList}
                                    openCategoryCard={openCategoryCard}
                                    handleCategorySelectButtonClick={handleCategorySelectButtonClick}
                                />
                            )}
                        </List.Item>
                    )}
                />
            )}
            { currentCategoryMeta && currentCategoryPage < currentCategoryMeta.last_page && <ShowMoreButton onClick={handleShowMoreCategories} text='Показать ещё' /> }
            { dataList.length > 0 && (
                <List
                    className="product-card-list"
                    /// Не требует исправления
                    dataSource={dataList}
                    itemLayout="horizontal"
                    bordered
                    grid={{ column: columnViewStore.col }}
                    renderItem={(item) => (
                        <List.Item className="product-card">
                            {productList ? (
                                <ProductCard 
                                    data={item}
                                    selecting={selecting}
                                    selectElemList={selectElemList}
                                    openCard={openCard}
                                    handleProductSelectButtonClick={handleProductSelectButtonClick}
                                />
                            ) : (
                                <ServiceCard 
                                    /// Не требует исправления
                                    data={item}
                                    selecting={selecting}
                                    selectElemList={selectElemList}
                                    openCard={openCard}
                                    handleProductSelectButtonClick={handleProductSelectButtonClick}
                                />
                            )}
                        </List.Item>
                    )}
                />
            )}
        </>
    )
});

export { ServiceProductList };
