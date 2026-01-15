import { onCall } from "firebase-functions/v2/https";
import { admin, db } from "../../lib/firebaseAdmin";
import { requireAdmin } from "../../helpers/auth";
import { logAdminActivity } from "../../helpers/logAdminActivity";

export const createNotification = onCall(
    { region: "asia-south1" },
    async (request) => {
        const adminId = requireAdmin(request);

        const {
            title,
            message,
            type,
            target,
            adminReason,
        } = request.data || {};

        if (!title || !message || !type || !target || !adminReason) {
            throw new Error("Missing required fields");
        }

        const ref = db.collection("adminNotifications").doc();

        await ref.set({
            title,
            message,
            type, // INFO | PROMO | ALERT
            target, // ALL | USER | SEGMENT
            createdBy: adminId,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 🔒 Audit log
        await logAdminActivity({
            db,
            payload: {
                actorId: adminId,
                actorType: "admin",
                action: "CREATE_NOTIFICATION",
                entity: "notification",
                entityId: ref.id,
                metadata: {
                    title,
                    type,
                    target,
                    adminReason,
                },
            },
        });

        return { success: true };
    }
);
