# نظام الشات الاحترافي - ZyncIT

## الميزات المضافة

### 1. Typing Indicator (حالة الكتابة)

- يظهر "Typing..." عندما يكتب المستخدم الآخر
- يختفي تلقائياً بعد 3 ثوان من التوقف عن الكتابة
- رسوم متحركة احترافية للنقاط

### 2. Reply (الرد على رسالة)

- اضغط على أيقونة Reply بجوار أي رسالة
- يظهر معاينة الرسالة المراد الرد عليها
- يمكن إلغاء الرد قبل الإرسال

### 3. إرسال جميع أنواع الملفات

- الصور (Image)
- الفيديوهات (Video)
- الملفات الصوتية (Audio)
- ملفات PDF
- الملفات المضغوطة (ZIP, RAR, 7Z, etc.)
- أي نوع ملف آخر

### 4. اختيار الجهاز المستهدف

- يجب اختيار جهاز محدد من القائمة قبل الإرسال
- يتم حفظ المحادثة لكل جهاز على حدة

## البنية في Firebase

```
chats/
  {deviceId1}_{deviceId2}/
    messages/
      {messageId}:
        - senderId: string
        - senderDeviceId: string
        - receiverDeviceId: string
        - content: string
        - type: 'text' | 'image' | 'video' | 'audio' | 'pdf' | 'archive' | 'file'
        - timestamp: number
        - read: boolean
        - fileUrl?: string (للملفات)
        - fileName?: string
        - fileSize?: number
        - replyTo?: {
            messageId: string
            content: string
            type: string
          }

    typing/
      {deviceId}:
        - isTyping: boolean
        - lastUpdate: number
```

## كيفية التكامل مع popup.js

### 1. استيراد ChatService

```javascript
import { ChatService } from "./chatService.js"

let chatService = null
let currentChatDeviceId = null
let typingUnsubscribe = null
let messagesUnsubscribe = null
```

### 2. تهيئة ChatService بعد تسجيل الدخول

```javascript
async function initChat() {
  if (!currentUser) return

  const deviceId = await getDeviceId()
  chatService = new ChatService(db, storage, currentUser.uid, deviceId)

  // Load devices for chat
  loadChatDevices()
}
```

### 3. تحميل الأجهزة المتاحة

```javascript
async function loadChatDevices() {
  const devicesSnapshot = await getDocs(
    query(collection(db, "devices"), where("userId", "==", currentUser.uid))
  )

  chatDeviceSelect.innerHTML = '<option value="">Select device...</option>'

  devicesSnapshot.forEach((doc) => {
    const device = doc.data()
    const option = document.createElement("option")
    option.value = doc.id
    option.textContent = `${device.deviceName} (${device.deviceType})`
    chatDeviceSelect.appendChild(option)
  })
}
```

### 4. الاشتراك في الرسائل عند اختيار جهاز

```javascript
chatDeviceSelect.addEventListener("change", async () => {
  const targetDeviceId = chatDeviceSelect.value

  if (!targetDeviceId) {
    chatMessages.innerHTML = '<div class="empty-state">...</div>'
    return
  }

  currentChatDeviceId = targetDeviceId

  // Unsubscribe from previous chat
  if (messagesUnsubscribe) messagesUnsubscribe()
  if (typingUnsubscribe) typingUnsubscribe()

  // Subscribe to messages
  messagesUnsubscribe = chatService.subscribeToChat(
    targetDeviceId,
    renderChatMessages
  )

  // Subscribe to typing status
  typingUnsubscribe = chatService.subscribeToTyping(
    targetDeviceId,
    (isTyping) => {
      const indicator = document.getElementById("typingIndicator")
      if (isTyping) {
        indicator.classList.remove("hidden")
      } else {
        indicator.classList.add("hidden")
      }
    }
  )
})
```

### 5. عرض الرسائل

