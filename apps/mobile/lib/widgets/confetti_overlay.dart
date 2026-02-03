import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

enum ConfettiStyle { burst, cascade, continuous }

/// A confetti celebration animation overlay
class ConfettiOverlay extends StatefulWidget {
  final bool isPlaying;
  final VoidCallback? onComplete;
  final ConfettiStyle style;
  final int particleCount;
  final Duration duration;
  final List<Color>? colors;

  const ConfettiOverlay({
    Key? key,
    required this.isPlaying,
    this.onComplete,
    this.style = ConfettiStyle.burst,
    this.particleCount = 80,
    this.duration = const Duration(seconds: 3),
    this.colors,
  }) : super(key: key);

  @override
  State<ConfettiOverlay> createState() => _ConfettiOverlayState();
}

class _ConfettiOverlayState extends State<ConfettiOverlay>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late List<ConfettiParticle> _particles;
  final math.Random _random = math.Random();

  static const List<Color> _defaultColors = [
    Color(0xFFFFD700), // Gold
    Color(0xFF9C27B0), // Purple
    Color(0xFFE91E63), // Pink
    Color(0xFF2196F3), // Blue
    Color(0xFF4CAF50), // Green
    Color(0xFFFF9800), // Orange
    Color(0xFFE040FB), // Purple accent
  ];

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: widget.duration,
    );

    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        widget.onComplete?.call();
      }
    });

    _generateParticles();

    if (widget.isPlaying) {
      HapticFeedback.heavyImpact();
      _controller.forward();
    }
  }

  @override
  void didUpdateWidget(ConfettiOverlay oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isPlaying && !oldWidget.isPlaying) {
      _generateParticles();
      HapticFeedback.heavyImpact();
      _controller.forward(from: 0);
    } else if (!widget.isPlaying && oldWidget.isPlaying) {
      _controller.stop();
    }
  }

  void _generateParticles() {
    final colors = widget.colors ?? _defaultColors;
    _particles = List.generate(widget.particleCount, (index) {
      return ConfettiParticle(
        color: colors[_random.nextInt(colors.length)],
        initialX: _random.nextDouble(),
        initialY: widget.style == ConfettiStyle.burst 
            ? 0.5 
            : -0.1 - _random.nextDouble() * 0.3,
        velocityX: (_random.nextDouble() - 0.5) * 2,
        velocityY: widget.style == ConfettiStyle.burst
            ? -1 - _random.nextDouble() * 1.5
            : 0.5 + _random.nextDouble() * 0.5,
        rotation: _random.nextDouble() * math.pi * 2,
        rotationSpeed: (_random.nextDouble() - 0.5) * 10,
        size: 8 + _random.nextDouble() * 8,
        shape: ConfettiShape.values[_random.nextInt(ConfettiShape.values.length)],
        delay: _random.nextDouble() * 0.3,
      );
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.isPlaying && !_controller.isAnimating) {
      return const SizedBox.shrink();
    }

    return IgnorePointer(
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return CustomPaint(
            size: MediaQuery.of(context).size,
            painter: ConfettiPainter(
              particles: _particles,
              progress: _controller.value,
              style: widget.style,
            ),
          );
        },
      ),
    );
  }
}

enum ConfettiShape { rectangle, circle, star }

class ConfettiParticle {
  final Color color;
  final double initialX;
  final double initialY;
  final double velocityX;
  final double velocityY;
  final double rotation;
  final double rotationSpeed;
  final double size;
  final ConfettiShape shape;
  final double delay;

  ConfettiParticle({
    required this.color,
    required this.initialX,
    required this.initialY,
    required this.velocityX,
    required this.velocityY,
    required this.rotation,
    required this.rotationSpeed,
    required this.size,
    required this.shape,
    required this.delay,
  });
}

class ConfettiPainter extends CustomPainter {
  final List<ConfettiParticle> particles;
  final double progress;
  final ConfettiStyle style;
  static const double gravity = 0.8;

  ConfettiPainter({
    required this.particles,
    required this.progress,
    required this.style,
  });

