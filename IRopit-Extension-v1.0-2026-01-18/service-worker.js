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
// تحميل آخر timestamp من التخزين، أو استخدام وقت قبل 5 دقائق للسماح برسائل جديدة
let lastNotificationTimestamp = Date.now() - 5 * 60 * 1000 // 5 minutes ago
let unsubscribeNotifications = []
let seenNotifications = new Set() // لتجنب تكرار الإشعارات

// تحميل آخر timestamp من التخزين
chrome.storage.local.get(
  ["lastNotificationTimestamp", "seenNotifications"],
  (result) => {
    if (result.lastNotificationTimestamp) {
      lastNotificationTimestamp = result.lastNotificationTimestamp
   
    }
    if (result.seenNotifications) {
      seenNotifications = new Set(result.seenNotifications)
    }
  }
)

// Listen for auth state changes
onAuthStateChanged(auth, async (user) => {
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
      resolve(currentDeviceId)
    })
  })
}

// Start listening for new notifications from ALL user devices
async function startListening() {
  if (!currentUser) {
    return
  }


  // Stop previous listeners
  unsubscribeNotifications.forEach((unsub) => unsub())
  unsubscribeNotifications = []

  // 1. Listen to user-level notifications (WhatsApp, Telegram, etc.)
  listenToUserNotifications()

  // 2. Get all user devices
  const devicesQuery = query(
    collection(db, "devices"),
    where("userId", "==", currentUser.uid)
  )

  try {
    const devicesSnapshot = await getDocs(devicesQuery)

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
          device.platform,
          "| name:",
          device.nickname || device.name || device.model
        )
        // Prefer nickname, then name if human-readable
        let friendlyName = device.nickname;
        if (!friendlyName) {
          if (device.name && /[a-zA-Z]/.test(device.name) && !/^[A-Z0-9]+$/.test(device.name)) {
            friendlyName = device.name;
          } else {
            const platform = (device.platform || '').toLowerCase();
            friendlyName = platform === 'ios' ? 'iPhone' : (platform === 'android' ? 'Android' : 'Device');
          }
        }
        listenToDevice(device.id, friendlyName)
      } else {
        console.log("ZyncIT: Skipping extension device:", device.id)
      }
    })
  } catch (error) {
    console.error("ZyncIT: Error getting devices:", error)
  }
}

// Listen to user-level notifications (WhatsApp, Telegram, etc.)
function listenToUserNotifications() {
  if (!currentUser) return

  console.log("ZyncIT: Listening to user-level notifications at: users/" + currentUser.uid + "/notifications")

  const userNotificationsQuery = query(
    collection(db, "users", currentUser.uid, "notifications"),
    limit(50)
  )

  const unsub = onSnapshot(
    userNotificationsQuery,
    (snapshot) => {
      console.log(
        "ZyncIT: User notifications snapshot - changes:",
        snapshot.docChanges().length,
        "- total:",
        snapshot.size
      )

      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const notification = change.doc.data()
          const docId = change.doc.id
          const notificationTime =
            notification.timestamp || notification.createdAt?.toMillis?.() || Date.now()

          console.log(
            "ZyncIT: New user notification:",
            notification.type || notification.appName,
            notification.title,
            "time:",
            new Date(notificationTime).toLocaleString(),
            "docId:",
            docId
          )

          // Skip if already seen
          if (seenNotifications.has(docId)) {
            console.log("ZyncIT: User notification already seen, skipping:", docId)
            return
          }

          // Add to seen list
          seenNotifications.add(docId)

          // Save to storage (keep last 100)
          const seenArray = Array.from(seenNotifications).slice(-100)
          chrome.storage.local.set({
            seenNotifications: seenArray,
            lastNotificationTimestamp: Date.now(),
          })

          // Only show if notification is recent (last 10 minutes)
          const tenMinutesAgo = Date.now() - 10 * 60 * 1000
          if (notificationTime > tenMinutesAgo) {
            showNotification(notification)
            console.log("ZyncIT: ✅ User notification shown:", notification.title)
          } else {
            console.log(
              "ZyncIT: ⏭️ User notification too old, not showing:",
              notification.title
            )
          }

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
      })
    },
    (error) => {
      console.error("ZyncIT: User notifications listener error:", error)
    }
  )

  unsubscribeNotifications.push(unsub)
}

