import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:thittam1hub/services/logging_service.dart';

final _log = LoggingService.instance;

void logInfo(String message, {String? tag}) => _log.info(message, tag: tag);
void logDebug(String message, {String? tag}) => _log.debug(message, tag: tag);
void logWarning(String message, {String? tag, Object? error}) => _log.warning(message, tag: tag, error: error);
void logError(String message, {String? tag, Object? error}) => _log.error(message, tag: tag, error: error);

/// Interaction event types matching database constraint
enum InteractionEventType {
  profileView,
  profileExpand,
  dwellTime,
  scrollPast,
  skip,
  save,
  follow,
  unfollow,
  messageSent,
  messageReplied,
  messageRead,
  meetingRequested,
  meetingAccepted,
  meetingDeclined,
  contactExchanged,
  profileShared,
  sessionBookmark,
  sessionAttended,
  qaAsked,
  // AI matching specific events
  aiMatchDetailOpen,
  aiConversationStarterTap,
  aiCollaborationIdeaTap,
  cardTap,
}

extension InteractionEventTypeExtension on InteractionEventType {
  String get value {
    switch (this) {
      case InteractionEventType.profileView:
        return 'profile_view';
      case InteractionEventType.profileExpand:
        return 'profile_expand';
      case InteractionEventType.dwellTime:
        return 'dwell_time';
      case InteractionEventType.scrollPast:
        return 'scroll_past';
      case InteractionEventType.skip:
        return 'skip';
      case InteractionEventType.save:
        return 'save';
      case InteractionEventType.follow:
        return 'follow';
      case InteractionEventType.unfollow:
        return 'unfollow';
      case InteractionEventType.messageSent:
        return 'message_sent';
      case InteractionEventType.messageReplied:
        return 'message_replied';
      case InteractionEventType.messageRead:
        return 'message_read';
      case InteractionEventType.meetingRequested:
        return 'meeting_requested';
      case InteractionEventType.meetingAccepted:
        return 'meeting_accepted';
      case InteractionEventType.meetingDeclined:
        return 'meeting_declined';
      case InteractionEventType.contactExchanged:
        return 'contact_exchanged';
      case InteractionEventType.profileShared:
        return 'profile_shared';
      case InteractionEventType.sessionBookmark:
        return 'session_bookmark';
      case InteractionEventType.sessionAttended:
        return 'session_attended';
      case InteractionEventType.qaAsked:
        return 'qa_asked';
      case InteractionEventType.aiMatchDetailOpen:
        return 'ai_match_detail_open';
      case InteractionEventType.aiConversationStarterTap:
        return 'ai_conversation_starter_tap';
      case InteractionEventType.aiCollaborationIdeaTap:
        return 'ai_collaboration_idea_tap';
      case InteractionEventType.cardTap:
        return 'card_tap';
    }
  }

  /// Base weight for AI matching signal fusion
  int get weight {
    switch (this) {
      case InteractionEventType.meetingAccepted:
        return 80;
      case InteractionEventType.meetingRequested:
        return 70;
      case InteractionEventType.contactExchanged:
        return 65;
      case InteractionEventType.follow:
        return 50;
      case InteractionEventType.messageSent:
      case InteractionEventType.messageReplied:
        return 40;
      case InteractionEventType.save:
        return 30;
      case InteractionEventType.profileShared:
        return 25;
      case InteractionEventType.aiConversationStarterTap:
      case InteractionEventType.aiCollaborationIdeaTap:
        return 20;
      case InteractionEventType.aiMatchDetailOpen:
        return 15;
      case InteractionEventType.profileExpand:
        return 10;
      case InteractionEventType.cardTap:
        return 8;
      case InteractionEventType.profileView:
      case InteractionEventType.dwellTime:
        return 5;
      case InteractionEventType.scrollPast:
        return 2;
      case InteractionEventType.skip:
        return -15;
      case InteractionEventType.unfollow:
        return -30;
      case InteractionEventType.meetingDeclined:
        return -20;
      default:
        return 5;
    }
  }
}

