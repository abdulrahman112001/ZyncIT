/**
 * Notifications Service
 * Handles app notifications loading and rendering
 */

import {
  db,
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "../config/firebase.js";

import { notificationsList } from "../ui/dom.js";
import { formatTime, getNotificationIcon } from "../utils/helpers.js";
import { renderAppIcon } from "../utils/appIcons.js";
import * as state from "../state/index.js";
import { updateTabBadges } from "./badges.js";

/**
 * Load notifications from Firebase
 */
export async function loadNotifications() {
  const user = state.currentUser;
  if (!user) return;

  // 1. Subscribe to user-level notifications (WhatsApp, Telegram, etc.)
  const userNotificationsQuery = query(
    collection(db, "users", user.uid, "notifications"),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  const userNotifUnsub = onSnapshot(userNotificationsQuery, (snapshot) => {
    const notifications = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        deviceId: "user",
        ...data,
        receivedAt:
          data.timestamp || data.createdAt?.toMillis?.() || Date.now(),
      });
    });
    updateNotificationsList("_user_notifications", notifications);
  });
  state.addUnsubscriber(userNotifUnsub);

  // 2. Get all user devices and subscribe to device-level notifications
  const devicesQuery = query(
    collection(db, "devices"),
    where("userId", "==", user.uid)
  );

  console.log("🔍 Searching for devices for user:", user.uid);

  const devicesSnapshot = await getDocs(devicesQuery);
  const devicesList = [];
  devicesSnapshot.forEach((doc) => {
    const data = doc.data();
    console.log("📱 Found device doc:", doc.id, "data:", data);
    // Prefer nickname, then name (if it looks human-readable), then a friendly "Device" label
    let friendlyName = data.nickname;
    if (!friendlyName) {
      // Check if name looks like a device name (contains letters, not just model number)
      if (
        data.name &&
        /[a-zA-Z]/.test(data.name) &&
        !/^[A-Z0-9]+$/.test(data.name)
      ) {
        friendlyName = data.name;
      } else {
        // Fallback to "Device" or platform (case-insensitive check)
        const platform = (data.platform || "").toLowerCase();
        friendlyName =
          platform === "ios"
            ? "iPhone"
            : platform === "android"
            ? "Android"
            : "Device";
      }
    }
    devicesList.push({
      id: data.id,
      name: friendlyName,
    });
  });

  console.log("📱 Total devices found:", devicesList.length);

  // Subscribe to notifications from each device
  devicesList.forEach((device) => {
    const q = query(
      collection(db, "users", user.uid, "devices", device.id, "notifications"),
      limit(50)
    );

    console.log(
      "📱 Subscribing to notifications for device:",
      device.id,
      device.name
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        console.log(
          "🔔 Notifications found for device",
          device.id,
          ":",
          snapshot.size
        );
        const notifications = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          console.log("📌 Notification:", data.type, data.title, data.text);
          notifications.push({
            id: docSnap.id,
            deviceId: device.id,
            deviceName: device.name,
            ...data,
          });
        });
        updateNotificationsList(device.id, notifications);
      },
      (error) => {
        console.error(
          "❌ Error loading notifications for device",
          device.id,
          ":",
          error
        );
      }
    );

    state.addUnsubscriber(unsub);
  });
}

/**
 * Update notifications list with data from a device
 * @param {string} deviceId - Device ID
 * @param {Array} newNotifications - Array of notifications
 */
function updateNotificationsList(deviceId, newNotifications) {
  state.setNotificationsData(deviceId, newNotifications);

  // Merge all notifications from all devices
  let merged = [];
  Object.values(state.allNotifications).forEach((notifs) => {
    merged = merged.concat(notifs);
  });

  // Remove duplicates by id
  const seen = new Set();
  merged = merged.filter((n) => {
    if (seen.has(n.id)) return false;
    seen.add(n.id);
    return true;
  });

  // Sort by timestamp/receivedAt descending
  merged.sort((a, b) => {
    const timeA = a.receivedAt || a.timestamp || 0;
    const timeB = b.receivedAt || b.timestamp || 0;
    return timeB - timeA;
  });

  renderNotifications(merged.slice(0, 100));
  updateTabBadges();
}

