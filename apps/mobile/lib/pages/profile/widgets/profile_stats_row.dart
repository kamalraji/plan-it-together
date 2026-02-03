import 'package:flutter/material.dart';
import 'package:thittam1hub/models/profile_stats.dart';
import 'package:thittam1hub/widgets/animated_stat_counter.dart';
import 'package:thittam1hub/theme.dart';

/// Instagram-style stats row
class ProfileStatsRow extends StatelessWidget {
  final ProfileStats stats;

  const ProfileStatsRow({super.key, required this.stats});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: cs.surfaceContainerHighest.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            ProfileStatItem(value: stats.impactScore, label: 'Impact', icon: Icons.bolt_rounded),
            const ProfileStatDivider(),
            ProfileStatItem(value: stats.eventsAttended, label: 'Events', icon: Icons.event_rounded),
            const ProfileStatDivider(),
            ProfileStatItem(value: stats.badgesEarned, label: 'Badges', icon: Icons.emoji_events_rounded),
            const ProfileStatDivider(),
            ProfileStatItem(value: stats.currentStreak, label: 'Streak', icon: Icons.local_fire_department_rounded),
          ],
        ),
      ),
    );
  }
}

/// Single stat item with accessibility support
class ProfileStatItem extends StatelessWidget {
  final int value;
  final String label;
  final IconData icon;

  const ProfileStatItem({
    super.key,
    required this.value,
    required this.label,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Semantics(
      label: '$value $label',
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              ExcludeSemantics(
                child: Icon(icon, size: 14, color: cs.primary),
              ),
              const SizedBox(width: 4),
              AnimatedStatCounter(
                value: value,
                style: context.textStyles.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: cs.onSurface,
                ),
              ),
            ],
          ),
          const SizedBox(height: 2),
          ExcludeSemantics(
            child: Text(
              label,
              style: context.textStyles.labelSmall?.copyWith(
                color: cs.onSurfaceVariant,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Vertical divider
class ProfileStatDivider extends StatelessWidget {
  const ProfileStatDivider({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 24,
      width: 1,
      color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.3),
    );
  }
}

/// Detailed stat row for About tab
class ProfileStatDetailRow extends StatelessWidget {
  final String label;
  final String value;

  const ProfileStatDetailRow({super.key, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: context.textStyles.bodyMedium?.copyWith(
              color: cs.onSurfaceVariant,
            ),
          ),
          Text(
            value,
            style: context.textStyles.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
