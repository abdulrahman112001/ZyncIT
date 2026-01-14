import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import firebaseConfig from "./firebase-config.js";

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

async function deleteOldFormat() {
  const snap = await getDocs(
    collection(
      db,
      "users/4OsnkeWHkAedXL7cD0OLCuKDZky1/devices/android_7249382ed438e159/notifications"
    )
  );

  const toDelete = [];

  snap.forEach((doc) => {
    // حذف الرسائل القديمة التي تبدأ بـ "sms_" ولا تحتوي على deviceId
    if (doc.id.startsWith("sms_") && !doc.id.includes("android_")) {
      toDelete.push({ id: doc.id, ref: doc.ref });
    }
  });

  console.log(`Total messages: ${snap.size}`);
  console.log(`Old format messages to delete: ${toDelete.length}`);

  if (toDelete.length > 0) {
    console.log("\nDeleting old format messages...");
    let deleted = 0;
    for (const item of toDelete) {
      await deleteDoc(item.ref);
      deleted++;
      if (deleted % 10 === 0) {
        console.log(`Deleted ${deleted}/${toDelete.length}...`);
      }
    }
    console.log(`\n✅ Deleted ${deleted} old format messages!`);
  }

  process.exit(0);
}

deleteOldFormat().catch(console.error);
