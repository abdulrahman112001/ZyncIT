/**
 * ZyncIT Logger
 * Centralized logging with levels and formatting
 */

import Config from 'react-native-config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private minLevel: number;
  private prefix: string;

  constructor(prefix: string = 'ZyncIT') {
    this.prefix = prefix;
    const configLevel = (Config.LOG_LEVEL as LogLevel) || 'debug';
    this.minLevel = LOG_LEVELS[configLevel] ?? 0;
  }

  private shouldLog(level: LogLevel): boolean {
    return __DEV__ && LOG_LEVELS[level] >= this.minLevel;
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: string,
  ): string {
    const timestamp = new Date().toISOString().slice(11, 23);
    const ctx = context ? `[${context}]` : '';
    return `${timestamp} [${this.prefix}]${ctx} ${message}`;
  }

  debug(message: string, context?: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(
        `🔍 ${this.formatMessage('debug', message, context)}`,
        ...args,
      );
    }
  }

  info(message: string, context?: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log(
        `ℹ️ ${this.formatMessage('info', message, context)}`,
        ...args,
      );
    }
  }

  warn(message: string, context?: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(
        `⚠️ ${this.formatMessage('warn', message, context)}`,
        ...args,
      );
    }
  }

  error(message: string, context?: string, error?: any): void {
    if (this.shouldLog('error')) {
      console.error(
        `❌ ${this.formatMessage('error', message, context)}`,
        error || '',
      );
    }
  }

  /**
   * Create a child logger with a specific context
   */
  child(context: string): ContextLogger {
    return new ContextLogger(this, context);
  }
}

class ContextLogger {
  private parent: Logger;
  private context: string;

  constructor(parent: Logger, context: string) {
    this.parent = parent;
    this.context = context;
  }

  debug(message: string, ...args: any[]): void {
    this.parent.debug(message, this.context, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.parent.info(message, this.context, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.parent.warn(message, this.context, ...args);
  }

  error(message: string, error?: any): void {
    this.parent.error(message, this.context, error);
  }
}

// Singleton instance
export const logger = new Logger();

// Pre-configured loggers for common contexts
export const authLogger = logger.child('Auth');
export const smsLogger = logger.child('SMS');
export const callLogger = logger.child('Calls');
export const deviceLogger = logger.child('Device');
export const firebaseLogger = logger.child('Firebase');
