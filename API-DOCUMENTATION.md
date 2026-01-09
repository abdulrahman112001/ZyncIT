# API Documentation - ZyncIT

## 📡 Native Modules API Reference

---

## CallLogModule

### Overview

Kotlin module للتعامل مع سجل المكالمات والاستماع للمكالمات الجديدة.

### Methods

#### `startListening()`

**الوصف**: بدء الاستماع للمكالمات الجديدة

**Parameters**: None

**Returns**: `Promise<boolean>`

**Example**:

```typescript
import { NativeModules } from "react-native"
const { CallLogModule } = NativeModules

await CallLogModule.startListening()
```

**Events**:

- `onCallReceived`: يُطلق عند استقبال/إجراء مكالمة جديدة

```typescript
import { NativeEventEmitter } from "react-native"

const callLogEmitter = new NativeEventEmitter(CallLogModule)
callLogEmitter.addListener("onCallReceived", (call) => {
  console.log("New call:", call)
  // call = {
  //   id: string,
  //   phoneNumber: string,
  //   contactName: string | null,
  //   type: 'incoming' | 'outgoing' | 'missed',
  //   duration: number,
  //   timestamp: number
  // }
})
```

---

#### `loadCallLog()`

**الوصف**: تحميل آخر 100 مكالمة من سجل المكالمات

**Parameters**: None

**Returns**: `Promise<CallLog[]>`

**Example**:

```typescript
const calls = await CallLogModule.loadCallLog()
// calls = [{
//   id: "123",
//   phoneNumber: "+201234567890",
//   contactName: "Ahmed",
//   type: "incoming",
//   duration: 120,
//   timestamp: 1704240000000
// }, ...]
```

---

#### `makeCall(phoneNumber: string)`

**الوصف**: إجراء مكالمة لرقم معين

**Parameters**:

- `phoneNumber` (string): رقم الهاتف للاتصال به

**Returns**: `Promise<void>`

**Example**:

```typescript
await CallLogModule.makeCall("+201234567890")
```

**Errors**:

- `PERMISSION_DENIED`: المستخدم لم يمنح إذن المكالمات
- `INVALID_NUMBER`: رقم هاتف غير صالح

---

## SmsModule

### Overview

Kotlin module للتعامل مع الرسائل النصية (SMS).

### Methods

#### `startListening()`

**الوصف**: بدء الاستماع للرسائل الجديدة

**Parameters**: None

**Returns**: `Promise<boolean>`

**Example**:

```typescript
import { NativeModules } from "react-native"
const { SmsModule } = NativeModules

await SmsModule.startListening()
```

**Events**:

- `onSmsReceived`: يُطلق عند استقبال رسالة جديدة

```typescript
import { NativeEventEmitter } from "react-native"

const smsEmitter = new NativeEventEmitter(SmsModule)
smsEmitter.addListener("onSmsReceived", (sms) => {
  console.log("New SMS:", sms)
  // sms = {
  //   id: string,
  //   phoneNumber: string,
  //   contactName: string | null,
  //   body: string,
  //   timestamp: number,
  //   read: boolean
  // }
})
```

---

#### `loadSMS()`

**الوصف**: تحميل آخر 50 رسالة SMS

**Parameters**: None

**Returns**: `Promise<SMS[]>`

**Example**:

```typescript
const messages = await SmsModule.loadSMS()
// messages = [{
//   id: "456",
//   phoneNumber: "+201234567890",
//   contactName: "Ahmed",
//   body: "Hello!",
//   timestamp: 1704240000000,
//   read: false
// }, ...]
```

---

#### `sendSMS(phoneNumber: string, message: string)`

**الوصف**: إرسال رسالة SMS

**Parameters**:

- `phoneNumber` (string): رقم المستقبل
- `message` (string): نص الرسالة (max 160 char per segment)

**Returns**: `Promise<void>`

**Example**:

```typescript
await SmsModule.sendSMS("+201234567890", "Hello from ZyncIT!")
```

**Errors**:

- `PERMISSION_DENIED`: إذن إرسال SMS غير ممنوح
- `SEND_FAILED`: فشل الإرسال
- `NO_SERVICE`: لا توجد خدمة شبكة

---

#### `hasPermissions()`

**الوصف**: التحقق من أذونات SMS

**Parameters**: None

**Returns**: `Promise<boolean>`

**Example**:

```typescript
const hasPerms = await SmsModule.hasPermissions()
if (!hasPerms) {
  await SmsModule.requestPermissions()
}
```

---

#### `requestPermissions()`

