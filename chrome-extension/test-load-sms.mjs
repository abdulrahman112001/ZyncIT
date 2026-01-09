import { initializeApp } from "firebase/app"
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  limit,
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

async function testLoadSMS() {
  const userId = "4OsnkeWHkAedXL7cD0OLCuKDZky1"

  console.log("=== Testing SMS Loading (like Extension does) ===")
  console.log("User ID:", userId)

  // Step 1: Get devices
  console.log("\n📱 Step 1: Getting devices...")
  const devicesQuery = query(
    collection(db, "devices"),
    where("userId", "==", userId)
  )

  const devicesSnapshot = await getDocs(devicesQuery)
  const deviceIds = []

  devicesSnapshot.forEach((doc) => {
    const data = doc.data()
    console.log("  Device:", data.id, "| platform:", data.platform)
    if (
      data.platform !== "chrome-extension" &&
      data.platform !== "chrome" &&
      !data.id?.startsWith("ext_")
    ) {
      deviceIds.push(data.id)
    }
  })

  console.log("  Mobile devices:", deviceIds)

  // Step 2: Load SMS from each device
  console.log("\n📱 Step 2: Loading SMS from each device...")

  let allSMS = {}

  for (const deviceId of deviceIds) {
    const q = query(
      collection(db, "users", userId, "devices", deviceId, "notifications"),
      where("type", "==", "sms"),
      limit(50)
    )

    const snapshot = await getDocs(q)
    console.log("  Device", deviceId, ":", snapshot.size, "SMS")

    const messages = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      messages.push({
        id: doc.id,
        phoneNumber: data.phoneNumber || data.sender || data.title || "",
        contactName: data.contactName || data.title || "",
        body: data.text || data.content || data.body || "",
        timestamp: data.timestamp || data.receivedAt || Date.now(),
      })
    })

    allSMS[deviceId] = messages
  }

  // Step 3: Merge all SMS
  console.log("\n📱 Step 3: Merging SMS...")
  let merged = []
  Object.values(allSMS).forEach((msgs) => {
    merged = merged.concat(msgs)
  })

  console.log("  Total merged:", merged.length)

  // Step 4: Show some messages
  console.log("\n📱 Step 4: Sample messages:")
  merged.slice(0, 5).forEach((msg) => {
    console.log(
      "  -",
      msg.contactName || msg.phoneNumber,
      ":",
      msg.body.substring(0, 30)
    )
  })

  console.log("\n=== Test Complete ===")
  process.exit(0)
}

testLoadSMS().catch((e) => {
  console.error("Error:", e)
  process.exit(1)
})
