import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/services/logging_service.dart';
import 'package:thittam1hub/services/ai_matching_service.dart';

/// Analytics events for AI matching system
enum AIMatchingAnalyticsEvent {
  matchesLoaded,
  matchViewed,
  matchExpanded,
  insightsLoaded,
  conversationStarterUsed,
  collaborationIdeaUsed,
  matchSkipped,
  matchSaved,
  matchFollowed,
  filterApplied,
  refreshTriggered,
  errorOccurred,
}

extension AIMatchingAnalyticsEventExtension on AIMatchingAnalyticsEvent {
  String get value {
    switch (this) {
      case AIMatchingAnalyticsEvent.matchesLoaded:
        return 'ai_matches_loaded';
      case AIMatchingAnalyticsEvent.matchViewed:
        return 'ai_match_viewed';
      case AIMatchingAnalyticsEvent.matchExpanded:
        return 'ai_match_expanded';
      case AIMatchingAnalyticsEvent.insightsLoaded:
        return 'ai_insights_loaded';
      case AIMatchingAnalyticsEvent.conversationStarterUsed:
        return 'ai_conversation_starter_used';
      case AIMatchingAnalyticsEvent.collaborationIdeaUsed:
        return 'ai_collaboration_idea_used';
      case AIMatchingAnalyticsEvent.matchSkipped:
        return 'ai_match_skipped';
      case AIMatchingAnalyticsEvent.matchSaved:
        return 'ai_match_saved';
      case AIMatchingAnalyticsEvent.matchFollowed:
        return 'ai_match_followed';
      case AIMatchingAnalyticsEvent.filterApplied:
        return 'ai_filter_applied';
      case AIMatchingAnalyticsEvent.refreshTriggered:
        return 'ai_refresh_triggered';
      case AIMatchingAnalyticsEvent.errorOccurred:
        return 'ai_error_occurred';
    }
  }
}

/// Service for tracking AI matching analytics and A/B testing
class AIMatchingAnalyticsService with LoggingMixin {
  static const String _tag = 'AIMatchingAnalytics';
  
  static AIMatchingAnalyticsService? _instance;
  static AIMatchingAnalyticsService get instance {
    _instance ??= AIMatchingAnalyticsService._();
    return _instance!;
  }

  AIMatchingAnalyticsService._();

  final SupabaseClient _supabase = Supabase.instance.client;
  final List<_PendingAnalyticsEvent> _eventBuffer = [];
  Timer? _flushTimer;
  bool _isInitialized = false;

  // Session-level metrics
  int _sessionMatchesViewed = 0;
  int _sessionMatchesExpanded = 0;
  int _sessionConversationsStarted = 0;
  int _sessionSkips = 0;
  int _sessionSaves = 0;
  DateTime? _sessionStartTime;

  @override
  String get tag => _tag;

  /// Initialize the analytics service
  void initialize() {
    if (_isInitialized) return;
    
    _sessionStartTime = DateTime.now();
    _startFlushTimer();
    _isInitialized = true;
    logInfo('AI Matching Analytics initialized');
  }

  /// Track an analytics event
  void track(
    AIMatchingAnalyticsEvent event, {
    String? matchUserId,
    int? matchScore,
    String? matchCategory,
    String? context,
    Map<String, dynamic>? metadata,
  }) {
    _updateSessionMetrics(event);

    final eventData = _PendingAnalyticsEvent(
      eventType: event.value,
      matchUserId: matchUserId,
      matchScore: matchScore,
      matchCategory: matchCategory,
      context: context ?? 'pulse',
      metadata: {
        'session_matches_viewed': _sessionMatchesViewed,
        'session_matches_expanded': _sessionMatchesExpanded,
        'session_duration_seconds': _sessionStartTime != null
            ? DateTime.now().difference(_sessionStartTime!).inSeconds
            : 0,
        ...?metadata,
      },
      timestamp: DateTime.now(),
    );

    _eventBuffer.add(eventData);

    // Flush immediately for important events
    if (event == AIMatchingAnalyticsEvent.matchFollowed ||
        event == AIMatchingAnalyticsEvent.conversationStarterUsed ||
        event == AIMatchingAnalyticsEvent.errorOccurred) {
      _flushEvents();
    }
  }

  /// Track matches loaded with quality metrics
  void trackMatchesLoaded({
    required int count,
    required String context,
    int? avgMatchScore,
    Duration? loadTime,
    bool fromCache = false,
  }) {
    track(
      AIMatchingAnalyticsEvent.matchesLoaded,
      context: context,
      metadata: {
        'count': count,
        'avg_match_score': avgMatchScore,
        'load_time_ms': loadTime?.inMilliseconds,
        'from_cache': fromCache,
      },
    );
  }

