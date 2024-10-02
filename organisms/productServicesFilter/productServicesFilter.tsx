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
    Space,
    InputNumber,
} from 'antd';
import { RangePickerProps } from 'antd/lib/date-picker';
import { observer } from 'mobx-react';
import { useCallback, useMemo, useState } from 'react';
import { ProductFilter } from 'types/filters';
import { debounce } from '../../../utils/functions';
import { FilterStore } from './filterStore';

const sortOptions = [
    {
        label: 'Наименование',
        value: 'name',
    },
    {
        label: 'Цена',
        value: 'price',
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

const ProductServicesFilter = observer(({store}: Props) => {
    const [open, setOpen] = useState(false);

    const showDrawer = () => {
        setOpen(true);
    };

    const onClose = () => {
        setOpen(false);
    };

    const handleSortChange = (value: ProductFilter['sortBy']) => {
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

    const handleDeletedItems = (value: ProductFilter['deleted']) => {
        store.changeDeleted(value);
    };

    const handleChangePrice = useCallback((min: number, max: number) => {
        store.changePrice(min, max);
    }, [store]);

    const debouncedChanged = useMemo(() => debounce(handleChangePrice, 500), [handleChangePrice]);

    return (
        <>
            <Button className="round-button" type="default" onClick={showDrawer}>
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
                        <Typography.Title level={5}>Цена</Typography.Title>
                        <Col span={24}>
                            <Space>
                                <InputNumber
                                    min={0}
                                    defaultValue={parseInt(store.filter.price[0], 10)}
                                    onChange={(value) =>
                                        debouncedChanged(Number(value), store.filter.price[1])
                                    }
                                    pattern="[0-9]*"
                                    inputMode='numeric'
                                />
                                -
                                <InputNumber
                                    min={0}
                                    defaultValue={parseInt(store.filter.price[1], 10)}
                                    onChange={(value) =>
                                        debouncedChanged(store.filter.price[0], Number(value))
                                    }
                                    pattern="[0-9]*"
                                    inputMode='numeric'
                                />
                            </Space>
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
                        <Typography.Title level={5}>Показывать удалённые</Typography.Title>
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

export { ProductServicesFilter };
