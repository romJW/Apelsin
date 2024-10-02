import { faHouse } from '@fortawesome/free-solid-svg-icons';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Breadcrumb, Col, Row } from 'antd';
import { useNavigate } from 'react-router-dom';
import { SettingsManager } from '@classes/settingsManager';

type TProps = {
    dataId: number | string,
    dataIcon: IconProp,
    title: string,
    dataTitle: string,
    route: string,
    dataName: string,
    isForInvitation: boolean | null,
    isSpecialty: boolean,
}

function HeaderBreadcrumbProfiles({
    dataId,
    dataIcon,
    title,
    dataTitle,
    route,
    dataName,
    isForInvitation = null,
    isSpecialty = false,
}: TProps): JSX.Element {
    const navigate = useNavigate();
    const creds = SettingsManager.getConnectionCredentials();

    return (
        <>
            <Row className="breadcrumb-header">
                <Col className="header-location">
                    <span>{ isForInvitation ? 'Приглашение пользователя' : title }</span>
                </Col>
            </Row>
            {!isForInvitation && (
                <Row className="breadcrumbs-controls">
                    <Col className="breadcrumbs">
                        <Breadcrumb>
                            <Breadcrumb.Item
                                onClick={() =>
                                    navigate(`/lk/worker/crm/${creds?.crmID}`)
                                }
                            >
                                <FontAwesomeIcon icon={faHouse} />
                            </Breadcrumb.Item>
                            <Breadcrumb.Item
                                onClick={() =>
                                    navigate(route)
                                }
                            >
                                <FontAwesomeIcon icon={dataIcon} />
                                <span className="crumb-name">{ dataTitle }</span>
                            </Breadcrumb.Item>
                            <Breadcrumb.Item>
                                {isSpecialty && (
                                    <span>{dataId}</span>
                                )}
                                {!isSpecialty && (
                                    <span>
                                        ID:{' '}
                                        {dataId == -1
                                            ? dataName
                                            : dataId}
                                    </span>
                                )}
                            </Breadcrumb.Item>
                        </Breadcrumb>
                    </Col>
                </Row>
            )}
        </>
        
    )
}

export { HeaderBreadcrumbProfiles }