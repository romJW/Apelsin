import {
    faArrowDownWideShort,
    faArrowUpWideShort,
    faFilter,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    Button,
    Col,
    Drawer,
    Row,
    Select,
    Radio,
    RadioChangeEvent,
    Typography,
    DatePicker,
    Space
} from 'antd';
import { RangePickerProps } from 'antd/lib/date-picker';
import { observer } from 'mobx-react';
import React, {  useState } from 'react';
import { WorkerFilter } from 'types/filters';
import { FilterStore } from './filterStore';

const sortOptions = [
    {
        label: 'Имя',
        value: 'name',
    },
    {
        label: 'Баланс',
        value: 'balance',
    },
    {
        label: 'Дата создания',
        value: 'created_at',
    },
    {
        label: 'Дата обновления',
        value: 'updated_at',
    },
];

const delOptions = [
    {
        label: 'Не показывать удалённые',
        value: 'null',
    },
    {
        label: 'Все',
        value: 'all',
    },
    {
        label: 'Только удалённые',
        value: 'only',
    },
];

type Props = {
    store: FilterStore
}

const WorkersFilter = observer(({ store }: Props) => {
    const [open, setOpen] = useState(false);

    const showDrawer = () => {
        setOpen(true);
    };

    const onClose = () => {
        setOpen(false);
    };

    const handleSortChange = (value: WorkerFilter['sortBy']) => {
        store.changeBy(value);
    };
    const handleRadioChange = (e: RadioChangeEvent) => {
        store.changeDir(e.target.value);
    };

    const handleCreatedDates: RangePickerProps['onChange'] = (_, dateString) => {
        store.changeCreatedDates(dateString[0], dateString[1]);
    };

    const handleUpdatedDates: RangePickerProps['onChange'] = (_, dateString) => {
        store.changeUpdatedDates(dateString[0], dateString[1]);
    };

    const handleDeletedItems = (value: WorkerFilter['deleted']) => {
        store.changeDeleted(value);
    };

    return (
        <>
            <Button type="default" onClick={showDrawer}>
                <FontAwesomeIcon className='btn-icon' icon={faFilter} />
            </Button>
            <Drawer title="Фильтр" placement="right" onClose={onClose} open={open}>
                <Space direction="vertical" size="middle">
                    <Row>
                        <Col>
                            <Select
                                defaultValue={store.filter.sortBy}
                                style={{ width: '200px' }}
                                options={sortOptions}
                                onChange={handleSortChange}
                            />
                            <Radio.Group
                                defaultValue={store.filter.sortDirection}
                                onChange={handleRadioChange}
                            >
                                <Radio.Button value="asc">
                                    <FontAwesomeIcon icon={faArrowUpWideShort} />
                                </Radio.Button>
                                <Radio.Button value="desc">
                                    <FontAwesomeIcon icon={faArrowDownWideShort} />
                                </Radio.Button>
                            </Radio.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Typography.Title level={5}>Дата создания</Typography.Title>
                        <Col span={24}>
                            <Space>
                                <DatePicker.RangePicker onChange={handleCreatedDates} />
                            </Space>
                        </Col>
                    </Row>
                    <Row>
                        <Typography.Title level={5}>Дата обновления</Typography.Title>
                        <Col span={24}>
                            <Space>
                                <DatePicker.RangePicker onChange={handleUpdatedDates} />
                            </Space>
                        </Col>
                    </Row>
                    <Row>
                        <Typography.Title level={5}>Показывать удалённых</Typography.Title>
                        <Col span={24}>
                            <Space>
                                <Select
                                    defaultValue={store.filter.deleted}
                                    style={{ width: '200px' }}
                                    options={delOptions}
                                    onChange={handleDeletedItems}
                                />
                            </Space>
                        </Col>
                    </Row>
                </Space>
            </Drawer>
        </>
    );
});

export { WorkersFilter };
