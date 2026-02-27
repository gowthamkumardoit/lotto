import { onSchedule } from "firebase-functions/v2/scheduler";
import { Timestamp } from "firebase-admin/firestore";
import { db } from "../../lib/firebaseAdmin";

export const releaseExpiredHolds = onSchedule(
  {
    schedule: "every 1 minutes",
    region: "asia-south1",
  },
  async () => {
    const now = Timestamp.now();

    const slotsSnap = await db.collection("digitDrawSlots").get();

    for (const slot of slotsSnap.docs) {
      const expiredHolds = await slot.ref
        .collection("bookedNumbers")
        .where("status", "==", "HOLD")
        .where("holdUntil", "<", now)
        .get();

      for (const seat of expiredHolds.docs) {
        await seat.ref.delete();
      }
    }
  },
);
