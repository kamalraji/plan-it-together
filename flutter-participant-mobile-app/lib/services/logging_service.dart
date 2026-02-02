import 'dart:collection';
import 'package:flutter/foundation.dart';

/// Log severity levels for structured logging.
enum LogLevel {
  debug,
  info,
  warning,
  error,
}

/// A single log entry for history/debugging.
class LogEntry {

  final DateTime timestamp;
  final LogLevel level;
  final String message;
  final String? tag;
  final Object? error;
  final StackTrace? stackTrace;
  final Map<String, dynamic>? metadata;

  const LogEntry({
    required this.timestamp,
    required this.level,
    required this.message,
    this.tag,
    this.error,
    this.stackTrace,
    this.metadata,
  });

  @override
  String toString() {
    final prefix = switch (level) {
      LogLevel.debug => '🔍',
      LogLevel.info => '✅',
      LogLevel.warning => '⚠️',
      LogLevel.error => '❌',
    };
    final tagStr = tag != null ? '[$tag] ' : '';
    return '$prefix $tagStr$message';
  }

  Map<String, dynamic> toJson() => {
    'timestamp': timestamp.toIso8601String(),
    'level': level.name,
    'message': message,
    if (tag != null) 'tag': tag,
    if (error != null) 'error': error.toString(),
    if (metadata != null) 'metadata': metadata,
  };
}

/// Log filter for querying history.
typedef LogFilter = bool Function(LogEntry entry);

/// Centralized logging service for consistent, structured logging across the app.
/// 
/// Features:
/// - Level-based filtering (debug, info, warning, error)
/// - Tag-based categorization
/// - Metadata attachment
/// - Log history with ring buffer
/// - Production crash reporting hooks
/// 
/// Usage:
/// ```dart
/// final log = LoggingService.instance;
/// log.debug('Loading data', tag: 'ChatService');
/// log.info('User logged in', tag: 'Auth');
/// log.warning('Cache miss', tag: 'Cache');
/// log.error('Failed to send message', tag: 'Chat', error: e, stackTrace: stack);
/// ```
class LoggingService {
  static LoggingService? _instance;
  static LoggingService get instance => _instance ??= LoggingService._();
  LoggingService._();

  /// Whether to include timestamps in log output.
  bool includeTimestamp = false;

  /// Minimum log level to output (default: debug in debug mode, info in release).
  LogLevel minLevel = kDebugMode ? LogLevel.debug : LogLevel.info;

  /// Maximum entries to keep in history.
  static const int _maxHistorySize = 500;

  /// Ring buffer for log history.
  final Queue<LogEntry> _history = Queue<LogEntry>();

  /// Listeners for real-time log events.
  final List<void Function(LogEntry)> _listeners = [];

  /// Production error reporter callback.
  void Function(Object error, StackTrace? stack, Map<String, dynamic>? context)? 
      onProductionError;

  /// Log a message at the specified level.
  void log(
    String message, {
    LogLevel level = LogLevel.info,
    Object? error,
    StackTrace? stackTrace,
    String? tag,
    Map<String, dynamic>? metadata,
  }) {
    if (level.index < minLevel.index) return;

    final entry = LogEntry(
      timestamp: DateTime.now(),
      level: level,
      message: message,
      tag: tag,
      error: error,
      stackTrace: stackTrace,
      metadata: metadata,
    );

    // Add to history
    _history.add(entry);
    while (_history.length > _maxHistorySize) {
      _history.removeFirst();
    }

    // Notify listeners
    for (final listener in _listeners) {
      listener(entry);
    }

    // Console output (debug mode only)
    if (kDebugMode) {
      _printToConsole(entry);
    }

    // Production error reporting
    if (level == LogLevel.error && !kDebugMode && onProductionError != null) {
      onProductionError!(
        error ?? Exception(message),
        stackTrace,
        {...?metadata, 'tag': tag, 'message': message},
      );
    }
  }

  void _printToConsole(LogEntry entry) {
    final prefix = switch (entry.level) {
      LogLevel.debug => '🔍',
      LogLevel.info => '✅',
      LogLevel.warning => '⚠️',
      LogLevel.error => '❌',
    };

    final tagStr = entry.tag != null ? '[${entry.tag}] ' : '';
    final timestamp = includeTimestamp 
        ? '[${entry.timestamp.toIso8601String()}] ' 
        : '';

    debugPrint('$prefix $timestamp$tagStr${entry.message}');
    
    if (entry.metadata != null && entry.metadata!.isNotEmpty) {
      debugPrint('   📋 Metadata: ${entry.metadata}');
    }
    
    if (entry.error != null) {
      debugPrint('   ⛔ Error: ${entry.error}');
    }
    
    if (entry.stackTrace != null && entry.level == LogLevel.error) {
      debugPrint('   📍 Stack trace:\n${entry.stackTrace}');
    }
  }

  /// Log a debug message (development only).
  void debug(String message, {String? tag, Map<String, dynamic>? metadata}) {
    log(message, level: LogLevel.debug, tag: tag, metadata: metadata);
  }

  /// Log an info message (successful operations).
  void info(String message, {String? tag, Map<String, dynamic>? metadata, Object? error}) {
    log(message, level: LogLevel.info, tag: tag, metadata: metadata);
  }

  /// Log a warning message (recoverable issues).
  void warning(
    String message, {
    String? tag,
    Object? error,
    Map<String, dynamic>? metadata,
  }) {
    log(message, level: LogLevel.warning, tag: tag, error: error, metadata: metadata);
  }
  
