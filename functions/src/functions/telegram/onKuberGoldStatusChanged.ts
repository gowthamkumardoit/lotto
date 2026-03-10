import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";

import { defineSecret } from "firebase-functions/params";
import axios from "axios";
import { db } from "../../lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

import { formatKuberGoldSettledResult } from "../../helpers/formatKuberGoldSettlementSummary";

const TELEGRAM_KUBER_BOT_TOKEN = defineSecret("TELEGRAM_KUBER_BOT_TOKEN");

const TELEGRAM_CHANNEL_EN_TA = defineSecret("TELEGRAM_CHANNEL_EN_TA");
const TELEGRAM_CHANNEL_EN_HI = defineSecret("TELEGRAM_CHANNEL_EN_HI");
const TELEGRAM_CHANNEL_EN_KN = defineSecret("TELEGRAM_CHANNEL_EN_KN");
const TELEGRAM_CHANNEL_EN_ML = defineSecret("TELEGRAM_CHANNEL_EN_ML");
const TELEGRAM_CHANNEL_EN_TE = defineSecret("TELEGRAM_CHANNEL_EN_TE");

const ALLOWED_STATUSES = ["OPEN", "LOCKED", "DRAWN", "SETTLED"] as const;

/* ───────── CHANNEL CONFIG ───────── */

function getChannelLanguageMap() {
  return [
    { channelId: TELEGRAM_CHANNEL_EN_TA.value(), languages: ["en", "ta"] },
    { channelId: TELEGRAM_CHANNEL_EN_HI.value(), languages: ["en", "hi"] },
    { channelId: TELEGRAM_CHANNEL_EN_KN.value(), languages: ["en", "kn"] },
    { channelId: TELEGRAM_CHANNEL_EN_ML.value(), languages: ["en", "ml"] },
    { channelId: TELEGRAM_CHANNEL_EN_TE.value(), languages: ["en", "te"] },
  ];
}

/* ───────── TELEGRAM SENDER ───────── */

async function sendTelegramNotification(after: any) {
  const token = TELEGRAM_KUBER_BOT_TOKEN.value();

  const configSnap = await db.doc("platformConfig/global").get();
  const telegram = configSnap.data()?.notifications?.telegram;

  if (!telegram?.templates) return;

  const templates = telegram.templates[after.status];
  if (!templates) return;

  const resultText =
    after.status === "SETTLED"
      ? formatKuberGoldSettledResult(after.settlementSummary)
      : "";

  const channelMap = getChannelLanguageMap();

  for (const channel of channelMap) {
    let message = "";

    for (const lang of channel.languages) {
      const template = templates[lang];
      if (!template) continue;

      message +=
        template
          .replaceAll("{{name}}", after.name ?? "")
          .replaceAll("{{result}}", resultText ?? "")
          .trim() + "\n\n";
    }

    if (!message.trim()) continue;

    try {
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: Number(channel.channelId),
        text: message.trim(),
        disable_web_page_preview: true,
      });
    } catch (error: any) {
      console.error("Telegram Error:", error?.response?.data || error.message);
    }
  }
}

/* ───────── PUSH BROADCAST ───────── */

async function sendPushBroadcast(after: any) {
  const usersSnap = await db.collection("users").get();

  const tokens: string[] = [];

  usersSnap.forEach((doc) => {
    const token = doc.data()?.fcmToken;
    if (token) tokens.push(token);
  });

  if (!tokens.length) return;

  let title = "";
  let body = "";

  if (after.status === "OPEN") {
    title = `${after.name} is OPEN 🎟`;
    body = "Tickets are now available. Place your bets!";
  }

  if (after.status === "LOCKED") {
    title = `${after.name} Locked ⛔`;
    body = "Ticket sales are now closed.";
  }

  if (after.status === "DRAWN") {
    title = `${after.name} Result Announced 🎉`;
    body = "Check the draw results now!";
  }

  if (after.status === "SETTLED") {
    title = `${after.name} Winners Settled 💰`;
    body = "Winning amounts have been credited.";
  }

  const chunks: string[][] = [];

  for (let i = 0; i < tokens.length; i += 500) {
    chunks.push(tokens.slice(i, i + 500));
  }

  for (const batch of chunks) {
    try {
      await getMessaging().sendEachForMulticast({
        tokens: batch,

        notification: {
          title,
          body,
        },

        data: {
          screen: "home",
          action: "admin_broadcast",
        },

        android: {
          priority: "high",
          notification: {
            channelId: "high_importance_channel",
            sound: "default",
          },
        },

        apns: {
          payload: {
            aps: {
              sound: "default",
            },
          },
        },
      });
    } catch (err) {
      console.error("Push broadcast error", err);
    }
  }
}

/* ───────── SEND PROTECTION ───────── */

async function sendIfNeeded(after: any, ref: any) {
  if (!ALLOWED_STATUSES.includes(after.status)) return;

  if (after.telegramSent?.includes(after.status)) return;

  await sendTelegramNotification(after);
  await sendPushBroadcast(after);

  await ref.update({
    telegramSent: FieldValue.arrayUnion(after.status),
  });
}

/* ───────── CREATE TRIGGER (OPEN) ───────── */

export const onKuberGoldCreated = onDocumentCreated(
  {
    document: "digitDrawSlots/{digitDrawSlotId}",
    region: "asia-south1",
    secrets: [
      TELEGRAM_KUBER_BOT_TOKEN,
      TELEGRAM_CHANNEL_EN_TA,
      TELEGRAM_CHANNEL_EN_HI,
      TELEGRAM_CHANNEL_EN_KN,
      TELEGRAM_CHANNEL_EN_ML,
      TELEGRAM_CHANNEL_EN_TE,
    ],
  },
  async (event) => {
    const after = event.data?.data();
    if (!after) return;

    await sendIfNeeded(after, event.data!.ref);
  },
);

/* ───────── UPDATE TRIGGER (STATUS CHANGE) ───────── */

export const onKuberGoldStatusChanged = onDocumentUpdated(
  {
    document: "digitDrawSlots/{digitDrawSlotId}",
    region: "asia-south1",
    secrets: [
      TELEGRAM_KUBER_BOT_TOKEN,
      TELEGRAM_CHANNEL_EN_TA,
      TELEGRAM_CHANNEL_EN_HI,
      TELEGRAM_CHANNEL_EN_KN,
      TELEGRAM_CHANNEL_EN_ML,
      TELEGRAM_CHANNEL_EN_TE,
    ],
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;
    if (before.status === after.status) return;

    await sendIfNeeded(after, event.data!.after.ref);
  },
);
