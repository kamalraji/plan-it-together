import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'logging_service.dart';
import '../utils/result.dart';

/// Categorized error types for consistent handling across the app.
enum ErrorCategory {
  /// Row Level Security policy violations
  rls,
  /// Network connectivity issues (no internet, timeout, DNS)
  network,
  
  /// Authentication failures (token expired, unauthorized)
  authentication,
  
  /// Authorization failures (permission denied, access forbidden)
  authorization,
  
  /// Resource not found (404, missing data)
  notFound,
  
  /// Validation errors (invalid input, constraint violations)
  validation,
  
  /// Rate limiting (too many requests)
  rateLimit,
  
  /// Server errors (500+, service unavailable)
  server,
  
  /// Local storage errors (database, cache, file system)
  storage,
  
  /// Unknown/unclassified errors
  unknown,
}

/// Structured application error with context and recovery hints.
class AppError implements Exception {
  final String message;
  final String? userMessage;
  final ErrorCategory category;
  final dynamic originalError;
  final StackTrace? stackTrace;
  final String? recoveryHint;
  final Map<String, dynamic>? context;
  final bool isRetryable;

  const AppError({
    required this.message,
    this.userMessage,
    this.category = ErrorCategory.unknown,
    this.originalError,
    this.stackTrace,
    this.recoveryHint,
    this.context,
    this.isRetryable = false,
  });

  /// User-facing message (falls back to technical message in debug mode).
  String get displayMessage => userMessage ?? (kDebugMode ? message : 'Something went wrong');

  /// Whether this error can be retried.
  bool get canRetry => isRetryable && category != ErrorCategory.authentication;

  @override
  String toString() => 'AppError($category): $message';

  /// Create a network error.
  factory AppError.network({
    String message = 'Network request failed',
    dynamic error,
    StackTrace? stackTrace,
  }) => AppError(
    message: message,
    userMessage: 'Please check your internet connection and try again.',
    category: ErrorCategory.network,
    originalError: error,
    stackTrace: stackTrace,
    recoveryHint: 'Check Wi-Fi or mobile data connection',
    isRetryable: true,
  );

  /// Create an authentication error.
  factory AppError.auth({
    String message = 'Authentication failed',
    dynamic error,
    StackTrace? stackTrace,
  }) => AppError(
    message: message,
    userMessage: 'Please sign in again to continue.',
    category: ErrorCategory.authentication,
    originalError: error,
    stackTrace: stackTrace,
    recoveryHint: 'Sign out and sign in again',
    isRetryable: false,
  );

  /// Create an authorization error.
  factory AppError.forbidden({
    String message = 'Access denied',
    dynamic error,
    StackTrace? stackTrace,
  }) => AppError(
    message: message,
    userMessage: 'You don\'t have permission for this action.',
    category: ErrorCategory.authorization,
    originalError: error,
    stackTrace: stackTrace,
    isRetryable: false,
  );

  /// Create a not found error.
  factory AppError.notFound({
    String message = 'Resource not found',
    String? resourceType,
    dynamic error,
    StackTrace? stackTrace,
  }) => AppError(
    message: message,
    userMessage: resourceType != null 
        ? 'The $resourceType you\'re looking for doesn\'t exist.'
        : 'The item you\'re looking for doesn\'t exist.',
    category: ErrorCategory.notFound,
    originalError: error,
    stackTrace: stackTrace,
    context: resourceType != null ? {'resourceType': resourceType} : null,
    isRetryable: false,
  );

  /// Create a validation error.
  factory AppError.validation({
    required String message,
    String? field,
    dynamic error,
  }) => AppError(
    message: message,
    userMessage: message,
    category: ErrorCategory.validation,
    originalError: error,
    context: field != null ? {'field': field} : null,
    isRetryable: false,
  );

