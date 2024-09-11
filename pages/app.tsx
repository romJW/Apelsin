import { Route, Routes, useLocation, Location, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { messageService } from '../../classes/messageService';
import { SettingsManager } from '../../classes/settingsManager';
import { ApelsinFooter } from '../organisms/common/apelsinFooter';
import { ApelsinHeader } from '../organisms/common/apelsinHeader';
import { CRMProfile } from '../organisms/crmProfile';
import { InvitationList } from '../organisms/invitations/invitationList';
import { ProductList } from '../organisms/product/productList';
import { ProductProfile } from '../organisms/product/productProfile';
import { ProductCategoryList } from '../organisms/productCategory/productCategoryList';
import { ProductCategoryProfile } from '../organisms/productCategory/productCategoryProfile';
import { AfterLoginForm } from '../organisms/security/afterLoginForm';
import { CrmFormCreation } from '../organisms/security/crmFormCreation';
import { ConnectionForm } from '../organisms/security/connectionForm';
import { Logout } from '../organisms/security/logout';
import { ServiceList } from '../organisms/service/serviceList';
import { ServiceProfile } from '../organisms/service/serviceProfile';
import { ServiceCategoryList } from '../organisms/serviceCategory/serviceCategoryList';
import { ServiceCategoryProfile } from '../organisms/serviceCategory/serviceCategoryProfile';
import { SpecialtyList } from '../organisms/specialty/specialtyList';
import { SpecialtyProfile } from '../organisms/specialty/specialtyProfile';
import { WorkerList } from '../organisms/workers/workerList';
import { WorkerProfile } from '../organisms/workers/workerProfile';
import { CustomerList } from '../organisms/customers/customerList';
import { CustomerProfile } from '../organisms/customers/customerProfile';
import { OrderList } from '@organisms/orders/orderList';
import { OrderCreate } from '@organisms/orders/create/orderCreate';
import { OrderProfile } from '@organisms/orders/profile/orderProfile';
import { OrderEdit } from '@organisms/orders/edit/orderEdit';
import { LogList } from '@organisms/security/logList';
import { TransactionList } from '@organisms/security/transactionList';
import { NotificationList } from '@organisms/notifications/notificationList';
import { NotificationProfile } from '@organisms/notifications/notificationProfile';
const App = (): JSX.Element => {
    const isConnect = useRef(false);
    const oldSelectedKey = useRef<Location>(null);
    let navigate  = useNavigate();
    let location = useLocation();

    function checkConnection() {
        if (SettingsManager.getConnectionCredentials()?.token != null) {
            isConnect.current = true;
            if (SettingsManager.getConnectionCredentials().crmID && location?.pathname == '/') {
                navigate(`/lk/worker/crm/${SettingsManager.getConnectionCredentials().crmID}`);
            } else if (location?.pathname == '/') navigate('/lk');
        } else {
            isConnect.current = false;
            if (location?.pathname != 'login') navigate('/login');
        }
    }

    useEffect(() => {
        checkConnection();
    }, [location.pathname]);

    function getBody(): JSX.Element {
        if (oldSelectedKey.current != location) {
            messageService.clearMessages();
        }

        oldSelectedKey.current = location;
        return (
            <Routes>
                <Route path="/login" element={<ConnectionForm />} />
                <Route path="/lk" element={<AfterLoginForm />} />
                <Route path="/logout" element={<Logout />} />
                <Route path="/lk/worker" element={<CrmFormCreation />} />
                <Route path="/lk/worker/crm/:id" element={<CRMProfile />} />
                <Route path="/lk/worker/crm/:id/edit" element={<CRMProfile />} />
                <Route
                    path="/lk/worker/crm/:id/invitations"
                    element={<InvitationList />}
                />
                <Route
                    path="/lk/worker/crm/:id/workers"
                    element={<WorkerList />}
                />
                    <Route
                    path="/lk/worker/profile"
                    element={<WorkerProfile />}
                />
                    <Route
                    path="/lk/worker/profile/edit"
                    element={<WorkerProfile />}
                />
                <Route
                    path="/lk/worker/crm/:crmID/workers/:workerID"
                    element={<WorkerProfile />}
                />
                <Route
                    path="/lk/worker/crm/:crmID/workers/:workerID/create"
                    element={<WorkerProfile />}
                />
                <Route
                    path="/lk/worker/crm/:crmID/workers/:workerID/edit"
                    element={<WorkerProfile />}
                />
                <Route
                    path="/lk/worker/crm/:crmID/customers"
                    element={<CustomerList />}
                />
                <Route
                    path="/lk/worker/crm/:crmID/customers/:customerID"
                    element={<CustomerProfile />}
                />
                <Route
                    path="/lk/worker/crm/:crmID/customers/:customerID/create"
                    element={<CustomerProfile />}
                />
                <Route
                    path="/lk/worker/crm/:crmID/customers/:customerID/edit"
                    element={<CustomerProfile  />}
                />
                <Route
                    path="/lk/worker/crm/:id/specialties"
                    element={<SpecialtyList />}
                />
                <Route
                    path="/lk/worker/crm/:id/specialties/:specialtyID"
                    element={<SpecialtyProfile />}
                />
                <Route
                    path="/lk/worker/crm/:id/specialties/:specialtyID/edit"
                    element={<SpecialtyProfile />}
                />
                <Route
                    path="/lk/worker/crm/:id/product-category"
                    element={<ProductCategoryList />}
                />
                <Route
                    path="/lk/worker/crm/:id/product-category/:productCategoryID"
                    element={<ProductCategoryProfile />}
                />
                <Route
                    path="/lk/worker/crm/:id/product-category/:productCategoryID/create"
                    element={<ProductCategoryProfile />}
                />
                <Route
                    path="/lk/worker/crm/:id/product-category/:productCategoryID/edit"
                    element={<ProductCategoryProfile />}
                />
                <Route
                    path="/lk/worker/crm/:id/products"
                    element={<ProductList />}
                />
                <Route
                    path="/lk/worker/crm/:id/products/nav/:productCategoryId"
                    element={<ProductList />}
                />
                <Route
                    path="/lk/worker/crm/:id/products/:productID"
                    element={<ProductProfile />}
                />
                <Route
                    path="/lk/worker/crm/:id/products/:productID/create"
                    element={<ProductProfile />}
                />
                <Route
                    path="/lk/worker/crm/:id/products/:productID/edit"
                    element={<ProductProfile />}
                />
                <Route
                    path="/lk/worker/crm/:id/service-categories"
                    element={<ServiceCategoryList />}
                />
                <Route
                    path="/lk/worker/crm/:id/service-categories/:serviceCategoryID"
                    element={<ServiceCategoryProfile />}
                />
                <Route
                    path="/lk/worker/crm/:id/service-categories/:serviceCategoryID/create"
                    element={<ServiceCategoryProfile />}
                />
                <Route
                    path="/lk/worker/crm/:id/service-categories/:serviceCategoryID/edit"
                    element={<ServiceCategoryProfile />}
                />
                <Route
                    path="/lk/worker/crm/:id/services"
                    element={<ServiceList />}
                />
                <Route
                    path="/lk/worker/crm/:id/services/nav/:serviceCategoryId"
                    element={<ServiceList />}
                />
                <Route
                    path="/lk/worker/crm/:id/services/:serviceID"
                    element={<ServiceProfile />}
                />
                <Route
                    path="/lk/worker/crm/:id/services/:serviceID/create"
                    element={<ServiceProfile />}
                />
                <Route
                    path="/lk/worker/crm/:id/services/:serviceID/edit"
                    element={<ServiceProfile />}
                />
                <Route
                    path="/lk/worker/crm/:id/orders"
                    element={<OrderList />}
                />
                <Route 
                    path="/lk/worker/crm/:id/orders/create"
                    element={<OrderCreate />}
                />
                <Route 
                    path="/lk/worker/crm/:id/orders/view/:orderID"
                    element={<OrderProfile />}
                />
                <Route 
                    path="/lk/worker/crm/:id/orders/edit/:orderID"
                    element={<OrderEdit />}
                />
                <Route
                    path="/lk/worker/crm/:id/logs"
                    element={<LogList/>}
                />
                <Route
                    path="/lk/worker/crm/:id/transactions"
                    element={<TransactionList/>}
                />
                  <Route
                    path="/lk/worker/crm/:id/notifications"
                    element={<NotificationList/>}
                />
                 <Route
                    path="/lk/worker/crm/:id/notifications/:notificationId"
                    element={<NotificationProfile/>}
                />
            </Routes>
        );
    }

    return (
        <div>
            <ApelsinHeader />
            <div id="apelsin-app-content">
                {getBody()}
            </div>
            <ApelsinFooter />
        </div>
    );
};

export { App };
