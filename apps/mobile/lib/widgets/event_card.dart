import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/utils/animations.dart';
import 'package:thittam1hub/utils/hero_animations.dart';
import 'package:thittam1hub/utils/icon_mappings.dart';
class EventCard extends StatelessWidget {
  final Event event;
  final List<TicketTier> tiers;
  final bool saved;
  final VoidCallback onTap;
  final VoidCallback onToggleSave;
  final bool enableHero;

  const EventCard({
    super.key,
    required this.event,
    required this.tiers,
    required this.saved,
    required this.onTap,
    required this.onToggleSave,
    this.enableHero = true,
  });

  String _formatDateRange(DateTime start, DateTime end) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final s = start.toLocal();
    final hour = s.hour % 12 == 0 ? 12 : s.hour % 12;
    final min = s.minute.toString().padLeft(2, '0');
    final ampm = s.hour < 12 ? 'AM' : 'PM';
    final datePart = '${months[s.month - 1]} ${s.day}';
    final timePart = '$hour:$min $ampm';
    return '$datePart • $timePart';
  }

  /// Get category color from centralized IconMappings
  Color _categoryColor(EventCategory category) =>
      IconMappings.getEventCategoryColor(category);

  /// Get category icon from centralized IconMappings
  IconData _categoryIcon(EventCategory category) =>
      IconMappings.getEventCategoryIcon(category);

  (IconData, Color, String) _modeBadge(EventMode mode) => switch (mode) {
        EventMode.ONLINE => (Icons.public, Colors.blue, 'Online'),
        EventMode.OFFLINE => (Icons.place, Colors.green, 'Offline'),
        EventMode.HYBRID => (Icons.group, Colors.purple, 'Hybrid'),
      };

  String _priceLabel(List<TicketTier> tiers) {
    if (tiers.isEmpty) return '';
    final prices = tiers.map((t) => t.price).where((p) => p >= 0).toList()..sort();
    if (prices.isEmpty) return '';
    if (prices.first == 0) return 'Free';
    final lowest = prices.first.toStringAsFixed(0);
    return '₹$lowest';
  }

  ImageProvider _imageProvider(String urlOrAsset) {
    if (urlOrAsset.isEmpty) {
      return const NetworkImage('https://images.unsplash.com/photo-1540575467063-178a50c2df87');
    }
    if (urlOrAsset.startsWith('http')) return NetworkImage(urlOrAsset);
    return AssetImage(urlOrAsset);
  }

  /// Build semantic label for screen readers
  String _buildSemanticLabel() {
    final parts = <String>[event.name];
    parts.add('by ${event.organization.name}');
    parts.add(_formatDateRange(event.startDate, event.endDate));
    parts.add(event.category.displayName);
    parts.add(_modeBadge(event.mode).$3);
    if (saved) parts.add('Saved');
    final price = _priceLabel(tiers);
    if (price.isNotEmpty) parts.add(price);
    return parts.join(', ');
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;
    final (icon, clr, label) = _modeBadge(event.mode);
    final priceText = _priceLabel(tiers);
    final bannerHeroTag = HeroConfig.eventBannerTag(event.id);
    final titleHeroTag = HeroConfig.eventTitleTag(event.id);

    return Semantics(
      button: true,
      label: _buildSemanticLabel(),
      child: TapScaleWidget(
        onTap: onTap,
        child: Container(
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: cs.outline.withValues(alpha: 0.4)),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image section with Hero animation
            Stack(
              children: [
                AnimatedHero(
                  tag: bannerHeroTag,
                  enabled: enableHero,
                  child: AspectRatio(
                    aspectRatio: 2.1,
                    child: Image(
                      image: _imageProvider(event.branding.bannerUrl),
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                // Save button with haptic feedback
                Positioned(
                  right: 6,
                  top: 6,
                  child: Material(
                    color: Colors.black.withValues(alpha: 0.4),
                    borderRadius: BorderRadius.circular(999),
                    child: InkWell(
                      onTap: () {
                        HapticFeedback.mediumImpact();
                        onToggleSave();
                      },
                      borderRadius: BorderRadius.circular(999),
                      child: Padding(
                        padding: const EdgeInsets.all(6),
                        child: AnimatedSwitcher(
                          duration: const Duration(milliseconds: 200),
                          child: Icon(
                            saved ? Icons.favorite : Icons.favorite_border,
                            key: ValueKey(saved),
                            color: saved ? Colors.redAccent : Colors.white,
                            size: 18,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                // Bottom row: Category badge (left) + Mode badge (right)
                Positioned(
                  left: 6,
                  right: 6,
                  bottom: 6,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Category badge - prominent with icon
                      _CategoryBadge(
                        icon: _categoryIcon(event.category),
                        label: event.category.displayName,
                        color: _categoryColor(event.category),
                      ),
                      // Mode badge - styled to match
                      _ModeBadge(icon: icon, label: label, color: clr),
                    ],
                  ),
                ),
                // Status badge (top-left)
                if (event.status == EventStatus.ONGOING)
                  const Positioned(left: 6, top: 6, child: _LiveBadge())
                else if (event.status == EventStatus.PUBLISHED)
                  const Positioned(
                    left: 6,
                    top: 6,
                    child: _CompactBadge(label: 'Soon', color: Colors.orange),
                  ),
              ],
            ),
            // Info section - compact padding
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextHero(
                    tag: titleHeroTag,
                    enabled: enableHero,
                    child: Text(
                      event.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: text.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: cs.onSurface,
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.calendar_today, size: 12, color: cs.onSurfaceVariant),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          _formatDateRange(event.startDate, event.endDate),
                          style: text.bodySmall?.copyWith(
                            color: cs.onSurfaceVariant,
                            fontSize: 11,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      // Organization logo
                      Builder(builder: (_) {
                        final orgLogo = event.organization.logoUrl;
                        final hasLogo = orgLogo.isNotEmpty;
                        return CircleAvatar(
                          radius: 10,
                          backgroundColor: cs.surfaceContainerHighest,
                          backgroundImage: hasLogo ? _imageProvider(orgLogo) : null,
                          child: hasLogo ? null : Icon(Icons.apartment, size: 10, color: cs.onSurfaceVariant),
                        );
                      }),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          event.organization.name,
                          style: text.bodySmall?.copyWith(
                            fontWeight: FontWeight.w500,
                            fontSize: 11,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (priceText.isNotEmpty) _PriceBadge(text: priceText),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
        ),
      ),
    );
  }
}

/// Prominent category badge with large icon and colored background
class _CategoryBadge extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _CategoryBadge({
    required this.icon,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            color.withValues(alpha: 0.95),
            color.withValues(alpha: 0.85),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(6),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.4),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.25),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Icon(icon, size: 12, color: Colors.white),
          ),
          const SizedBox(width: 6),
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              fontSize: 9,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

/// Mode badge - styled to complement category badge on right side
class _ModeBadge extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _ModeBadge({
    required this.icon,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.95),
        borderRadius: BorderRadius.circular(6),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.15),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Icon(icon, size: 12, color: color),
          ),
          const SizedBox(width: 6),
          Text(
            label.toUpperCase(),
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w800,
              fontSize: 9,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

/// Compact badge for status indicators
class _CompactBadge extends StatelessWidget {
  final IconData? icon;
  final String label;
  final Color color;

  const _CompactBadge({this.icon, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(4),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 10, color: color),
            const SizedBox(width: 3),
          ],
          Text(
            label.toUpperCase(),
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w800,
              fontSize: 9,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }
}

class _LiveBadge extends StatefulWidget {
  const _LiveBadge();

  @override
  State<_LiveBadge> createState() => _LiveBadgeState();
}

class _LiveBadgeState extends State<_LiveBadge> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1000),
  )..repeat(reverse: true);
  late final Animation<double> _scale = Tween<double>(begin: 0.8, end: 1.2).animate(
    CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
  );

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          ScaleTransition(
            scale: _scale,
            child: Container(
              width: 6,
              height: 6,
              decoration: const BoxDecoration(
                color: AppColors.error,
                shape: BoxShape.circle,
              ),
            ),
          ),
          const SizedBox(width: 4),
          const Text(
            'LIVE',
            style: TextStyle(
              color: AppColors.error,
              fontWeight: FontWeight.w800,
              fontSize: 9,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }
}

class _PriceBadge extends StatelessWidget {
  final String text;
  const _PriceBadge({required this.text});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isFree = text.toLowerCase() == 'free';
    final bg = isFree ? AppColors.success.withValues(alpha: 0.12) : cs.surfaceContainerHighest;
    final border = isFree ? AppColors.success.withValues(alpha: 0.4) : cs.outline.withValues(alpha: 0.4);
    final fg = isFree ? AppColors.success : cs.primary;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: border),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: fg,
          fontWeight: FontWeight.w700,
          fontSize: 10,
        ),
      ),
    );
  }
}
