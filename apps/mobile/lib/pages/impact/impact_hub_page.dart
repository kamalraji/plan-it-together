import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/models/impact_profile.dart';
import 'package:thittam1hub/supabase/impact_service.dart';
import 'package:thittam1hub/models/follower.dart';
import 'package:thittam1hub/services/followers_service.dart';
import 'package:thittam1hub/supabase/gamification_service.dart';
import 'pulse_page.dart';
import 'zone_page.dart';
import 'vibe_page.dart';
import 'package:thittam1hub/widgets/glassmorphism_bottom_sheet.dart';
import 'package:thittam1hub/widgets/shimmer_loading.dart';
import 'package:thittam1hub/widgets/branded_refresh_indicator.dart';
import 'package:thittam1hub/widgets/score_detail_sheet.dart';
import 'package:thittam1hub/nav.dart';

import 'package:thittam1hub/services/logging_service.dart';
class ImpactHubPage extends StatefulWidget {
  final String? initialTab;
  final String? initialIntent;
  final String? initialMode;
  final String? initialEventId;
  final String? initialSection;
  final bool? initialInside;
  final String? initialSessionId;

  const ImpactHubPage({
    Key? key,
    this.initialTab,
    this.initialIntent,
    this.initialMode,
    this.initialEventId,
    this.initialSection,
    this.initialInside,
    this.initialSessionId,
  }) : super(key: key);

  @override
  _ImpactHubPageState createState() => _ImpactHubPageState();
}

class _ImpactHubPageState extends State<ImpactHubPage> {
  // Logging
  static final _log = LoggingService.instance;
  static const String _tag = 'ImpactHubPage';
  
  int _selectedIndex = 0;
  late PageController _pageController;
  final ImpactService _impactService = ImpactService();
  final FollowersService _followersService = FollowersService.instance;
  ImpactProfile? _myProfile;
  List<FollowRequest> _pendingRequests = [];
  bool _profileLoading = true;
  bool _profileError = false;
  bool _showConfetti = false;
  String? _celebrationMessage;

  // Real-time pending request count
  int _pendingRequestCount = 0;
  StreamSubscription? _pendingRequestSubscription;

  // Search state
  final TextEditingController _searchController = TextEditingController();
  bool _isSearching = false;
  String _searchQuery = '';

  List<Widget> get _pages => [
        PulsePage(
          initialIntent: widget.initialIntent,
          initialMode: widget.initialMode,
          searchQuery: _searchQuery.isEmpty ? null : _searchQuery,
        ),
        ZonePage(
          searchQuery: _searchQuery.isEmpty ? null : _searchQuery,
          eventId: widget.initialEventId,
          section: widget.initialSection,
          initialInside: widget.initialInside,
          initialSessionId: widget.initialSessionId,
        ),
        VibePage(searchQuery: _searchQuery.isEmpty ? null : _searchQuery),
      ];

  static const _tabNames = ['pulse', 'zone', 'vibe'];
  static const _tabLabels = ['Pulse', 'Zone', 'Vibe'];
  static const _tabIcons = [
    Icons.explore_rounded,
    Icons.location_on_rounded,
    Icons.gamepad_rounded,
  ];

  @override
  void initState() {
    super.initState();
    _selectedIndex = _getInitialTabIndex();
    _pageController = PageController(initialPage: _selectedIndex);
    _loadMyProfile();
    _subscribeToPendingRequests();
  }

  int _getInitialTabIndex() {
    if (widget.initialTab != null) {
      final index = _tabNames.indexOf(widget.initialTab!.toLowerCase());
      return index >= 0 ? index : 0;
    }
    return 0;
  }

