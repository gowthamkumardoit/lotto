import { onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { db, admin } from "../../lib/firebaseAdmin";
import { validate } from "../../helpers/validate";
import { handleError } from "../../helpers/errors";
import { requireAdminAuth } from "../../helpers/requireAdminAuth";

/* ---------------- SCHEMA ---------------- */

const CreateDigitDrawSchema = z
    .object({
        name: z.string().trim().min(1, "Draw name is required"),

        digits: z
            .number()
            .int("Digits must be an integer")
            .min(1, "Digits must be at least 1")
            .max(10, "Digits too large"),
    })
    .strict();

/* ---------------- FUNCTION ---------------- */

export const createDigitDraw = onCall(
    {
        region: "asia-south1",
    },
    async (request) => {
        try {
            console.log("AUTH UID:", request.auth?.uid);

            /** 🔐 Admin only */
            requireAdminAuth(request);

            /** ✅ Validate input */
            const { name, digits } = validate(
                CreateDigitDrawSchema,
                request.data
            );

            /** 📄 Create digit draw */
            const drawRef = db.collection("digitDraws").doc();

            await drawRef.set({
                id: drawRef.id,
                name,
                digits,
                status: "OPEN", // OPEN | LOCKED | RUNNING | COMPLETED | DISABLED
                sales: 0,
                config: null, // safe default
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            return {
                success: true,
                digitDrawId: drawRef.id,
            };
        } catch (error) {
            throw handleError(error);
        }
    }
);
