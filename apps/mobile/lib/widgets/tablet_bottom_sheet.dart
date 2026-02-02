/// Tablet-optimized bottom sheet wrapper with max constraints
/// 
/// Provides consistent tablet UX across all modals with:
/// - Max height: 50% of screen on tablets
/// - Max width: 500px centered
/// - Rounded corners and proper theming
library tablet_bottom_sheet;

import 'package:flutter/material.dart';
import 'package:thittam1hub/theme.dart';

/// Default constraints for tablet bottom sheets
class TabletSheetConstraints {
  static const double maxWidth = 500.0;
  static const double maxHeightFraction = 0.5;
  static const double phoneMaxHeightFraction = 0.9;
}

/// Shows a bottom sheet with tablet-optimized constraints
/// 
/// On tablets (width >= 600px):
/// - Max width: 500px, centered
/// - Max height: 50% of screen
/// 
/// On phones:
/// - Full width
/// - Max height: 90% of screen
Future<T?> showTabletOptimizedSheet<T>({
  required BuildContext context,
  required Widget Function(BuildContext) builder,
  bool isScrollControlled = true,
  bool isDismissible = true,
  bool enableDrag = true,
  Color? backgroundColor,
  double? customMaxHeight,
  double? customMaxWidth,
}) {
  final isTablet = MediaQuery.of(context).size.width >= 600;
  final screenHeight = MediaQuery.of(context).size.height;
  
  final maxHeight = customMaxHeight ?? (isTablet 
      ? screenHeight * TabletSheetConstraints.maxHeightFraction
      : screenHeight * TabletSheetConstraints.phoneMaxHeightFraction);
  
  final maxWidth = customMaxWidth ?? (isTablet 
      ? TabletSheetConstraints.maxWidth 
      : double.infinity);

  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: isScrollControlled,
    isDismissible: isDismissible,
    enableDrag: enableDrag,
    backgroundColor: Colors.transparent,
    constraints: BoxConstraints(
      maxHeight: maxHeight,
      maxWidth: maxWidth,
    ),
    builder: (context) => TabletSheetContainer(
      maxWidth: maxWidth,
      child: builder(context),
    ),
  );
}

/// Container widget that applies tablet constraints to bottom sheet content
class TabletSheetContainer extends StatelessWidget {
  final Widget child;
  final double maxWidth;
  final EdgeInsets? padding;

  const TabletSheetContainer({
    super.key,
    required this.child,
    this.maxWidth = TabletSheetConstraints.maxWidth,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isTablet = context.isTablet;

    return Center(
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: isTablet ? maxWidth : double.infinity,
        ),
        child: Container(
          decoration: BoxDecoration(
            color: cs.surface,
            borderRadius: const BorderRadius.vertical(
              top: Radius.circular(20),
            ),
            boxShadow: isTablet ? [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.1),
                blurRadius: 20,
                offset: const Offset(0, -4),
              ),
            ] : null,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Drag handle
              Padding(
                padding: const EdgeInsets.only(top: 12, bottom: 8),
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: cs.outlineVariant,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Flexible(child: child),
            ],
          ),
        ),
      ),
    );
  }
}

/// Mixin for StatelessWidget bottom sheets to add tablet constraints
mixin TabletSheetMixin {
  /// Wraps content with tablet-optimized constraints
  Widget wrapWithTabletConstraints(BuildContext context, Widget content) {
    return TabletSheetContainer(child: content);
  }
}
