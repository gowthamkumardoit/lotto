import * as admin from "firebase-admin";
import { HttpsError } from "firebase-functions/https";

export async function requireRole(
    uid: string,
    allowedRoles: string[]
) {
    const snap = await admin.firestore()
        .collection("users")
        .doc(uid)
        .get();

    if (!snap.exists) {
        throw new HttpsError("not-found", "User not found");
    }

    const role = snap.data()?.role;

    if (!allowedRoles.includes(role)) {
        throw new HttpsError("permission-denied", "Access denied");
    }

    return role;
}

