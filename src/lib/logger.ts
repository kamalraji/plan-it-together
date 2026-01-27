/**
 * Production-safe logging utility
 * Replaces console.log throughout the codebase
 * In development: logs to console
 * In production: sends errors to Sentry, suppresses debug logs
 */

import * as Sentry from '@sentry/react';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

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

const defaultConfig: LoggerConfig = {
  enableDebug: isDev,
  enableInfo: isDev,
  enableWarn: true,
  enableError: true,
  sendToSentry: isProd,
};

let config = { ...defaultConfig };

/**
 * Configure logger settings
 */
export function configureLogger(newConfig: Partial<LoggerConfig>) {
  config = { ...config, ...newConfig };
}

/**
 * Format log message with timestamp and context
 */
function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

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
 */
export const logger = {
  /**
   * Debug logs - only shown in development
   * Use for detailed debugging information
   */
  debug(message: string, context?: LogContext) {
    if (!config.enableDebug) return;
    console.log(formatMessage('debug', message, context));
  },

  /**
   * Info logs - general information
   * Use for tracking flow, state changes
   */
  info(message: string, context?: LogContext) {
    if (!config.enableInfo) return;
    console.info(formatMessage('info', message, context));
  },

  /**
   * Warning logs - potential issues
   * Use for deprecated features, recoverable errors
   */
  warn(message: string, context?: LogContext) {
    if (!config.enableWarn) return;
    console.warn(formatMessage('warn', message, context));
  },

  /**
   * Error logs - critical issues
   * Always logged, sent to Sentry in production
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    if (!config.enableError) return;

    const errorContext = {
      ...context,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    };

    console.error(formatMessage('error', message, errorContext));

    // Send to Sentry in production
    if (error instanceof Error) {
      sendToSentry(error, context);
    } else {
      sendToSentry(message, errorContext);
    }
  },

  /**
   * Group related logs together
   * Collapsed in console for cleaner output
   */
  group(label: string, fn: () => void) {
    if (!config.enableDebug) {
      fn();
      return;
    }
    console.groupCollapsed(`[DEBUG] ${label}`);
    fn();
    console.groupEnd();
  },

  /**
   * Log performance timing
   */
  time(label: string) {
    if (!config.enableDebug) return;
    console.time(`[PERF] ${label}`);
  },

  timeEnd(label: string) {
    if (!config.enableDebug) return;
    console.timeEnd(`[PERF] ${label}`);
  },

  /**
   * Log a table of data
   */
  table(data: unknown[], columns?: string[]) {
    if (!config.enableDebug) return;
    console.table(data, columns);
  },

  /**
   * Track a user action or event
   * Useful for analytics and debugging user flows
   */
  track(eventName: string, properties?: LogContext) {
    if (config.enableDebug) {
      console.log(formatMessage('info', `[TRACK] ${eventName}`, properties));
    }
    
    // In production, you might want to send to analytics
    if (isProd && config.sendToSentry) {
      Sentry.addBreadcrumb({
        category: 'user-action',
        message: eventName,
        data: properties,
        level: 'info',
      });
    }
  },

  /**
   * Log API request/response for debugging
   */
  api(method: string, url: string, status?: number, duration?: number, context?: LogContext) {
    if (!config.enableDebug) return;
    
    const statusEmoji = status && status >= 200 && status < 300 ? '✓' : '✗';
    const durationStr = duration ? ` (${duration}ms)` : '';
    
    console.log(
      formatMessage('debug', `[API] ${statusEmoji} ${method} ${url} ${status || ''}${durationStr}`, context)
    );
  },
};

// Type-safe default export
export default logger;
