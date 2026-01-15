import { onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { db, admin } from "../lib/firebaseAdmin";
import { validate } from "../helpers/validate";
import { handleError } from "../helpers/errors";
import { requireAdminAuth } from "../helpers/requireAdminAuth";
import { HttpsError } from "firebase-functions/https";

const ToggleDrawStatusSchema = z
    .object({
        drawId: z.string().min(1),
    })
    .strict();

export const toggleDrawStatus = onCall(
    { region: "asia-south1" },
    async (request) => {
        try {
            requireAdminAuth(request);

            const { drawId } = validate(
                ToggleDrawStatusSchema,
                request.data
            );

            const ref = db.collection("draws").doc(drawId);

            await db.runTransaction(async (tx) => {
                const snap = await tx.get(ref);

                if (!snap.exists) {
                    throw new HttpsError("not-found", "Draw not found");
                }

                const draw = snap.data()!;

                if (
                    draw.status === "RUNNING" ||
                    draw.status === "COMPLETED"
                ) {
                    throw new HttpsError(
                        "failed-precondition",
                        `Cannot toggle draw in ${draw.status} state`
                    );
                }

                const nextStatus =
                    draw.status === "DISABLED"
                        ? "UPCOMING"
                        : "DISABLED";

                tx.update(ref, {
                    status: nextStatus,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    ...(nextStatus === "DISABLED"
                        ? {
                            disabledAt:
                                admin.firestore.FieldValue.serverTimestamp(),
                        }
                        : {
                            enabledAt:
                                admin.firestore.FieldValue.serverTimestamp(),
                        }),
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
