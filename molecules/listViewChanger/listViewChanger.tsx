import { DownOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Dropdown, Space, Typography } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faGripHorizontal, faGripVertical } from '@fortawesome/free-solid-svg-icons';
import { observer } from 'mobx-react';

import { columnViewStore } from './listViewStore';
import { MenuInfo } from 'rc-menu/lib/interface';

const onClick = (info: MenuInfo) => {
    columnViewStore.changeCol(parseInt(info.key, 10));
};

const items: MenuProps['items'] = [
    {
        key: '1',
        label: <span>В ряд</span>,
        icon: <FontAwesomeIcon icon={faBars} />,
        onClick,
    },
    {
        key: '2',
        label: <span>2 колонки </span>,
        icon: <FontAwesomeIcon icon={faGripVertical} />,
        onClick,
    },
    {
        key: '3',
        label: <span>3 колонки </span>,
        icon: <FontAwesomeIcon icon={faGripHorizontal} />,
        onClick,
    },
];

const ListViewChanger = observer(() => {
    return (
        <Dropdown
            menu={{
                items,
                selectable: true,
                defaultSelectedKeys: [columnViewStore.col.toString()],
            }}
        >
            <Typography.Link>
                <Space>
                    Вид
                    <DownOutlined />
                </Space>
            </Typography.Link>
        </Dropdown>
    );
});

export { ListViewChanger, items as viewItems };