/// Pending interaction event for offline queuing
class PendingInteractionEvent {
  final String? targetUserId;
  final String? eventId;
  final String eventType;
  final Map<String, dynamic> metadata;
  final DateTime createdAt;

  PendingInteractionEvent({
    this.targetUserId,
    this.eventId,
    required this.eventType,
    this.metadata = const {},
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toJson() => {
    'target_user_id': targetUserId,
    'event_id': eventId,
    'event_type': eventType,
    'metadata': metadata,
    'created_at': createdAt.toIso8601String(),
  };

  factory PendingInteractionEvent.fromJson(Map<String, dynamic> json) {
    return PendingInteractionEvent(
      targetUserId: json['target_user_id'] as String?,
      eventId: json['event_id'] as String?,
      eventType: json['event_type'] as String,
      metadata: Map<String, dynamic>.from(json['metadata'] ?? {}),
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}

/// Service for tracking user interactions for AI/ML matching
/// 
/// Features:
/// - Offline-first with local queuing
/// - Batched uploads for efficiency
/// - Dwell time tracking
/// - Automatic retry on failure
class InteractionTrackingService {
  static const String _tag = 'InteractionTracking';
  static const String _hiveBoxName = 'pending_interactions';
  static const int _batchSize = 25;
  static const Duration _flushInterval = Duration(seconds: 30);
  
  static InteractionTrackingService? _instance;
  static InteractionTrackingService get instance {
    _instance ??= InteractionTrackingService._();
    return _instance!;
  }
  
  InteractionTrackingService._();
  
  final SupabaseClient _supabase = Supabase.instance.client;
  Box<String>? _pendingBox;
  Timer? _flushTimer;
  bool _isInitialized = false;
  bool _isFlushing = false;
  
  // Dwell time tracking
  final Map<String, DateTime> _dwellStartTimes = {};
  
  /// Initialize the service
  Future<void> initialize() async {
    if (_isInitialized) return;
    
    try {
      _pendingBox = await Hive.openBox<String>(_hiveBoxName);
      _startFlushTimer();
      _isInitialized = true;
      logInfo('Initialized', tag: _tag);
      
      // Flush any pending events from previous session
      await flushPendingEvents();
    } catch (e) {
      logError('Failed to initialize: $e', tag: _tag);
    }
  }
  
  void _startFlushTimer() {
    _flushTimer?.cancel();
    _flushTimer = Timer.periodic(_flushInterval, (_) {
      flushPendingEvents();
    });
  }
  
  /// Track a profile view
  Future<void> trackProfileView({
    required String targetUserId,
    String? eventId,
    String source = 'pulse',
  }) async {
    await _track(
      eventType: InteractionEventType.profileView,
      targetUserId: targetUserId,
      eventId: eventId,
      metadata: {'source': source},
    );
  }
  
  /// Start tracking dwell time on a profile
  void startDwellTracking(String targetUserId) {
    _dwellStartTimes[targetUserId] = DateTime.now();
  }
  
  /// Stop tracking dwell time and log the event
  Future<void> stopDwellTracking({
    required String targetUserId,
    String? eventId,
    double? scrollPosition,
  }) async {
    final startTime = _dwellStartTimes.remove(targetUserId);
    if (startTime == null) return;
    
    final dwellMs = DateTime.now().difference(startTime).inMilliseconds;
    
    // Only track if dwelled for more than 1 second
    if (dwellMs < 1000) return;
    
    await _track(
      eventType: InteractionEventType.dwellTime,
      targetUserId: targetUserId,
      eventId: eventId,
      metadata: {
        'dwell_time_ms': dwellMs,
        'scroll_position': scrollPosition,
      },
    );
  }
  
  /// Track profile expansion (viewed full details)
  Future<void> trackProfileExpand({
    required String targetUserId,
    String? eventId,
  }) async {
    await _track(
      eventType: InteractionEventType.profileExpand,
      targetUserId: targetUserId,
      eventId: eventId,
    );
  }
  
  /// Track scroll past without action
  Future<void> trackScrollPast({
    required String targetUserId,
    String? eventId,
  }) async {
    await _track(
      eventType: InteractionEventType.scrollPast,
      targetUserId: targetUserId,
      eventId: eventId,
    );
  }
  
  /// Track explicit skip action
  Future<void> trackSkip({
    required String targetUserId,
    String? eventId,
  }) async {
    await _track(
      eventType: InteractionEventType.skip,
      targetUserId: targetUserId,
      eventId: eventId,
    );
  }
  
  /// Track save action
  Future<void> trackSave({
    required String targetUserId,
    String? eventId,
  }) async {
    await _track(
      eventType: InteractionEventType.save,
      targetUserId: targetUserId,
      eventId: eventId,
    );
  }
  
  /// Track message sent
  Future<void> trackMessageSent({
    required String targetUserId,
    bool isFirstMessage = false,
  }) async {
    await _track(
      eventType: InteractionEventType.messageSent,
      targetUserId: targetUserId,
      metadata: {'is_first_message': isFirstMessage},
    );
  }
  
  /// Track message reply
  Future<void> trackMessageReplied({
    required String targetUserId,
    int? responseTimeMs,
  }) async {
    await _track(
      eventType: InteractionEventType.messageReplied,
      targetUserId: targetUserId,
      metadata: {'response_time_ms': responseTimeMs},
    );
  }
  
  /// Track meeting request
  Future<void> trackMeetingRequested({
    required String targetUserId,
    String? eventId,
  }) async {
    await _track(
      eventType: InteractionEventType.meetingRequested,
      targetUserId: targetUserId,
      eventId: eventId,
    );
  }
  
  /// Track meeting accepted
  Future<void> trackMeetingAccepted({
    required String targetUserId,
    String? eventId,
  }) async {
    await _track(
      eventType: InteractionEventType.meetingAccepted,
      targetUserId: targetUserId,
      eventId: eventId,
    );
  }
  
  /// Track contact exchange
  Future<void> trackContactExchanged({
    required String targetUserId,
    String? eventId,
  }) async {
    await _track(
      eventType: InteractionEventType.contactExchanged,
      targetUserId: targetUserId,
      eventId: eventId,
    );
  }
  
  /// Track session bookmark
  Future<void> trackSessionBookmark({
    required String sessionId,
    required String eventId,
  }) async {
    await _track(
      eventType: InteractionEventType.sessionBookmark,
      eventId: eventId,
      metadata: {'session_id': sessionId},
    );
  }
  
  /// Track session attendance
  Future<void> trackSessionAttended({
    required String sessionId,
    required String eventId,
  }) async {
    await _track(
      eventType: InteractionEventType.sessionAttended,
      eventId: eventId,
      metadata: {'session_id': sessionId},
    );
  }

  // ============================================================
  // AI MATCHING SPECIFIC TRACKING
  // ============================================================

  /// Track AI match detail sheet opened
  Future<void> trackAIMatchDetailOpen({
    required String targetUserId,
    int? matchScore,
    String? matchCategory,
    String? eventId,
    String context = 'pulse',
  }) async {
    await _track(
      eventType: InteractionEventType.aiMatchDetailOpen,
      targetUserId: targetUserId,
      eventId: eventId,
      metadata: {
        'match_score': matchScore,
        'match_category': matchCategory,
        'context': context,
      },
    );
  }

  /// Track conversation starter tapped (AI-generated)
  Future<void> trackConversationStarterTap({
    required String targetUserId,
    required String starterPreview,
    int starterIndex = 0,
    String? eventId,
  }) async {
    await _track(
      eventType: InteractionEventType.aiConversationStarterTap,
      targetUserId: targetUserId,
      eventId: eventId,
      metadata: {
        'starter_preview': starterPreview.length > 50 
            ? starterPreview.substring(0, 50) 
            : starterPreview,
        'starter_index': starterIndex,
      },
    );
  }

  /// Track collaboration idea tapped (AI-generated)
  Future<void> trackCollaborationIdeaTap({
    required String targetUserId,
    required String ideaPreview,
    int ideaIndex = 0,
    String? eventId,
  }) async {
    await _track(
      eventType: InteractionEventType.aiCollaborationIdeaTap,
      targetUserId: targetUserId,
      eventId: eventId,
      metadata: {
        'idea_preview': ideaPreview.length > 50 
            ? ideaPreview.substring(0, 50) 
            : ideaPreview,
        'idea_index': ideaIndex,
      },
    );
  }

  /// Track card tap (quick tap on match card)
  Future<void> trackCardTap({
    required String targetUserId,
    int? matchScore,
    String? eventId,
    String context = 'pulse',
  }) async {
    await _track(
      eventType: InteractionEventType.cardTap,
      targetUserId: targetUserId,
      eventId: eventId,
      metadata: {
        'match_score': matchScore,
        'context': context,
      },
    );
  }

  /// Track follow action (for AI signal)
  Future<void> trackFollow({
    required String targetUserId,
    String? eventId,
    String context = 'pulse',
  }) async {
    await _track(
      eventType: InteractionEventType.follow,
      targetUserId: targetUserId,
      eventId: eventId,
      metadata: {'context': context},
    );
  }

  /// Track unfollow action (negative signal)
  Future<void> trackUnfollow({
    required String targetUserId,
    String? eventId,
  }) async {
    await _track(
      eventType: InteractionEventType.unfollow,
      targetUserId: targetUserId,
      eventId: eventId,
    );
  }
  
  /// Core tracking method
  Future<void> _track({
    required InteractionEventType eventType,
    String? targetUserId,
    String? eventId,
    Map<String, dynamic> metadata = const {},
  }) async {
    if (!_isInitialized) {
      await initialize();
    }
    
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return;
    
    // Don't track self-interactions
    if (targetUserId == userId) return;
    
    final event = PendingInteractionEvent(
      targetUserId: targetUserId,
      eventId: eventId,
      eventType: eventType.value,
      metadata: {
        ...metadata,
        'device_type': 'mobile',
        'timestamp': DateTime.now().toIso8601String(),
      },
    );
    
    // Queue locally
    await _queueEvent(event);
    
    // Flush if we have enough events
    if ((_pendingBox?.length ?? 0) >= _batchSize) {
      await flushPendingEvents();
    }
  }
  
  Future<void> _queueEvent(PendingInteractionEvent event) async {
    try {
      final key = DateTime.now().microsecondsSinceEpoch.toString();
      await _pendingBox?.put(key, jsonEncode(event.toJson()));
      logDebug('Queued event: ${event.eventType}', tag: _tag);
    } catch (e) {
      logError('Failed to queue event: $e', tag: _tag);
    }
  }
  
  /// Flush pending events to server
  Future<void> flushPendingEvents() async {
    if (_isFlushing || _pendingBox == null || _pendingBox!.isEmpty) return;
    
    // Check connectivity
    final connectivity = await Connectivity().checkConnectivity();
    if (connectivity.contains(ConnectivityResult.none)) return;
    
    _isFlushing = true;
    
    try {
      final keys = _pendingBox!.keys.toList();
      final events = <PendingInteractionEvent>[];
      
      for (final key in keys.take(_batchSize)) {
        final json = _pendingBox!.get(key);
        if (json != null) {
          try {
            events.add(PendingInteractionEvent.fromJson(jsonDecode(json)));
          } catch (e) {
            // Remove corrupted events
            await _pendingBox!.delete(key);
          }
        }
      }
      
      if (events.isEmpty) {
        _isFlushing = false;
        return;
      }
      
      // Send to edge function
      final response = await _supabase.functions.invoke(
        'track-interaction',
        body: {
          'events': events.map((e) => e.toJson()).toList(),
        },
      );
      
      if (response.status == 200) {
        // Remove successfully uploaded events
        for (final key in keys.take(events.length)) {
          await _pendingBox!.delete(key);
        }
        logDebug('Flushed ${events.length} interaction events', tag: _tag);
      } else {
        logWarning('Failed to flush events: ${response.status}', tag: _tag);
      }
    } catch (e) {
      logError('Error flushing events: $e', tag: _tag);
    } finally {
      _isFlushing = false;
    }
  }
  
  /// Get pending event count
  int get pendingCount => _pendingBox?.length ?? 0;
  
  /// Dispose resources
  void dispose() {
    _flushTimer?.cancel();
    _dwellStartTimes.clear();
  }
}
