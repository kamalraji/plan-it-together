import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/services/video_story_service.dart';

/// Story insights analytics dashboard for story owners
/// Shows view count, completion rate, reactions, and viewer list
class StoryInsightsSheet extends StatefulWidget {
  final VideoStory story;

  const StoryInsightsSheet({
    Key? key,
    required this.story,
  }) : super(key: key);

  static Future<void> show(BuildContext context, {required VideoStory story}) {
    HapticFeedback.mediumImpact();
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StoryInsightsSheet(story: story),
    );
  }

  @override
  State<StoryInsightsSheet> createState() => _StoryInsightsSheetState();
}

class _StoryInsightsSheetState extends State<StoryInsightsSheet> {
  final _videoStoryService = VideoStoryService();
  StoryAnalytics? _analytics;
  List<Map<String, dynamic>> _viewers = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadAnalytics();
  }

  Future<void> _loadAnalytics() async {
    try {
      final analytics = await _videoStoryService.getStoryAnalytics(widget.story.id);
      final viewers = await _videoStoryService.getStoryViewers(widget.story.id);
      
      if (mounted) {
        setState(() {
          _analytics = analytics;
          _viewers = viewers;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final mediaQuery = MediaQuery.of(context);

    return Container(
      height: mediaQuery.size.height * 0.75,
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Drag handle
          Container(
            margin: const EdgeInsets.symmetric(vertical: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: cs.outlineVariant,
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: cs.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(Icons.analytics_outlined, color: cs.primary),
                ),
                const SizedBox(width: 12),
                Text(
                  'Story Insights',
                  style: textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: Icon(Icons.close_rounded, color: cs.onSurfaceVariant),
                ),
              ],
            ),
          ),

          const SizedBox(height: 8),

          // Content
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : SingleChildScrollView(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Stats grid
                        _buildStatsGrid(cs, textTheme),
                        
                        const SizedBox(height: 24),
                        
                        // Reactions breakdown
                        if (_analytics != null && _analytics!.reactionCounts.isNotEmpty)
                          _buildReactionsSection(cs, textTheme),
                        
                        const SizedBox(height: 24),
                        
                        // Viewers list
                        _buildViewersSection(cs, textTheme),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsGrid(ColorScheme cs, TextTheme textTheme) {
    return Row(
      children: [
        Expanded(
          child: _StatCard(
            icon: Icons.visibility_outlined,
            label: 'Views',
            value: '${widget.story.viewCount}',
            color: Colors.blue,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _StatCard(
            icon: Icons.people_outline_rounded,
            label: 'Unique',
            value: '${_analytics?.uniqueViews ?? 0}',
            color: Colors.purple,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _StatCard(
            icon: Icons.check_circle_outline_rounded,
            label: 'Completion',
            value: '${((_analytics?.completionRate ?? 0) * 100).toInt()}%',
            color: Colors.green,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _StatCard(
            icon: Icons.favorite_outline_rounded,
            label: 'Reactions',
            value: '${widget.story.reactionCount}',
            color: Colors.pink,
          ),
        ),
      ],
    );
  }

  Widget _buildReactionsSection(ColorScheme cs, TextTheme textTheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Reactions',
          style: textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _analytics!.reactionCounts.entries.map((entry) {
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: cs.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: cs.outline.withOpacity(0.2),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(entry.key, style: const TextStyle(fontSize: 20)),
                  const SizedBox(width: 8),
                  Text(
                    '${entry.value}',
                    style: textTheme.labelLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildViewersSection(ColorScheme cs, TextTheme textTheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              'Viewers',
              style: textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: cs.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '${_viewers.length}',
                style: textTheme.labelSmall?.copyWith(
                  color: cs.primary,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        
        if (_viewers.isEmpty)
          Center(
            child: Column(
              children: [
                Icon(
                  Icons.visibility_off_outlined,
                  size: 48,
                  color: cs.onSurfaceVariant.withOpacity(0.5),
                ),
                const SizedBox(height: 8),
                Text(
                  'No viewers yet',
                  style: textTheme.bodyMedium?.copyWith(
                    color: cs.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          )
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _viewers.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final viewer = _viewers[index];
              return _ViewerTile(
                name: viewer['name'] as String? ?? 'Unknown',
                avatar: viewer['avatar'] as String?,
                viewedAt: DateTime.parse(viewer['viewedAt'] as String),
                watchPercentage: (viewer['watchPercentage'] as num?)?.toDouble() ?? 0,
              );
            },
          ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withOpacity(0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: color.withOpacity(0.2),
        ),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: textTheme.labelSmall?.copyWith(
              color: cs.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

class _ViewerTile extends StatelessWidget {
  final String name;
  final String? avatar;
  final DateTime viewedAt;
  final double watchPercentage;

  const _ViewerTile({
    required this.name,
    this.avatar,
    required this.viewedAt,
    required this.watchPercentage,
  });

  String _getTimeAgo(DateTime dateTime) {
    final diff = DateTime.now().difference(dateTime);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withOpacity(0.3),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 20,
            backgroundColor: cs.primary.withOpacity(0.1),
            backgroundImage: avatar != null ? NetworkImage(avatar!) : null,
            child: avatar == null
                ? Text(
                    name.isNotEmpty ? name[0].toUpperCase() : '?',
                    style: TextStyle(
                      color: cs.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  )
                : null,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _getTimeAgo(viewedAt),
                  style: textTheme.labelSmall?.copyWith(
                    color: cs.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          // Watch progress indicator
          if (watchPercentage > 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: watchPercentage >= 0.9
                    ? Colors.green.withOpacity(0.1)
                    : cs.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    watchPercentage >= 0.9
                        ? Icons.check_circle_rounded
                        : Icons.play_circle_outline_rounded,
                    size: 14,
                    color: watchPercentage >= 0.9 ? Colors.green : cs.primary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${(watchPercentage * 100).toInt()}%',
                    style: textTheme.labelSmall?.copyWith(
                      color: watchPercentage >= 0.9 ? Colors.green : cs.primary,
                      fontWeight: FontWeight.bold,
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
