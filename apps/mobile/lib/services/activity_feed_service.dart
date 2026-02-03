import 'dart:async';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/services/logging_service.dart';

/// Service for managing real-time activity feed
class ActivityFeedService {
  static final ActivityFeedService instance = ActivityFeedService._();
  ActivityFeedService._();

  static final _log = LoggingService.instance;
  static const String _tag = 'ActivityFeedService';

  RealtimeChannel? _channel;
  String? _currentEventId;
  final _activityController = StreamController<ActivityFeedEvent>.broadcast();

  /// Stream of activity events
  Stream<ActivityFeedEvent> get activityStream => _activityController.stream;

  /// Subscribe to activity feed for an event
  void subscribeToEvent(String eventId) {
    if (_currentEventId == eventId) return;
    
    // Unsubscribe from previous
    unsubscribe();
    
    _currentEventId = eventId;
    
    _channel = SupabaseConfig.client
        .channel('activity:$eventId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'activity_feed_events',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'event_id',
            value: eventId,
          ),
          callback: (payload) {
            try {
              final event = ActivityFeedEvent.fromJson(payload.newRecord);
              _activityController.add(event);
            } catch (e) {
              _log.error('Failed to parse activity event: $e', tag: _tag);
            }
          },
        )
        .subscribe();

    _log.info('Subscribed to activity feed for event: $eventId', tag: _tag);
  }

  /// Unsubscribe from activity feed
  void unsubscribe() {
    if (_channel != null) {
      SupabaseConfig.client.removeChannel(_channel!);
      _channel = null;
      _currentEventId = null;
    }
  }

  /// Get recent activity for an event
  Future<List<ActivityFeedEvent>> getRecentActivity(
    String eventId, {
    int limit = 30,
    DateTime? before,
  }) async {
    try {
      // Build filter query first, then apply transforms
      var baseQuery = SupabaseConfig.client
          .from('activity_feed_events')
          .select('''
            *,
            user_profiles:user_id (
              id,
              full_name,
              profile_picture_url
            )
          ''')
          .eq('event_id', eventId);
      
      // Apply cursor filter before transforms
      final filteredQuery = before != null 
          ? baseQuery.lt('created_at', before.toIso8601String())
          : baseQuery;
      
      final response = await filteredQuery
          .order('created_at', ascending: false)
          .limit(limit);

      return (response as List)
          .map((json) => ActivityFeedEvent.fromJson(json))
          .toList();
    } catch (e) {
      _log.error('Failed to get recent activity: $e', tag: _tag);
      return [];
    }
  }

  /// Get highlighted activities (milestones, announcements)
  Future<List<ActivityFeedEvent>> getHighlightedActivity(String eventId) async {
    try {
      final response = await SupabaseConfig.client
          .from('activity_feed_events')
          .select('''
            *,
            user_profiles:user_id (
              id,
              full_name,
              profile_picture_url
            )
          ''')
          .eq('event_id', eventId)
          .eq('is_highlighted', true)
          .order('created_at', ascending: false)
          .limit(10);

      return (response as List)
          .map((json) => ActivityFeedEvent.fromJson(json))
          .toList();
    } catch (e) {
      _log.error('Failed to get highlighted activity: $e', tag: _tag);
      return [];
    }
  }

  /// Create an activity event (for organizers/system)
  Future<bool> createActivity({
    required String eventId,
    required ActivityType type,
    required String title,
    String? description,
    String? targetId,
    Map<String, dynamic>? metadata,
    bool isHighlighted = false,
  }) async {
    try {
      final userId = SupabaseConfig.auth.currentUser?.id;
      
      await SupabaseConfig.client.from('activity_feed_events').insert({
        'event_id': eventId,
        'activity_type': type.value,
        'user_id': userId,
        'target_id': targetId,
        'title': title,
        'description': description,
        'metadata': metadata ?? {},
        'is_highlighted': isHighlighted,
      });

      return true;
    } catch (e) {
      _log.error('Failed to create activity: $e', tag: _tag);
      return false;
    }
  }

  void dispose() {
    unsubscribe();
    _activityController.close();
  }
}

/// Activity type enum
enum ActivityType {
  checkIn('check_in'),
  checkOut('check_out'),
  pollVote('poll_vote'),
  pollResult('poll_result'),
  sessionStart('session_start'),
  sessionEnd('session_end'),
  achievement('achievement'),
  announcement('announcement'),
  icebreakerResponse('icebreaker_response'),
  milestone('milestone'),
  sponsorVisit('sponsor_visit');

  const ActivityType(this.value);
  final String value;

  static ActivityType fromString(String value) {
    return ActivityType.values.firstWhere(
      (t) => t.value == value,
      orElse: () => ActivityType.announcement,
    );
  }
}

/// Activity feed event model
class ActivityFeedEvent {
  final String id;
  final String eventId;
  final ActivityType activityType;
  final String? userId;
  final String? targetId;
  final String title;
  final String? description;
  final Map<String, dynamic> metadata;
  final bool isHighlighted;
  final DateTime createdAt;
  final ActivityUserProfile? userProfile;

  ActivityFeedEvent({
    required this.id,
    required this.eventId,
    required this.activityType,
    this.userId,
    this.targetId,
    required this.title,
    this.description,
    required this.metadata,
    required this.isHighlighted,
    required this.createdAt,
    this.userProfile,
  });

  factory ActivityFeedEvent.fromJson(Map<String, dynamic> json) {
    ActivityUserProfile? profile;
    if (json['user_profiles'] != null) {
      profile = ActivityUserProfile.fromJson(json['user_profiles']);
    }

    return ActivityFeedEvent(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      activityType: ActivityType.fromString(json['activity_type'] as String),
      userId: json['user_id'] as String?,
      targetId: json['target_id'] as String?,
      title: json['title'] as String,
      description: json['description'] as String?,
      metadata: (json['metadata'] as Map<String, dynamic>?) ?? {},
      isHighlighted: json['is_highlighted'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
      userProfile: profile,
    );
  }

  String get displayText {
    if (userProfile?.fullName != null) {
      return '${userProfile!.fullName} $title';
    }
    return title;
  }
}

/// Minimal user profile for activity display
class ActivityUserProfile {
  final String id;
  final String? fullName;
  final String? profilePictureUrl;

  ActivityUserProfile({
    required this.id,
    this.fullName,
    this.profilePictureUrl,
  });

  factory ActivityUserProfile.fromJson(Map<String, dynamic> json) {
    return ActivityUserProfile(
      id: json['id'] as String,
      fullName: json['full_name'] as String?,
      profilePictureUrl: json['profile_picture_url'] as String?,
    );
  }
}
