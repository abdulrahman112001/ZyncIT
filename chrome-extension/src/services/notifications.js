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
import {
  formatTime,
  getNotificationIcon,
  escapeHtml,
} from "../utils/helpers.js";
import { renderAppIcon } from "../utils/appIcons.js";
import * as state from "../state/index.js";
import { updateTabBadges } from "./badges.js";

export async function loadNotifications() {
  const user = state.currentUser;
  if (!user) return;

  const userNotificationsQuery = query(
    collection(db, "users", user.uid, "notifications"),
    orderBy("createdAt", "desc"),
    limit(50),
  );

  const userNotifUnsub = onSnapshot(userNotificationsQuery, (snapshot) => {
    const notifications = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const firestoreId = doc.id; // Save the actual Firestore document ID
      notifications.push({
        ...data,
        id: firestoreId, // Use Firestore ID, not data.id
        deviceId: "user",
        receivedAt:
          data.timestamp || data.createdAt?.toMillis?.() || Date.now(),
      });
    });
    updateNotificationsList("_user_notifications", notifications);
  });
  state.addUnsubscriber(userNotifUnsub);

  const devicesQuery = query(
    collection(db, "devices"),
    where("userId", "==", user.uid),
  );

  const devicesSnapshot = await getDocs(devicesQuery);
  const devicesList = [];
  devicesSnapshot.forEach((doc) => {
    const data = doc.data();
    let friendlyName = data.nickname;
    if (!friendlyName) {
      if (
        data.name &&
        /[a-zA-Z]/.test(data.name) &&
        !/^[A-Z0-9]+$/.test(data.name)
      ) {
        friendlyName = data.name;
      } else {
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

  // Subscribe to notifications from each device
  devicesList.forEach((device) => {
    const q = query(
      collection(db, "users", user.uid, "devices", device.id, "notifications"),
      limit(50),
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const notifications = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const firestoreId = docSnap.id; // Save the actual Firestore document ID
          console.log(
            `[Notifications] Loaded: id=${firestoreId}, read=${data.read}, title=${data.title?.substring(0, 20)}`,
          );
          notifications.push({
            ...data,
            id: firestoreId, // Use Firestore ID, not data.id
            deviceId: device.id,
            deviceName: device.name,
          });
        });
        updateNotificationsList(device.id, notifications);
      },
      // (error) => {
      //   console.error(
      //     "❌ Error loading notifications for device",
      //     device.id,
      //     ":",
      //     error,
      //   );
      // },
    );

    state.addUnsubscriber(unsub);
  });
}

