import 'package:flutter/foundation.dart';
import '../models/models.dart';
import '../models/profile_stats.dart';
import '../repositories/profile_repository.dart';
import '../utils/result.dart';
import '../utils/result_extensions.dart';
import '../services/logging_service.dart';
import '../supabase/supabase_config.dart';

/// State of the profile loading process.
enum ProfileLoadState {
  initial,
  loading,
  loaded,
  error,
  refreshing,
}

/// Provider for profile state management using ChangeNotifier.
/// 
/// This centralizes profile state (user data, stats, posts) and notifies
/// listeners when state changes.
/// 
/// Usage:
/// ```dart
/// // In main.dart
/// ChangeNotifierProvider(
///   create: (_) => ProfileProvider(SupabaseProfileRepository()),
///   child: MyApp(),
/// )
/// 
/// // In widgets
/// final profileProvider = context.watch<ProfileProvider>();
/// ```
class ProfileProvider extends ChangeNotifier {
  static const _tag = 'ProfileProvider';

  final ProfileRepository _repository;

  ProfileProvider(this._repository);

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════

  ProfileLoadState _state = ProfileLoadState.initial;
  UserProfile? _currentUserProfile;
  UserProfile? _viewingProfile; // For viewing other users
  ProfileStats? _currentUserStats;
  ProfileStats? _viewingStats;
  String? _errorMessage;

  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════════════════

  ProfileLoadState get state => _state;
  UserProfile? get currentUserProfile => _currentUserProfile;
  UserProfile? get viewingProfile => _viewingProfile;
  ProfileStats? get currentUserStats => _currentUserStats;
  ProfileStats? get viewingStats => _viewingStats;
  String? get errorMessage => _errorMessage;

  bool get isLoading => _state == ProfileLoadState.loading;
  bool get isRefreshing => _state == ProfileLoadState.refreshing;
  bool get hasError => _state == ProfileLoadState.error;
  bool get hasCurrentUser => _currentUserProfile != null;

  /// Returns the current auth user ID.
  String? get currentUserId => SupabaseConfig.auth.currentUser?.id;

  /// Checks if viewing own profile.
  bool isOwnProfile(String userId) => userId == currentUserId;

  // ═══════════════════════════════════════════════════════════════════════════
  // CURRENT USER ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Loads the current authenticated user's profile.
  Future<void> loadCurrentUserProfile({bool forceRefresh = false}) async {
    final userId = currentUserId;
    if (userId == null) {
      _errorMessage = 'Not authenticated';
      _state = ProfileLoadState.error;
      notifyListeners();
      return;
    }

    if (_state == ProfileLoadState.loading) return;

    _state = forceRefresh ? ProfileLoadState.refreshing : ProfileLoadState.loading;
    _errorMessage = null;
    notifyListeners();

    final result = await _repository.getUserProfile(userId, forceRefresh: forceRefresh);

    result.handle(
      onSuccess: (profile) {
        _currentUserProfile = profile;
        _state = ProfileLoadState.loaded;
        log.info('Loaded current user profile', tag: _tag);
        
        // Load stats in background
        _loadCurrentUserStats();
      },
      onFailure: (message, error) {
        _errorMessage = message;
        _state = ProfileLoadState.error;
        log.error('Failed to load profile: $message', tag: _tag, error: error);
      },
    );

    notifyListeners();
  }

  /// Updates the current user's profile.
  Future<bool> updateProfile(UserProfile updatedProfile) async {
    final result = await _repository.updateUserProfile(updatedProfile);
    
    if (result.isSuccess) {
      _currentUserProfile = updatedProfile;
      notifyListeners();
      log.info('Profile updated', tag: _tag);
      return true;
    }
    
    _errorMessage = result.errorMessage;
    notifyListeners();
    return false;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEWING OTHER PROFILES
  // ═══════════════════════════════════════════════════════════════════════════

  /// Loads another user's profile for viewing.
  Future<void> loadProfileForViewing(String userId) async {
    // If viewing own profile, use current user data
    if (isOwnProfile(userId) && _currentUserProfile != null) {
      _viewingProfile = _currentUserProfile;
      _viewingStats = _currentUserStats;
      notifyListeners();
      return;
    }

    final result = await _repository.getUserProfile(userId);

    result.handle(
      onSuccess: (profile) {
        _viewingProfile = profile;
        log.debug('Loaded profile for viewing: $userId', tag: _tag);
        
        // Load stats in background
        _loadViewingStats(userId);
      },
      onFailure: (message, error) {
        _viewingProfile = null;
        _viewingStats = null;
        log.warning('Failed to load profile for viewing', tag: _tag);
      },
    );

    notifyListeners();
  }

  /// Clears the viewing profile (call when leaving profile view).
  void clearViewingProfile() {
    _viewingProfile = null;
    _viewingStats = null;
    notifyListeners();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGOUT / CLEANUP
  // ═══════════════════════════════════════════════════════════════════════════

  /// Clears all profile state (call on logout).
  void clearAll() {
    _currentUserProfile = null;
    _currentUserStats = null;
    _viewingProfile = null;
    _viewingStats = null;
    _state = ProfileLoadState.initial;
    _errorMessage = null;
    notifyListeners();
    log.info('Profile state cleared', tag: _tag);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  Future<void> _loadCurrentUserStats() async {
    final userId = currentUserId;
    if (userId == null) return;

    final result = await _repository.getProfileStats(userId);
    result.handle(
      onSuccess: (stats) {
        _currentUserStats = stats;
        notifyListeners();
      },
      onFailure: (_, __) {
        log.warning('Failed to load current user stats', tag: _tag);
      },
    );
  }

  Future<void> _loadViewingStats(String userId) async {
    final result = await _repository.getProfileStats(userId);
    result.handle(
      onSuccess: (stats) {
        _viewingStats = stats;
        notifyListeners();
      },
      onFailure: (_, __) {
        log.warning('Failed to load viewing stats', tag: _tag);
      },
    );
  }
}
