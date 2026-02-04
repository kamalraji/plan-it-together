import 'package:flutter/foundation.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/utils/result.dart';
import 'package:thittam1hub/models/profile_stats.dart';
import 'package:thittam1hub/models/profile_post.dart';
import 'package:thittam1hub/services/cache_service.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/services/error_handler.dart';

/// Service for managing user profiles and notification preferences.
/// 
/// Migrated to use [BaseService] pattern with [ErrorHandler.guard]
/// for consistent error classification and [LoggingService] integration.
class ProfileService extends BaseService with CachingServiceMixin {
  static ProfileService? _instance;
  static ProfileService get instance => _instance ??= ProfileService._();
  ProfileService._();
  
  final CacheService _cache = CacheService.instance;

  @override
  String get tag => 'ProfileService';

  /// Get user profile by user ID with cache-first strategy
  Future<UserProfile?> getUserProfile(String userId, {bool forceRefresh = false}) async {
    // Try cache first (unless forced refresh)
    if (!forceRefresh) {
      final cached = await _cache.getCachedUserProfile(userId);
      if (cached != null) {
        logDebug('Profile loaded from cache', metadata: {'user_id': userId});
        return cached;
      }
    }

    final result = await execute(() async {
      final data = await SupabaseConfig.client
          .from('user_profiles')
          .select()
          .eq('id', userId)
          .maybeSingle();
      
      if (data == null) return null;

      // The table may not store email; ensure required fields exist
      final mutable = Map<String, dynamic>.from(data);
      mutable['email'] = mutable['email'] ?? SupabaseConfig.auth.currentUser?.email ?? '';
      mutable['qr_code'] = mutable['qr_code'] ?? userId;

      final profile = UserProfile.fromJson(mutable);
      
      // Cache the result
      await _cache.cacheUserProfile(profile);
      logDbOperation('SELECT', 'user_profiles', rowCount: 1);
      
      return profile;
    }, operationName: 'getUserProfile');

    // On failure, return stale cache
    if (result is Failure) {
      final staleCache = await _cache.getCachedUserProfileStale(userId);
      if (staleCache != null) {
        logWarning('Returning stale cache due to network error');
        return staleCache;
      }
      return null;
    }

    return (result as Success<UserProfile?>).data;
  }

  /// Get user ID by username (for username-based profile URLs)
  Future<String?> getUserIdByUsername(String username) async {
    final result = await execute(() async {
      final data = await SupabaseConfig.client
          .from('user_profiles')
          .select('id')
          .ilike('username', username)
          .maybeSingle();
      
      return data?['id'] as String?;
    }, operationName: 'getUserIdByUsername');

    return result is Success<String?> ? result.data : null;
  }

  /// Update user profile
  Future<void> updateUserProfile(UserProfile profile) async {
    final result = await execute(() async {
      await SupabaseConfig.client
          .from('user_profiles')
          .update(profile.toUpdateJson())
          .eq('id', profile.id);
      
      // Update cache with new profile
      await _cache.cacheUserProfile(profile);
      logDbOperation('UPDATE', 'user_profiles', rowCount: 1);
      logInfo('Profile updated', metadata: {'user_id': profile.id});
    }, operationName: 'updateUserProfile');

    if (result is Failure<void>) {
      throw Exception((result as Failure<void>).message);
    }
  }

  /// Get notification preferences
  Future<NotificationPreferences?> getNotificationPreferences(String userId) async {
    final result = await execute(() async {
      final data = await SupabaseConfig.client
          .from('notification_preferences')
          .select()
          .eq('user_id', userId)
          .maybeSingle();
      
      if (data == null) {
        return NotificationPreferences(userId: userId);
      }
      return NotificationPreferences.fromJson(data);
    }, operationName: 'getNotificationPreferences');

    return result is Success<NotificationPreferences?> ? (result as Success<NotificationPreferences?>).data : null;
  }

