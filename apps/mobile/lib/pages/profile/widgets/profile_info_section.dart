import 'package:flutter/material.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/theme.dart';
import 'profile_helper_widgets.dart';

/// Profile info section with name, handle, and action buttons
class ProfileInfoSection extends StatelessWidget {
  final UserProfile? profile;
  final VoidCallback onShare;
  final VoidCallback onEdit;
  final VoidCallback onMore;

  const ProfileInfoSection({
    super.key,
    required this.profile,
    required this.onShare,
    required this.onEdit,
    required this.onMore,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final fullName = profile?.fullName ?? 'User';
    final email = SupabaseConfig.auth.currentUser?.email ?? '';
    final username = profile?.username;
    final handle = username != null && username.isNotEmpty 
        ? '@$username' 
        : '@${email.split('@').first}';
    final organization = profile?.organization;

    return Semantics(
      label: '$fullName profile information',
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 48, 16, 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        fullName,
                        style: context.textStyles.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        handle,
                        style: context.textStyles.bodyMedium?.copyWith(
                          color: cs.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                Row(
                  children: [
                    Semantics(
                      button: true,
                      label: 'Edit profile',
                      child: ProfileActionChip(
                        label: 'Edit',
                        icon: Icons.edit_outlined,
                        onTap: onEdit,
                        isPrimary: true,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Semantics(
                      button: true,
                      label: 'Share profile',
                      child: ProfileIconButton(
                        icon: Icons.share_outlined,
                        onTap: onShare,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Semantics(
                      button: true,
                      label: 'More options',
                      child: ProfileIconButton(
                        icon: Icons.more_horiz,
                        onTap: onMore,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            if (organization != null && organization.isNotEmpty) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  ExcludeSemantics(
                    child: Icon(Icons.business_outlined, size: 14, color: cs.onSurfaceVariant),
                  ),
                  const SizedBox(width: 4),
                  Flexible(
                    child: Semantics(
                      label: 'Organization: $organization',
                      child: Text(
                        organization,
                        style: context.textStyles.bodySmall?.copyWith(
                          color: cs.onSurfaceVariant,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
