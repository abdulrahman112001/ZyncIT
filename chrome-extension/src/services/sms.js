/**
 * SMS Service
 * Handles SMS loading, rendering, and management
 */

import {
  db,
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  limit,
} from "../config/firebase.js"

import { smsList } from "../ui/dom.js"
import { showToast, showLoadingOverlay, hideLoading } from "../ui/toasts.js"
import {
  formatTime,
  getInitials,
  getAppIcon,
  getDeviceId,
} from "../utils/helpers.js"
import * as state from "../state/index.js"
import { updateTabBadges } from "./badges.js"

/**
 * Load SMS from all user devices
 */
export async function loadSMS() {
  const user = state.currentUser
  if (!user) {
    console.log("❌ loadSMS: No current user")
    return
  }
  console.log("📱 loadSMS: Starting for user:", user.uid)

  try {
    // First, get all user devices
    const devicesQuery = query(
      collection(db, "devices"),
      where("userId", "==", user.uid)
    )

    console.log("📱 loadSMS: Fetching devices...")
    const devicesSnapshot = await getDocs(devicesQuery)
    console.log("📱 loadSMS: Got", devicesSnapshot.size, "devices")

    const deviceIds = []
    devicesSnapshot.forEach((doc) => {
      const data = doc.data()
      console.log(
        "📱 Found device:",
        data.id,
        "| platform:",
        data.platform,
        "| name:",
        data.name || data.nickname
      )
      // Only include non-extension devices (Android/iOS)
      if (
        data.platform !== "chrome-extension" &&
        data.platform !== "chrome" &&
        !data.id?.startsWith("ext_")
      ) {
        deviceIds.push(data.id)
      }
    })

    console.log("Found mobile devices for SMS:", deviceIds)

    if (deviceIds.length === 0) {
      console.warn("⚠️ No devices found for SMS loading")
      renderSMS([])
      return
    }

    // Load SMS notifications from each device
    for (const deviceId of deviceIds) {
      const q = query(
        collection(db, "users", user.uid, "devices", deviceId, "notifications"),
        where("type", "==", "sms"),
        limit(50)
      )

      console.log("📱 Loading SMS for device:", deviceId)

      try {
        const snapshot = await getDocs(q)
        console.log("✅ SMS loaded from device", deviceId, ":", snapshot.size)
        const messages = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          messages.push({
            id: doc.id,
            docRef: doc.ref,
            deviceId: deviceId,
            phoneNumber: data.phoneNumber || data.sender || data.title || "",
            contactName: data.contactName || data.title || "",
            body: data.text || data.content || data.body || "",
            timestamp: data.timestamp || data.receivedAt || Date.now(),
            read: data.read === true,
            type: data.type || "sms",
            ...data,
          })
        })
        updateSMSList(deviceId, messages)
      } catch (error) {
        console.error("❌ SMS Error for device", deviceId, ":", error)
      }
    }
  } catch (error) {
    console.error("❌ loadSMS error:", error)
  }
}

/**
 * Update SMS list with messages from a device
 * @param {string} deviceId - Device ID
 * @param {Array} newMessages - Array of SMS messages
 */
export function updateSMSList(deviceId, newMessages) {
  console.log(
    "📬 updateSMSList called for device:",
    deviceId,
    "with",
    newMessages.length,
    "messages"
  )

  // Store SMS by device
  state.setSMSData(deviceId, newMessages)

  // Merge all SMS from all devices
  let merged = []
  Object.values(state.allSMS).forEach((msgs) => {
    merged = merged.concat(msgs)
  })

  console.log("📬 Total merged SMS:", merged.length)

  // Sort by timestamp descending
  merged.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))

  state.setAllSMSMessages(merged)
  renderSMS(merged.slice(0, 100))
  updateTabBadges()
}

/**
 * Render SMS conversations list
 * @param {Array} messages - Array of SMS messages
 */
