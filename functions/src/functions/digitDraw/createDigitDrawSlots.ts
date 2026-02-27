import { onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { db, admin } from "../../lib/firebaseAdmin";
import { validate } from "../../helpers/validate";
import { handleError } from "../../helpers/errors";
import { requireAdminAuth } from "../../helpers/requireAdminAuth";

/* ---------------- SCHEMA ---------------- */

const CreateDigitDrawSlotSchema = z
    .object({
        templateId: z.string().min(1),
        name: z.string().trim().min(1, "Slot name is required"),
        openAt: z.any(),
        closeAt: z.any(),
    })
    .strict();

/* ---------------- HELPER ---------------- */

function normalizeToTimestamp(value: any): admin.firestore.Timestamp {
    if (!value) {
        throw new Error("Timestamp value is required");
    }

    // Already Firestore Timestamp
    if (value instanceof admin.firestore.Timestamp) {
        return value;
    }

    // Firestore v9 serialized format { seconds, nanoseconds }
    if (typeof value.seconds === "number") {
        return new admin.firestore.Timestamp(
            value.seconds,
            value.nanoseconds || 0
        );
    }

    // Older serialized format { _seconds, _nanoseconds }
    if (typeof value._seconds === "number") {
        return new admin.firestore.Timestamp(
            value._seconds,
            value._nanoseconds || 0
        );
    }

    // JS Date object
    if (value instanceof Date) {
        return admin.firestore.Timestamp.fromDate(value);
    }

    // Milliseconds number
    if (typeof value === "number") {
        return admin.firestore.Timestamp.fromMillis(value);
    }

    // ISO string
    if (typeof value === "string") {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) {
            return admin.firestore.Timestamp.fromDate(parsed);
        }
    }

    console.error("Unsupported timestamp format received:", value);
    throw new Error("Unsupported timestamp format");
}


/* ---------------- FUNCTION ---------------- */

export const createDigitDrawSlot = onCall(
    { region: "asia-south1" },
    async (request) => {
        try {
            console.log("AUTH UID:", request.auth?.uid);

            /** 🔐 Admin only */
            requireAdminAuth(request);

            /** ✅ Validate payload */
            const { templateId, name, openAt, closeAt } = validate(
                CreateDigitDrawSlotSchema,
                request.data
            );

            /** 🕒 Normalize timestamps safely */
            const openTimestamp = normalizeToTimestamp(openAt);
            const closeTimestamp = normalizeToTimestamp(closeAt);

            if (closeTimestamp.toMillis() <= openTimestamp.toMillis()) {
                throw new Error("Close time must be after open time");
            }

            /** 🔍 Load template */
            const templateRef = db.collection("digitDraws").doc(templateId);
            const templateSnap = await templateRef.get();

            if (!templateSnap.exists) {
                throw new Error("Digit draw template not found");
            }

            const template = templateSnap.data()!;

            if (!template.config?.enabled) {
                throw new Error("Template is disabled");
            }

            const digits = template.digits;

            /** 📦 Snapshot template config */
            const configSnapshot = template.config;

            /** 📄 Create slot */
            const slotRef = db.collection("digitDrawSlots").doc();

            await slotRef.set({
                id: slotRef.id,
                templateId,
                name,
                digits,
                status: "OPEN",
                sales: 0,
                openAt: openTimestamp,
                closeAt: closeTimestamp,
                configSnapshot,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            return {
                success: true,
                slotId: slotRef.id,
            };
        } catch (error) {
            throw handleError(error);
        }
    }
);
