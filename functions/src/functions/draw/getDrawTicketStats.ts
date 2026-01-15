import { onCall } from "firebase-functions/v2/https";
import { AggregateField } from "firebase-admin/firestore";
import { requireAdminAuth } from "../../helpers/requireAdminAuth";
import { db } from "../../lib/firebaseAdmin";

export const getDrawTicketStats = onCall(
    { region: "asia-south1" },
    async (req) => {
        requireAdminAuth(req);

        const { drawRunId, result } = req.data as {
            drawRunId: string;
            result: {
                "2D": string;
                "3D": string;
                "4D": string;
            };
        };

        if (!drawRunId || !result) {
            throw new Error("drawRunId and result are required");
        }

        const types = ["2D", "3D", "4D"] as const;

        const queries = types.map((type) =>
            db
                .collection("tickets")
                .where("drawRunId", "==", drawRunId)
                .where("type", "==", type)
                .where("number", "==", result[type])
                .aggregate({
                    winners: AggregateField.count(),
                    totalAmount: AggregateField.sum("amount"),
                })
                .get()
        );

        const snapshots = await Promise.all(queries);

        // 🔥 RETURN DOMAIN SHAPE (NO TRANSPORT SHAPE)
        return {
            "2D": {
                winners: snapshots[0].data().winners ?? 0,
                totalAmount: snapshots[0].data().totalAmount ?? 0,
            },
            "3D": {
                winners: snapshots[1].data().winners ?? 0,
                totalAmount: snapshots[1].data().totalAmount ?? 0,
            },
            "4D": {
                winners: snapshots[2].data().winners ?? 0,
                totalAmount: snapshots[2].data().totalAmount ?? 0,
            },
        };
    }
);
