import 'package:thittam1hub/services/logging_service.dart';
import 'package:thittam1hub/services/error_handler.dart';
import 'package:thittam1hub/utils/result.dart';

/// Abstract base class for all services providing standardized
/// error handling, logging, and retry logic.
/// 
/// Industrial best practice: DRY principle for service operations
/// with consistent error classification and performance tracking.
abstract class BaseService {
  final LoggingService _log = LoggingService.instance;
  
  /// Service tag for logging - must be overridden by subclasses
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
  
  /// Start a performance timer for an operation.
  void startTimer(String operationId) {
    _log.startTimer('${tag}_$operationId');
  }
  
  /// Stop a performance timer and log the duration.
  Duration? stopTimer(String operationId) {
    return _log.stopTimer('${tag}_$operationId', tag: tag);
  }
  
  /// Measure the duration of an async operation.
  Future<T> measure<T>(
    String operationId,
    Future<T> Function() operation,
  ) {
    return _log.measure('${tag}_$operationId', operation, tag: tag);
  }
  
  /// Execute with performance monitoring - logs warning if operation exceeds threshold.
  /// Use for critical paths like event fetches, auth operations, chat queries.
  Future<Result<T>> executeWithMonitoring<T>(
    Future<T> Function() operation, {
    required String operationName,
    Duration threshold = const Duration(milliseconds: 500),
  }) async {
    return _log.measureWithThreshold(
      '$tag.$operationName',
      () => execute(operation, operationName: operationName),
      tag: tag,
      threshold: threshold,
    );
  }
}

/// Mixin for services that need request deduplication.
/// Prevents concurrent identical requests from creating duplicate API calls.
mixin RequestDeduplicationMixin on BaseService {
  final Map<String, Future<dynamic>> _pendingRequests = {};

  /// Execute operation with deduplication.
  /// If an identical request is already in flight, return its result.
  Future<Result<T>> executeDeduped<T>(
    String requestKey,
    Future<T> Function() operation, {
    String? operationName,
  }) async {
    // Return existing request if pending
    if (_pendingRequests.containsKey(requestKey)) {
      logDebug('Request deduped: $requestKey');
      try {
        final pending = await _pendingRequests[requestKey];
        return Success(pending as T);
      } catch (e) {
        return Failure('Deduped request failed', e);
      }
    }

    // Execute and track
    final future = execute(operation, operationName: operationName);
    _pendingRequests[requestKey] = future.then((r) {
      if (r is Success<T>) return r.data;
      throw Exception('Operation failed');
    });

    try {
      return await future;
    } finally {
      _pendingRequests.remove(requestKey);
    }
  }
  
  /// Clear all pending requests (use on dispose)
  void clearPendingRequests() {
    _pendingRequests.clear();
  }
}

/// Mixin for services that need caching capabilities.
mixin CachingServiceMixin on BaseService {
  final Map<String, dynamic> _cache = {};
  final Map<String, DateTime> _cacheTimestamps = {};
  
  /// Default cache TTL - can be overridden per operation.
  Duration get defaultCacheTtl => const Duration(minutes: 5);
  
  /// Get cached value if valid, otherwise execute operation and cache result.
  Future<Result<T>> withCache<T>(
    String cacheKey,
    Future<T> Function() operation, {
    Duration? ttl,
    String? operationName,
  }) async {
    final effectiveTtl = ttl ?? defaultCacheTtl;
    
    // Check cache validity
    if (_cache.containsKey(cacheKey)) {
      final timestamp = _cacheTimestamps[cacheKey];
      if (timestamp != null && 
          DateTime.now().difference(timestamp) < effectiveTtl) {
        logDebug('Cache hit: $cacheKey');
        return Success(_cache[cacheKey] as T);
      }
    }
    
    // Execute and cache
    final result = await execute(operation, operationName: operationName);
    
    if (result is Success<T>) {
      _cache[cacheKey] = result.data;
      _cacheTimestamps[cacheKey] = DateTime.now();
      logDebug('Cache updated: $cacheKey');
    }
    
    return result;
  }
  
  /// Invalidate a specific cache entry.
  void invalidateCache(String cacheKey) {
    _cache.remove(cacheKey);
    _cacheTimestamps.remove(cacheKey);
    logDebug('Cache invalidated: $cacheKey');
  }
  
  /// Clear all cached data.
  void clearAllCache() {
    _cache.clear();
    _cacheTimestamps.clear();
    logDebug('All cache cleared');
  }
  
  /// Check if a cache key exists and is valid.
  bool isCacheValid(String cacheKey, {Duration? ttl}) {
    if (!_cache.containsKey(cacheKey)) return false;
    
    final timestamp = _cacheTimestamps[cacheKey];
    if (timestamp == null) return false;
    
    final effectiveTtl = ttl ?? defaultCacheTtl;
    return DateTime.now().difference(timestamp) < effectiveTtl;
  }
}
