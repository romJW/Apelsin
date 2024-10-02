import { MenuProps } from 'antd';
import { Dropdown, Button } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { viewItems } from '../listViewChanger/listViewChanger';
import { pageSizeItems } from '../paginationControls/pageSizeChanger';

const items: MenuProps['items'] = [
    {
        key: 'viewChanger',
        label: <span>Вид</span>,
        children: [
            ...viewItems
        ]
    },
    {
        key: 'sizeChanger',
        label: <span>Размер</span>,
        children: [
            ...pageSizeItems
        ]
    },
];

const OptionsMenu = () => {
    return (
        <Dropdown menu={{ items: items }}>
            <Button>
                <FontAwesomeIcon className='btn-icon' icon={faEllipsisV} />
            </Button>
        </Dropdown>
    );
};

export { OptionsMenu };
