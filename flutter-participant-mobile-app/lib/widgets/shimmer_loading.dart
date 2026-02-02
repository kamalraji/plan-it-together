import 'package:flutter/material.dart';

/// A widget that applies a shimmer loading effect to its child
/// 
/// Wrapped in ExcludeSemantics to prevent screen readers from 
/// announcing decorative loading placeholders.
class ShimmerLoading extends StatefulWidget {
  final Widget child;
  final Duration duration;
  final Color? baseColor;
  final Color? highlightColor;

  const ShimmerLoading({
    Key? key,
    required this.child,
    this.duration = const Duration(milliseconds: 1500),
    this.baseColor,
    this.highlightColor,
  }) : super(key: key);

  @override
  State<ShimmerLoading> createState() => _ShimmerLoadingState();
}

class _ShimmerLoadingState extends State<ShimmerLoading> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;
  final ValueNotifier<double> _animationNotifier = ValueNotifier(0.0);

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration)
      ..repeat();
    _animation = Tween<double>(begin: -2.0, end: 2.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutSine),
    );
    _animation.addListener(() {
      _animationNotifier.value = _animation.value;
    });
  }

  @override
  void dispose() {
    _animationNotifier.dispose();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    final baseColor = widget.baseColor ?? 
        (isDark ? cs.surfaceContainerHighest : cs.surfaceContainerHighest);
    final highlightColor = widget.highlightColor ?? 
        (isDark ? cs.surface : Colors.white);

    // Exclude decorative shimmers from screen readers
    return ExcludeSemantics(
      child: ValueListenableBuilder<double>(
        valueListenable: _animationNotifier,
        builder: (context, value, _) {
          return ShaderMask(
            blendMode: BlendMode.srcATop,
            shaderCallback: (bounds) {
              return LinearGradient(
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
                colors: [
                  baseColor,
                  highlightColor,
                  baseColor,
                ],
                stops: const [0.0, 0.5, 1.0],
                transform: _SlidingGradientTransform(value),
              ).createShader(bounds);
            },
            child: widget.child,
          );
        },
      ),
    );
  }
}

class _SlidingGradientTransform extends GradientTransform {
  final double slidePercent;

  const _SlidingGradientTransform(this.slidePercent);

  @override
  Matrix4? transform(Rect bounds, {TextDirection? textDirection}) {
    return Matrix4.translationValues(bounds.width * slidePercent, 0.0, 0.0);
  }
}

/// A shimmer placeholder container with customizable dimensions
/// 
/// Automatically excludes itself from screen reader accessibility tree
/// since it's purely decorative loading content.
class ShimmerPlaceholder extends StatelessWidget {
  final double? width;
  final double? height;
  /// Border radius - can be a double (converted to circular) or a BorderRadius
  final dynamic borderRadius;
  final bool isCircle;

  const ShimmerPlaceholder({
    Key? key,
    this.width,
    this.height,
    this.borderRadius,
    this.isCircle = false,
  }) : super(key: key);

  BorderRadius? _resolveBorderRadius() {
    if (isCircle) return null;
    if (borderRadius == null) return BorderRadius.circular(8);
    if (borderRadius is BorderRadius) return borderRadius as BorderRadius;
    if (borderRadius is double) return BorderRadius.circular(borderRadius as double);
    if (borderRadius is int) return BorderRadius.circular((borderRadius as int).toDouble());
    return BorderRadius.circular(8);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    // ShimmerLoading already wraps with ExcludeSemantics
    return ShimmerLoading(
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: cs.surfaceContainerHighest,
          shape: isCircle ? BoxShape.circle : BoxShape.rectangle,
          borderRadius: _resolveBorderRadius(),
        ),
      ),
    );
  }
}

/// A shimmer placeholder specifically for text content
/// 
/// Provides a more natural loading appearance for text areas
/// with appropriate height and rounded corners.
class ShimmerTextPlaceholder extends StatelessWidget {
  final double width;
  final double? height;
  
  const ShimmerTextPlaceholder({
    super.key,
    required this.width,
    this.height,
  });
  
  @override
  Widget build(BuildContext context) {
    return ShimmerPlaceholder(
      width: width,
      height: height ?? 14,
      borderRadius: 4.0,
    );
  }
}

/// A shimmer row placeholder for list items
/// 
/// Provides a standard pattern for loading list item skeletons
/// with avatar, title, and subtitle placeholders.
class ShimmerListTilePlaceholder extends StatelessWidget {
  final bool showAvatar;
  final bool showSubtitle;
  final bool showTrailing;
  
  const ShimmerListTilePlaceholder({
    super.key,
    this.showAvatar = true,
    this.showSubtitle = true,
    this.showTrailing = false,
  });
  
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          if (showAvatar) ...[
            const ShimmerPlaceholder(
              width: 48,
              height: 48,
              isCircle: true,
            ),
            const SizedBox(width: 16),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const ShimmerTextPlaceholder(width: 120),
                if (showSubtitle) ...[
                  const SizedBox(height: 8),
                  ShimmerTextPlaceholder(width: 200, height: 12),
                ],
              ],
            ),
          ),
          if (showTrailing)
            const ShimmerPlaceholder(
              width: 24,
              height: 24,
              borderRadius: 4.0,
            ),
        ],
      ),
    );
  }
}
