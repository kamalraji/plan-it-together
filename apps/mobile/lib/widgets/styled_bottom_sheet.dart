import 'package:flutter/material.dart';
import '../theme.dart';

/// Shows a styled bottom sheet with consistent theming
Future<T?> showStyledBottomSheet<T>({
  required BuildContext context,
  required Widget child,
  String? title,
  bool isDismissible = true,
  bool enableDrag = true,
  bool showDragHandle = true,
  bool isScrollControlled = true,
  double? maxHeight,
  List<Widget>? actions,
}) {
  return showModalBottomSheet<T>(
    context: context,
    isDismissible: isDismissible,
    enableDrag: enableDrag,
    isScrollControlled: isScrollControlled,
    backgroundColor: Colors.transparent,
    builder: (context) => StyledBottomSheet(
      title: title,
      showDragHandle: showDragHandle,
      maxHeight: maxHeight,
      actions: actions,
      child: child,
    ),
  );
}

class StyledBottomSheet extends StatelessWidget {
  final Widget child;
  final String? title;
  final String? subtitle;
  final IconData? icon;
  final Color? iconColor;
  final bool showDragHandle;
  final double? maxHeight;
  final List<Widget>? actions;
  final EdgeInsetsGeometry? padding;

  const StyledBottomSheet({
    super.key,
    required this.child,
    this.title,
    this.subtitle,
    this.icon,
    this.iconColor,
    this.showDragHandle = true,
    this.maxHeight,
    this.actions,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final mediaQuery = MediaQuery.of(context);

    return Container(
      constraints: BoxConstraints(
        maxHeight: maxHeight ?? mediaQuery.size.height * 0.85,
      ),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showDragHandle) _buildDragHandle(cs),
          if (title != null || actions != null) _buildHeader(context, cs),
          Flexible(
            child: Padding(
              padding: padding ?? const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: child,
            ),
          ),
          SizedBox(height: mediaQuery.padding.bottom),
        ],
      ),
    );
  }

  Widget _buildDragHandle(ColorScheme cs) {
    return Padding(
      padding: const EdgeInsets.only(top: 12, bottom: 8),
      child: Container(
        width: 40,
        height: 4,
        decoration: BoxDecoration(
          color: cs.outline.withOpacity(0.4),
          borderRadius: BorderRadius.circular(2),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, ColorScheme cs) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      child: Row(
        children: [
          if (icon != null)
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Icon(icon, color: iconColor ?? cs.primary, size: 28),
            ),
          if (title != null)
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title!,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: cs.onSurface,
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      subtitle!,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          if (actions != null) ...actions!,
        ],
      ),
    );
  }
}

/// A styled bottom sheet action button
class StyledBottomSheetAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? color;
  final bool isDestructive;

  const StyledBottomSheetAction({
    super.key,
    required this.icon,
    required this.label,
    required this.onTap,
    this.color,
    this.isDestructive = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final actionColor = isDestructive ? AppColors.error : (color ?? cs.onSurface);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.sm),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(icon, color: actionColor, size: 24),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                label,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: actionColor,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            Icon(
              Icons.chevron_right,
              color: cs.onSurfaceVariant,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }
}

/// A list of actions for the bottom sheet
class StyledBottomSheetActionList extends StatelessWidget {
  final List<StyledBottomSheetAction> actions;

  const StyledBottomSheetActionList({
    super.key,
    required this.actions,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (int i = 0; i < actions.length; i++) ...[
          actions[i],
          if (i < actions.length - 1)
            Divider(height: 1, color: cs.outline.withOpacity(0.3)),
        ],
      ],
    );
  }
}
