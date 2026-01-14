import { initializeApp } from "firebase/app"
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore"
import firebaseConfig from "./firebase-config.js"

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function checkDuplicates() {
  const timestamp = 1768238373000

  console.log(`\nChecking messages with timestamp: ${timestamp}\n`)

  const q = query(
    collection(
      db,
      "users/4OsnkeWHkAedXL7cD0OLCuKDZky1/devices/android_7249382ed438e159/notifications"
    ),
    where("timestamp", "==", timestamp)
  )

  const snapshot = await getDocs(q)


  snapshot.forEach((doc) => {
    const data = doc.data()
   
  })
}

checkDuplicates()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err)
    process.exit(1)
  })
