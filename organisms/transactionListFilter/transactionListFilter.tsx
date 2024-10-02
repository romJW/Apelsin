import { observer } from "mobx-react";
import { FilterStore, TTransactionFilter } from "./filterStore";
import { useState } from "react";
import { RangePickerProps } from "antd/lib/date-picker";
import { faFilter } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DatePicker, Button, Space, Row, Typography, Col, Drawer, Select } from "antd";

const paymentMethodOptions = [
    {
        label: 'Любой',
        value: null
    },
    {
        label: 'Касса',
        value: 1,
    },
    {
        label: 'Наличка',
        value: 2
    },
    {
        label: 'Карта',
        value: 3
    },
];

type Props = {
    store: FilterStore;
};

const TransactionListFilter = observer(({store}: Props) => {
    const [open, setOpen] = useState(false);

    const showDrawer = () => {
        setOpen(true);
    };

    const onClose = () => {
        setOpen(false);
    };

    const handleCreatedDates: RangePickerProps['onChange'] = (_, dateString) => {
        store.changeCreatedDates(dateString[0], dateString[1]);
    };

    const handleChangePaymentMethod = (value: TTransactionFilter['paymentMethodId']) => {
        store.changePaymentMethodId(value);
    }

    return (
        <>
            <Button className="round-button" type="default" onClick={showDrawer}>
                <FontAwesomeIcon className='btn-icon' icon={faFilter} />
            </Button>
            <Drawer title="Фильтр" placement="right" onClose={onClose} open={open}>
                <Space direction="vertical" size="middle">
                    <Row>
                        <Typography.Title level={5}>Дата создания</Typography.Title>
                        <Col span={24}>
                            <Space>
                                <DatePicker.RangePicker onChange={handleCreatedDates} />
                            </Space>
                        </Col>
                    </Row>
                    <Row>
                        <Typography.Title level={5}>Метод оплаты</Typography.Title>
                        <Col span={24}>
                            <Space>
                                <Select
                                    defaultValue={store.filter.paymentMethodId}
                                    style={{ width: '200px' }}
                                    options={paymentMethodOptions}
                                    onChange={handleChangePaymentMethod}
                                />
                            </Space>
                        </Col>
                    </Row>
                </Space>
            </Drawer>
        </>
    );
});

export { TransactionListFilter };