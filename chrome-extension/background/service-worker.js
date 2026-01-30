// ZyncIT Background Service Worker
// Handles notifications, real-time sync, and background tasks

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithCredential,
  GoogleAuthProvider,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Firebase config - imported from external file
import firebaseConfig from "../firebase-config.js";

console.log("ZyncIT: Service Worker starting...");

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("ZyncIT: Firebase initialized");

let currentUser = null;
let currentDeviceId = null;
// Store last timestamp to avoid duplicate notifications
let lastNotificationTimestamp = Date.now() - 5 * 60 * 1000; // 5 minutes ago
let unsubscribeNotifications = [];
let seenNotifications = new Set(); // Track seen notifications
let isInitialLoad = true; // Flag to skip initial snapshot
let serviceWorkerStartTime = Date.now(); // Track when SW started

// Load timestamp from storage
chrome.storage.local.get(
  ["lastNotificationTimestamp", "seenNotifications"],
  (result) => {
    console.log(
      "ZyncIT: Loading stored data - seenNotifications:",
      result.seenNotifications?.length || 0,
    );
    if (result.lastNotificationTimestamp) {
      lastNotificationTimestamp = result.lastNotificationTimestamp;
    }
    if (result.seenNotifications) {
      seenNotifications = new Set(result.seenNotifications);
    }
  },
);

// Listen for auth state changes
onAuthStateChanged(auth, async (user) => {
  console.log("ZyncIT: Auth state changed", user ? user.email : "(logged out)");
  if (user) {
    currentUser = user;
    await loadDeviceId();
    console.log("ZyncIT: Starting listeners for user:", user.uid);
    startListening();
  } else {
    currentUser = null;
    currentDeviceId = null;
    console.log("ZyncIT: User logged out, stopping listeners");
    // Cleanup all listeners
    unsubscribeNotifications.forEach((unsub) => unsub());
    unsubscribeNotifications = [];
  }
});

// Load device ID from storage
async function loadDeviceId() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["deviceId"], (result) => {
      currentDeviceId = result.deviceId;
      resolve(currentDeviceId);
    });
  });
}

// Start listening for new notifications from ALL user devices
async function startListening() {
  if (!currentUser) {
    console.log("ZyncIT: Cannot start listening - no user");
    return;
  }

  console.log("ZyncIT: Starting real-time listeners...");

  // Stop previous listeners
  unsubscribeNotifications.forEach((unsub) => unsub());
  unsubscribeNotifications = [];

  // 1. Listen to user-level notifications (WhatsApp, Telegram, etc.)
  listenToUserNotifications();

  // 2. Get all user devices
  const devicesQuery = query(
    collection(db, "devices"),
    where("userId", "==", currentUser.uid),
  );

  try {
    const devicesSnapshot = await getDocs(devicesQuery);

    devicesSnapshot.forEach((doc) => {
      const device = doc.data();
      // Only listen to mobile devices (not extension)
      if (
        device.platform !== "chrome" &&
        device.platform !== "chrome-extension" &&
        !device.id?.startsWith("ext_")
      ) {
        // Prefer nickname, then name if human-readable
        let friendlyName = device.nickname;
        if (!friendlyName) {
          if (
            device.name &&
            /[a-zA-Z]/.test(device.name) &&
            !/^[A-Z0-9]+$/.test(device.name)
          ) {
            friendlyName = device.name;
          } else {
            const platform = (device.platform || "").toLowerCase();
            friendlyName =
              platform === "ios"
                ? "iPhone"
                : platform === "android"
                  ? "Android"
                  : "Device";
          }
        }
        console.log("ZyncIT: Listening to device:", device.id, friendlyName);
        listenToDevice(device.id, friendlyName);
      } else {
        console.log("ZyncIT: Skipping extension device:", device.id);
      }
    });
    console.log(
      "ZyncIT: Total listeners active:",
      unsubscribeNotifications.length,
    );
  } catch (error) {
    console.error("ZyncIT: Error getting devices:", error);
  }
}

