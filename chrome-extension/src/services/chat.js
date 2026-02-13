/**
 * Chat Service
 * Handles chat messages between devices
 */

import {
  db,
  storage,
  collection,
  addDoc,
  query,
  where,
  limit,
  onSnapshot,
  ref,
  uploadBytes,
  getDownloadURL,
} from "../config/firebase.js";

import { chatMessages, chatInput, sendChatBtn } from "../ui/dom.js";
import { showToast, showLoadingOverlay, hideLoading } from "../ui/toasts.js";
import { formatTime, getDeviceId } from "../utils/helpers.js";
import * as state from "../state/index.js";
import { updateTabBadges } from "./badges.js";
import { encryptChatMessage, decryptChatMessage } from "./cryptoService.js";
// Push notifications are now handled automatically by Cloud Function onNewChatMessage

/**
 * Subscribe to chat messages
 */
export function subscribeToChat() {
  const user = state.currentUser;
  if (!user) return;

  const q = query(
    collection(db, "chats"),
    where("participants", "array-contains", user.uid),
    limit(100),
  );

  const unsub = onSnapshot(q, async (snapshot) => {
    const rawMessages = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      rawMessages.push({ id: doc.id, ...data });
    });

    // Sort by timestamp locally
    rawMessages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    // Decrypt messages
    const messages = await Promise.all(
      rawMessages.map((msg) => decryptChatMessage(msg, user.uid)),
    );

    state.setCachedChatMessages(messages);
    renderChatMessages(messages);
  });

  state.addUnsubscriber(unsub);
}

/**
 * Render chat messages
 * @param {Array} messages - Array of chat messages
 */
