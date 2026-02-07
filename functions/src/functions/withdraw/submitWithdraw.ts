import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../lib/firebaseAdmin";

export const submitWithdraw = onCall(
    { region: "asia-south1", timeoutSeconds: 30 },
    async (request) => {
        const { auth, data } = request;

        if (!auth) {
            throw new HttpsError("unauthenticated", "Authentication required");
        }

        const { amount } = data;

        if (typeof amount !== "number" || amount <= 0) {
            throw new HttpsError("invalid-argument", "Invalid withdraw amount");
        }

        const uid = auth.uid;

        const withdrawRef = db.collection("withdrawalRequests").doc();

        await db.runTransaction(async (tx) => {
            // ✅ FIND USER DOC BY uid FIELD (NOT DOC ID)
            const userQuerySnap = await tx.get(
                db.collection("users").where("uid", "==", uid).limit(1)
            );

            if (userQuerySnap.empty) {
                throw new HttpsError("not-found", "User not found");
            }

            const userDoc = userQuerySnap.docs[0];
            const userRef = userDoc.ref;
            const user = userDoc.data();

            const walletBalance = user.walletBalance ?? 0;
            const lockedBalance = user.lockedBalance ?? 0;

            const availableBalance = walletBalance - lockedBalance;

            // ❌ Insufficient available balance
            if (availableBalance < amount) {
                throw new HttpsError(
                    "failed-precondition",
                    "Insufficient available balance"
                );
            }

            // ❌ Block multiple pending withdrawals
            const pendingSnap = await tx.get(
                db
                    .collection("withdrawalRequests")
                    .where("userId", "==", uid)
                    .where("status", "in", ["SUBMITTED", "PROCESSING"])
                    .limit(1)
            );

            if (!pendingSnap.empty) {
                throw new HttpsError(
                    "failed-precondition",
                    "You already have a pending withdrawal"
                );
            }

            // 🔒 LOCK FUNDS
            tx.update(userRef, {
                lockedBalance: FieldValue.increment(amount),
            });

            // 🧾 LEDGER ENTRY (LOCK)
            tx.set(db.collection("walletTxns").doc(), {
                userId: uid,
                amount,
                type: "LOCK",
                reason: "Withdrawal Submitted",
                referenceId: withdrawRef.id,
                createdAt: FieldValue.serverTimestamp(),
            });

            // 📤 CREATE WITHDRAW REQUEST
            tx.set(withdrawRef, {
                userId: uid,
                amount,
                status: "SUBMITTED",
                createdAt: FieldValue.serverTimestamp(),
            });
        });

        return { success: true };
    }
);
