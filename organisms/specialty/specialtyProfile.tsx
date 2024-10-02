import {
    faBars,
    faCheck,
    faEdit,
    faUserGear,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Col, Dropdown, Input, Menu, Row } from 'antd';
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ProfileResp } from '../../../api/responseModels/profile/profileResponse';
import { CRMAPIManager } from '../../../classes/crmApiManager';
import { messageService } from '../../../classes/messageService';
import { SettingsManager } from '../../../classes/settingsManager';
import { TSpecialty } from '../../../types/specialty';
import { Loader } from '../../atoms/loader';
import { Common } from '../../../classes/commonMethods';
import { GlobalConstants } from '@constants/global';
import { HeaderBreadcrumbProfiles } from "@molecules/breadcrumbs/profilesBreadcrumbs/HeaderProfilesBreadcrumb";
import { LastIdStore } from '@pages/lastIdStore';

const SpecialtyProfile = (): JSX.Element => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [specialty, setSpecialty] = useState<TSpecialty>(null);
    const [editing, setEditing] = useState<boolean>(false);
    const currentID = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const creds = SettingsManager.getConnectionCredentials();

    function checkCurrentUrl() {
        if (location.pathname.includes('edit')) {
            setEditing(true);
        } else {
            navigate('');
        }
    }

    async function getSpecialty() {
        setIsLoading(true);
        try {
            const creds = SettingsManager.getConnectionCredentials();
            const spec = await CRMAPIManager.request<ProfileResp>(async (api) => {
                return await api.getProfile(LastIdStore.lastSpecialtyId || currentID.current, creds.crmID);
            });
            if (spec.errorMessages) throw spec.errorMessages;
            setSpecialty(spec.data.data);
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
    }

    function handleEditing() {
        navigate(`/lk/worker/crm/${creds.crmID}/specialties/${LastIdStore.lastSpecialtyId || currentID.current}/edit`);
        setEditing(true);
    }

    async function handleSaveEditing() {
        if (specialty.name == '') {
            messageService.sendError('Имя профиля не может быть пустым!');
            return;
        }
        setIsLoading(true);
        try {
            const creds = SettingsManager.getConnectionCredentials();
            const spec = await CRMAPIManager.request<ProfileResp>(async (api) => {
                return await api.updateProfile(
                    LastIdStore.lastSpecialtyId || currentID.current,
                    creds.crmID,
                    specialty.name
                );
            });
            if (spec.errorMessages) throw spec.errorMessages;
            setSpecialty(spec.data.data);
            setEditing(false);
            navigate(`/lk/worker/crm/${creds.crmID}/specialties/${LastIdStore.lastSpecialtyId || currentID.current}`);
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
    }

    async function handleAbortEditing() {
        setIsLoading(true);
        navigate(`/lk/worker/crm/${creds.crmID}/specialties/${LastIdStore.lastSpecialtyId || currentID.current}`);
        setEditing(false);
        await getSpecialty();
        setIsLoading(false);
    }

    async function checkSpecialtyBelongToCrm() {
        try {
            const urlArr = window.location.pathname.split('/');
            if (urlArr[urlArr.length - 1] == 'edit') {
                currentID.current = Number(urlArr[urlArr.length - 2]);
            } else {
                currentID.current = Number(urlArr[urlArr.length - 1]);
            }
            const spec = await CRMAPIManager.request<ProfileResp>(async (api) => {
                return await api.getProfile( currentID.current, creds.crmID);
            });
            if (!isNaN(currentID.current) && spec.statusCode == 404) {
                navigate(`/lk/worker/crm/${creds.crmID}/specialties`);
            }
            
            
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
    }

    function beforeMountSpecialtyProfile(){
        checkCurrentUrl();
        Common.checkUserBelongToCrm(GlobalConstants.CrmOrderinUrl).then((res) => {
            if(!res) navigate(`/lk/worker/crm/${creds.crmID}`);
        });
        if (!isNaN(currentID.current)){
            checkSpecialtyBelongToCrm().then(()=>{
                if (currentID.current != 0) getSpecialty();
            })
        }
        else{
            setEditing(true)
        }
    }

    useEffect(() => {
        beforeMountSpecialtyProfile()
    }, [currentID.current, LastIdStore.lastSpecialtyId]);

    return (
        <div id="app-specialty-profile">
            {isLoading && <Loader />}
            <div className="functional-container">
                <Dropdown.Button
                    className="functional-menu"
                    icon={<FontAwesomeIcon icon={faBars} />}
                    overlay={
                        <Menu
                            items={
                                editing
                                    ? [
                                          {
                                              key: 'save',
                                              label: 'Сохранить',
                                              icon: <FontAwesomeIcon icon={faCheck} />,
                                              onClick: handleSaveEditing,
                                          },
                                          {
                                              key: 'abort',
                                              label: 'Отменить',
                                              icon: <FontAwesomeIcon icon={faXmark} />,
                                              onClick: handleAbortEditing,
                                          },
                                      ]
                                    : [
                                          {
                                              key: 'edit',
                                              label: 'Редактировать',
                                              icon: <FontAwesomeIcon icon={faEdit} />,
                                              onClick: handleEditing,
                                          },
                                      ]
                            }
                        />
                    }
                    placement="topRight"
                    type={editing ? 'primary' : 'default'}
                />
            </div>
            <HeaderBreadcrumbProfiles
                dataIcon={faUserGear}
                dataId={specialty?.code}
                dataTitle={'Профили'}
                title={'Профиль работы'}
                route={`/lk/worker/crm/${creds.crmID}/specialties`}
                isForInvitation={false}
                dataName={''}
                isSpecialty={true}
            />
            <div className="specialty-profile">
                <Row className="specialty-info">
                    <Col className="outer-box">
                        <Row className="label-row">
                            <Col>
                                <p>Название</p>
                            </Col>
                        </Row>
                        <Row className="value-row">
                            <Col>
                                {editing ? (
                                    <Input
                                        value={specialty?.name}
                                        onChange={(e) =>
                                            setSpecialty({ ...specialty, name: e.target.value })
                                        }
                                    />
                                ) : (
                                    <p>{specialty?.name}</p>
                                )}
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
                                <p>{specialty?.code ?? '-'}</p>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export { SpecialtyProfile };
