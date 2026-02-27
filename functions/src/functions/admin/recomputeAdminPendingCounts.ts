// adminCounts.ts
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../lib/firebaseAdmin";

export async function recomputeAdminPendingCounts() {
  const [
    depositsSnap,
    withdrawalsSnap,
    supportSnap,
    kycSnap,
    upiSnap,
    bankAccountsSnap, // ✅ new
  ] = await Promise.all([
    db.collection("topupRequests").where("status", "==", "SUBMITTED").get(),

    db
      .collection("withdrawalRequests")
      .where("status", "==", "SUBMITTED")
      .get(),

    db.collection("supportTickets").where("status", "==", "OPEN").get(),

    db.collection("kycRequests").where("status", "==", "SUBMITTED").get(),

    db.collection("upiWithdrawals").where("status", "==", "PENDING").get(),

    // 🔥 collectionGroup query for subcollections
    db.collectionGroup("bankAccounts").where("status", "==", "PENDING").get(),
  ]);

  await db.collection("admin_stats").doc("pending_counts").set(
    {
      deposits: depositsSnap.size,
      withdrawals: withdrawalsSnap.size,
      supportTickets: supportSnap.size,
      kycRequests: kycSnap.size,
      upiWithdrawals: upiSnap.size,
      bankAccounts: bankAccountsSnap.size, // ✅ new field
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}
