import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/theme.dart';

/// Action chip button (Edit, Share, etc.)
class ProfileActionChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final bool isPrimary;

  const ProfileActionChip({
    super.key,
    required this.label,
    required this.icon,
    required this.onTap,
    this.isPrimary = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Material(
      color: isPrimary ? cs.primary : cs.surfaceContainerHighest,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 16,
                color: isPrimary ? cs.onPrimary : cs.onSurfaceVariant,
              ),
              const SizedBox(width: 4),
              Text(
                label,
                style: context.textStyles.labelMedium?.copyWith(
                  color: isPrimary ? cs.onPrimary : cs.onSurface,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Icon-only button
class ProfileIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const ProfileIconButton({super.key, required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Material(
      color: cs.surfaceContainerHighest,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: Icon(icon, size: 18, color: cs.onSurfaceVariant),
        ),
      ),
    );
  }
}

/// Bio section with social links
class ProfileBioSection extends StatelessWidget {
  final UserProfile profile;

  const ProfileBioSection({super.key, required this.profile});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            profile.bio!,
            style: context.textStyles.bodyMedium?.copyWith(
              color: cs.onSurface,
            ),
          ),
          if (_hasSocialLinks()) ...[
            const SizedBox(height: 12),
            ProfileSocialLinksRow(profile: profile),
          ],
        ],
      ),
    );
  }

  bool _hasSocialLinks() =>
      (profile.website != null && profile.website!.isNotEmpty) ||
      (profile.linkedinUrl != null && profile.linkedinUrl!.isNotEmpty) ||
      (profile.twitterUrl != null && profile.twitterUrl!.isNotEmpty) ||
      (profile.githubUrl != null && profile.githubUrl!.isNotEmpty);
}

/// Row of social link chips
class ProfileSocialLinksRow extends StatelessWidget {
  final UserProfile profile;

  const ProfileSocialLinksRow({super.key, required this.profile});

  @override
  Widget build(BuildContext context) {
    final links = <Widget>[];

    if (profile.website != null && profile.website!.isNotEmpty) {
      links.add(ProfileSocialLink(
        icon: Icons.language,
        label: 'Website',
        url: profile.website!,
      ));
    }
    if (profile.linkedinUrl != null && profile.linkedinUrl!.isNotEmpty) {
      links.add(ProfileSocialLink(
        icon: Icons.work_outline,
        label: 'LinkedIn',
        url: profile.linkedinUrl!,
      ));
    }
    if (profile.twitterUrl != null && profile.twitterUrl!.isNotEmpty) {
      links.add(ProfileSocialLink(
        icon: Icons.alternate_email,
        label: 'Twitter',
        url: profile.twitterUrl!,
      ));
    }
    if (profile.githubUrl != null && profile.githubUrl!.isNotEmpty) {
      links.add(ProfileSocialLink(
        icon: Icons.code,
        label: 'GitHub',
        url: profile.githubUrl!,
      ));
    }

    return Wrap(spacing: 8, runSpacing: 8, children: links);
  }
}

/// Single social link chip
class ProfileSocialLink extends StatelessWidget {
  final IconData icon;
  final String label;
  final String url;

  const ProfileSocialLink({
    super.key,
    required this.icon,
    required this.label,
    required this.url,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return InkWell(
      onTap: () async {
        final uri = Uri.parse(url);
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        }
      },
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: cs.surfaceContainerHighest.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: cs.primary),
            const SizedBox(width: 4),
            Text(
              label,
              style: context.textStyles.labelSmall?.copyWith(
                color: cs.primary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Empty tab placeholder
class ProfileEmptyTabContent extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const ProfileEmptyTabContent({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 48, color: cs.onSurfaceVariant.withValues(alpha: 0.5)),
          const SizedBox(height: 16),
          Text(
            title,
            style: context.textStyles.titleMedium?.copyWith(
              color: cs.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: context.textStyles.bodySmall?.copyWith(
              color: cs.onSurfaceVariant.withValues(alpha: 0.7),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

/// Section container for About tab
class ProfileAboutSectionContainer extends StatelessWidget {
  final String title;
  final Widget child;

  const ProfileAboutSectionContainer({super.key, required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            title.toUpperCase(),
            style: context.textStyles.labelSmall?.copyWith(
              color: cs.onSurfaceVariant,
              letterSpacing: 1.2,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: cs.surfaceContainerHighest.withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: cs.outline.withValues(alpha: 0.2)),
          ),
          child: child,
        ),
      ],
    );
  }
}

/// Quick link tile for About tab
class ProfileQuickLinkTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? subtitle;
  final VoidCallback onTap;

  const ProfileQuickLinkTile({
    super.key,
    required this.icon,
    required this.label,
    this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Icon(icon, size: 20, color: cs.onSurfaceVariant),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: context.textStyles.bodyMedium),
                  if (subtitle != null)
                    Text(
                      subtitle!,
                      style: context.textStyles.labelSmall?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, size: 20, color: cs.onSurfaceVariant),
          ],
        ),
      ),
    );
  }
}

/// Error tab content with retry button
class ProfileErrorTabContent extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback? onRetry;

  const ProfileErrorTabContent({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 48, color: AppColors.error),
            const SizedBox(height: 16),
            Text(
              title,
              style: context.textStyles.titleMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: context.textStyles.bodySmall?.copyWith(
                color: cs.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
