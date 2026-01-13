import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";

const app = initializeApp({
  apiKey: "AIzaSyCMqENmothJXy6XrP7214d0c6ILsOdqtcs",
  authDomain: "zyncit-f1ced.firebaseapp.com",
  projectId: "zyncit-f1ced"
});

const db = getFirestore(app);

async function cleanup() {
  const q = query(
    collection(db, "users/4OsnkeWHkAedXL7cD0OLCuKDZky1/devices/android_7249382ed438e159/notifications"),
    where("type", "==", "sms"),
    where("text", "==", "تجربه")
  );
  
  const snap = await getDocs(q);
  console.log(`Found ${snap.size} messages with text "تجربه"\n`);
  
  // Keep only the one with hash-based ID
  const toDelete = [];
  snap.forEach(doc => {
    if (doc.id.includes("497513279")) {
      console.log(`✅ Keeping: ${doc.id}`);
    } else {
      console.log(`🗑️ Will delete: ${doc.id}`);
      toDelete.push(doc.id);
    }
  });
  
  for (const id of toDelete) {
    await deleteDoc(doc(db, `users/4OsnkeWHkAedXL7cD0OLCuKDZky1/devices/android_7249382ed438e159/notifications/${id}`));
    console.log(`✅ Deleted: ${id}`);
  }
  
  console.log(`\n🎉 Cleanup complete! Deleted ${toDelete.length} messages`);
  process.exit(0);
}

cleanup().catch(console.error);
