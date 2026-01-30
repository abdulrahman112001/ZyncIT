/**
 * Debug script to check SMS data flow
 * Run from Chrome Extension console or as Node.js script
 */

// For Node.js, use this:
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  limit,
  getDocs,
} from "firebase/firestore";
import firebaseConfig from "./firebase-config.js";
import { signInWithEmailAndPassword, getAuth } from "firebase/auth";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ⚠️ Replace with your test credentials
const TEST_EMAIL = ""; // Add your email
const TEST_PASSWORD = ""; // Add your password

async function debugFlow() {
  console.log("🔍 SMS Debug Flow Started\n");
  console.log("=".repeat(60));

  try {
    // Step 1: Sign in
    console.log("\n1️⃣ Signing in...");
    if (!TEST_EMAIL || !TEST_PASSWORD) {
      console.log("⚠️ Please set TEST_EMAIL and TEST_PASSWORD in the script");
      process.exit(1);
    }

    const userCred = await signInWithEmailAndPassword(
      auth,
      TEST_EMAIL,
      TEST_PASSWORD,
    );
    const userId = userCred.user.uid;
    console.log(`✅ Signed in as: ${userId}\n`);

    // Step 2: Get devices from root collection
    console.log("2️⃣ Getting devices from 'devices' collection...");
    const devicesQuery = query(
      collection(db, "devices"),
      where("userId", "==", userId),
    );

    const devicesSnap = await getDocs(devicesQuery);
    console.log(`📱 Found ${devicesSnap.size} devices:`);

    const mobileDevices = [];
    devicesSnap.forEach((doc) => {
      const data = doc.data();
      console.log(`\n   Device: ${doc.id}`);
      console.log(`   - id: ${data.id}`);
      console.log(`   - platform: ${data.platform}`);
      console.log(`   - name: ${data.name || data.nickname || "N/A"}`);
      console.log(`   - type: ${data.type}`);

      // Check if mobile device
      const isMobile =
        data.platform !== "chrome-extension" &&
        data.platform !== "chrome" &&
        !data.id?.startsWith("ext_");

      console.log(`   - isMobile: ${isMobile}`);

      if (isMobile) {
        mobileDevices.push({
          docId: doc.id,
          id: data.id,
          name: data.name || data.nickname || "Unknown",
        });
      }
    });

    console.log(`\n📲 Mobile devices: ${mobileDevices.length}`);

    // Step 3: Check SMS in notifications for each mobile device
    console.log("\n3️⃣ Checking SMS notifications for each device...\n");

    for (const device of mobileDevices) {
      console.log(`\n--- Device: ${device.name} (${device.id}) ---`);

      // Use device.id (the data field) as the document path
      const notifQuery = query(
        collection(db, "users", userId, "devices", device.id, "notifications"),
        where("type", "==", "sms"),
        limit(5),
      );

      try {
        const smsSnap = await getDocs(notifQuery);
        console.log(`   ✉️ SMS count: ${smsSnap.size}`);

        if (smsSnap.size > 0) {
          console.log("   Last messages:");
          smsSnap.docs
            .sort(
              (a, b) => (b.data().timestamp || 0) - (a.data().timestamp || 0),
            )
            .forEach((doc, i) => {
              const d = doc.data();
              console.log(
                `   ${i + 1}. ${d.phoneNumber || d.title} - "${(d.text || "").substring(0, 30)}..."`,
              );
              console.log(
                `      Time: ${new Date(d.timestamp).toLocaleString()}`,
              );
            });
        }
      } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
      }
    }

    // Also try with docId
    console.log("\n4️⃣ Trying with document ID as path...\n");
    for (const device of mobileDevices) {
      if (device.docId !== device.id) {
        console.log(`\n--- Using docId: ${device.docId} ---`);

        const notifQuery = query(
          collection(
            db,
            "users",
            userId,
            "devices",
            device.docId,
            "notifications",
          ),
          where("type", "==", "sms"),
          limit(5),
        );

        try {
          const smsSnap = await getDocs(notifQuery);
          console.log(`   ✉️ SMS count: ${smsSnap.size}`);
        } catch (err) {
          console.log(`   ❌ Error: ${err.message}`);
        }
      }
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Debug complete!");
  process.exit(0);
}

debugFlow();
