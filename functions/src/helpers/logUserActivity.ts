import { FieldValue } from "firebase-admin/firestore";
import { ActivityLogPayload } from "../types/activity";

export async function logUserActivity({
    db,
    userId,
    payload,
}: {
    db: FirebaseFirestore.Firestore;
    userId: string;
    payload: ActivityLogPayload;
}) {
    const ref = db
        .collection("users")
        .doc(userId)
        .collection("activityLogs")
        .doc();

    await ref.set({
        ...payload,
        createdAt: FieldValue.serverTimestamp(),
    });
}
