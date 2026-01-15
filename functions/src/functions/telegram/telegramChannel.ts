import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import axios from "axios";

const TELEGRAM_BOT_TOKEN = defineSecret("TELEGRAM_BOT_TOKEN");

// Optional: store channel id as secret too
const TELEGRAM_CHANNEL_ID = defineSecret("TELEGRAM_CHANNEL_ID");

export const postToTelegramChannel = onRequest(
  {
    region: "asia-south1",
    secrets: [TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID],
  },
  async (req, res) => {
    try {
      const token = TELEGRAM_BOT_TOKEN.value();
      const channelId = TELEGRAM_CHANNEL_ID.value();

      await axios.post(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          chat_id: channelId,
          text: req.body.text ?? "📢 Lottery update",
        }
      );

      res.status(200).send("POSTED");
    } catch (err) {
      console.error(err);
      res.status(500).send("FAILED");
    }
  }
);
