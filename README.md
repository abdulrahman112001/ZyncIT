# ZyncIT - Android SMS & Notifications Sync

![Version](https://img.shields.io/badge/version-1.0-blue)
![Platform](https://img.shields.io/badge/platform-Android-green)
![React Native](https://img.shields.io/badge/React%20Native-0.83.1-61dafb)
![Firebase](https://img.shields.io/badge/Firebase-23.7.0-orange)

## 📋 نظرة عامة (Overview)

**ZyncIT** هو تطبيق Android مع Chrome Extension يتيح للمستخدمين مزامنة الرسائل النصية (SMS)، سجل المكالمات، والإشعارات من هواتفهم الأندرويد إلى متصفح Chrome. يتيح التطبيق أيضاً إرسال رسائل SMS مباشرة من المتصفح.

### الميزات الرئيسية:

- 📱 مزامنة SMS في الوقت الفعلي
- 📞 عرض سجل المكالمات مع تفاصيل كاملة
- 🔔 عرض الإشعارات من جميع التطبيقات
- ✉️ إرسال SMS من المتصفح
- 🌙 دعم Dark Mode
- 🔐 مصادقة آمنة عبر Firebase
- 🔄 مزامنة تلقائية عبر أجهزة متعددة
- 🗑️ حذف متعدد للمكالمات والإشعارات

---

## 🏗️ البنية المعمارية (Architecture)

```
ZyncIT/
├── app/                          # React Native App
│   ├── android/                  # Android Native Code
│   │   ├── app/src/main/java/    # Native Modules
│   │   │   └── com/zyncit/
│   │   │       ├── CallLogModule.kt      # Call Log Manager
│   │   │       ├── SmsModule.kt          # SMS Manager
│   │   │       ├── NotificationService.kt # Notification Listener
│   │   │       └── ZyncITModule.kt       # Main Bridge
│   │   └── app/build.gradle      # Android Build Config
│   │
│   ├── src/
│   │   ├── components/           # Reusable Components
│   │   │   └── ServiceStatusBanner.tsx
│   │   ├── constants/            # App Constants
│   │   │   ├── index.ts
│   │   │   └── theme.ts
│   │   ├── contexts/            # React Contexts
│   │   │   └── ThemeContext.tsx
│   │   ├── hooks/               # Custom Hooks
│   │   │   ├── useNativeEvents.ts
│   │   │   └── index.ts
│   │   ├── navigation/          # Navigation Setup
│   │   │   ├── RootNavigator.tsx
│   │   │   ├── AuthNavigator.tsx
│   │   │   └── MainNavigator.tsx
│   │   ├── screens/             # App Screens
│   │   │   ├── auth/
│   │   │   │   ├── LoginScreen.tsx
│   │   │   │   └── SignUpScreen.tsx
│   │   │   └── main/
│   │   │       ├── CallsScreen.tsx
│   │   │       ├── CallDetailScreen.tsx
│   │   │       ├── SMSScreen.tsx
│   │   │       ├── ChatScreen.tsx
│   │   │       ├── NotificationsScreen.tsx
│   │   │       ├── AccountScreen.tsx
│   │   │       └── MenuScreen.tsx
│   │   ├── services/            # Business Logic Services
│   │   │   ├── firebase.ts
│   │   │   ├── notificationService.ts
│   │   │   ├── smsService.ts
│   │   │   └── fileService.ts
│   │   ├── store/               # Zustand State Management
│   │   │   ├── authStore.ts
│   │   │   ├── callStore.ts
│   │   │   ├── smsStore.ts
│   │   │   ├── notificationStore.ts
│   │   │   ├── chatStore.ts
│   │   │   ├── deviceStore.ts
│   │   │   └── settingsStore.ts
│   │   └── types/               # TypeScript Types
│   │       └── index.ts
│   │
│   ├── package.json
│   └── tsconfig.json
│
└── chrome-extension/            # Chrome Extension
    ├── manifest.json            # Extension Config
    ├── popup/
    │   ├── popup.html
    │   ├── popup.css
    │   └── popup.js
    ├── background/
    │   └── service-worker.js
    └── assets/
        └── icons/
```

---

## 🛠️ المتطلبات (Requirements)

### تطوير التطبيق:

- **Node.js**: v18+
- **React Native**: 0.83.1
- **Android Studio**: Latest version
- **JDK**: 17+
- **Android SDK**: API Level 24+ (Android 7.0+)
- **Gradle**: 9.0.0
- **Kotlin**: 1.9.0

### Firebase:

- Firebase Project مُفعّل
- Authentication (Email/Password)
- Firestore Database
- Firebase Storage (للملفات)

### Chrome Extension:

- Chrome/Edge Browser
- Developer Mode enabled

---

## 📦 التثبيت والإعداد (Installation & Setup)

### 1. Clone المشروع

```bash
git clone <repository-url>
cd ZyncIT
```

### 2. تثبيت Dependencies

#### للتطبيق:

```bash
cd app
npm install
# أو
yarn install
```

#### للـ Extension:

```bash
cd chrome-extension
npm install
```

### 3. Firebase Configuration

#### 🔥 الطريقة الموصى بها: استخدام Environment Variables

**للتطبيق (React Native):**

1. أنشئ ملف `.env` في مجلد `app/`:

```bash
cd app
cp .env.example .env
```

2. عدّل `.env` ببيانات Firebase:

```env
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

**للـ Chrome Extension:**

1. أنشئ ملف `firebase-config.js`:

```bash
cd chrome-extension
cp firebase-config.example.js firebase-config.js
```

2. عدّل `firebase-config.js` ببياناتك

**📖 للمزيد**: راجع [ENV-SETUP-GUIDE.md](ENV-SETUP-GUIDE.md)

---

#### إعداد Firebase Project:

1. أنشئ مشروع Firebase جديد
2. فعّل Authentication (Email/Password)
3. أنشئ Firestore Database
4. حمّل `google-services.json` وضعه في:

   ```
   app/android/app/google-services.json
   ```

5. (اختياري) انسخ Firebase Config في:
   ```javascript
   // app/src/services/firebase.ts
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID",
   }
   ```

### 4. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Devices subcollection
      match /devices/{deviceId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;

        // Notifications subcollection
        match /notifications/{notificationId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }

    // Calls collection
    match /calls/{callId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }

    // SMS Requests collection
    match /smsRequests/{requestId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 🔨 البناء والتشغيل (Build & Run)

### Development Mode

```bash
cd app

# Start Metro Bundler
npm start

# Run on Android (في terminal آخر)
npm run android
```

### Production Build

#### APK:

```bash
cd app

# 1. Bundle JavaScript
npx react-native bundle --platform android --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res/

# 2. Build APK
cd android
./gradlew assembleRelease --offline

# 3. APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

### Chrome Extension

#### للتطوير:

1. افتح Chrome → `chrome://extensions/`
2. فعّل Developer Mode
3. Load unpacked → اختر مجلد `chrome-extension`

#### للنشر:

```bash
cd chrome-extension
# ملف ZIP جاهز للرفع على Chrome Web Store
```

---

## 📱 Native Modules

### 1. CallLogModule (Kotlin)

**الموقع**: `android/app/src/main/java/com/zyncit/CallLogModule.kt`

**الوظائف**:

```kotlin
@ReactMethod
fun startListening(promise: Promise)

@ReactMethod
fun loadCallLog(promise: Promise)

@ReactMethod
fun makeCall(phoneNumber: String, promise: Promise)
```

**الأحداث**:

- `onCallReceived`: يُرسل عند استقبال/إجراء مكالمة

**الأذونات المطلوبة**:

```xml
<uses-permission android:name="android.permission.READ_CALL_LOG"/>
<uses-permission android:name="android.permission.READ_PHONE_STATE"/>
<uses-permission android:name="android.permission.CALL_PHONE"/>
```

### 2. SmsModule (Kotlin)

**الموقع**: `android/app/src/main/java/com/zyncit/SmsModule.kt`

**الوظائف**:

```kotlin
@ReactMethod
fun startListening(promise: Promise)

@ReactMethod
fun loadSMS(promise: Promise)

@ReactMethod
fun sendSMS(phoneNumber: String, message: String, promise: Promise)

@ReactMethod
fun hasPermissions(promise: Promise)

@ReactMethod
fun requestPermissions(promise: Promise)
```

**الأحداث**:

- `onSmsReceived`: يُرسل عند استقبال SMS جديد

**الأذونات المطلوبة**:

```xml
<uses-permission android:name="android.permission.READ_SMS"/>
<uses-permission android:name="android.permission.SEND_SMS"/>
<uses-permission android:name="android.permission.RECEIVE_SMS"/>
```

### 3. NotificationService (Kotlin)

**الموقع**: `android/app/src/main/java/com/zyncit/NotificationService.kt`

**النوع**: `NotificationListenerService`

**الوظائف**:

- الاستماع لجميع إشعارات النظام
- تصنيف الإشعارات حسب النوع (SMS, WhatsApp, Telegram, etc.)
- إرسال الإشعارات إلى React Native

**التسجيل في Manifest**:

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

---

## 💾 State Management (Zustand)

### Store Structure

#### authStore.ts

```typescript
interface AuthState {
  user: FirebaseUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  deleteAccount: () => Promise<void>
}
```

#### callStore.ts

```typescript
interface CallState {
  calls: CallLog[]
  isLoading: boolean
  loadCalls: () => void
  addCall: (call: CallLog) => void
  clearAllCalls: () => Promise<void>
  deleteCallsByPhoneNumbers: (phoneNumbers: string[]) => Promise<void>
}
```

#### smsStore.ts

```typescript
interface SMSState {
  messages: SMS[]
  isLoading: boolean
  loadMessages: () => void
  addMessage: (message: SMS) => void
  sendSMS: (phoneNumber: string, message: string) => Promise<void>
  deleteMessagesBySender: (sender: string) => Promise<void>
}
```

#### notificationStore.ts

```typescript
interface NotificationState {
  notifications: AppNotification[]
  addNotification: (notification: AppNotification) => void
  removeNotification: (id: string) => void
  removeNotificationsByKeys: (keys: string[]) => void
  markGroupAsRead: (title: string, appName: string, type: string) => void
}
```

---

## 🎨 الشاشات الرئيسية (Main Screens)

### 1. CallsScreen

- عرض المكالمات مجمعة حسب رقم الهاتف
- Swipe للحذف
- وضع التحديد المتعدد (Multi-select)
- فلترة وبحث
- Dark Mode support

### 2. SMSScreen

- عرض الرسائل مجمعة حسب المرسل
- إرسال رسائل جديدة
- علامة "مقروء/غير مقروء"
- Avatars للمحادثات

### 3. NotificationsScreen

- عرض جميع الإشعارات
- تجميع حسب التطبيق
- دعم SMS notifications
- Multi-select delete
- Mute options

### 4. ChatScreen

- محادثات SMS فردية
- عرض الرسائل في فقاعات
- إرسال رسائل جديدة
- Dark Mode

---

## 🔥 Firebase Collections Structure

### 1. `users/{userId}`

```javascript
{
  email: string,
  createdAt: timestamp,
  devices: [...] // subcollection
}
```

### 2. `users/{userId}/devices/{deviceId}`

```javascript
{
  id: string,
  name: string,
  nickname: string,
  model: string,
  manufacturer: string,
  systemVersion: string,
  lastSeen: timestamp,
  notifications: [...] // subcollection
}
```

### 3. `calls/{callId}`

```javascript
{
  id: string,
  userId: string,
  deviceId: string,
  phoneNumber: string,
  contactName: string | null,
  type: 'incoming' | 'outgoing' | 'missed' | 'rejected',
  duration: number,
  timestamp: number,
  syncedAt: number
}
```

### 4. `smsRequests/{requestId}`

```javascript
{
  id: string,
  userId: string,
  deviceId: string,
  phoneNumber: string,
  message: string,
  status: 'pending' | 'sent' | 'failed',
  createdAt: timestamp,
  sentAt: timestamp | null
}
```

---

## 🌐 Chrome Extension

### Structure

#### manifest.json

```json
{
  "manifest_version": 3,
  "name": "ZyncIT",
  "version": "1.0",
  "permissions": ["storage", "identity"],
  "host_permissions": ["https://firebasestorage.googleapis.com/*"],
  "action": {
    "default_popup": "popup/popup.html"
  },
  "background": {
    "service_worker": "background/service-worker.js"
  }
}
```

### Features

- Firebase Authentication
- Real-time sync with Firestore
- Send SMS from browser
- View calls, SMS, notifications
- Dark mode support

---

## 🔐 الأذونات المطلوبة (Permissions)

### Android App:

```xml
<!-- SMS -->
<uses-permission android:name="android.permission.READ_SMS"/>
<uses-permission android:name="android.permission.SEND_SMS"/>
<uses-permission android:name="android.permission.RECEIVE_SMS"/>

<!-- Calls -->
<uses-permission android:name="android.permission.READ_CALL_LOG"/>
<uses-permission android:name="android.permission.READ_PHONE_STATE"/>
<uses-permission android:name="android.permission.CALL_PHONE"/>

<!-- Contacts -->
<uses-permission android:name="android.permission.READ_CONTACTS"/>

<!-- Notifications -->
<uses-permission android:name="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE"/>

<!-- Internet -->
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
```

---

## 🚀 الميزات المستقبلية (Future Features)

### القريبة (Near Future):

- [ ] دعم WhatsApp messaging من Extension
- [ ] إشعارات Push notifications
- [ ] نسخ احتياطي تلقائي
- [ ] تصدير المحادثات

### المتوسطة (Mid-term):

- [ ] iOS Support
- [ ] Desktop App (Electron)
- [ ] Group Messaging
- [ ] Voice Notes Support

### البعيدة (Long-term):

- [ ] End-to-End Encryption
- [ ] Video Calls Integration
- [ ] AI-powered Smart Replies
- [ ] Multi-language Support

---

## 🐛 المشاكل المعروفة (Known Issues)

1. **Notification Listener**: يحتاج إعادة تفعيل بعد restart الهاتف
2. **SMS Send**: قد يفشل على بعض أجهزة Samsung بسبب Default SMS App
3. **Dark Mode**: بعض الألوان قد تحتاج تحسين

---

## 📝 ملاحظات التطوير (Development Notes)

### Code Style:

- TypeScript Strict Mode
- ESLint + Prettier
- Functional Components + Hooks
- Zustand for State Management

### Testing:

```bash
# Run tests
npm test

# Type checking
npm run tsc
```

### Debugging:

```bash
# React Native Debugger
npm run debug

# Android Logs
adb logcat | grep ZyncIT
```

---

## 📄 License

هذا المشروع ملك خاص. جميع الحقوق محفوظة.

---

## 👥 المساهمون (Contributors)

- **المطور الرئيسي**: [اسمك]
- **التاريخ**: يناير 2026

---

## 📞 الدعم الفني (Support)

للمساعدة أو الإبلاغ عن مشاكل:

- Email: support@zyncit.app
- GitHub Issues: [repository-url]/issues

---

## 📚 موارد إضافية (Additional Resources)

### Documentation:

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Firebase Docs](https://firebase.google.com/docs)
- [Chrome Extensions](https://developer.chrome.com/docs/extensions/)

### Tools:

- [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
- [Flipper](https://fbflipper.com/)
- [Android Studio](https://developer.android.com/studio)

---

**آخر تحديث**: يناير 2026
**الإصدار**: 1.0
