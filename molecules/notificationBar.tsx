import * as React from "react";
import { Subscription } from "rxjs";
import { messageService } from "../../classes/messageService";
import { TNotification } from "../../types/notification"
import {message as m} from "antd";
import {Notification} from "@atoms/notification";
import {GlobalConstants} from "@constants/global";

type State = {
    items: Array<TNotification>;
}

class NotificationBar extends React.Component<{}, State> {
    subscription: Subscription;
    constructor(props) {
        super(props);

        this.state = {
            items: new Array<TNotification>()
        }
    }

    componentDidMount() {
        this.subscription = messageService.getMessage().subscribe(
            (value: TNotification | null) => {
                if (value == null) {
                    this.setState({ items: new Array<TNotification>() });
                }
                else {
                    this.setState({
                        items: this.state.items.concat(value)
                    })
                }
        });
    }

    componentWillUnmount() {
        this.subscription.unsubscribe();
    }

    delMessage(id: number) {
        this.setState((prevState: State) => ({
            items: prevState.items.filter((_, index) => index != id)
        }));
    }

    render() {
        const { items } = this.state;
        if (items.length == 0) return (null);
        const duration = GlobalConstants.notificationDuration;

        items.map(
            (message, index) => {
                m.open({
                    type: message.type,
                    content: (
                        <>
                            <Notification duration={duration} message={message.text} type={message.type} />
                        </>
                    ),
                    duration: duration,
                    key: index,
                    onClick: () => {
                        m.destroy(index);
                    },
                    onClose: () => {
                        this.delMessage(index);
                    }
                })
            }
        );
    }
}

export { NotificationBar };