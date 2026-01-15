import { onCall } from "firebase-functions/v2/https";
import { requireAdmin } from "../../helpers/auth";
import { admin, db } from "../../lib/firebaseAdmin";

import { logAdminActivity } from "../../helpers/logAdminActivity";
import { sendAdminNotification } from "../../helpers/sendAdminNotification";

export const updatePlatformSettings = onCall(
  { region: "asia-south1" },
  async (request) => {
    const uid = requireAdmin(request);
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
        updatedBy: uid,
      },
      { merge: true }
    );

    /* ---------------- Activity Log ---------------- */

    await logAdminActivity({
      db,
      payload: {
        actorId: uid,
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
