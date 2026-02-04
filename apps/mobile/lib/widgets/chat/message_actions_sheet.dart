import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/chat/forward_message_sheet.dart';
import 'package:thittam1hub/widgets/chat/report_message_sheet.dart';

/// Bottom sheet showing message actions (reply, star, pin, etc.)
class MessageActionsSheet extends StatelessWidget {
  // Support both old and new API patterns
  final Message? message;
  final String? messageId;
  final String? senderId;
  final String? senderName;
  final String? messageContent;
  final bool? isOwn;
  final bool isStarred;
  final bool isPinned;
  
  // Callbacks - supporting both patterns
  final VoidCallback? onReply;
  final VoidCallback? onStar;
  final VoidCallback? onPin;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;
  final VoidCallback? onDeleteForEveryone;
  final VoidCallback? onCopy;
  final VoidCallback? onForward;
  final Function(String emoji)? onReaction;

  const MessageActionsSheet({
    super.key,
    this.message,
    this.messageId,
    this.senderId,
    this.senderName,
    this.messageContent,
    this.isOwn,
    required this.isStarred,
    required this.isPinned,
    this.onReply,
    this.onStar,
    this.onPin,
    this.onEdit,
    this.onDelete,
    this.onDeleteForEveryone,
    this.onCopy,
    this.onForward,
    this.onReaction,
  });

