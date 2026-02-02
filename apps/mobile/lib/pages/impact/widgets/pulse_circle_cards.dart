import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/circle.dart';
import 'package:thittam1hub/utils/icon_mappings.dart';
import 'package:thittam1hub/pages/impact/pulse_page_controller.dart';

// Re-export DiscoveryMode for convenience
export 'package:thittam1hub/pages/impact/pulse_page_controller.dart' show DiscoveryMode, CircleDiscoveryResult;

/// Card for auto-matched circles based on user's profile.
class AutoMatchedCircleCard extends StatelessWidget {
  final Circle circle;
  final bool isJoined;
  final VoidCallback onTap;
  final VoidCallback onJoinToggle;

  const AutoMatchedCircleCard({
    super.key,
    required this.circle,
    required this.isJoined,
    required this.onTap,
    required this.onJoinToggle,
  });

  String _buildSemanticLabel() {
    final parts = [circle.name];
    parts.add('${circle.memberCount} members');
    parts.add(isJoined ? 'joined' : 'not joined');
    if (circle.description != null && circle.description!.isNotEmpty) {
      parts.add(circle.description!);
    }
    return parts.join(', ');
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Semantics(
      button: true,
      label: _buildSemanticLabel(),
      child: Card(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 1,
        child: InkWell(
          onTap: () {
            HapticFeedback.lightImpact();
            onTap();
          },
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(12.0),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: IconMappings.getCircleCategoryColor(circle.category).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  alignment: Alignment.center,
                  child: Text(circle.icon, style: const TextStyle(fontSize: 20)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        circle.name,
                        style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                      ),
                      if (circle.description != null && circle.description!.isNotEmpty)
                        Text(
                          circle.description!,
                          style: textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(Icons.people_outline, size: 12, color: cs.onSurfaceVariant),
                          const SizedBox(width: 4),
                          Text(
                            '${circle.memberCount} members',
                            style: textTheme.labelSmall?.copyWith(color: cs.onSurfaceVariant),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                FilledButton(
                  onPressed: () {
                    HapticFeedback.mediumImpact();
                    onJoinToggle();
                  },
                  style: FilledButton.styleFrom(
                    backgroundColor: isJoined ? cs.surfaceContainerHighest : cs.primary,
                    foregroundColor: isJoined ? cs.onSurfaceVariant : cs.onPrimary,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    minimumSize: Size.zero,
                  ),
                  child: Text(isJoined ? 'Joined ✓' : 'Join'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Card for popular circles with trending indicator.
class PopularCircleCard extends StatelessWidget {
  final Circle circle;
  final bool isJoined;
  final VoidCallback onTap;
  final VoidCallback onJoinToggle;

  const PopularCircleCard({
    super.key,
    required this.circle,
    required this.isJoined,
    required this.onTap,
    required this.onJoinToggle,
  });

  String _buildSemanticLabel() {
    final parts = [circle.name];
    parts.add('${circle.memberCount} members');
    parts.add(isJoined ? 'joined' : 'not joined');
    parts.add('popular circle');
    return parts.join(', ');
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Semantics(
      button: true,
      label: _buildSemanticLabel(),
      child: Card(
        elevation: 2,
        margin: const EdgeInsets.only(right: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        child: InkWell(
          onTap: () {
            HapticFeedback.lightImpact();
            onTap();
          },
          borderRadius: BorderRadius.circular(14),
          child: Container(
            width: 180,
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: IconMappings.getCircleCategoryColor(circle.category).withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      alignment: Alignment.center,
                      child: Text(circle.icon, style: const TextStyle(fontSize: 18)),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: cs.tertiary.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.local_fire_department, size: 12, color: cs.tertiary),
                          const SizedBox(width: 2),
                          Text(
                            '${circle.memberCount}',
                            style: textTheme.labelSmall?.copyWith(
                              color: cs.tertiary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  circle.name,
                  style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Expanded(
                  child: Text(
                    circle.description ?? '',
                    style: textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () {
                      HapticFeedback.mediumImpact();
                      onJoinToggle();
                    },
                    style: FilledButton.styleFrom(
                      backgroundColor: isJoined ? cs.surfaceContainerHighest : cs.primary,
                      foregroundColor: isJoined ? cs.onSurfaceVariant : cs.onPrimary,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                    child: Text(isJoined ? 'Joined ✓' : 'Join'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Skeleton loading card for circles.
class CircleCardSkeleton extends StatelessWidget {
  const CircleCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: cs.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    height: 14,
                    width: 120,
                    decoration: BoxDecoration(
                      color: cs.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    height: 10,
                    width: 80,
                    decoration: BoxDecoration(
                      color: cs.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ],
              ),
            ),
            Container(
              height: 32,
              width: 60,
              decoration: BoxDecoration(
                color: cs.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Circle discovery card with match score and insights.
class CircleDiscoveryCard extends StatelessWidget {
  final Circle circle;
  final int matchScore;
  final List<String> insights;
  final VoidCallback? onJoin;
  final VoidCallback? onTap;

  const CircleDiscoveryCard({
    super.key,
    required this.circle,
    required this.matchScore,
    required this.insights,
    this.onJoin,
    this.onTap,
  });

  String _buildSemanticLabel() {
    final parts = [circle.name];
    parts.add('$matchScore percent match');
    parts.add('${circle.memberCount} members');
    if (onJoin != null) {
      parts.add('tap join to become a member');
    }
    return parts.join(', ');
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Semantics(
      button: true,
      label: _buildSemanticLabel(),
      child: Card(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: InkWell(
          onTap: () {
            HapticFeedback.lightImpact();
            onTap?.call();
          },
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: cs.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      alignment: Alignment.center,
                      child: Icon(
                        IconMappings.getCircleIcon(circle.category),
                        size: 22,
                        color: IconMappings.getCircleCategoryColor(circle.category),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            circle.name,
                            style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (circle.description != null && circle.description!.isNotEmpty)
                            Text(
                              circle.description!,
                              style: textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: cs.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '$matchScore%',
                        style: TextStyle(
                          color: cs.primary,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
                if (circle.tags.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: circle.tags.take(4).map((t) => Chip(label: Text(t))).toList(),
                  ),
                ],
                const SizedBox(height: 12),
                Row(
                  children: [
                    Icon(Icons.people_outline, size: 16, color: cs.onSurfaceVariant),
                    const SizedBox(width: 4),
                    Text(
                      '${circle.memberCount}${circle.maxMembers != null ? '/${circle.maxMembers}' : ''} members',
                      style: textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant),
                    ),
                    const Spacer(),
                    if (onJoin != null)
                      FilledButton.icon(
                        onPressed: () {
                          HapticFeedback.mediumImpact();
                          onJoin!();
                        },
                        icon: const Icon(Icons.add, size: 18),
                        label: const Text('Join'),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
