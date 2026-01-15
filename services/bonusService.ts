import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    updateDoc,
    serverTimestamp,
    Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { logActivity } from "./activityLogService";

/* ---------------- CREATE BONUS ---------------- */

export async function createBonus(data: {
    title: string;
    amount: number;
    validDays: number;
    createdBy: string;
    reason?: string;
}) {
    if (data.validDays <= 0) {
        throw new Error("validDays must be greater than 0");
    }

    const now = new Date();
    const expiresAt = new Date(
        now.getTime() + data.validDays * 24 * 60 * 60 * 1000
    );

    const ref = await addDoc(collection(db, "bonuses"), {
        title: data.title,
        amount: data.amount,
        type: "CAMPAIGN",
        status: "ACTIVE",
        validDays: data.validDays,
        expiresAt: Timestamp.fromDate(expiresAt),
        createdBy: data.createdBy,
        reason: data.reason ?? null,
        createdAt: serverTimestamp(),
    });

    // ✅ ADMIN ACTIVITY LOG
    await logActivity({
        actorId: data.createdBy,
        actorType: "admin",
        action: "BONUS_CREATED",
        entity: "bonus",
        entityId: ref.id,
        metadata: {
            title: data.title,
            amount: data.amount,
            validDays: data.validDays,
            expiresAt: expiresAt.toISOString(),
        },
    });

    return ref;
}

/* ---------------- UPDATE BONUS (LIMITED) ---------------- */

export async function updateBonus(
    id: string,
    data: Partial<{
        title: string;
        amount: number;
        status: "ACTIVE" | "USED" | "EXPIRED";
        reason: string;
    }>,
    actorId: string
) {
    if (Object.keys(data).length === 0) return;

    await updateDoc(doc(db, "bonuses", id), data);

    // ✅ ADMIN ACTIVITY LOG
    await logActivity({
        actorId,
        actorType: "admin",
        action: "BONUS_UPDATED",
        entity: "bonus",
        entityId: id,
        metadata: data,
    });
}

/* ---------------- DELETE BONUS ---------------- */
/* ⚠️ Only allow delete if never issued to a user */

export async function deleteBonus(id: string, actorId: string) {
    await deleteDoc(doc(db, "bonuses", id));

    // ✅ ADMIN ACTIVITY LOG
    await logActivity({
        actorId,
        actorType: "admin",
        action: "BONUS_DELETED",
        entity: "bonus",
        entityId: id,
    });
}