export function renderSMS(messages) {
  console.log("🎨 renderSMS called with", messages.length, "messages")

  const smsListElement = document.getElementById("smsList")
  console.log("🎨 smsList element found:", !!smsListElement)

  if (!smsListElement) {
    console.error("❌ smsList element not found in DOM!")
    return
  }

  if (messages.length === 0) {
    console.log("🎨 No messages, showing empty state")
    smsListElement.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        <p>No messages yet</p>
        <span>Messages from your phone will appear here</span>
      </div>
    `
    updateTabBadges()
    return
  }

  // Group messages by phone number or contact name
  const grouped = {}
  messages.forEach((msg) => {
    let rawPhone = msg.phoneNumber || msg.sender || ""
    let contactName = msg.contactName || msg.title || ""

    // If no phone number, use contact name as the key
    let key
    if (rawPhone && rawPhone.trim()) {
      key = rawPhone.replace(/[\s\-\(\)\.]/g, "").trim()
    } else if (contactName && contactName.trim()) {
      key = "contact_" + contactName.trim()
      rawPhone = contactName
    } else {
      key = "Unknown"
      rawPhone = "Unknown"
    }

    if (!grouped[key]) {
      grouped[key] = {
        normalizedPhone: key,
        phoneNumber: rawPhone,
        contactName: contactName,
        messages: [],
        lastMessage: msg,
        unreadCount: 0,
      }
    }
    grouped[key].messages.push(msg)
    if (!msg.read) grouped[key].unreadCount++
    if (msg.timestamp > (grouped[key].lastMessage.timestamp || 0)) {
      grouped[key].lastMessage = msg
      if (msg.contactName || msg.title) {
        grouped[key].contactName = msg.contactName || msg.title
      }
    }
  })

  // Sort by last message timestamp
  const conversations = Object.values(grouped).sort(
    (a, b) => (b.lastMessage.timestamp || 0) - (a.lastMessage.timestamp || 0)
  )

  console.log("🎨 Rendering", conversations.length, "conversations")

  smsListElement.innerHTML = conversations
    .map(
      (conv) => `
    <div class="list-item sms-conversation" data-phone="${
      conv.normalizedPhone
    }">
      <div class="list-item-avatar">
        ${getInitials(conv.contactName || conv.phoneNumber)}
      </div>
      <div class="list-item-content">
        <div class="list-item-title">
          ${getAppIcon(conv.lastMessage.type || "sms")}
          ${conv.contactName || conv.phoneNumber}
        </div>
        <div class="list-item-subtitle">${conv.lastMessage.body || ""}</div>
        ${
          conv.lastMessage.deviceName
            ? `<div class="device-tag">${conv.lastMessage.deviceName}</div>`
            : ""
        }
      </div>
      <div class="list-item-meta">
        <span class="list-item-time">${formatTime(
          conv.lastMessage.timestamp
        )}</span>
        ${
          conv.unreadCount > 0
            ? `<div class="list-item-badge">${conv.unreadCount}</div>`
            : ""
        }
      </div>
    </div>
  `
    )
    .join("")

  console.log("🎨 SMS rendered! Conversations:", conversations.length)

  // Add click handlers using event delegation
  const oldSmsList = document.getElementById("smsList")
  if (oldSmsList) {
    const newSmsList = oldSmsList.cloneNode(true)
    oldSmsList.parentNode.replaceChild(newSmsList, oldSmsList)
  }

  document.getElementById("smsList")?.addEventListener("click", (e) => {
    const conversation = e.target.closest(".sms-conversation")
    if (conversation) {
      const phoneNumber = conversation.dataset.phone
      showConversation(phoneNumber)
    }
  })

  updateTabBadges()
}

/**
 * Show conversation detail view
 * @param {string} phoneNumber - Phone number or contact key
 */
export function showConversation(phoneNumber) {
  const normalizedInput = phoneNumber.replace(/[\s\-\(\)\.]/g, "").trim()

  const conversation = state.allSMSMessages
    .filter((msg) => {
      const msgPhone = (msg.phoneNumber || msg.sender || "")
        .replace(/[\s\-\(\)\.]/g, "")
        .trim()
      // Also check for contact_* keys
      const contactKey =
        msg.contactName || msg.title
          ? "contact_" + (msg.contactName || msg.title).trim()
          : ""
      return msgPhone === normalizedInput || contactKey === normalizedInput
    })
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))

  if (conversation.length === 0) return

  markConversationAsRead(conversation)

  const contactName =
    conversation[0].contactName || conversation[0].title || phoneNumber
  state.setCurrentConversation(phoneNumber)

  const smsListElement = document.getElementById("smsList")
  smsListElement.innerHTML = `
    <div class="conversation-view">
      <div class="conversation-header">
        <button class="back-btn" id="backToSMS">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div class="conversation-avatar">
          ${getInitials(contactName)}
        </div>
        <div class="conversation-info">
          <div class="conversation-name">${contactName}</div>
          <div class="conversation-phone">${
            phoneNumber !== contactName && !phoneNumber.startsWith("contact_")
              ? phoneNumber
              : ""
          }</div>
        </div>
      </div>
      <div class="conversation-messages">
        ${conversation
          .map(
            (msg) => `
          <div class="message-bubble ${
            msg.direction === "outgoing" || msg.type === "sent"
              ? "sent"
              : "received"
          }" data-msg-id="${msg.id}">
            <div class="message-text">${msg.body || ""}</div>
            <div class="message-footer">
              <span class="message-time">${formatTime(msg.timestamp)}</span>
              ${
                msg.deviceName
                  ? `<span class="message-device">📱 ${msg.deviceName}</span>`
                  : ""
              }
              <button class="delete-msg-btn" data-id="${msg.id}" title="Delete">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
      <div class="conversation-input">
        <input type="text" id="conversationMessageInput" placeholder="Type a message..." />
        <button class="send-btn" id="sendConversationSms">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  `

  // Scroll to bottom
  const messagesContainer = document.querySelector(".conversation-messages")
  if (messagesContainer) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight
  }

  // Add back button handler
  document.getElementById("backToSMS")?.addEventListener("click", () => {
    state.setCurrentConversation(null)
    renderSMS(state.allSMSMessages)
  })

  // Add send message handler
  const sendBtn = document.getElementById("sendConversationSms")
  const messageInput = document.getElementById("conversationMessageInput")

  sendBtn?.addEventListener("click", () =>
    sendConversationMessage(phoneNumber, messageInput)
  )
  messageInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendConversationMessage(phoneNumber, messageInput)
  })

  // Add delete message handlers
  document.querySelectorAll(".delete-msg-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation()
      const msgId = btn.dataset.id
      if (confirm("Delete this message?")) {
        deleteSingleSms(msgId)
      }
    })
  })
}

