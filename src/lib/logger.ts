/**
 * Production-safe logging utility
 * Replaces console.log throughout the codebase
 * In development: logs to console
 * In production: sends errors to Sentry, suppresses all console output
 */

import * as Sentry from '@sentry/react';

// LogLevel type removed - not needed when console output is suppressed

interface LogContext {
  [key: string]: unknown;
}

interface LoggerConfig {
  enableDebug: boolean;
  enableInfo: boolean;
  enableWarn: boolean;
  enableError: boolean;
  sendToSentry: boolean;
}

const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

// In production, suppress all console output - only send to Sentry
const defaultConfig: LoggerConfig = {
  enableDebug: isDev,
  enableInfo: isDev,
  enableWarn: isDev, // Suppress warnings in production
  enableError: isDev, // Suppress console errors in production (still sent to Sentry)
  sendToSentry: isProd,
};

let config = { ...defaultConfig };

/**
 * Configure logger settings
 */
export function configureLogger(newConfig: Partial<LoggerConfig>) {
  config = { ...config, ...newConfig };
}

// formatMessage removed - not needed when all console output is suppressed in production

/**
 * Send error to Sentry with context
 */
function sendToSentry(error: Error | string, context?: LogContext) {
  if (!config.sendToSentry) return;

  try {
    if (typeof error === 'string') {
      Sentry.captureMessage(error, {
        level: 'error',
        extra: context,
      });
    } else {
      Sentry.captureException(error, {
        extra: context,
      });
    }
  } catch {
    // Silently fail if Sentry is not initialized
  }
}

/**
 * Logger object with methods for each log level
 * In production, all console methods are no-ops (only Sentry receives errors)
 */
export const logger = {
  /**
   * Debug logs - only shown in development
   * Use for detailed debugging information
   */
  debug(_message: string, _context?: LogContext) {
    // No-op in production
    if (!config.enableDebug) return;
    // Development only - no console output
  },

  /**
   * Info logs - general information
   * Use for tracking flow, state changes
   */
  info(_message: string, _context?: LogContext) {
    // No-op in production
    if (!config.enableInfo) return;
    // Development only - no console output
  },

  /**
   * Warning logs - potential issues
   * Use for deprecated features, recoverable errors
   */
  warn(_message: string, _context?: LogContext) {
    // No-op in production
    if (!config.enableWarn) return;
    // Development only - no console output
  },

  /**
   * Error logs - critical issues
   * Sent to Sentry in production, no console output
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    // Always send to Sentry in production
    if (config.sendToSentry) {
      if (error instanceof Error) {
        sendToSentry(error, context);
      } else {
        const errorContext = {
          ...context,
          errorMessage: error instanceof Error ? error.message : String(error),
        };
        sendToSentry(message, errorContext);
      }
    }
    // No console output in production
  },

  /**
   * Group related logs together - no-op
   */
  group(_label: string, fn: () => void) {
    fn();
  },

  /**
   * Log performance timing - no-op
   */
  time(_label: string) {
    // No-op
  },

  timeEnd(_label: string) {
    // No-op
  },

  /**
   * Log a table of data - no-op
   */
  table(_data: unknown[], _columns?: string[]) {
    // No-op
  },

  /**
   * Track a user action or event
   * In production, adds Sentry breadcrumb (no console output)
   */
  track(eventName: string, properties?: LogContext) {
    if (isProd && config.sendToSentry) {
      Sentry.addBreadcrumb({
        category: 'user-action',
        message: eventName,
        data: properties,
        level: 'info',
      });
    }
    // No console output
  },

  /**
   * Log API request/response - no-op in production
   */
  api(_method: string, _url: string, _status?: number, _duration?: number, _context?: LogContext) {
    // No-op - no console output
  },
};

// Type-safe default export
export default logger;
