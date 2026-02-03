import 'package:flutter/material.dart';
import 'package:thittam1hub/services/share_analytics_service.dart';

/// Comprehensive share analytics bottom sheet
class ShareAnalyticsSheet extends StatefulWidget {
  final String postId;
  final String postTitle;

  const ShareAnalyticsSheet({
    Key? key,
    required this.postId,
    required this.postTitle,
  }) : super(key: key);

  static Future<void> show(BuildContext context, {
    required String postId,
    required String postTitle,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ShareAnalyticsSheet(postId: postId, postTitle: postTitle),
    );
  }

  @override
  State<ShareAnalyticsSheet> createState() => _ShareAnalyticsSheetState();
}

class _ShareAnalyticsSheetState extends State<ShareAnalyticsSheet> {
  bool _loading = true;
  ShareAnalytics? _analytics;
  ViralityMetrics? _virality;
  ShareReachMetrics? _reach;
  List<TopSharer>? _topSharers;

  @override
  void initState() {
    super.initState();
    _loadAnalytics();
  }

  Future<void> _loadAnalytics() async {
    final results = await Future.wait([
      ShareAnalyticsService.getShareAnalytics(widget.postId),
      ShareAnalyticsService.getViralityMetrics(widget.postId),
      ShareAnalyticsService.getShareReach(widget.postId),
      ShareAnalyticsService.getTopSharers(widget.postId, limit: 5),
    ]);

    if (mounted) {
      setState(() {
        _analytics = results[0] as ShareAnalytics;
        _virality = results[1] as ViralityMetrics;
        _reach = results[2] as ShareReachMetrics;
        _topSharers = results[3] as List<TopSharer>;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: cs.outline.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: cs.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(Icons.analytics_rounded, color: cs.primary),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Share Analytics',
                        style: textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        widget.postTitle,
                        style: textTheme.bodySmall?.copyWith(
                          color: cs.onSurfaceVariant,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),

          const Divider(height: 1),

          // Content
          Flexible(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _analytics == null || _analytics!.totalShares == 0
                    ? _buildEmptyState(cs, textTheme)
                    : _buildAnalyticsContent(cs, textTheme, isDark),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(ColorScheme cs, TextTheme textTheme) {
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.share_outlined,
            size: 64,
            color: cs.outline.withValues(alpha: 0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'No shares yet',
            style: textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'When people share this post, you\'ll see detailed analytics here.',
            style: textTheme.bodyMedium?.copyWith(
              color: cs.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildAnalyticsContent(ColorScheme cs, TextTheme textTheme, bool isDark) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Virality Score Card
          if (_virality != null) _buildViralityCard(cs, textTheme, isDark),
          const SizedBox(height: 16),

          // Key Metrics Row
          _buildKeyMetricsRow(cs, textTheme),
          const SizedBox(height: 24),

          // Platform Breakdown
          _buildSectionHeader('Share Distribution', cs, textTheme),
          const SizedBox(height: 12),
          _buildPlatformBreakdown(cs, textTheme),
          const SizedBox(height: 24),

          // Reach Metrics
          if (_reach != null) ...[
            _buildSectionHeader('Estimated Reach', cs, textTheme),
            const SizedBox(height: 12),
            _buildReachCard(cs, textTheme, isDark),
            const SizedBox(height: 24),
          ],

          // Top Sharers
          if (_topSharers != null && _topSharers!.isNotEmpty) ...[
            _buildSectionHeader('Top Sharers', cs, textTheme),
            const SizedBox(height: 12),
            _buildTopSharers(cs, textTheme),
            const SizedBox(height: 24),
          ],

          // Time Insights
          _buildSectionHeader('Timing Insights', cs, textTheme),
          const SizedBox(height: 12),
          _buildTimingInsights(cs, textTheme),

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildViralityCard(ColorScheme cs, TextTheme textTheme, bool isDark) {
    final virality = _virality!;
    final tierColors = {
      'viral': Colors.orange,
      'high': Colors.green,
      'moderate': Colors.blue,
      'low': cs.outline,
      'none': cs.outline,
    };
    final tierColor = tierColors[virality.viralityTier] ?? cs.outline;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            tierColor.withValues(alpha: 0.15),
            tierColor.withValues(alpha: 0.05),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: tierColor.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          // Score Circle
          SizedBox(
            width: 80,
            height: 80,
            child: Stack(
              alignment: Alignment.center,
              children: [
                CircularProgressIndicator(
                  value: virality.viralityScore / 100,
                  strokeWidth: 8,
                  backgroundColor: cs.outline.withValues(alpha: 0.2),
                  valueColor: AlwaysStoppedAnimation(tierColor),
                ),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      virality.viralityScore.toInt().toString(),
                      style: textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: tierColor,
                      ),
                    ),
                    Text(
                      'score',
                      style: textTheme.labelSmall?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: tierColor.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        virality.viralityTier.toUpperCase(),
                        style: textTheme.labelSmall?.copyWith(
                          color: tierColor,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    if (virality.isTrending) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.orange.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.trending_up, size: 12, color: Colors.orange),
                            const SizedBox(width: 2),
                            Text(
                              'TRENDING',
                              style: textTheme.labelSmall?.copyWith(
                                color: Colors.orange,
                                fontWeight: FontWeight.bold,
                                fontSize: 9,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  '${virality.shareVelocity.toStringAsFixed(1)} shares/hr',
                  style: textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  'Amplification: ${virality.amplificationFactor.toStringAsFixed(1)}x',
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

  Widget _buildKeyMetricsRow(ColorScheme cs, TextTheme textTheme) {
    return Row(
      children: [
        Expanded(
          child: _buildMetricCard(
            icon: Icons.share,
            label: 'Total Shares',
            value: _analytics!.totalShares.toString(),
            cs: cs,
            textTheme: textTheme,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildMetricCard(
            icon: Icons.people,
            label: 'Est. Reach',
            value: _reach?.formattedReach ?? '0',
            cs: cs,
            textTheme: textTheme,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildMetricCard(
            icon: Icons.calendar_today,
            label: 'Daily Avg',
            value: _analytics!.avgSharesPerDay.toStringAsFixed(1),
            cs: cs,
            textTheme: textTheme,
          ),
        ),
      ],
    );
  }

  Widget _buildMetricCard({
    required IconData icon,
    required String label,
    required String value,
    required ColorScheme cs,
    required TextTheme textTheme,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(icon, size: 20, color: cs.primary),
          const SizedBox(height: 8),
          Text(
            value,
            style: textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
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

  Widget _buildSectionHeader(String title, ColorScheme cs, TextTheme textTheme) {
    return Text(
      title,
      style: textTheme.titleSmall?.copyWith(
        fontWeight: FontWeight.bold,
        color: cs.onSurface,
      ),
    );
  }

  Widget _buildPlatformBreakdown(ColorScheme cs, TextTheme textTheme) {
    final platforms = _analytics!.byPlatform;
    final destinations = _analytics!.byDestinationType;
    
    final allItems = <MapEntry<String, int>>[
      ...destinations.entries,
      ...platforms.entries.where((e) => !destinations.containsKey(e.key)),
    ];

    if (allItems.isEmpty) {
      return Text(
        'No platform data available',
        style: textTheme.bodyMedium?.copyWith(color: cs.onSurfaceVariant),
      );
    }

    return Column(
      children: allItems.map((entry) {
        final percentage = (entry.value / _analytics!.totalShares) * 100;
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: _buildProgressBar(
            label: _formatPlatformLabel(entry.key),
            value: entry.value,
            percentage: percentage,
            cs: cs,
            textTheme: textTheme,
          ),
        );
      }).toList(),
    );
  }

  String _formatPlatformLabel(String key) {
    final labels = {
      'dm': 'Direct Messages',
      'group': 'Group Chats',
      'channel': 'Channels',
      'external': 'External',
      'twitter': 'X (Twitter)',
      'linkedin': 'LinkedIn',
      'whatsapp': 'WhatsApp',
      'telegram': 'Telegram',
      'copy_link': 'Link Copied',
      'native_share': 'Share Menu',
    };
    return labels[key] ?? key;
  }

  Widget _buildProgressBar({
    required String label,
    required int value,
    required double percentage,
    required ColorScheme cs,
    required TextTheme textTheme,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: textTheme.bodyMedium),
            Text(
              '$value (${percentage.toStringAsFixed(1)}%)',
              style: textTheme.bodySmall?.copyWith(
                color: cs.onSurfaceVariant,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: percentage / 100,
            minHeight: 8,
            backgroundColor: cs.surfaceContainerHighest,
            valueColor: AlwaysStoppedAnimation(cs.primary),
          ),
        ),
      ],
    );
  }

  Widget _buildReachCard(ColorScheme cs, TextTheme textTheme, bool isDark) {
    final reach = _reach!;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.group, color: cs.primary, size: 28),
              const SizedBox(width: 8),
              Text(
                reach.formattedReach,
                style: textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: cs.primary,
                ),
              ),
            ],
          ),
          Text(
            'estimated people reached',
            style: textTheme.bodySmall?.copyWith(
              color: cs.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _buildReachItem('Direct', reach.directReach, cs, textTheme)),
              Expanded(child: _buildReachItem('Groups', reach.groupReach, cs, textTheme)),
              Expanded(child: _buildReachItem('Channels', reach.channelReach, cs, textTheme)),
              Expanded(child: _buildReachItem('External', reach.externalReach, cs, textTheme)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildReachItem(String label, int value, ColorScheme cs, TextTheme textTheme) {
    return Column(
      children: [
        Text(
          value.toString(),
          style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
        ),
        Text(
          label,
          style: textTheme.labelSmall?.copyWith(color: cs.onSurfaceVariant),
        ),
      ],
    );
  }

  Widget _buildTopSharers(ColorScheme cs, TextTheme textTheme) {
    return Column(
      children: _topSharers!.map((sharer) {
        return ListTile(
          contentPadding: EdgeInsets.zero,
          leading: CircleAvatar(
            backgroundImage: sharer.avatarUrl != null 
                ? NetworkImage(sharer.avatarUrl!) 
                : null,
            child: sharer.avatarUrl == null 
                ? Text(sharer.userName[0].toUpperCase())
                : null,
          ),
          title: Text(sharer.userName),
          trailing: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: cs.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              '${sharer.shareCount} shares',
              style: textTheme.labelSmall?.copyWith(
                color: cs.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildTimingInsights(ColorScheme cs, TextTheme textTheme) {
    final peakHour = _analytics?.peakHour;
    final peakDay = _analytics?.peakDay;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              children: [
                Icon(Icons.access_time, color: cs.primary),
                const SizedBox(height: 8),
                Text(
                  peakHour != null ? '${peakHour.toString().padLeft(2, '0')}:00' : '-',
                  style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                Text(
                  'Peak Hour',
                  style: textTheme.labelSmall?.copyWith(color: cs.onSurfaceVariant),
                ),
              ],
            ),
          ),
          Container(
            width: 1,
            height: 50,
            color: cs.outline.withValues(alpha: 0.2),
          ),
          Expanded(
            child: Column(
              children: [
                Icon(Icons.calendar_month, color: cs.primary),
                const SizedBox(height: 8),
                Text(
                  peakDay ?? '-',
                  style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                Text(
                  'Peak Day',
                  style: textTheme.labelSmall?.copyWith(color: cs.onSurfaceVariant),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
