// Firebase SDK imports (using npm package)
import { initializeApp } from "firebase/app"
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  updateProfile,
} from "firebase/auth"
import {
  getFirestore,
  collectionGroup,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"

// Firebase config - from google-services.json
const firebaseConfig = {
  apiKey: "AIzaSyCMqENmothJXy6XrP7214d0c6ILsOdqtcs",
  authDomain: "zyncit-f1ced.firebaseapp.com",
  projectId: "zyncit-f1ced",
  storageBucket: "zyncit-f1ced.firebasestorage.app",
  messagingSenderId: "772958487002",
  appId: "1:772958487002:web:c2dcb8043d3bfed2ec40e3",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

// DOM Elements
const authContainer = document.getElementById("authContainer")
const mainContainer = document.getElementById("mainContainer")
const loginForm = document.getElementById("loginForm")
const signupForm = document.getElementById("signupForm")
const loadingOverlay = document.getElementById("loadingOverlay")
const toastContainer = document.getElementById("toastContainer")

// Auth elements
const loginEmail = document.getElementById("loginEmail")
const loginPassword = document.getElementById("loginPassword")
const loginBtn = document.getElementById("loginBtn")
const googleLoginBtn = document.getElementById("googleLoginBtn")
const showSignup = document.getElementById("showSignup")
const signupName = document.getElementById("signupName")
const signupEmail = document.getElementById("signupEmail")
const signupPassword = document.getElementById("signupPassword")
const signupBtn = document.getElementById("signupBtn")
const googleSignupBtn = document.getElementById("googleSignupBtn")
const showLogin = document.getElementById("showLogin")
const logoutBtn = document.getElementById("logoutBtn")

// User info elements
const userAvatar = document.getElementById("userAvatar")
const userName = document.getElementById("userName")
const userEmail = document.getElementById("userEmail")

// Tabs
const tabs = document.querySelectorAll(".tab")
const tabContents = document.querySelectorAll(".tab-content")

// SMS Modal
const smsModal = document.getElementById("smsModal")
const newSmsBtn = document.getElementById("newSmsBtn")
const closeSmsModal = document.getElementById("closeSmsModal")
const cancelSmsBtn = document.getElementById("cancelSmsBtn")
const sendSmsBtn = document.getElementById("sendSmsBtn")
const smsDevice = document.getElementById("smsDevice")
const smsPhone = document.getElementById("smsPhone")
const smsMessage = document.getElementById("smsMessage")
const charCount = document.getElementById("charCount")

// Chat elements
const chatDeviceSelect = document.getElementById("chatDeviceSelect")
const chatInput = document.getElementById("chatInput")
const sendChatBtn = document.getElementById("sendChatBtn")
const chatMessages = document.getElementById("chatMessages")

// Action buttons
const markAllReadBtn = document.getElementById("markAllReadBtn")
const deleteAllSmsBtn = document.getElementById("deleteAllSmsBtn")

// Lists
const smsList = document.getElementById("smsList")
const callsList = document.getElementById("callsList")
const devicesList = document.getElementById("devicesList")
const notificationsList = document.getElementById("notificationsList")

// State
let currentUser = null
let devices = []
let unsubscribers = []

// Utility functions
function showLoading() {
  loadingOverlay.classList.remove("hidden")
}

function hideLoading() {
  loadingOverlay.classList.add("hidden")
}

function showToast(message, type = "info") {
  const toast = document.createElement("div")
  toast.className = `toast ${type}`
  toast.textContent = message
  toastContainer.appendChild(toast)
  setTimeout(() => toast.remove(), 3000)
}

function formatTime(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return "Just now"
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`

  return date.toLocaleDateString()
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

// Auth State Observer
onAuthStateChanged(auth, async (user) => {
  hideLoading()

  if (user) {
    currentUser = user
    console.log("Logged in as:", user.uid, user.email)
    showMainUI()
    await registerDevice()
    loadData()
  } else {
    currentUser = null
    showAuthUI()
    cleanupSubscriptions()
  }
})

function showAuthUI() {
  authContainer.classList.remove("hidden")
  mainContainer.classList.add("hidden")
}

function showMainUI() {
  authContainer.classList.add("hidden")
  mainContainer.classList.remove("hidden")

  // Update user info
  userAvatar.src =
    currentUser.photoURL ||
    "https://ui-avatars.com/api/?name=" +
      encodeURIComponent(currentUser.displayName || "U")
  userName.textContent = currentUser.displayName || "User"
  userEmail.textContent = currentUser.email
}

// Auth handlers
showSignup.addEventListener("click", (e) => {
  e.preventDefault()
  loginForm.classList.add("hidden")
  signupForm.classList.remove("hidden")
})

showLogin.addEventListener("click", (e) => {
  e.preventDefault()
  signupForm.classList.add("hidden")
  loginForm.classList.remove("hidden")
})

loginBtn.addEventListener("click", async () => {
  const email = loginEmail.value.trim()
  const password = loginPassword.value

  if (!email || !password) {
    showToast("Please fill in all fields", "error")
    return
  }

  showLoading()
  try {
    await signInWithEmailAndPassword(auth, email, password)
    showToast("Signed in successfully", "success")
  } catch (error) {
    showToast(error.message, "error")
    hideLoading()
  }
})

signupBtn.addEventListener("click", async () => {
  const name = signupName.value.trim()
  const email = signupEmail.value.trim()
  const password = signupPassword.value

  if (!name || !email || !password) {
    showToast("Please fill in all fields", "error")
    return
  }

  showLoading()
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(result.user, { displayName: name })

    // Create user document
    await setDoc(doc(db, "users", result.user.uid), {
      uid: result.user.uid,
      email: email,
      displayName: name,
      photoURL: null,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    })

    showToast("Account created successfully", "success")
  } catch (error) {
    showToast(error.message, "error")
    hideLoading()
  }
})

// Google Sign In
async function handleGoogleSignIn() {
  showLoading()
  try {
    // Use Chrome Identity API for Google Sign In
    const token = await new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          resolve(token)
        }
      })
    })

    const credential = GoogleAuthProvider.credential(null, token)
    const result = await signInWithCredential(auth, credential)

    // Check if user document exists
    const userDoc = await getDoc(doc(db, "users", result.user.uid))
    if (!userDoc.exists()) {
      await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      })
    }

    showToast("Signed in with Google", "success")
  } catch (error) {
    showToast(error.message, "error")
    hideLoading()
  }
}

googleLoginBtn.addEventListener("click", handleGoogleSignIn)
googleSignupBtn.addEventListener("click", handleGoogleSignIn)

logoutBtn.addEventListener("click", async () => {
  try {
    // Revoke Google token
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      if (token) {
        chrome.identity.removeCachedAuthToken({ token })
      }
    })

    await signOut(auth)
    showToast("Signed out", "success")
  } catch (error) {
    showToast(error.message, "error")
  }
})

// Register this extension as a device
async function registerDevice() {
  if (!currentUser) return

  const deviceId = await getDeviceId()

  await setDoc(
    doc(db, "devices", deviceId),
    {
      id: deviceId,
      userId: currentUser.uid,
      name: "Chrome Extension",
      type: "chrome-extension",
      platform: "chrome",
      model: navigator.userAgent,
      lastActiveAt: Date.now(),
      isOnline: true,
    },
    { merge: true }
  )
}

async function getDeviceId() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["deviceId"], (result) => {
      if (result.deviceId) {
        resolve(result.deviceId)
      } else {
        const newId = "ext_" + Math.random().toString(36).substr(2, 9)
        chrome.storage.local.set({ deviceId: newId })
        resolve(newId)
      }
    })
  })
}

// Tab switching
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const tabName = tab.dataset.tab

    tabs.forEach((t) => t.classList.remove("active"))
    tab.classList.add("active")

    tabContents.forEach((content) => {
      content.classList.remove("active")
    })

    document.getElementById(`${tabName}Tab`).classList.add("active")
  })
})

// Load data
function loadData() {
  loadDevices()
  loadSMS()
  loadCalls()
  loadNotifications()
  subscribeToChat()
}

function cleanupSubscriptions() {
  unsubscribers.forEach((unsub) => unsub())
  unsubscribers = []
}

// Load devices
async function loadDevices() {
  if (!currentUser) return

  const q = query(
    collection(db, "devices"),
    where("userId", "==", currentUser.uid)
  )

  const unsub = onSnapshot(q, (snapshot) => {
    console.log("Devices found:", snapshot.size)
    devices = []
    snapshot.forEach((doc) => {
      devices.push({
        ...doc.data(),
        docId: doc.id
      })
    })

    renderDevices()
    updateDeviceSelects()
  })

  unsubscribers.push(unsub)
}

function renderDevices() {
  if (devices.length === 0) {
    devicesList.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
        </svg>
        <p>No devices connected</p>
        <span>Install ZyncIT on your phone to get started</span>
      </div>
    `
    return
  }

  devicesList.innerHTML = devices
    .map(
      (device) => `
    <div class="list-item ${device.isOnline ? "device-online" : ""}" data-device-id="${device.id}">
      <div class="list-item-icon">
        ${
          device.type === "mobile"
            ? `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
          </svg>
        `
            : `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        `
        }
      </div>
      <div class="list-item-content">
        <div class="list-item-title">${device.name}</div>
        <div class="list-item-subtitle">${device.platform} • ${
        device.isOnline ? "Online" : "Offline"
      }</div>
      </div>
      <div class="device-actions">
        <span class="list-item-time">${formatTime(device.lastActiveAt)}</span>
        <button class="delete-device-btn" data-device-id="${device.id}" data-device-doc-id="${device.docId}" title="Delete device">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  `
    )
    .join("")

  // Add delete handlers
  document.querySelectorAll(".delete-device-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation()
      const deviceId = btn.dataset.deviceId
      const docId = btn.dataset.deviceDocId
      if (confirm(`Delete device "${deviceId}"? This will remove all its data.`)) {
        deleteDevice(docId, deviceId)
      }
    })
  })
}

