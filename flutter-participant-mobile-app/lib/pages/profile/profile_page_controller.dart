import 'dart:async';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/models/profile_stats.dart';
import 'package:thittam1hub/models/profile_post.dart';
import 'package:thittam1hub/models/follower.dart';
import 'package:thittam1hub/services/cache_service.dart';
import 'package:thittam1hub/services/profile_service.dart';
import 'package:thittam1hub/services/profile_realtime_service.dart';
import 'package:thittam1hub/services/saved_events_service.dart';
import 'package:thittam1hub/services/followers_service.dart';
import 'package:thittam1hub/supabase/gamification_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/services/logging_mixin.dart';

/// Controller for ProfilePage - handles all business logic
/// 
/// Reduces the page to UI-only by extracting state and operations.
/// Implements optimistic updates with rollback and real-time sync.
class ProfilePageController extends ChangeNotifier with LoggingMixin {
  @override
  String get logTag => 'ProfilePageController';

  // Dependencies
  final ProfileService _profileService;
  final GamificationService _gamificationService;
  final SavedEventsService _savedEventsService;
  final FollowersService _followersService;
  final CacheService _cacheService;
  final ProfileRealtimeService _realtimeService;
  
  // Real-time subscription
  StreamSubscription<String>? _realtimeSubscription;

  // Core profile state
  UserProfile? _profile;
  ProfileStats _stats = const ProfileStats();
  bool _isLoading = true;
  int _selectedTabIndex = 0;

  // Tab content
  List<ProfilePost> _posts = [];
  List<EventHistory> _eventHistory = [];
  List<Map<String, dynamic>> _upcomingEvents = [];

  // Badges
  List<BadgeItem> _earnedBadges = [];
  List<String> _myBadgeIds = [];

  // Quick action counts
  int _savedEventsCount = 0;
  FollowStats _followStats = FollowStats.empty();
  int _ticketsCount = 0;

