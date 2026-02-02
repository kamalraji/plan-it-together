import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/error_handler.dart';

/// Themed error display widget with optional retry action.
/// 
/// Usage:
/// ```dart
/// ErrorDisplay(
///   error: appError,
///   onRetry: () => refetch(),
/// )
/// ```
class ErrorDisplay extends StatelessWidget {
  final AppError error;
  final VoidCallback? onRetry;
  final VoidCallback? onDismiss;
  final bool compact;
  final bool showDetails;

  const ErrorDisplay({
    super.key,
    required this.error,
    this.onRetry,
    this.onDismiss,
    this.compact = false,
    this.showDetails = false,
  });

  /// Creates an ErrorDisplay from any error.
  factory ErrorDisplay.fromError({
    Key? key,
    required dynamic error,
    VoidCallback? onRetry,
    VoidCallback? onDismiss,
    bool compact = false,
    bool showDetails = false,
  }) {
    final appError = error is AppError ? error : ErrorHandler.classify(error);
    return ErrorDisplay(
      key: key,
      error: appError,
      onRetry: onRetry,
      onDismiss: onDismiss,
      compact: compact,
      showDetails: showDetails,
    );
  }

  IconData get _icon => switch (error.category) {
    ErrorCategory.network => Icons.wifi_off_rounded,
    ErrorCategory.authentication => Icons.lock_outline_rounded,
    ErrorCategory.authorization => Icons.block_rounded,
    ErrorCategory.notFound => Icons.search_off_rounded,
    ErrorCategory.validation => Icons.error_outline_rounded,
    ErrorCategory.rateLimit => Icons.speed_rounded,
    ErrorCategory.server => Icons.cloud_off_rounded,
    ErrorCategory.storage => Icons.storage_rounded,
    ErrorCategory.unknown => Icons.warning_amber_rounded,
  };

  Color _iconColor(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return switch (error.category) {
      ErrorCategory.network => colors.tertiary,
      ErrorCategory.authentication => colors.error,
      ErrorCategory.authorization => colors.error,
      ErrorCategory.notFound => colors.secondary,
      ErrorCategory.validation => colors.error,
      ErrorCategory.rateLimit => colors.tertiary,
      ErrorCategory.server => colors.error,
      ErrorCategory.storage => colors.secondary,
      ErrorCategory.unknown => colors.error,
    };
  }

  @override
  Widget build(BuildContext context) {
    if (compact) {
      return _CompactError(
        error: error,
        icon: _icon,
        iconColor: _iconColor(context),
        onRetry: onRetry,
        onDismiss: onDismiss,
      );
    }

    return _FullError(
      error: error,
      icon: _icon,
      iconColor: _iconColor(context),
      onRetry: onRetry,
      onDismiss: onDismiss,
      showDetails: showDetails,
    );
  }
}

class _CompactError extends StatelessWidget {
  final AppError error;
  final IconData icon;
  final Color iconColor;
  final VoidCallback? onRetry;
  final VoidCallback? onDismiss;

  const _CompactError({
    required this.error,
    required this.icon,
    required this.iconColor,
    this.onRetry,
    this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: theme.colorScheme.errorContainer.withOpacity(0.3),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: theme.colorScheme.error.withOpacity(0.3),
        ),
      ),
      child: Row(
        children: [
          Icon(icon, size: 20, color: iconColor),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              error.displayMessage,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onErrorContainer,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (onRetry != null && error.canRetry) ...[
            const SizedBox(width: 8),
            IconButton(
              onPressed: () {
                HapticFeedback.lightImpact();
                onRetry!();
              },
              icon: const Icon(Icons.refresh_rounded, size: 18),
              iconColor: theme.colorScheme.primary,
              visualDensity: VisualDensity.compact,
              tooltip: 'Retry',
            ),
          ],
          if (onDismiss != null) ...[
            IconButton(
              onPressed: () {
                HapticFeedback.lightImpact();
                onDismiss!();
              },
              icon: const Icon(Icons.close_rounded, size: 18),
              iconColor: theme.colorScheme.onSurfaceVariant,
              visualDensity: VisualDensity.compact,
              tooltip: 'Dismiss',
            ),
          ],
        ],
      ),
    );
  }
}

class _FullError extends StatelessWidget {
  final AppError error;
  final IconData icon;
  final Color iconColor;
  final VoidCallback? onRetry;
  final VoidCallback? onDismiss;
  final bool showDetails;

