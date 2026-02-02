import 'package:flutter/material.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/utils/animations.dart';

/// Compact, styled list tile for menus and settings
class StyledListTile extends StatelessWidget {
  final IconData? leadingIcon;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;
  final Color? iconColor;
  final Color? textColor;
  final bool showChevron;
  final bool compact;

  const StyledListTile({
    super.key,
    this.leadingIcon,
    required this.title,
    this.subtitle,
    this.trailing,
    this.onTap,
    this.iconColor,
    this.textColor,
    this.showChevron = true,
    this.compact = true,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;
    final effectiveIconColor = iconColor ?? cs.onSurfaceVariant;
    final effectiveTextColor = textColor ?? cs.onSurface;

    final content = Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 10 : 14,
        vertical: compact ? 10 : 14,
      ),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(AppRadius.sm),
        border: Border.all(color: cs.outline.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          if (leadingIcon != null) ...[
            Icon(
              leadingIcon,
              size: compact ? 18 : 22,
              color: effectiveIconColor,
            ),
            SizedBox(width: compact ? 10 : 14),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: text.bodyMedium?.copyWith(
                    color: effectiveTextColor,
                    fontWeight: FontWeight.w500,
                    fontSize: compact ? 13 : 14,
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    subtitle!,
                    style: text.bodySmall?.copyWith(
                      color: cs.onSurfaceVariant,
                      fontSize: compact ? 11 : 12,
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (trailing != null) trailing!,
          if (showChevron && trailing == null)
            Icon(
              Icons.chevron_right,
              size: compact ? 18 : 20,
              color: cs.onSurfaceVariant,
            ),
        ],
      ),
    );

    if (onTap != null) {
      return TapScaleWidget(
        onTap: onTap,
        child: content,
      );
    }

    return content;
  }
}

/// Grouped list tiles with a section header
class StyledListSection extends StatelessWidget {
  final String? header;
  final List<StyledListTile> tiles;
  final EdgeInsetsGeometry? padding;

  const StyledListSection({
    super.key,
    this.header,
    required this.tiles,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;

    return Padding(
      padding: padding ?? EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (header != null) ...[
            Padding(
              padding: const EdgeInsets.only(left: 4, bottom: 6),
              child: Text(
                header!.toUpperCase(),
                style: text.labelSmall?.copyWith(
                  color: cs.onSurfaceVariant,
                  letterSpacing: 0.8,
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
          ...tiles.map((tile) => Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: tile,
          )),
        ],
      ),
    );
  }
}
