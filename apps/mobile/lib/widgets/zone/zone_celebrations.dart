import 'dart:math' as math;
import 'package:flutter/material.dart';

/// Confetti celebration animation for badge unlocks and achievements.
class ConfettiOverlay extends StatefulWidget {
  final Widget child;
  final bool showConfetti;
  final VoidCallback? onComplete;
  final int particleCount;
  final Duration duration;

  const ConfettiOverlay({
    super.key,
    required this.child,
    this.showConfetti = false,
    this.onComplete,
    this.particleCount = 50,
    this.duration = const Duration(milliseconds: 2000),
  });

  @override
  State<ConfettiOverlay> createState() => _ConfettiOverlayState();
}

class _ConfettiOverlayState extends State<ConfettiOverlay>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late List<_ConfettiParticle> _particles;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(duration: widget.duration, vsync: this);
    _particles = List.generate(
      widget.particleCount,
      (_) => _ConfettiParticle.random(),
    );

    if (widget.showConfetti) {
      _startConfetti();
    }
  }

  @override
  void didUpdateWidget(ConfettiOverlay oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.showConfetti && !oldWidget.showConfetti) {
      _startConfetti();
    }
  }

  void _startConfetti() {
    _particles = List.generate(
      widget.particleCount,
      (_) => _ConfettiParticle.random(),
    );
    _controller.forward(from: 0).then((_) => widget.onComplete?.call());
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        widget.child,
        if (widget.showConfetti)
          Positioned.fill(
            child: IgnorePointer(
              child: AnimatedBuilder(
                animation: _controller,
                builder: (context, _) {
                  return CustomPaint(
                    painter: _ConfettiPainter(
                      particles: _particles,
                      progress: _controller.value,
                    ),
                  );
                },
              ),
            ),
          ),
      ],
    );
  }
}

class _ConfettiParticle {
  final double x; // 0-1 horizontal position
  final double delay; // 0-0.3 start delay
  final double speed; // Fall speed multiplier
  final double wobble; // Horizontal wobble amount
  final double rotation; // Initial rotation
  final double rotationSpeed; // Rotation speed
  final Color color;
  final double size;

  _ConfettiParticle({
    required this.x,
    required this.delay,
    required this.speed,
    required this.wobble,
    required this.rotation,
    required this.rotationSpeed,
    required this.color,
    required this.size,
  });

  factory _ConfettiParticle.random() {
    final random = math.Random();
    final colors = [
      const Color(0xFFFF6B6B),
      const Color(0xFF4ECDC4),
      const Color(0xFFFFE66D),
      const Color(0xFF95E1D3),
      const Color(0xFFF38181),
      const Color(0xFFAA96DA),
      const Color(0xFFFCBF49),
      const Color(0xFF2EC4B6),
    ];

    return _ConfettiParticle(
      x: random.nextDouble(),
      delay: random.nextDouble() * 0.3,
      speed: 0.5 + random.nextDouble() * 0.5,
      wobble: 20 + random.nextDouble() * 30,
      rotation: random.nextDouble() * math.pi * 2,
      rotationSpeed: (random.nextDouble() - 0.5) * 8,
      color: colors[random.nextInt(colors.length)],
      size: 6 + random.nextDouble() * 6,
    );
  }
}

class _ConfettiPainter extends CustomPainter {
  final List<_ConfettiParticle> particles;
  final double progress;

