import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

enum BoostType { premium, achievement, superLike }

/// Premium profile boost animation with glowing effects
class ProfileBoostAnimation extends StatefulWidget {
  final Widget child;
  final bool isActive;
  final BoostType type;
  final VoidCallback? onComplete;
  final Duration duration;
  final bool autoRepeat;

  const ProfileBoostAnimation({
    Key? key,
    required this.child,
    this.isActive = false,
    this.type = BoostType.premium,
    this.onComplete,
    this.duration = const Duration(milliseconds: 2500),
    this.autoRepeat = true,
  }) : super(key: key);

  @override
  State<ProfileBoostAnimation> createState() => _ProfileBoostAnimationState();
}

class _ProfileBoostAnimationState extends State<ProfileBoostAnimation>
    with TickerProviderStateMixin {
  late AnimationController _glowController;
  late AnimationController _rotationController;
  late AnimationController _sparkleController;
  
  late Animation<double> _glowAnimation;
  late Animation<double> _pulseAnimation;
  
  final List<_Sparkle> _sparkles = [];
  final math.Random _random = math.Random();

  @override
  void initState() {
    super.initState();
    
    _glowController = AnimationController(
      vsync: this,
      duration: widget.duration,
    );
    
    _rotationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    );
    
    _sparkleController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    );
    
    _glowAnimation = Tween<double>(begin: 0.3, end: 1.0).animate(
      CurvedAnimation(parent: _glowController, curve: Curves.easeInOut),
    );
    
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.03).animate(
      CurvedAnimation(parent: _glowController, curve: Curves.easeInOut),
    );
    
    _generateSparkles();
    
    if (widget.isActive) {
      _startAnimations();
    }
  }

  void _generateSparkles() {
    _sparkles.clear();
    for (int i = 0; i < 25; i++) {
      _sparkles.add(_Sparkle(
        angle: _random.nextDouble() * math.pi * 2,
        distance: 0.8 + _random.nextDouble() * 0.3,
        size: 2 + _random.nextDouble() * 4,
        delay: _random.nextDouble(),
        speed: 0.5 + _random.nextDouble() * 0.5,
        color: _getSparkleColor(),
      ));
    }
  }

  Color _getSparkleColor() {
    switch (widget.type) {
      case BoostType.premium:
        return [
          const Color(0xFFFFD700), // Gold
          const Color(0xFFFFA500), // Orange
          const Color(0xFFFFE066), // Light gold
        ][_random.nextInt(3)];
      case BoostType.achievement:
        return [
          const Color(0xFF9C27B0), // Purple
          const Color(0xFFE040FB), // Pink
          const Color(0xFF7C4DFF), // Deep purple
        ][_random.nextInt(3)];
      case BoostType.superLike:
        return [
          const Color(0xFF2196F3), // Blue
          const Color(0xFF03A9F4), // Light blue
          const Color(0xFF00BCD4), // Cyan
        ][_random.nextInt(3)];
    }
  }

  void _startAnimations() {
    HapticFeedback.heavyImpact();
    
    if (widget.autoRepeat) {
      _glowController.repeat(reverse: true);
      _rotationController.repeat();
      _sparkleController.repeat();
    } else {
      _glowController.forward().then((_) {
        widget.onComplete?.call();
      });
      _rotationController.forward();
      _sparkleController.forward();
    }
  }

  void _stopAnimations() {
    _glowController.stop();
    _rotationController.stop();
    _sparkleController.stop();
    _glowController.reset();
    _rotationController.reset();
    _sparkleController.reset();
  }

  @override
  void didUpdateWidget(ProfileBoostAnimation oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    if (widget.isActive && !oldWidget.isActive) {
      _generateSparkles();
      _startAnimations();
    } else if (!widget.isActive && oldWidget.isActive) {
      _stopAnimations();
    }
    
    if (widget.type != oldWidget.type) {
      _generateSparkles();
    }
  }

  @override
  void dispose() {
    _glowController.dispose();
    _rotationController.dispose();
    _sparkleController.dispose();
    super.dispose();
  }

  Color get _primaryColor {
    switch (widget.type) {
      case BoostType.premium:
        return const Color(0xFFFFD700);
      case BoostType.achievement:
        return const Color(0xFF9C27B0);
      case BoostType.superLike:
        return const Color(0xFF2196F3);
    }
  }

  Color get _secondaryColor {
    switch (widget.type) {
      case BoostType.premium:
        return const Color(0xFFFFA500);
      case BoostType.achievement:
        return const Color(0xFFE040FB);
      case BoostType.superLike:
        return const Color(0xFF03A9F4);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.isActive) {
      return widget.child;
    }

    return AnimatedBuilder(
      animation: Listenable.merge([
        _glowController,
        _rotationController,
        _sparkleController,
      ]),
      builder: (context, child) {
        return Transform.scale(
          scale: _pulseAnimation.value,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              // Outer glow ring
              Positioned.fill(
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: _primaryColor.withOpacity(_glowAnimation.value * 0.4),
                        blurRadius: 20 + (_glowAnimation.value * 15),
                        spreadRadius: _glowAnimation.value * 8,
                      ),
                      BoxShadow(
                        color: _secondaryColor.withOpacity(_glowAnimation.value * 0.2),
                        blurRadius: 40 + (_glowAnimation.value * 20),
                        spreadRadius: _glowAnimation.value * 4,
                      ),
                    ],
                  ),
                ),
              ),
              
              // Rotating gradient border
              Positioned.fill(
                child: CustomPaint(
                  painter: _GradientBorderPainter(
                    rotation: _rotationController.value * math.pi * 2,
                    primaryColor: _primaryColor,
                    secondaryColor: _secondaryColor,
                    glowIntensity: _glowAnimation.value,
                    borderRadius: 24,
                  ),
                ),
              ),
              
              // Sparkles
              ..._buildSparkles(),
              
              // Child content
              widget.child,
            ],
          ),
        );
      },
    );
  }

  List<Widget> _buildSparkles() {
    return _sparkles.map((sparkle) {
      final adjustedProgress = ((_sparkleController.value + sparkle.delay) % 1.0);
      final opacity = math.sin(adjustedProgress * math.pi);
      final distance = sparkle.distance * (0.5 + adjustedProgress * 0.5);
      
      return Positioned.fill(
        child: Transform.translate(
          offset: Offset(
            math.cos(sparkle.angle + _rotationController.value * sparkle.speed * math.pi * 2) * 
                MediaQuery.of(context).size.width * 0.2 * distance,
            math.sin(sparkle.angle + _rotationController.value * sparkle.speed * math.pi * 2) * 
                MediaQuery.of(context).size.width * 0.3 * distance - 
                adjustedProgress * 50,
          ),
          child: Align(
            alignment: Alignment.center,
            child: Opacity(
              opacity: opacity.clamp(0.0, 1.0),
              child: Container(
                width: sparkle.size,
                height: sparkle.size,
                decoration: BoxDecoration(
                  color: sparkle.color,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: sparkle.color.withOpacity(0.8),
                      blurRadius: sparkle.size,
                      spreadRadius: sparkle.size / 3,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
    }).toList();
  }
}

class _Sparkle {
  final double angle;
  final double distance;
  final double size;
  final double delay;
  final double speed;
  final Color color;

  _Sparkle({
    required this.angle,
    required this.distance,
    required this.size,
    required this.delay,
    required this.speed,
    required this.color,
  });
}

class _GradientBorderPainter extends CustomPainter {
  final double rotation;
  final Color primaryColor;
  final Color secondaryColor;
  final double glowIntensity;
  final double borderRadius;

  _GradientBorderPainter({
    required this.rotation,
    required this.primaryColor,
    required this.secondaryColor,
    required this.glowIntensity,
    required this.borderRadius,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Rect.fromLTWH(0, 0, size.width, size.height);
    final rrect = RRect.fromRectAndRadius(rect, Radius.circular(borderRadius));
    
    final gradient = SweepGradient(
      center: Alignment.center,
      startAngle: rotation,
      endAngle: rotation + math.pi * 2,
      colors: [
        primaryColor.withOpacity(glowIntensity),
        secondaryColor.withOpacity(glowIntensity * 0.5),
        primaryColor.withOpacity(glowIntensity * 0.3),
        secondaryColor.withOpacity(glowIntensity * 0.7),
        primaryColor.withOpacity(glowIntensity),
      ],
      stops: const [0.0, 0.25, 0.5, 0.75, 1.0],
    );

    final paint = Paint()
      ..shader = gradient.createShader(rect)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;

    canvas.drawRRect(rrect, paint);
  }

  @override
  bool shouldRepaint(_GradientBorderPainter oldDelegate) {
    return oldDelegate.rotation != rotation ||
        oldDelegate.glowIntensity != glowIntensity;
  }
}
