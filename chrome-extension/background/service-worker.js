// ZyncIT Background Service Worker
// Handles notifications, real-time sync, and background tasks

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithCredential,
  GoogleAuthProvider,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase config - from google-services.json
const firebaseConfig = {
  apiKey: 'AIzaSyCMqENmothJXy6XrP7214d0c6ILsOdqtcs',
  authDomain: 'zyncit-f1ced.firebaseapp.com',
  projectId: 'zyncit-f1ced',
  storageBucket: 'zyncit-f1ced.firebasestorage.app',
  messagingSenderId: '772958487002',
  appId: '1:772958487002:web:c2dcb8043d3bfed2ec40e3',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let currentDeviceId = null;
let lastNotificationTimestamp = Date.now();
let unsubscribeNotifications = null;

// Listen for auth state changes
onAuthStateChanged(auth, async user => {
  console.log('ZyncIT: Auth state changed:', user ? user.uid : 'no user');
  if (user) {
    currentUser = user;
    await loadDeviceId();
    startListening();
  } else {
    currentUser = null;
    currentDeviceId = null;
    if (unsubscribeNotifications) {
      unsubscribeNotifications();
      unsubscribeNotifications = null;
    }
  }
});

// Load device ID from storage
async function loadDeviceId() {
  return new Promise(resolve => {
    chrome.storage.local.get(['deviceId'], result => {
      currentDeviceId = result.deviceId;
      console.log('ZyncIT: Loaded deviceId:', currentDeviceId);
      resolve(currentDeviceId);
    });
  });
}

// Start listening for new notifications
function startListening() {
  if (!currentUser || !currentDeviceId) {
    console.log('ZyncIT: Cannot start listening - no user or deviceId');
    return;
  }

  console.log('ZyncIT: Starting to listen for notifications');
  console.log(
    'ZyncIT: Path: users/' +
      currentUser.uid +
      '/devices/' +
      currentDeviceId +
      '/notifications',
  );

  // Stop previous listener
  if (unsubscribeNotifications) {
    unsubscribeNotifications();
  }

  // Listen for new notifications from the device
  // Path: users/{userId}/devices/{deviceId}/notifications
  const notificationsQuery = query(
    collection(
      db,
      'users',
      currentUser.uid,
      'devices',
      currentDeviceId,
      'notifications',
    ),
    orderBy('receivedAt', 'desc'),
    limit(10),
  );

  unsubscribeNotifications = onSnapshot(
    notificationsQuery,
    snapshot => {
      console.log(
        'ZyncIT: Snapshot received, changes:',
        snapshot.docChanges().length,
      );
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const notification = change.doc.data();
          const receivedAt = notification.receivedAt || Date.now();

          console.log(
            'ZyncIT: New notification:',
            notification.type,
            notification.title,
          );

          // Only show notifications newer than when we started listening
          if (receivedAt > lastNotificationTimestamp) {
            showNotification(notification);
            lastNotificationTimestamp = receivedAt;
          }
        }
      });
    },
    error => {
      console.error('ZyncIT: Firestore listener error:', error);
    },
  );
}

// Also listen for calls (separate collection)
function listenForCalls() {
  if (!currentUser || !currentDeviceId) return;

  const callsQuery = query(
    collection(
      db,
      'users',
      currentUser.uid,
      'devices',
      currentDeviceId,
      'calls',
    ),
    orderBy('timestamp', 'desc'),
    limit(5),
  );

  onSnapshot(callsQuery, snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        const call = change.doc.data();
        if (call.timestamp > lastNotificationTimestamp) {
          showCallNotification(call);
        }
      }
    });
  });
}

// Show Chrome notification
function showNotification(data) {
  const title = data.title || 'New Notification';
  const message = data.content || data.text || '';
  const iconUrl = 'assets/icon128.png';

  console.log('ZyncIT: Showing notification:', title, message);

  chrome.notifications.create({
    type: 'basic',
    iconUrl: iconUrl,
    title: title,
    message: message,
    priority: 2,
  });
}

function showCallNotification(call) {
  const title =
    call.type === 'missed'
      ? 'Missed call from ' + (call.contactName || call.phoneNumber)
      : 'Call from ' + (call.contactName || call.phoneNumber);
  const message = 'Duration: ' + formatDuration(call.duration || 0);

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'assets/icon128.png',
    title: title,
    message: message,
    priority: 2,
  });
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins + ':' + secs.toString().padStart(2, '0');
}

// Handle notification clicks
chrome.notifications.onClicked.addListener(notificationId => {
  chrome.action.openPopup();
});

// Keep service worker alive
chrome.alarms.create('keepAlive', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'keepAlive') {
    console.log('ZyncIT: Heartbeat');
  }
});

// Handle extension install/update
chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === 'install') {
    console.log('ZyncIT extension installed');
  } else if (details.reason === 'update') {
    console.log('ZyncIT extension updated');
  }
});

// Message handler from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('ZyncIT: Message received:', message);

  if (message.type === 'setDeviceId') {
    currentDeviceId = message.deviceId;
    chrome.storage.local.set({ deviceId: message.deviceId });
    console.log('ZyncIT: Device ID set to:', message.deviceId);
    startListening();
    sendResponse({ success: true });
  }

  if (message.type === 'getStatus') {
    sendResponse({
      user: currentUser
        ? { uid: currentUser.uid, email: currentUser.email }
        : null,
      deviceId: currentDeviceId,
      listening: !!unsubscribeNotifications,
    });
  }

  return true;
});

console.log('ZyncIT Background Service Worker started');
