import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import firebaseConfig from "./firebase-config.js";

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

async function cleanup() {
  try {
    const devicesRef = collection(db, "devices");
    const q = query(
      devicesRef,
      where("userId", "==", "4OsnkeWHkAedXL7cD0OLCuKDZky1")
    );
    const snapshot = await getDocs(q);

    console.log(`📱 Found ${snapshot.size} devices\n`);

    // تجميع الأجهزة حسب النوع
    const androidDevices = [];
    const chromeDevices = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const device = { ...data, docId: docSnap.id };

      console.log(
        `- ${data.name} | ${data.platform} | ID: ${
          data.id
        } | LastSeen: ${new Date(
          data.lastSeen || data.lastActiveAt || 0
        ).toLocaleString()}`
      );

      if (data.platform === "Android" || data.platform === "android") {
        androidDevices.push(device);
      } else if (
        data.platform === "chrome" ||
        data.platform === "chrome-extension"
      ) {
        chromeDevices.push(device);
      }
    });

    const toDelete = [];

    // الاحتفاظ بأحدث Android device
    if (androidDevices.length > 1) {
      androidDevices.sort(
        (a, b) =>
          (b.lastSeen || b.lastActiveAt || 0) -
          (a.lastSeen || a.lastActiveAt || 0)
      );
      console.log(`\n✅ Keeping Android device: ${androidDevices[0].id}`);
      for (let i = 1; i < androidDevices.length; i++) {
        toDelete.push(androidDevices[i].docId);
      }
    }

    // الاحتفاظ بأحدث Chrome Extension
    if (chromeDevices.length > 1) {
      chromeDevices.sort(
        (a, b) =>
          (b.lastActiveAt || b.lastSeen || 0) -
          (a.lastActiveAt || a.lastSeen || 0)
      );
      console.log(`✅ Keeping Chrome Extension: ${chromeDevices[0].id}`);
      for (let i = 1; i < chromeDevices.length; i++) {
        toDelete.push(chromeDevices[i].docId);
      }
    }

    if (toDelete.length === 0) {
      console.log(`\n✅ No duplicates found!`);
      process.exit(0);
      return;
    }

    console.log(`\n🗑️  Will delete ${toDelete.length} duplicate devices:`);

    for (const docId of toDelete) {
      console.log(`Deleting: ${docId}`);
      await deleteDoc(doc(db, "devices", docId));
    }

    console.log(`\n✅ Cleanup complete!`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

cleanup();
