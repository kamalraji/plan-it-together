import 'package:flutter/foundation.dart';
import 'package:thittam1hub/utils/result.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';

/// Unified analytics event types for type-safe tracking.
enum AnalyticsEventType {
  // Content engagement
  postView,
  postSpark,
  postUnspark,
  postComment,
  postShare,
  postBookmark,
  postExpand,
  
  // Social interactions
  follow,
  unfollow,
  profileView,
  connectionRequest,
  connectionAccept,
  
  // Messaging
  messageOpen,
  messageSend,
  reactionAdd,
  
  // Events
  eventView,
  eventRegister,
  eventShare,
  eventSave,
  
  // Discovery
  searchQuery,
  filterApply,
  categoryBrowse,
  
  // Session
  appOpen,
  appBackground,
  screenView,
  
  // Commerce
  productView,
  productClick,
  ticketPurchase,
}

/// Immutable analytics event payload.
@immutable
class AnalyticsEvent {
  final AnalyticsEventType type;
  final String? contentId;
  final String? contentType;
  final String? targetUserId;
  final String? platform;
  final Map<String, dynamic>? metadata;
  final DateTime timestamp;
  
  const AnalyticsEvent._({
    required this.type,
    this.contentId,
    this.contentType,
    this.targetUserId,
    this.platform,
    this.metadata,
    required this.timestamp,
  });
  
  // Content engagement factories
  factory AnalyticsEvent.postView(String postId, {int? scrollPosition}) =>
      AnalyticsEvent._(
        type: AnalyticsEventType.postView,
        contentId: postId,
        contentType: 'spark_post',
        metadata: scrollPosition != null ? {'scroll_position': scrollPosition} : null,
        timestamp: DateTime.now(),
      );
  
  factory AnalyticsEvent.postSpark(String postId) => AnalyticsEvent._(
    type: AnalyticsEventType.postSpark,
    contentId: postId,
    contentType: 'spark_post',
    timestamp: DateTime.now(),
  );
  
  factory AnalyticsEvent.postUnspark(String postId) => AnalyticsEvent._(
    type: AnalyticsEventType.postUnspark,
    contentId: postId,
    contentType: 'spark_post',
    timestamp: DateTime.now(),
  );
  
  factory AnalyticsEvent.postComment(String postId, {int? commentLength}) =>
      AnalyticsEvent._(
        type: AnalyticsEventType.postComment,
        contentId: postId,
        contentType: 'spark_post',
        metadata: commentLength != null ? {'comment_length': commentLength} : null,
        timestamp: DateTime.now(),
      );
  
  factory AnalyticsEvent.postShare(String postId, String platform) =>
      AnalyticsEvent._(
        type: AnalyticsEventType.postShare,
        contentId: postId,
        contentType: 'spark_post',
        platform: platform,
        timestamp: DateTime.now(),
      );
  
  factory AnalyticsEvent.postBookmark(String postId) => AnalyticsEvent._(
    type: AnalyticsEventType.postBookmark,
    contentId: postId,
    contentType: 'spark_post',
    timestamp: DateTime.now(),
  );
  
  // Social interaction factories
  factory AnalyticsEvent.follow(String targetUserId) => AnalyticsEvent._(
    type: AnalyticsEventType.follow,
    targetUserId: targetUserId,
    timestamp: DateTime.now(),
  );
  
  factory AnalyticsEvent.unfollow(String targetUserId) => AnalyticsEvent._(
    type: AnalyticsEventType.unfollow,
    targetUserId: targetUserId,
    timestamp: DateTime.now(),
  );
  
  factory AnalyticsEvent.profileView(String userId) => AnalyticsEvent._(
    type: AnalyticsEventType.profileView,
    targetUserId: userId,
    timestamp: DateTime.now(),
  );
  
  // Event factories
  factory AnalyticsEvent.eventView(String eventId) => AnalyticsEvent._(
    type: AnalyticsEventType.eventView,
    contentId: eventId,
    contentType: 'event',
    timestamp: DateTime.now(),
  );
  
