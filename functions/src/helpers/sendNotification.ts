import { FieldValue } from "firebase-admin/firestore";
import { NotificationPayload } from "../types/notification";

export async function sendNotification({
    db,
    userId,
    payload,
}: {
    db: FirebaseFirestore.Firestore;
    userId: string;
    payload: NotificationPayload;
}) {
    const ref = db
        .collection("users")
        .doc(userId)
        .collection("notifications")
        .doc();

    await ref.set({
        ...payload,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
    });
}
