import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/pages/home/home_service.dart';
import 'package:thittam1hub/pages/home/widgets/video_story_recorder.dart';
import 'package:thittam1hub/pages/home/widgets/video_story_viewer.dart';
import 'package:thittam1hub/services/video_story_service.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/shimmer_loading.dart';

class StoriesBar extends StatefulWidget {
  final List<StoryItem> stories;
  final Function(StoryItem) onStoryTap;
  final VoidCallback onAddTap;
  final VoidCallback? onVideoStoryCreated;

  const StoriesBar({
    Key? key,
    required this.stories,
    required this.onStoryTap,
    required this.onAddTap,
    this.onVideoStoryCreated,
  }) : super(key: key);

  @override
  State<StoriesBar> createState() => _StoriesBarState();
}

class _StoriesBarState extends State<StoriesBar> {
  final _videoStoryService = VideoStoryService();
  List<VideoStory> _videoStories = [];
  bool _loadingVideoStories = true;

  @override
  void initState() {
    super.initState();
    _loadVideoStories();
  }

  Future<void> _loadVideoStories() async {
    try {
      final stories = await _videoStoryService.getActiveStories();
      if (mounted) {
        setState(() {
          _videoStories = stories;
          _loadingVideoStories = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loadingVideoStories = false);
      }
    }
  }

  void _openVideoStoryRecorder() {
    HapticFeedback.mediumImpact();
    VideoStoryRecorder.show(
      context,
      onStoryCreated: (videoUrl, caption) {
        _loadVideoStories();
        widget.onVideoStoryCreated?.call();
      },
    );
  }

  void _openVideoStory(VideoStory story) {
    HapticFeedback.lightImpact();
    final storyIndex = _videoStories.indexOf(story);
    VideoStoryViewer.show(
      context,
      stories: _videoStories,
      initialIndex: storyIndex >= 0 ? storyIndex : 0,
    );
  }

  @override
  Widget build(BuildContext context) {
    // Group video stories by user
    final Map<String, List<VideoStory>> userStories = {};
    for (final story in _videoStories) {
      userStories.putIfAbsent(story.userId, () => []).add(story);
    }

    return Container(
      height: 80, // Compact height
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 10),
        itemCount: 1 + userStories.length + widget.stories.length,
        itemBuilder: (context, index) {
          // Add story button
          if (index == 0) {
            return _AddStoryButton(
              onTap: widget.onAddTap,
              onLongPress: _openVideoStoryRecorder,
              hasOwnStory: _videoStories.any(
                (s) => s.userId == _videoStoryService.currentUserId,
              ),
            );
          }

          // Video stories (grouped by user)
          final videoUserIndex = index - 1;
          if (videoUserIndex < userStories.length) {
            final userId = userStories.keys.elementAt(videoUserIndex);
            final stories = userStories[userId]!;
            final firstStory = stories.first;
            final hasUnviewed = stories.any((s) => !s.isViewed);
            
            return _VideoStoryItem(
              story: firstStory,
              storyCount: stories.length,
              hasUnviewed: hasUnviewed,
              onTap: () => _openVideoStory(firstStory),
            );
          }

          // Regular stories
          final regularIndex = index - 1 - userStories.length;
          final story = widget.stories[regularIndex];
          return _StoryItem(
            story: story,
            onTap: () => widget.onStoryTap(story),
          );
        },
      ),
    );
  }
}

class _AddStoryButton extends StatelessWidget {
  final VoidCallback onTap;
  final VoidCallback? onLongPress;
  final bool hasOwnStory;

