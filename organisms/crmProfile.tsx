import {
    faBarcode,
    faBars,
    faCheck,
    faEdit,
    faHouse,
    faListCheck,
    faScrewdriverWrench,
    faUsersGear,
    faUserTie,
    faWandMagicSparkles,
    faXmark,
    faUserPlus,
    faUser,
    faTableList,
    faDollar,
    faBook,
    faBell,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Breadcrumb, Button, Col, Dropdown, Input, Row, Progress, Modal } from 'antd';
import { GlobalConstants } from '@constants/global';
import { useEffect, useState } from 'react';
import { CRMResp } from '../../api/responseModels/crm/crmResponse';
import { CRMTotalResp } from '../../api/responseModels/crm/crmTotalResponse';
import { UserResp } from '../../api/responseModels/user/userResponse';
import { Common } from '../../classes/commonMethods';
import { CRMAPIManager } from '../../classes/crmApiManager';
import { messageService } from '../../classes/messageService';
import { SettingsManager } from '../../classes/settingsManager';
import { TCRM } from '../../types/crm';
import { TCRMTotal } from '../../types/crmTotal';
import { TUser } from '../../types/user';
import { Loader } from '../atoms/loader';
import { useNavigate, useLocation } from 'react-router-dom';
import { LastIdStore } from '@pages/lastIdStore';

