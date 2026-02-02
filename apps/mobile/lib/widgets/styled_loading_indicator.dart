import 'package:flutter/material.dart';
import 'package:thittam1hub/theme.dart';

/// Size variants for loading indicators
enum LoadingSize {
  /// Small size (16px) - for buttons, inline elements
  small,
  /// Medium size (24px) - for cards, sections
  medium,
  /// Large size (40px) - for full page, centered loading
  large,
}

/// Style variants for loading indicators
enum LoadingStyle {
  /// Circular progress indicator (default)
  circular,
  /// Linear progress bar
  linear,
}

/// A standardized, theme-aware loading indicator with size variants.
/// 
/// Size specifications:
/// | Size   | Diameter | Stroke | Use case         |
/// |--------|----------|--------|------------------|
/// | small  | 16px     | 2      | Buttons, inline  |
/// | medium | 24px     | 2.5    | Cards, sections  |
/// | large  | 40px     | 3      | Full page        |
/// 
/// Usage:
/// ```dart
/// // Standard usage
/// StyledLoadingIndicator()
/// 
/// // Convenience constructors
/// StyledLoadingIndicator.small()
/// StyledLoadingIndicator.page(message: 'Loading data...')
/// StyledLoadingIndicator.button()
/// ```
class StyledLoadingIndicator extends StatelessWidget {
  /// The size of the indicator
  final LoadingSize size;
  
  /// The style of the indicator
  final LoadingStyle style;
  
  /// Optional custom color (defaults to theme primary)
  final Color? color;
  
  /// Optional message to display below the indicator
  final String? message;
  
  /// Whether to use compact layout (no extra padding)
  final bool compact;
  
  /// Whether this is an overlay indicator (uses lighter background)
  final bool overlay;

  const StyledLoadingIndicator({
    super.key,
    this.size = LoadingSize.medium,
    this.style = LoadingStyle.circular,
    this.color,
    this.message,
    this.compact = false,
    this.overlay = false,
  });

  /// Small loading indicator for buttons and inline elements
  const StyledLoadingIndicator.small({
    super.key,
    this.color,
  })  : size = LoadingSize.small,
        style = LoadingStyle.circular,
        message = null,
        compact = true,
        overlay = false;

  /// Loading indicator for button content
  const StyledLoadingIndicator.button({
    super.key,
    this.color,
  })  : size = LoadingSize.small,
        style = LoadingStyle.circular,
        message = null,
        compact = true,
        overlay = false;

  /// Inline loading indicator (medium, no message)
  const StyledLoadingIndicator.inline({
    super.key,
    this.color,
  })  : size = LoadingSize.medium,
        style = LoadingStyle.circular,
        message = null,
        compact = true,
        overlay = false;

  /// Full page loading indicator (large, centered, with optional message)
  const StyledLoadingIndicator.page({
    super.key,
    this.message,
    this.color,
  })  : size = LoadingSize.large,
        style = LoadingStyle.circular,
        compact = false,
        overlay = false;

  /// Overlay loading indicator (for cards/sections)
  const StyledLoadingIndicator.overlay({
    super.key,
    this.message,
    this.color,
  })  : size = LoadingSize.medium,
        style = LoadingStyle.circular,
        compact = false,
        overlay = true;

  double get _diameter {
    switch (size) {
      case LoadingSize.small:
        return 16;
      case LoadingSize.medium:
        return 24;
      case LoadingSize.large:
        return 40;
    }
  }

  double get _strokeWidth {
    switch (size) {
      case LoadingSize.small:
        return 2;
      case LoadingSize.medium:
        return 2.5;
      case LoadingSize.large:
        return 3;
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final effectiveColor = color ?? cs.primary;

    if (style == LoadingStyle.linear) {
      return _buildLinear(context, effectiveColor);
    }

    return _buildCircular(context, effectiveColor);
  }

  Widget _buildCircular(BuildContext context, Color effectiveColor) {
    final cs = Theme.of(context).colorScheme;

    final indicator = SizedBox(
      width: _diameter,
      height: _diameter,
      child: CircularProgressIndicator(
        strokeWidth: _strokeWidth,
        color: effectiveColor,
      ),
    );

    // Simple compact mode (just the indicator)
    if (compact && message == null) {
      return indicator;
    }

    // Full layout with optional message
    Widget content = Column(
      mainAxisAlignment: MainAxisAlignment.center,
      mainAxisSize: MainAxisSize.min,
      children: [
        indicator,
        if (message != null) ...[
          SizedBox(height: size == LoadingSize.large ? AppSpacing.md : AppSpacing.sm),
          Text(
            message!,
            style: context.textStyles.bodyMedium?.copyWith(
              color: cs.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ],
    );

    // Wrap with overlay container if needed
    if (overlay) {
      content = Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: cs.surface.withOpacity(0.9),
          borderRadius: BorderRadius.circular(AppRadius.md),
          boxShadow: [
            BoxShadow(
              color: cs.shadow.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: content,
      );
    }

    return Center(child: content);
  }

  Widget _buildLinear(BuildContext context, Color effectiveColor) {
    final cs = Theme.of(context).colorScheme;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        LinearProgressIndicator(
          color: effectiveColor,
          backgroundColor: effectiveColor.withOpacity(0.2),
        ),
        if (message != null) ...[
          const SizedBox(height: AppSpacing.sm),
          Text(
            message!,
            style: context.textStyles.bodySmall?.copyWith(
              color: cs.onSurfaceVariant,
            ),
          ),
        ],
      ],
    );
  }
}

/// A widget that wraps content with a loading overlay
class LoadingOverlay extends StatelessWidget {
  /// Whether to show the loading overlay
  final bool isLoading;
  
  /// The content to wrap
  final Widget child;
  
  /// Optional loading message
  final String? message;
  
  /// Whether to block interaction when loading
  final bool blocking;

  const LoadingOverlay({
    super.key,
    required this.isLoading,
    required this.child,
    this.message,
    this.blocking = true,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Main content
        IgnorePointer(
          ignoring: isLoading && blocking,
          child: AnimatedOpacity(
            duration: const Duration(milliseconds: 200),
            opacity: isLoading ? 0.5 : 1.0,
            child: child,
          ),
        ),
        
        // Loading overlay
        if (isLoading)
          Positioned.fill(
            child: StyledLoadingIndicator.overlay(message: message),
          ),
      ],
    );
  }
}
