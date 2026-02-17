import { onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { db, admin } from "../../lib/firebaseAdmin";
import { validate } from "../../helpers/validate";
import { handleError } from "../../helpers/errors";
import { requireAdminAuth } from "../../helpers/requireAdminAuth";

/* ---------------- SCHEMA ---------------- */

const ToggleDigitDrawStatusSchema = z
    .object({
        digitDrawId: z.string().min(1),
    })
    .strict();

/* ---------------- FUNCTION ---------------- */

export const toggleDigitDrawStatus = onCall(
    {
        region: "asia-south1",
    },
    async (request) => {
        try {
            console.log("AUTH UID:", request.auth?.uid);

            /** 🔐 Admin only */
            requireAdminAuth(request);

            /** ✅ Validate input */
            const { digitDrawId } = validate(
                ToggleDigitDrawStatusSchema,
                request.data
            );

            /** 🔍 Fetch draw */
            const drawRef = db.collection("digitDraws").doc(digitDrawId);
            const snap = await drawRef.get();

            if (!snap.exists) {
                throw new Error("Digit draw not found");
            }

            const draw = snap.data()!;
            const status: string = draw.status;

            /** 🚫 Hard locks */
            if (status === "RUNNING") {
                throw new Error("Cannot disable a running draw");
            }

            if (status === "COMPLETED") {
                throw new Error("Cannot disable a completed draw");
            }

            /** 🔁 Toggle */
            const nextStatus = status === "DISABLED" ? "OPEN" : "DISABLED";

            /** 💾 Persist */
            await drawRef.update({
                status: nextStatus,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            return {
                success: true,
                status: nextStatus,
            };
        } catch (error) {
            throw handleError(error);
        }
    }
);
