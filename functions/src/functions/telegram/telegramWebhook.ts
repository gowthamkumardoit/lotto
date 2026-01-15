import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import axios from "axios";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";

initializeApp();
const db = getFirestore();

const TELEGRAM_BOT_TOKEN = defineSecret("TELEGRAM_BOT_TOKEN");

export const telegramWebhook = onRequest(
    {
        region: "asia-south1", // India fast region
        secrets: [TELEGRAM_BOT_TOKEN],
        timeoutSeconds: 30,
    },
    async (req, res) => {
        const token = TELEGRAM_BOT_TOKEN.value();
        const TG_API = `https://api.telegram.org/bot${token}`;
        const update = req.body;

        try {
            // 📩 Message
            if (update.message) {
                const chatId = update.message.chat.id;
                const text = update.message.text ?? "";

                // 🔗 Deep link: /start USER_ID
                if (text.startsWith("/start")) {
                    const userId = text.split(" ")[1];

                    if (userId) {
                        await db.collection("users").doc(userId).set(
                            {
                                telegramChatId: chatId,
                                telegramLinkedAt: new Date(),
                            },
                            { merge: true }
                        );

                        await axios.post(`${TG_API}/sendMessage`, {
                            chat_id: chatId,
                            text: "✅ Telegram linked successfully",
                        });
                    }
                }
            }

            // 🔘 Button callback
            if (update.callback_query) {
                const chatId = update.callback_query.message.chat.id;
                const action = update.callback_query.data;

                if (action === "CONFIRM_TICKET") {
                    await axios.post(`${TG_API}/sendMessage`, {
                        chat_id: chatId,
                        text: "🎟️ Ticket confirmed",
                    });
                }
            }

            res.status(200).send("OK");
        } catch (err) {
            console.error("Telegram webhook error", err);
            res.status(500).send("ERROR");
        }
    }
);
