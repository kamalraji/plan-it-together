import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/session_question.dart';

/// Card displaying a Q&A question with upvote functionality
class QAQuestionCard extends StatelessWidget {
  final SessionQuestion question;
  final bool isOwner;
  final bool canModerate;
  final VoidCallback? onUpvote;
  final VoidCallback? onDelete;
  final void Function(QuestionStatus)? onStatusChange;

  const QAQuestionCard({
    super.key,
    required this.question,
    this.isOwner = false,
    this.canModerate = false,
    this.onUpvote,
    this.onDelete,
    this.onStatusChange,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: question.isAnswered
              ? Colors.green.withOpacity(0.3)
              : cs.outline.withOpacity(0.1),
          width: question.isAnswered ? 2 : 1,
        ),
        boxShadow: [
          if (question.isAnswered)
            BoxShadow(
              color: Colors.green.withOpacity(0.08),
              blurRadius: 12,
            ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row
          Row(
            children: [
              // Author avatar
              CircleAvatar(
                radius: 16,
                backgroundColor: cs.primary.withOpacity(0.1),
                backgroundImage: question.userAvatar != null && !question.isAnonymous
                    ? NetworkImage(question.userAvatar!)
                    : null,
                child: question.userAvatar == null || question.isAnonymous
                    ? Icon(
                        question.isAnonymous ? Icons.visibility_off : Icons.person,
                        size: 16,
                        color: cs.primary,
                      )
                    : null,
              ),
              const SizedBox(width: 10),

              // Author name and time
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      question.displayName,
                      style: textTheme.labelMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      _formatTime(question.createdAt),
                      style: textTheme.labelSmall?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),

              // Status badge
              _StatusBadge(status: question.status),

              // Owner/Moderator actions
              if (isOwner && question.isPending)
                IconButton(
                  icon: Icon(Icons.delete_outline, size: 20),
                  onPressed: onDelete,
                  color: cs.error,
                  tooltip: 'Delete question',
                ),
            ],
          ),
          const SizedBox(height: 12),

          // Question text
          Text(
            question.questionText,
            style: textTheme.bodyMedium?.copyWith(
              height: 1.4,
            ),
          ),

          // Answer section (if answered)
          if (question.isAnswered) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.08),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: Colors.green.withOpacity(0.2),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.check_circle,
                        size: 16,
                        color: Colors.green,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Answer',
                        style: textTheme.labelMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Colors.green,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    question.answerText!,
                    style: textTheme.bodyMedium?.copyWith(
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 12),

          // Footer row with upvote
          Row(
            children: [
              // Upvote button
              _UpvoteButton(
                count: question.upvoteCount,
                hasUpvoted: question.hasUpvoted,
                onTap: onUpvote,
              ),

              const Spacer(),

              // Moderation actions
              if (canModerate && question.isPending) ...[
                TextButton.icon(
                  onPressed: () => onStatusChange?.call(QuestionStatus.approved),
                  icon: Icon(Icons.check, size: 18),
                  label: Text('Approve'),
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.green,
                  ),
                ),
                const SizedBox(width: 8),
                TextButton.icon(
                  onPressed: () => onStatusChange?.call(QuestionStatus.rejected),
                  icon: Icon(Icons.close, size: 18),
                  label: Text('Reject'),
                  style: TextButton.styleFrom(
                    foregroundColor: cs.error,
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);

    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}

class _StatusBadge extends StatelessWidget {
  final QuestionStatus status;

  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final (color, icon, label) = switch (status) {
      QuestionStatus.pending => (Colors.orange, Icons.hourglass_top, 'Pending'),
      QuestionStatus.approved => (Colors.blue, Icons.visibility, 'Approved'),
      QuestionStatus.answered => (Colors.green, Icons.check_circle, 'Answered'),
      QuestionStatus.rejected => (Colors.red, Icons.cancel, 'Rejected'),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _UpvoteButton extends StatefulWidget {
  final int count;
  final bool hasUpvoted;
  final VoidCallback? onTap;

  const _UpvoteButton({
    required this.count,
    required this.hasUpvoted,
    this.onTap,
  });

  @override
  State<_UpvoteButton> createState() => _UpvoteButtonState();
}

class _UpvoteButtonState extends State<_UpvoteButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 150),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.3).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTap() {
    if (widget.onTap == null) return;
    
    HapticFeedback.lightImpact();
    _controller.forward().then((_) => _controller.reverse());
    widget.onTap?.call();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: _handleTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: widget.hasUpvoted
              ? cs.primary.withOpacity(0.1)
              : cs.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: widget.hasUpvoted ? cs.primary : Colors.transparent,
            width: 1.5,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            ScaleTransition(
              scale: _scaleAnimation,
              child: Icon(
                widget.hasUpvoted ? Icons.thumb_up : Icons.thumb_up_outlined,
                size: 18,
                color: widget.hasUpvoted ? cs.primary : cs.onSurfaceVariant,
              ),
            ),
            const SizedBox(width: 6),
            Text(
              widget.count.toString(),
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: widget.hasUpvoted ? cs.primary : cs.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
