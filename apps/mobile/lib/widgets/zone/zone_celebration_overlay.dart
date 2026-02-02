import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/zone_gamification_models.dart';
import 'package:thittam1hub/theme.dart';

/// Premium celebration overlay with confetti and animated points display
/// Shows when users complete gamification activities
class ZoneCelebrationOverlay extends StatefulWidget {
  final int points;
  final ZoneActivityType activityType;
  final VoidCallback? onDismiss;
  final bool showConfetti;

  const ZoneCelebrationOverlay({
    super.key,
    required this.points,
    required this.activityType,
    this.onDismiss,
    this.showConfetti = true,
  });

  /// Show celebration as fullscreen overlay
  static void show(
    BuildContext context, {
    required int points,
    required ZoneActivityType activityType,
    bool showConfetti = true,
  }) {
    HapticFeedback.heavyImpact();
    
    final overlay = Overlay.of(context);
    late OverlayEntry entry;

    entry = OverlayEntry(
      builder: (context) => ZoneCelebrationOverlay(
        points: points,
        activityType: activityType,
        showConfetti: showConfetti,
        onDismiss: () => entry.remove(),
      ),
    );

    overlay.insert(entry);
  }

  @override
  State<ZoneCelebrationOverlay> createState() => _ZoneCelebrationOverlayState();
}

