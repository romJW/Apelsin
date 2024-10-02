import { TransactionListResp } from "@api/responseModels/transactions/transactionListResponse";
import { Loader } from "@atoms/loader";
import { CRMAPIManager } from "@classes/crmApiManager";
import { messageService } from "@classes/messageService";
import { SettingsManager } from "@classes/settingsManager";
import { faHouse, faDollar, faCircleExclamation, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PageSizeChanger } from "@molecules/paginationControls/pageSizeChanger";
import { ShowMoreButton } from "@molecules/paginationControls/showMoreButton";
import { store as pStore } from '@molecules/paginationControls/pageSizeStore';
import { Row, Col, Breadcrumb, List, Pagination, Input, Space, Popconfirm } from "antd";
import { useState, useEffect } from "react";
import { TMetadata } from "types/metadata";
import { TTransaction } from "types/transactions/transaction";
import moment from "moment";
import { TransactionResp } from "@api/responseModels/transactions/transactionResponse";
import { Button } from "antd";
import { useNavigate } from "react-router-dom";
import { Common } from "@classes/commonMethods";
import { GlobalConstants } from "@constants/global";
import { FilterStore } from "@organisms/transactionListFilter/filterStore";
import { TransactionParams } from "types/getParams";
import { TransactionListFilter } from "@organisms/transactionListFilter/transactionListFilter";
import { observer } from "mobx-react";
const { Search } = Input;

const filterStore = new FilterStore();
const filter = filterStore.filter;

const TransactionList = observer((): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [transactionList, setTransactionList] = useState<Array<TTransaction>>([]);
    const [currentMeta, setCurrentMeta] = useState<TMetadata>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const navigate = useNavigate();
    const creds = SettingsManager.getConnectionCredentials();

    async function getTransactionList(page: number = currentPage, addition: boolean = false) {
        setIsLoading(true);
        try {
            const creds = SettingsManager.getConnectionCredentials();
            const params: TransactionParams = {
                crm_id: creds.crmID,
                sort_by: 'id',
                sort_direction: 'desc',
                filters: {
                    payment_method_id: filter.paymentMethodId,
                    created_at: [...filter.createdDates],
                },
                profile_id: creds.workerProfileId,
                profile_type: "worker",
                page: page,
                per_page: pStore.pS,
            };
            Object.keys(params.filters).filter(key => params.filters[key] === null && delete params.filters[key]);
            const transactionList = await CRMAPIManager.request<TransactionListResp>(async (api) => {
                return await api.getTransactionList(params);
            });
            if (transactionList.errorMessages) throw transactionList.errorMessages;
            if (addition) {
                setTransactionList(tl => [...tl, ...transactionList.data.data]);
            }
            else {
                setTransactionList(transactionList.data.data);
            }
            setCurrentMeta(transactionList.data.meta);
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
    }

    async function handleShowMore() {
        await getTransactionList(currentPage + 1, true);
        setCurrentPage(pageNumber => pageNumber + 1);
    }

    async function handleChangePage(newPage: number) {
        await getTransactionList(newPage);
        setCurrentPage(newPage);
    }

    function beforeMountServiceList() {
        Common.checkUserBelongToCrm(GlobalConstants.CrmOrderinUrl).then((res) => {
            if(!res) navigate(`/lk/worker/crm/${creds.crmID}`);
        });

        getTransactionList();
    }

    useEffect(() => {
        beforeMountServiceList();
    }, [
        filter.createdDates,
        filter.paymentMethodId
    ]);

    useEffect(() => {
        if(currentMeta?.total == null || currentMeta?.total == 0) return;
        let newPage = Math.ceil(currentMeta.from / pStore.pS);
        getTransactionList(newPage).then(() => {
            setCurrentPage(newPage);
        })
    }, [pStore.pS]);

    return (
        <div id="app-transaction-list">
            {isLoading && <Loader />}
            <Row className="breadcrumb-header">
                <Col className="header-location">
                    <span>Транзакции</span>
                    <span className="header-location__quantity">
                        {currentMeta && ` (${currentMeta.total}) `}
                    </span>
                </Col>
                <Col className="header-search">
                    <Search
                        allowClear
                        className="header-search-input"
                        onSearch={async (value) => {
                            if (value == null || value == '') return;
                            // TODO: search
                        }}
                    />
                </Col>
            </Row>
            <Row className="breadcrumbs-controls">
                <Col className="breadcrumbs">
                    <Breadcrumb>
                        <Breadcrumb.Item
                            onClick={() => 
                                navigate(`/lk/worker/crm/${SettingsManager.getConnectionCredentials().crmID}`)
                        }>
                            <FontAwesomeIcon icon={faHouse} />
                        </Breadcrumb.Item>
                        <Breadcrumb.Item>
                            <FontAwesomeIcon icon={faDollar} />
                            <span className="crumb-name">Транзакции</span>
                        </Breadcrumb.Item>
                    </Breadcrumb>
                </Col>
                <Col>
                    <Space>
                        <TransactionListFilter store={filterStore} />
                        <PageSizeChanger />
                    </Space>
                </Col>
            </Row>
            <List
                className="transaction-card-list"
                dataSource={transactionList}
                itemLayout="horizontal"
                renderItem={(item: TTransaction) => (
                    <List.Item className="log-card">
                        <Row>
                            <Col>
                                <span>
                                    {`#${item.id} | `}
                                    <a onClick={() => navigate(`/lk/worker/crm/${creds?.crmID}/workers/${item.sender_profile.user_id}`)}>
                                        Пользователь {`#${item.sender_profile.user_id}`}
                                    </a>
                                </span>
                            </Col>
                            <Col>
                                <Row>
                                    <Col>
                                        {item.payment_method}
                                    </Col>
                                    <Col>
                                        <FontAwesomeIcon icon={
                                            item.status == "ошибка" 
                                                ? faCircleExclamation
                                                : faArrowRight
                                        } />
                                    </Col>
                                    <Col>
                                        {`${item.sum} руб.`}
                                    </Col>
                                </Row>
                            </Col>
                            <Col>
                                <a onClick={() => navigate(`/lk/worker/crm/${creds?.crmID}/workers/${item.receiver_profile.user_id}`)}>
                                    {`Пользователь #${item.receiver_profile.user_id}`}
                                </a>
                            </Col>
                            <Col>
                                { moment(item.created_at).locale('ru').format("DD MMMM YYYY г. kk:mm, dd") }
                            </Col>
                        </Row>
                    </List.Item>
                )}
            />
            { currentMeta && currentPage < currentMeta.last_page && <ShowMoreButton onClick={handleShowMore} text='Показать ещё' /> }
            <Pagination 
                current={currentPage} 
                defaultCurrent={1} 
                onChange={handleChangePage}
                pageSize={pStore.pS} 
                showSizeChanger={false}
                total={currentMeta?.total ?? 1}
            />
        </div>
    );
});

export { TransactionList };