import React, { useEffect, useRef, useState } from 'react';
import {
    Button,
    Carousel,
    Checkbox,
    Col,
    DatePicker,
    DatePickerProps,
    Dropdown,
    Input,
    InputNumber,
    Menu,
    message,
    Row,
    Table,
    UploadProps,
} from 'antd';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBars,
    faChevronLeft,
    faChevronRight,
    faEdit,
    faSave,
    faTrash,
    faTrashCan,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { CarouselRef } from 'antd/lib/carousel';
import { ColumnsType } from 'antd/es/table';
import { TOrderService } from 'types/Orders/services';
import { TOrderProduct } from 'types/Orders/products';
import { TOrder } from 'types/Orders/order';
import { useNavigate, useParams } from 'react-router-dom';
import { SettingsManager } from '@classes/settingsManager';
import { CRMAPIManager } from '@classes/crmApiManager';
import { OrderResp } from '@api/responseModels/order/orderResponse';
import { messageService } from '@classes/messageService';
import moment from 'moment';
import { SearchInput } from '@molecules/tables/inputs/searchInput';
import { OrderEditResp } from '@api/responseModels/order/orderEditResponse';
import { TUser } from 'types/user';
import { OrderCustomerPicker } from '@organisms/pickers/orderCustomerPicker';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { Loader } from '@atoms/loader';
import { TOrderDetails } from 'types/Orders/details';
import { OrderDetailsResp } from '@api/responseModels/order/orderDetailsResponse';
import { OrderDetailsSyncResp } from '@api/responseModels/order/orderDetailsSyncResponse';
import { GlobalConstants } from '@constants/global';
import './orderEdit.scss';

dayjs.extend(customParseFormat);
const { TextArea } = Input;

const uploadP: UploadProps = {
    name: 'file',
    action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
    headers: {
        authorization: 'authorization-text',
    },
    onChange(info) {
        if (info.file.status !== 'uploading') {
            console.log(info.file, info.fileList);
        }
        if (info.file.status === 'done') {
            message.success(`${info.file.name} file uploaded successfully`);
        } else if (info.file.status === 'error') {
            message.error(`${info.file.name} file upload failed.`);
        }
    },
};

const initialServiceData: Array<TOrderService> = [
    { id: null, name: '', quantity: null, price: null, total: null },
    { id: null, name: '', quantity: null, price: null, total: null },
    { id: null, name: '', quantity: null, price: null, total: null },
];

const initialProductData: Array<TOrderProduct> = [
    { id: null, name: '', quantity: null, price: null, total: null },
    { id: null, name: '', quantity: null, price: null, total: null },
    { id: null, name: '', quantity: null, price: null, total: null },
];

const initialDetailsData: Array<TOrderDetails> = [
    { id: null, name: '', value: '', profile_id: null, checked: false },
    { id: null, name: '', value: '', profile_id: null, checked: false },
];

const disabledDate: DatePickerProps['disabledDate'] = (current) => {
    // Can not select days before today and today
    return current && current < dayjs().endOf('day');
};

