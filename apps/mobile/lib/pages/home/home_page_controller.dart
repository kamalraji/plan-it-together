import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/impact_profile.dart';
import 'package:thittam1hub/models/space.dart';
import 'package:thittam1hub/pages/home/home_service.dart';
import 'package:thittam1hub/supabase/spark_service.dart';
import 'package:thittam1hub/supabase/space_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/services/feed_analytics_service.dart';
import 'package:thittam1hub/services/cache_service.dart';
import 'package:thittam1hub/supabase/gamification_service.dart';
import 'package:thittam1hub/services/logging_mixin.dart';

/// Controller for HomePage - handles all business logic
/// Reduces the page to UI-only by extracting state and operations
class HomePageController extends ChangeNotifier with LoggingMixin {
  @override
  String get logTag => 'HomePageController';

  // Dependencies
  final HomeService _homeService;
  final SparkService _sparkService;
  final SpaceService _spaceService;
  final FeedAnalyticsService _analyticsService;
  final CacheService _cacheService;

  // State
  List<SparkPost> _posts = [];
  List<VibeGameItem> _polls = [];
  StreakData? _streakData;
  List<StoryItem> _stories = [];
  List<String> _trendingTags = [];
  List<ImpactProfile> _matchedProfiles = [];
  bool _isLoading = true;
  int _unreadNotificationCount = 0;
  final Set<String> _sparked = {};

  // Tag filter
  String? _selectedTag;

  // New posts indicator
  int _newPostsCount = 0;

  // Pagination
  bool _isLoadingMore = false;
  bool _hasMorePosts = true;
  String? _nextCursor;
  static const int _pageSize = 15;

  // Subscriptions
  StreamSubscription? _notificationSubscription;
  StreamSubscription? _newPostsSubscription;

