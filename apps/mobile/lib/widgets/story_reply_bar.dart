import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/services/video_story_service.dart';

/// Reply/reaction bar for video story viewer
/// Implements industry-standard Instagram-style reactions and replies
class StoryReplyBar extends StatefulWidget {
  final String storyId;
  final String? recipientName;
  final Function(String emoji)? onReaction;
  final Function(String message)? onReply;
  final VoidCallback? onDoubleTapLike;
  final bool isOwner;

  const StoryReplyBar({
    Key? key,
    required this.storyId,
    this.recipientName,
    this.onReaction,
    this.onReply,
    this.onDoubleTapLike,
    this.isOwner = false,
  }) : super(key: key);

  @override
  State<StoryReplyBar> createState() => _StoryReplyBarState();
}

class _StoryReplyBarState extends State<StoryReplyBar>
    with SingleTickerProviderStateMixin {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();
  bool _isExpanded = false;
  bool _isSending = false;
  late AnimationController _expandController;
  late Animation<double> _expandAnimation;

  @override
  void initState() {
    super.initState();
    _expandController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _expandAnimation = CurvedAnimation(
      parent: _expandController,
      curve: Curves.easeOutCubic,
    );
    
    _focusNode.addListener(_onFocusChange);
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    _expandController.dispose();
    super.dispose();
  }

  void _onFocusChange() {
    if (_focusNode.hasFocus) {
      _expandController.forward();
      setState(() => _isExpanded = true);
    } else if (_controller.text.isEmpty) {
      _expandController.reverse();
      setState(() => _isExpanded = false);
    }
  }

  void _onReaction(String emoji) {
    HapticFeedback.lightImpact();
    widget.onReaction?.call(emoji);
  }

  Future<void> _sendReply() async {
    final message = _controller.text.trim();
    if (message.isEmpty) return;

    setState(() => _isSending = true);
    HapticFeedback.mediumImpact();

    widget.onReply?.call(message);
    
    // Clear and unfocus
    _controller.clear();
    _focusNode.unfocus();
    
    setState(() {
      _isSending = false;
      _isExpanded = false;
    });
    _expandController.reverse();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.isOwner) {
      return const SizedBox.shrink(); // Owners don't see reply bar
    }

    return AnimatedBuilder(
      animation: _expandAnimation,
      builder: (context, child) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.bottomCenter,
              end: Alignment.topCenter,
              colors: [
                Colors.black.withOpacity(0.9),
                Colors.black.withOpacity(0.0),
              ],
              stops: const [0.0, 1.0],
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Quick reactions row
              if (!_isExpanded) _buildQuickReactions(),
              
              const SizedBox(height: 12),
              
              // Reply input
              _buildReplyInput(),
            ],
          ),
        );
      },
    );
  }

  Widget _buildQuickReactions() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: VideoStoryService.quickReactions.map((emoji) {
        return _ReactionButton(
          emoji: emoji,
          onTap: () => _onReaction(emoji),
        );
      }).toList(),
    );
  }

  Widget _buildReplyInput() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.15),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: Colors.white.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _controller,
              focusNode: _focusNode,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: widget.recipientName != null
                    ? 'Reply to ${widget.recipientName}...'
                    : 'Send a message...',
                hintStyle: TextStyle(
                  color: Colors.white.withOpacity(0.5),
                  fontSize: 14,
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                border: InputBorder.none,
              ),
              textCapitalization: TextCapitalization.sentences,
              onSubmitted: (_) => _sendReply(),
            ),
          ),
          // Send button (appears when typing)
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 150),
            child: _controller.text.isNotEmpty
                ? IconButton(
                    onPressed: _isSending ? null : _sendReply,
                    icon: _isSending
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Colors.purple, Colors.pink],
                              ),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Icon(
                              Icons.send_rounded,
                              color: Colors.white,
                              size: 18,
                            ),
                          ),
                  )
                : const SizedBox(width: 8),
          ),
        ],
      ),
    );
  }
}

/// Individual reaction button
class _ReactionButton extends StatefulWidget {
  final String emoji;
  final VoidCallback onTap;

  const _ReactionButton({
    required this.emoji,
    required this.onTap,
  });

  @override
  State<_ReactionButton> createState() => _ReactionButtonState();
}

class _ReactionButtonState extends State<_ReactionButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  bool _isPressed = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 150),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.3).animate(
      CurvedAnimation(parent: _controller, curve: Curves.elasticOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onTapDown(TapDownDetails _) {
    setState(() => _isPressed = true);
    _controller.forward();
  }

  void _onTapUp(TapUpDetails _) {
    setState(() => _isPressed = false);
    _controller.reverse();
    widget.onTap();
  }

  void _onTapCancel() {
    setState(() => _isPressed = false);
    _controller.reverse();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: _onTapDown,
      onTapUp: _onTapUp,
      onTapCancel: _onTapCancel,
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _scaleAnimation.value,
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: _isPressed
                    ? Colors.white.withOpacity(0.2)
                    : Colors.white.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  widget.emoji,
                  style: const TextStyle(fontSize: 22),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

/// Double tap like animation overlay
class DoubleTapLikeOverlay extends StatefulWidget {
  final VoidCallback? onComplete;

  const DoubleTapLikeOverlay({
    Key? key,
    this.onComplete,
  }) : super(key: key);

  @override
  State<DoubleTapLikeOverlay> createState() => _DoubleTapLikeOverlayState();
}

class _DoubleTapLikeOverlayState extends State<DoubleTapLikeOverlay>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _opacityAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween(begin: 0.0, end: 1.2).chain(CurveTween(curve: Curves.elasticOut)),
        weight: 50,
      ),
      TweenSequenceItem(
        tween: Tween(begin: 1.2, end: 1.0).chain(CurveTween(curve: Curves.easeOut)),
        weight: 25,
      ),
      TweenSequenceItem(
        tween: Tween(begin: 1.0, end: 0.0).chain(CurveTween(curve: Curves.easeIn)),
        weight: 25,
      ),
    ]).animate(_controller);

    _opacityAnimation = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 0.0, end: 1.0), weight: 30),
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.0), weight: 40),
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 0.0), weight: 30),
    ]).animate(_controller);

    _controller.forward().then((_) => widget.onComplete?.call());
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Opacity(
          opacity: _opacityAnimation.value,
          child: Transform.scale(
            scale: _scaleAnimation.value,
            child: const Icon(
              Icons.favorite,
              color: Colors.red,
              size: 100,
              shadows: [
                Shadow(
                  blurRadius: 20,
                  color: Colors.red,
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
