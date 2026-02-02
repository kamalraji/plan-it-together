import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme.dart';
import 'animated_stat_counter.dart';

/// Premium animated stat card with gradient icon background
/// Features: count animation, pulse on load, tap for details
class AnimatedStatCard extends StatefulWidget {
  final IconData icon;
  final String label;
  final int value;
  final Color color;
  final VoidCallback? onTap;
  final bool animate;
  final int index;

  const AnimatedStatCard({
    super.key,
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
    this.onTap,
    this.animate = true,
    this.index = 0,
  });

  @override
  State<AnimatedStatCard> createState() => _AnimatedStatCardState();
}

class _AnimatedStatCardState extends State<AnimatedStatCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.6, curve: Curves.elasticOut),
      ),
    );

    _pulseAnimation = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.1), weight: 1),
      TweenSequenceItem(tween: Tween(begin: 1.1, end: 1.0), weight: 1),
    ]).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.6, 1.0, curve: Curves.easeInOut),
      ),
    );

    if (widget.animate) {
      Future.delayed(Duration(milliseconds: widget.index * 100), () {
        if (mounted) _controller.forward();
      });
    } else {
      _controller.value = 1.0;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTap() {
    if (widget.onTap != null) {
      HapticFeedback.lightImpact();
      widget.onTap!();
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return ListenableBuilder(
      listenable: _controller,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value * _pulseAnimation.value,
          child: child,
        );
      },
      child: GestureDetector(
        onTap: _handleTap,
        child: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.sm,
            vertical: AppSpacing.md,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Gradient icon container
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      widget.color.withOpacity(0.2),
                      widget.color.withOpacity(0.1),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(AppRadius.md),
                ),
                child: Icon(
                  widget.icon,
                  size: 22,
                  color: widget.color,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              // Animated counter
              AnimatedStatCounter(
                value: widget.value,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: cs.onSurface,
                ),
              ),
              const SizedBox(height: 2),
              // Label
              Text(
                widget.label,
                style: TextStyle(
                  fontSize: 12,
                  color: cs.onSurfaceVariant,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Row of animated stat cards with dividers
class AnimatedStatsRow extends StatelessWidget {
  final List<StatData> stats;
  final bool animate;

  const AnimatedStatsRow({
    super.key,
    required this.stats,
    this.animate = true,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      decoration: BoxDecoration(
        color: cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: cs.outline.withOpacity(0.1)),
        boxShadow: [
          BoxShadow(
            color: cs.shadow.withOpacity(0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          for (int i = 0; i < stats.length; i++) ...[
            Expanded(
              child: AnimatedStatCard(
                icon: stats[i].icon,
                label: stats[i].label,
                value: stats[i].value,
                color: stats[i].color,
                onTap: stats[i].onTap,
                animate: animate,
                index: i,
              ),
            ),
            if (i < stats.length - 1)
              Container(
                width: 1,
                height: 50,
                color: cs.outline.withOpacity(0.1),
              ),
          ],
        ],
      ),
    );
  }
}

/// Data model for stat card
class StatData {
  final IconData icon;
  final String label;
  final int value;
  final Color color;
  final VoidCallback? onTap;

  const StatData({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
    this.onTap,
  });
}
