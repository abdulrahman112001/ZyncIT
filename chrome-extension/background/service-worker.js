// ZyncIT Background Service Worker
// Handles notifications, real-time sync, and background tasks

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js"
import {
  getAuth,
  onAuthStateChanged,
  signInWithCredential,
  GoogleAuthProvider,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"

// Firebase config - imported from external file
import firebaseConfig from "../firebase-config.js"

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

let currentUser = null
let currentDeviceId = null
let lastNotificationTimestamp = Date.now()
let unsubscribeNotifications = []

// Listen for auth state changes
onAuthStateChanged(auth, async (user) => {
  console.log("ZyncIT: Auth state changed:", user ? user.uid : "no user")
  if (user) {
    currentUser = user
    await loadDeviceId()
    startListening()
  } else {
    currentUser = null
    currentDeviceId = null
    // Cleanup all listeners
    unsubscribeNotifications.forEach((unsub) => unsub())
    unsubscribeNotifications = []
  }
})

// Load device ID from storage
async function loadDeviceId() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["deviceId"], (result) => {
      currentDeviceId = result.deviceId
      console.log("ZyncIT: Loaded deviceId:", currentDeviceId)
      resolve(currentDeviceId)
    })
  })
}

// Start listening for new notifications from ALL user devices
async function startListening() {
  if (!currentUser) {
    console.log("ZyncIT: Cannot start listening - no user")
    return
  }

  console.log("ZyncIT: Starting to listen for notifications from all devices")

  // Stop previous listeners
  unsubscribeNotifications.forEach((unsub) => unsub())
  unsubscribeNotifications = []

  // Get all user devices
  const devicesQuery = query(
    collection(db, "devices"),
    where("userId", "==", currentUser.uid)
  )

  try {
    const devicesSnapshot = await getDocs(devicesQuery)
    console.log("ZyncIT: Found", devicesSnapshot.size, "devices")

    devicesSnapshot.forEach((doc) => {
      const device = doc.data()
      // Only listen to mobile devices (not extension)
      if (
        device.platform !== "chrome" &&
        device.platform !== "chrome-extension" &&
        !device.id?.startsWith("ext_")
      ) {
        console.log(
          "ZyncIT: Listening to device:",
          device.id,
          "| platform:",
          device.platform
        )
        listenToDevice(device.id)
      } else {
        console.log("ZyncIT: Skipping extension device:", device.id)
      }
    })
  } catch (error) {
    console.error("ZyncIT: Error getting devices:", error)
  }
}

// Listen to notifications from a specific device
function listenToDevice(deviceId) {
  console.log(
    "ZyncIT: Path: users/" +
      currentUser.uid +
      "/devices/" +
      deviceId +
      "/notifications"
  )

  const notificationsQuery = query(
    collection(
      db,
      "users",
      currentUser.uid,
      "devices",
      deviceId,
      "notifications"
    ),
    limit(20)
  )

  const unsub = onSnapshot(
    notificationsQuery,
    (snapshot) => {
      console.log(
        "ZyncIT: Snapshot from device",
        deviceId,
        "- changes:",
        snapshot.docChanges().length
      )
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const notification = change.doc.data()
          const notificationTime =
            notification.timestamp || notification.receivedAt || Date.now()

          console.log(
            "ZyncIT: New notification:",
            notification.type,
            notification.title,
            "time:",
            notificationTime
          )

          // Only show notifications newer than when we started listening
          if (notificationTime > lastNotificationTimestamp) {
            showNotification(notification)
            lastNotificationTimestamp = notificationTime

            // Send update to popup
            chrome.runtime
              .sendMessage({
                type: "newNotification",
                data: notification,
              })
              .catch(() => {
                // Popup may not be open, ignore error
              })
          }
        }
      })
    },
    (error) => {
      console.error(
        "ZyncIT: Firestore listener error for device",
        deviceId,
        ":",
        error
      )
    }
  )

  unsubscribeNotifications.push(unsub)
}

// Also listen for calls (separate collection)
function listenForCalls() {
  if (!currentUser || !currentDeviceId) return

  const callsQuery = query(
    collection(
      db,
      "users",
      currentUser.uid,
      "devices",
      currentDeviceId,
      "calls"
    ),
    orderBy("timestamp", "desc"),
    limit(5)
  )

  onSnapshot(callsQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const call = change.doc.data()
        if (call.timestamp > lastNotificationTimestamp) {
          showCallNotification(call)
        }
      }
    })
  })
}

// Show Chrome notification
function showNotification(data) {
  const title = data.title || "New Notification"
  const message = data.content || data.text || ""
  const iconUrl = "assets/icon128.png"

  console.log("ZyncIT: Showing notification:", title, message)

  chrome.notifications.create({
    type: "basic",
    iconUrl: iconUrl,
    title: title,
    message: message,
    priority: 2,
  })
}

function showCallNotification(call) {
  const title =
    call.type === "missed"
      ? "Missed call from " + (call.contactName || call.phoneNumber)
      : "Call from " + (call.contactName || call.phoneNumber)
  const message = "Duration: " + formatDuration(call.duration || 0)

  chrome.notifications.create({
    type: "basic",
    iconUrl: "assets/icon128.png",
    title: title,
    message: message,
    priority: 2,
  })
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return mins + ":" + secs.toString().padStart(2, "0")
}

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.action.openPopup()
})

// Keep service worker alive
chrome.alarms.create("keepAlive", { periodInMinutes: 1 })

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keepAlive") {
    console.log("ZyncIT: Heartbeat")
  }
})

// Handle extension install/update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("ZyncIT extension installed")
  } else if (details.reason === "update") {
    console.log("ZyncIT extension updated")
  }
})

// Message handler from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("ZyncIT: Message received:", message)

  if (message.type === "setDeviceId") {
    currentDeviceId = message.deviceId
    chrome.storage.local.set({ deviceId: message.deviceId })
    console.log("ZyncIT: Device ID set to:", message.deviceId)
    startListening()
    sendResponse({ success: true })
  }

  if (message.type === "getStatus") {
    sendResponse({
      user: currentUser
        ? { uid: currentUser.uid, email: currentUser.email }
        : null,
      deviceId: currentDeviceId,
      listening: unsubscribeNotifications.length > 0,
    })
  }

  return true
})

console.log("ZyncIT Background Service Worker started")
