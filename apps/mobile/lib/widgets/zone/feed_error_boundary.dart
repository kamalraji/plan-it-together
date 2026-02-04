import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'error_retry_card.dart';

/// A widget-level error boundary that catches errors during build/render
/// and provides graceful degradation with retry functionality.
class FeedErrorBoundary extends StatefulWidget {
  final Widget child;
  final Widget Function(BuildContext context, Object error, VoidCallback retry)? errorBuilder;
  final VoidCallback? onError;
  final VoidCallback? onRetry;
  final String? fallbackMessage;
  final bool compact;

  const FeedErrorBoundary({
    Key? key,
    required this.child,
    this.errorBuilder,
    this.onError,
    this.onRetry,
    this.fallbackMessage,
    this.compact = false,
  }) : super(key: key);

  @override
  State<FeedErrorBoundary> createState() => _FeedErrorBoundaryState();
}

class _FeedErrorBoundaryState extends State<FeedErrorBoundary> {
  Object? _error;
  bool _hasError = false;
  int _retryCount = 0;
  static const int _maxRetries = 3;

  @override
  void initState() {
    super.initState();
    // Register custom error widget builder for this subtree
    ErrorWidget.builder = _buildErrorWidget;
  }

  Widget _buildErrorWidget(FlutterErrorDetails details) {
    // Schedule error handling after frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && !_hasError) {
        setState(() {
          _error = details.exception;
          _hasError = true;
        });
        widget.onError?.call();
      }
    });

    return const SizedBox.shrink();
  }

  void _handleRetry() {
    HapticFeedback.lightImpact();
    
    if (_retryCount >= _maxRetries) {
      // Reset retry count after cooldown
      Future.delayed(const Duration(seconds: 5), () {
        if (mounted) {
          setState(() => _retryCount = 0);
        }
      });
      return;
    }

    setState(() {
      _error = null;
      _hasError = false;
      _retryCount++;
    });

    widget.onRetry?.call();
  }

  @override
  Widget build(BuildContext context) {
    if (_hasError) {
      if (widget.errorBuilder != null) {
        return widget.errorBuilder!(context, _error!, _handleRetry);
      }

      return _DefaultFeedError(
        error: _error,
        onRetry: _handleRetry,
        retryCount: _retryCount,
        maxRetries: _maxRetries,
        message: widget.fallbackMessage,
        compact: widget.compact,
      );
    }

    return widget.child;
  }
}

/// Default error UI for feed failures
class _DefaultFeedError extends StatelessWidget {
  final Object? error;
  final VoidCallback onRetry;
  final int retryCount;
  final int maxRetries;
  final String? message;
  final bool compact;

  const _DefaultFeedError({
    required this.error,
    required this.onRetry,
    required this.retryCount,
    required this.maxRetries,
    this.message,
    this.compact = false,
  });

  String _getErrorMessage() {
    if (message != null) return message!;
    
    final errorString = error?.toString().toLowerCase() ?? '';
    
    if (errorString.contains('network') || errorString.contains('socket')) {
      return 'Network error. Check your connection.';
    } else if (errorString.contains('timeout')) {
      return 'Request timed out. Please try again.';
    } else if (errorString.contains('permission') || errorString.contains('auth')) {
      return 'Access denied. Please sign in again.';
    }
    
    return 'Something went wrong loading the feed.';
  }

  @override
  Widget build(BuildContext context) {
    final isMaxRetries = retryCount >= maxRetries;

    return ErrorRetryCard(
      message: isMaxRetries 
          ? 'Too many retries. Please wait a moment.'
          : _getErrorMessage(),
      onRetry: onRetry,
      icon: isMaxRetries 
          ? Icons.hourglass_empty_rounded 
          : Icons.wifi_off_rounded,
      title: isMaxRetries ? 'Please Wait' : null,
      compact: compact,
    );
  }
}

/// A wrapper specifically for async feed loading with built-in state management
class AsyncFeedBoundary<T> extends StatefulWidget {
  final Future<T> Function() loader;
  final Widget Function(BuildContext context, T data) builder;
  final Widget Function(BuildContext context)? loadingBuilder;
  final Widget Function(BuildContext context, Object error, VoidCallback retry)? errorBuilder;
  final bool autoLoad;
  final Duration? retryDelay;

  const AsyncFeedBoundary({
    Key? key,
    required this.loader,
    required this.builder,
    this.loadingBuilder,
    this.errorBuilder,
    this.autoLoad = true,
    this.retryDelay,
  }) : super(key: key);

  @override
  State<AsyncFeedBoundary<T>> createState() => _AsyncFeedBoundaryState<T>();
}

class _AsyncFeedBoundaryState<T> extends State<AsyncFeedBoundary<T>> {
  late Future<T> _future;
  Object? _error;
  bool _isLoading = false;
  int _retryCount = 0;

  @override
  void initState() {
    super.initState();
    if (widget.autoLoad) {
      _load();
    }
  }

  Future<void> _load() async {
    if (_isLoading) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      _future = widget.loader();
      await _future;
    } catch (e) {
      if (mounted) {
        setState(() => _error = e);
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _retry() {
    HapticFeedback.lightImpact();
    _retryCount++;
    
    final delay = widget.retryDelay ?? Duration(milliseconds: 100 * _retryCount);
    Future.delayed(delay, _load);
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      if (widget.errorBuilder != null) {
        return widget.errorBuilder!(context, _error!, _retry);
      }
      
      return ErrorRetryCard(
        message: 'Failed to load content',
        onRetry: _retry,
        compact: true,
      );
    }

    if (_isLoading) {
      return widget.loadingBuilder?.call(context) ?? 
          const Center(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          );
    }

    return FutureBuilder<T>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return ErrorRetryCard(
            message: 'Failed to load content',
            onRetry: _retry,
            compact: true,
          );
        }

        if (snapshot.hasData) {
          return widget.builder(context, snapshot.data as T);
        }

        return widget.loadingBuilder?.call(context) ?? const SizedBox.shrink();
      },
    );
  }
}

/// Extension to wrap any widget with error boundary
extension ErrorBoundaryExtension on Widget {
  Widget withErrorBoundary({
    VoidCallback? onRetry,
    String? fallbackMessage,
    bool compact = false,
  }) {
    return FeedErrorBoundary(
      onRetry: onRetry,
      fallbackMessage: fallbackMessage,
      compact: compact,
      child: this,
    );
  }
}
