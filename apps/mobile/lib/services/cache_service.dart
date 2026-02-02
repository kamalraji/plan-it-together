import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/models/saved_event.dart';
import 'package:thittam1hub/services/logging_service.dart';

// Conditionally import Hive for non-web platforms
// Web builds use SharedPreferences fallback only
import 'cache_service_hive.dart' if (dart.library.html) 'cache_service_web_stub.dart';

/// Centralized cache service for offline data access
/// Uses SharedPreferences for timestamps and Hive for complex objects (non-web)
/// Falls back to SharedPreferences-only on web
class CacheService {
  static const String _tag = 'CacheService';
  static final _log = LoggingService.instance;
  
  static const Duration defaultTTL = Duration(hours: 1);
  static const Duration profileTTL = Duration(hours: 24);
  static const Duration eventsTTL = Duration(minutes: 30);
  static const Duration savedEventsTTL = Duration(hours: 1);
  static const Duration feedTTL = Duration(minutes: 5);

  // Cache keys
  static const String userProfileKey = 'cached_user_profile';
  static const String eventsListKey = 'cached_events';
  static const String savedEventsKey = 'cached_saved_events';
  static const String feedCacheKey = 'cached_feed_posts';
  static const String timestampsKey = 'cache_timestamps';

  static CacheService? _instance;
  static CacheService get instance => _instance ??= CacheService._();
  
  CacheService._();

  SharedPreferences? _prefs;
  bool _initialized = false;

  /// Initialize cache - must be called before using cache
  Future<void> init() async {
    if (_initialized) return;
    
    try {
      _prefs = await SharedPreferences.getInstance();
      
      // Initialize Hive on non-web platforms
      if (!kIsWeb) {
        await initHiveCache();
      }
      
      _initialized = true;
      _log.info('Initialized (web: $kIsWeb)', tag: _tag);
    } catch (e) {
      _log.error('Init error', tag: _tag, error: e);
    }
  }

  /// Check if cache is valid (not expired)
  bool isCacheValid(String key, Duration ttl) {
    if (_prefs == null) return false;
    
    final timestamp = _prefs!.getInt('${timestampsKey}_$key');
    if (timestamp == null) return false;
    
    final cachedAt = DateTime.fromMillisecondsSinceEpoch(timestamp);
    return DateTime.now().difference(cachedAt) < ttl;
  }

  /// Update cache timestamp
  Future<void> _updateTimestamp(String key) async {
    await _prefs?.setInt('${timestampsKey}_$key', DateTime.now().millisecondsSinceEpoch);
  }

  // ==========================================
  // USER PROFILE CACHING
  // ==========================================

  /// Cache user profile
  Future<void> cacheUserProfile(UserProfile profile) async {
    if (_prefs == null) return;
    
    try {
      final json = jsonEncode(profile.toJson());
      final key = '${userProfileKey}_${profile.id}';
      await _prefs!.setString(key, json);
      await _updateTimestamp(key);
      _log.debug('Profile cached: ${profile.id}', tag: _tag);
    } catch (e) {
      _log.error('Cache profile error', tag: _tag, error: e);
    }
  }

  /// Get cached user profile
  Future<UserProfile?> getCachedUserProfile(String userId) async {
    if (_prefs == null) return null;
    
    try {
      final key = '${userProfileKey}_$userId';
      if (!isCacheValid(key, profileTTL)) return null;
      
      final json = _prefs!.getString(key);
      if (json == null) return null;
      
      final data = jsonDecode(json) as Map<String, dynamic>;
      return UserProfile.fromJson(data);
    } catch (e) {
      _log.error('Get cached profile error', tag: _tag, error: e);
      return null;
    }
  }

  /// Get cached profile even if expired (for offline fallback)
  Future<UserProfile?> getCachedUserProfileStale(String userId) async {
    if (_prefs == null) return null;
    
    try {
      final json = _prefs!.getString('${userProfileKey}_$userId');
      if (json == null) return null;
      
      final data = jsonDecode(json) as Map<String, dynamic>;
      return UserProfile.fromJson(data);
    } catch (e) {
      _log.error('Get stale cached profile error', tag: _tag, error: e);
      return null;
    }
  }

  // ==========================================
  // EVENTS CACHING
  // ==========================================

  /// Cache events list
  Future<void> cacheEvents(List<Event> events) async {
    if (_prefs == null) return;
    
    try {
      final jsonList = events.map((e) => e.toJson()).toList();
      await _prefs!.setString(eventsListKey, jsonEncode(jsonList));
      await _updateTimestamp(eventsListKey);
      _log.debug('Events cached: ${events.length} items', tag: _tag);
    } catch (e) {
      _log.error('Cache events error', tag: _tag, error: e);
    }
  }

