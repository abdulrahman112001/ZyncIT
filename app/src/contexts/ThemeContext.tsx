import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { I18nManager } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import {
  LIGHT_COLORS,
  DARK_COLORS,
  FONTS,
  SPACING,
  RADIUS,
} from '../constants/theme';

// Arabic translations
const AR_TRANSLATIONS = {
  // Tabs
  sms: 'الرسائل',
  calls: 'المكالمات',
  chat: 'المحادثات',
  menu: 'المزيد',

  // Menu
  account: 'الحساب',
  accountInfo: 'معلومات الحساب',
  settings: 'الإعدادات',
  privacy: 'السياسة والخصوصية',
  terms: 'شروط الاستخدام',
  about: 'لمحة عن التطبيق',
  deleteAccount: 'حذف الحساب',
  logout: 'تسجيل الخروج',

  // Settings
  notifications: 'الإشعارات',
  smsNotifications: 'إشعارات الرسائل',
  callNotifications: 'إشعارات المكالمات',
  chatNotifications: 'إشعارات الشات',
  notificationSound: 'صوت الإشعارات',
  sync: 'المزامنة',
  autoSync: 'مزامنة تلقائية',
  wifiOnly: 'WiFi فقط',
  syncInterval: 'فترة المزامنة',
  appearance: 'المظهر',
  darkMode: 'الوضع الليلي',
  language: 'اللغة',
  security: 'الأمان',
  appLock: 'قفل التطبيق',
  biometric: 'البصمة',

  // Common
  cancel: 'إلغاء',
  confirm: 'تأكيد',
  save: 'حفظ',
  delete: 'حذف',
  back: 'رجوع',
  arabic: 'العربية',
  english: 'English',

  // Time
  everyMinute: 'كل دقيقة',
  every5Minutes: 'كل 5 دقائق',
  every15Minutes: 'كل 15 دقيقة',
  every30Minutes: 'كل 30 دقيقة',
  everyHour: 'كل ساعة',
};

// English translations
const EN_TRANSLATIONS = {
  // Tabs
  sms: 'Messages',
  calls: 'Calls',
  chat: 'Chat',
  menu: 'More',

  // Menu
  account: 'Account',
  accountInfo: 'Account Info',
  settings: 'Settings',
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  about: 'About',
  deleteAccount: 'Delete Account',
  logout: 'Logout',

  // Settings
  notifications: 'Notifications',
  smsNotifications: 'SMS Notifications',
  callNotifications: 'Call Notifications',
  chatNotifications: 'Chat Notifications',
  notificationSound: 'Notification Sound',
  sync: 'Sync',
  autoSync: 'Auto Sync',
  wifiOnly: 'WiFi Only',
  syncInterval: 'Sync Interval',
  appearance: 'Appearance',
  darkMode: 'Dark Mode',
  language: 'Language',
  security: 'Security',
  appLock: 'App Lock',
  biometric: 'Biometric',

  // Common
  cancel: 'Cancel',
  confirm: 'Confirm',
  save: 'Save',
  delete: 'Delete',
  back: 'Back',
  arabic: 'العربية',
  english: 'English',

  // Time
  everyMinute: 'Every minute',
  every5Minutes: 'Every 5 minutes',
  every15Minutes: 'Every 15 minutes',
  every30Minutes: 'Every 30 minutes',
  everyHour: 'Every hour',
};

type TranslationKey = keyof typeof AR_TRANSLATIONS;

interface ThemeContextType {
  colors: typeof LIGHT_COLORS;
  fonts: typeof FONTS;
  spacing: typeof SPACING;
  radius: typeof RADIUS;
  isDarkMode: boolean;
  language: 'ar' | 'en';
  isRTL: boolean;
  t: (key: TranslationKey) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { darkMode, language } = useSettingsStore();

  useEffect(() => {
    // Handle RTL for Arabic
    const isRTL = language === 'ar';
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.allowRTL(isRTL);
      I18nManager.forceRTL(isRTL);
    }
  }, [language]);

  const value = useMemo(() => {
    const colors = darkMode ? DARK_COLORS : LIGHT_COLORS;
    const translations = language === 'ar' ? AR_TRANSLATIONS : EN_TRANSLATIONS;

    return {
      colors,
      fonts: FONTS,
      spacing: SPACING,
      radius: RADIUS,
      isDarkMode: darkMode,
      language,
      isRTL: language === 'ar',
      t: (key: TranslationKey) => translations[key] || key,
    };
  }, [darkMode, language]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return default values if not in provider
    return {
      colors: LIGHT_COLORS,
      fonts: FONTS,
      spacing: SPACING,
      radius: RADIUS,
      isDarkMode: false,
      language: 'ar',
      isRTL: true,
      t: (key: TranslationKey) => AR_TRANSLATIONS[key] || key,
    };
  }
  return context;
};

export type { TranslationKey };
