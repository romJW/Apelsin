import { useEffect, useState } from 'react';
import {
    faTableList,
    faCirclePlus,
    faCircleMinus,
    faCircleDot,
    faBars,
    faPlus,
} from '@fortawesome/free-solid-svg-icons';
import './style.scss';
import { Row, Col, List, Dropdown, Menu, Pagination } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { TOrder } from 'types/Orders/order';
import { Loader } from '@atoms/loader';
import { SettingsManager } from '@classes/settingsManager';
import { messageService } from '@classes/messageService';
import { CRMAPIManager } from '@classes/crmApiManager';
import { OrderListResp } from '@api/responseModels/order/orderListResponse';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { HeaderListBreadcrumbs } from '@molecules/breadcrumbs/listsBreadcrumbs/HeaderListBreadcrumbs';
import { TMetadata } from 'types/metadata';
import { OrderParams } from 'types/getParams';
import { FilterStore } from '@organisms/ordersFilter/filterStore';
import { observer } from 'mobx-react';
import { store as pStore } from '@molecules/paginationControls/pageSizeStore';
import { columnViewStore as vStore } from '@molecules/listViewChanger/listViewStore';
import { OptionsMenu } from '@molecules/OptionsMenu/OptionsMenu';
import { debounce } from '../../../utils/functions';
import { LastIdStore } from '@pages/lastIdStore';

const filterStore = new FilterStore();
const filter = filterStore.filter;

const OrderList = observer(() => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [orderList, setOrderList] = useState<Array<TOrder>>([]);
    const [currentMeta, setCurrentMeta] = useState<TMetadata>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const navigate = useNavigate();
    const creds = SettingsManager.getConnectionCredentials();

    async function getOrderList(page: number = currentPage) {
        setIsLoading(true);
        try {
            const creds = SettingsManager.getConnectionCredentials();
            const orderList = await CRMAPIManager.request<OrderListResp>(async (api) => {
                const params: OrderParams = {
                    crm_id: creds.crmID,
                    sort_by: filter.sortBy,
                    sort_direction: filter.sortDirection,
                    query: filter.query,
                    page,
                    per_page: pStore.pS,
                };
                return await api.getOrderList(params);
            });
            if (orderList.errorMessages) throw orderList.errorMessages;
            setOrderList(orderList.data.data);
            setCurrentMeta(orderList.data.meta);
        } catch (err) {
            messageService.sendError(err.message);
        }
        setIsLoading(false);
    }

    async function handleChangePage(newPage: number) {
        await getOrderList(newPage);
        setCurrentPage(newPage);
    }

    function handleCreateOrder() {
        LastIdStore.setLastOrderId(-1);
        navigate(`/lk/worker/crm/${creds.crmID}/orders/create`);
    }

    const handleSearchChange = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
        filterStore.changeQuery(e.target.value);
    }, 500);

    useEffect(() => {
        getOrderList();
    }, []);

    return (
        <>
            {isLoading && <Loader />}
            {!isLoading && (
                <div id="app-order-list">
                    <div className="functional-container">
                        <Dropdown.Button
                            className="functional-menu"
                            icon={<FontAwesomeIcon icon={faBars} />}
                            overlay={
                                <Menu
                                    items={[
                                        {
                                            key: 'createCategory',
                                            label: 'Создать заказ',
                                            icon: <FontAwesomeIcon icon={faPlus} />,
                                            onClick: handleCreateOrder,
                                        },
                                    ]}
                                />
                            }
                            placement="topRight"
                        />
                    </div>
                    <HeaderListBreadcrumbs
                        dataTotal={currentMeta?.total}
                        title={'Заказы'}
                        dataTitle={'Заказы'}
                        dataIcon={faTableList}
                        dataPrice={null}
                        flag={false}
                        isProduct={false}
                        categoryPath={null}
                        openCategoryCard={null}
                        onSearch={handleSearchChange}
                        searchPlaceHolder="По заказам"
                    >
                        <>
                            <OptionsMenu />
                        </>
                    </HeaderListBreadcrumbs>
                    <List
                        className="worker-card-list"
                        dataSource={orderList}
                        itemLayout="horizontal"
                        grid={{ column: vStore.col }}
                        renderItem={(item) => (
                            <List.Item className="worker-card">
                                <Row
                                    gutter={[0, 16]}
                                    onClick={() => {
                                        LastIdStore.setLastOrderId(item.id)
                                        navigate(`/lk/worker/crm/${creds.crmID}/orders/view/${item.id}`)
                                    }}
                                >
                                    <Col span={24} className="card-body">
                                        <Row justify={'space-between'} gutter={[0, 10]}>
                                            <Col>
                                                <span className="text-date">
                                                    {moment(item.created_at)
                                                        .locale('ru')
                                                        .format('DD MMMM YYYY г. kk:mm, dd')}
                                                </span>
                                            </Col>
                                            <Col>
                                                <span
                                                    className={`text-status ${
                                                        item?.finished_at
                                                            ? 'text-blue'
                                                            : 'text-green'
                                                    }`}
                                                >
                                                    {item?.order_status}
                                                </span>
                                            </Col>
                                        </Row>
                                        <Row gutter={[0, 16]}>
                                            <Col span={24}>
                                                <span className="text-name">
                                                    Клиент: {item.customer_name}
                                                </span>
                                            </Col>
                                            <Col span={22}>{`Default comment`}</Col>
                                        </Row>
                                        <Row
                                            style={{
                                                marginTop: 10,
                                            }}
                                        >
                                            <Col span={8}>
                                                <span className="icon-text-green">
                                                    <FontAwesomeIcon icon={faCirclePlus} /> ~
                                                </span>
                                            </Col>
                                            <Col span={8}>
                                                <span className="icon-text-red">
                                                    <FontAwesomeIcon icon={faCircleMinus} /> ~
                                                </span>
                                            </Col>
                                            <Col span={8}>
                                                <span className="icon-text-darkblue">
                                                    <FontAwesomeIcon icon={faCircleDot} /> ~
                                                </span>
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>
                            </List.Item>
                        )}
                    />
                    <Pagination
                        current={currentPage}
                        defaultCurrent={1}
                        onChange={handleChangePage}
                        pageSize={pStore.pS}
                        showSizeChanger={false}
                        total={currentMeta?.total ?? 1}
                    />
                </div>
            )}
        </>
    );
});

export { OrderList };
