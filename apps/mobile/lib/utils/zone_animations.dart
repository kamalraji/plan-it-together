import 'package:flutter/material.dart';

/// Premium animation utilities for Zone feature interactions.
/// Provides reusable animation controllers and curves for consistent motion.
class ZoneAnimations {
  ZoneAnimations._();

  // ============= DURATIONS =============
  static const Duration fast = Duration(milliseconds: 150);
  static const Duration normal = Duration(milliseconds: 250);
  static const Duration slow = Duration(milliseconds: 400);
  static const Duration celebration = Duration(milliseconds: 600);

  // ============= CURVES =============
  static const Curve defaultCurve = Curves.easeOutCubic;
  static const Curve bouncyCurve = Curves.elasticOut;
  static const Curve snappyCurve = Curves.easeOutBack;
  static const Curve smoothCurve = Curves.easeInOutCubic;

  // ============= SCALE ANIMATIONS =============

  /// Creates a scale animation for tap feedback.
  static Animation<double> createScaleAnimation(
    AnimationController controller, {
    double begin = 1.0,
    double end = 0.95,
  }) {
    return Tween<double>(begin: begin, end: end).animate(
      CurvedAnimation(parent: controller, curve: defaultCurve),
    );
  }

  /// Creates a bounce scale animation for success feedback.
  static Animation<double> createBounceScaleAnimation(
    AnimationController controller, {
    double overshoot = 1.15,
  }) {
    return TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween(begin: 1.0, end: overshoot).chain(CurveTween(curve: Curves.easeOut)),
        weight: 40,
      ),
      TweenSequenceItem(
        tween: Tween(begin: overshoot, end: 1.0).chain(CurveTween(curve: Curves.elasticOut)),
        weight: 60,
      ),
    ]).animate(controller);
  }

  /// Creates a pulse animation for attention.
  static Animation<double> createPulseAnimation(AnimationController controller) {
    return TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.1), weight: 50),
      TweenSequenceItem(tween: Tween(begin: 1.1, end: 1.0), weight: 50),
    ]).animate(CurvedAnimation(parent: controller, curve: Curves.easeInOut));
  }

  // ============= FADE ANIMATIONS =============

  /// Creates a fade-in animation.
  static Animation<double> createFadeInAnimation(
    AnimationController controller, {
    double begin = 0.0,
    double end = 1.0,
  }) {
    return Tween<double>(begin: begin, end: end).animate(
      CurvedAnimation(parent: controller, curve: defaultCurve),
    );
  }

  // ============= SLIDE ANIMATIONS =============

  /// Creates a slide-up animation for entrance.
  static Animation<Offset> createSlideUpAnimation(
    AnimationController controller, {
    double beginY = 0.3,
  }) {
    return Tween<Offset>(
      begin: Offset(0, beginY),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: controller, curve: defaultCurve));
  }

  /// Creates a slide-in animation from right.
  static Animation<Offset> createSlideInRightAnimation(AnimationController controller) {
    return Tween<Offset>(
      begin: const Offset(1.0, 0),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: controller, curve: defaultCurve));
  }

  // ============= STAGGERED ANIMATIONS =============

  /// Creates an interval for staggered list animations.
  static Animation<double> createStaggeredAnimation(
    AnimationController controller, {
    required int index,
    required int total,
    double overlapFactor = 0.4,
  }) {
    final start = (index / total) * (1 - overlapFactor);
    final end = start + overlapFactor;

    return Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: controller,
        curve: Interval(start.clamp(0.0, 1.0), end.clamp(0.0, 1.0), curve: defaultCurve),
      ),
    );
  }
}

/// Animated scale wrapper for tap feedback.
class TapScaleWrapper extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double scaleDown;
  final Duration duration;
  final bool enabled;

  const TapScaleWrapper({
    super.key,
    required this.child,
    this.onTap,
    this.scaleDown = 0.95,
    this.duration = const Duration(milliseconds: 100),
    this.enabled = true,
  });

  @override
  State<TapScaleWrapper> createState() => _TapScaleWrapperState();
}

