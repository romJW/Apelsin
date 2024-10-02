import { useEffect, useState } from 'react';
import * as React from 'react';
import { Loader } from '@atoms/loader';
import { Button, Form, Input, Modal} from 'antd';
import { useNavigate } from 'react-router-dom';
import { TCRM } from 'types/crm';
import { SettingsManager } from '@classes/settingsManager';
import { CRMAPIManager } from '@classes/crmApiManager';
import { CRMAPI } from '@api/crmApi';
import { CRMListResp } from '@api/responseModels/crm/crmListResponse';
import { RequestResult } from '@api/responseModels/requestResult';
import { messageService } from '@classes/messageService';
import { CRMResp } from '@api/responseModels/crm/crmResponse';
import { UserResp } from '@api/responseModels/user/userResponse';
import { InvitationListResp } from '@api/responseModels/invitation/invitationListResponse';
import { LoginForm } from '@molecules/loginForm';
import { TInvitation } from 'types/invitation';
import { SecurityStore } from './securityStore';
const { TextArea } = Input;

const CrmFormCreation = (): JSX.Element => {
    const [currentUser, setCurrentUser] = useState(null)
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [CRMList, setCRMList] = useState<Array<TCRM>>([]);
    const [invitationList, setInvitationList] = useState<Array<TInvitation>>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newCRMName, setNewCRMName] = useState<string>('');
    const [newCRMDescription, setNewCRMDescription] = useState<string>('');
    const navigate  = useNavigate();

    async function getCurrentUser() {
        setIsLoading(true)
        try {
            const cUser = await CRMAPIManager.request<UserResp>(async (api) => {
                return await api.currentUser();
            });
            if (cUser.errorMessages) throw cUser.errorMessages;
            setCurrentUser({...cUser?.data?.data})
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false)
    }

    async function handleCRMSelection(value: number) {
        const selectedCrm = CRMList.find((CRMListItem) => CRMListItem.id == value)
        
        SettingsManager.updateConnectionCredentials({
            crmID: selectedCrm.id,
            userId: currentUser.id,
        });
        navigate(`/lk/worker/crm/${selectedCrm.id}`)
    }

    async function loadCRMs() {
        setIsLoading(true);
        try {
            const crmList = await CRMAPIManager.request<CRMListResp>(async (api) => {
                return await api.getCRMList(SecurityStore.loginAs === 'employee');
            });
            if (crmList.errorMessages) throw crmList.errorMessages;
            setCRMList(crmList.data.data);
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
    }

    async function loadInvitations() {
        setIsLoading(true);
        try {
            const inviteList = await CRMAPIManager.request<InvitationListResp>(async (api) => {
                return await api.getRecieveInvitations();
            });
            if (inviteList.errorMessages) throw inviteList.errorMessages;
            setInvitationList(inviteList.data.data);
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
    }

    function onCRMNameChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        setNewCRMName(e.target.value);
    }

    function onCRMDescriptionChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        setNewCRMDescription(e.target.value);
    }

    async function addCRM() {
        const creds = SettingsManager.getConnectionCredentials();
        const api = new CRMAPI(creds?.token);
        let result: RequestResult<CRMResp>;
        try {
            result = await api.saveCRM(newCRMName, creds.userId, newCRMDescription);
            if (result.errorMessages) throw result.errorMessages;
            messageService.sendSuccess('CRM добавлена.');
            setIsModalVisible(false);
            setNewCRMName('');
            setNewCRMDescription('');
            await loadCRMs();
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
    }

    const handleAcceptOrRejectInvite = async () => {
        await loadCRMs();
        await loadInvitations();
    };

    useEffect(() => {
        getCurrentUser()
            .then(() => handleAcceptOrRejectInvite());
    }, []);

    return (
        <div className="app-after-login">
            {isLoading && <Loader />}
            <Modal
                title="Добавление CRM"
                open={isModalVisible}
                onOk={addCRM}
                onCancel={() => setIsModalVisible(false)}
                footer={[
                    <Button
                        className="round-button" 
                        key="back" 
                        onClick={() => setIsModalVisible(false)}
                    >
                        Отмена
                    </Button>,
                    <Button
                        className="round-button"
                        key="submit"
                        type="primary"
                        disabled={newCRMName.length == 0 || newCRMDescription.length == 0}
                        onClick={addCRM}
                    >
                        Добавить
                    </Button>,
                ]}
            >
                <Form layout="inline">
                    <Form.Item label="Название: ">
                        <Input
                            onChange={onCRMNameChange}
                            style={{ width: '180px' }}
                            value={newCRMName}
                            required
                        />
                    </Form.Item>
                    <div style={{ margin: '24px 0' }} />
                    <Form.Item label="Описание: ">
                        <TextArea
                            autoSize={{ minRows: 2, maxRows: 5 }}
                            maxLength={255}
                            onChange={onCRMDescriptionChange}
                            style={{ width: '180px' }}
                            value={newCRMDescription}
                            required
                        />
                    </Form.Item>
                </Form>
            </Modal>
            <LoginForm
                CRMList={CRMList}
                handleCRMSelection={handleCRMSelection}
                setIsModalVisible={setIsModalVisible}
                loadCRMs={loadCRMs}
                invitationList={invitationList}
                handleAcceptOrRejectInvite={handleAcceptOrRejectInvite}
                loginAs={SecurityStore.loginAs}
            />
            <Form className="step-navigator" layout="inline">
                <Form.Item style={{ marginLeft: 'auto' }}>
                    <Button
                        className="round-button"
                        onClick={() => navigate('/lk')}
                        type="default"
                    >
                        Назад
                    </Button>
                </Form.Item>
                <Form.Item >
                    <Button className="center-btn round-button" onClick={loadInvitations}>
                        Обновить список
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export { CrmFormCreation };
