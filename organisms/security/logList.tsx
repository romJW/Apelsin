import { CRMAPIManager } from "@classes/crmApiManager";
import { SettingsManager } from "@classes/settingsManager";
import { useEffect, useState } from "react";
import { Loader } from '../../atoms/loader';
import { store as pStore } from '@molecules/paginationControls/pageSizeStore';
import { TMetadata } from "types/metadata";
import { messageService } from "@classes/messageService";
import { Breadcrumb, Col, Input, List, Pagination, Row, Space } from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faHouse } from "@fortawesome/free-solid-svg-icons";
import { PageSizeChanger } from "@molecules/paginationControls/pageSizeChanger";
import { ShowMoreButton } from "@molecules/paginationControls/showMoreButton";
import { useNavigate } from "react-router-dom";
import { TLog } from "types/log";
import { LogListResp } from "@api/responseModels/crm/logListResponse";
import moment from "moment";
import { LogListFilter } from "@organisms/logListFilter/logListFilter";
import { FilterStore } from "@organisms/logListFilter/filterStore";
import { observer } from "mobx-react";
import { LogParams } from "types/getParams";
import { Common } from "@classes/commonMethods";
import { GlobalConstants } from "@constants/global";
const { Search } = Input;

const filterStore = new FilterStore();
const filter = filterStore.filter;

const LogList = observer((): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [logList, setLogList] = useState<Array<TLog>>([]);
    const [currentMeta, setCurrentMeta] = useState<TMetadata>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const navigate = useNavigate();
    const creds = SettingsManager.getConnectionCredentials();

    async function getLogList(page: number = currentPage, addition: boolean = false) {
        setIsLoading(true);
        try {
            const creds = SettingsManager.getConnectionCredentials();
            const params: LogParams = {
                crm_id: creds.crmID,
                sort_by: 'id',
                sort_direction: 'desc',
                filters: {
                    subject_type: filter.subjectType,
                    created_at: [...filter.createdDates],
                },
                page: page,
                per_page: pStore.pS,
            };
            Object.keys(params.filters).filter(key => params.filters[key] === null && delete params.filters[key]);
            const logList = await CRMAPIManager.request<LogListResp>(async (api) => {
                return await api.getLogList(params);
            });
            if (logList.errorMessages) throw logList.errorMessages;
            if (addition) {
                setLogList(ll => [...ll, ...logList.data.data]);
            }
            else {
                setLogList(logList.data.data);
            }
            setCurrentMeta(logList.data.meta);
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
    }

    async function handleShowMore() {
        await getLogList(currentPage + 1, true);
        setCurrentPage(pageNumber => pageNumber + 1);
    }

    async function handleChangePage(newPage: number) {
        await getLogList(newPage);
        setCurrentPage(newPage);
    }

    function decodeItemEvent(event: "created" | "updated" | "deleted" | "restored"): string {
        switch(event) {
            case "created":
                return "создал(а)";
            case "updated":
                return "обновил(а)";
            case "deleted":
                return "удалил(а)";
            case "restored":
                return "восстановил(а)";
        }
    }

    function decodeItemType(subject_type: string): string {
        const type = subject_type.split("\\").slice(-1);
        switch(type[0]) {
            case "Crm":
                return "CRM";
            case "Invitation":
                return "Приглашение";
            case "CustomerProfile":
                return "Клиента";
            case "WorkerProfile":
                return "Сотрудника";
            case "Service":
                return "Услугу";
            case "Product":
                return "Товар";
            case "File":
                return "Файл";
            case "Requisite":
                return "Реквизит";
            default:
                return type[0];
        }
    }

    function determinePath(item: TLog): string {
        const type = item.subject_type.split("\\").slice(-1);
        switch(type[0]) {
            case "Invitation":
                if(item.properties?.attributes?.profile_type == "customer")
                    return `/lk/worker/crm/${creds.crmID}/customers/${item.subject_id}`;
                else 
                    return `/lk/worker/crm/${creds.crmID}/workers/${item.subject_id}`;
            case "CustomerProfile":
                return `/lk/worker/crm/${creds.crmID}/customers/${item.properties.attributes.user_id}`;
            case "WorkerProfile":
                return `/lk/worker/crm/${creds.crmID}/workers/${item.properties.attributes.user_id}`;
            case "Service":
                return `/lk/worker/crm/${creds.crmID}/services/${item.subject_id}`;
            case "Product":
                return `/lk/worker/crm/${creds.crmID}/products/${item.subject_id}`;
            default:
                return `/lk/worker/crm/${creds.crmID}`;
        }
    }

    function beforeMountServiceList() {
        Common.checkUserBelongToCrm(GlobalConstants.CrmOrderinUrl).then((res) => {
            if(!res) navigate(`/lk/worker/crm/${creds.crmID}`);
        });

        getLogList();
    }

    useEffect(() => {
        beforeMountServiceList();
    }, [
        filter.createdDates,
        filter.subjectType
    ]);

    useEffect(() => {
        if(currentMeta?.total == null || currentMeta?.total == 0) return;
        let newPage = Math.ceil(currentMeta.from / pStore.pS);
        getLogList(newPage).then(() => {
            setCurrentPage(newPage);
        })
    }, [pStore.pS]);

    return (
        <div id="app-log-list">
            {isLoading && <Loader />}
            <Row className="breadcrumb-header">
                <Col className="header-location">
                    <span>Журнал</span>
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
                            <FontAwesomeIcon icon={faBook} />
                            <span className="crumb-name">Журнал</span>
                        </Breadcrumb.Item>
                    </Breadcrumb>
                </Col>
                <Col>
                    <Space>
                        <LogListFilter store={filterStore} />
                        <PageSizeChanger />
                    </Space>
                </Col>
            </Row>
            <List
                className="log-card-list"
                dataSource={logList}
                itemLayout="horizontal"
                renderItem={(item) => (
                    <List.Item className="log-card">
                        <Row>
                            <Col>
                                <span>
                                    {`#${item.id} | `}
                                    <a onClick={() => navigate(`/lk/worker/crm/${creds.crmID}/workers/${item.causer_id}`)}>
                                        Пользователь {`#${item.causer_id}`}
                                    </a>
                                </span>
                            </Col>
                            <Col>
                                { decodeItemEvent(item.event) }
                            </Col>
                            <Col>
                                <a onClick={() => {
                                    if(item.event != "deleted" 
                                        && item.subject_type.split("\\").slice(-1)[0] != "CRM"
                                        && item.subject_type.split("\\").slice(-1)[0] != "Requisite"
                                    ) 
                                        navigate(determinePath(item));
                                }}>
                                    { decodeItemType(item.subject_type) + " " }
                                    { `#${item.subject_id}` }
                                </a>
                            </Col>
                            <Col>
                                { moment(item.created_at).locale('ru').format("DD MMMM YYYY г. kk:mm, dd")}
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

export { LogList };