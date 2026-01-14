import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  limit,
} from "firebase/firestore";
import firebaseConfig from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const userId = "4OsnkeWHkAedXL7cD0OLCuKDZky1";
  const deviceId = "android_7249382ed438e159";

  // Check devices collection first
  const devicesQuery = query(
    collection(db, "devices"),
    where("userId", "==", userId)
  );
  const devicesSnapshot = await getDocs(devicesQuery);
  devicesSnapshot.forEach((d) => {
    const data = d.data();
  });

  // Get ALL notifications first
  const allNotifs = await getDocs(
    query(
      collection(db, "users", userId, "devices", deviceId, "notifications"),
      limit(10)
    )
  );

  allNotifs.forEach((d) => {
    const data = d.data();
  });

  // Get SMS only
  const smsNotifs = await getDocs(
    query(
      collection(db, "users", userId, "devices", deviceId, "notifications"),
      where("type", "==", "sms"),
      limit(30)
    )
  );

  console.log("\n=== SMS notifications count:", smsNotifs.size, "===");
  smsNotifs.forEach((d) => {
    const data = d.data();
  });

  process.exit(0);
}

check().catch((e) => {
  process.exit(1);
});
