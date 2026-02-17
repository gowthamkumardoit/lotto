import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../lib/firebaseAdmin";

export const createJackpotDraw = onCall(
  { region: "asia-south1", timeoutSeconds: 30 },
  async (request) => {
    const { auth, data } = request;

    /* ---------------- AUTH ---------------- */
    if (!auth) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }

    /* ---------------- INPUT ---------------- */
    const {
      name,
      drawDate,
      time,
      ticketPrice,
      digits,
      jackpotAmount,
      guaranteedSalesPct,
      maxExtensions,
      recurring,
      prizeTiers,
    } = data;

    if (
      !name ||
      !drawDate ||
      !time ||
      typeof ticketPrice !== "number" ||
      typeof digits !== "number" ||
      typeof jackpotAmount !== "number" ||
      typeof guaranteedSalesPct !== "number" ||
      typeof maxExtensions !== "number" ||
      !Array.isArray(prizeTiers)
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Missing or invalid createJackpotDraw parameters"
      );
    }

    if (digits < 3) {
      throw new HttpsError(
        "failed-precondition",
        "digits must be >= 3"
      );
    }

    if (ticketPrice <= 0 || jackpotAmount <= 0) {
      throw new HttpsError(
        "failed-precondition",
        "ticketPrice and jackpotAmount must be positive"
      );
    }

    /* ---------------- REFERENCES ---------------- */
    const drawsRef = db.collection("jackpotDraws").doc();

    await db.runTransaction(async (tx) => {
      /* ---------------- IDEMPOTENCY GUARD ----------------
         Prevent duplicate draws with same name + date + time
      ---------------------------------------------------- */
      const existing = await tx.get(
        db
          .collection("jackpotDraws")
          .where("name", "==", name)
          .where("drawDate", "==", drawDate)
          .where("time", "==", time)
          .limit(1)
      );

      if (!existing.empty) {
        throw new HttpsError(
          "already-exists",
          "Jackpot draw with same name and time already exists"
        );
      }

      /* ---------------- NORMALIZE PRIZE TIERS ---------------- */
      const normalizedTiers = prizeTiers.map((t: any, index: number) => {
        if (
          typeof t.matchDigits !== "number" ||
          typeof t.winnersCount !== "number" ||
          typeof t.prizePerWinner !== "number"
        ) {
          throw new HttpsError(
            "invalid-argument",
            "Invalid prize tier structure"
          );
        }

        return {
          index,
          matchDigits: t.matchDigits,
          winnersCount: t.winnersCount,
          prizePerWinner: t.prizePerWinner,
        };
      });

      /* ---------------- CREATE DRAW ---------------- */
      tx.set(drawsRef, {
        name,
        drawDate,
        time,

        ticketPrice,
        digits,
        jackpotAmount,
        guaranteedSalesPct,
        maxExtensions,
        recurring,

        prizeTiers: normalizedTiers,

        status: "CREATED",          // CREATED → OPEN → GUARRENTED → LOCKED → SETTLED
        currentExtension: 0,

        ticketsSold: 0,
        totalCollection: 0,

        createdBy: auth.uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return {
      success: true,
      drawId: drawsRef.id,
    };
  }
);
