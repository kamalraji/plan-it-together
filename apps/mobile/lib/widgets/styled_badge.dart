import 'package:flutter/material.dart';
import '../theme.dart';

enum StyledBadgeVariant { primary, secondary, success, warning, error, info, outline }
enum StyledBadgeSize { sm, md, lg }

class StyledBadge extends StatelessWidget {
  final String label;
  final StyledBadgeVariant variant;
  final StyledBadgeSize size;
  final IconData? icon;
  final bool showDot;
  final VoidCallback? onTap;

  const StyledBadge({
    super.key,
    required this.label,
    this.variant = StyledBadgeVariant.primary,
    this.size = StyledBadgeSize.md,
    this.icon,
    this.showDot = false,
    this.onTap,
  });

  /// Factory for private/locked badge - commonly used in chat channels/groups
  factory StyledBadge.private({StyledBadgeSize size = StyledBadgeSize.sm}) {
    return StyledBadge(
      label: 'Private',
      icon: Icons.lock,
      variant: StyledBadgeVariant.primary,
      size: size,
    );
  }

  EdgeInsets get _padding => switch (size) {
    StyledBadgeSize.sm => const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
    StyledBadgeSize.md => const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    StyledBadgeSize.lg => const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
  };

  double get _fontSize => switch (size) {
    StyledBadgeSize.sm => 10,
    StyledBadgeSize.md => 12,
    StyledBadgeSize.lg => 14,
  };

  double get _iconSize => switch (size) {
    StyledBadgeSize.sm => 10,
    StyledBadgeSize.md => 14,
    StyledBadgeSize.lg => 16,
  };

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final (bgColor, fgColor, borderColor) = _getColors(cs);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: _padding,
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: borderColor, width: 1),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (showDot) ...[
              Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: fgColor,
                ),
              ),
              const SizedBox(width: 6),
            ],
            if (icon != null) ...[
              Icon(icon, size: _iconSize, color: fgColor),
              const SizedBox(width: 4),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: _fontSize,
                fontWeight: FontWeight.w600,
                color: fgColor,
              ),
            ),
          ],
        ),
      ),
    );
  }

  (Color, Color, Color) _getColors(ColorScheme cs) {
    return switch (variant) {
      StyledBadgeVariant.primary => (
        cs.primaryContainer,
        cs.onPrimaryContainer,
        cs.primaryContainer,
      ),
      StyledBadgeVariant.secondary => (
        cs.secondaryContainer,
        cs.onSecondaryContainer,
        cs.secondaryContainer,
      ),
      StyledBadgeVariant.success => (
        AppColors.success.withOpacity(0.15),
        AppColors.success,
        AppColors.success.withOpacity(0.3),
      ),
      StyledBadgeVariant.warning => (
        AppColors.warning.withOpacity(0.15),
        AppColors.warning,
        AppColors.warning.withOpacity(0.3),
      ),
      StyledBadgeVariant.error => (
        AppColors.error.withOpacity(0.15),
        AppColors.error,
        AppColors.error.withOpacity(0.3),
      ),
      StyledBadgeVariant.info => (
        AppColors.accent.withOpacity(0.15),
        AppColors.accent,
        AppColors.accent.withOpacity(0.3),
      ),
      StyledBadgeVariant.outline => (
        Colors.transparent,
        cs.onSurface,
        cs.outline,
      ),
    };
  }
}

/// A small notification badge that can be overlaid on other widgets
class StyledNotificationBadge extends StatelessWidget {
  final int count;
  final Widget child;
  final bool show;
  final Color? color;

  const StyledNotificationBadge({
    super.key,
    required this.count,
    required this.child,
    this.show = true,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Stack(
      clipBehavior: Clip.none,
      children: [
        child,
        if (show && count > 0)
          Positioned(
            right: -6,
            top: -6,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
              constraints: const BoxConstraints(minWidth: 18),
              decoration: BoxDecoration(
                color: color ?? AppColors.error,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: cs.surface, width: 2),
              ),
              child: Text(
                count > 99 ? '99+' : count.toString(),
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
          ),
      ],
    );
  }
}
