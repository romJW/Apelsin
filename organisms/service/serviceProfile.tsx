import {
    faBars,
    faCheck,
    faEdit,
    faScrewdriverWrench,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Col, Dropdown, Input, Row, TimePicker } from 'antd';
import { useEffect, useState, useRef } from 'react';
import { ServiceActionListResp } from '../../../api/responseModels/service/serviceActionListResponse';
import { ServiceResp } from '../../../api/responseModels/service/serviceResponse';
import { Common } from '../../../classes/commonMethods';
import { CRMAPIManager } from '../../../classes/crmApiManager';
import { messageService } from '../../../classes/messageService';
import { SettingsManager } from '../../../classes/settingsManager';
import { TService } from '../../../types/service';
import { TServiceCategory } from '../../../types/serviceCategory';
import { Loader } from '../../atoms/loader';
import { ServiceActionPicker } from '../pickers/serviceActionPicker';
import { ServiceCategoryPicker } from '../pickers/serviceCategoryPicker';
import { sendRequest } from '@api/sendRequest';
import { ImgUploader } from '@organisms/imgUploader/imgUploader';
import { CategoryPickerUsage } from '@enums/categoryPickerUsage';
import { useNavigate, useLocation } from 'react-router';
import { GlobalConstants } from '@constants/global';
import { HeaderBreadcrumbProfiles } from '@molecules/breadcrumbs/profilesBreadcrumbs/HeaderProfilesBreadcrumb';
import { LastIdStore } from '@pages/lastIdStore';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

const { TextArea } = Input;

