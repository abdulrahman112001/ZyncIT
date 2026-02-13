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
  orderBy,
  startAfter,
  onSnapshot,
} from "../config/firebase.js";

import { COLLECTIONS, SYNC_CONFIG } from "../config/constants.js";
import { parseFirestoreError, logError } from "../utils/errors.js";
import { smsLogger as logger } from "../utils/logger.js";
import { smsList } from "../ui/dom.js";
import { showToast, showLoadingOverlay, hideLoading } from "../ui/toasts.js";
import {
  formatTime,
  getInitials,
  getAppIcon,
  getDeviceId,
  getFriendlyDeviceName,
} from "../utils/helpers.js";
import * as state from "../state/index.js";
import { updateTabBadges } from "./badges.js";
import { decryptSMS } from "./cryptoService.js";
import { getContactName } from "./contacts.js";

// Store unsubscribe functions for real-time listeners
let smsUnsubscribeFunctions = [];
// Track processed message IDs to avoid duplicates
let processedMessageIds = new Set();

// Pagination state
const PAGE_SIZE = 50;
let paginationState = {}; // { deviceId: { lastTimestamp, hasMore, loading } }
let isLoadingMore = false;

/**
 * Normalize phone number for consistent grouping/matching
 * @param {string} phone - Raw phone number
 * @returns {string} - Normalized phone number
 */
function normalizePhoneNumber(phone) {
  if (!phone || !phone.trim()) return "";

  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, "").trim();

  // Remove + and leading country codes
  normalized = normalized.replace(/^\+/, "");

  // Remove Egypt country code (20) if present
  if (normalized.startsWith("20") && normalized.length > 10) {
    normalized = normalized.substring(2);
  }
  // Add leading 0 if missing for local numbers
  if (!normalized.startsWith("0") && normalized.length === 10) {
    normalized = "0" + normalized;
  }

  return normalized;
}

/**
 * Check if a string looks like a phone number
 * @param {string} value - Value to check
 * @returns {boolean}
 */
function isPhoneNumberLike(value) {
  if (!value || !value.trim) return false;
  const digits = value.replace(/[\s\-().]/g, "");
  return /\d{6,}/.test(digits);
}

/**
 * Resolve phone number from raw SMS data
 * @param {Object} data - SMS data
 * @returns {string}
 */
function resolvePhoneNumber(data) {
  if (!data) return "";
  const candidates = [
    data.phoneNumber,
    data.sender,
    data.address,
    data.number,
    data.phone,
  ];

  const candidate = candidates.find((c) => c && isPhoneNumberLike(c));

  if (candidate) return candidate;

  if (data.title && isPhoneNumberLike(data.title)) {
    return data.title;
  }

  return (
    data.phoneNumber ||
    data.sender ||
    data.address ||
    data.number ||
    data.phone ||
    ""
  );
}

/**
 * Resolve contact name from raw SMS data
 * @param {Object} data - SMS data
 * @param {string} phoneNumber - Resolved phone number
 * @returns {string}
 */
function resolveContactName(data, phoneNumber) {
  if (!data) return "";

  // Priority: explicit contactName > displayName > title (if not a phone number) > contacts lookup
  if (data.contactName && data.contactName.trim()) return data.contactName;
  if (data.displayName && data.displayName.trim()) return data.displayName;

  // title from Google Messages notification = contact name or phone number
  if (data.title && data.title.trim() && !isPhoneNumberLike(data.title)) {
    return data.title;
  }

  // Lookup in local contacts map (handles multiple numbers per contact)
  const fromContacts = getContactName(phoneNumber);
  if (fromContacts) return fromContacts;

  // Last resort: check if title is different from phoneNumber (might be a name in another language)
  if (data.title && data.title.trim() && data.title !== phoneNumber) {
    // Title has non-digit chars = likely a name
    const nonDigits = data.title.replace(/[\d\s\-+().]/g, "");
    if (nonDigits.length > 0) return data.title;
  }

  return "";
}

/**
 * Start real-time listeners for SMS from all user devices
 */
export async function startSMSListener() {
  const user = state.currentUser;
  if (!user) {
    console.warn("⚠️ No current user - cannot start SMS listener");
    return;
  }

  console.log("🎧 Starting SMS real-time listeners...");

  // Stop previous listeners
  stopSMSListener();

  try {
    // Get all user devices
    const devicesQuery = query(
      collection(db, COLLECTIONS.DEVICES),
      where("userId", "==", user.uid),
    );

    const devicesSnapshot = await getDocs(devicesQuery);
    console.log(`📱 Found ${devicesSnapshot.size} total devices`);

    let listenerCount = 0;
    devicesSnapshot.forEach((deviceDoc) => {
      const data = deviceDoc.data();
      // Only listen to mobile devices (not extension)
      if (
        data.platform !== "chrome-extension" &&
        data.platform !== "chrome" &&
        !data.id?.startsWith("ext_")
      ) {
        const deviceName = getFriendlyDeviceName(data);
        console.log(
          `📱 Starting SMS listener for device: ${data.id} (${deviceName})`,
        );
        listenToDeviceSMS(user.uid, data.id, deviceName);
        listenerCount++;
      }
    });

    console.log(`✅ Started ${listenerCount} SMS listeners`);
  } catch (error) {
    console.error("❌ Error starting SMS listeners:", error);
  }
}

