import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/models/follower.dart';
import 'package:thittam1hub/nav.dart';
import 'package:thittam1hub/services/followers_service.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/utils/animations.dart';
import 'package:thittam1hub/widgets/enhanced_empty_state.dart';
import 'package:thittam1hub/widgets/follower_card.dart';
import 'package:thittam1hub/widgets/follows_you_badge.dart';

import 'package:thittam1hub/services/logging_service.dart';
/// Page displaying Followers, Following, and Follow Requests
/// 
/// Supports deep linking via `?tab=` query parameter.
/// Valid tabs: followers, following, mutual, requests, suggested
class FollowersPage extends StatefulWidget {
  /// Tab name for deep linking (e.g., 'requests', 'mutual')
  final String? initialTab;

  const FollowersPage({
    super.key,
    this.initialTab,
  });

  @override
  State<FollowersPage> createState() => _FollowersPageState();
}

class _FollowersPageState extends State<FollowersPage>
    with SingleTickerProviderStateMixin {
  // Logging
  static final _log = LoggingService.instance;
  static const String _tag = 'FollowersPage';
  
  final _followersService = FollowersService.instance;

  /// Tab name to index mapping
  static const _tabNames = ['followers', 'following', 'mutual', 'requests', 'suggested'];

  late TabController _tabController;
  int _currentTab = 0;

  // Focus management for keyboard navigation
  late FocusNode _tabBarFocusNode;
  final List<FocusNode> _tabFocusNodes = [];

  List<Follower> _followers = [];
  List<Follower> _following = [];
  List<Follower> _mutualFollowers = [];
  List<FollowRequest> _requests = [];
  List<Map<String, dynamic>> _suggestedUsers = [];
  FollowStats _stats = FollowStats.empty();
  bool _isPrivate = false;

  bool _isLoading = true;

  /// Converts tab name to index, defaults to 0 (followers)
  int _getInitialTabIndex() {
    if (widget.initialTab != null) {
      final index = _tabNames.indexOf(widget.initialTab!.toLowerCase());
      return index >= 0 ? index : 0;
    }
    return 0;
  }

  /// Syncs current tab state to URL
  void _syncUrlState() {
    if (!mounted) return;
    final tabName = _tabNames[_currentTab];
    context.replace(AppRoutes.followersWithTab(tabName));
  }

  /// Navigate to previous tab with keyboard
  void _navigateToPreviousTab() {
    if (_currentTab > 0) {
      _tabController.animateTo(_currentTab - 1);
      _tabFocusNodes[_currentTab - 1].requestFocus();
    }
  }

  /// Navigate to next tab with keyboard
  void _navigateToNextTab() {
    if (_currentTab < _tabNames.length - 1) {
      _tabController.animateTo(_currentTab + 1);
      _tabFocusNodes[_currentTab + 1].requestFocus();
    }
  }

  /// Navigate to first tab with Home key
  void _navigateToFirstTab() {
    _tabController.animateTo(0);
    _tabFocusNodes[0].requestFocus();
  }

  /// Navigate to last tab with End key
  void _navigateToLastTab() {
    _tabController.animateTo(_tabNames.length - 1);
    _tabFocusNodes[_tabNames.length - 1].requestFocus();
  }

  @override
  void initState() {
    super.initState();
    _currentTab = _getInitialTabIndex();
    
    // Initialize focus nodes for keyboard navigation
    _tabBarFocusNode = FocusNode(debugLabel: 'FollowersTabBar');
    for (int i = 0; i < _tabNames.length; i++) {
      _tabFocusNodes.add(FocusNode(debugLabel: 'FollowersTab_${_tabNames[i]}'));
    }
    
    _tabController = TabController(
      length: 5,
      vsync: this,
      initialIndex: _currentTab,
    );
    _tabController.addListener(() {
      if (_tabController.indexIsChanging) return;
      setState(() => _currentTab = _tabController.index);
      _syncUrlState();
    });
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _tabBarFocusNode.dispose();
    for (final node in _tabFocusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);

    try {
      // Load data in parallel with explicit types
      final followersFuture = _followersService.getFollowers();
      final followingFuture = _followersService.getFollowing();
      final mutualFuture = _followersService.getMutualFollowers();
      final requestsFuture = _followersService.getPendingRequests();
      final statsFuture = _followersService.getFollowStats();
      final privateFuture = _followersService.isAccountPrivate();
      final suggestedFuture = _followersService.getSuggestedUsers(limit: 20);

      final followers = await followersFuture;
      final following = await followingFuture;
      final mutual = await mutualFuture;
      final requests = await requestsFuture;
      final stats = await statsFuture;
      final isPrivate = await privateFuture;
      final suggested = await suggestedFuture;

      if (mounted) {
        setState(() {
          _followers = followers;
          _following = following;
          _mutualFollowers = mutual;
          _requests = requests;
          _stats = stats;
          _isPrivate = isPrivate;
          _suggestedUsers = suggested;
          _isLoading = false;
        });
      }
    } catch (e) {
      _log.error('❌ Load followers data error: $e', tag: _tag);
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _navigateToProfile(String userId) {
    context.push(AppRoutes.impactProfile(userId));
  }

  void _startChat(Follower follower) {
    context.push(AppRoutes.chatNew, extra: {
      'recipientId': follower.userId,
      'recipientName': follower.otherUserName,
      'recipientAvatar': follower.otherUserAvatar,
    });
  }

  Future<void> _removeFollower(Follower follower) async {
    final success = await _followersService.removeFollower(follower.userId);
    if (success && mounted) {
      HapticFeedback.mediumImpact();
      setState(() {
        _followers.removeWhere((f) => f.id == follower.id);
        _stats = FollowStats(
          followersCount: _stats.followersCount - 1,
          followingCount: _stats.followingCount,
          pendingRequestsCount: _stats.pendingRequestsCount,
        );
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Removed ${follower.otherUserName}'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _unfollowUser(Follower follower) async {
    final success = await _followersService.unfollowUser(follower.userId);
    if (success && mounted) {
      HapticFeedback.mediumImpact();
      setState(() {
        _following.removeWhere((f) => f.id == follower.id);
        _stats = FollowStats(
          followersCount: _stats.followersCount,
          followingCount: _stats.followingCount - 1,
          pendingRequestsCount: _stats.pendingRequestsCount,
        );
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Unfollowed ${follower.otherUserName}'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _acceptRequest(FollowRequest request) async {
    // Store previous state for rollback
    final previousRequests = List<FollowRequest>.from(_requests);
    final previousStats = _stats;
    
    // OPTIMISTIC: Update UI immediately
    setState(() {
      _requests.removeWhere((r) => r.id == request.id);
      _stats = FollowStats(
        followersCount: _stats.followersCount + 1,
        followingCount: _stats.followingCount,
        pendingRequestsCount: _stats.pendingRequestsCount - 1,
      );
    });
    HapticFeedback.mediumImpact();
    
    try {
      final success = await _followersService.acceptFollowRequest(request.id);
      if (!success) throw Exception('Accept failed');
      
      // Convert request to follower locally instead of full reload
      final newFollower = Follower(
        id: request.id,
        createdAt: DateTime.now(),
        userId: request.requesterId,
        otherUserName: request.requesterName,
        otherUserAvatar: request.requesterAvatar,
        otherUserHeadline: request.requesterHeadline,
        status: 'ACCEPTED',
      );
      _followers.insert(0, newFollower);
      
      if (mounted) {
        setState(() {});
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${request.requesterName} can now see your posts'),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      // ROLLBACK on failure
      _log.error('Accept request failed', tag: _tag, error: e);
      if (mounted) {
        setState(() {
          _requests = previousRequests;
          _stats = previousStats;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Failed to accept request'),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  Future<void> _declineRequest(FollowRequest request) async {
    final success = await _followersService.declineFollowRequest(request.id);
    if (success && mounted) {
      HapticFeedback.mediumImpact();
      setState(() {
        _requests.removeWhere((r) => r.id == request.id);
        _stats = FollowStats(
          followersCount: _stats.followersCount,
          followingCount: _stats.followingCount,
          pendingRequestsCount: _stats.pendingRequestsCount - 1,
        );
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Shortcuts(
      shortcuts: {
        LogicalKeySet(LogicalKeyboardKey.arrowLeft): const _PreviousTabIntent(),
        LogicalKeySet(LogicalKeyboardKey.arrowRight): const _NextTabIntent(),
        LogicalKeySet(LogicalKeyboardKey.home): const _FirstTabIntent(),
        LogicalKeySet(LogicalKeyboardKey.end): const _LastTabIntent(),
      },
      child: Actions(
        actions: {
          _PreviousTabIntent: CallbackAction<_PreviousTabIntent>(
            onInvoke: (_) => _navigateToPreviousTab(),
          ),
          _NextTabIntent: CallbackAction<_NextTabIntent>(
            onInvoke: (_) => _navigateToNextTab(),
          ),
          _FirstTabIntent: CallbackAction<_FirstTabIntent>(
            onInvoke: (_) => _navigateToFirstTab(),
          ),
          _LastTabIntent: CallbackAction<_LastTabIntent>(
            onInvoke: (_) => _navigateToLastTab(),
          ),
        },
        child: Scaffold(
          appBar: AppBar(
            title: const Text('Followers'),
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(48),
              child: Focus(
                focusNode: _tabBarFocusNode,
                child: Semantics(
                  label: 'Followers navigation tabs. Use arrow keys to navigate between tabs.',
                  child: TabBar(
                    controller: _tabController,
                    isScrollable: true,
                    tabAlignment: TabAlignment.start,
                    splashBorderRadius: BorderRadius.circular(8),
                    overlayColor: WidgetStateProperty.resolveWith((states) {
                      if (states.contains(WidgetState.focused)) {
                        return cs.primary.withValues(alpha: 0.12);
                      }
                      return null;
                    }),
                    tabs: [
                    _buildFocusableTab(
                      0,
                      child: Text('Followers (${_stats.followersCount})'),
                      semanticLabel: 'Followers tab, ${_stats.followersCount} followers',
                    ),
                    _buildFocusableTab(
                      1,
                      child: Text('Following (${_stats.followingCount})'),
                      semanticLabel: 'Following tab, ${_stats.followingCount} following',
                    ),
                    _buildFocusableTab(
                      2,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.sync_alt, size: 16, color: AppColors.success),
                          const SizedBox(width: 6),
                          Text('Mutual (${_mutualFollowers.length})'),
                        ],
                      ),
                      semanticLabel: 'Mutual followers tab, ${_mutualFollowers.length} mutual',
                    ),
                    _buildFocusableTab(
                      3,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text('Requests'),
                          if (_stats.pendingRequestsCount > 0) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: cs.primary,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                '${_stats.pendingRequestsCount}',
                                style: TextStyle(
                                  color: cs.onPrimary,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      semanticLabel: 'Follow requests tab, ${_stats.pendingRequestsCount} pending',
                    ),
                    _buildFocusableTab(
                      4,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.person_add, size: 16, color: cs.tertiary),
                          const SizedBox(width: 6),
                          const Text('Suggested'),
                        ],
                      ),
                      semanticLabel: 'Suggested users tab',
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
          body: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildFollowersTab(),
                    _buildFollowingTab(),
                    _buildMutualTab(),
                    _buildRequestsTab(),
                    _buildSuggestedTab(),
                  ],
                ),
        ),
      ),
    );
  }

  /// Builds a focusable tab with proper semantics
  Widget _buildFocusableTab(
    int index, {
    required Widget child,
    required String semanticLabel,
  }) {
    return Focus(
      focusNode: _tabFocusNodes[index],
      child: Semantics(
        label: semanticLabel,
        selected: _currentTab == index,
        button: true,
        child: Tab(child: child),
      ),
    );
  }

  Widget _buildFollowersTab() {
    if (_followers.isEmpty) {
      return EnhancedEmptyState(
        icon: Icons.people_outline,
        title: 'No followers yet',
        subtitle: 'When people follow you, they\'ll appear here.',
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
        itemCount: _followers.length,
        itemBuilder: (context, index) {
          final follower = _followers[index];
          return FadeSlideTransition(
            delay: Duration(milliseconds: index * 50),
            child: FollowerCard(
              follower: follower,
              isFollowing: false,
              onTap: () => _navigateToProfile(follower.userId),
              onMessage: () => _startChat(follower),
              onRemove: () => _removeFollower(follower),
            ),
          );
        },
      ),
    );
  }

  Widget _buildFollowingTab() {
    if (_following.isEmpty) {
      return EnhancedEmptyState(
        icon: Icons.person_add_outlined,
        title: 'Not following anyone',
        subtitle: 'Follow people to see their posts in your feed.',
        primaryButtonLabel: 'Find People',
        primaryButtonIcon: Icons.search,
        onPrimaryAction: () => context.push(AppRoutes.discover),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
        itemCount: _following.length,
        itemBuilder: (context, index) {
          final following = _following[index];
          return FadeSlideTransition(
            delay: Duration(milliseconds: index * 50),
            child: FollowerCard(
              follower: following,
              isFollowing: true,
              onTap: () => _navigateToProfile(following.userId),
              onMessage: () => _startChat(following),
              onUnfollow: () => _showUnfollowConfirmation(following),
            ),
          );
        },
      ),
    );
  }

  Widget _buildMutualTab() {
    if (_mutualFollowers.isEmpty) {
      return EnhancedEmptyState(
        icon: Icons.sync_alt,
        title: 'No mutual followers yet',
        subtitle: 'When someone you follow also follows you back, they\'ll appear here.',
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
        itemCount: _mutualFollowers.length,
        itemBuilder: (context, index) {
          final mutual = _mutualFollowers[index];
          return FadeSlideTransition(
            delay: Duration(milliseconds: index * 50),
            child: _MutualFollowerCard(
              follower: mutual,
              onTap: () => _navigateToProfile(mutual.userId),
              onMessage: () => _startChat(mutual),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSuggestedTab() {
    if (_suggestedUsers.isEmpty) {
      return EnhancedEmptyState(
        icon: Icons.person_add_outlined,
        title: 'No suggestions available',
        subtitle: 'Check back later for people you might want to follow.',
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
        itemCount: _suggestedUsers.length,
        itemBuilder: (context, index) {
          final user = _suggestedUsers[index];
          return FadeSlideTransition(
            delay: Duration(milliseconds: index * 50),
            child: _SuggestedUserCard(
              profile: user,
              onTap: () => _navigateToProfile(user['user_id'] as String),
              onFollow: () => _followUser(user),
              onDismiss: () => _dismissSuggestion(index),
            ),
          );
        },
      ),
    );
  }

  Future<void> _followUser(Map<String, dynamic> user) async {
    final userId = user['user_id'] as String;
    final result = await _followersService.followUser(userId);
    
    if (mounted) {
      HapticFeedback.mediumImpact();
      
      if (result.isSuccess || result.isRequestSent) {
        setState(() {
          _suggestedUsers.removeWhere((u) => u['user_id'] == userId);
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              result.isRequestSent
                  ? 'Follow request sent to ${user['full_name'] ?? 'user'}'
                  : 'Now following ${user['full_name'] ?? 'user'}',
            ),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
          ),
        );
        
        // Refresh stats
        final newStats = await _followersService.getFollowStats();
        if (mounted) setState(() => _stats = newStats);
      } else if (result.rateLimited) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Too many follows. Try again later.'),
            backgroundColor: Theme.of(context).colorScheme.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  void _dismissSuggestion(int index) {
    HapticFeedback.lightImpact();
    setState(() {
      _suggestedUsers.removeAt(index);
    });
  }

  Widget _buildRequestsTab() {
    final cs = Theme.of(context).colorScheme;

    if (!_isPrivate) {
      return EnhancedEmptyState(
        icon: Icons.lock_open_outlined,
        title: 'Public Account',
        subtitle: 'Anyone can follow you without approval. Switch to a private account to review follow requests.',
        primaryButtonLabel: 'Make Private',
        primaryButtonIcon: Icons.lock,
        onPrimaryAction: () => _togglePrivacy(true),
      );
    }

    if (_requests.isEmpty) {
      return EnhancedEmptyState(
        icon: Icons.inbox_outlined,
        title: 'No pending requests',
        subtitle: 'When someone wants to follow you, their request will appear here.',
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
        itemCount: _requests.length,
        itemBuilder: (context, index) {
          final request = _requests[index];
          return FadeSlideTransition(
            delay: Duration(milliseconds: index * 50),
            child: FollowRequestCard(
              request: request,
              onTap: () => _navigateToProfile(request.requesterId),
              onAccept: () => _acceptRequest(request),
              onDecline: () => _declineRequest(request),
            ),
          );
        },
      ),
    );
  }

  void _showUnfollowConfirmation(Follower following) {
    final cs = Theme.of(context).colorScheme;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Unfollow?'),
        content: Text(
          'Are you sure you want to unfollow ${following.otherUserName}?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _unfollowUser(following);
            },
            style: TextButton.styleFrom(
              foregroundColor: cs.error,
            ),
            child: const Text('Unfollow'),
          ),
        ],
      ),
    );
  }

  Future<void> _togglePrivacy(bool isPrivate) async {
    final success = await _followersService.setAccountPrivacy(isPrivate);
    if (success && mounted) {
      HapticFeedback.mediumImpact();
      setState(() => _isPrivate = isPrivate);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            isPrivate
                ? 'Account is now private. New followers need approval.'
                : 'Account is now public. Anyone can follow you.',
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
      if (!isPrivate) {
        // Reload to reflect auto-accepted requests
        _loadData();
      }
    }
  }
}

/// Card for mutual followers with special styling
class _MutualFollowerCard extends StatelessWidget {
  final Follower follower;
  final VoidCallback? onTap;
  final VoidCallback? onMessage;

  const _MutualFollowerCard({
    required this.follower,
    this.onTap,
    this.onMessage,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;

    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap?.call();
      },
      child: Container(
        margin: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.xs,
        ),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppColors.success.withOpacity(0.08),
              cs.surface,
            ],
          ),
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          border: Border.all(
            color: AppColors.success.withOpacity(0.2),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Row(
            children: [
              // Avatar with mutual indicator
              Stack(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: AppColors.success.withOpacity(0.1),
                    backgroundImage: follower.otherUserAvatar != null
                        ? NetworkImage(follower.otherUserAvatar!)
                        : null,
                    child: follower.otherUserAvatar == null
                        ? Text(
                            follower.otherUserName.isNotEmpty
                                ? follower.otherUserName[0].toUpperCase()
                                : '?',
                            style: TextStyle(
                              color: AppColors.success,
                              fontWeight: FontWeight.bold,
                              fontSize: 20,
                            ),
                          )
                        : null,
                  ),
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: BoxDecoration(
                        color: cs.surface,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.sync_alt,
                        size: 14,
                        color: AppColors.success,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: AppSpacing.md),
              // User info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            follower.otherUserName,
                            style: text.titleSmall?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        FollowsYouBadge(isMutual: true),
                      ],
                    ),
                    if (follower.otherUserHeadline != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        follower.otherUserHeadline!,
                        style: text.bodySmall?.copyWith(
                          color: cs.onSurfaceVariant,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
              // Message button
              IconButton(
                onPressed: onMessage,
                icon: Icon(
                  Icons.chat_bubble_outline,
                  color: cs.primary,
                ),
                tooltip: 'Message',
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Card for suggested users to follow
class _SuggestedUserCard extends StatelessWidget {
  final Map<String, dynamic> profile;
  final VoidCallback? onTap;
  final VoidCallback? onFollow;
  final VoidCallback? onDismiss;

  const _SuggestedUserCard({
    required this.profile,
    this.onTap,
    this.onFollow,
    this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;

    final fullName = profile['full_name'] as String? ?? 'Unknown';
    final avatarUrl = profile['avatar_url'] as String?;
    final headline = profile['headline'] as String?;
    final interests = profile['interests'] as List<dynamic>? ?? [];
    final skills = profile['skills'] as List<dynamic>? ?? [];
    
    // Build suggestion reason
    String? suggestionReason;
    if (interests.isNotEmpty) {
      suggestionReason = 'Shares interests in ${interests.take(2).join(', ')}';
    } else if (skills.isNotEmpty) {
      suggestionReason = 'Has skills in ${skills.take(2).join(', ')}';
    }

    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap?.call();
      },
      child: Container(
        margin: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.xs,
        ),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              cs.tertiary.withOpacity(0.08),
              cs.surface,
            ],
          ),
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          border: Border.all(
            color: cs.tertiary.withOpacity(0.2),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  // Avatar
                  Stack(
                    children: [
                      CircleAvatar(
                        radius: 28,
                        backgroundColor: cs.tertiary.withOpacity(0.1),
                        backgroundImage: avatarUrl != null
                            ? NetworkImage(avatarUrl)
                            : null,
                        child: avatarUrl == null
                            ? Text(
                                fullName.isNotEmpty
                                    ? fullName[0].toUpperCase()
                                    : '?',
                                style: TextStyle(
                                  color: cs.tertiary,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 20,
                                ),
                              )
                            : null,
                      ),
                      Positioned(
                        right: 0,
                        bottom: 0,
                        child: Container(
                          padding: const EdgeInsets.all(2),
                          decoration: BoxDecoration(
                            color: cs.surface,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.person_add,
                            size: 14,
                            color: cs.tertiary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: AppSpacing.md),
                  // User info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          fullName,
                          style: text.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (headline != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            headline,
                            style: text.bodySmall?.copyWith(
                              color: cs.onSurfaceVariant,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ],
                    ),
                  ),
                  // Dismiss button
                  IconButton(
                    onPressed: onDismiss,
                    icon: Icon(
                      Icons.close,
                      color: cs.onSurfaceVariant.withOpacity(0.5),
                      size: 20,
                    ),
                    tooltip: 'Dismiss',
                    visualDensity: VisualDensity.compact,
                  ),
                ],
              ),
              // Suggestion reason
              if (suggestionReason != null) ...[
                const SizedBox(height: AppSpacing.sm),
                Row(
                  children: [
                    Icon(
                      Icons.lightbulb_outline,
                      size: 14,
                      color: cs.tertiary,
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        suggestionReason,
                        style: text.labelSmall?.copyWith(
                          color: cs.tertiary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: AppSpacing.sm),
              // Follow button
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: onFollow,
                  icon: const Icon(Icons.person_add, size: 18),
                  label: const Text('Follow'),
                  style: FilledButton.styleFrom(
                    backgroundColor: cs.tertiary,
                    foregroundColor: cs.onTertiary,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// Keyboard navigation intents for accessibility
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
