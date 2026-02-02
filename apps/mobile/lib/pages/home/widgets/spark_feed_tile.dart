import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:thittam1hub/supabase/spark_service.dart';
import 'package:thittam1hub/widgets/link_preview_card.dart';
import 'package:thittam1hub/widgets/shimmer_loading.dart';

/// Constants for SparkFeedTile styling - centralized for maintainability
class _SparkFeedTileConstants {
  static const double avatarRadius = 16.0;
  static const double horizontalPadding = 16.0;
  static const double verticalPadding = 12.0;
  static const double contentSpacing = 10.0;
  static const double mediaSpacing = 12.0;
  static const double mediaBorderRadius = 12.0;
  static const double mediaMaxHeight = 400.0;
  static const double mediaMinHeight = 150.0;
  static const double pillBorderRadius = 20.0;
  static const double pillHorizontalPadding = 12.0;
  static const double pillVerticalPadding = 8.0;
  
  // Colors
  static const Color sparkActiveColor = Color(0xFFFFB300);
  static const Color pillBackgroundDark = Color(0xFF2A2A2A);
  static const Color pillBackgroundLight = Color(0xFFF0F0F0);
  static const Color dividerDark = Color(0xFF343434);
  
  // Animation durations
  static const Duration sparkAnimationDuration = Duration(milliseconds: 600);
  static const Duration sparkResetDelay = Duration(milliseconds: 400);
  static const Duration imageFadeDuration = Duration(milliseconds: 200);
  
