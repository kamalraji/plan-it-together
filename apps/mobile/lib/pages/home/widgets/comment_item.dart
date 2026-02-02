import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/spark_comment.dart';
import 'package:thittam1hub/widgets/mention_text.dart';
import 'package:thittam1hub/widgets/message_reactions_bar.dart';

class CommentItem extends StatefulWidget {
  final SparkComment comment;
  final bool isReply;
  final bool isLiked;
  final bool isPostAuthor;
  final String? currentUserId;
  final Set<String>? likedCommentIds;
  final VoidCallback onReplyTap;
  final VoidCallback onLikeTap;
  final Function(String commentId)? onReplyLikeTap;
  final VoidCallback? onEditTap;
  final VoidCallback? onDeleteTap;
  final VoidCallback? onReportTap;
  final VoidCallback? onPinTap;
  final Function(String emoji)? onReactionTap;
  final Function(String username)? onMentionTap;

  const CommentItem({
    super.key,
    required this.comment,
    this.isReply = false,
    this.isLiked = false,
    this.isPostAuthor = false,
    this.currentUserId,
    this.likedCommentIds,
    required this.onReplyTap,
    required this.onLikeTap,
    this.onReplyLikeTap,
    this.onEditTap,
    this.onDeleteTap,
    this.onReportTap,
    this.onPinTap,
    this.onReactionTap,
    this.onMentionTap,
  });

  @override
  State<CommentItem> createState() => _CommentItemState();
}

