import 'dart:math';
import 'package:flutter/material.dart';

/// Celebration overlay for correct answers
class ScoreCelebration extends StatefulWidget {
  final bool isCorrect;
  final int pointsEarned;
  final int newStreak;
  final VoidCallback? onComplete;

  const ScoreCelebration({
    super.key,
    required this.isCorrect,
    required this.pointsEarned,
    this.newStreak = 0,
    this.onComplete,
  });

  @override
  State<ScoreCelebration> createState() => _ScoreCelebrationState();
}

class _ScoreCelebrationState extends State<ScoreCelebration>
    with TickerProviderStateMixin {
  late AnimationController _scaleController;
  late AnimationController _confettiController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;
  final List<_ConfettiParticle> _particles = [];
  final Random _random = Random();

  @override
  void initState() {
    super.initState();

    _scaleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );

    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.0, end: 1.2)
            .chain(CurveTween(curve: Curves.easeOut)),
        weight: 40,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.2, end: 0.9)
            .chain(CurveTween(curve: Curves.easeInOut)),
        weight: 20,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.9, end: 1.0)
            .chain(CurveTween(curve: Curves.easeInOut)),
        weight: 40,
      ),
    ]).animate(_scaleController);

    _fadeAnimation = Tween<double>(begin: 1.0, end: 0.0).animate(
      CurvedAnimation(
        parent: _scaleController,
        curve: const Interval(0.7, 1.0, curve: Curves.easeOut),
      ),
    );

    _confettiController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );

    if (widget.isCorrect) {
      _generateConfetti();
    }

    _scaleController.forward();
    if (widget.isCorrect) {
      _confettiController.forward();
    }

    _scaleController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        Future.delayed(const Duration(milliseconds: 500), () {
          widget.onComplete?.call();
        });
      }
    });
  }

  void _generateConfetti() {
    final colors = [
      Colors.red,
      Colors.blue,
      Colors.green,
      Colors.yellow,
      Colors.purple,
      Colors.orange,
      Colors.pink,
      Colors.cyan,
    ];

    for (int i = 0; i < 50; i++) {
      _particles.add(_ConfettiParticle(
        x: _random.nextDouble(),
        y: _random.nextDouble() * 0.5 - 0.5,
        velocityX: (_random.nextDouble() - 0.5) * 4,
        velocityY: _random.nextDouble() * 3 + 2,
        rotation: _random.nextDouble() * 360,
        rotationSpeed: (_random.nextDouble() - 0.5) * 10,
        color: colors[_random.nextInt(colors.length)],
        size: _random.nextDouble() * 8 + 4,
      ));
    }
  }

  @override
  void dispose() {
    _scaleController.dispose();
    _confettiController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Stack(
      children: [
        // Confetti
        if (widget.isCorrect)
          AnimatedBuilder(
            animation: _confettiController,
            builder: (context, child) {
              return CustomPaint(
                painter: _ConfettiPainter(
                  particles: _particles,
                  progress: _confettiController.value,
                ),
                size: Size.infinite,
              );
            },
          ),

        // Main result display
        Center(
          child: AnimatedBuilder(
            animation: _scaleController,
            builder: (context, child) {
              return Opacity(
                opacity: _fadeAnimation.value,
                child: Transform.scale(
                  scale: _scaleAnimation.value,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 32,
                      vertical: 24,
                    ),
                    decoration: BoxDecoration(
                      color: widget.isCorrect
                          ? Colors.green.withOpacity(0.95)
                          : Colors.red.withOpacity(0.95),
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: (widget.isCorrect ? Colors.green : Colors.red)
                              .withOpacity(0.4),
                          blurRadius: 20,
                          spreadRadius: 5,
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          widget.isCorrect
                              ? Icons.check_circle
                              : Icons.cancel,
                          size: 64,
                          color: Colors.white,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          widget.isCorrect ? 'Correct!' : 'Wrong!',
                          style: theme.textTheme.headlineMedium?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        if (widget.isCorrect) ...[
                          const SizedBox(height: 8),
                          Text(
                            '+${widget.pointsEarned} points',
                            style: theme.textTheme.titleLarge?.copyWith(
                              color: Colors.white.withOpacity(0.9),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          if (widget.newStreak > 1) ...[
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 8,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.orange,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(
                                    Icons.local_fire_department,
                                    color: Colors.white,
                                    size: 20,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    '${widget.newStreak} streak!',
                                    style:
                                        theme.textTheme.titleMedium?.copyWith(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _ConfettiParticle {
  double x;
  double y;
  double velocityX;
  double velocityY;
  double rotation;
  double rotationSpeed;
  Color color;
  double size;

  _ConfettiParticle({
    required this.x,
    required this.y,
    required this.velocityX,
    required this.velocityY,
    required this.rotation,
    required this.rotationSpeed,
    required this.color,
    required this.size,
  });
}

class _ConfettiPainter extends CustomPainter {
  final List<_ConfettiParticle> particles;
  final double progress;

  _ConfettiPainter({required this.particles, required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint();

    for (final particle in particles) {
      final x =
          (particle.x + particle.velocityX * progress * 0.1) * size.width;
      final y = (particle.y + particle.velocityY * progress) * size.height;
      final rotation = particle.rotation + particle.rotationSpeed * progress;

      if (y > size.height) continue;

      paint.color = particle.color.withOpacity(1.0 - progress * 0.5);

      canvas.save();
      canvas.translate(x, y);
      canvas.rotate(rotation * pi / 180);
      canvas.drawRect(
        Rect.fromCenter(
          center: Offset.zero,
          width: particle.size,
          height: particle.size * 0.6,
        ),
        paint,
      );
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant _ConfettiPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}
