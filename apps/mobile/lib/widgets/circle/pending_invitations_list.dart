import 'package:flutter/material.dart';
import 'package:thittam1hub/models/circle_invitation.dart';
import 'package:thittam1hub/widgets/styled_avatar.dart';

/// List of pending invitations with management controls
class PendingInvitationsList extends StatelessWidget {
  final List<CircleInvitation> invitations;
  final Function(CircleInvitation) onCancel;
  final VoidCallback onRefresh;

  const PendingInvitationsList({
    super.key,
    required this.invitations,
    required this.onCancel,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async => onRefresh(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: invitations.length,
        itemBuilder: (context, index) {
          return _InvitationTile(
            invitation: invitations[index],
            onCancel: () => onCancel(invitations[index]),
          );
        },
      ),
    );
  }
}

/// Single invitation tile
class _InvitationTile extends StatelessWidget {
  final CircleInvitation invitation;
  final VoidCallback onCancel;

  const _InvitationTile({
    required this.invitation,
    required this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: cs.outline.withValues(alpha: 0.2),
        ),
      ),
      child: Row(
        children: [
          // Avatar placeholder for invitee
          StyledAvatar(
            size: 44,
            userId: invitation.inviteeId ?? '',
            imageUrl: null,
          ),
          const SizedBox(width: 12),

          // Invitation details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  invitation.inviteeEmail ?? 'User',
                  style: textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Row(
                  children: [
                    _StatusBadge(status: invitation.status),
                    const SizedBox(width: 8),
                    Text(
                      invitation.timeAgo,
                      style: textTheme.bodySmall?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Cancel button
          if (invitation.canRespond)
            IconButton(
              icon: Icon(Icons.close, color: cs.error),
              onPressed: () => _confirmCancel(context),
              tooltip: 'Cancel invitation',
            ),
        ],
      ),
    );
  }

  void _confirmCancel(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Invitation?'),
        content: const Text(
          'This will remove the pending invitation. The user will no longer be able to join using this invitation.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Keep'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(context);
              onCancel();
            },
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }
}

/// Status badge for invitation
class _StatusBadge extends StatelessWidget {
  final CircleInvitationStatus status;

  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    final (color, icon, label) = switch (status) {
      CircleInvitationStatus.pending => (
          Colors.orange,
          Icons.schedule,
          'Pending'
        ),
      CircleInvitationStatus.accepted => (
          Colors.green,
          Icons.check_circle,
          'Accepted'
        ),
      CircleInvitationStatus.declined => (
          cs.error,
          Icons.cancel,
          'Declined'
        ),
      CircleInvitationStatus.expired => (
          cs.onSurfaceVariant,
          Icons.timer_off,
          'Expired'
        ),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
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
              fontWeight: FontWeight.w500,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

/// Incoming invitation card (for user's own invitations)
class IncomingInvitationCard extends StatelessWidget {
  final CircleInvitation invitation;
  final VoidCallback onAccept;
  final VoidCallback onDecline;
  final bool isLoading;

  const IncomingInvitationCard({
    super.key,
    required this.invitation,
    required this.onAccept,
    required this.onDecline,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            cs.primaryContainer.withValues(alpha: 0.5),
            cs.primaryContainer.withValues(alpha: 0.3),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: cs.primary.withValues(alpha: 0.3),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Circle info
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: cs.surface,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    invitation.circleIcon ?? '💬',
                    style: const TextStyle(fontSize: 24),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        invitation.circleName ?? 'Circle',
                        style: textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Invited by ${invitation.inviterName ?? 'someone'}',
                        style: textTheme.bodySmall?.copyWith(
                          color: cs.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Time ago
            Row(
              children: [
                Icon(
                  Icons.schedule,
                  size: 14,
                  color: cs.onSurfaceVariant,
                ),
                const SizedBox(width: 4),
                Text(
                  invitation.timeAgo,
                  style: textTheme.bodySmall?.copyWith(
                    color: cs.onSurfaceVariant,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Action buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: isLoading ? null : onDecline,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: cs.error,
                    ),
                    child: const Text('Decline'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton(
                    onPressed: isLoading ? null : onAccept,
                    child: isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text('Accept'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
