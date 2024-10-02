import { faArrowRightFromBracket, faBarcode, faBookOpen, faBriefcase, faDollar, faHouse, faPlug, faScrewdriverWrench, faTableList, faUserTie, faUsers, faUsersGear } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MenuProps, Tooltip } from "antd";
import { SettingsManager } from "../../../classes/settingsManager";
import {useNavigate, useLocation} from 'react-router-dom';
import AppFooter from '@molecules/appFooter/appFooter';
import { LastIdStore } from "@pages/lastIdStore";

const ApelsinFooter = (): JSX.Element => {
    const navigate = useNavigate();
    const location = useLocation();
    const creds = SettingsManager.getConnectionCredentials();
    
    const _unconnectedItems: MenuProps['items'] = [
        {   
            icon: <Tooltip placement="topRight" title="Подключение">
                    <FontAwesomeIcon icon={faPlug} />
                </Tooltip>,
            key: "login",
            title: "Подключение",
            onClick: () => navigate('/login'),
        },
        {
            disabled: !creds?.token,
            icon: <FontAwesomeIcon icon={faBriefcase} />,
            key: "lk",
            onClick: () => navigate('/lk'),
            title: "Выбор CRM",
        },
        {
            disabled: !creds?.token,
            icon: <FontAwesomeIcon icon={faArrowRightFromBracket} />,
            key: "logout",
            onClick: () => navigate('/logout'),
            title: "Закрыть сессию",
        },
    ];

    const _navLinks = [
        {
            disabled: creds?.crmID == null,
            icon: <FontAwesomeIcon icon={faHouse} />,
            key: "crm",
            onClick: () => navigate(`/lk/worker/crm/${creds.crmID}`),
            title: "Профиль CRM",
        },
        {
            disabled: creds?.crmID == null,
            icon: <FontAwesomeIcon icon={faUsersGear} />,
            key: "workers",
            onClick: () => navigate(`/lk/worker/crm/${creds.crmID}/workers`),
            title: "Сотрудники",
        },
        {
            disabled: creds?.crmID == null,
            icon: <FontAwesomeIcon icon={faUsers} />,
            key: "customers",
            onClick: () => navigate(`/lk/worker/crm/${creds.crmID}/customers`),
            title: "Клиенты",
        },
        {
            disabled: creds?.crmID == null,
            icon: <FontAwesomeIcon icon={faTableList} />,
            key: "orders",
            onClick: () => navigate(`/lk/worker/crm/${creds.crmID}/orders`),
            title: "Заказы",
        },
        {
            disabled: creds?.crmID == null,
            icon: <FontAwesomeIcon icon={faBarcode} />,
            key: "products",
            onClick: () => navigate(`/lk/worker/crm/${creds.crmID}/products`),
            title: "Товары",
        },
        {
            disabled: creds?.crmID == null,
            icon: <FontAwesomeIcon icon={faScrewdriverWrench} />,
            key: "services",
            onClick: () => navigate(`/lk/worker/crm/${creds.crmID}/services`),
            title: "Услуги",
        },
        {
            disabled: creds?.crmID == null,
            icon: <FontAwesomeIcon icon={faDollar} />,
            key: "transactions",
            onClick: () => navigate(`/lk/worker/crm/${creds.crmID}/transactions`),
            title: "Транзакции",
        },
        {
            disabled: creds?.crmID == null,
            icon: <FontAwesomeIcon icon={faBookOpen}  />,
            key: "logs",
            onClick: () => navigate(`/lk/worker/crm/${creds.crmID}/logs`),
            title: "Журнал",
        },
        {
            disabled: creds?.token == null,
            icon: <FontAwesomeIcon icon={faUserTie} />,
            key: "profile",
            onClick: () => {
                LastIdStore.setLastUserId(null);
                if (location.pathname.includes('crm')) { 
                    navigate(`/lk/worker/crm/${creds.crmID}/workers/${creds.userId}`);
                } else {
                    navigate(`/lk/worker/profile`);
                }
            },
            title: "Профиль",
        },
        {
            disabled: !creds?.token,
            icon: <FontAwesomeIcon icon={faBriefcase} />,
            key: "lk",
            onClick: () => navigate('/lk'),
            title: "Выбор CRM",
        },
        {
            icon: <FontAwesomeIcon icon={faArrowRightFromBracket} />,
            key: "logout",
            onClick: () => navigate('/logout'),
            title: "Выйти",
        },
    ];

    return (
        <div id="apelsin-app-footer">
                <AppFooter items={creds?.token ? _navLinks : _unconnectedItems}/>
        </div>
    );
};


export {ApelsinFooter};