/**
 * Listen to SMS from a specific device in real-time
 */
function listenToDeviceSMS(userId, deviceId, deviceName = null) {
  const q = query(
    collection(db, "users", userId, "devices", deviceId, "notifications"),
    where("type", "==", "sms"),
    orderBy("timestamp", "desc"),
    limit(200),
  );

  let isInitialSnapshot = true;

  const unsubscribe = onSnapshot(
    q,
    async (snapshot) => {
      // Skip initial snapshot - we already loaded data with loadSMS()
      if (isInitialSnapshot) {
        console.log(
          `📨 Initial snapshot for device ${deviceId} - skipping (${snapshot.docs.length} docs)`,
        );
        isInitialSnapshot = false;
        return;
      }

      console.log(
        `📨 SMS snapshot update for device ${deviceId}: ${snapshot.docChanges().length} changes`,
      );

      const user = state.currentUser;
      let hasNewMessages = false;

      for (const change of snapshot.docChanges()) {
        if (change.type === "added") {
          let data = change.doc.data();
          const messageId = change.doc.id;

          // Decrypt SMS data
          if (user) {
            data = await decryptSMS(data, user.uid);
          }

          console.log(
            `🆕 New SMS detected: ${messageId} from ${data.title || data.contactName || data.phoneNumber}`,
          );

          // Check if already processed
          if (processedMessageIds.has(messageId)) {
            console.log(`  ⏭️ Already processed: ${messageId}`);
            return;
          }

          // Check if already exists in current SMS list
          const currentSMS = state.getSMSData(deviceId) || [];
          const existsInList = currentSMS.some((msg) => msg.id === messageId);
          if (existsInList) {
            console.log(`  ⏭️ Already in list: ${messageId}`);
            processedMessageIds.add(messageId);
            return;
          }

          const message = {
            ...data, // spread data FIRST so explicit fields below take priority
            id: messageId, // Firestore doc ID (NOT data.id which is "0" for Google Messages)
            docId: messageId, // backup unique ID
            docRef: change.doc.ref,
            deviceId: deviceId,
            deviceName: deviceName,
            phoneNumber: data.phoneNumber || data.sender || data.title || "",
            contactName:
              data.contactName ||
              data.title ||
              getContactName(data.phoneNumber || data.sender || data.title) ||
              "",
            body: data.text || data.content || data.body || "",
            timestamp: data.timestamp || data.receivedAt || Date.now(),
            read: data.read === true,
            type: data.type || "sms",
          };

          console.log(`✅ Adding new SMS message: ${messageId}`, {
            contact: message.contactName,
            phone: message.phoneNumber,
            body: message.body?.substring(0, 30),
          });

          // Mark as processed
          processedMessageIds.add(messageId);

          // Add to existing SMS list
          const updatedSMS = [...currentSMS, message];
          updateSMSList(deviceId, updatedSMS);
          hasNewMessages = true;
        }
      }

      if (hasNewMessages) {
        console.log(
          `✨ SMS list updated with new messages from device ${deviceId}`,
        );
      }
    },
    (error) => {
      console.error(
        `[ERROR] SMS listener error for device ${deviceId}:`,
        error,
      );
    },
  );

  smsUnsubscribeFunctions.push(unsubscribe);
}

/**
 * Stop all SMS listeners
 */
export function stopSMSListener() {
  smsUnsubscribeFunctions.forEach((unsub) => unsub());
  smsUnsubscribeFunctions = [];
  // Clear processed IDs and pagination state when stopping listeners
  processedMessageIds.clear();
  paginationState = {};
  isLoadingMore = false;
}

/**
 * Load SMS from all user devices using real-time listeners
 */
