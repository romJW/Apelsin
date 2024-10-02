import { observer } from "mobx-react"
import { FilterStore, TLogFilter } from "./filterStore"
import { useState } from "react";
import { RangePickerProps } from "antd/lib/date-picker";
import { faFilter } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DatePicker, Button, Row, Typography, Col, Space, Drawer, Select } from "antd";

const subjectTypeOptions = [
    {
        label: 'Любой',
        value: null
    },
    {
        label: 'CRM',
        value: 'App\\Models\\Api\\V1\\Crm'
    },
    {
        label: 'Приглашение',
        value: 'App\\Models\\Api\\V1\\Invitation'
    },
    {
        label: 'Профиль клиента',
        value: 'App\\Models\\Api\\V1\\CustomerProfile'
    },
    {
        label: 'Профиль работника',
        value: 'App\\Models\\Api\\V1\\WorkerProfile'
    },
    {
        label: 'Услуга',
        value: 'App\\Models\\Api\\V1\\Service'
    },
    {
        label: 'Товар',
        value: 'App\\Models\\Api\\V1\\Product'
    },
    {
        label: 'Файл',
        value: 'App\\Models\\Api\\V1\\File'
    },
    {
        label: 'Реквизит',
        value: 'App\\Models\\Api\\V1\\Requisite'
    },
];

type Props = {
    store: FilterStore;
};

const LogListFilter = observer(({store}: Props) => {
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

    const handleChangeType = (value: TLogFilter['subjectType']) => {
        store.changeSubjectType(value);
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
                        <Typography.Title level={5}>Тип объекта</Typography.Title>
                        <Col span={24}>
                            <Space>
                                <Select
                                    defaultValue={store.filter.subjectType}
                                    style={{ width: '200px' }}
                                    options={subjectTypeOptions}
                                    onChange={handleChangeType}
                                />
                            </Space>
                        </Col>
                    </Row>
                </Space>
            </Drawer>
        </>
    );
});

export { LogListFilter };