  /// Get cached events list
  Future<List<Event>?> getCachedEvents() async {
    if (_prefs == null) return null;
    
    try {
      if (!isCacheValid(eventsListKey, eventsTTL)) return null;
      
      final json = _prefs!.getString(eventsListKey);
      if (json == null) return null;
      
      final List<dynamic> data = jsonDecode(json) as List<dynamic>;
      return data.map((e) => Event.fromJson(e as Map<String, dynamic>)).toList();
    } catch (e) {
      _log.error('Get cached events error', tag: _tag, error: e);
      return null;
    }
  }

  /// Get cached events even if expired (for offline fallback)
  Future<List<Event>?> getCachedEventsStale() async {
    if (_prefs == null) return null;
    
    try {
      final json = _prefs!.getString(eventsListKey);
      if (json == null) return null;
      
      final List<dynamic> data = jsonDecode(json) as List<dynamic>;
      return data.map((e) => Event.fromJson(e as Map<String, dynamic>)).toList();
    } catch (e) {
      _log.error('Get stale cached events error', tag: _tag, error: e);
      return null;
    }
  }

  // ==========================================
  // SAVED EVENTS CACHING
  // ==========================================

  /// Cache saved events list
  Future<void> cacheSavedEvents(List<SavedEvent> events, String userId) async {
    if (_prefs == null) return;
    
    try {
      final enrichedList = events.map((e) => {
        'id': e.id,
        'event_id': e.eventId,
        'event_name': e.eventName,
        'event_banner_url': e.eventBannerUrl,
        'event_start_date': e.eventStartDate.toIso8601String(),
        'event_end_date': e.eventEndDate.toIso8601String(),
        'venue': e.venue,
        'reminder_enabled': e.reminderEnabled,
        'reminder_time': e.reminderTime?.toIso8601String(),
        'notes': e.notes,
        'saved_at': e.savedAt.toIso8601String(),
      }).toList();
      
      final key = '${savedEventsKey}_$userId';
      await _prefs!.setString(key, jsonEncode(enrichedList));
      await _updateTimestamp(key);
      _log.debug('Saved events cached: ${events.length} items', tag: _tag);
    } catch (e) {
      _log.error('Cache saved events error', tag: _tag, error: e);
    }
  }

  /// Get cached saved events list
  Future<List<SavedEvent>?> getCachedSavedEvents(String userId) async {
    if (_prefs == null) return null;
    
    try {
      final key = '${savedEventsKey}_$userId';
      if (!isCacheValid(key, savedEventsTTL)) return null;
      
      final json = _prefs!.getString(key);
      if (json == null) return null;
      
      final List<dynamic> data = jsonDecode(json) as List<dynamic>;
      return data.map((e) => _savedEventFromCacheJson(e as Map<String, dynamic>)).toList();
    } catch (e) {
      _log.error('Get cached saved events error', tag: _tag, error: e);
      return null;
    }
  }

  /// Get cached saved events even if expired (for offline fallback)
  Future<List<SavedEvent>?> getCachedSavedEventsStale(String userId) async {
    if (_prefs == null) return null;
    
    try {
      final json = _prefs!.getString('${savedEventsKey}_$userId');
      if (json == null) return null;
      
      final List<dynamic> data = jsonDecode(json) as List<dynamic>;
      return data.map((e) => _savedEventFromCacheJson(e as Map<String, dynamic>)).toList();
    } catch (e) {
      _log.error('Get stale cached saved events error', tag: _tag, error: e);
      return null;
    }
  }

  /// Parse SavedEvent from cached JSON format
  SavedEvent _savedEventFromCacheJson(Map<String, dynamic> json) {
    return SavedEvent(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      eventName: json['event_name'] as String? ?? 'Unknown Event',
      eventBannerUrl: json['event_banner_url'] as String?,
      eventStartDate: DateTime.parse(json['event_start_date'] as String),
      eventEndDate: DateTime.parse(json['event_end_date'] as String),
      venue: json['venue'] as String?,
      reminderEnabled: json['reminder_enabled'] as bool? ?? false,
      reminderTime: json['reminder_time'] != null 
          ? DateTime.parse(json['reminder_time'] as String) 
          : null,
      notes: json['notes'] as String?,
      savedAt: DateTime.parse(json['saved_at'] as String),
    );
  }

  // ==========================================
  // FEED CACHING (First Page Only)
  // ==========================================