class _ZoneCelebrationOverlayState extends State<ZoneCelebrationOverlay>
    with TickerProviderStateMixin {
  late AnimationController _mainController;
  late AnimationController _confettiController;
  late AnimationController _countController;
  
  late Animation<double> _backdropAnimation;
  late Animation<double> _cardScaleAnimation;
  late Animation<double> _cardSlideAnimation;
  late Animation<double> _iconScaleAnimation;
  late Animation<double> _iconRotationAnimation;
  late Animation<double> _glowAnimation;
  
  final List<_ConfettiParticle> _confettiParticles = [];
  final Random _random = Random();
  int _displayedPoints = 0;

  @override
  void initState() {
    super.initState();
    _initAnimations();
    _generateConfetti();
    _startAnimations();
  }

  void _initAnimations() {
    // Main entrance animation
    _mainController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    // Confetti continuous animation
    _confettiController = AnimationController(
      duration: const Duration(milliseconds: 3000),
      vsync: this,
    );

    // Points count-up animation
    _countController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );

    _backdropAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0, 0.3, curve: Curves.easeOut),
      ),
    );

    _cardScaleAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween(begin: 0.0, end: 1.15)
            .chain(CurveTween(curve: Curves.easeOutBack)),
        weight: 60,
      ),
      TweenSequenceItem(
        tween: Tween(begin: 1.15, end: 1.0)
            .chain(CurveTween(curve: Curves.easeInOut)),
        weight: 40,
      ),
    ]).animate(_mainController);

    _cardSlideAnimation = Tween<double>(begin: 50, end: 0).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0, 0.6, curve: Curves.easeOutCubic),
      ),
    );

    _iconScaleAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween(begin: 0.0, end: 1.3)
            .chain(CurveTween(curve: Curves.elasticOut)),
        weight: 70,
      ),
      TweenSequenceItem(
        tween: Tween(begin: 1.3, end: 1.0)
            .chain(CurveTween(curve: Curves.easeInOut)),
        weight: 30,
      ),
    ]).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.2, 1.0),
      ),
    );

    _iconRotationAnimation = Tween<double>(begin: -0.1, end: 0.0).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.2, 0.8, curve: Curves.elasticOut),
      ),
    );

    _glowAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.4, 1.0, curve: Curves.easeOut),
      ),
    );

    // Count up animation listener
    _countController.addListener(() {
      setState(() {
        _displayedPoints = (widget.points * _countController.value).round();
      });
    });
  }

  void _generateConfetti() {
    if (!widget.showConfetti) return;
    
    for (int i = 0; i < 80; i++) {
      _confettiParticles.add(_ConfettiParticle(
        x: _random.nextDouble(),
        y: -0.1 - _random.nextDouble() * 0.3,
        size: 6 + _random.nextDouble() * 8,
        speed: 0.3 + _random.nextDouble() * 0.5,
        rotation: _random.nextDouble() * 2 * pi,
        rotationSpeed: (_random.nextDouble() - 0.5) * 0.1,
        color: _getConfettiColor(i),
        shape: _ConfettiShape.values[_random.nextInt(_ConfettiShape.values.length)],
        horizontalDrift: (_random.nextDouble() - 0.5) * 0.02,
      ));
    }
  }

  Color _getConfettiColor(int index) {
    final colors = [
      Colors.amber,
      Colors.amber.shade300,
      Colors.orange,
      Colors.yellow,
      Colors.pink,
      Colors.purple,
      Colors.blue,
      Colors.teal,
      Colors.green,
    ];
    return colors[index % colors.length];
  }

  void _startAnimations() {
    _mainController.forward();
    
    Future.delayed(const Duration(milliseconds: 300), () {
      if (mounted) {
        _confettiController.forward();
        _countController.forward();
        HapticFeedback.mediumImpact();
      }
    });

    // Auto dismiss after 3.5 seconds
    Future.delayed(const Duration(milliseconds: 3500), () {
      if (mounted) _dismiss();
    });
  }

  void _dismiss() {
    _mainController.reverse().then((_) {
      widget.onDismiss?.call();
    });
  }

  String _getActivityTitle() {
    switch (widget.activityType) {
      case ZoneActivityType.checkin:
        return 'Welcome to the Zone!';
      case ZoneActivityType.pollVote:
        return 'Vote Recorded!';
      case ZoneActivityType.icebreakerAnswer:
        return 'Great Answer!';
      case ZoneActivityType.sessionRating:
        return 'Thanks for Rating!';
      case ZoneActivityType.sessionAttendance:
        return 'Session Complete!';
      case ZoneActivityType.materialDownload:
        return 'Resource Saved!';
      case ZoneActivityType.badgeEarned:
        return 'Achievement Unlocked!';
      case ZoneActivityType.streakBonus:
        return 'Streak Bonus!';
    }
  }

  IconData _getActivityIcon() {
    switch (widget.activityType) {
      case ZoneActivityType.checkin:
        return Icons.celebration_rounded;
      case ZoneActivityType.pollVote:
        return Icons.how_to_vote_rounded;
      case ZoneActivityType.icebreakerAnswer:
        return Icons.wb_sunny_rounded;
      case ZoneActivityType.sessionRating:
        return Icons.star_rounded;
      case ZoneActivityType.sessionAttendance:
        return Icons.event_available_rounded;
      case ZoneActivityType.materialDownload:
        return Icons.download_done_rounded;
      case ZoneActivityType.badgeEarned:
        return Icons.emoji_events_rounded;
      case ZoneActivityType.streakBonus:
        return Icons.local_fire_department_rounded;
    }
  }

  @override
  void dispose() {
    _mainController.dispose();
    _confettiController.dispose();
    _countController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return GestureDetector(
      onTap: _dismiss,
      child: AnimatedBuilder(
        animation: Listenable.merge([_mainController, _confettiController]),
        builder: (context, child) {
          return Stack(
            children: [
              // Backdrop
              Positioned.fill(
                child: Container(
                  color: Colors.black.withOpacity(0.6 * _backdropAnimation.value),
                ),
              ),

              // Confetti layer
              if (widget.showConfetti)
                Positioned.fill(
                  child: CustomPaint(
                    painter: _ConfettiPainter(
                      particles: _confettiParticles,
                      progress: _confettiController.value,
                    ),
                  ),
                ),

              // Center content
              Center(
                child: Transform.translate(
                  offset: Offset(0, _cardSlideAnimation.value),
                  child: Transform.scale(
                    scale: _cardScaleAnimation.value,
                    child: _buildCelebrationCard(context, cs, textTheme),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildCelebrationCard(
    BuildContext context,
    ColorScheme cs,
    TextTheme textTheme,
  ) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 32),
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          // Ambient glow
          BoxShadow(
            color: Colors.amber.withOpacity(0.3 * _glowAnimation.value),
            blurRadius: 40,
            spreadRadius: 10,
          ),
          // Card shadow
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Animated icon
          Transform.scale(
            scale: _iconScaleAnimation.value,
            child: RotationTransition(
              turns: _iconRotationAnimation,
              child: Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: [
                      Colors.amber.shade300,
                      Colors.amber.shade600,
                      Colors.orange.shade600,
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.amber.withOpacity(0.5 * _glowAnimation.value),
                      blurRadius: 30,
                      spreadRadius: 5,
                    ),
                  ],
                ),
                child: Icon(
                  _getActivityIcon(),
                  size: 48,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Title
          Text(
            _getActivityTitle(),
            style: textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: cs.onSurface,
            ),
            textAlign: TextAlign.center,
          ),
          
          const SizedBox(height: 16),
          
          // Points display with count-up
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  cs.primary,
                  cs.secondary,
                ],
              ),
              borderRadius: BorderRadius.circular(30),
              boxShadow: [
                BoxShadow(
                  color: cs.primary.withOpacity(0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.star_rounded,
                  color: Colors.amber,
                  size: 28,
                ),
                const SizedBox(width: 8),
                Text(
                  '+$_displayedPoints',
                  style: textTheme.headlineMedium?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  'points',
                  style: textTheme.titleMedium?.copyWith(
                    color: Colors.white.withOpacity(0.9),
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Tap to dismiss hint
          Text(
            'Tap anywhere to continue',
            style: textTheme.labelMedium?.copyWith(
              color: cs.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

// =============================================================================
// Confetti System
// =============================================================================

enum _ConfettiShape { circle, square, rectangle, star }

class _ConfettiParticle {
  double x;
  double y;
  final double size;
  final double speed;
  double rotation;
  final double rotationSpeed;
  final Color color;
  final _ConfettiShape shape;
  final double horizontalDrift;

  _ConfettiParticle({
    required this.x,
    required this.y,
    required this.size,
    required this.speed,
    required this.rotation,
    required this.rotationSpeed,
    required this.color,
    required this.shape,
    required this.horizontalDrift,
  });

  void update(double progress) {
    y += speed * 0.02;
    x += horizontalDrift;
    rotation += rotationSpeed;
  }
}

class _ConfettiPainter extends CustomPainter {
  final List<_ConfettiParticle> particles;
  final double progress;

  _ConfettiPainter({
    required this.particles,
    required this.progress,
  });

  @override
  void paint(Canvas canvas, Size size) {
    for (final particle in particles) {
      particle.update(progress);
      
      // Skip if out of bounds
      if (particle.y > 1.2) continue;
      
      final paint = Paint()
        ..color = particle.color.withOpacity(
          (1 - particle.y).clamp(0.0, 1.0),
        )
        ..style = PaintingStyle.fill;

      final x = particle.x * size.width;
      final y = particle.y * size.height;

      canvas.save();
      canvas.translate(x, y);
      canvas.rotate(particle.rotation);

      switch (particle.shape) {
        case _ConfettiShape.circle:
          canvas.drawCircle(Offset.zero, particle.size / 2, paint);
        case _ConfettiShape.square:
          canvas.drawRect(
            Rect.fromCenter(
              center: Offset.zero,
              width: particle.size,
              height: particle.size,
            ),
            paint,
          );
        case _ConfettiShape.rectangle:
          canvas.drawRect(
            Rect.fromCenter(
              center: Offset.zero,
              width: particle.size,
              height: particle.size * 0.4,
            ),
            paint,
          );
        case _ConfettiShape.star:
          _drawStar(canvas, particle.size / 2, paint);
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
      final angle = (i * pi / points) - pi / 2;
      final x = r * cos(angle);
      final y = r * sin(angle);

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
  bool shouldRepaint(_ConfettiPainter oldDelegate) => true;
}

// =============================================================================
// Quick Points Toast (lightweight version for frequent awards)
// =============================================================================

/// Lightweight animated toast for frequent point awards
/// Use ZoneCelebrationOverlay for major achievements
class QuickPointsToast extends StatefulWidget {
  final int points;
  final String? label;
  final VoidCallback? onDismiss;

  const QuickPointsToast({
    super.key,
    required this.points,
    this.label,
    this.onDismiss,
  });

  /// Show quick toast at top of screen
  static void show(
    BuildContext context, {
    required int points,
    String? label,
  }) {
    HapticFeedback.lightImpact();
    
    final overlay = Overlay.of(context);
    late OverlayEntry entry;

    entry = OverlayEntry(
      builder: (context) => Positioned(
        top: MediaQuery.of(context).padding.top + 16,
        left: 0,
        right: 0,
        child: Center(
          child: Material(
            color: Colors.transparent,
            child: QuickPointsToast(
              points: points,
              label: label,
              onDismiss: () => entry.remove(),
            ),
          ),
        ),
      ),
    );

    overlay.insert(entry);
  }

  @override
  State<QuickPointsToast> createState() => _QuickPointsToastState();
}

class _QuickPointsToastState extends State<QuickPointsToast>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _opacityAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );

    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween(begin: 0.5, end: 1.1)
            .chain(CurveTween(curve: Curves.easeOutBack)),
        weight: 70,
      ),
      TweenSequenceItem(
        tween: Tween(begin: 1.1, end: 1.0)
            .chain(CurveTween(curve: Curves.easeInOut)),
        weight: 30,
      ),
    ]).animate(_controller);

    _opacityAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0, 0.4, curve: Curves.easeOut),
      ),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, -1),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutCubic,
    ));

    _controller.forward();

    // Auto dismiss
    Future.delayed(const Duration(milliseconds: 2000), () {
      if (mounted) {
        _controller.reverse().then((_) => widget.onDismiss?.call());
      }
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
    final textTheme = Theme.of(context).textTheme;

    return SlideTransition(
      position: _slideAnimation,
      child: FadeTransition(
        opacity: _opacityAnimation,
        child: ScaleTransition(
          scale: _scaleAnimation,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.amber.shade600,
                  Colors.orange.shade600,
                ],
              ),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: Colors.amber.withOpacity(0.4),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.star_rounded,
                  color: Colors.white,
                  size: 22,
                ),
                const SizedBox(width: 8),
                Text(
                  '+${widget.points}',
                  style: textTheme.titleMedium?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (widget.label != null) ...[
                  const SizedBox(width: 8),
                  Text(
                    widget.label!,
                    style: textTheme.bodyMedium?.copyWith(
                      color: Colors.white.withOpacity(0.9),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
