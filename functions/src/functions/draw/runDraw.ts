import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { requireAdminAuth } from "../../helpers/requireAdminAuth";
import { admin, db } from "../../lib/firebaseAdmin";


/* ---------------- TYPES ---------------- */

type DrawStatus = "OPEN" | "LOCKED" | "RUNNING" | "DRAWN";

type DrawResult = {
    "2D": string;
    "3D": string;
    "4D": string;
    drawnAt: FirebaseFirestore.Timestamp;
};

/* ---------------- HELPERS ---------------- */

function randomDigits(length: number): string {
    let out = "";
    for (let i = 0; i < length; i++) {
        out += Math.floor(Math.random() * 10);
    }
    return out;
}

/* ---------------- FUNCTION ---------------- */

/**
 * runDraw
 *
 * Preconditions:
 * - Caller must be admin
 * - Draw must exist
 * - Draw must be LOCKED
 *
 * Effects:
 * - status → RUNNING → DRAWN
 * - result stored
 * - timestamps recorded
 */
export const runDraw = onCall(
    {
        region: "asia-south1",
    },
    async (request) => {
        /* ---------- Auth ---------- */
      const adminAuth = requireAdminAuth(request);

        const { drawRunId } = request.data as {
            drawRunId?: string;
        };

        if (!drawRunId) {
            throw new HttpsError(
                "invalid-argument",
                "drawRunId is required"
            );
        }

        const drawRef = db.collection("drawRuns").doc(drawRunId);

        /* ---------- Phase 1: LOCKED → RUNNING ---------- */

        await db.runTransaction(async (tx) => {
            const snap = await tx.get(drawRef);

            if (!snap.exists) {
                throw new HttpsError("not-found", "Draw not found");
            }

            const draw = snap.data() as {
                status: DrawStatus;
            };

            if (draw.status !== "LOCKED") {
                throw new HttpsError(
                    "failed-precondition",
                    `Draw must be LOCKED to run. Current status: ${draw.status}`
                );
            }

            tx.update(drawRef, {
                status: "RUNNING",
                runningAt: FieldValue.serverTimestamp(),
            });
        });

        /* ---------- Phase 2: Generate Results ---------- */

        const result: DrawResult = {
            "2D": randomDigits(2),
            "3D": randomDigits(3),
            "4D": randomDigits(4),
            drawnAt: FieldValue.serverTimestamp() as any,
        };

        /* ---------- Phase 3: RUNNING → DRAWN ---------- */

        await db.runTransaction(async (tx) => {
            const snap = await tx.get(drawRef);

            if (!snap.exists) {
                throw new HttpsError("not-found", "Draw not found");
            }

            const draw = snap.data() as {
                status: DrawStatus;
            };

            if (draw.status !== "RUNNING") {
                throw new HttpsError(
                    "failed-precondition",
                    "Draw is not in RUNNING state"
                );
            }

            tx.update(drawRef, {
                status: "DRAWN",
                result,
                drawnAt: FieldValue.serverTimestamp(),
            });
        });

        /* ───────── AUDIT LOG (AFTER TX) ───────── */

        await db.collection("drawRunAudits").add({
            drawRunId,
            action: "DRAW_RUN_MANUAL",
            message: "Draw Ran manually by admin",
            actor: adminAuth.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });


        /* ---------- Response ---------- */

        return {
            success: true,
            result,
        };
    }
);