  /// Update notification preferences
  Future<void> updateNotificationPreferences(NotificationPreferences prefs) async {
    final result = await execute(() async {
      await SupabaseConfig.client
          .from('notification_preferences')
          .upsert(prefs.toJson());
      logDbOperation('UPSERT', 'notification_preferences', rowCount: 1);
      logInfo('Notification preferences updated');
    }, operationName: 'updateNotificationPreferences');

    if (result is Failure<void>) {
      throw Exception((result as Failure<void>).message);
    }
  }

  /// Get count of events user has attended (past events with CONFIRMED status)
  Future<int> getEventsAttendedCount(String userId) async {
    final result = await execute(() async {
      final now = DateTime.now().toIso8601String();
      final response = await SupabaseConfig.client
          .from('registrations')
          .select('event_id, events!inner(end_date)')
          .eq('user_id', userId)
          .eq('status', 'CONFIRMED')
          .lt('events.end_date', now);
      return response.length;
    }, operationName: 'getEventsAttendedCount');

    return result is Success<int> ? result.data : 0;
  }

  /// Get count of upcoming events user is registered for
  Future<int> getUpcomingEventsCount(String userId) async {
    final result = await execute(() async {
      final now = DateTime.now().toIso8601String();
      final response = await SupabaseConfig.client
          .from('registrations')
          .select('event_id, events!inner(start_date)')
          .eq('user_id', userId)
          .eq('status', 'CONFIRMED')
          .gte('events.start_date', now);
      return response.length;
    }, operationName: 'getUpcomingEventsCount');

    return result is Success<int> ? result.data : 0;
  }

  /// Get count of saved (favorited) events
  Future<int> getSavedEventsCount(String userId) async {
    final result = await execute(() async {
      final response = await SupabaseConfig.client
          .from('saved_events')
          .select('id')
          .eq('user_id', userId)
          .limit(10000); // Explicit limit for query safety
      return (response as List).length;
    }, operationName: 'getSavedEventsCount');

    return result is Success<int> ? result.data : 0;
  }

  /// Upload avatar image to Supabase storage
  Future<String?> uploadAvatar(String userId, Uint8List imageBytes, String fileName) async {
    final result = await execute(() async {
      final path = 'avatars/$userId/$fileName';
      
      await SupabaseConfig.client.storage
          .from('avatars')
          .uploadBinary(path, imageBytes);
      
      final url = SupabaseConfig.client.storage.from('avatars').getPublicUrl(path);
      logInfo('Avatar uploaded', metadata: {'user_id': userId, 'path': path});
      return url;
    }, operationName: 'uploadAvatar');

    return result is Success<String> ? result.data : null;
  }

  /// Delete avatar from storage
  Future<void> deleteAvatar(String userId, String avatarUrl) async {
    await execute(() async {
      final uri = Uri.parse(avatarUrl);
      final path = uri.pathSegments.skip(uri.pathSegments.indexOf('avatars')).join('/');
      
      await SupabaseConfig.client.storage.from('avatars').remove([path]);
      logInfo('Avatar deleted', metadata: {'user_id': userId});
    }, operationName: 'deleteAvatar');
  }

  /// Upload cover image to Supabase storage
  Future<String?> uploadCoverImage(String userId, Uint8List imageBytes, String fileName) async {
    final result = await execute(() async {
      final path = 'covers/$userId/$fileName';
      
      await SupabaseConfig.client.storage
          .from('avatars')
          .uploadBinary(path, imageBytes);
      
      final url = SupabaseConfig.client.storage.from('avatars').getPublicUrl(path);
      logInfo('Cover uploaded', metadata: {'user_id': userId, 'path': path});
      return url;
    }, operationName: 'uploadCoverImage');

    return result is Success<String> ? result.data : null;
  }

  /// Delete cover image from storage
  Future<void> deleteCoverImage(String userId, String coverUrl) async {
    await execute(() async {
      final uri = Uri.parse(coverUrl);
      final path = uri.pathSegments.skip(uri.pathSegments.indexOf('avatars')).join('/');
      
      await SupabaseConfig.client.storage.from('avatars').remove([path]);
      logInfo('Cover deleted', metadata: {'user_id': userId});
    }, operationName: 'deleteCoverImage');
  }