export async function loadSMS() {
  console.log("[SMS] loadSMS called - setting up real-time listeners");
  const user = state.currentUser;
  if (!user) {
    console.warn("[WARN] No current user - cannot load SMS");
    logger.warn("No current user");
    return;
  }

  // Stop any previous listeners first
  stopSMSListener();

  console.log(`[SMS] Loading SMS for user: ${user.uid}`);
  logger.info(`Loading SMS for user: ${user.uid}`);

  try {
    // First, get all user devices
    const devicesQuery = query(
      collection(db, COLLECTIONS.DEVICES),
      where("userId", "==", user.uid),
    );

    logger.debug("Fetching devices...");
    const devicesSnapshot = await getDocs(devicesQuery);
    console.log(
      `[SMS] Found ${devicesSnapshot.size} devices for user ${user.uid}`,
    );
    logger.debug(`Found ${devicesSnapshot.size} devices`);

    const devicesList = [];
    devicesSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(
        `  [DEVICE] doc: ${doc.id}, platform: ${data.platform}, data.id: ${data.id}, userId: ${data.userId}`,
      );
      console.log(`  [DEVICE] Full data:`, JSON.stringify(data, null, 2));
      // Only include non-extension devices (Android/iOS)
      if (
        data.platform !== "chrome-extension" &&
        data.platform !== "chrome" &&
        !data.id?.startsWith("ext_")
      ) {
        console.log(`  [DEVICE] Adding mobile device: ${data.id}`);
        devicesList.push({
          id: data.id,
          name: getFriendlyDeviceName(data),
        });
      } else {
        console.log(`  [DEVICE] Skipping extension device: ${data.id}`);
      }
    });

    console.log(
      `[SMS] Mobile devices found: ${devicesList.length}`,
      devicesList,
    );

    if (devicesList.length === 0) {
      console.warn(
        "⚠️ No mobile devices found for SMS loading - showing empty state",
      );
      renderSMS([]);
      return;
    }

    // Load SMS notifications from each device using onSnapshot for real-time updates
    for (const device of devicesList) {
      // Initialize pagination state for this device
      paginationState[device.id] = {
        lastTimestamp: null,
        hasMore: true,
        loading: false,
      };

      const q = query(
        collection(
          db,
          "users",
          user.uid,
          "devices",
          device.id,
          "notifications",
        ),
        where("type", "==", "sms"),
        orderBy("timestamp", "desc"),
        limit(PAGE_SIZE),
      );

      // Use onSnapshot instead of getDocs for real-time updates
      const unsub = onSnapshot(
        q,
        async (snapshot) => {
          console.log(
            `[SMS] 🔄 Real-time update for device ${device.id}: ${snapshot.size} total SMS`,
          );
          const messages = [];

          for (const docSnap of snapshot.docs) {
            let data = docSnap.data();
            const messageId = docSnap.id;

            // Decrypt SMS data
            data = await decryptSMS(data, user.uid);

            const resolvedPhone = resolvePhoneNumber(data);
            const resolvedContact = resolveContactName(data, resolvedPhone);

            messages.push({
              ...data, // spread data FIRST so explicit fields below take priority
              id: messageId, // Firestore doc ID (NOT data.id which is always "0" for Google Messages)
              docId: messageId, // backup unique ID
              docRef: docSnap.ref,
              deviceId: device.id,
              deviceName: device.name,
              phoneNumber: resolvedPhone,
              contactName: resolvedContact,
              body: data.text || data.content || data.body || "",
              timestamp: data.timestamp || data.receivedAt || Date.now(),
              read: data.read === true,
              type: data.type || "sms",
            });
          }

          // Track pagination cursor
          if (messages.length > 0) {
            const oldestMsg = messages[messages.length - 1];
            paginationState[device.id].lastTimestamp = oldestMsg.timestamp;
          }
          paginationState[device.id].hasMore = snapshot.size >= PAGE_SIZE;

          console.log(
            `[SMS] ✅ Updating SMS list with ${messages.length} messages from ${device.id} (hasMore: ${paginationState[device.id].hasMore})`,
          );
          updateSMSList(device.id, messages);
        },
        (error) => {
          console.error(
            "❌ SMS listener error for device",
            device.id,
            ":",
            error,
          );
        },
      );

      // Store unsubscribe function
      smsUnsubscribeFunctions.push(unsub);
    }
  } catch (error) {
    console.error("❌ loadSMS error:", error);
  }
}

/**
 * Load more SMS messages (infinite scroll pagination)
 * Fetches the next page of messages from all devices
 */
