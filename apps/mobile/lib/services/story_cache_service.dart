import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:thittam1hub/services/logging_service.dart';
import 'package:thittam1hub/services/video_story_service.dart';

/// Local cache service for story seen states and offline support
/// Implements industry best practices for story caching
class StoryCacheService {
  static const String _tag = 'StoryCacheService';
  static final _log = LoggingService.instance;
  
  static const String _seenStoriesKey = 'seen_video_stories';
  static const String _cachedStoriesKey = 'cached_stories';
  static const String _lastSyncKey = 'last_stories_sync';
  static const Duration _cacheExpiration = Duration(hours: 24);
  
  SharedPreferences? _prefs;
  final Set<String> _seenStoryIds = {};
  final Map<String, VideoStory> _cachedStories = {};
  
  /// Initialize the cache service
  Future<void> initialize() async {
    _prefs = await SharedPreferences.getInstance();
    await _loadSeenStories();
    await _loadCachedStories();
    await _cleanupExpiredEntries();
  }
  
  // ============================================================
  // SEEN STATE MANAGEMENT
  // ============================================================
  
  /// Load seen stories from local storage
  Future<void> _loadSeenStories() async {
    try {
      final data = _prefs?.getString(_seenStoriesKey);
      if (data != null) {
        final Map<String, dynamic> seenData = jsonDecode(data);
        
        // Only keep entries from the last 24 hours
        final now = DateTime.now();
        seenData.forEach((storyId, timestamp) {
          final seenAt = DateTime.parse(timestamp as String);
          if (now.difference(seenAt) < _cacheExpiration) {
            _seenStoryIds.add(storyId);
          }
        });
        
        _log.info('Loaded ${_seenStoryIds.length} seen stories from cache', tag: _tag);
      }
    } catch (e) {
      _log.error('Error loading seen stories', tag: _tag, error: e);
    }
  }
  
  /// Save seen stories to local storage
  Future<void> _saveSeenStories() async {
    try {
      final now = DateTime.now().toIso8601String();
      final Map<String, String> seenData = {};
      for (final id in _seenStoryIds) {
        seenData[id] = now;
      }
      await _prefs?.setString(_seenStoriesKey, jsonEncode(seenData));
    } catch (e) {
      _log.error('Error saving seen stories', tag: _tag, error: e);
    }
  }
  
  /// Mark a story as seen
  Future<void> markStoryAsSeen(String storyId) async {
    if (_seenStoryIds.add(storyId)) {
      await _saveSeenStories();
      _log.debug('Marked story $storyId as seen', tag: _tag);
    }
  }
  
  /// Check if a story has been seen
  bool isStorySeen(String storyId) {
    return _seenStoryIds.contains(storyId);
  }
  
  /// Get all seen story IDs
  Set<String> get seenStoryIds => Set.unmodifiable(_seenStoryIds);
  
  /// Clear seen status for a specific story
  Future<void> clearSeenStatus(String storyId) async {
    if (_seenStoryIds.remove(storyId)) {
      await _saveSeenStories();
    }
  }
  
  /// Clear all seen stories
  Future<void> clearAllSeenStories() async {
    _seenStoryIds.clear();
    await _prefs?.remove(_seenStoriesKey);
  }
  
  // ============================================================
  // STORY CACHING
  // ============================================================
  
  /// Load cached stories from local storage
  Future<void> _loadCachedStories() async {
    try {
      final data = _prefs?.getString(_cachedStoriesKey);
      if (data != null) {
        final List<dynamic> storiesData = jsonDecode(data);
        for (final storyJson in storiesData) {
          final story = VideoStory.fromMap(storyJson as Map<String, dynamic>);
          if (!story.isExpired) {
          _cachedStories[story.id] = story;
          }
        }
        _log.info('Loaded ${_cachedStories.length} cached stories', tag: _tag);
      }
    } catch (e) {
      _log.error('Error loading cached stories', tag: _tag, error: e);
    }
  }
  
  /// Save stories to local storage
  Future<void> cacheStories(List<VideoStory> stories) async {
    try {
      _cachedStories.clear();
      for (final story in stories) {
        _cachedStories[story.id] = story;
      }
      
      final storiesJson = stories.map((s) {
        return {
          'id': s.id,
          'user_id': s.userId,
          'video_url': s.videoUrl,
          'thumbnail_url': s.thumbnailUrl,
          'caption': s.caption,
          'duration_seconds': s.durationSeconds,
          'created_at': s.createdAt.toIso8601String(),
          'expires_at': s.expiresAt.toIso8601String(),
          'view_count': s.viewCount,
          'unique_view_count': s.uniqueViewCount,
          'reaction_count': s.reactionCount,
          'completion_rate': s.completionRate,
          'user_name': s.userName,
          'user_avatar': s.userAvatar,
        };
      }).toList();
      
      await _prefs?.setString(_cachedStoriesKey, jsonEncode(storiesJson));
      await _prefs?.setString(_lastSyncKey, DateTime.now().toIso8601String());
      
      _log.info('Cached ${stories.length} stories', tag: _tag);
    } catch (e) {
      _log.error('Error caching stories', tag: _tag, error: e);
    }
  }
  
