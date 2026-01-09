// Professional Chat Service for ZyncIT
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  deleteField,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

export class ChatService {
  constructor(db, storage, userId, deviceId) {
    this.db = db
    this.storage = storage
    this.userId = userId
    this.deviceId = deviceId
    this.typingTimeout = null
    this.replyToMessage = null
  }

  // Subscribe to chat messages for a specific device
  subscribeToChat(targetDeviceId, onMessagesUpdate) {
    const chatId = this.getChatId(this.deviceId, targetDeviceId)

    const q = query(
      collection(this.db, `chats/${chatId}/messages`),
      orderBy("timestamp", "asc"),
      limit(100)
    )

    return onSnapshot(q, (snapshot) => {
      const messages = []
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() })
      })
      onMessagesUpdate(messages)
    })
  }

  // Subscribe to typing status
  subscribeToTyping(targetDeviceId, onTypingUpdate) {
    const chatId = this.getChatId(this.deviceId, targetDeviceId)
    const typingDocRef = doc(this.db, `chats/${chatId}/typing`, targetDeviceId)

    return onSnapshot(typingDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        const now = Date.now()
        // Only show typing if it was updated in the last 3 seconds
        onTypingUpdate(data.isTyping && now - data.lastUpdate < 3000)
      } else {
        onTypingUpdate(false)
      }
    })
  }

  // Update typing status
  async updateTypingStatus(targetDeviceId, isTyping) {
    const chatId = this.getChatId(this.deviceId, targetDeviceId)
    const typingDocRef = doc(this.db, `chats/${chatId}/typing`, this.deviceId)

    if (isTyping) {
      await updateDoc(typingDocRef, {
        isTyping: true,
        lastUpdate: Date.now(),
      }).catch(() => {
        // If document doesn't exist, create it
        addDoc(collection(this.db, `chats/${chatId}/typing`), {
          deviceId: this.deviceId,
          isTyping: true,
          lastUpdate: Date.now(),
        })
      })
    } else {
      await updateDoc(typingDocRef, {
        isTyping: false,
      }).catch(() => {})
    }
  }

  // Send typing indicator with debounce
  sendTypingIndicator(targetDeviceId) {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout)
    }

    this.updateTypingStatus(targetDeviceId, true)

    this.typingTimeout = setTimeout(() => {
      this.updateTypingStatus(targetDeviceId, false)
    }, 3000)
  }

  // Upload file to storage
  async uploadFile(file) {
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const storagePath = `chat_files/${this.userId}/${timestamp}_${sanitizedName}`

    const storageRef = ref(this.storage, storagePath)
    await uploadBytes(storageRef, file)
    const downloadUrl = await getDownloadURL(storageRef)

    return {
      url: downloadUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: this.getFileType(file),
    }
  }

  // Get file type
  getFileType(file) {
    if (file.type.startsWith("image/")) return "image"
    if (file.type.startsWith("video/")) return "video"
    if (file.type.startsWith("audio/")) return "audio"
    if (file.type === "application/pdf" || file.name.endsWith(".pdf"))
      return "pdf"
    if (
      file.type.includes("zip") ||
      file.type.includes("rar") ||
      file.type.includes("7z") ||
      file.name.match(/\.(zip|rar|7z|tar|gz)$/i)
    )
      return "archive"
    return "file"
  }

  // Send text message
  async sendTextMessage(targetDeviceId, content) {
    const chatId = this.getChatId(this.deviceId, targetDeviceId)

    const messageData = {
      senderId: this.userId,
      senderDeviceId: this.deviceId,
      receiverDeviceId: targetDeviceId,
      content: content,
      type: "text",
      timestamp: Date.now(),
      read: false,
    }

    // Add reply info if replying to a message
    if (this.replyToMessage) {
      messageData.replyTo = {
        messageId: this.replyToMessage.id,
        content: this.replyToMessage.content,
        type: this.replyToMessage.type,
      }
      this.replyToMessage = null
    }

    await addDoc(collection(this.db, `chats/${chatId}/messages`), messageData)

    // Stop typing indicator
    await this.updateTypingStatus(targetDeviceId, false)
  }

  // Send file message
  async sendFileMessage(targetDeviceId, file) {
    const chatId = this.getChatId(this.deviceId, targetDeviceId)

    // Upload file first
    const fileData = await this.uploadFile(file)

    const messageData = {
      senderId: this.userId,
      senderDeviceId: this.deviceId,
      receiverDeviceId: targetDeviceId,
      content: this.getFileDescription(fileData),
      type: fileData.fileType,
      fileUrl: fileData.url,
      fileName: fileData.fileName,
      fileSize: fileData.fileSize,
      timestamp: Date.now(),
      read: false,
    }

    // Add reply info if replying to a message
    if (this.replyToMessage) {
      messageData.replyTo = {
        messageId: this.replyToMessage.id,
        content: this.replyToMessage.content,
        type: this.replyToMessage.type,
      }
      this.replyToMessage = null
    }

    await addDoc(collection(this.db, `chats/${chatId}/messages`), messageData)
  }

  // Get file description based on type
  getFileDescription(fileData) {
    const size = this.formatFileSize(fileData.fileSize)
    switch (fileData.fileType) {
      case "image":
        return `📷 Image (${size})`
      case "video":
        return `🎥 Video (${size})`
      case "audio":
        return `🎵 Audio (${size})`
      case "pdf":
        return `📄 PDF (${size})`
      case "archive":
        return `📦 Archive (${size})`
      default:
        return `📎 ${fileData.fileName} (${size})`
    }
  }

  // Format file size
  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  // Mark messages as read
  async markAsRead(targetDeviceId, messageIds) {
    const chatId = this.getChatId(this.deviceId, targetDeviceId)

    for (const messageId of messageIds) {
      const messageRef = doc(this.db, `chats/${chatId}/messages`, messageId)
      await updateDoc(messageRef, { read: true })
    }
  }

  // Set reply to message
  setReplyTo(message) {
    this.replyToMessage = message
  }

  // Clear reply
  clearReply() {
    this.replyToMessage = null
  }

  // Get unique chat ID for two devices
  getChatId(deviceId1, deviceId2) {
    return [deviceId1, deviceId2].sort().join("_")
  }

  // Get all chats for this device
  subscribeToChats(onChatsUpdate) {
    const q = query(
      collection(this.db, "chats"),
      where("participants", "array-contains", this.deviceId),
      orderBy("lastMessageTime", "desc")
    )

    return onSnapshot(q, (snapshot) => {
      const chats = []
      snapshot.forEach((doc) => {
        chats.push({ id: doc.id, ...doc.data() })
      })
      onChatsUpdate(chats)
    })
  }
}
