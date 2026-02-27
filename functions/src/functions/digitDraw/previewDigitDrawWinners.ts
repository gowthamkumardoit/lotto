import { onCall, HttpsError } from "firebase-functions/v2/https";
import { requireAdminAuth } from "../../helpers/requireAdminAuth";
import { db } from "../../lib/firebaseAdmin";

export const previewDigitDrawWinners = onCall(
  { region: "asia-south1" },
  async (request) => {
    requireAdminAuth(request);

    const { slotId } = request.data as { slotId?: string };

    if (!slotId) {
      throw new HttpsError("invalid-argument", "slotId is required");
    }

    /* ───────── FETCH SLOT ───────── */

    const slotRef = db.collection("digitDrawSlots").doc(slotId);
    const slotSnap = await slotRef.get();

    if (!slotSnap.exists) {
      throw new HttpsError("not-found", "Slot not found");
    }

    const slot = slotSnap.data() as any;

    if (slot.status !== "DRAWN") {
      throw new HttpsError(
        "failed-precondition",
        `Slot must be DRAWN. Current: ${slot.status}`,
      );
    }

    const digits: number = slot.digits;
    const prizes = slot.configSnapshot?.prizes ?? {};
    const ticketPrice = Number(slot.configSnapshot?.ticketPrice) || 0;

    if (!slot?.result?.winningNumber) {
      throw new HttpsError("failed-precondition", "Winning number missing");
    }

    /* ───────── NORMALIZE WINNING NUMBER ───────── */

    const normalizedWinning = String(slot.result.winningNumber).padStart(
      digits,
      "0",
    );

    /* ───────── DYNAMIC SUFFIX LOGIC ───────── */

    let secondPrizeSuffix: string | null = null;
    let thirdPrizeSuffix: string | null = null;

    if (digits === 4) {
      secondPrizeSuffix = normalizedWinning.slice(-3); // 3 digit
      thirdPrizeSuffix = normalizedWinning.slice(-2); // 2 digit
    } else if (digits === 3) {
      secondPrizeSuffix = normalizedWinning.slice(-2); // 2 digit
      thirdPrizeSuffix = normalizedWinning.slice(-1); // 1 digit
    } else if (digits === 2) {
      secondPrizeSuffix = normalizedWinning.slice(-1); // 1 digit
      thirdPrizeSuffix = null; // no 3rd prize
    }

    /* ───────── FETCH LOCKED TICKETS ───────── */

    const ticketsSnap = await db
      .collection("kuberGoldTickets")
      .where("slotId", "==", slotId)
      .where("status", "==", "LOCKED")
      .get();

    const exact: any[] = [];
    const minusOne: any[] = []; // 2nd prize
    const minusTwo: any[] = []; // 3rd prize

    for (const doc of ticketsSnap.docs) {
      const ticket = doc.data();
      const ticketNumber = String(ticket.number).padStart(digits, "0");

      // 🥇 Exact
      if (ticketNumber === normalizedWinning) {
        exact.push({ ...ticket, ticketId: doc.id });
        continue;
      }

      // 🥈 Second Prize
      if (
        secondPrizeSuffix &&
        ticketNumber.slice(-secondPrizeSuffix.length) === secondPrizeSuffix
      ) {
        minusOne.push({ ...ticket, ticketId: doc.id });
        continue;
      }

      // 🥉 Third Prize
      if (
        thirdPrizeSuffix &&
        ticketNumber.slice(-thirdPrizeSuffix.length) === thirdPrizeSuffix
      ) {
        minusTwo.push({ ...ticket, ticketId: doc.id });
      }
    }

    /* ───────── FETCH USER PHONES (BULK) ───────── */

    const allUserIds = [
      ...exact.map((t) => t.userId),
      ...minusOne.map((t) => t.userId),
      ...minusTwo.map((t) => t.userId),
    ];

    const uniqueUserIds = [...new Set(allUserIds)];

    const userSnaps = await Promise.all(
      uniqueUserIds.map((uid) => db.collection("users").doc(uid).get()),
    );

    const userMap: Record<string, string> = {};

    userSnaps.forEach((snap) => {
      if (snap.exists) {
        userMap[snap.id] = snap.data()?.phone ?? "N/A";
      }
    });

    const attachPhone = (arr: any[]) =>
      arr.map((t) => ({
        ticketId: t.ticketId,
        number: String(t.number).padStart(digits, "0"),
        phone: userMap[t.userId] ?? "N/A",
      }));

    const exactWinners = attachPhone(exact);
    const minusOneWinners = attachPhone(minusOne);
    const minusTwoWinners = attachPhone(minusTwo);

    /* ───────── FINANCIAL CALCULATION ───────── */

    const totalTickets = ticketsSnap.size;

    const safeExactPrize = Number(prizes?.exact) || 0;
    const safeMinusOnePrize = Number(prizes?.minusOne) || 0;
    const safeMinusTwoPrize = Number(prizes?.minusTwo) || 0;

    const totalSales = totalTickets * ticketPrice;

    const totalPayout =
      exact.length * safeExactPrize +
      minusOne.length * safeMinusOnePrize +
      minusTwo.length * safeMinusTwoPrize;

    const profit = totalSales - totalPayout;

    /* ───────── RETURN RESPONSE ───────── */

    return {
      success: true,
      winningNumber: normalizedWinning,
      prizes,
      exactWinners,
      minusOneWinners,
      minusTwoWinners,
      totals: {
        totalTickets,
        totalSales,
        totalPayout,
        profit,
      },
    };
  },
);
