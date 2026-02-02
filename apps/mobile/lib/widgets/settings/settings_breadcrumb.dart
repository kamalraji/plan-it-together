import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/theme.dart';

/// A breadcrumb item for navigation
class BreadcrumbItem {
  final String label;
  final VoidCallback? onTap;
  final IconData? icon;

  const BreadcrumbItem({
    required this.label,
    this.onTap,
    this.icon,
  });
}

/// Breadcrumb navigation widget for nested settings pages.
/// 
/// Displays a horizontal trail of navigation items separated by chevrons.
/// The last item is styled as the current (active) location.
/// 
/// Example:
/// ```dart
/// SettingsBreadcrumb(
///   items: [
///     BreadcrumbItem(label: 'Settings', onTap: () => context.go('/settings')),
///     BreadcrumbItem(label: 'Security', onTap: () => context.go('/settings?tab=security')),
///     BreadcrumbItem(label: 'Trusted Devices'),
///   ],
/// )
/// ```
class SettingsBreadcrumb extends StatelessWidget {
  /// List of breadcrumb items to display
  final List<BreadcrumbItem> items;
  
  /// Whether to show home icon for the first item
  final bool showHomeIcon;

  const SettingsBreadcrumb({
    super.key,
    required this.items,
    this.showHomeIcon = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    if (items.isEmpty) {
      return const SizedBox.shrink();
    }

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: items.asMap().entries.map((entry) {
          final index = entry.key;
          final item = entry.value;
          final isLast = index == items.length - 1;
          final isFirst = index == 0;

          return Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _BreadcrumbItemWidget(
                item: item,
                isActive: isLast,
                showIcon: isFirst && showHomeIcon,
              ),
              if (!isLast)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Icon(
                    Icons.chevron_right,
                    size: 16,
                    color: cs.onSurfaceVariant.withOpacity(0.6),
                  ),
                ),
            ],
          );
        }).toList(),
      ),
    );
  }
}

class _BreadcrumbItemWidget extends StatelessWidget {
  final BreadcrumbItem item;
  final bool isActive;
  final bool showIcon;

  const _BreadcrumbItemWidget({
    required this.item,
    required this.isActive,
    required this.showIcon,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    final textStyle = isActive
        ? context.textStyles.labelMedium?.copyWith(
            color: cs.onSurface,
            fontWeight: FontWeight.w600,
          )
        : context.textStyles.labelMedium?.copyWith(
            color: cs.primary,
            fontWeight: FontWeight.w400,
          );

    final child = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (showIcon && item.icon != null) ...[
          Icon(
            item.icon,
            size: 14,
            color: isActive ? cs.onSurface : cs.primary,
          ),
          const SizedBox(width: 4),
        ],
        Text(item.label, style: textStyle),
      ],
    );

    if (!isActive && item.onTap != null) {
      return Semantics(
        button: true,
        label: 'Go back to ${item.label}',
        child: InkWell(
          onTap: () {
            HapticFeedback.selectionClick();
            item.onTap!();
          },
          borderRadius: BorderRadius.circular(4),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
            child: child,
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
      child: child,
    );
  }
}

/// A compact breadcrumb bar that can be used in app bars
class SettingsBreadcrumbBar extends StatelessWidget implements PreferredSizeWidget {
  final List<BreadcrumbItem> items;

  const SettingsBreadcrumbBar({
    super.key,
    required this.items,
  });

  @override
  Size get preferredSize => const Size.fromHeight(32);

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      height: preferredSize.height,
      padding: EdgeInsets.symmetric(horizontal: context.horizontalPadding),
      decoration: BoxDecoration(
        color: cs.surfaceContainerLow,
        border: Border(
          bottom: BorderSide(
            color: cs.outline.withOpacity(0.1),
          ),
        ),
      ),
      child: SettingsBreadcrumb(
        items: items,
        showHomeIcon: true,
      ),
    );
  }
}