const OrderEdit = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [orderData, setOrderData] = useState<TOrder>();
    const [currentOrderCustomer, setCurrentOrderCustomer] = useState<TUser>();
    const [detailsData, setDetailsData] = useState<Array<TOrderDetails>>(initialDetailsData);
    const [timePicked, setTimePicked] = useState<boolean>(true);
    const [totalService, setTotalService] = useState<number>(null);
    const [totalProduct, setTotalProduct] = useState<number>(null);
    const [isDelete, setIsDelete] = useState<boolean>(false);
    const [productData, setProductData] = useState<Array<TOrderProduct>>(initialServiceData);
    const [serviceData, setServiceData] = useState<Array<TOrderService>>(initialProductData);
    const navigate = useNavigate();
    const params = useParams();
    const creds = SettingsManager.getConnectionCredentials();
    const sliderStatusRef = useRef<CarouselRef>(null);

    const arrObj = [
        { id: 1, statusTime: 100 },
        { id: 2, statusTime: 70 },
        { id: 3, statusTime: 40 },
        { id: 4, statusTime: 0 },
        { id: 5, statusTime: 0 },
        { id: 6, statusTime: 0 },
        { id: 7, statusTime: 0 },
    ];
    const btnCarouselProp = {
        slidesToShow: 1,
        centerMode: false,
        draggable: true,
        swipeToSlide: true,
        dots: false,
        infinite: false,
    };

    const columnsService: ColumnsType<TOrderService> = [
        {
            title: '№',
            dataIndex: 'id',
            width: 20,
            key: 'id',
            render: (_text, _record, index) => {
                return (
                    <div className="d-flex justify-content-center align-content-center">
                        <span>{index + 1}</span>
                    </div>
                );
            },
        },
        {
            title: 'Услуги',
            dataIndex: 'name',
            width: 120,
            key: 'name',
            render: (_text, record, index) => {
                return (
                    <>
                        <SearchInput
                            placeholder="Введите наименование услуги"
                            style={{ minWidth: '193px', maxWidth: '274px', width: '100%' }}
                            fetchType="service"
                            setDataOrder={handleSearchInput}
                            rowIndex={index}
                            defaultValue={record.name}
                        />
                    </>
                );
            },
        },
        {
            title: 'Кол-во',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 55,
            render: (__, record, index) => {
                return (
                    <>
                        <InputNumber
                            min={1}
                            max={1000}
                            value={record.quantity}
                            style={{ width: '100%' }}
                            controls={false}
                            onChange={(value) => handleChangeQuantity(index, value, 'service')}
                        />
                    </>
                );
            },
        },
        {
            title: 'Цена',
            dataIndex: 'price',
            width: 60,
            key: 'price',
            render: (__, record, index) => {
                return (
                    <>
                        <InputNumber
                            min={1}
                            value={record.price}
                            style={{ width: '100%' }}
                            controls={false}
                            onChange={(value) => handleChangePrice(index, value, 'service')}
                        />
                    </>
                );
            },
        },
        {
            title: 'Сумма',
            dataIndex: 'total',
            key: 'total',
            width: 100,
        },
        {
            title: 'Удалить',
            fixed: 'right',
            width: '10%',
            render: (_, record, index) => {
                return (
                    <div
                        style={{ textAlign: 'center' }}
                        onClick={() => handleDeleteClick(index, 'service')}
                    >
                        <FontAwesomeIcon icon={faXmark} color="white" className="btn-delete" />
                    </div>
                );
            },
        },
    ];
    const columnsProduct: ColumnsType<TOrderProduct> = [
        {
            title: '№',
            dataIndex: 'id',
            width: 20,
            key: 'id',
            render: (_text, _record, index) => {
                return (
                    <div className="d-flex justify-content-center align-content-center">
                        <span>{index + 1}</span>
                    </div>
                );
            },
        },
        {
            title: 'Товары',
            dataIndex: 'name',
            width: 120,
            key: 'name',
            render: (_text, record, index) => {
                return (
                    <>
                        <SearchInput
                            placeholder="Введите наименование товара"
                            style={{ minWidth: '193px', maxWidth: '274px' }}
                            fetchType="product"
                            setDataOrder={handleSearchInput}
                            rowIndex={index}
                            defaultValue={record.name}
                        />
                    </>
                );
            },
        },
        {
            title: 'Кол-во',
            dataIndex: 'quantity',
            width: 55,
            key: 'quantity',
            render: (__, record, index) => {
                return (
                    <>
                        <InputNumber
                            min={1}
                            max={1000}
                            style={{ width: '100%' }}
                            value={record.quantity}
                            controls={false}
                            onChange={(value) => handleChangeQuantity(index, value, 'product')}
                        />
                    </>
                );
            },
        },
        {
            title: 'Цена',
            dataIndex: 'price',
            width: 60,
            key: 'price',
            render: (__, record, index) => {
                return (
                    <>
                        <InputNumber
                            min={1}
                            value={record.price}
                            style={{ width: '100%' }}
                            controls={false}
                            onChange={(value) => handleChangePrice(index, value, 'product')}
                        />
                    </>
                );
            },
        },
        {
            title: 'Сумма',
            dataIndex: 'total',
            width: 100,
            key: 'total',
        },
        {
            title: 'Удалить',
            fixed: 'right',
            width: '10%',
            render: (_, record, index) => {
                return (
                    <div
                        style={{ textAlign: 'center' }}
                        onClick={() => handleDeleteClick(index, 'product')}
                    >
                        <FontAwesomeIcon icon={faXmark} color="white" className="btn-delete" />
                    </div>
                );
            },
        },
    ];
    const columnsOrderDetails: ColumnsType<TOrderDetails> = [
        {
            title: '№',
            dataIndex: 'id',
            width: '10%',
            key: 'key',
            render: (_text, record, index) => {
                return (
                    <>
                        <Checkbox
                            checked={record.checked}
                            disabled={
                                record.id == null ||
                                record.name.trim() == '' ||
                                record.value.trim() == ''
                            }
                            onChange={(e) => onCheckboxChange(e.target.checked, index)}
                        >
                            {index + 1}
                        </Checkbox>
                    </>
                );
            },
        },
        {
            title: 'Поля документа',
            dataIndex: 'name',
            key: 'name',
            render: (_text, record, index) => {
                return (
                    <>
                        <Input
                            type="text"
                            value={record.name}
                            key={`name-${index}`}
                            onChange={handleChangeDetails(index, 'name')}
                        />
                    </>
                );
            },
        },
        {
            title: 'Описание полей',
            dataIndex: 'value',
            key: 'value',
            render: (_text, record, index) => {
                return (
                    <>
                        <Input
                            type="text"
                            value={record.value}
                            key={`name-${index}`}
                            onChange={handleChangeDetails(index, 'value')}
                        />
                    </>
                );
            },
        },
        {
            title: 'Действие',
            fixed: 'right',
            width: '15%',
            render: (_text, record, index) => {
                return (
                    <Row>
                        <Button
                            disabled={
                                record.name.replace(/ /g, '') == '' ||
                                record.value.replace(/ /g, '') == ''
                            }
                            onClick={() => saveDetailsOrder(record)}
                            hidden={record.id != null}
                        >
                            <FontAwesomeIcon icon={faSave} color="green" />
                        </Button>
                        <Button
                            hidden={record.id != null}
                            onClick={() => handleDeleteDetailParam(index)}
                            disabled={
                                record.name.replace(/ /g, '') == '' ||
                                record.value.replace(/ /g, '') == ''
                            }
                        >
                            <FontAwesomeIcon icon={faTrash} color="red" />
                        </Button>
                        <Button
                            disabled={
                                record.name.replace(/ /g, '') == '' ||
                                record.value.replace(/ /g, '') == ''
                            }
                            onClick={() => updateDetailsOrder(record)}
                            hidden={record.id == null}
                        >
                            <FontAwesomeIcon icon={faEdit} color="blue" />
                        </Button>
                        <Button
                            hidden={record.id == null}
                            onClick={() => removeDetailsOrder(record)}
                        >
                            <FontAwesomeIcon icon={faTrashCan} color="red" />
                        </Button>
                    </Row>
                );
            },
        },
    ];

    async function getDetailsOrder(profileId, details = null) {
        setIsLoadingDetails(true);
        try {
            details = details ?? detailsData;
            const tdetails = await CRMAPIManager.request<OrderDetailsResp>(async (api) => {
                return await api.getOrderDetails(creds.crmID, profileId);
            });

            if (tdetails.errorMessages) throw tdetails.errorMessages;

            setDetailsData(() => {
                if (tdetails.data.data.length == 0) {
                    return initialDetailsData;
                } else {
                    if (orderData?.customer && orderData?.customer != profileId) {
                        return [
                            ...tdetails.data.data,
                            { id: null, name: '', value: '', profile_id: null, checked: false },
                        ];
                    }

                    const data = tdetails.data.data.reduce((acc, rec, index) => {
                        const foundIndex = details.findIndex((item) => item.id == rec.id);
                        rec =
                            foundIndex != -1
                                ? { ...rec, checked: true }
                                : { ...rec, checked: false };
                        acc[index] = rec;
                        return acc;
                    }, []);
                    data[data.length] = {
                        id: null,
                        name: '',
                        value: '',
                        profile_id: null,
                        checked: false,
                    };

                    return [...data];
                }
            });
        } catch (err) {
            messageService.sendErrorList(err);
        }
        await setIsLoadingDetails(false);
    }

    const handleDeleteClick = (index: number, type: string) => {
        setIsDelete(true);

        const functions = {
            product: setProductData,
            service: setServiceData,
        };
        functions[type]((prev) => {
            prev.splice(index, 1);
            prev.length == 1
                ? prev.push({ id: null, name: '', quantity: null, price: null, total: null })
                : prev;
            return [...prev];
        });
    };

    const handleChangeDetails =
        (index: number, type: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
            const { value } = event.target;
            setDetailsData((prev) => {
                if (type === 'name') {
                    prev[index] = {
                        ...prev[index],
                        name: value,
                    };
                } else {
                    prev[index] = {
                        ...prev[index],
                        value: value,
                    };
                }

                return [...prev];
            });
        };
    const handleDeleteDetailParam = (index: number) => {
        setDetailsData((prev) => {
            prev[index] = {
                id: null,
                name: '',
                value: '',
                profile_id: null,
                checked: false,
            };

            return [...prev];
        });
    };

    function prepareDetailsDataForRequest(details: TOrderDetails, method: string): object {
        let profileId = orderData?.customer;
        if (!!currentOrderCustomer && currentOrderCustomer?.customer_profile?.id != profileId) {
            profileId = currentOrderCustomer?.customer_profile?.id;
        }
        switch (method) {
            case 'save':
                return {
                    name: details?.name,
                    value: details?.value,
                    profile_type: 'customer',
                    profile_id: profileId,
                    crm_id: creds?.crmID,
                };
            case 'update':
                return {
                    id: details?.id,
                    name: details?.name,
                    value: details?.value,
                    crm_id: creds?.crmID,
                };
            default:
                return {};
        }
    }

    function prepareDetailsDataForSyncRequest(details: Array<TOrderDetails>, id: number) {
        const data = details
            .reduce((acc, rec) => {
                if (rec.checked) {
                    acc.push(rec.id);
                }
                return acc;
            }, [])
            .filter((item) => !!item);

        return {
            crm_id: creds.crmID,
            id: id,
            customer_order_params: data,
        };
    }

    async function saveDetailsOrder(detailParam: TOrderDetails) {
        setIsLoadingDetails(true);
        try {
            let profileId;

            if (
                !currentOrderCustomer ||
                orderData.customer == currentOrderCustomer?.customer_profile?.id
            ) {
                profileId = orderData.customer;
            } else {
                profileId = currentOrderCustomer?.customer_profile?.id;
            }
            // const formData = prepareDetailsDataForRequest(detailParam, 'save');
            const detail = await CRMAPIManager.request<OrderDetailsResp>(async (api) => {
                return await api.saveDetail(
                    detailParam?.name,
                    detailParam?.value,
                    profileId,
                    'customer',
                    creds?.crmID
                );
            });

            if (detail.errorMessages) throw detail.errorMessages;

            await getDetailsOrder(profileId);
        } catch (err) {
            messageService.sendErrorList(err);
        }
        setIsLoadingDetails(false);
    }

    async function updateDetailsOrder(detailParam: TOrderDetails) {
        setIsLoadingDetails(true);
        try {
            let profileId;
            // const formData = prepareDetailsDataForRequest(detailParam, 'update');
            const detail = await CRMAPIManager.request<OrderDetailsResp>(async (api) => {
                return await api.updateDetail(
                    detailParam?.id,
                    detailParam?.name,
                    detailParam?.value,
                    creds?.crmID
                );
            });

            if (detail.errorMessages) throw detail.errorMessages;

            if (
                !currentOrderCustomer ||
                orderData.customer == currentOrderCustomer?.customer_profile?.id
            ) {
                profileId = orderData.customer;
            } else {
                profileId = currentOrderCustomer?.customer_profile?.id;
            }

            await getDetailsOrder(profileId);
        } catch (err) {
            messageService.sendErrorList(err);
        }
        setIsLoadingDetails(false);
    }

    async function removeDetailsOrder(detailParam: TOrderDetails) {
        setIsLoadingDetails(true);
        try {
            let profileId;
            const detail = await CRMAPIManager.request<OrderDetailsResp>(async (api) => {
                return await api.removeDetail(detailParam.id, creds.crmID);
            });

            if (detail.errorMessages) throw detail.errorMessages;

            if (
                !currentOrderCustomer ||
                orderData.customer == currentOrderCustomer?.customer_profile?.id
            ) {
                profileId = orderData.customer;
            } else {
                profileId = currentOrderCustomer?.customer_profile?.id;
            }

            await getDetailsOrder(profileId);
        } catch (err) {
            messageService.sendErrorList(err);
        }
        setIsLoadingDetails(false);
    }

    const onCheckboxChange = (check: boolean, index: number) => {
        setDetailsData((prev) => {
            prev[index] = {
                ...prev[index],
                checked: check,
            };
            return [...prev];
        });
    };

    const handleChangeQuantity = (rowIndex: number, newQuantity: number, type: string) => {
        const functions = {
            productFunc: setProductData,
            serviceFunc: setServiceData,
        };
        functions[`${type}Func`]((prev) => {
            prev[rowIndex] = {
                ...prev[rowIndex],
                quantity: newQuantity,
                total: newQuantity * prev[rowIndex].price,
            };
            return [...prev];
        });

        type == 'product'
            ? setTotalProduct(productData.reduce((acc, rec) => (acc = rec.total + acc), 0))
            : setTotalService(serviceData.reduce((acc, rec) => (acc = rec.total + acc), 0));
    };
    const handleChangePrice = (rowIndex: number, newPrice: number, type: string) => {
        const functions = {
            productFunc: setProductData,
            serviceFunc: setServiceData,
        };
        functions[`${type}Func`]((prev) => {
            prev[rowIndex] = {
                ...prev[rowIndex],
                price: newPrice,
                total: newPrice * prev[rowIndex].quantity,
            };

            return [...prev];
        });
    };

    const handleFormData = (
        item: TOrderProduct | TOrderService,
        rowIndex: number,
        prev: Array<TOrderProduct> | Array<TOrderService>
    ) => {
        const foundIndex = prev.findIndex((findItem) => findItem.id == item.id);
        if (foundIndex != -1) {
            if (confirm('Добавить ещё один к товару?')) {
                prev[foundIndex] = {
                    ...prev[foundIndex],
                    quantity: prev[foundIndex].quantity + 1,
                    total: (prev[foundIndex].quantity + 1) * prev[foundIndex].price,
                };
            }
        } else if (foundIndex == -1 || prev[prev.length - 1].name != '') {
            prev[prev.length - 2] = item;
        } else {
            prev[rowIndex] = item;
        }
        if (prev[prev.length - 2].name != '') {
            prev.push({ id: null, name: '', quantity: null, price: null, total: null });
        }
        return [...prev];
    };
    const handleSearchInput = (
        item: TOrderProduct | TOrderService,
        type: string,
        rowIndex: number
    ) => {
        const functions = {
            productFunc: setProductData,
            serviceFunc: setServiceData,
        };
        functions[`${type}Func`]((prev) => {
            return handleFormData(item, rowIndex, prev);
        });
        type == 'product'
            ? setTotalProduct(productData.reduce((acc, rec) => (acc = rec.total + acc), 0))
            : setTotalService(serviceData.reduce((acc, rec) => (acc = rec.total + acc), 0));
    };

    async function getOrder() {
        setIsLoading(true);
        try {
            const torder = await CRMAPIManager.request<OrderResp>(async (api) => {
                return await api.getOrder(+params.orderID, creds.crmID);
            });
            if (torder.errorMessages) throw torder.errorMessages;

            await setDetailsData(torder.data.data.customer_order_params);
            await getDetailsOrder(
                torder.data.data.customer,
                torder.data.data.customer_order_params
            );

            setOrderData(torder.data.data);

            setProductData((prev) => {
                prev = [
                    ...torder.data.data.products,
                    { id: null, name: '', quantity: null, price: null, total: null },
                    { id: null, name: '', quantity: null, price: null, total: null },
                ];
                return [...prev];
            });
            setServiceData((prev) => {
                prev = [
                    ...torder.data.data.services,
                    { id: null, name: '', quantity: null, price: null, total: null },
                    { id: null, name: '', quantity: null, price: null, total: null },
                ];
                return [...prev];
            });
            setTotalProduct(
                torder.data.data.products.reduce((acc, rec) => (acc = rec.total + acc), 0)
            );
            setTotalService(
                torder.data.data.services.reduce((acc, rec) => (acc = rec.total + acc), 0)
            );
        } catch (err) {
            messageService.sendErrorList(err);
        }
        await setIsLoading(false);
    }

    const handleDateChange = (_: moment.Moment, dateString: string, type: string) => {
        setOrderData((prev) => {
            let date = new Date(prev.start_planned_at);
            if (type === 'date') {
                const ymd = dateString.split('-').map((s) => Number(s));
                date.setFullYear(ymd[2], ymd[1] - 1, ymd[0]);
            }
            if (type === 'time') {
                const hm = dateString.split(':').map((s) => Number(s));
                date.setHours(hm[0], hm[1]);
            }
            return {
                ...prev,
                start_planned_at: date,
            };
        });
    };
    function validateUpdateOrder(): boolean {
        if (!orderData?.customer) {
            messageService.sendError('Клиент должен быть выбран');
            return false;
        }

        if (!orderData?.start_planned_at) {
            messageService.sendError('Дата и время начала работы должны быть выбраны');
            return false;
        }
        if (!timePicked) {
            messageService.sendError('Время начала работы должно быть выбрано');
            return false;
        }
        if (
            `${orderData?.start_planned_at.getFullYear()}-${
                orderData?.start_planned_at.getMonth() + 1
            }-${orderData?.start_planned_at.getDay()}` == 'NaN-NaN-NaN'
        ) {
            messageService.sendError('Дата начала работы должна быть выбрана');
            return false;
        }
        if (serviceData.length == 0 && productData.length == 0) {
            messageService.sendError('Услуга или товар должны быть выбраны');
            return false;
        }
        return true;
    }
    const handleEditOrder = async () => {
        if (!validateUpdateOrder()) {
            return;
        }
        setIsLoading(true);
        try {
            const order = await CRMAPIManager.request<OrderEditResp>(async (api) => {
                const profileId = currentOrderCustomer?.customer_profile?.id
                    ? currentOrderCustomer?.customer_profile?.id
                    : orderData?.customer;
                const products = productData.filter((item) => item.id !== null);
                const services = serviceData.filter((item) => item.id !== null);
                return await api.updateOrder(
                    creds?.crmID,
                    orderData?.id,
                    products,
                    services,
                    profileId,
                    'customer',
                    orderData?.start_planned_at
                );
            });
            const details = await CRMAPIManager.request<OrderDetailsSyncResp>(async (api) => {
                const data = detailsData
                    .reduce((acc, rec) => {
                        if (rec.checked) {
                            acc.push(rec.id);
                        }
                        return acc;
                    }, [])
                    .filter((item) => !!item);

                return await api.syncParamsOrderCustomer(creds?.crmID, order.data.data.id, data);
            });

            if (order.errorMessages) throw order.errorMessages;
            if (details.errorMessages) throw details.errorMessages;

            navigate(`/lk/worker/crm/${creds.crmID}/orders/view/${orderData.id}`);
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
    };

    async function handleAbortEditing() {
        const creds = SettingsManager.getConnectionCredentials();
        navigate(`/lk/worker/crm/${creds.crmID}/orders/view/${orderData.id}`);
    }

    useEffect(() => {
        getOrder();
    }, []);

    useEffect(() => {
        getDetailsOrder(
            currentOrderCustomer?.customer_profile?.id,
            orderData?.customer_order_params
        );
    }, [currentOrderCustomer]);

    return (
        <>
            {isLoading ? (
                <Loader />
            ) : (
                <div id="app-crm-profile">
                    <div className="functional-container">
                        {isModalOpen && (
                            <OrderCustomerPicker
                                isModalOpen={isModalOpen}
                                setIsModalOpen={setIsModalOpen}
                                currentOrderCustomer={currentOrderCustomer}
                                setCurrentOrderCustomer={setCurrentOrderCustomer}
                            />
                        )}
                        <Dropdown.Button
                            className="functional-menu"
                            icon={<FontAwesomeIcon icon={faBars} />}
                            overlay={
                                <Menu
                                    items={[
                                        {
                                            key: 'save',
                                            label: 'Сохранить',
                                            icon: <FontAwesomeIcon icon={faEdit} />,
                                            onClick: handleEditOrder,
                                        },
                                        {
                                            key: 'abort',
                                            label: 'Отменить',
                                            icon: <FontAwesomeIcon icon={faXmark} />,
                                            onClick: handleAbortEditing,
                                        },
                                    ]}
                                />
                            }
                            placement="topRight"
                            type={'primary'}
                        />
                    </div>
                    <Row className="breadcrumb-header">
                        <Col>
                            <img
                                src={
                                    currentOrderCustomer?.picture
                                        ? `${GlobalConstants.BaseUrlForImg}${currentOrderCustomer?.picture}`
                                        : `${GlobalConstants.BaseUrlForImg}${orderData?.customer_avatar}`
                                }
                                className="customer-logo"
                                alt=""
                            />
                        </Col>
                        <Col flex={1}>
                            <Row>
                                <Col xs={{ span: 24 }} sm={{ span: 17 }} className="customer-name-edit">
                                    <h2>
                                        {currentOrderCustomer
                                            ? `${currentOrderCustomer?.surname} ${currentOrderCustomer?.name}`
                                            : orderData?.customer_name
                                            ? `${orderData?.customer_name.split(' ')[0]} ${
                                                  orderData?.customer_name.split(' ')[1]
                                              }`
                                            : 'Имя клиента'}
                                    </h2>

                                    <Button
                                        className="customer-select"
                                        onClick={() => setIsModalOpen(true)}
                                    >
                                        Список клиентов
                                    </Button>
                                </Col>
                            </Row>
                            <Row className="customer-date">
                                <Col span={24}>
                                    <span>с</span>
                                    <DatePicker
                                        picker="time"
                                        format={'HH:mm'}
                                        value={moment(orderData?.start_planned_at)}
                                        onChange={(value, dateString) =>
                                            handleDateChange(value, dateString, 'time')
                                        }
                                        className="date-picker"
                                    />
                                    <span>/</span>
                                    <DatePicker
                                        picker="date"
                                        disabledDate={disabledDate}
                                        format="DD-MM-YYYY"
                                        value={moment(orderData?.start_planned_at)}
                                        onChange={(value, dateString) =>
                                            handleDateChange(value, dateString, 'date')
                                        }
                                        className="date-picker"
                                    />
                                </Col>
                                <Col span={24}>
                                    <span>по</span>
                                    <span className="date-text">
                                        {orderData?.finished_at
                                            ? moment(orderData?.finished_at).format('HH:mm')
                                            : orderData?.finish_planned_at
                                            ? moment(orderData?.finish_planned_at).format('HH:mm')
                                            : moment(orderData?.start_planned_at)
                                                  .hour(10)
                                                  .format('HH:mm')}
                                    </span>

                                    <span>/</span>
                                    <span className="date-text">
                                        {orderData?.finished_at
                                            ? moment(orderData?.finished_at).format('DD/MM')
                                            : orderData?.finish_planned_at
                                            ? moment(orderData?.finish_planned_at).format('DD/MM')
                                            : moment(orderData?.start_planned_at)
                                                  .add(10, 'days')
                                                  .format('DD/MM')}
                                    </span>
                                </Col>
                            </Row>
                        </Col>
                    </Row>

                    <Row className="table-order-details">
                        <Table
                            dataSource={detailsData}
                            loading={{ indicator: <Loader />, spinning: isLoadingDetails }}
                            bordered={true}
                            columns={columnsOrderDetails}
                            size="small"
                            scroll={{ x: '600px' }}
                            pagination={false}
                        />
                    </Row>

                    <Row justify="end" className="service-block">
                        <Table
                            className="table-service"
                            bordered={true}
                            columns={columnsService}
                            dataSource={serviceData}
                            pagination={false}
                            scroll={{ x: '800px' }}
                            size={'small'}
                            footer={() => {
                                return (
                                    <Row
                                        className="t-footer"
                                        justify={'space-between'}
                                        align="middle"
                                    >
                                        <Col
                                            className="text-name"
                                            xs={{ span: 6 }}
                                            sm={{ span: 4 }}
                                        >
                                            <h3>Итого</h3>
                                        </Col>
                                        <Col className="text-sum" xs={{ span: 8 }} sm={{ span: 6 }}>
                                            <h3>{totalService?.toFixed(2)} ₽</h3>
                                        </Col>
                                    </Row>
                                );
                            }}
                        />
                    </Row>
                    <Row justify={'end'} className="product-info">
                        <Table
                            className="table-product"
                            bordered={true}
                            columns={columnsProduct}
                            dataSource={productData}
                            pagination={false}
                            scroll={{ x: '800px' }}
                            size={'small'}
                            rowKey={(record) =>
                                record.id ||
                                `${Math.ceil(Math.random() * 10)}-${Math.random() * 100}`
                            }
                            footer={() => {
                                return (
                                    <Row
                                        className="t-footer"
                                        justify={'space-between'}
                                        align="middle"
                                    >
                                        <Col
                                            className="text-name"
                                            xs={{ span: 6 }}
                                            sm={{ span: 4 }}
                                        >
                                            <h3>Итого</h3>
                                        </Col>
                                        <Col className="text-sum" xs={{ span: 8 }} sm={{ span: 6 }}>
                                            <h3>{totalProduct?.toFixed(2)} ₽</h3>
                                        </Col>
                                    </Row>
                                );
                            }}
                        />
                    </Row>

                    <Row className="order-total-sum" justify={'space-between'} align="middle">
                        <Col className="text-name" xs={{ span: 7 }} sm={{ span: 5 }}>
                            <p>Общий итог</p>
                        </Col>
                        <Col className="text-sum" xs={{ span: 8 }} sm={{ span: 6 }}>
                            <p>{(totalProduct + totalService)?.toFixed(2)} ₽</p>
                        </Col>
                    </Row>

                    <Row className="order-status">
                        <Col span={3}>
                            <Button
                                className="btn-arrow-left"
                                onClick={() => {
                                    const slider = sliderStatusRef.current.innerSlider;
                                    if (slider.state.currentSlide == slider.state.slideCount) {
                                        return false;
                                    } else {
                                        return sliderStatusRef.current.prev();
                                    }
                                }}
                            >
                                <FontAwesomeIcon icon={faChevronLeft} color="white" />
                            </Button>
                        </Col>
                        <Col span={18}>
                            <Carousel ref={sliderStatusRef} {...btnCarouselProp}>
                                <div>
                                    <Button className="btn-status" block>
                                        Старт
                                    </Button>
                                </div>
                                <div>
                                    <Button className="btn-status" block>
                                        Ожидается
                                    </Button>
                                </div>
                                <div>
                                    <Button className="btn-status" block>
                                        Завершить
                                    </Button>
                                </div>
                                <div>
                                    <Button className="btn-status" block>
                                        Отменить
                                    </Button>
                                </div>
                            </Carousel>
                        </Col>
                        <Col span={3}>
                            <Button
                                className="btn-arrow-right"
                                onClick={() => {
                                    const slider = sliderStatusRef.current.innerSlider;
                                    if (slider.state.currentSlide == slider.state.slideCount) {
                                        return false;
                                    } else {
                                        return sliderStatusRef.current.next();
                                    }
                                }}
                            >
                                <FontAwesomeIcon icon={faChevronRight} color="white" />
                            </Button>
                        </Col>
                    </Row>

                    <Row className="order-workers">
                        <Col span={24} className="border-orange">
                            <h3>Исполнители заказа:</h3>
                        </Col>
                        <Col className="workers-list" span={24}>
                            <Row>
                                {arrObj.map((item) => {
                                    return (
                                        <Col
                                            className="worker-card"
                                            key={item.id + '-card'}
                                            span={6}
                                        >
                                            <img
                                                src="https://images.unsplash.com/photo-1575936123452-b67c3203c357?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80"
                                                className="card-img"
                                                alt=""
                                            />
                                            <p>Старший механик{item.id}</p>
                                            <div
                                                className="card-time"
                                                style={{
                                                    background: `linear-gradient(to right, ${
                                                        item.statusTime != 0
                                                            ? `#FC680D ${item.statusTime}%`
                                                            : `white 100%`
                                                    }, white ${100 - item.statusTime}%)`,
                                                }}
                                            >
                                                <div
                                                    className="worker-time"
                                                    style={{
                                                        background: `linear-gradient(to right, ${
                                                            item.statusTime != 0
                                                                ? `white ${item.statusTime}%`
                                                                : `#FC680D 100%`
                                                        }, #FC680D ${100 - item.statusTime}%)`,
                                                    }}
                                                >
                                                    13:45-15:45
                                                </div>
                                            </div>
                                        </Col>
                                    );
                                })}
                            </Row>
                        </Col>
                    </Row>
                </div>
            )}
        </>
    );
};

export { OrderEdit };
