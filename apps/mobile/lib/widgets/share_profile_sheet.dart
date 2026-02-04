import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/services/profile_sharing_service.dart';
import 'package:thittam1hub/theme.dart';

/// Bottom sheet for sharing profile with preview card and social media options
class ShareProfileSheet extends StatelessWidget {
  final String userId;
  final String displayName;
  final String? headline;
  final String? handle;
  final String? avatarUrl;
  final int impactScore;
  final int eventsAttended;
  final int followersCount;
  final List<String> skills;

  const ShareProfileSheet({
    super.key,
    required this.userId,
    required this.displayName,
    this.headline,
    this.handle,
    this.avatarUrl,
    this.impactScore = 0,
    this.eventsAttended = 0,
    this.followersCount = 0,
    this.skills = const [],
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final profileUrl = ProfileSharingService.getProfileUrl(userId);

    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Handle bar
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: cs.outlineVariant,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              
              // Title
              Text(
                'Share Profile',
                style: context.textStyles.titleLarge?.bold,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              
              // Preview Card (Social Media style)
              _SocialPreviewCard(
                displayName: displayName,
                headline: headline,
                avatarUrl: avatarUrl,
                impactScore: impactScore,
                eventsAttended: eventsAttended,
                followersCount: followersCount,
                skills: skills,
                profileUrl: profileUrl,
              ),
              const SizedBox(height: 24),
              
              // Profile URL with copy button
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: cs.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: cs.outlineVariant.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.link, size: 18, color: cs.primary),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        profileUrl,
                        style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.copy, size: 18),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: () => _copyUrl(context),
                      tooltip: 'Copy link',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              
              // Social Media Share Buttons
              Text(
                'Share to',
                style: context.textStyles.labelLarge?.withColor(cs.onSurfaceVariant),
              ),
              const SizedBox(height: 12),
              
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _SocialButton(
                    icon: Icons.chat_bubble,
                    label: 'Twitter',
                    color: const Color(0xFF1DA1F2),
                    onTap: () => _shareToTwitter(context),
                  ),
                  _SocialButton(
                    icon: Icons.work,
                    label: 'LinkedIn',
                    color: const Color(0xFF0A66C2),
                    onTap: () => _shareToLinkedIn(context),
                  ),
                  _SocialButton(
                    icon: Icons.phone,
                    label: 'WhatsApp',
                    color: const Color(0xFF25D366),
                    onTap: () => _shareToWhatsApp(context),
                  ),
                  _SocialButton(
                    icon: Icons.send,
                    label: 'Telegram',
                    color: const Color(0xFF0088CC),
                    onTap: () => _shareToTelegram(context),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              
              // Main share button
              FilledButton.icon(
                onPressed: () => _shareNative(context),
                icon: const Icon(Icons.share),
                label: const Text('Share Profile'),
                style: FilledButton.styleFrom(
                  minimumSize: const Size.fromHeight(48),
                ),
              ),
              const SizedBox(height: 8),
              
              // QR Code button
              OutlinedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  Navigator.pushNamed(context, '/profile/qr');
                },
                icon: const Icon(Icons.qr_code_2),
                label: const Text('Show QR Code'),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(48),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _copyUrl(BuildContext context) {
    HapticFeedback.lightImpact();
    ProfileSharingService.copyProfileUrl(userId);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Profile link copied!'),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  void _shareToTwitter(BuildContext context) {
    HapticFeedback.lightImpact();
    ProfileSharingService.shareToTwitter(
      userId: userId,
      displayName: displayName,
      headline: headline,
    );
    Navigator.pop(context);
  }

  void _shareToLinkedIn(BuildContext context) {
    HapticFeedback.lightImpact();
    ProfileSharingService.shareToLinkedIn(
      userId: userId,
      displayName: displayName,
    );
    Navigator.pop(context);
  }

  void _shareToWhatsApp(BuildContext context) {
    HapticFeedback.lightImpact();
    ProfileSharingService.shareToWhatsApp(
      userId: userId,
      displayName: displayName,
      headline: headline,
    );
    Navigator.pop(context);
  }

  void _shareToTelegram(BuildContext context) {
    HapticFeedback.lightImpact();
    ProfileSharingService.shareToTelegram(
      userId: userId,
      displayName: displayName,
      headline: headline,
    );
    Navigator.pop(context);
  }

  void _shareNative(BuildContext context) {
    HapticFeedback.lightImpact();
    ProfileSharingService.shareProfile(
      userId: userId,
      displayName: displayName,
      headline: headline,
      handle: handle,
    );
    Navigator.pop(context);
  }
}

/// Social media preview card mockup
class _SocialPreviewCard extends StatelessWidget {
  final String displayName;
  final String? headline;
  final String? avatarUrl;
  final int impactScore;
  final int eventsAttended;
  final int followersCount;
  final List<String> skills;
  final String profileUrl;

