import {
    faBarcode,
    faBars,
    faCheck,
    faEdit,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Col, Dropdown, Input, Row, Select } from 'antd';
import { useEffect, useState, useRef,  } from 'react';
import { ProductResp } from '@api/responseModels/product/productResponse';
import { RequestResult } from '@api/responseModels/requestResult';
import { CRMAPIManager } from '@classes/crmApiManager';
import { messageService } from '@classes/messageService';
import { SettingsManager } from '@classes/settingsManager';
import { TProduct } from 'types/product';
import { TProductCategory } from 'types/productCategory';
import { Loader } from '@atoms/loader';
import { ProductCategoryPicker } from '../pickers/productCategoryPicker';
import { sendRequest } from '@api/sendRequest';
import { ImgUploader } from '@organisms/imgUploader/imgUploader';
import { CategoryPickerUsage } from '@enums/categoryPickerUsage';
import { HeaderBreadcrumbProfiles } from '@molecules/breadcrumbs/profilesBreadcrumbs/HeaderProfilesBreadcrumb';
import { useNavigate, useLocation } from 'react-router';
import { LastIdStore } from '@pages/lastIdStore';
const { TextArea } = Input;

const ProductProfile = (): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [product, setProduct] = useState<TProduct & { category: TProductCategory }>(null);
    const [editing, setEditing] = useState<boolean>(false);
    const [newProduct, setNewProduct] = useState<boolean>(false);
    const [isProductCategoryOpen, setIsProductCategoryOpen] = useState<boolean>(false);
    const currentID = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const creds = SettingsManager.getConnectionCredentials();
    
    async function getProduct() {
        setIsLoading(true);
        try {
            const creds = SettingsManager.getConnectionCredentials();
            const prod = await CRMAPIManager.request<ProductResp>(async (api) => {
                return await api.getProduct(currentID.current || LastIdStore.lastProductId, creds.crmID);
            });
            if (prod.errorMessages) throw prod.errorMessages;
            setProduct(prod.data.data);
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
    }

    async function handleEditing() {
        navigate(`/lk/worker/crm/${creds.crmID}/products/${currentID.current || LastIdStore.lastProductId}/edit`);
        setEditing(true);
    }

    function validateBeforeSave(): boolean {
        if (product.name == '' || product.name === null) {
            messageService.sendError('Имя товара не может быть пустым!');
            return false;
        }
        if (product.artnumber == null) {
            messageService.sendError('Артикул не может быть пустым');
            return false;
        }
        if (product.barcode == null) {
            messageService.sendError('Штрих-код не может быть пустым');
            return false;
        }
        if (product.price == null || product.price <= 0 || product.price > 9999999.99) {
            messageService.sendError('Цена должна быть от 0,1 до 9 999 999,99 рублей');
            return false;
        }
        // if(product.product_category_id == null || productCategoryList.find((pc)=> pc.id == product.product_category_id) == null) {
        //     messageService.sendError("Выберите категорию товара");
        //     return false;
        // }
        if (product.quantity == null || product.quantity < 0 || product.quantity > 99999) {
            messageService.sendError('Количество должно быть от 0 до 99999 штук');
            return false;
        }
        return true;
    }

    function prepareDataForRequest(product: TProduct & { category: TProductCategory }): FormData {
        const isPictureNotUpdating =
            typeof product.picture === 'string' && product.picture !== 'null'; // send 'null' for deleting current picture
        const productObj = {
            ...product,
            picture: isPictureNotUpdating ? null : product.picture,
            product_category_id: product.category?.id ? String(product.category.id) : null,
            id: String(product.id),
            crm_id: String(product.crm_id),
            price: String(product.price),
            quantity: String(product.quantity),
        };
        delete productObj.category;
        delete productObj.services; // temporary deleted, (need to be serialized before sending to back)
        const formData = new FormData();
        for (const key in productObj) {
            if (productObj[key] !== null) {
                formData.append(key, productObj[key]);
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
            const formData = prepareDataForRequest(product);
            const prod: RequestResult<ProductResp> = newProduct
                ? await sendRequest<ProductResp>('/product/save', formData)
                : await sendRequest('/product/update', formData);
            if (prod.errorMessages) throw prod.errorMessages;
            setProduct(prod.data.data);
            setEditing(false);
            navigate(`/lk/worker/crm/${creds.crmID}/products/${prod.data.data.id || LastIdStore.lastProductId}`);
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
    }

    async function handleAbortEditing() {
        setIsLoading(true);
        setEditing(false);
        navigate(`/lk/worker/crm/${creds.crmID}/products/${currentID.current || LastIdStore.lastProductId}`);
        if (newProduct) {
            LastIdStore.setLastProductId(null);
        } else {
            await getProduct();
        }
        setIsLoading(false);
    }

    function handleImageSelect(file: File) {
        setProduct((prevState) => ({ ...prevState, picture: file }));
    }

    function handleImageDelete() {
        setProduct((prevState) => ({ ...prevState, picture: 'null' }));
    }

    function checkCurrentUrl() {
        if (location.pathname.includes('edit')) setEditing(true);
        else if (location.pathname.includes('create')) {
            setEditing(true);
        } else {
            setEditing(false);
        }
    }

    async function checkProductBelongToCrm() {
        try {
            const urlArr = window.location.pathname.split('/');
            if (urlArr[urlArr.length - 1] == 'edit') {
                currentID.current = Number(urlArr[urlArr.length - 2]);
            } else {
                currentID.current = Number(urlArr[urlArr.length - 1]);
            }
            const prod = await CRMAPIManager.request<ProductResp>(async (api) => {
                return await api.getProduct(currentID.current, creds.crmID);
            });
            if (!isNaN(currentID.current) && prod.statusCode == 404) {
                navigate(`/lk/worker/crm/${creds.crmID}/products`);
            } 
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
    }

    function calculatePrice() {
        const marginType = product?.margin_type;

        let price = 0;

        switch (marginType) {
            case 0:
                price = Number.parseFloat(`${product?.gross_price}`) + (Number.parseFloat(`${product?.gross_price}`) * Number.parseFloat(`${product?.margin}`) / 100);
                break;
            default:
                price = Number.parseFloat(`${product?.gross_price}`) + Number.parseFloat(`${product?.margin}`);
                break;
        }

        setProduct({
            ...product,
            price: price,
        });
    }

    async function beforeMountProductProfile() {
        checkCurrentUrl();
        checkProductBelongToCrm().then(async () => {
            if (currentID.current != 0 && Number.isNaN(!currentID.current)) {
                await getProduct();
            }
                //    else if (productId == null) {
                //         navigate(`/lk/worker/crm/${creds.crmID}/products`);
                //         messageService.sendError('Требуется указать ID товара.');
            //     }
            else if (
                Number.isNaN(currentID.current) ||
                LastIdStore.lastProductId == -1 ||
                (LastIdStore.lastProductId >= 0 && (LastIdStore.lastProductId * 10) % 10 === 1)
            ) {
                setNewProduct(true);
                setEditing(true);
                setProduct({
                    id: -1,
                    name: null,
                    description: null,
                    picture: '/storage/images/products/noimage.png',
                    artnumber: null,
                    barcode: null,
                    gross_price: 0,
                    price_type: 0,
                    margin: 0,
                    margin_type: 0,
                    price: 0,
                    product_category_id: LastIdStore.lastProductCategoryId,
                    quantity: 1,
                    cell: null,
                    comment: null,
                    crm_id: SettingsManager.getConnectionCredentials().crmID,
                    category: null,
                });
                setIsLoading(false);
            } else {
                await getProduct();
            }
        });
    }

    useEffect(() => {
        beforeMountProductProfile();
    }, [LastIdStore.lastProductId]);

    useEffect(() => {
        if (editing) {
            calculatePrice();
        }
    }, [product?.margin, product?.gross_price, product?.margin_type])

    return (
        <div id="app-product-profile">
            {isLoading && <Loader />}
            {isProductCategoryOpen && (
                <ProductCategoryPicker
                    isModalOpen={isProductCategoryOpen}
                    setIsModalOpen={setIsProductCategoryOpen}
                    currentCategorySelected={product.category}
                    setCurrentCategorySelected={(sel: TProductCategory) => {
                        const tProduct = product;
                        setProduct({ ...tProduct, product_category_id: sel?.id, category: sel });
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
                dataIcon={faBarcode}
                dataId={product?.id}
                dataTitle={'Товары'}
                title={'Профиль товара'}
                route={`/lk/worker/crm/${creds?.crmID}/products`}
                dataName={'Новый товар'}
                isForInvitation={false}
                isSpecialty={false}
            />
            <div className="product-profile">
                <Row className="product-info">
                    <Col className="avatar outer-box" flex={1}>
                        <ImgUploader
                            photoSrc={product?.picture as string}
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
                                        value={product?.name}
                                        onChange={(e) =>
                                            setProduct({ ...product, name: e.target.value })
                                        }
                                    />
                                ) : (
                                    <p>{product?.name}</p>
                                )}
                            </Col>
                        </Row>
                    </Col>
                    <Col className="outer-box" flex={1}>
                        <Row className="label-row">
                            <Col>
                                <p>Артикул</p>
                            </Col>
                        </Row>
                        <Row className="value-row">
                            <Col>
                                {editing ? (
                                    <Input
                                        value={product?.artnumber}
                                        onChange={(e) =>
                                            setProduct({ ...product, artnumber: e.target.value })
                                        }
                                    />
                                ) : (
                                    <p>{product?.artnumber}</p>
                                )}
                            </Col>
                        </Row>
                    </Col>
                </Row>
                <Row className="product-info">
                    <Col className="outer-box" flex={1}>
                        <Row className="label-row">
                            <Col>
                                <p>Штрих-код</p>
                            </Col>
                        </Row>
                        <Row className="value-row">
                            <Col>
                                {editing ? (
                                    <Input
                                        value={product?.barcode}
                                        onChange={(e) =>
                                            setProduct({ ...product, barcode: e.target.value })
                                        }
                                    />
                                ) : (
                                    <p>{product?.barcode}</p>
                                )}
                            </Col>
                        </Row>
                    </Col>
                    <Col className="outer-box" flex={1}>
                        <Row className="label-row">
                            <Col>
                                <p>Категория</p>
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
                                        {product?.product_category_id ??
                                            product?.category?.name ??
                                            'Не выбрана'}
                                    </a>
                                ) : (
                                    <p>{product?.category?.name ?? 'Не выбрана'}</p>
                                )}
                            </Col>
                        </Row>
                    </Col>

                </Row>
                <Row className="outer-box" align={"middle"} justify={"space-around"}>
                    <Col>
                        <Row className={"label-row"}>
                            <Col>
                                <p>Закупочная цена</p>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                {editing ? (
                                    <Input
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        max={9999999}
                                        step={0.01}
                                        value={product?.gross_price}
                                        onChange={(e) =>
                                            setProduct({
                                                ...product,
                                                gross_price: Number.parseFloat(e.target.value),
                                            })
                                        }
                                    />
                                ) : (
                                    <p>{Number(product?.gross_price).toFixed(2)}</p>
                                )}
                            </Col>
                            <Col>
                                { editing ? (
                                    <Select
                                        defaultValue={Number(product?.price_type) ? 'шт' : 'кг'}
                                        options={[
                                            {
                                                value: 0,
                                                label: 'шт',
                                            },
                                            {
                                                value: 1,
                                                label: 'кг',
                                            },
                                        ]}
                                        onChange={(e) => setProduct({
                                            ...product,
                                            price_type: Number(e),
                                        })}
                                    />
                                ) : (
                                    <span>&nbsp;{Number(product?.price_type) ? 'шт' : 'кг'}</span>
                                ) }
                            </Col>
                        </Row>
                    </Col>
                    <Col>
                        <Row className={"label-row"}>
                            <Col>
                                <p>Наценка</p>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                { editing ? (

                                    <Input
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        max={Number(product?.margin_type) ? 999999 : 100}
                                        step={0.01}
                                        value={product?.margin}
                                        onChange={(e) =>
                                            setProduct({
                                                ...product,
                                                margin: Number.parseFloat(e.target.value),
                                            })
                                        }
                                    />
                                ) : (
                                    <p>{Number(product?.margin).toFixed(2)}</p>
                                ) }
                            </Col>
                            <Col>
                                { editing ? (
                                    <Select
                                        defaultValue={Number(product?.margin_type) ? 'руб' : '%'}
                                        options={[
                                            {
                                                value: 0,
                                                label: '%',
                                            },
                                            {
                                                value: 1,
                                                label: 'руб',
                                            },
                                        ]}
                                        onChange={(e) => setProduct({
                                            ...product,
                                            margin_type: Number(e),
                                        })}
                                    />
                                ) : (
                                    <span>&nbsp;{Number(product?.margin_type) ? 'руб' : '%'}</span>
                                ) }
                            </Col>
                        </Row>
                    </Col>
                    <Col>
                        <Row className={"label-row"}>
                            <Col>
                                <p>Цена</p>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <p>{Number(product?.price).toFixed(2) + ' руб'}</p>
                            </Col>
                        </Row>
                    </Col>
                </Row>
                <Row className="product-info">
                    <Col className="outer-box" flex={1}>
                        <Row className="label-row">
                            <Col>
                                <p>Соп. услуги</p>
                            </Col>
                        </Row>
                        <Row className="value-row">
                            <Col>
                                <p>{Math.floor(Math.random() * 10)}</p>
                            </Col>
                        </Row>
                    </Col>
                    <Col className="outer-box" flex={1}>
                        <Row className="label-row">
                            <Col>
                                <p>Кол-во на складах</p>
                            </Col>
                        </Row>
                        <Row className="value-row">
                            <Col>
                                {editing ? (
                                    <Input
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        max={99999}
                                        step={1}
                                        value={product?.quantity}
                                        onChange={(e) =>
                                            setProduct({
                                                ...product,
                                                quantity: Number.parseInt(e.target.value),
                                            })
                                        }
                                    />
                                ) : (
                                    <p>{product?.quantity}</p>
                                )}
                            </Col>
                        </Row>
                    </Col>
                </Row>
                <Row className="product-comment outer-box">
                    <Col>
                        <Row className="label-row">
                            <Col>
                                <p>Описание</p>
                            </Col>
                        </Row>
                        <Row className="value-row">
                            <Col>
                                {editing ? (
                                    <Input
                                        value={product?.description}
                                        onChange={(e) =>
                                            setProduct({ ...product, description: e.target.value })
                                        }
                                    />
                                ) : (
                                    <p>{product?.description}</p>
                                )}
                            </Col>
                        </Row>
                    </Col>
                </Row>
                <Row className="product-comment outer-box">
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
                                            setProduct({ ...product, comment: e.target.value })
                                        }
                                        value={product?.comment}
                                    />
                                ) : (
                                    <p>{product?.comment}</p>
                                )}
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export { ProductProfile };
