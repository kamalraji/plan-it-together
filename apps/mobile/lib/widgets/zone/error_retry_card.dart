import 'package:flutter/material.dart';

/// A reusable error card with retry action for Zone feature
class ErrorRetryCard extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  final IconData icon;
  final String? title;
  final bool compact;

  const ErrorRetryCard({
    Key? key,
    required this.message,
    required this.onRetry,
    this.icon = Icons.error_outline_rounded,
    this.title,
    this.compact = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    if (compact) {
      return Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: cs.errorContainer.withOpacity(0.3),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: cs.error.withOpacity(0.3)),
        ),
        child: Row(
          children: [
            Icon(icon, color: cs.error, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: textTheme.bodySmall?.copyWith(
                  color: cs.onErrorContainer,
                ),
              ),
            ),
            TextButton(
              onPressed: onRetry,
              style: TextButton.styleFrom(
                foregroundColor: cs.error,
                visualDensity: VisualDensity.compact,
              ),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: cs.errorContainer.withOpacity(0.2),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cs.error.withOpacity(0.3)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: cs.error.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: cs.error, size: 32),
          ),
          const SizedBox(height: 16),
          if (title != null) ...[
            Text(
              title!,
              style: textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: cs.onSurface,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
          ],
          Text(
            message,
            style: textTheme.bodyMedium?.copyWith(
              color: cs.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          FilledButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Try Again'),
            style: FilledButton.styleFrom(
              backgroundColor: cs.error,
              foregroundColor: cs.onError,
            ),
          ),
        ],
      ),
    );
  }
}

/// A section-specific loading/error state wrapper
class ZoneSectionState extends StatelessWidget {
  final bool isLoading;
  final String? error;
  final VoidCallback? onRetry;
  final Widget child;
  final Widget? loadingWidget;

  const ZoneSectionState({
    Key? key,
    required this.isLoading,
    this.error,
    this.onRetry,
    required this.child,
    this.loadingWidget,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return loadingWidget ?? _buildDefaultLoading(context);
    }

    if (error != null && onRetry != null) {
      return ErrorRetryCard(
        message: error!,
        onRetry: onRetry!,
        compact: true,
      );
    }

    return child;
  }

  Widget _buildDefaultLoading(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Center(
        child: SizedBox(
          width: 24,
          height: 24,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: Theme.of(context).colorScheme.primary,
          ),
        ),
      ),
    );
  }
}
