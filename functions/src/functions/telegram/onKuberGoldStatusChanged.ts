import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import axios from "axios";
import { db } from "../../lib/firebaseAdmin";
import { formatKuberGoldSettledResult } from "../../helpers/formatKuberGoldSettlementSummary";

const TELEGRAM_KUBER_BOT_TOKEN = defineSecret("TELEGRAM_KUBER_BOT_TOKEN");

const TELEGRAM_CHANNEL_EN_TA = defineSecret("TELEGRAM_CHANNEL_EN_TA");
const TELEGRAM_CHANNEL_EN_HI = defineSecret("TELEGRAM_CHANNEL_EN_HI");
const TELEGRAM_CHANNEL_EN_KN = defineSecret("TELEGRAM_CHANNEL_EN_KN");
const TELEGRAM_CHANNEL_EN_ML = defineSecret("TELEGRAM_CHANNEL_EN_ML");
const TELEGRAM_CHANNEL_EN_TE = defineSecret("TELEGRAM_CHANNEL_EN_TE");

const ALLOWED_STATUSES = ["OPEN", "LOCKED", "DRAWN", "SETTLED"] as const;

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
    if (!ALLOWED_STATUSES.includes(after.status)) return;

    const token = TELEGRAM_KUBER_BOT_TOKEN.value();

    /* ───────── LOAD TEMPLATE CONFIG ───────── */

    const configSnap = await db.doc("platformConfig/global").get();
    const telegram = configSnap.data()?.notifications?.telegram;

    if (!telegram?.templates) return;

    const templatesForStatus = telegram.templates[after.status];
    if (!templatesForStatus) return;

    const resultText =
      after.status === "SETTLED"
        ? formatKuberGoldSettledResult(after.settlementSummary)
        : "";

    /* ───────── CHANNEL → LANGUAGE MAPPING ───────── */

    const channelLanguageMap = [
      {
        channelId: TELEGRAM_CHANNEL_EN_TA.value(),
        languages: ["en", "ta"],
      },
      {
        channelId: TELEGRAM_CHANNEL_EN_HI.value(),
        languages: ["en", "hi"],
      },
      {
        channelId: TELEGRAM_CHANNEL_EN_KN.value(),
        languages: ["en", "kn"],
      },
      {
        channelId: TELEGRAM_CHANNEL_EN_ML.value(),
        languages: ["en", "ml"],
      },
      {
        channelId: TELEGRAM_CHANNEL_EN_TE.value(),
        languages: ["en", "te"],
      },
    ];

    /* ───────── SEND TO EACH CHANNEL ───────── */

    for (const channel of channelLanguageMap) {
      let message = "";

      for (const lang of channel.languages) {
        const template = templatesForStatus[lang];
        if (!template) continue;

        const text = template
          .replaceAll("{{name}}", after.name ?? "")
          .replaceAll("{{result}}", resultText ?? "");

        message += text.trim() + "\n\n";
      }

      if (!message.trim()) continue;

      try {
        console.log("chat_id", Number(channel.channelId));
        console.log("text", message);
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
          chat_id: Number(channel.channelId),
          text: message.trim(),
          disable_web_page_preview: true,
        });
      } catch (error: any) {
        console.error(
          "Telegram Error:",
          error?.response?.data || error.message,
        );
      }
    }
  },
);
