// Firebase SDK imports (using npm package)
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  collectionGroup,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
const storage = getStorage(app);

// DOM Elements
const authContainer = document.getElementById('authContainer');
const mainContainer = document.getElementById('mainContainer');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loadingOverlay = document.getElementById('loadingOverlay');
const toastContainer = document.getElementById('toastContainer');

// Auth elements
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const showSignup = document.getElementById('showSignup');
const signupName = document.getElementById('signupName');
const signupEmail = document.getElementById('signupEmail');
const signupPassword = document.getElementById('signupPassword');
const signupBtn = document.getElementById('signupBtn');
const googleSignupBtn = document.getElementById('googleSignupBtn');
const showLogin = document.getElementById('showLogin');
const logoutBtn = document.getElementById('logoutBtn');

// User info elements
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');

// Tabs
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// SMS Modal
const smsModal = document.getElementById('smsModal');
const newSmsBtn = document.getElementById('newSmsBtn');
const closeSmsModal = document.getElementById('closeSmsModal');
const cancelSmsBtn = document.getElementById('cancelSmsBtn');
const sendSmsBtn = document.getElementById('sendSmsBtn');
const smsDevice = document.getElementById('smsDevice');
const smsPhone = document.getElementById('smsPhone');
const smsMessage = document.getElementById('smsMessage');
const charCount = document.getElementById('charCount');

// Chat elements
const chatDeviceSelect = document.getElementById('chatDeviceSelect');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');
const chatMessages = document.getElementById('chatMessages');

// Lists
const smsList = document.getElementById('smsList');
const callsList = document.getElementById('callsList');
const devicesList = document.getElementById('devicesList');
const notificationsList = document.getElementById('notificationsList');

// State
let currentUser = null;
let devices = [];
let unsubscribers = [];

// Utility functions
function showLoading() {
  loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
  loadingOverlay.classList.add('hidden');
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

  return date.toLocaleDateString();
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Auth State Observer
onAuthStateChanged(auth, async user => {
  hideLoading();

  if (user) {
    currentUser = user;
    console.log('Logged in as:', user.uid, user.email);
    showMainUI();
    await registerDevice();
    loadData();
  } else {
    currentUser = null;
    showAuthUI();
    cleanupSubscriptions();
  }
});

function showAuthUI() {
  authContainer.classList.remove('hidden');
  mainContainer.classList.add('hidden');
}

function showMainUI() {
  authContainer.classList.add('hidden');
  mainContainer.classList.remove('hidden');

  // Update user info
  userAvatar.src =
    currentUser.photoURL ||
    'https://ui-avatars.com/api/?name=' +
      encodeURIComponent(currentUser.displayName || 'U');
  userName.textContent = currentUser.displayName || 'User';
  userEmail.textContent = currentUser.email;
}

// Auth handlers
showSignup.addEventListener('click', e => {
  e.preventDefault();
  loginForm.classList.add('hidden');
  signupForm.classList.remove('hidden');
});

showLogin.addEventListener('click', e => {
  e.preventDefault();
  signupForm.classList.add('hidden');
  loginForm.classList.remove('hidden');
});

loginBtn.addEventListener('click', async () => {
  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  if (!email || !password) {
    showToast('Please fill in all fields', 'error');
    return;
  }

  showLoading();
  try {
    await signInWithEmailAndPassword(auth, email, password);
    showToast('Signed in successfully', 'success');
  } catch (error) {
    showToast(error.message, 'error');
    hideLoading();
  }
});

signupBtn.addEventListener('click', async () => {
  const name = signupName.value.trim();
  const email = signupEmail.value.trim();
  const password = signupPassword.value;

  if (!name || !email || !password) {
    showToast('Please fill in all fields', 'error');
    return;
  }

  showLoading();
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });

    // Create user document
    await setDoc(doc(db, 'users', result.user.uid), {
      uid: result.user.uid,
      email: email,
      displayName: name,
      photoURL: null,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    });

    showToast('Account created successfully', 'success');
  } catch (error) {
    showToast(error.message, 'error');
    hideLoading();
  }
});

