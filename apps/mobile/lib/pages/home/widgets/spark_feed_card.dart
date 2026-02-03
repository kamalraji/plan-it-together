import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/supabase/spark_service.dart';
import 'package:thittam1hub/widgets/share/share_analytics_sheet.dart';
import 'package:thittam1hub/widgets/shimmer_loading.dart';
class SparkFeedCard extends StatefulWidget {
  final SparkPost post;
  final bool hasSparked;
  final VoidCallback onDoubleTap;
  final VoidCallback onSparkTap;
  final VoidCallback onCommentTap;
  final VoidCallback onShareTap;

  const SparkFeedCard({
    Key? key,
    required this.post,
    required this.hasSparked,
    required this.onDoubleTap,
    required this.onSparkTap,
    required this.onCommentTap,
    required this.onShareTap,
  }) : super(key: key);

  @override
  State<SparkFeedCard> createState() => _SparkFeedCardState();
}

class _SparkFeedCardState extends State<SparkFeedCard> with TickerProviderStateMixin {
  bool _showSparkAnimation = false;
  late AnimationController _sparkAnimationController;
  late Animation<double> _sparkScaleAnimation;
  late AnimationController _tapScaleController;
  late Animation<double> _tapScaleAnimation;

  @override
  void initState() {
    super.initState();
    _sparkAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _sparkScaleAnimation = Tween<double>(begin: 0.0, end: 1.5).animate(
      CurvedAnimation(parent: _sparkAnimationController, curve: Curves.elasticOut),
    );
    
    _tapScaleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
    );
    _tapScaleAnimation = Tween<double>(begin: 1.0, end: 0.97).animate(
      CurvedAnimation(parent: _tapScaleController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _sparkAnimationController.dispose();
    _tapScaleController.dispose();
    super.dispose();
  }

  void _handleDoubleTap() {
    if (!widget.hasSparked) {
      HapticFeedback.mediumImpact();
      setState(() => _showSparkAnimation = true);
      _sparkAnimationController.forward().then((_) {
        Future.delayed(const Duration(milliseconds: 400), () {
          if (mounted) {
            setState(() => _showSparkAnimation = false);
            _sparkAnimationController.reset();
          }
        });
      });
      widget.onDoubleTap();
    }
  }

  String _formatTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final diff = now.difference(dateTime);

    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    if (diff.inDays < 7) return '${diff.inDays}d';
    return '${dateTime.day}/${dateTime.month}';
  }

  Color _getTypeColor(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    switch (widget.post.type) {
      case SparkPostType.IDEA:
        return Colors.amber;
      case SparkPostType.SEEKING:
        return Colors.blue;
      case SparkPostType.OFFERING:
        return Colors.green;
      case SparkPostType.QUESTION:
        return Colors.purple;
      case SparkPostType.ANNOUNCEMENT:
        return cs.primary;
    }
  }