  @override
  void didUpdateWidget(ImpactHubPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialTab != oldWidget.initialTab &&
        widget.initialTab != null) {
      final index = _tabNames.indexOf(widget.initialTab!.toLowerCase());
      if (index >= 0 && index != _selectedIndex) {
        _onModeTapped(index);
      }
    }
  }

  @override
  void dispose() {
    _pendingRequestSubscription?.cancel();
    _searchController.dispose();
    _pageController.dispose();
    super.dispose();
  }

  void _subscribeToPendingRequests() {
    try {
      _pendingRequestSubscription = _followersService.subscribeToPendingRequestCount(
        onUpdate: (count) {
          if (mounted) {
            setState(() => _pendingRequestCount = count);
          }
        },
      );
    } catch (e) {
      _log.error('Error subscribing to pending requests: $e', tag: _tag);
    }
  }

  Future<void> _loadMyProfile() async {
    if (!_profileLoading) {
      setState(() => _profileLoading = true);
    }
    try {
      final profile = await _impactService.getMyImpactProfile();
      if (mounted) {
        setState(() {
          _myProfile = profile;
          _profileLoading = false;
          _profileError = profile == null;
        });
      }
    } catch (e) {
      _log.error('Error loading profile: $e', tag: _tag);
      if (mounted) {
        setState(() {
          _profileLoading = false;
          _profileError = true;
        });
      }
    }
  }

  Future<void> _onRefresh() async {
    HapticFeedback.mediumImpact();
    await _loadMyProfile();
  }

  void _toggleSearch() {
    HapticFeedback.lightImpact();
    setState(() {
      _isSearching = !_isSearching;
      if (!_isSearching) {
        _searchController.clear();
        _searchQuery = '';
      }
    });
  }

  void _onSearchChanged(String query) {
    setState(() => _searchQuery = query);
  }

  String _getSearchHint() {
    switch (_selectedIndex) {
      case 0:
        return 'Search people, groups...';
      case 1:
        return 'Search sessions, attendees...';
      case 2:
        return 'Search games, challenges...';
      default:
        return 'Search...';
    }
  }

  Future<void> _loadPendingRequests() async {
    final items = await _followersService.getPendingRequests();
    if (mounted) setState(() => _pendingRequests = items);
  }

  void _showRequestsSheet() async {
    await _loadPendingRequests();
    if (!mounted) return;
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    showGlassBottomSheet(
      context: context,
      title: 'Follow Requests',
      maxHeight: MediaQuery.of(context).size.height * 0.7,
      actions: [Chip(label: Text('${_pendingRequests.length}'))],
      child: _pendingRequests.isEmpty
          ? Center(
              child: Padding(
              padding: const EdgeInsets.all(32),
              child: Text('No pending requests',
                  style: textTheme.bodyMedium
                      ?.copyWith(color: cs.onSurfaceVariant)),
            ))
          : ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _pendingRequests.length,
              itemBuilder: (context, index) {
                final r = _pendingRequests[index];
                return Card(
                  margin: const EdgeInsets.symmetric(vertical: 8),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundImage: r.requesterAvatar != null
                          ? NetworkImage(r.requesterAvatar!)
                          : null,
                      child: r.requesterAvatar == null
                          ? Text(r.requesterName.isNotEmpty
                              ? r.requesterName[0]
                              : '?')
                          : null,
                    ),
                    title: Text(r.requesterName),
                    subtitle: r.requesterHeadline != null
                        ? Text(r.requesterHeadline!, maxLines: 1, overflow: TextOverflow.ellipsis)
                        : null,
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          tooltip: 'Decline',
                          icon: Icon(Icons.close, color: cs.error),
                          onPressed: () async {
                            await _followersService.declineFollowRequest(r.id);
                            await _loadPendingRequests();
                            if (mounted)
                              ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                      content:
                                          Text('Declined ${r.requesterName}')));
                          },
                        ),
                        IconButton(
                          tooltip: 'Accept',
                          icon: Icon(Icons.check_circle, color: cs.primary),
                          onPressed: () async {
                            await _followersService.acceptFollowRequest(r.id);
                            await _loadPendingRequests();
                            if (mounted)
                              ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                      content: Text(
                                          '${r.requesterName} is now following you!')));
                          },
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }

  void _showScoreDetailSheet() {
    if (_myProfile == null) return;
    showGlassBottomSheet(
      context: context,
      title: 'Impact Score',
      maxHeight: MediaQuery.of(context).size.height * 0.85,
      child: ScoreDetailSheetContent(profile: _myProfile!),
    );
  }

  void _onPageChanged(int index) {
    setState(() {
      _selectedIndex = index;
    });
    _updateUrl(index);
  }

  void _onModeTapped(int index) {
    HapticFeedback.lightImpact();
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  void _updateUrl(int index) {
    final tabName = _tabNames[index];
    context.replace(AppRoutes.impactWithTab(tabName));
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      body: BrandedRefreshIndicator(
        onRefresh: _onRefresh,
        child: NestedScrollView(
          headerSliverBuilder: (BuildContext context, bool innerBoxIsScrolled) {
            return <Widget>[
              SliverAppBar(
                backgroundColor: cs.surface,
                surfaceTintColor: Colors.transparent,
                pinned: true,
                floating: true,
                snap: true,
              expandedHeight: MediaQuery.of(context).size.width < 600 ? 56.0 : 64.0,
                collapsedHeight: MediaQuery.of(context).size.width < 600 ? 56.0 : 64.0,
                toolbarHeight: MediaQuery.of(context).size.width < 600 ? 56.0 : 64.0,
                automaticallyImplyLeading: false,
                title: Row(
                  children: [
                    // Left: Impact Hub Logo
                    _ImpactHubLogoInline(),
                    const Spacer(),
                    // Center: Tab Dropdown
                    _TabDropdown(
                      selectedIndex: _selectedIndex,
                      labels: _tabLabels,
                      icons: _tabIcons,
                      onChanged: _onModeTapped,
                    ),
                    const Spacer(),
                    // Right: Pending Requests Badge + Score Badge + Search
                    if (_pendingRequestCount > 0)
                      _PendingRequestsBadge(
                        count: _pendingRequestCount,
                        onTap: _showRequestsSheet,
                      ),
                    _ImpactScoreBadge(
                      profile: _myProfile,
                      isLoading: _profileLoading,
                      onTap: _showScoreDetailSheet,
                    ),
                    SizedBox(width: 4),
                    _HeaderIconButton(
                      icon: _isSearching ? Icons.close_rounded : Icons.search_rounded,
                      onPressed: _toggleSearch,
                    ),
                  ],
                ),
              ),
              // Expandable Search Bar
              SliverToBoxAdapter(
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    curve: Curves.easeInOut,
                    height: _isSearching ? 64 : 0,
                    child: _isSearching
                        ? Padding(
                            padding: EdgeInsets.symmetric(
                                horizontal: MediaQuery.of(context).size.width < 600 ? 16.0 : (MediaQuery.of(context).size.width < 1200 ? 24.0 : 32.0),
                                vertical: 8),
                          child: TextField(
                            controller: _searchController,
                            autofocus: true,
                            decoration: InputDecoration(
                              hintText: _getSearchHint(),
                              prefixIcon: Icon(Icons.search,
                                  color: cs.onSurfaceVariant),
                              suffixIcon: _searchQuery.isNotEmpty
                                  ? IconButton(
                                      icon: Icon(Icons.clear,
                                          color: cs.onSurfaceVariant),
                                      onPressed: () {
                                        _searchController.clear();
                                        _onSearchChanged('');
                                      },
                                    )
                                  : null,
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(30),
                                borderSide: BorderSide.none,
                              ),
                              filled: true,
                              fillColor: cs.surfaceContainerHighest,
                              contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 12),
                            ),
                            onChanged: _onSearchChanged,
                          ),
                        )
                      : const SizedBox.shrink(),
                ),
              ),
            ];
          },
          body: PageView(
            controller: _pageController,
            onPageChanged: _onPageChanged,
            physics: const BouncingScrollPhysics(),
            children: _pages,
          ),
        ),
      ),
    );
  }
}

