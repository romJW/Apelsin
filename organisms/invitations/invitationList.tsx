import {faHouse, faUserPlus} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {Breadcrumb, Col, Form, Input, Row} from 'antd';
import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {SettingsManager} from '@classes/settingsManager';
import {Loader} from '@atoms/loader';
import {Common} from '@classes/commonMethods';
import {InviteTabs} from '@molecules/invitations/inviteTabs';
import {GlobalConstants} from '@constants/global';

const { Search } = Input;

const InvitationList = (): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const navigate = useNavigate();
    const creds = SettingsManager.getConnectionCredentials();

    function beforeMountInvitations() {
        Common.checkUserBelongToCrm(GlobalConstants.CrmOrderinUrl).then((res) => {
            if(!res) navigate(`/lk/worker/crm/${creds.crmID}`);
        });
    }

    useEffect(() => {
        beforeMountInvitations();
    }, []);

    return (
        <div id="app-invitation-list">
            {isLoading && <Loader />}
            <Row className="breadcrumb-header">
                <Col className="header-location">
                    <span>Приглашения</span>
                    {/*<span className="header-location__quantity">{` (${invitationList?.length}) `}</span>*/}
                </Col>
                <Col className="header-search">
                    <Search
                        allowClear
                        className="header-search-input"
                        onSearch={async (value) => {
                            if (value == null || value == '') return;
                            // TODO: search
                        }}
                    />
                </Col>
            </Row>
            <Row className="breadcrumbs-controls">
                <Col className="breadcrumbs">
                    <Breadcrumb>
                        <Breadcrumb.Item onClick={() => navigate(`/lk/worker/crm/${creds.crmID}`)}>
                            <FontAwesomeIcon icon={faHouse} />
                        </Breadcrumb.Item>
                        <Breadcrumb.Item>
                            <FontAwesomeIcon icon={faUserPlus} />
                            <span className="crumb-name">Приглашения</span>
                        </Breadcrumb.Item>
                    </Breadcrumb>
                </Col>
            </Row>
            <Form layout="vertical" className="invites">
                <Form.Item className="tabs">
                    <InviteTabs setIsLoading={setIsLoading} />
                </Form.Item>
            </Form>
        </div>
    );
};

export { InvitationList };
