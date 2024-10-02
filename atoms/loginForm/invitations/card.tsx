import * as React from "react";
import {Common} from "@classes/commonMethods";
import {Card as AntdCard, Col, Row, Button} from 'antd';
import {InvitationStatuses} from "@enums/invitationStatuses";
import {TInvitation} from "types/invitation";
import {CRMAPIManager} from "@classes/crmApiManager";
import {messageService} from "@classes/messageService";

type TProps = {
    status: InvitationStatuses,
    invitation: TInvitation,
    setIsTabClicked: React.Dispatch<React.SetStateAction<boolean>>,
    onAcceptOrRejectInvite?: () => Promise<void>;
}

const InvitationCardInLoginForm = ({status, invitation, setIsTabClicked, onAcceptOrRejectInvite}: TProps): JSX.Element => {
    async function handleAcceptInviteButtonClick(
    ): Promise<void> {
        try {
            const accept = await CRMAPIManager.request<any>(async (api) => {
                return await api.updateInvite(
                    invitation.crm_id,
                    invitation.id,
                    2,
                );
            });
            if (accept.errorMessages) throw accept.errorMessages;
            messageService.sendSuccess('Приглашение принято!');
            setIsTabClicked(false);
            onAcceptOrRejectInvite();
        } catch (err) {
            messageService.sendErrorList(err);
        }
    }

    async function handleRejectInviteButtonClick(): Promise<void> {
        try {
            const accept = await CRMAPIManager.request<any>(async (api) => {
                return await api.updateInvite(
                    invitation.crm_id,
                    invitation.id,
                    1,
                );
            });
            if (accept.errorMessages) throw accept.errorMessages;
            messageService.sendSuccess('Приглашение отклонено!');
            setIsTabClicked(false);
            await onAcceptOrRejectInvite();
        } catch (err) {
            messageService.sendErrorList(err);
        }
    }

    function renderBlockForUserInvites(
        status: InvitationStatuses,
    ): JSX.Element {
        return status === InvitationStatuses.pending ? (
            <Row className="invitation-buttons">
                <Col>
                    <Button
                        className="round-button"
                        onClick={() =>
                            handleAcceptInviteButtonClick()
                        }
                        type="primary"
                    >
                        Принять
                    </Button>
                </Col>
                <Col>
                    <Button
                        className="round-button"
                        onClick={() =>
                            handleRejectInviteButtonClick()
                        }
                        type="default"
                    >
                        Отклонить
                    </Button>
                </Col>
            </Row>
        ) : (
            <p>
                Обновлено:{' '}
                {Common.formatDate(
                    invitation?.updated_at
                )}
            </p>
        );
    }

    return (
        <>
            <Row>
                <Col>
                    <AntdCard
                        title={
                            (
                                <>
                                    <p className="invite-card-title">
                                        {
                                            invitation?.crm_name
                                        }
                                    </p>
                                    <p className="invite-card-subtitle">
                                        Владелец:{' '}
                                        {
                                            invitation?.crm_owner_info
                                        }
                                    </p>
                                </>
                            )
                        }
                    >
                        <p>
                            От:{' '}
                            {
                                invitation
                                    ?.fio_send_user
                            }
                        </p>

                        <p>
                            Кому:{' '}
                            {
                                invitation
                                    ?.fio_receive_user
                            }
                        </p>

                        <p>
                            Телефон:{' '}
                            {
                                invitation
                                    ?.phone_receive_user
                            }
                        </p>
                        <p>
                            Создано:{' '}
                            {Common.formatDate(
                                invitation
                                    ?.created_at
                            )}
                        </p>
                        {renderBlockForUserInvites(status)}
                    </AntdCard>
                </Col>
            </Row>

        </>
    );
};

export { InvitationCardInLoginForm };