// Google Sign In
async function handleGoogleSignIn() {
  showLoading();
  try {
    // Use Chrome Identity API for Google Sign In
    const token = await new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, token => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(token);
        }
      });
    });

    const credential = GoogleAuthProvider.credential(null, token);
    const result = await signInWithCredential(auth, credential);

    // Check if user document exists
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      });
    }

    showToast('Signed in with Google', 'success');
  } catch (error) {
    showToast(error.message, 'error');
    hideLoading();
  }
}

googleLoginBtn.addEventListener('click', handleGoogleSignIn);
googleSignupBtn.addEventListener('click', handleGoogleSignIn);

logoutBtn.addEventListener('click', async () => {
  try {
    // Revoke Google token
    chrome.identity.getAuthToken({ interactive: false }, token => {
      if (token) {
        chrome.identity.removeCachedAuthToken({ token });
      }
    });

    await signOut(auth);
    showToast('Signed out', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
});

// Register this extension as a device
async function registerDevice() {
  if (!currentUser) return;

  const deviceId = await getDeviceId();

  await setDoc(
    doc(db, 'devices', deviceId),
    {
      id: deviceId,
      userId: currentUser.uid,
      name: 'Chrome Extension',
      type: 'chrome-extension',
      platform: 'chrome',
      model: navigator.userAgent,
      lastActiveAt: Date.now(),
      isOnline: true,
    },
    { merge: true },
  );
}

async function getDeviceId() {
  return new Promise(resolve => {
    chrome.storage.local.get(['deviceId'], result => {
      if (result.deviceId) {
        resolve(result.deviceId);
      } else {
        const newId = 'ext_' + Math.random().toString(36).substr(2, 9);
        chrome.storage.local.set({ deviceId: newId });
        resolve(newId);
      }
    });
  });
}

// Tab switching
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.dataset.tab;

    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    tabContents.forEach(content => {
      content.classList.remove('active');
    });

    document.getElementById(`${tabName}Tab`).classList.add('active');
  });
});

// Load data
function loadData() {
  loadDevices();
  loadSMS();
  loadCalls();
  loadNotifications();
  subscribeToChat();
}

function cleanupSubscriptions() {
  unsubscribers.forEach(unsub => unsub());
  unsubscribers = [];
}

// Load devices
async function loadDevices() {
  if (!currentUser) return;

  const q = query(
    collection(db, 'devices'),
    where('userId', '==', currentUser.uid),
  );

  const unsub = onSnapshot(q, snapshot => {
      console.log('Devices found:', snapshot.size);
      devices = [];
    snapshot.forEach(doc => {
      devices.push(doc.data());
    });

    renderDevices();
    updateDeviceSelects();
  });

  unsubscribers.push(unsub);
}

