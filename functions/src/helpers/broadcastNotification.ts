import { NotificationPayload } from "../types/notification";

export async function broadcastNotification({
    db,
    userIds,
    payload,
}: {
    db: FirebaseFirestore.Firestore;
    userIds: string[];
    payload: NotificationPayload;
}) {
    const batch = db.batch();

    userIds.forEach((userId) => {
        const ref = db
            .collection("users")
            .doc(userId)
            .collection("notifications")
            .doc();

        batch.set(ref, {
            ...payload,
            read: false,
            createdAt: new Date(),
        });
    });

    await batch.commit();
}