  const _AddStoryButton({
    required this.onTap,
    this.onLongPress,
    this.hasOwnStory = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 5),
      child: Semantics(
        button: true,
        label: 'Create new story. Long press for video story.',
        child: GestureDetector(
          onTap: onTap,
          onLongPress: () {
            HapticFeedback.mediumImpact();
            onLongPress?.call();
          },
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Stack(
                children: [
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: hasOwnStory
                          ? LinearGradient(
                              colors: [cs.primary, cs.tertiary],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            )
                          : LinearGradient(
                              colors: [
                                cs.primary.withOpacity(0.1),
                                cs.tertiary.withOpacity(0.1),
                              ],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                      border: hasOwnStory ? null : Border.all(
                        color: cs.outline.withOpacity(0.2),
                        width: 1.5,
                        strokeAlign: BorderSide.strokeAlignOutside,
                      ),
                    ),
                    child: Container(
                      margin: EdgeInsets.all(hasOwnStory ? 2.5 : 1.5),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isDark ? cs.surfaceContainerHigh : cs.surfaceContainerLowest,
                      ),
                      child: Icon(
                        Icons.add_rounded,
                        color: cs.primary,
                        size: 20,
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      width: 16,
                      height: 16,
                      decoration: BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                        border: Border.all(color: cs.surface, width: 1.5),
                      ),
                      child: const Icon(
                        Icons.videocam_rounded,
                        size: 8,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 3),
              Text(
                'Story',
                style: textTheme.labelSmall?.copyWith(
                  color: cs.onSurfaceVariant,
                  fontWeight: FontWeight.w500,
                  fontSize: 9,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Video story item widget
class _VideoStoryItem extends StatefulWidget {
  final VideoStory story;
  final int storyCount;
  final bool hasUnviewed;
  final VoidCallback onTap;

  const _VideoStoryItem({
    required this.story,
    required this.storyCount,
    required this.hasUnviewed,
    required this.onTap,
  });

  @override
  State<_VideoStoryItem> createState() => _VideoStoryItemState();
}

class _VideoStoryItemState extends State<_VideoStoryItem>
    with SingleTickerProviderStateMixin {
  late AnimationController _ringController;
  double _scale = 1.0;

  @override
  void initState() {
    super.initState();
    _ringController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    );
    if (widget.hasUnviewed) {
      _ringController.repeat();
    }
  }

  @override
  void didUpdateWidget(_VideoStoryItem oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.hasUnviewed && !_ringController.isAnimating) {
      _ringController.repeat();
    } else if (!widget.hasUnviewed && _ringController.isAnimating) {
      _ringController.stop();
    }
  }

  @override
  void dispose() {
    _ringController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    final gradientColors = widget.hasUnviewed
        ? [Colors.purple, Colors.pink, Colors.orange]
        : [cs.outline.withOpacity(0.4), cs.outline.withOpacity(0.3)];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 5),
      child: Semantics(
        button: true,
        label: '${widget.story.userName ?? "User"} video story${widget.hasUnviewed ? ", new" : ""}',
        child: GestureDetector(
          onTap: widget.onTap,
          onTapDown: (_) => setState(() => _scale = 0.95),
          onTapUp: (_) => setState(() => _scale = 1.0),
          onTapCancel: () => setState(() => _scale = 1.0),
          child: AnimatedScale(
            scale: _scale,
            duration: const Duration(milliseconds: 100),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Stack(
                  alignment: Alignment.center,
                  children: [
                    // Animated ring - Compact
                  AnimatedBuilder(
                    animation: _ringController,
                    builder: (context, child) {
                      return Transform.rotate(
                        angle: widget.hasUnviewed
                            ? _ringController.value * 2 * math.pi
                            : 0,
                        child: Container(
                          width: 54,
                          height: 54,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: SweepGradient(
                              colors: [...gradientColors, gradientColors.first],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                  // Inner surface - Compact
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: cs.surface,
                    ),
                  ),
                  // Avatar - Compact
                  CircleAvatar(
                    radius: 21,
                    backgroundColor: cs.surfaceContainerHighest,
                    backgroundImage: widget.story.userAvatar != null
                        ? NetworkImage(widget.story.userAvatar!)
                        : null,
                    child: widget.story.userAvatar == null
                        ? const Icon(Icons.person, size: 18)
                        : null,
                  ),
                  // Video badge - Compact
                  Positioned(
                    bottom: 0,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Colors.purple, Colors.pink],
                        ),
                        borderRadius: BorderRadius.circular(6),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.purple.withOpacity(0.4),
                            blurRadius: 4,
                            offset: const Offset(0, 1),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.play_arrow_rounded, 
                            size: 8, color: Colors.white),
                          if (widget.storyCount > 1) ...[
                            const SizedBox(width: 1),
                            Text(
                              '${widget.storyCount}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 8,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 3),
              SizedBox(
                width: 50,
                child: Text(
                  widget.story.userName?.split(' ').first ?? 'User',
                style: textTheme.labelSmall?.copyWith(
                  color: widget.hasUnviewed 
                      ? cs.onSurface 
                      : cs.onSurfaceVariant,
                  fontWeight: widget.hasUnviewed 
                      ? FontWeight.w600 
                      : FontWeight.w500,
                  fontSize: 8,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                ),
              ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StoryItem extends StatefulWidget {
  final StoryItem story;
  final VoidCallback onTap;
  final bool isSeen;

  const _StoryItem({
    required this.story,
    required this.onTap,
    this.isSeen = false,
  });

  @override
  State<_StoryItem> createState() => _StoryItemState();
}

class _StoryItemState extends State<_StoryItem> with SingleTickerProviderStateMixin {
  late AnimationController _ringAnimController;
  double _scale = 1.0;

  @override
  void initState() {
    super.initState();
    _ringAnimController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    );
    
    // Animate ring for live or active content
    if (widget.story.isLive || widget.story.type == StoryType.discoverPeople) {
      _ringAnimController.repeat();
    }
  }

  @override
  void dispose() {
    _ringAnimController.dispose();
    super.dispose();
  }

  void _onTapDown(TapDownDetails details) {
    setState(() => _scale = 0.95);
  }

  void _onTapUp(TapUpDetails details) {
    setState(() => _scale = 1.0);
  }

  void _onTapCancel() {
    setState(() => _scale = 1.0);
  }

  Color _getRingColor(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    switch (widget.story.type) {
      case StoryType.dailyMission:
        return cs.primary;
      case StoryType.liveSpace:
        return Colors.red;
      case StoryType.activeGame:
        return Colors.purple;
      case StoryType.onlineFollowing:
        return Colors.green;
      case StoryType.discoverPeople:
        return Colors.orange;
      case StoryType.videoStory:
        return Colors.pink;
    }
  }

  List<Color> _getGradientColors(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    switch (widget.story.type) {
      case StoryType.dailyMission:
        return [cs.primary, cs.tertiary];
      case StoryType.liveSpace:
        return [Colors.red, Colors.pink];
      case StoryType.activeGame:
        return [Colors.purple, Colors.deepPurple];
      case StoryType.onlineFollowing:
        return [Colors.green, Colors.teal];
      case StoryType.discoverPeople:
        return [Colors.orange, Colors.pink, Colors.purple];
      case StoryType.videoStory:
        return [Colors.purple, Colors.pink, Colors.orange];
    }
  }

  IconData _getDefaultIcon() {
    switch (widget.story.type) {
      case StoryType.dailyMission:
        return Icons.flag_rounded;
      case StoryType.liveSpace:
        return Icons.mic_rounded;
      case StoryType.activeGame:
        return Icons.gamepad_rounded;
      case StoryType.onlineFollowing:
        return Icons.person_rounded;
      case StoryType.discoverPeople:
        return Icons.favorite_rounded;
      case StoryType.videoStory:
        return Icons.play_circle_rounded;
    }
  }

  String _getLabel() {
    switch (widget.story.type) {
      case StoryType.dailyMission:
        return 'Mission';
      case StoryType.liveSpace:
        return 'Live';
      case StoryType.activeGame:
        return 'Game';
      case StoryType.onlineFollowing:
        return widget.story.title.split(' ').first;
      case StoryType.discoverPeople:
        return 'For You';
      case StoryType.videoStory:
        return 'Story';
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ringColor = _getRingColor(context);
    final gradientColors = widget.isSeen 
        ? [cs.outline.withOpacity(0.4), cs.outline.withOpacity(0.3)]
        : _getGradientColors(context);
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 5),
      child: Semantics(
        label: '${widget.story.title} story, ${widget.story.isLive ? 'live now' : ''}',
        button: true,
        child: GestureDetector(
          onTap: widget.onTap,
          onTapDown: _onTapDown,
          onTapUp: _onTapUp,
          onTapCancel: _onTapCancel,
          child: AnimatedScale(
            scale: _scale,
            duration: const Duration(milliseconds: 100),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Stack(
              alignment: Alignment.center,
              children: [
                // Animated rotating gradient ring - Compact
                AnimatedBuilder(
                  animation: _ringAnimController,
                  builder: (context, child) {
                    return Transform.rotate(
                      angle: _ringAnimController.value * 2 * math.pi,
                      child: Container(
                        width: 54,
                        height: 54,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: SweepGradient(
                            colors: [
                              ...gradientColors,
                              gradientColors.first,
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
                // Inner white/surface ring - Compact
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: cs.surface,
                  ),
                ),
                // Avatar - Compact
                CircleAvatar(
                  radius: 21,
                  backgroundColor: cs.surfaceContainerHighest,
                  backgroundImage: widget.story.avatarUrl != null 
                      ? NetworkImage(widget.story.avatarUrl!)
                      : null,
                  child: widget.story.avatarUrl == null 
                      ? Icon(_getDefaultIcon(), color: ringColor, size: 18)
                      : null,
                ),
                // Live indicator
                if (widget.story.isLive)
                  Positioned(
                    bottom: 0,
                    child: _LiveIndicator(color: ringColor),
                  ),
                // Match score badge for discover people - Compact
                if (widget.story.type == StoryType.discoverPeople && widget.story.matchScore != null)
                  Positioned(
                    top: 0,
                    right: 0,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                      decoration: BoxDecoration(
                        color: Colors.orange,
                        borderRadius: BorderRadius.circular(8),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.orange.withValues(alpha: 0.4),
                            blurRadius: 4,
                            offset: const Offset(0, 1),
                          ),
                        ],
                      ),
                      child: Text(
                        '${widget.story.matchScore}%',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 8,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 3),
              SizedBox(
                width: 50,
                child: Text(
                  _getLabel(),
                  style: textTheme.labelSmall?.copyWith(
                    color: widget.isSeen 
                        ? cs.outline 
                        : cs.onSurfaceVariant,
                    fontWeight: FontWeight.w500,
                    fontSize: 8,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
}

/// Animated pulsing live indicator
class _LiveIndicator extends StatefulWidget {
  final Color color;
  const _LiveIndicator({required this.color});

  @override
  State<_LiveIndicator> createState() => _LiveIndicatorState();
}

class _LiveIndicatorState extends State<_LiveIndicator> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);
    
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.15).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _pulseAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: _pulseAnimation.value,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: widget.color,
              borderRadius: BorderRadius.circular(5),
              boxShadow: [
                BoxShadow(
                  color: widget.color.withValues(alpha: 0.5),
                  blurRadius: 6,
                  offset: const Offset(0, 1),
                ),
              ],
            ),
            child: const Text(
              'LIVE',
              style: TextStyle(
                color: Colors.white,
                fontSize: 8,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.4,
              ),
            ),
          ),
        );
      },
    );
  }
}

class StoriesBarSkeleton extends StatelessWidget {
  const StoriesBarSkeleton({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 80, // Compact height
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 10),
        itemCount: 6,
        itemBuilder: (context, index) {
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 5),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ShimmerPlaceholder(
                  width: 50,
                  height: 50,
                  isCircle: true,
                ),
                const SizedBox(height: 3),
                ShimmerPlaceholder(
                  width: 36,
                  height: 8,
                  borderRadius: BorderRadius.circular(4),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
