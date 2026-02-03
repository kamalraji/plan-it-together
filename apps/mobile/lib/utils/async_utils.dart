import 'dart:async';
import 'package:flutter/foundation.dart';
import '../services/logging_service.dart';
import '../utils/result.dart';

/// Async operation wrapper with timeout, retry, and cancellation support.
/// 
/// Usage:
/// ```dart
/// final result = await AsyncOperation.run(
///   () => api.fetchData(),
///   timeout: Duration(seconds: 30),
///   retries: 3,
///   tag: 'DataService',
/// );
/// ```
class AsyncOperation {
  static final _log = LoggingService.instance;

  /// Runs an async operation with timeout support.
  static Future<Result<T>> run<T>(
    Future<T> Function() operation, {
    Duration timeout = const Duration(seconds: 30),
    String? tag,
    String? timeoutMessage,
  }) async {
    try {
      final result = await operation().timeout(timeout);
      return Success(result);
    } on TimeoutException {
      _log.warning('Operation timed out after ${timeout.inSeconds}s', tag: tag);
      return Failure(
        timeoutMessage ?? 'Request timed out. Please try again.',
        TimeoutException('Operation timed out', timeout),
      );
    } catch (e, stack) {
      _log.error('Operation failed', tag: tag, error: e, stackTrace: stack);
      return Failure(_userFriendlyMessage(e), e);
    }
  }

  /// Runs an async operation with retry logic.
  static Future<Result<T>> withRetry<T>(
    Future<T> Function() operation, {
    int maxAttempts = 3,
    Duration initialDelay = const Duration(milliseconds: 500),
    Duration? timeout,
    String? tag,
    bool Function(dynamic error)? shouldRetry,
  }) async {
    int attempt = 0;
    Duration delay = initialDelay;
    dynamic lastError;

    while (attempt < maxAttempts) {
      attempt++;

      try {
        Future<T> future = operation();
        if (timeout != null) {
          future = future.timeout(timeout);
        }
        
        final result = await future;
        
        if (attempt > 1) {
          _log.info('Operation succeeded on attempt $attempt', tag: tag);
        }
        
        return Success(result);
      } catch (e, stack) {
        lastError = e;
        
        // Check if we should retry
        final canRetry = shouldRetry?.call(e) ?? _isRetryable(e);

        if (!canRetry || attempt >= maxAttempts) {
          _log.error(
            'Operation failed after $attempt attempt(s)',
            tag: tag,
            error: e,
            stackTrace: stack,
          );
          return Failure(_userFriendlyMessage(e), e);
        }

        _log.warning(
          'Attempt $attempt failed, retrying in ${delay.inMilliseconds}ms',
          tag: tag,
          error: e,
        );

        await Future.delayed(delay);
        delay = Duration(milliseconds: (delay.inMilliseconds * 1.5).round());
      }
    }

    return Failure(_userFriendlyMessage(lastError), lastError);
  }

  /// Runs multiple operations in parallel and returns all results.
  static Future<List<Result<T>>> parallel<T>(
    List<Future<T> Function()> operations, {
    Duration? timeout,
    String? tag,
  }) async {
    final futures = operations.map((op) async {
      try {
        Future<T> future = op();
        if (timeout != null) {
          future = future.timeout(timeout);
        }
        return Success<T>(await future);
      } catch (e) {
        return Failure<T>(_userFriendlyMessage(e), e);
      }
    });

    return Future.wait(futures);
  }

  /// Runs multiple operations and returns when the first succeeds.
  static Future<Result<T>> race<T>(
    List<Future<T> Function()> operations, {
    Duration? timeout,
    String? tag,
  }) async {
    if (operations.isEmpty) {
      return const Failure('No operations to run');
    }

    final completer = Completer<Result<T>>();
    int failedCount = 0;
    dynamic lastError;

    for (final operation in operations) {
      operation().then((value) {
        if (!completer.isCompleted) {
          completer.complete(Success(value));
        }
      }).catchError((e) {
        failedCount++;
        lastError = e;
        
        if (failedCount == operations.length && !completer.isCompleted) {
          completer.complete(Failure(_userFriendlyMessage(lastError), lastError));
        }
      });
    }

    if (timeout != null) {
      return completer.future.timeout(
        timeout,
        onTimeout: () => Failure('All operations timed out'),
      );
    }

    return completer.future;
  }

