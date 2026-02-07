import { onRequest } from "firebase-functions/v2/https";
import { db } from "../../lib/firebaseAdmin";
import { getMessaging } from "firebase-admin/messaging";

export const telegramChatWebhook = onRequest(
  { region: "asia-south1" },
  async (req, res): Promise<void> => {
    console.log("Telegram webhook hit", JSON.stringify(req.body));
    try {
      const msg = req.body?.message;
      if (!msg?.text) {
        res.sendStatus(200);
        return;
      }

      // ✅ ADMIN REPLIED TO A BOT MESSAGE
      const replied = msg.reply_to_message?.text;
      if (!replied) {
        res.sendStatus(200);
        return;
      }

      // 🔍 Extract userId from original bot message
      const match = replied.match(/User:\s([a-zA-Z0-9_-]+)/);
      if (!match) {
        res.sendStatus(200);
        return;
      }

      const userId = match[1];
      const replyText = msg.text;

      const userSnap = await db.collection("users").doc(userId).get();
      if (!userSnap.exists) {
        res.sendStatus(200);
        return;
      }

      const fcmToken = userSnap.data()?.fcmToken;
      if (!fcmToken) {
        res.sendStatus(200);
        return;
      }

      await getMessaging().send({
        token: fcmToken,
        notification: {
          title: "Support Reply",
          body: replyText,
        },
        data: {
          type: "support_reply",
        },
        android: {
          priority: "high", // 🔥 CRITICAL
          notification: {
            channelId: "high_importance_channel", // 🔥 MUST MATCH MANIFEST
            sound: "default",
            visibility: "public",
          },
        },
      });

      res.sendStatus(200);
      return;
    } catch (e) {
      console.error("telegramWebhook error", e);
      res.sendStatus(200);
      return;
    }
  }
);