export async function loadMoreSMS() {
  const user = state.currentUser;
  if (!user || isLoadingMore) return;

  // Check if any device has more to load
  const devicesWithMore = Object.entries(paginationState).filter(
    ([_, s]) => s.hasMore && !s.loading,
  );
  if (devicesWithMore.length === 0) {
    console.log("[SMS] No more messages to load from any device");
    return;
  }

  isLoadingMore = true;
  console.log(
    `[SMS] 📥 Loading more SMS from ${devicesWithMore.length} devices...`,
  );

  try {
    for (const [deviceId, deviceState] of devicesWithMore) {
      if (!deviceState.lastTimestamp) continue;
      deviceState.loading = true;

      const q = query(
        collection(db, "users", user.uid, "devices", deviceId, "notifications"),
        where("type", "==", "sms"),
        orderBy("timestamp", "desc"),
        startAfter(deviceState.lastTimestamp),
        limit(PAGE_SIZE),
      );

      try {
        const snapshot = await getDocs(q);
        console.log(
          `[SMS] 📥 Loaded ${snapshot.size} more messages from device ${deviceId}`,
        );

        if (snapshot.empty) {
          deviceState.hasMore = false;
          deviceState.loading = false;
          continue;
        }

        const existingMessages = state.getSMSData(deviceId) || [];
        const existingIds = new Set(existingMessages.map((m) => m.id));
        const newMessages = [];

        for (const docSnap of snapshot.docs) {
          const messageId = docSnap.id;
          if (existingIds.has(messageId)) continue;

          let data = docSnap.data();
          data = await decryptSMS(data, user.uid);

          const resolvedPhone = resolvePhoneNumber(data);
          const resolvedContact = resolveContactName(data, resolvedPhone);

          const deviceInfo = Object.values(state.allSMS)
            .flat()
            .find((m) => m.deviceId === deviceId);

          newMessages.push({
            ...data, // spread data FIRST so explicit fields below take priority
            id: messageId, // Firestore doc ID (NOT data.id which is always "0" for Google Messages)
            docId: messageId, // backup unique ID
            docRef: docSnap.ref,
            deviceId: deviceId,
            deviceName: deviceInfo?.deviceName || "Android",
            phoneNumber: resolvedPhone,
            contactName: resolvedContact,
            body: data.text || data.content || data.body || "",
            timestamp: data.timestamp || data.receivedAt || Date.now(),
            read: data.read === true,
            type: data.type || "sms",
          });
        }

        // Update pagination cursor
        if (newMessages.length > 0) {
          const oldestMsg = newMessages[newMessages.length - 1];
          deviceState.lastTimestamp = oldestMsg.timestamp;
        }
        deviceState.hasMore = snapshot.size >= PAGE_SIZE;
        deviceState.loading = false;

        // Merge with existing messages
        if (newMessages.length > 0) {
          const merged = [...existingMessages, ...newMessages];
          updateSMSList(deviceId, merged);
        }
      } catch (error) {
        console.error(`❌ Error loading more SMS from ${deviceId}:`, error);
        deviceState.loading = false;
      }
    }
  } finally {
    isLoadingMore = false;
  }
}

/**
 * Check if there are more SMS to load
 * @returns {boolean}
 */
export function hasMoreSMS() {
  return Object.values(paginationState).some((s) => s.hasMore);
}

/**
 * Update SMS list with messages from a device
 * @param {string} deviceId - Device ID
 * @param {Array} newMessages - Array of SMS messages
 */
export function updateSMSList(deviceId, newMessages) {
  console.log(
    `[SMS] updateSMSList called - device: ${deviceId}, messages: ${newMessages.length}`,
  );

  const normalizedMessages = newMessages.map((msg) => {
    const resolvedPhone =
      msg.phoneNumber || resolvePhoneNumber(msg) || msg.sender || msg.address;
    const resolvedContact =
      msg.contactName || resolveContactName(msg, resolvedPhone);

    return {
      ...msg,
      phoneNumber: resolvedPhone || msg.phoneNumber || "",
      contactName: resolvedContact || msg.contactName || "",
    };
  });

  // DEBUG: Check if تست is in newMessages
  const testInNew = normalizedMessages.find(
    (m) =>
      (m.body || m.text || "").includes("تست") ||
      (m.contactName || m.title || "").includes("Abdl"),
  );
  console.log("[SMS] STEP 1 - تست in newMessages:", testInNew ? "YES" : "NO");

  // Store SMS by device
  state.setSMSData(deviceId, normalizedMessages);

  // DEBUG: Check if تست is stored
  const storedMsgs = state.allSMS[deviceId] || [];
  const testInStored = storedMsgs.find(
    (m) =>
      (m.body || m.text || "").includes("تست") ||
      (m.contactName || m.title || "").includes("Abdl"),
  );
  console.log(
    "[SMS] STEP 2 - تست in state.allSMS:",
    testInStored ? "YES" : "NO",
  );
  console.log(
    "[SMS] STEP 2 - state.allSMS devices:",
    Object.keys(state.allSMS),
  );
  console.log(
    "[SMS] STEP 2 - state.allSMS[deviceId] count:",
    storedMsgs.length,
  );

  // Merge all SMS from all devices
  let merged = [];
  Object.values(state.allSMS).forEach((msgs) => {
    merged = merged.concat(msgs);
  });

  console.log("[SMS] STEP 3 - Total merged messages:", merged.length);

  // DEBUG: Check if تست is in merged
  const testInMerged = merged.find(
    (m) =>
      (m.body || m.text || "").includes("تست") ||
      (m.contactName || m.title || "").includes("Abdl"),
  );
  console.log("[SMS] STEP 3 - تست in merged:", testInMerged ? "YES" : "NO");

  // إزالة التكرار - الاحتفاظ بنسخة واحدة فقط من كل رسالة
  // استخدام docRef.referencePath كـ ID فريد لأن msg.id قد يكون مكرراً
  const uniqueMessages = [];
  const seenIds = new Set();

  for (const msg of merged) {
    // استخدام المسار الكامل للمستند كـ ID فريد
    // Firebase Web SDK v9 uses .path (NOT .referencePath)
    // Also use docId as backup - msg.key is NOT unique (same for all msgs in a Google Messages conversation)
    const uniqueId =
      msg.docRef?.path ||
      msg.docId ||
      msg.id ||
      `${msg.timestamp}_${msg.phoneNumber}`;

    if (!seenIds.has(uniqueId)) {
      seenIds.add(uniqueId);
      uniqueMessages.push(msg);
    }
  }

  console.log("[SMS] Unique messages after dedup:", uniqueMessages.length);

  // DEBUG: Check if تست is in unique messages
  const hasTest = uniqueMessages.find(
    (m) =>
      (m.body || m.text || "").includes("تست") ||
      (m.contactName || m.title || "").includes("Abdl"),
  );
  console.log("[SMS] تست message in uniqueMessages:", hasTest ? "YES" : "NO");
  if (hasTest) {
    console.log(
      "[SMS] تست details:",
      JSON.stringify({
        id: hasTest.id,
        phone: hasTest.phoneNumber,
        contact: hasTest.contactName,
        body: (hasTest.body || hasTest.text || "").substring(0, 30),
      }),
    );
  }

  // Sort by timestamp descending
  uniqueMessages.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  state.setAllSMSMessages(uniqueMessages);
  renderSMS(uniqueMessages);
  updateTabBadges();
}

