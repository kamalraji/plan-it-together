import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/theme.dart';

/// Compact bar showing pinned message at top of chat
class PinnedMessageBar extends StatelessWidget {
  final Message message;
  final int? pinnedCount;
  final VoidCallback onTap;
  final VoidCallback? onDismiss;
  final VoidCallback? onClose;

  const PinnedMessageBar({
    super.key,
    required this.message,
    required this.onTap,
    this.pinnedCount,
    this.onDismiss,
    this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: cs.primaryContainer.withOpacity(0.5),
          border: Border(
            bottom: BorderSide(color: cs.outline.withOpacity(0.2)),
          ),
        ),
        child: Row(
          children: [
            // Pin icon
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: cs.primary.withOpacity(0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                Icons.push_pin,
                size: 16,
                color: cs.primary,
              ),
            ),
            const SizedBox(width: 12),

            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Pinned by ${message.senderName ?? 'someone'}',
                    style: context.textStyles.labelSmall?.copyWith(
                      color: cs.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    message.content,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: context.textStyles.bodySmall?.copyWith(
                      color: cs.onSurface.withOpacity(0.8),
                    ),
                  ),
                ],
              ),
            ),

            // Close button
            if (onDismiss != null)
              GestureDetector(
                onTap: () {
                  HapticFeedback.lightImpact();
                  onDismiss!();
                },
                child: Padding(
                  padding: const EdgeInsets.all(4),
                  child: Icon(
                    Icons.close,
                    size: 18,
                    color: cs.onSurfaceVariant,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Full list of pinned messages
class PinnedMessagesSheet extends StatelessWidget {
  final List<Message> messages;
  final Function(Message) onMessageTap;
  final Function(Message)? onUnpin;

  const PinnedMessagesSheet({
    super.key,
    required this.messages,
    required this.onMessageTap,
    this.onUnpin,
  });

  static Future<void> show(
    BuildContext context, {
    required List<Message> messages,
    required Function(Message) onMessageTap,
    Function(Message)? onUnpin,
  }) {
    return showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => PinnedMessagesSheet(
        messages: messages,
        onMessageTap: onMessageTap,
        onUnpin: onUnpin,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: cs.onSurface.withOpacity(0.2),
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Icon(Icons.push_pin, color: cs.primary),
                const SizedBox(width: 8),
                Text(
                  'Pinned Messages',
                  style: context.textStyles.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                Text(
                  '${messages.length}',
                  style: context.textStyles.titleMedium?.copyWith(
                    color: cs.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),

          Divider(color: cs.outline.withOpacity(0.2), height: 1),

          // Messages list
          Flexible(
            child: messages.isEmpty
                ? Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.push_pin_outlined,
                          size: 48,
                          color: cs.onSurfaceVariant.withOpacity(0.5),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'No pinned messages',
                          style: context.textStyles.bodyMedium?.copyWith(
                            color: cs.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    shrinkWrap: true,
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: messages.length,
                    separatorBuilder: (_, __) => Divider(
                      color: cs.outline.withOpacity(0.1),
                      height: 1,
                      indent: 72,
                    ),
                    itemBuilder: (context, index) {
                      final msg = messages[index];
                      return _PinnedMessageTile(
                        message: msg,
                        onTap: () {
                          Navigator.pop(context);
                          onMessageTap(msg);
                        },
                        onUnpin: onUnpin != null ? () => onUnpin!(msg) : null,
                      );
                    },
                  ),
          ),

          SizedBox(height: MediaQuery.of(context).padding.bottom + 16),
        ],
      ),
    );
  }
}

class _PinnedMessageTile extends StatelessWidget {
  final Message message;
  final VoidCallback onTap;
  final VoidCallback? onUnpin;

  const _PinnedMessageTile({
    required this.message,
    required this.onTap,
    this.onUnpin,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              radius: 20,
              backgroundColor: cs.primary.withOpacity(0.1),
              backgroundImage: message.senderAvatar != null
                  ? NetworkImage(message.senderAvatar!)
                  : null,
              child: message.senderAvatar == null
                  ? Text(
                      (message.senderName ?? 'U')[0].toUpperCase(),
                      style: TextStyle(
                        color: cs.primary,
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
                  Row(
                    children: [
                      Text(
                        message.senderName ?? 'Unknown',
                        style: context.textStyles.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        _formatDate(message.sentAt),
                        style: context.textStyles.labelSmall?.copyWith(
                          color: cs.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    message.content,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: context.textStyles.bodyMedium?.copyWith(
                      color: cs.onSurface.withOpacity(0.8),
                    ),
                  ),
                ],
              ),
            ),
            if (onUnpin != null)
              IconButton(
                onPressed: onUnpin,
                icon: Icon(
                  Icons.push_pin_outlined,
                  size: 20,
                  color: cs.onSurfaceVariant,
                ),
                tooltip: 'Unpin',
              ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime dt) {
    final now = DateTime.now();
    if (dt.day == now.day && dt.month == now.month && dt.year == now.year) {
      return 'Today';
    }
    final diff = now.difference(dt);
    if (diff.inDays == 1) return 'Yesterday';
    return '${dt.month}/${dt.day}';
  }
}
