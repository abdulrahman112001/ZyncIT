/**
 * Modals Module
 * Handles SMS modal and other modal functionality
 */

import {
  smsModal,
  newSmsBtn,
  closeSmsModal,
  cancelSmsBtn,
  sendSmsBtn,
  smsDevice,
  smsPhone,
  smsMessage,
  charCount,
} from "./dom.js"

import { db, collection, addDoc } from "../config/firebase.js"
import { showToast, showLoadingOverlay, hideLoading } from "./toasts.js"
import { getDeviceId } from "../utils/helpers.js"
import * as state from "../state/index.js"
import { renderSMS } from "../services/sms.js"

/**
 * Initialize SMS modal event listeners
 */
export function initSmsModal() {
  newSmsBtn?.addEventListener("click", () => {
    smsModal.classList.remove("hidden")
  })

  closeSmsModal?.addEventListener("click", () => {
    smsModal.classList.add("hidden")
  })

  cancelSmsBtn?.addEventListener("click", () => {
    smsModal.classList.add("hidden")
  })

  smsMessage?.addEventListener("input", () => {
    charCount.textContent = smsMessage.value.length
  })

  sendSmsBtn?.addEventListener("click", sendNewSms)
}

/**
 * Send new SMS from modal
 */
async function sendNewSms() {
  const user = state.currentUser
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

  showLoadingOverlay()

  try {
    const timestamp = Date.now()
    const selectedDevice = state.devices.find((d) => d.id === deviceId)
    const deviceName =
      selectedDevice?.nickname || selectedDevice?.name || "Android"

    // Create SMS request for the mobile device to process
    const docRef = await addDoc(collection(db, "sms_requests"), {
      userId: user.uid,
      fromDeviceId: await getDeviceId(),
      toDeviceId: deviceId,
      phoneNumber: phone,
      message: message,
      status: "pending",
      timestamp: timestamp,
    })

    // Add to local SMS list
    const newSmsMessage = {
      id: docRef.id,
      phoneNumber: phone,
      body: message,
      type: "sent",
      direction: "outgoing",
      timestamp: timestamp,
      read: true,
      deviceName: deviceName,
    }

    const updatedMessages = [...state.allSMSMessages, newSmsMessage]
    state.setAllSMSMessages(updatedMessages)
    renderSMS(updatedMessages)

    showToast("SMS request sent to device", "success")
    smsModal.classList.add("hidden")
    smsPhone.value = ""
    smsMessage.value = ""
    charCount.textContent = "0"
  } catch (error) {
    showToast("Failed to send SMS request", "error")
  }

  hideLoading()
}

/**
 * Initialize profile footer toggle
 */
export function initProfileFooter() {
  const toggleProfileBtn = document.getElementById("toggleProfileBtn")
  const profileFooter = document.getElementById("profileFooter")

  if (toggleProfileBtn && profileFooter) {
    toggleProfileBtn.addEventListener("click", () => {
      profileFooter.classList.toggle("collapsed")
      const isCollapsed = profileFooter.classList.contains("collapsed")
      localStorage.setItem("profileCollapsed", isCollapsed)
    })

    // Restore state on load
    const isCollapsed = localStorage.getItem("profileCollapsed") === "true"
    if (isCollapsed) {
      profileFooter.classList.add("collapsed")
    }
  }
}