  ProfilePageController({
    ProfileService? profileService,
    GamificationService? gamificationService,
    SavedEventsService? savedEventsService,
    FollowersService? followersService,
    CacheService? cacheService,
    ProfileRealtimeService? realtimeService,
  })  : _profileService = profileService ?? ProfileService.instance,
        _gamificationService = gamificationService ?? GamificationService.instance,
        _savedEventsService = savedEventsService ?? SavedEventsService.instance,
        _followersService = followersService ?? FollowersService.instance,
        _cacheService = cacheService ?? CacheService.instance,
        _realtimeService = realtimeService ?? ProfileRealtimeService.instance {
    _initialize();
    _subscribeToRealtime();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════════════════

  UserProfile? get profile => _profile;
  ProfileStats get stats => _stats;
  bool get isLoading => _isLoading;
  int get selectedTabIndex => _selectedTabIndex;
  List<ProfilePost> get posts => List.unmodifiable(_posts);
  List<EventHistory> get eventHistory => List.unmodifiable(_eventHistory);
  List<Map<String, dynamic>> get upcomingEvents => List.unmodifiable(_upcomingEvents);
  List<BadgeItem> get earnedBadges => List.unmodifiable(_earnedBadges);
  List<String> get myBadgeIds => List.unmodifiable(_myBadgeIds);
  int get savedEventsCount => _savedEventsCount;
  FollowStats get followStats => _followStats;
  int get ticketsCount => _ticketsCount;

  String? get currentUserId => SupabaseConfig.auth.currentUser?.id;

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  void _initialize() {
    _loadCachedProfile();
    loadProfile();
  }

  /// Subscribe to real-time profile updates for cross-device sync
  void _subscribeToRealtime() {
    final userId = currentUserId;
    if (userId == null) return;
    
    _realtimeService.subscribe(userId);
    _realtimeSubscription = _realtimeService.onProfileUpdated.listen((updatedUserId) {
      if (updatedUserId == userId) {
        logInfo('Profile updated via realtime, reloading');
        loadProfile(forceRefresh: true);
      }
    });
  }

  /// Load cached profile for instant display
  Future<void> _loadCachedProfile() async {
    final userId = currentUserId;
    if (userId == null) return;

    final cachedProfile = await _cacheService.getCachedUserProfileStale(userId);
    if (cachedProfile != null) {
      _profile = cachedProfile;
      _isLoading = false;
      notifyListeners();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFILE LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  Future<void> loadProfile({bool forceRefresh = false}) async {
    final userId = currentUserId;
    if (userId == null) return;

    // Only show loading if no cached data
    if (_profile == null && !_isLoading) {
      _isLoading = true;
      notifyListeners();
    }

    try {
      final results = await Future.wait([
        _profileService.getUserProfile(userId, forceRefresh: forceRefresh),
        _profileService.getProfileStats(userId),
        _profileService.getUserPosts(userId),
        _profileService.getEventHistory(userId),
        _profileService.getUpcomingEvents(userId),
        _gamificationService.getAllBadges(),
        _gamificationService.getMyBadgeIds(),
        _savedEventsService.getSavedEventsCount(),
        _followersService.getFollowStats(),
        _profileService.getTicketsCount(userId),
      ]);

      final allBadges = results[5] as List<BadgeItem>;
      final myBadgeIds = results[6] as List<String>;
      final earnedBadges = allBadges.where((b) => myBadgeIds.contains(b.id)).toList();

      _profile = results[0] as UserProfile?;
      _stats = results[1] as ProfileStats;
      _posts = results[2] as List<ProfilePost>;
      _eventHistory = results[3] as List<EventHistory>;
      _upcomingEvents = results[4] as List<Map<String, dynamic>>;
      _earnedBadges = earnedBadges;
      _myBadgeIds = myBadgeIds;
      _savedEventsCount = results[7] as int;
      _followStats = results[8] as FollowStats;
      _ticketsCount = results[9] as int;
      _isLoading = false;

      notifyListeners();
    } catch (e) {
      logError('Failed to load profile', error: e);
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Pull-to-refresh handler
  Future<void> onRefresh() async {
    HapticFeedback.mediumImpact();
    await loadProfile(forceRefresh: true);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  void setSelectedTab(int index) {
    if (_selectedTabIndex != index) {
      _selectedTabIndex = index;
      notifyListeners();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COVER IMAGE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  Future<bool> setGradient(String gradientId) async {
    final userId = currentUserId;
    if (userId == null) return false;

    // Store previous state for rollback
    final previousProfile = _profile;
    
    // OPTIMISTIC: Update UI immediately
    _profile = _profile?.copyWith(
      coverGradientId: gradientId,
      coverImageUrl: null,
    );
    notifyListeners();

    try {
      await _profileService.setCoverGradient(userId, gradientId);
      return true;
    } catch (e) {
      // ROLLBACK on failure
      _profile = previousProfile;
      notifyListeners();
      logError('Failed to set gradient', error: e);
      return false;
    }
  }

  Future<CoverUploadResult> uploadCoverImage(Uint8List bytes, String fileName) async {
    final userId = currentUserId;
    if (userId == null || _profile == null) {
      return CoverUploadResult.failed('User not authenticated');
    }

    try {
      final coverUrl = await _profileService.uploadCoverImage(userId, bytes, fileName);
      if (coverUrl != null) {
        final updatedProfile = _profile!.copyWith(
          coverImageUrl: coverUrl,
          coverGradientId: null,
        );
        await _profileService.updateUserProfile(updatedProfile);
        _profile = updatedProfile;
        notifyListeners();
        return CoverUploadResult.success;
      }
      return CoverUploadResult.failed('Upload returned no URL');
    } catch (e) {
      return CoverUploadResult.failed(e.toString());
    }
  }

  Future<bool> removeCover() async {
    final userId = currentUserId;
    if (userId == null) return false;

    // Store previous state for rollback
    final previousProfile = _profile;
    final previousCoverUrl = _profile?.coverImageUrl;
    
    // OPTIMISTIC: Update UI immediately
    _profile = _profile?.copyWith(
      coverImageUrl: null,
      coverGradientId: null,
    );
    notifyListeners();

    try {
      if (previousCoverUrl != null) {
        await _profileService.deleteCoverImage(userId, previousCoverUrl);
      }
      await _profileService.setCoverGradient(userId, null);
      return true;
    } catch (e) {
      // ROLLBACK on failure
      _profile = previousProfile;
      notifyListeners();
      logError('Failed to remove cover', error: e);
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SHARE PROFILE DATA
  // ═══════════════════════════════════════════════════════════════════════════

  ShareProfileData? getShareData() {
    final userId = currentUserId;
    if (userId == null || _profile == null) return null;

    return ShareProfileData(
      userId: userId,
      displayName: _profile!.fullName ?? 'User',
      headline: _profile!.bio,
      handle: _profile!.socialLinks?['handle'] as String?,
      avatarUrl: _profile!.avatarUrl,
      impactScore: _stats.impactScore,
      eventsAttended: _stats.eventsAttended,
      followersCount: _followStats.followersCount,
      skills: _profile!.skills ?? [],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTHENTICATION
  // ═══════════════════════════════════════════════════════════════════════════

  Future<void> logout() async {
    _realtimeSubscription?.cancel();
    _realtimeService.unsubscribe();
    await SupabaseConfig.auth.signOut();
  }

  @override
  void dispose() {
    _realtimeSubscription?.cancel();
    _realtimeService.unsubscribe();
    super.dispose();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA CLASSES
// ═══════════════════════════════════════════════════════════════════════════

/// Result of cover image upload
sealed class CoverUploadResult {
  const CoverUploadResult();

  static const CoverUploadResult success = CoverSuccess();

  factory CoverUploadResult.failed(String message) = CoverFailed;
}

class CoverSuccess extends CoverUploadResult {
  const CoverSuccess();
}

class CoverFailed extends CoverUploadResult {
  final String message;
  const CoverFailed(this.message);
}

/// Data needed for share profile sheet
class ShareProfileData {
  final String userId;
  final String displayName;
  final String? headline;
  final String? handle;
  final String? avatarUrl;
  final int impactScore;
  final int eventsAttended;
  final int followersCount;
  final List<String> skills;

  const ShareProfileData({
    required this.userId,
    required this.displayName,
    this.headline,
    this.handle,
    this.avatarUrl,
    required this.impactScore,
    required this.eventsAttended,
    required this.followersCount,
    required this.skills,
  });
}
