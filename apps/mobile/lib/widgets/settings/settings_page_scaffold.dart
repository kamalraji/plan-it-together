import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/settings/settings_skeleton.dart';

/// Unified scaffold for all settings pages with consistent patterns
/// 
/// Provides:
/// - Consistent AppBar with optional help action
/// - Responsive padding using theme tokens
/// - Pull-to-refresh support
/// - Standardized loading state with shimmer skeleton
/// - Error state with retry capability
/// - Accessibility semantics
class SettingsPageScaffold extends StatelessWidget {
  /// Page title shown in AppBar
  final String title;

  /// Main content of the page
  final Widget body;

  /// Whether content is loading
  final bool isLoading;

  /// Optional error message to display
  final String? errorMessage;

  /// Called when user taps retry on error
  final VoidCallback? onRetry;

  /// Called on pull-to-refresh (enables RefreshIndicator if provided)
  final Future<void> Function()? onRefresh;

  /// Optional help action callback (shows help icon in AppBar)
  final VoidCallback? onHelp;

  /// Additional AppBar actions
  final List<Widget>? actions;

  /// Number of skeleton sections to show when loading
  final int skeletonSections;

  /// Whether to use sliver-based layout (for complex scrolling)
  final bool useSliver;

  const SettingsPageScaffold({
    super.key,
    required this.title,
    required this.body,
    this.isLoading = false,
    this.errorMessage,
    this.onRetry,
    this.onRefresh,
    this.onHelp,
    this.actions,
    this.skeletonSections = 2,
    this.useSliver = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Semantics(
          header: true,
          child: Text(title),
        ),
        actions: [
          if (onHelp != null)
            IconButton(
              icon: const Icon(Icons.help_outline),
              tooltip: 'Help',
              onPressed: () {
                HapticFeedback.lightImpact();
                onHelp!();
              },
            ),
          ...?actions,
        ],
      ),
      body: _buildBody(context, cs),
    );
  }

  Widget _buildBody(BuildContext context, ColorScheme cs) {
    // Error state
    if (errorMessage != null) {
      return _ErrorState(
        message: errorMessage!,
        onRetry: onRetry,
      );
    }

    // Loading state with shimmer skeleton
    if (isLoading) {
      return SettingsSkeleton(sectionCount: skeletonSections);
    }

    // Content with optional pull-to-refresh
    final content = Padding(
      padding: EdgeInsets.symmetric(
        horizontal: context.horizontalPadding,
        vertical: AppSpacing.md,
      ),
      child: body,
    );

    if (onRefresh != null) {
      return RefreshIndicator(
        onRefresh: onRefresh!,
        color: cs.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: content,
        ),
      );
    }

    return SingleChildScrollView(child: content);
  }
}

/// Error state display with retry button
class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;

  const _ErrorState({
    required this.message,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.lg),
              decoration: BoxDecoration(
                color: cs.errorContainer.withOpacity(0.3),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.error_outline,
                size: 48,
                color: cs.error,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              'Something went wrong',
              style: context.textStyles.titleMedium?.semiBold,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              message,
              style: context.textStyles.bodyMedium?.withColor(cs.onSurfaceVariant),
              textAlign: TextAlign.center,
            ),
            if (onRetry != null) ...[
              const SizedBox(height: AppSpacing.lg),
              FilledButton.icon(
                onPressed: () {
                  HapticFeedback.lightImpact();
                  onRetry!();
                },
                icon: const Icon(Icons.refresh),
                label: const Text('Try Again'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// NOTE: SettingsFeedback is now in widgets/common/settings_feedback.dart
// Use: import 'package:thittam1hub/widgets/common/settings_feedback.dart';
