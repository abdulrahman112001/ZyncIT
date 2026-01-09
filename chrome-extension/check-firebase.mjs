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

async function check() {
  const userId = "4OsnkeWHkAedXL7cD0OLCuKDZky1"
  const deviceId = "android_7249382ed438e159"

  // Check devices collection first
  console.log("=== Checking devices collection ===")
  const devicesQuery = query(
    collection(db, "devices"),
    where("userId", "==", userId)
  )
  const devicesSnapshot = await getDocs(devicesQuery)
  console.log("Devices found:", devicesSnapshot.size)
  devicesSnapshot.forEach((d) => {
    const data = d.data()
    console.log(
      "  -",
      d.id,
      "| deviceId:",
      data.id,
      "| platform:",
      data.platform,
      "| name:",
      data.name || data.nickname
    )
  })

  console.log("\nChecking for SMS notifications...")
  console.log(
    "Path: users/" + userId + "/devices/" + deviceId + "/notifications"
  )

  // Get ALL notifications first
  const allNotifs = await getDocs(
    query(
      collection(db, "users", userId, "devices", deviceId, "notifications"),
      limit(10)
    )
  )

  console.log("\n=== ALL notifications count:", allNotifs.size, "===")
  allNotifs.forEach((d) => {
    const data = d.data()
    console.log("  -", d.id, "| type:", data.type, "| title:", data.title)
  })

  // Get SMS only
  const smsNotifs = await getDocs(
    query(
      collection(db, "users", userId, "devices", deviceId, "notifications"),
      where("type", "==", "sms"),
      limit(30)
    )
  )

  console.log("\n=== SMS notifications count:", smsNotifs.size, "===")
  smsNotifs.forEach((d) => {
    const data = d.data()
    console.log("  -", d.id)
    console.log("    phone:", data.phoneNumber)
    console.log("    text:", data.text?.substring(0, 50))
    console.log("    timestamp:", data.timestamp)
  })

  process.exit(0)
}

check().catch((e) => {
  console.error("Error:", e)
  process.exit(1)
})