  @override
  void paint(Canvas canvas, Size size) {
    for (final particle in particles) {
      // Skip if not yet started
      if (progress < particle.delay) continue;

      final adjustedProgress = (progress - particle.delay) / (1 - particle.delay);
      if (adjustedProgress > 1) continue;

      // Calculate position with physics
      final t = adjustedProgress * 3; // Time multiplier
      double x = particle.initialX * size.width + particle.velocityX * t * 50;
      double y;

      if (style == ConfettiStyle.burst) {
        // Burst up then fall with gravity
        y = particle.initialY * size.height +
            particle.velocityY * t * 100 +
            gravity * t * t * 50;
      } else {
        // Fall from top
        y = particle.initialY * size.height + particle.velocityY * t * 150;
      }

      // Add wind sway
      x += math.sin(t * 3 + particle.initialX * 10) * 20;

      // Skip if out of bounds
      if (y > size.height || y < -50 || x < -50 || x > size.width + 50) continue;

      // Calculate opacity (fade out at end)
      final opacity = (1 - adjustedProgress).clamp(0.0, 1.0);

      final paint = Paint()
        ..color = particle.color.withOpacity(opacity)
        ..style = PaintingStyle.fill;

      canvas.save();
      canvas.translate(x, y);
      canvas.rotate(particle.rotation + particle.rotationSpeed * t);

      switch (particle.shape) {
        case ConfettiShape.rectangle:
          canvas.drawRect(
            Rect.fromCenter(
              center: Offset.zero,
              width: particle.size,
              height: particle.size * 0.6,
            ),
            paint,
          );
          break;
        case ConfettiShape.circle:
          canvas.drawCircle(Offset.zero, particle.size / 2, paint);
          break;
        case ConfettiShape.star:
          _drawStar(canvas, particle.size / 2, paint);
          break;
      }

      canvas.restore();
    }
  }

  void _drawStar(Canvas canvas, double radius, Paint paint) {
    final path = Path();
    const points = 5;
    final innerRadius = radius * 0.4;

    for (int i = 0; i < points * 2; i++) {
      final r = i.isEven ? radius : innerRadius;
      final angle = (i * math.pi / points) - math.pi / 2;
      final x = r * math.cos(angle);
      final y = r * math.sin(angle);
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    path.close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(ConfettiPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}

/// A celebratory achievement banner that slides in
class AchievementBanner extends StatefulWidget {
  final String title;
  final String? subtitle;
  final IconData icon;
  final Color? color;
  final VoidCallback? onDismiss;
  final Duration duration;

  const AchievementBanner({
    Key? key,
    required this.title,
    this.subtitle,
    this.icon = Icons.emoji_events,
    this.color,
    this.onDismiss,
    this.duration = const Duration(seconds: 4),
  }) : super(key: key);

  @override
  State<AchievementBanner> createState() => _AchievementBannerState();
}

class _AchievementBannerState extends State<AchievementBanner>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _slideAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );

    _slideAnimation = Tween<double>(begin: -100, end: 0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
    );

    _scaleAnimation = Tween<double>(begin: 0.5, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
    );

    _controller.forward();

    // Auto dismiss
    Future.delayed(widget.duration, () {
      if (mounted) _dismiss();
    });
  }

