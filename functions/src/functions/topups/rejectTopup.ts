import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../lib/firebaseAdmin";
import { sendUserNotification } from "../notifications/sendPush";


export const rejectTopup = onCall(
  {
    region: "asia-south1",
    timeoutSeconds: 30,
  },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }

    const { topupId, note } = data;

    if (!topupId || !note) {
      throw new HttpsError(
        "invalid-argument",
        "topupId and note are required"
      );
    }

    const topupRef = db.collection("topupRequests").doc(topupId);

    // ✅ capture for notification
    let rejectedUserId: string | null = null;

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(topupRef);

      if (!snap.exists) {
        throw new HttpsError("not-found", "Top-up request not found");
      }

      const topup = snap.data()!;

      // 🛑 Idempotency guard
      if (topup.status === "REJECTED") {
        rejectedUserId = topup.userId;
        return;
      }

      if (topup.status !== "SUBMITTED") {
        throw new HttpsError(
          "failed-precondition",
          `Cannot reject topup with status ${topup.status}`
        );
      }

      rejectedUserId = topup.userId;

      // ❌ No wallet mutation on reject
      tx.update(topupRef, {
        status: "REJECTED",
        rejectedAt: FieldValue.serverTimestamp(),
        rejectedBy: auth.uid,
        adminNote: note,
      });

      // 🧾 Audit log
      tx.set(db.collection("adminActivityLogs").doc(), {
        type: "TOPUP_REJECTED",
        topupId,
        userId: topup.userId,
        note,
        adminUid: auth.uid,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    // 🔔 Notify AFTER commit
    if (rejectedUserId) {
      await sendUserNotification(
        rejectedUserId,
        "Wallet Top-up Rejected",
        "Your wallet top-up request was rejected. Please contact support if needed.",
         {
          screen: "wallet",                // 🔗 Deep-link target
          action: "topUp_rejected",     // 🔔 Generic system broadcast
        }
      );
    }

    return { success: true };
  }
);
