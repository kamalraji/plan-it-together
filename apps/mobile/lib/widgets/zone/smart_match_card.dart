import 'package:flutter/material.dart';
import '../../models/networking_models.dart';
import '../../models/impact_profile.dart';
import '../styled_avatar.dart';
import '../match_insights_card.dart';
import '../follows_you_badge.dart';
import 'ai_match_detail_sheet.dart';

/// Card displaying a smart match with AI-enhanced insights and quick actions
class SmartMatchCard extends StatelessWidget {
  final SmartMatch match;
  final bool followsMe;
  final VoidCallback? onSayHi;
  final VoidCallback? onScheduleMeeting;
  final VoidCallback? onViewProfile;

  const SmartMatchCard({
    super.key,
    required this.match,
    this.followsMe = false,
    this.onSayHi,
    this.onScheduleMeeting,
    this.onViewProfile,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final profile = match.profile;
    final hasAIInsights = match.commonSkills.isNotEmpty || 
                          match.commonInterests.isNotEmpty ||
                          match.matchNarrative != null;

    return Container(
      width: 180,
      margin: const EdgeInsets.only(right: 12),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: theme.dividerColor.withOpacity(0.3),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: InkWell(
        onTap: () => AIMatchDetailSheet.show(
          context,
          match: match,
          onSayHi: onSayHi,
          onScheduleMeeting: onScheduleMeeting,
          onViewProfile: onViewProfile,
        ),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Avatar with online + AI indicator
              Stack(
                clipBehavior: Clip.none,
                children: [
                  StyledAvatar(
                    imageUrl: profile.avatarUrl,
                    name: profile.fullName,
                    size: 56,
                  ),
                  // Online indicator
                  if (match.isOnline)
                    Positioned(
                      right: 0,
                      bottom: 0,
                      child: Container(
                        width: 14,
                        height: 14,
                        decoration: BoxDecoration(
                          color: Colors.green,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: theme.cardColor,
                            width: 2,
                          ),
                        ),
                      ),
                    ),
                  // AI insights sparkle
                  if (hasAIInsights)
                    Positioned(
                      left: -4,
                      top: -4,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.primaryContainer,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.auto_awesome,
                          size: 12,
                          color: theme.colorScheme.primary,
                        ),
                      ),
                    ),
                ],
              ),

              const SizedBox(height: 8),

              // Name
              Text(
                profile.fullName,
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
              ),

              // Follows you badge (use prop or match field)
              if (followsMe || match.followsYou) ...[
                const SizedBox(height: 4),
                const FollowsYouChip(),
              ],

              const SizedBox(height: 2),

              // Headline or match insight
              Text(
                _getSubtitle(profile),
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.textTheme.bodySmall?.color?.withOpacity(0.7),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 8),

              // Enhanced match score badge
              _buildMatchBadge(context, match),

              const SizedBox(height: 12),

              // Quick actions
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildActionButton(
                    context,
                    icon: Icons.chat_bubble_outline,
                    tooltip: 'Say Hi',
                    onTap: onSayHi,
                  ),
                  const SizedBox(width: 8),
                  _buildActionButton(
                    context,
                    icon: Icons.calendar_today_outlined,
                    tooltip: 'Schedule',
                    onTap: onScheduleMeeting,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _getSubtitle(ImpactProfile profile) {
    // Show first common skill/interest if available
    if (match.commonSkills.isNotEmpty) {
      return 'Also knows ${match.commonSkills.first}';
    }
    if (match.commonInterests.isNotEmpty) {
      return 'Shares ${match.commonInterests.first}';
    }
    // Fallback to headline
    if (profile.headline.isNotEmpty) {
      return profile.headline;
    }
    return profile.organization ?? '';
  }

  Widget _buildMatchBadge(BuildContext context, SmartMatch match) {
    final score = match.matchScore;
    final category = match.matchCategory ?? 'discovery';
    
    Color badgeColor;
    IconData badgeIcon;

    if (score >= 85) {
      badgeColor = Colors.green;
      badgeIcon = Icons.local_fire_department_rounded;
    } else if (score >= 70) {
      badgeColor = Colors.teal;
      badgeIcon = Icons.star_rounded;
    } else if (score >= 50) {
      badgeColor = Colors.orange;
      badgeIcon = Icons.thumb_up_rounded;
    } else {
      badgeColor = Theme.of(context).colorScheme.primary;
      badgeIcon = Icons.person_add_rounded;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: badgeColor.withOpacity(0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: badgeColor.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(badgeIcon, size: 14, color: badgeColor),
          const SizedBox(width: 4),
          Text(
            '$score%',
            style: TextStyle(
              color: badgeColor,
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
          ),
          // Category indicator
          if (category != 'discovery') ...[
            const SizedBox(width: 4),
            Icon(
              _getCategoryIcon(category),
              size: 12,
              color: badgeColor.withOpacity(0.7),
            ),
          ],
        ],
      ),
    );
  }

  IconData _getCategoryIcon(String category) {
    switch (category) {
      case 'professional':
        return Icons.work_outline;
      case 'mutual_interest':
        return Icons.people_outline;
      case 'similar_background':
        return Icons.school_outlined;
      case 'event_connection':
        return Icons.event_outlined;
      default:
        return Icons.explore_outlined;
    }
  }

  Widget _buildActionButton(
    BuildContext context, {
    required IconData icon,
    required String tooltip,
    VoidCallback? onTap,
  }) {
    final theme = Theme.of(context);

    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: theme.colorScheme.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            icon,
            size: 18,
            color: theme.colorScheme.primary,
          ),
        ),
      ),
    );
  }
}
