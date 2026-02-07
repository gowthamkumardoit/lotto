import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { requireAdminAuth } from "../../helpers/requireAdminAuth";
import { sendUserNotification } from "../notifications/sendPush";

const db = getFirestore();

/* ---------------- FUNCTION ---------------- */

/**
 * rejectKyc
 *
 * Preconditions:
 * - Caller must be admin
 * - KYC request must exist
 * - Status must be SUBMITTED
 *
 * Effects:
 * - kycRequests.status → REJECTED
 * - rejectionReason stored
 * - users.kycStatus → REJECTED
 * - Notify user
 */
export const rejectKyc = onCall(
    {
        region: "asia-south1",
    },
    async (request) => {
        /* ---------- Auth ---------- */
        requireAdminAuth(request);

        const { uid, reason } = request.data as {
            uid?: string;
            reason?: string;
        };

        if (!uid) {
            throw new HttpsError("invalid-argument", "uid is required");
        }

        if (!reason || reason.trim().length < 3) {
            throw new HttpsError(
                "invalid-argument",
                "Rejection reason is required"
            );
        }

        const kycRef = db.collection("kycRequests").doc(uid);
        const userRef = db.collection("users").doc(uid);

        /* ---------- Transaction ---------- */
        await db.runTransaction(async (tx) => {
            const snap = await tx.get(kycRef);

            if (!snap.exists) {
                throw new HttpsError("not-found", "KYC request not found");
            }

            const kyc = snap.data() as {
                status: string;
            };

            if (kyc.status !== "SUBMITTED") {
                throw new HttpsError(
                    "failed-precondition",
                    `KYC must be SUBMITTED. Current status: ${kyc.status}`
                );
            }

            tx.update(kycRef, {
                status: "REJECTED",
                rejectionReason: reason,
                rejectedAt: FieldValue.serverTimestamp(),
            });

            tx.update(userRef, {
                kycStatus: "REJECTED",
                kycRejectedAt: FieldValue.serverTimestamp(),
            });
        });

        /* ---------- Notify User (non-blocking) ---------- */
        await sendUserNotification(
            uid,
            "KYC Rejected ❌",
            `Your KYC was rejected. Reason: ${reason}`,
            {
                action: "kyc_rejected",
                screen: "profile",
            },
        );

        return { success: true };
    }
);