  void _dismiss() {
    _controller.reverse().then((_) {
      widget.onDismiss?.call();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final color = widget.color ?? cs.primary;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(0, _slideAnimation.value),
          child: Transform.scale(
            scale: _scaleAnimation.value,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Material(
                  elevation: 8,
                  borderRadius: BorderRadius.circular(16),
                  color: color,
                  child: InkWell(
                    onTap: _dismiss,
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(widget.icon, color: Colors.white, size: 28),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  widget.title,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                if (widget.subtitle != null)
                                  Text(
                                    widget.subtitle!,
                                    style: TextStyle(
                                      color: Colors.white.withOpacity(0.9),
                                      fontSize: 14,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                          Icon(
                            Icons.close,
                            color: Colors.white.withOpacity(0.7),
                          ),
                        ],
                      ),
                    ),
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

/// A pulsing widget for drawing attention
class PulsingWidget extends StatefulWidget {
  final Widget child;
  final bool isPulsing;
  final Color? glowColor;
  final double minScale;
  final double maxScale;
  final Duration duration;

  const PulsingWidget({
    Key? key,
    required this.child,
    this.isPulsing = true,
    this.glowColor,
    this.minScale = 1.0,
    this.maxScale = 1.1,
    this.duration = const Duration(milliseconds: 1500),
  }) : super(key: key);

  @override
  State<PulsingWidget> createState() => _PulsingWidgetState();
}

class _PulsingWidgetState extends State<PulsingWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _glowAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: widget.duration,
    );

    _scaleAnimation = Tween<double>(
      begin: widget.minScale,
      end: widget.maxScale,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));

    _glowAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );

    if (widget.isPulsing) {
      _controller.repeat(reverse: true);
    }
  }

  @override
  void didUpdateWidget(PulsingWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isPulsing && !oldWidget.isPulsing) {
      _controller.repeat(reverse: true);
    } else if (!widget.isPulsing && oldWidget.isPulsing) {
      _controller.stop();
      _controller.value = 0;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.isPulsing) {
      return widget.child;
    }

    final glowColor = widget.glowColor ?? Theme.of(context).colorScheme.error;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: glowColor.withOpacity(_glowAnimation.value * 0.5),
                  blurRadius: 8 + (_glowAnimation.value * 8),
                  spreadRadius: _glowAnimation.value * 4,
                ),
              ],
            ),
            child: widget.child,
          ),
        );
      },
    );
  }
}

/// Bounce animation widget for selections
class BounceAnimation extends StatefulWidget {
  final Widget child;
  final bool animate;
  final Duration duration;
  final Curve curve;

  const BounceAnimation({
    Key? key,
    required this.child,
    this.animate = false,
    this.duration = const Duration(milliseconds: 400),
    this.curve = Curves.elasticOut,
  }) : super(key: key);

  @override
  State<BounceAnimation> createState() => _BounceAnimationState();
}

class _BounceAnimationState extends State<BounceAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: widget.duration,
    );

    _animation = TweenSequence([
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.15), weight: 40),
      TweenSequenceItem(tween: Tween(begin: 1.15, end: 0.95), weight: 30),
      TweenSequenceItem(tween: Tween(begin: 0.95, end: 1.0), weight: 30),
    ]).animate(CurvedAnimation(
      parent: _controller,
      curve: widget.curve,
    ));
  }

  @override
  void didUpdateWidget(BounceAnimation oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.animate && !oldWidget.animate) {
      _controller.forward(from: 0);
      HapticFeedback.selectionClick();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Transform.scale(
          scale: _animation.value,
          child: widget.child,
        );
      },
    );
  }
}

/// Online indicator with pulsing animation
class OnlineIndicatorPulse extends StatefulWidget {
  final bool isOnline;
  final double size;

  const OnlineIndicatorPulse({
    Key? key,
    required this.isOnline,
    this.size = 16,
  }) : super(key: key);

  @override
  State<OnlineIndicatorPulse> createState() => _OnlineIndicatorPulseState();
}

class _OnlineIndicatorPulseState extends State<OnlineIndicatorPulse>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    );

    if (widget.isOnline) {
      _controller.repeat(reverse: true);
    }
  }

  @override
  void didUpdateWidget(OnlineIndicatorPulse oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isOnline && !oldWidget.isOnline) {
      _controller.repeat(reverse: true);
    } else if (!widget.isOnline && oldWidget.isOnline) {
      _controller.stop();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.isOnline) {
      return const SizedBox.shrink();
    }

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Container(
          width: widget.size,
          height: widget.size,
          decoration: BoxDecoration(
            color: Colors.green,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: Colors.green.withOpacity(0.3 + _controller.value * 0.4),
                blurRadius: 4 + _controller.value * 6,
                spreadRadius: _controller.value * 3,
              ),
            ],
          ),
        );
      },
    );
  }
}
