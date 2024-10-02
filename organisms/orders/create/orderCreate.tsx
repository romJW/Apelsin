import React, { useEffect, useState } from 'react';
import {
    faTableList,
    faHouse,
    faXmark,
    faCheck,
    faBars,
    faEdit,
    faTrash,
    faSave,
    faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import {
    Row,
    Col,
    Breadcrumb,
    Input,
    InputNumber,
    Table,
    Divider,
    DatePicker,
    Space,
    Select,
    Menu,
    Dropdown,
    Button,
    Checkbox,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ListViewChanger } from '@molecules/listViewChanger/listViewChanger';
import { GlobalConstants } from '@constants/global';
import { Loader } from '@atoms/loader';
import { SearchInput } from '@molecules/tables/inputs/searchInput';
import { SearchCustomerInput } from '@molecules/tables/inputs/searchCustomerInput';
import './style.scss';
// import { TCRMTotal } from 'types/crmTotal';
import type { DatePickerProps } from 'antd/es/date-picker';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { TOrderService } from 'types/Orders/services';
import { TOrderProduct } from 'types/Orders/products';
import { TOrderCreate } from 'types/Orders/create';
import { messageService } from '@classes/messageService';
import { SettingsManager } from '@classes/settingsManager';
import { OrderCreateResp } from '@api/responseModels/order/orderCreateResponse';
import { sendRequest } from '@api/sendRequest';
import { RequestResult } from '@api/responseModels/requestResult';
import { TCustomer } from 'types/customer';
import { useNavigate } from 'react-router-dom';
import { HeaderBreadcrumbProfiles } from '@molecules/breadcrumbs/profilesBreadcrumbs/HeaderProfilesBreadcrumb';
import { OrderCustomerPicker } from '@organisms/pickers/orderCustomerPicker';
import { TUser } from 'types/user';
import moment from 'moment';
import { TOrderDetails } from 'types/Orders/details';
import { OrderDetailsResp } from '@api/responseModels/order/orderDetailsResponse';
import { CRMAPIManager } from '@classes/crmApiManager';
import { CheckboxChangeEvent } from 'antd/es/checkbox';
import { OrderDetailsSyncResp } from '@api/responseModels/order/orderDetailsSyncResponse';

dayjs.extend(customParseFormat);

const { Option } = Select;

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

const initialOrderData: TOrderCreate = {
    crm_id: SettingsManager.getConnectionCredentials()?.crmID,
    profile_type: 'customer',
    profile_id: null,
    products: [],
    services: [],
    start_planned_at: '',
    finish_planned_at: '',
};
const disabledDate: DatePickerProps['disabledDate'] = (current) => {
    // Can not select days before today and today
    return current && current < dayjs().endOf('day');
};

function OrderCreate() {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
    const [orderData, setOrderData] = useState<TOrderCreate>(initialOrderData);
    const [currentOrderCustomer, setCurrentOrderCustomer] = useState<TUser>(null);
    const [timePicked, setTimePicked] = useState<boolean>(false);
    const [productData, setProductData] = useState<Array<TOrderProduct>>(initialServiceData);
    const [serviceData, setServiceData] = useState<Array<TOrderService>>(initialProductData);
    const [detailsData, setDetailsData] = useState<Array<TOrderDetails>>(initialDetailsData);
    const [totalServices, setTotalServices] = useState<number>(0);
    const [totalProducts, setTotalProducts] = useState<number>(0);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState<Array<number>>([]);
    const [isDelete, setIsDelete] = useState<boolean>(false);

    const navigate = useNavigate();
    const creds = SettingsManager.getConnectionCredentials();

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
        } else if (foundIndex == -1 && prev[rowIndex].name == '' && rowIndex > 0) {
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
            ? setTotalProducts(productData.reduce((acc, rec) => (acc = rec.total + acc), 0))
            : setTotalServices(serviceData.reduce((acc, rec) => (acc = rec.total + acc), 0));
    };

    const setCustomerProfile = (id: number) => {
        setOrderData((prev) => {
            return {
                ...prev,
                profile_id: id,
            };
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
            ? setTotalProducts(productData.reduce((acc, rec) => (acc = rec.total + acc), 0))
            : setTotalServices(serviceData.reduce((acc, rec) => (acc = rec.total + acc), 0));
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

    const handleDateChange = (_: moment.Moment, dateString: string, type: string) => {
        setOrderData((prev) => {
            let date = new Date(prev.start_planned_at);
            if (type === 'date') {
                const ymd = dateString.split('-').map((s) => Number(s));
                date.setFullYear(ymd[2], ymd[1] - 1, ymd[0]);
            }
            if (type === 'time') {
                setTimePicked(true);
                const hm = dateString.split(':').map((s) => Number(s));
                date.setHours(hm[0], hm[1]);
            }
            return {
                ...prev,
                start_planned_at: date,
            };
        });
    };
    function validateCreateOrder(): boolean {
        if (!currentOrderCustomer) {
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

    const handleCreateOrder = async () => {
        if (!validateCreateOrder()) {
            return;
        }
        setIsLoading(true);
        try {
            const order = await CRMAPIManager.request<OrderCreateResp>(async (api) => {
                const products = productData.filter((item) => item.id !== null);
                const services = serviceData.filter((item) => item.id !== null);
                return await api.saveOrder(
                    creds?.crmID,
                    products,
                    services,
                    currentOrderCustomer?.customer_profile?.id,
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

            navigate(`/lk/worker/crm/${creds.crmID}/orders`);
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
    };
    const handleChangeDetails = (value: string, index: number, type: string) => {
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

    async function getDetailsOrder() {
        setIsLoadingDetails(true);
        try {
            const tdetails = await CRMAPIManager.request<OrderDetailsResp>(async (api) => {
                return await api.getOrderDetails(
                    creds.crmID,
                    currentOrderCustomer?.customer_profile?.id
                );
            });

            if (tdetails.errorMessages) throw tdetails.errorMessages;

            setDetailsData((prev) => {
                if (tdetails.data.data.length == 0) {
                    return prev;
                } else {
                    const data = tdetails.data.data.map((item) => {
                        return {
                            ...item,
                            checked: false,
                        };
                    });
                    return (prev = [
                        ...data,
                        { id: null, name: '', value: '', profile_id: null, checked: false },
                    ]);
                }
            });
        } catch (err) {
            messageService.sendErrorList(err);
        }
        setIsLoadingDetails(false);
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
            const profileId = currentOrderCustomer?.customer_profile?.id;
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

            await getDetailsOrder();
        } catch (err) {
            messageService.sendErrorList(err);
        }
        setIsLoadingDetails(false);
    }

    async function updateDetailsOrder(detailParam: TOrderDetails) {
        setIsLoadingDetails(true);
        try {
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

            await getDetailsOrder();
        } catch (err) {
            messageService.sendErrorList(err);
        }
        setIsLoadingDetails(false);
    }

    async function removeDetailsOrder(detailParam: TOrderDetails) {
        setIsLoadingDetails(true);
        try {
            const detail = await CRMAPIManager.request<OrderDetailsResp>(async (api) => {
                return await api.removeDetail(detailParam.id, creds.crmID);
            });

            if (detail.errorMessages) throw detail.errorMessages;

            await getDetailsOrder();
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

    useEffect(() => {
        getDetailsOrder();
    }, [currentOrderCustomer]);

    const columnsOrderDetails: ColumnsType<TOrderDetails> = [
        {
            title: '№',
            dataIndex: 'id',
            width: '10%',
            key: 'key',
            render: (text, record, index) => {
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
            render: (text, record, index) => {
                return (
                    <>
                        <Input
                            type="text"
                            value={record.name}
                            key={`name-${index}`}
                            onChange={(e) => {
                                handleChangeDetails(e.target.value, index, 'name');
                            }}
                        />
                    </>
                );
            },
        },
        {
            title: 'Описание полей',
            dataIndex: 'value',
            key: 'value',
            render: (text, record, index) => {
                return (
                    <>
                        <Input
                            type="text"
                            value={record.value}
                            key={`name-${index}`}
                            onChange={(e) => {
                                handleChangeDetails(e.target.value, index, 'value');
                            }}
                        />
                    </>
                );
            },
        },
        {
            title: 'Действие',
            fixed: 'right',
            width: '15%',
            render: (text, record, index) => {
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
                            disabled={
                                record.name.replace(/ /g, '') == '' ||
                                record.value.replace(/ /g, '') == ''
                            }
                        >
                            <FontAwesomeIcon icon={faTrashCan} color="red" />
                        </Button>
                    </Row>
                );
            },
        },
    ];

    const columnsService: ColumnsType<TOrderService> = [
        {
            title: '№',
            dataIndex: 'id',
            width: 20,
            key: 'id',
            render: (text, record, index) => {
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
            render: (text, record, index) => {
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
            render: (text, record, index) => {
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
            render: (text, record, index) => {
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

    return (
        <>
            {isLoading && <Loader />}
            {!isLoading && (
                <div id="app-product-profile">
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
                                            icon: <FontAwesomeIcon icon={faCheck} />,
                                            onClick: handleCreateOrder,
                                        },
                                    ]}
                                />
                            }
                            placement="topRight"
                            type={'primary'}
                        />
                    </div>

                    <HeaderBreadcrumbProfiles
                        dataIcon={faTableList}
                        dataId={''}
                        dataTitle={'Заказы'}
                        title={'Профиль заказа'}
                        route={`/lk/worker/crm/${creds?.crmID}/orders`}
                        isForInvitation={null}
                        dataName={'Новый заказ'}
                        isSpecialty={false}
                    />

                    <Row className="create__client-block">
                        <Col>
                            <img
                                src={
                                    !currentOrderCustomer?.picture
                                        ? `${GlobalConstants.BaseUrlForImg}/images/no_image.png`
                                        : `${GlobalConstants.BaseUrlForImg}${currentOrderCustomer?.picture}`
                                }
                                className="customer-logo"
                                alt=""
                            />
                        </Col>
                        <Col flex={1}>
                            <Row>
                                <Col span={16} className="customer-name">
                                    <h2>
                                        {currentOrderCustomer
                                            ? `${currentOrderCustomer.surname} ${currentOrderCustomer?.name}`
                                            : 'Выберите клиента'}
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
                                    <span>Время старта</span>
                                    <DatePicker
                                        picker="time"
                                        format={'HH:mm'}
                                        onChange={(value, dateString) =>
                                            handleDateChange(value, dateString, 'time')
                                        }
                                        className="date-picker"
                                    />
                                </Col>
                                <Col span={24}>
                                    <span>Дата старта</span>
                                    <DatePicker
                                        picker="date"
                                        disabledDate={disabledDate}
                                        onChange={(value, dateString) =>
                                            handleDateChange(value, dateString, 'date')
                                        }
                                        format="DD-MM-YYYY"
                                        className="date-picker"
                                    />
                                </Col>
                            </Row>
                        </Col>
                    </Row>

                    <Row
                        className="table-order-details"
                        hidden={!currentOrderCustomer?.customer_profile}
                    >
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
                            rowKey={(record) =>
                                record.id ||
                                `${Math.ceil(Math.random() * 100)}-${Math.ceil(
                                    Math.random() * 1000
                                )}`
                            }
                            footer={() => {
                                return (
                                    <Row
                                        className="t-footer"
                                        justify={'space-between'}
                                        align="middle"
                                    >
                                        <Col span={10} className="name-cell">
                                            <h3>Итого</h3>
                                        </Col>
                                        <Col span={6} className="sum-cell">
                                            <h3>{totalServices.toFixed(2)}</h3>
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
                                        <Col span={10} className="name-cell">
                                            <h3>Итого</h3>
                                        </Col>
                                        <Col span={6} className="sum-cell">
                                            <h3>{totalProducts.toFixed(2)}</h3>
                                        </Col>
                                    </Row>
                                );
                            }}
                        />
                    </Row>

                    {/* <Row className="product-info">
            <Col className="outer-box">
              <Row className="label-row">
                <Col>
                  <h3>
                    Выберите клиента
                  </h3>
                </Col>
              </Row>
              <Row className="value-row">
                <Col>
                  
                </Col>
              </Row>
            </Col>

          </Row> */}
                </div>
            )}
        </>
    );
}

export { OrderCreate };
