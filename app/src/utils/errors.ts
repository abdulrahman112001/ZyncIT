/**
 * ZyncIT Error Handling System
 * Professional error handling with custom error classes and utilities
 */

// Error Codes
export enum ErrorCode {
  // Auth Errors
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_USER_NOT_FOUND = 'AUTH_USER_NOT_FOUND',
  AUTH_EMAIL_IN_USE = 'AUTH_EMAIL_IN_USE',
  AUTH_WEAK_PASSWORD = 'AUTH_WEAK_PASSWORD',
  AUTH_NETWORK_ERROR = 'AUTH_NETWORK_ERROR',
  AUTH_GOOGLE_CANCELLED = 'AUTH_GOOGLE_CANCELLED',
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',

  // Firebase Errors
  FIREBASE_PERMISSION_DENIED = 'FIREBASE_PERMISSION_DENIED',
  FIREBASE_NOT_FOUND = 'FIREBASE_NOT_FOUND',
  FIREBASE_QUOTA_EXCEEDED = 'FIREBASE_QUOTA_EXCEEDED',
  FIREBASE_UNAVAILABLE = 'FIREBASE_UNAVAILABLE',

  // SMS Errors
  SMS_PERMISSION_DENIED = 'SMS_PERMISSION_DENIED',
  SMS_SEND_FAILED = 'SMS_SEND_FAILED',
  SMS_INVALID_NUMBER = 'SMS_INVALID_NUMBER',
  SMS_LOAD_FAILED = 'SMS_LOAD_FAILED',

  // Device Errors
  DEVICE_REGISTRATION_FAILED = 'DEVICE_REGISTRATION_FAILED',
  DEVICE_NOT_FOUND = 'DEVICE_NOT_FOUND',

  // Network Errors
  NETWORK_OFFLINE = 'NETWORK_OFFLINE',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',

  // General Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

// Error Messages (English & Arabic)
export const ErrorMessages: Record<ErrorCode, { en: string; ar: string }> = {
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: {
    en: 'Invalid email or password',
    ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
  },
  [ErrorCode.AUTH_USER_NOT_FOUND]: {
    en: 'User not found',
    ar: 'المستخدم غير موجود',
  },
  [ErrorCode.AUTH_EMAIL_IN_USE]: {
    en: 'Email is already in use',
    ar: 'البريد الإلكتروني مستخدم بالفعل',
  },
  [ErrorCode.AUTH_WEAK_PASSWORD]: {
    en: 'Password is too weak. Use at least 6 characters',
    ar: 'كلمة المرور ضعيفة. استخدم 6 أحرف على الأقل',
  },
  [ErrorCode.AUTH_NETWORK_ERROR]: {
    en: 'Network error. Please check your connection',
    ar: 'خطأ في الشبكة. تحقق من اتصالك',
  },
  [ErrorCode.AUTH_GOOGLE_CANCELLED]: {
    en: 'Google Sign-In was cancelled',
    ar: 'تم إلغاء تسجيل الدخول بـ Google',
  },
  [ErrorCode.AUTH_SESSION_EXPIRED]: {
    en: 'Session expired. Please sign in again',
    ar: 'انتهت الجلسة. يرجى تسجيل الدخول مجدداً',
  },
  [ErrorCode.FIREBASE_PERMISSION_DENIED]: {
    en: 'Permission denied. Please try again',
    ar: 'تم رفض الإذن. حاول مرة أخرى',
  },
  [ErrorCode.FIREBASE_NOT_FOUND]: {
    en: 'Data not found',
    ar: 'البيانات غير موجودة',
  },
  [ErrorCode.FIREBASE_QUOTA_EXCEEDED]: {
    en: 'Service temporarily unavailable. Please try later',
    ar: 'الخدمة غير متاحة مؤقتاً. حاول لاحقاً',
  },
  [ErrorCode.FIREBASE_UNAVAILABLE]: {
    en: 'Service unavailable. Please try later',
    ar: 'الخدمة غير متاحة. حاول لاحقاً',
  },
  [ErrorCode.SMS_PERMISSION_DENIED]: {
    en: 'SMS permission denied. Please enable in settings',
    ar: 'تم رفض إذن الرسائل. فعّله من الإعدادات',
  },
  [ErrorCode.SMS_SEND_FAILED]: {
    en: 'Failed to send message',
    ar: 'فشل إرسال الرسالة',
  },
  [ErrorCode.SMS_INVALID_NUMBER]: {
    en: 'Invalid phone number',
    ar: 'رقم الهاتف غير صالح',
  },
  [ErrorCode.SMS_LOAD_FAILED]: {
    en: 'Failed to load messages',
    ar: 'فشل تحميل الرسائل',
  },
  [ErrorCode.DEVICE_REGISTRATION_FAILED]: {
    en: 'Failed to register device',
    ar: 'فشل تسجيل الجهاز',
  },
  [ErrorCode.DEVICE_NOT_FOUND]: {
    en: 'Device not found',
    ar: 'الجهاز غير موجود',
  },
  [ErrorCode.NETWORK_OFFLINE]: {
    en: 'No internet connection',
    ar: 'لا يوجد اتصال بالإنترنت',
  },
  [ErrorCode.NETWORK_TIMEOUT]: {
    en: 'Request timed out. Please try again',
    ar: 'انتهت مهلة الطلب. حاول مرة أخرى',
  },
  [ErrorCode.UNKNOWN_ERROR]: {
    en: 'An unexpected error occurred',
    ar: 'حدث خطأ غير متوقع',
  },
  [ErrorCode.VALIDATION_ERROR]: {
    en: 'Please check your input',
    ar: 'يرجى التحقق من المدخلات',
  },
};

/**
 * Custom App Error Class
 */
export class AppError extends Error {
  code: ErrorCode;
  originalError?: Error;
  timestamp: number;