  _ConfettiPainter({required this.particles, required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    for (final particle in particles) {
      final adjustedProgress = ((progress - particle.delay) / (1 - particle.delay))
          .clamp(0.0, 1.0);

      if (adjustedProgress <= 0) continue;

      // Fade out at the end
      final opacity = adjustedProgress < 0.8 ? 1.0 : (1 - adjustedProgress) / 0.2;

      final paint = Paint()
        ..color = particle.color.withOpacity(opacity)
        ..style = PaintingStyle.fill;

      // Calculate position
      final x = particle.x * size.width +
          math.sin(adjustedProgress * math.pi * 4) * particle.wobble;
      final y = -20 + adjustedProgress * (size.height + 40) * particle.speed;

      // Calculate rotation
      final rotation =
          particle.rotation + adjustedProgress * particle.rotationSpeed;

      canvas.save();
      canvas.translate(x, y);
      canvas.rotate(rotation);

      // Draw confetti piece (rectangle)
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromCenter(
            center: Offset.zero,
            width: particle.size,
            height: particle.size * 0.6,
          ),
          Radius.circular(particle.size * 0.1),
        ),
        paint,
      );

      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(_ConfettiPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}

/// Badge unlock celebration modal.
class BadgeUnlockModal extends StatefulWidget {
  final String badgeName;
  final String badgeDescription;
  final IconData badgeIcon;
  final int pointsEarned;
  final VoidCallback onDismiss;

  const BadgeUnlockModal({
    super.key,
    required this.badgeName,
    required this.badgeDescription,
    required this.badgeIcon,
    required this.pointsEarned,
    required this.onDismiss,
  });

  @override
  State<BadgeUnlockModal> createState() => _BadgeUnlockModalState();
}

class _BadgeUnlockModalState extends State<BadgeUnlockModal>
    with TickerProviderStateMixin {
  late AnimationController _scaleController;
  late AnimationController _glowController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _glowAnimation;
  bool _showConfetti = false;

  @override
  void initState() {
    super.initState();

    _scaleController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );

    _glowController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat(reverse: true);

    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween(begin: 0.0, end: 1.2).chain(CurveTween(curve: Curves.easeOut)),
        weight: 60,
      ),
      TweenSequenceItem(
        tween: Tween(begin: 1.2, end: 1.0).chain(CurveTween(curve: Curves.elasticOut)),
        weight: 40,
      ),
    ]).animate(_scaleController);

    _glowAnimation = Tween<double>(begin: 0.3, end: 0.8).animate(
      CurvedAnimation(parent: _glowController, curve: Curves.easeInOut),
    );

    _scaleController.forward();
    Future.delayed(const Duration(milliseconds: 300), () {
      if (mounted) setState(() => _showConfetti = true);
    });
  }

  @override
  void dispose() {
    _scaleController.dispose();
    _glowController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ConfettiOverlay(
      showConfetti: _showConfetti,
      child: GestureDetector(
        onTap: widget.onDismiss,
        child: Container(
          color: Colors.black54,
          child: Center(
            child: ScaleTransition(
              scale: _scaleAnimation,
              child: AnimatedBuilder(
                animation: _glowAnimation,
                builder: (context, child) {
                  return Container(
                    margin: const EdgeInsets.all(32),
                    padding: const EdgeInsets.all(32),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.surface,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: theme.colorScheme.primary
                              .withOpacity(_glowAnimation.value),
                          blurRadius: 40,
                          spreadRadius: 10,
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Badge icon with glow
                        Container(
                          width: 100,
                          height: 100,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [
                                theme.colorScheme.primary,
                                theme.colorScheme.secondary,
                              ],
                            ),
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: theme.colorScheme.primary
                                    .withOpacity(_glowAnimation.value),
                                blurRadius: 24,
                                spreadRadius: 4,
                              ),
                            ],
                          ),
                          child: Icon(
                            widget.badgeIcon,
                            size: 48,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Unlocked label
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            '🎉 BADGE UNLOCKED!',
                            style: TextStyle(
                              color: theme.colorScheme.primary,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                              letterSpacing: 1,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Badge name
                        Text(
                          widget.badgeName,
                          style: theme.textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),

                        // Description
                        Text(
                          widget.badgeDescription,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: theme.colorScheme.onSurface.withOpacity(0.7),
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),

                        // Points earned
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 20,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                theme.colorScheme.primary,
                                theme.colorScheme.secondary,
                              ],
                            ),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            '+${widget.pointsEarned} points',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Dismiss hint
                        Text(
                          'Tap anywhere to continue',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurface.withOpacity(0.5),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );
  }
}
