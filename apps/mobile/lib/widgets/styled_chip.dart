import 'package:flutter/material.dart';
import 'package:thittam1hub/theme.dart';

/// Chip size variants
enum ChipSize { small, medium, large }

/// Chip style variants
enum ChipVariant { primary, secondary, outlined, ghost }

/// A compact themed chip with selection animation
class StyledChip extends StatefulWidget {
  final String label;
  final bool selected;
  final VoidCallback? onTap;
  final Color? color;
  final IconData? icon;
  final bool showDeleteIcon;
  final VoidCallback? onDelete;
  final ChipSize size;
  final ChipVariant variant;

  const StyledChip({
    super.key,
    required this.label,
    this.selected = false,
    this.onTap,
    this.color,
    this.icon,
    this.showDeleteIcon = false,
    this.onDelete,
    this.size = ChipSize.medium,
    this.variant = ChipVariant.primary,
  });

  @override
  State<StyledChip> createState() => _StyledChipState();
}

class _StyledChipState extends State<StyledChip> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 150),
    );
    _scale = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.08), weight: 50),
      TweenSequenceItem(tween: Tween(begin: 1.08, end: 1.0), weight: 50),
    ]).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
  }

  @override
  void didUpdateWidget(StyledChip oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.selected && !oldWidget.selected) {
      _controller.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  double get _fontSize {
    switch (widget.size) {
      case ChipSize.small:
        return 10;
      case ChipSize.medium:
        return 11;
      case ChipSize.large:
        return 13;
    }
  }

  EdgeInsets get _padding {
    switch (widget.size) {
      case ChipSize.small:
        return const EdgeInsets.symmetric(horizontal: 6, vertical: 2);
      case ChipSize.medium:
        return const EdgeInsets.symmetric(horizontal: 8, vertical: 4);
      case ChipSize.large:
        return const EdgeInsets.symmetric(horizontal: 12, vertical: 6);
    }
  }

  double get _iconSize {
    switch (widget.size) {
      case ChipSize.small:
        return 12;
      case ChipSize.medium:
        return 14;
      case ChipSize.large:
        return 16;
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final chipColor = widget.color ?? cs.primary;

    final (bgColor, fgColor, borderColor) = switch (widget.variant) {
      ChipVariant.primary => (
        widget.selected ? chipColor : cs.surfaceContainerHighest,
        widget.selected ? cs.onPrimary : cs.onSurface,
        widget.selected ? chipColor : cs.outline.withValues(alpha: 0.5),
      ),
      ChipVariant.secondary => (
        chipColor.withValues(alpha: 0.15),
        chipColor,
        chipColor.withValues(alpha: 0.3),
      ),
      ChipVariant.outlined => (
        Colors.transparent,
        cs.onSurface,
        cs.outline,
      ),
      ChipVariant.ghost => (
        Colors.transparent,
        cs.onSurfaceVariant,
        Colors.transparent,
      ),
    };

    return GestureDetector(
      onTap: widget.onTap,
      child: ScaleTransition(
        scale: _scale,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: _padding,
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: borderColor, width: 1),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (widget.icon != null) ...[
                Icon(widget.icon, size: _iconSize, color: fgColor),
                const SizedBox(width: 4),
              ],
              Text(
                widget.label,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: fgColor,
                      fontWeight: FontWeight.w600,
                      fontSize: _fontSize,
                    ),
              ),
              if (widget.showDeleteIcon && widget.onDelete != null) ...[
                const SizedBox(width: 2),
                GestureDetector(
                  onTap: widget.onDelete,
                  child: Icon(Icons.close, size: _iconSize, color: fgColor),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// Compact filter chip
class StyledFilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final ValueChanged<bool>? onSelected;
  final Color? selectedColor;

  const StyledFilterChip({
    super.key,
    required this.label,
    this.selected = false,
    this.onSelected,
    this.selectedColor,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return FilterChip(
      label: Text(label),
      selected: selected,
      onSelected: onSelected,
      selectedColor: selectedColor ?? cs.primary,
      backgroundColor: cs.surfaceContainerHighest,
      labelStyle: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: selected ? cs.onPrimary : cs.onSurface,
            fontSize: 11,
          ),
      shape: StadiumBorder(
        side: BorderSide(
          color: selected ? (selectedColor ?? cs.primary) : cs.outline.withValues(alpha: 0.5),
        ),
      ),
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 0),
      visualDensity: VisualDensity.compact,
    );
  }
}

/// Compact tag chip
class StyledTagChip extends StatelessWidget {
  final String label;
  final Color? color;
  final IconData? icon;

  const StyledTagChip({
    super.key,
    required this.label,
    this.color,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tagColor = color ?? cs.primary;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: tagColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: tagColor.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 10, color: tagColor),
            const SizedBox(width: 3),
          ],
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: tagColor,
                  fontWeight: FontWeight.w600,
                  fontSize: 10,
                ),
          ),
        ],
      ),
    );
  }
}