  /// Create a rate limit error.
  factory AppError.rateLimit({
    String message = 'Too many requests',
    Duration? retryAfter,
    dynamic error,
  }) => AppError(
    message: message,
    userMessage: retryAfter != null
        ? 'Please wait ${retryAfter.inSeconds} seconds before trying again.'
        : 'You\'re doing that too fast. Please slow down.',
    category: ErrorCategory.rateLimit,
    originalError: error,
    context: retryAfter != null ? {'retryAfterSeconds': retryAfter.inSeconds} : null,
    isRetryable: true,
  );

  /// Create a server error.
  factory AppError.server({
    String message = 'Server error',
    int? statusCode,
    dynamic error,
    StackTrace? stackTrace,
  }) => AppError(
    message: message,
    userMessage: 'Our servers are having trouble. Please try again later.',
    category: ErrorCategory.server,
    originalError: error,
    stackTrace: stackTrace,
    context: statusCode != null ? {'statusCode': statusCode} : null,
    recoveryHint: 'Wait a moment and try again',
    isRetryable: true,
  );

  /// Create a storage error.
  factory AppError.storage({
    String message = 'Storage error',
    dynamic error,
    StackTrace? stackTrace,
  }) => AppError(
    message: message,
    userMessage: 'There was a problem saving data locally.',
    category: ErrorCategory.storage,
    originalError: error,
    stackTrace: stackTrace,
    recoveryHint: 'Clear app cache and try again',
    isRetryable: true,
  );
}

/// Centralized error handler for consistent error processing.
/// 
/// Usage:
/// ```dart
/// final result = await ErrorHandler.guard(
///   () => someAsyncOperation(),
///   tag: 'MyService',
///   onError: (e) => showSnackBar(e.displayMessage),
/// );
/// ```
class ErrorHandler {
  static final _log = LoggingService.instance;
  
  /// Maps raw errors to [AppError] with appropriate category and messaging.
  /// 
  /// Enhanced to detect Supabase/PostgREST specific errors including
  /// RLS violations, constraint failures, and database errors.
  static AppError classify(dynamic error, [StackTrace? stackTrace]) {
    // Handle PostgrestException specifically for better diagnostics
    if (error is PostgrestException) {
      return _classifyPostgrestError(error, stackTrace);
    }
    
    // Handle AuthException
    if (error is AuthException) {
      return AppError.auth(
        message: error.message,
        error: error,
        stackTrace: stackTrace,
      );
    }
    
    final msg = error.toString().toLowerCase();
    
    // RLS-specific patterns (Supabase/Postgres)
    if (msg.contains('row level security') ||
        msg.contains('rls') ||
        msg.contains('violates row-level security') ||
        msg.contains('new row violates')) {
      return AppError(
        message: 'Row Level Security policy violation',
        userMessage: 'You don\'t have permission to access this data.',
        category: ErrorCategory.rls,
        originalError: error,
        stackTrace: stackTrace,
        isRetryable: false,
      );
    }
    
    // Network errors
    if (msg.contains('socket') || 
        msg.contains('network') || 
        msg.contains('connection refused') ||
        msg.contains('no internet') ||
        msg.contains('unreachable') ||
        msg.contains('dns')) {
      return AppError.network(error: error, stackTrace: stackTrace);
    }
    
    // Timeout errors
    if (msg.contains('timeout') || msg.contains('timed out')) {
      return AppError.network(
        message: 'Request timed out',
        error: error,
        stackTrace: stackTrace,
      );
    }
    
    // Authentication errors
    if (msg.contains('unauthenticated') || 
        msg.contains('not authenticated') ||
        msg.contains('jwt') ||
        msg.contains('token expired') ||
        msg.contains('invalid token') ||
        msg.contains('session expired')) {
      return AppError.auth(error: error, stackTrace: stackTrace);
    }
    
    // Authorization errors
    if (msg.contains('unauthorized') || 
        msg.contains('forbidden') || 
        msg.contains('permission denied') ||
        msg.contains('access denied') ||
        msg.contains('403')) {
      return AppError.forbidden(error: error, stackTrace: stackTrace);
    }
    
    // Not found errors
    if (msg.contains('not found') || 
        msg.contains('404') ||
        msg.contains('does not exist')) {
      return AppError.notFound(error: error, stackTrace: stackTrace);
    }
    
    // Rate limiting
    if (msg.contains('rate limit') || 
        msg.contains('too many requests') ||
        msg.contains('429')) {
      return AppError.rateLimit(error: error);
    }
    
    // Server errors
    if (msg.contains('500') || 
        msg.contains('502') || 
        msg.contains('503') ||
        msg.contains('504') ||
        msg.contains('server error') ||
        msg.contains('internal error') ||
        msg.contains('service unavailable')) {
      return AppError.server(error: error, stackTrace: stackTrace);
    }
    
    // Storage/database errors
    if (msg.contains('sqlite') || 
        msg.contains('database') ||
        msg.contains('disk') ||
        msg.contains('storage')) {
      return AppError.storage(error: error, stackTrace: stackTrace);
    }
    
    // Default: unknown error
    return AppError(
      message: error.toString(),
      category: ErrorCategory.unknown,
      originalError: error,
      stackTrace: stackTrace,
      isRetryable: true,
    );
  }
  
