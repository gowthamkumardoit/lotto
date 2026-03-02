import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../lib/firebaseAdmin";

export const purchase3DTicket = onCall(
  { region: "asia-south1", timeoutSeconds: 30 },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }

    if (!data?.drawId || !data?.numbers) {
      throw new HttpsError("invalid-argument", "Invalid payload");
    }

    // 🔒 STRONG TYPING
    const numbers = data.numbers as Record<string, number>;
    const drawRunId = String(data.drawId);
    const userId = auth.uid;

    const totalAmount = Object.values(numbers).reduce(
      (sum, v) => sum + v,
      0
    );

    if (totalAmount <= 0) {
      throw new HttpsError("invalid-argument", "Invalid ticket amount");
    }

    const userRef = db.collection("users").doc(userId);
    const drawRef = db.collection("drawRuns").doc(drawRunId);

    await db.runTransaction(async (tx) => {
      // 👤 USER
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) {
        throw new HttpsError("not-found", "User not found");
      }

      const walletBalance = userSnap.data()!.walletBalance ?? 0;
      const lockedBalance = userSnap.data()!.lockedBalance ?? 0;

      const availableBalance = walletBalance - lockedBalance;

      if (availableBalance < totalAmount) {
        throw new HttpsError(
          "failed-precondition",
          "Insufficient available balance"
        );
      }


      // 🎯 DRAW VALIDATION
      const drawSnap = await tx.get(drawRef);
      if (!drawSnap.exists || drawSnap.data()!.status !== "OPEN") {
        throw new HttpsError(
          "failed-precondition",
          "Draw is not open"
        );
      }

      // 🔻 WALLET DEDUCTION
      tx.update(userRef, {
        walletBalance: FieldValue.increment(-totalAmount),
      });

      // 📈 UPDATE DRAW SALES + TICKET COUNTS
      const ticketCount = Object.keys(numbers).length;

      tx.update(drawRef, {
        sales: FieldValue.increment(totalAmount),
        tickets2D: FieldValue.increment(ticketCount),
        totalTickets: FieldValue.increment(ticketCount),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 🧾 WALLET LEDGER (DEBIT = NEGATIVE)
      tx.set(db.collection("walletTxns").doc(), {
        userId,
        amount: -totalAmount,
        type: "DEBIT",
        reason: "3D Ticket Purchase",
        referenceId: drawRunId,
        createdAt: FieldValue.serverTimestamp(),
      });

      // 🎟️ CREATE 3D TICKETS
      for (const [num, amt] of Object.entries(numbers)) {
        const ticketRef = db.collection("tickets").doc();

        tx.set(ticketRef, {
          id: ticketRef.id,
          userId,
          drawRunId,
          number: num,
          amount: amt,
          type: "3D",
          status: "BOOKED",   // ✅ REQUIRED
          winAmount: 0,        // ✅ REQUIRED
          createdAt: FieldValue.serverTimestamp(),
          lockedAt: drawSnap.data()!.lockedAt ?? null,
        });
      }
    });

    return { success: true };
  }
);
