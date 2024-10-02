import * as React from 'react';
import { Alert, Button, Col, Modal, Row, Table } from 'antd';
import { useEffect, useState } from 'react';
import { CRMAPIManager } from '../../../classes/crmApiManager';
import { SettingsManager } from '../../../classes/settingsManager';
import { Loader } from '../../atoms/loader';
import { TServiceAction } from '../../../types/serviceAction';
import { ServiceActionListResp } from '../../../api/responseModels/service/serviceActionListResponse';
import { TService } from '../../../types/service';
import { CreateServiceActionDialog } from '../dialogs/createServiceActionDialog';

type TProps = {
    isModalOpen: boolean;
    setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    currentService: TService;
    setCurrentService: React.Dispatch<React.SetStateAction<TService>>;
    editing: boolean;
};

const ServiceActionPicker = ({
    isModalOpen,
    setIsModalOpen,
    currentService,
    setCurrentService,
    editing,
}: TProps): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [serviceActionList, setServiceActionList] = useState<
        Array<TServiceAction>
    >([]);
    const [selectedServiceAction, setSelectedServiceAction] =
        useState<TServiceAction>(null);
    const [lastError, setLastError] = useState<string>(null);
    const [isCreateServiceActionOpen, setIsCreateServiceActionOpen] =
        useState<boolean>(false);

    async function getServiceActionList() {
        setIsLoading(true);
        try {
            const creds = SettingsManager.getConnectionCredentials();
            const serActList =
                await CRMAPIManager.request<ServiceActionListResp>(
                    async (api) => {
                        return await api.getServiceActionList(creds.crmID);
                    }
                );
            if (serActList.errorMessages)
                throw new Error(serActList.errorMessages[0]);
            setServiceActionList(serActList.data.data);
        } catch (err) {
            setLastError(err.message);
        }
        setIsLoading(false);
    }

    function handlePickerOK() {
        setCurrentService({
            ...currentService,
            // service_action_id: selectedServiceAction.id,
        });
        setIsModalOpen(false);
    }

    function handlePickerCancel() {
        setIsModalOpen(false);
    }

    // useEffect(() => {
    //     getServiceActionList().then(() => {
    //         setSelectedServiceAction(
    //             currentService.service_action_id
    //                 ? serviceActionList.find(
    //                     (sa) => sa.id == currentService.service_action_id
    //                 )
    //                 : null
    //         );
    //     });
    // }, []);

    return (
        <div>
            <Modal
                className="service-action-picker"
                title="Выбор действия услуги"
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
                        <Button onClick={getServiceActionList} type="default">
                            Обновить
                        </Button>
                    </Col>
                    <Col>
                        <Button
                            disabled={!editing}
                            onClick={() => setIsCreateServiceActionOpen(true)}
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
                        selectedRowKeys:
                            selectedServiceAction == null
                                ? []
                                : [selectedServiceAction.id],
                        type: 'radio',
                        onSelect: (record) => {
                            setSelectedServiceAction(
                                serviceActionList.find(
                                    (sli) => sli.id == record.key
                                )
                            );
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
                    dataSource={serviceActionList.map((sli) => {
                        return { ...sli, key: sli.id };
                    })}
                />
            </Modal>
            <CreateServiceActionDialog
                isModalOpen={isCreateServiceActionOpen}
                setIsModalOpen={setIsCreateServiceActionOpen}
                setLastServiceActionId={null}
                setActivePivot={null}
            />
        </div>
    );
};

export { ServiceActionPicker };
