import { onCall } from "firebase-functions/v2/https";
import { HttpsError } from "firebase-functions/https";
import { z } from "zod";
import { requireAdminAuth } from "../../helpers/requireAdminAuth";
import { validate } from "../../helpers/validate";
import { admin, db } from "../../lib/firebaseAdmin";
import { handleError } from "../../helpers/errors";


/* ---------------- SCHEMA ---------------- */

const DrawConfigSchema = z.object({
    enable2D: z.boolean(),
    enable3D: z.boolean(),
    enable4D: z.boolean(),

    multiplier2D: z.number().positive(),
    multiplier3D: z.number().positive(),
    multiplier4D: z.number().positive(),

    maxBet: z.number().positive(),
    minSales: z.number().min(0),
});

const UpdateDrawConfigSchema = z
    .object({
        drawId: z.string().min(1),
        config: DrawConfigSchema,
    })
    .strict();

/* ---------------- FUNCTION ---------------- */

export const updateDrawConfig = onCall(
    { region: "asia-south1" },
    async (request) => {
        try {
            /* 🔐 Admin auth */
            requireAdminAuth(request);

            /* ✅ Validate input */
            const { drawId, config } = validate(
                UpdateDrawConfigSchema,
                request.data
            );

            const ref = db.collection("draws").doc(drawId);

            await db.runTransaction(async (tx) => {
                const snap = await tx.get(ref);

                if (!snap.exists) {
                    throw new HttpsError("not-found", "Draw not found");
                }

                const draw = snap.data()!;

                /* 🔒 Lock rule */
                if (draw.status !== "OPEN") {
                    throw new HttpsError(
                        "failed-precondition",
                        "Draw configuration is locked"
                    );
                }

                tx.update(ref, {
                    config,
                    configured: true, // optional helper flag
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            });

            return {
                success: true,
            };
        } catch (error) {
            throw handleError(error);
        }
    }
);
