import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
export 'package:cached_network_image/cached_network_image.dart' show CachedNetworkImage;
import 'package:video_player/video_player.dart';
export 'package:video_player/video_player.dart' show VideoPlayerController, VideoPlayer;
import 'package:share_plus/share_plus.dart';
export 'package:share_plus/share_plus.dart' show Share;
import '../../models/chat_media_models.dart';
import '../../theme.dart';

/// Full-screen media viewer supporting images and videos with swipe navigation
class MediaGalleryViewer extends StatefulWidget {
  final List<ChatMediaItem> items;
  final int initialIndex;
  final String? senderName;

  const MediaGalleryViewer({
    super.key,
    required this.items,
    this.initialIndex = 0,
    this.senderName,
  });

  /// Show the media gallery viewer
  static Future<void> show(
    BuildContext context, {
    required List<ChatMediaItem> items,
    int initialIndex = 0,
    String? senderName,
  }) {
    if (items.isEmpty) return Future.value();
    
    return Navigator.of(context).push(
      PageRouteBuilder(
        opaque: false,
        barrierColor: Colors.black,
        pageBuilder: (context, animation, secondaryAnimation) {
          return MediaGalleryViewer(
            items: items,
            initialIndex: initialIndex.clamp(0, items.length - 1),
            senderName: senderName,
          );
        },
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(opacity: animation, child: child);
        },
      ),
    );
  }

  @override
  State<MediaGalleryViewer> createState() => _MediaGalleryViewerState();
}

class _MediaGalleryViewerState extends State<MediaGalleryViewer> {
  late PageController _pageController;
  late int _currentIndex;
  bool _showControls = true;
  
  // Video controllers cache
  final Map<int, VideoPlayerController> _videoControllers = {};
  int? _activeVideoIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    
    // Pre-initialize video if starting on video
    _initializeVideoIfNeeded(_currentIndex);
  }

  @override
  void dispose() {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    _pageController.dispose();
    
    // Dispose all video controllers
    for (final controller in _videoControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  void _initializeVideoIfNeeded(int index) {
    if (index < 0 || index >= widget.items.length) return;
    
    final item = widget.items[index];
    if (item.type != MediaType.video) return;
    
    if (!_videoControllers.containsKey(index)) {
      final controller = VideoPlayerController.networkUrl(Uri.parse(item.url));
      _videoControllers[index] = controller;
      
      controller.initialize().then((_) {
        if (mounted && _currentIndex == index) {
          setState(() {
            _activeVideoIndex = index;
          });
        }
      });
    }
  }

  void _onPageChanged(int index) {
    // Pause previous video
    if (_activeVideoIndex != null && _videoControllers.containsKey(_activeVideoIndex)) {
      _videoControllers[_activeVideoIndex]?.pause();
    }
    
    setState(() {
      _currentIndex = index;
      _activeVideoIndex = null;
    });
    
    // Initialize new video if needed
    _initializeVideoIfNeeded(index);
    
    // Pre-load adjacent videos
    if (index > 0) _initializeVideoIfNeeded(index - 1);
    if (index < widget.items.length - 1) _initializeVideoIfNeeded(index + 1);
  }

  void _toggleControls() {
    setState(() => _showControls = !_showControls);
  }

  ChatMediaItem get _currentItem => widget.items[_currentIndex];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Media pages
          PageView.builder(
            controller: _pageController,
            itemCount: widget.items.length,
            onPageChanged: _onPageChanged,
            itemBuilder: (context, index) {
              final item = widget.items[index];
              return GestureDetector(
                onTap: _toggleControls,
                behavior: HitTestBehavior.opaque,
                child: item.type == MediaType.video
                    ? _buildVideoPlayer(index, item)
                    : _buildImageViewer(item),
              );
            },
          ),

          // Top bar
          AnimatedPositioned(
            duration: const Duration(milliseconds: 200),
            top: _showControls ? 0 : -120,
            left: 0,
            right: 0,
            child: _buildTopBar(),
          ),

          // Bottom bar
          AnimatedPositioned(
            duration: const Duration(milliseconds: 200),
            bottom: _showControls ? 0 : -150,
            left: 0,
            right: 0,
            child: _buildBottomBar(),
          ),

          // Page indicator (only show if multiple items)
          if (widget.items.length > 1)
            AnimatedPositioned(
              duration: const Duration(milliseconds: 200),
              bottom: _showControls ? 120 : 20,
              left: 0,
              right: 0,
              child: _buildPageIndicator(),
            ),
        ],
      ),
    );
  }

  Widget _buildImageViewer(ChatMediaItem item) {
    return InteractiveViewer(
      minScale: 1.0,
      maxScale: 4.0,
      child: Center(
        child: CachedNetworkImage(
          imageUrl: item.url,
          fit: BoxFit.contain,
          placeholder: (_, __) => const Center(
            child: CircularProgressIndicator(color: Colors.white),
          ),
          errorWidget: (_, __, ___) => const _MediaErrorWidget(),
        ),
      ),
    );
  }

  Widget _buildVideoPlayer(int index, ChatMediaItem item) {
    final controller = _videoControllers[index];
    
    if (controller == null || !controller.value.isInitialized) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(color: Colors.white),
            const SizedBox(height: 16),
            Text(
              'Loading video...',
              style: TextStyle(color: Colors.white.withOpacity(0.7)),
            ),
          ],
        ),
      );
    }

    return Stack(
      alignment: Alignment.center,
      children: [
        // Video
        Center(
          child: AspectRatio(
            aspectRatio: controller.value.aspectRatio,
            child: VideoPlayer(controller),
          ),
        ),

        // Play/pause overlay
        _VideoPlayOverlay(
          controller: controller,
          onTap: () {
            if (controller.value.isPlaying) {
              controller.pause();
            } else {
              controller.play();
            }
            setState(() {});
          },
        ),

        // Video progress bar
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: _VideoProgressBar(controller: controller),
        ),
      ],
    );
  }

  Widget _buildTopBar() {
    return Container(
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 8,
        left: 8,
        right: 8,
        bottom: 8,
      ),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.black.withOpacity(0.7),
            Colors.transparent,
          ],
        ),
      ),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.close, color: Colors.white),
            onPressed: () {
              HapticFeedback.lightImpact();
              Navigator.pop(context);
            },
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (widget.senderName != null)
                  Text(
                    widget.senderName!,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 16,
                    ),
                  ),
                Text(
                  _formatDate(_currentItem.createdAt),
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.7),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          if (widget.items.length > 1)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '${_currentIndex + 1} / ${widget.items.length}',
                style: const TextStyle(color: Colors.white, fontSize: 12),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildBottomBar() {
    return Container(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 16,
        bottom: MediaQuery.of(context).padding.bottom + 16,
      ),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.bottomCenter,
          end: Alignment.topCenter,
          colors: [
            Colors.black.withOpacity(0.7),
            Colors.transparent,
          ],
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _ActionButton(
            icon: Icons.share_rounded,
            label: 'Share',
            onTap: _shareMedia,
          ),
          _ActionButton(
            icon: Icons.download_rounded,
            label: 'Save',
            onTap: _saveMedia,
          ),
          _ActionButton(
            icon: Icons.forward_rounded,
            label: 'Forward',
            onTap: _forwardMedia,
          ),
        ],
      ),
    );
  }

  Widget _buildPageIndicator() {
    if (widget.items.length <= 10) {
      // Dot indicator for fewer items
      return Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(
          widget.items.length,
          (index) => AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            margin: const EdgeInsets.symmetric(horizontal: 3),
            width: index == _currentIndex ? 24 : 8,
            height: 8,
            decoration: BoxDecoration(
              color: index == _currentIndex
                  ? Colors.white
                  : Colors.white.withOpacity(0.4),
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        ),
      );
    } else {
      // Text indicator for many items
      return Center(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.black54,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Text(
            '${_currentIndex + 1} of ${widget.items.length}',
            style: const TextStyle(color: Colors.white),
          ),
        ),
      );
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inDays == 0) {
      return 'Today at ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
    } else if (diff.inDays == 1) {
      return 'Yesterday at ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }

  void _shareMedia() async {
    HapticFeedback.lightImpact();
    final item = _currentItem;
    
    try {
      await Share.share(
        item.url,
        subject: item.fileName ?? 'Shared media',
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to share: $e')),
        );
      }
    }
  }

  void _saveMedia() {
    HapticFeedback.mediumImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Saving ${_currentItem.fileName ?? "media"}...')),
    );
  }

  void _forwardMedia() {
    HapticFeedback.lightImpact();
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Forward feature coming soon')),
    );
  }
}

