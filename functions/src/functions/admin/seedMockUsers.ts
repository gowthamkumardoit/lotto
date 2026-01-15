import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { randomUUID } from "crypto";

const USERS_TO_CREATE = 400;

function randomIndianPhone(index: number) {
    return `9${Math.floor(100000000 + index)}`;
}

function randomPastDate() {
    const daysAgo = Math.floor(Math.random() * 120);
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d;
}

export const seedMockUsers = onCall({ region: "asia-south1" }, async (request) => {
    const { auth } = request;

    // 🔒 must be logged in
    if (!auth) {
        throw new HttpsError("unauthenticated", "Login required");
    }

    // 🔒 admin only
    // if (auth.token.role !== "admin") {
    //     throw new HttpsError("permission-denied", "Admin only");
    // }

    // 🔒 dev only
    // const projectId = process.env.GCLOUD_PROJECT;
    // if (!projectId?.includes("dev")) {
    //     throw new HttpsError(
    //         "failed-precondition",
    //         "Seeding allowed only in dev project"
    //     );
    // }

    const db = admin.firestore();

    /* -------- WIPE USERS -------- */

    const snap = await db.collection("users").where("isMock", "==", true).get();

    const deleteBatch = db.batch();
    snap.docs.forEach((doc) => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();

    /* -------- SEED USERS -------- */

    const chunkSize = 500;
    let created = 0;

    for (let i = 0; i < USERS_TO_CREATE; i += chunkSize) {
        const batch = db.batch();

        for (let j = i; j < Math.min(i + chunkSize, USERS_TO_CREATE); j++) {
            const uid = randomUUID().replace(/-/g, "");

            batch.set(db.collection("users").doc(uid), {
                phone: randomIndianPhone(j),
                role: "user",
                status: Math.random() < 0.15 ? "blocked" : "active",
                createdAt: admin.firestore.Timestamp.fromDate(randomPastDate()),
                isMock: true,
            });

            created++;
        }

        await batch.commit();
    }

    return {
        success: true,
        created,
        deleted: snap.size,
    };
});
