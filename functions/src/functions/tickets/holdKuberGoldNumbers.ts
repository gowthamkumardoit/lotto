import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "../../lib/firebaseAdmin";

export const holdKuberGoldNumbers = onCall(
  { region: "asia-south1", timeoutSeconds: 30 },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError("unauthenticated", "Auth required");
    }

    const { slotId, numbers } = data;

    if (!slotId || !numbers?.length) {
      throw new HttpsError("invalid-argument", "Invalid payload");
    }

    const userId = auth.uid;
    const slotRef = db.collection("digitDrawSlots").doc(slotId);

    // 🔥 1 Minute Hold
    const holdUntil = Timestamp.fromMillis(
      Date.now() + 60 * 1000
    );

    await db.runTransaction(async (tx) => {

      /* ---------------- READ SLOT ---------------- */

      const slotSnap = await tx.get(slotRef);

      if (!slotSnap.exists) {
        throw new HttpsError("not-found", "Slot not found");
      }

      const slot = slotSnap.data()!;

      if (slot.status !== "OPEN") {
        throw new HttpsError("failed-precondition", "Draw not open");
      }

      /* ---------------- PREPARE SEAT REFS ---------------- */

      const seatRefs = numbers.map((num: string) =>
        slotRef.collection("bookedNumbers").doc(num)
      );

      /* ---------------- READ ALL SEATS FIRST ---------------- */

      const seatSnaps = await Promise.all(
        seatRefs.map((ref: any) => tx.get(ref))
      );

      /* ---------------- VALIDATION (NO WRITES) ---------------- */

      seatSnaps.forEach((seatSnap, index) => {
        const num = numbers[index];

        if (!seatSnap.exists) {
          // No seat exists → safe to create HOLD
          return;
        }

        const seat = seatSnap.data()!;
        const isExpired =
          seat.holdUntil?.toMillis() <= Date.now();
        const isSameUser = seat.userId === userId;

        // ❌ Permanently booked → always block
        if (seat.status === "BOOKED") {
          throw new HttpsError(
            "already-exists",
            `Number ${num} already booked`
          );
        }

        // HOLD logic
        if (seat.status === "HOLD") {

          // ✅ Expired → allow overwrite
          if (isExpired) return;

          // ✅ Same user → allow reselect
          if (isSameUser) return;

          // ❌ Active HOLD by other user
          throw new HttpsError(
            "already-exists",
            `Number ${num} temporarily reserved`
          );
        }
      });

      /* ---------------- WRITES AFTER ALL READS ---------------- */

      seatRefs.forEach((seatRef: any) => {
        tx.set(
          seatRef,
          {
            status: "HOLD",
            userId,
            holdUntil,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      });
    });

    return {
      success: true,
      holdUntil: holdUntil.toMillis(),
      holdDurationSeconds: 60,
    };
  }
);