  /// Debounces an operation to prevent rapid-fire calls.
  static Debouncer debounce(Duration duration) {
    return Debouncer(duration);
  }

  /// Throttles an operation to limit call frequency.
  static Throttler throttle(Duration duration) {
    return Throttler(duration);
  }

  static bool _isRetryable(dynamic error) {
    final msg = error.toString().toLowerCase();
    return msg.contains('network') ||
        msg.contains('socket') ||
        msg.contains('timeout') ||
        msg.contains('connection') ||
        msg.contains('500') ||
        msg.contains('502') ||
        msg.contains('503') ||
        msg.contains('504');
  }

  static String _userFriendlyMessage(dynamic error) {
    final msg = error.toString().toLowerCase();
    
    if (msg.contains('socket') || msg.contains('network') || msg.contains('connection')) {
      return 'Please check your internet connection.';
    }
    if (msg.contains('timeout')) {
      return 'Request timed out. Please try again.';
    }
    if (msg.contains('permission') || msg.contains('unauthorized')) {
      return 'You don\'t have permission for this action.';
    }
    if (msg.contains('not found') || msg.contains('404')) {
      return 'The requested item was not found.';
    }
    
    return 'Something went wrong. Please try again.';
  }
}

/// Debouncer to delay execution until calls stop.
class Debouncer {
  final Duration delay;
  Timer? _timer;

  Debouncer(this.delay);

  /// Runs the action after the delay, canceling any pending execution.
  void run(VoidCallback action) {
    _timer?.cancel();
    _timer = Timer(delay, action);
  }

  /// Runs the async action after the delay.
  Future<void> runAsync(Future<void> Function() action) async {
    _timer?.cancel();
    final completer = Completer<void>();
    
    _timer = Timer(delay, () async {
      await action();
      completer.complete();
    });
    
    return completer.future;
  }

  /// Cancels any pending execution.
  void cancel() {
    _timer?.cancel();
    _timer = null;
  }

  /// Disposes the debouncer.
  void dispose() {
    cancel();
  }
}

/// Throttler to limit execution frequency.
class Throttler {
  final Duration interval;
  DateTime? _lastExecution;
  Timer? _pendingTimer;

  Throttler(this.interval);

  /// Runs the action if enough time has passed since the last execution.
  void run(VoidCallback action) {
    final now = DateTime.now();
    
    if (_lastExecution == null || 
        now.difference(_lastExecution!) >= interval) {
      _lastExecution = now;
      action();
    }
  }

  /// Runs the action, or schedules it for later if throttled.
  void runWithTrailing(VoidCallback action) {
    final now = DateTime.now();
    
    if (_lastExecution == null || 
        now.difference(_lastExecution!) >= interval) {
      _lastExecution = now;
      action();
      _pendingTimer?.cancel();
      _pendingTimer = null;
    } else {
      // Schedule for when the interval expires
      _pendingTimer?.cancel();
      final remaining = interval - now.difference(_lastExecution!);
      _pendingTimer = Timer(remaining, () {
        _lastExecution = DateTime.now();
        action();
        _pendingTimer = null;
      });
    }
  }

  /// Disposes the throttler.
  void dispose() {
    _pendingTimer?.cancel();
    _pendingTimer = null;
  }
}

/// Extension for Future to add common operations.
extension FutureExtensions<T> on Future<T> {
  /// Converts a Future to a Result.
  Future<Result<T>> toResult() async {
    try {
      return Success(await this);
    } catch (e) {
      return Failure(AsyncOperation._userFriendlyMessage(e), e);
    }
  }

  /// Adds a timeout with a custom message.
  Future<T> withTimeout(Duration timeout, {String? message}) {
    return this.timeout(
      timeout,
      onTimeout: () => throw TimeoutException(
        message ?? 'Operation timed out',
        timeout,
      ),
    );
  }

  /// Logs the result of the future.
  Future<T> logged({String? tag, String? successMessage}) async {
    try {
      final result = await this;
      LoggingService.instance.debug(
        successMessage ?? 'Operation completed',
        tag: tag,
      );
      return result;
    } catch (e, stack) {
      LoggingService.instance.error(
        'Operation failed',
        tag: tag,
        error: e,
        stackTrace: stack,
      );
      rethrow;
    }
  }
}
