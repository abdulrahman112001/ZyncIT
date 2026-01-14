import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import firebaseConfig from "./firebase-config.js";

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

async function check() {
  const q = query(
    collection(db, "devices"),
    where("userId", "==", "4OsnkeWHkAedXL7cD0OLCuKDZky1")
  );
  const snap = await getDocs(q);
  console.log("Total devices:", snap.size);
  snap.forEach((d) => {
    const data = d.data();
    console.log(
      "Device:",
      data.name,
      "|",
      data.platform,
      "|",
      data.id,
      "| Last active:",
      new Date(data.lastActive || 0).toLocaleString()
    );
  });
  process.exit(0);
}

check();
