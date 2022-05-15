import { app, Notification } from "electron";
import path from "path";

export function createNotification(
    title,
    description,
    show?: boolean
): Notification {
    const notification = new Notification({
        title: title,
        body: description,
        icon: path.join(app.getAppPath(), "assets/logo.png")
    });

    if (show) notification.show();

    return notification;
}
