import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../lib/firebaseAdmin";

const ALLOWED_STATUS = [
    "CREATED",
    "OPEN",
    "GUARANTEED",
    "LOCKED",
    "SETTLED",
] as const;


export const updateJackpotDraw = onCall(
    { region: "asia-south1", timeoutSeconds: 30 },
    async (request) => {
        const { auth, data } = request;

        /* ---------------- AUTH ---------------- */
        if (!auth) {
            throw new HttpsError("unauthenticated", "Authentication required");
        }

        /* ---------------- INPUT ---------------- */
        const {
            drawId,
            name,
            drawDate,
            time,
            ticketPrice,
            digits,
            jackpotAmount,
            guaranteedSalesPct,
            maxExtensions,
            recurring,
            prizeTiers,
            status,
        } = data;

        if (!drawId) {
            throw new HttpsError("invalid-argument", "drawId is required");
        }

        if (
            !name ||
            !drawDate ||
            !time ||
            typeof ticketPrice !== "number" ||
            typeof digits !== "number" ||
            typeof jackpotAmount !== "number" ||
            typeof guaranteedSalesPct !== "number" ||
            typeof maxExtensions !== "number" ||
            !Array.isArray(prizeTiers)
        ) {
            throw new HttpsError(
                "invalid-argument",
                "Missing or invalid updateJackpotDraw parameters"
            );
        }

        if (status && !ALLOWED_STATUS.includes(status)) {
            throw new HttpsError("invalid-argument", "Invalid jackpot status");
        }

        /* ---------------- REFERENCES ---------------- */
        const drawRef = db.collection("jackpotDraws").doc(drawId);

        await db.runTransaction(async (tx) => {
            const snap = await tx.get(drawRef);

            if (!snap.exists) {
                throw new HttpsError("not-found", "Jackpot draw not found");
            }

            const existing = snap.data()!;

            /* ---------------- STATE GUARDS ---------------- */
            if (existing.status === "SETTLED") {
                throw new HttpsError(
                    "failed-precondition",
                    "Cannot modify a settled jackpot"
                );
            }

            if (
                existing.status === "LOCKED" &&
                status &&
                status !== "SETTLED"
            ) {
                throw new HttpsError(
                    "failed-precondition",
                    "Locked jackpot can only transition to SETTLED"
                );
            }

            /* ---------------- NORMALIZE PRIZE TIERS ---------------- */
            const normalizedTiers = prizeTiers.map((t: any, index: number) => {
                if (
                    typeof t.matchDigits !== "number" ||
                    typeof t.winnersCount !== "number" ||
                    typeof t.prizePerWinner !== "number"
                ) {
                    throw new HttpsError(
                        "invalid-argument",
                        "Invalid prize tier structure"
                    );
                }

                return {
                    index,
                    matchDigits: t.matchDigits,
                    winnersCount: t.winnersCount,
                    prizePerWinner: t.prizePerWinner,
                };
            });

            /* ---------------- UPDATE ---------------- */
            tx.update(drawRef, {
                name,
                drawDate,
                time,

                ticketPrice,
                digits,
                jackpotAmount,
                guaranteedSalesPct,
                maxExtensions,
                recurring,

                prizeTiers: normalizedTiers,

                ...(status && { status }),

                updatedAt: FieldValue.serverTimestamp(),
                updatedBy: auth.uid,
            });
        });

        return { success: true };
    }
);
