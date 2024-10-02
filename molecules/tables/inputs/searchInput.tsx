import React, { useState } from 'react';
import { Select } from 'antd';
import axios from 'axios';
import qs from 'qs';
import type { SelectProps } from 'antd';
import { SettingsManager } from '@classes/settingsManager';
import { GlobalConstants } from '@constants/global';
import { TOrder } from 'types/Orders/order';
import './style.scss';

let timeout: ReturnType<typeof setTimeout> | null;
let currentValue: string;

type TData = {
    id: number;
    name: string;
    quantity: number | null;
    price: number | null;
    total: number | null;
};

interface ISearchInput {
    placeholder: string;
    style: React.CSSProperties;
    fetchType: string;
    setDataOrder: (
        item: TData,
        type: string,
        rowIndex: number,
    ) => void;
    rowIndex: number | null;
    defaultValue: string;
}

const SearchInput: React.FC<ISearchInput> = ({
    placeholder,
    style,
    fetchType,
    setDataOrder,
    rowIndex,
    defaultValue,
}) => {
    const [data, setData] = useState<SelectProps['options']>([]);
    const [value, setValue] = useState<string>();
    const [isError, setIsError] = useState<boolean>(false);

    const fetch = (
        query: string,
        callback: React.Dispatch<React.SetStateAction<SelectProps['options']>>
    ) => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
        currentValue = query;
        const creds = SettingsManager.getConnectionCredentials();
        const fake = () => {
            const str = qs.stringify({
                crm_id: creds.crmID,
                query: query,
            });

            axios
                .get(`${GlobalConstants.BaseUrl}/${fetchType}/search?${str}`, {
                    headers: {
                        Authorization: 'Bearer ' + creds.token,
                    },
                })
                .then((res: any) => {
                    setIsError(false);
                    if (currentValue === query) {
                        const result = res.data.data;
                        const tempData = result.map((item: any) => ({
                            value: item.name,
                            text: item.name,
                            id: item.id,
                            price: item.price,
                        }));
                        callback(tempData);
                    }
                })
                .catch((e) => {
                    console.log(e.message);
                    setIsError(true);
                });
        };
        timeout = setTimeout(fake, 300);
    };

    const handleSearch = (newValue: string) => {
        if (newValue) {
            fetch(newValue, setData);
        } else {
            setData([]);
        }
    };

    const handleChange = (newValue: string) => {
        setValue(newValue);
    };

    return (
        <Select
            showSearch
            status={isError ? 'error' : ''}
            value={defaultValue}
            placeholder={placeholder}
            style={style}
            defaultActiveFirstOption={false}
            showArrow={false}
            filterOption={false}
            onSearch={handleSearch}
            onChange={handleChange}
            notFoundContent={null}
            options={(data || []).map((d) => ({
                value: d.value,
                label: d.text,
            }))}
            onSelect={(label) => {
                const dataItem = data.filter((item) => item.value == label)[0];
                setDataOrder(
                    {
                        id: +dataItem.id,
                        name: dataItem.text,
                        price: dataItem.price,
                        quantity: 1,
                        total: 1 * dataItem.price,
                    },
                    fetchType,
                    rowIndex
                );
            }}
        />
    );
};

export { SearchInput };
