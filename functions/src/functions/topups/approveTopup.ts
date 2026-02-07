import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../lib/firebaseAdmin";
import { sendUserNotification } from "../notifications/sendPush";

export const approveTopup = onCall(
  { region: "asia-south1", timeoutSeconds: 30 },
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

    // values used after transaction (notification)
    let creditedUserId: string | null = null;
    let creditedAmount: number | null = null;

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(topupRef);

      if (!snap.exists) {
        throw new HttpsError("not-found", "Top-up request not found");
      }

      const topup = snap.data()!;

      // 🛑 Idempotency guard
      if (topup.status === "APPROVED") {
        creditedUserId = topup.userId;
        creditedAmount = topup.amount;
        return;
      }

      if (topup.status !== "SUBMITTED") {
        throw new HttpsError(
          "failed-precondition",
          `Cannot approve topup with status ${topup.status}`
        );
      }

      creditedUserId = topup.userId;
      creditedAmount = topup.amount;

      const userRef = db.collection("users").doc(topup.userId);

      // 💰 UPDATE USER BALANCE (CRITICAL FIX)
      tx.update(userRef, {
        walletBalance: FieldValue.increment(topup.amount),
      });

      // 🧾 LEDGER ENTRY (AUDIT LOG)
      tx.set(db.collection("walletTxns").doc(), {
        userId: topup.userId,
        amount: topup.amount,
        type: "CREDIT",
        reason: "Wallet Top-up",
        referenceId: topupId,
        createdAt: FieldValue.serverTimestamp(),
      });

      // ✅ UPDATE TOP-UP REQUEST
      tx.update(topupRef, {
        status: "APPROVED",
        approvedAt: FieldValue.serverTimestamp(),
        approvedBy: auth.uid,
        adminNote: note,
      });
    });

    // 🔔 Notify AFTER transaction commit
    if (creditedUserId && creditedAmount !== null) {
      await sendUserNotification(
        creditedUserId,
        "Wallet Top-up Approved",
        `₹${creditedAmount} has been added to your wallet.`,
        {
          screen: "wallet",                // 🔗 Deep-link target
          action: "topUp_approved",     // 🔔 Generic system broadcast
        }
      );
    }

    return { success: true };
  }
);
