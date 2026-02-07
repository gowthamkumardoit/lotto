import { onSchedule } from "firebase-functions/v2/scheduler";
import { admin, db } from "../../lib/firebaseAdmin";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function parseDrawDateTime(date: string, time: string) {
  // Asia/Kolkata = UTC +05:30
  return new Date(`${date}T${time}:00+05:30`);
}

export const autoLockDraws = onSchedule(
  {
    schedule: "every 1 minutes",
    timeZone: "Asia/Kolkata",
    region: "asia-south1",
  },
  async () => {
    const today = getTodayKey();
    const now = new Date();

    const snap = await db
      .collection("drawRuns")
      .where("date", "==", today)
      .where("status", "==", "OPEN")
      .get();

    if (snap.empty) return;

    const batch = db.batch();

    for (const docSnap of snap.docs) {
      const draw = docSnap.data();
      const drawTime = parseDrawDateTime(draw.date, draw.time);

      if (now >= drawTime) {
        /* -------- UPDATE DRAW RUN -------- */
        batch.update(docSnap.ref, {
          status: "LOCKED",
          lockedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        /* -------- AUDIT LOG -------- */
        const auditRef = db.collection("drawRunAudits").doc();
        batch.set(auditRef, {
          drawRunId: docSnap.id,
          action: "DRAW_LOCKED",
          message: "Draw locked automatically after sales cutoff",
          actor: "SYSTEM",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    await batch.commit();
  }
);
