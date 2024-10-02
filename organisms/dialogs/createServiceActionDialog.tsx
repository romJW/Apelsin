import { Modal, Alert, Form, Input } from 'antd';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { RequestResult } from '../../../api/responseModels/requestResult';
import { ServiceActionResp } from '../../../api/responseModels/service/serviceActionResponse';
import { CRMAPIManager } from '../../../classes/crmApiManager';
import { SettingsManager } from '../../../classes/settingsManager';
import { GlobalConstants } from '../../../constants/global';
import { TServiceAction } from '../../../types/serviceAction';
import { Loader } from '../../atoms/loader';

type TProps = {
    isModalOpen: boolean;
    setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setLastServiceActionId?: React.Dispatch<React.SetStateAction<number>>;
    setActivePivot?: React.Dispatch<React.SetStateAction<string>>;
};

const CreateServiceActionDialog = ({
    isModalOpen,
    setIsModalOpen,
    setLastServiceActionId,
    setActivePivot,
}: TProps): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [lastDialogError, setLastDialogError] = useState<string>(null);
    const [form] = Form.useForm();

    function emptyServiceAction(): TServiceAction {
        return {
            id: -1,
            name: '',
            code: '',
        };
    }

    async function validateServiceAction(): Promise<boolean> {
        let result = true;
        await form.validateFields().catch(() => {
            result = false;
        });
        return result;
    }

    async function addNewServiceAction() {
        if (!(await validateServiceAction())) return;
        setIsLoading(true);
        let sa: RequestResult<ServiceActionResp> = null;
        try {
            const creds = SettingsManager.getConnectionCredentials();
            sa = await CRMAPIManager.request<ServiceActionResp>(async (api) => {
                return await api.saveServiceAction(
                    form.getFieldValue('name'),
                    creds.crmID
                );
            });
            if (sa.errorMessages) throw new Error(sa.errorMessages[0]);
            form.setFieldsValue(emptyServiceAction());
            setLastDialogError(null);
            setIsModalOpen(false);
            if (setLastServiceActionId) setLastServiceActionId(sa.data.data.id);
            if (setActivePivot)
                setActivePivot(
                    GlobalConstants.ActivePivotServiceActionProfileValue
                );
        } catch (err) {
            setLastDialogError(err.message);
        }
        setIsLoading(false);
    }

    function handleDialogCancel() {
        setLastDialogError(null);
        setIsModalOpen(false);
        form.setFieldsValue(emptyServiceAction());
    }

    useEffect(() => {
        form.setFieldsValue(emptyServiceAction());
        setIsLoading(false);
    }, []);

    return (
        <Modal
            className="service-action-dialog"
            title="Новое действие услуги"
            open={isModalOpen}
            onOk={async () => await addNewServiceAction()}
            onCancel={handleDialogCancel}
            cancelText="Отмена"
            zIndex={2000}
        >
            {isLoading && <Loader />}
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
                form={form}
                layout="horizontal"
                labelCol={{ span: 10 }}
                wrapperCol={{ span: 14 }}
                scrollToFirstError
            >
                <Form.Item
                    name="name"
                    label="Название"
                    rules={[
                        {
                            type: 'string',
                            message: 'Допустимо только строковое значение',
                        },
                        {
                            required: true,
                            message:
                                'Пожалуйста, введите название действия услуги',
                        },
                        {
                            min: 3,
                            max: 50,
                            message: 'Введите значение от 3 до 50 символов',
                        },
                    ]}
                >
                    <Input />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export { CreateServiceActionDialog };
