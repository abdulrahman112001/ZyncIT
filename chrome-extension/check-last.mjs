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

const db = getFirestore(app);

async function checkLast() {
  const q = query(
    collection(
      db,
      "users/4OsnkeWHkAedXL7cD0OLCuKDZky1/devices/android_7249382ed438e159/notifications"
    ),
    where("type", "==", "sms"),
    orderBy("timestamp", "desc"),
    limit(10)
  );

  const snap = await getDocs(q);

  snap.forEach((doc) => {
    const data = doc.data();
  });

  process.exit(0);
}

checkLast().catch(console.error);
