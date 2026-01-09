/**
 * Internationalization (i18n) module
 */

// Translation object
export const translations = {
  en: {
    nav_sms: "SMS",
    nav_calls: "Calls",
    nav_chat: "Chat",
    nav_notifications: "Notifications",
    nav_devices: "Devices",
    settings_title: "Settings",
    settings_language: "Language",
    settings_profile: "User Profile",
    settings_display_name: "Display Name",
    settings_enter_name: "Enter your name",
    settings_save: "Save",
    settings_email: "Email",
    settings_notifications: "Notifications",
    settings_sms_notif: "SMS Notifications",
    settings_call_notif: "Call Notifications",
    settings_sound: "Sound Alerts",
    settings_account: "Account",
    settings_change_password: "Change Password",
    settings_delete_account: "Delete Account",
    settings_about: "About",
    settings_tagline: "Sync your SMS and calls across all devices",
  },
  ar: {
    nav_sms: "الرسائل",
    nav_calls: "المكالمات",
    nav_chat: "المحادثة",
    nav_notifications: "الإشعارات",
    nav_devices: "الأجهزة",
    settings_title: "الإعدادات",
    settings_language: "اللغة / Language",
    settings_profile: "الملف الشخصي",
    settings_display_name: "الاسم المعروض",
    settings_enter_name: "أدخل اسمك",
    settings_save: "حفظ",
    settings_email: "البريد الإلكتروني",
    settings_notifications: "الإشعارات",
    settings_sms_notif: "إشعارات الرسائل",
    settings_call_notif: "إشعارات المكالمات",
    settings_sound: "التنبيهات الصوتية",
    settings_account: "الحساب",
    settings_change_password: "تغيير كلمة المرور",
    settings_delete_account: "حذف الحساب",
    settings_about: "حول التطبيق",
    settings_tagline: "مزامنة الرسائل والمكالمات عبر جميع الأجهزة",
  },
}

// Get current language from localStorage
let currentLanguage = localStorage.getItem("appLanguage") || "en"

/**
 * Get current language
 * @returns {string} Current language code
 */
export function getCurrentLanguage() {
  return currentLanguage
}

/**
 * Set current language
 * @param {string} lang - Language code
 */
export function setCurrentLanguage(lang) {
  currentLanguage = lang
  localStorage.setItem("appLanguage", lang)
}

/**
 * Apply translations to DOM elements
 */
export function applyTranslations() {
  const trans = translations[currentLanguage]

  document.querySelectorAll("[data-i18n]").forEach((elem) => {
    const key = elem.getAttribute("data-i18n")
    if (trans[key]) {
      elem.textContent = trans[key]
    }
  })

  document.querySelectorAll("[data-i18n-placeholder]").forEach((elem) => {
    const key = elem.getAttribute("data-i18n-placeholder")
    if (trans[key]) {
      elem.placeholder = trans[key]
    }
  })

  // Update direction
  document.body.setAttribute("dir", currentLanguage === "ar" ? "rtl" : "ltr")
}
