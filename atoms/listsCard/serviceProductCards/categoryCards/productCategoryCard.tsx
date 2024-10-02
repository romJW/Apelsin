import { GlobalConstants } from '@constants/global'
import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Avatar, Button, Col, Row } from 'antd'
import { SyntheticEvent } from 'react'
import { TProduct } from 'types/product'
import { TProductCategory } from 'types/productCategory'

type Props = {
    data:  TProductCategory & { products: Array<TProduct>; categories: Array<TProductCategory>;},
    selecting: boolean,
    selectCatList: Array<{ id: number; name: string; parentId: number | null }>,
    openCategoryCard: (id: number, back: boolean) => void | null,
    handleCategorySelectButtonClick: (e: SyntheticEvent, categoryId: number, categoryName: string, parentId: number | null) => void | null,
}

function ProductCategoryCard({
    data,
    selecting,
    selectCatList,
    openCategoryCard,
    handleCategorySelectButtonClick
}: Props) {
    return (
        <Row onClick={() => openCategoryCard(data.id, false)}>
            <Col>
                <Avatar
                    className="avatar"
                    src={`${GlobalConstants.BaseUrlForImg}${
                        data.picture as string
                    }`}
                />
            </Col>
            <Col>
                <Row>
                    <Col>
                        <h3 className="title">{data.name}</h3>
                    </Col>
                    <Col>
                        <h3 className="quantity">
                            {'(' + data.quantity_total + ')'}
                        </h3>
                    </Col>
                </Row>
            </Col>
            {selecting && (
                <Col className="select-button">
                    <Button
                        icon={<FontAwesomeIcon icon={faCheck} />}
                        onClick={(e) =>
                            handleCategorySelectButtonClick(
                                e,
                                data.id,
                                data.name,
                                data.parent_product_category_id
                            )
                        }
                        shape="circle"
                        type={
                            selectCatList.find((sli) => sli.id == data.id)
                                ? 'primary'
                                : 'default'
                        }
                    />
                </Col>
            )}
        </Row>
    );
}

export { ProductCategoryCard };