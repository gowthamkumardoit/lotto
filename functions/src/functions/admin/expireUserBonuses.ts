import * as functions from "firebase-functions/v1";
import { db } from "../../lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export const expireUserBonuses = functions
  .region("asia-south1")
  .pubsub.schedule("every 1 minutes")
  .timeZone("Asia/Kolkata")
  .onRun(async () => {
    const now = new Date();

    // 🔥 Collection Group Query (IMPORTANT)
    const snapshot = await db
      .collectionGroup("bonuses")
      .where("status", "==", "ACTIVE")
      .where("expiresAt", "<=", now)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const batch = db.batch();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const remaining = data.remaining ?? 0;

      // users/{userId}/bonuses/{bonusId}
      const userRef = doc.ref.parent.parent; // 🔥 go up to user doc

      if (!userRef) continue;

      // Deduct remaining bonus from user bonusBalance
      if (remaining > 0) {
        batch.update(userRef, {
          bonusBalance: FieldValue.increment(-remaining),
        });
      }

      // Mark bonus expired
      batch.update(doc.ref, {
        status: "EXPIRED",
        expiredUnused: remaining,
        remaining: 0,
        expiredAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    return null;
  });
