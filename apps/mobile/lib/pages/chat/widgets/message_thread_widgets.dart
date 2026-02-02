import 'package:flutter/material.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/styled_empty_state.dart';

/// Empty thread placeholder widget - delegates to StyledEmptyState for consistency.
/// 
/// Displayed when there are no messages in the conversation.
class EmptyThread extends StatelessWidget {
  const EmptyThread({super.key});
  
  @override
  Widget build(BuildContext context) {
    return StyledEmptyState.noData(
      icon: Icons.chat_bubble_outline_rounded,
      title: 'Start the conversation',
      message: 'Be the first to send a message!',
    );
  }
}

/// Date separator widget for message list.
/// 
/// Displays formatted date between messages from different days.
class DateSeparatorWidget extends StatelessWidget {
  final DateTime date;
  const DateSeparatorWidget({super.key, required this.date});
  
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        children: [
          Expanded(
            child: Container(
              height: 1,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.transparent,
                    theme.colorScheme.outline.withValues(alpha: 0.3),
                  ],
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              _formatDate(date),
              style: context.textStyles.labelSmall?.copyWith(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Container(
              height: 1,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    theme.colorScheme.outline.withValues(alpha: 0.3),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime d) {
    final now = DateTime.now();
    final diff = now.difference(d);
    
    if (diff.inDays == 0) return 'Today';
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) {
      return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][d.weekday - 1];
    }
    return '${d.day} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.month - 1]} ${d.year}';
  }
}

/// Message highlight wrapper for scroll-to-message animation.
/// 
/// Wraps a message and applies a highlight animation when scrolled to.
class MessageHighlightWrapper extends StatelessWidget {
  final String? highlightedMessageId;
  final String messageId;
  final Animation<double> highlightAnimation;
  final Widget child;

  const MessageHighlightWrapper({
    super.key,
    required this.highlightedMessageId,
    required this.messageId,
    required this.highlightAnimation,
    required this.child,
  });

  bool get _isHighlighted => highlightedMessageId == messageId;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return AnimatedBuilder(
      animation: highlightAnimation,
      builder: (context, child) {
        return Container(
          decoration: _isHighlighted
              ? BoxDecoration(
                  color: theme.colorScheme.primary.withOpacity(
                    highlightAnimation.value * 0.2,
                  ),
                  borderRadius: BorderRadius.circular(12),
                )
              : null,
          child: child,
        );
      },
      child: child,
    );
  }
}
