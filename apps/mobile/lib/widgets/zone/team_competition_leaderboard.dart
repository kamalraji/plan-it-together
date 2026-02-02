import 'package:flutter/material.dart';
import '../../models/competition_models.dart';

/// Team-based competition leaderboard widget
class TeamCompetitionLeaderboard extends StatelessWidget {
  final List<CompetitionTeamScore> teams;
  final String? currentTeamId;
  final bool showFullList;
  final VoidCallback? onViewAll;
  final bool isLoading;

  const TeamCompetitionLeaderboard({
    super.key,
    required this.teams,
    this.currentTeamId,
    this.showFullList = false,
    this.onViewAll,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    if (isLoading) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Center(child: CircularProgressIndicator()),
        ),
      );
    }

    if (teams.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            children: [
              Icon(
                Icons.groups_outlined,
                size: 48,
                color: colorScheme.outline,
              ),
              const SizedBox(height: 12),
              Text(
                'No Teams Yet',
                style: theme.textTheme.titleMedium?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      );
    }

    final displayTeams = showFullList ? teams : teams.take(5).toList();
    final topThree = teams.take(3).toList();

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.groups, color: colorScheme.primary),
                const SizedBox(width: 8),
                Text(
                  'Team Leaderboard',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                if (!showFullList && teams.length > 5)
                  TextButton(
                    onPressed: onViewAll,
                    child: const Text('View All'),
                  ),
              ],
            ),
            const SizedBox(height: 16),

            // Team Podium
            if (topThree.isNotEmpty) _buildTeamPodium(context, topThree),
            const SizedBox(height: 16),

            // Team List
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: displayTeams.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final team = displayTeams[index];
                return _buildTeamTile(context, team, index + 1);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTeamPodium(BuildContext context, List<CompetitionTeamScore> topThree) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        // Second place
        if (topThree.length > 1)
          _buildPodiumPlace(context, topThree[1], 2)
        else
          const SizedBox(width: 90),
        const SizedBox(width: 8),
        // First place
        if (topThree.isNotEmpty)
          _buildPodiumPlace(context, topThree[0], 1),
        const SizedBox(width: 8),
        // Third place
        if (topThree.length > 2)
          _buildPodiumPlace(context, topThree[2], 3)
        else
          const SizedBox(width: 90),
      ],
    );
  }

  Widget _buildPodiumPlace(BuildContext context, CompetitionTeamScore team, int place) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isCurrentTeam = team.teamId == currentTeamId;

    final podiumHeight = place == 1 ? 80.0 : (place == 2 ? 60.0 : 50.0);
    final Color podiumColor;
    final String medal;
    switch (place) {
      case 1:
        podiumColor = Colors.amber;
        medal = '🥇';
        break;
      case 2:
        podiumColor = Colors.grey.shade400;
        medal = '🥈';
        break;
      default:
        podiumColor = Colors.orange.shade700;
        medal = '🥉';
    }

    return Column(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: podiumColor.withOpacity(0.2),
            shape: BoxShape.circle,
            border: Border.all(
              color: isCurrentTeam ? colorScheme.primary : podiumColor,
              width: isCurrentTeam ? 3 : 2,
            ),
          ),
          child: Center(
            child: Text(
              team.teamName.substring(0, 1).toUpperCase(),
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
                color: podiumColor,
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          team.teamName,
          style: theme.textTheme.labelSmall?.copyWith(
            fontWeight: FontWeight.w600,
            color: isCurrentTeam ? colorScheme.primary : colorScheme.onSurface,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        Text(
          '${team.totalScore} pts',
          style: theme.textTheme.labelSmall?.copyWith(
            color: colorScheme.outline,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          width: 90,
          height: podiumHeight,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                podiumColor.withOpacity(0.8),
                podiumColor,
              ],
            ),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
          ),
          child: Center(
            child: Text(
              medal,
              style: const TextStyle(fontSize: 28),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTeamTile(BuildContext context, CompetitionTeamScore team, int rank) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isCurrentTeam = team.teamId == currentTeamId;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isCurrentTeam
            ? colorScheme.primaryContainer.withOpacity(0.3)
            : colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isCurrentTeam
              ? colorScheme.primary
              : colorScheme.outline.withOpacity(0.2),
          width: isCurrentTeam ? 2 : 1,
        ),
      ),
      child: Row(
        children: [
          // Rank
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: rank <= 3
                  ? _getRankColor(rank).withOpacity(0.2)
                  : colorScheme.surfaceContainerHighest,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                '$rank',
                style: theme.textTheme.labelMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: rank <= 3
                      ? _getRankColor(rank)
                      : colorScheme.onSurfaceVariant,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),

          // Team Avatar
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: colorScheme.primaryContainer,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                team.teamName.substring(0, 1).toUpperCase(),
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: colorScheme.primary,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),

          // Team info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        team.teamName,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: isCurrentTeam ? colorScheme.primary : null,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (isCurrentTeam) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: colorScheme.primary,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'YOU',
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: colorScheme.onPrimary,
                            fontWeight: FontWeight.bold,
                            fontSize: 10,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Icon(Icons.people, size: 12, color: colorScheme.outline),
                    const SizedBox(width: 4),
                    Text(
                      '${team.memberCount} members',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: colorScheme.outline,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Icon(Icons.check_circle, size: 12, color: Colors.green),
                    const SizedBox(width: 4),
                    Text(
                      '${team.correctAnswers}/${team.totalAnswers}',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: colorScheme.outline,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Score
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${team.totalScore}',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: colorScheme.primary,
                ),
              ),
              Text(
                'points',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: colorScheme.outline,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Color _getRankColor(int rank) {
    switch (rank) {
      case 1:
        return Colors.amber;
      case 2:
        return Colors.grey;
      case 3:
        return Colors.orange.shade700;
      default:
        return Colors.grey;
    }
  }
}
