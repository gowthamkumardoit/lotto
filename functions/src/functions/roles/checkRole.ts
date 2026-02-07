const admin = require("firebase-admin");
const path = require("path");

admin.initializeApp({
  credential: admin.credential.cert(
    require(path.resolve("./serviceAccountKey.json"))
  ),
});

async function run() {
  const uid = "0dsgTUHbm8VfOE3tMRriunpqQe13";

  const user = await admin.auth().getUser(uid);

  console.log("UID:", user.uid);
  console.log("Custom Claims:", user.customClaims || {});
}

run().catch(console.error);
