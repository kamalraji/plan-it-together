import 'dart:typed_data';
import '../models/models.dart';
import '../models/profile_stats.dart';
import '../models/profile_post.dart';
import '../utils/result.dart';
import '../services/profile_service.dart';

/// Abstract repository interface for profile operations.
/// 
/// This provides a clean abstraction over the profile data layer, enabling:
/// - Consistent error handling via Result<T> pattern
/// - Easy testing through mock implementations
/// - Separation of concerns between UI and data access
abstract class ProfileRepository {
  // ═══════════════════════════════════════════════════════════════════════════
  // PROFILE CRUD
  // ═══════════════════════════════════════════════════════════════════════════

  /// Gets a user profile by ID with optional cache bypass.
  Future<Result<UserProfile>> getUserProfile(
    String userId, {
    bool forceRefresh = false,
  });

  /// Gets a user ID by username (for username-based profile URLs).
  Future<Result<String>> getUserIdByUsername(String username);

  /// Updates a user profile.
  Future<Result<void>> updateUserProfile(UserProfile profile);

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICATION PREFERENCES
  // ═══════════════════════════════════════════════════════════════════════════

  /// Gets notification preferences for a user.
  Future<Result<NotificationPreferences>> getNotificationPreferences(String userId);

  /// Updates notification preferences.
  Future<Result<void>> updateNotificationPreferences(NotificationPreferences prefs);

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFILE STATS & COUNTS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Gets comprehensive profile statistics.
  Future<Result<ProfileStats>> getProfileStats(String userId);

  /// Gets the count of events a user has attended.
  Future<Result<int>> getEventsAttendedCount(String userId);

  /// Gets the count of upcoming events a user is registered for.
  Future<Result<int>> getUpcomingEventsCount(String userId);

  /// Gets the count of saved/favorited events.
  Future<Result<int>> getSavedEventsCount(String userId);

  /// Gets the followers count for a user.
  Future<Result<int>> getFollowersCount(String userId);

  /// Gets the posts count for a user.
  Future<Result<int>> getPostsCount(String userId);

  /// Gets the tickets count for a user.
  Future<Result<int>> getTicketsCount(String userId);

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFILE CONTENT
  // ═══════════════════════════════════════════════════════════════════════════

  /// Gets a user's posts for profile display.
  Future<Result<List<ProfilePost>>> getUserPosts(String userId, {int limit = 20});

  /// Gets event history (past events attended).
  Future<Result<List<EventHistory>>> getEventHistory(String userId);

  /// Gets upcoming events for a user.
  Future<Result<List<Map<String, dynamic>>>> getUpcomingEvents(String userId);

  // ═══════════════════════════════════════════════════════════════════════════
  // MEDIA UPLOADS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Uploads an avatar image.
  Future<Result<String>> uploadAvatar(
    String userId,
    Uint8List imageBytes,
    String fileName,
  );

  /// Deletes an avatar image.
  Future<Result<void>> deleteAvatar(String userId, String avatarUrl);

  /// Uploads a cover image.
  Future<Result<String>> uploadCoverImage(
    String userId,
    Uint8List imageBytes,
    String fileName,
  );

  /// Deletes a cover image.
  Future<Result<void>> deleteCoverImage(String userId, String coverUrl);

  /// Sets a predefined cover gradient theme.
  Future<Result<void>> setCoverGradient(String userId, String? gradientId);
}
