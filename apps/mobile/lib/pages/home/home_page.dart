import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/models/impact_profile.dart';
import 'package:thittam1hub/models/space.dart';
import 'package:thittam1hub/pages/home/home_service.dart';
import 'package:thittam1hub/pages/home/widgets/stories_bar.dart';
import 'package:thittam1hub/pages/home/widgets/streak_badge.dart';
import 'package:thittam1hub/pages/home/widgets/quick_poll_card.dart';
import 'package:thittam1hub/pages/home/widgets/spark_feed_tile.dart';
import 'package:thittam1hub/pages/home/widgets/trending_topics.dart';
import 'package:thittam1hub/pages/home/widgets/create_post_fab.dart';
import 'package:thittam1hub/pages/home/widgets/comment_sheet.dart';
import 'package:thittam1hub/pages/home/widgets/daily_mission_sheet.dart';
import 'package:thittam1hub/pages/home/widgets/home_search_sheet.dart';
import 'package:thittam1hub/pages/home/widgets/create_story_sheet.dart';
import 'package:thittam1hub/pages/home/widgets/new_posts_button.dart';
import 'package:thittam1hub/pages/home/widgets/discover_story_viewer.dart';
import 'package:thittam1hub/pages/impact/space_room_page.dart';
import 'package:thittam1hub/pages/impact/profile_detail_page.dart';
import 'package:thittam1hub/widgets/post_share_sheet.dart';
import 'package:thittam1hub/supabase/spark_service.dart';
import 'package:thittam1hub/services/feed_analytics_service.dart';
import 'package:thittam1hub/nav.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/utils/animations.dart' hide BrandedRefreshIndicator;
import 'package:thittam1hub/widgets/branded_refresh_indicator.dart';
import 'package:thittam1hub/widgets/thittam1hub_logo.dart';
import 'package:thittam1hub/widgets/offline_banner.dart';

import 'home_page_controller.dart';

/// Home Feed Page - "The Nexus"
/// 
/// Pure UI layer that delegates all business logic to [HomePageController].
/// Following separation of concerns pattern for maintainability and testability.
class HomePage extends StatefulWidget {
  final String? initialFilter;

  const HomePage({Key? key, this.initialFilter}) : super(key: key);

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> with TickerProviderStateMixin {
  // Controller handles all business logic and state
  late final HomePageController _controller;
  
  // Analytics service is UI-aware for tracking (kept in page for scroll context)
  final FeedAnalyticsService _analyticsService = FeedAnalyticsService.instance;
  
  // Scroll controller for infinite scroll and analytics
  final ScrollController _scrollController = ScrollController();
  
  static const double _loadMoreThreshold = 200.0;

  @override
  void initState() {
    super.initState();
    
    // Initialize controller
    _controller = HomePageController();
    _controller.addListener(_onControllerUpdate);
    
    // Setup scroll listener
    _scrollController.addListener(_onScroll);
  }

  void _onControllerUpdate() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _controller.removeListener(_onControllerUpdate);
    _controller.dispose();
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  /// Scroll listener for infinite scroll pagination and analytics
  void _onScroll() {
    // Track scroll depth for analytics
    if (_scrollController.hasClients && _controller.posts.isNotEmpty) {
      final maxExtent = _scrollController.position.maxScrollExtent;
      if (maxExtent > 0) {
        _controller.trackScrollDepth(
          _scrollController.position.pixels,
          maxExtent,
        );
      }
    }

    // Load more posts when near bottom
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - _loadMoreThreshold) {
      _controller.loadMorePosts();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UI ACTIONS (delegate to controller, navigate, show sheets)
  // ═══════════════════════════════════════════════════════════════════════════

  void _openCommentSheet(SparkPost post) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => CommentSheet(
        postId: post.id,
        initialCommentCount: post.commentCount,
      ),
    );
  }

  void _handleStoryTap(StoryItem story) {
    HapticFeedback.mediumImpact();
    
    switch (story.type) {
      case StoryType.dailyMission:
        _openDailyMissionSheet();
        break;
      case StoryType.liveSpace:
        _openSpaceRoom(story);
        break;
      case StoryType.activeGame:
        _openActiveGame(story);
        break;
      case StoryType.onlineFollowing:
        _openProfileDetail(story);
        break;
      case StoryType.discoverPeople:
        _openDiscoverPeopleViewer();
        break;
      case StoryType.videoStory:
        // Handle video story tap
        break;
    }
  }