/**
 * Render SMS conversations list
 * @param {Array} messages - Array of SMS messages
 */
export function renderSMS(messages) {
  const hasTestInRender = messages.find(
    (m) =>
      (m.body || m.text || "").includes("تست") ||
      (m.contactName || m.title || "").includes("Abdl"),
  );
  console.log(
    "[SMS] تست in renderSMS:",
    hasTestInRender
      ? "YES - " + (hasTestInRender.contactName || hasTestInRender.phoneNumber)
      : "NO",
  );

  if (messages.length > 0) {
    console.log("[SMS] First 3 messages:");
    messages.slice(0, 3).forEach((m, i) => {
      console.log(
        `  ${i + 1}. id=${m.id}, phone=${m.phoneNumber}, contact=${m.contactName}, text=${(m.body || m.text || "").substring(0, 20)}...`,
      );
    });
  }

  const smsListElement = document.getElementById("smsList");

  if (!smsListElement) {
    return;
  }

  if (messages.length === 0) {
    smsListElement.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        <p>No messages yet</p>
        <span>Messages from your phone will appear here</span>
      </div>
    `;
    updateTabBadges();
    return;
  }

  // Build reverse map: contactName -> all normalized phone numbers for that contact
  // This merges conversations for the same contact with different phone numbers
  const contactToPhones = {};
  const phoneToContact = {};

  // First pass: collect contact names from messages and contacts map
  messages.forEach((msg) => {
    const rawPhone = msg.phoneNumber || msg.sender || "";
    const normPhone = rawPhone ? normalizePhoneNumber(rawPhone) : "";
    const contactName =
      msg.contactName || msg.title || getContactName(rawPhone) || "";

    if (normPhone && contactName && !isPhoneNumberLike(contactName)) {
      if (!contactToPhones[contactName]) {
        contactToPhones[contactName] = new Set();
      }
      contactToPhones[contactName].add(normPhone);
      phoneToContact[normPhone] = contactName;
    }
  });

  // Also add from the contacts map (state.phoneToContactMap)
  if (state.phoneToContactMap) {
    Object.entries(state.phoneToContactMap).forEach(([phone, name]) => {
      if (name && phone) {
        if (!contactToPhones[name]) {
          contactToPhones[name] = new Set();
        }
        contactToPhones[name].add(phone);
        phoneToContact[phone] = name;
      }
    });
  }

  // Group messages by phone number or contact name
  const grouped = {};
  console.log(`[SMS] Grouping ${messages.length} messages...`);
  messages.forEach((msg, index) => {
    let rawPhone = msg.phoneNumber || msg.sender || "";
    let contactName = msg.contactName || msg.title || "";

    // Try to resolve contact name from phone lookup
    const normPhone = rawPhone ? normalizePhoneNumber(rawPhone) : "";
    if ((!contactName || isPhoneNumberLike(contactName)) && normPhone) {
      contactName = phoneToContact[normPhone] || getContactName(rawPhone) || "";
    }

    // Normalize phone number using shared function
    let key;
    if (rawPhone && rawPhone.trim()) {
      key = normalizePhoneNumber(rawPhone);

      // Check if this phone belongs to a known contact with multiple numbers
      // Group all numbers of the same contact together under the contact name key
      if (
        contactName &&
        !isPhoneNumberLike(contactName) &&
        contactToPhones[contactName]?.size > 1
      ) {
        key = "contact_" + contactName.trim();
      }
    } else if (contactName && contactName.trim()) {
      key = "contact_" + contactName.trim();
      rawPhone = contactName;
    } else {
      key = "Unknown";
      rawPhone = "Unknown";
    }

    // Debug: Log grouping for تست message
    if (
      (msg.body || msg.text || "").includes("تست") ||
      (contactName || "").includes("Abdl")
    ) {
      console.log(
        `[SMS] DEBUG تست: key="${key}", phone="${rawPhone}", contact="${contactName}"`,
      );
    }

    if (!grouped[key]) {
      grouped[key] = {
        normalizedPhone: key,
        phoneNumber: rawPhone,
        contactName: contactName,
        messages: [],
        messageIds: new Set(), // لتتبع IDs المستخدمة
        lastMessage: msg,
        unreadCount: 0,
      };
    }

    // تجنب إضافة نفس الرسالة مرتين
    if (!grouped[key].messageIds.has(msg.id)) {
      grouped[key].messages.push(msg);
      grouped[key].messageIds.add(msg.id);

      if (!msg.read) grouped[key].unreadCount++;
      if (msg.timestamp > (grouped[key].lastMessage.timestamp || 0)) {
        grouped[key].lastMessage = msg;
        if (msg.contactName || msg.title) {
          grouped[key].contactName = msg.contactName || msg.title;
        }
      }
    }
  });

  // Sort by last message timestamp
  const conversations = Object.values(grouped).sort(
    (a, b) => (b.lastMessage.timestamp || 0) - (a.lastMessage.timestamp || 0),
  );

  console.log(
    "[SMS] Total conversations after grouping:",
    conversations.length,
  );
  conversations.forEach((conv, i) => {
    console.log(
      `[SMS] Conv ${i + 1}: phone=${conv.phoneNumber}, contact=${conv.contactName}, msgCount=${conv.messages.length}, lastMsg="${(conv.lastMessage.body || conv.lastMessage.text || "").substring(0, 20)}...", timestamp=${conv.lastMessage.timestamp}`,
    );
  });
  console.log("[SMS] ===== RENDER SMS END =====");
  console.log("=".repeat(60));

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
          conv.lastMessage.timestamp,
        )}</span>
        ${
          conv.unreadCount > 0
            ? `<div class="list-item-badge">${conv.unreadCount}</div>`
            : ""
        }
      </div>
    </div>
  `,
    )
    .join("");

  // Add click handlers using event delegation
  const oldSmsList = document.getElementById("smsList");
  if (oldSmsList) {
    const newSmsList = oldSmsList.cloneNode(true);
    oldSmsList.parentNode.replaceChild(newSmsList, oldSmsList);
  }

  document.getElementById("smsList")?.addEventListener("click", (e) => {
    const conversation = e.target.closest(".sms-conversation");
    if (conversation) {
      const phoneNumber = conversation.dataset.phone;
      showConversation(phoneNumber);
    }
  });

  // Infinite scroll - load more when near bottom
  const smsContainer = document.getElementById("smsList");
  if (smsContainer) {
    smsContainer.addEventListener("scroll", () => {
      const { scrollTop, scrollHeight, clientHeight } = smsContainer;
      // Load more when user is within 100px of the bottom
      if (
        scrollHeight - scrollTop - clientHeight < 100 &&
        hasMoreSMS() &&
        !isLoadingMore
      ) {
        console.log("[SMS] 📜 Infinite scroll triggered - loading more...");
        // Show loading indicator
        const loader = document.createElement("div");
        loader.className = "scroll-loader";
        loader.id = "smsScrollLoader";
        loader.innerHTML = '<div class="spinner-small"></div> Loading more...';
        if (!document.getElementById("smsScrollLoader")) {
          smsContainer.appendChild(loader);
        }
        loadMoreSMS().then(() => {
          document.getElementById("smsScrollLoader")?.remove();
        });
      }
    });
  }

  updateTabBadges();
}

