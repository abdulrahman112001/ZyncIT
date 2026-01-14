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

async function checkDuplicates() {
  const q = query(
    collection(
      db,
      "users/4OsnkeWHkAedXL7cD0OLCuKDZky1/devices/android_7249382ed438e159/notifications"
    ),
    where("type", "==", "sms"),
    orderBy("timestamp", "desc"),
    limit(20)
  );

  const snap = await getDocs(q);
  const messages = new Map();
  const duplicates = [];

  snap.forEach((doc) => {
    const data = doc.data();
    const key = `${data.phoneNumber}_${data.timestamp}_${data.text}`;

    if (messages.has(key)) {
      duplicates.push({ id: doc.id, ...data });
    } else {
      messages.set(key, { id: doc.id, ...data });
    }
  });

  console.log("Total messages:", snap.size);
  console.log("Duplicates found:", duplicates.length);

  if (duplicates.length > 0) {
    console.log("\nDuplicate messages:");
    duplicates.forEach((msg) => {
      console.log(`  - ID: ${msg.id}`);
      console.log(`    Phone: ${msg.phoneNumber}`);
      console.log(`    Text: ${msg.text?.substring(0, 30)}`);
      console.log(`    Timestamp: ${new Date(msg.timestamp).toLocaleString()}`);
    });
  }

  process.exit(0);
}

checkDuplicates().catch(console.error);
