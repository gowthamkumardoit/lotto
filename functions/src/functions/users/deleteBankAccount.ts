import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../lib/firebaseAdmin";

export const deleteBankAccount = onCall(
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

    const userRef = db.collection("users").doc(userId);
    const accountsRef = userRef.collection("bankAccounts");
    const accountRef = accountsRef.doc(bankAccountId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(accountRef);

      if (!snap.exists) {
        // Idempotent safe: already deleted
        return;
      }

      const account = snap.data()!;

      // 🚫 Cannot delete rejected accounts (optional rule)
      if (account.status === "REJECTED") {
        throw new HttpsError(
          "failed-precondition",
          "Cannot delete rejected account"
        );
      }

      const isPrimary = account.isPrimary === true;

      // 🗑 Delete account
      tx.delete(accountRef);

      // 👑 If primary → promote another approved account
      if (isPrimary && account.status === "APPROVED") {
        const approvedSnap = await tx.get(
          accountsRef
            .where("status", "==", "APPROVED")
        );

        // Filter out the one being deleted
        const remainingApproved = approvedSnap.docs.filter(
          (doc) => doc.id !== bankAccountId
        );

        if (remainingApproved.length > 0) {
          const nextPrimary = remainingApproved[0];

          tx.update(nextPrimary.ref, {
            isPrimary: true,
            primaryUpdatedAt: FieldValue.serverTimestamp(),
          });
        }
      }
    });

    return { success: true };
  }
);