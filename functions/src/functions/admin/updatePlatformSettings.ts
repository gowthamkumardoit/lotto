import { onCall } from "firebase-functions/v2/https";
import { admin, db } from "../../lib/firebaseAdmin";

import { logAdminActivity } from "../../helpers/logAdminActivity";
import { sendAdminNotification } from "../../helpers/sendAdminNotification";
import { requireAdminAuth } from "../../helpers/requireAdminAuth";

export const updatePlatformSettings = onCall(
  { region: "asia-south1" },
  async (request) => {
    const adminAuth = requireAdminAuth(request);
    const { data } = request;

    if (!data) {
      throw new Error("No settings provided");
    }

    const ref = db.collection("platformConfig").doc("global");

    /* ---------------- Update Settings ---------------- */

    await ref.set(
      {
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: adminAuth.uid,
      },
      { merge: true }
    );

    /* ---------------- Activity Log ---------------- */

    await logAdminActivity({
      db,
      payload: {
        actorId: adminAuth.uid,
        actorType: "admin",
        action: "UPDATE_PLATFORM_SETTINGS",
        entity: "platformConfig",
        entityId: "global",
        metadata: {
          updatedKeys: Object.keys(data),
        },
      },
    });

    /* ---------------- Notification ---------------- */

    await sendAdminNotification({
      db,
      payload: {
        title: "Platform settings updated",
        message: "An admin updated global platform configuration.",
        type: "info",
        actionUrl: "/admin/settings",
      },
    });

    return { success: true };
  }
);
