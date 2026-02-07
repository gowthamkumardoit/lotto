import { onCall } from "firebase-functions/v2/https";
import { admin, db } from "../../lib/firebaseAdmin";
import { requireAdmin } from "../../helpers/auth";
import { logAdminActivity } from "../../helpers/logAdminActivity";
import { dispatchPushNotifications } from "./dispatchPushNotifications";

export const createNotification = onCall(
    { region: "asia-south1", timeoutSeconds: 120 },
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

        // 1️⃣ Create in-app notification
        const ref = db.collection("adminNotifications").doc();

        await ref.set({
            title,
            message,
            type,           // INFO | PROMO | ALERT
            target,         // ALL | USER | SEGMENT
            createdBy: adminId,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 2️⃣ Send push notifications (best-effort)
        await dispatchPushNotifications({
            title,
            message,
            target,
            payload: {
                screen: "home",          // or wallet / support / history
                action: "admin_broadcast",
            },
        });

        // 3️⃣ Audit log
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
