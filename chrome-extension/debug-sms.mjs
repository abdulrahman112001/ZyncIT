import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  collectionGroup,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import firebaseConfig from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugSMS() {
  console.log("🔍 Starting SMS Debug...\n");
  console.log("=".repeat(60));

  try {
    // Step 1: Get all users
    console.log("\n📋 Step 1: Finding users...");
    const usersSnap = await getDocs(collection(db, "users"));
    console.log(`Found ${usersSnap.size} users\n`);

    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      console.log(`\n👤 User: ${userId}`);
      console.log("-".repeat(50));

      // Step 2: Get devices for this user
      console.log("  📱 Getting devices...");
      const devicesSnap = await getDocs(
        collection(db, "users", userId, "devices"),
      );
      console.log(`  Found ${devicesSnap.size} devices\n`);

      for (const deviceDoc of devicesSnap.docs) {
        const deviceId = deviceDoc.id;
        const deviceData = deviceDoc.data();
        console.log(`    📲 Device: ${deviceId}`);
        console.log(`       Platform: ${deviceData.platform || "unknown"}`);
        console.log(
          `       Name: ${deviceData.name || deviceData.nickname || "No name"}`,
        );

        // Step 3: Get SMS notifications for this device
        console.log("       📨 Checking SMS in notifications...");

        const smsQuery = query(
          collection(db, "users", userId, "devices", deviceId, "notifications"),
          where("type", "==", "sms"),
          limit(10),
        );

        const smsSnap = await getDocs(smsQuery);
        console.log(`       ✉️ Found ${smsSnap.size} SMS messages`);

        if (smsSnap.size > 0) {
          console.log("\n       Last SMS messages:");
          smsSnap.docs
            .sort(
              (a, b) => (b.data().timestamp || 0) - (a.data().timestamp || 0),
            )
            .slice(0, 5)
            .forEach((doc, i) => {
              const data = doc.data();
              const time = data.timestamp
                ? new Date(data.timestamp).toLocaleString()
                : "N/A";
              console.log(`\n       ${i + 1}. ID: ${doc.id}`);
              console.log(
                `          From: ${data.phoneNumber || data.title || "Unknown"}`,
              );
              console.log(
                `          Text: ${(data.text || data.body || "").substring(0, 50)}...`,
              );
              console.log(`          Time: ${time}`);
              console.log(`          smsType: ${data.smsType || "N/A"}`);
            });
        }
        console.log("");
      }
    }

    // Also check old SMS collection if exists
    console.log("\n" + "=".repeat(60));
    console.log("📂 Checking old 'sms' collection (if exists)...");
    const oldSmsSnap = await getDocs(query(collection(db, "sms"), limit(5)));
    console.log(`Found ${oldSmsSnap.size} messages in old 'sms' collection`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Debug complete!");
  process.exit(0);
}

debugSMS();
