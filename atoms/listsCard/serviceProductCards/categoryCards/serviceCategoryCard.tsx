import { SyntheticEvent } from 'react';
import { GlobalConstants } from '@constants/global';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Avatar, Button, Col, Row } from 'antd';
import { TService } from 'types/service';
import { TServiceCategory } from 'types/serviceCategory';

type Props = {
    data:  TServiceCategory & { products: Array<TService>; categories: Array<TServiceCategory>;},
    selecting: boolean,
    selectCatList: Array<{ id: number; name: string; parentId: number | null }>,
    openCategoryCard: (id: number, back: boolean) => void | null,
    handleCategorySelectButtonClick: (e: SyntheticEvent, categoryId: number, categoryName: string, parentId: number | null) => void | null,
}

function ServiceCategoryCard({
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
                            data.parent_service_category_id
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

export { ServiceCategoryCard };