  IconData _getTypeIcon() {
    switch (widget.post.type) {
      case SparkPostType.IDEA:
        return Icons.lightbulb_outline_rounded;
      case SparkPostType.SEEKING:
        return Icons.search_rounded;
      case SparkPostType.OFFERING:
        return Icons.card_giftcard_rounded;
      case SparkPostType.QUESTION:
        return Icons.help_outline_rounded;
      case SparkPostType.ANNOUNCEMENT:
        return Icons.campaign_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final typeColor = _getTypeColor(context);
    
    return GestureDetector(
      onDoubleTap: _handleDoubleTap,
      onTapDown: (_) => _tapScaleController.forward(),
      onTapUp: (_) => _tapScaleController.reverse(),
      onTapCancel: () => _tapScaleController.reverse(),
      child: AnimatedBuilder(
        animation: _tapScaleAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _tapScaleAnimation.value,
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                // Glassmorphism for dark mode with refined contrast
                color: isDark 
                    ? cs.surfaceContainerHigh.withValues(alpha: 0.65)
                    : cs.surfaceContainerLowest,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark 
                      ? Colors.white.withValues(alpha: 0.06)
                      : cs.outline.withValues(alpha: 0.08),
                ),
                boxShadow: isDark 
                    ? [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.35),
                          blurRadius: 20,
                          offset: const Offset(0, 6),
                        ),
                        BoxShadow(
                          color: cs.primary.withValues(alpha: 0.04),
                          blurRadius: 30,
                          spreadRadius: -8,
                        ),
                      ]
                    : [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.03),
                          blurRadius: 12,
                          offset: const Offset(0, 2),
                        ),
                      ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: BackdropFilter(
                  filter: isDark 
                      ? ImageFilter.blur(sigmaX: 16, sigmaY: 16)
                      : ImageFilter.blur(sigmaX: 0, sigmaY: 0),
                  child: Stack(
                    children: [
                      // Subtle gradient overlay for dark mode depth
                      if (isDark)
                        Positioned.fill(
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [
                                  Colors.white.withValues(alpha: 0.03),
                                  Colors.transparent,
                                  cs.primary.withValues(alpha: 0.02),
                                ],
                              ),
                            ),
                          ),
                        ),
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Author row
                            Row(
                              children: [
                                // Avatar with online indicator - Compact
                                Stack(
                                  children: [
                                    Container(
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        border: Border.all(
                                          color: isDark 
                                              ? cs.primary.withValues(alpha: 0.3)
                                              : cs.primary.withValues(alpha: 0.2),
                                          width: 1.5,
                                        ),
                                      ),
                                      child: CircleAvatar(
                                        radius: 18,
                                        backgroundColor: isDark 
                                            ? cs.surfaceContainerHighest.withValues(alpha: 0.8)
                                            : cs.surfaceContainerHighest,
                                        backgroundImage: widget.post.authorAvatar != null
                                            ? NetworkImage(widget.post.authorAvatar!)
                                            : null,
                                        child: widget.post.authorAvatar == null
                                            ? Text(
                                                widget.post.authorName.isNotEmpty
                                                    ? widget.post.authorName[0].toUpperCase()
                                                    : '?',
                                                style: textTheme.labelLarge?.copyWith(
                                                  fontWeight: FontWeight.bold,
                                                  color: cs.primary,
                                                ),
                                              )
                                            : null,
                                      ),
                                    ),
                                    // Online indicator - Compact
                                    Positioned(
                                      bottom: 0,
                                      right: 0,
                                      child: Container(
                                        width: 10,
                                        height: 10,
                                        decoration: BoxDecoration(
                                          color: Colors.green,
                                          shape: BoxShape.circle,
                                          border: Border.all(
                                            color: isDark 
                                                ? cs.surfaceContainerHigh
                                                : cs.surfaceContainerLowest,
                                            width: 1.5,
                                          ),
                                          boxShadow: isDark ? [
                                            BoxShadow(
                                              color: Colors.green.withValues(alpha: 0.4),
                                              blurRadius: 4,
                                            ),
                                          ] : null,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Text(
                                            widget.post.authorName,
                                            style: textTheme.titleSmall?.copyWith(
                                              fontWeight: FontWeight.bold,
                                              color: isDark ? Colors.white : null,
                                            ),
                                          ),
                                          const SizedBox(width: 6),
                                          Text(
                                            '· ${_formatTimeAgo(widget.post.createdAt)}',
                                            style: textTheme.bodySmall?.copyWith(
                                              color: isDark 
                                                  ? cs.onSurfaceVariant.withValues(alpha: 0.8)
                                                  : cs.onSurfaceVariant,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      // Post type badge - Compact with glow in dark mode
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: isDark 
                                              ? typeColor.withValues(alpha: 0.18)
                                              : typeColor.withValues(alpha: 0.12),
                                          borderRadius: BorderRadius.circular(8),
                                          boxShadow: isDark ? [
                                            BoxShadow(
                                              color: typeColor.withValues(alpha: 0.15),
                                              blurRadius: 6,
                                              spreadRadius: -2,
                                            ),
                                          ] : null,
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(
                                              _getTypeIcon(),
                                              size: 10,
                                              color: typeColor,
                                            ),
                                            const SizedBox(width: 3),
                                            Text(
                                              widget.post.type.name,
                                              style: textTheme.labelSmall?.copyWith(
                                                color: typeColor,
                                                fontWeight: FontWeight.w600,
                                                fontSize: 10,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                IconButton(
                                  icon: Icon(
                                    Icons.more_horiz, 
                                    color: isDark 
                                        ? cs.onSurfaceVariant.withValues(alpha: 0.7)
                                        : cs.onSurfaceVariant,
                                  ),
                                  onPressed: () {},
                                  visualDensity: VisualDensity.compact,
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            
                            // Title - Enhanced contrast for dark mode
                            Text(
                              widget.post.title,
                              style: textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.bold,
                                height: 1.25,
                                color: isDark ? Colors.white : null,
                              ),
                            ),
                            const SizedBox(height: 6),
                            
                            // Content - Refined opacity for dark mode
                            Text(
                              widget.post.content,
                              style: textTheme.bodySmall?.copyWith(
                                color: isDark 
                                    ? cs.onSurface.withValues(alpha: 0.75)
                                    : cs.onSurfaceVariant,
                                height: 1.4,
                              ),
                              maxLines: 3,
                              overflow: TextOverflow.ellipsis,
                            ),
                            
                            // Tags with compact pills - Glassmorphic in dark mode
                            if (widget.post.tags.isNotEmpty) ...[
                              const SizedBox(height: 10),
                              Wrap(
                                spacing: 6,
                                runSpacing: 4,
                                children: widget.post.tags.take(4).map((tag) {
                                  return Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      gradient: LinearGradient(
                                        colors: isDark 
                                            ? [
                                                cs.primary.withValues(alpha: 0.12),
                                                cs.tertiary.withValues(alpha: 0.12),
                                              ]
                                            : [
                                                cs.primary.withValues(alpha: 0.08),
                                                cs.tertiary.withValues(alpha: 0.08),
                                              ],
                                      ),
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(
                                        color: isDark 
                                            ? cs.primary.withValues(alpha: 0.25)
                                            : cs.primary.withValues(alpha: 0.15),
                                      ),
                                    ),
                                    child: Text(
                                      '#$tag',
                                      style: textTheme.labelSmall?.copyWith(
                                        color: isDark 
                                            ? cs.primary.withValues(alpha: 0.9)
                                            : cs.primary,
                                        fontWeight: FontWeight.w500,
                                        fontSize: 10,
                                      ),
                                    ),
                                  );
                                }).toList(),
                              ),
                            ],
                            const SizedBox(height: 8),
                            
                            // Divider - Subtle in dark mode
                            Divider(
                              color: isDark 
                                  ? Colors.white.withValues(alpha: 0.06)
                                  : cs.outline.withValues(alpha: 0.08),
                              height: 1,
                            ),
                            const SizedBox(height: 8),
                            
                            // Actions row
                            Row(
                              children: [
                                // Spark button - Compact
                                _ActionButton(
                                  icon: Icons.bolt_rounded,
                                  count: widget.post.sparkCount,
                                  isActive: widget.hasSparked,
                                  activeColor: Colors.amber.shade600,
                                  onTap: widget.onSparkTap,
                                  isDark: isDark,
                                ),
                                const SizedBox(width: 12),
                                
                                // Comment button
                                _ActionButton(
                                  icon: Icons.chat_bubble_outline_rounded,
                                  count: widget.post.commentCount,
                                  onTap: widget.onCommentTap,
                                  isDark: isDark,
                                ),
                                
                                const Spacer(),
                                
                                // Share button with count (long-press for analytics)
                                _ActionButton(
                                  icon: Icons.share_outlined,
                                  count: widget.post.shareCount,
                                  onTap: widget.onShareTap,
                                  onLongPress: widget.post.shareCount > 0
                                      ? () => ShareAnalyticsSheet.show(
                                            context,
                                            postId: widget.post.id,
                                            postTitle: widget.post.title,
                                          )
                                      : null,
                                  isDark: isDark,
                                  showZero: false,
                                ),
                                const SizedBox(width: 4),
                                
                                // Bookmark button - Compact
                                IconButton(
                                  icon: Icon(
                                    Icons.bookmark_border_rounded,
                                    size: 18,
                                    color: isDark 
                                        ? cs.onSurfaceVariant.withValues(alpha: 0.7)
                                        : cs.onSurfaceVariant,
                                  ),
                                  onPressed: () {},
                                  visualDensity: VisualDensity.compact,
                                  padding: EdgeInsets.zero,
                                  constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      
                      // Double-tap spark animation overlay
                      if (_showSparkAnimation)
                        Positioned.fill(
                          child: Center(
                            child: AnimatedBuilder(
                              animation: _sparkScaleAnimation,
                              builder: (context, child) {
                                return Transform.scale(
                                  scale: _sparkScaleAnimation.value,
                                  child: Opacity(
                                    opacity: (1.5 - _sparkScaleAnimation.value).clamp(0.0, 1.0),
                                    child: Container(
                                      padding: const EdgeInsets.all(20),
                                      decoration: BoxDecoration(
                                        color: Colors.amber.withValues(alpha: 0.2),
                                        shape: BoxShape.circle,
                                      ),
                                      child: Icon(
                                        Icons.bolt_rounded,
                                        size: 64,
                                        color: Colors.amber.shade600,
                                      ),
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

/// Reusable action button with animated counter
class _ActionButton extends StatelessWidget {
  final IconData icon;
  final int count;
  final bool isActive;
  final Color? activeColor;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;
  final bool isDark;
  final bool showZero;

  const _ActionButton({
    required this.icon,
    required this.count,
    this.isActive = false,
    this.activeColor,
    required this.onTap,
    this.onLongPress,
    this.isDark = false,
    this.showZero = true,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final color = isActive 
        ? (activeColor ?? cs.primary) 
        : (isDark 
            ? cs.onSurfaceVariant.withValues(alpha: 0.7)
            : cs.onSurfaceVariant);
    
    final shouldShowCount = count > 0 || showZero;
    
    return InkWell(
      onTap: onTap,
      onLongPress: onLongPress != null
          ? () {
              HapticFeedback.mediumImpact();
              onLongPress!();
            }
          : null,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isActive 
              ? (isDark 
                  ? color.withValues(alpha: 0.15)
                  : color.withValues(alpha: 0.1))
              : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          boxShadow: isActive && isDark ? [
            BoxShadow(
              color: color.withValues(alpha: 0.2),
              blurRadius: 8,
              spreadRadius: -2,
            ),
          ] : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 18, color: color),
            if (shouldShowCount && count > 0) ...[
              const SizedBox(width: 4),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                transitionBuilder: (child, animation) {
                  return SlideTransition(
                    position: Tween<Offset>(
                      begin: const Offset(0, 0.5),
                      end: Offset.zero,
                    ).animate(animation),
                    child: FadeTransition(opacity: animation, child: child),
                  );
                },
                child: Text(
                  '$count',
                  key: ValueKey(count),
                  style: textTheme.labelSmall?.copyWith(
                    color: color,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class SparkFeedCardSkeleton extends StatelessWidget {
  const SparkFeedCardSkeleton({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: isDark 
            ? cs.surfaceContainerHigh.withValues(alpha: 0.65)
            : cs.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark 
              ? Colors.white.withValues(alpha: 0.06)
              : cs.outline.withValues(alpha: 0.08),
        ),
        boxShadow: isDark 
            ? [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.35),
                  blurRadius: 20,
                  offset: const Offset(0, 6),
                ),
              ]
            : null,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: BackdropFilter(
          filter: isDark 
              ? ImageFilter.blur(sigmaX: 16, sigmaY: 16)
              : ImageFilter.blur(sigmaX: 0, sigmaY: 0),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    ShimmerPlaceholder(
                      width: 36,
                      height: 36,
                      isCircle: true,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ShimmerPlaceholder(
                            width: 100,
                            height: 12,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          const SizedBox(height: 5),
                          ShimmerPlaceholder(
                            width: 60,
                            height: 8,
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                ShimmerPlaceholder(
                  width: double.infinity,
                  height: 14,
                  borderRadius: BorderRadius.circular(6),
                ),
                const SizedBox(height: 8),
                ShimmerPlaceholder(
                  width: double.infinity,
                  height: 44,
                  borderRadius: BorderRadius.circular(8),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    ShimmerPlaceholder(
                      width: 56,
                      height: 24,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    const SizedBox(width: 8),
                    ShimmerPlaceholder(
                      width: 56,
                      height: 24,
                      borderRadius: BorderRadius.circular(12),
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
