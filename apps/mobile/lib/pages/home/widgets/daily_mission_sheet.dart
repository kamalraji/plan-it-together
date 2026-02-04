import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/pages/home/home_service.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/styled_button.dart';

/// Daily mission bottom sheet with streak progress and gamification
class DailyMissionSheet extends StatelessWidget {
  final StreakData? streakData;
  final VoidCallback onCompleteAction;

  const DailyMissionSheet({
    Key? key,
    required this.streakData,
    required this.onCompleteAction,
  }) : super(key: key);

  static void show(BuildContext context, {
    required StreakData? streakData,
    required VoidCallback onCompleteAction,
  }) {
    HapticFeedback.mediumImpact();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DailyMissionSheet(
        streakData: streakData,
        onCompleteAction: onCompleteAction,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final streak = streakData?.streakCount ?? 0;
    final actionsToday = streakData?.actionsToday ?? 0;
    final completed = streakData?.completedToday ?? false;
    
    // Daily mission requirements
    const requiredActions = 3;
    final progress = actionsToday.clamp(0, requiredActions) / requiredActions;

    return Container(
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(24),
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: cs.outline.withOpacity(0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),

            // Animated flame with streak count
            _StreakFlame(streak: streak, isAtRisk: !completed),
            const SizedBox(height: 16),

            // Title
            Text(
              completed ? '🎉 Daily Mission Complete!' : 'Daily Mission',
              style: textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: cs.onSurface,
              ),
            ),
            const SizedBox(height: 8),

            Text(
              completed 
                  ? 'Come back tomorrow to keep your streak!' 
                  : 'Complete ${requiredActions - actionsToday} more ${(requiredActions - actionsToday) == 1 ? 'action' : 'actions'} to maintain your streak',
              style: textTheme.bodyMedium?.copyWith(
                color: cs.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),

            // Progress ring
            _ProgressRing(
              progress: progress,
              actionsComplete: actionsToday,
              totalActions: requiredActions,
            ),
            const SizedBox(height: 24),

            // Mission list
            _MissionItem(
              icon: Icons.edit_rounded,
              title: 'Post a spark',
              subtitle: 'Share an idea, question, or announcement',
              isCompleted: actionsToday >= 1,
            ),
            _MissionItem(
              icon: Icons.favorite_rounded,
              title: 'React to posts',
              subtitle: 'Spark 3 posts from others',
              isCompleted: actionsToday >= 2,
            ),
            _MissionItem(
              icon: Icons.chat_bubble_rounded,
              title: 'Join the conversation',
              subtitle: 'Comment on a post or join a space',
              isCompleted: actionsToday >= 3,
            ),
            const SizedBox(height: 24),

            // Streak milestones
            Text(
              'Streak Milestones',
              style: textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: cs.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 12),
            _MilestoneRow(currentStreak: streak),
            const SizedBox(height: 24),

            // Action button
            if (!completed)
              SizedBox(
                width: double.infinity,
                child: StyledButton(
                  label: 'Let\'s Go!',
                  onPressed: () {
                    Navigator.pop(context);
                    onCompleteAction();
                  },
                  variant: StyledButtonVariant.primary,
                  fullWidth: true,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Animated flame with streak count
class _StreakFlame extends StatefulWidget {
  final int streak;
  final bool isAtRisk;

  const _StreakFlame({required this.streak, required this.isAtRisk});

  @override
  State<_StreakFlame> createState() => _StreakFlameState();
}

class _StreakFlameState extends State<_StreakFlame>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.15).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
    
    if (widget.isAtRisk) {
      _controller.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return AnimatedBuilder(
      animation: _scaleAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: widget.isAtRisk ? _scaleAnimation.value : 1.0,
          child: Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.orange,
                  Colors.deepOrange,
                  Colors.red,
                ],
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.orange.withOpacity(0.4),
                  blurRadius: 20,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text('🔥', style: TextStyle(fontSize: 28)),
                Text(
                  '${widget.streak}',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

/// Circular progress ring
class _ProgressRing extends StatelessWidget {
  final double progress;
  final int actionsComplete;
  final int totalActions;

  const _ProgressRing({
    required this.progress,
    required this.actionsComplete,
    required this.totalActions,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return SizedBox(
      width: 100,
      height: 100,
      child: Stack(
        alignment: Alignment.center,
        children: [
          SizedBox(
            width: 100,
            height: 100,
            child: CircularProgressIndicator(
              value: progress,
              strokeWidth: 8,
              backgroundColor: cs.outline.withOpacity(0.2),
              valueColor: AlwaysStoppedAnimation(
                progress >= 1.0 ? Colors.green : cs.primary,
              ),
              strokeCap: StrokeCap.round,
            ),
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '$actionsComplete/$totalActions',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: cs.onSurface,
                ),
              ),
              Text(
                'actions',
                style: TextStyle(
                  fontSize: 12,
                  color: cs.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Single mission item
class _MissionItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool isCompleted;

  const _MissionItem({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.isCompleted,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isCompleted 
            ? Colors.green.withOpacity(0.1) 
            : cs.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isCompleted 
              ? Colors.green.withOpacity(0.3) 
              : cs.outline.withOpacity(0.1),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: isCompleted 
                  ? Colors.green.withOpacity(0.2) 
                  : cs.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              isCompleted ? Icons.check_rounded : icon,
              color: isCompleted ? Colors.green : cs.primary,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: isCompleted 
                        ? cs.onSurfaceVariant 
                        : cs.onSurface,
                    decoration: isCompleted 
                        ? TextDecoration.lineThrough 
                        : null,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: textTheme.bodySmall?.copyWith(
                    color: cs.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Milestone progress row
class _MilestoneRow extends StatelessWidget {
  final int currentStreak;

  const _MilestoneRow({required this.currentStreak});

  @override
  Widget build(BuildContext context) {
    final milestones = [7, 14, 30, 60, 100];
    
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: milestones.map((milestone) {
        final isUnlocked = currentStreak >= milestone;
        return _MilestoneBadge(
          days: milestone,
          isUnlocked: isUnlocked,
          isCurrent: currentStreak >= milestone && 
              (milestone == milestones.last || currentStreak < milestones[milestones.indexOf(milestone) + 1]),
        );
      }).toList(),
    );
  }
}

/// Single milestone badge
class _MilestoneBadge extends StatelessWidget {
  final int days;
  final bool isUnlocked;
  final bool isCurrent;

  const _MilestoneBadge({
    required this.days,
    required this.isUnlocked,
    required this.isCurrent,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return Column(
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isUnlocked 
                ? Colors.orange.withOpacity(0.2) 
                : cs.surfaceContainerHighest,
            border: Border.all(
              color: isCurrent 
                  ? Colors.orange 
                  : isUnlocked 
                      ? Colors.orange.withOpacity(0.3) 
                      : cs.outline.withOpacity(0.2),
              width: isCurrent ? 2 : 1,
            ),
          ),
          child: Center(
            child: isUnlocked
                ? const Text('🔥', style: TextStyle(fontSize: 20))
                : Icon(
                    Icons.lock_rounded,
                    size: 18,
                    color: cs.outline,
                  ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          '${days}d',
          style: TextStyle(
            fontSize: 11,
            fontWeight: isUnlocked ? FontWeight.w600 : FontWeight.normal,
            color: isUnlocked ? cs.onSurface : cs.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}