export function renderChatMessages(messages) {
  // Check if "All" tab is selected
  const selectedTab =
    document.querySelector(".device-tab.active")?.dataset.device || "all";
  const showDeviceName = selectedTab === "all";

  // Filter messages by selected device
  let filteredMessages = messages;
  if (selectedTab !== "all") {
    filteredMessages = messages.filter((msg) => {
      // Show messages sent TO this device, FROM this device, or broadcast to all devices
      return (
        msg.senderDeviceId === selectedTab ||
        msg.receiverDeviceId === selectedTab ||
        !msg.receiverDeviceId // broadcast messages (sent to "All") should appear in every device tab
      );
    });
  }

  if (filteredMessages.length === 0) {
    chatMessages.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
        </svg>
        <p>Start a conversation</p>
        <span>Chat with your other devices</span>
      </div>
    `;
    updateTabBadges();
    return;
  }

  chatMessages.innerHTML = filteredMessages
    .map((msg) => {
      let content = "";

      // Image
      if (msg.type === "image" && msg.fileUrl) {
        content = `
          <a href="${msg.fileUrl}" target="_blank" class="chat-image-link">
            <img src="${msg.fileUrl}" alt="Image" class="chat-image" />
          </a>
        `;
      }
      // File
      else if (msg.type === "file" && msg.fileUrl) {
        content = `
          <a href="${msg.fileUrl}" target="_blank" class="chat-file-link">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span>${msg.fileName || "File"}</span>
          </a>
        `;
      }
      // Text
      else {
        content = `<div>${msg.content}</div>`;
      }

      // Get device name from devices list
      const senderDevice = state.devices.find(
        (d) => d.id === msg.senderDeviceId,
      );
      const deviceName =
        senderDevice?.nickname ||
        senderDevice?.name ||
        senderDevice?.model ||
        msg.senderPlatform ||
        "";

      // Determine if message is sent from this extension
      const isSentFromExtension =
        msg.senderPlatform === "chrome-extension" ||
        (msg.senderDeviceId && msg.senderDeviceId.startsWith("ext_"));

      return `
        <div class="chat-message ${isSentFromExtension ? "sent" : "received"}" 
             data-msg-id="${msg.id}" 
             data-msg-content="${(msg.content || "").replace(/"/g, "&quot;")}" 
             data-msg-sender="${msg.senderId}">
          ${
            showDeviceName && deviceName
              ? `<div class="chat-message-device">${deviceName}</div>`
              : ""
          }
          ${
            msg.replyTo
              ? `<div class="chat-reply-preview">↩ ${msg.replyTo.content.substring(
                  0,
                  50,
                )}${msg.replyTo.content.length > 50 ? "..." : ""}</div>`
              : ""
          }
          ${content}
          <div class="chat-message-time">${formatTime(msg.timestamp)}</div>
        </div>
      `;
    })
    .join("");

  // Add click listeners for reply
  chatMessages.querySelectorAll(".chat-message").forEach((el) => {
    el.addEventListener("click", () => setReplyTo(el));
  });

  chatMessages.scrollTop = chatMessages.scrollHeight;
  updateTabBadges();
}

/**
 * Send a chat message
 */
export async function sendChatMessage() {
  const content = chatInput.value.trim();
  const user = state.currentUser;
  if (!content || !user) return;

  const deviceId = await getDeviceId();
  const selectedDeviceTab =
    document.querySelector(".device-tab.active")?.dataset.device || "all";

  let messageData = {
    senderId: user.uid,
    senderDeviceId: deviceId,
    senderName: user.displayName || "User",
    senderPlatform: "chrome-extension",
    receiverId: user.uid,
    receiverDeviceId: selectedDeviceTab === "all" ? null : selectedDeviceTab,
    content: content,
    type: "text",
    read: false,
    timestamp: Date.now(),
    participants: [user.uid],
  };

  // Add reply info if replying
  if (state.currentReplyTo) {
    messageData.replyTo = {
      id: state.currentReplyTo.id,
      content: state.currentReplyTo.content,
      senderId: state.currentReplyTo.senderId,
    };
  }

  try {
    // Encrypt message before sending
    messageData = await encryptChatMessage(messageData, user.uid);
    await addDoc(collection(db, "chats"), messageData);
    chatInput.value = "";
    clearReply();

    // Push notification is sent automatically by Cloud Function onNewChatMessage
  } catch (error) {
    console.error("Failed to send message:", error);
    showToast("Failed to send message", "error");
  }
}

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Get file extension
 * @param {string} fileName - File name
 * @returns {string} File extension
 */
function getFileExtension(fileName) {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

// Store pending file for preview
let pendingFile = null;

/**
 * Show file preview modal
 * @param {File} file - File to preview
 */
function showFilePreview(file) {
  pendingFile = file;

  const modal = document.getElementById("filePreviewModal");
  const previewBody = document.getElementById("filePreviewBody");
  const progressContainer = document.getElementById("uploadProgressContainer");
  const sendBtn = document.getElementById("sendFileBtn");

  // Reset progress
  progressContainer.classList.add("hidden");
  document.getElementById("uploadProgressFill").style.width = "0%";
  document.getElementById("uploadProgressText").textContent = "0%";
  sendBtn.disabled = false;
  sendBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="22" y1="2" x2="11" y2="13"></line>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
    Send
  `;

  const isImage = file.type.startsWith("image/");
  const ext = getFileExtension(file.name);

  if (isImage) {
    // Show image preview
    const reader = new FileReader();
    reader.onload = (e) => {
      previewBody.innerHTML = `
        <img src="${e.target.result}" alt="Preview" class="file-preview-image" />
        <div class="file-preview-info">
          <span class="file-preview-name">${file.name}</span>
          <span class="file-preview-size">${formatFileSize(file.size)}</span>
        </div>
      `;
    };
    reader.readAsDataURL(file);
  } else {
    // Show file info
    previewBody.innerHTML = `
      <div class="file-preview-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      </div>
      <div class="file-preview-info">
        <span class="file-preview-name">${file.name}</span>
        <span class="file-preview-size">${formatFileSize(file.size)}</span>
        <span class="file-preview-type">${ext || "FILE"}</span>
      </div>
    `;
  }

  modal.classList.remove("hidden");
}

/**
 * Hide file preview modal
 */
function hideFilePreview() {
  const modal = document.getElementById("filePreviewModal");
  modal.classList.add("hidden");
  pendingFile = null;
}

/**
 * Update upload progress
 * @param {number} progress - Progress percentage (0-100)
 */
function updateUploadProgress(progress) {
  const progressFill = document.getElementById("uploadProgressFill");
  const progressText = document.getElementById("uploadProgressText");
  const progressContainer = document.getElementById("uploadProgressContainer");

  progressContainer.classList.remove("hidden");
  progressFill.style.width = `${progress}%`;
  progressText.textContent = `${Math.round(progress)}%`;
}

/**
 * Upload file to Firebase Storage with progress
 * @param {File} file - File to upload
 * @returns {Promise<Object>} Upload result with url, fileName, fileType
 */
async function uploadFileToStorage(file) {
  const user = state.currentUser;
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const storagePath = `chat_files/${user.uid}/${timestamp}_${sanitizedName}`;

  const storageRef = ref(storage, storagePath);

  // Simulate progress for small files (uploadBytes doesn't support progress)
  const fileSize = file.size;
  const isLargeFile = fileSize > 500 * 1024; // > 500KB

  if (isLargeFile) {
    // Simulate progress updates
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 90) progress = 90;
      updateUploadProgress(progress);
    }, 200);

    await uploadBytes(storageRef, file);
    clearInterval(progressInterval);
    updateUploadProgress(100);
  } else {
    updateUploadProgress(30);
    await uploadBytes(storageRef, file);
    updateUploadProgress(100);
  }

  const downloadUrl = await getDownloadURL(storageRef);

  return {
    url: downloadUrl,
    fileName: file.name,
    fileType: file.type.startsWith("image/") ? "image" : "file",
  };
}

