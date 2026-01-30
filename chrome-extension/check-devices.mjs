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
  // This is the userId from SharedPreferences
  const userId = "kSF35jtZDmbxQBsvq8lRbqzBnb23";

  console.log("Checking devices for userId:", userId);
  console.log("");

  const q = query(collection(db, "devices"), where("userId", "==", userId));
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
      new Date(data.lastActive || 0).toLocaleString(),
    );
  });
  process.exit(0);
}

check();
