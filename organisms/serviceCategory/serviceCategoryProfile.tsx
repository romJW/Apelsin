import { sendRequest } from '@api/sendRequest';
import { CategoryPickerUsage } from '@enums/categoryPickerUsage';
import {
    faBars,
    faCheck,
    faEdit,
    faWandMagicSparkles,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { HeaderBreadcrumbProfiles } from '@molecules/breadcrumbs/profilesBreadcrumbs/HeaderProfilesBreadcrumb';
import { ImgUploader } from '@organisms/imgUploader/imgUploader';
import { Col, Dropdown, Input, Row } from 'antd';
import { useEffect, useState, useRef } from 'react';
import { ServiceCategoryResp } from '../../../api/responseModels/service/serviceCategoryResponse';
import { CRMAPIManager } from '../../../classes/crmApiManager';
import { messageService } from '../../../classes/messageService';
import { SettingsManager } from '../../../classes/settingsManager';
import { TService } from '../../../types/service';
import { TServiceCategory } from '../../../types/serviceCategory';
import { Loader } from '../../atoms/loader';
import { ServiceCategoryPicker } from '../pickers/serviceCategoryPicker';
import { useNavigate, useLocation } from 'react-router';
import { Common } from '@classes/commonMethods';
import { LastIdStore } from '@pages/lastIdStore';

const ServiceCategoryProfile = (): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [serviceCategory, setServiceCategory] = useState<
        TServiceCategory & { services: Array<TService>; categories: Array<TServiceCategory> }
    >(null);
    const [editing, setEditing] = useState<boolean>(false);
    const [isServiceCategoryOpen, setIsServiceCategoryOpen] = useState<boolean>(false);
    const [isNewCategory, setIsNewCategory] = useState<boolean>(false);
    const currentID = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const creds = SettingsManager.getConnectionCredentials();

    async function getServiceCategory() {
        setIsLoading(true);
        try {
            const creds = SettingsManager.getConnectionCredentials();
            const servCat = await CRMAPIManager.request<ServiceCategoryResp>(async (api) => {
                return await api.getServiceCategory(
                    currentID.current || LastIdStore.lastServiceCategoryId,
                    creds.crmID
                );
            });
            if (servCat.errorMessages) throw servCat.errorMessages;
            setServiceCategory(servCat.data.data);
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
    }

    function handleEditing() {
        navigate(`/lk/worker/crm/${creds.crmID}/service-categories/${LastIdStore.lastServiceCategoryId || currentID.current}/edit`);
        setEditing(true);
    }

    function prepareDataForRequest(
        serviceCategory: TServiceCategory & {
            services: Array<TService>;
            categories: Array<TServiceCategory>;
        }
    ): FormData {
        const isPictureNotUpdating =
            typeof serviceCategory.picture === 'string' && serviceCategory.picture !== 'null'; // send 'null' for deleting current picture

        const serviceCategoryObj = {
            ...serviceCategory,
            picture: isPictureNotUpdating ? null : serviceCategory.picture,
            id: String(serviceCategory.id),
            crm_id: String(serviceCategory.crm_id),
            parent_service_category_id:
                typeof serviceCategory.parent_service_category_id === 'number'
                    ? String(serviceCategory.parent_service_category_id)
                    : null,
        };
        if (isNewCategory) {
            delete serviceCategoryObj.id;
            delete serviceCategoryObj.categories;
            delete serviceCategoryObj.services;
        }
        const formData = new FormData();
        for (const key in serviceCategoryObj) {
            if (serviceCategoryObj[key] !== null) {
                formData.append(key, serviceCategoryObj[key]);
            }
        }
        return formData;
    }

    async function handleSaveEditing() {
        if (serviceCategory.name == '') {
            messageService.sendError('Имя категории услуг не может быть пустым!');
            return;
        }
        setIsLoading(true);
        setEditing(false);
        try {
            const formData = prepareDataForRequest(serviceCategory);
            const servCat = isNewCategory
                ? await sendRequest<ServiceCategoryResp>('/serviceCategory/save', formData)
                : await sendRequest<ServiceCategoryResp>('/serviceCategory/update', formData);
            if (servCat.errorMessages) throw servCat.errorMessages;
            setServiceCategory(servCat.data.data);
            setIsNewCategory(false);
            navBack();
            if (isNewCategory) LastIdStore.setLastServiceCategoryId(null);
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
    }

    async function handleAbortEditing() {
        setIsLoading(true);
        setEditing(false);
        if (isNewCategory) {
            LastIdStore.setLastServiceCategoryId(null);
        } else {
            await getServiceCategory();
        }
        setIsLoading(false);
        navBack();
    }

    function navBack() {
        location.state?.from.pathname == `/lk/worker/crm/${creds.crmID}/service-categories`
        ? navigate(`/lk/worker/crm/${creds.crmID}/service-categories`)
        : navigate(-1);
    }

    function filterSubcategoriesById(categories: Array<TServiceCategory>) {
        return categories.map((el) => el.id);
    }

    function handleImageSelect(file: File) {
        setServiceCategory((prevState) => ({ ...prevState, picture: file }));
    }

    function handleImageDelete() {
        setServiceCategory((prevState) => ({ ...prevState, picture: 'null' }));
    }
    function checkCurrentUrl() {
        if (location.pathname.includes('create')) {
            setEditing(true);
        }
        else if (location.pathname.includes('edit')) {
            setEditing(true);
        } 
    }
    
    async function checkServiceCategoryBelongToCrm() {
        try {
            const urlArr = window.location.pathname.split('/');
            if (urlArr[urlArr.length - 1] == 'edit') {
                currentID.current = Number(urlArr[urlArr.length - 2]);
            } else {
                currentID.current = Number(urlArr[urlArr.length - 1]);
            }
            const servCat = await CRMAPIManager.request<ServiceCategoryResp>(async (api) => {
                return await api.getServiceCategory(currentID.current, creds.crmID);
            });
            if (!isNaN(currentID.current) && servCat.statusCode == 404) {
                navigate(`/lk/worker/crm/${creds.crmID}/service-categories`);
            } 
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
    }

    function beforeMountServiceCategory(){
        checkCurrentUrl();
        Common.checkUserBelongToCrm(4).then((res) => {
            if(!res) navigate(`/lk/worker/crm/${creds.crmID}`);
        });
        checkServiceCategoryBelongToCrm().then(() => {
            if (currentID.current != 0 && Number.isNaN(!currentID.current)) {
                getServiceCategory();
            }
            else if (
                Number.isNaN(currentID.current) ||
                LastIdStore.lastServiceCategoryId === -1 ||
                (LastIdStore.lastServiceCategoryId >= 0 && (LastIdStore.lastServiceCategoryId * 10) % 10 === 1)
            ) {
                setIsNewCategory(true);
                setEditing(true);
                setServiceCategory({
                    id: -1,
                    name: null,
                    picture: null,
                    crm_id: SettingsManager.getConnectionCredentials().crmID,
                    categories: [],
                    services: [],
                    services_count: 0,
                    quantity_total: 0,
                    parent_service_category_id: LastIdStore.lastServiceCategoryId,
                });
            } else {
                getServiceCategory();
            }
        });
    }
    
    useEffect(() => {
        beforeMountServiceCategory()
    }, [LastIdStore.lastServiceCategoryId]);

    return (
        <div id="app-service-category-profile">
            {isLoading && <Loader />}
            {isServiceCategoryOpen && (
                <ServiceCategoryPicker
                    isModalOpen={isServiceCategoryOpen}
                    setIsModalOpen={setIsServiceCategoryOpen}
                    currentCategorySelected={serviceCategory}
                    setCurrentCategorySelected={(sel: TServiceCategory) => {
                        const tServiceCategory = serviceCategory;
                        setServiceCategory({
                            ...tServiceCategory,
                            parent_service_category_id: sel?.id,
                        });
                    }}
                    categoryData={{
                        id: serviceCategory.id,
                        parent_service_category_id: serviceCategory.parent_service_category_id,
                        subCategoriesId: filterSubcategoriesById(serviceCategory.categories),
                    }}
                    useCase={
                        isNewCategory
                            ? CategoryPickerUsage.createCategoryOrCreateOrEditProductOrService
                            : CategoryPickerUsage.editCategory
                    }
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
                dataIcon={faWandMagicSparkles}
                dataId={serviceCategory?.id}
                dataTitle={'Категории услуг'}
                title={'Категория услуг'}
                route={`/lk/worker/crm/${creds.crmID}/service-categories`}
                isForInvitation={false}
                dataName={'Новая категория'}
                isSpecialty={false}
            />
            <div className="service-category-profile">
                <Row className="service-category-info three-blocks">
                    <Col className="avatar outer-box">
                        <ImgUploader
                            photoSrc={serviceCategory?.picture as string}
                            onImageSelect={handleImageSelect}
                            isEdit={editing}
                            onImageDelete={handleImageDelete}
                        />
                    </Col>
                    <Col className="outer-box">
                        <Row className="label-row">
                            <Col>
                                <p>Название</p>
                            </Col>
                        </Row>
                        <Row className="value-row">
                            <Col>
                                {editing ? (
                                    <Input
                                        value={serviceCategory?.name}
                                        onChange={(e) =>
                                            setServiceCategory({
                                                ...serviceCategory,
                                                name: e.target.value,
                                            })
                                        }
                                    />
                                ) : (
                                    <p>{serviceCategory?.name}</p>
                                )}
                            </Col>
                        </Row>
                    </Col>
                    <Col className="outer-box">
                        <Row className="label-row">
                            <Col>
                                <p>ID родителя</p>
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
                                        {serviceCategory?.parent_service_category_id ??
                                            'Не выбрана'}
                                    </a>
                                ) : (
                                    <p>
                                        {serviceCategory?.parent_service_category_id ??
                                            'Не выбрана'}
                                    </p>
                                )}
                            </Col>
                        </Row>
                    </Col>
                </Row>
                {!isNewCategory && (
                    <Row className="service-category-info two-blocks">
                        <Col className="outer-box">
                            <Row className="label-row">
                                <Col>
                                    <p>Услуги</p>
                                </Col>
                            </Row>
                            <Row className="value-row">
                                <Col>
                                    <p>{serviceCategory?.services?.length ?? '-'}</p>
                                </Col>
                            </Row>
                        </Col>
                        <Col className="outer-box">
                            <Row className="label-row">
                                <Col>
                                    <p>Подкатегории</p>
                                </Col>
                            </Row>
                            <Row className="value-row">
                                <Col>
                                    <p>{serviceCategory?.categories?.length ?? '-'}</p>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                )}
            </div>
        </div>
    );
};

export { ServiceCategoryProfile };
