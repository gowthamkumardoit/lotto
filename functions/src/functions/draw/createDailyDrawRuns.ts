import { onCall } from "firebase-functions/v2/https";
import { admin, db } from "../../lib/firebaseAdmin";
import { requireAdminAuth } from "../../helpers/requireAdminAuth";
import { handleError } from "../../helpers/errors";

/* ---------------- HELPERS ---------------- */

function getTodayKey(date = new Date()) {
    return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

/* ---------------- FUNCTION ---------------- */

export const createDailyDrawRuns = onCall(
    { region: "asia-south1" },
    async (request) => {
        try {
            /* 🔐 Admin only */
            requireAdminAuth(request);

            const today = getTodayKey();
            const now = admin.firestore.Timestamp.now();

            /* 1️⃣ Fetch base draws */
            const baseSnap = await db
                .collection("draws")
                .where("status", "!=", "DISABLED")
                .where("configured", "==", true)
                .get();

            if (baseSnap.empty) {
                return {
                    success: true,
                    created: 0,
                    message: "No configured draws found",
                };
            }

            let createdCount = 0;
            const batch = db.batch();

            /* 2️⃣ Loop base draws */
            for (const doc of baseSnap.docs) {
                const draw = doc.data();

                const runId = `${doc.id}_${today}`;
                const runRef = db.collection("drawRuns").doc(runId);

                const existing = await runRef.get();
                if (existing.exists) {
                    continue; // 🔁 idempotent
                }

                batch.set(runRef, {
                    id: runId,

                    // reference
                    drawId: doc.id,

                    // identity snapshot
                    name: draw.name,
                    time: draw.time,
                    date: today,

                    // lifecycle
                    status: "OPEN", // OPEN → RUNNING → COMPLETED

                    // financial
                    sales: 0,
                    result: null,

                    // 🔒 config snapshot (CRITICAL)
                    configSnapshot: draw.config,

                    // audit
                    createdAt: now,
                    updatedAt: now,
                });

                createdCount++;
            }

            if (createdCount > 0) {
                await batch.commit();
            }

            return {
                success: true,
                date: today,
                created: createdCount,
            };
        } catch (error) {
            throw handleError(error);
        }
    }
);
