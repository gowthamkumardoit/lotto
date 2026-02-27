import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../lib/firebaseAdmin";
import { sendUserNotification } from "../notifications/sendPush";

export const grantSignupBonus = functions
  .auth.user()
  .onCreate(async (user) => {
    const userId = user.uid;

    const bonusQuery = await db
      .collection("bonuses")
      .where("status", "==", "ACTIVE")
      .where("title", "==", "Signup")
      .limit(1)
      .get();

    if (bonusQuery.empty) {
      console.log("No active signup bonus found");
      return;
    }

    const bonusDoc = bonusQuery.docs[0];
    const bonus = bonusDoc.data();
    const amount = bonus.amount ?? 0;
    const validDays = bonus.validDays ?? 7; // fallback

    if (amount <= 0) return;

    const userRef = db.collection("users").doc(userId);

    // 🕒 Compute expiry
    const expiresAt = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + validDays * 24 * 60 * 60 * 1000)
    );

    await db.runTransaction(async (tx) => {
      // Prevent duplicate signup bonus
      const existingBonus = await tx.get(
        userRef
          .collection("bonuses")
          .where("bonusId", "==", bonusDoc.id)
          .limit(1)
      );

      if (!existingBonus.empty) {
        console.log("Signup bonus already granted");
        return;
      }

      // 💰 Increase user's bonus balance
      tx.set(
        userRef,
        {
          bonusBalance: FieldValue.increment(amount),
        },
        { merge: true }
      );

      // 🎁 Create user bonus entry
      const userBonusRef = userRef.collection("bonuses").doc();

      tx.set(userBonusRef, {
        bonusId: bonusDoc.id,
        amount,
        remaining: amount,
        status: "ACTIVE",
        expiresAt,
        createdAt: FieldValue.serverTimestamp(),
      });

      // 🧾 Wallet transaction audit
      tx.set(db.collection("walletTxns").doc(), {
        userId,
        amount,
        type: "BONUS",
        reason: "Signup Bonus",
        referenceId: userBonusRef.id,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    await sendUserNotification(
      userId,
      "🎁 Signup Bonus Credited",
      `₹${amount} bonus added. Valid for ${validDays} days.`,
      {
        screen: "wallet",
        action: "signup_bonus",
      }
    );

    console.log(`Signup bonus ₹${amount} granted to ${userId}`);
  });