function renderDevices() {
  if (devices.length === 0) {
    devicesList.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
        </svg>
        <p>No devices connected</p>
        <span>Install ZyncIT on your phone to get started</span>
      </div>
    `;
    return;
  }

  devicesList.innerHTML = devices
    .map(
      device => `
    <div class="list-item ${device.isOnline ? 'device-online' : ''}">
      <div class="list-item-icon">
        ${
          device.type === 'mobile'
            ? `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
          </svg>
        `
            : `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        `
        }
      </div>
      <div class="list-item-content">
        <div class="list-item-title">${device.name}</div>
        <div class="list-item-subtitle">${device.platform} • ${
        device.isOnline ? 'Online' : 'Offline'
      }</div>
      </div>
      <span class="list-item-time">${formatTime(device.lastActiveAt)}</span>
    </div>
  `,
    )
    .join('');
}

function updateDeviceSelects() {
  const mobileDevices = devices.filter(d => d.type === 'mobile');
  const options = mobileDevices
    .map(d => `<option value="${d.id}">${d.name}</option>`)
    .join('');

  smsDevice.innerHTML = '<option value="">Select device...</option>' + options;
  chatDeviceSelect.innerHTML =
    '<option value="">All devices</option>' + options;
}

// Load SMS using collectionGroup
async function loadSMS() {
  if (!currentUser) return;
  console.log('Loading SMS for user:', currentUser.uid);

  const q = query(
    collection(db, 'sms'),
    where('userId', '==', currentUser.uid),
    orderBy('timestamp', 'desc'),
    limit(50),
  );

  const unsub = onSnapshot(q, snapshot => {
    console.log('SMS found:', snapshot.size);
    const messages = [];
    snapshot.forEach(doc => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    renderSMS(messages);
  }, error => {
    console.error('SMS Error:', error);
  });

  unsubscribers.push(unsub);
}

// Load Notifications from Firebase (from all devices)
async function loadNotifications() {
  if (!currentUser) return;

  // First, get all user devices
  const devicesQuery = query(
    collection(db, 'devices'),
    where('userId', '==', currentUser.uid),
  );

  const devicesSnapshot = await getDocs(devicesQuery);
  const deviceIds = [];
  devicesSnapshot.forEach(doc => {
    deviceIds.push(doc.data().id);
  });

  // Subscribe to notifications from each device
  deviceIds.forEach(deviceId => {
    const q = query(
      collection(
        db,
        'users',
        currentUser.uid,
        'devices',
        deviceId,
        'notifications',
      ),
      orderBy('receivedAt', 'desc'),
      limit(50),
    );

    const unsub = onSnapshot(q, snapshot => {
      const notifications = [];
      snapshot.forEach(doc => {
        notifications.push({ id: doc.id, deviceId: deviceId, ...doc.data() });
      });

      // Update notifications list (merge with existing)
      updateNotificationsList(deviceId, notifications);
    });

    unsubscribers.push(unsub);
  });
}

let allNotifications = {};

function updateNotificationsList(deviceId, newNotifications) {
  // Store notifications by device
  allNotifications[deviceId] = newNotifications;

  // Merge all notifications from all devices
  let merged = [];
  Object.values(allNotifications).forEach(notifs => {
    merged = merged.concat(notifs);
  });

  // Sort by receivedAt descending
  merged.sort((a, b) => (b.receivedAt || 0) - (a.receivedAt || 0));

  renderNotifications(merged.slice(0, 100));
}

function getNotificationIcon(type, appName) {
  // Check by app name
  const appLower = (appName || '').toLowerCase();
  if (appLower.includes('whatsapp')) return '📱';
  if (appLower.includes('telegram')) return '✈️';
  if (appLower.includes('messenger')) return '💬';
  if (appLower.includes('mail') || appLower.includes('gmail')) return '📧';
  if (appLower.includes('phone') || appLower.includes('call')) return '📞';
  if (appLower.includes('message') || appLower.includes('sms')) return '💬';
  if (appLower.includes('calendar')) return '📅';

  // Check by type
  if (type === 'sms') return '💬';
  if (type === 'call') return '📞';
  if (type === 'whatsapp') return '📱';
  if (type === 'telegram') return '✈️';

  return '🔔';
}

function renderNotifications(notifications) {
  if (notifications.length === 0) {
    notificationsList.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        <p>No notifications yet</p>
        <span>Notifications from your phone will appear here</span>
      </div>
    `;
    return;
  }

  notificationsList.innerHTML = notifications
    .map(
      notif => `
    <div class="list-item notification-item notification-${
      notif.type || 'other'
    }">
      <div class="list-item-icon notification-icon">
        ${getNotificationIcon(notif.type, notif.appName)}
      </div>
      <div class="list-item-content">
        <div class="list-item-title">${
          notif.title || notif.appName || 'Notification'
        }</div>
        <div class="list-item-subtitle">${notif.text || ''}</div>
        <div class="notification-app">${notif.appName || 'Unknown App'}</div>
      </div>
      <span class="list-item-time">${formatTime(
        notif.receivedAt || notif.timestamp,
      )}</span>
    </div>
  `,
    )
    .join('');
}

