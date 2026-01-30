import "./config/firebase.js";

import * as state from "./state/index.js";

import {
  smsList,
  callsList,
  notificationsList,
  markAllReadBtn,
  deleteAllSmsBtn,
} from "./ui/dom.js";
import { showToast, showListLoading, showLoadingOverlay } from "./ui/toasts.js";
import { initTabs } from "./ui/tabs.js";
import { initSmsModal, initProfileFooter } from "./ui/modals.js";

// Import services
import { initAuthObserver, initAuthListeners } from "./services/auth.js";
import { registerDevice, loadDevices } from "./services/devices.js";
import {
  loadSMS,
  renderSMS,
  markAllSmsAsRead,
  deleteAllSms,
  startPolling,
  stopPolling,
  stopSMSListener,
} from "./services/sms.js";
import { loadCalls } from "./services/calls.js";
import { loadNotifications } from "./services/notifications.js";
import { subscribeToChat, initChatListeners } from "./services/chat.js";
import {
  loadUserSettings,
  initSettingsListeners,
} from "./services/settings.js";

// Import utilities
import { applyTranslations } from "./utils/i18n.js";

function loadData() {
  cleanupSubscriptions();

  if (smsList) showListLoading(smsList);
  if (callsList) showListLoading(callsList);
  if (notificationsList) showListLoading(notificationsList);

  // Load all data - SMS now uses real-time listeners internally
  loadDevices();
  loadSMS(); // This now sets up real-time listeners automatically
  loadCalls();
  loadNotifications();
  loadUserSettings();
  subscribeToChat();
}

function cleanupSubscriptions() {
  state.clearUnsubscribers();
  stopPolling();
  stopSMSListener();
  state.clearAllSMS();
  state.clearAllNotifications();
  state.setDevices([]);
}

function setupServiceWorkerListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "newNotification") {
      const notification = message.data;
      console.log(
        "📨 New notification received in popup:",
        notification.type,
        notification.title,
      );

      // Reload notifications list
      loadNotifications();

      // Note: SMS updates are handled by real-time listener in sms.js
      // No need to call loadSMS() here as it would cause duplicate processing
      if (notification.type === "sms") {
        console.log(
          "📱 SMS notification - real-time listener will handle UI update",
        );
      }
    }

    sendResponse({ received: true });
    return true;
  });
}

/**
 * Initialize the extension
 */
function init() {
  // Show loading overlay while checking auth
  showLoadingOverlay();

  // Apply translations
  applyTranslations();

  // Initialize UI
  initTabs();
  initSmsModal();
  initProfileFooter();
  initChatListeners();
  initSettingsListeners();
  initAuthListeners();

  // Setup service worker listener
  setupServiceWorkerListener();

  // Initialize auth observer
  initAuthObserver(
    // On login
    async (user) => {
      await registerDevice();
      loadData();
    },
    // On logout
    () => {
      cleanupSubscriptions();
      state.resetState();
    },
  );

  // Action buttons
  markAllReadBtn?.addEventListener("click", markAllSmsAsRead);
  deleteAllSmsBtn?.addEventListener("click", deleteAllSms);

  // Refresh button
  document.getElementById("refreshBtn")?.addEventListener("click", () => {
    showToast("Refreshing...", "info");
    loadData();
  });
}

// Start the extension
init();
