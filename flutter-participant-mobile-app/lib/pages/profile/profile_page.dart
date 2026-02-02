/// Profile Tab - Reddit/Instagram inspired design with tabs
/// 
/// This page is a pure UI layer that delegates all business logic
/// to [ProfilePageController]. Following separation of concerns pattern.
library profile_page;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart' show Intent;
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/nav.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/utils/hero_animations.dart';
import 'package:thittam1hub/widgets/branded_refresh_indicator.dart';
import 'package:thittam1hub/widgets/cover_banner.dart';
import 'package:thittam1hub/widgets/cover_image_picker.dart';
import 'package:thittam1hub/widgets/profile_tab_bar.dart';
import 'package:thittam1hub/widgets/share_profile_sheet.dart';
import 'package:thittam1hub/services/route_analytics_service.dart';

import 'profile_page_controller.dart';
import 'widgets/profile_widgets.dart';
import 'widgets/profile_shimmer.dart';
import 'tabs/profile_tabs.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> with TickerProviderStateMixin, RouteAnalyticsMixin {
  @override
  String get analyticsRouteName => '/profile';
  
  @override
  Map<String, dynamic>? get analyticsMetadata => {
    'page_type': 'own_profile',
  };

  late final ProfilePageController _controller;
  late AnimationController _headerController;
  late Animation<double> _headerAnimation;
  
  // Keyboard navigation for tabs
  late FocusNode _tabBarFocusNode;
  final List<FocusNode> _tabFocusNodes = [];

  @override
  void initState() {
    super.initState();
    _controller = ProfilePageController();
    _controller.addListener(_onControllerUpdate);
    
    _headerController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _headerAnimation = CurvedAnimation(
      parent: _headerController,
      curve: Curves.easeOutCubic,
    );
    
    // Initialize keyboard focus nodes
    _tabBarFocusNode = FocusNode(debugLabel: 'ProfileTabBar');
    for (int i = 0; i < 4; i++) {
      _tabFocusNodes.add(FocusNode(debugLabel: 'ProfileTab_$i'));
    }
    
    if (_controller.profile != null) _headerController.forward();
  }

  void _onControllerUpdate() {
    if (mounted) {
      setState(() {});
      if (_controller.profile != null && !_headerController.isAnimating && _headerController.value == 0) {
        _headerController.forward();
      }
    }
  }

  @override
  void dispose() {
    _controller.removeListener(_onControllerUpdate);
    _controller.dispose();
    _headerController.dispose();
    _tabBarFocusNode.dispose();
    for (final node in _tabFocusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  // Keyboard navigation methods
  void _navigateToPreviousTab() {
    if (_controller.selectedTabIndex > 0) {
      _controller.setSelectedTab(_controller.selectedTabIndex - 1);
      _tabFocusNodes[_controller.selectedTabIndex].requestFocus();
    }
  }

  void _navigateToNextTab() {
    if (_controller.selectedTabIndex < 3) {
      _controller.setSelectedTab(_controller.selectedTabIndex + 1);
      _tabFocusNodes[_controller.selectedTabIndex].requestFocus();
    }
  }

  void _navigateToFirstTab() {
    _controller.setSelectedTab(0);
    _tabFocusNodes[0].requestFocus();
  }

  void _navigateToLastTab() {
    _controller.setSelectedTab(3);
    _tabFocusNodes[3].requestFocus();
  }

  Future<void> _handleLogout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Log Out'),
        content: const Text('Are you sure you want to log out?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Log Out'),
          ),
        ],
      ),
    );
    if (confirm == true) await _controller.logout();
  }

  void _shareProfile() {
    final shareData = _controller.getShareData();
    if (shareData == null) return;
    showShareProfileSheet(
      context: context,
      userId: shareData.userId,
      displayName: shareData.displayName,
      headline: shareData.headline,
      handle: shareData.handle,
      avatarUrl: shareData.avatarUrl,
      impactScore: shareData.impactScore,
      eventsAttended: shareData.eventsAttended,
      followersCount: shareData.followersCount,
      skills: shareData.skills,
    );
  }

  void _showMoreOptions() {
    HapticFeedback.lightImpact();
    final isTablet = MediaQuery.of(context).size.width >= 600;
    final screenHeight = MediaQuery.of(context).size.height;
    
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      constraints: isTablet ? BoxConstraints(
        maxHeight: screenHeight * 0.5,
        maxWidth: 500,
      ) : null,
      builder: (context) => Center(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: isTablet ? 500 : double.infinity),
          child: ProfileMoreOptionsSheet(
            onEditProfile: () {
              Navigator.pop(context);
              context.push(AppRoutes.editProfile).then((_) => _controller.loadProfile());
            },
            onSavedEvents: () { Navigator.pop(context); context.push(AppRoutes.saved); },
            onFollowers: () { Navigator.pop(context); context.push(AppRoutes.followers); },
            onTickets: () { Navigator.pop(context); context.push(AppRoutes.tickets); },
            onSettings: () { Navigator.pop(context); context.push(AppRoutes.settings); },
            onLogout: () { Navigator.pop(context); _handleLogout(); },
          ),
        ),
      ),
    );
  }

  void _showCoverPicker() {
    HapticFeedback.lightImpact();
    showCoverImagePicker(
      context: context,
      currentImageUrl: _controller.profile?.coverImageUrl,
      currentGradientId: _controller.profile?.coverGradientId,
      onSelectGradient: _handleGradientSelect,
      onSelectImage: _handleCoverUpload,
      onRemove: _handleCoverRemove,
    );
  }

  Future<void> _handleGradientSelect(String gradientId) async {
    final success = await _controller.setGradient(gradientId);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(success ? 'Cover updated' : 'Failed to update cover'), backgroundColor: success ? AppColors.success : AppColors.error),
      );
    }
  }

  Future<void> _handleCoverUpload(Uint8List bytes, String fileName) async {
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Uploading cover...')));
    final result = await _controller.uploadCoverImage(bytes, fileName);
    if (mounted) {
      switch (result) {
        case CoverSuccess(): ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cover uploaded'), backgroundColor: AppColors.success));
        case CoverFailed(message: final msg): ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to upload cover: $msg'), backgroundColor: AppColors.error));
      }
    }
  }

  Future<void> _handleCoverRemove() async {
    final success = await _controller.removeCover();
    if (mounted && success) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cover removed')));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_controller.isLoading && _controller.profile == null) {
      return const Scaffold(body: ProfileShimmer());
    }

    return Shortcuts(
      shortcuts: {
        LogicalKeySet(LogicalKeyboardKey.arrowLeft): const _PreviousTabIntent(),
        LogicalKeySet(LogicalKeyboardKey.arrowRight): const _NextTabIntent(),
        LogicalKeySet(LogicalKeyboardKey.home): const _FirstTabIntent(),
        LogicalKeySet(LogicalKeyboardKey.end): const _LastTabIntent(),
      },
      child: Actions(
        actions: {
          _PreviousTabIntent: CallbackAction<_PreviousTabIntent>(onInvoke: (_) => _navigateToPreviousTab()),
          _NextTabIntent: CallbackAction<_NextTabIntent>(onInvoke: (_) => _navigateToNextTab()),
          _FirstTabIntent: CallbackAction<_FirstTabIntent>(onInvoke: (_) => _navigateToFirstTab()),
          _LastTabIntent: CallbackAction<_LastTabIntent>(onInvoke: (_) => _navigateToLastTab()),
        },
        child: Focus(
          focusNode: _tabBarFocusNode,
          child: Scaffold(
            body: BrandedRefreshIndicator(
        onRefresh: _controller.onRefresh,
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: FadeTransition(
                opacity: _headerAnimation,
                child: Column(children: [
                  _buildCoverWithAvatar(),
                  ProfileInfoSection(
                    profile: _controller.profile,
                    onShare: _shareProfile,
                    onEdit: () => context.push(AppRoutes.editProfile).then((_) => _controller.loadProfile()),
                    onMore: _showMoreOptions,
                  ),
                  const SizedBox(height: AppSpacing.md),
                  ProfileStatsRow(stats: _controller.stats),
                  const SizedBox(height: AppSpacing.md),
                  ProfileQuickActionsRow(
                    ticketsCount: _controller.ticketsCount,
                    savedCount: _controller.savedEventsCount,
                    followersCount: _controller.followStats.followersCount,
                    followingCount: _controller.followStats.followingCount,
                    onTickets: () => context.push(AppRoutes.tickets),
                    onSaved: () => context.push(AppRoutes.saved),
                    onFollowers: () => context.push(AppRoutes.followers),
                    onQrCode: () => context.push(AppRoutes.qrCode),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  if (_controller.profile?.bio != null && _controller.profile!.bio!.isNotEmpty)
                    ProfileBioSection(profile: _controller.profile!),
                ]),
              ),
            ),
            SliverPersistentHeader(
              pinned: true,
              delegate: ProfileTabBarDelegate(
                tabs: const [
                  ProfileTabItem(icon: Icons.grid_view_outlined, activeIcon: Icons.grid_view, label: 'Posts'),
                  ProfileTabItem(icon: Icons.event_outlined, activeIcon: Icons.event, label: 'Events'),
                  ProfileTabItem(icon: Icons.emoji_events_outlined, activeIcon: Icons.emoji_events, label: 'Badges'),
                  ProfileTabItem(icon: Icons.person_outline, activeIcon: Icons.person, label: 'About'),
                ],
                selectedIndex: _controller.selectedTabIndex,
                onTabSelected: _controller.setSelectedTab,
              ),
            ),
            SliverToBoxAdapter(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                child: _buildTabContent(),
              ),
            ),
          ],
        ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCoverWithAvatar() {
    final cs = Theme.of(context).colorScheme;
    final avatarUrl = _controller.profile?.avatarUrl;
    final fullName = _controller.profile?.fullName ?? 'User';
    final userId = _controller.currentUserId ?? '';
    
    List<Color>? gradientColors;
    if (_controller.profile?.coverGradientId != null) {
      final theme = CoverGradientTheme.presets.where((t) => t.id == _controller.profile!.coverGradientId).firstOrNull;
      gradientColors = theme?.colors;
    }

    return Stack(
      clipBehavior: Clip.none,
      children: [
        CoverBanner(
          imageUrl: _controller.profile?.coverImageUrl,
          gradientColors: gradientColors,
          height: 120,
          showEditButton: true,
          onEditTap: _showCoverPicker,
        ),
        Positioned(
          left: 16, bottom: -40,
          child: Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: cs.surface, width: 4),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 8, offset: const Offset(0, 2))],
            ),
            child: AnimatedHero(
              tag: HeroConfig.profileAvatarTag(userId),
              child: Semantics(
                label: '$fullName profile picture',
                image: true,
                child: CircleAvatar(
                  radius: 40,
                  backgroundColor: cs.primary,
                  backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
                  child: avatarUrl == null ? Text(fullName[0].toUpperCase(), style: context.textStyles.headlineMedium?.copyWith(color: cs.onPrimary)) : null,
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 160),
      ],
    );
  }

  Widget _buildTabContent() {
    switch (_controller.selectedTabIndex) {
      case 0: return ProfilePostsTabContent(posts: _controller.posts);
      case 1: return ProfileEventsTabContent(upcoming: _controller.upcomingEvents, history: _controller.eventHistory);
      case 2: return ProfileBadgesTabContent(badges: _controller.earnedBadges, allBadgeIds: _controller.myBadgeIds);
      case 3: return ProfileAboutTabContent(profile: _controller.profile, stats: _controller.stats, onLogout: _handleLogout);
      default: return const SizedBox.shrink();
    }
  }
}

// Intent classes for keyboard navigation
class _PreviousTabIntent extends Intent {
  const _PreviousTabIntent();
}

class _NextTabIntent extends Intent {
  const _NextTabIntent();
}

class _FirstTabIntent extends Intent {
  const _FirstTabIntent();
}

class _LastTabIntent extends Intent {
  const _LastTabIntent();
}
