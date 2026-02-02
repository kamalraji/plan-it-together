import 'package:flutter/material.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/models/encryption_models.dart';
import 'package:thittam1hub/theme.dart';
import 'message_bubble_utils.dart';

/// Status row displaying time, encryption, and read receipts
class MessageStatusRow extends StatelessWidget {
  final Message message;
  final bool isOwn;
  final List<String> readBy;
  final bool showReadReceipts;
  final bool isStarred;
  final bool isPinned;

  const MessageStatusRow({
    super.key,
    required this.message,
    required this.isOwn,
    required this.readBy,
    required this.showReadReceipts,
    required this.isStarred,
    required this.isPinned,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    // Determine encryption status
    final encryptionStatus = message.isE2EEncrypted
        ? EncryptionStatus.encrypted
        : (message.isEncrypted == false && message.nonce == null)
            ? EncryptionStatus.legacy
            : EncryptionStatus.transportOnly;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Encryption indicator
        EncryptionIcon(status: encryptionStatus),
        const SizedBox(width: 4),
        
        // Indicators
        if (isPinned)
          Padding(
            padding: const EdgeInsets.only(right: 4),
            child: Icon(Icons.push_pin, size: 12, color: cs.primary),
          ),
        if (isStarred)
          Padding(
            padding: const EdgeInsets.only(right: 4),
            child: Icon(Icons.star, size: 12, color: AppColors.amber500),
          ),
        if (message.editedAt != null)
          Padding(
            padding: const EdgeInsets.only(right: 4),
            child: Text(
              'edited',
              style: context.textStyles.labelSmall?.copyWith(
                color: cs.onSurfaceVariant,
                fontStyle: FontStyle.italic,
                fontSize: 10,
              ),
            ),
          ),

        // Time
        Text(
          MessageBubbleUtils.formatTime(message.sentAt),
          style: context.textStyles.labelSmall?.copyWith(
            color: cs.onSurfaceVariant,
            fontSize: 10,
          ),
        ),

        // Read receipts (for own messages)
        if (isOwn && showReadReceipts) ...[
          const SizedBox(width: 4),
          ReadReceiptIndicator(readBy: readBy),
        ],
      ],
    );
  }
}

/// Encryption status icon with tooltip
class EncryptionIcon extends StatelessWidget {
  final EncryptionStatus status;

  const EncryptionIcon({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final (icon, color, tooltip) = switch (status) {
      EncryptionStatus.encrypted => (
          Icons.lock,
          Colors.green,
          'End-to-end encrypted',
        ),
      EncryptionStatus.transportOnly => (
          Icons.lock_open,
          Theme.of(context).colorScheme.outline,
          'Transport encryption only',
        ),
      EncryptionStatus.legacy => (
          Icons.lock_open,
          Theme.of(context).colorScheme.error.withOpacity(0.7),
          'Legacy (unencrypted)',
        ),
      EncryptionStatus.failed => (
          Icons.error_outline,
          Theme.of(context).colorScheme.error,
          'Encryption failed',
        ),
    };

    return Tooltip(
      message: tooltip,
      child: Icon(icon, size: 11, color: color),
    );
  }
}

/// Read receipt indicator (single/double check)
class ReadReceiptIndicator extends StatelessWidget {
  final List<String> readBy;

  const ReadReceiptIndicator({super.key, required this.readBy});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    if (readBy.isEmpty) {
      // Sent but not read
      return Icon(Icons.done, size: 14, color: cs.onSurfaceVariant);
    }

    // Read by at least one person
    return Icon(Icons.done_all, size: 14, color: cs.primary);
  }
}
