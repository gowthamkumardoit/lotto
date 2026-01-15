import { onCall } from "firebase-functions/v2/https";
import { db } from "../../lib/firebaseAdmin";
import { requireAdminAuth } from "../../helpers/requireAdminAuth";
import { handleError } from "../../helpers/errors";

export const getDrawSummary = onCall(
    { region: "asia-south1" },
    async (request) => {
        try {
            requireAdminAuth(request);

            const { drawRunId } = request.data;
            if (!drawRunId) throw new Error("drawRunId required");

            const ticketsSnap = await db
                .collection("tickets")
                .where("drawRunId", "==", drawRunId)
                .get();

            let totalTickets = 0;
            let totalSales = 0;
            let totalPayout = 0;
            let winnersCount = 0;

            ticketsSnap.forEach((doc) => {
                const t = doc.data();
                totalTickets++;
                totalSales += t.amount || 0;
                if (t.winAmount && t.winAmount > 0) {
                    totalPayout += t.winAmount;
                    winnersCount++;
                }
            });

            const avgTicketValue =
                totalTickets > 0 ? Math.round(totalSales / totalTickets) : 0;

            const winRate =
                totalTickets > 0
                    ? Number(((winnersCount / totalTickets) * 100).toFixed(2))
                    : 0;

            return {
                totalTickets,
                totalSales,
                totalPayout,
                winnersCount,
                avgTicketValue,
                winRate,
                netResult: totalSales - totalPayout,
            };
        } catch (e) {
            throw handleError(e);
        }
    }
);
