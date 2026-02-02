import 'dart:async';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:thittam1hub/services/video_story_service.dart';
import 'package:thittam1hub/services/story_cache_service.dart';
import 'package:thittam1hub/widgets/story_reply_bar.dart';
import 'package:thittam1hub/pages/home/widgets/story_insights_sheet.dart';
import 'package:thittam1hub/theme.dart';

/// Full-screen video story viewer with industry best practices
/// Features: swipe gestures, reactions, replies
/// Uses thumbnail/image display for web compatibility
class VideoStoryViewer extends StatefulWidget {
  final List<VideoStory> stories;
  final int initialIndex;
  final VoidCallback? onClose;

  const VideoStoryViewer({
    Key? key,
    required this.stories,
    this.initialIndex = 0,
    this.onClose,
  }) : super(key: key);

  @override
  State<VideoStoryViewer> createState() => _VideoStoryViewerState();

  static Future<void> show(
    BuildContext context, {
    required List<VideoStory> stories,
    int initialIndex = 0,
  }) {
    return Navigator.of(context).push(
      PageRouteBuilder(
        opaque: false,
        pageBuilder: (context, animation, secondaryAnimation) {
          return FadeTransition(
            opacity: animation,
            child: VideoStoryViewer(
              stories: stories,
              initialIndex: initialIndex,
            ),
          );
        },
      ),
    );
  }
}

