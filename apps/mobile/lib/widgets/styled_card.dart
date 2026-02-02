import 'package:flutter/material.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/utils/animations.dart';

/// A styled card with theme-aware colors, animations, and compact design
class StyledCard extends StatefulWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final VoidCallback? onTap;
  final BorderRadius? borderRadius;
  final Color? backgroundColor;
  final double? elevation;
  final bool enableTapAnimation;
  final bool enableEntrance;
  final Duration entranceDelay;

  const StyledCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.onTap,
    this.borderRadius,
    this.backgroundColor,
    this.elevation,
    this.enableTapAnimation = true,
    this.enableEntrance = false,
    this.entranceDelay = Duration.zero,
  });

  @override
  State<StyledCard> createState() => _StyledCardState();
}

class _StyledCardState extends State<StyledCard> with SingleTickerProviderStateMixin {
  late AnimationController _scaleController;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _scaleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
    );
    _scale = Tween<double>(begin: 1.0, end: 0.98).animate(
      CurvedAnimation(parent: _scaleController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _scaleController.dispose();
    super.dispose();
  }

  void _onTapDown(TapDownDetails details) {
    if (widget.enableTapAnimation && widget.onTap != null) {
      _scaleController.forward();
    }
  }

  void _onTapUp(TapUpDetails details) {
    if (widget.enableTapAnimation && widget.onTap != null) {
      _scaleController.reverse();
    }
  }

  void _onTapCancel() {
    if (widget.enableTapAnimation) {
      _scaleController.reverse();
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final radius = widget.borderRadius ?? BorderRadius.circular(AppRadius.md);

    Widget card = Container(
      margin: widget.margin,
      child: Material(
        color: widget.backgroundColor ?? cs.surfaceContainerHighest,
        borderRadius: radius,
        elevation: widget.elevation ?? 0,
        child: GestureDetector(
          onTapDown: _onTapDown,
          onTapUp: _onTapUp,
          onTapCancel: _onTapCancel,
          onTap: widget.onTap,
          child: Container(
            padding: widget.padding ?? const EdgeInsets.all(10),
            decoration: BoxDecoration(
              borderRadius: radius,
              border: Border.all(
                color: cs.outline.withValues(alpha: 0.4),
              ),
            ),
            child: widget.child,
          ),
        ),
      ),
    );

    if (widget.enableTapAnimation && widget.onTap != null) {
      card = ScaleTransition(scale: _scale, child: card);
    }

    if (widget.enableEntrance) {
      card = FadeSlideTransition(
        delay: widget.entranceDelay,
        child: card,
      );
    }

    return card;
  }
}

/// A variant of StyledCard with gradient background
class StyledGradientCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final VoidCallback? onTap;
  final BorderRadius? borderRadius;
  final List<Color>? gradientColors;

  const StyledGradientCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.onTap,
    this.borderRadius,
    this.gradientColors,
  });

  @override
  Widget build(BuildContext context) {
    final radius = borderRadius ?? BorderRadius.circular(AppRadius.md);
    final colors = gradientColors ?? [AppColors.primary, AppColors.accent];

    return TapScaleWidget(
      onTap: onTap,
      child: Container(
        margin: margin,
        padding: padding ?? const EdgeInsets.all(10),
        decoration: BoxDecoration(
          borderRadius: radius,
          gradient: LinearGradient(
            colors: colors,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: child,
      ),
    );
  }
}
