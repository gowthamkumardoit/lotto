import { onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { db, admin } from "../../lib/firebaseAdmin";
import { validate } from "../../helpers/validate";
import { handleError } from "../../helpers/errors";
import { requireAdminAuth } from "../../helpers/requireAdminAuth";

/* ---------------- SCHEMA ---------------- */

const UpdateDigitDrawConfigSchema = z
  .object({
    digitDrawId: z.string().min(1),

    config: z.object({
      enabled: z.boolean(),

      ticketPrice: z.number().int().min(1, "Ticket price must be ≥ 1"),

      prizes: z.object({
        exact: z.number().min(0),
        minusOne: z.number().min(0),
        minusTwo: z.number().min(0),
      }),

      stats: z.object({
        totalCombinations: z.number().int().positive(),
        maxLiability: z.number().min(0),
        expectedMargin: z.number(),
      }),
    }),
  })
  .strict();

/* ---------------- HELPERS ---------------- */

// Exclusive winner counts (0-match disabled forever)
function exclusiveWinners(match: number, digits: number) {
  if (match === digits) return 1;
  if (match === digits - 1) return 9;
  if (match === digits - 2 && digits - 2 > 0) return 90;
  return 0;
}

/* ---------------- FUNCTION ---------------- */

export const updateDigitDrawConfig = onCall(
  {
    region: "asia-south1",
  },
  async (request) => {
    try {
      console.log("AUTH UID:", request.auth?.uid);

      /** 🔐 Admin only */
      requireAdminAuth(request);

      /** ✅ Validate payload */
      const { digitDrawId, config } = validate(
        UpdateDigitDrawConfigSchema,
        request.data
      );

      /** 🔍 Load draw */
      const drawRef = db.collection("digitDraws").doc(digitDrawId);
      const snap = await drawRef.get();

      if (!snap.exists) {
        throw new Error("Digit draw not found");
      }

      const draw = snap.data()!;
      const digits: number = draw.digits;
      const status: string = draw.status;

      /** 🔒 Lock rules */
      if (status !== "OPEN") {
        throw new Error("Draw configuration is locked");
      }

      const { exact, minusOne, minusTwo } = config.prizes;

      /** 🚫 Prize ordering validation */
      if (exact < minusOne || minusOne < minusTwo) {
        throw new Error(
          "Invalid prize configuration: 1st ≥ 2nd ≥ 3rd required"
        );
      }

      /** 🚫 0-match hard block */
      if (digits - 2 <= 0 && minusTwo > 0) {
        throw new Error("3rd prize is not allowed for this digit draw");
      }

      /** 🧮 Recalculate liability (server-truth) */
      const maxLiability =
        exact * exclusiveWinners(digits, digits) +
        minusOne * exclusiveWinners(digits - 1, digits) +
        minusTwo * exclusiveWinners(digits - 2, digits);

      /** 🧮 Revenue */
      const totalCombinations = Math.pow(10, digits);
      const maxRevenue = totalCombinations * config.ticketPrice;

      /** 🚨 Safety check */
      if (maxLiability > maxRevenue) {
        throw new Error(
          "Invalid configuration: liability exceeds maximum revenue"
        );
      }

      const expectedMargin =
        maxRevenue === 0
          ? 0
          : ((maxRevenue - maxLiability) / maxRevenue) * 100;

      /** 💾 Persist */
      await drawRef.update({
        config: {
          enabled: config.enabled,
          ticketPrice: config.ticketPrice,

          prizes: {
            exact,
            minusOne,
            minusTwo: digits - 2 > 0 ? minusTwo : 0, // hard safety
          },

          stats: {
            totalCombinations,
            maxLiability,
            expectedMargin,
          },
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
      };
    } catch (error) {
      throw handleError(error);
    }
  }
);