// ============ Impact Hub Logo Inline ============

class _ImpactHubLogoInline extends StatelessWidget {
  const _ImpactHubLogoInline();

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    // Brand colors
    const gradientStart = Color(0xFF8B5CF6);
    const gradientEnd = Color(0xFF06B6D4);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 26,
          height: 26,
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [gradientStart, gradientEnd],
            ),
          ),
          child: const Center(
            child: Icon(
              Icons.volunteer_activism_rounded,
              size: 14,
              color: Colors.white,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          'Impact Hub',
          style: textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: cs.onSurface,
            letterSpacing: 0.3,
          ),
        ),
      ],
    );
  }
}

// ============ Tab Dropdown Selector ============

class _TabDropdown extends StatelessWidget {
  final int selectedIndex;
  final List<String> labels;
  final List<IconData> icons;
  final Function(int) onChanged;

  const _TabDropdown({
    required this.selectedIndex,
    required this.labels,
    required this.icons,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return PopupMenuButton<int>(
      onSelected: onChanged,
      offset: const Offset(0, 48),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      color: cs.surface,
      surfaceTintColor: cs.surfaceTint,
      elevation: 8,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: cs.primary.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: cs.primary.withOpacity(0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icons[selectedIndex], size: 18, color: cs.primary),
            const SizedBox(width: 6),
            Text(
              labels[selectedIndex],
              style: textTheme.labelLarge?.copyWith(
                color: cs.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(width: 4),
            Icon(Icons.keyboard_arrow_down_rounded,
                size: 18, color: cs.primary),
          ],
        ),
      ),
      itemBuilder: (context) => List.generate(
        labels.length,
        (index) => PopupMenuItem<int>(
          value: index,
          child: Row(
            children: [
              Icon(
                icons[index],
                size: 20,
                color:
                    index == selectedIndex ? cs.primary : cs.onSurfaceVariant,
              ),
              const SizedBox(width: 12),
              Text(
                labels[index],
                style: textTheme.bodyMedium?.copyWith(
                  color: index == selectedIndex ? cs.primary : cs.onSurface,
                  fontWeight: index == selectedIndex
                      ? FontWeight.w600
                      : FontWeight.normal,
                ),
              ),
              if (index == selectedIndex) ...[
                const Spacer(),
                Icon(Icons.check_rounded, size: 18, color: cs.primary),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ============ Pending Requests Badge ============

class _PendingRequestsBadge extends StatelessWidget {
  final int count;
  final VoidCallback onTap;

  const _PendingRequestsBadge({
    required this.count,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: cs.primary,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: cs.primary.withOpacity(0.3),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.person_add_rounded, size: 14, color: cs.onPrimary),
                const SizedBox(width: 4),
                Text(
                  count > 99 ? '99+' : '$count',
                  style: textTheme.labelSmall?.copyWith(
                    color: cs.onPrimary,
                    fontWeight: FontWeight.bold,
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

// ============ Compact Impact Score Badge ============

class _ImpactScoreBadge extends StatelessWidget {
  final ImpactProfile? profile;
  final bool isLoading;
  final VoidCallback onTap;

  const _ImpactScoreBadge({
    required this.profile,
    required this.isLoading,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    if (isLoading) {
      return ShimmerLoading(
        child: Container(
          width: 70,
          height: 32,
          decoration: BoxDecoration(
            color: cs.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      );
    }

    final score = profile?.impactScore ?? 0;
    final level = profile?.level ?? 1;
    final streak = profile?.streakCount ?? 0;

    // Format score compactly
    String scoreText;
    if (score >= 1000) {
      scoreText = '${(score / 1000).toStringAsFixed(1)}K';
    } else {
      scoreText = '$score';
    }

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                cs.primary.withOpacity(0.15),
                cs.tertiary.withOpacity(0.1),
              ],
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: cs.primary.withOpacity(0.2)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.bolt_rounded, size: 14, color: Colors.amber),
              const SizedBox(width: 2),
              Text(
                scoreText,
                style: textTheme.labelSmall?.copyWith(
                  color: cs.onSurface,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 4),
                width: 3,
                height: 3,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: cs.onSurfaceVariant.withOpacity(0.5),
                ),
              ),
              Text(
                'Lv$level',
                style: textTheme.labelSmall?.copyWith(
                  color: cs.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
              if (streak > 0) ...[
                const SizedBox(width: 4),
                Icon(Icons.local_fire_department_rounded,
                    size: 12, color: Colors.orange),
                Text(
                  '$streak',
                  style: textTheme.labelSmall?.copyWith(
                    color: Colors.orange,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ============ Header Icon Button ============

class _HeaderIconButton extends StatelessWidget {
  final IconData icon;
  final int badgeCount;
  final VoidCallback onPressed;

  const _HeaderIconButton({
    required this.icon,
    this.badgeCount = 0,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Stack(
      children: [
        IconButton(
          icon: Icon(icon, color: cs.onSurface),
          onPressed: onPressed,
          visualDensity: VisualDensity.compact,
        ),
        if (badgeCount > 0)
          Positioned(
            right: 6,
            top: 6,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: cs.error,
                shape: BoxShape.circle,
              ),
              constraints: const BoxConstraints(
                minWidth: 16,
                minHeight: 16,
              ),
              child: Text(
                badgeCount > 9 ? '9+' : '$badgeCount',
                style: TextStyle(
                  color: cs.onError,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
      ],
    );
  }
}

// ============ Stat Tile for Score Detail Sheet ============

class _StatTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String label;
  final String value;

  const _StatTile({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Icon(icon, size: 28, color: iconColor),
          const SizedBox(height: 8),
          Text(
            value,
            style: textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            label,
            style: textTheme.bodySmall?.copyWith(
              color: cs.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

// ============ Skeleton Widgets ============
// Note: _AppBarAvatarSkeleton removed - use AppBarAvatarSkeleton from animations.dart
// import 'package:thittam1hub/utils/animations.dart';

// ============ Badges & Leaderboard Content ============

class BadgesContent extends StatefulWidget {
  const BadgesContent({Key? key}) : super(key: key);

  @override
  State<BadgesContent> createState() => _BadgesContentState();
}

class _BadgesContentState extends State<BadgesContent> {
  static final _log = LoggingService.instance;
  static const String _tag = 'BadgesContent';
  
  final GamificationService _gamificationService = GamificationService.instance;
  List<Map<String, dynamic>> _earnedBadges = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadBadges();
  }

  Future<void> _loadBadges() async {
    try {
      final badgeIds = await _gamificationService.getMyBadgeIds();
      final allBadges = await _gamificationService.getAllBadges();
      final earnedBadges = allBadges
          .where((b) => badgeIds.contains(b.id))
          .map((b) => {
                'id': b.id,
                'name': b.name,
                'description': b.description,
                'icon': b.icon,
                'category': b.category,
                'points_required': b.pointsRequired,
                'rarity': b.rarity,
              })
          .toList();
      if (mounted) {
        setState(() {
          _earnedBadges = earnedBadges;
          _loading = false;
        });
      }
    } catch (e) {
      _log.error('Error loading badges: $e', tag: _tag);
      if (mounted) setState(() => _loading = false);
    }
  }

  IconData _getBadgeIcon(String category) {
    switch (category.toUpperCase()) {
      case 'NETWORKING':
        return Icons.hub_rounded;
      case 'ENGAGEMENT':
        return Icons.thumb_up_rounded;
      case 'CONTENT':
        return Icons.create_rounded;
      case 'COMMUNITY':
        return Icons.groups_rounded;
      case 'ACHIEVEMENT':
        return Icons.emoji_events_rounded;
      case 'SPECIAL':
        return Icons.auto_awesome_rounded;
      default:
        return Icons.verified_rounded;
    }
  }

  Color _getBadgeColor(String rarity) {
    switch (rarity.toUpperCase()) {
      case 'LEGENDARY':
        return Colors.amber;
      case 'EPIC':
        return Colors.purple;
      case 'RARE':
        return Colors.blue;
      case 'COMMON':
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    if (_loading) {
      return Center(child: CircularProgressIndicator());
    }

    if (_earnedBadges.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.emoji_events_outlined,
                size: 48, color: cs.onSurfaceVariant),
            SizedBox(height: 16),
            Text('No badges earned yet',
                style:
                    textTheme.bodyLarge?.copyWith(color: cs.onSurfaceVariant)),
            SizedBox(height: 8),
            Text('Keep engaging to earn badges!',
                style:
                    textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant)),
          ],
        ),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _earnedBadges.length,
      itemBuilder: (context, index) {
        final b = _earnedBadges[index];
        final badge = b['badge'] as Map<String, dynamic>? ?? b;
        final category = (badge['category'] ?? 'ACHIEVEMENT') as String;
        final rarity = (badge['rarity'] ?? 'COMMON') as String;

        return Card(
          margin: const EdgeInsets.symmetric(vertical: 6),
          child: ListTile(
            leading: Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: _getBadgeColor(rarity).withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(_getBadgeIcon(category),
                  color: _getBadgeColor(rarity), size: 24),
            ),
            title: Text(badge['name'] ?? 'Badge',
                style: textTheme.titleSmall
                    ?.copyWith(fontWeight: FontWeight.bold)),
            subtitle:
                Text(badge['description'] ?? '', style: textTheme.bodySmall),
            trailing: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: _getBadgeColor(rarity).withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                rarity,
                style: textTheme.labelSmall?.copyWith(
                  color: _getBadgeColor(rarity),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class LeaderboardContent extends StatefulWidget {
  const LeaderboardContent({Key? key}) : super(key: key);

  @override
  State<LeaderboardContent> createState() => _LeaderboardContentState();
}

class _LeaderboardContentState extends State<LeaderboardContent> {
  static final _log = LoggingService.instance;
  static const String _tag = 'LeaderboardContent';
  
  final ImpactService _impactService = ImpactService();
  final GamificationService _gamificationService = GamificationService.instance;
  List<LeaderboardEntry> _topUsers = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadLeaderboard();
  }

  Future<void> _loadLeaderboard() async {
    try {
      final users = await _gamificationService.getTopLeaderboard(limit: 20);
      if (mounted) {
        setState(() {
          _topUsers = users;
          _loading = false;
        });
      }
    } catch (e) {
      _log.error('Error loading leaderboard: $e', tag: _tag);
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    if (_loading) {
      return Center(child: CircularProgressIndicator());
    }

    if (_topUsers.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.leaderboard_outlined,
                size: 48, color: cs.onSurfaceVariant),
            SizedBox(height: 16),
            Text('Leaderboard is empty',
                style:
                    textTheme.bodyLarge?.copyWith(color: cs.onSurfaceVariant)),
          ],
        ),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _topUsers.length,
      itemBuilder: (context, index) {
        final user = _topUsers[index];
        final rank = user.rank;

        Color rankColor;
        IconData? rankIcon;
        if (rank == 1) {
          rankColor = Colors.amber;
          rankIcon = Icons.emoji_events_rounded;
        } else if (rank == 2) {
          rankColor = Colors.grey.shade400;
          rankIcon = Icons.emoji_events_rounded;
        } else if (rank == 3) {
          rankColor = Colors.brown.shade300;
          rankIcon = Icons.emoji_events_rounded;
        } else {
          rankColor = cs.onSurfaceVariant;
          rankIcon = null;
        }

        return Card(
          margin: const EdgeInsets.symmetric(vertical: 4),
          child: ListTile(
            leading: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 32,
                  child: rankIcon != null
                      ? Icon(rankIcon, color: rankColor, size: 24)
                      : Text(
                          '#$rank',
                          style: textTheme.titleSmall?.copyWith(
                            color: rankColor,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                ),
                SizedBox(width: 8),
                CircleAvatar(
                  backgroundImage: user.avatarUrl != null
                      ? NetworkImage(user.avatarUrl!)
                      : null,
                  child: user.avatarUrl == null
                      ? Text(user.name.isNotEmpty ? user.name[0] : '?')
                      : null,
                ),
              ],
            ),
            title: Text(user.name,
                style: textTheme.titleSmall
                    ?.copyWith(fontWeight: FontWeight.w600)),
            subtitle: Text('Rank #${user.rank}', style: textTheme.bodySmall),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.bolt_rounded, size: 16, color: Colors.amber),
                SizedBox(width: 4),
                Text(
                  '${user.score}',
                  style: textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: cs.primary,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