  const _SocialPreviewCard({
    required this.displayName,
    this.headline,
    this.avatarUrl,
    required this.impactScore,
    required this.eventsAttended,
    required this.followersCount,
    required this.skills,
    required this.profileUrl,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            cs.primary.withOpacity(0.1),
            cs.secondary.withOpacity(0.05),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cs.outlineVariant.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with gradient
          Container(
            height: 60,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [cs.primary, cs.secondary],
              ),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
            ),
          ),
          
          // Content
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Avatar overlapping header
                Transform.translate(
                  offset: const Offset(0, -24),
                  child: Row(
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: cs.surface, width: 3),
                        ),
                        child: CircleAvatar(
                          radius: 28,
                          backgroundColor: cs.primary,
                          backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl!) : null,
                          child: avatarUrl == null
                              ? Text(
                                  displayName[0].toUpperCase(),
                                  style: context.textStyles.titleLarge?.copyWith(color: cs.onPrimary),
                                )
                              : null,
                        ),
                      ),
                    ],
                  ),
                ),
                
                // Name and headline
                Transform.translate(
                  offset: const Offset(0, -16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        displayName,
                        style: context.textStyles.titleMedium?.bold,
                      ),
                      if (headline != null)
                        Text(
                          headline!,
                          style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      const SizedBox(height: 8),
                      
                      // Stats chips
                      Wrap(
                        spacing: 8,
                        runSpacing: 4,
                        children: [
                          _PreviewChip(
                            icon: Icons.star,
                            label: '$impactScore Impact',
                            color: cs.primary,
                          ),
                          _PreviewChip(
                            icon: Icons.event,
                            label: '$eventsAttended Events',
                            color: cs.secondary,
                          ),
                          _PreviewChip(
                            icon: Icons.people,
                            label: '$followersCount Followers',
                            color: cs.tertiary,
                          ),
                        ],
                      ),
                      
                      // Skills preview
                      if (skills.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 4,
                          runSpacing: 4,
                          children: skills.take(3).map((skill) {
                            return Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: cs.surfaceContainerHighest,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                skill,
                                style: context.textStyles.labelSmall?.withColor(cs.onSurface),
                              ),
                            );
                          }).toList(),
                        ),
                      ],
                    ],
                  ),
                ),
                
                // URL preview footer
                Transform.translate(
                  offset: const Offset(0, -8),
                  child: Row(
                    children: [
                      Icon(Icons.language, size: 14, color: cs.onSurfaceVariant.withOpacity(0.6)),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          'thittam1hub.app',
                          style: context.textStyles.labelSmall?.withColor(cs.onSurfaceVariant.withOpacity(0.6)),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PreviewChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _PreviewChip({
    required this.icon,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: context.textStyles.labelSmall?.withColor(color),
          ),
        ],
      ),
    );
  }
}

class _SocialButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _SocialButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: context.textStyles.labelSmall,
          ),
        ],
      ),
    );
  }
}

/// Helper function to show share profile sheet
void showShareProfileSheet({
  required BuildContext context,
  required String userId,
  required String displayName,
  String? headline,
  String? handle,
  String? avatarUrl,
  int impactScore = 0,
  int eventsAttended = 0,
  int followersCount = 0,
  List<String> skills = const [],
}) {
  HapticFeedback.lightImpact();
  final isTablet = MediaQuery.of(context).size.width >= 600;
  final screenHeight = MediaQuery.of(context).size.height;
  
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    constraints: isTablet ? BoxConstraints(
      maxHeight: screenHeight * 0.5,
      maxWidth: 500,
    ) : null,
    builder: (context) => Center(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: isTablet ? 500 : double.infinity),
        child: ShareProfileSheet(
          userId: userId,
          displayName: displayName,
          headline: headline,
          handle: handle,
          avatarUrl: avatarUrl,
          impactScore: impactScore,
          eventsAttended: eventsAttended,
          followersCount: followersCount,
          skills: skills,
        ),
      ),
    ),
  );
}
