import { initializeApp } from "firebase/app"
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
} from "firebase/firestore"

const config = {
  apiKey: "AIzaSyCMqENmothJXy6XrP7214d0c6ILsOdqtcs",
  authDomain: "zyncit-f1ced.firebaseapp.com",
  projectId: "zyncit-f1ced",
  storageBucket: "zyncit-f1ced.firebasestorage.app",
  messagingSenderId: "772958487002",
  appId: "1:772958487002:web:c2dcb8043d3bfed2ec40e3",
}

const app = initializeApp(config)
const db = getFirestore(app)

const userId = "4OsnkeWHkAedXL7cD0OLCuKDZky1"
const deviceId = "android_7249382ed438e159"

async function testSMSFlow() {
  console.log("=== SMS Flow Test ===")
  console.log("User ID:", userId)
  console.log("Device ID:", deviceId)
  console.log("")

  // Step 1: Start listening for changes (like the extension does)
  console.log("📡 Step 1: Starting listener for SMS notifications...")

  const notificationsRef = collection(
    db,
    "users",
    userId,
    "devices",
    deviceId,
    "notifications"
  )
  const q = query(notificationsRef, where("type", "==", "sms"), limit(20))

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data()
          console.log("🔔 LISTENER RECEIVED NEW SMS!")
          console.log("   ID:", change.doc.id)
          console.log("   Phone:", data.phoneNumber)
          console.log("   Text:", data.text)
          console.log("   Timestamp:", data.timestamp)
          console.log("   ContactName:", data.contactName)
          console.log("")
        }
      })
    },
    (error) => {
      console.error("❌ Listener error:", error)
    }
  )

  console.log("✅ Listener started!")
  console.log("")

  // Wait a bit for listener to initialize
  await new Promise((r) => setTimeout(r, 2000))

  // Step 2: Create a new test SMS
  console.log("📝 Step 2: Creating new test SMS...")

  const testTimestamp = Date.now()
  const testPhone = "+201234567890"
  const testId = `test_sms_${testTimestamp}`

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
  }

  console.log("   SMS Data:", JSON.stringify(testSMS, null, 2))
  console.log("")

  try {
    const docRef = doc(notificationsRef, testId)
    await setDoc(docRef, testSMS)
    console.log("✅ Step 3: SMS saved to Firebase!")
    console.log("   Document ID:", testId)
    console.log(
      "   Path: users/" +
        userId +
        "/devices/" +
        deviceId +
        "/notifications/" +
        testId
    )
    console.log("")
  } catch (error) {
    console.error("❌ Error saving SMS:", error)
  }

  // Wait for listener to catch it
  console.log("⏳ Waiting 5 seconds for listener to catch the new SMS...")
  await new Promise((r) => setTimeout(r, 5000))

  // Cleanup
  unsubscribe()
  console.log("")
  console.log("=== Test Complete ===")
  console.log(
    "If you saw '🔔 LISTENER RECEIVED NEW SMS!' above, Firebase real-time is working!"
  )
  console.log(
    "Now check your Chrome extension - the SMS should appear there too."
  )

  process.exit(0)
}

testSMSFlow().catch((e) => {
  console.error("Error:", e)
  process.exit(1)
})