// Listen to user-level notifications (WhatsApp, Telegram, etc.)
function listenToUserNotifications() {
  if (!currentUser) return;

  let isFirstSnapshot = true;

  const userNotificationsQuery = query(
    collection(db, "users", currentUser.uid, "notifications"),
    limit(50),
  );

  const unsub = onSnapshot(
    userNotificationsQuery,
    (snapshot) => {
      console.log(
        "ZyncIT: User notifications snapshot - changes:",
        snapshot.docChanges().length,
        "- total:",
        snapshot.size,
        "- isFirstSnapshot:",
        isFirstSnapshot,
      );

      // Skip the initial snapshot (all existing docs come as 'added')
      if (isFirstSnapshot) {
        isFirstSnapshot = false;
        // Mark all existing docs as seen
        snapshot.docs.forEach((doc) => seenNotifications.add(doc.id));
        console.log(
          "ZyncIT: Initial load - marked",
          snapshot.size,
          "notifications as seen",
        );
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const notification = change.doc.data();
          const docId = change.doc.id;
          const notificationTime =
            notification.timestamp ||
            notification.createdAt?.toMillis?.() ||
            Date.now();

          console.log(
            "ZyncIT: 🆕 NEW notification received - time:",
            new Date(notificationTime).toLocaleString(),
            "docId:",
            docId,
          );

          // Skip if already seen
          if (seenNotifications.has(docId)) {
            console.log("ZyncIT: Skipping already seen notification:", docId);
            return;
          }

          // Add to seen list
          seenNotifications.add(docId);

          // Save to storage (keep last 200)
          const seenArray = Array.from(seenNotifications).slice(-1000);
          chrome.storage.local.set({
            seenNotifications: seenArray,
            lastNotificationTimestamp: Date.now(),
          });

          // Show notification immediately for new ones!
          console.log(
            "ZyncIT: 🔔 Showing Chrome notification for:",
            notification.title,
          );
          showNotification(notification);

          // Send update to popup
          chrome.runtime
            .sendMessage({
              type: "newNotification",
              data: notification,
            })
            .catch(() => {
              // Popup may not be open, ignore error
            });
        }
      });
    },
    (error) => {
      console.error("ZyncIT: User notifications listener error:", error);
    },
  );

  unsubscribeNotifications.push(unsub);
}

// Listen to notifications from a specific device
function listenToDevice(deviceId, deviceName) {
  let isFirstSnapshot = true;

  const notificationsQuery = query(
    collection(
      db,
      "users",
      currentUser.uid,
      "devices",
      deviceId,
      "notifications",
    ),
    limit(50), // Limit to recent notifications
  );

  const unsub = onSnapshot(
    notificationsQuery,
    (snapshot) => {
      console.log(
        "ZyncIT: Device snapshot [",
        deviceName,
        "] - changes:",
        snapshot.docChanges().length,
        "- total:",
        snapshot.size,
        "- isFirstSnapshot:",
        isFirstSnapshot,
      );

      // Skip the initial snapshot (all existing docs come as 'added')
      if (isFirstSnapshot) {
        isFirstSnapshot = false;
        // Mark all existing docs as seen
        snapshot.docs.forEach((doc) => seenNotifications.add(doc.id));
        console.log(
          "ZyncIT: Initial load for",
          deviceName,
          "- marked",
          snapshot.size,
          "notifications as seen",
        );
        return;
      }

      snapshot.docChanges().forEach((change) => {
        console.log(
          "ZyncIT: Change type:",
          change.type,
          "docId:",
          change.doc.id,
        );

        // Handle both 'added' AND 'modified' - modified means the doc was updated
        if (change.type === "added" || change.type === "modified") {
          const notification = change.doc.data();
          const docId = change.doc.id;
          const notificationTime =
            notification.timestamp || notification.receivedAt || Date.now();

          // Create a unique key combining docId and timestamp to detect real updates
          const uniqueKey = `${docId}_${notificationTime}`;

          const timeDiff = Date.now() - notificationTime;
          const isRecent = timeDiff < 5 * 60 * 1000; // 5 minutes

          console.log(
            "ZyncIT: 🆕 Notification from",
            deviceName,
            "- title:",
            notification.title,
            "- time:",
            new Date(notificationTime).toLocaleString(),
            "- age:",
            Math.round(timeDiff / 1000),
            "seconds",
            "- isRecent:",
            isRecent,
          );

          // Skip if already seen using unique key (docId + timestamp)
          if (seenNotifications.has(uniqueKey)) {
            console.log("ZyncIT: ⏭️ Skipping already seen:", uniqueKey);
            return;
          }

          // Only show if notification is recent (last 5 minutes) - increased from 2
          if (!isRecent) {
            console.log(
              "ZyncIT: ⏭️ Skipping old notification (age:",
              Math.round(timeDiff / 1000),
              "seconds)",
            );
            return;
          }

          // Mark as seen with unique key
          seenNotifications.add(uniqueKey);
          console.log("ZyncIT: ✅ Marked as seen, showing notification...");

          // Keep only last 200 seen
          const seenArray = Array.from(seenNotifications).slice(-200);
          chrome.storage.local.set({
            seenNotifications: seenArray,
            lastNotificationTimestamp: Date.now(),
          });

          // Show notification immediately!
          console.log(
            "ZyncIT: 🔔 CREATING Chrome notification for:",
            notification.title || notification.contactName,
          );
          const notificationWithDevice = {
            ...notification,
            deviceName: deviceName || notification.deviceName,
          };
          showNotification(notificationWithDevice);

          // Send update to popup
          chrome.runtime
            .sendMessage({
              type: "newNotification",
              data: notification,
            })
            .catch(() => {
              // Popup may not be open, ignore error
            });
        }
      });
    },
    (error) => {
      console.error(
        "ZyncIT: Firestore listener error for device",
        deviceId,
        ":",
        error,
      );
    },
  );

  unsubscribeNotifications.push(unsub);

  // Also listen for calls from this device
  listenForCallsFromDevice(deviceId, deviceName);
}

