import { HttpsError, onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { db } from "../../lib/firebaseAdmin";
import { requireAdminRoleAuth } from "../../helpers/requireAdminRoleAuth";

export const assignRole = onCall(
    { region: "asia-south1" },
    async (request) => {
        try {
            // 🔐 Ensure caller is admin
            const adminUid = requireAdminRoleAuth(request);

            const { email, role } = request.data;

            if (!email) {
                throw new HttpsError("invalid-argument", "email required");
            }

            if (!role) {
                throw new HttpsError("invalid-argument", "role required");
            }

            // 🔍 Find user by email
            const user = await admin.auth().getUserByEmail(email);

            // 🚫 Prevent admin from changing own role
            if (user.uid === adminUid) {
                throw new HttpsError(
                    "permission-denied",
                    "Admins cannot change their own role"
                );
            }

            // 🧠 Merge with existing claims
            await admin.auth().setCustomUserClaims(user.uid, {
                ...(user.customClaims || {}),
                role,
            });

            // 🧾 Audit log
            await db.collection("roleAssignments").add({
                uid: user.uid,
                email,
                role,
                assignedBy: adminUid,
                assignedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            return { success: true };
        } catch (e: any) {
            console.error("assignRole error", e);

            throw e instanceof HttpsError
                ? e
                : new HttpsError("internal", e.message);
        }
    }
);
