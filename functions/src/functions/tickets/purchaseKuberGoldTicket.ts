import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../lib/firebaseAdmin";

export const purchaseKuberGoldTicket = onCall(
  { region: "asia-south1", timeoutSeconds: 30 },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }

    const { slotId, numbers } = data;

    if (!slotId || !numbers) {
      throw new HttpsError("invalid-argument", "Invalid payload");
    }

    const userId = auth.uid;
    const slotRef = db.collection("digitDrawSlots").doc(slotId);
    const userRef = db.collection("users").doc(userId);

    await db.runTransaction(async (tx) => {
      /* ---------------- USER ---------------- */

      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) {
        throw new HttpsError("not-found", "User not found");
      }

      const userData = userSnap.data()!;
      const walletBalance = userData.walletBalance ?? 0;
      const lockedBalance = userData.lockedBalance ?? 0;
      const availableBalance = walletBalance - lockedBalance;
      const totalBonusBalance = userData.bonusBalance ?? 0;

      /* ---------------- SLOT ---------------- */

      const slotSnap = await tx.get(slotRef);
      if (!slotSnap.exists) {
        throw new HttpsError("not-found", "Slot not found");
      }

      const slot = slotSnap.data()!;

      if (slot.status !== "OPEN") {
        throw new HttpsError("failed-precondition", "Draw is not open");
      }

      const ticketPrice = slot.configSnapshot?.ticketPrice ?? 0;
      const digits = slot.digits;

      const ticketNumbers = Object.keys(numbers);
      const ticketCount = ticketNumbers.length;
      const totalAmount = ticketCount * ticketPrice;

      if (ticketCount === 0) {
        throw new HttpsError("invalid-argument", "No numbers selected");
      }

      /* ================= BONUS CALCULATION ================= */

      const maxBonusAllowed = Math.floor(totalAmount * 0.1);

      let bonusToUse = 0;
      let walletToUse = totalAmount;

      if (totalBonusBalance > 0 && maxBonusAllowed > 0) {
        bonusToUse = Math.min(totalBonusBalance, maxBonusAllowed);
        walletToUse = totalAmount - bonusToUse;
      }

      if (availableBalance < walletToUse) {
        throw new HttpsError(
          "failed-precondition",
          "Insufficient wallet balance",
        );
      }

      /* ================= VALIDATE SEATS ================= */

      const seatRefs = ticketNumbers.map((num: string) =>
        slotRef.collection("bookedNumbers").doc(num),
      );

      const seatSnaps = await Promise.all(seatRefs.map((ref) => tx.get(ref)));

      seatSnaps.forEach((seatSnap, index) => {
        const num = ticketNumbers[index];

        if (!seatSnap.exists) {
          throw new HttpsError(
            "failed-precondition",
            `Number ${num} not reserved`,
          );
        }

        const seat = seatSnap.data()!;

        if (seat.userId !== userId) {
          throw new HttpsError(
            "permission-denied",
            `Number ${num} reserved by another user`,
          );
        }

        if (seat.status !== "HOLD") {
          throw new HttpsError("failed-precondition", `Invalid seat state`);
        }

        if (seat.holdUntil.toMillis() < Date.now()) {
          throw new HttpsError("failed-precondition", `Reservation expired`);
        }
      });

      /* ================= APPLY BONUS FIFO ================= */

      if (bonusToUse > 0) {
        const userBonusQuery = await tx.get(
          db
            .collection("users")
            .doc(userId)
            .collection("bonuses")
            .where("status", "==", "ACTIVE")
            .orderBy("expiresAt", "asc"),
        );

        let remainingBonusToDeduct = bonusToUse;

        for (const doc of userBonusQuery.docs) {
          if (remainingBonusToDeduct <= 0) break;

          const bonusData = doc.data();
          const remaining = bonusData.remaining ?? 0;

          if (remaining <= 0) continue;

          const deduction = Math.min(remaining, remainingBonusToDeduct);

          tx.update(doc.ref, {
            remaining: FieldValue.increment(-deduction),
          });

          remainingBonusToDeduct -= deduction;
        }

        // Deduct from user bonusBalance
        tx.update(userRef, {
          bonusBalance: FieldValue.increment(-bonusToUse),
        });
      }

      /* ================= WALLET DEDUCTION ================= */

      tx.update(userRef, {
        walletBalance: FieldValue.increment(-walletToUse),
      });

      /* ================= SEAT BOOKING ================= */

      seatRefs.forEach((seatRef) => {
        tx.update(seatRef, {
          status: "BOOKED",
          holdUntil: null,
        });
      });

      /* ================= LEDGER ENTRIES ================= */

      // Wallet ledger
      if (walletToUse > 0) {
        tx.set(db.collection("walletTxns").doc(), {
          userId,
          amount: -walletToUse,
          type: "DEBIT",
          source: "WALLET",
          reason: `${digits}D KuberGold Ticket Purchase`,
          referenceId: slotId,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      // Bonus ledger
      if (bonusToUse > 0) {
        tx.set(db.collection("walletTxns").doc(), {
          userId,
          amount: -bonusToUse,
          type: "DEBIT",
          source: "BONUS",
          reason: `${digits}D KuberGold Ticket Purchase (Bonus Used)`,
          referenceId: slotId,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      /* ================= SLOT UPDATE ================= */

      tx.update(slotRef, {
        sales: FieldValue.increment(totalAmount),
        totalTickets: FieldValue.increment(ticketCount),
        updatedAt: FieldValue.serverTimestamp(),
      });

      /* ================= CREATE TICKETS ================= */

      ticketNumbers.forEach((num: string) => {
        const ticketRef = db.collection("kuberGoldTickets").doc();

        tx.set(ticketRef, {
          id: ticketRef.id,
          userId,
          slotId,
          number: num,
          amount: ticketPrice,
          type: `${digits}D`,
          status: "BOOKED",
          winAmount: 0,
          createdAt: FieldValue.serverTimestamp(),
          closeAt: slot.closeAt,
        });
      });
    });

    return { success: true };
  },
);
