/**
 * Toast notifications module
 */

import { toastContainer, loadingOverlay } from "./dom.js"

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type: 'info', 'success', 'error', 'warning'
 */
export function showToast(message, type = "info") {
  const toast = document.createElement("div")
  toast.className = `toast ${type}`
  toast.textContent = message
  toastContainer.appendChild(toast)
  setTimeout(() => toast.remove(), 3000)
}

/**
 * Show loading overlay
 */
export function showLoadingOverlay() {
  loadingOverlay.classList.remove("hidden")
}

/**
 * Hide loading overlay
 */
export function hideLoading() {
  loadingOverlay.classList.add("hidden")
}

/**
 * Show loading indicator in a list element
 * @param {HTMLElement} listElement - List element to show loading in
 */
export function showListLoading(listElement) {
  if (listElement) {
    listElement.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    `
  }
}
