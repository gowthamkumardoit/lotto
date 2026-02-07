import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { db } from "../../lib/firebaseAdmin";
import { requireAdminRoleAuth } from "../../helpers/requireAdminRoleAuth";

export const listRoleAssignments = onCall(
  { region: "asia-south1" },
  async (request) => {
    try {
      // 🔐 Admin auth
      requireAdminRoleAuth(request);

      const data = request.data ?? {};
      const limit = typeof data.limit === "number" ? data.limit : 20;
      const cursor =
        typeof data.cursor === "string" ? data.cursor : undefined;

      if (limit > 50) {
        throw new HttpsError("invalid-argument", "limit cannot exceed 50");
      }

      let query = db
        .collection("roleAssignments")
        .orderBy("assignedAt", "desc")
        .limit(limit);

      if (cursor) {
        const cursorDoc = await db
          .collection("roleAssignments")
          .doc(cursor)
          .get();

        if (cursorDoc.exists) {
          query = query.startAfter(cursorDoc);
        }
      }

      const snapshot = await query.get();

      // ✅ KEEP ONLY LATEST ROLE PER UID
      const latestByUid = new Map<string, any>();

      for (const doc of snapshot.docs) {
        const d = doc.data();

        if (!latestByUid.has(d.uid)) {
          // 🔥 Fetch email from Firebase Auth
          const userRecord = await admin.auth().getUser(d.uid);

          latestByUid.set(d.uid, {
            id: doc.id,
            uid: d.uid,
            email: userRecord.email ?? null,
            role: d.role,
            assignedBy: d.assignedBy,
            assignedAt: d.assignedAt?.toDate().toISOString() ?? null,
          });
        }
      }

      const items = Array.from(latestByUid.values());

      return {
        items,
        nextCursor:
          snapshot.docs.length === limit
            ? snapshot.docs[snapshot.docs.length - 1].id
            : null,
      };
    } catch (e: any) {
      console.error("listRoleAssignments error", e);

      throw e instanceof HttpsError
        ? e
        : new HttpsError("internal", e.message);
    }
  }
);
