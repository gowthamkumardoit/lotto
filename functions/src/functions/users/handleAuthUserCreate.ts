import * as functions from "firebase-functions/v1";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const db = getFirestore();

export const handleAuthUserCreate = functions.auth
  .user()
  .onCreate(async (user) => {
    const userRef = db.collection("users").doc(user.uid);

    const snap = await userRef.get();
    if (snap.exists) return;

    await userRef.set({
      uid: user.uid,
      email: user.email ?? null,
      phone: user.phoneNumber ?? null,
      displayName: user.displayName ?? "",
      photoURL: user.photoURL ?? null,
      provider: user.providerData?.[0]?.providerId ?? "unknown",

      status: "ACTIVE",

      walletBalance: 0,
      bonusBalance: 0,
      lockedBalance: 0,

      kycStatus: "PENDING",

      createdAt: FieldValue.serverTimestamp(),
      lastLoginAt: FieldValue.serverTimestamp(),
    });
  });