  /// Classify PostgrestException with detailed context for debugging.
  static AppError _classifyPostgrestError(PostgrestException error, [StackTrace? stackTrace]) {
    final code = error.code;
    final message = error.message.toLowerCase();
    final details = error.details?.toString().toLowerCase() ?? '';
    final hint = error.hint?.toLowerCase() ?? '';
    
    // Log full error details in debug mode
    if (kDebugMode) {
      _log.error(
        'PostgrestException: ${error.message}',
        metadata: {
          'code': code,
          'details': error.details,
          'hint': error.hint,
        },
      );
    }
    
    // RLS violations (code 42501 or message patterns)
    if (code == '42501' || 
        message.contains('row level security') ||
        message.contains('rls') ||
        message.contains('violates row-level security') ||
        message.contains('new row violates') ||
        message.contains('insufficient privilege')) {
      return AppError(
        message: 'RLS Policy Violation: ${error.message}',
        userMessage: kDebugMode 
            ? 'RLS Error: ${error.message}'
            : 'Permission denied. Please try again.',
        category: ErrorCategory.rls,
        originalError: error,
        stackTrace: stackTrace,
        context: {
          'code': code,
          'details': error.details,
          'hint': error.hint,
        },
        isRetryable: false,
      );
    }
    
    // Foreign key violations (23503)
    if (code == '23503') {
      return AppError.validation(
        message: 'Referenced record does not exist: ${error.message}',
        error: error,
      );
    }
    
    // Unique constraint violations (23505)
    if (code == '23505') {
      return AppError.validation(
        message: 'Duplicate entry: ${error.message}',
        error: error,
      );
    }
    
    // Check constraint violations (23514)
    if (code == '23514') {
      return AppError.validation(
        message: 'Validation failed: ${error.message}',
        error: error,
      );
    }
    
    // Not null violations (23502)
    if (code == '23502') {
      return AppError.validation(
        message: 'Required field missing: ${error.message}',
        error: error,
      );
    }
    
    // No rows returned (PGRST116)
    if (code == 'PGRST116' || message.contains('0 rows')) {
      return AppError.notFound(
        message: 'No data found: ${error.message}',
        error: error,
        stackTrace: stackTrace,
      );
    }
    
    // Authentication required
    if (message.contains('jwt') || message.contains('auth')) {
      return AppError.auth(
        message: error.message,
        error: error,
        stackTrace: stackTrace,
      );
    }
    
    // Default Postgrest error
    return AppError(
      message: error.message,
      userMessage: kDebugMode 
          ? 'DB Error [$code]: ${error.message}'
          : 'Something went wrong. Please try again.',
      category: ErrorCategory.unknown,
      originalError: error,
      stackTrace: stackTrace,
      context: {
        'code': code,
        'details': error.details,
        'hint': error.hint,
      },
      isRetryable: false,
    );
  }
  
