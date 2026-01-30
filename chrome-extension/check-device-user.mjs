import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import firebaseConfig from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const newUserId = "snoIYudBUDYkrdcRQu8dGmgXMzs1";
  const oldUserId = "kSF35jtZDmbxQBsvq8lRbqzBnb23";
  const deviceId = "android_7249382ed438e159";

  console.log("=== Checking Device Registration ===\n");

  // Check device document directly
  console.log("1. Checking device document:", deviceId);
  try {
    const deviceDoc = await getDoc(doc(db, "devices", deviceId));
    if (deviceDoc.exists()) {
      const data = deviceDoc.data();
      console.log("   Found! userId:", data.userId);
      console.log("   Name:", data.name);
      console.log("   Platform:", data.platform);

      if (data.userId === newUserId) {
        console.log("   ✅ Device is registered with NEW user");
      } else if (data.userId === oldUserId) {
        console.log("   ❌ Device is still registered with OLD user!");
        console.log("   Need to update device userId in Firestore");
      } else {
        console.log(
          "   ⚠️ Device is registered with UNKNOWN user:",
          data.userId,
        );
      }
    } else {
      console.log("   ❌ Device document not found!");
    }
  } catch (error) {
    console.log("   Error:", error.message);
  }

  console.log("\n2. Checking all devices for NEW user:", newUserId);
  try {
    const q = query(
      collection(db, "devices"),
      where("userId", "==", newUserId),
    );
    const snap = await getDocs(q);
    console.log("   Devices found:", snap.size);
    snap.forEach((d) => {
      const data = d.data();
      console.log("   -", d.id, "|", data.name, "|", data.platform);
    });
  } catch (error) {
    console.log("   Error:", error.message);
  }

  console.log("\n3. Checking all devices for OLD user:", oldUserId);
  try {
    const q = query(
      collection(db, "devices"),
      where("userId", "==", oldUserId),
    );
    const snap = await getDocs(q);
    console.log("   Devices found:", snap.size);
    snap.forEach((d) => {
      const data = d.data();
      console.log("   -", d.id, "|", data.name, "|", data.platform);
    });
  } catch (error) {
    console.log("   Error:", error.message);
  }

  process.exit(0);
}

check();
