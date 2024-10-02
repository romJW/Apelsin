import { useEffect, useRef, useState } from 'react';
import { Dropdown, Menu, Table, UploadProps } from 'antd';
import { Row, Col, Button, Carousel, Input, message, Upload } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBars,
    faChevronDown,
    faChevronLeft,
    faChevronRight,
    faComment,
    faEdit,
    faPaperPlane,
    faPaperclip,
} from '@fortawesome/free-solid-svg-icons';
import { CarouselRef } from 'antd/lib/carousel';
import './orderProfile.scss';
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
import { Loader } from '@atoms/loader';
import { TOrderDetails } from 'types/Orders/details';
import { GlobalConstants } from '@constants/global';
import { LastIdStore } from '@pages/lastIdStore';

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

const OrderProfile = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [orderData, setOrderData] = useState<TOrder>();
    const [totalService, setTotalService] = useState<number>(0);
    const [totalProduct, setTotalProduct] = useState<number>(0);
    const [activeBtnCarousel, setActiveBtnCarousel] = useState<number>(-1);
    const [isDetailsActive, setIsDetailsActive] = useState<boolean>(false);
    const navigate = useNavigate();
    const params = useParams();
    const creds = SettingsManager.getConnectionCredentials();
    const carouselStatusRef = useRef<CarouselRef>(null);
    const sliderStatusRef = useRef<CarouselRef>(null);

    const carouselProps = {
        slidesToShow: 3,
        draggable: true,
        swipeToSlide: true,
        touchThreshold: 50,
        focusOnSelect: true,
        dots: false,
        infinite: false,
        responsive: [
            {
                breakpoint: 530,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                    initialSlide: 1,
                },
            },
            {
                breakpoint: 330,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    initialSlide: 1,
                },
            },
        ],
    };
    const btnCarouselProp = {
        slidesToShow: 1,
        centerMode: false,
        draggable: true,
        swipeToSlide: true,
        dots: false,
        infinite: false,
    };

    const arrObj = [
        { id: 1, statusTime: 100 },
        { id: 2, statusTime: 70 },
        { id: 3, statusTime: 40 },
        { id: 4, statusTime: 0 },
        { id: 5, statusTime: 0 },
        { id: 6, statusTime: 0 },
        { id: 7, statusTime: 0 },
    ];

    const columnsService: ColumnsType<TOrderService> = [
        {
            title: '№',
            dataIndex: 'id',
            width: '5%',
            key: 'id',
            render: (_text, _record, index) => {
                return (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignContent: 'center',
                        }}
                    >
                        <span>{index + 1}</span>
                    </div>
                );
            },
        },
        {
            title: 'Услуги',
            dataIndex: 'name',
            className: 'td-service-cell',
            key: 'name',
            width: 160,
        },
        {
            title: 'Кол-во',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 50,
        },
        {
            title: 'Цена',
            dataIndex: 'price',
            key: 'price',
            width: 50,
        },
        {
            title: 'Сумма',
            dataIndex: 'total',
            key: 'total',
            width: 100,
            render: (_, record, _index) => {
                return (
                    <>
                        <span>{record.quantity * record.price}</span>
                    </>
                );
            },
        },
    ];
    const columnsProduct: ColumnsType<TOrderProduct> = [
        {
            title: '№',
            dataIndex: 'id',
            width: '5%',
            key: 'id',
            render: (_text, _record, index) => {
                return (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignContent: 'center',
                        }}
                    >
                        <span>{index + 1}</span>
                    </div>
                );
            },
        },
        {
            title: 'Товары',
            dataIndex: 'name',
            key: 'name',
            width: 160,
        },
        {
            title: 'Кол-во',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 50,
        },
        {
            title: 'Цена',
            dataIndex: 'price',
            key: 'price',
            width: 50,
        },
        {
            title: 'Сумма',
            dataIndex: 'total',
            key: 'total',
            width: 100,
            render: (_, record, _index) => {
                return (
                    <>
                        <span>{record.quantity * record.price}</span>
                    </>
                );
            },
        },
    ];
    const columnsDetails: ColumnsType<TOrderDetails> = [
        {
            title: '№',
            dataIndex: 'id',
            width: 20,
            key: 'id',
            render: (_text, _record, index) => {
                return (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignContent: 'center',
                        }}
                    >
                        <span>{index + 1}</span>
                    </div>
                );
            },
        },
        {
            title: 'Поля документа',
            dataIndex: 'name',
            className: 'details-cell',
            key: 'name',
        },
        {
            title: 'Описание полей',
            dataIndex: 'value',
            className: 'details-cell',
            key: 'value',
        },
    ];

    const handleEditOrder = () => {
        navigate(`/lk/worker/crm/${creds.crmID}/orders/edit/${orderData.id}`);
    };

    const handleBtnClick = (obj: { type: string; carousel: number; details: boolean }) => {
        if (obj.type === 'carousel') {
            setActiveBtnCarousel(obj.carousel);
        }
        if (obj.type === 'details') {
            setIsDetailsActive(obj.details);
        }
    };

    const handleSwitchOrder = async (id) => {
        LastIdStore.setLastOrderId(+id);
        await navigate(`/lk/worker/crm/${creds.crmID}/orders/view/${id}`);
    };

    async function getOrder() {
        setIsLoading(true);
        try {
            const torder = await CRMAPIManager.request<OrderResp>(async (api) => {
                return await api.getOrder(+params?.orderID, creds.crmID);
            });
            if (torder.errorMessages) throw torder.errorMessages;
            setOrderData(torder.data.data);
            setTotalProduct(
                torder.data.data.products.reduce((acc, rec) => (acc = rec.total + acc), 0)
            );
            setTotalService(
                torder.data.data.services.reduce((acc, rec) => (acc = rec.total + acc), 0)
            );
        } catch (err) {
            messageService.sendErrorList(err);
        }
        setIsLoading(false);
    }

    function beforeMountOrder() {
        getOrder();
    }

    useEffect(() => {
        beforeMountOrder();
    }, [params.orderID]);

    return (
        <>
            {isLoading ? (
                <Loader />
            ) : (
                <div id="app-crm-profile">
                    <div className="functional-container">
                        <Dropdown.Button
                            className="functional-menu"
                            icon={<FontAwesomeIcon icon={faBars} />}
                            overlay={
                                <Menu
                                    items={[
                                        {
                                            key: 'edit',
                                            label: 'Редактировать',
                                            icon: <FontAwesomeIcon icon={faEdit} />,
                                            onClick: handleEditOrder,
                                        },
                                    ]}
                                />
                            }
                            placement="topRight"
                            type={'primary'}
                        />
                    </div>
                    <Row className="breadcrumb-header" style={{ height: 'auto', paddingTop: 4 }}>
                        <Col>
                            <img
                                src={`${GlobalConstants.BaseUrlForImg}${orderData?.customer_avatar}`}
                                className="customer-logo"
                                alt=""
                            />
                        </Col>
                        <Col flex={1}>
                            <Row>
                                <Col span={19} className="customer-name">
                                    <h2>
                                        {`${orderData?.customer_name.split(' ')[0]} ${
                                            orderData?.customer_name.split(' ')[1]
                                        }`}
                                    </h2>
                                    <p>18000 ₽</p>
                                </Col>
                                <Col span={5} className="customer-btn-menu">
                                    <Button className="btn-menu">
                                        <FontAwesomeIcon
                                            icon={faBars}
                                            color="white"
                                            className="icon-menu"
                                        />
                                    </Button>
                                </Col>
                            </Row>
                            <Row className="order-date">
                                <Col span={12}>
                                    <span>с</span>
                                    <span className="text-date text-ml">
                                        {orderData?.started_at
                                            ? moment(orderData?.started_at).format('HH:mm')
                                            : orderData?.start_planned_at
                                            ? moment(orderData?.start_planned_at).format('HH:mm')
                                            : moment().format('HH:mm')}
                                    </span>
                                    <span>/</span>

                                    <span className="text-date">
                                        {orderData?.started_at
                                            ? moment(orderData?.started_at).format('DD/MM')
                                            : orderData?.start_planned_at
                                            ? moment(orderData?.start_planned_at).format('DD/MM')
                                            : moment().format('DD/MM')}
                                    </span>
                                </Col>
                                <Col span={12}>
                                    <span>по</span>
                                    <span className="text-date text-ml">
                                        {orderData?.finished_at
                                            ? moment(orderData?.finished_at).format('HH:mm')
                                            : orderData?.finish_planned_at
                                            ? moment(orderData?.finish_planned_at).format('HH:mm')
                                            : moment(orderData?.start_planned_at)
                                                  .hour(18)
                                                  .format('HH:mm')}
                                    </span>

                                    <span>/</span>
                                    <span className="text-date">
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
                    <Row className="breadcrumb-controls">
                        <Col span={2}>
                            <Button
                                className="btn-arrow-left"
                                onClick={() => {
                                    const slider = carouselStatusRef.current.innerSlider;
                                    if (slider.state.currentSlide == slider.state.slideCount) {
                                        return false;
                                    } else {
                                        return carouselStatusRef.current.prev();
                                    }
                                }}
                            >
                                <FontAwesomeIcon icon={faChevronLeft} color="white" />
                            </Button>
                        </Col>
                        <Col className="order-carousel" xs={19} sm={20}>
                            <Carousel ref={carouselStatusRef} {...carouselProps}>
                                <div>
                                    <Button
                                        className={
                                            0 === activeBtnCarousel
                                                ? 'btn-carousel active'
                                                : 'btn-carousel'
                                        }
                                        onClick={() =>
                                            handleBtnClick({
                                                type: 'carousel',
                                                carousel: 0,
                                                details: isDetailsActive,
                                            })
                                        }
                                    >
                                        Наряд-заказ
                                    </Button>
                                </div>
                                <div>
                                    <Button
                                        className={
                                            1 === activeBtnCarousel
                                                ? 'btn-carousel active'
                                                : 'btn-carousel'
                                        }
                                        onClick={() =>
                                            handleBtnClick({
                                                type: 'carousel',
                                                carousel: 1,
                                                details: isDetailsActive,
                                            })
                                        }
                                    >
                                        Акт вып.работ
                                    </Button>
                                </div>
                                <div>
                                    <Button
                                        className={
                                            2 === activeBtnCarousel
                                                ? 'btn-carousel active'
                                                : 'btn-carousel'
                                        }
                                        onClick={() =>
                                            handleBtnClick({
                                                type: 'carousel',
                                                carousel: 2,
                                                details: isDetailsActive,
                                            })
                                        }
                                    >
                                        Диагност.акт
                                    </Button>
                                </div>
                                <div>
                                    <Button
                                        className={
                                            3 === activeBtnCarousel
                                                ? 'btn-carousel active'
                                                : 'btn-carousel'
                                        }
                                        onClick={() =>
                                            handleBtnClick({
                                                type: 'carousel',
                                                carousel: 3,
                                                details: isDetailsActive,
                                            })
                                        }
                                    >
                                        Счёт
                                    </Button>
                                </div>
                            </Carousel>
                        </Col>
                        <Col span={2}>
                            <Button
                                className="btn-arrow-right"
                                onClick={() => {
                                    const slider = carouselStatusRef.current.innerSlider;
                                    if (slider.state.currentSlide == slider.state.slideCount) {
                                        return false;
                                    } else {
                                        return carouselStatusRef.current.next();
                                    }
                                }}
                            >
                                <FontAwesomeIcon icon={faChevronRight} color="white" />
                            </Button>
                        </Col>
                    </Row>
                    <Row className="order-switch" justify={'space-around'} align={'middle'}>
                        <Col span={14}>
                            <Row justify={'space-between'} align={'middle'}>
                                <Button
                                    className="btn-arrLeft"
                                    onClick={() => handleSwitchOrder(orderData.prev)}
                                    disabled={orderData?.prev === null}
                                >
                                    <FontAwesomeIcon icon={faChevronLeft} color="white" />
                                </Button>
                                <div>
                                    <p>
                                        <span> №_{orderData?.id} </span> от{' '}
                                        {orderData?.created_at
                                            ? moment(orderData?.created_at).format('DD/MM/YYYY')
                                            : moment().format('DD/MM/YYYY')}
                                    </p>
                                </div>
                                <Button
                                    className="btn-arrRight"
                                    onClick={() => handleSwitchOrder(orderData.next)}
                                    disabled={orderData?.next === null}
                                >
                                    <FontAwesomeIcon icon={faChevronRight} color="white" />
                                </Button>
                            </Row>
                        </Col>
                        <Col span={8}>
                            <Button
                                className="btn-details-order"
                                onClick={() =>
                                    handleBtnClick({
                                        type: 'details',
                                        details: !isDetailsActive,
                                        carousel: activeBtnCarousel,
                                    })
                                }
                            >
                                Детали заказа
                                <FontAwesomeIcon
                                    icon={faChevronDown}
                                    className={
                                        isDetailsActive ? 'icon-details active' : 'icon-details'
                                    }
                                />
                            </Button>
                        </Col>
                    </Row>

                    <Row className="order-details" hidden={!isDetailsActive}>
                        <Table
                            columns={columnsDetails}
                            bordered
                            dataSource={orderData?.customer_order_params}
                            pagination={false}
                            size={'small'}
                            rowKey={(record) =>
                                record.id ||
                                `${Math.ceil(Math.random() * 100)}-${Math.ceil(
                                    Math.random() * 1000
                                )}`
                            }
                        />
                    </Row>

                    <Row className="order-info">
                        <Col className="order-info__name" span={24}>
                            <Row justify={'space-between'}>
                                <Col span={14}>
                                    <p>СТО "Апельсин"</p>
                                </Col>
                                <Col span={10}>
                                    <p>ИНН: 311301369020</p>
                                </Col>
                            </Row>
                            <Row>
                                <Col span={14}>
                                    <p>г. Белгород, ул. Горького 54</p>
                                </Col>
                                <Col span={10}>
                                    <p>Тел: 8 (4222) 219-299</p>
                                </Col>
                            </Row>
                        </Col>
                        <Col
                            className="order-info__details"
                            hidden={activeBtnCarousel != 0}
                            span={24}
                        >
                            <Row justify={'space-between'}>
                                <Col span={7}>
                                    <p>ЗАКАЗ-НАРЯД</p>
                                </Col>

                                <Col span={8}>
                                    <p className="details__info">№</p>
                                </Col>
                                <Col span={8}>
                                    <p className="details__info">от</p>
                                </Col>
                            </Row>
                            <Row>
                                <Col span={24}>
                                    <p className="info">Заказчик:</p>
                                </Col>
                            </Row>
                            <Row>
                                <Col span={24}>
                                    <p className="info">Телефон:</p>
                                </Col>
                            </Row>
                            <Row>
                                <Col span={24}>
                                    <p className="info">Предоплата:</p>
                                </Col>
                            </Row>
                        </Col>
                        <Col
                            span={24}
                            hidden={activeBtnCarousel == -1}
                            className="order-info__accept"
                        >
                            {orderData?.customer_order_params.map((item) => (
                                <>
                                    <Row>
                                        <Col span={7}>
                                            <p className="params-name">{item.name}:</p>
                                        </Col>
                                        <Col span={17}>
                                            <p className="params-value">{item.value}</p>
                                        </Col>
                                    </Row>
                                </>
                            ))}
                            <Row>
                                <Col span={24}>
                                    <p>Принял:</p>
                                </Col>
                            </Row>
                        </Col>
                    </Row>

                    <Row justify="center" className="table-service">
                        <Table
                            columns={columnsService}
                            bordered
                            dataSource={orderData?.services}
                            pagination={false}
                            scroll={{ x: '700px' }}
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
                                        <Col span={4}>
                                            <h3>Итого</h3>
                                        </Col>
                                        <Col span={6}>
                                            <h3>{totalService.toFixed(2)} ₽</h3>
                                        </Col>
                                    </Row>
                                );
                            }}
                            onHeaderRow={(columns, _index) => {
                                return {
                                    onClick: () => {
                                        columns[1].className = 'td-service-cell enlarged';
                                    }, // click header row
                                };
                            }}
                        />
                    </Row>
                    <Row justify={'center'} className="table-product">
                        <Table
                            columns={columnsProduct}
                            bordered
                            dataSource={orderData?.products}
                            pagination={false}
                            scroll={{ x: '700px' }}
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
                                        <Col span={4}>
                                            <h3>Итого</h3>
                                        </Col>
                                        <Col span={6}>
                                            <h3>{totalProduct.toFixed(2)} ₽</h3>
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
                            <p>{orderData?.total_sum} ₽</p>
                        </Col>
                    </Row>

                    <Row className="order-comment">
                        <Col span={24} className="last-comments">
                            <Row className="comment-row" justify={'space-between'}>
                                <Col className="comment-img" span={4}>
                                    <img
                                        src="https://images.unsplash.com/photo-1575936123452-b67c3203c357?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80"
                                        alt=""
                                    />
                                    <span>10:31/21.07</span>
                                </Col>

                                <Col span={19}>
                                    <h3>Андрей / Менеджер</h3>
                                    <p>
                                        Текст последнего комментария будет отображаться здесь. Текст
                                        последнего комментария будет отображаться здесь. Текст
                                        последнего комментария будет отображаться здесь
                                    </p>
                                </Col>
                            </Row>
                            <Row className="comment-row" justify={'space-between'}>
                                <Col className="comment-img" span={4}>
                                    <img
                                        src="https://images.unsplash.com/photo-1575936123452-b67c3203c357?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80"
                                        alt=""
                                    />
                                    <span>10:31/21.07</span>
                                </Col>

                                <Col span={19}>
                                    <h3>Андрей / Менеджер</h3>
                                    <div className="comment-galery">
                                        <img
                                            src="https://images.unsplash.com/photo-1575936123452-b67c3203c357?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80"
                                            alt=""
                                        />
                                        <img
                                            src="https://images.unsplash.com/photo-1575936123452-b67c3203c357?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80"
                                            alt=""
                                        />
                                    </div>
                                </Col>
                            </Row>
                            <Row
                                className="comment-block"
                                align={'middle'}
                                justify={'space-between'}
                            >
                                <Col span={4}>
                                    <Button className="comment-btn">
                                        <FontAwesomeIcon
                                            icon={faComment}
                                            className="icon-comment"
                                        />
                                        <span>2</span>
                                    </Button>
                                </Col>
                                <Col span={16}>
                                    <TextArea
                                        className="comment-input"
                                        placeholder="Коментарии"
                                        autoSize={{ minRows: 1, maxRows: 4 }}
                                    />
                                </Col>
                                <Col span={4}>
                                    <Button className="btn-send">
                                        <FontAwesomeIcon icon={faPaperPlane} color="orange" />
                                    </Button>
                                </Col>
                            </Row>
                            <Row
                                className="comment-block"
                                align={'middle'}
                                justify={'space-between'}
                            >
                                <Col span={4}>
                                    <Button className="comment-btn">
                                        <FontAwesomeIcon
                                            icon={faPaperclip}
                                            className="icon-comment"
                                        />
                                        <span>2</span>
                                    </Button>
                                </Col>
                                <Col span={18}>
                                    <Upload style={{ width: '100%' }} {...uploadP}>
                                        <Button className="comment-upload__btn" block>
                                            Прикрепить файл
                                        </Button>
                                    </Upload>
                                </Col>
                            </Row>
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
                        <Col span={24} className="border-top">
                            <h3>Исполнители заказа:</h3>
                        </Col>
                        <Col className="workers-list" span={24}>
                            <Row>
                                {arrObj.map((item) => {
                                    return (
                                        <>
                                            <Col className="worker-card" span={6}>
                                                <img
                                                    src="https://images.unsplash.com/photo-1575936123452-b67c3203c357?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80"
                                                    alt=""
                                                />
                                                <p>Старший механик{item.id}</p>
                                                <div
                                                    className="progress-bar"
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
                                        </>
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

export { OrderProfile };