  /// Wraps an async operation with error classification and logging.
  /// 
  /// Returns [Result.Success] on success, [Result.Failure] on error.
  static Future<Result<T>> guard<T>(
    Future<T> Function() operation, {
    String? tag,
    void Function(AppError error)? onError,
    T Function(AppError error)? fallback,
  }) async {
    try {
      final result = await operation();
      return Success(result);
    } catch (e, stack) {
      final appError = classify(e, stack);
      
      _log.error(
        appError.message,
        tag: tag,
        error: appError.originalError,
        stackTrace: stack,
        metadata: appError.context,
      );
      
      onError?.call(appError);
      
      if (fallback != null) {
        return Success(fallback(appError));
      }
      
      return Failure(appError.displayMessage, appError);
    }
  }
  
  /// Wraps a sync operation with error classification and logging.
  static Result<T> guardSync<T>(
    T Function() operation, {
    String? tag,
    void Function(AppError error)? onError,
    T Function(AppError error)? fallback,
  }) {
    try {
      final result = operation();
      return Success(result);
    } catch (e, stack) {
      final appError = classify(e, stack);
      
      _log.error(
        appError.message,
        tag: tag,
        error: appError.originalError,
        stackTrace: stack,
        metadata: appError.context,
      );
      
      onError?.call(appError);
      
      if (fallback != null) {
        return Success(fallback(appError));
      }
      
      return Failure(appError.displayMessage, appError);
    }
  }
  
  /// Logs an error without wrapping in Result.
  static void logError(
    dynamic error, {
    String? message,
    String? tag,
    StackTrace? stackTrace,
    Map<String, dynamic>? context,
  }) {
    final appError = classify(error, stackTrace);
    
    _log.error(
      message ?? appError.message,
      tag: tag,
      error: error,
      stackTrace: stackTrace,
      metadata: {...?appError.context, ...?context},
    );
  }
  
  /// Retries an operation with exponential backoff.
  static Future<Result<T>> withRetry<T>(
    Future<T> Function() operation, {
    int maxAttempts = 3,
    Duration initialDelay = const Duration(milliseconds: 500),
    String? tag,
    bool Function(dynamic error)? shouldRetry,
  }) async {
    int attempt = 0;
    Duration delay = initialDelay;
    
    while (attempt < maxAttempts) {
      attempt++;
      
      try {
        final result = await operation();
        return Success(result);
      } catch (e, stack) {
        final appError = classify(e, stack);
        
        // Check if we should retry
        final canRetry = shouldRetry?.call(e) ?? appError.isRetryable;
        
        if (!canRetry || attempt >= maxAttempts) {
          _log.error(
            'Operation failed after $attempt attempts: ${appError.message}',
            tag: tag,
            error: e,
            stackTrace: stack,
          );
          return Failure(appError.displayMessage, appError);
        }
        
        _log.warning(
          'Attempt $attempt failed, retrying in ${delay.inMilliseconds}ms',
          tag: tag,
          error: e,
        );
        
        await Future.delayed(delay);
        delay *= 2; // Exponential backoff
      }
    }
    
    // Should never reach here, but compiler needs it
    return const Failure('Max retry attempts exceeded');
  }
  
  /// Gets user-friendly message for an error.
  static String userMessage(dynamic error) {
    if (error is AppError) return error.displayMessage;
    return classify(error).displayMessage;
  }
}

/// Extension to easily convert exceptions to AppError.
extension ExceptionToAppError on Exception {
  AppError toAppError([StackTrace? stackTrace]) {
    return ErrorHandler.classify(this, stackTrace);
  }
}
