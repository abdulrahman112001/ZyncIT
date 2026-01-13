import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";

const app = initializeApp({
  apiKey: "AIzaSyCMqENmothJXy6XrP7214d0c6ILsOdqtcs",
  authDomain: "zyncit-f1ced.firebaseapp.com",
  projectId: "zyncit-f1ced"
});

const db = getFirestore(app);

async function checkLast() {
  const q = query(
    collection(db, "users/4OsnkeWHkAedXL7cD0OLCuKDZky1/devices/android_7249382ed438e159/notifications"),
    where("type", "==", "sms"),
    orderBy("timestamp", "desc"),
    limit(10)
  );
  
  const snap = await getDocs(q);
  
  console.log(`Last ${snap.size} SMS messages:\n`);
  snap.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id}`);
    console.log(`  Phone: ${data.phoneNumber}`);
    console.log(`  Text: ${data.text?.substring(0, 30)}`);
    console.log(`  Time: ${new Date(data.timestamp).toLocaleString()}\n`);
  });
  
  process.exit(0);
}

checkLast().catch(console.error);
