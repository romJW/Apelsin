import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DownOutlined } from '@ant-design/icons';
import { Dropdown, MenuProps, Space, Typography } from 'antd';
import { observer } from 'mobx-react';
import { MenuInfo } from 'rc-menu/lib/interface';
import { store } from './pageSizeStore';

const onClick = (info: MenuInfo) => {
    store.changePS(parseInt(info.key, 10));
}

const items: MenuProps['items'] = [
    {
        key: '10',
        label: <span>10</span>,
        icon: <FontAwesomeIcon icon={['fas', 'signal-bars-weak']} />,
        onClick,
    },
    {
        key: '25',
        label: <span>25</span>,
        icon: <FontAwesomeIcon icon={['fas', 'signal-bars-fair']} />,
        onClick,
    },
    {
        key: '50',
        label: <span>50</span>,
        icon: <FontAwesomeIcon icon={['fas', 'signal-bars-good']} />,
        onClick,
    },
];

const PageSizeChanger = observer((): JSX.Element => {
    return (
        <Dropdown
            menu={{
                items,
                selectable: true,
                defaultSelectedKeys: [store.pS.toString()],
            }}
        >
            <Typography.Link>
                <Space>
                    Размер
                    <DownOutlined />
                </Space>
            </Typography.Link>
        </Dropdown>
    );
});

export { PageSizeChanger, items as pageSizeItems };
