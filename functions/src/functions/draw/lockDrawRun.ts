import { onCall, HttpsError } from "firebase-functions/v2/https";
import { requireAdminAuth } from "../../helpers/requireAdminAuth";
import { admin, db } from "../../lib/firebaseAdmin";

/**
 * lockDrawRun (Manual - Production Safe)
 *
 * Admin-triggered lock:
 * - Draw status: OPEN → LOCKED (transactional)
 * - All PENDING tickets → LOCKED (batched writes)
 * - Idempotent (safe for double-click)
 * - Audit logged
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

    /* ───────── STEP 1: LOCK DRAW (TX SAFE) ───────── */
    const lockResult = await db.runTransaction(async (tx) => {
      const drawSnap = await tx.get(drawRef);

      if (!drawSnap.exists) {
        throw new HttpsError("not-found", "Draw run not found");
      }

      const draw = drawSnap.data() as {
        status: "OPEN" | "LOCKED" | "RUNNING" | "DRAWN";
      };

      // Idempotent behavior
      if (draw.status === "LOCKED") {
        return "ALREADY_LOCKED";
      }

      if (draw.status !== "OPEN") {
        throw new HttpsError(
          "failed-precondition",
          `Draw must be OPEN to lock. Current status: ${draw.status}`,
        );
      }

      tx.update(drawRef, {
        status: "LOCKED",
        lockedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return "LOCKED";
    });

    if (lockResult === "ALREADY_LOCKED") {
      console.log("Draw already locked. Continuing ticket lock.");
    }

    /* ───────── STEP 2: LOCK TICKETS (BATCH SAFE) ───────── */

    const ticketsSnap = await db
      .collection("tickets")
      .where("drawRunId", "==", drawRunId)
      .where("status", "==", "BOOKED")
      .get();

    const BATCH_SIZE = 400;
    let lockedCount = 0;

    for (let i = 0; i < ticketsSnap.docs.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const slice = ticketsSnap.docs.slice(i, i + BATCH_SIZE);

      for (const ticketDoc of slice) {
        batch.update(ticketDoc.ref, {
          status: "LOCKED",
          lockedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        lockedCount++;
      }

      await batch.commit();
    }

    /* ───────── STEP 3: STORE LOCK SNAPSHOT ───────── */

    await drawRef.update({
      lockedTicketCount: lockedCount,
    });

    /* ───────── STEP 4: AUDIT LOG ───────── */

    await db.collection("drawRunAudits").add({
      drawRunId,
      action: "DRAW_LOCKED_MANUAL",
      message: `Draw locked manually by admin. Tickets locked: ${lockedCount}`,
      actor: adminAuth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: "Draw and tickets locked successfully",
      lockedTicketCount: lockedCount,
    };
  },
);
