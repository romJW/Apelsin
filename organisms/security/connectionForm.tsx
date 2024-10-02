import { Button, Divider, Form, Row, Col } from "antd";
import { useNavigate } from 'react-router-dom';
import { MaskedInput } from "antd-mask-input";
import * as React from "react";
import { SyntheticEvent, useEffect, useState } from "react";
import { CRMAPI } from "../../../api/crmApi";
import { AfterCodeActions } from "../../../api/enums/afterCodeActions";
import { RequestResult } from "../../../api/responseModels/requestResult";
import { ConnectionResp } from "../../../api/responseModels/security/connectionResponse";
import { messageService } from "../../../classes/messageService";
import { SettingsManager } from "../../../classes/settingsManager";
import { GlobalConstants } from "../../../constants/global";
import { Loader } from "../../atoms/loader";

const ConnectionForm = (): JSX.Element => {
    const [afterCodeAction, setAfterCodeAction] = useState<AfterCodeActions>(null);
    const [cooldown, setCooldown] = useState<number>(0);
    const [codeValid, setCodeValid] = useState<boolean>(false);
    const [codeValue, setCodeValue] = useState<string>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [lastCodeSend, setLastCodeSend] = useState<number>(null);
    const [numberLocked, setNumberLocked] = useState<boolean>(false);
    const [numberValid, setNumberValid] = useState<boolean>(false);
    const [numberValue, setNumberValue] = useState<string>("");
    const codeMask = /^[0-9]{4}$/;
    const phoneMask = /^[0-9]{10}$/;
    const navigate = useNavigate();
    function calculateCooldown(): number {
        if(lastCodeSend) {
            const left = GlobalConstants.GetCodeCooldown - Math.floor(Date.now() - lastCodeSend);
            if(left <= 0){
                setCooldown(0);
                return 0;
            }
            return Math.floor(left/1000);
        }
        return 0;
    }

    function onCodeChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        const newValue = e.target.value;
        setCodeValid(newValue && codeMask.test(newValue.toString()));
        setCodeValue(newValue);
    }

    function onNumberChange(e: SyntheticEvent & { maskedValue: string; unmaskedValue: string }) {
        const newValue = e.unmaskedValue;
        if(newValue && phoneMask.test(newValue)){
            setCodeValid(false);
            setNumberLocked(false);
            setNumberValid(true);
        }
        else {
            setCodeValid(false);
            setNumberLocked(false);
            setNumberValid(false);
        }
        setNumberValue(newValue);
    }

    async function onSendCode() {
        if(cooldown != 0) return;
        const api = new CRMAPI();
        let result: RequestResult<ConnectionResp>;
        try {
            result = await api.connection(numberValue);
            if (result.errorMessages) throw result.errorMessages;
            setAfterCodeAction(result.data.require_method);
            //result = await api.sendCode(numberValue);
            //if (result.errorMessage) throw new Error(result.errorMessage);
            setLastCodeSend(Date.now());
            setNumberLocked(true);
            messageService.sendInfo("Код отправлен.");
        }
        catch (errors) {
            messageService.sendErrorList(errors);
        }
    }

    async function onSubmitCode() {
        const api = new CRMAPI();
        try {
            const result =
                afterCodeAction == AfterCodeActions.login
                    ? await api.login(numberValue, codeValue)
                    : await api.register(numberValue, codeValue);
            if (result.errorMessages) throw result.errorMessages;
            SettingsManager.setConnectionCredentials({token: result.data?.token, crmID: null});
            const user = await api.currentUser();
            SettingsManager.updateConnectionCredentials({userId: user.data.data.id, workerProfileId: user.data.data?.worker_profile?.id});
            navigate("/lk");
            messageService.sendSuccess('Удачный логин.');
        }
        catch (errors) {
            messageService.sendErrorList(errors);
        }
    }

    function unlockNumber() {
        setCodeValid(false);
        setCodeValue(null);
        setNumberLocked(false);
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            setCooldown(calculateCooldown());
        }, 1000);
        setIsLoading(false);
        return () => {
            clearTimeout(timer);
        };
    }, []);

    return (
        <div className="app-connection-authorization">
            {isLoading && <Loader />}
            <Divider>CRM <i className="text-logo"><span className="text-logo" style={{fontSize: 30}}>А</span>пельсин</i></Divider>
            <Form
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
                layout="vertical"
                style={{
                    paddingTop: 20
                }}
            >
                <Form.Item hidden={numberLocked}>
                    <h3 className="text-center">Введите номер телефона <br/> для входа или регистрации</h3>
                </Form.Item>

                <Row justify="center" gutter={16}>
                    <Col span={!numberLocked ? 13 : 12}>
                        <Form.Item label={lastCodeSend == null || !numberLocked ? '' : "Номер телефона: "}>
                            <MaskedInput
                                disabled={numberLocked}
                                mask="(000)-000-00-00"
                                //maxLength={10}
                                onChange={onNumberChange}
                                placeholder="(___)-___-__-__"
                                prefix="+7"
                                pattern="[0-9]*"
                                inputMode='numeric'
                            />
                        </Form.Item>
                    </Col>

                    <Col span={12} hidden={lastCodeSend == null || !numberLocked}>
                        <Form.Item
                            label="Код авторизации: "
                        >
                            <MaskedInput
                                disabled={!numberValid}
                                mask="0000"
                                onChange={onCodeChange}
                                placeholder="____"
                                pattern="[0-9]*"
                                inputMode='numeric'
                            />
                        </Form.Item>
                    </Col>
                </Row>


            </Form>
            <Form wrapperCol={{ span: 16 }}>
                <Row justify="center" gutter={16}>
                    <Col span={12}>
                        <Form.Item>
                            <Button
                                danger
                                disabled={!numberLocked}
                                onClick={unlockNumber}
                                type="default"
                            >
                                Отмена
                            </Button>
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item hidden={lastCodeSend == null || !numberLocked}>
                            <Button
                                disabled={!codeValid}
                                onClick={onSubmitCode}
                                type="primary"
                            >
                                Подтвердить
                            </Button>
                        </Form.Item>

                        <Form.Item>
                            <Button
                                disabled={!numberValid || cooldown > 0}
                                onClick={onSendCode}
                                type="default"
                            >
                                {"Отправить код" + (cooldown > 0 ? " заново (" + cooldown + ")" : "")}
                            </Button>
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </div>
    );
}

export { ConnectionForm };
