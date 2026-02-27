import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../lib/firebaseAdmin";
import { sendUserNotification } from "../notifications/sendPush";

export const rejectBankAccount = onCall(
  { region: "asia-south1", timeoutSeconds: 30 },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }

    // 🔐 Admin check (adjust if you use custom claims differently)
    if (auth.token.role !== "admin") {
      throw new HttpsError("permission-denied", "Admin access required");
    }

    const { userId, bankAccountId, note } = data;

    if (!userId || !bankAccountId || !note) {
      throw new HttpsError(
        "invalid-argument",
        "userId, bankAccountId and rejection note are required"
      );
    }

    const accountRef = db
      .collection("users")
      .doc(userId)
      .collection("bankAccounts")
      .doc(bankAccountId);

    let rejected = false;

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(accountRef);

      if (!snap.exists) {
        throw new HttpsError("not-found", "Bank account not found");
      }

      const account = snap.data()!;

      // 🛑 Idempotent guard
      if (account.status === "REJECTED") {
        return;
      }

      // 🚫 Cannot reject already approved account
      if (account.status === "APPROVED") {
        throw new HttpsError(
          "failed-precondition",
          "Cannot reject an approved bank account"
        );
      }

      if (account.status !== "PENDING") {
        throw new HttpsError(
          "failed-precondition",
          `Cannot reject account with status ${account.status}`
        );
      }

      tx.update(accountRef, {
        status: "REJECTED",
        rejectedAt: FieldValue.serverTimestamp(),
        rejectedBy: auth.uid,
        adminNote: note,
        isPrimary: false, // safety
      });

      rejected = true;
    });

    // 🔔 Notify AFTER successful commit
    if (rejected) {
      await sendUserNotification(
        userId,
        "Bank Account Rejected",
        `Your bank account was rejected.\nReason: ${note}`,
        {
          screen: "profile",
          action: "bank_rejected",
        }
      );
    }

    return { success: true };
  }
);