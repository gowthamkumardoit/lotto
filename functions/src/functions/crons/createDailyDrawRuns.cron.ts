import { onSchedule } from "firebase-functions/v2/scheduler";
import { admin, db } from "../../lib/firebaseAdmin";

/* ---------------- HELPERS ---------------- */

function getTomorrowKey() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

/* ---------------- CRON FUNCTION ---------------- */

export const createDailyDrawRunsCron = onSchedule(
  {
    schedule: "every day 22:00",
    timeZone: "Asia/Kolkata",
    region: "asia-south1",
  },
  async () => {
    const today = getTomorrowKey();
    const now = admin.firestore.Timestamp.now();

    const baseSnap = await db
      .collection("draws")
      .where("status", "!=", "DISABLED")
      .where("configured", "==", true)
      .get();

    if (baseSnap.empty) return;

    const batch = db.batch();
    let created = 0;

    for (const doc of baseSnap.docs) {
      const draw = doc.data();
      const runId = `${doc.id}_${today}`;
      const runRef = db.collection("drawRuns").doc(runId);

      const exists = await runRef.get();
      if (exists.exists) continue;

      /* -------- CREATE DRAW RUN -------- */
      batch.set(runRef, {
        id: runId,
        drawId: doc.id,
        name: draw.name,
        time: draw.time,
        date: today,
        status: "OPEN",
        sales: 0,
        result: null,
        configSnapshot: draw.config,
        lockNotified: false,
        createdAt: now,
        updatedAt: now,
      });

      /* -------- AUDIT LOG -------- */
      const auditRef = db.collection("drawRunAudits").doc();
      batch.set(auditRef, {
        drawRunId: runId,
        action: "DRAW_CREATED",
        message: "Draw run created by daily scheduler",
        actor: "SYSTEM",
        createdAt: now,
      });

      created++;
    }

    if (created > 0) {
      await batch.commit();
    }
  }
);
