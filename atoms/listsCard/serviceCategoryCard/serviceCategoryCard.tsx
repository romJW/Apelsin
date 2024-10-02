import { Row, Col, Avatar, Button } from 'antd';
import { TServiceCategory } from 'types/serviceCategory';
import { TService } from 'types/service';
import { GlobalConstants } from '@constants/global';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { LastIdStore } from '@pages/lastIdStore';

type Props = {
    data: TServiceCategory & { services: Array<TService>; categories: Array<TServiceCategory> },
    selecting: boolean,
    selectList: Array<{ id: number; name: string }>,
    route: string,
    handleCategoryClick: (id: number, name: string) => void,
}

function ServiceCategoryCard({
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
                                LastIdStore.setLastServiceCategoryId(data.id);
                                navigate(route);
                            }}
                        >
                            {'(' +
                            data.categories.length +
                            '/' +
                            data.services.length +
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
};

export { ServiceCategoryCard };