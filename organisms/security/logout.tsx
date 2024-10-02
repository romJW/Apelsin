import React, { useEffect } from "react";
import {useNavigate} from 'react-router-dom'
import { CRMAPIManager } from "../../../classes/crmApiManager";
import { messageService } from "../../../classes/messageService";
import { SettingsManager } from "../../../classes/settingsManager";
import { Loader } from "../../atoms/loader";

const Logout = (): JSX.Element => {
    const navigate = useNavigate()
    async function logout() {
        const creds = SettingsManager.getConnectionCredentials();
        if(creds?.token) {
            try { 
                await CRMAPIManager.request<any>(async (api)=>{
                    return await api.logout(creds.crmID);
                });
            }
            finally {
                messageService.sendInfo("Сессия закрыта.");
            }
        }
        SettingsManager.clearConnectionCredentials();
        navigate('/login');
    }

    useEffect(() => {
        logout();
    }, []);
    
    return (<Loader isFullSize={true}/>);
};

export { Logout };