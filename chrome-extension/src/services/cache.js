/**
 * Local Cache Service
 * Caches SMS and Calls data in chrome.storage.local for instant loading
 */

const CACHE_KEYS = {
  SMS: "cached_sms_data",
  CALLS: "cached_calls_data",
  TIMESTAMP: "cache_timestamp",
};

// Max cache age: 24 hours
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Strip non-serializable fields from messages before caching
 * (docRef is a Firestore reference object that can't be serialized)
 */
function stripNonSerializable(items) {
  return items.map((item) => {
    const { docRef, ...rest } = item;
    return rest;
  });
}

/**
 * Save SMS data to local cache
 * @param {Object} smsByDevice - SMS data keyed by deviceId
 * @param {Array} allMessages - All merged/deduped messages
 */
export async function cacheSMSData(smsByDevice, allMessages) {
  try {
    const cacheData = {
      byDevice: {},
      allMessages: stripNonSerializable(allMessages).slice(0, 500),
    };

    for (const [deviceId, msgs] of Object.entries(smsByDevice)) {
      cacheData.byDevice[deviceId] = stripNonSerializable(msgs).slice(0, 500);
    }

    await chrome.storage.local.set({
      [CACHE_KEYS.SMS]: cacheData,
      [CACHE_KEYS.TIMESTAMP]: Date.now(),
    });
    console.log(`[Cache] ✅ Saved ${allMessages.length} SMS messages to cache`);
  } catch (error) {
    console.warn("[Cache] Failed to save SMS cache:", error);
  }
}

/**
 * Save calls data to local cache
 * @param {Object} callsByDevice - Calls data keyed by deviceId
 * @param {Array} allCalls - All merged calls
 */
export async function cacheCallsData(callsByDevice, allCalls) {
  try {
    const cacheData = {
      byDevice: {},
      allCalls: stripNonSerializable(allCalls).slice(0, 500),
    };

    for (const [deviceId, calls] of Object.entries(callsByDevice)) {
      cacheData.byDevice[deviceId] = stripNonSerializable(calls).slice(0, 500);
    }

    await chrome.storage.local.set({
      [CACHE_KEYS.CALLS]: cacheData,
    });
    console.log(`[Cache] ✅ Saved ${allCalls.length} calls to cache`);
  } catch (error) {
    console.warn("[Cache] Failed to save calls cache:", error);
  }
}

/**
 * Load cached SMS data
 * @returns {Object|null} { byDevice, allMessages } or null if no cache
 */
export async function getCachedSMS() {
  try {
    const result = await chrome.storage.local.get([
      CACHE_KEYS.SMS,
      CACHE_KEYS.TIMESTAMP,
    ]);
    const timestamp = result[CACHE_KEYS.TIMESTAMP];
    const data = result[CACHE_KEYS.SMS];

    if (!data || !timestamp) return null;

    // Check if cache is too old
    if (Date.now() - timestamp > MAX_CACHE_AGE_MS) {
      console.log("[Cache] SMS cache expired, clearing...");
      await chrome.storage.local.remove([CACHE_KEYS.SMS]);
      return null;
    }

    console.log(
      `[Cache] 📦 Loaded ${data.allMessages?.length || 0} cached SMS messages`,
    );
    return data;
  } catch (error) {
    console.warn("[Cache] Failed to load SMS cache:", error);
    return null;
  }
}

/**
 * Load cached calls data
 * @returns {Object|null} { byDevice, allCalls } or null if no cache
 */
export async function getCachedCalls() {
  try {
    const result = await chrome.storage.local.get([CACHE_KEYS.CALLS]);
    const data = result[CACHE_KEYS.CALLS];

    if (!data) return null;

    console.log(`[Cache] 📦 Loaded ${data.allCalls?.length || 0} cached calls`);
    return data;
  } catch (error) {
    console.warn("[Cache] Failed to load calls cache:", error);
    return null;
  }
}

/**
 * Clear all cached data
 */
export async function clearCache() {
  try {
    await chrome.storage.local.remove([
      CACHE_KEYS.SMS,
      CACHE_KEYS.CALLS,
      CACHE_KEYS.TIMESTAMP,
    ]);
    console.log("[Cache] 🗑️ Cache cleared");
  } catch (error) {
    console.warn("[Cache] Failed to clear cache:", error);
  }
}