  // Type colors mapping
  static Color getTypeColor(SparkPostType type, ColorScheme cs) {
    switch (type) {
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
  
  static String getTypeLabel(SparkPostType type) {
    return type.name.toUpperCase();
  }
  
  _SparkFeedTileConstants._();
}

/// Main feed tile widget for displaying spark posts
/// 
/// Implements industrial best practices:
/// - Accessibility via Semantics widgets
/// - RepaintBoundary for render performance
/// - Proper memory management with animation controllers
/// - Clean separation of concerns with sub-widgets
class SparkFeedTile extends StatefulWidget {
  final SparkPost post;
  final bool hasSparked;
  final VoidCallback onDoubleTap;
  final VoidCallback onSparkTap;
  final VoidCallback onCommentTap;
  final VoidCallback onShareTap;
  final VoidCallback? onMoreTap;
  final VoidCallback? onAuthorTap;

  const SparkFeedTile({
    super.key,
    required this.post,
    required this.hasSparked,
    required this.onDoubleTap,
    required this.onSparkTap,
    required this.onCommentTap,
    required this.onShareTap,
    this.onMoreTap,
    this.onAuthorTap,
  });

  @override
  State<SparkFeedTile> createState() => _SparkFeedTileState();
}

class _SparkFeedTileState extends State<SparkFeedTile> 
    with SingleTickerProviderStateMixin {
  bool _showSparkAnimation = false;
  late final AnimationController _sparkAnimationController;
  late final Animation<double> _sparkScaleAnimation;

  @override
  void initState() {
    super.initState();
    _sparkAnimationController = AnimationController(
      vsync: this,
      duration: _SparkFeedTileConstants.sparkAnimationDuration,
    );
    _sparkScaleAnimation = Tween<double>(begin: 0.0, end: 1.5).animate(
      CurvedAnimation(
        parent: _sparkAnimationController, 
        curve: Curves.elasticOut,
      ),
    );
  }

  @override
  void dispose() {
    _sparkAnimationController.dispose();
    super.dispose();
  }

  void _handleDoubleTap() {
    if (widget.hasSparked) return;
    
    HapticFeedback.mediumImpact();
    setState(() => _showSparkAnimation = true);
    
    _sparkAnimationController.forward().then((_) {
      Future.delayed(_SparkFeedTileConstants.sparkResetDelay, () {
        if (mounted) {
          setState(() => _showSparkAnimation = false);
          _sparkAnimationController.reset();
        }
      });
    });
    
    widget.onDoubleTap();
  }

  bool get _hasMedia => 
      widget.post.imageUrl != null || widget.post.gifUrl != null;
  
  bool get _hasLinkPreview => 
      widget.post.linkUrl != null && !_hasMedia;

  bool get _hasDistinctContent =>
      widget.post.content.isNotEmpty && 
      widget.post.content != widget.post.title;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final typeColor = _SparkFeedTileConstants.getTypeColor(widget.post.type, cs);

    return RepaintBoundary(
      child: Semantics(
        label: 'Post by ${widget.post.authorName}: ${widget.post.title}',
        button: false,
        child: GestureDetector(
          onDoubleTap: _handleDoubleTap,
          behavior: HitTestBehavior.opaque,
          child: ColoredBox(
            color: cs.surface,
            child: Stack(
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: _SparkFeedTileConstants.horizontalPadding,
                    vertical: _SparkFeedTileConstants.verticalPadding,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Header
                      _SparkFeedTileHeader(
                        post: widget.post,
                        typeColor: typeColor,
                        isDark: isDark,
                        onMoreTap: widget.onMoreTap,
                        onAuthorTap: widget.onAuthorTap,
                      ),
                      const SizedBox(height: _SparkFeedTileConstants.contentSpacing),

                      // Title
                      Text(
                        widget.post.title,
                        style: textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          height: 1.3,
                          color: isDark ? Colors.white : cs.onSurface,
                        ),
                      ),

                      // Content
                      if (_hasDistinctContent) ...[
                        const SizedBox(height: 6),
                        Text(
                          widget.post.content,
                          style: textTheme.bodyMedium?.copyWith(
                            color: cs.onSurfaceVariant,
                            height: 1.4,
                          ),
                          maxLines: 4,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],

                      // Media
                      if (_hasMedia) ...[
                        const SizedBox(height: _SparkFeedTileConstants.mediaSpacing),
                        _SparkFeedTileMedia(
                          imageUrl: widget.post.imageUrl,
                          gifUrl: widget.post.gifUrl,
                        ),
                      ],

                      // Link preview
                      if (_hasLinkPreview) ...[
                        const SizedBox(height: _SparkFeedTileConstants.mediaSpacing),
                        LinkPreviewCard(
                          url: widget.post.linkUrl,
                          compact: false,
                        ),
                      ],

                      const SizedBox(height: _SparkFeedTileConstants.mediaSpacing),

                      // Actions
                      _SparkFeedTileActions(
                        sparkCount: widget.post.sparkCount,
                        commentCount: widget.post.commentCount,
                        hasSparked: widget.hasSparked,
                        isDark: isDark,
                        onSparkTap: widget.onSparkTap,
                        onCommentTap: widget.onCommentTap,
                        onShareTap: widget.onShareTap,
                      ),
                    ],
                  ),
                ),

                // Spark animation overlay
                if (_showSparkAnimation)
                  _SparkAnimationOverlay(animation: _sparkScaleAnimation),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Header component with author info and type badge
class _SparkFeedTileHeader extends StatelessWidget {
  final SparkPost post;
  final Color typeColor;
  final bool isDark;
  final VoidCallback? onMoreTap;
  final VoidCallback? onAuthorTap;

  const _SparkFeedTileHeader({
    required this.post,
    required this.typeColor,
    required this.isDark,
    this.onMoreTap,
    this.onAuthorTap,
  });

  String _formatTimeAgo(DateTime dateTime) {
    final diff = DateTime.now().difference(dateTime);
    if (diff.inMinutes < 1) return 'now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    if (diff.inDays < 7) return '${diff.inDays}d';
    if (diff.inDays < 30) return '${(diff.inDays / 7).floor()}w';
    return '${(diff.inDays / 30).floor()}mo';
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Avatar with tap handler
        Semantics(
          label: 'View ${post.authorName} profile',
          button: true,
          child: GestureDetector(
            onTap: onAuthorTap,
            child: CircleAvatar(
              radius: _SparkFeedTileConstants.avatarRadius,
              backgroundColor: cs.surfaceContainerHighest,
              backgroundImage: post.authorAvatar != null
                  ? CachedNetworkImageProvider(
                      post.authorAvatar!,
                      errorListener: (_) {},
                    )
                  : null,
              child: post.authorAvatar == null
                  ? Text(
                      post.authorName.isNotEmpty
                          ? post.authorName[0].toUpperCase()
                          : '?',
                      style: textTheme.labelMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: cs.primary,
                      ),
                    )
                  : null,
            ),
          ),
        ),
        const SizedBox(width: 10),
        
        // Meta info in an Expanded row to properly handle overflow
        Expanded(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Type badge
              Text(
                _SparkFeedTileConstants.getTypeLabel(post.type),
                style: textTheme.labelSmall?.copyWith(
                  color: typeColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 11,
                  height: 1.0,
                ),
              ),
              Text(
                ' · ',
                style: textTheme.bodySmall?.copyWith(
                  color: cs.onSurfaceVariant.withValues(alpha: 0.5),
                  height: 1.0,
                ),
              ),
              
              // Author name - flexible to handle long names
              Flexible(
                child: GestureDetector(
                  onTap: onAuthorTap,
                  child: Text(
                    post.authorName,
                    style: textTheme.bodySmall?.copyWith(
                      color: cs.onSurfaceVariant,
                      height: 1.0,
                    ),
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                  ),
                ),
              ),
              
              // Timestamp
              Text(
                ' · ${_formatTimeAgo(post.createdAt)}',
                style: textTheme.bodySmall?.copyWith(
                  color: cs.onSurfaceVariant.withValues(alpha: 0.7),
                  height: 1.0,
                ),
              ),
            ],
          ),
        ),
        
        const SizedBox(width: 4),
        
        // More menu with fixed constraints
        Semantics(
          label: 'More options',
          button: true,
          child: SizedBox(
            width: 32,
            height: 32,
            child: IconButton(
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
              icon: Icon(
                Icons.more_vert,
                size: 20,
                color: cs.onSurfaceVariant.withValues(alpha: 0.6),
              ),
              onPressed: onMoreTap ?? () {},
            ),
          ),
        ),
      ],
    );
  }
}

