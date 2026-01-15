import { onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { db, admin } from "../lib/firebaseAdmin";
import { validate } from "../helpers/validate";
import { handleError } from "../helpers/errors";
import { requireAdminAuth } from "../helpers/requireAdminAuth";

const CreateDrawSchema = z
    .object({
        name: z.string().trim().min(1, "Draw name is required"),
        time: z
            .string()
            .regex(
                /^([01]\d|2[0-3]):([0-5]\d)$/,
                "Invalid time format (HH:mm)"
            ),
    })
    .strict();

export const createDrawName = onCall(
    {
        region: "asia-south1",
    },
    async (request) => {
        try {
            console.log("AUTH UID:", request.auth?.uid);
            /** 🔐 Auth */
            requireAdminAuth(request);

            /** ✅ Validate input */
            const { name, time } = validate(
                CreateDrawSchema,
                request.data
            );

            /** 📄 Create draw */
            const drawRef = db.collection("draws").doc();

            await drawRef.set({
                id: drawRef.id,
                name,
                time, // HH:mm
                status: "OPEN", // OPEN | LOCKED | RUNNING | COMPLETED
                sales: 0,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            return {
                success: true,
                drawId: drawRef.id,
            };
        } catch (error) {
            throw handleError(error);
        }
    }
);
