import React from 'react';
import { List } from 'antd';
import { InvitationStatuses } from '@enums/invitationStatuses';
import { TUser } from 'types/user';
import { useNavigate } from 'react-router-dom';
import { SettingsManager } from '@classes/settingsManager';
import { UserCard } from '@atoms/listsCard/userCard';
import { LastIdStore } from '@pages/lastIdStore';

type TProps = {
    inviteStatus: InvitationStatuses;
    userList: Array<TUser>;
    selecting: boolean;
    selectList: Array<{ id: number; name: string }>;
    setSelectList: React.Dispatch<React.SetStateAction<Array<{ id: number; name: string }>>>;
    isWorker: boolean;
    col: number
};

function filterUserListByInviteStatus(
    userList: TUser[],
    inviteStatus: InvitationStatuses,
    isWorker: boolean,
): TUser[] {
    if (isWorker) {
        switch (inviteStatus) {
            case InvitationStatuses.accepted:
                return userList.filter(
                    (user) =>
                        (user?.worker_profile && user.invitation_status_text === '') ||
                        (user.invitation_status_text === 'Принято' && user?.worker_profile)
                );
            case InvitationStatuses.declined:
                return userList.filter(
                    (user) => !user?.worker_profile && user.invitation_status_text === 'Отклонено'
                );
            case InvitationStatuses.pending:
                return userList.filter(
                    (user) => !user?.worker_profile && user.invitation_status_text === 'Не обработано'
                );
            default:
                return [];
        }
    } else {
        switch (inviteStatus) {
            case InvitationStatuses.accepted:
                return userList.filter(
                    (user) =>
                    user?.customer_profile

                );
            // case InvitationStatuses.declined:
            //     return userList.filter((user) => user?.customer_profile != null && user.invitation_status_text === 'Отклонено');
            case InvitationStatuses.pending:
                return userList.filter((user) => !user?.customer_profile && user.invitation_status_text === 'Не обработано');
            default:
                return [];
        }
    }
}

function RenderUserList({
    inviteStatus,
    userList,
    selecting,
    selectList,
    setSelectList,
    col,
    isWorker,
} :TProps): JSX.Element {
    const navigate = useNavigate();
    const creds = SettingsManager.getConnectionCredentials();
    const filteredByInviteStatusUserList = filterUserListByInviteStatus(
        userList,
        inviteStatus,
        isWorker,
    );

    function openCard(id: number) {
        LastIdStore.setLastUserId(id);
        isWorker
            ? navigate(`/lk/worker/crm/${creds.crmID}/workers/${id}`)
            : navigate(`/lk/worker/crm/${creds?.crmID}/customers/${id}`)
    }

    function handleUserClick(userId: number, userFirstName: string, userLastName: string) {
        if (selecting) {
            !selectList.find((sli) => sli.id == userId)
                ? setSelectList((oldList) => [
                    ...oldList,
                    {
                        id: userId,
                        name: userFirstName + ' ' + userLastName,
                    },
                ])
                : setSelectList((oldList) => oldList.filter((sli) => sli.id != userId));
        } else {
            openCard(userId);
        }
    }

    return (
        <List
            className="worker-card-list"
            dataSource={filteredByInviteStatusUserList}
            itemLayout="horizontal"
            grid={{ column: col }}
            renderItem={(item) => (
                <List.Item>
                    <UserCard user={item} handleUserClick={handleUserClick} selectList={selectList} selecting={selecting} />
                </List.Item>
            )}
        />
    );
}

export { RenderUserList };
