import 'package:flutter/material.dart';
import 'package:thittam1hub/models/impact_profile.dart';
import 'package:thittam1hub/widgets/follows_you_badge.dart';

/// Card for displaying a potential study partner with match score and shared courses/skills.
/// Uses the follower system for social actions.
class StudyPartnerCard extends StatelessWidget {
  final ImpactProfile profile;
  final int matchScore;
  final List<String> sharedCourses;
  final List<String> sharedSkills;
  final bool followsMe; // Whether this user follows the current user
  final VoidCallback? onFollow;
  final VoidCallback? onTap;

  const StudyPartnerCard({
    super.key,
    required this.profile,
    this.matchScore = 0,
    this.sharedCourses = const [],
    this.sharedSkills = const [],
    this.followsMe = false,
    this.onFollow,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundImage: profile.avatarUrl != null
                        ? NetworkImage(profile.avatarUrl!)
                        : null,
                    backgroundColor: cs.primary.withValues(alpha: 0.1),
                    child: profile.avatarUrl == null
                        ? Text(
                            profile.fullName.isNotEmpty
                                ? profile.fullName[0].toUpperCase()
                                : '?',
                            style: TextStyle(
                              color: cs.primary,
                              fontWeight: FontWeight.bold,
                              fontSize: 20,
                            ),
                          )
                        : null,
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
                                style: text.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (followsMe) ...[
                              const SizedBox(width: 8),
                              const FollowsYouChip(),
                            ],
                          ],
                        ),
                        if (profile.headline.isNotEmpty)
                          Text(
                            profile.headline,
                            style: text.bodySmall?.copyWith(
                              color: cs.onSurfaceVariant,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                      ],
                    ),
                  ),
                  if (matchScore > 0) _buildMatchBadge(context),
                ],
              ),
              if (sharedCourses.isNotEmpty) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    Icon(
                      Icons.school_outlined,
                      size: 16,
                      color: cs.primary,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Shared courses:',
                      style: text.labelSmall?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: sharedCourses.take(3).map((course) {
                    return Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: cs.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        course,
                        style: text.labelSmall?.copyWith(
                          color: cs.primary,
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
              if (sharedSkills.isNotEmpty) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    Icon(
                      Icons.handshake_outlined,
                      size: 16,
                      color: cs.secondary,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Complementary skills:',
                      style: text.labelSmall?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: sharedSkills.take(4).map((skill) {
                    return Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: cs.secondary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        skill,
                        style: text.labelSmall?.copyWith(
                          color: cs.secondary,
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  OutlinedButton.icon(
                    onPressed: onTap,
                    icon: const Icon(Icons.visibility_outlined, size: 18),
                    label: const Text('View Profile'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                    ),
                  ),
                  const SizedBox(width: 8),
                  FilledButton.icon(
                    onPressed: onFollow,
                    icon: const Icon(Icons.person_add_outlined, size: 18),
                    label: const Text('Follow'),
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMatchBadge(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;

    Color badgeColor;
    String label;

    if (matchScore >= 80) {
      badgeColor = Colors.green;
      label = 'Great Match';
    } else if (matchScore >= 50) {
      badgeColor = Colors.orange;
      label = 'Good Match';
    } else {
      badgeColor = cs.primary;
      label = '$matchScore%';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: badgeColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.stars, size: 14, color: badgeColor),
          const SizedBox(width: 4),
          Text(
            label,
            style: text.labelSmall?.copyWith(
              color: badgeColor,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
