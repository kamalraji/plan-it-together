import 'dart:async';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/services/logging_mixin.dart';
import 'package:thittam1hub/config/supabase_config.dart';

/// Callback types for real-time updates
typedef RealtimeCallback = void Function(Map<String, dynamic> payload, PostgresChangeEvent eventType);

/// Optimized real-time subscription service for Zone features.
/// Uses a single multiplexed channel per event to reduce connection overhead.
class ZoneRealtimeService with LoggingMixin {
  @override
  String get logTag => 'ZoneRealtimeService';

  static ZoneRealtimeService? _instance;
  static ZoneRealtimeService get instance => _instance ??= ZoneRealtimeService._();
  ZoneRealtimeService._();

  RealtimeChannel? _zoneChannel;
  String? _currentEventId;
  
  // Registered callbacks for different table updates
  final Map<String, List<RealtimeCallback>> _callbacks = {};

  // Supported tables for real-time updates
  static const _zoneTables = [
    'event_sessions',
    'event_polls',
    'event_poll_votes',
    'event_announcements',
    'event_checkins',
    'event_live_streams',
    'session_questions',
    'session_question_upvotes',
    'zone_leaderboard',
    'zone_activity_feed',
  ];

  /// Subscribe to all Zone-related updates for an event.
  /// Uses a single multiplexed channel for efficiency.
  void subscribeToEvent(String eventId) {
    if (_currentEventId == eventId && _zoneChannel != null) {
      logDebug('Already subscribed to event: $eventId');
      return;
    }

    // Unsubscribe from previous event
    unsubscribe();

    logInfo('Subscribing to Zone real-time updates for event: $eventId');
    _currentEventId = eventId;

    final client = SupabaseConfig.client;
    var channel = client.channel('zone:$eventId');

    // Add listeners for each table
    for (final table in _zoneTables) {
      channel = channel.onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: table,
        filter: PostgresChangeFilter(
          type: PostgresChangeFilterType.eq,
          column: 'event_id',
          value: eventId,
        ),
        callback: (payload) => _handleChange(table, payload),
      );
    }

    // Subscribe to the multiplexed channel
    _zoneChannel = channel.subscribe((status, error) {
      if (error != null) {
        logError('Subscription error', error: error);
      } else {
        logDebug('Subscription status: $status');
      }
    });
  }

  void _handleChange(String table, PostgresChangePayload payload) {
    logDebug('Real-time update: $table (${payload.eventType})');
    
    final callbacks = _callbacks[table] ?? [];
    final data = payload.eventType == PostgresChangeEvent.delete 
        ? payload.oldRecord 
        : payload.newRecord;
    
    for (final callback in callbacks) {
      try {
        callback(data, payload.eventType);
      } catch (e) {
        logWarning('Callback error for $table', error: e);
      }
    }
  }

  /// Register a callback for a specific table.
  void registerCallback(String table, RealtimeCallback callback) {
    _callbacks.putIfAbsent(table, () => []).add(callback);
  }

  /// Unregister a callback for a specific table.
  void unregisterCallback(String table, RealtimeCallback callback) {
    _callbacks[table]?.remove(callback);
  }

  /// Clear all callbacks for a table.
  void clearCallbacks(String table) {
    _callbacks.remove(table);
  }

  /// Clear all callbacks.
  void clearAllCallbacks() {
    _callbacks.clear();
  }

  /// Unsubscribe from all real-time updates.
  void unsubscribe() {
    if (_zoneChannel != null) {
      logInfo('Unsubscribing from Zone real-time updates');
      _zoneChannel!.unsubscribe();
      _zoneChannel = null;
      _currentEventId = null;
    }
  }

  /// Check if currently subscribed to an event.
  bool get isSubscribed => _zoneChannel != null;

  /// Get current subscribed event ID.
  String? get currentEventId => _currentEventId;

  /// Dispose and cleanup.
  void dispose() {
    unsubscribe();
    clearAllCallbacks();
  }
}

/// Extension for easy callback registration from widgets.
extension ZoneRealtimeExtensions on ZoneRealtimeService {
  /// Register session updates callback.
  void onSessionUpdates(RealtimeCallback callback) {
    registerCallback('event_sessions', callback);
  }

  /// Register poll updates callback.
  void onPollUpdates(RealtimeCallback callback) {
    registerCallback('event_polls', callback);
  }

  /// Register announcement updates callback.
  void onAnnouncementUpdates(RealtimeCallback callback) {
    registerCallback('event_announcements', callback);
  }

  /// Register Q&A question updates callback.
  void onQuestionUpdates(RealtimeCallback callback) {
    registerCallback('session_questions', callback);
  }

  /// Register leaderboard updates callback.
  void onLeaderboardUpdates(RealtimeCallback callback) {
    registerCallback('zone_leaderboard', callback);
  }

  /// Register activity feed updates callback.
  void onActivityUpdates(RealtimeCallback callback) {
    registerCallback('zone_activity_feed', callback);
  }

  /// Register checkin updates callback.
  void onCheckinUpdates(RealtimeCallback callback) {
    registerCallback('event_checkins', callback);
  }

  /// Register stream updates callback.
  void onStreamUpdates(RealtimeCallback callback) {
    registerCallback('event_live_streams', callback);
  }
}
