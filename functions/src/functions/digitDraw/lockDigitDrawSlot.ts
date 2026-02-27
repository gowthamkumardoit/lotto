import { onCall, HttpsError } from "firebase-functions/v2/https";
import { requireAdminAuth } from "../../helpers/requireAdminAuth";
import { admin, db } from "../../lib/firebaseAdmin";

/**
 * lockDigitDrawSlot (Manual)
 *
 * Admin-triggered lock:
 * - Slot status: BOOKED → LOCKED
 * - All BOOKED tickets → LOCKED
 * - Audit logged (MANUAL)
 */
export const lockDigitDrawSlot = onCall(
  { region: "asia-south1" },
  async (request) => {
    const adminAuth = requireAdminAuth(request);

    const { slotId } = request.data as { slotId?: string };

    if (!slotId) {
      throw new HttpsError("invalid-argument", "slotId is required");
    }

    const slotRef = db.collection("digitDrawSlots").doc(slotId);

    const ticketsQuery = db
      .collection("kuberGoldTickets")
      .where("slotId", "==", slotId)
      .where("status", "==", "BOOKED");

    await db.runTransaction(async (tx) => {

      /* ───────── READ SLOT ───────── */

      const slotSnap = await tx.get(slotRef);

      if (!slotSnap.exists) {
        throw new HttpsError("not-found", "Slot not found");
      }

      const slot = slotSnap.data() as {
        status: "OPEN" | "LOCKED" | "RUNNING" | "SETTLED" | "CANCELLED";
      };

      if (slot.status !== "OPEN") {
        throw new HttpsError(
          "failed-precondition",
          `Slot must be OPEN to lock. Current status: ${slot.status}`
        );
      }

      /* ───────── READ BOOKED TICKETS ───────── */

      const ticketsSnap = await tx.get(ticketsQuery);

      /* ───────── UPDATE SLOT ───────── */

      tx.update(slotRef, {
        status: "LOCKED",
        lockedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      /* ───────── UPDATE TICKETS ───────── */

      for (const ticketDoc of ticketsSnap.docs) {
        tx.update(ticketDoc.ref, {
          status: "LOCKED",
          lockedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });

    /* ───────── AUDIT LOG ───────── */

    await db.collection("digitDrawSlotAudits").add({
      slotId,
      action: "SLOT_LOCKED_MANUAL",
      message: "Digit draw slot locked manually by admin",
      actor: adminAuth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: "Slot and tickets locked successfully",
    };
  }
);
