import 'package:flutter/material.dart';
import '../../theme.dart';

/// Bottom sheet for new chat options
class NewChatOptionsSheet extends StatelessWidget {
  final VoidCallback? onNewMessage;
  final VoidCallback? onNewGroup;
  final VoidCallback? onNewCircle;
  final VoidCallback? onNewChannel;

  const NewChatOptionsSheet({
    super.key,
    this.onNewMessage,
    this.onNewGroup,
    this.onNewCircle,
    this.onNewChannel,
  });

  static Future<void> show(
    BuildContext context, {
    VoidCallback? onNewMessage,
    VoidCallback? onNewGroup,
    VoidCallback? onNewCircle,
    VoidCallback? onNewChannel,
  }) {
    return showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => NewChatOptionsSheet(
        onNewMessage: onNewMessage,
        onNewGroup: onNewGroup,
        onNewCircle: onNewCircle,
        onNewChannel: onNewChannel,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.15),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 12),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: theme.colorScheme.outlineVariant,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Text(
                'Start a conversation',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const SizedBox(height: 20),
            _OptionTile(
              icon: Icons.person_outline_rounded,
              iconColor: theme.colorScheme.primary,
              title: 'New Message',
              subtitle: 'Start a direct conversation',
              onTap: () {
                Navigator.pop(context);
                onNewMessage?.call();
              },
            ),
            _OptionTile(
              icon: Icons.group_add_outlined,
              iconColor: const Color(0xFF4CAF50),
              title: 'Create Group',
              subtitle: 'Chat with multiple people',
              onTap: () {
                Navigator.pop(context);
                onNewGroup?.call();
              },
            ),
            _OptionTile(
              icon: Icons.blur_circular_rounded,
              iconColor: const Color(0xFF9C27B0),
              title: 'Create Circle',
              subtitle: 'Interest-based community',
              onTap: () {
                Navigator.pop(context);
                onNewCircle?.call();
              },
            ),
            _OptionTile(
              icon: Icons.campaign_outlined,
              iconColor: const Color(0xFFFF9800),
              title: 'New Channel',
              subtitle: 'Broadcast to large audiences',
              onTap: () {
                Navigator.pop(context);
                onNewChannel?.call();
              },
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

class _OptionTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final VoidCallback? onTap;

  const _OptionTile({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.12),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(
                icon,
                color: iconColor,
                size: 24,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.arrow_forward_ios_rounded,
              size: 16,
              color: theme.colorScheme.onSurfaceVariant.withOpacity(0.5),
            ),
          ],
        ),
      ),
    );
  }
}