function updateNotificationsList(deviceId, newNotifications) {
  state.setNotificationsData(deviceId, newNotifications);

  let merged = [];
  Object.values(state.allNotifications).forEach((notifs) => {
    merged = merged.concat(notifs);
  });

  const seen = new Set();
  merged = merged.filter((n) => {
    if (seen.has(n.id)) return false;
    seen.add(n.id);
    return true;
  });

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
        <div class="list-item-title">${escapeHtml(
          notif.title || notif.appName || "Notification",
        )}${notif.read ? "" : ' <span class="unread-dot">●</span>'}</div>
        <div class="list-item-subtitle">${escapeHtml(notif.text || "")}</div>
        <div class="notification-app">
          ${escapeHtml(notif.appName || "Unknown App")}
          ${
            notif.deviceName
              ? `<span class="notification-device">📱 ${escapeHtml(notif.deviceName)}</span>`
              : ""
          }
        </div>
      </div>
      <span class="list-item-time">${formatTime(
        notif.receivedAt || notif.timestamp,
      )}</span>
    </div>
  `,
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

async function markNotificationAsRead(deviceId, notifId) {
  const user = state.currentUser;
  if (!user) return;

  if (!notifId || /^-?\d+$/.test(notifId)) {
    Object.keys(state.allNotifications).forEach((key) => {
      const updated = state.allNotifications[key].map((n) =>
        n.id === notifId ? { ...n, read: true } : n,
      );
      state.setNotificationsData(key, updated);
    });
    updateTabBadges();
    return;
  }

  try {
    if (deviceId && deviceId !== "user" && deviceId !== "_user_notifications") {
      const notifRef = doc(
        db,
        "users",
        user.uid,
        "devices",
        deviceId,
        "notifications",
        notifId,
      );
      await updateDoc(notifRef, { read: true });
    } else {
      const notifRef = doc(db, "users", user.uid, "notifications", notifId);
      await updateDoc(notifRef, { read: true });
    }

    Object.keys(state.allNotifications).forEach((key) => {
      const updated = state.allNotifications[key].map((n) =>
        n.id === notifId ? { ...n, read: true } : n,
      );
      state.setNotificationsData(key, updated);
    });
    updateTabBadges();
  } catch (error) {
    Object.keys(state.allNotifications).forEach((key) => {
      const updated = state.allNotifications[key].map((n) =>
        n.id === notifId ? { ...n, read: true } : n,
      );
      state.setNotificationsData(key, updated);
    });
    updateTabBadges();
  }
}

/**
 * Mark all notifications as read when entering notifications tab
 */
export async function markAllNotificationsAsRead() {
  const user = state.currentUser;
  if (!user) return;

  // Get all unread notifications with their correct deviceId
  let unreadNotifs = [];
  Object.entries(state.allNotifications).forEach(([stateKey, notifs]) => {
    notifs.forEach((n) => {
      if (!n.read) {
        // Use the deviceId stored in the notification itself, fallback to stateKey
        const actualDeviceId = n.deviceId || stateKey;
        unreadNotifs.push({ ...n, actualDeviceId });
      }
    });
  });

  console.log(
    `[Notifications] Found ${unreadNotifs.length} unread notifications to mark`,
  );

  if (unreadNotifs.length === 0) return;

  // Update local state IMMEDIATELY (for instant UI update)
  Object.keys(state.allNotifications).forEach((key) => {
    const updated = state.allNotifications[key].map((n) => ({
      ...n,
      read: true,
    }));
    state.setNotificationsData(key, updated);
  });

  // Update badge IMMEDIATELY
  updateTabBadges();

  // Re-render notifications list
  let merged = [];
  Object.values(state.allNotifications).forEach((notifs) => {
    merged = merged.concat(notifs);
  });
  merged.sort((a, b) => {
    const timeA = a.receivedAt || a.timestamp || 0;
    const timeB = b.receivedAt || b.timestamp || 0;
    return timeB - timeA;
  });
  renderNotifications(merged.slice(0, 100));

  // Update Firestore - await to ensure completion
  await updateFirestoreNotifications(user.uid, unreadNotifs);
}

/**
 * Update Firestore notifications as read
 */
async function updateFirestoreNotifications(userId, unreadNotifs) {
  let successCount = 0;
  let failCount = 0;

  const promises = unreadNotifs.map(async (notif) => {
    // Skip numeric-only IDs (not valid Firestore docs)
    if (/^-?\d+$/.test(notif.id)) {
      console.log(`[Notifications] Skipping numeric ID: ${notif.id}`);
      return;
    }

    const deviceId = notif.actualDeviceId;

    try {
      if (
        deviceId &&
        deviceId !== "user" &&
        deviceId !== "_user_notifications"
      ) {
        const notifRef = doc(
          db,
          "users",
          userId,
          "devices",
          deviceId,
          "notifications",
          notif.id,
        );
        await updateDoc(notifRef, { read: true });
        successCount++;
      } else {
        const notifRef = doc(db, "users", userId, "notifications", notif.id);
        await updateDoc(notifRef, { read: true });
        successCount++;
      }
    } catch (e) {
      failCount++;
      console.warn(`[Notifications] Failed ${notif.id}: ${e.message}`);
    }
  });

  await Promise.all(promises);
  console.log(
    `[Notifications] Done: ${successCount} success, ${failCount} failed`,
  );
}
