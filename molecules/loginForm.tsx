import * as React from 'react';
import { Form, Divider, Row, Col, Button, List } from 'antd';
import { TCRM } from 'types/crm';
import { TInvitation } from 'types/invitation';
import { InviteTabs } from './inviteTabs';

type TProps = {
    CRMList: Array<TCRM>,
    handleCRMSelection: (value: number) => Promise<void>,
    setIsModalVisible: React.Dispatch<React.SetStateAction<boolean>>,
    loadCRMs: () => Promise<void>,
    invitationList: Array<TInvitation>,
    handleAcceptOrRejectInvite: () => Promise<void>,
    loginAs: string,
}

const LoginForm = ({
    CRMList,
    handleCRMSelection,
    setIsModalVisible,
    loadCRMs,
    invitationList,
    handleAcceptOrRejectInvite,
    loginAs,
}: TProps): JSX.Element => {
    return (
        <>
            <Form layout="vertical" className="crm-invites">
                <Divider>Доступные CRM</Divider>
                <Form.Item>
                    <List 
                        itemLayout="horizontal"
                        dataSource={CRMList}
                        renderItem={(item, index) => (
                            <List.Item 
                                style={{cursor: 'pointer'}}
                                onClick={async () => {
                                    handleCRMSelection(item.id)
                            }} >
                                <List.Item.Meta 
                                    title={<span>{index + 1}. {item.organization_name}</span>}
                                />
                            </List.Item>
                        )}
                    />
                </Form.Item>
                <Form.Item>
                    <Row justify="center" gutter={[16, 16]}>
                        <Col span={12}>
                            <Button
                                block
                                className="center-btn round-button"
                                onClick={() => setIsModalVisible(true)}
                                type="primary"
                                hidden={loginAs == 'client'}
                            >
                                Создать CRM
                            </Button>
                        </Col>
                        <Col span={10}>
                            <Button className="center-btn round-button" onClick={loadCRMs}>
                                Обновить список
                            </Button>
                        </Col>
                    </Row>
                </Form.Item>
                
                <Divider>Приглашения</Divider>
                <Form.Item className="tabs">
                    <InviteTabs
                        invitationList={invitationList}
                        onAcceptOrRejectInvite={handleAcceptOrRejectInvite}
                    />
                </Form.Item>
                
            </Form>
        </>
    )
};

export { LoginForm };