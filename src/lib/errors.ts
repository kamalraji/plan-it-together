/**
 * Centralized error handling utilities
 * Provides consistent error types and handling across the application
 */

import { logger } from './logger';

/**
 * Error codes for categorizing errors
 */
export enum ErrorCode {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // Database errors
  QUERY_ERROR = 'QUERY_ERROR',
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  RLS_VIOLATION = 'RLS_VIOLATION',
  
  // Business logic errors
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // Unknown
  UNKNOWN = 'UNKNOWN',
}

/**
 * HTTP status codes mapped to error codes
 */
const HTTP_STATUS_TO_CODE: Record<number, ErrorCode> = {
  400: ErrorCode.VALIDATION_ERROR,
  401: ErrorCode.UNAUTHORIZED,
  403: ErrorCode.FORBIDDEN,
  404: ErrorCode.NOT_FOUND,
  409: ErrorCode.CONFLICT,
  422: ErrorCode.INVALID_INPUT,
  429: ErrorCode.QUOTA_EXCEEDED,
  500: ErrorCode.UNKNOWN,
};

/**
 * Application-specific error class
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly context?: Record<string, unknown>;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN,
    statusCode: number = 500,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    this.isOperational = true; // Distinguishes from programming errors

    // Maintains proper stack trace
    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
    };
  }
}

/**
 * Create an AppError from a Supabase error
 */
export function fromSupabaseError(
  error: { message?: string; code?: string; details?: string; hint?: string },
  context?: Record<string, unknown>
): AppError {
  const message = error.message || 'Database operation failed';
  
  // Check for RLS violations
  if (error.code === '42501' || message.includes('row-level security')) {
    return new AppError(
      'You do not have permission to perform this action',
      ErrorCode.RLS_VIOLATION,
      403,
      { ...context, originalError: error }
    );
  }

  // Check for constraint violations
  if (error.code === '23505') {
    return new AppError(
      'This record already exists',
      ErrorCode.ALREADY_EXISTS,
      409,
      { ...context, originalError: error }
    );
  }

  return new AppError(
    message,
    ErrorCode.QUERY_ERROR,
    500,
    { ...context, originalError: error }
  );
}

/**
 * Create an AppError from an HTTP response
 */
export function fromHttpError(
  status: number,
  message?: string,
  context?: Record<string, unknown>
): AppError {
  const code = HTTP_STATUS_TO_CODE[status] || ErrorCode.UNKNOWN;
  return new AppError(
    message || `Request failed with status ${status}`,
    code,
    status,
    context
  );
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Handle and log an error, returning a standardized AppError
 */
export function handleError(
  error: unknown,
  context: string,
  additionalContext?: Record<string, unknown>
): AppError {
  // Already an AppError
  if (isAppError(error)) {
    logger.error(`${context}: ${error.message}`, error, {
      code: error.code,
      ...error.context,
      ...additionalContext,
    });
    return error;
  }

  // Standard Error
  if (error instanceof Error) {
    logger.error(`${context}: ${error.message}`, error, additionalContext);
    return new AppError(error.message, ErrorCode.UNKNOWN, 500, additionalContext);
  }

  // Unknown error type
  const message = typeof error === 'string' ? error : 'An unknown error occurred';
  logger.error(`${context}: ${message}`, undefined, additionalContext);
  return new AppError(message, ErrorCode.UNKNOWN, 500, additionalContext);
}

/**
 * Safe async wrapper that catches and handles errors
 */
export async function trySafe<T>(
  fn: () => Promise<T>,
  context: string,
  additionalContext?: Record<string, unknown>
): Promise<[T, null] | [null, AppError]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (error) {
    return [null, handleError(error, context, additionalContext)];
  }
}

/**
 * Get user-friendly error message
 */
export function getUserMessage(error: unknown): string {
  if (isAppError(error)) {
    switch (error.code) {
      case ErrorCode.NETWORK_ERROR:
        return 'Unable to connect. Please check your internet connection.';
      case ErrorCode.UNAUTHORIZED:
      case ErrorCode.SESSION_EXPIRED:
        return 'Your session has expired. Please sign in again.';
      case ErrorCode.FORBIDDEN:
      case ErrorCode.RLS_VIOLATION:
      case ErrorCode.INSUFFICIENT_PERMISSIONS:
        return 'You do not have permission to perform this action.';
      case ErrorCode.NOT_FOUND:
        return 'The requested resource was not found.';
      case ErrorCode.VALIDATION_ERROR:
      case ErrorCode.INVALID_INPUT:
        return error.message; // Validation messages are usually user-friendly
      case ErrorCode.ALREADY_EXISTS:
        return 'This record already exists.';
      case ErrorCode.QUOTA_EXCEEDED:
        return 'Rate limit exceeded. Please try again later.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}