/// Video play/pause overlay button
class _VideoPlayOverlay extends StatelessWidget {
  final VideoPlayerController controller;
  final VoidCallback onTap;

  const _VideoPlayOverlay({
    required this.controller,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedOpacity(
        opacity: controller.value.isPlaying ? 0.0 : 1.0,
        duration: const Duration(milliseconds: 200),
        child: Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.5),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.play_arrow_rounded,
            color: Colors.white,
            size: 48,
          ),
        ),
      ),
    );
  }
}

/// Video progress bar
class _VideoProgressBar extends StatefulWidget {
  final VideoPlayerController controller;

  const _VideoProgressBar({required this.controller});

  @override
  State<_VideoProgressBar> createState() => _VideoProgressBarState();
}

class _VideoProgressBarState extends State<_VideoProgressBar> {
  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_onVideoUpdate);
  }

  @override
  void dispose() {
    widget.controller.removeListener(_onVideoUpdate);
    super.dispose();
  }

  void _onVideoUpdate() {
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final position = widget.controller.value.position;
    final duration = widget.controller.value.duration;
    final progress = duration.inMilliseconds > 0
        ? position.inMilliseconds / duration.inMilliseconds
        : 0.0;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.bottomCenter,
          end: Alignment.topCenter,
          colors: [
            Colors.black.withOpacity(0.5),
            Colors.transparent,
          ],
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(2),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: Colors.white.withOpacity(0.3),
              valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
              minHeight: 4,
            ),
          ),
          const SizedBox(height: 4),
          // Time labels
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _formatDuration(position),
                style: const TextStyle(color: Colors.white70, fontSize: 11),
              ),
              Text(
                _formatDuration(duration),
                style: const TextStyle(color: Colors.white70, fontSize: 11),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatDuration(Duration duration) {
    final minutes = duration.inMinutes.remainder(60).toString().padLeft(2, '0');
    final seconds = duration.inSeconds.remainder(60).toString().padLeft(2, '0');
    if (duration.inHours > 0) {
      final hours = duration.inHours.toString();
      return '$hours:$minutes:$seconds';
    }
    return '$minutes:$seconds';
  }
}

/// Action button for bottom bar
class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _ActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: Colors.white),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(color: Colors.white, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }
}

/// Error widget for failed media loading
class _MediaErrorWidget extends StatelessWidget {
  const _MediaErrorWidget();

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.broken_image, color: Colors.white54, size: 64),
        const SizedBox(height: 16),
        Text(
          'Failed to load media',
          style: TextStyle(color: Colors.white.withOpacity(0.7)),
        ),
      ],
    );
  }
}
