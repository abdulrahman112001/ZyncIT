# Firebase Cloud Functions for iRopit

هذا المجلد يحتوي على Cloud Functions التي تعمل على Firebase لإرسال Push Notifications.

## المتطلبات

1. **Firebase CLI**: تثبيت Firebase CLI

   ```bash
   npm install -g firebase-tools
   ```

2. **تسجيل الدخول لـ Firebase**:
   ```bash
   firebase login
   ```

## التثبيت

```bash
cd functions
npm install
```

## النشر (Deploy)

```bash
firebase deploy --only functions
```

## الـ Functions المتاحة

### 1. `sendPushNotification`

- **Trigger**: عند إنشاء document جديد في collection `push_notifications`
- **الوظيفة**: يرسل FCM notification للجهاز المحدد
- **يستخدم من**: الإكستنشن عند إرسال رسالة Chat

### 2. `onNewChatMessage`

- **Trigger**: عند إنشاء document جديد في collection `chats`
- **الوظيفة**: يرسل إشعار لجميع أجهزة المستخدم عند إرسال رسالة من الإكستنشن
- **ملاحظة**: هذا بديل مباشر - يمكن استخدامه بدلاً من `sendPushNotification`

### 3. `cleanupOldNotifications`

- **Trigger**: يعمل يومياً الساعة 00:00 UTC
- **الوظيفة**: حذف الإشعارات القديمة (أكثر من 24 ساعة)

## الاختبار المحلي

```bash
npm run serve
```

## عرض Logs

```bash
firebase functions:log
```

## ملاحظات مهمة

1. تأكد من أن التطبيق يحفظ FCM Token عند تسجيل الجهاز
2. يجب أن يكون لديك Blaze Plan (مدفوع) لاستخدام Cloud Functions
3. الـ Function `onNewChatMessage` ترسل الإشعارات مباشرة من الـ chats collection، بينما `sendPushNotification` تحتاج لإنشاء document في `push_notifications`
