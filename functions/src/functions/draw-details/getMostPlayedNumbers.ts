import { onCall } from "firebase-functions/v2/https";
import { db } from "../../lib/firebaseAdmin";
import { requireAdminAuth } from "../../helpers/requireAdminAuth";
import { handleError } from "../../helpers/errors";

export const getMostPlayedNumbers = onCall(
    { region: "asia-south1" },
    async (request) => {
        try {
            requireAdminAuth(request);
            const { drawRunId } = request.data;

            const snap = await db
                .collection("tickets")
                .where("drawRunId", "==", drawRunId)
                .get();

            const map: Record<
                string,
                { type: string; number: string; tickets: number; amount: number }
            > = {};

            snap.forEach((doc) => {
                const t = doc.data();
                const key = `${t.type}_${t.number}`;

                if (!map[key]) {
                    map[key] = {
                        type: t.type,
                        number: t.number,
                        tickets: 0,
                        amount: 0,
                    };
                }

                map[key].tickets += 1;
                map[key].amount += t.amount;
            });

            return {
                items: Object.values(map)
                    .sort((a, b) => b.amount - a.amount)
                   
            };
        } catch (e) {
            throw handleError(e);
        }
    }
);
