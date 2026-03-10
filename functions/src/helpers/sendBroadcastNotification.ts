import { getMessaging } from "firebase-admin/messaging";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

export async function sendBroadcastNotification(
  title: string,
  body: string,
  data: Record<string, string> = {},
) {
  const usersSnap = await db.collection("users").get();

  const tokens: string[] = [];

  usersSnap.forEach((doc) => {
    const token = doc.data().fcmToken;
    if (token) tokens.push(token);
  });

  if (!tokens.length) return;

  // FCM allows max 500 tokens per request
  const chunks = [];

  for (let i = 0; i < tokens.length; i += 500) {
    chunks.push(tokens.slice(i, i + 500));
  }

  for (const batch of chunks) {
    await getMessaging().sendEachForMulticast({
      tokens: batch,

      notification: {
        title,
        body,
      },

      data,

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
  }
}