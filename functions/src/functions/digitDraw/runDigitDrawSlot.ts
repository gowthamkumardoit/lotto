import { onCall, HttpsError } from "firebase-functions/v2/https";
import { requireAdminAuth } from "../../helpers/requireAdminAuth";
import { admin, db } from "../../lib/firebaseAdmin";
import { randomInt } from "crypto";

export const runDigitDrawSlot = onCall(
    { region: "asia-south1" },
    async (request) => {
        const adminAuth = requireAdminAuth(request);

        const { slotId } = request.data as { slotId?: string };

        if (!slotId) {
            throw new HttpsError("invalid-argument", "slotId is required");
        }

        const slotRef = db.collection("digitDrawSlots").doc(slotId);

        let winningNumber: string | null = null;

        await db.runTransaction(async (tx) => {
            const slotSnap = await tx.get(slotRef);

            if (!slotSnap.exists) {
                throw new HttpsError("not-found", "Slot not found");
            }

            const slot = slotSnap.data() as {
                status: string;
                digits: number;
                result?: any;
            };

            if (slot.status !== "LOCKED") {
                throw new HttpsError(
                    "failed-precondition",
                    `Slot must be LOCKED to run draw. Current: ${slot.status}`
                );
            }

            if (slot.result?.winningNumber) {
                throw new HttpsError(
                    "failed-precondition",
                    "Draw already executed for this slot"
                );
            }

            const max = Math.pow(10, slot.digits);
            const randomValue = randomInt(0, max);

            winningNumber = randomValue
                .toString()
                .padStart(slot.digits, "0");

            tx.update(slotRef, {
                status: "DRAWN",
                result: {
                    winningNumber,
                    drawnAt: admin.firestore.FieldValue.serverTimestamp(),
                    drawnBy: adminAuth.uid,
                    isDeclared: false,
                },
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        });

        if (!winningNumber) {
            throw new HttpsError(
                "internal",
                "Winning number generation failed"
            );
        }

        await db.collection("digitDrawSlotAudits").add({
            slotId,
            action: "DRAW_EXECUTED",
            message: `Draw executed manually. Winning number: ${winningNumber}`,
            actor: adminAuth.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return {
            success: true,
            winningNumber,
        };
    }
);
