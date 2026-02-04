import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
export 'package:supabase_flutter/supabase_flutter.dart' show RealtimeChannel;
import 'package:thittam1hub/models/impact_profile.dart';
import 'package:thittam1hub/models/match_insight.dart';
import 'package:thittam1hub/models/circle.dart';
import 'package:thittam1hub/models/follower.dart';
import 'package:thittam1hub/models/networking_models.dart';
import 'package:thittam1hub/supabase/impact_service.dart';
import 'package:thittam1hub/supabase/circle_service.dart';
import 'package:thittam1hub/supabase/networking_service.dart';
import 'package:thittam1hub/services/followers_service.dart';
import 'package:thittam1hub/services/interaction_tracking_service.dart';
import 'package:thittam1hub/services/logging_mixin.dart';
import 'package:thittam1hub/utils/intent_config.dart';

/// Discovery mode for the Pulse page
enum DiscoveryMode { people, groups }

/// Controller for the Pulse discovery page.
/// 
/// Manages state for:
/// - AI-powered profile discovery and filtering
/// - Circle discovery and membership
/// - Match scoring with multi-signal fusion
/// - URL synchronization for deep links
class PulsePageController extends ChangeNotifier with LoggingMixin {
  @override
  String get logTag => 'PulsePageController';

  final ImpactService _impactService;
  final CircleService _circleService;
  final FollowersService _followersService;
  final NetworkingService _networkingService;

  // Profile state
  List<ImpactProfile> _allProfiles = [];
  List<ImpactProfile> _filteredProfiles = [];
  List<SmartMatch> _aiMatches = []; // AI-powered matches
  int _currentIndex = 0;
  bool _isLoading = true;
  bool _useAIMatching = true; // Toggle for AI vs legacy matching
  ImpactProfile? _myProfile;
  final Map<String, MatchResult> _matchResults = {};
  final Map<String, int> _matchScores = {};
  final Map<String, bool> _onlineStatus = {};
  final Map<String, bool> _followsMe = {};
  RealtimeChannel? _onlineStatusChannel;

  // Filters
  List<String> _selectedSkills = [];
  List<String> _selectedInterests = [];
  List<String> _selectedLookingFor = [];

  // Discovery mode and circles
  DiscoveryMode _discoveryMode = DiscoveryMode.people;
  List<CircleDiscoveryResult> _matchedCircles = [];
  List<Circle> _autoMatchedCircles = [];
  List<Circle> _popularCircles = [];
  List<Circle> _recommendedCircles = [];
  Set<String> _joinedCircleIds = {};
  bool _circlesLoading = false;

  // Pagination for AI matches
  int _aiMatchOffset = 0;
  bool _hasMoreAIMatches = true;

  // Search query from URL
  String? _searchQuery;

  final InteractionTrackingService _tracking = InteractionTrackingService.instance;

  PulsePageController({
    ImpactService? impactService,
    CircleService? circleService,
    FollowersService? followersService,
    NetworkingService? networkingService,
    String? initialIntent,
    String? initialMode,
    String? searchQuery,
  })  : _impactService = impactService ?? ImpactService(),
        _circleService = circleService ?? CircleService(),
        _followersService = followersService ?? FollowersService.instance,
        _networkingService = networkingService ?? NetworkingService(),
        _searchQuery = searchQuery {
    _initializeFromDeepLink(initialIntent, initialMode);
  }

  // ========== Getters ==========

  List<ImpactProfile> get allProfiles => _allProfiles;
  List<ImpactProfile> get filteredProfiles => _filteredProfiles;
  List<SmartMatch> get aiMatches => _aiMatches;
  int get currentIndex => _currentIndex;
  bool get isLoading => _isLoading;
  bool get useAIMatching => _useAIMatching;
  ImpactProfile? get myProfile => _myProfile;
  Map<String, MatchResult> get matchResults => _matchResults;
  Map<String, int> get matchScores => _matchScores;
  Map<String, bool> get onlineStatus => _onlineStatus;
  Map<String, bool> get followsMe => _followsMe;
  bool get hasMoreAIMatches => _hasMoreAIMatches;

  List<String> get selectedSkills => _selectedSkills;
  List<String> get selectedInterests => _selectedInterests;
  List<String> get selectedLookingFor => _selectedLookingFor;
  bool get hasActiveFilters =>
      _selectedSkills.isNotEmpty ||
      _selectedInterests.isNotEmpty ||
      _selectedLookingFor.isNotEmpty;

  DiscoveryMode get discoveryMode => _discoveryMode;
  List<CircleDiscoveryResult> get matchedCircles => _matchedCircles;
  List<Circle> get autoMatchedCircles => _autoMatchedCircles;
  List<Circle> get popularCircles => _popularCircles;
  List<Circle> get recommendedCircles => _recommendedCircles;
  Set<String> get joinedCircleIds => _joinedCircleIds;
  bool get circlesLoading => _circlesLoading;
  String? get searchQuery => _searchQuery;

