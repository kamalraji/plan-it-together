import 'package:flutter/foundation.dart';

/// Zone notification types
enum ZoneNotificationType {
  announcement,
  sessionStart,
  sessionReminder,
  pollLive,
  badgeEarned,
  leaderboardRankUp,
  streakMilestone,
  icebreakerNew;

  String get dbValue {
    switch (this) {
      case announcement:
        return 'announcement';
      case sessionStart:
        return 'session_start';
      case sessionReminder:
        return 'session_reminder';
      case pollLive:
        return 'poll_live';
      case badgeEarned:
        return 'badge_earned';
      case leaderboardRankUp:
        return 'leaderboard_rank_up';
      case streakMilestone:
        return 'streak_milestone';
      case icebreakerNew:
        return 'icebreaker_new';
    }
  }

  static ZoneNotificationType fromDbValue(String value) {
    return ZoneNotificationType.values.firstWhere(
      (e) => e.dbValue == value,
      orElse: () => ZoneNotificationType.announcement,
    );
  }

  String get displayName {
    switch (this) {
      case announcement:
        return 'Announcement';
      case sessionStart:
        return 'Session Starting';
      case sessionReminder:
        return 'Session Reminder';
      case pollLive:
        return 'New Poll';
      case badgeEarned:
        return 'Badge Earned';
      case leaderboardRankUp:
        return 'Rank Up!';
      case streakMilestone:
        return 'Streak Milestone';
      case icebreakerNew:
        return 'New Icebreaker';
    }
  }

  String get icon {
    switch (this) {
      case announcement:
        return 'megaphone';
      case sessionStart:
        return 'play-circle';
      case sessionReminder:
        return 'clock';
      case pollLive:
        return 'bar-chart';
      case badgeEarned:
        return 'award';
      case leaderboardRankUp:
        return 'trending-up';
      case streakMilestone:
        return 'flame';
      case icebreakerNew:
        return 'message-circle';
    }
  }
}

/// Zone notification item
@immutable
class ZoneNotification {
  final String id;
  final String userId;
  final String eventId;
  final ZoneNotificationType type;
  final String title;
  final String body;
  final Map<String, dynamic> data;
  final bool read;
  final bool pushSent;
  final DateTime createdAt;

  const ZoneNotification({
    required this.id,
    required this.userId,
    required this.eventId,
    required this.type,
    required this.title,
    required this.body,
    this.data = const {},
    this.read = false,
    this.pushSent = false,
    required this.createdAt,
  });

  factory ZoneNotification.fromJson(Map<String, dynamic> json) {
    return ZoneNotification(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      eventId: json['event_id'] as String,
      type: ZoneNotificationType.fromDbValue(json['type'] as String),
      title: json['title'] as String,
      body: json['body'] as String,
      data: (json['data'] as Map<String, dynamic>?) ?? {},
      read: json['read'] as bool? ?? false,
      pushSent: json['push_sent'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  ZoneNotification copyWith({
    bool? read,
  }) {
    return ZoneNotification(
      id: id,
      userId: userId,
      eventId: eventId,
      type: type,
      title: title,
      body: body,
      data: data,
      read: read ?? this.read,
      pushSent: pushSent,
      createdAt: createdAt,
    );
  }
}

/// Zone notification preferences (event-specific)
@immutable
class ZoneNotificationPreferences {
  final String id;
  final String userId;
  final String eventId;
  final bool announcementsEnabled;
  final bool sessionRemindersEnabled;
  final bool pollNotificationsEnabled;
  final bool badgeNotificationsEnabled;
  final bool leaderboardUpdatesEnabled;
  final String? quietHoursStart;
  final String? quietHoursEnd;
  final DateTime createdAt;
  final DateTime updatedAt;

  const ZoneNotificationPreferences({
    required this.id,
    required this.userId,
    required this.eventId,
    this.announcementsEnabled = true,
    this.sessionRemindersEnabled = true,
    this.pollNotificationsEnabled = true,
    this.badgeNotificationsEnabled = true,
    this.leaderboardUpdatesEnabled = false,
    this.quietHoursStart,
    this.quietHoursEnd,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ZoneNotificationPreferences.fromJson(Map<String, dynamic> json) {
    return ZoneNotificationPreferences(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      eventId: json['event_id'] as String,
      announcementsEnabled: json['announcements_enabled'] as bool? ?? true,
      sessionRemindersEnabled: json['session_reminders_enabled'] as bool? ?? true,
      pollNotificationsEnabled: json['poll_notifications_enabled'] as bool? ?? true,
      badgeNotificationsEnabled: json['badge_notifications_enabled'] as bool? ?? true,
      leaderboardUpdatesEnabled: json['leaderboard_updates_enabled'] as bool? ?? false,
      quietHoursStart: json['quiet_hours_start'] as String?,
      quietHoursEnd: json['quiet_hours_end'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'user_id': userId,
        'event_id': eventId,
        'announcements_enabled': announcementsEnabled,
        'session_reminders_enabled': sessionRemindersEnabled,
        'poll_notifications_enabled': pollNotificationsEnabled,
        'badge_notifications_enabled': badgeNotificationsEnabled,
        'leaderboard_updates_enabled': leaderboardUpdatesEnabled,
        'quiet_hours_start': quietHoursStart,
        'quiet_hours_end': quietHoursEnd,
      };

  ZoneNotificationPreferences copyWith({
    bool? announcementsEnabled,
    bool? sessionRemindersEnabled,
    bool? pollNotificationsEnabled,
    bool? badgeNotificationsEnabled,
    bool? leaderboardUpdatesEnabled,
    String? quietHoursStart,
    String? quietHoursEnd,
  }) {
    return ZoneNotificationPreferences(
      id: id,
      userId: userId,
      eventId: eventId,
      announcementsEnabled: announcementsEnabled ?? this.announcementsEnabled,
      sessionRemindersEnabled: sessionRemindersEnabled ?? this.sessionRemindersEnabled,
      pollNotificationsEnabled: pollNotificationsEnabled ?? this.pollNotificationsEnabled,
      badgeNotificationsEnabled: badgeNotificationsEnabled ?? this.badgeNotificationsEnabled,
      leaderboardUpdatesEnabled: leaderboardUpdatesEnabled ?? this.leaderboardUpdatesEnabled,
      quietHoursStart: quietHoursStart ?? this.quietHoursStart,
      quietHoursEnd: quietHoursEnd ?? this.quietHoursEnd,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
    );
  }

  /// Create default preferences for a user/event
  factory ZoneNotificationPreferences.defaults({
    required String userId,
    required String eventId,
  }) {
    final now = DateTime.now();
    return ZoneNotificationPreferences(
      id: '',
      userId: userId,
      eventId: eventId,
      createdAt: now,
      updatedAt: now,
    );
  }
}
