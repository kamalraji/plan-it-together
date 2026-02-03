/// Floating Picture-in-Picture Player
/// 
/// A draggable, resizable floating video player that persists across
/// app navigation. Supports minimized and expanded states with smooth
/// animations and gesture controls.

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:youtube_player_iframe/youtube_player_iframe.dart';
import 'package:thittam1hub/services/pip_controller.dart';
import 'package:thittam1hub/services/live_stream_service.dart';
import 'package:thittam1hub/widgets/zone/stream_viewer_modal.dart';

/// Overlay widget that displays the floating PiP player
class FloatingPipOverlay extends StatelessWidget {
  final Widget child;

  const FloatingPipOverlay({
    super.key,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        child,
        const _FloatingPipPlayer(),
      ],
    );
  }
}

class _FloatingPipPlayer extends StatefulWidget {
  const _FloatingPipPlayer();

  @override
  State<_FloatingPipPlayer> createState() => _FloatingPipPlayerState();
}

class _FloatingPipPlayerState extends State<_FloatingPipPlayer>
    with SingleTickerProviderStateMixin {
  YoutubePlayerController? _playerController;
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;

  // Drag state
  Offset _dragOffset = Offset.zero;
  bool _isDragging = false;

  // Dimensions
  static const double _minimizedWidth = 160;
  static const double _minimizedHeight = 90;
  static const double _expandedWidth = 280;
  static const double _expandedHeight = 158;
  static const double _padding = 16;

  Timer? _viewerCountTimer;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOutBack),
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );
  }

  @override
  void dispose() {
    _viewerCountTimer?.cancel();
    _playerController?.close();
    _animationController.dispose();
    super.dispose();
  }

  void _initializePlayer(String videoId) {
    _playerController?.close();
    _playerController = YoutubePlayerController.fromVideoId(
      videoId: videoId,
      autoPlay: true,
      params: const YoutubePlayerParams(
        showControls: false,
        showFullscreenButton: false,
        mute: false,
        loop: false,
        enableKeyboard: false,
        playsInline: true,
      ),
    );
  }

  void _startViewerCountPolling(String streamId) {
    _viewerCountTimer?.cancel();
    _viewerCountTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) async {
        final result = await LiveStreamService.instance.getViewerCount(streamId);
        if (result.isSuccess && mounted) {
          PipController.instance.updateViewerCount(result.data);
        }
      },
    );
  }

  Offset _getPositionOffset(PipPosition position, Size screenSize, bool isExpanded) {
    final width = isExpanded ? _expandedWidth : _minimizedWidth;
    final height = isExpanded ? _expandedHeight : _minimizedHeight;

    switch (position) {
      case PipPosition.topLeft:
        return Offset(_padding, _padding + MediaQuery.of(context).padding.top);
      case PipPosition.topRight:
        return Offset(
          screenSize.width - width - _padding,
          _padding + MediaQuery.of(context).padding.top,
        );
      case PipPosition.bottomLeft:
        return Offset(
          _padding,
          screenSize.height - height - _padding - MediaQuery.of(context).padding.bottom,
        );
      case PipPosition.bottomRight:
        return Offset(
          screenSize.width - width - _padding,
          screenSize.height - height - _padding - MediaQuery.of(context).padding.bottom,
        );
    }
  }

  PipPosition _getNearestCorner(Offset position, Size screenSize) {
    final centerX = screenSize.width / 2;
    final centerY = screenSize.height / 2;

    if (position.dx < centerX) {
      return position.dy < centerY ? PipPosition.topLeft : PipPosition.bottomLeft;
    } else {
      return position.dy < centerY ? PipPosition.topRight : PipPosition.bottomRight;
    }
  }

  void _onPanUpdate(DragUpdateDetails details) {
    setState(() {
      _isDragging = true;
      _dragOffset += details.delta;
    });
  }

  void _onPanEnd(DragEndDetails details) {
    final screenSize = MediaQuery.of(context).size;
    final pip = PipController.instance;
    final isExpanded = pip.isExpanded;
    final width = isExpanded ? _expandedWidth : _minimizedWidth;
    final height = isExpanded ? _expandedHeight : _minimizedHeight;

    final baseOffset = _getPositionOffset(pip.position, screenSize, isExpanded);
    final currentPosition = baseOffset + _dragOffset;
    final center = Offset(
      currentPosition.dx + width / 2,
      currentPosition.dy + height / 2,
    );

    final nearestCorner = _getNearestCorner(center, screenSize);
    pip.setPosition(nearestCorner);

    setState(() {
      _isDragging = false;
      _dragOffset = Offset.zero;
    });

    HapticFeedback.lightImpact();
  }

  void _onTap() {
    HapticFeedback.selectionClick();
    PipController.instance.toggleSize();
  }

  void _onDoubleTap() {
    HapticFeedback.mediumImpact();
    final data = PipController.instance.goFullscreen();
    if (data != null && mounted) {
      StreamViewerModal.show(
        context,
        stream: data.$1,
        session: data.$2,
      );
    }
  }

  void _onClose() {
    HapticFeedback.mediumImpact();
    _animationController.reverse().then((_) {
      PipController.instance.close();
    });
  }

  void _onMuteToggle() {
    HapticFeedback.selectionClick();
    final pip = PipController.instance;
    pip.toggleMute();
    if (pip.isMuted) {
      _playerController?.mute();
    } else {
      _playerController?.unMute();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<PipController>(
      builder: (context, pip, _) {
        // Handle visibility animation
        if (pip.isActive && _animationController.status == AnimationStatus.dismissed) {
          _animationController.forward();
          if (pip.stream != null) {
            _initializePlayer(pip.stream!.videoId);
            _startViewerCountPolling(pip.stream!.id);
          }
        } else if (!pip.isActive && _animationController.status == AnimationStatus.completed) {
          _animationController.reverse();
          _viewerCountTimer?.cancel();
        }

        if (!pip.isActive && _animationController.status == AnimationStatus.dismissed) {
          return const SizedBox.shrink();
        }

        final screenSize = MediaQuery.of(context).size;
        final isExpanded = pip.isExpanded;
        final width = isExpanded ? _expandedWidth : _minimizedWidth;
        final height = isExpanded ? _expandedHeight : _minimizedHeight;

        final baseOffset = _getPositionOffset(pip.position, screenSize, isExpanded);
        final currentOffset = _isDragging ? baseOffset + _dragOffset : baseOffset;

        return AnimatedBuilder(
          animation: _animationController,
          builder: (context, child) {
            return Positioned(
              left: currentOffset.dx,
              top: currentOffset.dy,
              child: Transform.scale(
                scale: _scaleAnimation.value,
                child: Opacity(
                  opacity: _fadeAnimation.value,
                  child: child,
                ),
              ),
            );
          },
          child: GestureDetector(
            onPanUpdate: _onPanUpdate,
            onPanEnd: _onPanEnd,
            onTap: _onTap,
            onDoubleTap: _onDoubleTap,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeOutCubic,
              width: width,
              height: height,
              decoration: BoxDecoration(
                color: Colors.black,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.4),
                    blurRadius: 20,
                    spreadRadius: 2,
                    offset: const Offset(0, 4),
                  ),
                ],
                border: Border.all(
                  color: Colors.white.withOpacity(0.1),
                  width: 1,
                ),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    // Video Player
                    if (_playerController != null)
                      YoutubePlayer(
                        controller: _playerController!,
                        aspectRatio: 16 / 9,
                      )
                    else
                      Container(
                        color: Colors.black,
                        child: const Center(
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        ),
                      ),

                    // Controls Overlay
                    _buildControlsOverlay(pip, isExpanded),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildControlsOverlay(PipController pip, bool isExpanded) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.black.withOpacity(0.5),
            Colors.transparent,
            Colors.transparent,
            Colors.black.withOpacity(0.6),
          ],
          stops: const [0.0, 0.25, 0.75, 1.0],
        ),
      ),
      child: Stack(
        children: [
          // Live Badge
          Positioned(
            top: 6,
            left: 6,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.red,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 5,
                    height: 5,
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Text(
                    'LIVE',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Close Button
          Positioned(
            top: 4,
            right: 4,
            child: GestureDetector(
              onTap: _onClose,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.5),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.close_rounded,
                  color: Colors.white,
                  size: 14,
                ),
              ),
            ),
          ),

          // Bottom Controls (only in expanded mode)
          if (isExpanded)
            Positioned(
              bottom: 6,
              left: 6,
              right: 6,
              child: Row(
                children: [
                  // Session Title
                  Expanded(
                    child: Text(
                      pip.session?.title ?? 'Live Stream',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  
                  // Viewer Count
                  if (pip.viewerCount > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.5),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.visibility_rounded,
                            color: Colors.white70,
                            size: 10,
                          ),
                          const SizedBox(width: 3),
                          Text(
                            '${pip.viewerCount}',
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 10,
                            ),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(width: 6),
                  
                  // Mute Button
                  GestureDetector(
                    onTap: _onMuteToggle,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.5),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        pip.isMuted ? Icons.volume_off_rounded : Icons.volume_up_rounded,
                        color: Colors.white,
                        size: 14,
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  
                  // Fullscreen Button
                  GestureDetector(
                    onTap: _onDoubleTap,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.5),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.fullscreen_rounded,
                        color: Colors.white,
                        size: 14,
                      ),
                    ),
                  ),
                ],
              ),
            )
          else
            // Minimized: Just show mute icon
            Positioned(
              bottom: 4,
              right: 4,
              child: GestureDetector(
                onTap: _onMuteToggle,
                child: Container(
                  padding: const EdgeInsets.all(3),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.5),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    pip.isMuted ? Icons.volume_off_rounded : Icons.volume_up_rounded,
                    color: Colors.white,
                    size: 12,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
