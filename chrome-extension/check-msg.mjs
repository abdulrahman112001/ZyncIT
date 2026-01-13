import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

const app = initializeApp({
  apiKey: "AIzaSyCMqENmothJXy6XrP7214d0c6ILsOdqtcs",
  authDomain: "zyncit-f1ced.firebaseapp.com",
  projectId: "zyncit-f1ced"
});

const db = getFirestore(app);

async function check() {
  const q = query(
    collection(db, "users/4OsnkeWHkAedXL7cD0OLCuKDZky1/devices/android_7249382ed438e159/notifications"),
    where("type", "==", "sms"),
    where("text", "==", "تجربه")
  );
  
  const snap = await getDocs(q);
  console.log(`Messages with text "تجربه": ${snap.size}\n`);
  
  const messages = [];
  snap.forEach(doc => {
    messages.push({
      id: doc.id,
      timestamp: doc.data().timestamp,
      phone: doc.data().phoneNumber
    });
  });
  
  messages.sort((a, b) => b.timestamp - a.timestamp);
  
  messages.forEach(msg => {
    console.log(`ID: ${msg.id}`);
    console.log(`  Timestamp: ${new Date(msg.timestamp).toLocaleString()}`);
    console.log(`  Phone: ${msg.phone}\n`);
  });
  
  process.exit(0);
}

check().catch(console.error);