  static Future<void> show(
    BuildContext context, {
    Message? message,
    String? messageId,
    String? senderId,
    String? senderName,
    String? messageContent,
    bool? isOwn,
    required bool isStarred,
    required bool isPinned,
    VoidCallback? onReply,
    VoidCallback? onStar,
    VoidCallback? onPin,
    VoidCallback? onEdit,
    VoidCallback? onDelete,
    VoidCallback? onDeleteForEveryone,
    VoidCallback? onCopy,
    VoidCallback? onForward,
    Function(String emoji)? onReaction,
  }) {
    return showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => MessageActionsSheet(
        message: message,
        messageId: messageId,
        senderId: senderId,
        senderName: senderName,
        messageContent: messageContent,
        isOwn: isOwn,
        isStarred: isStarred,
        isPinned: isPinned,
        onReply: onReply,
        onStar: onStar,
        onPin: onPin,
        onEdit: onEdit,
        onDelete: onDelete,
        onDeleteForEveryone: onDeleteForEveryone,
        onCopy: onCopy,
        onForward: onForward,
        onReaction: onReaction,
      ),
    );
  }

  // Helper getters to support both API patterns
  String get _messageId => messageId ?? message?.id ?? '';
  String get _senderName => senderName ?? message?.senderName ?? 'Unknown';
  String get _messageContent => messageContent ?? message?.content ?? '';
  bool get _isOwn => isOwn ?? false;

  void _showReportSheet(BuildContext context) {
    Navigator.pop(context);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => ReportMessageSheet(
        messageId: _messageId,
        senderName: _senderName,
      ),
    );
  }

  void _showDeleteOptions(BuildContext context) {
    Navigator.pop(context);
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => _DeleteOptionsSheet(
        isOwn: _isOwn,
        onDeleteForMe: onDelete,
        onDeleteForEveryone: onDeleteForEveryone,
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
      child: SafeArea(
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

            // Quick reactions
            if (onReaction != null)
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: ['👍', '❤️', '😂', '😮', '😢', '👏'].map((emoji) {
                    return GestureDetector(
                      onTap: () {
                        HapticFeedback.lightImpact();
                        onReaction!(emoji);
                      },
                      child: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: cs.surfaceContainerHighest,
                          shape: BoxShape.circle,
                        ),
                        child: Text(emoji, style: const TextStyle(fontSize: 24)),
                      ),
                    );
                  }).toList(),
                ),
              ),

            Divider(color: cs.outline.withOpacity(0.2), height: 1),

            // Actions
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Column(
                children: [
                  if (onReply != null)
                    _ActionTile(
                      icon: Icons.reply,
                      label: 'Reply',
                      onTap: () {
                        Navigator.pop(context);
                        onReply!();
                      },
                    ),

                  if (onStar != null)
                    _ActionTile(
                      icon: isStarred ? Icons.star : Icons.star_border,
                      label: isStarred ? 'Unstar' : 'Star',
                      iconColor: isStarred ? AppColors.amber500 : null,
                      onTap: () {
                        Navigator.pop(context);
                        onStar!();
                      },
                    ),

                  if (onPin != null)
                    _ActionTile(
                      icon: isPinned ? Icons.push_pin : Icons.push_pin_outlined,
                      label: isPinned ? 'Unpin' : 'Pin',
                      iconColor: isPinned ? cs.primary : null,
                      onTap: () {
                        Navigator.pop(context);
                        onPin!();
                      },
                    ),

                  if (onCopy != null)
                    _ActionTile(
                      icon: Icons.copy,
                      label: 'Copy',
                      onTap: () {
                        Navigator.pop(context);
                        onCopy!();
                      },
                    ),

                  if (onForward != null || message != null)
                    _ActionTile(
                      icon: Icons.forward,
                      label: 'Forward',
                      onTap: () {
                        Navigator.pop(context);
                        if (message != null) {
                          ForwardMessageSheet.show(context, message!);
                        } else {
                          onForward?.call();
                        }
                      },
                    ),

                  if (_isOwn && onEdit != null)
                    _ActionTile(
                      icon: Icons.edit,
                      label: 'Edit',
                      onTap: () {
                        Navigator.pop(context);
                        onEdit!();
                      },
                    ),

                  Divider(color: cs.outline.withOpacity(0.2), indent: 56, endIndent: 16),

                  // Report option
                  _ActionTile(
                    icon: Icons.flag_outlined,
                    label: 'Report',
                    iconColor: Colors.orange,
                    onTap: () => _showReportSheet(context),
                  ),

                  // Delete options
                  if (onDelete != null || onDeleteForEveryone != null)
                    _ActionTile(
                      icon: Icons.delete_outline,
                      label: 'Delete',
                      iconColor: cs.error,
                      textColor: cs.error,
                      onTap: () => _showDeleteOptions(context),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color? iconColor;
  final Color? textColor;
  final VoidCallback onTap;

  const _ActionTile({
    required this.icon,
    required this.label,
    this.iconColor,
    this.textColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return InkWell(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(icon, size: 22, color: iconColor ?? cs.onSurfaceVariant),
            const SizedBox(width: 16),
            Text(
              label,
              style: context.textStyles.bodyLarge?.copyWith(
                color: textColor ?? cs.onSurface,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DeleteOptionsSheet extends StatelessWidget {
  final bool isOwn;
  final VoidCallback? onDeleteForMe;
  final VoidCallback? onDeleteForEveryone;

  const _DeleteOptionsSheet({
    required this.isOwn,
    this.onDeleteForMe,
    this.onDeleteForEveryone,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
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

            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'Delete Message',
                style: context.textStyles.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),

            if (onDeleteForMe != null)
              _DeleteOption(
                icon: Icons.person_outline,
                title: 'Delete for me',
                subtitle: 'This message will be removed from your view',
                onTap: () {
                  Navigator.pop(context);
                  onDeleteForMe!();
                },
              ),

            if (isOwn && onDeleteForEveryone != null)
              _DeleteOption(
                icon: Icons.group_outlined,
                title: 'Delete for everyone',
                subtitle: 'This message will be removed for all participants',
                onTap: () {
                  Navigator.pop(context);
                  onDeleteForEveryone!();
                },
              ),

            const SizedBox(height: 8),

            // Cancel
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: TextButton(
                onPressed: () => Navigator.pop(context),
                style: TextButton.styleFrom(
                  minimumSize: const Size(double.infinity, 48),
                ),
                child: const Text('Cancel'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DeleteOption extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _DeleteOption({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return InkWell(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: cs.errorContainer.withOpacity(0.5),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 22, color: cs.error),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: context.textStyles.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: context.textStyles.bodySmall?.copyWith(
                      color: cs.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}