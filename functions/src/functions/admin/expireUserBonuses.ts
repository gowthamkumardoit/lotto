import * as functions from "firebase-functions/v1";
import { db } from "../../lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export const expireUserBonuses = functions
  .region("asia-south1")
  .pubsub.schedule("every 1 minutes")
  .timeZone("Asia/Kolkata")
  .onRun(async () => {
    const now = new Date();

    console.log("Running user bonus expiry check:", now);

    // 🔥 Collection Group Query (IMPORTANT)
    const snapshot = await db
      .collectionGroup("bonuses")
      .where("status", "==", "ACTIVE")
      .where("expiresAt", "<=", now)
      .get();

    if (snapshot.empty) {
      console.log("No user bonuses to expire");
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
        remaining: 0,
        expiredAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    console.log(`Expired ${snapshot.size} user bonuses`);

    return null;
  });
