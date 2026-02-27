import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../lib/firebaseAdmin";
import { sendUserNotification } from "../notifications/sendPush";

setGlobalOptions({
  region: "asia-south1",
  memory: "512MiB",
  timeoutSeconds: 60,
});

export const declareDigitDrawWinners = onCall(
  { region: "asia-south1" },
  async (request) => {
    const { slotId } = request.data as { slotId?: string };

    if (!slotId) {
      throw new HttpsError("invalid-argument", "slotId is required");
    }

    const slotRef = db.collection("digitDrawSlots").doc(slotId);
    const slotSnap = await slotRef.get();

    if (!slotSnap.exists) {
      throw new HttpsError("not-found", "Slot not found");
    }

    const slot = slotSnap.data() as any;

    if (slot.status === "SETTLED") {
      return { status: "ALREADY_SETTLED" };
    }

    if (slot.status !== "DRAWN" && slot.status !== "SETTLING") {
      throw new HttpsError(
        "failed-precondition",
        "Slot must be DRAWN to declare winners",
      );
    }

    const rawWinningNumber = slot?.result?.winningNumber;
    if (!rawWinningNumber) {
      throw new HttpsError("failed-precondition", "Winning number missing");
    }

    const digits = Number(slot.digits);
    const prizes = slot.configSnapshot?.prizes;

    if (!prizes) {
      throw new HttpsError("failed-precondition", "Prize config missing");
    }

    /* ───────── LOCK SLOT (IDEMPOTENT) ───────── */

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(slotRef);
      const data = snap.data();

      if (!data) throw new HttpsError("not-found", "Slot not found");

      if (data.status === "SETTLED" || data.status === "SETTLING") return;

      if (data.status !== "DRAWN") {
        throw new HttpsError("failed-precondition", "Invalid slot state");
      }

      tx.update(slotRef, {
        status: "SETTLING",
        settlementStartedAt: FieldValue.serverTimestamp(),
      });
    });

    /* ───────── NORMALIZE WINNING NUMBER ───────── */

    const normalizedWinning = String(rawWinningNumber).padStart(digits, "0");

    /* ───────── DYNAMIC SUFFIX LOGIC ───────── */

    let secondPrizeSuffix: string | null = null;
    let thirdPrizeSuffix: string | null = null;

    if (digits === 4) {
      secondPrizeSuffix = normalizedWinning.slice(-3);
      thirdPrizeSuffix = normalizedWinning.slice(-2);
    } else if (digits === 3) {
      secondPrizeSuffix = normalizedWinning.slice(-2);
      thirdPrizeSuffix = normalizedWinning.slice(-1);
    } else if (digits === 2) {
      secondPrizeSuffix = normalizedWinning.slice(-1);
      thirdPrizeSuffix = null;
    }

    let totalPayout = 0;
    let exactCount = 0;
    let minusOneCount = 0; // 2nd prize
    let minusTwoCount = 0; // 3rd prize

    const winnerNotifications: any[] = [];

    /* ───────── PAGINATED PROCESSING ───────── */

    let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;

    while (true) {
      let query = db
        .collection("kuberGoldTickets")
        .where("slotId", "==", slotId)
        .where("status", "==", "LOCKED")
        .limit(500);

      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snap = await query.get();
      if (snap.empty) break;

      const batch = db.batch();

      for (const ticketDoc of snap.docs) {
        const ticket = ticketDoc.data();
        const ticketNumber = String(ticket.number).padStart(digits, "0");

        let winAmount = 0;
        let prizeType: string | null = null;

        // 🥇 Exact
        if (ticketNumber === normalizedWinning) {
          winAmount = prizes.exact || 0;
          exactCount++;
          prizeType = "EXACT";
        }
        // 🥈 Second Prize
        else if (
          secondPrizeSuffix &&
          ticketNumber.slice(-secondPrizeSuffix.length) === secondPrizeSuffix
        ) {
          winAmount = prizes.minusOne || 0;
          minusOneCount++;
          prizeType = "MINUS_ONE";
        }
        // 🥉 Third Prize
        else if (
          thirdPrizeSuffix &&
          ticketNumber.slice(-thirdPrizeSuffix.length) === thirdPrizeSuffix
        ) {
          winAmount = prizes.minusTwo || 0;
          minusTwoCount++;
          prizeType = "MINUS_TWO";
        }

        if (winAmount > 0) {
          totalPayout += winAmount;

          batch.update(ticketDoc.ref, {
            status: "WON",
            winAmount,
            prizeType,
          });

          const userRef = db.collection("users").doc(ticket.userId);

          batch.update(userRef, {
            walletBalance: FieldValue.increment(winAmount),
          });

          batch.set(db.collection("walletTxns").doc(), {
            userId: ticket.userId,
            type: "CREDIT",
            amount: winAmount,
            reason: "Digit Draw Win",
            referenceId: `${slotId}_${ticketDoc.id}`,
            createdAt: FieldValue.serverTimestamp(),
          });

          batch.set(db.collection("digitDrawWinners").doc(), {
            slotId,
            ticketId: ticketDoc.id,
            userId: ticket.userId,
            number: ticketNumber,
            prizeType,
            winAmount,
            settledAt: FieldValue.serverTimestamp(),
          });

          winnerNotifications.push({
            uid: ticket.userId,
            ticketId: ticketDoc.id,
            amount: winAmount,
          });
        } else {
          batch.update(ticketDoc.ref, {
            status: "LOST",
            winAmount: 0,
          });
        }
      }

      await batch.commit();
      lastDoc = snap.docs[snap.docs.length - 1];
    }

    /* ───────── FINALIZE SLOT ───────── */

    await slotRef.update({
      status: "SETTLED",
      "result.isDeclared": true,
      settledAt: FieldValue.serverTimestamp(),
      totalPayout,
      settlementSummary: {
        winningNumber: normalizedWinning,
        exactWinners: exactCount,
        minusOneWinners: minusOneCount,
        minusTwoWinners: minusTwoCount,
      },
    });

    /* ───────── NOTIFICATIONS ───────── */

    for (const notif of winnerNotifications) {
      await sendUserNotification(
        notif.uid,
        "🎉 You Won!",
        `You won ₹${notif.amount} in Digit Draw`,
        {
          action: "ticket_won",
          screen: "history",
          id: notif.ticketId,
        },
      );
    }

    return {
      status: "SETTLED",
      totalPayout,
      summary: {
        exactWinners: exactCount,
        minusOneWinners: minusOneCount,
        minusTwoWinners: minusTwoCount,
      },
    };
  },
);
