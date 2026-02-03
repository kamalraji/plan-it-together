/// Stream Viewer Modal
/// 
/// Full-screen immersive viewing experience with:
/// - Draggable bottom sheet for stream info
/// - Swipe down to minimize
/// - Chat overlay toggle (future)
/// - Session materials quick access
/// - Related sessions carousel

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/live_stream.dart';
import 'package:thittam1hub/models/zone_models.dart';
import 'package:thittam1hub/services/live_stream_service.dart';
import 'package:thittam1hub/services/pip_controller.dart';
import 'package:thittam1hub/widgets/zone/youtube_live_player.dart';
import 'package:cached_network_image/cached_network_image.dart';

class StreamViewerModal extends StatefulWidget {
  final LiveStream stream;
  final EventSession session;

  const StreamViewerModal({
    super.key,
    required this.stream,
    required this.session,
  });

  /// Show the stream viewer modal
  static Future<void> show(
    BuildContext context, {
    required LiveStream stream,
    required EventSession session,
  }) async {
    // Enter immersive mode
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    
    await Navigator.of(context).push(
      PageRouteBuilder(
        opaque: false,
        barrierColor: Colors.black,
        barrierDismissible: false,
        pageBuilder: (context, animation, secondaryAnimation) {
          return StreamViewerModal(
            stream: stream,
            session: session,
          );
        },
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(
            opacity: animation,
            child: SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(0, 0.1),
                end: Offset.zero,
              ).animate(CurvedAnimation(
                parent: animation,
                curve: Curves.easeOutCubic,
              )),
              child: child,
            ),
          );
        },
      ),
    );

    // Restore system UI
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  }

  @override
  State<StreamViewerModal> createState() => _StreamViewerModalState();
}

