import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/zone_section.dart';
import 'package:thittam1hub/theme.dart';

/// Floating Action Button with expandable section navigation menu
/// Provides quick access to all Zone sections with animated transitions
class ZoneNavigationFAB extends StatefulWidget {
  final ZoneSection currentSection;
  final ValueChanged<ZoneSection> onSectionChanged;
  final Map<ZoneSection, int>? notificationCounts;

  const ZoneNavigationFAB({
    super.key,
    required this.currentSection,
    required this.onSectionChanged,
    this.notificationCounts,
  });

  @override
  State<ZoneNavigationFAB> createState() => _ZoneNavigationFABState();
}

class _ZoneNavigationFABState extends State<ZoneNavigationFAB>
    with TickerProviderStateMixin {
  bool _isExpanded = false;
  late AnimationController _mainController;
  late AnimationController _staggerController;
  late Animation<double> _rotationAnimation;
  late Animation<double> _scaleAnimation;
  late Animation<double> _backdropAnimation;

  @override
  void initState() {
    super.initState();
    
    _mainController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    
    _staggerController = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );

    _rotationAnimation = Tween<double>(begin: 0, end: 0.125).animate(
      CurvedAnimation(parent: _mainController, curve: Curves.easeOutBack),
    );
    
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.9).animate(
      CurvedAnimation(parent: _mainController, curve: Curves.easeOutCubic),
    );

    _backdropAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _mainController, curve: Curves.easeOutCubic),
    );
  }

  @override
  void dispose() {
    _mainController.dispose();
    _staggerController.dispose();
    super.dispose();
  }

  void _toggleExpanded() {
    HapticFeedback.mediumImpact();
    setState(() => _isExpanded = !_isExpanded);

    if (_isExpanded) {
      _mainController.forward();
      _staggerController.forward(from: 0);
    } else {
      _mainController.reverse();
      _staggerController.reverse();
    }
  }

  void _selectSection(ZoneSection section) {
    HapticFeedback.selectionClick();
    widget.onSectionChanged(section);
    _toggleExpanded();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final sectionColor = widget.currentSection.getColor(cs);

    return Stack(
      alignment: Alignment.bottomRight,
      clipBehavior: Clip.none,
      children: [
        // Backdrop scrim when expanded
        if (_isExpanded)
          Positioned.fill(
            child: GestureDetector(
              onTap: _toggleExpanded,
              child: AnimatedBuilder(
                animation: _backdropAnimation,
                builder: (context, child) {
                  return Container(
                    color: Colors.black.withOpacity(_backdropAnimation.value * 0.4),
                  );
                },
              ),
            ),
          ),

        // Menu and FAB container
        Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            // Expanded menu
            AnimatedBuilder(
              animation: _mainController,
              builder: (context, child) {
                return Transform.scale(
                  scale: 0.8 + (_mainController.value * 0.2),
                  alignment: Alignment.bottomRight,
                  child: Opacity(
                    opacity: _mainController.value,
                    child: Transform.translate(
                      offset: Offset(0, 30 * (1 - _mainController.value)),
                      child: child,
                    ),
                  ),
                );
              },
              child: _isExpanded 
                  ? _buildExpandedMenu(context) 
                  : const SizedBox.shrink(),
            ),

            const SizedBox(height: 16),

            // Main FAB with pulse animation when collapsed
            AnimatedBuilder(
              animation: _scaleAnimation,
              builder: (context, child) {
                return Transform.scale(
                  scale: _isExpanded ? _scaleAnimation.value : 1.0,
                  child: child,
                );
              },
              child: _buildMainFAB(context, cs, sectionColor),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildMainFAB(BuildContext context, ColorScheme cs, Color sectionColor) {
    final totalNotifications = widget.notificationCounts?.values
        .fold<int>(0, (sum, count) => sum + count) ?? 0;

    return Stack(
      clipBehavior: Clip.none,
      children: [
        // Glow effect
        if (!_isExpanded)
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: sectionColor.withOpacity(0.4),
                    blurRadius: 20,
                    spreadRadius: 2,
                  ),
                ],
              ),
            ),
          ),
        
        // Main FAB
        FloatingActionButton(
          heroTag: 'zone_nav_fab',
          onPressed: _toggleExpanded,
          backgroundColor: _isExpanded 
              ? cs.surfaceContainerHighest 
              : sectionColor,
          foregroundColor: _isExpanded 
              ? cs.onSurface 
              : Colors.white,
          elevation: _isExpanded ? 2 : 6,
          child: RotationTransition(
            turns: _rotationAnimation,
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 200),
              child: Icon(
                _isExpanded ? Icons.close_rounded : widget.currentSection.icon,
                key: ValueKey(_isExpanded),
              ),
            ),
          ),
        ),
        
        // Notification badge
        if (totalNotifications > 0 && !_isExpanded)
          Positioned(
            right: -4,
            top: -4,
            child: TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: 1),
              duration: const Duration(milliseconds: 300),
              curve: Curves.elasticOut,
              builder: (context, value, child) {
                return Transform.scale(
                  scale: value,
                  child: child,
                );
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: cs.error,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: cs.surface, width: 2),
                ),
                child: Text(
                  totalNotifications > 99 ? '99+' : totalNotifications.toString(),
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: cs.onError,
                    fontWeight: FontWeight.bold,
                    fontSize: 10,
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildExpandedMenu(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final sections = ZoneSection.values;

    return Container(
      constraints: const BoxConstraints(maxWidth: 240),
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
        border: Border.all(color: cs.outline.withOpacity(0.08)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.15),
            blurRadius: 24,
            offset: const Offset(0, 8),
            spreadRadius: 0,
          ),
          BoxShadow(
            color: cs.primary.withOpacity(0.05),
            blurRadius: 40,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: List.generate(sections.length, (index) {
          final section = sections[index];
          final isActive = section == widget.currentSection;
          final color = section.getColor(cs);
          final count = widget.notificationCounts?[section] ?? 0;

          // Staggered animation for each item
          final itemAnimation = Tween<double>(begin: 0, end: 1).animate(
            CurvedAnimation(
              parent: _staggerController,
              curve: Interval(
                index * 0.08,
                0.4 + (index * 0.08),
                curve: Curves.easeOutCubic,
              ),
            ),
          );

          return AnimatedBuilder(
            animation: itemAnimation,
            builder: (context, child) {
              return Transform.translate(
                offset: Offset(20 * (1 - itemAnimation.value), 0),
                child: Opacity(
                  opacity: itemAnimation.value,
                  child: child,
                ),
              );
            },
            child: _SectionMenuItem(
              section: section,
              isActive: isActive,
              color: color,
              badgeCount: count,
              onTap: () => _selectSection(section),
            ),
          );
        }),
      ),
    );
  }
}

