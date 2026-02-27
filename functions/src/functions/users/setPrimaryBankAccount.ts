import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../lib/firebaseAdmin";

export const setPrimaryBankAccount = onCall(
  { region: "asia-south1", timeoutSeconds: 30 },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }

    const { bankAccountId } = data;

    if (!bankAccountId) {
      throw new HttpsError(
        "invalid-argument",
        "bankAccountId is required"
      );
    }

    const userId = auth.uid;

    const accountRef = db
      .collection("users")
      .doc(userId)
      .collection("bankAccounts")
      .doc(bankAccountId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(accountRef);

      if (!snap.exists) {
        throw new HttpsError("not-found", "Bank account not found");
      }

      const account = snap.data()!;

      // 🚫 Must be approved
      if (account.status !== "APPROVED") {
        throw new HttpsError(
          "failed-precondition",
          "Only approved accounts can be set as primary"
        );
      }

      // 🛑 Idempotency guard
      if (account.isPrimary === true) {
        return;
      }

      const accountsRef = db
        .collection("users")
        .doc(userId)
        .collection("bankAccounts");

      // 🔁 Set all approved accounts to non-primary
      const approvedSnap = await tx.get(
        accountsRef.where("status", "==", "APPROVED")
      );

      approvedSnap.docs.forEach((doc) => {
        tx.update(doc.ref, { isPrimary: false });
      });

      // 👑 Set selected one as primary
      tx.update(accountRef, {
        isPrimary: true,
        primaryUpdatedAt: FieldValue.serverTimestamp(),
      });
    });

    return { success: true };
  }
);