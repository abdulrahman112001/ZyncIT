/**
 * Notifications Service
 * Handles app notifications loading and rendering
 */

import {
  db,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "../config/firebase.js"

import { notificationsList } from "../ui/dom.js"
import { formatTime, getNotificationIcon } from "../utils/helpers.js"
import * as state from "../state/index.js"
import { updateTabBadges } from "./badges.js"

/**
 * Load notifications from Firebase
 */
export async function loadNotifications() {
  const user = state.currentUser
  if (!user) return

  // 1. Subscribe to user-level notifications (WhatsApp, Telegram, etc.)
  const userNotificationsQuery = query(
    collection(db, "users", user.uid, "notifications"),
    orderBy("createdAt", "desc"),
    limit(50)
  )

  const userNotifUnsub = onSnapshot(userNotificationsQuery, (snapshot) => {
    const notifications = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      notifications.push({
        id: doc.id,
        deviceId: "user",
        ...data,
        receivedAt:
          data.timestamp || data.createdAt?.toMillis?.() || Date.now(),
      })
    })
    updateNotificationsList("_user_notifications", notifications)
  })
  state.addUnsubscriber(userNotifUnsub)

  // 2. Get all user devices and subscribe to device-level notifications
  const devicesQuery = query(
    collection(db, "devices"),
    where("userId", "==", user.uid)
  )

  const devicesSnapshot = await getDocs(devicesQuery)
  const deviceIds = []
  devicesSnapshot.forEach((doc) => {
    deviceIds.push(doc.data().id)
  })

  // Subscribe to notifications from each device
  deviceIds.forEach((deviceId) => {
    const q = query(
      collection(db, "users", user.uid, "devices", deviceId, "notifications"),
      limit(50)
    )

    console.log("📱 Subscribing to notifications for device:", deviceId)

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        console.log(
          "🔔 Notifications found for device",
          deviceId,
          ":",
          snapshot.size
        )
        const notifications = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          console.log("📌 Notification:", data.type, data.title, data.text)
          notifications.push({ id: doc.id, deviceId: deviceId, ...data })
        })
        updateNotificationsList(deviceId, notifications)
      },
      (error) => {
        console.error(
          "❌ Error loading notifications for device",
          deviceId,
          ":",
          error
        )
      }
    )

    state.addUnsubscriber(unsub)
  })
}

/**
 * Update notifications list with data from a device
 * @param {string} deviceId - Device ID
 * @param {Array} newNotifications - Array of notifications
 */
function updateNotificationsList(deviceId, newNotifications) {
  state.setNotificationsData(deviceId, newNotifications)

  // Merge all notifications from all devices
  let merged = []
  Object.values(state.allNotifications).forEach((notifs) => {
    merged = merged.concat(notifs)
  })

  // Remove duplicates by id
  const seen = new Set()
  merged = merged.filter((n) => {
    if (seen.has(n.id)) return false
    seen.add(n.id)
    return true
  })

  // Sort by timestamp/receivedAt descending
  merged.sort((a, b) => {
    const timeA = a.receivedAt || a.timestamp || 0
    const timeB = b.receivedAt || b.timestamp || 0
    return timeB - timeA
  })

  renderNotifications(merged.slice(0, 100))
  updateTabBadges()
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
    `
    updateTabBadges()
    return
  }

  notificationsList.innerHTML = notifications
    .map(
      (notif) => `
    <div class="list-item notification-item notification-${
      notif.type || "other"
    }">
      <div class="list-item-icon notification-icon">
        ${getNotificationIcon(notif.type, notif.appName)}
      </div>
      <div class="list-item-content">
        <div class="list-item-title">${
          notif.title || notif.appName || "Notification"
        }</div>
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
    .join("")

  updateTabBadges()
}
