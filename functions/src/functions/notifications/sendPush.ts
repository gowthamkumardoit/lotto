import { getMessaging } from "firebase-admin/messaging";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

type NotificationPayload = {
  screen: "home" | "wallet" | "profile" | "history" | "support";
  action:
    | "kyc_approved"
    | "kyc_rejected"
    | "withdraw_approved"
    | "withdraw_rejected"
    | "topUp_approved"
    | "topUp_rejected"
    | "upi_approved"
    | "upi_rejected"
    | "ticket_won"
    | "support_reply"
    | "admin_broadcast"
    | "digit_draw_win"
    | "signup_bonus"
    | "bank_pending"
    | "bank_approved"
    | "bank_rejected";
  id?: string; // ticketId | withdrawId | etc
};

export async function sendUserNotification(
  uid: string,
  title: string,
  body: string,
  payload: NotificationPayload,
) {
  try {
    const snap = await db.collection("users").doc(uid).get();
    if (!snap.exists) return;

    const token = snap.data()?.fcmToken;
    if (!token) return;

    await getMessaging().send({
      token,

      // 🔔 Notification (what user sees)
      notification: {
        title,
        body,
      },

      // 📦 DATA (used for deep linking)
      data: {
        screen: payload.screen,
        action: payload.action,
        ...(payload.id ? { id: payload.id } : {}),
      },

      // 🤖 ANDROID
      android: {
        priority: "high",
        notification: {
          channelId: "high_importance_channel",
          sound: "default",
          visibility: "public",
        },
      },

      // 🍎 iOS
      apns: {
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    });
  } catch (err) {
    // ❗ NEVER break money / core flows
    console.error("Failed to send notification", err);
  }
}
