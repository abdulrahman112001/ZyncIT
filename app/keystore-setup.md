# 🔐 إنشاء Signed Release APK

لإنشاء APK موقّع لا يظهر عليه تحذير Google Play Protect

---

## 1️⃣ إنشاء Keystore

افتح Terminal في مجلد المشروع وشغّل:

```bash
cd app/android/app

# إنشاء keystore جديد
keytool -genkeypair -v -storetype PKCS12 -keystore zyncit-release-key.keystore -alias zyncit-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### سيطلب منك المعلومات التالية:

```
Enter keystore password: [اكتب password قوي]
Re-enter new password: [كرر نفس الـ password]

What is your first and last name?
  [اسم شركتك أو اسمك]

What is the name of your organizational unit?
  [قسم IT مثلاً]

What is the name of your organization?
  [اسم الشركة]

What is the name of your City or Locality?
  [مدينتك]

What is the name of your State or Province?
  [محافظتك]

What is the two-letter country code for this unit?
  [EG مثلاً لمصر]

Is CN=..., OU=..., O=..., L=..., ST=..., C=... correct?
  [yes]

Enter key password for <zyncit-key-alias>
	(RETURN if same as keystore password): [اضغط Enter]
```

### ⚠️ احفظ هذه المعلومات في مكان آمن:

```
Keystore File: zyncit-release-key.keystore
Keystore Password: [كلمة المرور اللي اخترتها]
Key Alias: zyncit-key-alias
Key Password: [نفس keystore password]
```

---

## 2️⃣ تكوين Gradle

### أ) إنشاء ملف `keystore.properties`:

```bash
# في مجلد app/android/
cd c:\Dev\ZyncIT\app\android
```

أنشئ ملف `keystore.properties`:

```properties
storeFile=app/zyncit-release-key.keystore
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=zyncit-key-alias
keyPassword=YOUR_KEY_PASSWORD
```

**⚠️ استبدل `YOUR_KEYSTORE_PASSWORD` و `YOUR_KEY_PASSWORD` بكلمات المرور الفعلية!**

### ب) تعديل `app/build.gradle`:

أضف قبل `android {`:

```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

ثم داخل `android {`:

```gradle
signingConfigs {
    release {
        if (keystorePropertiesFile.exists()) {
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release  // أضف هذا السطر
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

---

## 3️⃣ Build Signed APK

```bash
cd c:\Dev\ZyncIT\app\android

# Clean
.\gradlew clean

# Build Signed Release APK
.\gradlew assembleRelease
```

الـ APK الموقّع سيكون في:

```
app\android\app\build\outputs\apk\release\app-release.apk
```

---

## 4️⃣ إضافة keystore إلى .gitignore

**⚠️ مهم جداً: لا ترفع keystore أو passwords إلى Git!**

في `app/android/.gitignore` أضف:

```gitignore
# Keystore files
*.keystore
*.jks
keystore.properties
```

---

## 5️⃣ نسخ APK النهائي

```bash
# نسخ APK إلى المجلد الرئيسي
copy app\android\app\build\outputs\apk\release\app-release.apk ZyncIT-v1.0-signed.apk
```

---

## ✅ التحقق من التوقيع

للتأكد من أن APK موقّع بشكل صحيح:

```bash
# تحقق من التوقيع
keytool -printcert -jarfile ZyncIT-v1.0-signed.apk
```

يجب أن ترى:

```
Signer #1:

Signature:
Owner: CN=..., OU=..., O=..., L=..., ST=..., C=...
Issuer: CN=..., OU=..., O=..., L=..., ST=..., C=...
Serial number: ...
Valid from: ... until: ...
Certificate fingerprints:
	 SHA1: ...
	 SHA256: ...
```

---

## 🚀 الآن APK جاهز للتوزيع!

الـ APK الموقّع:

- ✅ لن يظهر تحذير Play Protect القوي
- ✅ يمكن توزيعه للعملاء
- ✅ جاهز للرفع على Play Store
- ✅ موقّع بشهادة صالحة لمدة 10,000 يوم (~27 سنة)

---

## 📝 ملاحظات مهمة

### الأمان:

1. **احفظ keystore في مكان آمن** - إذا فقدته، لن تستطيع تحديث التطبيق!
2. **لا ترفع keystore إلى Git أبداً**
3. **احفظ نسخة احتياطية من keystore**
4. **لا تشارك كلمات المرور**

### للإنتاج:

- استخدم keystore مختلف للـ Development و Production
- غيّر package name في Production
- استخدم Firebase project منفصل

### للـ Play Store:

- نفس الـ keystore مطلوب لكل تحديث
- يجب توقيع كل إصدار بنفس الشهادة
- Google قد تطلب App Bundle (AAB) بدلاً من APK

---

## 🔄 للتحديثات المستقبلية

عند إصدار نسخة جديدة:

1. عدّل `versionCode` و `versionName` في `app/build.gradle`
2. Build بنفس الطريقة: `.\gradlew assembleRelease`
3. استخدم **نفس keystore** دائماً!

---

## 🆘 حل المشاكل

### خطأ: "Keystore file not found"

```bash
# تأكد من المسار في keystore.properties
storeFile=app/zyncit-release-key.keystore  # مسار نسبي من android/
```

### خطأ: "Wrong password"

```bash
# تأكد من كلمات المرور في keystore.properties
# يجب أن تطابق ما أدخلته عند إنشاء keystore
```

### خطأ: "keytool: command not found"

```bash
# تأكد من أن Java JDK مثبت
# أو استخدم المسار الكامل:
"%JAVA_HOME%\bin\keytool" -genkeypair ...
```

---

## 📱 الخطوات النهائية

بعد إنشاء Signed APK:

1. ✅ اختبره على جهازك
2. ✅ تأكد من عدم ظهور تحذيرات قوية
3. ✅ وزعه على العملاء
4. ✅ أو ارفعه على Play Store

---

**🎉 مبروك! الآن عندك APK موقّع احترافي!**
