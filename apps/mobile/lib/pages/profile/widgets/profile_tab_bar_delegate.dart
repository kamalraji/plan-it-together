import 'package:flutter/material.dart';
import 'package:thittam1hub/widgets/profile_tab_bar.dart';

/// Sliver persistent header delegate for profile tab bar
class ProfileTabBarDelegate extends SliverPersistentHeaderDelegate {
  final List<ProfileTabItem> tabs;
  final int selectedIndex;
  final ValueChanged<int> onTabSelected;

  const ProfileTabBarDelegate({
    required this.tabs,
    required this.selectedIndex,
    required this.onTabSelected,
  });

  @override
  double get minExtent => 48;

  @override
  double get maxExtent => 48;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return ProfileTabBar(
      tabs: tabs,
      selectedIndex: selectedIndex,
      onTabSelected: onTabSelected,
    );
  }

  @override
  bool shouldRebuild(covariant ProfileTabBarDelegate oldDelegate) =>
      oldDelegate.selectedIndex != selectedIndex;
}
