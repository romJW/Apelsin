import { Card as AntdCard, Typography, Row, Col, Avatar } from "antd";
import { Common } from "@classes/commonMethods";
import { TInvitation } from "types/invitation";
import { GlobalConstants } from "@constants/global";

const { Text } = Typography;

type TProps = {
    invitation: TInvitation,
};

const InvitationCard = ({ invitation }: TProps): JSX.Element => {
    return (
        <AntdCard
            size={'small'}
            title={
                (
                    <>
                        <Row justify={"space-between"}>
                            <Text style={{width: '50%', textAlign: 'left'}} ellipsis={true}
                                    className="invite-card-subtitle">
                                {
                                    `Создано: ${Common.formatDate(
                                        invitation?.created_at
                                    )}`
                                }
                            </Text>
                            <Text style={{width: '50%', textAlign: 'right'}} ellipsis={true}
                                    className="invite-card-subtitle">
                                Обновлено: {' '}
                                {Common.formatDate(
                                    invitation?.updated_at
                                )}
                            </Text>
                        </Row>
                    </>
                )
            }
        >
            <Row justify={"space-between"}>
                <Col span={10}>
                    <Avatar
                        className={"avatar"}
                        src={`${GlobalConstants.BaseUrlForImg}${invitation.avatar_send_user}`}
                        style={{marginBottom: "10px"}}
                    />
                    <Text style={{textAlign: "center"}} ellipsis={true}>{invitation.fio_send_user}</Text>
                    <Text style={{textAlign: "center"}}>{invitation.phone_send_user}</Text>
                </Col>
                <Col>
                    {">"}
                </Col>
                <Col span={10}>
                    <Avatar
                        className={"avatar"}
                        src={`${GlobalConstants.BaseUrlForImg}${invitation.avatar_receive_user}`}
                        style={{marginBottom: "10px"}}
                    />
                    <Text style={{textAlign: "center"}} ellipsis={true}>{invitation.fio_receive_user}</Text>
                    <Text style={{textAlign: "center"}}>{invitation.phone_receive_user}</Text>
                </Col>
            </Row>
        </AntdCard>
    );
};

export { InvitationCard };
