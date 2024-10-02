import { sendRequest } from '@api/sendRequest';
import { CategoryPickerUsage } from '@enums/categoryPickerUsage';
import {
    faBars,
    faCheck,
    faEdit,
    faListCheck,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { HeaderBreadcrumbProfiles } from '@molecules/breadcrumbs/profilesBreadcrumbs/HeaderProfilesBreadcrumb';
import { ImgUploader } from '@organisms/imgUploader/imgUploader';
import { Col, Dropdown, Input, Row } from 'antd';
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ProductCategoryResp } from '../../../api/responseModels/product/productCategoryResponse';
import { CRMAPIManager } from '../../../classes/crmApiManager';
import { messageService } from '../../../classes/messageService';
import { SettingsManager } from '../../../classes/settingsManager';
import { TProduct } from '../../../types/product';
import { TProductCategory } from '../../../types/productCategory';
import { Loader } from '../../atoms/loader';
import { ProductCategoryPicker } from '../pickers/productCategoryPicker';
import { Common } from '../../../classes/commonMethods';
import { GlobalConstants } from '@constants/global';
import { LastIdStore } from '@pages/lastIdStore';

const ProductCategoryProfile = (): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [productCategory, setProductCategory] = useState<
        TProductCategory & { products: Array<TProduct>; categories: Array<TProductCategory> }
    >(null);
    const [editing, setEditing] = useState<boolean>(false);
    const [isProductCategoryOpen, setIsProductCategoryOpen] = useState<boolean>(false);
    const [isNewCategory, setIsNewCategory] = useState<boolean>(false);
    const currentID = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const creds = SettingsManager.getConnectionCredentials();

    function checkCurrentUrl() {
        if (location.pathname.includes('create')) {
            setEditing(true);
        } else if (location.pathname.includes('edit')) {
            setEditing(true);
        }
    }

    async function getProductCategory() {
        setIsLoading(true);
        try {
            const prodCat = await CRMAPIManager.request<ProductCategoryResp>(async (api) => {
                return await api.getProductCategory(
                    currentID.current || LastIdStore.lastProductCategoryId,
                    creds.crmID
                );
            });
            if (prodCat.errorMessages) throw prodCat.errorMessages;
            setProductCategory(prodCat.data.data);
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
    }

    function handleEditing() {
        navigate(`/lk/worker/crm/${creds.crmID}/product-category/${productCategory.id || currentID.current}/edit`);
        setEditing(true);
    }

    function prepareDataForRequest(
        productCategory: TProductCategory & {
            products: Array<TProduct>;
            categories: Array<TProductCategory>;
        }
    ): FormData {
        const isPictureNotUpdating =
            typeof productCategory.picture === 'string' && productCategory.picture !== 'null'; // send 'null' for deleting current picture
        const productCategoryObj = {
            ...productCategory,
            picture: isPictureNotUpdating ? null : productCategory.picture,
            id: String(productCategory.id),
            crm_id: String(productCategory.crm_id),
            parent_product_category_id:
                typeof productCategory.parent_product_category_id === 'number'
                    ? String(productCategory.parent_product_category_id)
                    : null,
        };
        if (isNewCategory) {
            delete productCategoryObj.id;
            delete productCategoryObj.categories;
            delete productCategoryObj.products;
        }
        const formData = new FormData();
        for (const key in productCategoryObj) {
            if (productCategoryObj[key] !== null) {
                formData.append(key, productCategoryObj[key]);
            }
        }
        return formData;
    }

    async function handleSaveEditing() {
        if (productCategory.name === '' || productCategory.name === null) {
            messageService.sendError('Имя категории товаров не может быть пустым!');
            return;
        }
        setIsLoading(true);
        setEditing(false);
        try {
            const formData = prepareDataForRequest(productCategory);
            const prodCat = isNewCategory
                ? await sendRequest<ProductCategoryResp>('/productCategory/save', formData)
                : await sendRequest<ProductCategoryResp>('/productCategory/update', formData);
            if (prodCat.errorMessages) throw prodCat.errorMessages;
            setProductCategory(prodCat.data.data);
            setIsNewCategory(false);
            navBack();
            if (isNewCategory) LastIdStore.setLastProductCategoryId(null);
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
    }

    async function handleAbortEditing() {
        setIsLoading(true);
        setEditing(false);
        if (isNewCategory) {
            LastIdStore.setLastProductCategoryId(null);
        } else {
            await getProductCategory();
        }
        setIsLoading(false);
        navBack();
    }

    function navBack() {
        location.state?.from.pathname == `/lk/worker/crm/${creds.crmID}/product-categories`
        ? navigate(`/lk/worker/crm/${creds.crmID}/product-categories`)
        : navigate(-1);
    }

    function filterSubcategoriesById(categories: Array<TProductCategory>) {
        return categories.map((el) => el.id);
    }

    function handleImageSelect(file: File) {
        setProductCategory((prevState) => ({ ...prevState, picture: file }));
    }

    function handleImageDelete() {
        setProductCategory((prevState) => ({ ...prevState, picture: 'null' }));
    }

    async function checkProductCategoryBelongToCrm() {
        try {
            const urlArr = window.location.pathname.split('/');
            if (urlArr[urlArr.length - 1] == 'edit') {
                currentID.current = Number(urlArr[urlArr.length - 2]);
            } else {
                currentID.current = Number(urlArr[urlArr.length - 1]);
            }
            const prodCat = await CRMAPIManager.request<ProductCategoryResp>(async (api) => {
                return await api.getProductCategory(currentID.current, creds.crmID);
            });
            if (!isNaN(currentID.current) && prodCat.statusCode == 404) {
                navigate(`/lk/worker/crm/${creds.crmID}/product-category`);
            }
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
    }

    function beforeMountProductCategory() {
        checkCurrentUrl();
        Common.checkUserBelongToCrm(GlobalConstants.CrmOrderinUrl).then((res) => {
            if (!res) navigate(`/lk/worker/crm/${creds.crmID}`);
        });
        if (!isNaN(currentID.current))
            checkProductCategoryBelongToCrm().then(() => {
                if (currentID.current != 0 && Number.isNaN(!currentID.current)) {
                    getProductCategory();
                } else if (
                    Number.isNaN(currentID.current) ||
                    LastIdStore.lastProductCategoryId === -1 ||
                    (LastIdStore.lastProductCategoryId >= 0 && (LastIdStore.lastProductCategoryId * 10) % 10 === 1)
                ) {
                    setIsNewCategory(true);
                    setEditing(true);
                    setProductCategory({
                        id: -1,
                        name: null,
                        picture: null,
                        crm_id: SettingsManager.getConnectionCredentials().crmID,
                        categories: [],
                        products: [],
                        products_count: 0,
                        quantity_total: 0,
                        parent_product_category_id: LastIdStore.lastProductCategoryId,
                    });
                } else {
                    getProductCategory();
                }
            });
    }

    useEffect(() => {
        beforeMountProductCategory();
    }, [LastIdStore.lastProductCategoryId]);

    return (
        <div id="app-product-category-profile">
            {isLoading && <Loader />}
            {isProductCategoryOpen && (
                <ProductCategoryPicker
                    isModalOpen={isProductCategoryOpen}
                    setIsModalOpen={setIsProductCategoryOpen}
                    currentCategorySelected={productCategory}
                    setCurrentCategorySelected={(sel: TProductCategory) => {
                        const tProductCategory = productCategory;
                        setProductCategory({
                            ...tProductCategory,
                            parent_product_category_id: sel?.id,
                        });
                    }}
                    categoryData={{
                        id: productCategory.id,
                        parent_product_category_id: productCategory.parent_product_category_id,
                        subCategoriesId: filterSubcategoriesById(productCategory.categories),
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
                dataIcon={faListCheck}
                dataId={productCategory?.id}
                dataTitle={'Категории товаров'}
                title={'Профиль категории товара'}
                route={`/lk/worker/crm/${creds?.crmID}/product-category`}
                dataName={'Новая категория'}
                isForInvitation={false}
                isSpecialty={false}
            />
            <div className="product-category-profile">
                <Row className="product-category-info three-blocks">
                    <Col className="avatar outer-box">
                        <ImgUploader
                            photoSrc={productCategory?.picture as string}
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
                                        value={productCategory?.name}
                                        onChange={(e) =>
                                            setProductCategory({
                                                ...productCategory,
                                                name: e.target.value,
                                            })
                                        }
                                    />
                                ) : (
                                    <p>{productCategory?.name}</p>
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
                                if (editing) setIsProductCategoryOpen(true);
                            }}
                        >
                            <Col>
                                {editing ? (
                                    <a>
                                        {productCategory?.parent_product_category_id ??
                                            'Не выбрана'}
                                    </a>
                                ) : (
                                    <p>
                                        {productCategory?.parent_product_category_id ??
                                            'Не выбрана'}
                                    </p>
                                )}
                            </Col>
                        </Row>
                    </Col>
                </Row>
                {!isNewCategory && (
                    <Row className="product-category-info two-blocks">
                        <Col className="outer-box">
                            <Row className="label-row">
                                <Col>
                                    <p>Товары</p>
                                </Col>
                            </Row>
                            <Row className="value-row">
                                <Col>
                                    <p>{productCategory?.products?.length ?? '-'}</p>
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
                                    <p>{productCategory?.categories?.length ?? '-'}</p>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                )}
            </div>
        </div>
    );
};

export { ProductCategoryProfile };
