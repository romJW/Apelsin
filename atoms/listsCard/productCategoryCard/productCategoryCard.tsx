import { Row, Col, Avatar, Button } from 'antd';
import { TProductCategory } from 'types/productCategory';
import { TProduct } from 'types/product';
import { GlobalConstants } from '@constants/global';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { LastIdStore } from '@pages/lastIdStore';

type Props = {
    data: TProductCategory & { products: Array<TProduct>; categories: Array<TProductCategory> },
    selecting: boolean,
    selectList: Array<{ id: number; name: string }>,
    route: string,
    handleCategoryClick: (id: number, name: string) => void,
}

function ProductCategoryCard({
    data,
    selecting,
    selectList,
    route,
    handleCategoryClick,
}: Props) {
    const navigate = useNavigate();

    return (
        <Row onClick={() => handleCategoryClick(data.id, data.name)}>
            <Col>
                <Avatar
                    className="avatar"
                    src={`${GlobalConstants.BaseUrlForImg}${
                        data?.picture as string
                    }`}
                />
            </Col>
            <Col>
                <Row>
                    <Col>
                        <h3 className="title">{data.name}</h3>
                    </Col>
                    <Col>
                        <h3
                            className="quantity"
                            onClick={() => {
                                LastIdStore.setLastProductCategoryId(data.id);
                                navigate(route);
                            }}
                        >
                            {'(' +
                                data.categories.length +
                                '/' +
                                data.products.length +
                            ')'}
                        </h3>
                    </Col>
                </Row>
            </Col>
            {selecting && (
                <Col className="select-button">
                    <Button
                        icon={<FontAwesomeIcon icon={faCheck} />}
                        shape="circle"
                        type={
                            selectList.find((sli) => sli.id == data.id)
                                ? 'primary'
                                : 'default'
                        }
                    />
                </Col>
            )}
        </Row>
    )
}

export { ProductCategoryCard };