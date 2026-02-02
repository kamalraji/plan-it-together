import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/models/circle.dart';
import 'package:thittam1hub/models/enhanced_circle_message.dart';
import 'package:thittam1hub/models/circle_message_attachment.dart';
import 'package:thittam1hub/pages/impact/circle_chat_controller.dart';
import 'package:thittam1hub/pages/chat/widgets/glass_composer.dart';
import 'package:thittam1hub/supabase/circle_service.dart';
import 'package:thittam1hub/widgets/circle/enhanced_circle_message_bubble.dart';
import 'package:thittam1hub/widgets/circle/circle_shimmer.dart';

/// Enhanced Circle Chat Page with real-time messaging, reactions, 
/// swipe-to-reply, file attachments, and GlassComposer.
class CircleChatPage extends StatefulWidget {
  final String circleId;
  final Circle? circle;

  const CircleChatPage({
    super.key,
    required this.circleId,
    this.circle,
  });

  @override
  State<CircleChatPage> createState() => _CircleChatPageState();
}

class _CircleChatPageState extends State<CircleChatPage>
    with TickerProviderStateMixin {
  late final CircleChatController _controller;
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _focusNode = FocusNode();

  Circle? _circle;
  bool _isLoadingCircle = true;
  bool _isSending = false;
  bool _showAttachments = false;
  List<CircleMessageAttachment> _pendingAttachments = [];

  // Swipe-to-reply tracking
  final Map<String, double> _swipeOffsets = {};
  static const double _swipeThreshold = 60.0;

  // Typing debounce
  Timer? _typingDebounce;

  @override
  void initState() {
    super.initState();
    _controller = CircleChatController(circleId: widget.circleId);
    _controller.addListener(_onControllerChanged);
    _circle = widget.circle;

    if (_circle == null) {
      _loadCircle();
    } else {
      _isLoadingCircle = false;
    }

    // Mark as read when opening
    _controller.markAsRead();
  }

  void _onControllerChanged() {
    if (mounted) setState(() {});
  }

  Future<void> _loadCircle() async {
    final circle = await CircleService().getCircleById(widget.circleId);
    if (mounted) {
      setState(() {
        _circle = circle;
        _isLoadingCircle = false;
      });
    }
  }

  Future<void> _sendMessage() async {
    final content = _messageController.text.trim();
    if (content.isEmpty && _pendingAttachments.isEmpty) return;

    setState(() => _isSending = true);
    _messageController.clear();
    HapticFeedback.lightImpact();

    final attachments = List<CircleMessageAttachment>.from(_pendingAttachments);
    _pendingAttachments.clear();

    final result = await _controller.sendMessage(
      content,
      attachments: attachments.isNotEmpty ? attachments : null,
    );

    setState(() => _isSending = false);

    if (result is CircleSendFailed && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to send: ${result.error}'),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
    }
  }

  void _onReplyMessage(EnhancedCircleMessage message) {
    _controller.setReplyingTo(message);
    _focusNode.requestFocus();
    HapticFeedback.selectionClick();
  }

  void _onReactMessage(EnhancedCircleMessage message, String emoji) {
    _controller.toggleReaction(message.id, emoji);
    HapticFeedback.lightImpact();
  }

  void _onTypingChanged(String text) {
    _typingDebounce?.cancel();
    _controller.sendTypingIndicator(text.isNotEmpty);
    
    // Stop typing after 3 seconds of inactivity
    _typingDebounce = Timer(const Duration(seconds: 3), () {
      _controller.sendTypingIndicator(false);
    });
  }

  void _toggleAttachments() {
    setState(() => _showAttachments = !_showAttachments);
    HapticFeedback.selectionClick();
  }

  Future<void> _onPhotoTap() async {
    setState(() => _showAttachments = false);
    // TODO: Implement image picker
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Photo picker coming soon')),
    );
  }

  Future<void> _onGifTap() async {
    setState(() => _showAttachments = false);
    // TODO: Show GIF picker sheet
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('GIF picker coming soon')),
    );
  }

  Future<void> _onFileTap() async {
    setState(() => _showAttachments = false);
    // TODO: Implement file picker
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('File picker coming soon')),
    );
  }

  void _onEmojiTap() {
    // TODO: Show emoji picker
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Emoji picker coming soon')),
    );
  }

  @override
  void dispose() {
    _typingDebounce?.cancel();
    _controller.sendTypingIndicator(false);
    _controller.removeListener(_onControllerChanged);
    _controller.dispose();
    _messageController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    if (_isLoadingCircle) {
      return Scaffold(
        appBar: AppBar(title: const Text('Loading...')),
        body: const CircleChatShimmer(),
      );
    }

    return Scaffold(
      appBar: _buildAppBar(cs, textTheme),
      body: Column(
        children: [
          // Messages list
          Expanded(
            child: StreamBuilder<List<EnhancedCircleMessage>>(
              stream: _controller.messageStream,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const CircleChatShimmer();
                }

                if (snapshot.hasError) {
                  return _buildErrorState(cs, textTheme);
                }

                final messages = snapshot.data ?? [];
                if (messages.isEmpty) {
                  return _buildEmptyState(cs, textTheme);
                }

                final items = _controller.buildMessageList(messages);
                return _buildMessageList(items, cs, textTheme);
              },
            ),
          ),

          // Reply indicator
          if (_controller.replyingTo != null)
            _ReplyIndicatorBar(
              replyTo: _controller.replyingTo!,
              onCancel: _controller.cancelReply,
            ),

          // Pending attachments preview
          if (_pendingAttachments.isNotEmpty)
            _AttachmentsPreview(
              attachments: _pendingAttachments,
              onRemove: (index) {
                setState(() => _pendingAttachments.removeAt(index));
              },
            ),

          // Typing indicator
          if (_controller.typingUsers.isNotEmpty)
            _TypingIndicatorBar(count: _controller.typingUsers.length),

          // Glass composer
          GlassComposer(
            controller: _messageController,
            focusNode: _focusNode,
            hintLabel: _circle?.name ?? 'circle',
            onSend: _sendMessage,
            onChanged: _onTypingChanged,
            sending: _isSending,
            showAttachments: _showAttachments,
            onToggleAttachments: _toggleAttachments,
            onEmojiTap: _onEmojiTap,
            onGifTap: _onGifTap,
            onPhotoTap: _onPhotoTap,
            onFileTap: _onFileTap,
          ),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(ColorScheme cs, TextTheme textTheme) {
    return AppBar(
      title: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: () => context.push('/circles/${widget.circleId}', extra: _circle),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Hero(
              tag: 'circle_icon_${widget.circleId}',
              child: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: cs.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                alignment: Alignment.center,
                child: Text(
                  _circle?.icon ?? '💬',
                  style: const TextStyle(fontSize: 18),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Flexible(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    _circle?.name ?? 'Circle',
                    style: textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  Row(
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(
                          color: Colors.green,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${_circle?.memberCount ?? 0} members',
                        style: textTheme.bodySmall?.copyWith(
                          color: cs.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.search),
          onPressed: () {
            // TODO: Show message search
          },
        ),
        IconButton(
          icon: const Icon(Icons.more_vert),
          onPressed: () => context.push(
            '/circles/${widget.circleId}',
            extra: _circle,
          ),
        ),
      ],
    );
  }

  Widget _buildMessageList(
    List<dynamic> items,
    ColorScheme cs,
    TextTheme textTheme,
  ) {
    return ListView.builder(
      controller: _scrollController,
      reverse: true,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[items.length - 1 - index]; // Reverse for bottom-up

        if (item is CircleDateSeparator) {
          return _DateSeparator(date: item.date);
        }

        final message = item as EnhancedCircleMessage;
        final isMe = message.userId == _controller.currentUserId;

        return _SwipeableMessageBubble(
          key: ValueKey(message.id),
          message: message,
          isMe: isMe,
          swipeOffset: _swipeOffsets[message.id] ?? 0,
          onSwipeUpdate: (offset) {
            setState(() => _swipeOffsets[message.id] = offset);
          },
          onSwipeComplete: () {
            _swipeOffsets[message.id] = 0;
            _onReplyMessage(message);
          },
          child: EnhancedCircleMessageBubble(
            message: message,
            isMe: isMe,
            reactions: _controller.reactions[message.id] ?? [],
            onReply: () => _onReplyMessage(message),
            onReact: (emoji) => _onReactMessage(message, emoji),
            onEdit: isMe ? () => _showEditDialog(message) : null,
            onDelete: isMe ? () => _showDeleteDialog(message) : null,
            onReactionTap: (emoji) => _controller.toggleReaction(message.id, emoji),
          ),
        );
      },
    );
  }

  Widget _buildEmptyState(ColorScheme cs, TextTheme textTheme) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    cs.primary.withValues(alpha: 0.2),
                    cs.secondary.withValues(alpha: 0.1),
                  ],
                ),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.chat_bubble_outline_rounded,
                size: 48,
                color: cs.primary,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Start the conversation',
              style: textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Be the first to send a message in this circle',
              style: textTheme.bodyMedium?.copyWith(
                color: cs.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: () => _focusNode.requestFocus(),
              icon: const Icon(Icons.edit, size: 18),
              label: const Text('Write a message'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(ColorScheme cs, TextTheme textTheme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 48, color: cs.error),
          const SizedBox(height: 16),
          Text('Error loading messages', style: textTheme.titleMedium),
          const SizedBox(height: 8),
          TextButton.icon(
            onPressed: () => setState(() {}),
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  void _showEditDialog(EnhancedCircleMessage message) {
    final controller = TextEditingController(text: message.content);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Edit Message'),
        content: TextField(
          controller: controller,
          autofocus: true,
          maxLines: null,
          decoration: const InputDecoration(
            hintText: 'Enter new message...',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              final newContent = controller.text.trim();
              if (newContent.isNotEmpty && newContent != message.content) {
                await _controller.editMessage(message.id, newContent);
              }
              if (mounted) Navigator.pop(context);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showDeleteDialog(EnhancedCircleMessage message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Message'),
        content: const Text(
          'This message will be deleted for everyone in this circle.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              await _controller.deleteMessage(message.id, forEveryone: true);
              if (mounted) Navigator.pop(context);
            },
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}

/// Swipeable message bubble with reply gesture
class _SwipeableMessageBubble extends StatelessWidget {
  final EnhancedCircleMessage message;
  final bool isMe;
  final double swipeOffset;
  final ValueChanged<double> onSwipeUpdate;
  final VoidCallback onSwipeComplete;
  final Widget child;

  const _SwipeableMessageBubble({
    super.key,
    required this.message,
    required this.isMe,
    required this.swipeOffset,
    required this.onSwipeUpdate,
    required this.onSwipeComplete,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final direction = isMe ? -1.0 : 1.0;
    final showReplyIcon = swipeOffset.abs() > 20;

    return GestureDetector(
      onHorizontalDragUpdate: (details) {
        final newOffset = (swipeOffset + details.delta.dx * direction)
            .clamp(0.0, 80.0);
        onSwipeUpdate(newOffset);
      },
      onHorizontalDragEnd: (details) {
        if (swipeOffset > 60) {
          onSwipeComplete();
        }
        onSwipeUpdate(0);
      },
      child: Stack(
        alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
        children: [
          // Reply icon behind
          if (showReplyIcon)
            Positioned(
              left: isMe ? null : 4,
              right: isMe ? 4 : null,
              child: AnimatedOpacity(
                opacity: (swipeOffset / 60).clamp(0.0, 1.0),
                duration: const Duration(milliseconds: 100),
                child: Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: cs.primary.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.reply,
                    size: 18,
                    color: cs.primary,
                  ),
                ),
              ),
            ),

          // Message bubble
          Transform.translate(
            offset: Offset(swipeOffset * direction, 0),
            child: child,
          ),
        ],
      ),
    );
  }
}

/// Reply indicator bar
class _ReplyIndicatorBar extends StatelessWidget {
  final EnhancedCircleMessage replyTo;
  final VoidCallback onCancel;

  const _ReplyIndicatorBar({
    required this.replyTo,
    required this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest,
        border: Border(
          top: BorderSide(color: cs.outline.withValues(alpha: 0.2)),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 44,
            decoration: BoxDecoration(
              color: cs.primary,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Icon(Icons.reply, size: 14, color: cs.primary),
                    const SizedBox(width: 4),
                    Text(
                      'Replying to ${replyTo.senderName ?? 'Unknown'}',
                      style: textTheme.labelSmall?.copyWith(
                        color: cs.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  replyTo.content,
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
            icon: Icon(Icons.close, size: 20, color: cs.onSurfaceVariant),
            onPressed: onCancel,
            visualDensity: VisualDensity.compact,
          ),
        ],
      ),
    );
  }
}

/// Attachments preview bar
class _AttachmentsPreview extends StatelessWidget {
  final List<CircleMessageAttachment> attachments;
  final ValueChanged<int> onRemove;

  const _AttachmentsPreview({
    required this.attachments,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      height: 80,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest,
        border: Border(
          top: BorderSide(color: cs.outline.withValues(alpha: 0.2)),
        ),
      ),
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: attachments.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final attachment = attachments[index];
          return Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: cs.surfaceContainerHigh,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: cs.outline.withValues(alpha: 0.3),
                  ),
                ),
                child: attachment.isImage
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(7),
                        child: Image.network(
                          attachment.url,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) =>
                              const Icon(Icons.broken_image),
                        ),
                      )
                    : Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.insert_drive_file,
                            color: cs.primary,
                          ),
                          Text(
                            attachment.extension,
                            style: TextStyle(
                              fontSize: 10,
                              color: cs.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
              ),
              Positioned(
                top: -6,
                right: -6,
                child: GestureDetector(
                  onTap: () => onRemove(index),
                  child: Container(
                    width: 20,
                    height: 20,
                    decoration: BoxDecoration(
                      color: cs.error,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.close,
                      size: 12,
                      color: cs.onError,
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

/// Typing indicator bar
class _TypingIndicatorBar extends StatelessWidget {
  final int count;

  const _TypingIndicatorBar({required this.count});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final text = count == 1
        ? 'Someone is typing...'
        : '$count people are typing...';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _TypingDots(),
          const SizedBox(width: 8),
          Text(
            text,
            style: textTheme.bodySmall?.copyWith(
              color: cs.onSurfaceVariant,
              fontStyle: FontStyle.italic,
            ),
          ),
        ],
      ),
    );
  }
}

/// Date separator widget
class _DateSeparator extends StatelessWidget {
  final DateTime date;

  const _DateSeparator({required this.date});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final messageDate = DateTime(date.year, date.month, date.day);

    String label;
    if (messageDate == today) {
      label = 'Today';
    } else if (messageDate == yesterday) {
      label = 'Yesterday';
    } else {
      label = '${date.day}/${date.month}/${date.year}';
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        children: [
          Expanded(child: Divider(color: cs.outlineVariant)),
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: cs.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              label,
              style: textTheme.labelSmall?.copyWith(
                color: cs.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(child: Divider(color: cs.outlineVariant)),
        ],
      ),
    );
  }
}

/// Typing indicator dots animation
class _TypingDots extends StatefulWidget {
  @override
  State<_TypingDots> createState() => _TypingDotsState();
}

class _TypingDotsState extends State<_TypingDots>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(3, (index) {
            final delay = index * 0.2;
            final animValue = ((_controller.value - delay) % 1.0);
            final scale = animValue < 0.5 
                ? 1.0 + animValue * 0.6 
                : 1.3 - (animValue - 0.5) * 0.6;
            final opacity = animValue < 0.5 
                ? 0.4 + animValue * 1.2 
                : 1.0 - (animValue - 0.5) * 1.2;

            return Transform.scale(
              scale: scale,
              child: Container(
                width: 6,
                height: 6,
                margin: const EdgeInsets.symmetric(horizontal: 2),
                decoration: BoxDecoration(
                  color: cs.primary.withValues(alpha: opacity.clamp(0.3, 1.0)),
                  shape: BoxShape.circle,
                ),
              ),
            );
          }),
        );
      },
    );
  }
}
