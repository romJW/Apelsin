import { faEdit, faTrashCan, faCopy } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    Alert,
    Button,
    Col,
    Form,
    Input,
    message,
    Modal,
    Popconfirm,
    Row,
    Space,
    Table,
} from 'antd';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { RequisiteListResp } from '../../../api/responseModels/requisite/requisiteListResponse';
import { RequisiteResp } from '../../../api/responseModels/requisite/requisiteResponse';
import { CRMAPIManager } from '../../../classes/crmApiManager';
import { SettingsManager } from '../../../classes/settingsManager';
import { TRequisite } from '../../../types/requisite';
import { TUser } from '../../../types/user';
import { Loader } from '../../atoms/loader';

type TProps = {
    isModalOpen: boolean;
    setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    currentUser: TUser;
    setCurrentUser: React.Dispatch<React.SetStateAction<TUser>>;
    editing: boolean;
};

enum requisiteMode {
    new = 'new',
    edit = 'edit',
    readonly = 'readonly',
}

const RequisitePicker = ({
    isModalOpen,
    setIsModalOpen,
    currentUser,
    setCurrentUser,
    editing,
}: TProps): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [requisiteList, setRequisiteList] = useState<Array<TRequisite>>([]);
    const [lastError, setLastError] = useState<string>(null);
    const [lastDialogError, setLastDialogError] = useState<string>(null);
    const [areRequisitesOpened, setAreRequisitesOpened] = useState<boolean>(false);
    const [editMode, setEditMode] = useState<requisiteMode>();
    const [form] = Form.useForm();

    function emptyRequisite() {
        const creds = SettingsManager.getConnectionCredentials();
        return {
            id: -1,
            crm_id: creds.crmID,
            user_id: creds.userId,
            recipient_bank: '',
            BIK: '',
            bank_account: '',
            correspondent_account: '',
            INN: '',
            KPP: '',
            name: currentUser?.name,
            OGRN: '',
            organization_address: '',
            organization_name: '',
            surname: currentUser?.surname,
            patronymic: currentUser?.patronymic ?? '',
        };
    }

    async function getRequisiteList() {
        setIsLoading(true);
        try {
            const creds = SettingsManager.getConnectionCredentials();
            const reqList = await CRMAPIManager.request<RequisiteListResp>(async (api) => {
                return await api.getRequisiteList(creds.crmID, currentUser.id);
            });
            if (reqList.errorMessages) throw new Error(reqList.errorMessages[0]);
            setRequisiteList(reqList.data.data);
        } catch (err) {
            setLastError(err.message);
        }
        setIsLoading(false);
    }

    async function validateRequisite(): Promise<boolean> {
        let result = true;
        await form.validateFields().catch(() => {
            result = false;
        });
        return result;
    }

    async function addNewRequisite(): Promise<boolean> {
        if (!(await validateRequisite())) return false;
        let result = true;
        setIsLoading(true);
        try {
            const requestData = { ...form.getFieldsValue(true) };
            if (form.getFieldValue('patronymic') === '') {
                delete requestData['patronymic'];
            }
            const req = await CRMAPIManager.request<RequisiteResp>(async (api) => {
                return await api.saveRequisite(requestData);
            });
            if (req.errorMessages) throw new Error(req.errorMessages[0]);
            form.setFieldsValue(emptyRequisite());
            await getRequisiteList();
        } catch (err) {
            setLastDialogError(err.message);
            result = false;
        }
        setIsLoading(false);
        return result;
    }

    async function updateRequisite(): Promise<boolean> {
        if (!(await validateRequisite())) return false;
        let result = true;
        setIsLoading(true);
        try {
            const requestData = { ...form.getFieldsValue(true) };
            if (
                form.getFieldValue('patronymic') === '' ||
                form.getFieldValue('patronymic') === null
            ) {
                delete requestData['patronymic'];
            }
            const req = await CRMAPIManager.request<RequisiteResp>(async (api) => {
                return await api.updateRequisite(requestData);
            });
            if (req.errorMessages) throw new Error(req.errorMessages[0]);
            form.setFieldsValue(emptyRequisite());
            await getRequisiteList();
        } catch (err) {
            setLastDialogError(err.message);
            result = false;
        }
        setIsLoading(false);
        return result;
    }

    async function deleteRequisite(id: number) {
        setIsLoading(true);
        try {
            const creds = SettingsManager.getConnectionCredentials();
            const req = await CRMAPIManager.request<RequisiteResp>(async (api) => {
                return await api.removeRequisite(id, creds.crmID);
            });
            if (req.errorMessages) throw new Error(req.errorMessages[0]);
            await getRequisiteList();
        } catch (err) {
            setLastError(err.message);
        }
        setIsLoading(false);
    }

    async function handlePickerOK() {
        if (editing) setCurrentUser({ ...currentUser, requisites: requisiteList });
        setIsModalOpen(false);
    }

    function handlePickerCancel() {
        setIsModalOpen(false);
    }

    async function handleDialogOk() {
        switch (editMode) {
            case requisiteMode.edit:
                if (await updateRequisite()) {
                    setLastDialogError(null);
                    setAreRequisitesOpened(false);
                    form.setFieldsValue(emptyRequisite());
                }
                break;
            case requisiteMode.new:
                if (await addNewRequisite()) {
                    setLastDialogError(null);
                    setAreRequisitesOpened(false);
                    form.setFieldsValue(emptyRequisite());
                }
                break;
            case requisiteMode.readonly:
                setLastDialogError(null);
                setAreRequisitesOpened(false);
                form.setFieldsValue(emptyRequisite());
                break;
        }
    }

    function setForEdit(e: React.SyntheticEvent, id: number) {
        e.stopPropagation();
        form.setFieldsValue(requisiteList.find((rli) => rli.id == id));
        setEditMode(requisiteMode.edit);
        setAreRequisitesOpened(true);
    }

    function setForAdding() {
        setEditMode(requisiteMode.new);
        setAreRequisitesOpened(true);
    }

    function setForView(id: number) {
        form.setFieldsValue(requisiteList.find((rli) => rli.id == id));
        setEditMode(requisiteMode.readonly);
        setAreRequisitesOpened(true);
    }

    function handleDialogCancel() {
        setLastDialogError(null);
        setAreRequisitesOpened(false);
        form.setFieldsValue(emptyRequisite());
    }

    function renderRequisiteModalTitle() {
        switch (editMode) {
            case requisiteMode.edit:
                return 'Редактирование реквизита';
            case requisiteMode.new:
                return 'Новый реквизит';
            case requisiteMode.readonly:
                return 'Просмотр реквизитов';
        }
    }

    function handleCopyRequisiteButtonClick(item: string) {
        navigator.clipboard
            ?.writeText(item)
            .then(() => message.success('Cкопировано'))
            .catch((err) => {
                message.error(err);
            });
    }

    function handleCopyRequisites(){
        const requisites = { ...form.getFieldsValue(true) };
        const stringify = (text?: string) => text ?? "";
        navigator.clipboard
            ?.writeText(
                'Банк получателя: ' + stringify(requisites.recipient_bank)
                + '\nБИК: ' + stringify(requisites.BIK)
                + '\nРасчётный счёт: ' + stringify(requisites.bank_account)
                + '\nКорресподентский счёт: ' + stringify(requisites.correspondent_account)
                + '\nИНН: ' + stringify(requisites.INN)
                + '\nКПП: ' + stringify(requisites.KPP)
                + '\nОГРН: ' + stringify(requisites.OGRN)
                + '\nАдрес организации: ' + stringify(requisites.organization_address)
                + '\nНазвание организации: ' + stringify(requisites.organization_name)
                + '\nФамилия получателя: ' + stringify(requisites.surname)
                + '\nИмя получателя: ' + stringify(requisites.name)
                + '\nОтчество получателя: ' + stringify(requisites.patronymic)
            ).then(() => message.success('Скопировано'))
            .catch((err) => {
                message.error(err);
            });
    }

    useEffect(() => {
        form.setFieldsValue(emptyRequisite());
        getRequisiteList();
    }, []);

    return (
        <div>
            <Modal
                className="requisite-picker"
                title="Список реквизитов"
                open={isModalOpen}
                onOk={handlePickerOK}
                onCancel={handlePickerCancel}
                cancelText="Отмена"
                wrapClassName="requisites-modal"
                // zIndex={1}
            >
                {isLoading && <Loader />}
                {lastError && (
                    <Alert
                        className="picker-alert"
                        message={lastError}
                        type="error"
                        closable
                        onClose={() => setLastError(null)}
                    />
                )}
                <Row className="picker-controls">
                    <Col>
                        <Button onClick={getRequisiteList} type="default">
                            Обновить
                        </Button>
                    </Col>
                    <Col>
                        <Button disabled={!editing} onClick={setForAdding} type="primary">
                            Создать
                        </Button>
                    </Col>
                </Row>
                <Table
                    className="picker-table"
                    pagination={false}
                    columns={[
                        {
                            title: 'Банк получателя',
                            dataIndex: 'recipient_bank',
                        },
                        {
                            title: 'Имя',
                            dataIndex: 'name',
                        },
                        {
                            title: 'Фамилия',
                            dataIndex: 'surname',
                        },
                        {
                            title: 'Действия',
                            dataIndex: '',
                            render: (_, record) => (
                                <Space size="small">
                                    <Button
                                        disabled={!editing}
                                        shape="circle"
                                        icon={<FontAwesomeIcon icon={faEdit} />}
                                        onClick={(e) => {
                                            setForEdit(e, record.id);
                                        }}
                                    />
                                    <Popconfirm
                                        disabled={!editing}
                                        title="Уверены, что хотите удалить реквизит?"
                                        onConfirm={async () => {
                                            await deleteRequisite(record.id);
                                        }}
                                    >
                                        <Button
                                            disabled={!editing}
                                            shape="circle"
                                            icon={<FontAwesomeIcon icon={faTrashCan} />}
                                        />
                                    </Popconfirm>
                                </Space>
                            ),
                        },
                    ]}
                    dataSource={requisiteList.map((sli) => {
                        return { ...sli, key: sli.id };
                    })}
                    onRow={(record) => {
                        return {
                            onClick: () => setForView(record.id),
                        };
                    }}
                    rowClassName="requisites-modal__row"
                />
            </Modal>
            <Modal
                className="requisite-editor"
                title={renderRequisiteModalTitle()}
                open={areRequisitesOpened}
                onOk={handleDialogOk}
                onCancel={handleDialogCancel}
                cancelText="Отмена"
                // zIndex={2000}
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
                <Button 
                    className="copy-all-btn round-button" 
                    onClick={() => handleCopyRequisites()} 
                    style={{margin: "3px 0"}}
                    type="primary"
                >
                    Копировать всё
                </Button>
                <Form
                    form={form}
                    layout="horizontal"
                    labelCol={{ span: 10 }}
                    wrapperCol={{ span: 14 }}
                    scrollToFirstError
                    disabled={editMode === requisiteMode.readonly}
                >
                    <Row className="flex-row-nowrap">
                        <Col style={{ flexGrow: 1 }}>
                            <Form.Item
                                name="recipient_bank"
                                label="Банк получателя"
                                rules={[
                                    {
                                        type: 'string',
                                        message: 'Допустимо только строковое значение',
                                    },
                                    {
                                        required: true,
                                        message: 'Пожалуйста, введите банк получателя',
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
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                shape="circle"
                                icon={<FontAwesomeIcon icon={faCopy} />}
                                disabled={false}
                                style={{ marginLeft: 5 }}
                                onClick={() =>
                                    handleCopyRequisiteButtonClick(
                                        form.getFieldValue('recipient_bank')
                                    )
                                }
                            />
                        </Col>
                    </Row>
                    <Row className="flex-row-nowrap">
                        <Col style={{ flexGrow: 1 }}>
                            <Form.Item
                                name="BIK"
                                label="БИК"
                                rules={[
                                    {
                                        type: 'string',
                                        pattern: /^\d{9}$/,
                                        message: 'Введите 9-значный БИК',
                                        required: true,
                                    },
                                ]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                shape="circle"
                                icon={<FontAwesomeIcon icon={faCopy} />}
                                disabled={false}
                                style={{ marginLeft: 5 }}
                                onClick={() =>
                                    handleCopyRequisiteButtonClick(form.getFieldValue('BIK'))
                                }
                            />
                        </Col>
                    </Row>
                    <Row className="flex-row-nowrap">
                        <Col style={{ flexGrow: 1 }}>
                            <Form.Item
                                name="bank_account"
                                label="Расчётный счёт"
                                rules={[
                                    {
                                        type: 'string',
                                        pattern: /^\d{20}$/,
                                        message: 'Введите 20-значный расчётный счёт',
                                        required: true,
                                    },
                                ]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                shape="circle"
                                icon={<FontAwesomeIcon icon={faCopy} />}
                                disabled={false}
                                style={{ marginLeft: 5 }}
                                onClick={() =>
                                    handleCopyRequisiteButtonClick(
                                        form.getFieldValue('bank_account')
                                    )
                                }
                            />
                        </Col>
                    </Row>
                    <Row className="flex-row-nowrap">
                        <Col style={{ flexGrow: 1 }}>
                            <Form.Item
                                name="correspondent_account"
                                label="Корреспондентский счёт"
                                rules={[
                                    {
                                        type: 'string',
                                        pattern: /^\d{20}$/,
                                        message: 'Введите 20-значный корреспондентский счёт',
                                        required: true,
                                    },
                                ]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                shape="circle"
                                icon={<FontAwesomeIcon icon={faCopy} />}
                                disabled={false}
                                style={{ marginLeft: 5 }}
                                onClick={() =>
                                    handleCopyRequisiteButtonClick(
                                        form.getFieldValue('correspondent_account')
                                    )
                                }
                            />
                        </Col>
                    </Row>
                    <Row className="flex-row-nowrap">
                        <Col style={{ flexGrow: 1 }}>
                            <Form.Item
                                name="INN"
                                label="ИНН"
                                rules={[
                                    {
                                        type: 'string',
                                        pattern: /^\d{10,12}$/,
                                        message: 'Введите ИНН (10-12 цифр)',
                                        required: true,
                                    },
                                ]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                shape="circle"
                                icon={<FontAwesomeIcon icon={faCopy} />}
                                disabled={false}
                                style={{ marginLeft: 5 }}
                                onClick={() =>
                                    handleCopyRequisiteButtonClick(form.getFieldValue('INN'))
                                }
                            />
                        </Col>
                    </Row>
                    <Row className="flex-row-nowrap">
                        <Col style={{ flexGrow: 1 }}>
                            <Form.Item
                                name="KPP"
                                label="КПП"
                                rules={[
                                    {
                                        type: 'string',
                                        pattern: /^\d{9}$/,
                                        message: 'Введите 9-значный КПП',
                                        required: true,
                                    },
                                ]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                shape="circle"
                                icon={<FontAwesomeIcon icon={faCopy} />}
                                disabled={false}
                                style={{ marginLeft: 5 }}
                                onClick={() =>
                                    handleCopyRequisiteButtonClick(form.getFieldValue('KPP'))
                                }
                            />
                        </Col>
                    </Row>
                    <Row className="flex-row-nowrap">
                        <Col style={{ flexGrow: 1 }}>
                            <Form.Item
                                name="OGRN"
                                label="ОГРН"
                                rules={[
                                    {
                                        type: 'string',
                                        pattern: /^\d{13}$/,
                                        message: 'Введите 13-значный ОГРН',
                                        required: true,
                                    },
                                ]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                shape="circle"
                                icon={<FontAwesomeIcon icon={faCopy} />}
                                disabled={false}
                                style={{ marginLeft: 5 }}
                                onClick={() =>
                                    handleCopyRequisiteButtonClick(form.getFieldValue('OGRN'))
                                }
                            />
                        </Col>
                    </Row>
                    <Row className="flex-row-nowrap">
                        <Col style={{ flexGrow: 1 }}>
                            <Form.Item
                                name="organization_address"
                                label="Адрес организации"
                                rules={[
                                    {
                                        type: 'string',
                                        message: 'Допустимо только строковое значение',
                                    },
                                    {
                                        required: true,
                                        message: 'Пожалуйста, введите адрес организации',
                                    },
                                    {
                                        min: 3,
                                        max: 255,
                                        message: 'Введите значение от 3 до 255 символов',
                                    },
                                ]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                shape="circle"
                                icon={<FontAwesomeIcon icon={faCopy} />}
                                disabled={false}
                                style={{ marginLeft: 5 }}
                                onClick={() =>
                                    handleCopyRequisiteButtonClick(
                                        form.getFieldValue('organization_address')
                                    )
                                }
                            />
                        </Col>
                    </Row>
                    <Row className="flex-row-nowrap">
                        <Col style={{ flexGrow: 1 }}>
                            <Form.Item
                                name="organization_name"
                                label="Название организации"
                                rules={[
                                    {
                                        type: 'string',
                                        message: 'Допустимо только строковое значение',
                                    },
                                    {
                                        required: true,
                                        message: 'Пожалуйста, введите название организации',
                                    },
                                    {
                                        min: 3,
                                        max: 100,
                                        message: 'Введите значение от 3 до 100 символов',
                                    },
                                ]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                shape="circle"
                                icon={<FontAwesomeIcon icon={faCopy} />}
                                disabled={false}
                                style={{ marginLeft: 5 }}
                                onClick={() =>
                                    handleCopyRequisiteButtonClick(
                                        form.getFieldValue('organization_name')
                                    )
                                }
                            />
                        </Col>
                    </Row>
                    <Row className="flex-row-nowrap">
                        <Col style={{ flexGrow: 1 }}>
                            <Form.Item
                                name="surname"
                                label="Фамилия получателя"
                                rules={[
                                    {
                                        type: 'string',
                                        message: 'Допустимо только строковое значение',
                                    },
                                    {
                                        required: true,
                                        message: 'Пожалуйста, введите фамилию получателя',
                                    },
                                    {
                                        min: 1,
                                        max: 50,
                                        message: 'Введите значение от 1 до 50 символов',
                                    },
                                ]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                shape="circle"
                                icon={<FontAwesomeIcon icon={faCopy} />}
                                disabled={false}
                                style={{ marginLeft: 5 }}
                                onClick={() =>
                                    handleCopyRequisiteButtonClick(form.getFieldValue('surname'))
                                }
                            />
                        </Col>
                    </Row>
                    <Row className="flex-row-nowrap">
                        <Col style={{ flexGrow: 1 }}>
                            <Form.Item
                                name="name"
                                label="Имя получателя"
                                rules={[
                                    {
                                        type: 'string',
                                        message: 'Допустимо только строковое значение',
                                    },
                                    {
                                        required: true,
                                        message: 'Пожалуйста, введите имя получателя',
                                    },
                                    {
                                        min: 1,
                                        max: 50,
                                        message: 'Введите значение от 1 до 50 символов',
                                    },
                                ]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                shape="circle"
                                icon={<FontAwesomeIcon icon={faCopy} />}
                                disabled={false}
                                style={{ marginLeft: 5 }}
                                onClick={() =>
                                    handleCopyRequisiteButtonClick(form.getFieldValue('name'))
                                }
                            />
                        </Col>
                    </Row>
                    <Row className="flex-row-nowrap">
                        <Col style={{ flexGrow: 1 }}>
                            <Form.Item
                                name="patronymic"
                                label="Отчество получателя"
                                rules={[
                                    {
                                        type: 'string',
                                        message: 'Допустимо только строковое значение',
                                    },
                                    {
                                        min: 1,
                                        max: 50,
                                        message: 'Введите значение от 1 до 50 символов',
                                    },
                                ]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                shape="circle"
                                icon={<FontAwesomeIcon icon={faCopy} />}
                                disabled={false}
                                style={{ marginLeft: 5 }}
                                onClick={() =>
                                    handleCopyRequisiteButtonClick(form.getFieldValue('patronymic'))
                                }
                            />
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
};

export { RequisitePicker };