  /// Set cover gradient theme
  Future<void> setCoverGradient(String userId, String? gradientId) async {
    final result = await execute(() async {
      await SupabaseConfig.client
          .from('user_profiles')
          .update({
            'cover_gradient_id': gradientId,
            'cover_image_url': null,
          })
          .eq('id', userId);
      logDbOperation('UPDATE', 'user_profiles', rowCount: 1);
      logInfo('Cover gradient set', metadata: {'gradient_id': gradientId});
    }, operationName: 'setCoverGradient');

    if (result is Failure<void>) {
      throw Exception((result as Failure<void>).message);
    }
  }

  /// Get tickets count for user
  Future<int> getTicketsCount(String userId) async {
    final result = await execute(() async {
      final response = await SupabaseConfig.client
          .from('registrations')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'CONFIRMED')
          .limit(10000); // Explicit limit for query safety
      return response.length;
    }, operationName: 'getTicketsCount');

    return result is Success<int> ? result.data : 0;
  }

  /// Get event history (past events attended)
  Future<List<EventHistory>> getEventHistory(String userId) async {
    final result = await execute(() async {
      final now = DateTime.now().toIso8601String();
      final response = await SupabaseConfig.client
          .from('registrations')
          .select('''
            id,
            status,
            created_at,
            events!inner(
              id,
              name,
              start_date,
              end_date,
              branding
            )
          ''')
          .eq('user_id', userId)
          .eq('status', 'CONFIRMED')
          .lt('events.end_date', now)
          .order('end_date', ascending: false, referencedTable: 'events')
          .limit(100); // Explicit limit for query safety - reasonable max for history display
      
      logDbOperation('SELECT', 'registrations', rowCount: response.length);
      return response.map((json) => EventHistory.fromJson(json)).toList();
    }, operationName: 'getEventHistory');

    return result is Success<List<EventHistory>> ? result.data : [];
  }

  /// Get comprehensive profile stats
  Future<ProfileStats> getProfileStats(String userId) async {
    final result = await execute(() async {
      startTimer('getProfileStats');
      
      final results = await Future.wait([
        getEventsAttendedCount(userId),
        getUpcomingEventsCount(userId),
        getSavedEventsCount(userId),
        getFollowersCount(userId),
        getPostsCount(userId),
        _getImpactData(userId),
        _getFollowingCount(userId),
      ]);

      final impactData = results[5] as Map<String, dynamic>;
      
      stopTimer('getProfileStats');

      return ProfileStats(
        eventsAttended: results[0] as int,
        upcomingEvents: results[1] as int,
        savedEvents: results[2] as int,
        followersCount: results[3] as int,
        postsCount: results[4] as int,
        impactScore: impactData['impact_score'] ?? 0,
        badgesEarned: impactData['badges_count'] ?? 0,
        currentStreak: impactData['streak_count'] ?? 0,
        longestStreak: impactData['longest_streak'] ?? 0,
        followingCount: results[6] as int,
      );
    }, operationName: 'getProfileStats');

    return result is Success<ProfileStats> ? result.data : const ProfileStats();
  }

  /// Get impact profile data (score, streak, badges)
  Future<Map<String, dynamic>> _getImpactData(String userId) async {
    final result = await execute(() async {
      final response = await SupabaseConfig.client
          .from('impact_profiles')
          .select('impact_score, streak_count, badges')
          .eq('user_id', userId)
          .maybeSingle();

      if (response == null) {
        return {'impact_score': 0, 'streak_count': 0, 'badges_count': 0};
      }

      final badges = response['badges'] as List<dynamic>? ?? [];
      return {
        'impact_score': response['impact_score'] ?? 0,
        'streak_count': response['streak_count'] ?? 0,
        'badges_count': badges.length,
      };
    }, operationName: '_getImpactData');

    return result is Success<Map<String, dynamic>> 
        ? result.data 
        : {'impact_score': 0, 'streak_count': 0, 'badges_count': 0};
  }

  /// Get followers count for user
  Future<int> getFollowersCount(String userId) async {
    final result = await execute(() async {
      final response = await SupabaseConfig.client
          .from('followers')
          .select('id')
          .eq('following_id', userId)
          .eq('status', 'ACCEPTED')
          .limit(10000); // Explicit limit for query safety
      return response.length;
    }, operationName: 'getFollowersCount');

    return result is Success<int> ? result.data : 0;
  }

  /// @deprecated Use getFollowersCount instead
  @Deprecated('Use getFollowersCount() instead')
  Future<int> getConnectionsCount(String userId) async {
    return getFollowersCount(userId);
  }

  /// Get following count for user
  Future<int> _getFollowingCount(String userId) async {
    final result = await execute(() async {
      final response = await SupabaseConfig.client
          .from('followers')
          .select('id')
          .eq('follower_id', userId)
          .eq('status', 'ACCEPTED')
          .limit(10000); // Explicit limit for query safety
      return response.length;
    }, operationName: '_getFollowingCount');

    return result is Success<int> ? result.data : 0;
  }

  /// Get user's posts count
  Future<int> getPostsCount(String userId) async {
    final result = await execute(() async {
      final response = await SupabaseConfig.client
          .from('spark_posts')
          .select('id')
          .eq('author_id', userId)
          .limit(10000); // Explicit limit for query safety
      return response.length;
    }, operationName: 'getPostsCount');

    return result is Success<int> ? result.data : 0;
  }

  /// Get user's posts for profile display
  Future<List<ProfilePost>> getUserPosts(String userId, {int limit = 20}) async {
    final result = await execute(() async {
      final response = await SupabaseConfig.client
          .from('spark_posts')
          .select('*')
          .eq('author_id', userId)
          .order('created_at', ascending: false)
          .limit(limit);

      logDbOperation('SELECT', 'spark_posts', rowCount: response.length);
      return (response as List)
          .map((data) => ProfilePost.fromMap(data as Map<String, dynamic>))
          .toList();
    }, operationName: 'getUserPosts');

    return result is Success<List<ProfilePost>> ? result.data : [];
  }

  /// Get upcoming events for user
  Future<List<Map<String, dynamic>>> getUpcomingEvents(String userId) async {
    final result = await execute(() async {
      final now = DateTime.now().toIso8601String();
      final response = await SupabaseConfig.client
          .from('registrations')
          .select('''
            id,
            status,
            events!inner(
              id,
              name,
              start_date,
              end_date,
              branding
            )
          ''')
          .eq('user_id', userId)
          .eq('status', 'CONFIRMED')
          .gte('events.start_date', now)
          .order('start_date', ascending: true, referencedTable: 'events')
          .limit(10);

      logDbOperation('SELECT', 'registrations', rowCount: response.length);
      return (response as List).map((e) => e as Map<String, dynamic>).toList();
    }, operationName: 'getUpcomingEvents');

    return result is Success<List<Map<String, dynamic>>> ? result.data : [];
  }
}

/// Event history item for displaying past attended events
class EventHistory {
  final String registrationId;
  final String eventId;
  final String eventName;
  final DateTime startDate;
  final DateTime endDate;
  final String? bannerUrl;
  final RegistrationStatus status;
  final DateTime registeredAt;

  const EventHistory({
    required this.registrationId,
    required this.eventId,
    required this.eventName,
    required this.startDate,
    required this.endDate,
    this.bannerUrl,
    required this.status,
    required this.registeredAt,
  });

  factory EventHistory.fromJson(Map<String, dynamic> json) {
    final event = json['events'] as Map<String, dynamic>;
    final branding = event['branding'] as Map<String, dynamic>?;
    
    return EventHistory(
      registrationId: json['id'] as String,
      eventId: event['id'] as String,
      eventName: event['name'] as String,
      startDate: DateTime.parse(event['start_date'] as String),
      endDate: DateTime.parse(event['end_date'] as String),
      bannerUrl: branding?['banner_url'] as String?,
      status: RegistrationStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => RegistrationStatus.CONFIRMED,
      ),
      registeredAt: DateTime.parse(json['created_at'] as String),
    );
  }
}
