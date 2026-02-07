import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "../../lib/firebaseAdmin";

type AdminPendingCounts = {
  deposits: number;
  withdrawals: number;
  supportTickets: number;
  kycRequests: number;
  upiWithdrawals: number;
};

export const getAdminPendingCounts = onCall(
  { region: "asia-south1", timeoutSeconds: 15 },
  async (request) => {
    const { auth } = request;

    if (!auth) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }

    // ⚠️ OPTIONAL: enforce admin-only access
    // if (!auth.token.admin) {
    //   throw new HttpsError("permission-denied", "Admin access required");
    // }

    try {
      const [
        depositsSnap,
        withdrawalsSnap,
        supportSnap,
        kycSnap,
        upiSnap,
      ] = await Promise.all([
        db
          .collection("topupRequests")
          .where("status", "==", "SUBMITTED")
          .get(),

        db
          .collection("withdrawalRequests")
          .where("status", "==", "PENDING")
          .get(),

        db
          .collection("supportTickets")
          .where("status", "==", "OPEN")
          .get(),

        db
          .collection("kycRequests")
          .where("status", "==", "SUBMITTED")
          .get(),

        db
          .collection("upiWithdrawals")
          .where("status", "==", "PENDING")
          .get(),
      ]);

      const result: AdminPendingCounts = {
        deposits: depositsSnap.size,
        withdrawals: withdrawalsSnap.size,
        supportTickets: supportSnap.size,
        kycRequests: kycSnap.size,
        upiWithdrawals: upiSnap.size
      };

      return result;
    } catch (err) {
      console.error("getAdminPendingCounts failed", err);
      throw new HttpsError(
        "internal",
        "Failed to load admin pending counts"
      );
    }
  }
);
