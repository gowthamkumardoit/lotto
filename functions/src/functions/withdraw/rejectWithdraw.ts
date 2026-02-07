import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../lib/firebaseAdmin";
import { sendUserNotification } from "../notifications/sendPush";

export const rejectWithdraw = onCall(
  {
    region: "asia-south1",
    timeoutSeconds: 30,
  },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }

    const { withdrawId, note } = data;

    if (!withdrawId || !note) {
      throw new HttpsError(
        "invalid-argument",
        "withdrawId and note are required"
      );
    }

    const withdrawRef = db.collection("withdrawalRequests").doc(withdrawId);

    let rejectedUserId: string | null = null;
    let unlockedAmount: number | null = null;

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(withdrawRef);

      if (!snap.exists) {
        throw new HttpsError("not-found", "Withdraw request not found");
      }

      const withdraw = snap.data()!;

      // 🛑 Idempotency guard
      if (withdraw.status === "REJECTED") {
        return;
      }

      if (withdraw.status !== "SUBMITTED") {
        throw new HttpsError(
          "failed-precondition",
          `Cannot reject withdraw with status ${withdraw.status}`
        );
      }

      const userRef = db.collection("users").doc(withdraw.userId);
      const userSnap = await tx.get(userRef);

      if (!userSnap.exists) {
        throw new HttpsError("not-found", "User not found");
      }

      const user = userSnap.data()!;
      const lockedBalance = user.lockedBalance ?? 0;

      // 🔒 CRITICAL SAFETY CHECK
      if (lockedBalance < withdraw.amount) {
        throw new HttpsError(
          "failed-precondition",
          "Locked balance insufficient to reject withdrawal"
        );
      }

      rejectedUserId = withdraw.userId;
      unlockedAmount = withdraw.amount;

      // 🔓 UNLOCK FUNDS
      tx.update(userRef, {
        lockedBalance: FieldValue.increment(-withdraw.amount),
      });

      // 🧾 LEDGER ENTRY (UNLOCK)
      tx.set(db.collection("walletTxns").doc(), {
        userId: withdraw.userId,
        amount: 0,
        type: "UNLOCK",
        reason: "Withdrawal Rejected",
        referenceId: withdrawId,
        createdAt: FieldValue.serverTimestamp(),
      });

      // ❌ MARK AS REJECTED
      tx.update(withdrawRef, {
        status: "REJECTED",
        rejectedAt: FieldValue.serverTimestamp(),
        rejectedBy: auth.uid,
        adminNote: note,
      });

      // 🧾 ADMIN AUDIT
      tx.set(db.collection("adminActivityLogs").doc(), {
        type: "WITHDRAW_REJECTED",
        withdrawId,
        userId: withdraw.userId,
        note,
        adminUid: auth.uid,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    // 🔔 Notify AFTER commit
    if (rejectedUserId && unlockedAmount !== null) {
      await sendUserNotification(
        rejectedUserId,
        "Withdrawal Rejected",
        `Your withdrawal of ₹${unlockedAmount} was rejected and the funds have been returned to your wallet.`,
        {
          screen: "wallet",                // 🔗 Deep-link target
          action: "withdraw_rejected",     // 🔔 Generic system broadcast
        }

      );
    }

    return { success: true };
  }
);