function updateDeviceSelects() {
  const mobileDevices = devices.filter((d) => d.type === "mobile")
  const options = mobileDevices
    .map((d) => `<option value="${d.id}">${d.name}</option>`)
    .join("")

  smsDevice.innerHTML = '<option value="">Select device...</option>' + options
  chatDeviceSelect.innerHTML = '<option value="">All devices</option>' + options
}

// Load SMS from notifications (filtered by type === 'sms')
async function loadSMS() {
  if (!currentUser) return
  console.log("Loading SMS for user:", currentUser.uid)

  // First, get all user devices
  const devicesQuery = query(
    collection(db, "devices"),
    where("userId", "==", currentUser.uid)
  )

  const devicesSnapshot = await getDocs(devicesQuery)
  const deviceIds = []
  devicesSnapshot.forEach((doc) => {
    deviceIds.push(doc.data().id)
  })

  console.log("Found devices for SMS:", deviceIds)

  // Subscribe to SMS notifications from each device
  deviceIds.forEach((deviceId) => {
    const q = query(
      collection(
        db,
        "users",
        currentUser.uid,
        "devices",
        deviceId,
        "notifications"
      ),
      where("type", "==", "sms"),
      limit(50)
    )

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        console.log("SMS found from device", deviceId, ":", snapshot.size)
        const messages = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          console.log("📩 SMS data:", doc.id, "read:", data.read, data)
          messages.push({
            id: doc.id,
            docRef: doc.ref,
            deviceId: deviceId,
            phoneNumber: data.phoneNumber || data.title,
            body: data.text || data.content || data.body,
            timestamp: data.timestamp || data.receivedAt,
            read: data.read === true,
            type: data.type,
            ...data,
          })
        })

        // Update SMS list (merge with existing)
        updateSMSList(deviceId, messages)
      },
      (error) => {
        console.error("SMS Error for device", deviceId, ":", error)
      }
    )

    unsubscribers.push(unsub)
  })
}