const CRMProfile = (): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [currentCrm, setCurrentCrm] = useState<TCRM>();
    const [currentCrmOwner, setCurrentCrmOwner] = useState<TUser>();
    const [currentTotal, setCurrentTotal] = useState<TCRMTotal>();
    const [editing, setEditing] = useState<boolean>(false);
    const navigate = useNavigate();
    const creds = SettingsManager.getConnectionCredentials();
    const location = useLocation();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const NotificationElem = ({ notification }) => {
        const [isRead, setIsRead] = useState(false);
        return (
            <div
                key={notification.date}
                className={isRead ? 'notification-box notification-isRead' : 'notification-box'}
                onClick={() => {
                    setTimeout(()=>{
                        navigate(`/lk/worker/crm/${creds.crmID}/notifications/${notification.id}`);  
                    },1000)
                    setIsRead(true);
                    
                }}
            >
                <div>{notification.message}</div>
                <div>{notification.date}</div>
            </div>
        );
    };
    const notifications = [
        { message: 'hello', date: '25.07.2022',id:1 },
        { message: 'hello', date: '25.07.2022',id:2 },
        { message: 'hello', date: '25.07.2022',id:3 },
        { message: 'hello', date: '25.07.2022',id:4 },
        { message: 'hello', date: '25.07.2022',id:5 },
        { message: 'hello', date: '25.07.2022',id:6 },
        { message: 'hello', date: '25.07.2022',id:7 },
    ];
    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleOk = () => {
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };
    function checkCurrentUrl() {
        if (location.search.includes('edit')) setEditing(true);
    }

    async function getCRM() {
        try {
            const creds = SettingsManager.getConnectionCredentials();
            const crm = await CRMAPIManager.request<CRMResp>(async (api) => {
                return await api.getCRM(creds.crmID);
            });
            if (crm.errorMessages) throw crm.errorMessages;
            setCurrentCrm(crm.data.data);
            const owner = await CRMAPIManager.request<UserResp>(async (api) => {
                return await api.getUser(crm.data.data.owner_user_id, creds.crmID);
            });
            if (owner.errorMessages) throw owner.errorMessages;
            setCurrentCrmOwner(owner.data.data);
            const total = await CRMAPIManager.request<CRMTotalResp>(async (api) => {
                return await api.getCRMTotal(creds.crmID);
            });
            if (total.errorMessages) throw total.errorMessages;
            setCurrentTotal(total.data.data);
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
    }

    function transformToGB(size: number) {
        return (size / 1073741824).toFixed(2);
    }

    function handleEditing() {
        setEditing(true);
        navigate(`/lk/worker/crm/${creds.crmID}/edit`);
    }

    async function handleSaveEditing() {
        setIsLoading(true);
        setEditing(false);
        try {
            const creds = SettingsManager.getConnectionCredentials();
            const crm = await CRMAPIManager.request<CRMResp>(async (api) => {
                return await api.updateCRM(
                    creds.crmID,
                    currentCrm.organization_name,
                    currentCrm.description
                );
            });
            if (crm.errorMessages) throw crm.errorMessages;
            setCurrentCrm(crm.data.data);
            const total = await CRMAPIManager.request<CRMTotalResp>(async (api) => {
                return await api.getCRMTotal(creds.crmID);
            });
            if (total.errorMessages) throw total.errorMessages;
            setCurrentTotal(total.data.data);
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
        navigate(`/lk/worker/crm/${creds.crmID}`);
    }

    async function handleAbortEditing() {
        navigate(`/lk/worker/crm/${creds.crmID}`);
        setIsLoading(true);
        setEditing(false);
        await getCRM();
        setIsLoading(false);
    }

    function beforeCrmMount() {
        setIsLoading(true);
        getCRM().then(() => {
            checkCurrentUrl();
            Common.checkUserBelongToCrm(GlobalConstants.CrmOrderinUrl).then((res) => {
                if (!res) navigate(`/lk`);
            });
        });
        setIsLoading(false);
    }

    useEffect(() => {
        beforeCrmMount();
    }, []);

    return (
        <div id="app-crm-profile">
            {isLoading && <Loader />}
            {!isLoading && (
                <>
                    <div className="functional-container">
                        <Dropdown.Button
                            className="functional-menu"
                            icon={<FontAwesomeIcon icon={faBars} />}
                            menu={{
                                items: editing
                                    ? [
                                          {
                                              key: 'save',
                                              label: 'Сохранить',
                                              icon: <FontAwesomeIcon icon={faCheck} />,
                                              onClick: handleSaveEditing,
                                          },
                                          {
                                              key: 'abort',
                                              label: 'Отменить',
                                              icon: <FontAwesomeIcon icon={faXmark} />,
                                              onClick: handleAbortEditing,
                                          },
                                      ]
                                    : [
                                          {
                                              key: 'edit',
                                              label: 'Редактировать',
                                              icon: <FontAwesomeIcon icon={faEdit} />,
                                              onClick: handleEditing,
                                          },
                                      ],
                            }}
                            placement="topRight"
                            type={editing ? 'primary' : 'default'}
                        />
                    </div>
                    <Row className="breadcrumb-header">
                        <Col className="header-location">
                            <span>Профиль CRM</span>
                        </Col>
                    </Row>
                    <Row className="breadcrumbs-controls">
                        <Col className="breadcrumbs">
                            <Breadcrumb>
                                <Breadcrumb.Item
                                    onClick={() => navigate(`/lk/worker/crm/${creds.crmID}`)}
                                ></Breadcrumb.Item>
                                <FontAwesomeIcon icon={faHouse} />
                                <span className="crumb-name">CRM</span>
                            </Breadcrumb>
                        </Col>
                    </Row>
                    <div className="crm-description">
                        <div className="crm-description-header">
                            {editing ? (
                                <Input
                                    value={currentCrm?.organization_name}
                                    onChange={(e) =>
                                        setCurrentCrm({
                                            ...currentCrm,
                                            organization_name: e.target.value,
                                        })
                                    }
                                />
                            ) : (
                                <h3>{currentCrm?.organization_name}</h3>
                            )}
                            <FontAwesomeIcon
                                icon={faBell}
                                onClick={showModal}
                                style={{ color: '#ff9100' }}
                            />
                            <Modal
                                title="Уведомления"
                                open={isModalOpen}
                                onOk={handleOk}
                                closable={false}
                                footer={null}
                                onCancel={handleCancel}
                                bodyStyle={{ height: '200px', overflow: 'auto' }}
                                style={{ maxWidth: '300px', height: '200px', borderRadius: '40px' }}
                            >
                                <div className="modal-notification-box">
                                    {notifications.map((notification) => {
                                        return (
                                            <NotificationElem
                                                key={notification}
                                                notification={notification}
                                            />
                                        );
                                    })}
                                </div>
                            </Modal>
                        </div>
                        <h4>Создана: {Common.formatDate(currentCrm?.created_at)}</h4>
                        <p>
                            Владелец:{' '}
                            <a
                                onClick={() => {
                                    LastIdStore.setLastUserId(currentCrm?.owner_user_id);
                                    navigate(
                                        `/lk/worker/crm/${creds?.crmID}/workers/${currentCrm.owner_user_id}`
                                    );
                                }}
                            >
                                {currentCrmOwner?.name + ' ' + currentCrmOwner?.surname}
                            </a>
                        </p>
                        <p>
                            Описание:{' '}
                            {editing ? (
                                <Input
                                    value={currentCrm?.description}
                                    onChange={(e) =>
                                        setCurrentCrm({
                                            ...currentCrm,
                                            description: e.target.value,
                                        })
                                    }
                                />
                            ) : (
                                <span>{currentCrm?.description ?? 'отсутствует'}</span>
                            )}
                        </p>
                        <Row align={'bottom'}>
                            <Col span={10}>
                                <p>Занято пространства файлами:</p>
                                <strong>
                                    {transformToGB(currentCrm?.space_filled)}GB /{' '}
                                    {transformToGB(currentCrm?.space_size_limit)}GB
                                </strong>
                            </Col>
                            <Col span={14}>
                                <Progress
                                    percent={Math.round(currentCrm?.space_filled_percent)}
                                    strokeColor={'#1677ff'}
                                />
                            </Col>
                        </Row>
                    </div>

                    <div className="nav-block">
                        <Button
                            block
                            className="nav-button round-button"
                            icon={<FontAwesomeIcon icon={faUserPlus} />}
                            onClick={() => navigate(`/lk/worker/crm/${creds.crmID}/invitations`)}
                        >
                            <span>Приглашения</span>
                            <span className="nav-button__quantity">
                                {currentTotal && ` (${currentTotal.invitations_quantity}) `}
                            </span>
                        </Button>
                        <Button
                            block
                            className="nav-button round-button"
                            icon={<FontAwesomeIcon icon={faUserTie} />}
                            onClick={() => navigate(`/lk/worker/crm/${creds.crmID}/workers`)}
                        >
                            <span>Сотрудники</span>
                            <span className="nav-button__quantity">
                                {currentTotal && ` (${currentTotal.workers_quantity}) `}
                            </span>
                        </Button>
                        <Button
                            block
                            className="nav-button round-button"
                            icon={<FontAwesomeIcon icon={faUser} />}
                            onClick={() => navigate(`/lk/worker/crm/${creds.crmID}/customers`)}
                        >
                            <span>Клиенты</span>
                            <span className="nav-button__quantity">
                                {currentTotal && ` (${currentTotal?.customers_quantity}) `}
                            </span>
                        </Button>
                        <Button
                            block
                            className="nav-button round-button"
                            icon={<FontAwesomeIcon icon={faUsersGear} />}
                            onClick={() => navigate(`/lk/worker/crm/${creds.crmID}/specialties`)}
                        >
                            <span>Профили</span>
                            <span className="nav-button__quantity">
                                {currentTotal && ` (${currentTotal.profiles_quantity}) `}
                            </span>
                        </Button>
                        <Button
                            block
                            className="nav-button round-button"
                            icon={<FontAwesomeIcon icon={faTableList} />}
                            onClick={() => navigate(`/lk/worker/crm/${creds.crmID}/orders`)}
                        >
                            <span>Заказы</span>
                            {/* <span className="nav-button__quantity">
                                {currentTotal && ` (${currentTotal.profiles_quantity}) `}
                            </span> */}
                        </Button>
                        <Button
                            block
                            className="nav-button round-button"
                            icon={<FontAwesomeIcon icon={faListCheck} />}
                            onClick={() =>
                                navigate(`/lk/worker/crm/${creds.crmID}/product-category`)
                            }
                        >
                            <span>Категории товаров</span>
                            <span className="nav-button__quantity">
                                {currentTotal && ` (${currentTotal.products_categories_quantity}) `}
                            </span>
                        </Button>
                        <Button
                            block
                            className="nav-button round-button"
                            icon={<FontAwesomeIcon icon={faBarcode} />}
                            onClick={() => {
                                LastIdStore.setLastProductCategoryId(null);
                                navigate(`/lk/worker/crm/${creds.crmID}/products`);
                            }}
                        >
                            <span>Товары</span>
                            <span className="nav-button__quantity">
                                {currentTotal && ` (${currentTotal.products_quantity}) `}
                            </span>
                        </Button>
                        <Button
                            block
                            className="nav-button round-button"
                            icon={<FontAwesomeIcon icon={faWandMagicSparkles} />}
                            onClick={() =>
                                navigate(`/lk/worker/crm/${creds.crmID}/service-categories`)
                            }
                        >
                            <span>Категории услуг</span>
                            <span className="nav-button__quantity">
                                {currentTotal && ` (${currentTotal.service_categories_quantity}) `}
                            </span>
                        </Button>
                        <Button
                            block
                            className="nav-button round-button"
                            icon={<FontAwesomeIcon icon={faScrewdriverWrench} />}
                            onClick={() => {
                                LastIdStore.setLastServiceCategoryId(null);
                                navigate(`/lk/worker/crm/${creds.crmID}/services`);
                            }}
                        >
                            <span>Услуги</span>
                            <span className="nav-button__quantity">
                                {currentTotal && ` (${currentTotal.services_quantity}) `}
                            </span>
                        </Button>
                        <Button
                            block
                            className="nav-button round-button"
                            icon={<FontAwesomeIcon icon={faDollar} />}
                            onClick={() => {
                                navigate(`/lk/worker/crm/${creds.crmID}/transactions`);
                            }}
                        >
                            <span>Транзакции</span>
                        </Button>
                        <Button
                            block
                            className="nav-button round-button"
                            icon={<FontAwesomeIcon icon={faBook} />}
                            onClick={() => {
                                navigate(`/lk/worker/crm/${creds.crmID}/logs`);
                            }}
                        >
                            <span>Журнал</span>
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};

export { CRMProfile };
