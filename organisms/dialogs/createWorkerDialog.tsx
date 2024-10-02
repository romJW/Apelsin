import { Alert, Button, Form, Modal } from 'antd';
import { SyntheticEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MaskedInput } from 'antd-mask-input';
import * as React from 'react';
import { CRMAPIManager } from '../../../classes/crmApiManager';
import { InvitationResp } from '../../../api/responseModels/invitation/invitationResponse';
import { SettingsManager } from '../../../classes/settingsManager';
import { ConnectionResp } from '../../../api/responseModels/security/connectionResponse';
import { AfterCodeActions } from '../../../api/enums/afterCodeActions';
import { messageService } from '../../../classes/messageService';

type TProps = {
    isModalOpen: boolean;
    setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isCustomer: boolean;
    getCustomerList: () => Promise<void>;
};

const CreateWorkerDialog = ({
    isModalOpen,
    setIsModalOpen,
    isCustomer,
    getCustomerList,
}: TProps): JSX.Element => {
    const [lastDialogError, setLastDialogError] = useState<string>(null);
    const [phoneForm] = Form.useForm();
    const [workerExists, setWorkerExists] = useState<boolean>(null);
    const [numberValid, setNumberValid] = useState<boolean>(false);
    const [numberValue, setNumberValue] = useState<string>("");
    const navigate = useNavigate();
    const phoneMask = /^[0-9]{10}$/;

    async function validatePhone(): Promise<boolean> {
        let result = true;
        await phoneForm.validateFields().catch(() => {
            result = false;
        });
        return result;
    }

    async function checkIfExists(): Promise<boolean> {
        try {
            const ch = await CRMAPIManager.request<ConnectionResp>(
                async (api) => {
                    return await api.connection(numberValue);
                }
            );
            if (ch.errorMessages) throw new Error(ch.errorMessages[0]);
            return ch.data.require_method == AfterCodeActions.login;
        } catch (err) {
            setLastDialogError(err.message);
            return null;
        }
    }

    async function finishCreation(isUserExist: boolean) {
        const creds = SettingsManager.getConnectionCredentials();
        setWorkerExists(null);
        setIsModalOpen(false);
        if (isUserExist) {
            await getCustomerList()
            messageService.sendSuccess('Приглашение отправлено');
        } else {
            localStorage.setItem('newPhone', numberValue);
            isCustomer 
                ? navigate(`/lk/worker/crm/${creds.crmID}/customers/create`) 
                : navigate(`/lk/worker/crm/${creds.crmID}/workers/create`);
        }
        phoneForm.setFieldValue('phone', '');
    }

    async function addNewWorker(): Promise<void> {
        if (!(await validatePhone())) return;
        const check = workerExists ?? (await checkIfExists());
        if (workerExists == null) {
            setWorkerExists(check);
        }
        try {
            const creds = SettingsManager.getConnectionCredentials();
            if (check == true) {
                const inv = await CRMAPIManager.request<InvitationResp>(
                    async (api) => {
                        return await api.inviteRegisterUser(
                            creds.crmID,
                            numberValue,
                            isCustomer ? 'customer' : 'worker'
                        );
                    }
                );
                if (inv.errorMessages) throw new Error(inv.errorMessages[0]);
            }
            await finishCreation(check);
        } catch (err) {
            setLastDialogError(err.message);
        }
    }

    function handleDialogCancel() {
        setLastDialogError(null);
        setIsModalOpen(false);
        setWorkerExists(null);
    }

    function onNumberChange(e: SyntheticEvent & { maskedValue: string; unmaskedValue: string }) {
        const newValue = e.unmaskedValue;
        if(newValue && phoneMask.test(newValue)){
            setNumberValid(true);
        }
        else {
            setNumberValid(false);
        }
        setNumberValue(newValue);
    }

    return (
        <>
            <Modal
                cancelText="Отмена"
                className="worker-dialog"
                title="Приглашение пользователя"
                onCancel={handleDialogCancel}
                open={isModalOpen}
                zIndex={900}
                footer={[
                    <Button
                        className="round-button" 
                        key="back" 
                        onClick={handleDialogCancel}
                    >
                        Отмена
                    </Button>,
                    <Button
                        className="round-button"
                        key="submit"
                        type="primary"
                        disabled={!numberValid}
                        onClick={async () => await addNewWorker()}
                    >
                        Добавить
                    </Button>,
                ]}
            >
                {lastDialogError && (
                    <Alert
                        className="dialog-alert"
                        message={lastDialogError}
                        type="error"
                        closable
                        onClose={() => setLastDialogError(null)}
                    />
                )}
                <Form
                    form={phoneForm}
                    layout="horizontal"
                    labelCol={{ span: 10 }}
                    wrapperCol={{ span: 14 }}
                    scrollToFirstError
                >
                    <Form.Item
                        name="phone"
                        label="Телефон"
                        rules={[
                            {
                                required: true,
                                message: 'Пожалуйста, введите номер телефона',
                            },
                        ]}
                    >
                        <MaskedInput
                            disabled={lastDialogError !== null}
                            mask="(000)-000-00-00"
                            onChange={onNumberChange}
                            placeholder="(___)-___-__-__"
                            prefix="+7"
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export { CreateWorkerDialog };
