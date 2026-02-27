import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../lib/firebaseAdmin";
import { sendUserNotification } from "../notifications/sendPush";

export const saveBankAccount = onCall(
  { region: "asia-south1", timeoutSeconds: 30 },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }

    const { accountName, accountNumber, ifsc, bankName } = data;

    if (!accountName || !accountNumber || !ifsc || !bankName) {
      throw new HttpsError(
        "invalid-argument",
        "All bank fields are required"
      );
    }

    // 🔐 Backend Validation (Never trust client)
    const nameRegex = /^[A-Za-z ]{3,}$/;
    const accRegex = /^[0-9]{9,18}$/;
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

    if (!nameRegex.test(accountName.trim())) {
      throw new HttpsError("invalid-argument", "Invalid account name");
    }

    if (!nameRegex.test(bankName.trim())) {
      throw new HttpsError("invalid-argument", "Invalid bank name");
    }

    if (!accRegex.test(accountNumber)) {
      throw new HttpsError("invalid-argument", "Invalid account number");
    }

    if (!ifscRegex.test(ifsc.toUpperCase())) {
      throw new HttpsError("invalid-argument", "Invalid IFSC code");
    }

    const userRef = db.collection("users").doc(auth.uid);
    const accountsRef = userRef.collection("bankAccounts");

    let newAccountId: string | null = null;

    await db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);

      if (!userSnap.exists) {
        throw new HttpsError("not-found", "User not found");
      }

      // 🚫 Prevent duplicate account number for same user
      const existingSnap = await tx.get(
        accountsRef.where("accountNumber", "==", accountNumber)
      );

      if (!existingSnap.empty) {
        throw new HttpsError(
          "already-exists",
          "This bank account is already added"
        );
      }

      const newDoc = accountsRef.doc();

      newAccountId = newDoc.id;

      tx.set(newDoc, {
        accountName: accountName.trim(),
        accountNumber: accountNumber,
        ifsc: ifsc.toUpperCase(),
        bankName: bankName.trim(),

        status: "PENDING",       // 🔒 Admin must approve
        isPrimary: false,

        createdAt: FieldValue.serverTimestamp(),
        approvedAt: null,
        approvedBy: null,
      });
    });

    // 🔔 Optional notification
    if (newAccountId) {
      await sendUserNotification(
        auth.uid,
        "Bank Account Submitted",
        "Your bank account has been sent for admin approval.",
        {
          screen: "profile",
          action: "bank_pending",
        }
      );
    }

    return { success: true };
  }
);