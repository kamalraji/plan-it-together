import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/services/logging_service.dart';
import 'package:uuid/uuid.dart';

/// Event types for engagement tracking
enum EngagementEventType {
  view,
  spark,
  unspark,
  comment,
  share,
  bookmark,
  expand,
  longPress,
}

/// Model for pending engagement event
@immutable
class PendingEngagementEvent {
  final String postId;
  final String postType;
  final EngagementEventType eventType;
  final int timeSpentSeconds;
  final int scrollPosition;
  final DateTime timestamp;

  const PendingEngagementEvent({
    required this.postId,
    required this.postType,
    required this.eventType,
    this.timeSpentSeconds = 0,
    this.scrollPosition = 0,
    required this.timestamp,
  });

  Map<String, dynamic> toMap(String userId, String sessionId) => {
    'user_id': userId,
    'session_id': sessionId,
    'post_id': postId,
    'post_type': postType,
    'event_type': eventType.name,
    'time_spent_seconds': timeSpentSeconds,
    'scroll_position': scrollPosition,
  };
}

/// Service for tracking scroll depth and content engagement analytics
/// Implements batching, debouncing, and offline-resilient syncing
class FeedAnalyticsService {
  static const String _tag = 'FeedAnalyticsService';
  static final _log = LoggingService.instance;
  
  static FeedAnalyticsService? _instance;
  static FeedAnalyticsService get instance => _instance ??= FeedAnalyticsService._();
  FeedAnalyticsService._();

  final _supabase = SupabaseConfig.client;
  final _uuid = const Uuid();

  // Session management
  String? _currentSessionId;
  DateTime? _sessionStartTime;
  
  // Scroll depth tracking
  double _maxScrollDepth = 0.0;
  int _postsViewed = 0;
  int _totalPostsAvailable = 0;
  final Set<String> _viewedPostIds = {};
  
  // Engagement event batching
  final List<PendingEngagementEvent> _pendingEvents = [];
  Timer? _batchTimer;
  static const Duration _batchInterval = Duration(seconds: 30);
  static const int _maxBatchSize = 50;

  // Scroll depth debouncing
  Timer? _scrollDepthTimer;
  static const Duration _scrollDepthDebounce = Duration(seconds: 5);

  /// Get current user ID
  String? get _userId => _supabase.auth.currentUser?.id;

  /// Start a new analytics session
  void startSession() {
    _currentSessionId = _uuid.v4();
    _sessionStartTime = DateTime.now();
    _maxScrollDepth = 0.0;
    _postsViewed = 0;
    _viewedPostIds.clear();
    _pendingEvents.clear();
    
    // Start batch timer
    _batchTimer?.cancel();
    _batchTimer = Timer.periodic(_batchInterval, (_) => _flushEvents());
    
    _log.info('Session started: $_currentSessionId', tag: _tag);
  }

  /// End current session and flush all pending data
  Future<void> endSession() async {
    _batchTimer?.cancel();
    _scrollDepthTimer?.cancel();
    
    // Flush remaining events
    await _flushEvents();
    
    // Save scroll depth analytics
    await _saveScrollDepthAnalytics();
    
    _log.info('Session ended: $_currentSessionId', tag: _tag);
    
    _currentSessionId = null;
    _sessionStartTime = null;
  }

  /// Track scroll depth (0.0 to 1.0)
  void trackScrollDepth({
    required double depth,
    required int totalPosts,
  }) {
    if (depth > _maxScrollDepth) {
      _maxScrollDepth = depth;
    }
    _totalPostsAvailable = totalPosts;
    
    // Debounce scroll depth saves
    _scrollDepthTimer?.cancel();
    _scrollDepthTimer = Timer(_scrollDepthDebounce, () {
      _saveScrollDepthAnalytics();
    });
  }

  /// Track when a post becomes visible
  void trackPostView({
    required String postId,
    required String postType,
    required int scrollPosition,
  }) {
    if (_viewedPostIds.contains(postId)) return;
    
    _viewedPostIds.add(postId);
    _postsViewed++;
    
    _queueEvent(PendingEngagementEvent(
      postId: postId,
      postType: postType,
      eventType: EngagementEventType.view,
      scrollPosition: scrollPosition,
      timestamp: DateTime.now(),
    ));
  }

