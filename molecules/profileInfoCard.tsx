import * as React from 'react';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard, faStarOfLife } from '@fortawesome/free-solid-svg-icons';
import { Button, Divider, Input, Col, message, Modal, Row } from 'antd';
import { ChromePicker, Color, ColorResult } from 'react-color';

import { SpecialtyPicker } from '../organisms/pickers/specialtyPicker';
import { RequisitePicker } from '../organisms/pickers/requisitePicker';
import { TUser } from '../../types/user';
import { messageService } from '../../classes/messageService';
import { MaskedInput } from 'antd-mask-input';
import { useLocation } from 'react-router';
const { TextArea } = Input;

type TProps = {
    areAllFieldsEditable?: boolean;
    editing: boolean;
    isUserProfile: boolean;
    user?: TUser;
    setUser?: React.Dispatch<React.SetStateAction<TUser>>;
    setIsNumberValid?: React.Dispatch<React.SetStateAction<boolean>>;
    setNumberValue?: React.Dispatch<React.SetStateAction<string>>;
    phoneNumberValue?: string;
    isCustomer: boolean;
};

const ProfileInfoCard = ({
    areAllFieldsEditable,
    editing,
    isUserProfile,
    user,
    setUser,
    setNumberValue,
    phoneNumberValue,
    isCustomer,
}: TProps): JSX.Element => {
    const [specialtyPickerVisible, setSpecialtyPickerVisible] = useState(false);
    const [requisitePickerVisible, setRequisitePickerVisible] = useState(false);
    const [colorPickerVisible, setColorPickerVisible] = useState(false);
    const [colorPickerValue, setColorPickerValue] = useState<Color>(null);
    let location = useLocation();
    const phoneMask = /^[0-9]{10}$/;

    const isFieldEditable = (editing && isUserProfile) || (editing && areAllFieldsEditable);

    function handleColorPickerOk() {
        if (user === null || user.hex != (colorPickerValue as string)) {
            // setEditing(true);
            setUser({ ...user, hex: colorPickerValue as string });
        }
        setColorPickerVisible(false);
    }

    function handleColorPickerCancel() {
        setColorPickerVisible(false);
        setColorPickerValue(user.hex);
    }

    function handleColorPickerChange(color: ColorResult) {
        setColorPickerValue(color.hex);
    }
    
    return (
        <>
            {specialtyPickerVisible && (
                <SpecialtyPicker
                    currentUser={user}
                    setCurrentUser={setUser}
                    setIsModalOpen={setSpecialtyPickerVisible}
                    isModalOpen={specialtyPickerVisible}
                    editing={editing}
                />
            )}
            {requisitePickerVisible && (
                <RequisitePicker
                    currentUser={user}
                    setCurrentUser={setUser}
                    setIsModalOpen={setRequisitePickerVisible}
                    isModalOpen={requisitePickerVisible}
                    editing={isFieldEditable}
                />
            )}
            {colorPickerVisible && (
                <Modal
                    className="color-modal"
                    title="Выбор цвета"
                    open={colorPickerVisible}
                    onOk={handleColorPickerOk}
                    onCancel={handleColorPickerCancel}
                    cancelText="Отмена"
                >
                    <ChromePicker
                        color={colorPickerValue ?? '#ffffff'}
                        disableAlpha={true}
                        onChange={handleColorPickerChange}
                    />
                </Modal>
            )}
            <Divider>Основная информация</Divider>
                <Row className="outer-box main-info">
                    <Col>
                        <Col className="label-row">
                            <Row>
                                <p>Фамилия</p>
                            </Row>
                        </Col>
                        <Row className="value-row">
                            <Col>
                                {isFieldEditable ? (
                                    <TextArea
                                        autoSize={{ minRows: 2, maxRows: 5 }}
                                        value={user?.surname}
                                        onChange={(e) =>
                                            setUser({
                                                ...user,
                                                surname: e.target.value,
                                            })
                                        }
                                    />
                                ) : (
                                    <p>{user?.surname}</p>
                                )}
                            </Col>
                        </Row>
                    </Col>
                    <Col>
                        <Row className="label-row">
                            <Col>
                                <p>
                                    Имя{' '}
                                    {!user?.name && (
                                        <FontAwesomeIcon
                                            style={{ color: '#ff1919', fontSize: '10px' }}
                                            icon={faStarOfLife}
                                        />
                                    )}
                                </p>
                            </Col>
                        </Row>
                        <Row className="value-row">
                            <Col>
                                {isFieldEditable ? (
                                    <TextArea
                                        autoSize={{ minRows: 2, maxRows: 5 }}
                                        value={user?.name}
                                        onChange={(e) =>
                                            setUser({
                                                ...user,
                                                name: e.target.value,
                                            })
                                        }
                                    />
                                ) : (
                                    <p>{user?.name}</p>
                                )}
                            </Col>
                        </Row>
                    </Col>
                    <Col>
                        <Row className="label-row">
                            <Col>
                                <p>Отчество</p>
                            </Col>
                        </Row>
                        <Row className="value-row">
                            <Col>
                                {isFieldEditable ? (
                                    <TextArea
                                        autoSize={{ minRows: 2, maxRows: 5 }}
                                        value={user?.patronymic}
                                        onChange={(e) =>
                                            setUser({
                                                ...user,
                                                patronymic: e.target.value,
                                            })
                                        }
                                    />
                                ) : (
                                    <p>{user?.patronymic}</p>
                                )}
                            </Col>
                        </Row>
                    </Col>
                </Row>
            <Row hidden={isCustomer} className="main-info">
                <Col className="outer-box" style={{ width: '50%', maxWidth: '50%' }}>
                    <Row className="label-row">
                        <Col>
                            <p>
                                Профиль{' '}
                                {!user?.profile?.name && (
                                    <FontAwesomeIcon
                                        style={{ color: '#AC7D0C', fontSize: '10px' }}
                                        icon={faStarOfLife}
                                    />
                                )}
                            </p>
                        </Col>
                    </Row>
                    <Row
                        className="value-row"
                        onClick={() => {
                            if (editing) setSpecialtyPickerVisible(true);
                        }}
                    >
                        <Col>
                            {editing ? (
                                <a>{user?.profile?.name ?? 'Не выбран'}</a>
                            ) : (
                                <p>{user?.profile?.name ?? 'Не выбран'}</p>
                            )}
                        </Col>
                    </Row>
                </Col>
                <Col className="outer-box" style={{ width: '50%', maxWidth: '50%' }}>
                    <Row className="label-row">
                        <Col>
                            <p>
                                Телефон{' '}
                                {!user?.phone && (
                                    <FontAwesomeIcon
                                        style={{ color: '#ff1919', fontSize: '10px' }}
                                        icon={faStarOfLife}
                                    />
                                )}
                            </p>
                        </Col>
                    </Row>
                    <Row
                        className="value-row"
                        onClick={() => {
                            if (editing) return;
                            if (navigator.clipboard != null) {
                                messageService.sendError(
                                    'Невозможно копировать, включите доступ к буферу обмена'
                                );
                            } else {
                                navigator.clipboard?.writeText(user?.phone);
                                message.success('Номер скопирован');
                            }
                        }}
                    >
                        <Col>
                            {editing && isUserProfile ? (
                                <MaskedInput
                                    mask="(000)-000-00-00"
                                    onChange={(
                                        e: React.SyntheticEvent & {
                                            maskedValue: string;
                                            unmaskedValue: string;
                                        }
                                    ) => {
                                        const newValue = e.unmaskedValue;
                                        if (newValue && phoneMask.test(newValue)) {
                                        } else {
                                        }
                                        setNumberValue(newValue);
                                    }}
                                    placeholder="(___)-___-__-__"
                                    prefix="+7"
                                    value={phoneNumberValue}
                                />
                            ) : (
                                <p>{'+7' + user?.phone}</p>
                            )}
                        </Col>
                    </Row>
                </Col>
            </Row>
            <Row className="main-info">
                <Col hidden={isCustomer} className="outer-box">
                    <Row className="label-row">
                        <Col>
                            <p>
                                Должность{' '}
                                {!user?.profile && (
                                    <FontAwesomeIcon
                                        style={{ color: '#AC7D0C', fontSize: '10px' }}
                                        icon={faStarOfLife}
                                    />
                                )}
                            </p>
                        </Col>
                    </Row>
                    <Row className="value-row">
                        <Col>
                            {/* TODO: редактирование из выпадающего модалкой */}
                            <p>-</p>
                        </Col>
                    </Row>
                </Col>
                <Col hidden={isCustomer} className="outer-box">
                    <Row className="label-row">
                        <Col>
                            <p>
                                Группа{' '}
                                {!user?.profile && (
                                    <FontAwesomeIcon
                                        style={{ color: '#AC7D0C', fontSize: '10px' }}
                                        icon={faStarOfLife}
                                    />
                                )}
                            </p>
                        </Col>
                    </Row>
                    <Row className="value-row">
                        <Col>
                            <p>-</p>
                        </Col>
                    </Row>
                </Col>            
                <Col hidden={isCustomer} className="outer-box">
                    <Row className="label-row">
                        <Col>
                            <p>
                                График работы{' '}
                                {!user?.profile && (
                                    <FontAwesomeIcon
                                        style={{ color: '#AC7D0C', fontSize: '10px' }}
                                        icon={faStarOfLife}
                                    />
                                )}
                            </p>
                        </Col>
                    </Row>
                    <Row className="value-row">
                        <Col>
                            <p>5/2 9:00-18:00</p>
                        </Col>
                    </Row>
                </Col>
            </Row>
            {!location.pathname.includes('profile') && !isCustomer && (
                <>
                    <Divider>Заработок</Divider>

                    <Row className="income-info">
                        <Col className="outer-box">
                            <Row className="label-row">
                                <Col>
                                    <p>% с работы</p>
                                </Col>
                            </Row>
                            <Row className="value-row">
                                <Col>
                                    {editing && !areAllFieldsEditable ? (
                                        <Input
                                            type="number"
                                            min={0}
                                            max={100}
                                            step={1}
                                            value={user?.worker_profile?.percentage_work}
                                            suffix={<span>%</span>}
                                            onChange={(e) =>
                                                setUser({
                                                    ...user,
                                                    worker_profile: {
                                                        ...user.worker_profile,
                                                        percentage_work: Number.parseFloat(
                                                            e.target.value
                                                        ),
                                                    },
                                                })
                                            }
                                        />
                                    ) : (
                                        <p>
                                            {Math.floor(
                                                isNaN(user?.worker_profile?.percentage_work)
                                                    ? Math.random()
                                                    : user?.worker_profile?.percentage_work
                                            ) + '%'}
                                        </p>
                                    )}
                                </Col>
                            </Row>
                        </Col>
                        <Col className="outer-box">
                            <Row className="label-row">
                                <Col>
                                    <p>% с товара</p>
                                </Col>
                            </Row>
                            <Row className="value-row">
                                <Col>
                                    {editing && !areAllFieldsEditable ? (
                                        <Input
                                            type="number"
                                            min={0}
                                            max={100}
                                            step={1}
                                            value={user?.worker_profile?.percentage_product}
                                            suffix={<span>%</span>}
                                            onChange={(e) =>
                                                setUser({
                                                    ...user,
                                                    worker_profile: {
                                                        ...user.worker_profile,
                                                        percentage_product: Number.parseFloat(
                                                            e.target.value
                                                        ),
                                                    },
                                                })
                                            }
                                        />
                                    ) : (
                                        <p>
                                            {Math.floor(
                                                isNaN(user?.worker_profile?.percentage_product)
                                                    ? Math.random()
                                                    : user?.worker_profile?.percentage_product
                                            ) + '%'}
                                        </p>
                                    )}
                                </Col>
                            </Row>
                        </Col>
                        <Col className="outer-box">
                            <Row className="label-row">
                                <Col>
                                    <p>Ставка</p>
                                </Col>
                            </Row>
                            <Row className="value-row">
                                <Col>
                                    {editing && !areAllFieldsEditable ? (
                                        <Input
                                            type="number"
                                            min={0}
                                            max={5000}
                                            step={1}
                                            value={user?.worker_profile?.rate}
                                            onChange={(e) =>
                                                setUser({
                                                    ...user,
                                                    worker_profile: {
                                                        ...user.worker_profile,
                                                        rate: Number.parseFloat(e.target.value),
                                                    },
                                                })
                                            }
                                        />
                                    ) : (
                                        <p>
                                            {Math.floor(
                                                isNaN(user?.worker_profile?.rate)
                                                    ? Math.random() * 3000
                                                    : user?.worker_profile?.rate
                                            ) + 'р/день'}
                                        </p>
                                    )}
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </>
            )}

            {isCustomer && (
                <>
                    <Divider>Бонусы</Divider>
                    <Row justify="center">
                        <Col className="outer-box" span={12}>
                            <Row className="label-row">
                                <Col>
                                    <p>Скидка</p>
                                </Col>
                            </Row>
                            <Row className="value-row">
                                <Col span={12}>
                                    {editing && !areAllFieldsEditable ? (
                                        <Input
                                            type="number"
                                            min={0}
                                            max={100}
                                            step={1}
                                            value={user?.customer_profile?.discount}
                                            suffix={<span>%</span>}
                                            onChange={(e) =>
                                                setUser({
                                                    ...user,
                                                    customer_profile: {
                                                        ...user.customer_profile,
                                                        discount: Number.parseFloat(e.target.value),
                                                    },
                                                })
                                            }
                                        />
                                    ) : (
                                        <p>
                                            {Math.floor(
                                                isNaN(user?.customer_profile?.discount)
                                                    ? Math.random()
                                                    : user?.customer_profile?.discount
                                            ) + '%'}
                                        </p>
                                    )}
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </>
            )}
            <Divider>Прочее</Divider>
            <Row className="other-info">
            <Col className="outer-box">
                    <Row className="label-row">
                        <Col>
                            <p>Разрешение сотрудника</p>
                        </Col>
                    </Row>
                    <Row className="value-row">
                        <Col>
                            <p>Настроить</p>
                        </Col>
                    </Row>
                </Col>
                <Col className="outer-box">
                    <Row className="label-row">
                        <Col>
                            <p>Личный блокнот</p>
                        </Col>
                    </Row>
                    <Row className="value-row">
                        <Col>
                            <p>Настроить</p>
                        </Col>
                    </Row>
                </Col>
                <Col className="outer-box">
                    <Row className="label-row">
                        <Col>
                            <p>
                                Реквизиты{' '}
                                {!user?.profile && (
                                    <FontAwesomeIcon
                                        style={{ color: '#AC7D0C', fontSize: '10px' }}
                                        icon={faStarOfLife}
                                    />
                                )}
                            </p>
                        </Col>
                    </Row>
                    <Row className="value-row">
                        <Col>
                            <Button
                                icon={<FontAwesomeIcon icon={faCreditCard} />}
                                type="primary"
                                shape="circle"
                                onClick={() => setRequisitePickerVisible(true)}
                                disabled={areAllFieldsEditable}
                            />
                        </Col>
                    </Row>
                </Col>
            </Row>
            <Row className="other-info outer-box">
                <Col>
                    <Row className="label-row">
                        <Col>
                            <p>Страна/Валюта</p>
                        </Col>
                    </Row>
                    <Row
                        className="value-row"
                        onClick={() => {
                            if (editing) return;
                            if (navigator.clipboard != null) {
                                messageService.sendError(
                                    'Невозможно копировать, включите доступ к буферу обмена'
                                );
                            } else {
                                navigator.clipboard?.writeText(user?.country);
                                message.success('Страна скопирована');
                            }
                        }}
                    >
                        <Col>
                            {isFieldEditable ? (
                                <TextArea
                                    autoSize={{ minRows: 2, maxRows: 5 }}
                                    value={user?.country}
                                />
                            ) : (
                                <p>{user?.country ?? '-'}</p>
                            )}
                        </Col>
                    </Row>
                </Col>
                <Col>
                    <Row className="label-row">
                        <Col>
                            <p>Адрес</p>
                        </Col>
                    </Row>
                    <Row
                        className="value-row"
                        onClick={() => {
                            if (editing) return;
                            if (navigator.clipboard != null) {
                                messageService.sendError(
                                    'Невозможно копировать, включите доступ к буферу обмена'
                                );
                            } else {
                                navigator.clipboard?.writeText(user?.address);
                                message.success('Адрес скопирован');
                            }
                        }}
                    >
                        <Col>
                            {isFieldEditable ? (
                                <TextArea
                                    autoSize={{ minRows: 2, maxRows: 5 }}
                                    maxLength={255}
                                    value={user?.address}
                                    onChange={(e) =>
                                        setUser({
                                            ...user,
                                            address: e.target.value,
                                        })
                                    }
                                />
                            ) : (
                                <p>{user?.address ?? '-'}</p>
                            )}
                        </Col>
                    </Row>
                </Col>
                <Col>
                    <Row className="label-row">
                        <Col>
                            <p>Email</p>
                        </Col>
                    </Row>
                    <Row
                        className="value-row"
                        onClick={() => {
                            if (editing) return;
                            if (navigator.clipboard != null) {
                                messageService.sendError(
                                    'Невозможно копировать, включите доступ к буферу обмена'
                                );
                            } else {
                                navigator.clipboard?.writeText(user?.email);
                                message.success('Email скопирован');
                            }
                        }}
                    >
                        <Col>
                            {isFieldEditable ? (
                                <TextArea
                                    autoSize={{ minRows: 2, maxRows: 5 }}
                                    value={user?.email}
                                    onChange={(e) =>
                                        setUser({
                                            ...user,
                                            email: e.target.value,
                                        })
                                    }
                                />
                            ) : (
                                <p>{user?.email ?? '-'}</p>
                            )}
                        </Col>
                    </Row>
                </Col>
            </Row>
            <Row className="other-info">
            <Col className="outer-box">
                    <Row className="label-row">
                        <Col>
                            <p>Цвет</p>
                        </Col>
                    </Row>
                    <Row className="value-row">
                        <Col>
                            {isFieldEditable ? (
                                <div
                                    className="user-color"
                                    onClick={() => setColorPickerVisible(true)}
                                    style={{
                                        backgroundColor: user?.hex ?? 'white',
                                    }}
                                />
                            ) : (
                                <div
                                    className="user-color"
                                    style={{ backgroundColor: user?.hex }}
                                />
                            )}
                        </Col>
                    </Row>
                </Col>
                <Col className="outer-box">
                    <Row className="label-row">
                        <Col>
                            <p>Статус УЗ</p>
                        </Col>
                    </Row>
                    <Row className="value-row">
                        <Col>
                            <p>Оплачена до 19.04.1903</p>
                        </Col>
                    </Row>
                </Col>
                <Col className="outer-box">
                    <Row className="label-row">
                        <Col>
                            <p>Доступные клиенты</p>
                        </Col>
                    </Row>
                    <Row className="value-row">
                        <Col>
                            <p>-</p>
                        </Col>
                    </Row>
                </Col>
            </Row>
            <Row className="other-info outer-box">
                <Col className="">
                    <Row className="label-row">
                        <Col>
                            <p>
                                Услуги профиля{' '}
                                {!user?.profile && (
                                    <FontAwesomeIcon
                                        style={{ color: '#AC7D0C', fontSize: '10px' }}
                                        icon={faStarOfLife}
                                    />
                                )}
                            </p>
                        </Col>
                    </Row>
                    <Row className="value-row">
                        <Col>
                            <p>{Math.floor(Math.random() * 100)}</p>
                        </Col>
                    </Row>
                </Col>
                <Col className="">
                    <Row className="label-row">
                        <Col>
                            <p>Товары профиля</p>
                        </Col>
                    </Row>
                    <Row className="value-row">
                        <Col>
                            <p>{Math.floor(Math.random() * 100)}</p>
                        </Col>
                    </Row>
                </Col>
                <Col className="">
                    <Row className="label-row">
                        <Col>
                            <p>Доступные сотрудники</p>
                        </Col>
                    </Row>
                    <Row className="value-row">
                        <Col>
                            <p>{Math.floor(Math.random() * 100)}</p>
                        </Col>
                    </Row>
                </Col>
            </Row>
            <Row className="user-comment outer-box">
                <Col>
                    <Row className="label-row">
                        <Col>
                            <p>Комментарий</p>
                        </Col>
                    </Row>
                    <Row className="value-row">
                        <Col>
                            <p>Работяга</p>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </>
    );
};

export { ProfileInfoCard };