class _VideoStoryViewerState extends State<VideoStoryViewer>
    with TickerProviderStateMixin {
  final _videoStoryService = VideoStoryService();
  final _cacheService = StoryCacheService();
  
  late PageController _pageController;
  late AnimationController _progressController;
  Timer? _autoAdvanceTimer;
  
  int _currentIndex = 0;
  bool _isPaused = false;
  bool _isMuted = false;
  bool _isLoading = true;
  bool _showDoubleTapLike = false;
  double _dragOffset = 0;
  
  // Gesture tracking
  DateTime? _lastTapTime;
  Offset? _lastTapPosition;
  
  // Default story duration for images
  static const _defaultDuration = Duration(seconds: 5);

  Duration get _storyDuration {
    if (_currentIndex < 0 || _currentIndex >= widget.stories.length) {
      return _defaultDuration;
    }
    final story = widget.stories[_currentIndex];
    return Duration(seconds: story.durationSeconds ?? 5);
  }

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: _currentIndex);
    _progressController = AnimationController(
      vsync: this,
      duration: _storyDuration,
    );
    
    _initializeCache();
    _startStory(_currentIndex);
  }

  Future<void> _initializeCache() async {
    await _cacheService.initialize();
  }

  @override
  void dispose() {
    _autoAdvanceTimer?.cancel();
    _progressController.dispose();
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _startStory(int index) async {
    if (index < 0 || index >= widget.stories.length) return;

    setState(() => _isLoading = true);

    final story = widget.stories[index];
    
    // Mark story as viewed
    _videoStoryService.markStoryViewed(story.id);
    _cacheService.markStoryAsSeen(story.id);

    // Get duration from story or use default
    final duration = Duration(seconds: story.durationSeconds ?? 5);
    
    _progressController.duration = duration;
    setState(() => _isLoading = false);
    
    // Start progress animation
    _progressController.forward(from: 0);
    
    // Set up auto-advance
    _autoAdvanceTimer?.cancel();
    _autoAdvanceTimer = Timer(duration, _nextStory);
  }

  void _nextStory() {
    if (_currentIndex < widget.stories.length - 1) {
      HapticFeedback.lightImpact();
      setState(() => _currentIndex++);
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
      _startStory(_currentIndex);
    } else {
      _close();
    }
  }

  void _previousStory() {
    if (_currentIndex > 0) {
      HapticFeedback.lightImpact();
      setState(() => _currentIndex--);
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
      _startStory(_currentIndex);
    } else {
      // Restart current story
      _startStory(_currentIndex);
    }
  }

  void _togglePause() {
    HapticFeedback.lightImpact();
    setState(() => _isPaused = !_isPaused);
    
    if (_isPaused) {
      _progressController.stop();
      _autoAdvanceTimer?.cancel();
    } else {
      _progressController.forward();
      final remaining = _progressController.duration! * (1 - _progressController.value);
      _autoAdvanceTimer = Timer(remaining, _nextStory);
    }
  }

  void _toggleMute() {
    HapticFeedback.lightImpact();
    setState(() => _isMuted = !_isMuted);
  }

  void _close() {
    HapticFeedback.mediumImpact();
    widget.onClose?.call();
    Navigator.of(context).pop();
  }

  void _onTapDown(TapDownDetails details) {
    final screenWidth = MediaQuery.of(context).size.width;
    final tapX = details.globalPosition.dx;
    final now = DateTime.now();
    
    // Check for double tap
    if (_lastTapTime != null && 
        _lastTapPosition != null &&
        now.difference(_lastTapTime!) < const Duration(milliseconds: 300) &&
        (details.globalPosition - _lastTapPosition!).distance < 50) {
      _onDoubleTap();
      _lastTapTime = null;
      _lastTapPosition = null;
      return;
    }
    
    _lastTapTime = now;
    _lastTapPosition = details.globalPosition;
    
    // Single tap navigation
    if (tapX < screenWidth * 0.3) {
      _previousStory();
    } else if (tapX > screenWidth * 0.7) {
      _nextStory();
    }
  }

  void _onDoubleTap() {
    HapticFeedback.mediumImpact();
    setState(() => _showDoubleTapLike = true);
    
    // Send like reaction
    final story = widget.stories[_currentIndex];
    _videoStoryService.reactToStory(story.id, '❤️');
    
    // Hide animation after delay
    Future.delayed(const Duration(milliseconds: 800), () {
      if (mounted) {
        setState(() => _showDoubleTapLike = false);
      }
    });
  }

  void _onVerticalDragUpdate(DragUpdateDetails details) {
    if (details.delta.dy > 0) {
      setState(() {
        _dragOffset += details.delta.dy;
      });
    }
  }

  void _onVerticalDragEnd(DragEndDetails details) {
    if (_dragOffset > 100 || details.velocity.pixelsPerSecond.dy > 500) {
      _close();
    } else {
      setState(() => _dragOffset = 0);
    }
  }

  void _showReplySheet() {
    final story = widget.stories[_currentIndex];
    _togglePause(); // Pause while replying
    
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: StoryReplyBar(
          storyId: story.id,
          recipientName: story.userName ?? 'User',
          onReply: (text) {
            _videoStoryService.replyToStory(story.id, text);
            Navigator.pop(context);
            _togglePause(); // Resume after reply
          },
          onReaction: (emoji) {
            _videoStoryService.reactToStory(story.id, emoji);
            Navigator.pop(context);
            _togglePause();
          },
        ),
      ),
    ).whenComplete(() {
      if (_isPaused) _togglePause();
    });
  }

  void _showInsights() {
    final story = widget.stories[_currentIndex];
    _togglePause();
    
    StoryInsightsSheet.show(context, story: story).whenComplete(() {
      if (_isPaused) _togglePause();
    });
  }

  @override
  Widget build(BuildContext context) {
    if (widget.stories.isEmpty) {
      return const Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: Text('No stories', style: TextStyle(color: Colors.white)),
        ),
      );
    }

    final story = widget.stories[_currentIndex];
    final isOwner = story.userId == _videoStoryService.currentUserId;
    final safeArea = MediaQuery.of(context).padding;
    
    return Scaffold(
      backgroundColor: Colors.black,
      body: Semantics(
        label: 'Video story by ${story.userName ?? "user"}, ${story.caption ?? "no caption"}',
        child: GestureDetector(
          onTapDown: _onTapDown,
          onLongPressStart: (_) => _togglePause(),
          onLongPressEnd: (_) {
            if (_isPaused) _togglePause();
          },
          onVerticalDragUpdate: _onVerticalDragUpdate,
          onVerticalDragEnd: _onVerticalDragEnd,
          child: Transform.translate(
            offset: Offset(0, _dragOffset.clamp(0.0, 200.0)),
            child: Opacity(
              opacity: 1.0 - (_dragOffset / 400).clamp(0.0, 0.5),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  // Story content (thumbnail/image)
                  _buildStoryContent(story),

                  // Gradient overlays
                  _buildTopGradient(),
                  _buildBottomGradient(),

                  // Progress bars
                  Positioned(
                    top: safeArea.top + 8,
                    left: 16,
                    right: 16,
                    child: _buildProgressBars(),
                  ),

                  // Header with user info
                  Positioned(
                    top: safeArea.top + 24,
                    left: 16,
                    right: 16,
                    child: _buildHeader(story, isOwner),
                  ),

                  // Caption
                  if (story.caption != null && story.caption!.isNotEmpty)
                    Positioned(
                      bottom: safeArea.bottom + 100,
                      left: 16,
                      right: 80,
                      child: _buildCaption(story.caption!),
                    ),

                  // Side actions
                  Positioned(
                    right: 16,
                    bottom: safeArea.bottom + 100,
                    child: _buildSideActions(story, isOwner),
                  ),

                  // Double tap heart animation
                  if (_showDoubleTapLike)
                    Center(
                      child: TweenAnimationBuilder<double>(
                        tween: Tween(begin: 0.5, end: 1.5),
                        duration: const Duration(milliseconds: 400),
                        curve: Curves.elasticOut,
                        builder: (context, scale, child) {
                          return Transform.scale(
                            scale: scale,
                            child: Icon(
                              Icons.favorite,
                              color: Colors.redAccent,
                              size: 100,
                              shadows: [
                                Shadow(
                                  color: Colors.black.withValues(alpha: 0.3),
                                  blurRadius: 20,
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),

                  // Paused indicator
                  if (_isPaused)
                    Center(
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.black54,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Icon(
                          Icons.pause,
                          color: Colors.white,
                          size: 48,
                        ),
                      ),
                    ),

                  // Reply bar at bottom
                  Positioned(
                    bottom: safeArea.bottom + 16,
                    left: 16,
                    right: 16,
                    child: _buildReplyBar(story),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStoryContent(VideoStory story) {
    // Use thumbnail/image display for all platforms (web compatible)
    final imageUrl = story.thumbnailUrl ?? story.videoUrl;
    
    if (imageUrl.isEmpty) {
      return Container(
        color: Colors.black,
        child: const Center(
          child: Icon(Icons.play_circle_outline, color: Colors.white54, size: 80),
        ),
      );
    }
    
    return Stack(
      fit: StackFit.expand,
      children: [
        // Background image (thumbnail)
        CachedNetworkImage(
          imageUrl: imageUrl,
          fit: BoxFit.cover,
          placeholder: (context, url) => Container(
            color: Colors.black,
            child: const Center(
              child: CircularProgressIndicator(color: Colors.white),
            ),
          ),
          errorWidget: (context, url, error) => Container(
            color: Colors.black,
            child: const Center(
              child: Icon(Icons.error_outline, color: Colors.white54, size: 48),
            ),
          ),
        ),
        // Video indicator overlay (since we're showing thumbnail)
        if (story.videoUrl.isNotEmpty && story.videoUrl != story.thumbnailUrl)
          Positioned(
            top: MediaQuery.of(context).padding.top + 60,
            right: 16,
            child: GestureDetector(
              onTap: _toggleMute,
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black38,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Icon(
                  _isMuted ? Icons.volume_off : Icons.volume_up,
                  color: Colors.white,
                  size: 20,
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildTopGradient() {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      height: 200,
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.black.withValues(alpha: 0.7),
              Colors.transparent,
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBottomGradient() {
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      height: 300,
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.bottomCenter,
            end: Alignment.topCenter,
            colors: [
              Colors.black.withValues(alpha: 0.9),
              Colors.transparent,
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProgressBars() {
    return Row(
      children: List.generate(widget.stories.length, (index) {
        return Expanded(
          child: Container(
            margin: EdgeInsets.only(right: index < widget.stories.length - 1 ? 4 : 0),
            height: 3,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(2),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(2),
              child: index == _currentIndex
                  ? AnimatedBuilder(
                      animation: _progressController,
                      builder: (context, child) {
                        return FractionallySizedBox(
                          alignment: Alignment.centerLeft,
                          widthFactor: _progressController.value,
                          child: Container(color: Colors.white),
                        );
                      },
                    )
                  : Container(
                      color: index < _currentIndex ? Colors.white : Colors.transparent,
                    ),
            ),
          ),
        );
      }),
    );
  }

  Widget _buildHeader(VideoStory story, bool isOwner) {
    return Row(
      children: [
        // Avatar
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 2),
          ),
          child: ClipOval(
            child: story.userAvatar != null && story.userAvatar!.isNotEmpty
                ? CachedNetworkImage(
                    imageUrl: story.userAvatar!,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(color: Colors.grey),
                    errorWidget: (context, url, error) => Container(
                      color: Colors.grey,
                      child: const Icon(Icons.person, color: Colors.white),
                    ),
                  )
                : Container(
                    color: Colors.grey,
                    child: const Icon(Icons.person, color: Colors.white),
                  ),
          ),
        ),
        const SizedBox(width: 12),
        // User info
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                story.userName ?? 'User',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                _formatTimestamp(story.createdAt),
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.7),
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
        // Close button
        IconButton(
          icon: const Icon(Icons.close, color: Colors.white),
          onPressed: _close,
        ),
      ],
    );
  }

  Widget _buildCaption(String caption) {
    return Text(
      caption,
      style: const TextStyle(
        color: Colors.white,
        fontSize: 16,
        height: 1.4,
        shadows: [
          Shadow(
            color: Colors.black54,
            blurRadius: 8,
          ),
        ],
      ),
      maxLines: 4,
      overflow: TextOverflow.ellipsis,
    );
  }

  Widget _buildSideActions(VideoStory story, bool isOwner) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Like button
        _SideActionButton(
          icon: Icons.favorite_border,
          label: story.reactionCount.toString(),
          onTap: () => _videoStoryService.reactToStory(story.id, '❤️'),
        ),
        const SizedBox(height: 16),
        // Comment button
        _SideActionButton(
          icon: Icons.mode_comment_outlined,
          label: '',
          onTap: _showReplySheet,
        ),
        if (isOwner) ...[
          const SizedBox(height: 16),
          // Insights button (owner only)
          _SideActionButton(
            icon: Icons.insights,
            label: '${story.viewCount}',
            onTap: _showInsights,
          ),
        ],
      ],
    );
  }

  Widget _buildReplyBar(VideoStory story) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
      ),
      child: GestureDetector(
        onTap: _showReplySheet,
        child: Row(
          children: [
            Text(
              'Reply to ${story.userName ?? "user"}...',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.8),
                fontSize: 14,
              ),
            ),
            const Spacer(),
            // Quick reactions
            for (final emoji in ['❤️', '🔥', '😍', '👏'])
              GestureDetector(
                onTap: () {
                  HapticFeedback.lightImpact();
                  _videoStoryService.reactToStory(story.id, emoji);
                  setState(() => _showDoubleTapLike = true);
                  Future.delayed(const Duration(milliseconds: 500), () {
                    if (mounted) setState(() => _showDoubleTapLike = false);
                  });
                },
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Text(emoji, style: const TextStyle(fontSize: 20)),
                ),
              ),
          ],
        ),
      ),
    );
  }

  String _formatTimestamp(DateTime dateTime) {
    final now = DateTime.now();
    final diff = now.difference(dateTime);

    if (diff.inMinutes < 1) {
      return 'Just now';
    } else if (diff.inMinutes < 60) {
      return '${diff.inMinutes}m ago';
    } else if (diff.inHours < 24) {
      return '${diff.inHours}h ago';
    } else {
      return '${diff.inDays}d ago';
    }
  }
}

class _SideActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _SideActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.black38,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Colors.white, size: 24),
          ),
          if (label.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
