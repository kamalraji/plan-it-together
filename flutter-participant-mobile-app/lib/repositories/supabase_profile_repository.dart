import 'dart:typed_data';
import '../models/models.dart';
import '../models/profile_stats.dart';
import '../models/profile_post.dart';
import '../utils/result.dart';
import '../services/profile_service.dart';
import 'base_repository.dart';
import 'profile_repository.dart';

/// Supabase implementation of [ProfileRepository].
/// 
/// Extends [BaseRepository] for standardized error handling and logging.
/// Wraps [ProfileService] with consistent Result<T> return types.
class SupabaseProfileRepository extends BaseRepository implements ProfileRepository {
  @override
  String get tag => 'ProfileRepository';
  
  final ProfileService _service;

  SupabaseProfileRepository({ProfileService? service}) 
      : _service = service ?? ProfileService.instance;

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFILE CRUD
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<UserProfile>> getUserProfile(
    String userId, {
    bool forceRefresh = false,
  }) {
    return execute(() async {
      final profile = await _service.getUserProfile(userId, forceRefresh: forceRefresh);
      if (profile == null) {
        throw Exception('Profile not found');
      }
      logDebug('Fetched profile for $userId');
      return profile;
    }, operationName: 'getUserProfile');
  }

  @override
  Future<Result<String>> getUserIdByUsername(String username) {
    return execute(() async {
      final userId = await _service.getUserIdByUsername(username);
      if (userId == null) {
        throw Exception('User not found');
      }
      return userId;
    }, operationName: 'getUserIdByUsername');
  }

  @override
  Future<Result<void>> updateUserProfile(UserProfile profile) {
    return execute(() async {
      await _service.updateUserProfile(profile);
      logInfo('Profile updated for ${profile.id}');
    }, operationName: 'updateUserProfile');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICATION PREFERENCES
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<NotificationPreferences>> getNotificationPreferences(String userId) {
    return execute(() async {
      final prefs = await _service.getNotificationPreferences(userId);
      // Return default preferences if none exist
      return prefs ?? NotificationPreferences(userId: userId);
    }, operationName: 'getNotificationPreferences');
  }

  @override
  Future<Result<void>> updateNotificationPreferences(NotificationPreferences prefs) {
    return execute(() async {
      await _service.updateNotificationPreferences(prefs);
      logInfo('Notification preferences updated');
    }, operationName: 'updateNotificationPreferences');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFILE STATS & COUNTS
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<ProfileStats>> getProfileStats(String userId) {
    return execute(() async {
      return await _service.getProfileStats(userId);
    }, operationName: 'getProfileStats');
  }

  @override
  Future<Result<int>> getEventsAttendedCount(String userId) {
    return execute(() async {
      return await _service.getEventsAttendedCount(userId);
    }, operationName: 'getEventsAttendedCount');
  }

  @override
  Future<Result<int>> getUpcomingEventsCount(String userId) {
    return execute(() async {
      return await _service.getUpcomingEventsCount(userId);
    }, operationName: 'getUpcomingEventsCount');
  }

  @override
  Future<Result<int>> getSavedEventsCount(String userId) {
    return execute(() async {
      return await _service.getSavedEventsCount(userId);
    }, operationName: 'getSavedEventsCount');
  }

  @override
  Future<Result<int>> getFollowersCount(String userId) {
    return execute(() async {
      return await _service.getFollowersCount(userId);
    }, operationName: 'getFollowersCount');
  }

  @override
  Future<Result<int>> getPostsCount(String userId) {
    return execute(() async {
      return await _service.getPostsCount(userId);
    }, operationName: 'getPostsCount');
  }

  @override
  Future<Result<int>> getTicketsCount(String userId) {
    return execute(() async {
      return await _service.getTicketsCount(userId);
    }, operationName: 'getTicketsCount');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFILE CONTENT
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<List<ProfilePost>>> getUserPosts(String userId, {int limit = 20}) {
    return execute(() async {
      return await _service.getUserPosts(userId, limit: limit);
    }, operationName: 'getUserPosts');
  }

  @override
  Future<Result<List<EventHistory>>> getEventHistory(String userId) {
    return execute(() async {
      return await _service.getEventHistory(userId);
    }, operationName: 'getEventHistory');
  }

  @override
  Future<Result<List<Map<String, dynamic>>>> getUpcomingEvents(String userId) {
    return execute(() async {
      return await _service.getUpcomingEvents(userId);
    }, operationName: 'getUpcomingEvents');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MEDIA UPLOADS
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<String>> uploadAvatar(
    String userId,
    Uint8List imageBytes,
    String fileName,
  ) {
    return execute(() async {
      final url = await _service.uploadAvatar(userId, imageBytes, fileName);
      if (url == null) {
        throw Exception('Failed to upload avatar');
      }
      logInfo('Avatar uploaded for $userId');
      return url;
    }, operationName: 'uploadAvatar');
  }

  @override
  Future<Result<void>> deleteAvatar(String userId, String avatarUrl) {
    return execute(() async {
      await _service.deleteAvatar(userId, avatarUrl);
      logInfo('Avatar deleted for $userId');
    }, operationName: 'deleteAvatar');
  }

  @override
  Future<Result<String>> uploadCoverImage(
    String userId,
    Uint8List imageBytes,
    String fileName,
  ) {
    return execute(() async {
      final url = await _service.uploadCoverImage(userId, imageBytes, fileName);
      if (url == null) {
        throw Exception('Failed to upload cover image');
      }
      logInfo('Cover image uploaded for $userId');
      return url;
    }, operationName: 'uploadCoverImage');
  }

  @override
  Future<Result<void>> deleteCoverImage(String userId, String coverUrl) {
    return execute(() async {
      await _service.deleteCoverImage(userId, coverUrl);
      logInfo('Cover image deleted for $userId');
    }, operationName: 'deleteCoverImage');
  }

  @override
  Future<Result<void>> setCoverGradient(String userId, String? gradientId) {
    return execute(() async {
      await _service.setCoverGradient(userId, gradientId);
      logInfo('Cover gradient set for $userId');
    }, operationName: 'setCoverGradient');
  }
}
