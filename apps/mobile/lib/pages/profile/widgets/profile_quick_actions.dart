import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/theme.dart';

/// Quick actions row with ticket, saved, followers, QR code chips
class ProfileQuickActionsRow extends StatelessWidget {
  final int ticketsCount;
  final int savedCount;
  final int followersCount;
  final int followingCount;
  final VoidCallback onTickets;
  final VoidCallback onSaved;
  final VoidCallback onFollowers;
  final VoidCallback onQrCode;

  const ProfileQuickActionsRow({
    super.key,
    required this.ticketsCount,
    required this.savedCount,
    required this.followersCount,
    required this.followingCount,
    required this.onTickets,
    required this.onSaved,
    required this.onFollowers,
    required this.onQrCode,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            ProfileQuickActionChip(
              icon: Icons.confirmation_number_outlined,
              label: 'Tickets',
              count: ticketsCount,
              onTap: onTickets,
            ),
            const SizedBox(width: 8),
            ProfileQuickActionChip(
              icon: Icons.bookmark_outline,
              label: 'Saved',
              count: savedCount,
              onTap: onSaved,
            ),
            const SizedBox(width: 8),
            ProfileQuickActionChip(
              icon: Icons.people_outline,
              label: 'Followers',
              count: followersCount,
              onTap: onFollowers,
            ),
            const SizedBox(width: 8),
            ProfileQuickActionChip(
              icon: Icons.person_add_outlined,
              label: 'Following',
              count: followingCount,
              onTap: onFollowers,
            ),
            const SizedBox(width: 8),
            ProfileQuickActionChip(
              icon: Icons.qr_code,
              label: 'QR Code',
              onTap: onQrCode,
            ),
          ],
        ),
      ),
    );
  }
}

/// Single quick action chip
class ProfileQuickActionChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final int? count;
  final VoidCallback onTap;

  const ProfileQuickActionChip({
    super.key,
    required this.icon,
    required this.label,
    this.count,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Semantics(
      button: true,
      label: count != null ? '$label: $count' : label,
      child: Material(
        color: cs.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          onTap: () {
            HapticFeedback.lightImpact();
            onTap();
          },
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                ExcludeSemantics(
                  child: Icon(icon, size: 16, color: cs.primary),
                ),
                const SizedBox(width: 6),
                Text(
                  label,
                  style: context.textStyles.labelMedium?.copyWith(
                    color: cs.onSurface,
                  ),
                ),
                if (count != null && count! > 0) ...[
                  const SizedBox(width: 4),
                  ExcludeSemantics(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: cs.primary.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        count.toString(),
                        style: context.textStyles.labelSmall?.copyWith(
                          color: cs.primary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
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
}
