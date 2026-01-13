/**
 * ZyncIT Chrome Extension - Main Entry Point
 *
 * This is the main popup.js file that initializes all modules
 * and coordinates the extension functionality.
 */

// Import configuration
import "./config/firebase.js"

// Import state
import * as state from "./state/index.js"

// Import UI modules
import {
  smsList,
  callsList,
  notificationsList,
  markAllReadBtn,
  deleteAllSmsBtn,
} from "./ui/dom.js"
import { showToast, showListLoading } from "./ui/toasts.js"
import { initTabs } from "./ui/tabs.js"
import { initSmsModal, initProfileFooter } from "./ui/modals.js"

// Import services
import { initAuthObserver, initAuthListeners } from "./services/auth.js"
import { registerDevice, loadDevices } from "./services/devices.js"
import {
  loadSMS,
  renderSMS,
  markAllSmsAsRead,
  deleteAllSms,
  startPolling,
  stopPolling,
  startSMSListener,
  stopSMSListener,
} from "./services/sms.js"
import { loadCalls } from "./services/calls.js"
import { loadNotifications } from "./services/notifications.js"
import { subscribeToChat, initChatListeners } from "./services/chat.js"
import { loadUserSettings, initSettingsListeners } from "./services/settings.js"

// Import utilities
import { applyTranslations } from "./utils/i18n.js"

console.log("🚀 ZyncIT Popup Main Module Loading...")

/**
 * Load all data after login
 */
function loadData() {
  // Clean up existing subscriptions first
  cleanupSubscriptions()

  // Show loading indicators
  if (smsList) showListLoading(smsList)
  if (callsList) showListLoading(callsList)
  if (notificationsList) showListLoading(notificationsList)

  // Load all data
  loadDevices()
  loadSMS()
  loadCalls()
  loadNotifications()
  loadUserSettings()
  subscribeToChat()

  // Start real-time SMS listener for instant updates
  startSMSListener()

  // Don't start polling - we get updates from real-time listener
  // startPolling()
}

/**
 * Cleanup all subscriptions
 */
function cleanupSubscriptions() {
  state.clearUnsubscribers()
  stopPolling()
  stopSMSListener()
  state.clearAllSMS()
  state.clearAllNotifications()
  state.setDevices([])
}

/**
 * Handle new notifications from service worker
 */
function setupServiceWorkerListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("📨 Message from service worker:", message)

    if (message.type === "newNotification") {
      const notification = message.data
      console.log(
        "📨 New notification received:",
        notification.type,
        notification.title
      )

      // Real-time listener will handle SMS updates automatically
      // No need to manually reload
      if (notification.type !== "sms") {
        loadNotifications()
      }
    }

    sendResponse({ received: true })
    return true
  })
}

/**
 * Initialize the extension
 */
function init() {
  console.log("🚀 Initializing ZyncIT Extension...")

  // Apply translations
  applyTranslations()

  // Initialize UI
  initTabs()
  initSmsModal()
  initProfileFooter()
  initChatListeners()
  initSettingsListeners()
  initAuthListeners()

  // Setup service worker listener
  setupServiceWorkerListener()

  // Initialize auth observer
  initAuthObserver(
    // On login
    async (user) => {
      await registerDevice()
      loadData()
    },
    // On logout
    () => {
      cleanupSubscriptions()
      state.resetState()
    }
  )

  // Action buttons
  markAllReadBtn?.addEventListener("click", markAllSmsAsRead)
  deleteAllSmsBtn?.addEventListener("click", deleteAllSms)

  // Refresh button
  document.getElementById("refreshBtn")?.addEventListener("click", () => {
    showToast("Refreshing...", "info")
    loadData()
  })

  console.log("✅ ZyncIT Extension Initialized!")
}

// Start the extension
init()
