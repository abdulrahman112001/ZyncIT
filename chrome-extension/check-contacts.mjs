// Check contacts in Firebase
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  limit,
} from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

// Import your firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA_Me3_sF5j0iXj2WYEshTw6QoTOim_Ppg",
  authDomain: "iropit-64ea0.firebaseapp.com",
  projectId: "iropit-64ea0",
  storageBucket: "iropit-64ea0.firebasestorage.app",
  messagingSenderId: "723637478368",
  appId: "1:723637478368:web:277907c0fe3aa0db38c185",
  measurementId: "G-CFH48HR9R2",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function checkContacts() {
  try {
    // Sign in (use your test credentials)
    const email = process.argv[2] || "test@test.com";
    const password = process.argv[3] || "test123";

    console.log(`Signing in as ${email}...`);
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const userId = userCred.user.uid;
    console.log(`User ID: ${userId}`);

    // Get devices
    const devicesRef = collection(db, "users", userId, "devices");
    const devicesSnap = await getDocs(devicesRef);

    console.log(`\nFound ${devicesSnap.size} devices:`);

    for (const deviceDoc of devicesSnap.docs) {
      const deviceData = deviceDoc.data();
      console.log(`\n📱 Device: ${deviceDoc.id}`);
      console.log(
        `   Name: ${deviceData.name || deviceData.model || "Unknown"}`,
      );
      console.log(`   Platform: ${deviceData.platform}`);

      // Check contacts for this device
      const contactsRef = collection(
        db,
        "users",
        userId,
        "devices",
        deviceDoc.id,
        "contacts",
      );
      const contactsQuery = query(contactsRef, limit(5));
      const contactsSnap = await getDocs(contactsQuery);

      console.log(`   Contacts: ${contactsSnap.size} (showing first 5)`);

      contactsSnap.forEach((doc) => {
        const c = doc.data();
        console.log(`     - ${c.name}: ${c.phoneNumber}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

checkContacts();