  /// Current profile being displayed (from AI matches or legacy)
  ImpactProfile? get currentProfile {
    if (_useAIMatching && _aiMatches.isNotEmpty) {
      return _currentIndex < _aiMatches.length ? _aiMatches[_currentIndex].profile : null;
    }
    return _currentIndex < _filteredProfiles.length ? _filteredProfiles[_currentIndex] : null;
  }

  /// Current AI match (if using AI matching)
  SmartMatch? get currentAIMatch {
    if (_useAIMatching && _currentIndex < _aiMatches.length) {
      return _aiMatches[_currentIndex];
    }
    return null;
  }

  /// Match score for current profile
  int get currentMatchScore {
    if (_useAIMatching && currentAIMatch != null) {
      return currentAIMatch!.matchScore;
    }
    return currentProfile != null ? (_matchScores[currentProfile!.userId] ?? 0) : 0;
  }

  /// Match result for current profile
  MatchResult? get currentMatchResult {
    if (_useAIMatching && currentAIMatch != null) {
      return currentAIMatch!.matchResult;
    }
    return currentProfile != null ? _matchResults[currentProfile!.userId] : null;
  }

  /// Online status for current profile
  bool get currentIsOnline {
    if (_useAIMatching && currentAIMatch != null) {
      return currentAIMatch!.isOnline;
    }
    return currentProfile != null && (_onlineStatus[currentProfile!.userId] ?? false);
  }

  /// Whether current profile follows the user
  bool get currentFollowsMe {
    if (_useAIMatching && currentAIMatch != null) {
      return currentAIMatch!.followsYou;
    }
    return currentProfile != null && (_followsMe[currentProfile!.userId] ?? false);
  }

  // ========== Initialization ==========

  void _initializeFromDeepLink(String? initialIntent, String? initialMode) {
    if (initialIntent != null) {
      final config = IntentConfig.getByKey(initialIntent.toUpperCase());
      if (config != null) {
        _selectedLookingFor = [config.key];
      }
    }

    if (initialMode != null) {
      final modeStr = initialMode.toLowerCase();
      if (modeStr == 'groups') {
        _discoveryMode = DiscoveryMode.groups;
      }
    }
  }

  /// Initialize the controller - call from initState
  Future<void> initialize() async {
    if (_useAIMatching) {
      await loadAIMatches();
    } else {
      await loadProfiles();
    }
    subscribeToOnlineStatus();
    _impactService.updateOnlineStatus(true);
    
    if (_discoveryMode == DiscoveryMode.groups) {
      await loadCircles();
    }
  }

  /// Toggle between AI and legacy matching
  void toggleAIMatching(bool useAI) {
    if (_useAIMatching == useAI) return;
    _useAIMatching = useAI;
    _currentIndex = 0;
    notifyListeners();
    
    if (useAI) {
      loadAIMatches();
    } else {
      loadProfiles();
    }
  }

  /// Load AI-powered matches for Pulse (universal context)
  Future<void> loadAIMatches({bool loadMore = false}) async {
    if (!loadMore) {
      _isLoading = true;
      _aiMatchOffset = 0;
      _hasMoreAIMatches = true;
      notifyListeners();
    }

    try {
      final matches = await _networkingService.getPulseMatches(
        limit: 20,
        offset: _aiMatchOffset,
      );

      if (mounted) {
        if (loadMore) {
          _aiMatches.addAll(matches);
        } else {
          _aiMatches = matches;
          _currentIndex = 0;
        }
        
        _hasMoreAIMatches = matches.length >= 20;
        _aiMatchOffset += matches.length;
        
        // Update online status map
        for (final match in matches) {
          _onlineStatus[match.profile.userId] = match.isOnline;
        }
        
        _isLoading = false;
        notifyListeners();
      }
    } catch (e) {
      logError('Failed to load AI matches', error: e);
      // Fallback to legacy matching
      _useAIMatching = false;
      await loadProfiles();
    }
  }

  /// Load more AI matches (pagination)
  Future<void> loadMoreAIMatches() async {
    if (!_hasMoreAIMatches || _isLoading) return;
    await loadAIMatches(loadMore: true);
  }

  /// Subscribe to realtime online status updates
  void subscribeToOnlineStatus() {
    _onlineStatusChannel = _impactService.subscribeToOnlineStatus((userId, isOnline) {
      _onlineStatus[userId] = isOnline;
      
      // Update AI match online status
      for (int i = 0; i < _aiMatches.length; i++) {
        if (_aiMatches[i].profile.userId == userId) {
          // SmartMatch is immutable, but we track separately
          break;
        }
      }
      
      notifyListeners();
    });
  }