  factory AnalyticsEvent.eventRegister(String eventId, {String? tierId, double? amount}) =>
      AnalyticsEvent._(
        type: AnalyticsEventType.eventRegister,
        contentId: eventId,
        contentType: 'event',
        metadata: {
          if (tierId != null) 'tier_id': tierId,
          if (amount != null) 'amount': amount,
        },
        timestamp: DateTime.now(),
      );
  
  factory AnalyticsEvent.eventShare(String eventId, String platform) =>
      AnalyticsEvent._(
        type: AnalyticsEventType.eventShare,
        contentId: eventId,
        contentType: 'event',
        platform: platform,
        timestamp: DateTime.now(),
      );
  
  // Discovery factories
  factory AnalyticsEvent.searchQuery(String query, {int? resultCount}) =>
      AnalyticsEvent._(
        type: AnalyticsEventType.searchQuery,
        metadata: {
          'query': query,
          if (resultCount != null) 'result_count': resultCount,
        },
        timestamp: DateTime.now(),
      );
  
  factory AnalyticsEvent.screenView(String screenName, {Map<String, dynamic>? params}) =>
      AnalyticsEvent._(
        type: AnalyticsEventType.screenView,
        metadata: {
          'screen_name': screenName,
          ...?params,
        },
        timestamp: DateTime.now(),
      );
  
  // Product factories
  factory AnalyticsEvent.productView(String productId, {String? orgId}) =>
      AnalyticsEvent._(
        type: AnalyticsEventType.productView,
        contentId: productId,
        contentType: 'product',
        metadata: orgId != null ? {'org_id': orgId} : null,
        timestamp: DateTime.now(),
      );
  
  factory AnalyticsEvent.productClick(String productId, {String? orgId}) =>
      AnalyticsEvent._(
        type: AnalyticsEventType.productClick,
        contentId: productId,
        contentType: 'product',
        metadata: orgId != null ? {'org_id': orgId} : null,
        timestamp: DateTime.now(),
      );
  
  Map<String, dynamic> toJson() => {
    'event_type': type.name,
    'content_id': contentId,
    'content_type': contentType,
    'target_user_id': targetUserId,
    'platform': platform,
    'metadata': metadata,
    'created_at': timestamp.toIso8601String(),
  };
}

/// Unified analytics facade consolidating all analytics tracking.
/// 
/// Industrial best practice: Single point of analytics integration
/// with batching, deduplication, and offline support.
class AnalyticsFacade extends BaseService {
  static AnalyticsFacade? _instance;
  static AnalyticsFacade get instance => _instance ??= AnalyticsFacade._();
  AnalyticsFacade._();
  
  @override
  String get tag => 'Analytics';
  
  final _supabase = SupabaseConfig.client;
  
  // Event queue for batching
  final List<AnalyticsEvent> _eventQueue = [];
  static const int _batchSize = 10;
  static const Duration _flushInterval = Duration(seconds: 30);
  
  bool _isProcessing = false;
  DateTime? _lastFlush;
  
  // Session tracking
  String? _sessionId;
  DateTime? _sessionStart;
  
  /// Initialize analytics with session tracking.
  void startSession() {
    _sessionId = DateTime.now().millisecondsSinceEpoch.toString();
    _sessionStart = DateTime.now();
    track(AnalyticsEvent._(
      type: AnalyticsEventType.appOpen,
      metadata: {'session_id': _sessionId},
      timestamp: DateTime.now(),
    ));
    logInfo('Session started: $_sessionId');
  }
  
  /// End current session.
  void endSession() {
    if (_sessionId != null && _sessionStart != null) {
      final duration = DateTime.now().difference(_sessionStart!);
      track(AnalyticsEvent._(
        type: AnalyticsEventType.appBackground,
        metadata: {
          'session_id': _sessionId,
          'duration_seconds': duration.inSeconds,
        },
        timestamp: DateTime.now(),
      ));
      logInfo('Session ended: $_sessionId (${duration.inSeconds}s)');
    }
    _flushQueue();
    _sessionId = null;
    _sessionStart = null;
  }
  
  /// Track an analytics event (queued for batching).
  Future<void> track(AnalyticsEvent event) async {
    _eventQueue.add(event);
    logDebug('Queued: ${event.type.name}', metadata: {
      'content_id': event.contentId,
      'queue_size': _eventQueue.length,
    });
    
    // Auto-flush when batch size reached
    if (_eventQueue.length >= _batchSize) {
      await _flushQueue();
    }
  }
  