class _SectionMenuItem extends StatefulWidget {
  final ZoneSection section;
  final bool isActive;
  final Color color;
  final int badgeCount;
  final VoidCallback onTap;

  const _SectionMenuItem({
    required this.section,
    required this.isActive,
    required this.color,
    required this.badgeCount,
    required this.onTap,
  });

  @override
  State<_SectionMenuItem> createState() => _SectionMenuItemState();
}

class _SectionMenuItemState extends State<_SectionMenuItem> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) => setState(() => _isPressed = false),
      onTapCancel: () => setState(() => _isPressed = false),
      onTap: widget.onTap,
      child: AnimatedScale(
        scale: _isPressed ? 0.96 : 1.0,
        duration: const Duration(milliseconds: 100),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOutCubic,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: widget.isActive 
                ? widget.color.withOpacity(0.12) 
                : Colors.transparent,
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            border: widget.isActive
                ? Border.all(color: widget.color.withOpacity(0.2))
                : null,
          ),
          child: Row(
            children: [
              // Icon container
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: widget.isActive 
                      ? widget.color.withOpacity(0.2) 
                      : cs.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                  boxShadow: widget.isActive
                      ? [
                          BoxShadow(
                            color: widget.color.withOpacity(0.3),
                            blurRadius: 8,
                            spreadRadius: 0,
                          ),
                        ]
                      : null,
                ),
                child: Icon(
                  widget.section.icon,
                  size: 18,
                  color: widget.isActive ? widget.color : cs.onSurfaceVariant,
                ),
              ),
              const SizedBox(width: 12),
              
              // Label
              Expanded(
                child: Text(
                  widget.section.label,
                  style: textTheme.bodyMedium?.copyWith(
                    fontWeight: widget.isActive ? FontWeight.bold : FontWeight.w500,
                    color: widget.isActive ? cs.onSurface : cs.onSurfaceVariant,
                  ),
                ),
              ),
              
              // Badge or active indicator
              if (widget.badgeCount > 0)
                TweenAnimationBuilder<double>(
                  tween: Tween(begin: 0.8, end: 1),
                  duration: const Duration(milliseconds: 200),
                  curve: Curves.elasticOut,
                  builder: (context, value, child) {
                    return Transform.scale(scale: value, child: child);
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          widget.color,
                          widget.color.withOpacity(0.8),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: [
                        BoxShadow(
                          color: widget.color.withOpacity(0.4),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Text(
                      widget.badgeCount > 99 ? '99+' : widget.badgeCount.toString(),
                      style: textTheme.labelSmall?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 10,
                      ),
                    ),
                  ),
                )
              else if (widget.isActive)
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: widget.color,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: widget.color.withOpacity(0.5),
                        blurRadius: 6,
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