  /// Track match view with dwell time
  void trackMatchViewed({
    required String matchUserId,
    required int matchScore,
    String? matchCategory,
    String context = 'pulse',
    Duration? dwellTime,
    double? scrollDepth,
  }) {
    track(
      AIMatchingAnalyticsEvent.matchViewed,
      matchUserId: matchUserId,
      matchScore: matchScore,
      matchCategory: matchCategory,
      context: context,
      metadata: {
        'dwell_time_ms': dwellTime?.inMilliseconds,
        'scroll_depth': scrollDepth,
      },
    );
  }

  /// Track conversation starter usage
  void trackConversationStarterUsed({
    required String matchUserId,
    required String starterText,
    required int starterIndex,
    int? matchScore,
  }) {
    track(
      AIMatchingAnalyticsEvent.conversationStarterUsed,
      matchUserId: matchUserId,
      matchScore: matchScore,
      metadata: {
        'starter_preview': starterText.length > 50 
            ? starterText.substring(0, 50) 
            : starterText,
        'starter_index': starterIndex,
      },
    );
  }

  /// Track error for monitoring
  void trackError({
    required String errorType,
    required String errorMessage,
    String? context,
    StackTrace? stackTrace,
  }) {
    track(
      AIMatchingAnalyticsEvent.errorOccurred,
      context: context,
      metadata: {
        'error_type': errorType,
        'error_message': errorMessage,
        'stack_trace': stackTrace?.toString().substring(0, 500),
      },
    );
  }

  /// Get current session summary
  Map<String, dynamic> getSessionSummary() {
    return {
      'matches_viewed': _sessionMatchesViewed,
      'matches_expanded': _sessionMatchesExpanded,
      'conversations_started': _sessionConversationsStarted,
      'skips': _sessionSkips,
      'saves': _sessionSaves,
      'session_duration_seconds': _sessionStartTime != null
          ? DateTime.now().difference(_sessionStartTime!).inSeconds
          : 0,
      'engagement_rate': _sessionMatchesViewed > 0
          ? (_sessionMatchesExpanded / _sessionMatchesViewed * 100).toStringAsFixed(1)
          : '0.0',
      'conversion_rate': _sessionMatchesViewed > 0
          ? (_sessionConversationsStarted / _sessionMatchesViewed * 100).toStringAsFixed(1)
          : '0.0',
    };
  }

  /// Force flush all pending events
  Future<void> flush() async {
    await _flushEvents();
  }

  /// Reset session metrics
  void resetSession() {
    _sessionMatchesViewed = 0;
    _sessionMatchesExpanded = 0;
    _sessionConversationsStarted = 0;
    _sessionSkips = 0;
    _sessionSaves = 0;
    _sessionStartTime = DateTime.now();
  }

  void _updateSessionMetrics(AIMatchingAnalyticsEvent event) {
    switch (event) {
      case AIMatchingAnalyticsEvent.matchViewed:
        _sessionMatchesViewed++;
        break;
      case AIMatchingAnalyticsEvent.matchExpanded:
        _sessionMatchesExpanded++;
        break;
      case AIMatchingAnalyticsEvent.conversationStarterUsed:
        _sessionConversationsStarted++;
        break;
      case AIMatchingAnalyticsEvent.matchSkipped:
        _sessionSkips++;
        break;
      case AIMatchingAnalyticsEvent.matchSaved:
        _sessionSaves++;
        break;
      default:
        break;
    }
  }

  void _startFlushTimer() {
    _flushTimer?.cancel();
    _flushTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      _flushEvents();
    });
  }

  Future<void> _flushEvents() async {
    if (_eventBuffer.isEmpty) return;

    final events = List<_PendingAnalyticsEvent>.from(_eventBuffer);
    _eventBuffer.clear();

    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) {
        logWarning('No user ID, skipping analytics flush');
        return;
      }

      final rows = events.map((e) => <String, dynamic>{
        'user_id': userId,
        'event_type': e.eventType,
        'match_user_id': e.matchUserId,
        'match_score': e.matchScore,
        'match_category': e.matchCategory,
        'context': e.context,
        'metadata': e.metadata,
        'created_at': e.timestamp.toIso8601String(),
      }).toList();

      await _supabase.from('ai_matching_analytics').insert(rows);
      logDebug('Flushed ${events.length} analytics events');
    } catch (e) {
      logError('Failed to flush analytics: $e');
      // Re-add failed events for retry
      _eventBuffer.insertAll(0, events);
    }
  }

  void dispose() {
    _flushTimer?.cancel();
    _flushEvents(); // Final flush
  }
}

class _PendingAnalyticsEvent {
  final String eventType;
  final String? matchUserId;
  final int? matchScore;
  final String? matchCategory;
  final String context;
  final Map<String, dynamic> metadata;
  final DateTime timestamp;

  _PendingAnalyticsEvent({
    required this.eventType,
    this.matchUserId,
    this.matchScore,
    this.matchCategory,
    required this.context,
    required this.metadata,
    required this.timestamp,
  });
}