// Listen to notifications from a specific device
function listenToDevice(deviceId, deviceName) {
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
    limit(50) // زيادة الحد للحصول على رسائل أكثر
  )

  const unsub = onSnapshot(
    notificationsQuery,
    (snapshot) => {
      console.log(
        "ZyncIT: Snapshot from device",
        deviceId,
        "- changes:",
        snapshot.docChanges().length,
        "- total:",
        snapshot.size
      )
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const notification = change.doc.data()
          const docId = change.doc.id
          const notificationTime =
            notification.timestamp || notification.receivedAt || Date.now()

          console.log(
            "ZyncIT: New notification:",
            notification.type,
            notification.title,
            "time:",
            new Date(notificationTime).toLocaleString(),
            "docId:",
            docId
          )

          // تجنب تكرار الإشعارات باستخدام docId
          if (seenNotifications.has(docId)) {
            console.log("ZyncIT: Notification already seen, skipping:", docId)
            return
          }

          // إضافة للقائمة المرئية
          seenNotifications.add(docId)

          // حفظ في التخزين (آخر 100 إشعار فقط)
          const seenArray = Array.from(seenNotifications).slice(-100)
          chrome.storage.local.set({
            seenNotifications: seenArray,
            lastNotificationTimestamp: Date.now(),
          })

          // عرض الإشعار فقط إذا كان جديداً (آخر 10 دقائق)
          const tenMinutesAgo = Date.now() - 10 * 60 * 1000
          if (notificationTime > tenMinutesAgo) {
            // إضافة اسم الجهاز للإشعار
            const notificationWithDevice = {
              ...notification,
              deviceName: deviceName || notification.deviceName
            }
            showNotification(notificationWithDevice)
            console.log("ZyncIT: ✅ Notification shown:", notification.title)
          } else {
            console.log(
              "ZyncIT: ⏭️ Notification too old, not showing:",
              notification.title
            )
          }

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
  
  // Also listen for calls from this device
  listenForCallsFromDevice(deviceId, deviceName)
}

// Listen for calls from a specific device
function listenForCallsFromDevice(deviceId, deviceName) {
  if (!currentUser) return

  console.log("ZyncIT: Listening for calls from device:", deviceId)

  const callsQuery = query(
    collection(
      db,
      "users",
      currentUser.uid,
      "devices",
      deviceId,
      "calls"
    ),
    limit(10)
  )

  const unsub = onSnapshot(callsQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const call = change.doc.data()
        const docId = change.doc.id
        const callTime = call.timestamp || Date.now()
        
        // Skip if already seen
        const callKey = `call_${docId}`
        if (seenNotifications.has(callKey)) {
          return
        }
        
        // Only show recent calls (last 5 minutes)
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
        if (callTime > fiveMinutesAgo) {
          seenNotifications.add(callKey)
          
          // Add device name
          const callWithDevice = {
            ...call,
            deviceName: deviceName || call.deviceName
          }
          showCallNotification(callWithDevice)
          console.log("ZyncIT: ✅ Call notification shown:", call.type, call.phoneNumber)
        }
      }
    })
  }, (error) => {
    console.error("ZyncIT: Call listener error for device", deviceId, ":", error)
  })

  unsubscribeNotifications.push(unsub)
}

// Show Chrome notification
function showNotification(data) {
  const appName = data.appName || data.packageName || "App"
  const title = data.title || data.contactName || "New Notification"
  const message = data.content || data.text || data.body || ""
  const iconUrl = chrome.runtime.getURL("assets/icon128.png")
  const notificationType = data.type || "notification"
  
  // Create unique notification ID to avoid duplicates
  const notificationId = `zyncit_${data.id || Date.now()}`

  console.log("ZyncIT: Showing notification:", title, message, "type:", notificationType)

  // Build notification options based on type
  let notificationOptions = {
    type: "basic",
    iconUrl: iconUrl,
    title: title,
    message: message,
    priority: 2,
    requireInteraction: false,
    silent: false,
  }
  
  // Customize based on notification type
  if (notificationType === "sms") {
    notificationOptions.title = `📱 SMS: ${title}`
    notificationOptions.contextMessage = "New SMS message"
  } else if (notificationType === "whatsapp" || data.packageName === "com.whatsapp") {
    notificationOptions.title = `💬 WhatsApp: ${title}`
    notificationOptions.contextMessage = "WhatsApp message"
  } else if (data.packageName === "com.instagram.android") {
    notificationOptions.title = `📸 Instagram: ${title}`
  } else if (data.packageName === "com.snapchat.android") {
    notificationOptions.title = `👻 Snapchat: ${title}`
  } else if (data.packageName === "com.facebook.orca") {
    notificationOptions.title = `💬 Messenger: ${title}`
  } else if (data.packageName === "org.telegram.messenger") {
    notificationOptions.title = `✈️ Telegram: ${title}`
  }
  
  // Add device info if available
  if (data.deviceName) {
    notificationOptions.contextMessage = `From: ${data.deviceName}`
  }

  chrome.notifications.create(notificationId, notificationOptions, (createdId) => {
    if (chrome.runtime.lastError) {
      console.error("ZyncIT: Error creating notification:", chrome.runtime.lastError)
    } else {
      console.log("ZyncIT: Notification created:", createdId)
    }
  })
}