/**
 * Send SMS message from conversation view
 * @param {string} phoneNumber - Phone number to send to
 * @param {HTMLInputElement} inputElement - Input element
 */
async function sendConversationMessage(phoneNumber, inputElement) {
  const message = inputElement.value.trim()
  if (!message) return

  const user = state.currentUser
  console.log("🔍 Looking for Android device for user:", user.uid)

  const devicesQuery = query(
    collection(db, "devices"),
    where("userId", "==", user.uid)
  )
  const devicesSnapshot = await getDocs(devicesQuery)

  console.log("📱 Found devices:", devicesSnapshot.size)

  const androidDevices = devicesSnapshot.docs
    .filter((doc) => !doc.data().id.startsWith("ext_"))
    .sort((a, b) => (b.data().lastSeen || 0) - (a.data().lastSeen || 0))

  if (androidDevices.length === 0) {
    showToast("No Android device available to send SMS", "error")
    return
  }

  const deviceId = androidDevices[0].data().id
  const deviceName =
    androidDevices[0].data().nickname ||
    androidDevices[0].data().name ||
    "Android"
  console.log("📤 Sending SMS via device:", deviceId)

  try {
    const timestamp = Date.now()
    const docRef = await addDoc(collection(db, "sms_requests"), {
      userId: user.uid,
      fromDeviceId: await getDeviceId(),
      toDeviceId: deviceId,
      phoneNumber: phoneNumber.startsWith("contact_")
        ? phoneNumber.replace("contact_", "")
        : phoneNumber,
      message: message,
      status: "pending",
      timestamp: timestamp,
    })
    console.log("✅ SMS request created:", docRef.id)

    const newSmsMessage = {
      id: docRef.id,
      phoneNumber: phoneNumber,
      body: message,
      type: "sent",
      direction: "outgoing",
      timestamp: timestamp,
      read: true,
      deviceName: deviceName,
    }

    const updatedMessages = [...state.allSMSMessages, newSmsMessage]
    state.setAllSMSMessages(updatedMessages)

    if (state.currentConversation === phoneNumber) {
      showConversation(phoneNumber)
    }

    inputElement.value = ""
    showToast("SMS sent!", "success")
  } catch (error) {
    console.error("SMS send error:", error)
    showToast("Failed to send SMS", "error")
  }
}

/**
 * Mark all SMS as read
 */
