import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/models/chat_group.dart';
import 'package:thittam1hub/models/shared_post_attachment.dart';
import 'package:thittam1hub/models/forwarded_message_attachment.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/widgets/chat/voice_message_bubble.dart';
import 'package:thittam1hub/widgets/chat/shared_post_preview_card.dart';
import 'package:thittam1hub/widgets/link_preview_card.dart';
import 'package:thittam1hub/services/link_preview_service.dart';
import 'message_bubble_utils.dart';
import 'message_content_widgets.dart';
import 'message_status_widgets.dart';
import 'message_reactions_widgets.dart';

/// Industry-standard message bubble with swipe actions, reactions, and rich media
class EnhancedMessageBubble extends StatefulWidget {
  final Message message;
  final List<Map<String, dynamic>> reactions;
  final List<String> readBy;
  final bool showReadReceipts;
  final bool isStarred;
  final bool isPinned;
  final GroupMemberRole? senderRole;
  final LinkPreview? linkPreview;
  final Function(String emoji)? onReactionTap;
  final VoidCallback? onSwipeReply;
  final VoidCallback? onLongPress;
  final VoidCallback? onStar;
  final VoidCallback? onUnstar;
  final VoidCallback? onPin;
  final VoidCallback? onUnpin;
  final VoidCallback? onDelete;
  final VoidCallback? onDeleteForEveryone;

  const EnhancedMessageBubble({
    super.key,
    required this.message,
    this.reactions = const [],
    this.readBy = const [],
    this.showReadReceipts = true,
    this.isStarred = false,
    this.isPinned = false,
    this.senderRole,
    this.linkPreview,
    this.onReactionTap,
    this.onSwipeReply,
    this.onLongPress,
    this.onStar,
    this.onUnstar,
    this.onPin,
    this.onUnpin,
    this.onDelete,
    this.onDeleteForEveryone,
  });

  @override
  State<EnhancedMessageBubble> createState() => _EnhancedMessageBubbleState();
}

