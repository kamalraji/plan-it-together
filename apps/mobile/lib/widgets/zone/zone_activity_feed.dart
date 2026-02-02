import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:thittam1hub/models/zone_activity.dart';
import 'package:thittam1hub/services/zone_state_service.dart';
import 'package:thittam1hub/widgets/styled_card.dart';
import 'package:thittam1hub/widgets/styled_avatar.dart';

/// Real-time activity feed for Zone
/// Shows recent check-ins, badge earnings, leaderboard changes, etc.
class ZoneActivityFeed extends StatelessWidget {
  final int maxItems;
  final bool compact;

  const ZoneActivityFeed({
    super.key,
    this.maxItems = 10,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return Selector<ZoneStateService, ({
      bool loading,
      List<ZoneActivity> activities,
    })>(
      selector: (_, s) => (
        loading: s.isLoadingActivities,
        activities: s.recentActivities,
      ),
      builder: (context, data, _) {
        if (data.loading && data.activities.isEmpty) {
          return _buildLoadingState(cs);
        }

        if (data.activities.isEmpty) {
          return _buildEmptyState(cs, tt);
        }

        final items = data.activities.take(maxItems).toList();

        if (compact) {
          return _buildCompactFeed(context, items);
        }

        return _buildFullFeed(context, items);
      },
    );
  }

  Widget _buildLoadingState(ColorScheme cs) {
    return StyledCard(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: cs.primary,
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(ColorScheme cs, TextTheme tt) {
    return StyledCard(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.history_rounded,
              size: 48,
              color: cs.onSurfaceVariant.withOpacity(0.5),
            ),
            const SizedBox(height: 12),
            Text(
              'No recent activity',
              style: tt.bodyMedium?.copyWith(
                color: cs.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Activities will appear here as they happen',
              style: tt.bodySmall?.copyWith(
                color: cs.onSurfaceVariant.withOpacity(0.7),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCompactFeed(BuildContext context, List<ZoneActivity> items) {
    final cs = Theme.of(context).colorScheme;

    return SizedBox(
      height: 56,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final activity = items[index];
          return _CompactActivityChip(activity: activity);
        },
      ),
    );
  }

  Widget _buildFullFeed(BuildContext context, List<ZoneActivity> items) {
    return StyledCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Icon(
                  Icons.local_activity_rounded,
                  size: 20,
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(width: 8),
                Text(
                  'Live Activity',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: Colors.green,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.green.withOpacity(0.5),
                        blurRadius: 4,
                        spreadRadius: 1,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          // Activity list
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: items.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, index) {
              return _ActivityTile(activity: items[index]);
            },
          ),
        ],
      ),
    );
  }
}

class _CompactActivityChip extends StatelessWidget {
  final ZoneActivity activity;

  const _CompactActivityChip({required this.activity});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: cs.outline.withOpacity(0.1)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            activity.activityType.emoji,
            style: const TextStyle(fontSize: 16),
          ),
          const SizedBox(width: 6),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 120),
            child: Text(
              activity.title,
              style: tt.bodySmall?.copyWith(
                fontWeight: FontWeight.w500,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            activity.timeAgo,
            style: tt.bodySmall?.copyWith(
              color: cs.onSurfaceVariant,
              fontSize: 10,
            ),
          ),
        ],
      ),
    );
  }
}

class _ActivityTile extends StatelessWidget {
  final ZoneActivity activity;

  const _ActivityTile({required this.activity});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Avatar or icon
          if (activity.actorAvatar != null)
            StyledAvatar(
              imageUrl: activity.actorAvatar,
              name: activity.actorName ?? 'User',
              size: 36,
            )
          else
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: _getActivityColor(cs).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Center(
                child: Text(
                  activity.activityType.emoji,
                  style: const TextStyle(fontSize: 18),
                ),
              ),
            ),
          const SizedBox(width: 12),
          // Content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  activity.title,
                  style: tt.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (activity.description != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    activity.description!,
                    style: tt.bodySmall?.copyWith(
                      color: cs.onSurfaceVariant,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 8),
          // Time
          Text(
            activity.timeAgo,
            style: tt.bodySmall?.copyWith(
              color: cs.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }

  Color _getActivityColor(ColorScheme cs) {
    switch (activity.activityType) {
      case ZoneActivityType.checkin:
        return cs.primary;
      case ZoneActivityType.pollResult:
        return cs.secondary;
      case ZoneActivityType.leaderboardChange:
        return Colors.amber;
      case ZoneActivityType.badgeEarned:
        return Colors.purple;
      case ZoneActivityType.sessionLive:
        return Colors.red;
      case ZoneActivityType.announcement:
        return cs.tertiary;
      case ZoneActivityType.challengeComplete:
        return Colors.green;
    }
  }
}