export async function markAllSmsAsRead() {
  const user = state.currentUser
  if (!user || state.allSMSMessages.length === 0) return

  showLoadingOverlay()
  try {
    const batch = writeBatch(db)
    let count = 0

    for (const msg of state.allSMSMessages) {
      if (!msg.read && msg.docRef) {
        batch.update(msg.docRef, { read: true })
        count++
      }
    }

    if (count > 0) {
      await batch.commit()
      showToast(`${count} messages marked as read`, "success")
      const updatedMessages = state.allSMSMessages.map((msg) => ({
        ...msg,
        read: true,
      }))
      state.setAllSMSMessages(updatedMessages)

      if (state.currentConversation) {
        showConversation(state.currentConversation)
      } else {
        renderSMS(updatedMessages)
      }
    } else {
      showToast("No unread messages", "info")
    }
  } catch (error) {
    console.error("Mark all read error:", error)
    showToast("Failed to mark as read", "error")
  }
  hideLoading()
}

/**
 * Mark conversation messages as read
 * @param {Array} conversation - Array of messages in conversation
 */
async function markConversationAsRead(conversation) {
  const user = state.currentUser
  if (!user) return

  try {
    const batch = writeBatch(db)
    let count = 0

    for (const msg of conversation) {
      if (!msg.read && msg.docRef) {
        batch.update(msg.docRef, { read: true })
        count++
      }
    }

    if (count > 0) {
      await batch.commit()
      const msgIds = conversation.map((m) => m.id)
      const updatedMessages = state.allSMSMessages.map((msg) =>
        msgIds.includes(msg.id) ? { ...msg, read: true } : msg
      )
      state.setAllSMSMessages(updatedMessages)

      // Update allSMS state
      Object.keys(state.allSMS).forEach((deviceId) => {
        const updated = state.allSMS[deviceId].map((msg) =>
          msgIds.includes(msg.id) ? { ...msg, read: true } : msg
        )
        state.setSMSData(deviceId, updated)
      })

      updateTabBadges()
    }
  } catch (error) {
    console.error("Mark conversation read error:", error)
  }
}

/**
 * Delete all SMS
 */
export async function deleteAllSms() {
  const user = state.currentUser
  if (!user || state.allSMSMessages.length === 0) {
    showToast("No messages to delete", "info")
    return
  }

  if (
    !confirm(
      `Are you sure you want to delete all ${state.allSMSMessages.length} messages?`
    )
  ) {
    return
  }

  showLoadingOverlay()
  try {
    const batch = writeBatch(db)
    let count = 0

    for (const msg of state.allSMSMessages) {
      if (msg.docRef) {
        batch.delete(msg.docRef)
        count++
      }
    }

    if (count > 0) {
      await batch.commit()
      showToast(`${count} messages deleted`, "success")
      state.setAllSMSMessages([])
      state.clearAllSMS()
      state.setCurrentConversation(null)
      renderSMS([])
    }
  } catch (error) {
    console.error("Delete all error:", error)
    showToast("Failed to delete messages", "error")
  }
  hideLoading()
}

/**
 * Delete single SMS
 * @param {string} msgId - Message ID to delete
 */
async function deleteSingleSms(msgId) {
  const user = state.currentUser
  if (!user) return

  const msg = state.allSMSMessages.find((m) => m.id === msgId)
  if (!msg || !msg.docRef) {
    showToast("Message not found", "error")
    return
  }

  try {
    await deleteDoc(msg.docRef)
    showToast("Message deleted", "success")

    const updatedMessages = state.allSMSMessages.filter((m) => m.id !== msgId)
    state.setAllSMSMessages(updatedMessages)

    if (state.currentConversation) {
      const remaining = updatedMessages.filter((m) => {
        const msgPhone = (m.phoneNumber || m.sender || "")
          .replace(/[\s\-\(\)\.]/g, "")
          .trim()
        const contactKey =
          m.contactName || m.title
            ? "contact_" + (m.contactName || m.title).trim()
            : ""
        return (
          msgPhone === state.currentConversation ||
          contactKey === state.currentConversation
        )
      })

      if (remaining.length === 0) {
        state.setCurrentConversation(null)
        renderSMS(updatedMessages)
      } else {
        showConversation(state.currentConversation)
      }
    } else {
      renderSMS(updatedMessages)
    }
  } catch (error) {
    console.error("Delete SMS error:", error)
    showToast("Failed to delete message", "error")
  }
}

/**
 * Start polling for new SMS
 */
export function startPolling() {
  state.clearPollingInterval()
  const interval = setInterval(() => {
    console.log("🔄 Polling for new SMS...")
    loadSMS()
  }, 5000)
  state.setPollingInterval(interval)
}

/**
 * Stop polling
 */
export function stopPolling() {
  state.clearPollingInterval()
}
