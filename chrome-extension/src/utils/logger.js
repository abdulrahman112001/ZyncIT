/**
 * ZyncIT Chrome Extension - Logger
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

class Logger {
  constructor(prefix = "ZyncIT", minLevel = "debug") {
    this.prefix = prefix
    this.minLevel = LOG_LEVELS[minLevel] ?? 0
  }

  shouldLog(level) {
    return LOG_LEVELS[level] >= this.minLevel
  }

  formatMessage(message, context) {
    const timestamp = new Date().toISOString().slice(11, 23)
    const ctx = context ? `[${context}]` : ""
    return `${timestamp} [${this.prefix}]${ctx} ${message}`
  }

  debug(message, context, ...args) {
    if (this.shouldLog("debug")) {
      console.log(`🔍 ${this.formatMessage(message, context)}`, ...args)
    }
  }

  info(message, context, ...args) {
    if (this.shouldLog("info")) {
      console.log(`ℹ️ ${this.formatMessage(message, context)}`, ...args)
    }
  }

  warn(message, context, ...args) {
    if (this.shouldLog("warn")) {
      console.warn(`⚠️ ${this.formatMessage(message, context)}`, ...args)
    }
  }

  error(message, context, error) {
    if (this.shouldLog("error")) {
      console.error(`❌ ${this.formatMessage(message, context)}`, error || "")
    }
  }

  child(context) {
    return {
      debug: (msg, ...args) => this.debug(msg, context, ...args),
      info: (msg, ...args) => this.info(msg, context, ...args),
      warn: (msg, ...args) => this.warn(msg, context, ...args),
      error: (msg, err) => this.error(msg, context, err),
    }
  }
}

// Singleton
export const logger = new Logger()

// Pre-configured loggers
export const authLogger = logger.child("Auth")
export const smsLogger = logger.child("SMS")
export const callsLogger = logger.child("Calls")
export const deviceLogger = logger.child("Device")
