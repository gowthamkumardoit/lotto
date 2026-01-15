/* eslint-disable no-console */

import admin from "firebase-admin";
import serviceAccount from "./serviceAccount.dev.json" assert { type: "json" };
import { randomUUID } from "crypto";

/* ---------------- CONFIG ---------------- */


const USERS_TO_CREATE = 400; // 🔁 change between 300–500

/* ---------------- INIT ---------------- */

admin.initializeApp({
    credential: admin.credential.cert(
        serviceAccount as admin.ServiceAccount
    ),
});
const db = admin.firestore();

/* ---------------- HELPERS ---------------- */

function randomIndianPhone(index: number) {
    // ensures uniqueness
    return `9${Math.floor(100000000 + index)}`;
}

function randomPastDate() {
    const daysAgo = Math.floor(Math.random() * 120); // last ~4 months
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d;
}

/* ---------------- MAIN ---------------- */

async function seedUsers() {
    console.log("⚠️ WIPING users collection...");

    const snap = await db.collection("users").get();
    const batch = db.batch();

    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    console.log(`🗑️ Deleted ${snap.size} users`);

    console.log(`🚀 Seeding ${USERS_TO_CREATE} users...`);

    const chunkSize = 500;
    let created = 0;

    for (let i = 0; i < USERS_TO_CREATE; i += chunkSize) {
        const batch = db.batch();

        for (
            let j = i;
            j < Math.min(i + chunkSize, USERS_TO_CREATE);
            j++
        ) {
            const uid = randomUUID().replace(/-/g, "");

            batch.set(db.collection("users").doc(uid), {
                phone: randomIndianPhone(j),
                role: "user",
                status: Math.random() < 0.15 ? "blocked" : "active",
                createdAt: admin.firestore.Timestamp.fromDate(
                    randomPastDate()
                ),
                isMock: true, // 👈 for easy cleanup later
            });

            created++;
        }

        await batch.commit();
        console.log(`✅ Created ${created}/${USERS_TO_CREATE}`);
    }

    console.log("🎉 Seeding complete");
    process.exit(0);
}

/* ---------------- RUN ---------------- */

seedUsers().catch((err) => {
    console.error("❌ Seeding failed", err);
    process.exit(1);
});