class _TapScaleWrapperState extends State<TapScaleWrapper>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(duration: widget.duration, vsync: this);
    _scaleAnimation = Tween<double>(begin: 1.0, end: widget.scaleDown).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails _) {
    if (widget.enabled) _controller.forward();
  }

  void _handleTapUp(TapUpDetails _) {
    if (widget.enabled) _controller.reverse();
  }

  void _handleTapCancel() {
    if (widget.enabled) _controller.reverse();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: _handleTapDown,
      onTapUp: _handleTapUp,
      onTapCancel: _handleTapCancel,
      onTap: widget.enabled ? widget.onTap : null,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: widget.child,
      ),
    );
  }
}

/// Animated counter with rolling number effect.
class AnimatedCounter extends StatelessWidget {
  final int value;
  final TextStyle? style;
  final Duration duration;

  const AnimatedCounter({
    super.key,
    required this.value,
    this.style,
    this.duration = const Duration(milliseconds: 300),
  });

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<int>(
      tween: IntTween(begin: 0, end: value),
      duration: duration,
      builder: (context, animatedValue, child) {
        return Text(
          animatedValue.toString(),
          style: style,
        );
      },
    );
  }
}

/// Animated points float effect for earning points.
class PointsFloatAnimation extends StatefulWidget {
  final int points;
  final VoidCallback? onComplete;

  const PointsFloatAnimation({
    super.key,
    required this.points,
    this.onComplete,
  });

  @override
  State<PointsFloatAnimation> createState() => _PointsFloatAnimationState();
}

class _PointsFloatAnimationState extends State<PointsFloatAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: ZoneAnimations.celebration,
      vsync: this,
    );

    _fadeAnimation = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 0.0, end: 1.0), weight: 20),
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.0), weight: 60),
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 0.0), weight: 20),
    ]).animate(_controller);

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.5),
      end: const Offset(0, -1.5),
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic));

    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 0.5, end: 1.2), weight: 30),
      TweenSequenceItem(tween: Tween(begin: 1.2, end: 1.0), weight: 70),
    ]).animate(_controller);

    _controller.forward().then((_) => widget.onComplete?.call());
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return SlideTransition(
          position: _slideAnimation,
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: ScaleTransition(
              scale: _scaleAnimation,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      theme.colorScheme.primary,
                      theme.colorScheme.secondary,
                    ],
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: theme.colorScheme.primary.withOpacity(0.4),
                      blurRadius: 12,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: Text(
                  '+${widget.points}',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: theme.colorScheme.onPrimary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

/// Pulsing glow effect for highlighted items.
class PulsingGlow extends StatefulWidget {
  final Widget child;
  final Color? glowColor;
  final double maxBlur;
  final Duration duration;

  const PulsingGlow({
    super.key,
    required this.child,
    this.glowColor,
    this.maxBlur = 16.0,
    this.duration = const Duration(milliseconds: 1500),
  });

  @override
  State<PulsingGlow> createState() => _PulsingGlowState();
}

class _PulsingGlowState extends State<PulsingGlow>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _glowAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(duration: widget.duration, vsync: this)
      ..repeat(reverse: true);
    _glowAnimation = Tween<double>(begin: 0.0, end: widget.maxBlur).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final color = widget.glowColor ?? Theme.of(context).colorScheme.primary;

    return AnimatedBuilder(
      animation: _glowAnimation,
      builder: (context, child) {
        return Container(
          decoration: BoxDecoration(
            boxShadow: [
              BoxShadow(
                color: color.withOpacity(0.4),
                blurRadius: _glowAnimation.value,
                spreadRadius: _glowAnimation.value / 4,
              ),
            ],
          ),
          child: widget.child,
        );
      },
    );
  }
}
