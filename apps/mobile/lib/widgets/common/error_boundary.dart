import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:thittam1hub/services/error_handler.dart';
import 'package:thittam1hub/services/logging_service.dart';

/// Flutter error boundary widget that catches and displays errors gracefully.
/// 
/// Usage:
/// ```dart
/// ErrorBoundary(
///   onError: (error, stack) => analytics.logError(error),
///   fallback: (error, reset) => ErrorDisplay(error: error, onRetry: reset),
///   child: MyWidget(),
/// )
/// ```
class ErrorBoundary extends StatefulWidget {
  final Widget child;
  final Widget Function(AppError error, VoidCallback reset)? fallback;
  final void Function(dynamic error, StackTrace stack)? onError;
  final String? tag;

  const ErrorBoundary({
    super.key,
    required this.child,
    this.fallback,
    this.onError,
    this.tag,
  });

  @override
  State<ErrorBoundary> createState() => _ErrorBoundaryState();
}

class _ErrorBoundaryState extends State<ErrorBoundary> {
  AppError? _error;
  
  static final _log = LoggingService.instance;

  @override
  void initState() {
    super.initState();
    // Set up Flutter error handler for this widget tree
    FlutterError.onError = _handleFlutterError;
  }

  void _handleFlutterError(FlutterErrorDetails details) {
    _log.error(
      'Flutter error caught by ErrorBoundary',
      tag: widget.tag ?? 'ErrorBoundary',
      error: details.exception,
      stackTrace: details.stack,
    );
    
    widget.onError?.call(details.exception, details.stack ?? StackTrace.current);
    
    if (mounted) {
      setState(() {
        _error = ErrorHandler.classify(details.exception, details.stack);
      });
    }
  }

  void _reset() {
    setState(() {
      _error = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      if (widget.fallback != null) {
        return widget.fallback!(_error!, _reset);
      }
      
      return _DefaultErrorFallback(error: _error!, onReset: _reset);
    }

    return widget.child;
  }
}

class _DefaultErrorFallback extends StatelessWidget {
  final AppError error;
  final VoidCallback onReset;

  const _DefaultErrorFallback({
    required this.error,
    required this.onReset,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Material(
      color: theme.colorScheme.surface,
      child: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.errorContainer.withOpacity(0.3),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.warning_amber_rounded,
                    size: 48,
                    color: theme.colorScheme.error,
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'Something went wrong',
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  error.displayMessage,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  textAlign: TextAlign.center,
                ),
                if (kDebugMode && error.originalError != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    constraints: const BoxConstraints(maxHeight: 150),
                    child: SingleChildScrollView(
                      child: Text(
                        error.originalError.toString(),
                        style: theme.textTheme.bodySmall?.copyWith(
                          fontFamily: 'monospace',
                          fontSize: 10,
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 24),
                FilledButton.icon(
                  onPressed: onReset,
                  icon: const Icon(Icons.refresh_rounded),
                  label: const Text('Try Again'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Global error handler setup for the app.
/// 
/// Call this in main() before runApp():
/// ```dart
/// void main() {
///   GlobalErrorHandler.initialize();
///   runApp(const MyApp());
/// }
/// ```
class GlobalErrorHandler {
  static final _log = LoggingService.instance;
  static bool _initialized = false;

  /// Initialize global error handling.
  static void initialize({
    void Function(dynamic error, StackTrace stack)? onError,
  }) {
    if (_initialized) return;
    _initialized = true;

    // Handle Flutter framework errors
    FlutterError.onError = (FlutterErrorDetails details) {
      _log.error(
        'Flutter error',
        tag: 'FlutterError',
        error: details.exception,
        stackTrace: details.stack,
        metadata: {
          'library': details.library,
          'context': details.context?.toString(),
        },
      );
      
      onError?.call(details.exception, details.stack ?? StackTrace.current);
      
      // In debug mode, also print to console
      if (kDebugMode) {
        FlutterError.dumpErrorToConsole(details);
      }
    };

    // Handle errors not caught by Flutter
    PlatformDispatcher.instance.onError = (error, stack) {
      _log.error(
        'Uncaught platform error',
        tag: 'PlatformError',
        error: error,
        stackTrace: stack,
      );
      
      onError?.call(error, stack);
      
      return true; // Prevent the error from propagating
    };

    _log.info('Global error handler initialized', tag: 'ErrorHandler');
  }

  /// Log an error manually.
  static void logError(
    dynamic error, {
    StackTrace? stackTrace,
    String? context,
    Map<String, dynamic>? metadata,
  }) {
    _log.error(
      context ?? 'Manual error log',
      tag: 'ErrorHandler',
      error: error,
      stackTrace: stackTrace,
      metadata: metadata,
    );
  }

  /// Report an error to crash reporting service (production only).
  static Future<void> reportError(
    dynamic error, {
    StackTrace? stackTrace,
    bool fatal = false,
  }) async {
    // Placeholder for crash reporting integration
    // FirebaseCrashlytics.instance.recordError(error, stackTrace, fatal: fatal);
    
    _log.error(
      'Error reported${fatal ? ' (FATAL)' : ''}',
      tag: 'CrashReporting',
      error: error,
      stackTrace: stackTrace,
    );
  }
}

/// Mixin for StatefulWidget to add error boundary behavior.
/// 
/// Usage:
/// ```dart
/// class MyWidgetState extends State<MyWidget> with ErrorBoundaryMixin<MyWidget> {
///   @override
///   Widget buildChild(BuildContext context) {
///     return YourActualWidget();
///   }
/// }
/// ```
mixin ErrorBoundaryMixin<T extends StatefulWidget> on State<T> {
  AppError? _boundaryError;

  /// Override this instead of build().
  Widget buildChild(BuildContext context);

  /// Called when an error is caught.
  void onBoundaryError(dynamic error, StackTrace stack) {
    LoggingService.instance.error(
      'Error caught by boundary mixin',
      tag: T.toString(),
      error: error,
      stackTrace: stack,
    );
  }

  /// Reset the error state.
  void resetBoundary() {
    setState(() {
      _boundaryError = null;
    });
  }

  /// Build error fallback UI.
  Widget buildErrorFallback(BuildContext context, AppError error) {
    final theme = Theme.of(context);
    
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.error_outline_rounded,
            size: 48,
            color: theme.colorScheme.error,
          ),
          const SizedBox(height: 16),
          Text(
            error.displayMessage,
            style: theme.textTheme.bodyMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          FilledButton.tonal(
            onPressed: resetBoundary,
            child: const Text('Try Again'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_boundaryError != null) {
      return buildErrorFallback(context, _boundaryError!);
    }

    try {
      return buildChild(context);
    } catch (e, stack) {
      // Schedule error handling for after build
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          onBoundaryError(e, stack);
          setState(() {
            _boundaryError = ErrorHandler.classify(e, stack);
          });
        }
      });
      
      // Return temporary loading state
      return const Center(child: CircularProgressIndicator());
    }
  }
}