let allSMS = {}

function updateSMSList(deviceId, newMessages) {
  // Store SMS by device
  allSMS[deviceId] = newMessages

  // Merge all SMS from all devices
  let merged = []
  Object.values(allSMS).forEach((msgs) => {
    merged = merged.concat(msgs)
  })

  // Sort by timestamp descending
  merged.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))

  renderSMS(merged.slice(0, 100))
}

// Load Notifications from Firebase (from all devices)
async function loadNotifications() {
  if (!currentUser) return

  // First, get all user devices
  const devicesQuery = query(
    collection(db, "devices"),
    where("userId", "==", currentUser.uid)
  )

  const devicesSnapshot = await getDocs(devicesQuery)
  const deviceIds = []
  devicesSnapshot.forEach((doc) => {
    deviceIds.push(doc.data().id)
  })

  // Subscribe to notifications from each device
  deviceIds.forEach((deviceId) => {
    const q = query(
      collection(
        db,
        "users",
        currentUser.uid,
        "devices",
        deviceId,
        "notifications"
      ),
      orderBy("receivedAt", "desc"),
      limit(50)
    )

    const unsub = onSnapshot(q, (snapshot) => {
      const notifications = []
      snapshot.forEach((doc) => {
        notifications.push({ id: doc.id, deviceId: deviceId, ...doc.data() })
      })

      // Update notifications list (merge with existing)
      updateNotificationsList(deviceId, notifications)
    })

    unsubscribers.push(unsub)
  })
}

