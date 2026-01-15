import { onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { db, admin } from "../lib/firebaseAdmin";
import { validate } from "../helpers/validate";
import { handleError } from "../helpers/errors";
import { requireAdminAuth } from "../helpers/requireAdminAuth";
import { HttpsError } from "firebase-functions/https";

const UpdateDrawSchema = z
  .object({
    drawId: z.string().min(1),
    name: z.string().trim().min(1),
    time: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time"),
  })
  .strict();

export const updateDrawName = onCall(
  { region: "asia-south1" },
  async (request) => {
    try {
      requireAdminAuth(request);

      const { drawId, name, time } = validate(
        UpdateDrawSchema,
        request.data
      );

      const ref = db.collection("draws").doc(drawId);
      const snap = await ref.get();

      if (!snap.exists) {
        throw new HttpsError("not-found", "Draw not found");
      }

      const draw = snap.data()!;

      if (draw.status !== "OPEN") {
        throw new HttpsError(
          "failed-precondition",
          "Only OPEN draws can be edited"
        );
      }

      await ref.update({
        name,
        time,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      throw handleError(error);
    }
  }
);
