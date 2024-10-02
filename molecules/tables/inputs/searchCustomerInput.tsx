import React, { useState } from 'react';
import { Select } from 'antd';
import axios from 'axios';
import qs from 'qs';
import type { SelectProps } from 'antd';
import { SettingsManager } from '@classes/settingsManager';
import { GlobalConstants } from '@constants/global';

let timeout: ReturnType<typeof setTimeout> | null;
let currentValue: string;

interface ISearchInput {
    placeholder: string; 
    style: React.CSSProperties;
    setCustomerProfile: (id: number) => void;
    defaultValue: string;
}

const SearchCustomerInput: React.FC<ISearchInput> = ({
    placeholder,
    style,
    setCustomerProfile,
}) => {
    const [data, setData] = useState<SelectProps['options']>([]);
    const [value, setValue] = useState<string>();
    const [isError, setIsError] = useState<boolean>(false);

    const fetch = (query: string, callback: React.Dispatch<React.SetStateAction<SelectProps['options']>>) => {
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
            
            axios.get(`${GlobalConstants.BaseUrl}/customerProfile/getList?${str}`, {
                headers: { 
                'Authorization': 'Bearer ' + creds.token
                }
            })
            .then((res: any) => {
                setIsError(false)
                if (currentValue === query) {
                const result  = res.data.data;
                const tempData = result.map((item: any) => ({
                    value: item.id,
                    text: item.fio,
                }));
                callback(tempData);
                }
            })
            .catch(e => {
                setIsError(true)
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
            value={value}
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
            onSelect={(label)=> {
            setCustomerProfile(+label)
            }}
        />
    );
};

export { SearchCustomerInput };