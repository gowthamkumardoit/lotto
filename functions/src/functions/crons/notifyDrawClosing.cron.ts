import { onSchedule } from "firebase-functions/v2/scheduler";
import { db } from "../../lib/firebaseAdmin";
import { sendUserNotification } from "../notifications/sendPush";

function minutesBetween(a: Date, b: Date) {
  return Math.floor((b.getTime() - a.getTime()) / 60000);
}

export const notifyDrawClosing = onSchedule(
  {
    schedule: "every 5 minutes",
    timeZone: "Asia/Kolkata",
    region: "asia-south1",
  },
  async () => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    const snap = await db
      .collection("drawRuns")
      .where("date", "==", today)
      .where("status", "==", "OPEN")
      .where("lockNotified", "==", false)
      .get();

    if (snap.empty) return;

    for (const doc of snap.docs) {
      const draw = doc.data();
      const drawTime = new Date(`${draw.date}T${draw.time}:00`);
      const minsLeft = minutesBetween(now, drawTime);

      // 🔔 Notify only once, 5–10 min window
      if (minsLeft <= 10 && minsLeft > 5) {
        const usersSnap = await db.collection("users").get();

        const promises = usersSnap.docs.map((user) =>
          sendUserNotification(
            user.id,
            "⏰ Draw Closing Soon",
            `${draw.name} closes in ${minsLeft} minutes`,
            {
              screen: "home",                // 🔗 Deep-link target
              action: "admin_broadcast",     // 🔔 Generic system broadcast
              id: doc.id,                    // drawRunId (optional but useful)
            }
          )
        );

        // ✅ Fan-out safely
        await Promise.allSettled(promises);

        await doc.ref.update({ lockNotified: true });
      }
    }
  }
);
