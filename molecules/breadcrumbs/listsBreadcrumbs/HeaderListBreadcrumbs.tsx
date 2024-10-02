import React from 'react';
import { Row, Col, Breadcrumb, Input, Space } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faHouse, faRubleSign } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { SettingsManager } from '@classes/settingsManager';

const { Search } = Input;

type TProps = {
    dataTotal: number,
    dataIcon: IconProp,
    dataTitle: string,
    dataPrice: number | null,
    categoryPath: Array<{ id: number; name: string }> | null
    title: string,
    children: JSX.Element | null,
    flag: boolean,
    isProduct: boolean,
    openCategoryCard: (id: number | null, back: boolean) => void | null,
    searchPlaceHolder: string
    onSearch?: (e: React.ChangeEvent) => void;
}

function HeaderListBreadcrumbs({
    dataTotal,
    dataIcon,
    dataTitle,
    dataPrice,
    title,
    flag,
    isProduct=false,
    categoryPath = null,
    openCategoryCard = null,
    onSearch,
    searchPlaceHolder,
    children
}: TProps): JSX.Element {
    const navigate = useNavigate();
    const creds = SettingsManager.getConnectionCredentials();

    return (
        <>
            <Row className="breadcrumb-header">
                <Col className="header-location">
                    <span>{title}</span>
                    {!isProduct && (
                        <span className="header-location__quantity">
                        {dataTotal != null ? ` (${dataTotal}) ` : ''}
                        </span>
                    )}
                    {isProduct && (
                        <>
                        <span className="header-location__quantity">
                            {dataTotal != null && ` (${dataTotal}) `}
                        </span>
                        <span>{dataTotal > 0 && 'на'}</span>
                        <span className="header-location__price">
                            {dataTotal > 0 && ` ${Math.floor(dataPrice)} `}
                        </span>
                        <span>
                            {dataTotal > 0 && (
                                <FontAwesomeIcon
                                    className="header-location__currency"
                                    icon={faRubleSign}
                                />
                            )}
                        </span>
                        </>
                    )}
                </Col>
                <Col className="header-search">
                    <Search
                        allowClear
                        className="header-search-input"
                        onSearch={async (value) => {
                            if (value == null || value == '') return;
                            // TODO: search prop function
                        }}
                        onChange={onSearch}
                        placeholder={searchPlaceHolder}
                    />
                </Col>
            </Row>
            <Row className="breadcrumbs-controls">
                <Col className="breadcrumbs">
                    <Breadcrumb>
                        <Breadcrumb.Item
                            onClick={() =>
                                navigate(`/lk/worker/crm/${creds?.crmID}`)
                            }
                        >
                            <FontAwesomeIcon icon={faHouse} />
                        </Breadcrumb.Item>
                        {!flag && (
                            <Breadcrumb.Item>
                                <FontAwesomeIcon icon={dataIcon} />
                                <span className="crumb-name">{dataTitle}</span>
                            </Breadcrumb.Item>
                        )}
                        {flag && (
                            <>
                                <Breadcrumb.Item
                                    onClick={async () => await openCategoryCard(null, true)}
                                >
                                    <FontAwesomeIcon icon={dataIcon} />
                                    <span className="crumb-name">{dataTitle}</span>
                                </Breadcrumb.Item>
                                {categoryPath.map(({ id, name }) => (
                                    <Breadcrumb.Item
                                        key={id}
                                        onClick={async () => await openCategoryCard(id, true)}
                                    >
                                        <span className="crumb-name">{name}</span>
                                    </Breadcrumb.Item>
                                ))}
                            </>
                        )}
                    </Breadcrumb>
                </Col>
                <Col>
                    <Space>
                        {children}
                    </Space>
                </Col>
            </Row>
        </>
    );
}

export { HeaderListBreadcrumbs };
