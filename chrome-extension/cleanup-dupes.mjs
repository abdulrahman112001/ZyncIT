import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import firebaseConfig from "./firebase-config.js";

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

async function cleanupDuplicates() {
  const q = query(
    collection(
      db,
      "users/4OsnkeWHkAedXL7cD0OLCuKDZky1/devices/android_7249382ed438e159/notifications"
    ),
    where("type", "==", "sms")
  );

  const snap = await getDocs(q);
  const messageSeen = new Set();
  const toDelete = [];

  snap.forEach((doc) => {
    const data = doc.data();
    const key = `${data.phoneNumber}_${data.timestamp}_${data.text}`;

    // إذا رأينا هذه الرسالة من قبل، احذف النسخة الأقدم (التي بدون deviceId في docId)
    if (messageSeen.has(key)) {
      // حذف النسخة القديمة (التي لا تحتوي على deviceId في الـ ID)
      if (!doc.id.includes("android_7249382ed438e159")) {
        toDelete.push(doc.ref);
        console.log(`Deleting old duplicate: ${doc.id}`);
      }
    } else {
      messageSeen.add(key);
    }
  });

  console.log(`\nTotal messages: ${snap.size}`);
  console.log(`Duplicates to delete: ${toDelete.length}`);

  if (toDelete.length > 0) {
    console.log("\nDeleting duplicates...");
    for (const ref of toDelete) {
      await deleteDoc(ref);
    }
    console.log("✅ Cleanup complete!");
  } else {
    console.log("No duplicates found.");
  }

  process.exit(0);
}

cleanupDuplicates().catch(console.error);
