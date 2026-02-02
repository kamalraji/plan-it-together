import 'package:flutter/foundation.dart';
import 'package:thittam1hub/services/logging_service.dart';

/// Mixin that provides standardized logging methods for ChangeNotifier classes.
/// 
/// This mixin is used when a class cannot extend BaseService (e.g., UI controllers
/// that extend ChangeNotifier). It provides consistent log tagging and formatting.
/// 
/// Usage:
/// ```dart
/// class MyController extends ChangeNotifier with LoggingMixin {
///   @override
///   String get tag => 'MyController';
///   
///   void doSomething() {
///     logInfo('Starting operation');
///     // ...
///   }
/// }
/// ```
mixin LoggingMixin on ChangeNotifier {
  /// Tag for log messages - override in implementing class
  String get tag;
  
  final LoggingService _log = LoggingService.instance;

  /// Log a debug message
  void logDebug(String message, {Map<String, dynamic>? metadata}) {
    _log.debug(message, tag: tag, metadata: metadata);
  }

  /// Log an info message
  void logInfo(String message, {Map<String, dynamic>? metadata}) {
    _log.info(message, tag: tag, metadata: metadata);
  }

  /// Log a warning message
  void logWarning(String message, {Object? error, Map<String, dynamic>? metadata}) {
    _log.warning(message, tag: tag, error: error, metadata: metadata);
  }

  /// Log an error message
  void logError(
    String message, {
    Object? error,
    StackTrace? stackTrace,
    Map<String, dynamic>? metadata,
  }) {
    _log.error(
      message,
      tag: tag,
      error: error,
      stackTrace: stackTrace,
      metadata: metadata,
    );
  }

  /// Log a database operation
  void logDbOperation(
    String operation,
    String table, {
    int? rowCount,
    Duration? duration,
  }) {
    _log.dbOperation(operation, table, rowCount: rowCount, duration: duration, tag: tag);
  }
}
