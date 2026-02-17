import { onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { db } from "../../lib/firebaseAdmin";
import { validate } from "../../helpers/validate";
import { handleError } from "../../helpers/errors";
import { requireAdminAuth } from "../../helpers/requireAdminAuth";

/* ---------------- SCHEMA ---------------- */

const DeleteDigitDrawSchema = z
    .object({
        digitDrawId: z.string().min(1),
    })
    .strict();

/* ---------------- FUNCTION ---------------- */

export const deleteDigitDraw = onCall(
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
                DeleteDigitDrawSchema,
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
                throw new Error("Cannot delete a running draw");
            }

            if (status === "COMPLETED") {
                throw new Error("Cannot delete a completed draw");
            }

            /** 🚫 Prevent deletion if tickets/sales exist */
            if ((draw.sales ?? 0) > 0) {
                throw new Error(
                    "Cannot delete draw with existing ticket sales"
                );
            }

            /** 💥 Delete */
            await drawRef.delete();

            return {
                success: true,
            };
        } catch (error) {
            throw handleError(error);
        }
    }
);
