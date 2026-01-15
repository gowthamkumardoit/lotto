import { FieldValue } from "firebase-admin/firestore";
import { ActivityLogPayload } from "../types/activity";

export async function logAdminActivity({
    db,
    payload,
}: {
    db: FirebaseFirestore.Firestore;
    payload: ActivityLogPayload;
}) {
    const ref = db.collection("adminActivityLogs").doc();

    await ref.set({
        ...payload,
        createdAt: FieldValue.serverTimestamp(),
    });
}
