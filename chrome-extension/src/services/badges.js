/**
 * Badge Service
 * Handles tab badge updates
 */

import * as state from "../state/index.js"

/**
 * Update all tab badges
 */
export function updateTabBadges() {
  const user = state.currentUser
  if (!user) return

  // Chat badge - count unread messages
  const chatUnread = state.cachedChatMessages.filter(
    (msg) => !msg.read && msg.senderId !== user.uid
  ).length
  updateBadge("chatBadge", chatUnread)

  // SMS badge - count unread SMS in conversations
  const smsUnread = Object.values(state.allSMS).reduce(
    (count, conversation) => {
      return count + conversation.filter((msg) => !msg.read).length
    },
    0
  )
  updateBadge("smsBadge", smsUnread)

  // Calls badge - count missed calls that haven't been viewed
  const missedCalls = state.allCallsData.filter(
    (call) => call.type === "missed" && !call.viewed
  ).length
  updateBadge("callsBadge", missedCalls)

  // Notifications badge - count unread notifications
  const notifUnread = Object.values(state.allNotifications).reduce(
    (count, notifList) => {
      return count + notifList.filter((notif) => !notif.read).length
    },
    0
  )
  updateBadge("notificationsBadge", notifUnread)
}

/**
 * Update a single badge
 * @param {string} badgeId - Badge element ID
 * @param {number} count - Count to display
 */
function updateBadge(badgeId, count) {
  const badge = document.getElementById(badgeId)
  if (!badge) return

  if (count > 0) {
    badge.textContent = count > 99 ? "99+" : count
    badge.style.display = "flex"
  } else {
    badge.style.display = "none"
  }
}
