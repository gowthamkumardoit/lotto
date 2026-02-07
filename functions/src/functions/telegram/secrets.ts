import { defineSecret } from "firebase-functions/params";

export const TELEGRAM_SUPPORT_BOT_TOKEN = defineSecret(
  "TELEGRAM_SUPPORT_BOT_TOKEN"
);

export const TELEGRAM_SUPPORT_CHAT_ID = defineSecret(
  "TELEGRAM_SUPPORT_CHAT_ID"
);