  const _FullError({
    required this.error,
    required this.icon,
    required this.iconColor,
    this.onRetry,
    this.onDismiss,
    this.showDetails = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 48, color: iconColor),
            ),
            const SizedBox(height: 24),
            Text(
              _titleForCategory(error.category),
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              error.displayMessage,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            if (error.recoveryHint != null) ...[
              const SizedBox(height: 8),
              Text(
                error.recoveryHint!,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.outline,
                  fontStyle: FontStyle.italic,
                ),
                textAlign: TextAlign.center,
              ),
            ],
            if (showDetails && error.originalError != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  error.originalError.toString(),
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontFamily: 'monospace',
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  textAlign: TextAlign.left,
                ),
              ),
            ],
            const SizedBox(height: 24),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (onDismiss != null) ...[
                  TextButton(
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      onDismiss!();
                    },
                    child: const Text('Dismiss'),
                  ),
                  const SizedBox(width: 12),
                ],
                if (onRetry != null && error.canRetry)
                  FilledButton.icon(
                    onPressed: () {
                      HapticFeedback.mediumImpact();
                      onRetry!();
                    },
                    icon: const Icon(Icons.refresh_rounded, size: 18),
                    label: const Text('Try Again'),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _titleForCategory(ErrorCategory category) => switch (category) {
    ErrorCategory.network => 'Connection Problem',
    ErrorCategory.authentication => 'Session Expired',
    ErrorCategory.authorization => 'Access Denied',
    ErrorCategory.notFound => 'Not Found',
    ErrorCategory.validation => 'Invalid Input',
    ErrorCategory.rateLimit => 'Slow Down',
    ErrorCategory.server => 'Server Issue',
    ErrorCategory.storage => 'Storage Problem',
    ErrorCategory.unknown => 'Something Went Wrong',
  };
}

// =============================================================================
// EMPTY STATE - REMOVED: Use StyledEmptyState from lib/widgets/styled_empty_state.dart
// =============================================================================
// The legacy EmptyState class has been removed. Use:
//   import 'package:thittam1hub/widgets/styled_empty_state.dart';
//   StyledEmptyState.noData(...), StyledEmptyState.noResults(...), etc.
//
// Migration guide:
//   EmptyState.noMessages() → StyledEmptyState.noMessages()
//   EmptyState.noEvents() → StyledEmptyState.noData(icon: Icons.event_note_rounded, ...)
//   EmptyState.noNotifications() → StyledEmptyState.noData(icon: Icons.notifications_none_rounded, ...)
//   EmptyState.noSearchResults(q) → StyledEmptyState.noResults(query: q)
//   EmptyState.noConnections() → StyledEmptyState.noData(icon: Icons.people_outline_rounded, ...)

/// Loading state widget with optional message.
class LoadingState extends StatelessWidget {
  final String? message;
  final bool compact;

  const LoadingState({
    super.key,
    this.message,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    if (compact) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            if (message != null) ...[
              const SizedBox(width: 12),
              Text(
                message!,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ],
        ),
      );
    }
    
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(),
            if (message != null) ...[
              const SizedBox(height: 16),
              Text(
                message!,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Tri-state content builder for async data.
class AsyncContent<T> extends StatelessWidget {
  final bool isLoading;
  final AppError? error;
  final T? data;
  final Widget Function(T data) builder;
  final VoidCallback? onRetry;
  final Widget? loadingWidget;
  final Widget? emptyWidget;
  final bool Function(T data)? isEmpty;
  final String? loadingMessage;

  const AsyncContent({
    super.key,
    required this.isLoading,
    required this.error,
    required this.data,
    required this.builder,
    this.onRetry,
    this.loadingWidget,
    this.emptyWidget,
    this.isEmpty,
    this.loadingMessage,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading && data == null) {
      return loadingWidget ?? LoadingState(message: loadingMessage);
    }

    if (error != null && data == null) {
      return ErrorDisplay(
        error: error!,
        onRetry: onRetry,
      );
    }

    if (data == null) {
      return emptyWidget ?? const EmptyState(title: 'No data');
    }

    final isDataEmpty = isEmpty?.call(data as T) ?? 
        (data is List && (data as List).isEmpty) ||
        (data is Map && (data as Map).isEmpty);

    if (isDataEmpty) {
      return emptyWidget ?? const EmptyState(title: 'No data');
    }

    return builder(data as T);
  }
}