// Listen for calls from a specific device
function listenForCallsFromDevice(deviceId, deviceName) {
  if (!currentUser) return;

  const callsQuery = query(
    collection(db, "users", currentUser.uid, "devices", deviceId, "calls"),
    limit(10),
  );

  const unsub = onSnapshot(
    callsQuery,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const call = change.doc.data();
          const docId = change.doc.id;
          const callTime = call.timestamp || Date.now();

          // Skip if already seen
          const callKey = `call_${docId}`;
          if (seenNotifications.has(callKey)) {
            return;
          }

          // Only show recent calls (last 5 minutes)
          const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
          if (callTime > fiveMinutesAgo) {
            seenNotifications.add(callKey);

            // Add device name
            const callWithDevice = {
              ...call,
              deviceName: deviceName || call.deviceName,
            };
            showCallNotification(callWithDevice);
          }
        }
      });
    },
    (error) => {
      console.error(
        "ZyncIT: Call listener error for device",
        deviceId,
        ":",
        error,
      );
    },
  );

  unsubscribeNotifications.push(unsub);
}

// Show Chrome notification
function showNotification(data) {
  const appName = data.appName || data.packageName || "App";
  const title = data.title || data.contactName || "New Notification";
  const message = data.content || data.text || data.body || "";
  const iconUrl = chrome.runtime.getURL("assets/icon128.png");
  const notificationType = data.type || "notification";

  // Create unique notification ID to avoid duplicates
  const notificationId = `zyncit_${data.id || Date.now()}`;

  // Build notification options based on type
  let notificationOptions = {
    type: "basic",
    iconUrl: iconUrl,
    title: title,
    message: message,
    priority: 2,
    requireInteraction: false,
    silent: false,
  };

  // Customize based on notification type
  if (notificationType === "sms") {
    notificationOptions.title = `?? SMS: ${title}`;
    notificationOptions.contextMessage = "New SMS message";
  } else if (
    notificationType === "whatsapp" ||
    data.packageName === "com.whatsapp"
  ) {
    notificationOptions.title = `?? WhatsApp: ${title}`;
    notificationOptions.contextMessage = "WhatsApp message";
  } else if (data.packageName === "com.instagram.android") {
    notificationOptions.title = `?? Instagram: ${title}`;
  } else if (data.packageName === "com.snapchat.android") {
    notificationOptions.title = `?? Snapchat: ${title}`;
  } else if (data.packageName === "com.facebook.orca") {
    notificationOptions.title = `?? Messenger: ${title}`;
  } else if (data.packageName === "org.telegram.messenger") {
    notificationOptions.title = `?? Telegram: ${title}`;
  }

  // Add device info if available
  if (data.deviceName) {
    notificationOptions.contextMessage = `From: ${data.deviceName}`;
  }

  console.log(
    "ZyncIT: Creating Chrome notification:",
    notificationId,
    notificationOptions.title,
  );

  chrome.notifications.create(
    notificationId,
    notificationOptions,
    (createdId) => {
      if (chrome.runtime.lastError) {
        console.error(
          "ZyncIT: Error creating notification:",
          chrome.runtime.lastError,
        );
      } else {
        console.log("ZyncIT: ✅ Chrome notification created:", createdId);
      }
    },
  );
}

function showCallNotification(call) {
  const contactInfo = call.contactName || call.phoneNumber || "Unknown";
  const callType = call.type || "incoming";
  const deviceInfo = call.deviceName ? ` - ${call.deviceName}` : "";

  let title = "";
  let icon = "";

  switch (callType) {
    case "missed":
      title = `Missed call from ${contactInfo}`;
      break;
    case "incoming":
      title = `Incoming call from ${contactInfo}`;
      break;
    case "outgoing":
      title = `Outgoing call to ${contactInfo}`;
      break;
    case "rejected":
      title = `Rejected call from ${contactInfo}`;
      break;
    default:
      title = `Call: ${contactInfo}`;
  }

  const message = `Duration: ${formatDuration(call.duration || 0)}${deviceInfo}`;
  const notificationId = `zyncit_call_${call.id || Date.now()}`;

  chrome.notifications.create(
    notificationId,
    {
      type: "basic",
      iconUrl: chrome.runtime.getURL("assets/icon128.png"),
      title: title,
      message: message,
      priority: 2,
      requireInteraction: callType === "missed", // Keep missed calls until user clicks
    },
    (createdId) => {
      if (chrome.runtime.lastError) {
        console.error(
          "ZyncIT: Error creating call notification:",
          chrome.runtime.lastError,
        );
      } else {
      }
    },
  );
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins + ":" + secs.toString().padStart(2, "0");
}