/**
 * Render notifications list
 * @param {Array} notifications - Array of notifications
 */
function renderNotifications(notifications) {
  if (notifications.length === 0) {
    notificationsList.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        <p>No notifications yet</p>
        <span>Notifications from your phone will appear here</span>
      </div>
    `;
    updateTabBadges();
    return;
  }

  notificationsList.innerHTML = notifications
    .map(
      (notif) => `
    <div class="list-item notification-item notification-${
      notif.type || "other"
    } ${notif.read ? "" : "unread"}" data-notif-id="${
        notif.id
      }" data-device-id="${notif.deviceId}">
      <div class="list-item-icon notification-icon">
        ${renderAppIcon(notif.packageName, notif.appIcon, 40)}
      </div>
      <div class="list-item-content">
        <div class="list-item-title">${
          notif.title || notif.appName || "Notification"
        }${notif.read ? "" : ' <span class="unread-dot">●</span>'}</div>
        <div class="list-item-subtitle">${notif.text || ""}</div>
        <div class="notification-app">
          ${notif.appName || "Unknown App"}
          ${
            notif.deviceName
              ? `<span class="notification-device">📱 ${notif.deviceName}</span>`
              : ""
          }
        </div>
      </div>
      <span class="list-item-time">${formatTime(
        notif.receivedAt || notif.timestamp
      )}</span>
    </div>
  `
    )
    .join("");

  // Add click listeners to mark as read
  notificationsList.querySelectorAll(".notification-item").forEach((item) => {
    item.addEventListener("click", async () => {
      const notifId = item.dataset.notifId;
      const deviceId = item.dataset.deviceId;
      if (notifId && deviceId) {
        await markNotificationAsRead(deviceId, notifId);
        item.classList.remove("unread");
        const unreadDot = item.querySelector(".unread-dot");
        if (unreadDot) unreadDot.remove();
      }
    });
  });

  updateTabBadges();
}

/**
 * Mark a notification as read in Firestore
 * @param {string} deviceId - Device ID
 * @param {string} notifId - Notification ID (Firestore document ID)
 */
async function markNotificationAsRead(deviceId, notifId) {
  const user = state.currentUser;
  if (!user) return;

  // Skip if notifId looks like a simple number (not a valid Firestore doc ID)
  if (!notifId || /^\d+$/.test(notifId)) {
    console.log("⚠️ Skipping invalid notification ID:", notifId);
    // Just update local state
    Object.keys(state.allNotifications).forEach((key) => {
      const updated = state.allNotifications[key].map((n) =>
        n.id === notifId ? { ...n, read: true } : n
      );
      state.setNotificationsData(key, updated);
    });
    updateTabBadges();
    return;
  }

  try {
    // Try device-level path first
    if (deviceId && deviceId !== "user" && deviceId !== "_user_notifications") {
      const notifRef = doc(
        db,
        "users",
        user.uid,
        "devices",
        deviceId,
        "notifications",
        notifId
      );
      await updateDoc(notifRef, { read: true });
      console.log("✅ Notification marked as read:", notifId);
    } else {
      // User-level notifications
      const notifRef = doc(db, "users", user.uid, "notifications", notifId);
      await updateDoc(notifRef, { read: true });
      console.log("✅ User notification marked as read:", notifId);
    }

    // Update local state using setter
    Object.keys(state.allNotifications).forEach((key) => {
      const updated = state.allNotifications[key].map((n) =>
        n.id === notifId ? { ...n, read: true } : n
      );
      state.setNotificationsData(key, updated);
    });
    updateTabBadges();
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
    // Still update local state even if Firestore fails
    Object.keys(state.allNotifications).forEach((key) => {
      const updated = state.allNotifications[key].map((n) =>
        n.id === notifId ? { ...n, read: true } : n
      );
      state.setNotificationsData(key, updated);
    });
    updateTabBadges();
  }
}
