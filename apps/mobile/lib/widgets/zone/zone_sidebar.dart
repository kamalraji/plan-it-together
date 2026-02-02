import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/zone_section.dart';
import 'package:thittam1hub/theme.dart';

/// Persistent sidebar navigation for Zone on tablet/desktop
/// Provides always-visible section navigation with collapsible rail mode
class ZoneSidebar extends StatelessWidget {
  final ZoneSection currentSection;
  final String eventName;
  final ValueChanged<ZoneSection> onSectionChanged;
  final VoidCallback onCheckOut;
  final Map<ZoneSection, int>? notificationCounts;
  final bool isExpanded;
  final VoidCallback? onToggleExpanded;

  const ZoneSidebar({
    super.key,
    required this.currentSection,
    required this.eventName,
    required this.onSectionChanged,
    required this.onCheckOut,
    this.notificationCounts,
    this.isExpanded = true,
    this.onToggleExpanded,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final width = isExpanded ? 240.0 : 72.0;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeOutCubic,
      width: width,
      decoration: BoxDecoration(
        color: cs.surfaceContainerLowest,
        border: Border(
          right: BorderSide(
            color: cs.outlineVariant.withOpacity(0.5),
            width: 1,
          ),
        ),
      ),
      child: Column(
        children: [
          // Header
          _buildHeader(context, cs),

          const SizedBox(height: AppSpacing.sm),

          // Section list
          Expanded(
            child: ListView.builder(
              padding: EdgeInsets.symmetric(
                horizontal: isExpanded ? AppSpacing.sm : 8,
                vertical: AppSpacing.sm,
              ),
              itemCount: ZoneSection.values.length,
              itemBuilder: (context, index) {
                final section = ZoneSection.values[index];
                final isActive = section == currentSection;
                final color = section.getColor(cs);
                final count = notificationCounts?[section] ?? 0;

                return _ZoneSidebarItem(
                  section: section,
                  isActive: isActive,
                  isExpanded: isExpanded,
                  color: color,
                  badgeCount: count,
                  onTap: () {
                    HapticFeedback.selectionClick();
                    onSectionChanged(section);
                  },
                );
              },
            ),
          ),

          // Collapse toggle
          if (onToggleExpanded != null)
            _buildCollapseButton(context, cs),

          // Check out button
          _buildCheckOutButton(context, cs),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context, ColorScheme cs) {
    final textTheme = Theme.of(context).textTheme;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: EdgeInsets.symmetric(
        horizontal: isExpanded ? AppSpacing.lg : AppSpacing.sm,
        vertical: AppSpacing.md,
      ),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: cs.outline.withOpacity(0.1)),
        ),
      ),
      child: Row(
        children: [
          // Zone icon
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: cs.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              Icons.location_on_rounded,
              color: cs.primary,
              size: 20,
            ),
          ),
          if (isExpanded) ...[
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Zone',
                    style: textTheme.labelSmall?.copyWith(
                      color: cs.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    eventName,
                    style: textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildCollapseButton(BuildContext context, ColorScheme cs) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.sm),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            HapticFeedback.lightImpact();
            onToggleExpanded?.call();
          },
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: EdgeInsets.symmetric(
              horizontal: isExpanded ? AppSpacing.md : AppSpacing.sm,
              vertical: AppSpacing.sm,
            ),
            child: Row(
              mainAxisAlignment:
                  isExpanded ? MainAxisAlignment.start : MainAxisAlignment.center,
              children: [
                AnimatedRotation(
                  turns: isExpanded ? 0 : 0.5,
                  duration: const Duration(milliseconds: 200),
                  child: Icon(
                    Icons.chevron_left,
                    size: 20,
                    color: cs.onSurfaceVariant,
                  ),
                ),
                if (isExpanded) ...[
                  const SizedBox(width: AppSpacing.sm),
                  Text(
                    'Collapse',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: cs.onSurfaceVariant,
                        ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCheckOutButton(BuildContext context, ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.sm),
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(color: cs.outline.withOpacity(0.1)),
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onCheckOut,
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: EdgeInsets.symmetric(
              horizontal: isExpanded ? AppSpacing.md : AppSpacing.sm,
              vertical: AppSpacing.sm + 4,
            ),
            decoration: BoxDecoration(
              color: cs.error.withOpacity(0.1),
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
              border: Border.all(color: cs.error.withOpacity(0.2)),
            ),
            child: Row(
              mainAxisAlignment:
                  isExpanded ? MainAxisAlignment.start : MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.logout_rounded,
                  size: 20,
                  color: cs.error,
                ),
                if (isExpanded) ...[
                  const SizedBox(width: AppSpacing.sm),
                  Text(
                    'Check Out',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: cs.error,
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Individual sidebar item with active state and badge
class _ZoneSidebarItem extends StatelessWidget {
  final ZoneSection section;
  final bool isActive;
  final bool isExpanded;
  final Color color;
  final int badgeCount;
  final VoidCallback onTap;

  const _ZoneSidebarItem({
    required this.section,
    required this.isActive,
    required this.isExpanded,
    required this.color,
    required this.badgeCount,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            padding: EdgeInsets.symmetric(
              horizontal: isExpanded ? AppSpacing.md : AppSpacing.sm,
              vertical: AppSpacing.sm + 2,
            ),
            decoration: BoxDecoration(
              color: isActive ? color.withOpacity(0.12) : Colors.transparent,
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
              border: isActive
                  ? Border.all(color: color.withOpacity(0.2), width: 1)
                  : null,
            ),
            child: Row(
              mainAxisAlignment:
                  isExpanded ? MainAxisAlignment.start : MainAxisAlignment.center,
              children: [
                // Icon with glow when active
                AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: isActive
                        ? color.withOpacity(0.2)
                        : cs.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                    boxShadow: isActive
                        ? [
                            BoxShadow(
                              color: color.withOpacity(0.3),
                              blurRadius: 8,
                            ),
                          ]
                        : null,
                  ),
                  child: Icon(
                    section.icon,
                    size: 18,
                    color: isActive ? color : cs.onSurfaceVariant,
                  ),
                ),

                if (isExpanded) ...[
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Text(
                      section.label,
                      style: textTheme.bodyMedium?.copyWith(
                        color: isActive ? cs.onSurface : cs.onSurfaceVariant,
                        fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),

                  // Badge or active indicator
                  if (badgeCount > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [color, color.withOpacity(0.8)],
                        ),
                        borderRadius: BorderRadius.circular(10),
                        boxShadow: [
                          BoxShadow(
                            color: color.withOpacity(0.4),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Text(
                        badgeCount > 99 ? '99+' : badgeCount.toString(),
                        style: textTheme.labelSmall?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 10,
                        ),
                      ),
                    )
                  else if (isActive)
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: color,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: color.withOpacity(0.5),
                            blurRadius: 6,
                          ),
                        ],
                      ),
                    ),
                ] else if (badgeCount > 0)
                  // Badge in collapsed mode
                  Positioned(
                    right: 0,
                    top: 0,
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: color,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