/**
 * Send file in chat (called from preview modal)
 */
async function sendFileFromPreview() {
  if (!pendingFile) return;

  const user = state.currentUser;
  const file = pendingFile;
  const sendBtn = document.getElementById("sendFileBtn");

  if (!file || !user) return;

  // Disable send button
  sendBtn.disabled = true;
  sendBtn.innerHTML = `
    <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
      <path d="M12 2a10 10 0 0110 10" stroke-linecap="round"/>
    </svg>
    Uploading...
  `;

  try {
    const result = await uploadFileToStorage(file);
    const deviceId = await getDeviceId();
    const selectedDeviceTab =
      document.querySelector(".device-tab.active")?.dataset.device || "all";

    const contentText =
      result.fileType === "image" ? "📷 Image" : `📎 ${result.fileName}`;

    // Prepare file message data
    let fileMessageData = {
      senderId: user.uid,
      senderDeviceId: deviceId,
      senderName: user.displayName || "User",
      senderPlatform: "chrome-extension",
      receiverId: user.uid,
      receiverDeviceId: selectedDeviceTab === "all" ? null : selectedDeviceTab,
      content: contentText,
      type: result.fileType,
      fileUrl: result.url,
      fileName: result.fileName,
      read: false,
      timestamp: Date.now(),
      participants: [user.uid],
    };

    // Encrypt message before sending
    fileMessageData = await encryptChatMessage(fileMessageData, user.uid);
    await addDoc(collection(db, "chats"), fileMessageData);

    // Push notification is sent automatically by Cloud Function onNewChatMessage

    hideFilePreview();
    showToast(
      `${result.fileType === "image" ? "Image" : "File"} sent!`,
      "success",
    );
  } catch (error) {
    showToast("Failed to send file", "error");
    console.error(error);
    sendBtn.disabled = false;
    sendBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
      </svg>
      Retry
    `;
  }
}

/**
 * Set reply to a message
 * @param {HTMLElement} element - Message element
 */
export function setReplyTo(element) {
  const msgId = element.dataset.msgId;
  const msgContent = element.dataset.msgContent;
  const msgSender = element.dataset.msgSender;

  state.setCurrentReplyTo({
    id: msgId,
    content: msgContent,
    senderId: msgSender,
  });

  // Show reply preview above input
  let replyPreview = document.getElementById("chatReplyPreview");
  if (!replyPreview) {
    replyPreview = document.createElement("div");
    replyPreview.id = "chatReplyPreview";
    replyPreview.className = "chat-reply-input-preview";
    const chatInputContainer = chatInput.parentElement;
    chatInputContainer.insertBefore(
      replyPreview,
      chatInputContainer.firstChild,
    );
  }

  replyPreview.innerHTML = `
    <span class="reply-text">↩ ${msgContent.substring(0, 40)}${
      msgContent.length > 40 ? "..." : ""
    }</span>
    <button class="reply-close" onclick="window.clearReply()">×</button>
  `;
  replyPreview.style.display = "flex";
  chatInput.focus();
}

/**
 * Clear reply state
 */
export function clearReply() {
  state.setCurrentReplyTo(null);
  const replyPreview = document.getElementById("chatReplyPreview");
  if (replyPreview) {
    replyPreview.style.display = "none";
  }
}

/**
 * Initialize chat event listeners
 */
export function initChatListeners() {
  sendChatBtn?.addEventListener("click", sendChatMessage);
  chatInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendChatMessage();
  });

  // File attachment button - show preview
  document.getElementById("attachFileBtn")?.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "*/*";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) showFilePreview(file);
    };
    input.click();
  });

  // Image attachment button - show preview
  document.getElementById("attachImageBtn")?.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) showFilePreview(file);
    };
    input.click();
  });

  // Preview modal buttons
  document
    .getElementById("closePreviewBtn")
    ?.addEventListener("click", hideFilePreview);
  document
    .getElementById("cancelFileBtn")
    ?.addEventListener("click", hideFilePreview);
  document
    .getElementById("sendFileBtn")
    ?.addEventListener("click", sendFileFromPreview);

  // Expose to window for inline onclick
  window.setReplyTo = setReplyTo;
  window.clearReply = clearReply;
}