  /// Get cached stories (with seen status applied)
  List<VideoStory> getCachedStories() {
    return _cachedStories.values
        .where((s) => !s.isExpired)
        .map((s) => s.copyWith(isViewed: isStorySeen(s.id)))
        .toList();
  }
  
  /// Get a single cached story
  VideoStory? getCachedStory(String storyId) {
    final story = _cachedStories[storyId];
    if (story != null && !story.isExpired) {
      return story.copyWith(isViewed: isStorySeen(storyId));
    }
    return null;
  }
  
  /// Check if cache is stale
  bool get isCacheStale {
    try {
      final lastSync = _prefs?.getString(_lastSyncKey);
      if (lastSync == null) return true;
      
      final lastSyncTime = DateTime.parse(lastSync);
      return DateTime.now().difference(lastSyncTime) > const Duration(minutes: 5);
    } catch (_) {
      return true;
    }
  }
  
  /// Get last sync time
  DateTime? get lastSyncTime {
    try {
      final lastSync = _prefs?.getString(_lastSyncKey);
      return lastSync != null ? DateTime.parse(lastSync) : null;
    } catch (_) {
      return null;
    }
  }
  
  // ============================================================
  // CLEANUP & MAINTENANCE
  // ============================================================
  
  /// Clear old entries (>24h)
  Future<void> _cleanupExpiredEntries() async {
    try {
      // Clean cached stories
      final expiredStoryIds = <String>[];
      _cachedStories.forEach((id, story) {
        if (story.isExpired) {
          expiredStoryIds.add(id);
        }
      });
      
      for (final id in expiredStoryIds) {
        _cachedStories.remove(id);
        _seenStoryIds.remove(id);
      }
      
      if (expiredStoryIds.isNotEmpty) {
        await _saveSeenStories();
        _log.info('Cleaned up ${expiredStoryIds.length} expired entries', tag: _tag);
      }
    } catch (e) {
      _log.error('Error cleaning up expired entries', tag: _tag, error: e);
    }
  }
  
  /// Force cleanup and refresh
  Future<void> forceCleanup() async {
    await _cleanupExpiredEntries();
  }
  
  /// Clear all cached data
  Future<void> clearAllCache() async {
    _seenStoryIds.clear();
    _cachedStories.clear();
    await _prefs?.remove(_seenStoriesKey);
    await _prefs?.remove(_cachedStoriesKey);
    await _prefs?.remove(_lastSyncKey);
    _log.info('Cleared all story cache', tag: _tag);
  }
  
  // ============================================================
  // SERVER SYNC
  // ============================================================
  
  /// Sync seen states with server
  Future<void> syncWithServer(VideoStoryService service) async {
    try {
      // Get fresh stories from server
      final stories = await service.getActiveStories();
      
      // Update cache
      await cacheStories(stories);
      
      // Update seen states from server
      for (final story in stories) {
        if (story.isViewed) {
          _seenStoryIds.add(story.id);
        }
      }
      
      await _saveSeenStories();
      _log.info('Synced with server: ${stories.length} stories', tag: _tag);
    } catch (e) {
      _log.error('Error syncing with server', tag: _tag, error: e);
    }
  }
  
  // ============================================================
  // PRELOADING
  // ============================================================
  
  /// Get stories to preload based on viewing patterns
  List<VideoStory> getStoriesToPreload({int limit = 3}) {
    return _cachedStories.values
        .where((s) => !s.isExpired && !isStorySeen(s.id))
        .take(limit)
        .toList();
  }
  
  // ============================================================
  // STATISTICS
  // ============================================================
  
  /// Get cache statistics
  Map<String, dynamic> getCacheStats() {
    return {
      'seenCount': _seenStoryIds.length,
      'cachedCount': _cachedStories.length,
      'expiredCount': _cachedStories.values.where((s) => s.isExpired).length,
      'lastSync': lastSyncTime?.toIso8601String(),
      'isCacheStale': isCacheStale,
    };
  }
}
