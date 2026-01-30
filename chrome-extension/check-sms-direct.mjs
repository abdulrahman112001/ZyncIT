import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import firebaseConfig from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  // This is the userId from SharedPreferences
  const userId = "kSF35jtZDmbxQBsvq8lRbqzBnb23";
  const deviceId = "android_7249382ed438e159";

  console.log("=== Checking SMS in Firebase ===");
  console.log("userId:", userId);
  console.log("deviceId:", deviceId);
  console.log("");

  try {
    // Path: users/{userId}/devices/{deviceId}/notifications
    const notificationsPath = `users/${userId}/devices/${deviceId}/notifications`;
    console.log("Checking path:", notificationsPath);

    const q = query(
      collection(db, "users", userId, "devices", deviceId, "notifications"),
      where("type", "==", "sms"),
      limit(10),
    );

    const snap = await getDocs(q);
    console.log("\nTotal SMS notifications:", snap.size);

    snap.forEach((doc) => {
      const data = doc.data();
      console.log("\n---");
      console.log("Doc ID:", doc.id);
      console.log("Title:", data.title);
      console.log("Text:", data.text?.substring(0, 50));
      console.log("Type:", data.type);
      console.log(
        "Time:",
        new Date(data.timestamp || data.receivedAt || 0).toLocaleString(),
      );
    });
  } catch (error) {
    console.error("Error:", error.code, error.message);
  }

  process.exit(0);
}

check();