const ServiceProfile = (): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [service, setService] = useState<TService & { category: TServiceCategory }>(null);

    const [editing, setEditing] = useState<boolean>(false);
    const [newService, setNewService] = useState<boolean>(false);
    const [isServiceActionOpen, setIsServiceActionOpen] = useState<boolean>(false);
    const [isServiceCategoryOpen, setIsServiceCategoryOpen] = useState<boolean>(false);
    const currentID = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const creds = SettingsManager.getConnectionCredentials();

    function onChangeDuration(_time: Dayjs, timeString: string) {
        setService({ ...service, duration: Common.convertH2M(timeString) });
    }

    async function getService() {
        setIsLoading(true);
        try {
            const creds = SettingsManager.getConnectionCredentials();
            const serv = await CRMAPIManager.request<ServiceResp>(async (api) => {
                return await api.getService(currentID.current || LastIdStore.lastServiceId, creds.crmID);
            });
            if (serv.errorMessages) throw serv.errorMessages;
            setService(serv.data.data);
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
    }

    async function getServiceActionList() {
        setIsLoading(true);
        try {
            const creds = SettingsManager.getConnectionCredentials();
            const servActList = await CRMAPIManager.request<ServiceActionListResp>(async (api) => {
                return await api.getServiceActionList(creds.crmID);
            });
            if (servActList.errorMessages) throw servActList.errorMessages;
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
    }

    async function handleEditing() {
        navigate(`/lk/worker/crm/${creds.crmID}/services/${LastIdStore.lastServiceId || currentID.current}/edit`);
        setEditing(true);
    }

    function validateBeforeSave(): boolean {
        if (service.name == '' || service.name === null) {
            messageService.sendError('Имя услуги не может быть пустым');
            return false;
        }
        if (
            service.duration == null ||
            service.duration < 0 ||
            service.duration > 24 * 60 * 60 * 1000
        ) {
            messageService.sendError('Продолжительность должна быть от 0 секунд до 24 часов');
            return false;
        }
        if (service.price == null || service.price <= 0 || service.price > 9999999.99) {
            messageService.sendError('Цена должна быть от 0,1 до 9 999 999,99 рублей');
            return false;
        }
        if (
            service.min_performers == null ||
            service.min_performers < 1 ||
            service.min_performers > 10
        ) {
            messageService.sendError('Количество исполнителей должно быть от 1 до 10');
            return false;
        }
        return true;
    }

    function prepareDataForRequest(service: TService): FormData {
        const isPictureNotUpdating =
            typeof service.picture === 'string' && service.picture !== 'null'; // send 'null' for deleting current picture
        const serviceObj = {
            ...service,
            picture: isPictureNotUpdating ? null : service.picture,
            duration: String(service.duration),
            price: String(service.price),
            service_category_id: service.service_category_id
                ? String(service.service_category_id)
                : null,
            min_performers: String(service.min_performers),
            id: String(service.id),
            crm_id: String(service.crm_id),
        };
        const formData = new FormData();
        for (const key in serviceObj) {
            if (serviceObj[key] !== null) {
                formData.append(key, serviceObj[key]);
            }
        }
        return formData;
    }

    async function handleSaveEditing() {
        if (!validateBeforeSave()) {
            return;
        }
        setIsLoading(true);
        try {
            const formData = prepareDataForRequest(service);
            const serv = newService
                ? await sendRequest<ServiceResp>('/service/save', formData)
                : await sendRequest<ServiceResp>('/service/update', formData);
            if (serv.errorMessages) throw serv.errorMessages;
            setService(serv.data.data);
            setEditing(false);
            navigate(`/lk/worker/crm/${creds.crmID}/services/${serv.data.data.id || LastIdStore.lastServiceId}`);
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
    }

    async function handleAbortEditing() {
        setIsLoading(true);
        setEditing(false);
        navigate(`/lk/worker/crm/${creds.crmID}/services/${currentID.current || LastIdStore.lastServiceId}`);
        if (newService) {
            LastIdStore.setLastServiceId(null);
        } else {
            await getService();
        }
        setIsLoading(false);
    }

    function handleImageSelect(file: File) {
        setService((prevState) => ({ ...prevState, picture: file }));
    }

    function handleImageDelete() {
        setService((prevState) => ({ ...prevState, picture: 'null' }));
    }

    function checkCurrentUrl() {
        if (location.pathname.includes('create')) {
            setEditing(true);
        } else if (location.pathname.includes('edit')) {
            setEditing(true);
        }
    }

    async function checkServiceBelongToCrm() {
        try {
            const urlArr = window.location.pathname.split('/');
            if (urlArr[urlArr.length - 1] == 'edit') {
                currentID.current = Number(urlArr[urlArr.length - 2]);
            } else {
                currentID.current = Number(urlArr[urlArr.length - 1]);
            }
            const serv = await CRMAPIManager.request<ServiceResp>(async (api) => {
                return await api.getService(currentID.current, creds.crmID);
            });
            if (!isNaN(currentID.current) && serv.statusCode == 404) {
                navigate(`/lk/worker/crm/${creds.crmID}/services`);
            }
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
    }

    function beforeMountService() {
        checkCurrentUrl();
        Common.checkUserBelongToCrm(GlobalConstants.CrmOrderinUrl).then((res) => {
            if (!res) navigate(`/lk/worker/crm/${creds.crmID}`);
        });
        if (!isNaN(currentID.current)) {
            checkServiceBelongToCrm().then(() => {
                if (currentID.current != 0 && Number.isNaN(!currentID.current)) {
                    getService();
                }
                else if (
                    Number.isNaN(currentID.current) ||
                    LastIdStore.lastServiceId === -1 ||
                    (LastIdStore.lastServiceId >= 0 && (LastIdStore.lastServiceId * 10) % 10 === 1)
                ) {
                    setNewService(true);
                    setEditing(true);
                    getServiceActionList().then(() => {
                        setService({
                            id: -1,
                            name: null,
                            explanation: null,
                            picture: '/storage/images/services/noimage.png',
                            description: null,
                            duration: 0,
                            price: 0,
                            service_category_id: LastIdStore.lastServiceCategoryId,
                            min_performers: 1,
                            comment: null,
                            crm_id: SettingsManager.getConnectionCredentials().crmID,
                            category: null,
                        });
                    });
                } else {
                    getService().then(() => {
                        getServiceActionList();
                    });
                }
            });
        }
    }

    useEffect(() => {
        beforeMountService();
    }, [LastIdStore.lastServiceId]);

    return (
        <div id="app-service-profile">
            {isLoading && <Loader />}
            <ServiceActionPicker
                isModalOpen={isServiceActionOpen}
                setIsModalOpen={setIsServiceActionOpen}
                currentService={service}
                setCurrentService={setService}
                editing={true}
            />
            {isServiceCategoryOpen && (
                <ServiceCategoryPicker
                    isModalOpen={isServiceCategoryOpen}
                    setIsModalOpen={setIsServiceCategoryOpen}
                    currentCategorySelected={service.category}
                    setCurrentCategorySelected={(sel: TServiceCategory) => {
                        const tService = service;
                        setService({ ...tService, category: sel, service_category_id: sel?.id });
                    }}
                    useCase={CategoryPickerUsage.createCategoryOrCreateOrEditProductOrService}
                />
            )}
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
            <HeaderBreadcrumbProfiles
                dataIcon={faScrewdriverWrench}
                dataId={service?.id}
                dataTitle={'Услуги'}
                title={'Профиль услуги'}
                route={`/lk/worker/crm/${creds?.crmID}/services`}
                isForInvitation={false}
                dataName={'Новая услуга'}
                isSpecialty={false}
            />
            <div className="service-profile">
                <Row className="service-info">
                    <Col className="avatar outer-box" flex={1}>
                        <ImgUploader
                            photoSrc={service?.picture as string}
                            onImageSelect={handleImageSelect}
                            isEdit={editing}
                            onImageDelete={handleImageDelete}
                        />
                    </Col>
                    <Col className="outer-box" flex={1}>
                        <Row className="label-row">
                            <Col>
                                <p>Название</p>
                            </Col>
                        </Row>
                        <Row className="value-row">
                            <Col>
                                {editing ? (
                                    <TextArea
                                        autoSize={{ minRows: 2, maxRows: 5 }}
                                        value={service?.name}
                                        onChange={(e) =>
                                            setService({ ...service, name: e.target.value })
                                        }
                                    />
                                ) : (
                                    <p>{service?.name}</p>
                                )}
                            </Col>
                        </Row>
                    </Col>

                    <Col className="outer-box" flex={1}>
                        <Row className="label-row">
                            <Col>
                                <p>Продолжительность</p>
                            </Col>
                        </Row>
                        <Row className="value-row">
                            <Col>
                                {/* TODO: редактирование продолжительности */}
                                {editing ? (
                                    <TimePicker
                                        onChange={onChangeDuration}
                                        defaultValue={dayjs('00:00', 'HH:mm')}
                                        format="HH:mm"
                                        showNow={false}
                                    />
                                ) : (
                                    <p>{Common.convertM2H(service?.duration)}</p>
                                )}
                            </Col>
                        </Row>
                    </Col>
                </Row>
                <Row className="service-info">
                    <Col className="outer-box" flex={1}>
                        <Row className="label-row">
                            <Col>
                                <p>Цена</p>
                            </Col>
                        </Row>
                        <Row className="value-row">
                            <Col>
                                {editing ? (
                                    <Input
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        max={9999999}
                                        step={0.01}
                                        value={service?.price}
                                        onChange={(e) =>
                                            setService({
                                                ...service,
                                                price: Number.parseFloat(e.target.value),
                                            })
                                        }
                                    />
                                ) : (
                                    <p>{service?.price + ' руб'}</p>
                                )}
                            </Col>
                        </Row>
                    </Col>
                    <Col className="outer-box" flex={1}>
                        <Row className="label-row">
                            <Col>
                                <p>Группа</p>
                            </Col>
                        </Row>
                        <Row
                            className="value-row"
                            onClick={() => {
                                if (editing) setIsServiceCategoryOpen(true);
                            }}
                        >
                            <Col>
                                {editing ? (
                                    <a>
                                        {service?.service_category_id ??
                                            service?.category?.name ??
                                            'Не выбрана'}
                                    </a>
                                ) : (
                                    <p>{service?.category?.name ?? 'Не выбрана'}</p>
                                )}
                            </Col>
                        </Row>
                    </Col>
                    <Col className="outer-box" flex={1}>
                        <Row className="label-row">
                            <Col>
                                <p>Соп. товары</p>
                            </Col>
                        </Row>
                        <Row className="value-row">
                            <Col>
                                <p>{Math.floor(Math.random() * 10)}</p>
                            </Col>
                        </Row>
                    </Col>
                </Row>
                <Row justify="center">
                    <Col className="outer-box" span={8}>
                        <Row className="label-row">
                            <Col>
                                <p>Мин. исполнителей</p>
                            </Col>
                        </Row>
                        <Row className="value-row">
                            <Col>
                                {editing ? (
                                    <Input
                                        type="number"
                                        inputMode="numeric"
                                        min={1}
                                        max={10}
                                        step={1}
                                        value={service?.min_performers}
                                        onChange={(e) =>
                                            setService({
                                                ...service,
                                                min_performers: Number.parseFloat(e.target.value),
                                            })
                                        }
                                    />
                                ) : (
                                    <p>{service?.min_performers}</p>
                                )}
                            </Col>
                        </Row>
                    </Col>
                </Row>
                <Row className="service-comment outer-box">
                    <Col>
                        <Row className="label-row">
                            <Col>
                                <p>Комментарий</p>
                            </Col>
                        </Row>
                        <Row className="value-row">
                            <Col>
                                {editing ? (
                                    <TextArea
                                        autoSize={{ minRows: 2, maxRows: 5 }}
                                        maxLength={255}
                                        onChange={(e) =>
                                            setService({ ...service, comment: e.target.value })
                                        }
                                        value={service?.comment}
                                    />
                                ) : (
                                    <p>{service?.comment}</p>
                                )}
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export { ServiceProfile };
