import 'dart:math' as math;
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// A branded pull-to-refresh indicator with the app logo and haptic feedback.
/// 
/// Features:
/// - Custom app logo animation during refresh
/// - Haptic feedback on pull threshold
/// - Glassmorphism background
/// - Smooth spring animations
class BrandedRefreshIndicator extends StatefulWidget {
  final Widget child;
  final Future<void> Function() onRefresh;
  final double triggerOffset;

  const BrandedRefreshIndicator({
    super.key,
    required this.child,
    required this.onRefresh,
    this.triggerOffset = 100.0,
  });

  @override
  State<BrandedRefreshIndicator> createState() => _BrandedRefreshIndicatorState();
}

class _BrandedRefreshIndicatorState extends State<BrandedRefreshIndicator>
    with TickerProviderStateMixin {
  double _dragOffset = 0.0;
  bool _isRefreshing = false;
  bool _hasTriggeredHaptic = false;

  late AnimationController _rotationController;
  late AnimationController _pulseController;
  late AnimationController _bounceController;
  late Animation<double> _pulseAnimation;
  late Animation<double> _bounceAnimation;

  @override
  void initState() {
    super.initState();

    _rotationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    _bounceController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );

    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.15).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _bounceAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _bounceController, curve: Curves.elasticOut),
    );
  }

  @override
  void dispose() {
    _rotationController.dispose();
    _pulseController.dispose();
    _bounceController.dispose();
    super.dispose();
  }

  void _onDragUpdate(double delta) {
    if (_isRefreshing) return;

    setState(() {
      _dragOffset = (_dragOffset + delta).clamp(0.0, widget.triggerOffset * 1.5);
    });

    // Progressive haptic feedback during pull
    final pullProgress = _dragOffset / widget.triggerOffset;
    
    // Light haptic at 50% pull
    if (pullProgress >= 0.5 && pullProgress < 0.6 && !_hasTriggeredHaptic) {
      HapticFeedback.selectionClick();
    }
    
    // Strong haptic when crossing threshold
    if (_dragOffset >= widget.triggerOffset && !_hasTriggeredHaptic) {
      HapticFeedback.heavyImpact();
      _hasTriggeredHaptic = true;
      _bounceController.forward(from: 0.0);
    } else if (_dragOffset < widget.triggerOffset * 0.4 && _hasTriggeredHaptic) {
      _hasTriggeredHaptic = false;
    }
  }

  Future<void> _onDragEnd() async {
    if (_isRefreshing) return;

    if (_dragOffset >= widget.triggerOffset) {
      setState(() => _isRefreshing = true);

      // Start animations
      _rotationController.repeat();
      _pulseController.repeat(reverse: true);
      HapticFeedback.lightImpact();

      try {
        await widget.onRefresh();
      } finally {
        if (mounted) {
          // Success haptic
          HapticFeedback.lightImpact();

          // Stop animations
          _rotationController.stop();
          _pulseController.stop();

          // Animate out
          setState(() {
            _isRefreshing = false;
            _dragOffset = 0.0;
            _hasTriggeredHaptic = false;
          });
        }
      }
    } else {
      // Snap back
      setState(() {
        _dragOffset = 0.0;
        _hasTriggeredHaptic = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final progress = (_dragOffset / widget.triggerOffset).clamp(0.0, 1.0);

    return NotificationListener<ScrollNotification>(
      onNotification: (notification) {
        if (notification is ScrollUpdateNotification) {
          if (notification.metrics.pixels < 0) {
            _onDragUpdate(-(notification.scrollDelta ?? 0));
          }
        } else if (notification is ScrollEndNotification) {
          if (notification.metrics.pixels <= 0 && _dragOffset > 0) {
            _onDragEnd();
          }
        } else if (notification is OverscrollNotification) {
          if (notification.overscroll < 0) {
            _onDragUpdate(-notification.overscroll);
          }
        }
        return false;
      },
      child: Stack(
        children: [
          // Main content with translation
          Transform.translate(
            offset: Offset(0, _isRefreshing ? widget.triggerOffset * 0.8 : _dragOffset * 0.5),
            child: widget.child,
          ),

          // Refresh indicator overlay
          if (_dragOffset > 0 || _isRefreshing)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                height: _isRefreshing ? widget.triggerOffset * 0.8 : _dragOffset * 0.5,
                child: Center(
                  child: _BrandedLoader(
                    progress: progress,
                    isRefreshing: _isRefreshing,
                    rotationController: _rotationController,
                    pulseAnimation: _pulseAnimation,
                    bounceAnimation: _bounceAnimation,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// The actual branded loader widget with modern animations (no logo)
class _BrandedLoader extends StatelessWidget {
  final double progress;
  final bool isRefreshing;
  final AnimationController rotationController;
  final Animation<double> pulseAnimation;
  final Animation<double> bounceAnimation;

  const _BrandedLoader({
    required this.progress,
    required this.isRefreshing,
    required this.rotationController,
    required this.pulseAnimation,
    required this.bounceAnimation,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return AnimatedBuilder(
      animation: Listenable.merge([
        rotationController,
        pulseAnimation,
        bounceAnimation,
      ]),
      builder: (context, child) {
        final scale = isRefreshing
            ? pulseAnimation.value
            : 0.6 + (progress * 0.4) + (bounceAnimation.value * 0.15);

        return Transform.scale(
          scale: scale,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
              child: Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(24),
                  gradient: LinearGradient(
                    colors: [
                      cs.primary.withOpacity(isDark ? 0.25 : 0.12),
                      cs.tertiary.withOpacity(isDark ? 0.15 : 0.08),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  border: Border.all(
                    color: cs.primary.withOpacity(0.25),
                    width: 1.5,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: cs.primary.withOpacity(0.15),
                      blurRadius: 16,
                      spreadRadius: 1,
                    ),
                  ],
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Rotating spinner when refreshing
                    if (isRefreshing)
                      AnimatedBuilder(
                        animation: rotationController,
                        builder: (context, child) {
                          return Transform.rotate(
                            angle: rotationController.value * 2 * math.pi,
                            child: CustomPaint(
                              size: const Size(36, 36),
                              painter: _ModernSpinnerPainter(
                                primaryColor: cs.primary,
                                secondaryColor: cs.tertiary,
                              ),
                            ),
                          );
                        },
                      ),

                    // Progress arc (when pulling)
                    if (!isRefreshing && progress > 0)
                      CustomPaint(
                        size: const Size(36, 36),
                        painter: _ProgressArcPainter(
                          color: cs.primary,
                          progress: progress,
                        ),
                      ),

                    // Center dot with glow
                    if (isRefreshing)
                      AnimatedBuilder(
                        animation: pulseAnimation,
                        builder: (context, child) {
                          return Container(
                            width: 8 * pulseAnimation.value,
                            height: 8 * pulseAnimation.value,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: LinearGradient(
                                colors: [cs.primary, cs.tertiary],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: cs.primary.withOpacity(0.5),
                                  blurRadius: 8,
                                  spreadRadius: 2,
                                ),
                              ],
                            ),
                          );
                        },
                      ),

                    // Pull indicator arrow (when not refreshing)
                    if (!isRefreshing)
                      AnimatedOpacity(
                        opacity: progress,
                        duration: const Duration(milliseconds: 150),
                        child: Transform.rotate(
                          angle: progress * math.pi,
                          child: Icon(
                            Icons.arrow_downward_rounded,
                            size: 18,
                            color: cs.primary,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

/// Modern gradient spinner painter
class _ModernSpinnerPainter extends CustomPainter {
  final Color primaryColor;
  final Color secondaryColor;

  _ModernSpinnerPainter({
    required this.primaryColor,
    required this.secondaryColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width / 2) - 3;

    // Create gradient arc
    final rect = Rect.fromCircle(center: center, radius: radius);
    
    final gradientPaint = Paint()
      ..shader = SweepGradient(
        colors: [
          primaryColor.withOpacity(0.0),
          primaryColor.withOpacity(0.3),
          primaryColor,
          secondaryColor,
          secondaryColor.withOpacity(0.3),
          primaryColor.withOpacity(0.0),
        ],
        stops: const [0.0, 0.15, 0.35, 0.65, 0.85, 1.0],
        startAngle: 0,
        endAngle: 2 * math.pi,
      ).createShader(rect)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, gradientPaint);
  }

  @override
  bool shouldRepaint(covariant _ModernSpinnerPainter oldDelegate) => false;
}

/// Paints the rotating spinner arc during refresh
class _SpinnerPainter extends CustomPainter {
  final Color color;
  final double progress;

  _SpinnerPainter({required this.color, required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round;

    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width / 2) - 4;

    // Draw arc
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      math.pi * 1.5,
      false,
      paint,
    );

    // Draw fading tail
    final fadePaint = Paint()
      ..shader = SweepGradient(
        colors: [
          color.withOpacity(0.0),
          color,
        ],
        startAngle: -math.pi / 2,
        endAngle: math.pi,
      ).createShader(Rect.fromCircle(center: center, radius: radius))
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      math.pi,
      math.pi / 2,
      false,
      fadePaint,
    );
  }

  @override
  bool shouldRepaint(covariant _SpinnerPainter oldDelegate) => true;
}

/// Paints the progress arc when pulling down
class _ProgressArcPainter extends CustomPainter {
  final Color color;
  final double progress;

  _ProgressArcPainter({required this.color, required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final backgroundPaint = Paint()
      ..color = color.withOpacity(0.2)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round;

    final progressPaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round;

    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width / 2) - 4;

    // Background circle
    canvas.drawCircle(center, radius, backgroundPaint);

    // Progress arc
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      2 * math.pi * progress,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _ProgressArcPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}
