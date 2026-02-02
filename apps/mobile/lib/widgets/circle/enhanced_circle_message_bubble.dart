import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/enhanced_circle_message.dart';
import 'package:thittam1hub/models/circle_message_reaction.dart';
import 'package:thittam1hub/models/circle_message_attachment.dart';
import 'package:thittam1hub/widgets/styled_avatar.dart';

/// Enhanced message bubble for Circle chat with reactions, attachments, and gestures.
class EnhancedCircleMessageBubble extends StatefulWidget {
  final EnhancedCircleMessage message;
  final bool isMe;
  final bool showSenderInfo;
  final List<GroupedCircleReaction> reactions;
  final VoidCallback? onReply;
  final Function(String emoji)? onReact;
  final VoidCallback? onDelete;
  final VoidCallback? onEdit;
  final Function(String emoji)? onReactionTap;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;

  const EnhancedCircleMessageBubble({
    super.key,
    required this.message,
    required this.isMe,
    this.showSenderInfo = true,
    this.reactions = const [],
    this.onReply,
    this.onReact,
    this.onDelete,
    this.onEdit,
    this.onReactionTap,
    this.onTap,
    this.onLongPress,
  });

  @override
  State<EnhancedCircleMessageBubble> createState() =>
      _EnhancedCircleMessageBubbleState();
}

class _EnhancedCircleMessageBubbleState
    extends State<EnhancedCircleMessageBubble>
    with SingleTickerProviderStateMixin {
  bool _showReactionPicker = false;
  late AnimationController _scaleController;
  late Animation<double> _scaleAnimation;

  static const _quickReactions = ['❤️', '👍', '😂', '😮', '😢', '🔥'];

  @override
  void initState() {
    super.initState();
    _scaleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 150),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: _scaleController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _scaleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final message = widget.message;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2, horizontal: 8),
      child: Row(
        mainAxisAlignment:
            widget.isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // Avatar (not for own messages)
          if (!widget.isMe && widget.showSenderInfo) ...[
            StyledAvatar(
              size: 32,
              name: message.senderName,
              imageUrl: message.senderAvatar,
            ),
            const SizedBox(width: 8),
          ] else if (!widget.isMe) ...[
            const SizedBox(width: 40),
          ],

          // Message content
          Flexible(
            child: Column(
              crossAxisAlignment: widget.isMe
                  ? CrossAxisAlignment.end
                  : CrossAxisAlignment.start,
              children: [
                // Sender name and role badge
                if (!widget.isMe && widget.showSenderInfo)
                  _SenderInfoRow(
                    senderName: message.senderName,
                    isAdmin: message.isSenderAdmin,
                    isModerator: message.isSenderModerator,
                  ),

                // Reply preview
                if (message.replyTo != null)
                  _ReplyPreview(
                    replyTo: message.replyTo!,
                    isMe: widget.isMe,
                  ),

                // Message bubble with gesture
                GestureDetector(
                  onTap: () {
                    if (_showReactionPicker) {
                      setState(() => _showReactionPicker = false);
                    } else {
                      widget.onTap?.call();
                    }
                  },
                  onLongPressStart: (_) {
                    _scaleController.forward();
                  },
                  onLongPressEnd: (_) {
                    _scaleController.reverse();
                    HapticFeedback.mediumImpact();
                    setState(() => _showReactionPicker = true);
                    widget.onLongPress?.call();
                  },
                  onLongPressCancel: () {
                    _scaleController.reverse();
                  },
                  child: ScaleTransition(
                    scale: _scaleAnimation,
                    child: _MessageBubbleContent(
                      message: message,
                      isMe: widget.isMe,
                    ),
                  ),
                ),

                // Reactions row
                if (widget.reactions.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: _ReactionsRow(
                      reactions: widget.reactions,
                      onTap: widget.onReactionTap,
                    ),
                  ),

                // Quick reaction picker
                if (_showReactionPicker)
                  _QuickReactionPicker(
                    reactions: _quickReactions,
                    onSelect: (emoji) {
                      setState(() => _showReactionPicker = false);
                      widget.onReactionTap?.call(emoji);
                    },
                    onDismiss: () {
                      setState(() => _showReactionPicker = false);
                    },
                    onReply: widget.onReply,
                    onEdit: widget.onEdit,
                    onDelete: widget.onDelete,
                    isMe: widget.isMe,
                  ),
              ],
            ),
          ),

          if (widget.isMe) const SizedBox(width: 8),
        ],
      ),
    );
  }
}

