import React from "react";
import { List } from 'antd';
import { TServiceCategory } from "types/serviceCategory";
import { TService } from "types/service";
import { TProductCategory } from "types/productCategory";
import { TProduct } from "types/product";
import { ServiceCategoryCard } from "@atoms/listsCard/serviceCategoryCard/serviceCategoryCard";
import { ProductCategoryCard } from "@atoms/listsCard/productCategoryCard/productCategoryCard";
import { useNavigate } from "react-router-dom";

type TProps = {
    dataService: Array<TServiceCategory & { services: Array<TService>; categories: Array<TServiceCategory> }> | null
    dataProducts: Array<TProductCategory & { products: Array<TProduct>; categories: Array<TProductCategory> }> | null,
    selectList: Array<{ id: number; name: string }>,
    selecting: boolean,
    route: string,
    routeCard: string,
    setLastCategoryId: React.Dispatch<React.SetStateAction<number>>,
    setSelectList: React.Dispatch<React.SetStateAction<Array<{ id: number; name: string }>>>,
}

function RenderCategoryList({
    dataService,
    dataProducts,
    selectList,
    selecting,
    route,
    routeCard,
    setLastCategoryId,
    setSelectList,
}: TProps) {
    const navigate = useNavigate()
    const data = dataService ? dataService : dataProducts

    function openCard(id: number) {
        setLastCategoryId(id);
        navigate(`${routeCard}/${id}`);
    }

    function handleCategoryClick(categoryId: number, categoryName: string) {
        if (selecting) {
            !selectList.find((sli) => sli.id == categoryId)
                ? setSelectList((oldList) => [...oldList, { id: categoryId, name: categoryName }])
                : setSelectList((oldList) => oldList.filter((sli) => sli.id != categoryId));
        } else {
            openCard(categoryId);
        }
    }

    return (
        <List
            className="service-category-card-list"
            /// Не требует исправления
            dataSource={data}
            itemLayout="horizontal"
            renderItem={(item) => (
                <List.Item className="service-category-card">
                    {
                        dataService 
                        ? (
                            <ServiceCategoryCard 
                                data={item}
                                selecting={selecting}
                                selectList={selectList}
                                route={route}
                                handleCategoryClick={handleCategoryClick}
                            />
                        )
                        : (
                            <ProductCategoryCard 
                                /// Не требует исправления
                                data={item}
                                selecting={selecting}
                                selectList={selectList}
                                route={route}
                                handleCategoryClick={handleCategoryClick}
                            />
                        )
                    }
                </List.Item>
            )}
        />
    )
}

export { RenderCategoryList }