  constructor(code: ErrorCode, originalError?: Error) {
    super(ErrorMessages[code].en);
    this.name = 'AppError';
    this.code = code;
    this.originalError = originalError;
    this.timestamp = Date.now();

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Get localized error message
   */
  getLocalizedMessage(locale: 'en' | 'ar' = 'en'): string {
    return ErrorMessages[this.code][locale];
  }

  /**
   * Convert to plain object for logging
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp,
      originalError: this.originalError?.message,
      stack: this.stack,
    };
  }
}

/**
 * Parse Firebase Auth errors
 */
export function parseFirebaseAuthError(error: any): AppError {
  const errorCode = error?.code || error?.message || '';

  if (
    errorCode.includes('auth/invalid-credential') ||
    errorCode.includes('auth/wrong-password') ||
    errorCode.includes('auth/invalid-email')
  ) {
    return new AppError(ErrorCode.AUTH_INVALID_CREDENTIALS, error);
  }

  if (errorCode.includes('auth/user-not-found')) {
    return new AppError(ErrorCode.AUTH_USER_NOT_FOUND, error);
  }

  if (errorCode.includes('auth/email-already-in-use')) {
    return new AppError(ErrorCode.AUTH_EMAIL_IN_USE, error);
  }

  if (errorCode.includes('auth/weak-password')) {
    return new AppError(ErrorCode.AUTH_WEAK_PASSWORD, error);
  }

  if (errorCode.includes('auth/network-request-failed')) {
    return new AppError(ErrorCode.AUTH_NETWORK_ERROR, error);
  }

  if (errorCode.includes('cancelled') || errorCode.includes('canceled')) {
    return new AppError(ErrorCode.AUTH_GOOGLE_CANCELLED, error);
  }

  return new AppError(ErrorCode.UNKNOWN_ERROR, error);
}

/**
 * Parse Firebase Firestore errors
 */
export function parseFirestoreError(error: any): AppError {
  const errorCode = error?.code || error?.message || '';

  if (errorCode.includes('permission-denied')) {
    return new AppError(ErrorCode.FIREBASE_PERMISSION_DENIED, error);
  }

  if (errorCode.includes('not-found')) {
    return new AppError(ErrorCode.FIREBASE_NOT_FOUND, error);
  }

  if (errorCode.includes('resource-exhausted') || errorCode.includes('quota')) {
    return new AppError(ErrorCode.FIREBASE_QUOTA_EXCEEDED, error);
  }

  if (errorCode.includes('unavailable')) {
    return new AppError(ErrorCode.FIREBASE_UNAVAILABLE, error);
  }

  return new AppError(ErrorCode.UNKNOWN_ERROR, error);
}

/**
 * Parse SMS related errors
 */
export function parseSmsError(error: any): AppError {
  const errorMessage = error?.message?.toLowerCase() || '';

  if (errorMessage.includes('permission')) {
    return new AppError(ErrorCode.SMS_PERMISSION_DENIED, error);
  }

  if (errorMessage.includes('invalid') || errorMessage.includes('number')) {
    return new AppError(ErrorCode.SMS_INVALID_NUMBER, error);
  }

  return new AppError(ErrorCode.SMS_SEND_FAILED, error);
}

/**
 * Error Logger - logs errors in development
 */
export function logError(error: AppError | Error, context?: string): void {
  if (__DEV__) {
    console.error(`[${context || 'Error'}]`, {
      name: error.name,
      message: error.message,
      ...(error instanceof AppError && { code: error.code }),
      stack: error.stack,
    });
  }

  // TODO: In production, send to crash reporting service (e.g., Crashlytics)
}

/**
 * Safely execute async function with error handling
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorParser?: (error: any) => AppError,
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (err: any) {
    const appError = errorParser
      ? errorParser(err)
      : new AppError(ErrorCode.UNKNOWN_ERROR, err);
    logError(appError);
    return { data: null, error: appError };
  }
}

/**
 * Check if error is network related
 */
export function isNetworkError(error: any): boolean {
  const message = error?.message?.toLowerCase() || '';
  return (
    message.includes('network') ||
    message.includes('offline') ||
    message.includes('internet') ||
    message.includes('connection')
  );
}