  void _openDailyMissionSheet() {
    DailyMissionSheet.show(
      context,
      streakData: _controller.streakData,
      onCompleteAction: _openCreateStorySheet,
    );
  }

  Future<void> _openSpaceRoom(StoryItem story) async {
    final space = await _controller.getSpaceForStory(story);
    if (space != null && mounted) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => SpaceRoomPage(space: space),
        ),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not join space')),
      );
    }
  }

  void _openActiveGame(StoryItem story) {
    context.push(AppRoutes.impactWithTab('vibe'));
  }

  void _openProfileDetail(StoryItem story) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ProfileDetailPage(profileId: story.id),
      ),
    );
  }

  void _openDiscoverPeopleViewer() {
    if (_controller.matchedProfiles.isEmpty) {
      context.push(AppRoutes.impactWithTab('pulse'));
      return;
    }

    Navigator.of(context).push(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => DiscoverStoryViewer(
          profiles: _controller.matchedProfiles,
          initialIndex: 0,
          onFollow: (userId) {
            HapticFeedback.mediumImpact();
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Follow request sent!')),
            );
          },
          onSkip: (userId) {
            HapticFeedback.lightImpact();
          },
          onViewProfile: (userId) {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => ProfileDetailPage(profileId: userId),
              ),
            );
          },
        ),
      ),
    );
  }

  void _openCreateStorySheet() {
    CreateStorySheet.show(context, onPostCreated: _controller.onPostCreated);
  }

  void _openSearchSheet() {
    HomeSearchSheet.show(context);
  }

  void _sharePost(SparkPost post) {
    PostShareSheet.show(context, post);
  }

  /// Load new posts and scroll to top
  void _loadNewPosts() {
    _scrollController.animateTo(
      0,
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeOut,
    );
    _controller.acknowledgeNewPosts();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BUILD FEED ITEMS
  // ═══════════════════════════════════════════════════════════════════════════

  List<Widget> _buildFeedItems() {
    final List<Widget> items = [];
    int pollIndex = 0;
    final filteredPosts = _controller.filteredPosts;

    for (int i = 0; i < filteredPosts.length; i++) {
      // Insert poll every 5 posts
      if (i > 0 && i % 5 == 0 && pollIndex < _controller.polls.length) {
        items.add(
          FadeSlideTransition(
            delay: staggerDelay(items.length),
            child: QuickPollCard(
              poll: _controller.polls[pollIndex],
              onVote: (optionIndex) async {
                await _controller.submitPollVote(
                  _controller.polls[pollIndex].id,
                  optionIndex,
                );
              },
            ),
          ),
        );
        pollIndex++;
      }

      // Insert trending topics every 10 posts
      if (i > 0 && i % 10 == 0 && _controller.trendingTags.isNotEmpty) {
        items.add(
          FadeSlideTransition(
            delay: staggerDelay(items.length),
            child: TrendingTopics(
              tags: _controller.trendingTags,
              onTagTap: _controller.filterByTag,
            ),
          ),
        );
      }

      final post = filteredPosts[i];
      
      // Add divider before each post (except the first one)
      if (i > 0) {
        items.add(
          Divider(
            height: 1,
            thickness: 1,
            color: Theme.of(context).brightness == Brightness.dark
                ? const Color(0xFF343434)
                : Colors.grey.shade200,
          ),
        );
      }
      
      items.add(
        _AnalyticsTrackingTile(
          key: ValueKey('analytics_${post.id}'),
          postId: post.id,
          postType: post.type.name,
          index: i,
          analyticsService: _analyticsService,
          child: SparkFeedTile(
            post: post,
            hasSparked: _controller.hasSparked(post.id),
            onDoubleTap: () => _handleSparkTap(post, i),
            onSparkTap: () => _handleSparkTap(post, i),
            onCommentTap: () {
              _analyticsService.trackEngagement(
                postId: post.id,
                postType: post.type.name,
                eventType: EngagementEventType.comment,
                scrollPosition: i,
              );
              _openCommentSheet(post);
            },
            onShareTap: () {
              _analyticsService.trackEngagement(
                postId: post.id,
                postType: post.type.name,
                eventType: EngagementEventType.share,
                scrollPosition: i,
              );
              _sharePost(post);
            },
          ),
        ),
      );
    }

    return items;
  }

  /// Handle spark tap with analytics and optimistic update with rollback
  Future<void> _handleSparkTap(SparkPost post, int scrollPosition) async {
    HapticFeedback.lightImpact();
    _analyticsService.trackEngagement(
      postId: post.id,
      postType: post.type.name,
      eventType: EngagementEventType.spark,
      scrollPosition: scrollPosition,
    );
    
    // Store previous state for rollback
    final previouslySparked = _controller.hasSparked(post.id);
    
    // Optimistic update via controller
    _controller.toggleSpark(post.id);
    
    // Call API with rollback on failure
    try {
      final sparkService = SparkService();
      await sparkService.toggleSparkOnce(post.id);
    } catch (e) {
      // Rollback on failure
      if (mounted) {
        _controller.toggleSpark(post.id); // Toggle back
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(previouslySparked 
                ? 'Failed to remove spark' 
                : 'Failed to spark post'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BUILD
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: cs.surface,
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            // Offline connectivity banner
            const OfflineBanner(
              customMessage: 'Viewing cached posts. New content will load when reconnected.',
            ),
            Expanded(
              child: SafeArea(
                top: true,
                bottom: false,
                child: Stack(
                  children: [
                    BrandedRefreshIndicator(
                      onRefresh: _controller.onRefresh,
                      child: CustomScrollView(
                        controller: _scrollController,
                        slivers: [
                          // Compact App Bar
                          SliverAppBar(
                            floating: true,
                            snap: true,
                            backgroundColor: cs.surface,
                            surfaceTintColor: Colors.transparent,
                            elevation: 0,
                            expandedHeight: context.appBarHeight,
                            toolbarHeight: context.appBarHeight,
                            title: const Thittam1hubLogoInline(iconSize: 20),
                            actions: [
                              // Streak Badge
                              Padding(
                                padding: const EdgeInsets.only(right: 8),
                                child: _controller.isLoading
                                    ? const StreakBadgeSkeleton()
                                    : StreakBadge(
                                        streakData: _controller.streakData,
                                        onTap: () {
                                          HapticFeedback.mediumImpact();
                                          _openDailyMissionSheet();
                                        },
                                      ),
                              ),
                              // Notification button
                              Padding(
                                padding: const EdgeInsets.only(right: 4),
                                child: _GlassIconButton(
                                  icon: Icons.notifications_outlined,
                                  badgeCount: _controller.unreadNotificationCount,
                                  onPressed: () {
                                    context.push(AppRoutes.notifications);
                                  },
                                ),
                              ),
                              // Search button
                              Padding(
                                padding: const EdgeInsets.only(right: 12),
                                child: _GlassIconButton(
                                  icon: Icons.search_rounded,
                                  onPressed: _openSearchSheet,
                                ),
                              ),
                            ],
                          ),

                          // Stories Bar
                          SliverToBoxAdapter(
                            child: _controller.isLoading
                                ? const StoriesBarSkeleton()
                                : StoriesBar(
                                    stories: _controller.stories,
                                    onStoryTap: _handleStoryTap,
                                    onAddTap: _openCreateStorySheet,
                                  ),
                          ),

                          // Tag filter banner
                          if (_controller.selectedTag != null)
                            SliverToBoxAdapter(
                              child: _TagFilterBanner(
                                tag: _controller.selectedTag!,
                                onClear: _controller.clearTagFilter,
                              ),
                            ),

                          // Feed Items
                          SliverPadding(
                            padding: EdgeInsets.only(
                              bottom: MediaQuery.of(context).padding.bottom +
                                  context.bottomContentPadding,
                            ),
                            sliver: _controller.isLoading
                                ? SliverList(
                                    delegate: SliverChildBuilderDelegate(
                                      (context, index) => FadeSlideTransition(
                                        delay: staggerDelay(index),
                                        child: const SparkFeedTileSkeleton(),
                                      ),
                                      childCount: 5,
                                    ),
                                  )
                                : _controller.posts.isEmpty
                                    ? SliverFillRemaining(
                                        hasScrollBody: false,
                                        child: _CreativeFeedEmptyState(),
                                      )
                                    : SliverList(
                                        delegate: SliverChildBuilderDelegate(
                                          (context, index) {
                                            final feedItems = _buildFeedItems();
                                            if (index == feedItems.length) {
                                              return _LoadMoreIndicator(
                                                isLoading: _controller.isLoadingMore,
                                                hasMore: _controller.hasMorePosts,
                                              );
                                            }
                                            return feedItems[index];
                                          },
                                          childCount: _buildFeedItems().length +
                                              (_controller.hasMorePosts ? 1 : 0),
                                        ),
                                      ),
                          ),
                        ],
                      ),
                    ),

                    // New posts floating button
                    if (_controller.newPostsCount > 0)
                      Positioned(
                        top: context.appBarHeight + context.storiesBarHeight + 8,
                        left: 0,
                        right: 0,
                        child: Center(
                          child: NewPostsButton(
                            count: _controller.newPostsCount,
                            onTap: _loadNewPosts,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: CreatePostFab(
        onPostCreated: _controller.onPostCreated,
      ),
    );
  }
}

// =============================================================================
// HELPER WIDGETS
// =============================================================================

/// Tag filter banner
class _TagFilterBanner extends StatelessWidget {
  final String tag;
  final VoidCallback onClear;

  const _TagFilterBanner({required this.tag, required this.onClear});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: cs.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.primary.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          Icon(Icons.filter_list_rounded, size: 18, color: cs.primary),
          const SizedBox(width: 8),
          Text(
            'Filtering by: ',
            style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: cs.primary,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              '#$tag',
              style: TextStyle(
                color: cs.onPrimary,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const Spacer(),
          GestureDetector(
            onTap: onClear,
            child: Icon(Icons.close_rounded, size: 20, color: cs.outline),
          ),
        ],
      ),
    );
  }
}

/// Glass morphism icon button with optional badge
class _GlassIconButton extends StatelessWidget {
  final IconData icon;
  final int badgeCount;
  final VoidCallback onPressed;

  const _GlassIconButton({
    required this.icon,
    this.badgeCount = 0,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: onPressed,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: isDark
              ? cs.surfaceContainerHighest.withOpacity(0.8)
              : cs.surfaceContainerLow,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: cs.outline.withOpacity(0.2),
          ),
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Icon(icon, color: cs.onSurface, size: 22),
            if (badgeCount > 0)
              Positioned(
                top: 4,
                right: 4,
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
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Loading indicator for infinite scroll pagination
class _LoadMoreIndicator extends StatelessWidget {
  final bool isLoading;
  final bool hasMore;

  const _LoadMoreIndicator({
    required this.isLoading,
    required this.hasMore,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    if (!hasMore) {
      return Padding(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: Column(
            children: [
              Icon(Icons.check_circle_outline_rounded, color: cs.outline, size: 28),
              const SizedBox(height: 8),
              Text(
                'You\'re all caught up!',
                style: TextStyle(
                  color: cs.onSurfaceVariant,
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (isLoading) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 24),
        child: Center(
          child: SizedBox(
            width: 24,
            height: 24,
            child: CircularProgressIndicator(
              strokeWidth: 2.5,
              valueColor: AlwaysStoppedAnimation(cs.primary),
            ),
          ),
        ),
      );
    }

    return const SizedBox(height: 24);
  }
}

/// Creative animated empty state for the feed
class _CreativeFeedEmptyState extends StatefulWidget {
  const _CreativeFeedEmptyState();

  @override
  State<_CreativeFeedEmptyState> createState() => _CreativeFeedEmptyStateState();
}

class _CreativeFeedEmptyStateState extends State<_CreativeFeedEmptyState>
    with TickerProviderStateMixin {
  late AnimationController _floatController;
  late AnimationController _pulseController;
  late Animation<double> _floatAnimation;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _floatController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2500),
    )..repeat(reverse: true);

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);

    _floatAnimation = Tween<double>(begin: -8, end: 8).animate(
      CurvedAnimation(parent: _floatController, curve: Curves.easeInOut),
    );

    _pulseAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _floatController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Animated floating circles illustration
            SizedBox(
              height: 160,
              width: 200,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Background glow
                  AnimatedBuilder(
                    animation: _pulseAnimation,
                    builder: (context, child) => Container(
                      width: 120 * _pulseAnimation.value,
                      height: 120 * _pulseAnimation.value,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            cs.primary.withOpacity(0.15),
                            cs.primary.withOpacity(0.0),
                          ],
                        ),
                      ),
                    ),
                  ),
                  // Floating circles
                  AnimatedBuilder(
                    animation: _floatAnimation,
                    builder: (context, child) => Stack(
                      alignment: Alignment.center,
                      children: [
                        // Large center circle
                        Transform.translate(
                          offset: Offset(0, _floatAnimation.value),
                          child: Container(
                            width: 64,
                            height: 64,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: LinearGradient(
                                colors: [cs.primary, cs.tertiary],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: cs.primary.withOpacity(0.4),
                                  blurRadius: 20,
                                  offset: const Offset(0, 8),
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.auto_awesome_rounded,
                              color: Colors.white,
                              size: 28,
                            ),
                          ),
                        ),
                        // Small floating circles
                        Transform.translate(
                          offset: Offset(-60, _floatAnimation.value * 0.6 - 20),
                          child: _FloatingDot(
                            size: 24,
                            color: cs.secondary.withOpacity(0.7),
                          ),
                        ),
                        Transform.translate(
                          offset: Offset(65, _floatAnimation.value * 0.8 + 10),
                          child: _FloatingDot(
                            size: 20,
                            color: Colors.orange.withOpacity(0.7),
                          ),
                        ),
                        Transform.translate(
                          offset: Offset(-40, _floatAnimation.value * 0.4 + 40),
                          child: _FloatingDot(
                            size: 16,
                            color: Colors.pink.withOpacity(0.6),
                          ),
                        ),
                        Transform.translate(
                          offset: Offset(50, _floatAnimation.value * 0.5 - 35),
                          child: _FloatingDot(
                            size: 12,
                            color: Colors.green.withOpacity(0.6),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Gradient title
            ShaderMask(
              shaderCallback: (bounds) => LinearGradient(
                colors: [cs.primary, cs.tertiary],
              ).createShader(bounds),
              child: Text(
                'The spark starts with you',
                style: textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
                textAlign: TextAlign.center,
              ),
            ),

            const SizedBox(height: 8),

            // Subtitle hint
            Text(
              'Tap + to share your first thought',
              style: textTheme.bodyMedium?.copyWith(
                color: cs.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),

            const SizedBox(height: 16),

            // Animated arrow pointing to FAB
            AnimatedBuilder(
              animation: _floatAnimation,
              builder: (context, child) => Transform.translate(
                offset: Offset(_floatAnimation.value * 2, 0),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.arrow_forward_rounded,
                      color: cs.primary.withOpacity(0.6),
                      size: 20,
                    ),
                    const SizedBox(width: 4),
                    Icon(
                      Icons.arrow_forward_rounded,
                      color: cs.primary.withOpacity(0.4),
                      size: 16,
                    ),
                    const SizedBox(width: 4),
                    Icon(
                      Icons.arrow_forward_rounded,
                      color: cs.primary.withOpacity(0.2),
                      size: 12,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FloatingDot extends StatelessWidget {
  final double size;
  final Color color;

  const _FloatingDot({required this.size, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color,
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.5),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
    );
  }
}

/// Widget wrapper that tracks when a post becomes visible in viewport
class _AnalyticsTrackingTile extends StatefulWidget {
  final String postId;
  final String postType;
  final int index;
  final FeedAnalyticsService analyticsService;
  final Widget child;

  const _AnalyticsTrackingTile({
    super.key,
    required this.postId,
    required this.postType,
    required this.index,
    required this.analyticsService,
    required this.child,
  });

  @override
  State<_AnalyticsTrackingTile> createState() => _AnalyticsTrackingTileState();
}

class _AnalyticsTrackingTileState extends State<_AnalyticsTrackingTile> {
  bool _hasTrackedView = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _trackViewIfNeeded();
  }

  void _trackViewIfNeeded() {
    if (!_hasTrackedView) {
      _hasTrackedView = true;
      widget.analyticsService.trackPostView(
        postId: widget.postId,
        postType: widget.postType,
        scrollPosition: widget.index,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}
