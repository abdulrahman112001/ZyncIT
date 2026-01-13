import { initializeApp } from "firebase/app"
import { getFirestore, collection, doc, deleteDoc } from "firebase/firestore"
import firebaseConfig from "./firebase-config.js"

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function deleteDuplicate() {
  const docId = "sms_android_7249382ed438e159_1768238373000_+201023395696"

  console.log(`Deleting duplicate message: ${docId}`)

  const docRef = doc(
    db,
    "users/4OsnkeWHkAedXL7cD0OLCuKDZky1/devices/android_7249382ed438e159/notifications",
    docId
  )

  await deleteDoc(docRef)

  console.log(`✅ Deleted: ${docId}`)
}

deleteDuplicate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err)
    process.exit(1)
  })
