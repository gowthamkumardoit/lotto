import { FieldValue } from "firebase-admin/firestore";
import { NotificationPayload } from "../types/notification";

export async function sendAdminNotification({
  db,
  payload,
}: {
  db: FirebaseFirestore.Firestore;
  payload: NotificationPayload;
}) {
  const ref = db.collection("adminNotifications").doc();

  await ref.set({
    ...payload,
    createdAt: FieldValue.serverTimestamp(),
    read: false,
  });
}