function showCallNotification(call) {
  const contactInfo = call.contactName || call.phoneNumber || "Unknown"
  const callType = call.type || "incoming"
  const deviceInfo = call.deviceName ? ` • ${call.deviceName}` : ""
  
  let title = ""
  let icon = ""
  
  switch(callType) {
    case "missed":
      title = `📵 Missed call from ${contactInfo}`
      break
    case "incoming":
      title = `📞 Incoming call from ${contactInfo}`
      break
    case "outgoing":
      title = `📲 Outgoing call to ${contactInfo}`
      break
    case "rejected":
      title = `❌ Rejected call from ${contactInfo}`
      break
    default:
      title = `📞 Call: ${contactInfo}`
  }
  
  const message = `Duration: ${formatDuration(call.duration || 0)}${deviceInfo}`
  const notificationId = `zyncit_call_${call.id || Date.now()}`

  chrome.notifications.create(notificationId, {
    type: "basic",
    iconUrl: chrome.runtime.getURL("assets/icon128.png"),
    title: title,
    message: message,
    priority: 2,
    requireInteraction: callType === "missed", // Keep missed calls until user clicks
  }, (createdId) => {
    if (chrome.runtime.lastError) {
      console.error("ZyncIT: Error creating call notification:", chrome.runtime.lastError)
    } else {
      console.log("ZyncIT: Call notification created:", createdId)
    }
  })
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return mins + ":" + secs.toString().padStart(2, "0")
}

// Handle notification clicks - open extension or create new window
chrome.notifications.onClicked.addListener(async (notificationId) => {
  try {
    // Try to open the popup (only works if there's an active browser window)
    await chrome.action.openPopup()
  } catch (error) {
    console.log("ZyncIT: Could not open popup, trying to create/focus window")
    try {
      // Find existing Chrome windows
      const windows = await chrome.windows.getAll({ windowTypes: ["normal"] })
      if (windows.length > 0) {
        // Focus the first window
        await chrome.windows.update(windows[0].id, { focused: true })
      } else {
        // Create a new window
        await chrome.windows.create({ 
          url: "chrome://extensions",
          type: "normal",
          focused: true
        })
      }
    } catch (e) {
      console.error("ZyncIT: Error handling notification click:", e)
    }
  }
  
  // Clear the notification
  chrome.notifications.clear(notificationId)
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
      listenersCount: unsubscribeNotifications.length,
      seenCount: seenNotifications.size,
    })
  }

  // إعادة تفعيل الاستماع عند تسجيل الدخول من popup
  if (message.type === "userLoggedIn") {
    console.log("ZyncIT: User logged in notification from popup")
    // Auth state should update automatically, but force restart listening
    if (currentUser) {
      console.log("ZyncIT: Restarting listeners for user:", currentUser.uid)
      startListening()
    }
    sendResponse({ success: true })
  }

  // مسح الإشعارات المرئية (عند تسجيل الخروج أو إعادة التعيين)
  if (message.type === "clearSeenNotifications") {
    seenNotifications.clear()
    chrome.storage.local.remove([
      "seenNotifications",
      "lastNotificationTimestamp",
    ])
    console.log("ZyncIT: Cleared seen notifications")
    sendResponse({ success: true })
  }

  // طلب إعادة بدء الاستماع يدوياً
  if (message.type === "restartListening") {
    console.log("ZyncIT: Manual restart listening requested")
    startListening()
    sendResponse({ success: true, listening: true })
  }

  return true
})

console.log("ZyncIT Background Service Worker started")
