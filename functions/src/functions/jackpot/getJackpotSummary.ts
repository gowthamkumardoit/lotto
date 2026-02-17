import { onCall } from "firebase-functions/v2/https";
import { db } from "../../lib/firebaseAdmin";
import { requireAdminAuth } from "../../helpers/requireAdminAuth";
import { handleError } from "../../helpers/errors";

export const getJackpotSummary = onCall(
  { region: "asia-south1" },
  async (request) => {
    try {
      requireAdminAuth(request);

      const { jackpotId } = request.data;
      if (!jackpotId) throw new Error("jackpotId required");

      /* ---------------- LOAD JACKPOT ---------------- */
      const jackpotSnap = await db
        .collection("jackpotDraws")
        .doc(jackpotId)
        .get();

      if (!jackpotSnap.exists) {
        throw new Error("Jackpot draw not found");
      }

      const jackpot = jackpotSnap.data()!;

      /* ---------------- LOAD TICKETS ---------------- */
      const ticketsSnap = await db
        .collection("tickets")
        .where("jackpotId", "==", jackpotId)
        .get();

      let totalTickets = 0;
      let totalCollection = 0;
      let totalPayout = 0;
      let winnersCount = 0;

      ticketsSnap.forEach((doc) => {
        const t = doc.data();

        totalTickets++;
        totalCollection += t.amount || 0;

        if (t.winAmount && t.winAmount > 0) {
          totalPayout += t.winAmount;
          winnersCount++;
        }
      });

      /* ---------------- DERIVED METRICS ---------------- */

      const avgTicketValue =
        totalTickets > 0
          ? Math.round(totalCollection / totalTickets)
          : 0;

      const winRate =
        totalTickets > 0
          ? Number(((winnersCount / totalTickets) * 100).toFixed(2))
          : 0;

      const netResult =
        jackpot.status === "SETTLED"
          ? totalCollection - totalPayout
          : null;

      return {
        totalTickets,
        totalCollection,
        jackpotAmount: jackpot.jackpotAmount,
        guaranteedPct: jackpot.guaranteedSalesPct,
        totalPayout: jackpot.status === "SETTLED" ? totalPayout : null,
        winnersCount: jackpot.status === "SETTLED" ? winnersCount : null,
        avgTicketValue,
        winRate,
        netResult,
      };
    } catch (e) {
      throw handleError(e);
    }
  }
);
