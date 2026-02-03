import 'package:flutter/material.dart';
import 'package:thittam1hub/models/zone_gamification_models.dart';

/// Compact leaderboard card for Zone home
class ZoneLeaderboardCard extends StatelessWidget {
  final List<ZoneLeaderboardEntry> entries;
  final ZoneUserStats? currentUserStats;
  final VoidCallback? onViewAll;
  final bool isLoading;

  const ZoneLeaderboardCard({
    super.key,
    required this.entries,
    this.currentUserStats,
    this.onViewAll,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.leaderboard, color: theme.colorScheme.primary),
                const SizedBox(width: 8),
                Text(
                  'Leaderboard',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
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
            const SizedBox(height: 12),

            // Current user stats
            if (currentUserStats != null) ...[
              _UserStatsRow(stats: currentUserStats!),
              const Divider(height: 24),
            ],

            // Top 3 leaderboard
            if (isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: CircularProgressIndicator(),
                ),
              )
            else if (entries.isEmpty)
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text(
                    'No rankings yet. Be the first!',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
              )
            else
              ...entries.take(3).map((entry) => _LeaderboardRow(entry: entry)),
          ],
        ),
      ),
    );
  }
}

class _UserStatsRow extends StatelessWidget {
  final ZoneUserStats stats;

  const _UserStatsRow({required this.stats});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.primaryContainer.withOpacity(0.3),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          _StatItem(
            icon: Icons.star,
            label: 'Points',
            value: stats.totalPoints.toString(),
            color: Colors.amber,
          ),
          _StatItem(
            icon: Icons.military_tech,
            label: 'Rank',
            value: stats.rank > 0 ? '#${stats.rank}' : '-',
            color: theme.colorScheme.primary,
          ),
          _StatItem(
            icon: Icons.emoji_events,
            label: 'Badges',
            value: stats.badgesEarned.toString(),
            color: Colors.purple,
          ),
        ],
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatItem({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Expanded(
      child: Column(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 4),
          Text(
            value,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            label,
            style: theme.textTheme.labelSmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

class _LeaderboardRow extends StatelessWidget {
  final ZoneLeaderboardEntry entry;

  const _LeaderboardRow({required this.entry});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isTopThree = entry.rank <= 3;

    Color? medalColor;
    if (entry.rank == 1) medalColor = const Color(0xFFFFD700);
    if (entry.rank == 2) medalColor = const Color(0xFFC0C0C0);
    if (entry.rank == 3) medalColor = const Color(0xFFCD7F32);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          // Rank badge
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: medalColor ?? theme.colorScheme.surfaceContainerHighest,
            ),
            child: Center(
              child: isTopThree
                  ? Icon(
                      Icons.emoji_events,
                      size: 16,
                      color: medalColor != null
                          ? Colors.white
                          : theme.colorScheme.onSurfaceVariant,
                    )
                  : Text(
                      '${entry.rank}',
                      style: theme.textTheme.labelMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
          ),
          const SizedBox(width: 12),

          // Avatar
          CircleAvatar(
            radius: 18,
            backgroundImage: entry.userAvatar != null
                ? NetworkImage(entry.userAvatar!)
                : null,
            child: entry.userAvatar == null
                ? Text(
                    (entry.userName ?? 'U')[0].toUpperCase(),
                    style: theme.textTheme.titleSmall,
                  )
                : null,
          ),
          const SizedBox(width: 12),

          // Name
          Expanded(
            child: Text(
              entry.userName ?? 'Anonymous',
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: isTopThree ? FontWeight.bold : FontWeight.normal,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),

          // Points
          Text(
            '${entry.totalPoints} pts',
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: theme.colorScheme.primary,
            ),
          ),
        ],
      ),
    );
  }
}

/// Full leaderboard sheet
class ZoneLeaderboardSheet extends StatelessWidget {
  final List<ZoneLeaderboardEntry> entries;
  final String? currentUserId;
  final bool isLoading;

  const ZoneLeaderboardSheet({
    super.key,
    required this.entries,
    this.currentUserId,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

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
                    Icon(Icons.leaderboard, color: theme.colorScheme.primary),
                    const SizedBox(width: 8),
                    Text(
                      'Full Leaderboard',
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      '${entries.length} participants',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // List
              Expanded(
                child: isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : ListView.builder(
                        controller: scrollController,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: entries.length,
                        itemBuilder: (context, index) {
                          final entry = entries[index];
                          final isCurrentUser = entry.userId == currentUserId;

                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            decoration: BoxDecoration(
                              color: isCurrentUser
                                  ? theme.colorScheme.primaryContainer
                                      .withOpacity(0.3)
                                  : null,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: _LeaderboardRow(entry: entry),
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }
}
