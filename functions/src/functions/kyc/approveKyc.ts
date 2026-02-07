import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { requireAdminAuth } from "../../helpers/requireAdminAuth";
import { sendUserNotification } from "../notifications/sendPush";

const db = getFirestore();

export const approveKyc = onCall(
    {
        region: "asia-south1",
    },
    async (request) => {
        /* ---------- Auth ---------- */
        requireAdminAuth(request);

        const { uid } = request.data as { uid?: string };

        if (!uid) {
            throw new HttpsError("invalid-argument", "uid is required");
        }

        const kycRef = db.collection("kycRequests").doc(uid);
        const userRef = db.collection("users").doc(uid);

        /* ---------- Transaction ---------- */
        await db.runTransaction(async (tx) => {
            const snap = await tx.get(kycRef);

            if (!snap.exists) {
                throw new HttpsError("not-found", "KYC request not found");
            }

            const kyc = snap.data() as { status: string };

            if (kyc.status !== "SUBMITTED") {
                throw new HttpsError(
                    "failed-precondition",
                    `KYC must be SUBMITTED. Current status: ${kyc.status}`
                );
            }

            tx.update(kycRef, {
                status: "APPROVED",
                approvedAt: FieldValue.serverTimestamp(),
            });

            tx.update(userRef, {
                kycStatus: "APPROVED",
                kycApprovedAt: FieldValue.serverTimestamp(),
            });
        });

        /* ---------- Notify User (non-blocking) ---------- */
        sendUserNotification(
            uid,
            "KYC Approved ✅",
            "Your KYC has been successfully approved. You can now use all features.",
            {
                action: "kyc_approved",
                screen: "profile",
            }
        );

        return { success: true };
    }
);