  HomePageController({
    HomeService? homeService,
    SparkService? sparkService,
    SpaceService? spaceService,
    FeedAnalyticsService? analyticsService,
    CacheService? cacheService,
  })  : _homeService = homeService ?? HomeService(),
        _sparkService = sparkService ?? SparkService(),
         _spaceService = spaceService ?? SpaceService.instance,
        _analyticsService = analyticsService ?? FeedAnalyticsService.instance,
        _cacheService = cacheService ?? CacheService.instance {
    _initialize();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════════════════

  List<SparkPost> get posts => List.unmodifiable(_posts);
  List<VibeGameItem> get polls => List.unmodifiable(_polls);
  StreakData? get streakData => _streakData;
  List<StoryItem> get stories => List.unmodifiable(_stories);
  List<String> get trendingTags => List.unmodifiable(_trendingTags);
  List<ImpactProfile> get matchedProfiles => List.unmodifiable(_matchedProfiles);
  bool get isLoading => _isLoading;
  int get unreadNotificationCount => _unreadNotificationCount;
  Set<String> get sparkedIds => Set.unmodifiable(_sparked);
  String? get selectedTag => _selectedTag;
  int get newPostsCount => _newPostsCount;
  bool get isLoadingMore => _isLoadingMore;
  bool get hasMorePosts => _hasMorePosts;

  /// Get filtered posts based on selected tag
  List<SparkPost> get filteredPosts {
    if (_selectedTag == null) return _posts;
    return _posts.where((p) => p.tags.contains(_selectedTag)).toList();
  }

  String? get currentUserId => SupabaseConfig.client.auth.currentUser?.id;

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  void _initialize() {
    _analyticsService.startSession();
    _loadCachedThenRefresh();
    _subscribeToNotifications();
    _subscribeToNewPosts();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCROLL TRACKING
  // ═══════════════════════════════════════════════════════════════════════════

  void trackScrollDepth(double scrollPosition, double maxExtent) {
    if (maxExtent <= 0 || _posts.isEmpty) return;

    final depth = scrollPosition / maxExtent;
    _analyticsService.trackScrollDepth(
      depth: depth.clamp(0.0, 1.0),
      totalPosts: _posts.length,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  /// Cache-first loading: show cached posts instantly, then refresh in background
  Future<void> _loadCachedThenRefresh() async {
    final cachedPosts = await _cacheService.getCachedFeedPosts();
    if (cachedPosts != null && cachedPosts.isNotEmpty) {
      _posts = cachedPosts.map((m) => SparkPost.fromMap(m)).toList();
      _isLoading = false;
      notifyListeners();
    }

    // Always fetch fresh data in background
    await loadAllData(skipLoadingState: cachedPosts?.isNotEmpty ?? false);
  }

  Future<void> loadAllData({bool skipLoadingState = false}) async {
    if (!skipLoadingState) {
      _isLoading = true;
      _posts = [];
      notifyListeners();
    }

    _hasMorePosts = true;
    _nextCursor = null;
    _newPostsCount = 0;

    final results = await Future.wait([
      _homeService.getStreakData(),
      _homeService.getStoriesData(),
      _homeService.getTrendingTags(),
      _sparkService.getSparkPostsPaginated(),
      _homeService.getActivePolls(),
      _loadMatchedProfiles(),
    ]);

    final postsResult = results[3] as ({List<SparkPost> posts, bool hasMore, String? nextCursor});

    // Cache first page for next cold-start
    if (postsResult.posts.isNotEmpty) {
      _cacheService.cacheFeedPosts(postsResult.posts);
    }

    _streakData = results[0] as StreakData?;
    _stories = results[1] as List<StoryItem>;
    _trendingTags = results[2] as List<String>;
    _posts = postsResult.posts;
    _hasMorePosts = postsResult.hasMore;
    _nextCursor = postsResult.nextCursor;
    _polls = results[4] as List<VibeGameItem>;
    _matchedProfiles = results[5] as List<ImpactProfile>;
    _isLoading = false;

    notifyListeners();
  }

  Future<List<ImpactProfile>> _loadMatchedProfiles() async {
    try {
      final userId = currentUserId;
      if (userId == null) return [];

      // Use explicit column selection for query safety
      final response = await SupabaseConfig.client
          .from('impact_profiles')
          .select('id, user_id, full_name, avatar_url, bio, skills, interests, is_online, created_at')
          .neq('user_id', userId)
          .order('created_at', ascending: false)
          .limit(10);

      return (response as List).map<ImpactProfile>((data) {
        return ImpactProfile.fromMap(data as Map<String, dynamic>);
      }).toList();
    } catch (e) {
      logError('Error loading matched profiles', error: e);
      return [];
    }
  }

  /// Pull-to-refresh handler
  Future<void> onRefresh() async {
    HapticFeedback.mediumImpact();
    await loadAllData();
  }

  /// Called when a new post is created
  void onPostCreated() {
    _cacheService.invalidateFeedCache();
    loadAllData();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGINATION
  // ═══════════════════════════════════════════════════════════════════════════

  Future<void> loadMorePosts() async {
    if (_isLoadingMore || !_hasMorePosts || _nextCursor == null) return;

    _isLoadingMore = true;
    notifyListeners();

    final result = await _sparkService.getSparkPostsPaginated(cursor: _nextCursor);

    _posts.addAll(result.posts);
    _hasMorePosts = result.hasMore;
    _nextCursor = result.nextCursor;
    _isLoadingMore = false;

    notifyListeners();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW POSTS
  // ═══════════════════════════════════════════════════════════════════════════

  void _subscribeToNewPosts() {
    _newPostsSubscription = SupabaseConfig.client
        .from('spark_posts')
        .stream(primaryKey: ['id'])
        .order('created_at', ascending: false)
        .limit(1)
        .listen((data) {
      if (data.isNotEmpty && !_isLoading) {
        final latestPostId = data.first['id'] as String;
        if (_posts.isNotEmpty && _posts.first.id != latestPostId) {
          _newPostsCount++;
          HapticFeedback.lightImpact();
          notifyListeners();
        }
      }
    });
  }

  void acknowledgeNewPosts() {
    HapticFeedback.mediumImpact();
    _newPostsCount = 0;
    notifyListeners();
    loadAllData();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  void _subscribeToNotifications() {
    final userId = currentUserId;
    if (userId == null) return;

    _notificationSubscription = SupabaseConfig.client
        .from('notifications')
        .stream(primaryKey: ['id'])
        .eq('user_id', userId)
        .listen((data) {
      final unread = data.where((n) => n['read'] == false).length;
      _unreadNotificationCount = unread;
      notifyListeners();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAG FILTERING
  // ═══════════════════════════════════════════════════════════════════════════

  void filterByTag(String tag) {
    HapticFeedback.lightImpact();
    _selectedTag = tag;
    notifyListeners();
  }

  void clearTagFilter() {
    HapticFeedback.lightImpact();
    _selectedTag = null;
    notifyListeners();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SPARK ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  bool hasSparked(String postId) => _sparked.contains(postId);

  void toggleSpark(String postId) {
    if (_sparked.contains(postId)) {
      _sparked.remove(postId);
    } else {
      _sparked.add(postId);
    }
    notifyListeners();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STORY ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  Future<Space?> getSpaceForStory(StoryItem story) async {
    try {
      final spaces = await SpaceService.fetchLiveSpaces();
      return spaces.firstWhere(
        (s) => s.id == story.id,
        orElse: () => Space(
          id: story.id,
          topic: story.title,
          hostId: null,
          isLive: true,
          createdAt: DateTime.now(),
        ),
      );
    } catch (e) {
      logError('Error getting space', error: e);
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // POLL VOTING
  // ═══════════════════════════════════════════════════════════════════════════

  Future<void> submitPollVote(String pollId, int optionIndex) async {
    await _homeService.submitPollVote(pollId, optionIndex);
    loadAllData();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  void dispose() {
    _analyticsService.endSession();
    _notificationSubscription?.cancel();
    _newPostsSubscription?.cancel();
    super.dispose();
  }
}
