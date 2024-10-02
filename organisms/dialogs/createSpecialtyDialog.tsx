import { Modal, Alert, Form, Input } from 'antd';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ProfileResp } from '../../../api/responseModels/profile/profileResponse';
import { RequestResult } from '../../../api/responseModels/requestResult';
import { CRMAPIManager } from '../../../classes/crmApiManager';
import { SettingsManager } from '../../../classes/settingsManager';
import { TSpecialty } from '../../../types/specialty';
import { Loader } from '../../atoms/loader';
import { LastIdStore } from '@pages/lastIdStore';

type TProps = {
    isModalOpen: boolean;
    setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const CreateSpecialtyDialog = ({
    isModalOpen,
    setIsModalOpen,
}: TProps): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [lastDialogError, setLastDialogError] = useState<string>(null);
    const [form] = Form.useForm();
    const navigate = useNavigate();

    function emptySpecialty(): TSpecialty {
        return {
            id: -1,
            name: '',
            code: '',
        };
    }

    async function validateSpecialty(): Promise<boolean> {
        let result = true;
        await form.validateFields().catch(() => {
            result = false;
        });
        return result;
    }

    async function addNewSpecialty() {
        if (!(await validateSpecialty())) return;
        setIsLoading(true);
        let prof: RequestResult<ProfileResp> = null;
        try {
            const creds = SettingsManager.getConnectionCredentials();
            prof = await CRMAPIManager.request<ProfileResp>(async (api) => {
                return await api.saveProfile(
                    form.getFieldValue('name'),
                    creds.crmID
                );
            });
            if (prof.errorMessages) throw new Error(prof.errorMessages[0]);
            form.setFieldsValue(emptySpecialty());
            setLastDialogError(null);
            setIsModalOpen(false);
            LastIdStore.setLastSpecialtyId(prof.data.data.id);
            navigate(`/lk/worker/crm/${creds.crmID}/specialties/${prof.data.data.id}`);
        } catch (err) {
            setLastDialogError(err.message);
        }
        setIsLoading(false);
    }

    function handleDialogCancel() {
        setLastDialogError(null);
        setIsModalOpen(false);
        form.setFieldsValue(emptySpecialty());
    }

    useEffect(() => {
        form.setFieldsValue(emptySpecialty());
        setIsLoading(false);
    }, []);

    return (
        <Modal
            className="specialty-dialog"
            title="Новый профиль"
            open={isModalOpen}
            onOk={async () => await addNewSpecialty()}
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
                            message: 'Пожалуйста, введите название профиля',
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

export { CreateSpecialtyDialog };
