import 'package:flutter/material.dart';
import '../../models/competition_models.dart';

/// Displays earned competition badges with animations
class CompetitionBadgeCard extends StatelessWidget {
  final List<CompetitionBadge> badges;
  final List<CompetitionBadge>? newlyEarnedBadges;
  final bool isLoading;

  const CompetitionBadgeCard({
    super.key,
    required this.badges,
    this.newlyEarnedBadges,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    if (isLoading) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Center(child: CircularProgressIndicator()),
        ),
      );
    }

    if (badges.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              Icon(
                Icons.emoji_events_outlined,
                size: 48,
                color: colorScheme.outline,
              ),
              const SizedBox(height: 12),
              Text(
                'No Badges Yet',
                style: theme.textTheme.titleMedium?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Answer questions to earn badges!',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: colorScheme.outline,
                ),
              ),
            ],
          ),
        ),
      );
    }

    final earnedBadges = badges.where((b) => b.isEarned).toList();
    final availableBadges = badges.where((b) => !b.isEarned).toList();

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.military_tech, color: colorScheme.primary),
                const SizedBox(width: 8),
                Text(
                  'Badges',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${earnedBadges.length}/${badges.length}',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: colorScheme.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (earnedBadges.isNotEmpty) ...[
              Text(
                'Earned',
                style: theme.textTheme.labelMedium?.copyWith(
                  color: colorScheme.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: earnedBadges.map((badge) => _BadgeItem(
                  badge: badge,
                  isNewlyEarned: newlyEarnedBadges?.any((b) => b.id == badge.id) ?? false,
                )).toList(),
              ),
            ],
            if (availableBadges.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text(
                'Available',
                style: theme.textTheme.labelMedium?.copyWith(
                  color: colorScheme.outline,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: availableBadges.map((badge) => _BadgeItem(
                  badge: badge,
                  isLocked: true,
                )).toList(),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _BadgeItem extends StatefulWidget {
  final CompetitionBadge badge;
  final bool isNewlyEarned;
  final bool isLocked;

  const _BadgeItem({
    required this.badge,
    this.isNewlyEarned = false,
    this.isLocked = false,
  });

  @override
  State<_BadgeItem> createState() => _BadgeItemState();
}

class _BadgeItemState extends State<_BadgeItem> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.elasticOut),
    );

    if (widget.isNewlyEarned) {
      _controller.forward();
    } else {
      _controller.value = 1.0;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Color _getRarityColor() {
    switch (widget.badge.rarity.toUpperCase()) {
      case 'LEGENDARY':
        return Colors.amber;
      case 'EPIC':
        return Colors.purple;
      case 'RARE':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final rarityColor = _getRarityColor();

    return AnimatedBuilder(
      animation: _scaleAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: child,
        );
      },
      child: GestureDetector(
        onTap: () => _showBadgeDetails(context),
        child: Container(
          width: 80,
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: widget.isLocked
                ? colorScheme.surfaceContainerHighest.withOpacity(0.5)
                : rarityColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: widget.isLocked
                  ? colorScheme.outline.withOpacity(0.3)
                  : rarityColor.withOpacity(0.5),
              width: widget.isNewlyEarned ? 2 : 1,
            ),
            boxShadow: widget.isNewlyEarned
                ? [
                    BoxShadow(
                      color: rarityColor.withOpacity(0.3),
                      blurRadius: 8,
                      spreadRadius: 1,
                    ),
                  ]
                : null,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Stack(
                children: [
                  Text(
                    widget.badge.icon,
                    style: TextStyle(
                      fontSize: 32,
                      color: widget.isLocked ? Colors.grey : null,
                    ),
                  ),
                  if (widget.isLocked)
                    Positioned.fill(
                      child: Container(
                        decoration: BoxDecoration(
                          color: colorScheme.surface.withOpacity(0.5),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(
                          Icons.lock_outline,
                          size: 20,
                          color: colorScheme.outline,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                widget.badge.name,
                style: theme.textTheme.labelSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: widget.isLocked
                      ? colorScheme.outline
                      : colorScheme.onSurface,
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

  void _showBadgeDetails(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final rarityColor = _getRarityColor();

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: rarityColor.withOpacity(0.1),
                shape: BoxShape.circle,
                border: Border.all(color: rarityColor, width: 2),
              ),
              child: Text(
                widget.badge.icon,
                style: const TextStyle(fontSize: 48),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              widget.badge.name,
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: rarityColor.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                widget.badge.rarity,
                style: theme.textTheme.labelSmall?.copyWith(
                  color: rarityColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              widget.badge.description,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.star, color: Colors.amber, size: 20),
                const SizedBox(width: 4),
                Text(
                  '+${widget.badge.pointsValue} points',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            if (widget.badge.isEarned) ...[
              const SizedBox(height: 16),
              Text(
                'Earned on ${_formatDate(widget.badge.earnedAt!)}',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: colorScheme.outline,
                ),
              ),
            ],
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