/**
 * Show conversation detail view
 * @param {string} phoneNumber - Phone number or contact key
 */
export function showConversation(phoneNumber) {
  // Use same normalization as grouping for consistent matching
  const normalizedInput = phoneNumber.startsWith("contact_")
    ? phoneNumber
    : normalizePhoneNumber(phoneNumber);

  console.log(
    `[SMS] showConversation: input="${phoneNumber}", normalized="${normalizedInput}"`,
  );

  let conversation = state.allSMSMessages
    .filter((msg) => {
      const rawPhone = msg.phoneNumber || msg.sender || "";
      const msgNormalized = normalizePhoneNumber(rawPhone);

      // Also check for contact_* keys
      const contactKey =
        msg.contactName || msg.title
          ? "contact_" + (msg.contactName || msg.title).trim()
          : "";

      const matches =
        msgNormalized === normalizedInput || contactKey === normalizedInput;
      return matches;
    })
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  console.log(`[SMS] showConversation: found ${conversation.length} messages`);

  // إزالة التكرار في المحادثة
  const uniqueConversation = [];
  const seenIds = new Set();
  for (const msg of conversation) {
    if (!seenIds.has(msg.id)) {
      seenIds.add(msg.id);
      uniqueConversation.push(msg);
    }
  }
  conversation = uniqueConversation;

  if (conversation.length === 0) {
    return;
  }

  markConversationAsRead(conversation);

  const contactName =
    conversation[0].contactName || conversation[0].title || phoneNumber;
  state.setCurrentConversation(phoneNumber);

  const smsListElement = document.getElementById("smsList");
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
        `,
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
  `;

  // Scroll to bottom
  const messagesContainer = document.querySelector(".conversation-messages");
  if (messagesContainer) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Infinite scroll - load older messages when scrolling to top
    messagesContainer.addEventListener("scroll", () => {
      if (messagesContainer.scrollTop < 50 && hasMoreSMS() && !isLoadingMore) {
        console.log(
          "[SMS] 📜 Conversation scroll-up triggered - loading more...",
        );
        const previousHeight = messagesContainer.scrollHeight;

        // Show loading at top
        const loader = document.createElement("div");
        loader.className = "scroll-loader";
        loader.id = "convScrollLoader";
        loader.innerHTML =
          '<div class="spinner-small"></div> Loading older messages...';
        if (!document.getElementById("convScrollLoader")) {
          messagesContainer.prepend(loader);
        }

        loadMoreSMS().then(() => {
          document.getElementById("convScrollLoader")?.remove();
          // After loading, re-render the conversation with new messages
          if (
            hasMoreSMS() ||
            state.allSMSMessages.length > conversation.length
          ) {
            // Preserve scroll position after new messages are prepended
            const newHeight = messagesContainer.scrollHeight;
            messagesContainer.scrollTop = newHeight - previousHeight;
          }
        });
      }
    });
  }

  // Add back button handler
  document.getElementById("backToSMS")?.addEventListener("click", () => {
    state.setCurrentConversation(null);
    renderSMS(state.allSMSMessages);
  });

  // Add send message handler
  const sendBtn = document.getElementById("sendConversationSms");
  const messageInput = document.getElementById("conversationMessageInput");

  sendBtn?.addEventListener("click", () =>
    sendConversationMessage(phoneNumber, messageInput),
  );
  messageInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendConversationMessage(phoneNumber, messageInput);
  });

  // Add delete message handlers
  document.querySelectorAll(".delete-msg-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const msgId = btn.dataset.id;
      if (confirm("Delete this message?")) {
        deleteSingleSms(msgId);
      }
    });
  });
}