class _CommentItemState extends State<CommentItem>
    with SingleTickerProviderStateMixin {
  late AnimationController _likeController;
  late Animation<double> _likeScale;
  bool _showReactionPicker = false;

  @override
  void initState() {
    super.initState();
    _likeController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _likeScale = Tween<double>(begin: 1.0, end: 1.3).animate(
      CurvedAnimation(parent: _likeController, curve: Curves.easeOut),
    );
  }

  @override
  void dispose() {
    _likeController.dispose();
    super.dispose();
  }

  void _handleLikeTap() {
    HapticFeedback.lightImpact();
    _likeController.forward().then((_) => _likeController.reverse());
    widget.onLikeTap();
  }

  void _handleLongPress() {
    HapticFeedback.mediumImpact();
    setState(() => _showReactionPicker = true);
  }

  void _showOptionsSheet() {
    final cs = Theme.of(context).colorScheme;
    final isOwner = widget.currentUserId == widget.comment.userId;

    showModalBottomSheet(
      context: context,
      backgroundColor: cs.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 8),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: cs.outlineVariant,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              if (isOwner && widget.comment.canEdit) ...[
                _buildOptionTile(
                  icon: Icons.edit_outlined,
                  label: 'Edit comment',
                  onTap: () {
                    Navigator.pop(context);
                    widget.onEditTap?.call();
                  },
                ),
              ],
              if (isOwner) ...[
                _buildOptionTile(
                  icon: Icons.delete_outline,
                  label: 'Delete comment',
                  color: Colors.red,
                  onTap: () {
                    Navigator.pop(context);
                    _confirmDelete();
                  },
                ),
              ],
              if (widget.isPostAuthor && !widget.isReply) ...[
                _buildOptionTile(
                  icon: widget.comment.isPinned
                      ? Icons.push_pin
                      : Icons.push_pin_outlined,
                  label: widget.comment.isPinned ? 'Unpin comment' : 'Pin comment',
                  onTap: () {
                    Navigator.pop(context);
                    widget.onPinTap?.call();
                  },
                ),
              ],
              if (!isOwner) ...[
                _buildOptionTile(
                  icon: Icons.flag_outlined,
                  label: 'Report comment',
                  color: Colors.orange,
                  onTap: () {
                    Navigator.pop(context);
                    widget.onReportTap?.call();
                  },
                ),
              ],
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  Widget _buildOptionTile({
    required IconData icon,
    required String label,
    Color? color,
    required VoidCallback onTap,
  }) {
    final cs = Theme.of(context).colorScheme;
    return ListTile(
      leading: Icon(icon, color: color ?? cs.onSurface),
      title: Text(
        label,
        style: TextStyle(color: color ?? cs.onSurface),
      ),
      onTap: onTap,
    );
  }

  void _confirmDelete() {
    final cs = Theme.of(context).colorScheme;
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete comment?'),
        content: const Text('This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(context);
              widget.onDeleteTap?.call();
            },
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  String _formatTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final diff = now.difference(dateTime);

    if (diff.inMinutes < 1) return 'now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    if (diff.inDays < 7) return '${diff.inDays}d';
    return '${dateTime.day}/${dateTime.month}';
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final comment = widget.comment;

    return GestureDetector(
      onLongPress: _handleLongPress,
      child: Padding(
        padding: EdgeInsets.only(
          left: widget.isReply ? 48 : 16,
          right: 16,
          top: 12,
          bottom: 4,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Reaction picker overlay
            if (_showReactionPicker)
              _buildReactionPicker(cs),

            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Avatar
                GestureDetector(
                  onTap: () => widget.onMentionTap?.call(comment.authorName),
                  child: CircleAvatar(
                    radius: widget.isReply ? 14 : 18,
                    backgroundColor: cs.surfaceContainerHighest,
                    backgroundImage: comment.authorAvatar != null
                        ? NetworkImage(comment.authorAvatar!)
                        : null,
                    child: comment.authorAvatar == null
                        ? Text(
                            comment.authorName.isNotEmpty
                                ? comment.authorName[0].toUpperCase()
                                : '?',
                            style: TextStyle(
                              fontSize: widget.isReply ? 10 : 12,
                              fontWeight: FontWeight.bold,
                            ),
                          )
                        : null,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Author, badges, and time
                      Row(
                        children: [
                          GestureDetector(
                            onTap: () =>
                                widget.onMentionTap?.call(comment.authorName),
                            child: Text(
                              comment.authorName,
                              style: textTheme.labelMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          // Badges
                          if (comment.authorBadge != null) ...[
                            const SizedBox(width: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 6, vertical: 1),
                              decoration: BoxDecoration(
                                color: cs.primaryContainer,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                comment.authorBadge!,
                                style: textTheme.labelSmall?.copyWith(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w600,
                                  color: cs.onPrimaryContainer,
                                ),
                              ),
                            ),
                          ],
                          if (comment.isAuthorVerified) ...[
                            const SizedBox(width: 4),
                            Icon(
                              Icons.verified,
                              size: 14,
                              color: cs.primary,
                            ),
                          ],
                          const SizedBox(width: 8),
                          Text(
                            _formatTimeAgo(comment.createdAt),
                            style: textTheme.labelSmall?.copyWith(
                              color: cs.onSurfaceVariant,
                            ),
                          ),
                          if (comment.isEdited) ...[
                            const SizedBox(width: 4),
                            Text(
                              '(edited)',
                              style: textTheme.labelSmall?.copyWith(
                                color: cs.onSurfaceVariant,
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                          ],
                          if (comment.isPinned) ...[
                            const SizedBox(width: 4),
                            Icon(
                              Icons.push_pin,
                              size: 12,
                              color: cs.primary,
                            ),
                          ],
                          const Spacer(),
                          // Options menu
                          GestureDetector(
                            onTap: _showOptionsSheet,
                            child: Padding(
                              padding: const EdgeInsets.all(4),
                              child: Icon(
                                Icons.more_horiz,
                                size: 16,
                                color: cs.onSurfaceVariant,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),

                      // Content with mentions
                      if (comment.isDeleted)
                        Text(
                          '[deleted]',
                          style: textTheme.bodyMedium?.copyWith(
                            fontStyle: FontStyle.italic,
                            color: cs.onSurfaceVariant,
                          ),
                        )
                      else
                        MentionText(
                          text: comment.content,
                          style: textTheme.bodyMedium,
                          onMentionTap: widget.onMentionTap,
                        ),
                      const SizedBox(height: 8),

                      // Actions
                      Row(
                        children: [
                          // Like button with animation
                          GestureDetector(
                            onTap: _handleLikeTap,
                            child: ScaleTransition(
                              scale: _likeScale,
                              child: Row(
                                children: [
                                  Icon(
                                    widget.isLiked
                                        ? Icons.favorite
                                        : Icons.favorite_border,
                                    size: 16,
                                    color: widget.isLiked
                                        ? Colors.red
                                        : cs.onSurfaceVariant,
                                  ),
                                  if (comment.likeCount > 0) ...[
                                    const SizedBox(width: 4),
                                    Text(
                                      '${comment.likeCount}',
                                      style: textTheme.labelSmall?.copyWith(
                                        color: cs.onSurfaceVariant,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          // Reply button (not for replies or deleted comments)
                          if (!widget.isReply && !comment.isDeleted)
                            GestureDetector(
                              onTap: widget.onReplyTap,
                              child: Text(
                                'Reply',
                                style: textTheme.labelSmall?.copyWith(
                                  color: cs.onSurfaceVariant,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                        ],
                      ),

                      // Nested replies (max 2 levels)
                      if (!widget.isReply && comment.replies.isNotEmpty)
                        Column(
                          children: comment.replies.map((reply) {
                            final isReplyLiked = widget.likedCommentIds?.contains(reply.id) ?? false;
                            return CommentItem(
                              comment: reply,
                              isReply: true,
                              isLiked: isReplyLiked,
                              currentUserId: widget.currentUserId,
                              likedCommentIds: widget.likedCommentIds,
                              onReplyTap: widget.onReplyTap,
                              onLikeTap: () => widget.onReplyLikeTap?.call(reply.id),
                              onMentionTap: widget.onMentionTap,
                              onReportTap: widget.onReportTap,
                            );
                          }).toList(),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReactionPicker(ColorScheme cs) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: ReactionPicker(
        onReactionSelected: (emoji) {
          HapticFeedback.selectionClick();
          setState(() => _showReactionPicker = false);
          widget.onReactionTap?.call(emoji);
        },
        onDismiss: () => setState(() => _showReactionPicker = false),
      ),
    );
  }
}
