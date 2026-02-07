import { onCall, HttpsError } from "firebase-functions/v2/https";
import {
    TELEGRAM_SUPPORT_BOT_TOKEN,
    TELEGRAM_SUPPORT_CHAT_ID,
} from "./secrets";

export const sendSupportMessage = onCall(
    {
        region: "asia-south1",
        secrets: [
            TELEGRAM_SUPPORT_BOT_TOKEN,
            TELEGRAM_SUPPORT_CHAT_ID,
        ],
    },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "Login required");
        }

        const message = request.data?.message?.trim();
        if (!message) {
            throw new HttpsError("invalid-argument", "Message required");
        }

        const text = `
📩 New Support Message
👤 User: ${request.auth.uid}
💬 Message:
${message}
    `;

        await fetch(
            `https://api.telegram.org/bot${TELEGRAM_SUPPORT_BOT_TOKEN.value()}/sendMessage`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: TELEGRAM_SUPPORT_CHAT_ID.value(),
                    text,
                    parse_mode: "Markdown",
                }),
            }
        );

        return { success: true };
    }
);
