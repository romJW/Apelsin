import * as React from "react";
import { NotificationBar } from "../../molecules/notificationBar";

const ApelsinHeader = (): JSX.Element => {
    return (
        <div id="apelsin-app-header">
            <NotificationBar />
        </div>
    );
};

export { ApelsinHeader };