function renderSMS(messages) {
  if (messages.length === 0) {
    smsList.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        <p>No messages yet</p>
        <span>Messages from your phone will appear here</span>
      </div>
    `;
    return;
  }

  smsList.innerHTML = messages
    .map(
      msg => `
    <div class="list-item">
      <div class="list-item-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
      </div>
      <div class="list-item-content">
        <div class="list-item-title">${msg.contactName || msg.phoneNumber}</div>
        <div class="list-item-subtitle">${msg.body}</div>
      </div>
      <span class="list-item-time">${formatTime(msg.timestamp)}</span>
      ${!msg.read ? '<div class="list-item-badge"></div>' : ''}
    </div>
  `,
    )
    .join('');
}

// Load Calls using collectionGroup
async function loadCalls() {
  if (!currentUser) return;
  console.log('Loading calls for user:', currentUser.uid);

  const q = query(
    collection(db, 'calls'),
    where('userId', '==', currentUser.uid),
    orderBy('timestamp', 'desc'),
    limit(50),
  );

  const unsub = onSnapshot(q, snapshot => {
    console.log('Calls found:', snapshot.size);
    const calls = [];
    snapshot.forEach(doc => {
      calls.push({ id: doc.id, ...doc.data() });
    });
    renderCalls(calls);
  }, error => {
    console.error('Calls Error:', error);
  });

  unsubscribers.push(unsub);
}

function renderCalls(calls) {
  if (calls.length === 0) {
    callsList.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
        </svg>
        <p>No calls yet</p>
        <span>Call history from your phone will appear here</span>
      </div>
    `;
    return;
  }

  callsList.innerHTML = calls
    .map(
      call => `
    <div class="list-item call-${call.type}">
      <div class="list-item-icon">
        ${
          call.type === 'incoming'
            ? `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>
          </svg>
        `
            : call.type === 'outgoing'
            ? `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
          </svg>
        `
            : `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="1" y1="1" x2="23" y2="23"/><path d="M16.5 13.2a12 12 0 00.8-1.3 1 1 0 00-.3-1.3l-2.1-1.5a1 1 0 00-1.2 0L12 10.5a12.2 12.2 0 01-2.5-2.5l1.4-1.7a1 1 0 000-1.2L9.4 3a1 1 0 00-1.3-.3A12 12 0 006.8 3.5"/>
          </svg>
        `
        }
      </div>
      <div class="list-item-content">
        <div class="list-item-title">${
          call.contactName || call.phoneNumber
        }</div>
        <div class="list-item-subtitle">${call.type} • ${formatDuration(
        call.duration,
      )}</div>
      </div>
      <span class="list-item-time">${formatTime(call.timestamp)}</span>
    </div>
  `,
    )
    .join('');
}

// Chat
function subscribeToChat() {
  if (!currentUser) return;

  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', currentUser.uid),
    orderBy('timestamp', 'desc'),
    limit(50),
  );

  const unsub = onSnapshot(q, snapshot => {
    const messages = [];
    snapshot.forEach(doc => {
      messages.push({ id: doc.id, ...doc.data() });
    });

    renderChatMessages(messages.reverse());
  });

  unsubscribers.push(unsub);
}

