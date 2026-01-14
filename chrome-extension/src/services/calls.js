/**
 * Calls Service
 * Handles call history loading, rendering, and management
 */

import {
  db,
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
} from "../config/firebase.js";

import { callsList } from "../ui/dom.js";
import {
  formatTime,
  formatDuration,
  getInitials,
  getCallIcon,
} from "../utils/helpers.js";
import * as state from "../state/index.js";
import { updateTabBadges } from "./badges.js";

/**
 * Load calls from Firebase
 */
export async function loadCalls() {
  const user = state.currentUser;
  if (!user) return;
  console.log("Loading calls for user:", user.uid);

  // First, get user's devices
  const devicesQuery = query(
    collection(db, "devices"),
    where("userId", "==", user.uid)
  );

  const { getDocs } = await import("../config/firebase.js");
  const devicesSnapshot = await getDocs(devicesQuery);
  const devicesList = [];
  devicesSnapshot.forEach((doc) => {
    const data = doc.data();
    devicesList.push({
      id: data.id,
      name: data.nickname || data.name || data.model || data.id,
    });
  });

  console.log("📱 Loading calls from devices:", devicesList.length);

  // Subscribe to calls from each device
  devicesList.forEach((device) => {
    const q = query(
      collection(db, "users", user.uid, "devices", device.id, "calls"),
      orderBy("timestamp", "desc"),
      limit(50)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        console.log("📞 Calls found for device", device.id, ":", snapshot.size);
        const calls = [];
        snapshot.forEach((docSnap) => {
          calls.push({
            id: docSnap.id,
            deviceId: device.id,
            deviceName: device.name,
            docRef: docSnap.ref,
            ...docSnap.data(),
          });
        });
        updateCallsList(device.id, calls);
      },
      (error) => {
        console.error("Calls Error for device", device.id, ":", error);
      }
    );

    state.addUnsubscriber(unsub);
  });
}

/**
 * Update calls list with data from a device
 * @param {string} deviceId - Device ID
 * @param {Array} newCalls - Array of calls
 */
function updateCallsList(deviceId, newCalls) {
  // Store calls by device using setter
  state.setCallsByDevice(deviceId, newCalls);

  // Merge all calls from all devices
  let merged = [];
  Object.values(state.allCallsByDevice).forEach((calls) => {
    merged = merged.concat(calls);
  });

  // Remove duplicates by id
  const seen = new Set();
  merged = merged.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });

  // Sort by timestamp descending
  merged.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  renderCalls(merged.slice(0, 100));
}

/**
 * Render calls list grouped by phone number
 * @param {Array} calls - Array of call records
 */
export function renderCalls(calls) {
  // Normalize calls to ensure viewed flag exists
  const normalizedCalls = calls.map((call) => ({
    ...call,
    viewed: call.viewed ?? false,
  }));

  state.setAllCallsData(normalizedCalls);

  if (normalizedCalls.length === 0) {
    callsList.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
        </svg>
        <p>No calls yet</p>
        <span>Call history from your phone will appear here</span>
      </div>
    `;
    updateTabBadges();
    return;
  }

  // Group calls by phone number
  const grouped = {};
  normalizedCalls.forEach((call) => {
    const key = call.phoneNumber || "Unknown";
    if (!grouped[key]) {
      grouped[key] = {
        phoneNumber: key,
        contactName: call.contactName || "",
        calls: [],
        lastCall: call,
        missedCount: 0,
        unviewedMissedCount: 0,
      };
    }
    grouped[key].calls.push(call);
    if (call.type === "missed") {
      grouped[key].missedCount++;
      if (!call.viewed) grouped[key].unviewedMissedCount++;
    }
    if (call.timestamp > (grouped[key].lastCall.timestamp || 0)) {
      grouped[key].lastCall = call;
    }
  });

  // Sort by last call timestamp
  const callGroups = Object.values(grouped).sort(
    (a, b) => (b.lastCall.timestamp || 0) - (a.lastCall.timestamp || 0)
  );

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
        ${
          group.lastCall.deviceName
            ? `<div class="device-tag">${group.lastCall.deviceName}</div>`
            : ""
        }
      </div>
      <div class="list-item-meta">
        <span class="list-item-time">${formatTime(
          group.lastCall.timestamp
        )}</span>
        ${
          group.unviewedMissedCount > 0
            ? `<div class="list-item-badge missed">${group.unviewedMissedCount}</div>`
            : ""
        }
      </div>
    </div>
  `
    )
    .join("");

  // Add click handlers for call groups
  document.querySelectorAll(".call-group").forEach((el) => {
    el.addEventListener("click", () => {
      const phoneNumber = el.dataset.phone;
      showCallHistory(phoneNumber);
    });
  });

  updateTabBadges();
}

/**
 * Show call history for a specific phone number
 * @param {string} phoneNumber - Phone number to show history for
 */
async function showCallHistory(phoneNumber) {
  const calls = state.allCallsData
    .filter((call) => call.phoneNumber === phoneNumber)
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  if (calls.length === 0) return;

  const contactName = calls[0].contactName || phoneNumber;
  state.setCurrentCallConversation(phoneNumber);

  // Mark missed calls for this number as viewed
  const missedToMark = calls.filter(
    (call) => call.type === "missed" && !call.viewed
  );

  if (missedToMark.length > 0) {
    // Update local state immediately
    const updatedCalls = state.allCallsData.map((call) =>
      call.phoneNumber === phoneNumber && call.type === "missed"
        ? { ...call, viewed: true }
        : call
    );
    state.setAllCallsData(updatedCalls);
    updateTabBadges();

    try {
      const user = state.currentUser;
      if (user) {
        const batch = writeBatch(db);
        missedToMark.forEach((call) => {
          // Use the correct path: users/{userId}/devices/{deviceId}/calls/{callId}
          if (call.deviceId) {
            const callRef = doc(
              db,
              "users",
              user.uid,
              "devices",
              call.deviceId,
              "calls",
              call.id
            );
            batch.set(callRef, { viewed: true }, { merge: true });
          }
        });
        await batch.commit();
        console.log("✅ Marked", missedToMark.length, "calls as viewed");
      }
    } catch (error) {
      console.error("Failed to mark calls as viewed:", error);
    }
  }

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
  `;

  // Add back button handler
  document.getElementById("backToCalls")?.addEventListener("click", () => {
    state.setCurrentCallConversation(null);
    renderCalls(state.allCallsData);
  });
}
