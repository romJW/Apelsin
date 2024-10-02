import {
    faBars,
    faCheck,
    faEdit,
    faMessage,
    faMinus,
    faPhone,
    faPlus,
    faUser,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Col, Dropdown, Row, Tooltip } from 'antd';
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserResp } from '@api/responseModels/user/userResponse';
import { CRMAPIManager } from '@classes/crmApiManager';
import { messageService } from '@classes/messageService';
import { SettingsManager } from '@classes/settingsManager';
import { TUser } from 'types/user';
import { Loader } from '@atoms/loader';
import { ProfileInfoCard } from '@molecules/profileInfoCard';
import { InvitationResp } from '@api/responseModels/invitation/invitationResponse';
import { sendRequest } from '@api/sendRequest';
import { TCredentials } from 'types/credentials';
import { ImgUploader } from '../imgUploader/imgUploader';
import { CustomerProfileResp } from '@api/responseModels/customer/customerProfileResponse';
import { HeaderBreadcrumbProfiles } from '@molecules/breadcrumbs/profilesBreadcrumbs/HeaderProfilesBreadcrumb';
import { Common } from '@classes/commonMethods';
import { GlobalConstants } from '@constants/global';
import { LastIdStore } from '@pages/lastIdStore';

const CustomerProfile = (): JSX.Element => {
    const userId = LastIdStore.lastUserId;
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [user, setUser] = useState<TUser>(null);
    const [currentUser, setCurrentUser] = useState(null);
    const isForInvitation = useRef<boolean>(null);
    const [editing, setEditing] = useState<boolean>(false);
    const [numberValid, setNumberValid] = useState<boolean>(false);
    const [numberValue, setNumberValue] = useState<string>('');
    const [isUserProfile, setUserProfile] = useState<boolean>(false);
    const currentID = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const creds = SettingsManager.getConnectionCredentials();
    const phoneMask = /^[0-9]{10}$/;
    const emailMask =
        /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/iu;

    async function getUser() {
        setIsLoading(true);
        try {
            const tuser = await CRMAPIManager.request<UserResp>(async (api) => {
                if (!userId || creds.userId === userId) {
                    setUserProfile(true);
                    return await api.currentUser();
                } else {
                    return await api.getUser(userId || currentID.current, creds.crmID);
                }
            });
            if (tuser.errorMessages) throw tuser.errorMessages;
            setUser(tuser.data.data);
            setCurrentUser(creds.userId);
            setNumberValue(tuser.data.data.phone);
        } catch (err) {
            messageService.sendError(err.message);
        }
        setIsLoading(false);
    }

    function checkCurrentUrl() {
        if (location.pathname.includes('edit')) {
            setNumberValid(phoneMask.test(numberValue));
            isForInvitation.current = false;
            setEditing(true);
        } else if (location.pathname.includes('create')) {
            isForInvitation.current = true;
            setEditing(true);
        }
    }
    
    function handleEditing() {
        navigate(`/lk/worker/crm/${creds.crmID}/customers/${user.id || currentID.current}/edit`);
        setEditing(true);
        setNumberValid(phoneMask.test(numberValue));
    }

    function validateProfile(): boolean {
        if (!user?.name || user?.name == '') {
            messageService.sendError('Имя не может быть пустым');
            return false;
        }
        if (!user?.surname || user?.surname == '') {
            messageService.sendError('Фамилия не может быть пустой');
            return false;
        }
        if (!user?.email || user?.email == '') {
            messageService.sendError('Email не может быть пустой');
            return false;
        }
        if (!user?.email || !emailMask.test(user?.email)) {
            messageService.sendError('Введен некорректный Email');
            return false;
        }
        if (!numberValid && !isForInvitation.current) {
            messageService.sendError('Номер некорректен');
            return false;
        }
        return true;
    }

    function prepareFormDataForRequest(
        user: TUser,
        creds: TCredentials,
        isForInvitation
    ): FormData {
        let userObj;
        if (isForInvitation) {
            userObj = {
                ...user,
                profile_id: user.profile?.id ? String(user.profile.id) : null,
                profile_type: 'customer',
            };
        } else {
            const isPictureNotUpdating =
                typeof user.picture === 'string' && user.picture !== 'null'; // send 'null' for deleting current picture
            userObj = {
                ...user,
                phone: numberValue,
                picture: isPictureNotUpdating ? user.picture : user.picture,
                profile_id: user.profile?.id ? String(user.profile.id) : null,
                profile_type: 'customer',
                id: String(user.id),
            };
        }
        delete userObj.worker_profile;
        delete userObj.crm_id;
        delete userObj.profile;
        delete userObj.invitation_status_text;
        const formData = new FormData();

        for (const key in userObj) {
            if (userObj[key] !== null) {
                formData.append(key, userObj[key]);
            }
        }
        formData.append('user_id', String(user.id));
        formData.append('crm_id', String(creds.crmID));
        return formData;
    }

    function prepareCustomerProfileFormDataRequest(user: TUser, isForInvitation): FormData {
        let customerProfileObj;
        if (isForInvitation) {
            customerProfileObj = {
                ...user.customer_profile,
            };
        } else {
            customerProfileObj = {
                ...user.customer_profile,
                crm_id: user.customer_profile.crm,
                user_id: user.id,
            };
        }

        delete customerProfileObj.crm;
        delete customerProfileObj.user;

        return customerProfileObj;
    }

    async function handleSaveEditing() {
        if (!validateProfile()) {
            return;
        }
        setIsLoading(true);
        setEditing(false);
        try {
            const formData = prepareFormDataForRequest(user, creds, isForInvitation.current);
            const formCustomerProfileData = prepareCustomerProfileFormDataRequest(
                user,
                isForInvitation.current
            );

            if (isForInvitation.current) {
                const inv = await sendRequest<InvitationResp>(
                    '/invitation/inviteNotRegisterUser',
                    formData
                );
                if (inv.errorMessages) throw inv.errorMessages;

                localStorage.removeItem('newPhone');
                localStorage.setItem('invitationIsSent', 'true');
                navigate(`/lk/worker/crm/${creds.crmID}/customers/${inv.data.data.receive_user_id}`);
            } else {
                if (isUserProfile) {
                    const tuser = await sendRequest<UserResp>('/user/update', formData);
                    if (tuser.errorMessages) throw tuser.errorMessages;
                    setUser(tuser.data.data);
                }

                const tcustomerProfile = await sendRequest<CustomerProfileResp>(
                    '/customerProfile/update',
                    formCustomerProfileData
                );
                if (tcustomerProfile.errorMessages) throw tcustomerProfile.errorMessages;
                setUser((prevState) => ({
                    ...prevState,
                    customer_profile: tcustomerProfile.data.data,
                }));
                navigate(`/lk/worker/crm/${creds.crmID}/customers/${user.id || currentID.current}`);
            }
        } catch (err) {
            messageService.sendError(err.message);
        }
        setIsLoading(false);
    }

    async function handleAbortEditing() {
        setEditing(false);
        if (isForInvitation.current) {
            navigate(`/lk/worker/crm/${creds.crmID}/customers`);
            localStorage.removeItem('newPhone');
        } else {
            setEditing(false);
            navigate(`/lk/worker/crm/${creds.crmID}/customers/${user.id || currentID.current}`);
            await getUser();
        }
    }

    function handleImageSelect(file: File) {
        setUser((prevState) => ({ ...prevState, picture: file }));
    }

    function handleImageDelete() {
        setUser((prevState) => ({ ...prevState, picture: 'null' }));
    }

    async function checkCustomerBelongToCrm() {
        try {
            const urlArr = window.location.pathname.split('/');
            if (urlArr[urlArr.length - 1] == 'edit') {
                currentID.current = Number(urlArr[urlArr.length - 2]);
            } else {
                currentID.current = Number(urlArr[urlArr.length - 1]);
            }
            const tuser = await CRMAPIManager.request<UserResp>(async (api) => {
                return await api.getUser(currentID.current, creds.crmID);
            });
            if (!isNaN(currentID.current) && tuser.statusCode == 404) {
                navigate(`/lk/worker/crm/${creds.crmID}/customers`);
            }
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
    }

    function beforeMountCustomer() {
        checkCurrentUrl();
        Common.checkUserBelongToCrm(GlobalConstants.CrmOrderinUrl).then((res) => {
            if (!res) navigate(`/lk/worker/crm/${creds.crmID}`);
        });
        if (!isNaN(currentID.current)) {
            checkCustomerBelongToCrm().then(() => {
                !isForInvitation.current
                    ? getUser()
                    : messageService.sendInfo('Пользователь не найден, пожалуйста заполните поля');
            });
        }
    }

    useEffect(() => {
        beforeMountCustomer();
    }, [userId, currentID.current]);

    return (
        <div id="app-worker-profile">
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
        
            <HeaderBreadcrumbProfiles 
                dataIcon={faUser}
                dataId={user?.id}
                dataTitle={'Клиенты'}
                title={'Профиль Клиента'}
                route={`/lk/worker/crm/${creds?.crmID}/customers`}
                isForInvitation={isForInvitation.current}
                dataName={'Новый пользователь'}
                isSpecialty={false}
            />
            
            <div className="user-profile">
                <Row className="upper-info" justify={'center'}>
                    <Col className="avatar outer-box-for-image">
                        <ImgUploader
                            photoSrc={user?.picture as string}
                            onImageSelect={handleImageSelect}
                            isEdit={editing && user?.id == currentUser}
                            onImageDelete={handleImageDelete}
                        />
                    </Col>
                    {!isForInvitation.current && (
                        <Col className="balance-contact outer-box">
                            <Row className="main-row">
                                <Col flex={1}>
                                    <Tooltip title="Написать">
                                        <Button
                                            className="round-button"
                                            icon={<FontAwesomeIcon icon={faMessage} />}
                                            shape="circle"
                                        />
                                    </Tooltip>
                                </Col>
                                <Col flex={2}>
                                    <Row className="label-row">
                                        <Col>
                                            <p>Баланс:</p>
                                        </Col>
                                    </Row>
                                    <Row className="balance-value-row">
                                        <Col>
                                            <p>{Math.floor(Math.random() * 30000)}</p>
                                        </Col>
                                    </Row>
                                </Col>
                                <Col flex={1}>
                                    <Tooltip title="Позвонить">
                                        <Button
                                            className="round-button"
                                            icon={<FontAwesomeIcon icon={faPhone} />}
                                            shape="circle"
                                        />
                                    </Tooltip>
                                </Col>
                            </Row>
                            <Row className="balance-actions">
                                <Col>
                                    <Button
                                        className="balance-add round-button"
                                        icon={<FontAwesomeIcon icon={faPlus} />}
                                    >
                                        Пополнить
                                    </Button>
                                </Col>
                                <Col>
                                    <Button
                                        className="balance-subtract round-button"
                                        icon={<FontAwesomeIcon icon={faMinus} />}
                                    >
                                        Списать
                                    </Button>
                                </Col>
                            </Row>
                        </Col>
                    )}
                </Row>
                <ProfileInfoCard
                    areAllFieldsEditable={isForInvitation.current}
                    editing={editing}
                    isUserProfile={isUserProfile}
                    user={
                        isForInvitation.current
                            ? {
                                  ...user,
                                  phone: localStorage.getItem('newPhone'),
                              }
                            : user
                    }
                    setUser={setUser}
                    setIsNumberValid={setNumberValid}
                    setNumberValue={setNumberValue}
                    phoneNumberValue={
                        isForInvitation.current ? localStorage.getItem('newPhone') : numberValue
                    }
                    isCustomer={true}
                />
            </div>
        </div>
    );
};

export { CustomerProfile };