class _EnhancedMessageBubbleState extends State<EnhancedMessageBubble>
    with SingleTickerProviderStateMixin {
  double _dragOffset = 0.0;
  late final AnimationController _controller;
  late final Animation<double> _scaleAnimation;
  late final Animation<Offset> _slideAnimation;

  bool get isOwn => SupabaseConfig.auth.currentUser?.id == widget.message.senderId;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleHorizontalDragUpdate(DragUpdateDetails details) {
    setState(() {
      if (isOwn) {
        _dragOffset = (_dragOffset + details.delta.dx).clamp(-80.0, 0.0);
      } else {
        _dragOffset = (_dragOffset + details.delta.dx).clamp(0.0, 80.0);
      }
    });
  }

  void _handleHorizontalDragEnd(DragEndDetails details) {
    if (_dragOffset.abs() > 50) {
      HapticFeedback.lightImpact();
      widget.onSwipeReply?.call();
    }
    setState(() => _dragOffset = 0);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDeleted = widget.message.isDeleted;

    return SlideTransition(
      position: _slideAnimation,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: GestureDetector(
          onHorizontalDragUpdate: _handleHorizontalDragUpdate,
          onHorizontalDragEnd: _handleHorizontalDragEnd,
          onLongPress: () {
            HapticFeedback.mediumImpact();
            widget.onLongPress?.call();
          },
          child: Stack(
            children: [
              // Swipe action indicator
              if (_dragOffset != 0)
                Positioned.fill(
                  child: Align(
                    alignment: isOwn ? Alignment.centerRight : Alignment.centerLeft,
                    child: Padding(
                      padding: EdgeInsets.only(
                        left: isOwn ? 0 : 16,
                        right: isOwn ? 16 : 0,
                      ),
                      child: Icon(
                        Icons.reply,
                        color: cs.primary.withOpacity((_dragOffset.abs() / 80).clamp(0.3, 1.0)),
                      ),
                    ),
                  ),
                ),

              // Message content
              Transform.translate(
                offset: Offset(_dragOffset, 0),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  child: Row(
                    mainAxisAlignment: isOwn ? MainAxisAlignment.end : MainAxisAlignment.start,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      // Avatar (for non-own messages)
                      if (!isOwn) ...[
                        _buildAvatar(cs),
                        const SizedBox(width: 8),
                      ],

                      // Bubble
                      Flexible(
                        child: Column(
                          crossAxisAlignment: isOwn
                              ? CrossAxisAlignment.end
                              : CrossAxisAlignment.start,
                          children: [
                            // Sender name & role (for non-own messages)
                            if (!isOwn)
                              Padding(
                                padding: const EdgeInsets.only(left: 12, bottom: 4),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      widget.message.senderName,
                                      style: context.textStyles.labelSmall?.copyWith(
                                        fontWeight: FontWeight.w600,
                                        color: MessageBubbleUtils.nameColor(widget.message.senderName),
                                      ),
                                    ),
                                    if (widget.senderRole != null &&
                                        widget.senderRole != GroupMemberRole.member) ...[
                                      const SizedBox(width: 6),
                                      RoleBadge(role: widget.senderRole!),
                                    ],
                                  ],
                                ),
                              ),

                            // Message bubble
                            Container(
                              constraints: BoxConstraints(
                                maxWidth: MediaQuery.of(context).size.width * 0.75,
                              ),
                              decoration: BoxDecoration(
                                color: isOwn
                                    ? cs.primary.withOpacity(0.1)
                                    : cs.surfaceContainerHighest,
                                borderRadius: BorderRadius.only(
                                  topLeft: const Radius.circular(20),
                                  topRight: const Radius.circular(20),
                                  bottomLeft: Radius.circular(isOwn ? 20 : 6),
                                  bottomRight: Radius.circular(isOwn ? 6 : 20),
                                ),
                                border: Border.all(
                                  color: isOwn
                                      ? cs.primary.withOpacity(0.2)
                                      : cs.outline.withOpacity(0.2),
                                ),
                              ),
                              child: _buildContent(cs, isDeleted),
                            ),

                            // Link preview
                            if (widget.linkPreview != null)
                              Padding(
                                padding: const EdgeInsets.only(top: 8),
                                child: ConstrainedBox(
                                  constraints: BoxConstraints(
                                    maxWidth: MediaQuery.of(context).size.width * 0.75,
                                  ),
                                  child: LinkPreviewCard(preview: widget.linkPreview!),
                                ),
                              ),

                            // Reactions
                            if (widget.reactions.isNotEmpty)
                              Padding(
                                padding: EdgeInsets.only(
                                  top: 4,
                                  left: isOwn ? 0 : 8,
                                  right: isOwn ? 8 : 0,
                                ),
                                child: ReactionsBar(
                                  reactions: widget.reactions,
                                  onReaction: widget.onReactionTap,
                                ),
                              ),

                            // Status row (time, read receipts, indicators)
                            Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: MessageStatusRow(
                                message: widget.message,
                                isOwn: isOwn,
                                readBy: widget.readBy,
                                showReadReceipts: widget.showReadReceipts,
                                isStarred: widget.isStarred,
                                isPinned: widget.isPinned,
                              ),
                            ),
                          ],
                        ),
                      ),

                      if (isOwn) const SizedBox(width: 8),
                      if (isOwn) _buildAvatar(cs),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAvatar(ColorScheme cs) {
    final nameColor = MessageBubbleUtils.nameColor(widget.message.senderName);
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        color: nameColor.withOpacity(0.15),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Center(
        child: Text(
          widget.message.senderName.isNotEmpty
              ? widget.message.senderName[0].toUpperCase()
              : '?',
          style: TextStyle(
            color: nameColor,
            fontWeight: FontWeight.w600,
            fontSize: 14,
          ),
        ),
      ),
    );
  }

  Widget _buildContent(ColorScheme cs, bool isDeleted) {
    if (isDeleted) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.block, size: 16, color: cs.onSurfaceVariant),
            const SizedBox(width: 8),
            Text(
              'Message deleted',
              style: context.textStyles.bodyMedium?.copyWith(
                color: cs.onSurfaceVariant,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ),
      );
    }

    final content = widget.message.content;
    final textColor = cs.onSurface;

    // Check for forwarded message in raw attachments
    final forwardedMsg = _findForwardedMessage();
    if (forwardedMsg != null) {
      return ForwardedMessageContent(
        forwarded: forwardedMsg,
        additionalContent: content.contains('Forwarded from') ? null : content,
        isOwn: isOwn,
      );
    }

    // Check for shared post in raw attachments
    final sharedPost = _findSharedPost();
    if (sharedPost != null) {
      return Padding(
        padding: const EdgeInsets.all(8),
        child: SharedPostPreviewCard(
          post: sharedPost,
          isOwnMessage: isOwn,
        ),
      );
    }

    // Check for GIF
    if (content.contains('giphy.com') || content.endsWith('.gif')) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: CachedNetworkImage(
          imageUrl: content,
          width: 200,
          fit: BoxFit.cover,
          placeholder: (_, __) => Container(
            width: 200,
            height: 150,
            color: cs.surfaceContainerHighest,
            child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
          ),
          errorWidget: (_, __, ___) => Container(
            width: 200,
            height: 100,
            color: cs.surfaceContainerHighest,
            child: const Center(child: Icon(Icons.broken_image)),
          ),
        ),
      );
    }

    // Check for voice message
    if (widget.message.attachments.any((a) =>
        a.filename.endsWith('.m4a') || a.filename.endsWith('.wav'))) {
      final voiceAttachment = widget.message.attachments.first;
      return VoiceMessageBubble(
        audioUrl: voiceAttachment.url,
        durationSeconds: 30,
        isOwnMessage: isOwn,
      );
    }

    // Check for image
    if (widget.message.attachments.any((a) =>
        a.filename.endsWith('.jpg') ||
        a.filename.endsWith('.png') ||
        a.filename.endsWith('.jpeg'))) {
      return ImageContent(
        attachments: widget.message.attachments,
        caption: content.isNotEmpty ? content : null,
        isOwn: isOwn,
      );
    }

    // Regular text message
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      child: SelectableText(
        content,
        style: context.textStyles.bodyMedium?.copyWith(
          color: textColor,
          height: 1.4,
        ),
      ),
    );
  }

  /// Find shared post attachment from message's raw attachments
  SharedPostAttachment? _findSharedPost() {
    final rawAtts = widget.message.rawAttachments;
    if (rawAtts.isEmpty) return null;

    for (final att in rawAtts) {
      final parsed = SharedPostAttachment.tryParse(att);
      if (parsed != null) return parsed;
    }
    return null;
  }

  /// Find forwarded message metadata from raw attachments
  ForwardedMessageAttachment? _findForwardedMessage() {
    final rawAtts = widget.message.rawAttachments;
    if (rawAtts.isEmpty) return null;

    for (final att in rawAtts) {
      final parsed = ForwardedMessageAttachment.tryParse(att);
      if (parsed != null) return parsed;
    }
    return null;
  }
}
