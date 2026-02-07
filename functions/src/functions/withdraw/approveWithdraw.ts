import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../lib/firebaseAdmin";
import { sendUserNotification } from "../notifications/sendPush";

export const approveWithdraw = onCall(
    { region: "asia-south1", timeoutSeconds: 30 },
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

        let debitedUserId: string | null = null;
        let debitedAmount: number | null = null;

        await db.runTransaction(async (tx) => {
            const snap = await tx.get(withdrawRef);

            if (!snap.exists) {
                throw new HttpsError("not-found", "Withdraw request not found");
            }

            const withdraw = snap.data()!;

            // 🛑 Idempotency guard
            if (withdraw.status === "APPROVED") {
                // Already settled — no-op
                return;
            }

            if (withdraw.status !== "SUBMITTED") {
                throw new HttpsError(
                    "failed-precondition",
                    `Cannot approve withdraw with status ${withdraw.status}`
                );
            }

            const userRef = db.collection("users").doc(withdraw.userId);
            const userSnap = await tx.get(userRef);

            if (!userSnap.exists) {
                throw new HttpsError("not-found", "User not found");
            }

            const user = userSnap.data()!;
            const lockedBalance = user.lockedBalance ?? 0;

            // ❌ CRITICAL CHECK — locked funds must exist
            if (lockedBalance < withdraw.amount) {
                throw new HttpsError(
                    "failed-precondition",
                    "Locked balance insufficient for withdrawal"
                );
            }

            debitedUserId = withdraw.userId;
            debitedAmount = withdraw.amount;

            // 💰 FINAL SETTLEMENT
            tx.update(userRef, {
                walletBalance: FieldValue.increment(-withdraw.amount),
                lockedBalance: FieldValue.increment(-withdraw.amount),
            });

            // 🧾 LEDGER ENTRY
            tx.set(db.collection("walletTxns").doc(), {
                userId: withdraw.userId,
                amount: -withdraw.amount,
                type: "DEBIT",
                reason: "Wallet Withdrawal",
                referenceId: withdrawId,
                createdAt: FieldValue.serverTimestamp(),
            });

            // ✅ MARK AS PAID
            tx.update(withdrawRef, {
                status: "APPROVED",
                approvedAt: FieldValue.serverTimestamp(),
                approvedBy: auth.uid,
                adminNote: note,
            });
        });

        // 🔔 Notify AFTER commit
        if (debitedUserId && debitedAmount !== null) {
            await sendUserNotification(
                debitedUserId,
                "Withdrawal Completed",
                `₹${debitedAmount} has been successfully withdrawn.`,
                {
                    screen: "wallet",                // 🔗 Deep-link target
                    action: "withdraw_approved",     // 🔔 Generic system broadcast
                }
            );
        }

        return { success: true };
    }
);

