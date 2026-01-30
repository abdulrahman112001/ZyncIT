import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import firebaseConfig from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const userId = "snoIYudBUDYkrdcRQu8dGmgXMzs1";
const deviceId = "android_7249382ed438e159";

async function debug() {
  console.log("=".repeat(60));
  console.log("DEBUG: Checking SMS data flow");
  console.log("=".repeat(60));
  console.log("\nUserId:", userId);
  console.log("DeviceId:", deviceId);

  // 1. Check device document
  console.log("\n--- 1. Checking device document ---");
  try {
    const deviceDoc = await getDoc(doc(db, "devices", deviceId));
    if (deviceDoc.exists()) {
      const data = deviceDoc.data();
      console.log("✅ Device found!");
      console.log("   userId in device:", data.userId);
      console.log("   name:", data.name);
      console.log("   platform:", data.platform);

      if (data.userId !== userId) {
        console.log("❌ PROBLEM: Device userId doesn't match!");
        console.log("   Expected:", userId);
        console.log("   Actual:", data.userId);
      }
    } else {
      console.log("❌ Device document NOT found!");
    }
  } catch (e) {
    console.log("Error checking device:", e.message);
  }

  // 2. Check SMS notifications
  console.log("\n--- 2. Checking SMS notifications ---");
  try {
    const smsPath = `users/${userId}/devices/${deviceId}/notifications`;
    console.log("Path:", smsPath);

    const q = query(
      collection(db, "users", userId, "devices", deviceId, "notifications"),
      where("type", "==", "sms"),
      limit(10),
    );

    const snap = await getDocs(q);
    console.log("SMS count:", snap.size);

    if (snap.size > 0) {
      console.log("\nRecent SMS:");
      snap.forEach((d) => {
        const data = d.data();
        console.log(
          `  - [${d.id}] ${data.title}: ${data.text?.substring(0, 30)}...`,
        );
        console.log(
          `    timestamp: ${new Date(data.timestamp || data.receivedAt || 0).toLocaleString()}`,
        );
      });
    }
  } catch (e) {
    console.log("Error checking SMS:", e.message);
  }

  // 3. Check all devices for this user
  console.log("\n--- 3. All devices for user ---");
  try {
    const q = query(collection(db, "devices"), where("userId", "==", userId));
    const snap = await getDocs(q);
    console.log("Total devices:", snap.size);
    snap.forEach((d) => {
      const data = d.data();
      console.log(`  - ${d.id} | ${data.name} | ${data.platform}`);
    });
  } catch (e) {
    console.log("Error:", e.message);
  }

  // 4. Check if there's data under old userId
  console.log("\n--- 4. Check old userId data ---");
  const oldUserId = "kSF35jtZDmbxQBsvq8lRbqzBnb23";
  try {
    const q = query(
      collection(db, "users", oldUserId, "devices", deviceId, "notifications"),
      where("type", "==", "sms"),
      limit(5),
    );
    const snap = await getDocs(q);
    console.log("SMS under OLD userId:", snap.size);
    if (snap.size > 0) {
      console.log("⚠️ There's data under the old user!");
    }
  } catch (e) {
    console.log("Error:", e.message);
  }

  process.exit(0);
}

debug();
