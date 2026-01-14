import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import firebaseConfig from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const userId = "4OsnkeWHkAedXL7cD0OLCuKDZky1";
const deviceId = "android_7249382ed438e159";

async function testSMSFlow() {
  // Step 1: Start listening for changes (like the extension does)

  const notificationsRef = collection(
    db,
    "users",
    userId,
    "devices",
    deviceId,
    "notifications"
  );
  const q = query(notificationsRef, where("type", "==", "sms"), limit(20));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
        }
      });
    },
    (error) => {
      console.error("❌ Listener error:", error);
    }
  );

  // Wait a bit for listener to initialize
  await new Promise((r) => setTimeout(r, 2000));

  // Step 2: Create a new test SMS

  const testTimestamp = Date.now();
  const testPhone = "+201234567890";
  const testId = `test_sms_${testTimestamp}`;

  const testSMS = {
    type: "sms",
    phoneNumber: testPhone,
    contactName: "Test Contact",
    text: "هذه رسالة تجريبية - " + new Date().toLocaleTimeString(),
    timestamp: testTimestamp,
    receivedAt: testTimestamp,
    read: false,
    title: "Test Contact",
    smsType: "inbox",
    packageName: "com.google.android.apps.messaging",
  };

  try {
    const docRef = doc(notificationsRef, testId);
    await setDoc(docRef, testSMS);
  } catch (error) {
    console.error("❌ Error saving SMS:", error);
  }

  // Wait for listener to catch it
  await new Promise((r) => setTimeout(r, 5000));

  // Cleanup
  unsubscribe();

  process.exit(0);
}

testSMSFlow().catch((e) => {
  process.exit(1);
});