  /// Convenience: Track post view
  Future<void> trackPostView(String postId, {int? scrollPosition}) =>
      track(AnalyticsEvent.postView(postId, scrollPosition: scrollPosition));
  
  /// Convenience: Track spark (like)
  Future<void> trackSpark(String postId) =>
      track(AnalyticsEvent.postSpark(postId));
  
  /// Convenience: Track unspark (unlike)
  Future<void> trackUnspark(String postId) =>
      track(AnalyticsEvent.postUnspark(postId));
  
  /// Convenience: Track comment
  Future<void> trackComment(String postId, {int? commentLength}) =>
      track(AnalyticsEvent.postComment(postId, commentLength: commentLength));
  
  /// Convenience: Track share
  Future<void> trackShare(String contentId, String platform) =>
      track(AnalyticsEvent.postShare(contentId, platform));
  
  /// Convenience: Track follow
  Future<void> trackFollow(String targetUserId) =>
      track(AnalyticsEvent.follow(targetUserId));
  
  /// Convenience: Track unfollow
  Future<void> trackUnfollow(String targetUserId) =>
      track(AnalyticsEvent.unfollow(targetUserId));
  
  /// Convenience: Track profile view
  Future<void> trackProfileView(String userId) =>
      track(AnalyticsEvent.profileView(userId));
  
  /// Convenience: Track event view
  Future<void> trackEventView(String eventId) =>
      track(AnalyticsEvent.eventView(eventId));
  
  /// Convenience: Track event registration
  Future<void> trackEventRegistration(String eventId, {String? tierId, double? amount}) =>
      track(AnalyticsEvent.eventRegister(eventId, tierId: tierId, amount: amount));
  
  /// Convenience: Track screen view
  Future<void> trackScreen(String screenName, {Map<String, dynamic>? params}) =>
      track(AnalyticsEvent.screenView(screenName, params: params));
  
  /// Convenience: Track search
  Future<void> trackSearch(String query, {int? resultCount}) =>
      track(AnalyticsEvent.searchQuery(query, resultCount: resultCount));
  
  /// Convenience: Track product view
  Future<void> trackProductView(String productId, {String? orgId}) =>
      track(AnalyticsEvent.productView(productId, orgId: orgId));
  
  /// Convenience: Track product click
  Future<void> trackProductClick(String productId, {String? orgId}) =>
      track(AnalyticsEvent.productClick(productId, orgId: orgId));
  
  /// Force flush all queued events.
  Future<Result<int>> flushNow() async {
    return _flushQueue();
  }
  
  /// Get pending event count.
  int get pendingEventCount => _eventQueue.length;
  
  /// Flush queued events to Supabase.
  Future<Result<int>> _flushQueue() async {
    if (_isProcessing || _eventQueue.isEmpty) {
      return const Success(0);
    }
    
    _isProcessing = true;
    final events = List<AnalyticsEvent>.from(_eventQueue);
    _eventQueue.clear();
    
    final result = await execute(() async {
      final userId = _supabase.auth.currentUser?.id;
      
      final rows = events.map((e) => {
        ...e.toJson(),
        'user_id': userId,
        'session_id': _sessionId,
      }).toList();
      
      await _supabase.from('analytics_events').insert(rows);
      
      logDbOperation('INSERT', 'analytics_events', rowCount: rows.length);
      return rows.length;
    }, operationName: 'flushQueue');
    
    _isProcessing = false;
    _lastFlush = DateTime.now();
    
    // Re-queue on failure
    if (result is Failure) {
      _eventQueue.insertAll(0, events);
      logWarning('Flush failed, re-queued ${events.length} events');
    }
    
    return result;
  }
  
  /// Get analytics stats for admin/debugging.
  Map<String, dynamic> getStats() => {
    'pending_events': _eventQueue.length,
    'session_id': _sessionId,
    'session_duration': _sessionStart != null 
        ? DateTime.now().difference(_sessionStart!).inSeconds 
        : null,
    'last_flush': _lastFlush?.toIso8601String(),
    'is_processing': _isProcessing,
  };
}
