/**
 * Contacts Service
 * Handles fetching contacts from Firebase for each device
 */

import { db, collection, getDocs, query, orderBy } from "../config/firebase.js";
import * as state from "../state/index.js";

/**
 * Load contacts for a specific device from Firebase
 * @param {string} deviceId - The device ID to load contacts for
 * @returns {Promise<Array>} Array of contacts
 */
export async function loadContactsForDevice(deviceId) {
  const user = state.currentUser;
  if (!user || !deviceId) {
    console.log("[Contacts] No user or device ID");
    return [];
  }

  try {
    const contactsRef = collection(
      db,
      "users",
      user.uid,
      "devices",
      deviceId,
      "contacts",
    );

    const q = query(contactsRef, orderBy("name", "asc"));
    const snapshot = await getDocs(q);

    const contacts = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      contacts.push({
        id: doc.id,
        name: data.name || "Unknown",
        phoneNumber: data.phoneNumber || "",
        phoneNumbers: data.phoneNumbers || [data.phoneNumber],
      });
    });

    console.log(
      `[Contacts] Loaded ${contacts.length} contacts for device ${deviceId}`,
    );
    return contacts;
  } catch (error) {
    console.error("[Contacts] Error loading contacts:", error);
    return [];
  }
}

/**
 * Get all contacts for all devices
 * @returns {Promise<Object>} Object with deviceId as key and contacts array as value
 */
export async function loadAllContacts() {
  const user = state.currentUser;
  if (!user) return {};

  const allContacts = {};

  for (const device of state.devices) {
    if (
      device.platform !== "chrome" &&
      device.platform !== "chrome-extension"
    ) {
      const contacts = await loadContactsForDevice(device.id);
      if (contacts.length > 0) {
        allContacts[device.id] = contacts;
      }
    }
  }

  return allContacts;
}

/**
 * Search contacts by name or phone number
 * @param {Array} contacts - Array of contacts to search
 * @param {string} searchTerm - Search term
 * @returns {Array} Filtered contacts
 */
export function searchContacts(contacts, searchTerm) {
  if (!searchTerm || !contacts) return contacts;

  const term = searchTerm.toLowerCase();
  return contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(term) ||
      contact.phoneNumber.includes(term) ||
      (contact.phoneNumbers &&
        contact.phoneNumbers.some((p) => p.includes(term))),
  );
}