/**
 * Send SMS message from conversation view
 * @param {string} phoneNumber - Phone number to send to
 * @param {HTMLInputElement} inputElement - Input element
 */
async function sendConversationMessage(phoneNumber, inputElement) {
  const message = inputElement.value.trim();
  if (!message) return;

  const user = state.currentUser;

  const devicesQuery = query(
    collection(db, "devices"),
    where("userId", "==", user.uid),
  );
  const devicesSnapshot = await getDocs(devicesQuery);

  const androidDevices = devicesSnapshot.docs
    .filter((doc) => !doc.data().id.startsWith("ext_"))
    .sort((a, b) => (b.data().lastSeen || 0) - (a.data().lastSeen || 0));

  if (androidDevices.length === 0) {
    showToast("No Android device available to send SMS", "error");
    return;
  }

  const deviceId = androidDevices[0].data().id;
  const deviceName =
    androidDevices[0].data().nickname ||
    androidDevices[0].data().name ||
    "Android";

  try {
    const timestamp = Date.now();
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
    });

    const newSmsMessage = {
      id: docRef.id,
      phoneNumber: phoneNumber,
      body: message,
      type: "sent",
      direction: "outgoing",
      timestamp: timestamp,
      read: true,
      deviceName: deviceName,
    };

    const updatedMessages = [...state.allSMSMessages, newSmsMessage];
    state.setAllSMSMessages(updatedMessages);

    if (state.currentConversation === phoneNumber) {
      showConversation(phoneNumber);
    }

    inputElement.value = "";
    showToast("SMS sent!", "success");
  } catch (error) {
    console.error("SMS send error:", error);
    showToast("Failed to send SMS", "error");
  }
}

/**
 * Mark all SMS as read
 */