function renderChatMessages(messages) {
  if (messages.length === 0) {
    chatMessages.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
        </svg>
        <p>Start a conversation</p>
        <span>Chat with your other devices</span>
      </div>
    `;
    return;
  }

  chatMessages.innerHTML = messages
    .map(msg => {
      let content = '';

      // Image
      if (msg.type === 'image' && msg.fileUrl) {
        content = `
          <a href="${msg.fileUrl}" target="_blank" class="chat-image-link">
            <img src="${msg.fileUrl}" alt="Image" class="chat-image" />
          </a>
        `;
      }
      // File
      else if (msg.type === 'file' && msg.fileUrl) {
        content = `
          <a href="${msg.fileUrl}" target="_blank" class="chat-file-link">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span>${msg.fileName || 'File'}</span>
          </a>
        `;
      }
      // Text
      else {
        content = `<div>${msg.content}</div>`;
      }

      return `
        <div class="chat-message ${
          msg.senderId === currentUser.uid ? 'sent' : 'received'
        }">
          ${content}
          <div class="chat-message-time">${formatTime(msg.timestamp)}</div>
        </div>
      `;
    })
    .join('');

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

sendChatBtn.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') sendChatMessage();
});

// Upload file to Firebase Storage
async function uploadFileToStorage(file) {
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `chat_files/${currentUser.uid}/${timestamp}_${sanitizedName}`;

  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(storageRef);

  return {
    url: downloadUrl,
    fileName: file.name,
    fileType: file.type.startsWith('image/') ? 'image' : 'file',
  };
}

// Send file in chat
async function sendFileMessage(file) {
  if (!file || !currentUser) return;

  showLoading();

  try {
    const result = await uploadFileToStorage(file);
    const deviceId = await getDeviceId();

    await addDoc(collection(db, 'chats'), {
      senderId: currentUser.uid,
      senderDeviceId: deviceId,
      receiverId: currentUser.uid,
      receiverDeviceId: chatDeviceSelect.value || null,
      content:
        result.fileType === 'image' ? '📷 Image' : `📎 ${result.fileName}`,
      type: result.fileType,
      fileUrl: result.url,
      fileName: result.fileName,
      read: false,
      timestamp: Date.now(),
      participants: [currentUser.uid],
    });

    showToast(
      `${result.fileType === 'image' ? 'Image' : 'File'} sent!`,
      'success',
    );
  } catch (error) {
    showToast('Failed to send file', 'error');
    console.error(error);
  }

  hideLoading();
}

// Add file attachment button handler
document.getElementById('attachFileBtn')?.addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '*/*';
  input.onchange = e => {
    const file = e.target.files?.[0];
    if (file) sendFileMessage(file);
  };
  input.click();
});

// Add image attachment button handler
document.getElementById('attachImageBtn')?.addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = e => {
    const file = e.target.files?.[0];
    if (file) sendFileMessage(file);
  };
  input.click();
});

async function sendChatMessage() {
  const content = chatInput.value.trim();
  if (!content || !currentUser) return;

  const deviceId = await getDeviceId();

  try {
    await addDoc(collection(db, 'chats'), {
      senderId: currentUser.uid,
      senderDeviceId: deviceId,
      receiverId: currentUser.uid,
      receiverDeviceId: chatDeviceSelect.value || null,
      content: content,
      type: 'text',
      read: false,
      timestamp: Date.now(),
      participants: [currentUser.uid],
    });

    chatInput.value = '';
  } catch (error) {
    showToast('Failed to send message', 'error');
  }
}

// SMS Modal
newSmsBtn.addEventListener('click', () => {
  smsModal.classList.remove('hidden');
});

closeSmsModal.addEventListener('click', () => {
  smsModal.classList.add('hidden');
});

cancelSmsBtn.addEventListener('click', () => {
  smsModal.classList.add('hidden');
});

smsMessage.addEventListener('input', () => {
  charCount.textContent = smsMessage.value.length;
});

sendSmsBtn.addEventListener('click', async () => {
  const deviceId = smsDevice.value;
  const phone = smsPhone.value.trim();
  const message = smsMessage.value.trim();

  if (!deviceId) {
    showToast('Please select a device', 'error');
    return;
  }

  if (!phone) {
    showToast('Please enter a phone number', 'error');
    return;
  }

  if (!message) {
    showToast('Please enter a message', 'error');
    return;
  }

  showLoading();

  try {
    // Create SMS request for the mobile device to process
    await addDoc(collection(db, 'sms_requests'), {
      userId: currentUser.uid,
      fromDeviceId: await getDeviceId(),
      toDeviceId: deviceId,
      phoneNumber: phone,
      message: message,
      status: 'pending',
      timestamp: Date.now(),
    });

    showToast('SMS request sent to device', 'success');
    smsModal.classList.add('hidden');
    smsPhone.value = '';
    smsMessage.value = '';
    charCount.textContent = '0';
  } catch (error) {
    showToast('Failed to send SMS request', 'error');
  }

  hideLoading();
});

// Refresh
document.getElementById('refreshBtn').addEventListener('click', () => {
  showToast('Refreshing...', 'info');
  loadData();
});

// Password Toggle
document.querySelectorAll('.toggle-password').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.target;
    const input = document.getElementById(targetId);
    const eyeOpen = btn.querySelector('.eye-open');
    const eyeClosed = btn.querySelector('.eye-closed');
    if (input.type === 'password') {
      input.type = 'text';
      eyeOpen.classList.add('hidden');
      eyeClosed.classList.remove('hidden');
    } else {
      input.type = 'password';
      eyeOpen.classList.remove('hidden');
      eyeClosed.classList.add('hidden');
    }
  });
});

// Initial load
showLoading();showLoading();