let allNotifications = {}

function updateNotificationsList(deviceId, newNotifications) {
  // Store notifications by device
  allNotifications[deviceId] = newNotifications

  // Merge all notifications from all devices
  let merged = []
  Object.values(allNotifications).forEach((notifs) => {
    merged = merged.concat(notifs)
  })

  // Sort by receivedAt descending
  merged.sort((a, b) => (b.receivedAt || 0) - (a.receivedAt || 0))

  renderNotifications(merged.slice(0, 100))
}

function getNotificationIcon(type, appName) {
  // Check by app name
  const appLower = (appName || "").toLowerCase()
  if (appLower.includes("whatsapp")) return "📱"
  if (appLower.includes("telegram")) return "✈️"
  if (appLower.includes("messenger")) return "💬"
  if (appLower.includes("mail") || appLower.includes("gmail")) return "📧"
  if (appLower.includes("phone") || appLower.includes("call")) return "📞"
  if (appLower.includes("message") || appLower.includes("sms")) return "💬"
  if (appLower.includes("calendar")) return "📅"

  // Check by type
  if (type === "sms") return "💬"
  if (type === "call") return "📞"
  if (type === "whatsapp") return "📱"
  if (type === "telegram") return "✈️"

  return "🔔"
}

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
        <div class="notification-app">${notif.appName || "Unknown App"}</div>
      </div>
      <span class="list-item-time">${formatTime(
        notif.receivedAt || notif.timestamp
      )}</span>
    </div>
  `
    )
    .join("")
}

// Store all SMS for conversation view
let allSMSMessages = []
let currentConversation = null

// Get app icon based on notification type
function getAppIcon(type) {
  const icons = {
    sms: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#4CAF50" stroke="none">
      <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z"/>
    </svg>`,
    whatsapp: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366" stroke="none">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>`,
    telegram: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#0088cc" stroke="none">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>`,
  }
  return icons[type] || icons.sms
}