  bool get mounted => true; // Simplified - real implementation would track disposal

  // ========== Profile Operations ==========

  Future<void> loadProfiles() async {
    _isLoading = true;
    notifyListeners();

    _myProfile = await _impactService.getMyImpactProfile();

    // Build lookingFor filter with complementary keys
    List<String>? lookingForFilter;
    if (_selectedLookingFor.isNotEmpty) {
      lookingForFilter = List.from(_selectedLookingFor);
      for (final key in _selectedLookingFor) {
        final config = IntentConfig.getByKey(key);
        if (config?.complementaryKey != null) {
          lookingForFilter.add(config!.complementaryKey!);
        }
      }
    }

    final profiles = await _impactService.getImpactProfiles(
      skills: _selectedSkills.isEmpty ? null : _selectedSkills,
      interests: _selectedInterests.isEmpty ? null : _selectedInterests,
      lookingFor: lookingForFilter,
    );

    _allProfiles = profiles;
    _filteredProfiles = List.of(profiles);
    _matchScores.clear();
    _matchResults.clear();
    _onlineStatus.clear();
    _followsMe.clear();

    if (_myProfile != null) {
      for (final p in _filteredProfiles) {
        final result = _impactService.calculateMatchInsights(_myProfile!, p);
        _matchResults[p.userId] = result;
        _matchScores[p.userId] = result.totalScore;
        _onlineStatus[p.userId] = p.isOnline;
      }
      _filteredProfiles.sort((a, b) =>
          (_matchScores[b.userId] ?? 0).compareTo(_matchScores[a.userId] ?? 0));
    }

    _currentIndex = 0;
    _isLoading = false;
    notifyListeners();

    // Check followsMe status asynchronously (batch optimized)
    _checkFollowsMeStatus();
  }

  /// Batch check if profiles follow the current user (N+1 optimization)
  Future<void> _checkFollowsMeStatus() async {
    final userIds = _filteredProfiles.take(10).map((p) => p.userId).toList();
    if (userIds.isEmpty) return;

    try {
      final followsMap = await _followersService.batchCheckFollowsMe(userIds);
      _followsMe.addAll(followsMap);
      notifyListeners();
    } catch (e) {
      logError('Error batch checking followsMe', error: e);
    }
  }

  /// Skip the current profile
  void onSkip() {
    final profile = currentProfile;
    if (profile == null) return;
    
    // Track skip for AI matching signals
    _tracking.trackSkip(targetUserId: profile.userId);
    
    _impactService.skipProfile(profile.userId);
    _advanceToNextProfile();
  }

  /// Follow the current profile
  Future<FollowResult> onFollow() async {
    final profile = currentProfile;
    if (profile == null) {
      return FollowResult.failure('No profile selected');
    }

    final result = await _followersService.followUser(profile.userId);

    if (result.success || result.requestSent) {
      // Track follow for AI matching signals
      _tracking.trackFollow(targetUserId: profile.userId);
      _advanceToNextProfile();
    }

    return result;
  }

  /// Save the current profile to favorites
  Future<bool> onSave() async {
    final profile = currentProfile;
    if (profile == null) return false;

    try {
      // Track save for AI matching signals
      _tracking.trackSave(targetUserId: profile.userId);
      
      await _impactService.saveProfile(profile.userId);
      _advanceToNextProfile();
      return true;
    } catch (e) {
      logError('Failed to save profile', error: e);
      return false;
    }
  }

  void _advanceToNextProfile() {
    if (_useAIMatching) {
      if (_currentIndex < _aiMatches.length - 1) {
        _currentIndex++;
        // Load more when near end
        if (_currentIndex >= _aiMatches.length - 5 && _hasMoreAIMatches) {
          loadMoreAIMatches();
        }
      } else {
        _aiMatches.removeAt(_currentIndex);
        if (_aiMatches.isEmpty) {
          loadAIMatches();
          return;
        }
      }
    } else {
      if (_currentIndex < _filteredProfiles.length - 1) {
        _currentIndex++;
      } else {
        _filteredProfiles.removeAt(_currentIndex);
        if (_filteredProfiles.isEmpty) {
          loadProfiles();
          return;
        }
      }
    }
    notifyListeners();
  }

  // ========== Filter Operations ==========

  void applyFilters(List<String> skills, List<String> interests, List<String> lookingFor) {
    _selectedSkills = skills;
    _selectedInterests = interests;
    _selectedLookingFor = lookingFor;
    notifyListeners();
    loadProfiles();
  }

  void removeSkillFilter(String skill) {
    _selectedSkills.remove(skill);
    notifyListeners();
    loadProfiles();
  }

