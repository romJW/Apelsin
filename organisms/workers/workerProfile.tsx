import {
    faBars,
    faCheck,
    faEdit,
    faMessage,
    faMinus,
    faPhone,
    faPlus,
    faUserTie,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Col, Dropdown, Form, Input, Modal, Row, Tooltip } from 'antd';
import * as React from 'react';
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
import { WorkerProfileResp } from '@api/responseModels/worker/workerProfileResponse';
import { HeaderBreadcrumbProfiles } from '@molecules/breadcrumbs/profilesBreadcrumbs/HeaderProfilesBreadcrumb';
import { Common } from '../../../classes/commonMethods';
import { GlobalConstants } from '@constants/global';
import { TransactionResp } from '@api/responseModels/transactions/transactionResponse';
import { LastIdStore } from '@pages/lastIdStore';
import { CRMAPIBase } from '@api/crmApiBase';

const WorkerProfile = (): JSX.Element => {
    const userId = LastIdStore.lastUserId;
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [user, setUser] = useState<TUser>(null);
    const [currentUser, setCurrentUser] = useState(null);
    const isForInvitation = useRef<boolean>(null);
    const [editing, setEditing] = useState<boolean>(false);
    const numberValid = useRef(false);
    const [numberValue, setNumberValue] = useState<string>('');
    const [isUserProfile, setUserProfile] = useState<boolean>(false);
    /// Навигация
    const currentID = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    /// Транзакции
    const [transactionOpen, setTransactionOpen] = useState<boolean>(false);
    const [transactionType, setTransactionType] = useState<'Пополнение' | 'Списание'>('Пополнение');
    const [transactionAmount, setTransactionAmount] = useState<number>(0);
    const creds = SettingsManager.getConnectionCredentials();
    const phoneMask = /^[0-9]{10}$/;
    const emailMask =
        /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/iu;

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

    function validateWorker(): boolean {
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
        if (!numberValid.current && !isForInvitation.current) {
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
        if (isForInvitation.current) {
            userObj = {
                ...user,
                profile_id: user.profile?.id ? String(user.profile.id) : null,
                profile_type: 'worker',
            };
        } else {
            const isPictureNotUpdating =
                typeof user.picture === 'string' && user.picture !== 'null'; // send 'null' for deleting current picture
            userObj = {
                ...user,
                phone: numberValue,
                picture: isPictureNotUpdating ? null : user.picture,
                profile_id: user.profile?.id ? String(user.profile.id) : null,
                profile_type: 'worker',
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
        formData.append('crm_id', String(creds.crmID));
        return formData;
    }

    function prepareWorkerProfileFormDataRequest(user: TUser, isForInvitation): FormData {
        let workerProfileObj;
        if (isForInvitation.current) {
            workerProfileObj = {
                ...user.worker_profile,
                worker_profile: user.worker_profile?.id ? String(user.worker_profile.id) : null,
            };
        } else {
            workerProfileObj = {
                ...user.worker_profile,
                user_id: user.id,
            };
        }
        return workerProfileObj;
    }

    function checkCurrentUrl() {
        const urlArr = window.location.pathname.split('/');

        if (urlArr[urlArr.length - 1] == 'edit') {
            currentID.current = Number(urlArr[urlArr.length - 2]);
        } else {
            currentID.current = Number(urlArr[urlArr.length - 1]);
        }
        if (creds.userId === currentID.current) setUserProfile(true);
        if (location.pathname.includes('edit')) {
            isForInvitation.current = false;
            setEditing(true);
        } else if (location.pathname.includes('create')) {
            isForInvitation.current = true;
            setEditing(true);
        }
    }
    async function handleSaveEditing() {
        numberValid.current = phoneMask.test(numberValue);
        if (!validateWorker()) {
            return;
        }
        setIsLoading(true);
        setEditing(false);
        try {
            const formData = prepareFormDataForRequest(user, creds, isForInvitation);
            const formWorkerProfileData = prepareWorkerProfileFormDataRequest(
                user,
                isForInvitation
            );
            if (isForInvitation.current) {
                const inv = await sendRequest<InvitationResp>(
                    '/invitation/inviteNotRegisterUser',
                    formData
                );
                if (inv.errorMessages) throw inv.errorMessages;

                localStorage.removeItem('newPhone');
                localStorage.setItem('invitationIsSent', 'true');
                navigate(`/lk/worker/crm/${creds.crmID}/workers/${inv.data.data.receive_user_id}`);
            } else {
                if (isUserProfile) {
                    const tuser = await sendRequest<UserResp>('/user/update', formData);
                    if (tuser.errorMessages) throw tuser.errorMessages;
                    setUser(tuser.data.data);
                }

                const tworkerProfile = await sendRequest<WorkerProfileResp>(
                    '/workerProfile/update',
                    formWorkerProfileData
                );
                if (tworkerProfile.errorMessages) throw tworkerProfile.errorMessages;
                setUser((prevState) => ({
                    ...prevState,
                    worker_profile: tworkerProfile.data.data,
                }));
                if (creds?.userId == tworkerProfile.data.data.user_id) {
                    SettingsManager.updateConnectionCredentials({
                        workerProfileId: tworkerProfile.data.data.id,
                    });
                }
                navigate(`/lk/worker/crm/${creds.crmID}/workers/${user.id || currentID.current}`);
            }
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
    }

    async function handleAbortEditing() {
        if (isForInvitation.current) {
            localStorage.removeItem('newPhone');
            navigate(`/lk/worker/crm/${creds.crmID}/workers`);
        } else {
            setEditing(false);
            navigate(`/lk/worker/crm/${creds.crmID}/workers/${user.id || currentID.current}`);
            await getUser();
        }
    }

    function handleImageSelect(file: File) {
        setUser((prevState) => ({ ...prevState, picture: file }));
    }

    function handleImageDelete() {
        setUser((prevState) => ({ ...prevState, picture: 'null' }));
    }

    async function checkWorkerBelongToCrm() {
        try {
            const urlArr = window.location.pathname.split('/');
            if (urlArr[urlArr.length - 1] == 'edit') {
                currentID.current = Number(urlArr[urlArr.length - 2]);
            } else {
                currentID.current = Number(urlArr[urlArr.length - 1]);
            }

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

            if (!isNaN(currentID.current) && tuser.statusCode == 404) {
                navigate(`/lk/worker/crm/${creds.crmID}/workers`);
            }
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
    }

    function beforeMountWorker() {
        checkCurrentUrl();
        Common.checkUserBelongToCrm(GlobalConstants.CrmOrderinUrl).then((res) => {
            if (!res && !location.pathname.includes('profile'))
                navigate(`/lk/worker/crm/${creds.crmID}`);
        });
        if (!isNaN(currentID.current || location.pathname.includes('profile'))) {
            checkWorkerBelongToCrm().then(() => {
                !isForInvitation.current
                    ? getUser()
                    : messageService.sendInfo('Пользователь не найден, пожалуйста заполните поля');
            });
        }
    }

    function topUpBalance() {
        if (creds?.workerProfileId == user.worker_profile.id) {
            messageService.sendInfo('Нельзя пополнить свой баланс.');
            return;
        } else if (creds?.workerProfileId == null) {
            messageService.sendError('У вас отсутствует профиль сотрудника.');
            return;
        }
        if (user?.worker_profile?.id == null) {
            messageService.sendError('У получателя отсутствует профиль сотрудника');
            return;
        }
        setTransactionType('Пополнение');
        setTransactionOpen(true);
    }

    function chargeBalance() {
        if (creds?.workerProfileId == user.worker_profile.id) {
            messageService.sendInfo('Нельзя списать со своего баланса.');
            return;
        } else if (creds?.workerProfileId == null) {
            messageService.sendError('У вас отсутствует профиль сотрудника.');
            return;
        }
        if (user?.worker_profile?.id == null) {
            messageService.sendError('У получателя отсутствует профиль сотрудника');
            return;
        }
        setTransactionType('Списание');
        setTransactionOpen(true);
    }

    async function prepareTransaction() {
        setIsLoading(true);
        try {
            const transaction = await CRMAPIManager.request<TransactionResp>(async (api) => {
                return await api.createTransaction({
                    crm_id: creds?.crmID,
                    receiver_type: 'worker',
                    receiver_id:
                        transactionType == 'Пополнение'
                            ? user.worker_profile.id
                            : creds?.workerProfileId,
                    sender_type: 'worker',
                    sender_id:
                        transactionType == 'Пополнение'
                            ? creds?.workerProfileId
                            : user.worker_profile.id,
                    sum: transactionAmount,
                    payment_method_id: 1,
                    transaction_type_id: 1,
                });
            });
            if (transaction.errorMessages) throw transaction.errorMessages;
            setTransactionOpen(false);
            messageService.sendSuccess(
                `Перевод ${user.name} ${user.surname} на сумму ${transactionAmount} руб.`
            );
            await getUser();
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
    }

    function onTransactionAmountChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) {
        setTransactionAmount(Number.parseFloat(e.target.value));
    }
    async function getNotification() {
        const notifications = await CRMAPIManager.request(async (api) => {
            return await api.getListNotification(creds.crmID);
        });
        console.log(notifications, creds.crmID)
    }
    useEffect(() => {
        getNotification()
        beforeMountWorker();
    }, [userId]);

    return (
        <div id="app-worker-profile">
            {isLoading && <Loader />}
            <Modal
                title={transactionType}
                open={transactionOpen}
                onCancel={() => setTransactionOpen(false)}
                footer={[
                    <Button
                        className="round-button"
                        key="back"
                        onClick={() => setTransactionOpen(false)}
                    >
                        Отмена
                    </Button>,
                    <Button
                        className="round-button"
                        key="submit"
                        type="primary"
                        disabled={transactionAmount == null || transactionAmount <= 0}
                        onClick={prepareTransaction}
                    >
                        Подтвердить
                    </Button>,
                ]}
            >
                <Form layout="inline">
                    <Form.Item label="Сумма: ">
                        <Input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={9999999}
                            step={0.01}
                            onChange={onTransactionAmountChange}
                            style={{ width: '180px' }}
                            value={transactionAmount}
                            required
                        />
                    </Form.Item>
                </Form>
            </Modal>
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
                dataIcon={faUserTie}
                dataId={user?.id}
                dataTitle={'Сотрудники'}
                title={'Профиль сотрудника'}
                route={`/lk/worker/crm/${creds?.crmID}/workers`}
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
                                            <p>{user?.worker_profile?.balance || 0}</p>
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
                                        onClick={topUpBalance}
                                    >
                                        Пополнить
                                    </Button>
                                </Col>
                                <Col>
                                    <Button
                                        className="balance-subtract round-button"
                                        icon={<FontAwesomeIcon icon={faMinus} />}
                                        onClick={chargeBalance}
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
                    setNumberValue={setNumberValue}
                    phoneNumberValue={
                        isForInvitation.current ? localStorage.getItem('newPhone') : numberValue
                    }
                    // isOwnerCRMUser={isOwnerCRMUser}
                    isCustomer={false}
                />
            </div>
        </div>
    );
};

export { WorkerProfile };
