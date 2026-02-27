import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "../../lib/firebaseAdmin";

export const updateKuberGoldCloseTime = onCall(
  { region: "asia-south1", timeoutSeconds: 30 },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }

    const { slotId, newCloseAt } = data;

    if (!slotId || !newCloseAt) {
      throw new HttpsError(
        "invalid-argument",
        "slotId and newCloseAt are required"
      );
    }

    const slotRef = db.collection("digitDrawSlots").doc(slotId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(slotRef);

      if (!snap.exists) {
        throw new HttpsError("not-found", "KuberGold slot not found");
      }

      const slot = snap.data()!;

      // 🛑 Prevent editing settled/cancelled slots
      if (["SETTLED", "CANCELLED"].includes(slot.status)) {
        throw new HttpsError(
          "failed-precondition",
          `Cannot modify slot in ${slot.status} state`
        );
      }

      const openAt =
        slot.openAt?.toDate?.() || new Date(slot.openAt);

      const proposedClose = new Date(newCloseAt);

      if (proposedClose <= openAt) {
        throw new HttpsError(
          "failed-precondition",
          "Close time must be after open time"
        );
      }

      // ⛔ Optional guard: do not reduce below current time
      if (proposedClose.getTime() <= Date.now()) {
        throw new HttpsError(
          "failed-precondition",
          "Close time must be in the future"
        );
      }

      // ✅ Update Close Time
      tx.update(slotRef, {
        closeAt: Timestamp.fromDate(proposedClose),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: auth.uid,
      });

      // 🧾 Optional audit trail (recommended for admin ops)
      tx.set(db.collection("adminAuditLogs").doc(), {
        action: "KUBERGOLD_CLOSE_TIME_UPDATED",
        slotId,
        previousCloseAt: slot.closeAt,
        newCloseAt: Timestamp.fromDate(proposedClose),
        performedBy: auth.uid,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return { success: true };
  }
);