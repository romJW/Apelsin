import React, {useEffect, useState} from 'react';
import {Empty, Pagination, Space, Tabs} from 'antd';
import {InvitationStatuses} from '@enums/invitationStatuses';
import {TInvitation} from 'types/invitation';
import {InvitationCard} from "@atoms/invitations/card";
import {SettingsManager} from "@classes/settingsManager";
import {CRMAPIManager} from "@classes/crmApiManager";
import {InvitationListResp} from "@api/responseModels/invitation/invitationListResponse";
import {messageService} from "@classes/messageService";
import {store as pStore} from "@molecules/paginationControls/pageSizeStore";
import {TMetadata} from "types/metadata";

type TProps = {
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

const InviteTabs = ({setIsLoading}: TProps): JSX.Element => {
    const [activeTabKey, setActiveTabKey] = useState<string>();
    const [invitationList, setInvitationList] = useState<Array<TInvitation>>();
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [currentMeta, setCurrentMeta] = useState<TMetadata>(null);


    async function loadInvitations(page: number = currentPage, status: string) {
        setIsLoading(true);
        const creds = SettingsManager.getConnectionCredentials();
        try {
                const invitationListResponse = await CRMAPIManager.request<InvitationListResp>(async (api) => {
                    return await api.getInvitationList({
                        crm_id: creds.crmID,
                        page: page,
                        per_page: pStore.pS,
                        filters: {
                            invitation_status: status
                        }
                    });
                });
                if (invitationListResponse.errorMessages) throw invitationListResponse.errorMessages;
                setInvitationList([...invitationListResponse.data.data]);
                setCurrentMeta({...invitationListResponse.data.meta})
        } catch (errors) {
            messageService.sendErrorList(errors);
        }
        setIsLoading(false);
    }
    async function handleChangePage(newPage: number) {
        setCurrentPage(newPage);
        await loadInvitations(newPage, activeTabKey);
    }

    async function handleTabClick(key) {
        setActiveTabKey(key);
        setCurrentPage(1);
        await loadInvitations(1, key);
    }

    useEffect(() => {
        loadInvitations(currentPage, activeTabKey);

    }, []);

    useEffect(() => {
        if (currentMeta?.total) {
            loadInvitations(currentMeta?.from / pStore.pS, activeTabKey);
        }
    }, [pStore.pS]);

    function renderInvitations() {

        return invitationList?.length ? (<>
                <Space direction={"vertical"} size={"middle"}>
                    {invitationList.map((invitation: TInvitation) => {
                        return (
                            <InvitationCard key={invitation.id} invitation={invitation}/>
                        );
                    })}
                </Space>
                <Pagination
                    current={currentPage}
                    defaultCurrent={1}
                    onChange={handleChangePage}
                    pageSize={pStore.pS}
                    showSizeChanger={false}
                    total={currentMeta?.total ?? 1}
                />
            </>)
            : (<Empty/>);
    }

    return (
        <Tabs
            activeKey={activeTabKey}
            onChange={handleTabClick}
            items={[
                {
                    label: 'Принятые',
                    key: InvitationStatuses.accepted.toString(),
                    children: renderInvitations(),
                },
                {
                    label: 'Отклоненные',
                    key: InvitationStatuses.declined.toString(),
                    children: renderInvitations(),
                },
                {
                    label: 'Необработанные',
                    key: InvitationStatuses.pending.toString(),
                    children: renderInvitations(),
                },
            ]}
        />
    );
};

export { InviteTabs };