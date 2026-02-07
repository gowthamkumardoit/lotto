const admin = require("firebase-admin");
const path = require("path");

// 🔐 Point to your service account key
admin.initializeApp({
  credential: admin.credential.cert(
    require(path.resolve("./serviceAccountKey.json"))
  ),
});

async function run() {
  const uid = "115dNHW8z1Xj4OiSHyRhGAhjdeV2";

  await admin.auth().setCustomUserClaims(uid, {
    role: "admin",
  });

  console.log("✅ Custom claim set: role=admin for", uid);
}

run().catch(console.error);
