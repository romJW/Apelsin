import React, { SyntheticEvent, useEffect, useState } from 'react';
import { Modal, Alert, Row, Col, Button, List, Avatar, Pagination, Input } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { Loader } from '@atoms/loader';
import { SettingsManager } from '@classes/settingsManager';
import { store as pStore } from '@molecules/paginationControls/pageSizeStore';
import { CustomerParams } from 'types/getParams';
import { FilterStore } from '@organisms/customersFilter/filterStore';
import { TUser } from 'types/user';
import { CRMAPIManager } from '@classes/crmApiManager';
import { UserListResp } from '@api/responseModels/user/userListResponse';
import { TMetadata } from 'types/metadata';
import { messageService } from '@classes/messageService';
import { debounce } from '../../../utils/functions';
import { GlobalConstants } from '@constants/global';
import { observer } from 'mobx-react';

const { Search } = Input;
const filterStore = new FilterStore();
const filter = filterStore.filter;

function filterCustomerList(customerList: TUser[]): TUser[] {
    return customerList.filter((user) => user?.customer_profile);
}

type tProps = {
    isModalOpen: boolean;
    setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    currentOrderCustomer: TUser | null;
    setCurrentOrderCustomer: React.Dispatch<React.SetStateAction<TUser>>;
};

const OrderCustomerPicker = observer(
    ({ isModalOpen, setIsModalOpen, currentOrderCustomer, setCurrentOrderCustomer }: tProps) => {
        const [isLoading, setIsLoading] = useState<boolean>(false);
        const [currentPage, setCurrentPage] = useState<number>(1);
        const [customerList, setCustomerList] = useState<Array<TUser>>([]);
        const [currentMeta, setCurrentMeta] = useState<TMetadata>(null);
        const [selectedOrderCustomer, setSelectedOrderCustomer] = useState<TUser>(null);

        const filteredListCustomer = filterCustomerList(customerList);

        async function getCustomerList(page: number = currentPage, addition: boolean = false) {
            setIsLoading(true);
            try {
                const creds = SettingsManager.getConnectionCredentials();
    
                const customerList = await CRMAPIManager.request<UserListResp>(async (api) => {
                    const params: CustomerParams = {
                        crm_id: creds.crmID,
                        sort_by: filter.sortBy,
                        sort_direction: filter.sortDirection,
                        filters: {
                            created_at: [...filter.createdDates],
                            updated_at: [...filter.updatedDates],
                            deleted: filter.deleted,
                            profile: "customer",
                        },
                        query: filter.query,
                        page,
                        per_page: pStore.pS,
                    };
                    Object.keys(params.filters).filter(
                        (key) => params.filters[key] === null && delete params.filters[key]
                    );
                    return await api.getUserList(params);
                });
                if (customerList.errorMessages) {
                    setCustomerList([]);
                    throw customerList.errorMessages;
                }
                if (addition) {
                    setCustomerList((wl) => [...wl, ...customerList.data.data]);
                } else {
                    setCustomerList(customerList.data.data);
                }
                setCurrentMeta(customerList.data.meta);
            } catch (err) {
                messageService.sendError(err.message);
            }
            setIsLoading(false);
        }
        async function handleChangePage(newPage: number) {
            await getCustomerList(newPage);
            setCurrentPage(newPage);
        }

        const handlePickerOK = () => {
            setCurrentOrderCustomer(selectedOrderCustomer);
            setIsModalOpen(false);
        };
        const handlePickerCancel = () => {
            setIsModalOpen(false);
        };
        const handleSearchChange = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
            filterStore.changeQuery(e.target.value);
        }, 500);

        function handleSelectButtonClick(e: SyntheticEvent, customer: TUser) {
            e.stopPropagation();
            selectedOrderCustomer?.id == customer.customer_profile.id
                ? setSelectedOrderCustomer(null)
                : setSelectedOrderCustomer(customer);
        }

        function beforeMountCustomerList() {
            getCustomerList();
        }

        useEffect(() => {
            beforeMountCustomerList();
        }, [filter.query]);

        useEffect(() => {
            if (currentMeta?.total == null || currentMeta?.total == 0) return;
            const newPage = Math.ceil(currentMeta.from / pStore.pS);
            getCustomerList(newPage).then(() => {
                setCurrentPage(newPage);
            });
        }, [pStore.pS]);

        return (
            <Modal
                className="product-category-picker"
                title="Выберите клиента"
                open={isModalOpen}
                onOk={handlePickerOK}
                onCancel={handlePickerCancel}
                cancelText="Отмена"
            >
                {isLoading && <Loader />}
                {/* {lastError && (
              <Alert
                  className="picker-alert"
                  message={lastError}
                  type="error"
                  closable
                  onClose={() => setLastError(null)}
              />
          )} */}
                {/* <Row className="picker-controls">
              <Col>
                  <Button onClick={handleButtonUpdateClick} type="default">
                      Обновить
                  </Button>
              </Col>
          </Row> */}
                <Row>
                    <Col span={24}>
                        <Search
                            allowClear
                            className="header-search-input"
                            onSearch={async (value) => {
                                if (value == null || value == '') return;
                                // TODO: search prop function
                            }}
                            onChange={handleSearchChange}
                        />
                    </Col>
                </Row>

                <List
                    className="customer-card-list"
                    dataSource={filteredListCustomer}
                    itemLayout="horizontal"
                    renderItem={(item) => (
                        <List.Item className="customer-card">
                            <Row style={{ width: '100%' }}>
                                <Col span={3}>
                                    <Avatar
                                        className="avatar"
                                        src={`${GlobalConstants.BaseUrlForImg}${
                                            item?.picture as string
                                        }`}
                                    />
                                </Col>
                                <Col span={18}>
                                    <Row>
                                        <Col>
                                            <h3 className="title">
                                                {item.name + ' ' + item.surname}
                                            </h3>
                                        </Col>
                                    </Row>
                                </Col>
                                <Col span={3} className="button-select">
                                    <Button
                                        icon={<FontAwesomeIcon icon={faCheck} />}
                                        onClick={(e) => handleSelectButtonClick(e, item)}
                                        shape="circle"
                                        type={
                                            item?.customer_profile?.id ===
                                            (selectedOrderCustomer as TUser)?.customer_profile?.id
                                                ? 'primary'
                                                : 'default'
                                        }
                                    />
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
            </Modal>
        );
    }
);

export { OrderCustomerPicker };
