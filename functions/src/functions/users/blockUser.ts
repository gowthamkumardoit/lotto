import { onCall } from "firebase-functions/v2/https";
import { requireAdmin } from "../../helpers/auth";
import { admin, db } from "../../lib/firebaseAdmin";
import { logAdminActivity } from "../../helpers/logAdminActivity";
import { handleError } from "../../helpers/errors";

export const setUserStatus = onCall({ region: "asia-south1" }, async (request) => {
    try {
        const adminUserId = requireAdmin(request); // 👈 must return admin context

        const { userId, status } = request.data as {
            userId: string;
            status: "active" | "blocked";
        };

        if (!userId || !status) {
            throw new Error("Invalid arguments");
        }

        const userRef = db.collection("users").doc(userId);

        await db.runTransaction(async (tx) => {
            const snap = await tx.get(userRef);
            if (!snap.exists) throw new Error("User not found");

            tx.update(userRef, {
                status,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        });

        await logAdminActivity({
            db,
            payload: {
                actorId: adminUserId,
                actorType: "admin",
                action: status === "blocked" ? "BLOCK_USER" : "UNBLOCK_USER",
                entity: "user",
                entityId: userId,
                metadata: {
                    newStatus: status,
                },
            },
        });

        return { success: true };
    } catch (err) {
        handleError(err);
    }
});