function renderSMS(messages) {
  allSMSMessages = messages

  if (messages.length === 0) {
    smsList.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        <p>No messages yet</p>
        <span>Messages from your phone will appear here</span>
      </div>
    `
    return
  }

  // Group messages by phone number
  const grouped = {}
  messages.forEach((msg) => {
    const key = msg.phoneNumber || msg.sender || "Unknown"
    if (!grouped[key]) {
      grouped[key] = {
        phoneNumber: key,
        contactName: msg.contactName || "",
        messages: [],
        lastMessage: msg,
        unreadCount: 0,
      }
    }
    grouped[key].messages.push(msg)
    if (!msg.read) grouped[key].unreadCount++
    if (msg.timestamp > (grouped[key].lastMessage.timestamp || 0)) {
      grouped[key].lastMessage = msg
    }
  })

  // Sort by last message timestamp
  const conversations = Object.values(grouped).sort(
    (a, b) => (b.lastMessage.timestamp || 0) - (a.lastMessage.timestamp || 0)
  )

  smsList.innerHTML = conversations
    .map(
      (conv) => `
    <div class="list-item sms-conversation" data-phone="${conv.phoneNumber}">
      <div class="list-item-avatar">
        ${getInitials(conv.contactName || conv.phoneNumber)}
      </div>
      <div class="list-item-content">
        <div class="list-item-title">
          ${getAppIcon(conv.lastMessage.type || "sms")}
          ${conv.contactName || conv.phoneNumber}
        </div>
        <div class="list-item-subtitle">${conv.lastMessage.body || ""}</div>
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

  // Add click handlers for conversations
  document.querySelectorAll(".sms-conversation").forEach((el) => {
    el.addEventListener("click", () => {
      const phoneNumber = el.dataset.phone
      showConversation(phoneNumber)
    })
  })
}

function getInitials(name) {
  if (!name) return "?"
  const words = name.trim().split(" ")
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

function showConversation(phoneNumber) {
  const conversation = allSMSMessages
    .filter((msg) => (msg.phoneNumber || msg.sender) === phoneNumber)
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))

  if (conversation.length === 0) return

  const contactName = conversation[0].contactName || phoneNumber
  currentConversation = phoneNumber

  smsList.innerHTML = `
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
            phoneNumber !== contactName ? phoneNumber : ""
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

  // Scroll to bottom of messages
  const messagesContainer = document.querySelector(".conversation-messages")
  if (messagesContainer) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight
  }

  // Add back button handler
  document.getElementById("backToSMS").addEventListener("click", () => {
    currentConversation = null
    renderSMS(allSMSMessages)
  })

  // Add send message handler
  const sendBtn = document.getElementById("sendConversationSms")
  const messageInput = document.getElementById("conversationMessageInput")

  sendBtn.addEventListener("click", () =>
    sendConversationMessage(phoneNumber, messageInput)
  )
  messageInput.addEventListener("keypress", (e) => {
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

async function sendConversationMessage(phoneNumber, inputElement) {
  const message = inputElement.value.trim()
  if (!message) return

  console.log("🔍 Looking for Android device for user:", currentUser.uid)

  // Get all devices for user (no ordering to avoid index requirement)
  const devicesQuery = query(
    collection(db, "devices"),
    where("userId", "==", currentUser.uid)
  )
  const devicesSnapshot = await getDocs(devicesQuery)

  console.log("📱 Found devices:", devicesSnapshot.size)

  // Get all Android devices (not extension) and sort by lastSeen locally
  const androidDevices = devicesSnapshot.docs
    .filter((doc) => !doc.data().id.startsWith("ext_"))
    .sort((a, b) => (b.data().lastSeen || 0) - (a.data().lastSeen || 0))

  androidDevices.forEach((doc) => {
    console.log("Device:", doc.data().id, "lastSeen:", doc.data().lastSeen)
  })

  if (androidDevices.length === 0) {
    showToast("No Android device available to send SMS", "error")
    return
  }

  // Use the most recently seen device
  const deviceId = androidDevices[0].data().id
  console.log("📤 Sending SMS via device:", deviceId)

  try {
    const docRef = await addDoc(collection(db, "sms_requests"), {
      userId: currentUser.uid,
      fromDeviceId: await getDeviceId(),
      toDeviceId: deviceId,
      phoneNumber: phoneNumber,
      message: message,
      status: "pending",
      timestamp: Date.now(),
    })
    console.log("✅ SMS request created:", docRef.id)
    inputElement.value = ""
    showToast("SMS sent!", "success")
  } catch (error) {
    console.error("SMS send error:", error)
    showToast("Failed to send SMS", "error")
  }
}

// Mark all SMS as read
async function markAllSmsAsRead() {
  if (!currentUser || allSMSMessages.length === 0) return
  
  showLoading()
  try {
    const batch = writeBatch(db)
    let count = 0
    
    for (const msg of allSMSMessages) {
      if (!msg.read && msg.docRef) {
        batch.update(msg.docRef, { read: true })
        count++
      }
    }
    
    if (count > 0) {
      await batch.commit()
      showToast(`${count} messages marked as read`, "success")
      // Update local state
      allSMSMessages = allSMSMessages.map(msg => ({ ...msg, read: true }))
      if (currentConversation) {
        showConversation(currentConversation)
      } else {
        renderSMS(allSMSMessages)
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

// Delete all SMS
async function deleteAllSms() {
  if (!currentUser || allSMSMessages.length === 0) {
    showToast("No messages to delete", "info")
    return
  }
  
  if (!confirm(`Are you sure you want to delete all ${allSMSMessages.length} messages?`)) {
    return
  }
  
  showLoading()
  try {
    const batch = writeBatch(db)
    let count = 0
    
    for (const msg of allSMSMessages) {
      if (msg.docRef) {
        batch.delete(msg.docRef)
        count++
      }
    }
    
    if (count > 0) {
      await batch.commit()
      showToast(`${count} messages deleted`, "success")
      allSMSMessages = []
      currentConversation = null
      renderSMS([])
    }
  } catch (error) {
    console.error("Delete all error:", error)
    showToast("Failed to delete messages", "error")
  }
  hideLoading()
}

// Delete single SMS
async function deleteSingleSms(msgId) {
  if (!currentUser) return
  
  const msg = allSMSMessages.find(m => m.id === msgId)
  if (!msg || !msg.docRef) {
    showToast("Message not found", "error")
    return
  }
  
  try {
    await deleteDoc(msg.docRef)
    showToast("Message deleted", "success")
    allSMSMessages = allSMSMessages.filter(m => m.id !== msgId)
    if (currentConversation) {
      const remaining = allSMSMessages.filter(m => (m.phoneNumber || m.sender) === currentConversation)
      if (remaining.length === 0) {
        currentConversation = null
        renderSMS(allSMSMessages)
      } else {
        showConversation(currentConversation)
      }
    } else {
      renderSMS(allSMSMessages)
    }
  } catch (error) {
    console.error("Delete SMS error:", error)
    showToast("Failed to delete message", "error")
  }
}

// Delete device
async function deleteDevice(docId, deviceId) {
  if (!currentUser || !docId) return
  
  showLoading()
  try {
    // Delete device document
    await deleteDoc(doc(db, "devices", docId))
    
    // Also delete notifications subcollection for this device
    const notifPath = `users/${currentUser.uid}/devices/${deviceId}/notifications`
    const notifQuery = query(collection(db, notifPath))
    const notifSnapshot = await getDocs(notifQuery)
    
    const batch = writeBatch(db)
    notifSnapshot.forEach((notifDoc) => {
      batch.delete(notifDoc.ref)
    })
    
    if (notifSnapshot.size > 0) {
      await batch.commit()
    }
    
    showToast(`Device "${deviceId}" deleted`, "success")
    devices = devices.filter(d => d.docId !== docId)
    renderDevices()
    updateDeviceSelects()
  } catch (error) {
    console.error("Delete device error:", error)
    showToast("Failed to delete device", "error")
  }
  hideLoading()
}

// Event listeners for action buttons
if (markAllReadBtn) {
  markAllReadBtn.addEventListener("click", markAllSmsAsRead)
}

if (deleteAllSmsBtn) {
  deleteAllSmsBtn.addEventListener("click", deleteAllSms)
}

// Load Calls using collectionGroup
async function loadCalls() {
  if (!currentUser) return
  console.log("Loading calls for user:", currentUser.uid)

  const q = query(
    collection(db, "calls"),
    where("userId", "==", currentUser.uid),
    orderBy("timestamp", "desc"),
    limit(50)
  )

  const unsub = onSnapshot(
    q,
    (snapshot) => {
      console.log("Calls found:", snapshot.size)
      const calls = []
      snapshot.forEach((doc) => {
        calls.push({ id: doc.id, ...doc.data() })
      })
      renderCalls(calls)
    },
    (error) => {
      console.error("Calls Error:", error)
    }
  )

  unsubscribers.push(unsub)
}

// Store all calls for detail view
let allCallsData = []
let currentCallConversation = null

function renderCalls(calls) {
  allCallsData = calls

  if (calls.length === 0) {
    callsList.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
        </svg>
        <p>No calls yet</p>
        <span>Call history from your phone will appear here</span>
      </div>
    `
    return
  }

  // Group calls by phone number
  const grouped = {}
  calls.forEach((call) => {
    const key = call.phoneNumber || "Unknown"
    if (!grouped[key]) {
      grouped[key] = {
        phoneNumber: key,
        contactName: call.contactName || "",
        calls: [],
        lastCall: call,
        missedCount: 0,
      }
    }
    grouped[key].calls.push(call)
    if (call.type === "missed") grouped[key].missedCount++
    if (call.timestamp > (grouped[key].lastCall.timestamp || 0)) {
      grouped[key].lastCall = call
    }
  })

  // Sort by last call timestamp
  const callGroups = Object.values(grouped).sort(
    (a, b) => (b.lastCall.timestamp || 0) - (a.lastCall.timestamp || 0)
  )

  callsList.innerHTML = callGroups
    .map(
      (group) => `
    <div class="list-item call-group call-${group.lastCall.type}" data-phone="${
        group.phoneNumber
      }">
      <div class="list-item-avatar">
        ${getInitials(group.contactName || group.phoneNumber)}
      </div>
      <div class="list-item-content">
        <div class="list-item-title">${
          group.contactName || group.phoneNumber
        }</div>
        <div class="list-item-subtitle">${group.calls.length} calls • ${
        group.lastCall.type
      }</div>
      </div>
      <div class="list-item-meta">
        <span class="list-item-time">${formatTime(
          group.lastCall.timestamp
        )}</span>
        ${
          group.missedCount > 0
            ? `<div class="list-item-badge missed">${group.missedCount}</div>`
            : ""
        }
      </div>
    </div>
  `
    )
    .join("")

  // Add click handlers for call groups
  document.querySelectorAll(".call-group").forEach((el) => {
    el.addEventListener("click", () => {
      const phoneNumber = el.dataset.phone
      showCallHistory(phoneNumber)
    })
  })
}