  /// Cache first page of feed posts for instant cold-start
  Future<void> cacheFeedPosts(List<dynamic> posts) async {
    if (_prefs == null || posts.isEmpty) return;
    
    try {
      // Only cache first 15 posts for cold-start
      final postsToCache = posts.take(15).toList();
      final jsonList = postsToCache.map((p) => p.toMap()).toList();
      await _prefs!.setString(feedCacheKey, jsonEncode(jsonList));
      await _updateTimestamp(feedCacheKey);
      _log.debug('Feed cached: ${postsToCache.length} posts', tag: _tag);
    } catch (e) {
      _log.error('Cache feed error', tag: _tag, error: e);
    }
  }

  /// Get cached feed posts (returns raw maps for service to parse)
  Future<List<Map<String, dynamic>>?> getCachedFeedPosts() async {
    if (_prefs == null) return null;
    
    try {
      // Return cached even if slightly stale for instant display
      final json = _prefs!.getString(feedCacheKey);
      if (json == null) return null;
      
      final List<dynamic> data = jsonDecode(json) as List<dynamic>;
      _log.debug('Feed cache hit: ${data.length} posts', tag: _tag);
      return data.cast<Map<String, dynamic>>();
    } catch (e) {
      _log.error('Get cached feed error', tag: _tag, error: e);
      return null;
    }
  }

  /// Check if feed cache is fresh (within TTL)
  bool isFeedCacheFresh() {
    return isCacheValid(feedCacheKey, feedTTL);
  }

  /// Invalidate feed cache (e.g., after creating new post)
  Future<void> invalidateFeedCache() async {
    try {
      await _prefs?.remove(feedCacheKey);
      await _prefs?.remove('${timestampsKey}_$feedCacheKey');
      _log.debug('Feed cache invalidated', tag: _tag);
    } catch (e) {
      _log.error('Invalidate feed cache error', tag: _tag, error: e);
    }
  }

  // ==========================================
  // CACHE MANAGEMENT
  // ==========================================

  /// Invalidate specific cache
  Future<void> invalidateCache(String key) async {
    try {
      await _prefs?.remove('${timestampsKey}_$key');
      await _prefs?.remove(key);
      _log.debug('Cache invalidated: $key', tag: _tag);
    } catch (e) {
      _log.error('Invalidate cache error', tag: _tag, error: e);
    }
  }

  /// Invalidate profile cache for a user (e.g., after username change)
  /// This forces fresh data to be fetched on next profile load
  Future<void> invalidateProfileCache(String userId) async {
    try {
      final key = '${userProfileKey}_$userId';
      await _prefs?.remove(key);
      await _prefs?.remove('${timestampsKey}_$key');
      _log.debug('Profile cache invalidated for user: $userId', tag: _tag);
    } catch (e) {
      _log.error('Invalidate profile cache error', tag: _tag, error: e);
    }
  }
  
  /// Alias for invalidateProfileCache for backwards compatibility
  Future<void> invalidateUserProfile(String userId) => invalidateProfileCache(userId);

  /// Invalidate user-specific caches (on logout)
  Future<void> invalidateUserCache(String userId) async {
    try {
      await _prefs?.remove('${userProfileKey}_$userId');
      await _prefs?.remove('${savedEventsKey}_$userId');
      await _prefs?.remove('${timestampsKey}_${userProfileKey}_$userId');
      await _prefs?.remove('${timestampsKey}_${savedEventsKey}_$userId');
      _log.debug('User cache invalidated: $userId', tag: _tag);
    } catch (e) {
      _log.error('Invalidate user cache error', tag: _tag, error: e);
    }
  }

  /// Clear all caches
  Future<void> clearAllCache() async {
    try {
      // Clear SharedPreferences cache keys
      final keys = _prefs?.getKeys() ?? <String>{};
      for (final key in keys) {
        if (key.startsWith(userProfileKey) || 
            key.startsWith(eventsListKey) || 
            key.startsWith(savedEventsKey) ||
            key.startsWith(timestampsKey)) {
          await _prefs?.remove(key);
        }
      }
      _log.info('All caches cleared', tag: _tag);
    } catch (e) {
      _log.error('Clear all cache error', tag: _tag, error: e);
    }
  }

  /// Get cache statistics for debugging
  Map<String, dynamic> getCacheStats() {
    final keys = _prefs?.getKeys() ?? <String>{};
    final profileCount = keys.where((k) => k.startsWith(userProfileKey)).length;
    final eventsCount = keys.where((k) => k.startsWith(eventsListKey)).length;
    final savedEventsCount = keys.where((k) => k.startsWith(savedEventsKey)).length;
    
    return {
      'initialized': _initialized,
      'isWeb': kIsWeb,
      'profileEntries': profileCount,
      'eventsEntries': eventsCount,
      'savedEventsEntries': savedEventsCount,
    };
  }
}
