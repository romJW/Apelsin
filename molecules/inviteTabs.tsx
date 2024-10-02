import {useEffect, useState} from 'react';
import {Empty, Pagination, Space, Tabs} from 'antd';
import {InvitationStatuses} from '@enums/invitationStatuses';
import {TInvitation} from 'types/invitation';
import {InvitationCardInLoginForm} from "@atoms/loginForm/invitations/card";
import {InvitationCard} from "@atoms/invitations/card";

type TProps = {
    onAcceptOrRejectInvite?: () => Promise<void>;
    areCRMInvites?: boolean;
    invitationList: Array<TInvitation>;
};

const InviteTabs = ({onAcceptOrRejectInvite, invitationList, areCRMInvites}: TProps): JSX.Element => {
    const [activeTabKey, setActiveTabKey] = useState(getFirstNotEmptyTab());
    const [isTabClicked, setIsTabClicked] = useState(false);
    const [selectedInvitationIndex, setSelectedInvitationIndex] = useState<number>(0);

    function handleInvitationSelection(pageNumber: number) {
        setSelectedInvitationIndex(pageNumber - 1);
    }

    function getFirstNotEmptyTab() {
        if (filterInvitationListByStatus(invitationList, InvitationStatuses.pending).length) return '1';
        if (filterInvitationListByStatus(invitationList, InvitationStatuses.declined).length) return '2';
        if (filterInvitationListByStatus(invitationList, InvitationStatuses.accepted).length) return '3';
        return undefined;
    }

    function handleTabClick(key) {
        setIsTabClicked(true);
        setActiveTabKey(key);
    }

    useEffect(() => {
        if (!isTabClicked) {
            setActiveTabKey(getFirstNotEmptyTab());
        }
    });

    function filterInvitationList(
        invitationList: Array<TInvitation>,
        idStatus: number
    ): Array<TInvitation> {
        return invitationList.filter((el) => el.invitation_status_id === idStatus);
    }

    function filterInvitationListByStatus(
        invitationList: Array<TInvitation>,
        status: InvitationStatuses
    ): Array<TInvitation> {
        switch (status) {
            case InvitationStatuses.pending:
                return filterInvitationList(invitationList, 1);
            case InvitationStatuses.declined:
                return filterInvitationList(invitationList, 2);
            case InvitationStatuses.accepted:
                return filterInvitationList(invitationList, 3);
            default:
                return invitationList;
        }
    }

    function renderInvitations(status: InvitationStatuses, invitations: Array<TInvitation>) {
        const filteredInvitations = filterInvitationListByStatus(invitations, status);

        return areCRMInvites
            ? (<>
                <Space direction={"vertical"} size={"middle"}>
                    {filteredInvitations.map((invitation: TInvitation) => {
                        return (
                            <InvitationCard key={invitation.id} invitation={invitation}/>
                        );
                    })}
                </Space>
            </>)
            : (<>
                <InvitationCardInLoginForm
                    status={status}
                    onAcceptOrRejectInvite={onAcceptOrRejectInvite}
                    setIsTabClicked={setIsTabClicked}
                    invitation={filteredInvitations[selectedInvitationIndex]}
                />
                <Pagination
                    onChange={(page) => handleInvitationSelection(page)}
                    simple
                    total={filteredInvitations.length}
                    defaultPageSize={1}
                    current={selectedInvitationIndex + 1}
                />
            </>);
    }

    return invitationList.length > 0 ? (
        <Tabs
            activeKey={activeTabKey}
            onChange={handleTabClick}
            items={[
                {
                    label: 'Необработанные',
                    key: '1',
                    children: renderInvitations(InvitationStatuses.pending, invitationList),
                    disabled:
                        filterInvitationListByStatus(invitationList, InvitationStatuses.pending)
                            .length === 0,
                },
                {
                    label: 'Отклоненные',
                    key: '2',
                    children: renderInvitations(InvitationStatuses.declined, invitationList),
                    disabled:
                        filterInvitationListByStatus(invitationList, InvitationStatuses.declined)
                            .length === 0,
                },
                {
                    label: 'Принятые',
                    key: '3',
                    children: renderInvitations(InvitationStatuses.accepted, invitationList),
                    disabled:
                        filterInvitationListByStatus(invitationList, InvitationStatuses.accepted)
                            .length === 0,
                },
            ]}
        />
    ) : (
        <Empty/>
    );
};

export { InviteTabs };