export async function markAllSmsAsRead() {
  const user = state.currentUser;
  if (!user || state.allSMSMessages.length === 0) return;

  showLoadingOverlay();
  try {
    const batch = writeBatch(db);
    let count = 0;

    for (const msg of state.allSMSMessages) {
      if (!msg.read && msg.docRef) {
        batch.update(msg.docRef, { read: true });
        count++;
      }
    }

    if (count > 0) {
      await batch.commit();
      showToast(`${count} messages marked as read`, "success");
      const updatedMessages = state.allSMSMessages.map((msg) => ({
        ...msg,
        read: true,
      }));
      state.setAllSMSMessages(updatedMessages);

      if (state.currentConversation) {
        showConversation(state.currentConversation);
      } else {
        renderSMS(updatedMessages);
      }
    } else {
      showToast("No unread messages", "info");
    }
  } catch (error) {
    console.error("Mark all read error:", error);
    showToast("Failed to mark as read", "error");
  }
  hideLoading();
}

/**
 * Mark conversation messages as read
 * @param {Array} conversation - Array of messages in conversation
 */
async function markConversationAsRead(conversation) {
  const user = state.currentUser;
  if (!user) return;

  try {
    const batch = writeBatch(db);
    let count = 0;

    for (const msg of conversation) {
      if (!msg.read && msg.docRef) {
        batch.update(msg.docRef, { read: true });
        count++;
      }
    }

    if (count > 0) {
      await batch.commit();
      const msgIds = conversation.map((m) => m.id);
      const updatedMessages = state.allSMSMessages.map((msg) =>
        msgIds.includes(msg.id) ? { ...msg, read: true } : msg,
      );
      state.setAllSMSMessages(updatedMessages);

      // Update allSMS state
      Object.keys(state.allSMS).forEach((deviceId) => {
        const updated = state.allSMS[deviceId].map((msg) =>
          msgIds.includes(msg.id) ? { ...msg, read: true } : msg,
        );
        state.setSMSData(deviceId, updated);
      });

      updateTabBadges();
    }
  } catch (error) {
    console.error("Mark conversation read error:", error);
  }
}

/**
 * Delete all SMS
 */
export async function deleteAllSms() {
  const user = state.currentUser;
  if (!user || state.allSMSMessages.length === 0) {
    showToast("No messages to delete", "info");
    return;
  }

  if (
    !confirm(
      `Are you sure you want to delete all ${state.allSMSMessages.length} messages?`,
    )
  ) {
    return;
  }

  showLoadingOverlay();
  try {
    const batch = writeBatch(db);
    let count = 0;

    for (const msg of state.allSMSMessages) {
      if (msg.docRef) {
        batch.delete(msg.docRef);
        count++;
      }
    }

    if (count > 0) {
      await batch.commit();
      showToast(`${count} messages deleted`, "success");
      state.setAllSMSMessages([]);
      state.clearAllSMS();
      state.setCurrentConversation(null);
      renderSMS([]);
    }
  } catch (error) {
    console.error("Delete all error:", error);
    showToast("Failed to delete messages", "error");
  }
  hideLoading();
}

/**
 * Delete single SMS
 * @param {string} msgId - Message ID to delete
 */
async function deleteSingleSms(msgId) {
  const user = state.currentUser;
  if (!user) return;

  const msg = state.allSMSMessages.find((m) => m.id === msgId);
  if (!msg || !msg.docRef) {
    showToast("Message not found", "error");
    return;
  }

  try {
    await deleteDoc(msg.docRef);
    showToast("Message deleted", "success");

    const updatedMessages = state.allSMSMessages.filter((m) => m.id !== msgId);
    state.setAllSMSMessages(updatedMessages);

    if (state.currentConversation) {
      const remaining = updatedMessages.filter((m) => {
        const msgPhone = (m.phoneNumber || m.sender || "")
          .replace(/[\s\-\(\)\.]/g, "")
          .trim();
        const contactKey =
          m.contactName || m.title
            ? "contact_" + (m.contactName || m.title).trim()
            : "";
        return (
          msgPhone === state.currentConversation ||
          contactKey === state.currentConversation
        );
      });

      if (remaining.length === 0) {
        state.setCurrentConversation(null);
        renderSMS(updatedMessages);
      } else {
        showConversation(state.currentConversation);
      }
    } else {
      renderSMS(updatedMessages);
    }
  } catch (error) {
    console.error("Delete SMS error:", error);
    showToast("Failed to delete message", "error");
  }
}

/**
 * Start polling for new SMS
 */
export function startPolling() {
  state.clearPollingInterval();
  const interval = setInterval(() => {
    loadSMS();
  }, 5000);
  state.setPollingInterval(interval);
}

/**
 * Stop polling
 */
export function stopPolling() {
  state.clearPollingInterval();
}
