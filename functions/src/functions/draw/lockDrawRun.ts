import { onCall, HttpsError } from "firebase-functions/v2/https";
import { requireAdminAuth } from "../../helpers/requireAdminAuth";
import { admin, db } from "../../lib/firebaseAdmin";

/**
 * lockDrawRun (Manual)
 *
 * Admin-triggered lock:
 * - Draw status: OPEN → LOCKED
 * - All PENDING tickets → LOCKED
 * - Audit logged (MANUAL)
 */
export const lockDrawRun = onCall(
  { region: "asia-south1" },
  async (request) => {
    const adminAuth = requireAdminAuth(request);

    const { drawRunId } = request.data as { drawRunId?: string };

    if (!drawRunId) {
      throw new HttpsError("invalid-argument", "drawRunId is required");
    }

    const drawRef = db.collection("drawRuns").doc(drawRunId);
    const ticketsQuery = db
      .collection("tickets")
      .where("drawRunId", "==", drawRunId)
      .where("status", "==", "PENDING");

    await db.runTransaction(async (tx) => {
      /* ───────── READS ───────── */

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

      /* ───────── WRITES ───────── */

      tx.update(drawRef, {
        status: "LOCKED",
        lockedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      for (const ticketDoc of ticketsSnap.docs) {
        tx.update(ticketDoc.ref, {
          status: "LOCKED",
          lockedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });

    /* ───────── AUDIT LOG (AFTER TX) ───────── */

    await db.collection("drawRunAudits").add({
      drawRunId,
      action: "DRAW_LOCKED_MANUAL",
      message: "Draw locked manually by admin",
      actor: adminAuth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: "Draw and tickets locked successfully",
    };
  }
);
