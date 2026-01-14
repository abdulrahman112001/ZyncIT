import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import firebaseConfig from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
});

const db = getFirestore(app);

async function check() {
  const q = query(
    collection(
      db,
      "users/4OsnkeWHkAedXL7cD0OLCuKDZky1/devices/android_7249382ed438e159/notifications"
    ),
    where("type", "==", "sms"),
    orderBy("timestamp", "desc"),
    limit(5)
  );

  const snap = await getDocs(q);
  console.log("Last 5 SMS:\n");
  snap.forEach((doc) => {
    const data = doc.data();
    console.log("ID:", doc.id);
    console.log("  deviceName:", data.deviceName);
    console.log("  text:", data.text);
    console.log("  time:", new Date(data.timestamp).toLocaleString());
    console.log("");
  });
  process.exit(0);
}

check();
