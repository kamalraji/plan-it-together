import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/services/chat_offline_service.dart';
import 'package:thittam1hub/theme.dart';

/// Bubble widget for pending messages with status indicator
class PendingMessageBubble extends StatelessWidget {
  final PendingMessage message;
  final VoidCallback? onRetry;
  final VoidCallback? onCancel;

  const PendingMessageBubble({
    super.key,
    required this.message,
    this.onRetry,
    this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Align(
        alignment: Alignment.centerRight,
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxWidth: MediaQuery.of(context).size.width * 0.75,
          ),
          child: Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: AppSpacing.sm,
            ),
            decoration: BoxDecoration(
              color: colors.primary.withOpacity(0.7),
              borderRadius: BorderRadius.circular(AppRadius.lg),
              border: message.status == PendingMessageStatus.failed
                  ? Border.all(color: colors.error, width: 1.5)
                  : null,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                // Message content
                Text(
                  message.content,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: colors.onPrimary.withOpacity(0.9),
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                
                // Status row
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _buildStatusIndicator(context),
                    const SizedBox(width: AppSpacing.xs),
                    Text(
                      _statusText,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: colors.onPrimary.withOpacity(0.7),
                      ),
                    ),
                    
                    // Action buttons for failed/queued
                    if (message.status == PendingMessageStatus.failed ||
                        message.status == PendingMessageStatus.queued) ...[
                      const SizedBox(width: AppSpacing.sm),
                      _ActionButton(
                        icon: Icons.refresh,
                        onTap: () {
                          HapticFeedback.lightImpact();
                          onRetry?.call();
                        },
                        color: colors.onPrimary,
                      ),
                      const SizedBox(width: AppSpacing.xs),
                      _ActionButton(
                        icon: Icons.close,
                        onTap: () {
                          HapticFeedback.lightImpact();
                          onCancel?.call();
                        },
                        color: colors.onPrimary,
                      ),
                    ],
                  ],
                ),
                
                // Error message
                if (message.error != null) ...[
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    message.error!,
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: colors.errorContainer,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatusIndicator(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    
    switch (message.status) {
      case PendingMessageStatus.pending:
      case PendingMessageStatus.sending:
        return SizedBox(
          width: 12,
          height: 12,
          child: CircularProgressIndicator(
            strokeWidth: 1.5,
            color: colors.onPrimary.withOpacity(0.7),
          ),
        );
      case PendingMessageStatus.queued:
        return Icon(
          Icons.cloud_queue,
          size: 14,
          color: colors.onPrimary.withOpacity(0.7),
        );
      case PendingMessageStatus.failed:
        return Icon(
          Icons.error_outline,
          size: 14,
          color: colors.errorContainer,
        );
      case PendingMessageStatus.sent:
        return Icon(
          Icons.check,
          size: 14,
          color: colors.onPrimary.withOpacity(0.7),
        );
    }
  }

  String get _statusText {
    switch (message.status) {
      case PendingMessageStatus.pending:
        return 'Preparing...';
      case PendingMessageStatus.sending:
        return 'Sending...';
      case PendingMessageStatus.queued:
        return 'Queued';
      case PendingMessageStatus.failed:
        return 'Failed';
      case PendingMessageStatus.sent:
        return 'Sent';
    }
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final Color color;

  const _ActionButton({
    required this.icon,
    required this.onTap,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: color.withOpacity(0.2),
          borderRadius: BorderRadius.circular(AppRadius.sm),
        ),
        child: Icon(
          icon,
          size: 14,
          color: color,
        ),
      ),
    );
  }
}
