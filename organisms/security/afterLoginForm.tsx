import { Col, Radio, Row } from 'antd';
import { useNavigate } from 'react-router-dom';
import { SecurityStore } from './securityStore';
import { LoginAsOptions } from '@enums/loginAsOptions';
import { useEffect } from 'react';
import { CRMListResp } from '@api/responseModels/crm/crmListResponse';
import { CRMAPIManager } from '@classes/crmApiManager';

const AfterLoginForm = (): JSX.Element => {
    const navigate  = useNavigate();

    async function checkSessionValidity() {
        try {
            const crmList = await CRMAPIManager.request<CRMListResp>(async (api) => {
                return await api.getCRMList(SecurityStore.loginAs === 'employee');
            });
            if (crmList.errorMessages) throw crmList.errorCode;
        } catch (errors) {
            if(errors == "AccessDenied") navigate("/logout");
        }
    }

    useEffect(() => {
        checkSessionValidity();
    }, []);

    return (
        <div className="app-after-login">
            <Row justify="center" gutter={[16,16]}>
                <Col
                    style={{
                        textAlign: 'center',
                        margin: 20
                    }}
                    span={24}
                >
                    <h3>
                        Добро пожаловать!
                        <br />
                        Выберите роль:
                    </h3>
                </Col>
                <Col className="justify-content-center d-flex" span={8}>
                    <Radio.Button
                        className="round-button"
                        disabled={true}
                        onClick={() => {
                            SecurityStore.setLoginAs(LoginAsOptions.Client)
                        }}
                        type="primary"
                    >
                        Клиент
                    </Radio.Button>
                </Col>
                <Col className="justify-content-center d-flex" span={8}>
                    <Radio.Button
                        className="round-button"
                        checked={SecurityStore.loginAs == LoginAsOptions.Employee}
                        defaultChecked={true}
                        onClick={() => {
                            navigate('/lk/worker')
                            SecurityStore.setLoginAs(LoginAsOptions.Employee)
                        }}
                        type="primary"
                    >
                        Сотрудник
                    </Radio.Button>
                </Col>
            </Row>
        </div>
    );
};

export { AfterLoginForm };