/// Sender info row with name and role badge
class _SenderInfoRow extends StatelessWidget {
  final String? senderName;
  final bool isAdmin;
  final bool isModerator;

  const _SenderInfoRow({
    required this.senderName,
    required this.isAdmin,
    required this.isModerator,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.only(bottom: 2, left: 12),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            senderName ?? 'Unknown',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: cs.onSurfaceVariant,
            ),
          ),
          if (isAdmin || isModerator)
            Container(
              margin: const EdgeInsets.only(left: 6),
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
              decoration: BoxDecoration(
                color: isAdmin
                    ? cs.primaryContainer
                    : cs.secondaryContainer,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                isAdmin ? 'ADMIN' : 'MOD',
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                  color: isAdmin
                      ? cs.onPrimaryContainer
                      : cs.onSecondaryContainer,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Message bubble content
class _MessageBubbleContent extends StatelessWidget {
  final EnhancedCircleMessage message;
  final bool isMe;

  const _MessageBubbleContent({
    required this.message,
    required this.isMe,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      constraints: BoxConstraints(
        maxWidth: MediaQuery.of(context).size.width * 0.75,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isMe ? cs.primary : cs.surfaceContainerHighest,
        borderRadius: BorderRadius.only(
          topLeft: const Radius.circular(18),
          topRight: const Radius.circular(18),
          bottomLeft: Radius.circular(isMe ? 18 : 4),
          bottomRight: Radius.circular(isMe ? 4 : 18),
        ),
        boxShadow: [
          BoxShadow(
            color: cs.shadow.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Attachments grid
          if (message.hasAttachments)
            _AttachmentsGrid(
              attachments: message.attachments,
              isMe: isMe,
            ),

          // Text content
          if (message.content.isNotEmpty)
            SelectableText(
              message.displayContent,
              style: TextStyle(
                color: isMe ? cs.onPrimary : cs.onSurface,
                fontStyle: message.isDeleted ? FontStyle.italic : FontStyle.normal,
                height: 1.3,
              ),
            ),

          // Timestamp and edited indicator
          const SizedBox(height: 4),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (message.isEdited)
                Padding(
                  padding: const EdgeInsets.only(right: 4),
                  child: Text(
                    'edited',
                    style: TextStyle(
                      fontSize: 10,
                      fontStyle: FontStyle.italic,
                      color: (isMe ? cs.onPrimary : cs.onSurfaceVariant)
                          .withValues(alpha: 0.6),
                    ),
                  ),
                ),
              Text(
                _formatTime(message.createdAt),
                style: TextStyle(
                  fontSize: 10,
                  color: (isMe ? cs.onPrimary : cs.onSurfaceVariant)
                      .withValues(alpha: 0.6),
                ),
              ),
              if (isMe) ...[
                const SizedBox(width: 4),
                Icon(
                  Icons.done_all,
                  size: 12,
                  color: cs.onPrimary.withValues(alpha: 0.7),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime dateTime) {
    final hour = dateTime.hour.toString().padLeft(2, '0');
    final minute = dateTime.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }
}

/// Reply preview widget
class _ReplyPreview extends StatelessWidget {
  final EnhancedCircleMessage replyTo;
  final bool isMe;

  const _ReplyPreview({
    required this.replyTo,
    required this.isMe,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(8),
        border: Border(
          left: BorderSide(color: cs.primary, width: 3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            replyTo.senderName ?? 'Unknown',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: cs.primary,
            ),
          ),
          Text(
            replyTo.content,
            style: TextStyle(
              fontSize: 12,
              color: cs.onSurfaceVariant,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

/// Attachments grid for images/files
class _AttachmentsGrid extends StatelessWidget {
  final List<CircleMessageAttachment> attachments;
  final bool isMe;

  const _AttachmentsGrid({
    required this.attachments,
    required this.isMe,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final imageAttachments = attachments.where((a) => a.isImage).toList();
    final fileAttachments = attachments.where((a) => !a.isImage).toList();

    return Column(
      children: [
        // Image grid
        if (imageAttachments.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: _buildImageGrid(imageAttachments, cs),
            ),
          ),

        // File attachments
        for (final file in fileAttachments)
          Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: cs.surfaceContainerHigh,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  _getFileIcon(file.mimeType),
                  size: 24,
                  color: cs.primary,
                ),
                const SizedBox(width: 8),
                Flexible(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        file.filename,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: cs.onSurface,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        file.formattedSize,
                        style: TextStyle(
                          fontSize: 11,
                          color: cs.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildImageGrid(
    List<CircleMessageAttachment> images,
    ColorScheme cs,
  ) {
    if (images.length == 1) {
      return _buildImageTile(images.first);
    }

    if (images.length == 2) {
      return Row(
        children: [
          Expanded(child: _buildImageTile(images[0])),
          const SizedBox(width: 2),
          Expanded(child: _buildImageTile(images[1])),
        ],
      );
    }

    // 3+ images: 2x2 grid with overflow indicator
    return SizedBox(
      height: 180,
      child: Row(
        children: [
          Expanded(child: _buildImageTile(images[0])),
          const SizedBox(width: 2),
          Expanded(
            child: Column(
              children: [
                Expanded(child: _buildImageTile(images[1])),
                const SizedBox(height: 2),
                Expanded(
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      _buildImageTile(images[2]),
                      if (images.length > 3)
                        Container(
                          color: Colors.black54,
                          alignment: Alignment.center,
                          child: Text(
                            '+${images.length - 3}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildImageTile(CircleMessageAttachment attachment) {
    return Image.network(
      attachment.url,
      fit: BoxFit.cover,
      width: double.infinity,
      height: double.infinity,
      errorBuilder: (_, __, ___) => Container(
        color: Colors.grey[300],
        child: const Icon(Icons.broken_image),
      ),
    );
  }

  IconData _getFileIcon(String mimeType) {
    if (mimeType.startsWith('audio/')) return Icons.audio_file;
    if (mimeType.startsWith('video/')) return Icons.video_file;
    if (mimeType.contains('pdf')) return Icons.picture_as_pdf;
    if (mimeType.contains('word') || mimeType.contains('document')) {
      return Icons.description;
    }
    if (mimeType.contains('sheet') || mimeType.contains('excel')) {
      return Icons.table_chart;
    }
    return Icons.insert_drive_file;
  }
}

/// Reactions row with emoji counts
class _ReactionsRow extends StatelessWidget {
  final List<GroupedCircleReaction> reactions;
  final Function(String emoji)? onTap;

  const _ReactionsRow({
    required this.reactions,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Wrap(
      spacing: 4,
      runSpacing: 4,
      children: reactions.take(6).map((reaction) {
        return GestureDetector(
          onTap: () => onTap?.call(reaction.emoji),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: reaction.reactedByMe
                  ? cs.primaryContainer
                  : cs.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(12),
              border: reaction.reactedByMe
                  ? Border.all(color: cs.primary, width: 1.5)
                  : Border.all(color: cs.outline.withValues(alpha: 0.3)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(reaction.emoji, style: const TextStyle(fontSize: 13)),
                if (reaction.count > 1) ...[
                  const SizedBox(width: 3),
                  Text(
                    '${reaction.count}',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: reaction.reactedByMe
                          ? cs.primary
                          : cs.onSurfaceVariant,
                    ),
                  ),
                ],
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

/// Quick reaction picker with actions
class _QuickReactionPicker extends StatelessWidget {
  final List<String> reactions;
  final Function(String) onSelect;
  final VoidCallback onDismiss;
  final VoidCallback? onReply;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;
  final bool isMe;

  const _QuickReactionPicker({
    required this.reactions,
    required this.onSelect,
    required this.onDismiss,
    this.onReply,
    this.onEdit,
    this.onDelete,
    required this.isMe,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: cs.shadow.withValues(alpha: 0.15),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Emoji reactions
          ...reactions.map((emoji) {
            return GestureDetector(
              onTap: () => onSelect(emoji),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: Text(emoji, style: const TextStyle(fontSize: 22)),
              ),
            );
          }),

          // Divider
          Container(
            height: 24,
            width: 1,
            margin: const EdgeInsets.symmetric(horizontal: 8),
            color: cs.outline.withValues(alpha: 0.3),
          ),

          // Action buttons
          if (onReply != null)
            _ActionButton(
              icon: Icons.reply,
              onTap: () {
                onDismiss();
                onReply!();
              },
            ),
          if (isMe && onEdit != null)
            _ActionButton(
              icon: Icons.edit,
              onTap: () {
                onDismiss();
                onEdit!();
              },
            ),
          if (isMe && onDelete != null)
            _ActionButton(
              icon: Icons.delete_outline,
              color: cs.error,
              onTap: () {
                onDismiss();
                onDelete!();
              },
            ),
        ],
      ),
    );
  }
}

/// Small action button for reaction picker
class _ActionButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final Color? color;

  const _ActionButton({
    required this.icon,
    required this.onTap,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6),
        child: Icon(
          icon,
          size: 20,
          color: color ?? cs.onSurfaceVariant,
        ),
      ),
    );
  }
}
