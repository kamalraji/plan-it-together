import 'package:flutter/foundation.dart';
import 'package:thittam1hub/services/logging_service.dart';

/// A mixin that provides standardized logging for ChangeNotifier classes.
/// 
/// Since ChangeNotifier classes cannot extend BaseService, this mixin provides
/// the same logging interface for consistency across the codebase.
/// 
/// Usage:
/// ```dart
/// class MyService extends ChangeNotifier with LoggingMixin {
///   @override
///   String get logTag => 'MyService';
///   
///   void doSomething() {
///     logInfo('Doing something');
///   }
/// }
/// ```
mixin LoggingMixin on ChangeNotifier {
  /// The tag used for log messages. Must be overridden by implementing classes.
  String get logTag;
  
  /// Access to the logging service instance
  LoggingService get _log => LoggingService.instance;

  /// Log a debug message
  @protected
  void logDebug(String message, {Map<String, dynamic>? metadata}) {
    _log.debug(message, tag: logTag, metadata: metadata);
  }

  /// Log an info message
  @protected
  void logInfo(String message, {Map<String, dynamic>? metadata}) {
    _log.info(message, tag: logTag, metadata: metadata);
  }

  /// Log a warning message
  @protected
  void logWarning(String message, {Object? error, Map<String, dynamic>? metadata}) {
    _log.warning(message, tag: logTag, error: error, metadata: metadata);
  }

  /// Log an error message
  @protected
  void logError(String message, {Object? error, StackTrace? stackTrace, Map<String, dynamic>? metadata}) {
    _log.error(message, tag: logTag, error: error, stackTrace: stackTrace, metadata: metadata);
  }

  /// Log a database operation
  @protected
  void logDbOperation(String operation, String table, {int? rowCount}) {
    _log.dbOperation(operation, table, rowCount: rowCount, tag: logTag);
  }
}
