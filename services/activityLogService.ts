import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ActivityLogPayload } from "@/types/activityLog";

/**
 * Writes an activity log entry.
 * Use this for ALL admin/user/system audit actions.
 */
export async function logActivity(payload: ActivityLogPayload) {
    return addDoc(collection(db, "adminActivityLogs"), {
        actorId: payload.actorId,
        actorType: payload.actorType,
        action: payload.action,
        entity: payload.entity,
        entityId: payload.entityId ?? null,
        metadata: payload.metadata ?? null,
        createdAt: serverTimestamp(),
    });
}
