import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/impact_profile.dart';
import 'package:thittam1hub/supabase/gamification_service.dart';
import 'package:thittam1hub/widgets/glassmorphism_bottom_sheet.dart';
import 'package:thittam1hub/widgets/shimmer_loading.dart';

import 'package:thittam1hub/services/logging_service.dart';
/// Enhanced Score Detail Sheet with gamification elements
class ScoreDetailSheetContent extends StatefulWidget {
  // Logging
   static final _log = LoggingService.instance;
   static const String _tag = 'ScoreDetailSheetContent';

  final ImpactProfile profile;

  const ScoreDetailSheetContent({Key? key, required this.profile})
      : super(key: key);

  @override
  State<ScoreDetailSheetContent> createState() =>
      _ScoreDetailSheetContentState();
}

class _ScoreDetailSheetContentState extends State<ScoreDetailSheetContent>
    with SingleTickerProviderStateMixin {
  static const String _tag = 'ScoreDetailSheetContent';
  static final _log = LoggingService.instance;
  
  final GamificationService _gamificationService = GamificationService.instance;
  List<BadgeItem> _allBadges = [];
  List<String> _earnedBadgeIds = [];
  bool _loading = true;
  late AnimationController _progressController;
  late Animation<double> _progressAnimation;

  @override
  void initState() {
    super.initState();
    _progressController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _loadData();
  }

  @override
  void dispose() {
    _progressController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    try {
      final results = await Future.wait([
        _gamificationService.getAllBadges(),
        _gamificationService.getMyBadgeIds(),
      ]);
      if (mounted) {
        setState(() {
          _allBadges = results[0] as List<BadgeItem>;
          _earnedBadgeIds = results[1] as List<String>;
          _loading = false;
        });
        // Animate progress bar
        final level = widget.profile.level;
        final score = widget.profile.impactScore;
        final progress = level > 0 ? (score % 1000) / 1000 : 0.0;
        _progressAnimation = Tween<double>(begin: 0, end: progress).animate(
          CurvedAnimation(parent: _progressController, curve: Curves.easeOutCubic),
        );
        _progressController.forward();
      }
    } catch (e) {
      _log.error('Error loading score data: $e', tag: _tag);
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final score = widget.profile.impactScore;
    final level = widget.profile.level;
    final streak = widget.profile.streakCount ?? 0;
    final pointsToNextLevel = ((level + 1) * 1000) - score;
    final badgeCount = widget.profile.badges.length;

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Hero Score Card
          _buildHeroScoreCard(cs, textTheme, score, level, pointsToNextLevel),
          const SizedBox(height: 20),

          // Stats Grid
          _buildStatsGrid(cs, textTheme, streak, badgeCount),
          const SizedBox(height: 20),

          // Level Milestones
          _buildLevelMilestones(cs, textTheme, level),
          const SizedBox(height: 20),

          // Recent Badges
          _buildRecentBadges(cs, textTheme),
          const SizedBox(height: 20),

          // Action Buttons
          _buildActionButtons(cs),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildHeroScoreCard(
    ColorScheme cs,
    TextTheme textTheme,
    int score,
    int level,
    int pointsToNextLevel,
  ) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            cs.primary,
            cs.tertiary,
          ],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: cs.primary.withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          // Score Display with Animation
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.amber.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.bolt_rounded, size: 36, color: Colors.amber),
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '$score',
                    style: textTheme.displayMedium?.copyWith(
                      color: cs.onPrimary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    'Impact Points',
                    style: textTheme.bodyMedium?.copyWith(
                      color: cs.onPrimary.withValues(alpha: 0.8),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Level Badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            decoration: BoxDecoration(
              color: cs.onPrimary.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(30),
              border: Border.all(color: cs.onPrimary.withValues(alpha: 0.3)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.military_tech_rounded, size: 20, color: Colors.amber),
                const SizedBox(width: 8),
                Text(
                  'Level $level',
                  style: textTheme.titleMedium?.copyWith(
                    color: cs.onPrimary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  _getLevelTitle(level),
                  style: textTheme.bodySmall?.copyWith(
                    color: cs.onPrimary.withValues(alpha: 0.8),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Progress Bar with Animation
          Column(
            children: [
              AnimatedBuilder(
                animation: _progressController,
                builder: (context, child) {
                  final progress = _progressController.isAnimating || _progressController.isCompleted
                      ? _progressAnimation.value
                      : 0.0;
                  return ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: LinearProgressIndicator(
                      value: progress,
                      backgroundColor: cs.onPrimary.withValues(alpha: 0.2),
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.amber),
                      minHeight: 12,
                    ),
                  );
                },
              ),
              const SizedBox(height: 8),
              Text(
                '$pointsToNextLevel pts to Level ${level + 1}',
                style: textTheme.bodySmall?.copyWith(
                  color: cs.onPrimary.withValues(alpha: 0.8),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatsGrid(
    ColorScheme cs,
    TextTheme textTheme,
    int streak,
    int badgeCount,
  ) {
    return Row(
      children: [
        Expanded(
          child: _StatCard(
            icon: Icons.local_fire_department_rounded,
            iconColor: Colors.orange,
            value: '$streak',
            label: 'Day Streak',
            onTap: () => HapticFeedback.lightImpact(),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _StatCard(
            icon: Icons.emoji_events_rounded,
            iconColor: Colors.amber,
            value: '$badgeCount',
            label: 'Badges',
            onTap: () {
              HapticFeedback.lightImpact();
              Navigator.pop(context);
              showGlassBottomSheet(
                context: context,
                title: 'Your Badges',
                maxHeight: MediaQuery.of(context).size.height * 0.8,
                child: _FullBadgesContent(
                  allBadges: _allBadges,
                  earnedBadgeIds: _earnedBadgeIds,
                ),
              );
            },
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _StatCard(
            icon: Icons.trending_up_rounded,
            iconColor: Colors.green,
            value: '+${_calculateWeeklyGrowth()}',
            label: 'This Week',
            onTap: () => HapticFeedback.lightImpact(),
          ),
        ),
      ],
    );
  }

  Widget _buildLevelMilestones(ColorScheme cs, TextTheme textTheme, int currentLevel) {
    final milestones = [
      _LevelMilestone(level: 1, title: 'Newcomer', icon: Icons.stars_rounded, reward: 'Profile Badge'),
      _LevelMilestone(level: 5, title: 'Rising Star', icon: Icons.rocket_launch_rounded, reward: '1 Free Boost'),
      _LevelMilestone(level: 10, title: 'Connector', icon: Icons.hub_rounded, reward: 'Priority Matching'),
      _LevelMilestone(level: 25, title: 'Influencer', icon: Icons.whatshot_rounded, reward: 'Featured Profile'),
      _LevelMilestone(level: 50, title: 'Legend', icon: Icons.auto_awesome_rounded, reward: 'Exclusive Badge'),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Row(
            children: [
              Icon(Icons.flag_rounded, size: 18, color: cs.primary),
              const SizedBox(width: 8),
              Text(
                'Level Milestones',
                style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: cs.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: milestones.map((m) {
              final isUnlocked = currentLevel >= m.level;
              final isNext = !isUnlocked && milestones.where((x) => currentLevel >= x.level).length == 
                  milestones.indexOf(m);
              return _MilestoneRow(
                milestone: m,
                isUnlocked: isUnlocked,
                isNext: isNext,
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildRecentBadges(ColorScheme cs, TextTheme textTheme) {
    if (_loading) {
      return ShimmerLoading(
        child: Container(
          height: 100,
          decoration: BoxDecoration(
            color: cs.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      );
    }

    final earnedBadges = _allBadges.where((b) => _earnedBadgeIds.contains(b.id)).take(4).toList();
    final unearnedBadges = _allBadges.where((b) => !_earnedBadgeIds.contains(b.id)).take(4 - earnedBadges.length).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Row(
            children: [
              Icon(Icons.workspace_premium_rounded, size: 18, color: Colors.amber),
              const SizedBox(width: 8),
              Text(
                'Achievements',
                style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const Spacer(),
              TextButton(
                onPressed: () {
                  Navigator.pop(context);
                  showGlassBottomSheet(
                    context: context,
                    title: 'All Badges',
                    maxHeight: MediaQuery.of(context).size.height * 0.8,
                    child: _FullBadgesContent(
                      allBadges: _allBadges,
                      earnedBadgeIds: _earnedBadgeIds,
                    ),
                  );
                },
                child: Text('See All', style: TextStyle(color: cs.primary)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 110,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              ...earnedBadges.map((b) => _BadgeCard(badge: b, isEarned: true)),
              ...unearnedBadges.map((b) => _BadgeCard(badge: b, isEarned: false)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildActionButtons(ColorScheme cs) {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton.icon(
            onPressed: () {
              Navigator.pop(context);
              showGlassBottomSheet(
                context: context,
                title: 'Leaderboard',
                maxHeight: MediaQuery.of(context).size.height * 0.8,
                child: const _LeaderboardContent(),
              );
            },
            icon: const Icon(Icons.leaderboard_outlined),
            label: const Text('Leaderboard'),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: FilledButton.icon(
            onPressed: () {
              HapticFeedback.mediumImpact();
              Navigator.pop(context);
              // Navigate to earn points page or show tips
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: const Text('Post sparks, connect, and play games to earn points!'),
                  backgroundColor: cs.primary,
                ),
              );
            },
            icon: const Icon(Icons.add_circle_outline_rounded),
            label: const Text('Earn Points'),
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ),
      ],
    );
  }

  String _getLevelTitle(int level) {
    if (level >= 50) return 'Legend';
    if (level >= 25) return 'Influencer';
    if (level >= 10) return 'Connector';
    if (level >= 5) return 'Rising Star';
    return 'Newcomer';
  }

  int _calculateWeeklyGrowth() {
    // Placeholder - would calculate from actual data
    return (widget.profile.impactScore * 0.1).round().clamp(10, 500);
  }
}

// ============ Supporting Widgets ============

class _StatCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String value;
  final String label;
  final VoidCallback? onTap;

  const _StatCard({
    required this.icon,
    required this.iconColor,
    required this.value,
    required this.label,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Material(
      color: cs.surfaceContainerHighest,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
          child: Column(
            children: [
              Icon(icon, size: 28, color: iconColor),
              const SizedBox(height: 8),
              Text(
                value,
                style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
              Text(
                label,
                style: textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LevelMilestone {
  final int level;
  final String title;
  final IconData icon;
  final String reward;

  const _LevelMilestone({
    required this.level,
    required this.title,
    required this.icon,
    required this.reward,
  });
}

class _MilestoneRow extends StatelessWidget {
  final _LevelMilestone milestone;
  final bool isUnlocked;
  final bool isNext;

  const _MilestoneRow({
    required this.milestone,
    required this.isUnlocked,
    required this.isNext,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: isUnlocked
                  ? cs.primary.withValues(alpha: 0.15)
                  : cs.surfaceContainerHigh,
              borderRadius: BorderRadius.circular(10),
              border: isNext
                  ? Border.all(color: cs.primary, width: 2)
                  : null,
            ),
            child: Icon(
              milestone.icon,
              size: 20,
              color: isUnlocked ? cs.primary : cs.onSurfaceVariant.withValues(alpha: 0.5),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      'Level ${milestone.level}',
                      style: textTheme.bodySmall?.copyWith(
                        color: isUnlocked ? cs.primary : cs.onSurfaceVariant,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      milestone.title,
                      style: textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: isUnlocked ? cs.onSurface : cs.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
                Text(
                  milestone.reward,
                  style: textTheme.bodySmall?.copyWith(
                    color: cs.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          if (isUnlocked)
            Icon(Icons.check_circle_rounded, color: Colors.green, size: 24)
          else if (isNext)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: cs.primary,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                'NEXT',
                style: textTheme.labelSmall?.copyWith(
                  color: cs.onPrimary,
                  fontWeight: FontWeight.bold,
                ),
              ),
            )
          else
            Icon(Icons.lock_outline_rounded, color: cs.onSurfaceVariant.withValues(alpha: 0.5), size: 20),
        ],
      ),
    );
  }
}

class _BadgeCard extends StatelessWidget {
  final BadgeItem badge;
  final bool isEarned;

  const _BadgeCard({required this.badge, required this.isEarned});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final color = _getRarityColor(badge.rarity);

    return Container(
      width: 90,
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isEarned
            ? color.withValues(alpha: 0.1)
            : cs.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(16),
        border: isEarned
            ? Border.all(color: color.withValues(alpha: 0.3))
            : null,
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Stack(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: isEarned
                      ? color.withValues(alpha: 0.2)
                      : cs.surfaceContainerHigh,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    badge.icon,
                    style: TextStyle(
                      fontSize: 20,
                      color: isEarned ? null : cs.onSurfaceVariant.withValues(alpha: 0.3),
                    ),
                  ),
                ),
              ),
              if (!isEarned)
                Positioned.fill(
                  child: Container(
                    decoration: BoxDecoration(
                      color: cs.surface.withValues(alpha: 0.5),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.lock_outline_rounded, 
                      size: 16, 
                      color: cs.onSurfaceVariant.withValues(alpha: 0.6),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            badge.name,
            style: textTheme.labelSmall?.copyWith(
              fontWeight: FontWeight.w600,
              color: isEarned ? cs.onSurface : cs.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Color _getRarityColor(String rarity) {
    switch (rarity.toUpperCase()) {
      case 'LEGENDARY':
        return Colors.amber;
      case 'EPIC':
        return Colors.purple;
      case 'RARE':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }
}

// ============ Full Badges Content ============

class _FullBadgesContent extends StatelessWidget {
  final List<BadgeItem> allBadges;
  final List<String> earnedBadgeIds;

  const _FullBadgesContent({
    required this.allBadges,
    required this.earnedBadgeIds,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    
    final earned = allBadges.where((b) => earnedBadgeIds.contains(b.id)).toList();
    final locked = allBadges.where((b) => !earnedBadgeIds.contains(b.id)).toList();

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Earned Section
          if (earned.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
              child: Row(
                children: [
                  Icon(Icons.check_circle_rounded, size: 18, color: Colors.green),
                  const SizedBox(width: 8),
                  Text('Earned (${earned.length})', 
                    style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
                ],
              ),
            ),
            ...earned.map((b) => _BadgeListTile(badge: b, isEarned: true)),
            const SizedBox(height: 16),
          ],

          // Locked Section
          if (locked.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
              child: Row(
                children: [
                  Icon(Icons.lock_outline_rounded, size: 18, color: cs.onSurfaceVariant),
                  const SizedBox(width: 8),
                  Text('Locked (${locked.length})', 
                    style: textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: cs.onSurfaceVariant,
                    )),
                ],
              ),
            ),
            ...locked.map((b) => _BadgeListTile(badge: b, isEarned: false)),
          ],
        ],
      ),
    );
  }
}

class _BadgeListTile extends StatelessWidget {
  final BadgeItem badge;
  final bool isEarned;

  const _BadgeListTile({required this.badge, required this.isEarned});

  Color _getRarityColor(String rarity) {
    switch (rarity.toUpperCase()) {
      case 'LEGENDARY':
        return Colors.amber;
      case 'EPIC':
        return Colors.purple;
      case 'RARE':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final color = _getRarityColor(badge.rarity);

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4),
      color: isEarned ? color.withValues(alpha: 0.05) : null,
      child: ListTile(
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: color.withValues(alpha: isEarned ? 0.2 : 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Center(
            child: Text(badge.icon, style: const TextStyle(fontSize: 22)),
          ),
        ),
        title: Text(
          badge.name,
          style: textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.bold,
            color: isEarned ? cs.onSurface : cs.onSurfaceVariant,
          ),
        ),
        subtitle: Text(
          badge.description,
          style: textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant),
        ),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.2),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            badge.rarity,
            style: textTheme.labelSmall?.copyWith(
              color: color,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ),
    );
  }
}

// ============ Leaderboard Content ============

class _LeaderboardContent extends StatefulWidget {
  const _LeaderboardContent();

  @override
  State<_LeaderboardContent> createState() => _LeaderboardContentState();
}

class _LeaderboardContentState extends State<_LeaderboardContent> {
  static const String _tag = 'LeaderboardContent';
  static final _log = LoggingService.instance;
  
  final GamificationService _gamificationService = GamificationService.instance;
  List<LeaderboardEntry> _entries = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final entries = await _gamificationService.getTopLeaderboard(limit: 20);
      if (mounted) {
        setState(() {
          _entries = entries;
          _loading = false;
        });
      }
    } catch (e) {
      _log.error('Error loading leaderboard: $e', tag: _tag);
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_entries.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.leaderboard_outlined, size: 48, color: cs.onSurfaceVariant),
            const SizedBox(height: 16),
            Text('Leaderboard is empty', style: textTheme.bodyLarge?.copyWith(color: cs.onSurfaceVariant)),
          ],
        ),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _entries.length,
      itemBuilder: (context, index) {
        final user = _entries[index];
        final rank = user.rank;

        Color rankColor;
        IconData? rankIcon;
        if (rank == 1) {
          rankColor = Colors.amber;
          rankIcon = Icons.emoji_events_rounded;
        } else if (rank == 2) {
          rankColor = Colors.grey.shade400;
          rankIcon = Icons.emoji_events_rounded;
        } else if (rank == 3) {
          rankColor = Colors.brown.shade300;
          rankIcon = Icons.emoji_events_rounded;
        } else {
          rankColor = cs.onSurfaceVariant;
          rankIcon = null;
        }

        return Card(
          margin: const EdgeInsets.symmetric(vertical: 4),
          child: ListTile(
            leading: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 32,
                  child: rankIcon != null
                      ? Icon(rankIcon, color: rankColor, size: 24)
                      : Text(
                          '#$rank',
                          style: textTheme.titleSmall?.copyWith(
                            color: rankColor,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                ),
                const SizedBox(width: 8),
                CircleAvatar(
                  backgroundImage: user.avatarUrl != null ? NetworkImage(user.avatarUrl!) : null,
                  child: user.avatarUrl == null
                      ? Text(user.name.isNotEmpty ? user.name[0] : '?')
                      : null,
                ),
              ],
            ),
            title: Text(user.name, style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.bolt_rounded, size: 16, color: Colors.amber),
                const SizedBox(width: 4),
                Text(
                  '${user.score}',
                  style: textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: cs.primary,
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
