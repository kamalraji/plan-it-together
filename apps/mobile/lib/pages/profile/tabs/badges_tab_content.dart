import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/supabase/gamification_service.dart' show BadgeItem;
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/utils/animations.dart' show FadeSlideTransition, staggerDelay;
import '../widgets/profile_helper_widgets.dart';

/// Badges grid tab content with scroll position preservation
/// Enhanced with tablet responsiveness and staggered animations
class ProfileBadgesTabContent extends StatefulWidget {
  final List<BadgeItem> badges;
  final List<String> allBadgeIds;

  const ProfileBadgesTabContent({
    super.key,
    required this.badges,
    required this.allBadgeIds,
  });

  @override
  State<ProfileBadgesTabContent> createState() => _ProfileBadgesTabContentState();
}

class _ProfileBadgesTabContentState extends State<ProfileBadgesTabContent>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context); // Required for AutomaticKeepAliveClientMixin

    if (widget.badges.isEmpty) {
      return const ProfileEmptyTabContent(
        icon: Icons.emoji_events_outlined,
        title: 'No badges yet',
        subtitle: 'Participate in events to earn badges',
      );
    }

    final isTablet = MediaQuery.of(context).size.width >= 600;

    return Padding(
      padding: const EdgeInsets.all(16),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: isTablet ? 5 : 3, // 5 columns on tablet, 3 on phone
          mainAxisSpacing: 16,
          crossAxisSpacing: 16,
          childAspectRatio: 0.8,
        ),
        itemCount: widget.badges.length,
        itemBuilder: (context, index) {
          final badge = widget.badges[index];
          return _BadgeTile(badge: badge, index: index);
        },
      ),
    );
  }
}

class _BadgeTile extends StatelessWidget {
  final BadgeItem badge;
  final int index;
  final DateTime? earnedAt;

  const _BadgeTile({
    required this.badge, 
    required this.index,
    this.earnedAt,
  });

  void _showBadgeDetail(BuildContext context) {
    HapticFeedback.lightImpact();
    final cs = Theme.of(context).colorScheme;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Text(badge.icon, style: const TextStyle(fontSize: 32)),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                badge.name,
                style: context.textStyles.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              badge.description ?? 'Achievement unlocked!',
              style: context.textStyles.bodyMedium,
            ),
            if (earnedAt != null) ...[
              const SizedBox(height: 12),
              Text(
                'Earned on ${DateFormat.yMMMd().format(earnedAt!)}',
                style: context.textStyles.bodySmall?.copyWith(
                  color: cs.onSurfaceVariant,
                ),
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return FadeSlideTransition(
      delay: staggerDelay(index, baseDelay: 40),
      child: Semantics(
        button: true,
        label: '${badge.name} badge, tap for details',
        child: GestureDetector(
          onTap: () => _showBadgeDetail(context),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: cs.primary.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: ExcludeSemantics(
                    child: Text(
                      badge.icon,
                      style: const TextStyle(fontSize: 28),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                badge.name,
                style: context.textStyles.labelSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
