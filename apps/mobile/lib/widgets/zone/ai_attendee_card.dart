import 'package:flutter/material.dart';
import 'package:thittam1hub/models/networking_models.dart';
import 'package:thittam1hub/widgets/styled_avatar.dart';
import 'package:thittam1hub/pages/impact/widgets/ai_match_badge.dart';
import 'package:thittam1hub/widgets/zone/session_overlap_badge.dart';

/// Enhanced attendee card with AI match scoring for Zone networking
class AIAttendeeCard extends StatelessWidget {
  final SmartMatch match;
  final String? currentSessionName;
  final bool isInSameSession;
  final VoidCallback? onTap;
  final VoidCallback? onSayHi;

  const AIAttendeeCard({
    super.key,
    required this.match,
    this.currentSessionName,
    this.isInSameSession = false,
    this.onTap,
    this.onSayHi,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final profile = match.profile;
    final isHighMatch = match.matchScore >= 70;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isHighMatch 
                ? _getMatchColor(match.matchScore).withOpacity(0.4) 
                : cs.outline.withOpacity(0.1),
            width: isHighMatch ? 2 : 1,
          ),
          boxShadow: isHighMatch
              ? [
                  BoxShadow(
                    color: _getMatchColor(match.matchScore).withOpacity(0.15),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Avatar with badges
            Stack(
              clipBehavior: Clip.none,
              children: [
                StyledAvatar(
                  imageUrl: profile.avatarUrl,
                  name: profile.fullName,
                  size: 52,
                  isOnline: match.isOnline,
                ),
                // High match indicator
                if (match.matchScore >= 85)
                  Positioned(
                    left: -4,
                    top: -4,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.orange,
                        shape: BoxShape.circle,
                        border: Border.all(color: cs.surface, width: 2),
                      ),
                      child: const Icon(
                        Icons.local_fire_department_rounded,
                        size: 10,
                        color: Colors.white,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            
            // Name
            Text(
              profile.fullName,
              style: textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
            ),
            
            // Headline or organization
            if (profile.headline.isNotEmpty || profile.organization != null) ...[
              const SizedBox(height: 2),
              Text(
                profile.headline.isNotEmpty 
                    ? profile.headline 
                    : profile.organization ?? '',
                style: textTheme.bodySmall?.copyWith(
                  color: cs.onSurfaceVariant,
                  fontSize: 11,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
              ),
            ],
            
            const SizedBox(height: 8),
            
            // Match score badge
            AIMatchBadge(
              matchScore: match.matchScore,
              matchCategory: match.matchCategory,
              compact: true,
            ),
            
            // Session overlap indicator
            if (isInSameSession && currentSessionName != null) ...[
              const SizedBox(height: 6),
              SameSessionBadge(sessionName: currentSessionName!),
            ] else if (match.commonSkills.isNotEmpty || match.commonInterests.isNotEmpty) ...[
              const SizedBox(height: 4),
              _buildQuickInsight(cs),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildQuickInsight(ColorScheme cs) {
    final insight = match.commonSkills.isNotEmpty
        ? match.commonSkills.first
        : match.commonInterests.first;
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: cs.tertiaryContainer.withOpacity(0.5),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        insight,
        style: TextStyle(
          fontSize: 9,
          color: cs.onTertiaryContainer,
          fontWeight: FontWeight.w500,
        ),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
    );
  }

  Color _getMatchColor(int score) {
    if (score >= 85) return Colors.orange;
    if (score >= 70) return Colors.teal;
    if (score >= 50) return Colors.blue;
    return Colors.grey;
  }
}

/// Compact list tile version of AI attendee card
class AIAttendeeListTile extends StatelessWidget {
  final SmartMatch match;
  final String? currentSessionName;
  final bool isInSameSession;
  final VoidCallback? onTap;

  const AIAttendeeListTile({
    super.key,
    required this.match,
    this.currentSessionName,
    this.isInSameSession = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final profile = match.profile;
    final isHighMatch = match.matchScore >= 70;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isHighMatch 
              ? _getMatchColor(match.matchScore).withOpacity(0.05)
              : null,
          borderRadius: BorderRadius.circular(12),
          border: isHighMatch
              ? Border.all(
                  color: _getMatchColor(match.matchScore).withOpacity(0.2),
                )
              : null,
        ),
        child: Row(
          children: [
            StyledAvatar(
              imageUrl: profile.avatarUrl,
              name: profile.fullName,
              size: 48,
              isOnline: match.isOnline,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          profile.fullName,
                          style: textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (match.matchScore >= 85) ...[
                        const SizedBox(width: 4),
                        Icon(
                          Icons.local_fire_department_rounded,
                          size: 14,
                          color: Colors.orange,
                        ),
                      ],
                    ],
                  ),
                  if (profile.headline.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      profile.headline,
                      style: textTheme.bodySmall?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      AIMatchBadge(
                        matchScore: match.matchScore,
                        matchCategory: match.matchCategory,
                        compact: true,
                      ),
                      if (isInSameSession) ...[
                        const SizedBox(width: 6),
                        SessionOverlapBadge(
                          overlapCount: 1,
                          currentSession: 'Same room',
                          compact: true,
                        ),
                      ],
                      if (match.commonSkills.isNotEmpty) ...[
                        const SizedBox(width: 6),
                        _buildSkillChip(cs, match.commonSkills.first),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            Icon(
              Icons.chevron_right_rounded,
              color: cs.onSurfaceVariant.withOpacity(0.5),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSkillChip(ColorScheme cs, String skill) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: cs.primaryContainer.withOpacity(0.5),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        skill,
        style: TextStyle(
          fontSize: 10,
          color: cs.onPrimaryContainer,
          fontWeight: FontWeight.w500,
        ),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
    );
  }

  Color _getMatchColor(int score) {
    if (score >= 85) return Colors.orange;
    if (score >= 70) return Colors.teal;
    if (score >= 50) return Colors.blue;
    return Colors.grey;
  }
}
