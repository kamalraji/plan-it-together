import 'package:thittam1hub/services/logging_service.dart';
import 'package:thittam1hub/services/error_handler.dart';
import 'package:thittam1hub/utils/result.dart';

/// Abstract base class for all repository implementations providing standardized
/// error handling, logging, and Result<T> wrapping.
/// 
/// Industrial best practice: DRY principle for repository operations
/// with consistent error classification and user-friendly error messages.
/// 
/// ## Usage
/// 
/// Extend this class and implement the `tag` getter:
/// 
/// ```dart
/// class SupabaseUserRepository extends BaseRepository implements UserRepository {
///   @override
///   String get tag => 'UserRepository';
///   
///   @override
///   Future<Result<User>> getUser(String id) => execute(
///     () async {
///       final data = await client.from('users').select().eq('id', id).single();
///       return User.fromJson(data);
///     },
///     operationName: 'getUser',
///   );
/// }
/// ```
/// 
/// ## Key Features
/// 
/// - **Standardized error handling**: All errors are wrapped in `Result<T>`
/// - **User-friendly messages**: Technical errors mapped to readable messages
/// - **Consistent logging**: All operations logged with repository tag
/// - **Retry support**: Built-in retry logic for transient failures
abstract class BaseRepository {
  final LoggingService _log = LoggingService.instance;
  
  /// Repository tag for logging - must be overridden by subclasses
  String get tag;
  
  /// Execute an async operation with standardized error handling.
  /// 
  /// Wraps the operation in [ErrorHandler.guard] for consistent
  /// error classification and Result<T> return type.
  /// 
  /// Example:
  /// ```dart
  /// Future<Result<List<Event>>> getEvents() => execute(
  ///   () async {
  ///     final data = await client.from('events').select();
  ///     return data.map(Event.fromJson).toList();
  ///   },
  ///   operationName: 'getEvents',
  /// );
  /// ```
  Future<Result<T>> execute<T>(
    Future<T> Function() operation, {
    String? operationName,
  }) {
    final fullTag = operationName != null ? '$tag.$operationName' : tag;
    return ErrorHandler.guard(operation, tag: fullTag);
  }
  
  /// Execute an async operation with retry logic and exponential backoff.
  /// 
  /// Use for operations that may transiently fail (network, rate limits).
  /// 
  /// Example:
  /// ```dart
  /// Future<Result<void>> syncData() => executeWithRetry(
  ///   () async => await heavyNetworkOperation(),
  ///   maxAttempts: 3,
  ///   operationName: 'syncData',
  /// );
  /// ```
  Future<Result<T>> executeWithRetry<T>(
    Future<T> Function() operation, {
    int maxAttempts = 3,
    Duration initialDelay = const Duration(milliseconds: 500),
    String? operationName,
  }) {
    final fullTag = operationName != null ? '$tag.$operationName' : tag;
    return ErrorHandler.withRetry(
      operation,
      tag: fullTag,
      maxAttempts: maxAttempts,
      initialDelay: initialDelay,
    );
  }
  
  /// Execute a synchronous operation with error handling.
  Result<T> executeSync<T>(
    T Function() operation, {
    String? operationName,
  }) {
    final fullTag = operationName != null ? '$tag.$operationName' : tag;
    return ErrorHandler.guardSync(operation, tag: fullTag);
  }
  
  /// Map common error types to user-friendly messages.
  /// 
  /// Override in subclasses to add domain-specific error mappings.
  String userFriendlyMessage(dynamic error) {
    final errorString = error.toString().toLowerCase();
    
    // Network errors
    if (errorString.contains('socketexception') ||
        errorString.contains('connection refused') ||
        errorString.contains('network is unreachable') ||
        errorString.contains('connection')) {
      return 'Unable to connect. Please check your internet connection.';
    }
    
    // Timeout errors
    if (errorString.contains('timeout') ||
        errorString.contains('timed out')) {
      return 'Request timed out. Please try again.';
    }
    
    // Auth/Permission errors
    if (errorString.contains('permission denied') ||
        errorString.contains('permission') ||
        errorString.contains('unauthorized') ||
        errorString.contains('jwt') ||
        errorString.contains('rls') ||
        errorString.contains('not authenticated')) {
      return 'You don\'t have permission to perform this action.';
    }
    
    // Rate limiting
    if (errorString.contains('rate limit') ||
        errorString.contains('too many requests') ||
        errorString.contains('429') ||
        errorString.contains('limit')) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    
    // Not found errors
    if (errorString.contains('not found') ||
        errorString.contains('404') ||
        errorString.contains('does not exist')) {
      return 'The requested item was not found.';
    }
    
    // Conflict/Duplicate errors
    if (errorString.contains('duplicate') ||
        errorString.contains('already exists') ||
        errorString.contains('unique constraint') ||
        errorString.contains('unique') ||
        errorString.contains('conflict')) {
      return 'This item already exists.';
    }
    
    // Validation errors
    if (errorString.contains('invalid') ||
        errorString.contains('validation failed')) {
      return 'Invalid data provided. Please check your input.';
    }
    
    // Foreign key errors
    if (errorString.contains('foreign key')) {
      return 'Related data not found. Please refresh and try again.';
    }
    
    // Blocked user errors
    if (errorString.contains('blocked')) {
      return 'This action is not available.';
    }
    
    // Server errors
    if (errorString.contains('500') ||
        errorString.contains('internal server error')) {
      return 'Server error. Please try again later.';
    }
    
    // Default fallback
    return 'An unexpected error occurred. Please try again.';
  }
  
  /// Log a database operation with row count metrics.
  void logDbOperation(
    String operation,
    String table, {
    int? rowCount,
  }) {
    _log.dbOperation(operation, table, rowCount: rowCount, tag: tag);
  }
  
  /// Log debug information.
  void logDebug(String message, {Map<String, dynamic>? metadata}) {
    _log.debug(message, tag: tag, metadata: metadata);
  }
  
  /// Log info level message.
  void logInfo(String message, {Map<String, dynamic>? metadata}) {
    _log.info(message, tag: tag, metadata: metadata);
  }
  
  /// Log warning message.
  void logWarning(String message, {Object? error, Map<String, dynamic>? metadata}) {
    _log.warning(message, tag: tag, error: error, metadata: metadata);
  }
  
  /// Log error with optional exception and stack trace.
  void logError(
    String message, {
    Object? error,
    StackTrace? stackTrace,
    Map<String, dynamic>? metadata,
  }) {
    _log.error(message, tag: tag, error: error, stackTrace: stackTrace, metadata: metadata);
  }
}