  void removeInterestFilter(String interest) {
    _selectedInterests.remove(interest);
    notifyListeners();
    loadProfiles();
  }

  void removeLookingForFilter(String lookingFor) {
    _selectedLookingFor.remove(lookingFor);
    notifyListeners();
    loadProfiles();
  }

  void clearAllFilters() {
    _selectedSkills.clear();
    _selectedInterests.clear();
    _selectedLookingFor.clear();
    notifyListeners();
    loadProfiles();
  }

  // ========== Discovery Mode ==========

  void setDiscoveryMode(DiscoveryMode mode) {
    if (_discoveryMode == mode) return;
    HapticFeedback.lightImpact();
    _discoveryMode = mode;
    notifyListeners();

    if (mode == DiscoveryMode.groups) {
      loadCircles();
    }
  }

  // ========== Circle Operations ==========

  Future<void> loadCircles() async {
    _circlesLoading = true;
    notifyListeners();

    try {
      final futures = await Future.wait([
        _circleService.getAutoMatchedCircles(),
        _circleService.getPopularCircles(),
        _circleService.getRecommendedCircles(),
        _circleService.getUserCircles(),
      ]);

      _autoMatchedCircles = futures[0] as List<Circle>;
      _popularCircles = futures[1] as List<Circle>;
      _recommendedCircles = futures[2] as List<Circle>;
      _joinedCircleIds = futures[3] as Set<String>;

      // Build legacy matchedCircles for compatibility
      _matchedCircles = _recommendedCircles
          .map((circle) => CircleDiscoveryResult(
                circle: circle,
                matchScore: 75,
                insights: [],
              ))
          .toList();
    } catch (e) {
      logError('Failed to load circles', error: e);
    } finally {
      _circlesLoading = false;
      notifyListeners();
    }
  }

  Future<bool> toggleCircleMembership(Circle circle) async {
    final isJoined = _joinedCircleIds.contains(circle.id);

    // Optimistic update
    if (isJoined) {
      _joinedCircleIds.remove(circle.id);
    } else {
      _joinedCircleIds.add(circle.id);
    }
    HapticFeedback.mediumImpact();
    notifyListeners();

    try {
      if (isJoined) {
        await _circleService.leaveCircle(circle.id);
      } else {
        await _circleService.joinCircle(circle.id);
      }
      return true;
    } catch (e) {
      // Rollback on failure
      if (isJoined) {
        _joinedCircleIds.add(circle.id);
      } else {
        _joinedCircleIds.remove(circle.id);
      }
      notifyListeners();
      logError('Failed to toggle circle membership', error: e);
      return false;
    }
  }

  bool isCircleJoined(String circleId) => _joinedCircleIds.contains(circleId);

  /// Create a new circle
  Future<bool> createCircle({
    required String name,
    String? description,
    required String icon,
    required bool isPublic,
    List<String> tags = const [],
  }) async {
    try {
      await _circleService.createCircle(
        name: name,
        description: description,
        icon: icon,
        isPublic: isPublic,
        tags: tags,
      );
      await loadCircles();
      return true;
    } catch (e) {
      logError('Failed to create circle', error: e);
      return false;
    }
  }

  // ========== URL Params ==========

  /// Get URL parameters for current state
  PulseUrlParams getUrlParams() {
    return PulseUrlParams(
      intent: _selectedLookingFor.isNotEmpty ? _selectedLookingFor.first.toLowerCase() : null,
      mode: _discoveryMode != DiscoveryMode.people ? _discoveryMode.name : null,
    );
  }

  // ========== Refresh ==========

  Future<void> onRefresh() async {
    HapticFeedback.mediumImpact();
    if (_useAIMatching) {
      await loadAIMatches();
    } else {
      await loadProfiles();
    }
    if (_discoveryMode == DiscoveryMode.groups) {
      await loadCircles();
    }
  }

  // ========== Cleanup ==========

  @override
  void dispose() {
    _onlineStatusChannel?.unsubscribe();
    _impactService.updateOnlineStatus(false);
    super.dispose();
  }
}

/// URL parameters for the Pulse page
class PulseUrlParams {
  final String? intent;
  final String? mode;

  const PulseUrlParams({this.intent, this.mode});

  String toQueryString() {
    final params = <String>['tab=pulse'];
    if (intent != null) params.add('intent=$intent');
    if (mode != null) params.add('mode=$mode');
    return params.join('&');
  }
}

/// Circle discovery result with match score and insights.
class CircleDiscoveryResult {
  final Circle circle;
  final int matchScore;
  final List<String> insights;

  CircleDiscoveryResult({
    required this.circle,
    required this.matchScore,
    required this.insights,
  });
}
