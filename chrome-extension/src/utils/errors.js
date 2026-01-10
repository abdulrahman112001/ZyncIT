/**
 * ZyncIT Chrome Extension - Error Handling
 */

// Error Codes
export const ErrorCode = {
  // Auth
  AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
  AUTH_USER_NOT_FOUND: "AUTH_USER_NOT_FOUND",
  AUTH_EMAIL_IN_USE: "AUTH_EMAIL_IN_USE",
  AUTH_NETWORK_ERROR: "AUTH_NETWORK_ERROR",
  AUTH_GOOGLE_CANCELLED: "AUTH_GOOGLE_CANCELLED",

  // Firebase
  FIREBASE_PERMISSION_DENIED: "FIREBASE_PERMISSION_DENIED",
  FIREBASE_UNAVAILABLE: "FIREBASE_UNAVAILABLE",

  // SMS
  SMS_SEND_FAILED: "SMS_SEND_FAILED",

  // General
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  NETWORK_OFFLINE: "NETWORK_OFFLINE",
}

// Error Messages
const ErrorMessages = {
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: "Invalid email or password",
  [ErrorCode.AUTH_USER_NOT_FOUND]: "User not found",
  [ErrorCode.AUTH_EMAIL_IN_USE]: "Email is already in use",
  [ErrorCode.AUTH_NETWORK_ERROR]: "Network error. Please check your connection",
  [ErrorCode.AUTH_GOOGLE_CANCELLED]: "Google Sign-In was cancelled",
  [ErrorCode.FIREBASE_PERMISSION_DENIED]: "Permission denied",
  [ErrorCode.FIREBASE_UNAVAILABLE]: "Service unavailable. Please try later",
  [ErrorCode.SMS_SEND_FAILED]: "Failed to send message",
  [ErrorCode.UNKNOWN_ERROR]: "An unexpected error occurred",
  [ErrorCode.NETWORK_OFFLINE]: "No internet connection",
}

/**
 * Parse Firebase Auth errors
 */
export function parseAuthError(error) {
  const code = error?.code || error?.message || ""

  if (
    code.includes("auth/invalid-credential") ||
    code.includes("auth/wrong-password") ||
    code.includes("auth/invalid-email")
  ) {
    return {
      code: ErrorCode.AUTH_INVALID_CREDENTIALS,
      message: ErrorMessages[ErrorCode.AUTH_INVALID_CREDENTIALS],
    }
  }

  if (code.includes("auth/user-not-found")) {
    return {
      code: ErrorCode.AUTH_USER_NOT_FOUND,
      message: ErrorMessages[ErrorCode.AUTH_USER_NOT_FOUND],
    }
  }

  if (code.includes("auth/email-already-in-use")) {
    return {
      code: ErrorCode.AUTH_EMAIL_IN_USE,
      message: ErrorMessages[ErrorCode.AUTH_EMAIL_IN_USE],
    }
  }

  if (code.includes("auth/network")) {
    return {
      code: ErrorCode.AUTH_NETWORK_ERROR,
      message: ErrorMessages[ErrorCode.AUTH_NETWORK_ERROR],
    }
  }

  return {
    code: ErrorCode.UNKNOWN_ERROR,
    message: error?.message || ErrorMessages[ErrorCode.UNKNOWN_ERROR],
  }
}

/**
 * Parse Firestore errors
 */
export function parseFirestoreError(error) {
  const code = error?.code || error?.message || ""

  if (code.includes("permission-denied")) {
    return {
      code: ErrorCode.FIREBASE_PERMISSION_DENIED,
      message: ErrorMessages[ErrorCode.FIREBASE_PERMISSION_DENIED],
    }
  }

  if (code.includes("unavailable")) {
    return {
      code: ErrorCode.FIREBASE_UNAVAILABLE,
      message: ErrorMessages[ErrorCode.FIREBASE_UNAVAILABLE],
    }
  }

  return {
    code: ErrorCode.UNKNOWN_ERROR,
    message: error?.message || ErrorMessages[ErrorCode.UNKNOWN_ERROR],
  }
}

/**
 * Log error with context
 */
export function logError(error, context = "Error") {
  console.error(`❌ [${context}]`, {
    code: error?.code,
    message: error?.message,
    stack: error?.stack,
  })
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(code) {
  return ErrorMessages[code] || ErrorMessages[ErrorCode.UNKNOWN_ERROR]
}
