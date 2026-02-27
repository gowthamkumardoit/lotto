import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../lib/firebaseAdmin";
import { sendUserNotification } from "../notifications/sendPush";

export const approveBankAccount = onCall(
  { region: "asia-south1", timeoutSeconds: 30 },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }

    // 🔐 ADMIN CHECK (adjust according to your role system)
    if (auth.token.role !== "admin") {
      throw new HttpsError("permission-denied", "Admin access required");
    }

    const { userId, bankAccountId, note } = data;

    if (!userId || !bankAccountId) {
      throw new HttpsError(
        "invalid-argument",
        "userId and bankAccountId are required",
      );
    }

    const accountRef = db
      .collection("users")
      .doc(userId)
      .collection("bankAccounts")
      .doc(bankAccountId);

    let approvedAccountId: string | null = null;

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(accountRef);

      if (!snap.exists) {
        throw new HttpsError("not-found", "Bank account not found");
      }

      const account = snap.data()!;

      // 🛑 Idempotency Guard
      if (account.status === "APPROVED") {
        return;
      }

      if (account.status !== "PENDING") {
        throw new HttpsError(
          "failed-precondition",
          `Cannot approve account with status ${account.status}`,
        );
      }

      const accountsRef = db
        .collection("users")
        .doc(userId)
        .collection("bankAccounts");

      // 🔍 Check if user already has a primary approved account
      const approvedSnap = await tx.get(
        accountsRef.where("status", "==", "APPROVED"),
      );

      let shouldBePrimary = false;

      if (approvedSnap.empty) {
        // 🎯 First approved account → auto primary
        shouldBePrimary = true;
      }

      tx.update(accountRef, {
        status: "APPROVED",
        isPrimary: shouldBePrimary,
        approvedAt: FieldValue.serverTimestamp(),
        approvedBy: auth.uid,
        adminNote: note ?? null,
      });

      approvedAccountId = bankAccountId;
    });

    // 🔔 Notify AFTER commit
    if (approvedAccountId) {
      await sendUserNotification(
        userId,
        "Bank Account Approved",
        "Your bank account has been approved successfully.",
        {
          screen: "profile",
          action: "bank_approved",
        },
      );
    }

    return { success: true };
  },
);
