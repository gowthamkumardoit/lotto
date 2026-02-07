import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import axios from "axios";
import { db } from "../../lib/firebaseAdmin";
import { formatSettledResult } from "../../helpers/formatSettledResult";

const TELEGRAM_BOT_TOKEN = defineSecret("TELEGRAM_BOT_TOKEN");
const TELEGRAM_CHANNEL_ID = defineSecret("TELEGRAM_CHANNEL_ID");

const ALLOWED_STATUSES = ["OPEN", "LOCKED", "DRAWN", "SETTLED"] as const;

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
    if (before.status === after.status) return;
    if (!ALLOWED_STATUSES.includes(after.status)) return;

    const token = TELEGRAM_BOT_TOKEN.value();
    const channelId = TELEGRAM_CHANNEL_ID.value();

    // Load platform config
    const configSnap = await db.doc("platformConfig/global").get();
    const telegram = configSnap.data()?.notifications?.telegram;

    if (!telegram?.templates) return;

    const templatesForStatus = telegram.templates[after.status];
    if (!templatesForStatus) return;

    // 🔒 Always include English
    const languages: Record<string, boolean> = {
      en: true,
      ...(telegram.languages ?? {}),
    };

    const resultText =
      after.status === "SETTLED"
        ? formatSettledResult(after.settledResult)
        : "";

    let message = "";

    for (const [lang, enabled] of Object.entries(languages)) {
      if (!enabled) continue;

      const template = templatesForStatus[lang];
      if (!template) continue;

      const text = template
        .replaceAll("{{name}}", after.name)
        .replaceAll("{{result}}", resultText ?? "");

      message += text.trim() + "\n\n";
    }

    if (!message.trim()) return;

    await axios.post(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        chat_id: channelId,
        text: message.trim(),
        disable_web_page_preview: true,
      }
    );
  }
);