function showCallHistory(phoneNumber) {
  const calls = allCallsData
    .filter((call) => call.phoneNumber === phoneNumber)
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))

  if (calls.length === 0) return

  const contactName = calls[0].contactName || phoneNumber
  currentCallConversation = phoneNumber

  callsList.innerHTML = `
    <div class="conversation-view">
      <div class="conversation-header">
        <button class="back-btn" id="backToCalls">
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
            phoneNumber !== contactName ? phoneNumber : ""
          }</div>
        </div>
      </div>
      <div class="conversation-messages call-history">
        ${calls
          .map(
            (call) => `
          <div class="call-history-item call-${call.type}">
            <div class="call-icon">
              ${getCallIcon(call.type)}
            </div>
            <div class="call-info">
              <div class="call-type">${call.type}</div>
              <div class="call-duration">${formatDuration(call.duration)}</div>
            </div>
            <div class="call-time">${formatTime(call.timestamp)}</div>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `

  // Add back button handler
  document.getElementById("backToCalls").addEventListener("click", () => {
    currentCallConversation = null
    renderCalls(allCallsData)
  })
}

function getCallIcon(type) {
  if (type === "incoming") {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--incoming)" stroke-width="2">
      <polyline points="7 17 17 7"/><polyline points="7 7 7 17 17 17"/>
    </svg>`
  } else if (type === "outgoing") {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--outgoing)" stroke-width="2">
      <polyline points="17 7 7 17"/><polyline points="17 17 17 7 7 7"/>
    </svg>`
  } else {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--missed)" stroke-width="2">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>`
  }
}