```javascript
function renderChatMessages(messages) {
  if (messages.length === 0) {
    chatMessages.innerHTML = `
      <div class="empty-state">
        <svg>...</svg>
        <p>No messages yet</p>
        <span>Start chatting with this device</span>
      </div>
    `
    return
  }

  chatMessages.innerHTML = messages
    .map((msg) => {
      let content = ""
      let replyHtml = ""

      // Reply
      if (msg.replyTo) {
        replyHtml = `
        <div class="chat-message-reply">
          <div class="chat-message-reply-label">Reply to:</div>
          <div>${msg.replyTo.content}</div>
        </div>
      `
      }

      // Content based on type
      if (msg.type === "image" && msg.fileUrl) {
        content = `
        <a href="${msg.fileUrl}" target="_blank" class="chat-image-link">
          <img src="${msg.fileUrl}" alt="Image" class="chat-image" />
        </a>
      `
      } else if (msg.type !== "text" && msg.fileUrl) {
        const icon = getFileIcon(msg.type)
        content = `
        <a href="${msg.fileUrl}" target="_blank" class="chat-file-link">
          ${icon}
          <div>
            <div>${msg.fileName || "File"}</div>
            ${
              msg.fileSize
                ? `<div style="font-size: 11px; opacity: 0.7;">${formatFileSize(
                    msg.fileSize
                  )}</div>`
                : ""
            }
          </div>
        </a>
      `
      } else {
        content = `<div>${msg.content}</div>`
      }

      const isSent = msg.senderDeviceId === chatService.deviceId

      return `
      <div class="chat-message-wrapper ${isSent ? "sent" : "received"}">
        <div class="chat-message ${
          isSent ? "sent" : "received"
        }" data-message-id="${msg.id}">
          ${replyHtml}
          ${content}
          <div class="chat-message-time">${formatTime(msg.timestamp)}</div>
        </div>
        <div class="chat-message-actions">
          <button class="chat-action-btn reply-btn" data-message-id="${
            msg.id
          }" data-content="${escapeHtml(msg.content)}" title="Reply">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 14 4 9 9 4"/>
              <path d="M20 20v-7a4 4 0 00-4-4H4"/>
            </svg>
          </button>
        </div>
      </div>
    `
    })
    .join("")

  // Add reply button handlers
  document.querySelectorAll(".reply-btn").forEach((btn) => {
    btn.addEventListener("click", handleReplyClick)
  })

  chatMessages.scrollTop = chatMessages.scrollHeight
}

function getFileIcon(type) {
  const icons = {
    pdf: "📄",
    archive: "📦",
    video: "🎥",
    audio: "🎵",
    file: "📎",
  }
  return icons[type] || "📎"
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

function escapeHtml(text) {
  return text.replace(
    /[&<>"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      }[m])
  )
}
```

### 6. إرسال Typing Indicator

```javascript
chatInput.addEventListener("input", () => {
  if (currentChatDeviceId && chatService) {
    chatService.sendTypingIndicator(currentChatDeviceId)
  }
})
```

### 7. إرسال الرسائل

```javascript
async function sendChatMessage() {
  const content = chatInput.value.trim()
  if (!content || !currentChatDeviceId || !chatService) {
    if (!currentChatDeviceId) {
      showToast("Please select a device first", "error")
    }
    return
  }

  try {
    await chatService.sendTextMessage(currentChatDeviceId, content)
    chatInput.value = ""
  } catch (error) {
    showToast("Failed to send message", "error")
    console.error(error)
  }
}
```

### 8. إرسال الملفات

```javascript
document.getElementById("attachFileBtn").addEventListener("click", () => {
  if (!currentChatDeviceId) {
    showToast("Please select a device first", "error")
    return
  }

  const input = document.createElement("input")
  input.type = "file"
  input.accept = "*/*"
  input.onchange = async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      showLoading()
      try {
        await chatService.sendFileMessage(currentChatDeviceId, file)
        showToast("File sent!", "success")
      } catch (error) {
        showToast("Failed to send file", "error")
        console.error(error)
      }
      hideLoading()
    }
  }
  input.click()
})

document.getElementById("attachImageBtn").addEventListener("click", () => {
  if (!currentChatDeviceId) {
    showToast("Please select a device first", "error")
    return
  }

  const input = document.createElement("input")
  input.type = "file"
  input.accept = "image/*"
  input.onchange = async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      showLoading()
      try {
        await chatService.sendFileMessage(currentChatDeviceId, file)
        showToast("Image sent!", "success")
      } catch (error) {
        showToast("Failed to send image", "error")
        console.error(error)
      }
      hideLoading()
    }
  }
  input.click()
})
```

### 9. معالجة Reply

```javascript
function handleReplyClick(e) {
  const btn = e.currentTarget
  const messageId = btn.dataset.messageId
  const content = btn.dataset.content

  // Find the full message object
  const messageElement = document.querySelector(
    `[data-message-id="${messageId}"]`
  )
  const message = {
    id: messageId,
    content: content,
    type: "text", // يمكن تحسين هذا لاحقاً
  }

  chatService.setReplyTo(message)

  // Show reply preview
  const replyPreview = document.getElementById("replyPreview")
  const replyText = document.getElementById("replyText")
  replyText.textContent = content
  replyPreview.classList.remove("hidden")

  // Focus input
  chatInput.focus()
}

document.getElementById("cancelReply").addEventListener("click", () => {
  chatService.clearReply()
  document.getElementById("replyPreview").classList.add("hidden")
})
```

## الخطوات التالية

1. ✅ إنشاء ChatService class
2. ✅ تحديث HTML للشات
3. ✅ إضافة CSS للميزات الجديدة
4. ⏳ دمج الكود في popup.js
5. ⏳ اختبار على الأجهزة المختلفة
6. ⏳ إضافة نفس النظام للتطبيق (React Native)

## ملاحظات مهمة

- تأكد من إضافة Firebase Storage rules للسماح بـ uploads
- حجم الملفات محدود بـ Firebase (عادة 5MB للخطة المجانية)
- يمكن تحسين الأداء باستخدام pagination للرسائل القديمة
- يجب إضافة notification عند استلام رسالة جديدة
