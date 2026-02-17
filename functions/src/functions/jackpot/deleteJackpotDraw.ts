import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "../../lib/firebaseAdmin";

export const deleteJackpotDraw = onCall(
  { region: "asia-south1", timeoutSeconds: 30 },
  async (request) => {
    const { auth, data } = request;

    /* ---------------- AUTH ---------------- */
    if (!auth) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }

    const { drawId } = data;

    if (!drawId) {
      throw new HttpsError("invalid-argument", "drawId is required");
    }

    const drawRef = db.collection("jackpotDraws").doc(drawId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(drawRef);

      if (!snap.exists) {
        throw new HttpsError("not-found", "Jackpot draw not found");
      }

      const draw = snap.data()!;

      /* ---------------- STATE GUARD ---------------- */
      if (draw.status !== "CREATED") {
        throw new HttpsError(
          "failed-precondition",
          "Only CREATED jackpot draws can be deleted"
        );
      }

      tx.delete(drawRef);
    });

    return { success: true };
  }
);
