import { db } from "../../lib/firebaseAdmin";
import { sendUserNotification } from "../notifications/sendPush";
import { Query } from "firebase-admin/firestore";

/* ---------------- TARGET TYPES ---------------- */

type Target =
  | { type: "ALL" }
  | { type: "USER"; uid: string }
  | { type: "SEGMENT"; segment: string };

/* ---------------- DISPATCHER ---------------- */

export async function dispatchPushNotifications({
  title,
  message,
  target,
  payload,
}: {
  title: string;
  message: string;
  target: Target;
  payload: {
    screen: "home" | "wallet" | "profile" | "history" | "support";
    action: "admin_broadcast";
    id?: string;
  };
}) {
  try {
    // 🎯 SINGLE USER
    if (target.type === "USER") {
      await sendUserNotification(
        target.uid,
        title,
        message,
        payload
      );
      return;
    }

    // 🔍 QUERY USERS
    let q: Query = db.collection("users");

    if (target.type === "SEGMENT") {
      q = q.where("segment", "==", target.segment);
    }

    const snap = await q.get();

    // 🚀 FAN-OUT (SAFE)
    const promises = snap.docs.map((doc) =>
      sendUserNotification(
        doc.id,
        title,
        message,
        payload
      )
    );

    await Promise.allSettled(promises);
  } catch (err) {
    // ❗ Never throw — notifications must NEVER break flows
    console.error("dispatchPushNotifications failed", err);
  }
}
