import { faBars, faCheck, faEdit, faXmark, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { HeaderListBreadcrumbs } from '@molecules/breadcrumbs/listsBreadcrumbs/HeaderListBreadcrumbs';
import { OptionsMenu } from '@molecules/OptionsMenu';
import { Button, Dropdown, Form, Input, Modal, Space, Pagination } from 'antd';
import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserResp } from '@api/responseModels/user/userResponse';
import { CRMAPIManager } from '@classes/crmApiManager';
import { messageService } from '@classes/messageService';
import { SettingsManager } from '@classes/settingsManager';
import { TUser } from 'types/user';
import { Loader } from '@atoms/loader';
import { NotificationFilter } from '@organisms/notificationFilter/notificationFilter';
import { LastIdStore } from '@pages/lastIdStore';
import { observer } from 'mobx-react';
import { debounce } from '../../../utils/functions';
import { FilterStore } from '@organisms/customersFilter/filterStore';

const notifications = [
    { message: 'hello', date: '25.07.2022', id: 1 },
    { message: 'hello', date: '25.07.2022', id: 2 },
    { message: 'hello', date: '25.07.2022', id: 3 },
    { message: 'hello', date: '25.07.2022', id: 4 },
    { message: 'hello', date: '25.07.2022', id: 5 },
    { message: 'hello', date: '25.07.2022', id: 6 },
    { message: 'hello', date: '25.07.2022', id: 7 },
];
const filterStore = new FilterStore();
const filter = filterStore.filter;
const NotificationList = observer((): JSX.Element => {
    const userId = LastIdStore.lastUserId;
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [user, setUser] = useState<TUser>(null);
    const [currentUser, setCurrentUser] = useState(null);
    const isForInvitation = useRef<boolean>(null);
    const [editing, setEditing] = useState<boolean>(false);
    const numberValid = useRef(false);
    const [numberValue, setNumberValue] = useState<string>('');
    const [isUserProfile, setUserProfile] = useState<boolean>(false);
    const [currentMeta, setCurrentMeta] = useState<TMetadata>(null);
    /// Навигация
    const currentID = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const urlArr = location.pathname.split('/');

    /// Транзакции
    const [transactionOpen, setTransactionOpen] = useState<boolean>(false);
    const [transactionType, setTransactionType] = useState<'Пополнение' | 'Списание'>('Пополнение');
    const [transactionAmount, setTransactionAmount] = useState<number>(0);
    const creds = SettingsManager.getConnectionCredentials();
    const phoneMask = /^[0-9]{10}$/;
    const emailMask =
        /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/iu;
    const handleSearchChange = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
        filterStore.changeQuery(e.target.value);
    }, 500);
    async function getUser() {
        setIsLoading(true);
        try {
            const creds = SettingsManager.getConnectionCredentials();
            const tuser = await CRMAPIManager.request<UserResp>(async (api) => {
                if (creds.userId === userId || location.pathname.includes('profile')) {
                    setUserProfile(true);
                    return await api.currentUser();
                } else {
                    return await api.getUser(
                        userId || currentID.current || creds.userId,
                        creds.crmID
                    );
                }
            });
            if (tuser.errorMessages) throw tuser.errorMessages;
            setUser(tuser.data.data);
            setCurrentUser(creds.userId);
            setNumberValue(tuser.data.data.phone);
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
    }

    async function handleEditing() {
        try {
            if (location.pathname.includes('profile')) navigate(`/lk/worker/profile/edit`);
            else {
                navigate(
                    `/lk/worker/crm/${creds.crmID}/workers/${user.id || currentID.current}/edit`
                );
            }

            setEditing(true);
            numberValid.current = phoneMask.test(numberValue);
            const tuser = await CRMAPIManager.request<UserResp>(async (api) => {
                if (creds.userId === userId || location.pathname.includes('profile')) {
                    setUserProfile(true);
                    return await api.currentUser();
                } else {
                    return await api.getUser(userId || currentID.current, creds.crmID);
                }
            });
            if (tuser.errorMessages) throw tuser.errorMessages;
            setUser(tuser.data.data);
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
    }

    async function getNotification() {
        const notifications = await CRMAPIManager.request(async (api) => {
            return await api.getListNotification(creds.crmID);
        });
        console.log(notifications, creds.crmID);
    }
    useEffect(() => {
        getNotification();
    }, []);
    const NotificationElem = ({ notification }) => {
        const [isRead, setIsRead] = useState(false);
        return (
            <>
                <div className="notification-card">
                    <div className="notification-icon">
                        <i className="fa fa-bell"></i>
                    </div>
                    <div className="notification-content">
                        <h3>Notification Title</h3>
                        <p className="notification-date">{notification.date}</p>
                        <p>
                        {notification.message}
                        </p>
                        <a href="#" className="read-more" onClick={() => {
                        setTimeout(() => {
                            navigate(
                                `/lk/worker/crm/${creds.crmID}/notifications/${notification.id}`
                            );
                        }, 1000);
                        setIsRead(true);
                    }}>
                            Read more
                        </a>
                    </div>
                </div>
            </>
        );
    };
    return (
        <div id="app-worker-list">
            {isLoading && <Loader />}
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
                                      onClick: async () => {
                                          await handleSaveEditing();
                                      },
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
            <HeaderListBreadcrumbs
                dataTotal={currentMeta?.total}
                title={'Уведомления'}
                dataTitle={'Уведомления'}
                dataIcon={faUser}
                dataPrice={null}
                flag={false}
                isProduct={false}
                categoryPath={null}
                openCategoryCard={null}
                onSearch={handleSearchChange}
                searchPlaceHolder="По уведомлениям"
            >
                <Space>
                    <NotificationFilter store={filterStore} />
                    <OptionsMenu />
                </Space>
            </HeaderListBreadcrumbs>
            <div className="notification-list-box">
            {notifications.map((notification) => {
                return <NotificationElem key={notification} notification={notification} />;
            })}
            </div>
            <Pagination
                defaultCurrent={1}
                showSizeChanger={false}
                total={currentMeta?.total ?? 1}
            />
        </div>
    );
});

export { NotificationList };
