import 'package:flutter/material.dart';
import 'package:thittam1hub/theme.dart';

/// Bottom sheet with more profile options
class ProfileMoreOptionsSheet extends StatelessWidget {
  final VoidCallback onEditProfile;
  final VoidCallback onSavedEvents;
  final VoidCallback onFollowers;
  final VoidCallback onTickets;
  final VoidCallback onSettings;
  final VoidCallback onLogout;

  const ProfileMoreOptionsSheet({
    super.key,
    required this.onEditProfile,
    required this.onSavedEvents,
    required this.onFollowers,
    required this.onTickets,
    required this.onSettings,
    required this.onLogout,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: cs.outline.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            _OptionTile(
              icon: Icons.edit_outlined,
              label: 'Edit Profile',
              onTap: onEditProfile,
            ),
            _OptionTile(
              icon: Icons.bookmark_outline,
              label: 'Saved Events',
              onTap: onSavedEvents,
            ),
            _OptionTile(
              icon: Icons.people_outline,
              label: 'Followers',
              onTap: onFollowers,
            ),
            _OptionTile(
              icon: Icons.confirmation_number_outlined,
              label: 'My Tickets',
              onTap: onTickets,
            ),
            _OptionTile(
              icon: Icons.settings_outlined,
              label: 'Settings',
              onTap: onSettings,
            ),
            Divider(color: cs.outline.withValues(alpha: 0.2)),
            _OptionTile(
              icon: Icons.logout,
              label: 'Log Out',
              isDestructive: true,
              onTap: onLogout,
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
  final String label;
  final VoidCallback onTap;
  final bool isDestructive;

  const _OptionTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.isDestructive = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final color = isDestructive ? AppColors.error : cs.onSurface;

    return ListTile(
      leading: Icon(icon, color: color),
      title: Text(
        label,
        style: context.textStyles.bodyMedium?.copyWith(
          color: color,
        ),
      ),
      onTap: onTap,
    );
  }
}
