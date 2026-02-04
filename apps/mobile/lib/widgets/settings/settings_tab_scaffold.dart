import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'settings_skeleton.dart';

/// A standardized scaffold for settings tab pages.
/// 
/// This provides consistent:
/// - Loading states with shimmer skeletons
/// - Error states with retry actions
/// - Content padding and scrolling
/// - Pull-to-refresh support
/// 
/// Usage:
/// ```dart
/// SettingsTabScaffold(
///   isLoading: _isLoading,
///   error: _error,
///   onRetry: _loadSettings,
///   onRefresh: _loadSettings,
///   children: [
///     SettingsSection(title: 'General', children: [...]),
///   ],
/// )
/// ```
class SettingsTabScaffold extends StatelessWidget {
  /// Whether the tab is currently loading data.
  final bool isLoading;

  /// Error message to display, if any.
  final String? error;

  /// Callback when user taps retry after an error.
  final VoidCallback? onRetry;

  /// Callback for pull-to-refresh.
  final Future<void> Function()? onRefresh;

  /// The content to display when loaded successfully.
  final List<Widget> children;

  /// Number of skeleton sections to show while loading.
  final int skeletonSections;

  /// Number of items per skeleton section.
  final int skeletonItemsPerSection;

  /// Optional header widget above the content.
  final Widget? header;

  /// Optional footer widget below the content.
  final Widget? footer;

  /// Padding for the content area.
  final EdgeInsets? padding;

  /// Whether to add spacing between children.
  final bool addSpacing;

  /// Spacing between children when [addSpacing] is true.
  final double spacing;

  const SettingsTabScaffold({
    super.key,
    this.isLoading = false,
    this.error,
    this.onRetry,
    this.onRefresh,
    required this.children,
    this.skeletonSections = 2,
    this.skeletonItemsPerSection = 3,
    this.header,
    this.footer,
    this.padding,
    this.addSpacing = true,
    this.spacing = 16.0,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    // Loading state
    if (isLoading) {
      return SettingsSkeleton(
        sectionCount: skeletonSections,
        itemsPerSection: skeletonItemsPerSection,
      );
    }

    // Error state
    if (error != null) {
      return _SettingsTabError(
        error: error!,
        onRetry: onRetry,
      );
    }

    // Build content with optional spacing
    final contentChildren = addSpacing && spacing > 0
        ? _addSpacing(children, spacing)
        : children;

    final content = ListView(
      padding: padding ?? const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      children: [
        if (header != null) ...[
          header!,
          SizedBox(height: spacing),
        ],
        ...contentChildren,
        if (footer != null) ...[
          SizedBox(height: spacing),
          footer!,
        ],
        // Bottom safe area padding
        const SizedBox(height: 32),
      ],
    );

    // Wrap with pull-to-refresh if callback provided
    if (onRefresh != null) {
      return RefreshIndicator(
        onRefresh: () async {
          HapticFeedback.mediumImpact();
          await onRefresh!();
        },
        color: cs.primary,
        backgroundColor: cs.surface,
        child: content,
      );
    }

    return content;
  }

  /// Adds spacing between list items.
  List<Widget> _addSpacing(List<Widget> items, double spacing) {
    if (items.isEmpty) return items;
    
    final result = <Widget>[];
    for (var i = 0; i < items.length; i++) {
      result.add(items[i]);
      if (i < items.length - 1) {
        result.add(SizedBox(height: spacing));
      }
    }
    return result;
  }
}

/// Error state widget for settings tabs.
class _SettingsTabError extends StatelessWidget {
  final String error;
  final VoidCallback? onRetry;

  const _SettingsTabError({
    required this.error,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Error icon
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: cs.errorContainer.withOpacity(0.3),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.error_outline_rounded,
                size: 36,
                color: cs.error,
              ),
            ),
            const SizedBox(height: 24),
            
            // Error title
            Text(
              'Something went wrong',
              style: theme.textTheme.titleMedium?.copyWith(
                color: cs.onSurface,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            
            // Error message
            Text(
              error,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: cs.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
            
            // Retry button
            if (onRetry != null) ...[
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: () {
                  HapticFeedback.lightImpact();
                  onRetry!();
                },
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: const Text('Try Again'),
                style: FilledButton.styleFrom(
                  backgroundColor: cs.primary,
                  foregroundColor: cs.onPrimary,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 12,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// A convenience widget for showing success feedback in settings tabs.
class SettingsTabFeedback {
  /// Shows a success snackbar with haptic feedback.
  static void showSuccess(BuildContext context, String message) {
    HapticFeedback.lightImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
            const SizedBox(width: 12),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: Colors.green.shade600,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  /// Shows an error snackbar with optional retry.
  static void showError(
    BuildContext context,
    String message, {
    VoidCallback? onRetry,
  }) {
    HapticFeedback.heavyImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error_outline_rounded, color: Colors.white, size: 20),
            const SizedBox(width: 12),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: Theme.of(context).colorScheme.error,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
        duration: const Duration(seconds: 4),
        action: onRetry != null
            ? SnackBarAction(
                label: 'Retry',
                textColor: Colors.white,
                onPressed: onRetry,
              )
            : null,
      ),
    );
  }

  /// Shows an info snackbar.
  static void showInfo(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(
              Icons.info_outline_rounded,
              color: Colors.white,
              size: 20,
            ),
            const SizedBox(width: 12),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: Theme.of(context).colorScheme.primary,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
        duration: const Duration(seconds: 3),
      ),
    );
  }
}
