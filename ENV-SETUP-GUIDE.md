# إعداد متغيرات البيئة (.env)

## للتطبيق (React Native)

### 1. التثبيت

تم تثبيت مكتبة `react-native-config` للتعامل مع ملفات `.env`:

```bash
npm install react-native-config --save
```

### 2. الملفات

- **`.env`** - الملف الأساسي (تم إنشاؤه مع بيانات Firebase الحالية)
- **`.env.example`** - مثال للملف (لا يحتوي على بيانات حقيقية)

### 3. الاستخدام

الآن `firebase.ts` يقرأ البيانات من ملف `.env` تلقائياً:

```typescript
import Config from "react-native-config"

const firebaseConfig = {
  apiKey: Config.FIREBASE_API_KEY,
  authDomain: Config.FIREBASE_AUTH_DOMAIN,
  // ...
}
```

### 4. للانتقال إلى Production

#### الطريقة 1: تغيير ملف `.env` فقط

```bash
# في .env
FIREBASE_API_KEY=your_production_api_key
FIREBASE_PROJECT_ID=your_production_project
# ... باقي البيانات
```

ثم:

```bash
cd app
npm run android  # أو npx react-native run-android
```

#### الطريقة 2: إنشاء ملف `.env.production`

```bash
# إنشاء ملف جديد
cp .env .env.production

# تعديل .env.production بالبيانات الجديدة
```

ثم Build باستخدام:

```bash
ENVFILE=.env.production npx react-native run-android
```

أو للـ APK:

```bash
cd android
ENVFILE=.env.production ./gradlew assembleRelease
```

### 5. Build الـ APK

بعد تعديل `.env`:

```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

الـ APK سيكون في:

```
android/app/build/outputs/apk/release/app-release.apk
```

---

## للـ Chrome Extension

### 1. الملفات

- **`firebase-config.js`** - الملف الأساسي (تم إنشاؤه مع بيانات Firebase الحالية)
- **`firebase-config.example.js`** - مثال للملف (لا يحتوي على بيانات حقيقية)

### 2. الاستخدام

الآن `service-worker.js` و `popup.js` يستوردان البيانات من `firebase-config.js`:

```javascript
import firebaseConfig from "../firebase-config.js"
```

### 3. للانتقال إلى Production

فقط عدّل ملف `firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey: "your_production_api_key",
  authDomain: "your-production.firebaseapp.com",
  projectId: "your-production-project",
  // ...
}
```

ثم أعد Build الـ Extension (إذا كنت تستخدم bundler).

---

## الأمان (Security)

### ✅ تم إضافة الملفات إلى `.gitignore`:

#### للتطبيق:

```
.env
.env.local
.env.production
.env.staging
```

#### للـ Extension:

```
firebase-config.js
```

### ⚠️ مهم جداً:

1. **لا تدفع `.env` أو `firebase-config.js` إلى Git**
2. **استخدم `.env.example` و `firebase-config.example.js` كمرجع فقط**
3. **للـ Production: أنشئ Firebase Project جديد ببيانات مختلفة**

---

## مثال: سيناريو Production كامل

### 1. إنشاء Firebase Project جديد للـ Production

من Firebase Console:

- أنشئ project جديد (مثل: `zyncit-production`)
- أضف تطبيق Android
- أضف تطبيق Web
- احصل على البيانات الجديدة

### 2. تحديث ملفات .env

#### للتطبيق:

```bash
# .env.production
FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXX  # مفتاح جديد
FIREBASE_AUTH_DOMAIN=zyncit-production.firebaseapp.com
FIREBASE_PROJECT_ID=zyncit-production
FIREBASE_STORAGE_BUCKET=zyncit-production.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxxx
NODE_ENV=production
```

#### للـ Extension:

```javascript
// firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXX", // مفتاح جديد
  authDomain: "zyncit-production.firebaseapp.com",
  projectId: "zyncit-production",
  storageBucket: "zyncit-production.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxx",
}
```

### 3. تحديث google-services.json

```bash
# للتطبيق Android
# استبدل app/google-services.json بالملف الجديد من Firebase Console
```

### 4. Build

```bash
# Build APK للـ Production
cd app/android
ENVFILE=.env.production ./gradlew clean
ENVFILE=.env.production ./gradlew assembleRelease

# للـ Extension: فقط أعد تجميع الملفات إذا لزم الأمر
```

---

## Troubleshooting

### مشكلة: react-native-config لا يقرأ المتغيرات

```bash
# Clean وإعادة Build
cd app/android
./gradlew clean
cd ../..
npx react-native run-android
```

### مشكلة: Chrome Extension لا يستورد firebase-config.js

تأكد من:

1. الملف موجود في `chrome-extension/firebase-config.js`
2. المسار صحيح في الـ imports (`../firebase-config.js`)
3. الملف له `export default`

---

## ملاحظات مهمة

1. **Development vs Production**:

   - استخدم Firebase Project منفصل للـ Production
   - هذا يحمي بيانات الـ Testing من الـ Live Data

2. **Security Rules**:

   - تأكد من تحديث Firestore Rules للـ Production Project
   - احذف/عطّل Test Users من Production

3. **Google Services Files**:

   - `google-services.json` (Android)
   - `GoogleService-Info.plist` (iOS)
   - يجب تحديثهما أيضاً للـ Production

4. **Environment Variables في CI/CD**:
   - يمكن وضع `.env` في Secrets للـ CI/CD
   - استخدم GitHub Actions Secrets أو GitLab CI Variables

---

## الخلاصة

✅ **التطبيق**: يقرأ من `.env` باستخدام `react-native-config`
✅ **Extension**: يقرأ من `firebase-config.js`
✅ **الأمان**: جميع الملفات الحساسة في `.gitignore`
✅ **Production**: غيّر الملفات فقط وأعد Build

🎉 **الآن يمكنك التبديل بين Development و Production بسهولة!**
