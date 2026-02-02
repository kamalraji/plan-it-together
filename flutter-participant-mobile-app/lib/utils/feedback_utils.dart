import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/error_handler.dart';

/// Themed snackbar utilities for consistent feedback.
/// 
/// Usage:
/// ```dart
/// context.showSuccess('Profile saved!');
/// context.showError(appError);
/// context.showInfo('Feature coming soon');
/// ```
extension FeedbackSnackbars on BuildContext {
  /// Shows a success snackbar.
  void showSuccess(
    String message, {
    Duration duration = const Duration(seconds: 3),
    SnackBarAction? action,
  }) {
    _showSnackbar(
      message: message,
      icon: Icons.check_circle_rounded,
      backgroundColor: Theme.of(this).colorScheme.primaryContainer,
      foregroundColor: Theme.of(this).colorScheme.onPrimaryContainer,
      duration: duration,
      action: action,
    );
    HapticFeedback.lightImpact();
  }

  /// Shows an error snackbar with optional retry action.
  void showError(
    dynamic error, {
    Duration duration = const Duration(seconds: 4),
    VoidCallback? onRetry,
  }) {
    final appError = error is AppError ? error : ErrorHandler.classify(error);
    
    _showSnackbar(
      message: appError.displayMessage,
      icon: Icons.error_outline_rounded,
      backgroundColor: Theme.of(this).colorScheme.errorContainer,
      foregroundColor: Theme.of(this).colorScheme.onErrorContainer,
      duration: duration,
      action: onRetry != null && appError.canRetry
          ? SnackBarAction(
              label: 'Retry',
              onPressed: onRetry,
            )
          : null,
    );
    HapticFeedback.heavyImpact();
  }

  /// Shows a warning snackbar.
  void showWarning(
    String message, {
    Duration duration = const Duration(seconds: 3),
    SnackBarAction? action,
  }) {
    _showSnackbar(
      message: message,
      icon: Icons.warning_amber_rounded,
      backgroundColor: Theme.of(this).colorScheme.tertiaryContainer,
      foregroundColor: Theme.of(this).colorScheme.onTertiaryContainer,
      duration: duration,
      action: action,
    );
    HapticFeedback.mediumImpact();
  }

  /// Shows an info snackbar.
  void showInfo(
    String message, {
    Duration duration = const Duration(seconds: 3),
    SnackBarAction? action,
  }) {
    _showSnackbar(
      message: message,
      icon: Icons.info_outline_rounded,
      backgroundColor: Theme.of(this).colorScheme.secondaryContainer,
      foregroundColor: Theme.of(this).colorScheme.onSecondaryContainer,
      duration: duration,
      action: action,
    );
  }

  /// Shows a loading snackbar that can be dismissed programmatically.
  ScaffoldFeatureController<SnackBar, SnackBarClosedReason> showLoading(
    String message,
  ) {
    final theme = Theme.of(this);
    
    final snackBar = SnackBar(
      content: Row(
        children: [
          SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation(
                theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              message,
              style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
            ),
          ),
        ],
      ),
      backgroundColor: theme.colorScheme.surfaceContainerHighest,
      duration: const Duration(minutes: 5), // Long duration, dismiss manually
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    );
    
    return ScaffoldMessenger.of(this).showSnackBar(snackBar);
  }

  /// Dismisses any current snackbar.
  void hideSnackbar() {
    ScaffoldMessenger.of(this).hideCurrentSnackBar();
  }

  void _showSnackbar({
    required String message,
    required IconData icon,
    required Color backgroundColor,
    required Color foregroundColor,
    required Duration duration,
    SnackBarAction? action,
  }) {
    ScaffoldMessenger.of(this).hideCurrentSnackBar();
    
    final snackBar = SnackBar(
      content: Row(
        children: [
          Icon(icon, color: foregroundColor, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: TextStyle(color: foregroundColor),
            ),
          ),
        ],
      ),
      backgroundColor: backgroundColor,
      duration: duration,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      action: action,
    );
    
    ScaffoldMessenger.of(this).showSnackBar(snackBar);
  }
}

/// Shows a confirmation dialog and returns true if confirmed.
Future<bool> showConfirmDialog(
  BuildContext context, {
  required String title,
  required String message,
  String confirmLabel = 'Confirm',
  String cancelLabel = 'Cancel',
  bool isDestructive = false,
}) async {
  final theme = Theme.of(context);
  
  final result = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: Text(title),
      content: Text(message),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: Text(cancelLabel),
        ),
        FilledButton(
          onPressed: () {
            HapticFeedback.mediumImpact();
            Navigator.of(context).pop(true);
          },
          style: isDestructive
              ? FilledButton.styleFrom(
                  backgroundColor: theme.colorScheme.error,
                  foregroundColor: theme.colorScheme.onError,
                )
              : null,
          child: Text(confirmLabel),
        ),
      ],
    ),
  );
  
  return result ?? false;
}

/// Shows a destructive action confirmation dialog.
Future<bool> showDestructiveConfirmDialog(
  BuildContext context, {
  required String title,
  required String message,
  String confirmLabel = 'Delete',
}) {
  return showConfirmDialog(
    context,
    title: title,
    message: message,
    confirmLabel: confirmLabel,
    isDestructive: true,
  );
}

/// Shows an error dialog with details.
Future<void> showErrorDialog(
  BuildContext context, {
  required dynamic error,
  VoidCallback? onRetry,
}) async {
  final appError = error is AppError ? error : ErrorHandler.classify(error);
  final theme = Theme.of(context);
  
  await showDialog(
    context: context,
    builder: (context) => AlertDialog(
      icon: Icon(
        Icons.error_outline_rounded,
        size: 48,
        color: theme.colorScheme.error,
      ),
      title: Text(_titleForCategory(appError.category)),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(appError.displayMessage),
          if (appError.recoveryHint != null) ...[
            const SizedBox(height: 12),
            Text(
              appError.recoveryHint!,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.outline,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Dismiss'),
        ),
        if (onRetry != null && appError.canRetry)
          FilledButton(
            onPressed: () {
              HapticFeedback.mediumImpact();
              Navigator.of(context).pop();
              onRetry();
            },
            child: const Text('Try Again'),
          ),
      ],
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
