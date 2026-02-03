import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/theme.dart';
import 'event_badges.dart';
import 'event_banner_image.dart';

/// Organizer card with avatar and verification status
class EventOrganizerCard extends StatelessWidget {
  final Organization organization;
  final EventStatus status;
  final VoidCallback onTap;

  const EventOrganizerCard({
    super.key,
    required this.organization,
    required this.status,
    required this.onTap,
  });

  String _buildSemanticLabel() {
    final parts = ['Organized by ${organization.name}'];
    if (organization.verificationStatus == 'VERIFIED') {
      parts.add('verified organizer');
    }
    parts.add('tap to view profile');
    return parts.join(', ');
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;

    return Semantics(
      button: true,
      label: _buildSemanticLabel(),
      child: GestureDetector(
        onTap: () {
          HapticFeedback.lightImpact();
          onTap();
        },
        child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: cs.outline),
        ),
        child: Row(children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: Colors.white,
            backgroundImage: eventImageProvider(organization.logoUrl),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(
                child: Text(
                  organization.name,
                  style: text.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                ),
              ),
              if (organization.verificationStatus == 'VERIFIED')
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.success.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: AppColors.success.withValues(alpha: 0.5)),
                  ),
                  child: const Row(children: [
                    Icon(Icons.verified, size: 14, color: AppColors.success),
                    SizedBox(width: 4),
                    Text(
                      'Verified',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: AppColors.success,
                      ),
                    ),
                  ]),
                ),
            ]),
            const SizedBox(height: 2),
            Text(
              'Hosted by @${organization.slug}',
              style: text.bodySmall?.copyWith(color: AppColors.textMuted),
            ),
          ])),
          if (status == EventStatus.ONGOING) const EventLiveBadge(),
          const SizedBox(width: 8),
          const Icon(Icons.chevron_right, color: AppColors.textMuted),
        ]),
      ),
    ),
    );
  }
}
