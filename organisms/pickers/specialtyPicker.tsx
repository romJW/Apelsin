import * as React from 'react';
import { Alert, Button, Col, Modal, Row, Table } from 'antd';
import { useEffect, useState } from 'react';
import { ProfileListResp } from '../../../api/responseModels/profile/profileListResponse';
import { CRMAPIManager } from '../../../classes/crmApiManager';
import { SettingsManager } from '../../../classes/settingsManager';
import { TSpecialty } from '../../../types/specialty';
import { Loader } from '../../atoms/loader';
import { TUser } from '../../../types/user';
import { CreateSpecialtyDialog } from '../dialogs/createSpecialtyDialog';

type TProps = {
    isModalOpen: boolean;
    setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    currentUser: TUser;
    setCurrentUser: React.Dispatch<React.SetStateAction<TUser>>;
    editing: boolean;
};

const SpecialtyPicker = ({
    isModalOpen,
    setIsModalOpen,
    currentUser,
    setCurrentUser,
    editing,
}: TProps): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [specialtyList, setSpecialtyList] = useState<Array<TSpecialty>>([]);
    const [selectedSpecialty, setSelectedSpecialty] = useState<TSpecialty>(null);
    const [lastError, setLastError] = useState<string>(null);
    const [isCreateSpecialtyOpen, setIsCreateSpecialtyOpen] = useState<boolean>(false);

    async function getSpecialtyList() {
        setIsLoading(true);
        try {
            const creds = SettingsManager.getConnectionCredentials();
            const specList = await CRMAPIManager.request<ProfileListResp>(async (api) => {
                return await api.getProfileList(creds.crmID);
            });
            if (specList.errorMessages) throw new Error(specList.errorMessages[0]);
            setSpecialtyList(specList.data.data);
        } catch (err) {
            setLastError(err.message);
        }
        setIsLoading(false);
    }

    function handlePickerOK() {
        setCurrentUser({ ...currentUser, profile: selectedSpecialty });
        setIsModalOpen(false);
    }

    function handlePickerCancel() {
        setIsModalOpen(false);
    }

    useEffect(() => {
        setSelectedSpecialty(currentUser?.profile);
        getSpecialtyList();
    }, []);

    return (
        <div>
            <Modal
                className="specialty-picker"
                title="Выбор профиля"
                open={isModalOpen}
                onOk={handlePickerOK}
                onCancel={handlePickerCancel}
                cancelText="Отмена"
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
                        <Button onClick={getSpecialtyList} type="default">
                            Обновить
                        </Button>
                    </Col>
                    <Col>
                        <Button
                            disabled={!editing}
                            onClick={() => setIsCreateSpecialtyOpen(true)}
                            type="primary"
                        >
                            Создать
                        </Button>
                    </Col>
                </Row>
                <Table
                    className="picker-table"
                    pagination={false}
                    rowSelection={{
                        hideSelectAll: true,
                        selectedRowKeys: selectedSpecialty == null ? [] : [selectedSpecialty.id],
                        type: 'radio',
                        onSelect: (record) => {
                            setSelectedSpecialty(specialtyList.find((sli) => sli.id == record.key));
                        },
                    }}
                    columns={[
                        {
                            title: 'Название',
                            dataIndex: 'name',
                        },
                        {
                            title: 'Код',
                            dataIndex: 'code',
                        },
                    ]}
                    dataSource={specialtyList.map((sli) => {
                        return { ...sli, key: sli.id };
                    })}
                />
            </Modal>
            <CreateSpecialtyDialog
                isModalOpen={isCreateSpecialtyOpen}
                setIsModalOpen={setIsCreateSpecialtyOpen}
                setLastSpecialtyId={null}
                setActivePivot={null}
            />
        </div>
    );
};

export { SpecialtyPicker };