  /// Track engagement action (spark, comment, share, etc.)
  void trackEngagement({
    required String postId,
    required String postType,
    required EngagementEventType eventType,
    int timeSpentSeconds = 0,
    int scrollPosition = 0,
  }) {
    _queueEvent(PendingEngagementEvent(
      postId: postId,
      postType: postType,
      eventType: eventType,
      timeSpentSeconds: timeSpentSeconds,
      scrollPosition: scrollPosition,
      timestamp: DateTime.now(),
    ));
    
    _log.debug('Tracked ${eventType.name} on $postType post', tag: _tag);
  }

  /// Queue event for batched upload
  void _queueEvent(PendingEngagementEvent event) {
    _pendingEvents.add(event);
    
    // Flush immediately if batch is full
    if (_pendingEvents.length >= _maxBatchSize) {
      _flushEvents();
    }
  }

  /// Flush pending events to database
  Future<void> _flushEvents() async {
    if (_pendingEvents.isEmpty) return;
    
    final userId = _userId;
    final sessionId = _currentSessionId;
    if (userId == null || sessionId == null) return;

    // Take current batch
    final eventsToFlush = List<PendingEngagementEvent>.from(_pendingEvents);
    _pendingEvents.clear();

    try {
      final batch = eventsToFlush
          .map((e) => e.toMap(userId, sessionId))
          .toList();

      await _supabase.from('feed_engagement_analytics').insert(batch);
      
      _log.debug('Flushed ${batch.length} engagement events', tag: _tag);
    } catch (e) {
      // Re-queue failed events
      _pendingEvents.insertAll(0, eventsToFlush);
      _log.error('Failed to flush events', tag: _tag, error: e);
    }
  }

  /// Save scroll depth analytics
  Future<void> _saveScrollDepthAnalytics() async {
    final userId = _userId;
    final sessionId = _currentSessionId;
    final startTime = _sessionStartTime;
    
    if (userId == null || sessionId == null || startTime == null) return;

    try {
      final duration = DateTime.now().difference(startTime).inSeconds;
      
      await _supabase.from('feed_scroll_analytics').upsert({
        'user_id': userId,
        'session_id': sessionId,
        'max_scroll_depth': _maxScrollDepth,
        'posts_viewed': _postsViewed,
        'total_posts_available': _totalPostsAvailable,
        'scroll_duration_seconds': duration,
        'reached_end': _maxScrollDepth >= 0.95,
        'device_type': kIsWeb ? 'web' : 'mobile',
      }, onConflict: 'session_id');
      
      _log.debug('Saved scroll depth: ${(_maxScrollDepth * 100).toInt()}%', tag: _tag);
    } catch (e) {
      _log.error('Failed to save scroll depth', tag: _tag, error: e);
    }
  }

  /// Get engagement stats for a date range (admin use)
  Future<List<Map<String, dynamic>>> getEngagementStats({
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final response = await _supabase.rpc('get_content_engagement_stats', params: {
        'start_date': (startDate ?? DateTime.now().subtract(const Duration(days: 7))).toIso8601String(),
        'end_date': (endDate ?? DateTime.now()).toIso8601String(),
      });
      
      return List<Map<String, dynamic>>.from(response ?? []);
    } catch (e) {
      _log.error('Failed to get engagement stats', tag: _tag, error: e);
      return [];
    }
  }

  /// Get scroll depth distribution (admin use)
  Future<List<Map<String, dynamic>>> getScrollDepthDistribution({
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final response = await _supabase.rpc('get_scroll_depth_distribution', params: {
        'start_date': (startDate ?? DateTime.now().subtract(const Duration(days: 7))).toIso8601String(),
        'end_date': (endDate ?? DateTime.now()).toIso8601String(),
      });
      
      return List<Map<String, dynamic>>.from(response ?? []);
    } catch (e) {
      _log.error('Failed to get scroll depth distribution', tag: _tag, error: e);
      return [];
    }
  }

  /// Cleanup resources
  void dispose() {
    _batchTimer?.cancel();
    _scrollDepthTimer?.cancel();
  }
}
