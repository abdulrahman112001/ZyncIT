import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";

const app = initializeApp({
  apiKey: "AIzaSyCMqENmothJXy6XrP7214d0c6ILsOdqtcs",
  authDomain: "zyncit-f1ced.firebaseapp.com",
  projectId: "zyncit-f1ced"
});

const db = getFirestore(app);

async function cleanupDuplicates() {
  const q = query(
    collection(db, "users/4OsnkeWHkAedXL7cD0OLCuKDZky1/devices/android_7249382ed438e159/notifications"),
    where("type", "==", "sms")
  );
  
  const snap = await getDocs(q);
  const seen = new Map();
  const toDelete = [];
  
  snap.forEach(doc => {
    const data = doc.data();
    const key = `${data.timestamp}_${data.text}`;
    
    if (seen.has(key)) {
      // احتفظ بالرسالة التي لها أطول ID (الأحدث/الأكثر تفصيلاً)
      const existing = seen.get(key);
      if (doc.id.length < existing.id.length) {
        toDelete.push({ id: doc.id, ref: doc.ref });
      } else {
        toDelete.push(existing);
        seen.set(key, { id: doc.id, ref: doc.ref });
      }
    } else {
      seen.set(key, { id: doc.id, ref: doc.ref });
    }
  });
  
  console.log(`Total: ${snap.size}, Duplicates: ${toDelete.length}`);
  
  if (toDelete.length > 0) {
    console.log("Deleting...");
    for (const item of toDelete) {
      await deleteDoc(item.ref);
      console.log(`✅ Deleted: ${item.id}`);
    }
    console.log(`\n✅ Deleted ${toDelete.length} duplicates!`);
  }
  
  process.exit(0);
}

cleanupDuplicates().catch(console.error);
