import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { db } from "../../lib/firebaseAdmin";
import { getWinnerMessage } from "../../helpers/getWinnerMessage";
import { sendUserNotification } from "../notifications/sendPush";

/* ─────────────────────────────────────────────
   GLOBAL OPTIONS
   ───────────────────────────────────────────── */
setGlobalOptions({
  region: "asia-south1",
  memory: "512MiB",
  timeoutSeconds: 60,
});

/* ─────────────────────────────────────────────
   TYPES
   ───────────────────────────────────────────── */
type NumberType = "2D" | "3D" | "4D";

type SettledResult = {
  number: string;
  winners: number;
  totalWinAmount: number;
};


/* ─────────────────────────────────────────────
   FUNCTION
   ───────────────────────────────────────────── */
export const settleDrawRun = onCall(
  { region: "asia-south1" },
  async ({ data, auth }) => {

    const winnerNotifications: {
      uid: string;
      title: string;
      body: string;
      ticketId: string;
    }[] = [];

    if (!auth) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }

    const { drawRunId } = data as { drawRunId?: string };
    if (!drawRunId) {
      throw new HttpsError("invalid-argument", "drawRunId is required");
    }

    const drawRunRef = db.collection("drawRuns").doc(drawRunId);

    /* ───────── STEP 1: READ DRAW RUN ───────── */
    const drawRunSnap = await drawRunRef.get();
    if (!drawRunSnap.exists) {
      throw new HttpsError("not-found", "Draw run not found");
    }

    const drawRun = drawRunSnap.data()!;

    if (drawRun.status === "SETTLED") {
      return { status: "ALREADY_SETTLED" };
    }

    if (drawRun.status !== "DRAWN") {
      throw new HttpsError(
        "failed-precondition",
        "Draw must be DRAWN to settle"
      );
    }

    if (!drawRun.result || !drawRun.drawId) {
      throw new HttpsError(
        "failed-precondition",
        "Draw result or drawId missing"
      );
    }

    /* ───────── STEP 2: READ DRAW CONFIG ───────── */
    const drawSnap = await db
      .collection("draws")
      .doc(drawRun.drawId)
      .get();

    if (!drawSnap.exists) {
      throw new HttpsError("not-found", "Draw config not found");
    }

    const config = drawSnap.data()!.config;
    if (!config) {
      throw new HttpsError(
        "failed-precondition",
        "Draw config missing"
      );
    }

    /* ───────── STEP 3: READ ALL TICKETS ───────── */
    const ticketsSnap = await db
      .collection("tickets")
      .where("drawRunId", "==", drawRunId)
      .get();

    if (ticketsSnap.empty) {
      throw new HttpsError(
        "failed-precondition",
        "No tickets found for this draw"
      );
    }

    /* ───────── STEP 4: LOCK DRAW RUN (TX) ───────── */
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(drawRunRef);
      if (snap.data()?.status !== "DRAWN") {
        throw new HttpsError(
          "failed-precondition",
          "Draw already settling"
        );
      }
      tx.update(drawRunRef, { status: "SETTLING" });
    });

    /* ───────── STEP 5: SETTLE TICKETS (BATCHED) ───────── */
    const settled: Record<NumberType, SettledResult> = {
      "2D": { number: drawRun.result["2D"], winners: 0, totalWinAmount: 0 },
      "3D": { number: drawRun.result["3D"], winners: 0, totalWinAmount: 0 },
      "4D": { number: drawRun.result["4D"], winners: 0, totalWinAmount: 0 },
    };


    let totalPayout = 0;
    const BATCH_SIZE = 400;

    for (let i = 0; i < ticketsSnap.docs.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const slice = ticketsSnap.docs.slice(i, i + BATCH_SIZE);

      for (const ticketDoc of slice) {
        const ticket = ticketDoc.data();

        if (ticket.status !== "LOCKED") continue;

        const type = ticket.type as NumberType;
        const winningNumber = settled[type].number;

        if (ticket.number === winningNumber) {
          const multiplier = config[`multiplier${type}`];
          const winAmount = ticket.amount * multiplier;

          settled[type].winners += 1;
          settled[type].totalWinAmount += winAmount;
          totalPayout += winAmount;

          // ✅ Update ticket
          batch.update(ticketDoc.ref, {
            status: "WON",
            winAmount,
          });

          // ✅ CREDIT wallet transaction
          const walletTxnRef = db.collection("walletTxns").doc();
          batch.set(walletTxnRef, {
            userId: ticket.userId,
            type: "CREDIT",
            amount: winAmount,
            reason: `${type} Ticket Win`,
            referenceId: `${drawRunId}_${ticketDoc.id}`,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // ✅ Update user wallet balance
          const userRef = db.collection("users").doc(ticket.userId);
          batch.update(userRef, {
            walletBalance: admin.firestore.FieldValue.increment(winAmount),
          });

          const { title, body } = getWinnerMessage(
            type,
            ticket.number,
            winAmount
          );

          winnerNotifications.push({
            uid: ticket.userId,
            ticketId: ticketDoc.id,
            title,
            body,
          });

          // ✅ Create winner record
          const winnerRef = db.collection("winners").doc();
          batch.set(winnerRef, {
            drawRunId,
            drawId: drawRun.drawId,

            ticketId: ticketDoc.id,
            userId: ticket.userId,

            type,
            number: ticket.number,

            betAmount: ticket.amount,
            multiplier,
            winAmount,

            settledAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
        else {
          batch.update(ticketDoc.ref, {
            status: "LOST",
            winAmount: 0,
          });
        }
      }

      await batch.commit();
    }


    /* ───────── STEP 6: FINALIZE DRAW RUN ───────── */
    await drawRunRef.update({
      status: "SETTLED",
      settledAt: admin.firestore.FieldValue.serverTimestamp(),
      totalPayout,
      settledResult: settled,
    });

    /* ───────── STEP 7: SEND WINNER NOTIFICATIONS (NON-BLOCKING) ───────── */
    for (const notif of winnerNotifications) {
      sendUserNotification(notif.uid, notif.title, notif.body, {
        action: "ticket_won",
        screen: "history",
        id: notif.ticketId,
      });
    }

    /* ───────── AUDIT: SETTLED (FINAL STEP) ───────── */
    await db.collection("drawRunAudits").add({
      drawRunId,
      action: "SETTLED",
      message: "Draw settled and winners finalized",
      actor: auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      status: "SETTLED",
      totalPayout,
      settledResult: settled,
    };
  }
);
