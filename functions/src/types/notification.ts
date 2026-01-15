export type NotificationType =
    | "info"
    | "success"
    | "warning"
    | "error";

export interface NotificationPayload {
    title: string;
    message: string;
    type: NotificationType;
    actionUrl?: string;
}
