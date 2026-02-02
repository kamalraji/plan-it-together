import 'package:flutter/material.dart';
import 'package:thittam1hub/theme.dart';

/// Profile tab item configuration
class ProfileTabItem {
  final IconData icon;
  final IconData? activeIcon;
  final String label;

  const ProfileTabItem({
    required this.icon,
    this.activeIcon,
    required this.label,
  });
}

/// Custom tab bar for profile page with icon + label and animated underline
class ProfileTabBar extends StatelessWidget {
  final List<ProfileTabItem> tabs;
  final int selectedIndex;
  final ValueChanged<int> onTabSelected;

  const ProfileTabBar({
    super.key,
    required this.tabs,
    required this.selectedIndex,
    required this.onTabSelected,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      height: 48,
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: cs.outline.withValues(alpha: 0.2),
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: List.generate(tabs.length, (index) {
          final isSelected = index == selectedIndex;
          final tab = tabs[index];

          return Expanded(
            child: GestureDetector(
              onTap: () => onTabSelected(index),
              behavior: HitTestBehavior.opaque,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: isSelected ? cs.primary : Colors.transparent,
                      width: 2,
                    ),
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      isSelected ? (tab.activeIcon ?? tab.icon) : tab.icon,
                      size: 20,
                      color: isSelected ? cs.primary : cs.onSurfaceVariant,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      tab.label,
                      style: context.textStyles.labelSmall?.copyWith(
                        color: isSelected ? cs.primary : cs.onSurfaceVariant,
                        fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}
