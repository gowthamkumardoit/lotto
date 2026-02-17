import { onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { db } from "../lib/firebaseAdmin";
import { validate } from "../helpers/validate";
import { handleError } from "../helpers/errors";
import { requireAdminAuth } from "../helpers/requireAdminAuth";
import { HttpsError } from "firebase-functions/https";

const DeleteDrawSchema = z
    .object({
        drawId: z.string().min(1),
    })
    .strict();

export const deleteDrawName = onCall(
    { region: "asia-south1" },
    async (request) => {
        try {
            requireAdminAuth(request);

            const { drawId } = validate(
                DeleteDrawSchema,
                request.data
            );

            const ref = db.collection("draws").doc(drawId);
            const snap = await ref.get();

            if (!snap.exists) {
                throw new HttpsError("not-found", "Draw not found");
            }

            const draw = snap.data()!;

            if (draw.status !== "OPEN") {
                throw new HttpsError(
                    "failed-precondition",
                    "Only OPEN draws can be deleted"
                );
            }

            if (draw.sales > 0) {
                throw new HttpsError(
                    "failed-precondition",
                    "Cannot delete draw with sales"
                );
            }

            await ref.delete();

            return { success: true };
        } catch (error) {
            throw handleError(error);
        }
    }
);
