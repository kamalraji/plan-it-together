import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/models/impact_profile.dart';
import 'package:thittam1hub/nav.dart';
import 'package:thittam1hub/widgets/glassmorphism_bottom_sheet.dart';
import 'package:thittam1hub/utils/hero_animations.dart';

/// Shows a glassmorphism profile actions bottom sheet
void showProfileActionsSheet(
  BuildContext context,
  ImpactProfile profile, {
  VoidCallback? onFollow,
  VoidCallback? onMessage,
  VoidCallback? onSave,
  VoidCallback? onBlock,
  VoidCallback? onViewProfile,
  @Deprecated('Use onFollow instead') VoidCallback? onConnect,
}) {
  final avatarHeroTag = HeroConfig.profileAvatarTag(profile.userId);
  final nameHeroTag = HeroConfig.profileNameTag(profile.userId);
  
  showGlassBottomSheet(
    context: context,
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Profile header with Hero widgets
        _HeroProfileHeader(
          avatarUrl: profile.avatarUrl,
          name: profile.fullName,
          subtitle: profile.headline,
          avatarHeroTag: avatarHeroTag,
          nameHeroTag: nameHeroTag,
        ),
        const SizedBox(height: 20),
        
        // Actions
        GlassActionList(
          actions: [
            GlassActionButton(
              icon: Icons.person_add_outlined,
              label: 'Follow',
              onTap: () {
                Navigator.pop(context);
                (onFollow ?? onConnect)?.call();
              },
              color: const Color(0xFF8B5CF6),
            ),
            GlassActionButton(
              icon: Icons.chat_bubble_outline,
              label: 'Send Message',
              onTap: () {
                Navigator.pop(context);
                onMessage?.call();
              },
            ),
            GlassActionButton(
              icon: Icons.bookmark_outline,
              label: 'Save Profile',
              onTap: () {
                Navigator.pop(context);
                onSave?.call();
              },
            ),
            GlassActionButton(
              icon: Icons.person_outline,
              label: 'View Full Profile',
              onTap: () {
                Navigator.pop(context);
                if (onViewProfile != null) {
                  onViewProfile();
                } else {
                  // Navigate with hero transition
                  context.push(AppRoutes.impactProfile(profile.userId), extra: profile);
                }
              },
            ),
            GlassActionButton(
              icon: Icons.block_outlined,
              label: 'Block User',
              onTap: () {
                Navigator.pop(context);
                _showBlockConfirmation(context, profile.fullName, onBlock);
              },
              isDestructive: true,
            ),
          ],
        ),
      ],
    ),
  );
}

void _showBlockConfirmation(BuildContext context, String name, VoidCallback? onBlock) {
  showDialog(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('Block User'),
      content: Text('Are you sure you want to block $name? They won\'t be able to see your profile or send you messages.'),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: () {
            Navigator.pop(context);
            onBlock?.call();
          },
          style: FilledButton.styleFrom(
            backgroundColor: Colors.red,
          ),
          child: const Text('Block'),
        ),
      ],
    ),
  );
}

/// Shows a quick profile preview in a glassmorphism bottom sheet
void showProfilePreviewSheet(
  BuildContext context,
  ImpactProfile profile, {
  VoidCallback? onFollow,
  VoidCallback? onViewProfile,
  @Deprecated('Use onFollow instead') VoidCallback? onConnect,
}) {
  final isDark = Theme.of(context).brightness == Brightness.dark;
  
  showGlassBottomSheet(
    context: context,
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Avatar
        CircleAvatar(
          radius: 48,
          backgroundImage: profile.avatarUrl != null
              ? NetworkImage(profile.avatarUrl!)
              : null,
          backgroundColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.2),
          child: profile.avatarUrl == null
              ? Text(
                  profile.fullName.isNotEmpty ? profile.fullName[0].toUpperCase() : '?',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w600,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                )
              : null,
        ),
        const SizedBox(height: 16),
        
        // Name
        Text(
          profile.fullName,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
          ),
          textAlign: TextAlign.center,
        ),
        
        // Headline
        if (profile.headline.isNotEmpty) ...[
          const SizedBox(height: 4),
          Text(
            profile.headline,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: isDark ? Colors.white60 : Colors.black54,
            ),
            textAlign: TextAlign.center,
          ),
        ],
        
        // Organization
        if (profile.organization != null) ...[
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.business,
                size: 16,
                color: isDark ? Colors.white38 : Colors.black38,
              ),
              const SizedBox(width: 4),
              Text(
                profile.organization!,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: isDark ? Colors.white60 : Colors.black54,
                ),
              ),
            ],
          ),
        ],
        const SizedBox(height: 20),
        
        // Stats row
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.03),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _StatItem(
                value: '${profile.level}',
                label: 'Level',
                icon: Icons.trending_up,
              ),
              Container(
                width: 1,
                height: 40,
                color: isDark ? Colors.white12 : Colors.black12,
              ),
              _StatItem(
                value: '${profile.impactScore}',
                label: 'Impact',
                icon: Icons.bolt,
              ),
              Container(
                width: 1,
                height: 40,
                color: isDark ? Colors.white12 : Colors.black12,
              ),
              _StatItem(
                value: '${profile.badges.length}',
                label: 'Badges',
                icon: Icons.emoji_events,
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        
        // Interests
        if (profile.interests.isNotEmpty) ...[
          Wrap(
            spacing: 8,
            runSpacing: 8,
            alignment: WrapAlignment.center,
            children: profile.interests.take(5).map((interest) {
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  interest,
                  style: TextStyle(
                    fontSize: 12,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 20),
        ],
        
        // Action buttons
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () {
                  Navigator.pop(context);
                  onViewProfile?.call();
                },
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text('View Profile'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: FilledButton(
                onPressed: () {
                  Navigator.pop(context);
                  (onFollow ?? onConnect)?.call();
                },
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text('Follow'),
              ),
            ),
          ],
        ),
      ],
    ),
  );
}

class _StatItem extends StatelessWidget {
  final String value;
  final String label;
  final IconData icon;

  const _StatItem({
    required this.value,
    required this.label,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      children: [
        Icon(
          icon,
          size: 18,
          color: Theme.of(context).colorScheme.primary,
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: isDark ? Colors.white60 : Colors.black54,
          ),
        ),
      ],
    );
  }
}

/// Hero-enabled profile header for bottom sheets with smooth avatar/name transitions
class _HeroProfileHeader extends StatelessWidget {
  final String? avatarUrl;
  final String name;
  final String? subtitle;
  final String avatarHeroTag;
  final String nameHeroTag;

  const _HeroProfileHeader({
    this.avatarUrl,
    required this.name,
    this.subtitle,
    required this.avatarHeroTag,
    required this.nameHeroTag,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          AnimatedHero(
            tag: avatarHeroTag,
            child: CircleAvatar(
              radius: 28,
              backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl!) : null,
              backgroundColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.2),
              child: avatarUrl == null
                  ? Text(
                      name.isNotEmpty ? name[0].toUpperCase() : '?',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w600,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                    )
                  : null,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextHero(
                  tag: nameHeroTag,
                  child: Text(
                    name,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    subtitle!,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: isDark ? Colors.white60 : Colors.black54,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