class _StreamViewerModalState extends State<StreamViewerModal>
    with SingleTickerProviderStateMixin {
  late LiveStream _stream;
  late AnimationController _sheetController;
  final DraggableScrollableController _draggableController = DraggableScrollableController();
  bool _isInfoSheetExpanded = false;
  int _viewerCount = 0;
  Timer? _viewerCountTimer;
  StreamSubscription? _streamSub;

  @override
  void initState() {
    super.initState();
    _stream = widget.stream;
    _viewerCount = _stream.viewerCount;
    
    _sheetController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );

    _startViewerSession();
    _subscribeToUpdates();
  }

  @override
  void dispose() {
    _sheetController.dispose();
    _draggableController.dispose();
    _viewerCountTimer?.cancel();
    _streamSub?.cancel();
    LiveStreamService.instance.endViewerSession(_stream.id);
    super.dispose();
  }

  void _startViewerSession() {
    LiveStreamService.instance.startViewerSession(_stream.id);
  }

  void _subscribeToUpdates() {
    // Poll viewer count every 15 seconds
    _viewerCountTimer = Timer.periodic(const Duration(seconds: 15), (_) async {
      final result = await LiveStreamService.instance.getViewerCount(_stream.id);
      if (result.isSuccess && mounted) {
        setState(() => _viewerCount = result.data);
      }
    });

    // Subscribe to stream status changes
    _streamSub = LiveStreamService.instance
        .streamStatusUpdates(_stream.id)
        .listen((stream) {
          if (mounted) {
            setState(() => _stream = stream);
            if (stream.hasEnded) {
              _showStreamEndedDialog();
            }
          }
        });
  }

  void _showStreamEndedDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Stream Ended'),
        content: const Text('This live stream has ended.'),
        actions: [
          if (_stream.canPlayRecording)
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                // Navigate to recording playback
              },
              child: const Text('Watch Recording'),
            ),
          FilledButton(
            onPressed: () {
              Navigator.of(context).pop();
              Navigator.of(context).pop(); // Close modal
            },
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _close() {
    HapticFeedback.lightImpact();
    Navigator.of(context).pop();
  }

  void _minimizeToPip() {
    HapticFeedback.mediumImpact();
    // Start PiP with current stream
    PipController.instance.startPip(
      stream: _stream,
      session: widget.session,
    );
    // Close this modal
    Navigator.of(context).pop();
  }

  void _toggleInfoSheet() {
    HapticFeedback.selectionClick();
    setState(() => _isInfoSheetExpanded = !_isInfoSheetExpanded);
    
    if (_isInfoSheetExpanded) {
      _draggableController.animateTo(
        0.6,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOutCubic,
      );
    } else {
      _draggableController.animateTo(
        0.1,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOutCubic,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Video player (full screen)
          Positioned.fill(
            child: YouTubeLivePlayer(
              stream: _stream,
              autoplay: true,
              showViewerCount: true,
              onStreamEnd: () {
                // Handle stream end
              },
              onError: () {
                // Handle error
              },
            ),
          ),

          // Top bar with close button
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: Row(
                  children: [
                    // Close button
                    IconButton(
                      onPressed: _close,
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.black.withOpacity(0.5),
                      ),
                      icon: const Icon(
                        Icons.close_rounded,
                        color: Colors.white,
                      ),
                    ),
                    const Spacer(),
                    // PiP button
                    IconButton(
                      onPressed: _minimizeToPip,
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.black.withOpacity(0.5),
                      ),
                      tooltip: 'Picture-in-Picture',
                      icon: const Icon(
                        Icons.picture_in_picture_alt_rounded,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(width: 8),
                    // Share button
                    IconButton(
                      onPressed: () {
                        HapticFeedback.lightImpact();
                        // Share stream
                      },
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.black.withOpacity(0.5),
                      ),
                      icon: const Icon(
                        Icons.share_rounded,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(width: 8),
                    // Info toggle
                    IconButton(
                      onPressed: _toggleInfoSheet,
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.black.withOpacity(0.5),
                      ),
                      icon: const Icon(
                        Icons.info_outline_rounded,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Bottom sheet with session info
          DraggableScrollableSheet(
            controller: _draggableController,
            initialChildSize: 0.1,
            minChildSize: 0.1,
            maxChildSize: 0.7,
            snap: true,
            snapSizes: const [0.1, 0.4, 0.7],
            builder: (context, scrollController) {
              return Container(
                decoration: BoxDecoration(
                  color: cs.surface,
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(20),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.3),
                      blurRadius: 20,
                      offset: const Offset(0, -5),
                    ),
                  ],
                ),
                child: ListView(
                  controller: scrollController,
                  padding: EdgeInsets.zero,
                  children: [
                    // Handle
                    Center(
                      child: Container(
                        margin: const EdgeInsets.only(top: 12, bottom: 8),
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: cs.onSurfaceVariant.withOpacity(0.4),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),

                    // Quick info (always visible)
                    _buildQuickInfo(cs, tt),

                    // Expanded content
                    _buildExpandedContent(cs, tt),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildQuickInfo(ColorScheme cs, TextTheme tt) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Row(
        children: [
          // Session title
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.session.title,
                  style: tt.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    if (_stream.isLive) ...[
                      Container(
                        width: 6,
                        height: 6,
                        decoration: const BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'LIVE',
                        style: tt.bodySmall?.copyWith(
                          color: Colors.red,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(width: 12),
                    ],
                    Icon(
                      Icons.visibility_rounded,
                      size: 14,
                      color: cs.onSurfaceVariant,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '$_viewerCount watching',
                      style: tt.bodySmall?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Expand indicator
          Icon(
            Icons.keyboard_arrow_up_rounded,
            color: cs.onSurfaceVariant,
          ),
        ],
      ),
    );
  }

  Widget _buildExpandedContent(ColorScheme cs, TextTheme tt) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Divider(height: 24),

        // Speaker info
        if (widget.session.speakerName != null)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: cs.primaryContainer,
                  backgroundImage: widget.session.speakerAvatar != null
                    ? CachedNetworkImageProvider(widget.session.speakerAvatar!)
                    : null,
                  child: widget.session.speakerAvatar == null
                    ? Text(
                        widget.session.speakerName![0].toUpperCase(),
                        style: TextStyle(
                          fontSize: 18,
                          color: cs.onPrimaryContainer,
                          fontWeight: FontWeight.w600,
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
                        widget.session.speakerName!,
                        style: tt.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (widget.session.room != null)
                        Text(
                          widget.session.room!,
                          style: tt.bodySmall?.copyWith(
                            color: cs.onSurfaceVariant,
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),

        const SizedBox(height: 16),

        // Description
        if (widget.session.description != null)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'About this session',
                  style: tt.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  widget.session.description!,
                  style: tt.bodyMedium?.copyWith(
                    color: cs.onSurfaceVariant,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),

        const SizedBox(height: 24),

        // Action buttons
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    // Open Q&A
                  },
                  icon: const Icon(Icons.question_answer_rounded),
                  label: const Text('Ask Question'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    // Open materials
                  },
                  icon: const Icon(Icons.folder_rounded),
                  label: const Text('Materials'),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 32),
      ],
    );
  }
}
