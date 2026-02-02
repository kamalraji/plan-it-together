import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:thittam1hub/models/match_insight.dart';

/// A beautiful glassmorphism card that shows WHY users matched
class MatchInsightsCard extends StatefulWidget {
  final MatchResult matchResult;
  final bool initiallyExpanded;
  final bool compact;
  final VoidCallback? onTap;

  const MatchInsightsCard({
    Key? key,
    required this.matchResult,
    this.initiallyExpanded = false,
    this.compact = false,
    this.onTap,
  }) : super(key: key);

  @override
  State<MatchInsightsCard> createState() => _MatchInsightsCardState();
}

class _MatchInsightsCardState extends State<MatchInsightsCard>
    with SingleTickerProviderStateMixin {
  late bool _isExpanded;
  late AnimationController _controller;
  late Animation<double> _expandAnimation;

  @override
  void initState() {
    super.initState();
    _isExpanded = widget.initiallyExpanded;
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _expandAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    );
    if (_isExpanded) _controller.value = 1.0;
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _toggleExpanded() {
    setState(() {
      _isExpanded = !_isExpanded;
      if (_isExpanded) {
        _controller.forward();
      } else {
        _controller.reverse();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final result = widget.matchResult;

    if (widget.compact) {
      return _buildCompactView(cs, textTheme, result);
    }

    return GestureDetector(
      onTap: widget.onTap ?? _toggleExpanded,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  (isDark ? Colors.white : Colors.black)
                      .withValues(alpha: 0.08),
                  (isDark ? Colors.white : Colors.black)
                      .withValues(alpha: 0.04),
                ],
              ),
              border: Border.all(
                color: result.summaryColor.withValues(alpha: 0.3),
                width: 1,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header with score and summary
                _buildHeader(cs, textTheme, result),

                // Expandable insights list
                SizeTransition(
                  sizeFactor: _expandAnimation,
                  child: Column(
                    children: [
                      Divider(color: cs.outlineVariant.withValues(alpha: 0.3)),
                      _buildInsightsList(cs, textTheme, result),
                      if (result.matchStory != null)
                        _buildMatchStory(cs, textTheme, result.matchStory!),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCompactView(
      ColorScheme cs, TextTheme textTheme, MatchResult result) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: result.summaryColor.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: result.summaryColor.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(result.summaryIcon, size: 16, color: result.summaryColor),
          const SizedBox(width: 6),
          Text(
            '${result.totalScore}%',
            style: TextStyle(
              color: result.summaryColor,
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
          const SizedBox(width: 4),
          Icon(
            Icons.keyboard_arrow_down,
            size: 16,
            color: result.summaryColor,
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(ColorScheme cs, TextTheme textTheme, MatchResult result) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Score circle
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      result.summaryColor,
                      result.summaryColor.withValues(alpha: 0.7),
                    ],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: result.summaryColor.withValues(alpha: 0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    '${result.totalScore}',
                    style: textTheme.titleMedium?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          result.summaryIcon,
                          size: 18,
                          color: result.summaryColor,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          '${result.strengthLabel} Match',
                          style: textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      result.summaryText,
                      style: textTheme.bodySmall?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              Icon(
                _isExpanded ? Icons.expand_less : Icons.expand_more,
                color: cs.onSurfaceVariant,
              ),
            ],
          ),
          const SizedBox(height: 8),
          // Category pills
          Wrap(
            spacing: 6,
            runSpacing: 4,
            children: result.insights.take(3).map((insight) {
              final meta = MatchInsight.categoryMeta[insight.category];
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: insight.color.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(meta?.icon ?? Icons.auto_awesome_rounded,
                        size: 12, color: insight.color),
                    const SizedBox(width: 4),
                    Text(
                      '+${insight.contribution}%',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: insight.color,
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildInsightsList(
      ColorScheme cs, TextTheme textTheme, MatchResult result) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
      child: Column(
        children: result.insights.asMap().entries.map((entry) {
          final index = entry.key;
          final insight = entry.value;
          return TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: 1),
            duration: Duration(milliseconds: 200 + (index * 100)),
            curve: Curves.easeOut,
            builder: (context, value, child) {
              return Opacity(
                opacity: value,
                child: Transform.translate(
                  offset: Offset(0, 10 * (1 - value)),
                  child: child,
                ),
              );
            },
            child: _buildInsightRow(cs, textTheme, insight),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildInsightRow(
      ColorScheme cs, TextTheme textTheme, MatchInsight insight) {
    final meta = MatchInsight.categoryMeta[insight.category];

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Icon with background
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: insight.color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(
              child: Icon(meta?.icon ?? Icons.auto_awesome_rounded,
                  size: 20, color: insight.color),
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
                      insight.title,
                      style: textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    if (insight.isComplementary) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.teal.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: const [
                            Icon(Icons.handshake_rounded,
                                size: 10, color: Colors.teal),
                            SizedBox(width: 3),
                            Text(
                              'Perfect Fit',
                              style: TextStyle(
                                  fontSize: 9, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  insight.description,
                  style: textTheme.bodySmall?.copyWith(
                    color: cs.onSurfaceVariant,
                  ),
                ),
                if (insight.items.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 4,
                    runSpacing: 4,
                    children: insight.items
                        .take(5)
                        .map((item) => Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: insight.color.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: insight.color.withValues(alpha: 0.2),
                                ),
                              ),
                              child: Text(
                                item,
                                style: TextStyle(
                                  fontSize: 11,
                                  color: insight.color,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ))
                        .toList(),
                  ),
                ],
              ],
            ),
          ),
          // Contribution bar
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '+${insight.contribution}%',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: insight.color,
                ),
              ),
              const SizedBox(height: 4),
              SizedBox(
                width: 50,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: insight.contribution / 100,
                    backgroundColor: insight.color.withValues(alpha: 0.1),
                    valueColor: AlwaysStoppedAnimation(insight.color),
                    minHeight: 4,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMatchStory(ColorScheme cs, TextTheme textTheme, String story) {
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 8, 12, 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cs.primaryContainer.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.primary.withValues(alpha: 0.2)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.lightbulb_outline_rounded, size: 20, color: cs.primary),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              story,
              style: textTheme.bodySmall?.copyWith(
                fontStyle: FontStyle.italic,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// A compact badge showing the primary match category
class MatchSummaryBadge extends StatelessWidget {
  final MatchResult matchResult;
  final bool showScore;

  const MatchSummaryBadge({
    Key? key,
    required this.matchResult,
    this.showScore = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final result = matchResult;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: result.summaryColor.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: result.summaryColor.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(result.summaryIcon, size: 14, color: result.summaryColor),
          const SizedBox(width: 4),
          if (showScore) ...[
            Text(
              '${result.totalScore}%',
              style: TextStyle(
                color: result.summaryColor,
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
            ),
            const SizedBox(width: 4),
          ],
          Text(
            result.summaryBadge,
            style: TextStyle(
              color: result.summaryColor,
              fontWeight: FontWeight.w500,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}
