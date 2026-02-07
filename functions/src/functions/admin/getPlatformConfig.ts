import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "../../lib/firebaseAdmin";

export const getPlatformConfig = onCall(
    { region: "asia-south1", timeoutSeconds: 10 },
    async (request) => {
        const { auth } = request;

        if (!auth) {
            throw new HttpsError("unauthenticated", "Authentication required");
        }

        // 🔐 OPTIONAL: restrict to admins only
        // if (!auth.token.admin) {
        //   throw new HttpsError("permission-denied", "Admin access required");
        // }

        try {
            const ref = db.collection("platformConfig").doc("global");
            const snap = await ref.get();

            if (!snap.exists) {
                throw new HttpsError(
                    "not-found",
                    "Platform configuration not found"
                );
            }

            return {
                id: snap.id,
                ...snap.data(),
            };
        } catch (err) {
            console.error("getPlatformConfig failed", err);

            throw new HttpsError(
                "internal",
                "Failed to load platform configuration"
            );
        }
    }
);
