import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/theme.dart';

/// Modern floating bottom navigation with glassmorphism effect
class ModernBottomNav extends StatelessWidget {
  final int selectedIndex;
  final ValueChanged<int> onTap;
  final int chatUnreadCount;

  const ModernBottomNav({
    super.key,
    required this.selectedIndex,
    required this.onTap,
    this.chatUnreadCount = 0,
  });

  static const _items = [
    _NavItemData(
      icon: Icons.home_outlined,
      activeIcon: Icons.home_rounded,
      label: 'Home',
    ),
    _NavItemData(
      icon: Icons.explore_outlined,
      activeIcon: Icons.explore_rounded,
      label: 'Discover',
    ),
    _NavItemData(
      icon: Icons.favorite_border_rounded,
      activeIcon: Icons.favorite_rounded,
      label: 'Impact',
    ),
    _NavItemData(
      icon: Icons.chat_bubble_outline_rounded,
      activeIcon: Icons.chat_bubble_rounded,
      label: 'Chat',
    ),
    _NavItemData(
      icon: Icons.person_outline_rounded,
      activeIcon: Icons.person_rounded,
      label: 'Profile',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: BackdropFilter(
          filter: ImageFilter.blur(
            sigmaX: isDark ? 25 : 15,
            sigmaY: isDark ? 25 : 15,
          ),
          child: Container(
            height: 64,
            decoration: BoxDecoration(
              color: isDark
                  ? AppColors.cardDark.withOpacity(0.75)
                  : cs.surface.withOpacity(0.85),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: isDark
                    ? AppColors.borderDark.withOpacity(0.4)
                    : AppColors.border.withOpacity(0.3),
                width: 1,
              ),
              boxShadow: isDark
                  ? [
                      BoxShadow(
                        color: AppColors.primary.withOpacity(0.08),
                        blurRadius: 20,
                        spreadRadius: -5,
                      ),
                    ]
                  : [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.08),
                        blurRadius: 20,
                        offset: const Offset(0, 4),
                      ),
                    ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(_items.length, (index) {
                final item = _items[index];
                final isSelected = selectedIndex == index;
                final showBadge = index == 3 && chatUnreadCount > 0;

                return _ModernNavItem(
                  icon: item.icon,
                  activeIcon: item.activeIcon,
                  label: item.label,
                  isSelected: isSelected,
                  badgeCount: showBadge ? chatUnreadCount : null,
                  onTap: () {
                    HapticFeedback.lightImpact();
                    onTap(index);
                  },
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItemData {
  final IconData icon;
  final IconData activeIcon;
  final String label;

  const _NavItemData({
    required this.icon,
    required this.activeIcon,
    required this.label,
  });
}

class _ModernNavItem extends StatefulWidget {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool isSelected;
  final int? badgeCount;
  final VoidCallback onTap;

  const _ModernNavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.isSelected,
    required this.onTap,
    this.badgeCount,
  });

  @override
  State<_ModernNavItem> createState() => _ModernNavItemState();
}

class _ModernNavItemState extends State<_ModernNavItem>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _translateAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.elasticOut),
    );

    _translateAnimation = Tween<double>(begin: 0, end: -4).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic),
    );

    if (widget.isSelected) {
      _controller.forward();
    }
  }

  @override
  void didUpdateWidget(_ModernNavItem oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isSelected != oldWidget.isSelected) {
      if (widget.isSelected) {
        _controller.forward();
      } else {
        _controller.reverse();
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: widget.onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return Transform.translate(
            offset: Offset(0, _translateAnimation.value),
            child: SizedBox(
              width: 64,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Icon with badge
                  Transform.scale(
                    scale: _scaleAnimation.value,
                    child: Stack(
                      clipBehavior: Clip.none,
                      children: [
                        // Icon with glow effect when selected
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.all(6),
                          decoration: widget.isSelected && isDark
                              ? BoxDecoration(
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: cs.primary.withOpacity(0.3),
                                      blurRadius: 12,
                                      spreadRadius: 0,
                                    ),
                                  ],
                                )
                              : null,
                          child: AnimatedSwitcher(
                            duration: const Duration(milliseconds: 200),
                            child: Icon(
                              widget.isSelected ? widget.activeIcon : widget.icon,
                              key: ValueKey(widget.isSelected),
                              size: 24,
                              color: widget.isSelected
                                  ? cs.primary
                                  : cs.onSurfaceVariant,
                            ),
                          ),
                        ),
                        // Badge
                        if (widget.badgeCount != null)
                          Positioned(
                            right: -2,
                            top: 0,
                            child: _AnimatedBadge(count: widget.badgeCount!),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 2),
                  // Label
                  AnimatedDefaultTextStyle(
                    duration: const Duration(milliseconds: 200),
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight:
                          widget.isSelected ? FontWeight.w600 : FontWeight.w400,
                      color: widget.isSelected
                          ? cs.primary
                          : cs.onSurfaceVariant,
                    ),
                    child: Text(widget.label),
                  ),
                  const SizedBox(height: 2),
                  // Dot indicator
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    curve: Curves.easeOutCubic,
                    width: widget.isSelected ? 6 : 0,
                    height: widget.isSelected ? 6 : 0,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        colors: [
                          cs.primary,
                          AppColors.accent,
                        ],
                      ),
                      boxShadow: widget.isSelected
                          ? [
                              BoxShadow(
                                color: cs.primary.withOpacity(0.4),
                                blurRadius: 6,
                                spreadRadius: 0,
                              ),
                            ]
                          : null,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _AnimatedBadge extends StatefulWidget {
  final int count;

  const _AnimatedBadge({required this.count});

  @override
  State<_AnimatedBadge> createState() => _AnimatedBadgeState();
}

class _AnimatedBadgeState extends State<_AnimatedBadge>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.elasticOut),
    );
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final displayCount = widget.count > 9 ? '9+' : widget.count.toString();

    return ScaleTransition(
      scale: _scaleAnimation,
      child: Container(
        constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
        decoration: BoxDecoration(
          color: AppColors.error,
          borderRadius: BorderRadius.circular(8),
          boxShadow: [
            BoxShadow(
              color: AppColors.error.withOpacity(0.3),
              blurRadius: 4,
              spreadRadius: 0,
            ),
          ],
        ),
        child: Text(
          displayCount,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 9,
            fontWeight: FontWeight.w600,
          ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}