/// Media display component with proper caching and error handling
class _SparkFeedTileMedia extends StatelessWidget {
  final String? imageUrl;
  final String? gifUrl;

  const _SparkFeedTileMedia({
    this.imageUrl,
    this.gifUrl,
  });

  String get _mediaUrl => imageUrl ?? gifUrl ?? '';
  bool get _isGif => gifUrl != null;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_mediaUrl.isEmpty) return const SizedBox.shrink();

    return Semantics(
      label: _isGif ? 'Animated GIF' : 'Post image',
      image: true,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(_SparkFeedTileConstants.mediaBorderRadius),
        child: ConstrainedBox(
          constraints: const BoxConstraints(
            maxHeight: _SparkFeedTileConstants.mediaMaxHeight,
            minHeight: _SparkFeedTileConstants.mediaMinHeight,
          ),
          child: Stack(
            children: [
              CachedNetworkImage(
                imageUrl: _mediaUrl,
                width: double.infinity,
                fit: BoxFit.cover,
                memCacheWidth: 800, // Optimize memory usage
                placeholder: (_, __) => _MediaPlaceholder(isDark: isDark),
                errorWidget: (_, __, ___) => _MediaErrorWidget(cs: cs),
                fadeInDuration: _SparkFeedTileConstants.imageFadeDuration,
                fadeOutDuration: _SparkFeedTileConstants.imageFadeDuration,
              ),
              // GIF badge
              if (_isGif)
                Positioned(
                  bottom: 8,
                  left: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.7),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      'GIF',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Loading placeholder for media
class _MediaPlaceholder extends StatelessWidget {
  final bool isDark;

  const _MediaPlaceholder({required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 200,
      color: isDark 
          ? _SparkFeedTileConstants.pillBackgroundDark 
          : Colors.grey.shade200,
      child: Center(
        child: SizedBox(
          width: 24,
          height: 24,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            valueColor: AlwaysStoppedAnimation(
              isDark ? Colors.white38 : Colors.grey.shade400,
            ),
          ),
        ),
      ),
    );
  }
}

/// Error widget for failed media loads
class _MediaErrorWidget extends StatelessWidget {
  final ColorScheme cs;

  const _MediaErrorWidget({required this.cs});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 150,
      color: cs.surfaceContainerHighest,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.image_not_supported_outlined,
              color: cs.onSurfaceVariant.withValues(alpha: 0.5),
              size: 32,
            ),
            const SizedBox(height: 8),
            Text(
              'Image unavailable',
              style: TextStyle(
                color: cs.onSurfaceVariant.withValues(alpha: 0.5),
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Action pills row (spark, comment, share)
class _SparkFeedTileActions extends StatelessWidget {
  final int sparkCount;
  final int commentCount;
  final bool hasSparked;
  final bool isDark;
  final VoidCallback onSparkTap;
  final VoidCallback onCommentTap;
  final VoidCallback onShareTap;

  const _SparkFeedTileActions({
    required this.sparkCount,
    required this.commentCount,
    required this.hasSparked,
    required this.isDark,
    required this.onSparkTap,
    required this.onCommentTap,
    required this.onShareTap,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _ActionPill(
          icon: Icons.bolt_rounded,
          count: sparkCount,
          isActive: hasSparked,
          activeColor: _SparkFeedTileConstants.sparkActiveColor,
          onTap: onSparkTap,
          isDark: isDark,
          semanticLabel: hasSparked ? 'Unspark post' : 'Spark post',
        ),
        const SizedBox(width: 8),
        _ActionPill(
          icon: Icons.chat_bubble_outline_rounded,
          count: commentCount,
          onTap: onCommentTap,
          isDark: isDark,
          semanticLabel: 'View comments',
        ),
        const Spacer(),
        _ActionPill(
          icon: Icons.send_rounded,
          label: 'Share',
          onTap: onShareTap,
          isDark: isDark,
          semanticLabel: 'Share post',
        ),
      ],
    );
  }
}

/// Reusable action pill button with accessibility support
class _ActionPill extends StatelessWidget {
  final IconData icon;
  final int? count;
  final String? label;
  final bool isActive;
  final Color? activeColor;
  final VoidCallback onTap;
  final bool isDark;
  final String? semanticLabel;

  const _ActionPill({
    required this.icon,
    this.count,
    this.label,
    this.isActive = false,
    this.activeColor,
    required this.onTap,
    required this.isDark,
    this.semanticLabel,
  });

  String _formatCount(int value) {
    if (value >= 1000000) {
      return '${(value / 1000000).toStringAsFixed(1)}M';
    } else if (value >= 1000) {
      return '${(value / 1000).toStringAsFixed(1)}K';
    }
    return value.toString();
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;
    
    final pillColor = isDark 
        ? _SparkFeedTileConstants.pillBackgroundDark 
        : _SparkFeedTileConstants.pillBackgroundLight;
    final iconColor = isActive 
        ? activeColor ?? cs.primary 
        : (isDark ? Colors.white.withValues(alpha: 0.7) : cs.onSurfaceVariant);
    final textColor = isDark 
        ? Colors.white.withValues(alpha: 0.8) 
        : cs.onSurfaceVariant;

    return Semantics(
      label: semanticLabel ?? (label ?? 'Action'),
      button: true,
      child: Material(
        color: pillColor,
        borderRadius: BorderRadius.circular(_SparkFeedTileConstants.pillBorderRadius),
        child: InkWell(
          onTap: () {
            HapticFeedback.lightImpact();
            onTap();
          },
          borderRadius: BorderRadius.circular(_SparkFeedTileConstants.pillBorderRadius),
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: _SparkFeedTileConstants.pillHorizontalPadding,
              vertical: _SparkFeedTileConstants.pillVerticalPadding,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 18, color: iconColor),
                if (count != null) ...[
                  const SizedBox(width: 6),
                  Text(
                    _formatCount(count!),
                    style: textTheme.labelMedium?.copyWith(
                      color: isActive ? activeColor : textColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
                if (label != null) ...[
                  const SizedBox(width: 6),
                  Text(
                    label!,
                    style: textTheme.labelMedium?.copyWith(
                      color: textColor,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Spark animation overlay
class _SparkAnimationOverlay extends StatelessWidget {
  final Animation<double> animation;

  const _SparkAnimationOverlay({required this.animation});

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: IgnorePointer(
        child: Center(
          child: AnimatedBuilder(
            animation: animation,
            builder: (context, child) {
              return Transform.scale(
                scale: animation.value,
                child: Opacity(
                  opacity: (1 - (animation.value / 1.5)).clamp(0.0, 1.0),
                  child: const Icon(
                    Icons.bolt_rounded,
                    size: 80,
                    color: _SparkFeedTileConstants.sparkActiveColor,
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

/// Skeleton loader for SparkFeedTile - matches flat layout structure
class SparkFeedTileSkeleton extends StatelessWidget {
  final bool showMedia;
  
  const SparkFeedTileSkeleton({
    super.key,
    this.showMedia = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return ColoredBox(
      color: cs.surface,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: _SparkFeedTileConstants.horizontalPadding,
          vertical: _SparkFeedTileConstants.verticalPadding,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header skeleton
            Row(
              children: [
                const ShimmerPlaceholder(
                  width: 32,
                  height: 32,
                  isCircle: true,
                ),
                const SizedBox(width: 10),
                const ShimmerPlaceholder(
                  width: 160,
                  height: 12,
                  borderRadius: BorderRadius.all(Radius.circular(4)),
                ),
                const Spacer(),
                ShimmerPlaceholder(
                  width: 24,
                  height: 24,
                  borderRadius: const BorderRadius.all(Radius.circular(4)),
                ),
              ],
            ),
            const SizedBox(height: 14),
            
            // Title skeleton
            const ShimmerPlaceholder(
              width: double.infinity,
              height: 16,
              borderRadius: BorderRadius.all(Radius.circular(4)),
            ),
            const SizedBox(height: 8),
            const ShimmerPlaceholder(
              width: 220,
              height: 16,
              borderRadius: BorderRadius.all(Radius.circular(4)),
            ),
            const SizedBox(height: 10),
            
            // Content skeleton
            const ShimmerPlaceholder(
              width: double.infinity,
              height: 13,
              borderRadius: BorderRadius.all(Radius.circular(4)),
            ),
            const SizedBox(height: 6),
            const ShimmerPlaceholder(
              width: 280,
              height: 13,
              borderRadius: BorderRadius.all(Radius.circular(4)),
            ),
            
            // Optional media skeleton
            if (showMedia) ...[
              const SizedBox(height: 14),
              ShimmerPlaceholder(
                width: double.infinity,
                height: 200,
                borderRadius: BorderRadius.all(
                  Radius.circular(_SparkFeedTileConstants.mediaBorderRadius),
                ),
              ),
            ],
            
            const SizedBox(height: 14),
            
            // Action pills skeleton
            Row(
              children: [
                ShimmerPlaceholder(
                  width: 70,
                  height: 36,
                  borderRadius: BorderRadius.all(
                    Radius.circular(_SparkFeedTileConstants.pillBorderRadius),
                  ),
                ),
                const SizedBox(width: 8),
                ShimmerPlaceholder(
                  width: 60,
                  height: 36,
                  borderRadius: BorderRadius.all(
                    Radius.circular(_SparkFeedTileConstants.pillBorderRadius),
                  ),
                ),
                const Spacer(),
                ShimmerPlaceholder(
                  width: 80,
                  height: 36,
                  borderRadius: BorderRadius.all(
                    Radius.circular(_SparkFeedTileConstants.pillBorderRadius),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Feed divider for flat tile layout
class SparkFeedDivider extends StatelessWidget {
  const SparkFeedDivider({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Divider(
      height: 1,
      thickness: 1,
      color: isDark 
          ? _SparkFeedTileConstants.dividerDark 
          : Colors.grey.shade200,
    );
  }
}
