import { faBars, faCheck, faEdit, faHouse, faUserGear, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Breadcrumb, Col, Dropdown, Input, Menu, Row } from "antd";
import * as React from "react";
import { useEffect, useState } from "react";
import { ServiceActionResp } from "../../../api/responseModels/service/serviceActionResponse";
import { CRMAPIManager } from "../../../classes/crmApiManager";
import { messageService } from "../../../classes/messageService";
import { SettingsManager } from "../../../classes/settingsManager";
import { GlobalConstants } from "../../../constants/global";
import { TServiceAction } from "../../../types/serviceAction";
import { Loader } from "../../atoms/loader";

type TProps = {
    setActivePivot: React.Dispatch<React.SetStateAction<string>>,
    serviceActionId?: number
};

const ServiceActionProfile = ({ setActivePivot, serviceActionId }: TProps): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [serviceAction, setServiceAction] = useState<TServiceAction>(null);
    const [editing, setEditing] = useState<boolean>(false);
    
    async function getServiceAction(){
        setIsLoading(true);
        try {
            const creds = SettingsManager.getConnectionCredentials();
            const serAct = await CRMAPIManager.request<ServiceActionResp>(async (api) => {
                return await api.getServiceAction(serviceActionId, creds.crmID);
            });
            if (serAct.errorMessages) throw serAct.errorMessages;
            setServiceAction(serAct.data.data);
        }
        catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
    }

    function handleEditing(){
        setEditing(true);
    }

    async function handleSaveEditing(){
        if(serviceAction.name == ""){
            messageService.sendError("Имя действия услуги не может быть пустым!");
            return;
        }
        setIsLoading(true);
        setEditing(false);
        try {
            const creds = SettingsManager.getConnectionCredentials();
            const servAct = await CRMAPIManager.request<ServiceActionResp>(async (api) => {
                return await api.updateServiceAction(serviceActionId, serviceAction.name, creds.crmID);
            });
            if (servAct.errorMessages) throw servAct.errorMessages;
            setServiceAction(servAct.data.data);
        }
        catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
    }

    async function handleAbortEditing(){
        setIsLoading(true);
        setEditing(false);
        await getServiceAction();
        setIsLoading(false);
    }

    useEffect(()=>{
        if (serviceActionId == null) {
            setActivePivot(GlobalConstants.ActivePivotServiceActionListValue);
            messageService.sendError("Требуется указать ID профиля.");
        }
        else {
            getServiceAction();
        }
    }, []);

    return (
        <div id="app-service-action-profile">
            {isLoading && <Loader />}
            <div className="functional-container">
                <Dropdown.Button 
                    className="functional-menu"
                    icon={<FontAwesomeIcon icon={faBars}/>}
                    overlay={
                        <Menu
                            items={
                                editing ? [
                                {
                                    key: 'save',
                                    label: "Сохранить",
                                    icon: <FontAwesomeIcon icon={faCheck}/>,
                                    onClick: handleSaveEditing
                                },{
                                    key: 'abort',
                                    label: "Отменить",
                                    icon: <FontAwesomeIcon icon={faXmark}/>,
                                    onClick: handleAbortEditing
                                }]
                                : [
                                {
                                    key: 'edit',
                                    label: "Редактировать",
                                    icon: <FontAwesomeIcon icon={faEdit}/>,
                                    onClick: handleEditing
                                }]
                            }
                        />
                    }
                    placement="topRight"
                    type={editing ? "primary" : "default"}
                />
            </div>
            <Row className="breadcrumb-header">
                <Col className="header-location">
                    <span>Действие услуг</span>
                </Col>
            </Row>
            <Row className="breadcrumbs-controls">
                <Col className="breadcrumbs">
                    <Breadcrumb>
                        <Breadcrumb.Item onClick={()=>setActivePivot(GlobalConstants.ActivePivotCRMProfileValue)}>
                            <FontAwesomeIcon icon={faHouse}/>
                        </Breadcrumb.Item>
                        <Breadcrumb.Item onClick={()=>setActivePivot(GlobalConstants.ActivePivotServiceActionListValue)}>
                            <FontAwesomeIcon icon={faUserGear}/>
                            <span className="crumb-name">Действия услуг</span>
                        </Breadcrumb.Item>
                        <Breadcrumb.Item>
                            <span>{serviceAction?.code}</span>
                        </Breadcrumb.Item>
                    </Breadcrumb>
                </Col>
            </Row>
            <div className="service-action-profile">
                <Row className="service-action-info">
                    <Col className="outer-box">
                        <Row className="label-row">
                            <Col>
                                <p>Название</p>
                            </Col>
                        </Row>
                        <Row className="value-row">
                            <Col>
                            {editing 
                            ? <Input value={serviceAction?.name} onChange={(e) => setServiceAction({...serviceAction, name: e.target.value})}/> 
                            : <p>{serviceAction?.name}</p> }
                            </Col>
                        </Row>
                    </Col>
                    <Col className="outer-box">
                        <Row className="label-row">
                            <Col>
                                <p>Код</p>
                            </Col>
                        </Row>
                        <Row className="value-row">
                            <Col>
                                <p>{serviceAction?.code ?? "-"}</p>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export { ServiceActionProfile };