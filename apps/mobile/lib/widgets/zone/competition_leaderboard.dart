import 'package:flutter/material.dart';
import '../../models/competition_models.dart';
import '../styled_avatar.dart';

/// Animated competition leaderboard widget
class CompetitionLeaderboard extends StatelessWidget {
  final List<CompetitionLeaderboardEntry> entries;
  final bool showFullList;
  final VoidCallback? onViewAll;
  final bool isLoading;

  const CompetitionLeaderboard({
    super.key,
    required this.entries,
    this.showFullList = false,
    this.onViewAll,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    if (isLoading) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Center(
            child: CircularProgressIndicator(color: colorScheme.primary),
          ),
        ),
      );
    }

    if (entries.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              Icon(
                Icons.leaderboard,
                size: 48,
                color: colorScheme.outline,
              ),
              const SizedBox(height: 12),
              Text(
                'No scores yet',
                style: theme.textTheme.titleMedium?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Be the first to answer!',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: colorScheme.outline,
                ),
              ),
            ],
          ),
        ),
      );
    }

    final displayEntries = showFullList ? entries : entries.take(5).toList();

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: colorScheme.primaryContainer.withOpacity(0.3),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(16),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.leaderboard,
                  color: colorScheme.primary,
                ),
                const SizedBox(width: 12),
                Text(
                  'Leaderboard',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                if (!showFullList && entries.length > 5)
                  TextButton(
                    onPressed: onViewAll,
                    child: const Text('View All'),
                  ),
              ],
            ),
          ),

          // Top 3 podium (if showing full list)
          if (showFullList && entries.length >= 3)
            _buildPodium(context, entries.take(3).toList()),

          // List
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: showFullList && entries.length >= 3
                ? displayEntries.skip(3).length
                : displayEntries.length,
            separatorBuilder: (_, __) => const Divider(height: 1, indent: 72),
            itemBuilder: (context, index) {
              final entry = showFullList && entries.length >= 3
                  ? displayEntries.skip(3).elementAt(index)
                  : displayEntries[index];
              return _buildLeaderboardTile(context, entry);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildPodium(
      BuildContext context, List<CompetitionLeaderboardEntry> top3) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // 2nd place
          if (top3.length > 1) _buildPodiumPlace(context, top3[1], 2, 80),
          // 1st place
          _buildPodiumPlace(context, top3[0], 1, 100),
          // 3rd place
          if (top3.length > 2) _buildPodiumPlace(context, top3[2], 3, 60),
        ],
      ),
    );
  }

  Widget _buildPodiumPlace(
    BuildContext context,
    CompetitionLeaderboardEntry entry,
    int place,
    double height,
  ) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    final colors = {
      1: Colors.amber,
      2: Colors.grey.shade400,
      3: Colors.brown.shade300,
    };

    final icons = {
      1: '🥇',
      2: '🥈',
      3: '🥉',
    };

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Avatar with medal
        Stack(
          clipBehavior: Clip.none,
          children: [
            StyledAvatar(
              imageUrl: entry.avatarUrl,
              initials: entry.name.isNotEmpty ? entry.name[0] : '?',
              avatarSize: place == 1 ? StyledAvatarSize.lg : StyledAvatarSize.md,
            ),
            Positioned(
              bottom: -4,
              right: -4,
              child: Text(
                icons[place] ?? '',
                style: TextStyle(fontSize: place == 1 ? 24 : 20),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          entry.name,
          style: theme.textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        Text(
          '${entry.score} pts',
          style: theme.textTheme.bodySmall?.copyWith(
            color: colors[place],
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        // Podium block
        Container(
          width: 70,
          height: height,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                colors[place]!.withOpacity(0.8),
                colors[place]!.withOpacity(0.4),
              ],
            ),
            borderRadius: const BorderRadius.vertical(
              top: Radius.circular(8),
            ),
          ),
          child: Center(
            child: Text(
              '$place',
              style: theme.textTheme.headlineMedium?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLeaderboardTile(
      BuildContext context, CompetitionLeaderboardEntry entry) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Container(
      color: entry.isCurrentUser
          ? colorScheme.primaryContainer.withOpacity(0.3)
          : null,
      child: ListTile(
        leading: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 32,
              child: Text(
                '#${entry.rank}',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: entry.rank <= 3
                      ? _getRankColor(entry.rank)
                      : colorScheme.onSurfaceVariant,
                ),
              ),
            ),
            const SizedBox(width: 8),
            StyledAvatar(
              imageUrl: entry.avatarUrl,
              initials: entry.name.isNotEmpty ? entry.name[0] : '?',
              avatarSize: StyledAvatarSize.sm,
            ),
          ],
        ),
        title: Row(
          children: [
            Expanded(
              child: Text(
                entry.name,
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight:
                      entry.isCurrentUser ? FontWeight.bold : FontWeight.w500,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (entry.isCurrentUser)
              Container(
                margin: const EdgeInsets.only(left: 8),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: colorScheme.primary,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  'YOU',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: colorScheme.onPrimary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
          ],
        ),
        subtitle: Row(
          children: [
            Text(
              '${entry.correctAnswers}/${entry.totalAnswers} correct',
              style: theme.textTheme.bodySmall?.copyWith(
                color: colorScheme.outline,
              ),
            ),
            if (entry.streak > 0) ...[
              const SizedBox(width: 8),
              Icon(
                Icons.local_fire_department,
                size: 14,
                color: Colors.orange,
              ),
              Text(
                '${entry.streak}',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: Colors.orange,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ],
        ),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: colorScheme.secondaryContainer,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            '${entry.score}',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: colorScheme.onSecondaryContainer,
            ),
          ),
        ),
      ),
    );
  }

  Color _getRankColor(int rank) {
    switch (rank) {
      case 1:
        return Colors.amber;
      case 2:
        return Colors.grey.shade600;
      case 3:
        return Colors.brown;
      default:
        return Colors.grey;
    }
  }
}
