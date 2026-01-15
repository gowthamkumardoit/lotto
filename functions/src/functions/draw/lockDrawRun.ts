import { onCall, HttpsError } from "firebase-functions/v2/https";
import { requireAdminAuth } from "../../helpers/requireAdminAuth";
import { db } from "../../lib/firebaseAdmin";


/**
 * lockDrawRun
 *
 * Locks a draw so:
 * - No more tickets can be sold
 * - Draw status: OPEN → LOCKED
 * - All OPEN tickets → LOCKED
 */
export const lockDrawRun = onCall(
  { region: "asia-south1" },
  async (request) => {
    requireAdminAuth(request);

    const { drawRunId } = request.data as { drawRunId?: string };

    if (!drawRunId) {
      throw new HttpsError("invalid-argument", "drawRunId is required");
    }

    const drawRef = db.collection("drawRuns").doc(drawRunId);
    const ticketsQuery = db
      .collection("tickets")
      .where("drawRunId", "==", drawRunId)
      .where("status", "==", "OPEN");

    await db.runTransaction(async (tx) => {
      // ───────── READS FIRST ─────────

      const drawSnap = await tx.get(drawRef);

      if (!drawSnap.exists) {
        throw new HttpsError("not-found", "Draw run not found");
      }

      const draw = drawSnap.data() as {
        status: "OPEN" | "LOCKED" | "RUNNING" | "DRAWN";
      };

      if (draw.status !== "OPEN") {
        throw new HttpsError(
          "failed-precondition",
          `Draw must be OPEN to lock. Current status: ${draw.status}`
        );
      }

      const ticketsSnap = await tx.get(ticketsQuery);

      // ───────── WRITES AFTER ─────────

      tx.update(drawRef, {
        status: "LOCKED",
        lockedAt: new Date(),
      });

      for (const ticketDoc of ticketsSnap.docs) {
        tx.update(ticketDoc.ref, {
          status: "LOCKED",
          lockedAt: new Date(),
        });
      }
    });

    return {
      success: true,
      message: "Draw and tickets locked successfully",
    };
  }
);

