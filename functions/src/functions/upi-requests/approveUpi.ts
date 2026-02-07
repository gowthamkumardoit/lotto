import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { requireAdminAuth } from "../../helpers/requireAdminAuth";
import { sendUserNotification } from "../notifications/sendPush";
import { db } from "../../lib/firebaseAdmin";


/**
 * approveUpiWithdrawal
 *
 * Preconditions:
 * - Caller must be admin
 * - UPI withdrawal request must exist
 * - Status must be PENDING
 *
 * Effects:
 * - upiWithdrawals.status → APPROVED
 * - upiWithdrawals.approvedAt set
 * - Notify user
 */
export const approveUpi = onCall(
    {
        region: "asia-south1",
    },
    async (request) => {
        /* ---------- Auth ---------- */
        requireAdminAuth(request);

        const { requestId } = request.data as {
            requestId?: string;
        };

        if (!requestId) {
            throw new HttpsError("invalid-argument", "requestId is required");
        }

        const withdrawRef = db.collection("upiWithdrawals").doc(requestId);

        let userId: string;

        /* ---------- Transaction ---------- */
        await db.runTransaction(async (tx) => {
            const snap = await tx.get(withdrawRef);

            if (!snap.exists) {
                throw new HttpsError("not-found", "UPI withdrawal request not found");
            }

            const withdrawal = snap.data() as {
                status: string;
                userId: string;
            };

            if (withdrawal.status !== "PENDING") {
                throw new HttpsError(
                    "failed-precondition",
                    `Withdrawal must be PENDING. Current status: ${withdrawal.status}`,
                );
            }

            userId = withdrawal.userId;

            tx.update(withdrawRef, {
                status: "APPROVED",
                approvedAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            });
        });

        /* ---------- Notify User (non-blocking) ---------- */
        await sendUserNotification(
            userId!,
            "UPI Withdrawal Approved ✅",
            "Your UPI withdrawal request has been approved and is being processed.",
            {
                screen: "wallet",                // 🔗 Deep-link target
                action: "upi_approved",     // 🔔 Generic system broadcast
            }
        );

        return { success: true };
    },
);
