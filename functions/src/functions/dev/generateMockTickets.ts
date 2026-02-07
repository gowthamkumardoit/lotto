import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { requireAdminAuth } from "../../helpers/requireAdminAuth";
import { db } from "../../lib/firebaseAdmin";

/* ---------------- CONFIG ---------------- */

const TOTAL_TICKETS = 1000;
const BATCH_SIZE = 400;

const TYPE_DISTRIBUTION = {
    "2D": 0.47,
    "3D": 0.38,
    "4D": 0.15,
};

const BET_AMOUNTS = [10, 20, 50, 100, 200];

/* ---------------- HELPERS ---------------- */

function pickType(): "2D" | "3D" | "4D" {
    const r = Math.random();
    if (r < TYPE_DISTRIBUTION["2D"]) return "2D";
    if (r < TYPE_DISTRIBUTION["2D"] + TYPE_DISTRIBUTION["3D"]) return "3D";
    return "4D";
}

function randomNumber(type: "2D" | "3D" | "4D") {
    if (type === "2D") return String(Math.floor(Math.random() * 100)).padStart(2, "0");
    if (type === "3D") return String(Math.floor(Math.random() * 1000)).padStart(3, "0");
    return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

function randomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

/* ---------------- FUNCTION ---------------- */

export const generateMockTickets = onCall(
    { region: "asia-south1", timeoutSeconds: 60 },
    async (request) => {
        requireAdminAuth(request);

        const { drawRunId } = request.data as { drawRunId?: string };
        if (!drawRunId) {
            throw new HttpsError("invalid-argument", "drawRunId is required");
        }

        const drawRef = db.collection("drawRuns").doc(drawRunId);
        const drawSnap = await drawRef.get();

        if (!drawSnap.exists) {
            throw new HttpsError("not-found", "Draw run not found");
        }

        if (drawSnap.data()!.status !== "OPEN") {
            throw new HttpsError(
                "failed-precondition",
                "Draw must be OPEN to generate tickets"
            );
        }

        let created = 0;
        let totalSales = 0;

        while (created < TOTAL_TICKETS) {
            const batch = db.batch();

            for (let i = 0; i < BATCH_SIZE && created < TOTAL_TICKETS; i++) {
                const type = pickType();
                const amount = randomItem(BET_AMOUNTS);

                const ticketRef = db.collection("tickets").doc();

                batch.set(ticketRef, {
                    id: ticketRef.id,
                    drawRunId,
                    userId: `mock_user_${Math.floor(Math.random() * 1500)}`,
                    type,
                    number: randomNumber(type),
                    amount,
                    winAmount: 0,
                    status: "PENDING",
                    createdAt: FieldValue.serverTimestamp(),
                });

                totalSales += amount;
                created++;
            }

            await batch.commit();
        }

        // 🔥 update sales ONCE
        await drawRef.update({
            sales: FieldValue.increment(totalSales),
            updatedAt: FieldValue.serverTimestamp(),
        });

        return {
            success: true,
            created,
            totalSales,
        };
    }
);
