import { onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { db, admin } from "../../lib/firebaseAdmin";
import { validate } from "../../helpers/validate";
import { handleError } from "../../helpers/errors";
import { requireAdminAuth } from "../../helpers/requireAdminAuth";

/* ---------------- SCHEMA ---------------- */

const UpdateDigitDrawSchema = z
    .object({
        digitDrawId: z.string().min(1, "Digit draw ID is required"),

        name: z.string().trim().min(1).optional(),

        digits: z
            .number()
            .int("Digits must be an integer")
            .min(1)
            .max(10)
            .optional(),

        status: z
            .enum(["OPEN", "LOCKED", "RUNNING", "COMPLETED", "DISABLED"])
            .optional(),

        config: z.any().optional(),
    })
    .strict();

/* ---------------- FUNCTION ---------------- */

export const updateDigitDraw = onCall(
    {
        region: "asia-south1",
    },
    async (request) => {
        try {
            console.log("AUTH UID:", request.auth?.uid);

            /** 🔐 Admin only */
            requireAdminAuth(request);

            /** ✅ Validate input */
            const { digitDrawId, name, digits, status, config } = validate(
                UpdateDigitDrawSchema,
                request.data
            );

            const drawRef = db.collection("digitDraws").doc(digitDrawId);
            const snap = await drawRef.get();

            if (!snap.exists) {
                throw new Error("Digit draw not found");
            }

            /** 🛠 Prepare update object */
            const updateData: Record<string, any> = {
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            if (name !== undefined) updateData.name = name;
            if (digits !== undefined) updateData.digits = digits;
            if (status !== undefined) updateData.status = status;
            if (config !== undefined) updateData.config = config;

            /** 🚀 Update */
            await drawRef.update(updateData);

            return {
                success: true,
                digitDrawId,
            };
        } catch (error) {
            throw handleError(error);
        }
    }
);