**الوصف**: طلب أذونات SMS من المستخدم

**Parameters**: None

**Returns**: `Promise<boolean>`

**Example**:

```typescript
const granted = await SmsModule.requestPermissions()
if (granted) {
  await SmsModule.loadSMS()
}
```

---

## NotificationService

### Overview

Android Service يستمع لجميع إشعارات النظام.

### Configuration

**في AndroidManifest.xml**:

```xml
<service
    android:name=".NotificationService"
    android:label="ZyncIT Notification Service"
    android:permission="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE"
    android:exported="true">
    <intent-filter>
        <action android:name="android.service.notification.NotificationListenerService"/>
    </intent-filter>
</service>
```

### Methods

#### `isPermissionGranted()`

**الوصف**: التحقق من إذن الاستماع للإشعارات

**Returns**: `Promise<boolean>`

**Example**:

```typescript
import notificationService from "./services/notificationService"

const hasAccess = await notificationService.isPermissionGranted()
```

---

#### `openSettings()`

**الوصف**: فتح إعدادات النظام لمنح إذن الإشعارات

**Returns**: `void`

**Example**:

```typescript
if (!(await notificationService.isPermissionGranted())) {
  notificationService.openSettings()
}
```

---

#### `onNotificationReceived(callback)`

**الوصف**: الاستماع للإشعارات الجديدة

**Parameters**:

- `callback` (function): دالة تُستدعى عند استقبال إشعار

**Returns**: `function` (unsubscribe function)

**Example**:

```typescript
const unsubscribe = notificationService.onNotificationReceived(
  (notification) => {
    console.log("New notification:", notification)
    // notification = {
    //   id: string,
    //   key: string,
    //   packageName: string,
    //   title: string,
    //   text: string,
    //   appName: string,
    //   type: string,
    //   timestamp: number
    // }
  }
)

// للإلغاء:
unsubscribe()
```

---

## 🔥 Firebase API

### Authentication

#### `login(email, password)`

```typescript
import auth from "@react-native-firebase/auth"

try {
  const userCredential = await auth().signInWithEmailAndPassword(
    email,
    password
  )
  const user = userCredential.user
} catch (error) {
  console.error("Login failed:", error.code)
}
```

#### `signup(email, password)`

```typescript
try {
  const userCredential = await auth().createUserWithEmailAndPassword(
    email,
    password
  )
  const user = userCredential.user
} catch (error) {
  console.error("Signup failed:", error.code)
}
```

#### `logout()`

```typescript
await auth().signOut()
```

---

### Firestore

#### قراءة المكالمات

```typescript
import firestore from "@react-native-firebase/firestore"

const snapshot = await firestore()
  .collection("calls")
  .where("userId", "==", userId)
  .orderBy("timestamp", "desc")
  .limit(100)
  .get()

const calls = snapshot.docs.map((doc) => ({
  id: doc.id,
  ...doc.data(),
}))
```

#### حفظ مكالمة

```typescript
await firestore().collection("calls").doc(callId).set({
  userId,
  deviceId,
  phoneNumber,
  contactName,
  type,
  duration,
  timestamp,
  syncedAt: Date.now(),
})
```

#### الاستماع للتحديثات (Real-time)

```typescript
const unsubscribe = firestore()
  .collection("calls")
  .where("userId", "==", userId)
  .orderBy("timestamp", "desc")
  .onSnapshot((snapshot) => {
    const calls = []
    snapshot.forEach((doc) => {
      calls.push({ id: doc.id, ...doc.data() })
    })
    setCalls(calls)
  })

// للإلغاء:
unsubscribe()
```

---

## 🎨 Custom Hooks

### useNativeEvents

**الموقع**: `src/hooks/useNativeEvents.ts`

**الوصف**: Hook للتعامل مع Native Modules

**الاستخدام**:

```typescript
import { useNativeEvents } from "../hooks"

function MyComponent() {
  const {
    requestPermissions,
    startCallListener,
    startSmsListener,
    loadCallLog,
    loadSmsMessages,
    sendSMS,
    makeCall,
  } = useNativeEvents()

  useEffect(() => {
    const init = async () => {
      const granted = await requestPermissions()
      if (granted) {
        await startCallListener()
        await startSmsListener()
      }
    }
    init()
  }, [])

  return (
    <View>
      <Button title="Send SMS" onPress={() => sendSMS("+20123456", "Hello")} />
    </View>
  )
}
```

---

## 🗄️ Zustand Stores

### useAuthStore

**الموقع**: `src/store/authStore.ts`

