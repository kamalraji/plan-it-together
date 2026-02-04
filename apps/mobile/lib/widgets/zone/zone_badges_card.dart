import 'package:flutter/material.dart';
import 'package:thittam1hub/models/zone_gamification_models.dart';

/// Compact badges card for Zone home
class ZoneBadgesCard extends StatelessWidget {
  final List<ZoneUserBadge> earnedBadges;
  final List<ZoneBadge> allBadges;
  final VoidCallback? onViewAll;
  final bool isLoading;

  const ZoneBadgesCard({
    super.key,
    required this.earnedBadges,
    required this.allBadges,
    this.onViewAll,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final earnedIds = earnedBadges.map((b) => b.badgeId).toSet();

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.emoji_events, color: theme.colorScheme.primary),
                const SizedBox(width: 8),
                Text(
                  'Badges',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${earnedBadges.length}/${allBadges.length}',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: theme.colorScheme.onPrimary,
                    ),
                  ),
                ),
                const Spacer(),
                if (onViewAll != null)
                  TextButton(
                    onPressed: onViewAll,
                    child: const Text('View All'),
                  ),
              ],
            ),
            const SizedBox(height: 16),

            if (isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: CircularProgressIndicator(),
                ),
              )
            else if (allBadges.isEmpty)
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text(
                    'No badges available yet',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
              )
            else
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: allBadges.take(6).map((badge) {
                  final isEarned = earnedIds.contains(badge.id);
                  return _BadgeItem(
                    badge: badge,
                    isEarned: isEarned,
                  );
                }).toList(),
              ),
          ],
        ),
      ),
    );
  }
}

class _BadgeItem extends StatelessWidget {
  final ZoneBadge badge;
  final bool isEarned;

  const _BadgeItem({
    required this.badge,
    required this.isEarned,
  });

  IconData _getIconData(String iconName) {
    switch (iconName) {
      case 'sunrise':
        return Icons.wb_sunny;
      case 'bar-chart':
        return Icons.bar_chart;
      case 'star':
        return Icons.star;
      case 'message-circle':
        return Icons.message;
      case 'download':
        return Icons.download;
      case 'trending-up':
        return Icons.trending_up;
      case 'zap':
        return Icons.bolt;
      case 'crown':
        return Icons.workspace_premium;
      case 'award':
      default:
        return Icons.emoji_events;
    }
  }

  Color _getCategoryColor(ZoneBadgeCategory category) {
    switch (category) {
      case ZoneBadgeCategory.engagement:
        return Colors.blue;
      case ZoneBadgeCategory.learning:
        return Colors.green;
      case ZoneBadgeCategory.networking:
        return Colors.purple;
      case ZoneBadgeCategory.contribution:
        return Colors.orange;
      case ZoneBadgeCategory.achievement:
        return Colors.amber;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = _getCategoryColor(badge.category);

    return Tooltip(
      message: badge.description ?? badge.name,
      child: AnimatedOpacity(
        opacity: isEarned ? 1.0 : 0.4,
        duration: const Duration(milliseconds: 200),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isEarned
                    ? color.withOpacity(0.2)
                    : theme.colorScheme.surfaceContainerHighest,
                border: Border.all(
                  color: isEarned ? color : Colors.transparent,
                  width: 2,
                ),
              ),
              child: Icon(
                _getIconData(badge.icon),
                color: isEarned ? color : theme.colorScheme.onSurfaceVariant,
                size: 24,
              ),
            ),
            const SizedBox(height: 4),
            SizedBox(
              width: 56,
              child: Text(
                badge.name,
                style: theme.textTheme.labelSmall?.copyWith(
                  color: isEarned
                      ? theme.colorScheme.onSurface
                      : theme.colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Full badges sheet with progress
class ZoneBadgesSheet extends StatelessWidget {
  final List<ZoneUserBadge> earnedBadges;
  final List<ZoneBadge> allBadges;

  const ZoneBadgesSheet({
    super.key,
    required this.earnedBadges,
    required this.allBadges,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final earnedIds = earnedBadges.map((b) => b.badgeId).toSet();

    // Group badges by category
    final badgesByCategory = <ZoneBadgeCategory, List<ZoneBadge>>{};
    for (final badge in allBadges) {
      badgesByCategory.putIfAbsent(badge.category, () => []).add(badge);
    }

    return DraggableScrollableSheet(
      initialChildSize: 0.7,
      maxChildSize: 0.95,
      minChildSize: 0.5,
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Handle
              Center(
                child: Container(
                  margin: const EdgeInsets.symmetric(vertical: 12),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.onSurfaceVariant.withOpacity(0.4),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    Icon(Icons.emoji_events, color: theme.colorScheme.primary),
                    const SizedBox(width: 8),
                    Text(
                      'All Badges',
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primary,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${earnedBadges.length}/${allBadges.length}',
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: theme.colorScheme.onPrimary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),

              // Progress bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: allBadges.isEmpty
                        ? 0
                        : earnedBadges.length / allBadges.length,
                    minHeight: 8,
                    backgroundColor: theme.colorScheme.surfaceContainerHighest,
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Badges by category
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: badgesByCategory.entries.map((entry) {
                    final category = entry.key;
                    final badges = entry.value;
                    final earnedInCategory =
                        badges.where((b) => earnedIds.contains(b.id)).length;

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              category.displayName,
                              style: theme.textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const Spacer(),
                            Text(
                              '$earnedInCategory/${badges.length}',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 16,
                          runSpacing: 16,
                          children: badges.map((badge) {
                            final isEarned = earnedIds.contains(badge.id);
                            return _BadgeItem(badge: badge, isEarned: isEarned);
                          }).toList(),
                        ),
                        const SizedBox(height: 24),
                      ],
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
