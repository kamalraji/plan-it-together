import 'package:flutter/material.dart';
import 'package:thittam1hub/pages/home/home_service.dart';

/// Compact streak badge for the app bar
class StreakBadge extends StatefulWidget {
  final StreakData? streakData;
  final VoidCallback onTap;

  const StreakBadge({
    Key? key,
    required this.streakData,
    required this.onTap,
  }) : super(key: key);

  @override
  State<StreakBadge> createState() => _StreakBadgeState();
}

class _StreakBadgeState extends State<StreakBadge>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );

    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.15).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    // Only pulse if streak is at risk
    if (widget.streakData != null && !widget.streakData!.completedToday) {
      _pulseController.repeat(reverse: true);
    }
  }

  @override
  void didUpdateWidget(StreakBadge oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.streakData != null && !widget.streakData!.completedToday) {
      if (!_pulseController.isAnimating) {
        _pulseController.repeat(reverse: true);
      }
    } else {
      _pulseController.stop();
      _pulseController.value = 0;
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  String _buildSemanticLabel() {
    final streak = widget.streakData;
    if (streak == null) return 'View daily mission';
    
    final isAtRisk = !streak.completedToday;
    return '${streak.streakCount} day streak${isAtRisk ? ', at risk! Complete today\'s mission' : ''}, tap to view daily mission';
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final streak = widget.streakData;

    if (streak == null) {
      return const SizedBox.shrink();
    }

    final isAtRisk = !streak.completedToday;

    return Semantics(
      button: true,
      label: _buildSemanticLabel(),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedBuilder(
          animation: _pulseAnimation,
          builder: (context, child) {
            return Transform.scale(
              scale: isAtRisk ? _pulseAnimation.value : 1.0,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  gradient: LinearGradient(
                    colors: isAtRisk
                        ? [Colors.orange.shade600, Colors.deepOrange.shade500]
                        : isDark
                            ? [
                                cs.surfaceContainerHighest,
                                cs.surfaceContainerHigh
                              ]
                            : [cs.surfaceContainerLow, cs.surfaceContainer],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  border: Border.all(
                    color: isAtRisk
                        ? Colors.orange.withValues(alpha: 0.5)
                        : cs.outline.withValues(alpha: 0.2),
                    width: 1,
                  ),
                  boxShadow: isAtRisk
                      ? [
                          BoxShadow(
                            color: Colors.orange.withValues(alpha: 0.3),
                            blurRadius: 8,
                            spreadRadius: 0,
                          ),
                        ]
                      : null,
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '🔥',
                      style: TextStyle(fontSize: isAtRisk ? 14 : 12),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${streak.streakCount}',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: isAtRisk ? Colors.white : cs.onSurface,
                      ),
                    ),
                    if (isAtRisk) ...[
                      const SizedBox(width: 2),
                      Icon(
                        Icons.warning_amber_rounded,
                        size: 12,
                        color: Colors.white.withValues(alpha: 0.9),
                      ),
                    ],
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class StreakBadgeSkeleton extends StatelessWidget {
  const StreakBadgeSkeleton({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      width: 50,
      height: 28,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: cs.surfaceContainerHighest.withValues(alpha: 0.5),
      ),
    );
  }
}
