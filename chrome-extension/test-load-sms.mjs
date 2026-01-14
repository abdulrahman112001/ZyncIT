import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  limit,
} from "firebase/firestore";
import firebaseConfig from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testLoadSMS() {
  const userId = "4OsnkeWHkAedXL7cD0OLCuKDZky1";

  const devicesQuery = query(
    collection(db, "devices"),
    where("userId", "==", userId)
  );

  const devicesSnapshot = await getDocs(devicesQuery);
  const deviceIds = [];

  devicesSnapshot.forEach((doc) => {
    const data = doc.data();
    if (
      data.platform !== "chrome-extension" &&
      data.platform !== "chrome" &&
      !data.id?.startsWith("ext_")
    ) {
      deviceIds.push(data.id);
    }
  });

  let allSMS = {};

  for (const deviceId of deviceIds) {
    const q = query(
      collection(db, "users", userId, "devices", deviceId, "notifications"),
      where("type", "==", "sms"),
      limit(50)
    );

    const snapshot = await getDocs(q);

    const messages = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        phoneNumber: data.phoneNumber || data.sender || data.title || "",
        contactName: data.contactName || data.title || "",
        body: data.text || data.content || data.body || "",
        timestamp: data.timestamp || data.receivedAt || Date.now(),
      });
    });

    allSMS[deviceId] = messages;
  }

  let merged = [];
  Object.values(allSMS).forEach((msgs) => {
    merged = merged.concat(msgs);
  });

  merged.slice(0, 5).forEach((msg) => {});

  process.exit(0);
}

testLoadSMS().catch((e) => {
  process.exit(1);
});