// Chat
function subscribeToChat() {
  if (!currentUser) return

  const q = query(
    collection(db, "chats"),
    where("participants", "array-contains", currentUser.uid),
    orderBy("timestamp", "desc"),
    limit(50)
  )

  const unsub = onSnapshot(q, (snapshot) => {
    const messages = []
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() })
    })

    renderChatMessages(messages.reverse())
  })

  unsubscribers.push(unsub)
}

function renderChatMessages(messages) {
  if (messages.length === 0) {
    chatMessages.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
        </svg>
        <p>Start a conversation</p>
        <span>Chat with your other devices</span>
      </div>
    `
    return
  }

  chatMessages.innerHTML = messages
    .map((msg) => {
      let content = ""

      // Image
      if (msg.type === "image" && msg.fileUrl) {
        content = `
          <a href="${msg.fileUrl}" target="_blank" class="chat-image-link">
            <img src="${msg.fileUrl}" alt="Image" class="chat-image" />
          </a>
        `
      }
      // File
      else if (msg.type === "file" && msg.fileUrl) {
        content = `
          <a href="${msg.fileUrl}" target="_blank" class="chat-file-link">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span>${msg.fileName || "File"}</span>
          </a>
        `
      }
      // Text
      else {
        content = `<div>${msg.content}</div>`
      }

      return `
        <div class="chat-message ${
          msg.senderId === currentUser.uid ? "sent" : "received"
        }">
          ${content}
          <div class="chat-message-time">${formatTime(msg.timestamp)}</div>
        </div>
      `
    })
    .join("")

  chatMessages.scrollTop = chatMessages.scrollHeight
}

sendChatBtn.addEventListener("click", sendChatMessage)
chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendChatMessage()
})

// Upload file to Firebase Storage
async function uploadFileToStorage(file) {
  const timestamp = Date.now()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
  const storagePath = `chat_files/${currentUser.uid}/${timestamp}_${sanitizedName}`

  const storageRef = ref(storage, storagePath)
  await uploadBytes(storageRef, file)
  const downloadUrl = await getDownloadURL(storageRef)

  return {
    url: downloadUrl,
    fileName: file.name,
    fileType: file.type.startsWith("image/") ? "image" : "file",
  }
}

// Send file in chat
async function sendFileMessage(file) {
  if (!file || !currentUser) return

  showLoading()

  try {
    const result = await uploadFileToStorage(file)
    const deviceId = await getDeviceId()

    await addDoc(collection(db, "chats"), {
      senderId: currentUser.uid,
      senderDeviceId: deviceId,
      receiverId: currentUser.uid,
      receiverDeviceId: chatDeviceSelect.value || null,
      content:
        result.fileType === "image" ? "📷 Image" : `📎 ${result.fileName}`,
      type: result.fileType,
      fileUrl: result.url,
      fileName: result.fileName,
      read: false,
      timestamp: Date.now(),
      participants: [currentUser.uid],
    })

    showToast(
      `${result.fileType === "image" ? "Image" : "File"} sent!`,
      "success"
    )
  } catch (error) {
    showToast("Failed to send file", "error")
    console.error(error)
  }

  hideLoading()
}

// Add file attachment button handler
document.getElementById("attachFileBtn")?.addEventListener("click", () => {
  const input = document.createElement("input")
  input.type = "file"
  input.accept = "*/*"
  input.onchange = (e) => {
    const file = e.target.files?.[0]
    if (file) sendFileMessage(file)
  }
  input.click()
})

// Add image attachment button handler
document.getElementById("attachImageBtn")?.addEventListener("click", () => {
  const input = document.createElement("input")
  input.type = "file"
  input.accept = "image/*"
  input.onchange = (e) => {
    const file = e.target.files?.[0]
    if (file) sendFileMessage(file)
  }
  input.click()
})

async function sendChatMessage() {
  const content = chatInput.value.trim()
  if (!content || !currentUser) return

  const deviceId = await getDeviceId()

  try {
    await addDoc(collection(db, "chats"), {
      senderId: currentUser.uid,
      senderDeviceId: deviceId,
      receiverId: currentUser.uid,
      receiverDeviceId: chatDeviceSelect.value || null,
      content: content,
      type: "text",
      read: false,
      timestamp: Date.now(),
      participants: [currentUser.uid],
    })

    chatInput.value = ""
  } catch (error) {
    showToast("Failed to send message", "error")
  }
}

// SMS Modal
newSmsBtn.addEventListener("click", () => {
  smsModal.classList.remove("hidden")
})

closeSmsModal.addEventListener("click", () => {
  smsModal.classList.add("hidden")
})

cancelSmsBtn.addEventListener("click", () => {
  smsModal.classList.add("hidden")
})

smsMessage.addEventListener("input", () => {
  charCount.textContent = smsMessage.value.length
})

sendSmsBtn.addEventListener("click", async () => {
  const deviceId = smsDevice.value
  const phone = smsPhone.value.trim()
  const message = smsMessage.value.trim()

  if (!deviceId) {
    showToast("Please select a device", "error")
    return
  }

  if (!phone) {
    showToast("Please enter a phone number", "error")
    return
  }

  if (!message) {
    showToast("Please enter a message", "error")
    return
  }

  showLoading()

  try {
    // Create SMS request for the mobile device to process
    await addDoc(collection(db, "sms_requests"), {
      userId: currentUser.uid,
      fromDeviceId: await getDeviceId(),
      toDeviceId: deviceId,
      phoneNumber: phone,
      message: message,
      status: "pending",
      timestamp: Date.now(),
    })

    showToast("SMS request sent to device", "success")
    smsModal.classList.add("hidden")
    smsPhone.value = ""
    smsMessage.value = ""
    charCount.textContent = "0"
  } catch (error) {
    showToast("Failed to send SMS request", "error")
  }

  hideLoading()
})

// Refresh
document.getElementById("refreshBtn").addEventListener("click", () => {
  showToast("Refreshing...", "info")
  loadData()
})

// Password Toggle
document.querySelectorAll(".toggle-password").forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.dataset.target
    const input = document.getElementById(targetId)
    const eyeOpen = btn.querySelector(".eye-open")
    const eyeClosed = btn.querySelector(".eye-closed")
    if (input.type === "password") {
      input.type = "text"
      eyeOpen.classList.add("hidden")
      eyeClosed.classList.remove("hidden")
    } else {
      input.type = "password"
      eyeOpen.classList.remove("hidden")
      eyeClosed.classList.add("hidden")
    }
  })
})

// Initial load
showLoading()
showLoading()