// Handle notification clicks - open extension or create new window
chrome.notifications.onClicked.addListener(async (notificationId) => {
  try {
    // Try to open the popup (only works if there's an active browser window)
    await chrome.action.openPopup();
  } catch (error) {
    try {
      // Find existing Chrome windows
      const windows = await chrome.windows.getAll({ windowTypes: ["normal"] });
      if (windows.length > 0) {
        // Focus the first window
        await chrome.windows.update(windows[0].id, { focused: true });
      } else {
        // Create a new window
        await chrome.windows.create({
          url: "chrome://extensions",
          type: "normal",
          focused: true,
        });
      }
    } catch (e) {
      console.error("ZyncIT: Error handling notification click:", e);
    }
  }

  // Clear the notification
  chrome.notifications.clear(notificationId);
});

// Keep service worker alive - CRITICAL for real-time notifications
chrome.alarms.create("keepAlive", { periodInMinutes: 0.25 }); // Every 15 seconds
chrome.alarms.create("checkNotifications", { periodInMinutes: 0.17 }); // Every ~10 seconds

// Poll for new notifications (backup for when onSnapshot fails)
async function pollForNewNotifications() {
  if (!currentUser) return;

  try {
    // Get devices
    const devicesQuery = query(
      collection(db, "devices"),
      where("userId", "==", currentUser.uid),
    );
    const devicesSnapshot = await getDocs(devicesQuery);

    for (const deviceDoc of devicesSnapshot.docs) {
      const device = deviceDoc.data();
      if (
        device.platform === "chrome" ||
        device.platform === "chrome-extension"
      )
        continue;

      // Check for new notifications from this device
      const notifQuery = query(
        collection(
          db,
          "users",
          currentUser.uid,
          "devices",
          device.id,
          "notifications",
        ),
        where("timestamp", ">", lastNotificationTimestamp),
        orderBy("timestamp", "desc"),
        limit(10),
      );

      const notifSnapshot = await getDocs(notifQuery);

      notifSnapshot.forEach((doc) => {
        const notification = doc.data();
        const docId = doc.id;

        // Skip if already seen
        if (seenNotifications.has(docId)) return;

        console.log(
          "ZyncIT: 📬 POLL found new notification:",
          notification.title || notification.contactName,
        );

        // Mark as seen
        seenNotifications.add(docId);
        const seenArray = Array.from(seenNotifications).slice(-200);
        chrome.storage.local.set({ seenNotifications: seenArray });

        // Update last timestamp
        if (notification.timestamp > lastNotificationTimestamp) {
          lastNotificationTimestamp = notification.timestamp;
          chrome.storage.local.set({
            lastNotificationTimestamp: notification.timestamp,
          });
        }

        // Show Chrome notification
        const notificationWithDevice = {
          ...notification,
          deviceName: device.nickname || device.name || "Android",
        };
        showNotification(notificationWithDevice);

        // Send to popup
        chrome.runtime
          .sendMessage({
            type: "newNotification",
            data: notification,
          })
          .catch(() => {});
      });
    }
  } catch (error) {
    console.error("ZyncIT: Poll error:", error);
  }
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkNotifications") {
    console.log("ZyncIT: 🔍 Polling for new notifications...");
    pollForNewNotifications();
  }

  if (alarm.name === "keepAlive") {
    console.log("ZyncIT: Keep-alive ping", new Date().toLocaleTimeString());
    // Re-establish listeners if they were lost
    if (currentUser && unsubscribeNotifications.length === 0) {
      console.log("ZyncIT: Listeners lost, restarting...");
      startListening();
    }
  }
});

// Handle extension install/update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
  } else if (details.reason === "update") {
  }
});

// Message handler from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "setDeviceId") {
    currentDeviceId = message.deviceId;
    chrome.storage.local.set({ deviceId: message.deviceId });
    startListening();
    sendResponse({ success: true });
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
    });
  }

  // Handle user login notification from popup
  if (message.type === "userLoggedIn") {
    // Auth state should update automatically, but force restart listening
    if (currentUser) {
      startListening();
    }
    sendResponse({ success: true });
  }

  // Clear seen notifications (for troubleshooting)
  if (message.type === "clearSeenNotifications") {
    seenNotifications.clear();
    chrome.storage.local.remove([
      "seenNotifications",
      "lastNotificationTimestamp",
    ]);
    sendResponse({ success: true });
  }

  // Restart listeners manually
  if (message.type === "restartListening") {
    startListening();
    sendResponse({ success: true, listening: true });
  }

  return true;
});
