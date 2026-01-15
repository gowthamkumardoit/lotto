import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

type UpiAccount = {
    id: string;
    upiId: string;
    qrUrl?: string;
    enabled: boolean;
};

export const updatePayoutSettings = onCall({ region: "asia-south1" }, async (req) => {
    const { auth, data } = req;

    if (!auth) {
        throw new HttpsError("unauthenticated", "Login required");
    }

    //   if (auth.token.role !== "admin") {
    //     throw new HttpsError("permission-denied", "Admin only");
    //   }

    const { upiAccounts, bank } = data as {
        upiAccounts: UpiAccount[];
        bank: {
            enabled: boolean;
            holder: string;
            bankName: string;
            account: string;
            ifsc: string;
        };
    };

    // Basic validation
    if (!Array.isArray(upiAccounts)) {
        throw new HttpsError("invalid-argument", "Invalid UPI data");
    }

    if (!bank || typeof bank.enabled !== "boolean") {
        throw new HttpsError("invalid-argument", "Invalid bank data");
    }

    await admin.firestore().doc("settings/payouts").set(
        {
            upiAccounts,
            bank,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: auth.uid,
        },
        { merge: true }
    );

    return { success: true };
});