```typescript
import { useAuthStore } from "../store/authStore"

function MyComponent() {
  const { user, isLoading, login, logout } = useAuthStore()

  const handleLogin = async () => {
    try {
      await login("user@example.com", "password123")
    } catch (error) {
      console.error(error)
    }
  }

  if (isLoading) return <Loading />
  if (!user) return <LoginScreen />

  return <HomeScreen />
}
```

---

### useCallStore

**الموقع**: `src/store/callStore.ts`

```typescript
import { useCallStore } from "../store/callStore"

function CallsScreen() {
  const {
    calls,
    isLoading,
    loadCalls,
    clearAllCalls,
    deleteCallsByPhoneNumbers,
  } = useCallStore()

  useEffect(() => {
    loadCalls()
  }, [])

  const handleDelete = async (phoneNumbers: string[]) => {
    await deleteCallsByPhoneNumbers(phoneNumbers)
  }

  return (
    <FlatList
      data={calls}
      renderItem={({ item }) => <CallItem call={item} />}
      refreshing={isLoading}
      onRefresh={loadCalls}
    />
  )
}
```

---

### useSMSStore

**الموقع**: `src/store/smsStore.ts`

```typescript
import { useSMSStore } from "../store/smsStore"

function SMSScreen() {
  const {
    messages,
    isLoading,
    loadMessages,
    sendSMS,
    deleteMessagesBySender,
    markMessagesAsReadBySender,
  } = useSMSStore()

  const handleSend = async () => {
    await sendSMS("+201234567890", "Hello!")
  }

  const handleDelete = async (sender: string) => {
    await deleteMessagesBySender(sender)
  }

  const handleMarkAsRead = async (sender: string) => {
    await markMessagesAsReadBySender(sender)
  }

  return <View>...</View>
}
```

---

### useNotificationStore

**الموقع**: `src/store/notificationStore.ts`

```typescript
import { useNotificationStore } from "../store/notificationStore"

function NotificationsScreen() {
  const {
    notifications,
    addNotification,
    removeNotification,
    removeNotificationsByKeys,
    markGroupAsRead,
  } = useNotificationStore()

  const handleDeleteGroup = (keys: string[]) => {
    removeNotificationsByKeys(keys)
  }

  return <View>...</View>
}
```

---

## 🎯 Type Definitions

### CallLog

```typescript
interface CallLog {
  id: string
  userId: string
  deviceId: string
  phoneNumber: string
  contactName: string | null
  type: "incoming" | "outgoing" | "missed" | "rejected"
  duration: number // بالثواني
  timestamp: number // Unix timestamp (ms)
  syncedAt: number
}
```

### SMS

```typescript
interface SMS {
  id: string
  userId: string
  deviceId: string
  phoneNumber: string
  contactName: string | null
  body: string
  timestamp: number
  read: boolean
  type: "inbox" | "sent"
}
```

### AppNotification

```typescript
interface AppNotification {
  id: string
  key: string
  packageName: string
  title: string
  text: string
  appName: string
  type: string // 'sms', 'whatsapp', 'telegram', etc.
  timestamp: number
  read: boolean
}
```

### Device

```typescript
interface Device {
  id: string
  name: string
  nickname: string
  model: string
  manufacturer: string
  systemVersion: string
  lastSeen: number
}
```

---

## 🔧 Utility Functions

### formatPhoneNumber

```typescript
// src/utils/phoneUtils.ts
export const formatPhoneNumber = (phone: string): string => {
  // +201234567890 -> +20 123 456 7890
  const cleaned = phone.replace(/\D/g, "")
  const match = cleaned.match(/^(\d{2})(\d{3})(\d{3})(\d{4})$/)
  if (match) {
    return `+${match[1]} ${match[2]} ${match[3]} ${match[4]}`
  }
  return phone
}
```

### formatTimestamp

```typescript
// src/utils/timeUtils.ts
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp)
  const now = new Date()

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}
```

---

## 🚀 Chrome Extension API

### Firebase في Extension

```javascript
// popup/popup.js
import { initializeApp } from "firebase/app"
import { getAuth, signInWithEmailAndPassword } from "firebase/auth"
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore"

const firebaseConfig = {
  /* ... */
}
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

// Login
async function login(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  return userCredential.user
}

// Load Calls
async function loadCalls(userId) {
  const q = query(
    collection(db, "calls"),
    where("userId", "==", userId),
    orderBy("timestamp", "desc"),
    limit(50)
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}
```

---

**آخر تحديث**: يناير 2026