  /// Alias for warning (backward compatibility)
  void warn(String message, {String? tag, Object? error, Map<String, dynamic>? metadata}) {
    warning(message, tag: tag, error: error, metadata: metadata);
  }

  /// Log an error message (failures requiring attention).
  void error(
    String message, {
    String? tag,
    Object? error,
    StackTrace? stackTrace,
    Map<String, dynamic>? metadata,
  }) {
    log(
      message,
      level: LogLevel.error,
      tag: tag,
      error: error,
      stackTrace: stackTrace,
      metadata: metadata,
    );
  }

  /// Log service initialization success.
  void serviceInitialized(String serviceName) {
    info('$serviceName initialized successfully', tag: 'Init');
  }

  /// Log service initialization failure.
  void serviceInitFailed(String serviceName, Object error) {
    this.error('Failed to initialize $serviceName', tag: 'Init', error: error);
  }

  /// Log a network request.
  void networkRequest(
    String method,
    String endpoint, {
    int? statusCode,
    Duration? duration,
    String? tag,
  }) {
    final status = statusCode != null ? ' → $statusCode' : '';
    final time = duration != null ? ' (${duration.inMilliseconds}ms)' : '';
    debug('$method $endpoint$status$time', tag: tag ?? 'Network');
  }

  /// Log a database operation.
  void dbOperation(
    String operation,
    String table, {
    int? rowCount,
    Duration? duration,
    String? tag,
  }) {
    final rows = rowCount != null ? ' ($rowCount rows)' : '';
    final time = duration != null ? ' in ${duration.inMilliseconds}ms' : '';
    debug('$operation on $table$rows$time', tag: tag ?? 'Database');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HISTORY & LISTENERS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Get log history.
  List<LogEntry> get history => _history.toList();

  /// Get filtered log history.
  List<LogEntry> getHistory({
    LogLevel? minLevel,
    String? tag,
    DateTime? after,
    DateTime? before,
    int? limit,
  }) {
    Iterable<LogEntry> filtered = _history;

    if (minLevel != null) {
      filtered = filtered.where((e) => e.level.index >= minLevel.index);
    }
    if (tag != null) {
      filtered = filtered.where((e) => e.tag == tag);
    }
    if (after != null) {
      filtered = filtered.where((e) => e.timestamp.isAfter(after));
    }
    if (before != null) {
      filtered = filtered.where((e) => e.timestamp.isBefore(before));
    }

    final list = filtered.toList();
    if (limit != null && list.length > limit) {
      return list.sublist(list.length - limit);
    }
    return list;
  }

  /// Get only error logs.
  List<LogEntry> get errors => getHistory(minLevel: LogLevel.error);

  /// Clear log history.
  void clearHistory() {
    _history.clear();
  }

  /// Add a log listener.
  void addListener(void Function(LogEntry) listener) {
    _listeners.add(listener);
  }

  /// Remove a log listener.
  void removeListener(void Function(LogEntry) listener) {
    _listeners.remove(listener);
  }

  /// Export logs as JSON.
  List<Map<String, dynamic>> exportAsJson({LogFilter? filter}) {
    final entries = filter != null 
        ? _history.where(filter) 
        : _history;
    return entries.map((e) => e.toJson()).toList();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PERFORMANCE TRACKING
  // ═══════════════════════════════════════════════════════════════════════════

  final Map<String, DateTime> _timers = {};

  /// Start a named timer.
  void startTimer(String name) {
    _timers[name] = DateTime.now();
  }

  /// Stop a named timer and log the duration.
  Duration? stopTimer(String name, {String? tag, String? message}) {
    final start = _timers.remove(name);
    if (start == null) return null;

    final duration = DateTime.now().difference(start);
    debug(
      message ?? '$name completed in ${duration.inMilliseconds}ms',
      tag: tag ?? 'Perf',
      metadata: {'duration_ms': duration.inMilliseconds},
    );
    return duration;
  }

  /// Measure an async operation's duration.
  Future<T> measure<T>(
    String name,
    Future<T> Function() operation, {
    String? tag,
  }) async {
    startTimer(name);
    try {
      return await operation();
    } finally {
      stopTimer(name, tag: tag);
    }
  }

  /// Measure async operation with slow query warning threshold.
  /// Logs a warning if operation exceeds the specified threshold.
  Future<T> measureWithThreshold<T>(
    String name,
    Future<T> Function() operation, {
    String? tag,
    Duration threshold = const Duration(milliseconds: 500),
  }) async {
    final stopwatch = Stopwatch()..start();
    try {
      return await operation();
    } finally {
      stopwatch.stop();
      final elapsed = stopwatch.elapsed;
      if (elapsed > threshold) {
        warning(
          'SLOW: $name took ${stopwatch.elapsedMilliseconds}ms (threshold: ${threshold.inMilliseconds}ms)',
          tag: tag ?? 'Perf',
          metadata: {'duration_ms': stopwatch.elapsedMilliseconds, 'operation': name},
        );
      } else {
        debug(
          '$name completed in ${stopwatch.elapsedMilliseconds}ms',
          tag: tag,
          metadata: {'duration_ms': stopwatch.elapsedMilliseconds},
        );
      }
    }
  }
}

/// Global logger instance for convenience.
final log = LoggingService.instance;
