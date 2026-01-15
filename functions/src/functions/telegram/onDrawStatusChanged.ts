import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import axios from "axios";
import { formatSettledResult } from "../../helpers/formatSettledResult";

const TELEGRAM_BOT_TOKEN = defineSecret("TELEGRAM_BOT_TOKEN");
const TELEGRAM_CHANNEL_ID = defineSecret("TELEGRAM_CHANNEL_ID");

export const onDrawStatusChanged = onDocumentUpdated(
    {
        document: "drawRuns/{drawRunId}",
        region: "asia-south1",
        secrets: [TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID],
    },
    async (event) => {
        const before = event.data?.before.data();
        const after = event.data?.after.data();

        if (!before || !after) return;

        // 🚫 Ignore if status didn't change
        if (before.status === after.status) return;

        const token = TELEGRAM_BOT_TOKEN.value();
        const channelId = TELEGRAM_CHANNEL_ID.value();

        let message: string | null = null;

        switch (after.status) {
            case "OPEN":
                message = `📢 New Draw Created!\n\n🎯 ${after.name}\n⏰ ${after.time}`;
                break;

            case "LOCKED":
                message = `🔒 Draw Locked\n\n🎯 ${after.name}\n⛔ Ticket sales closed`;
                break;

            case "DRAWN":
                message = `⏳ Results Incoming!\n\n🎯 ${after.name}\nPlease wait...`;
                break;

            case "SETTLED":

                const resultText = formatSettledResult(after.settledResult);
                message =
                    `🏆 Draw Results Declared!\n\n` +
                    `🎯 ${after.name}\n\n` +
                    resultText;

                break;
        }

        if (!message) return;

        await axios.post(
            `https://api.telegram.org/bot${token}/sendMessage`,
            {
                chat_id: channelId,
                text: message,
            }
        );
    }
);
