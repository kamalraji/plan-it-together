import 'package:flutter/foundation.dart';

/// Activity type for zone points
enum ZoneActivityType {
  checkin,
  pollVote,
  icebreakerAnswer,
  sessionRating,
  sessionAttendance,
  materialDownload,
  badgeEarned,
  streakBonus,
  boothVisit,
  challengeComplete;

  String get dbValue {
    switch (this) {
      case checkin:
        return 'checkin';
      case pollVote:
        return 'poll_vote';
      case icebreakerAnswer:
        return 'icebreaker_answer';
      case sessionRating:
        return 'session_rating';
      case sessionAttendance:
        return 'session_attendance';
      case materialDownload:
        return 'material_download';
      case badgeEarned:
        return 'badge_earned';
      case streakBonus:
        return 'streak_bonus';
      case boothVisit:
        return 'booth_visit';
      case challengeComplete:
        return 'challenge_complete';
    }
  }

  static ZoneActivityType fromDbValue(String value) {
    return ZoneActivityType.values.firstWhere(
      (e) => e.dbValue == value,
      orElse: () => ZoneActivityType.checkin,
    );
  }

  int get defaultPoints {
    switch (this) {
      case checkin:
        return 10;
      case pollVote:
        return 5;
      case icebreakerAnswer:
        return 15;
      case sessionRating:
        return 10;
      case sessionAttendance:
        return 20;
      case materialDownload:
        return 5;
      case badgeEarned:
        return 25;
      case streakBonus:
        return 50;
      case boothVisit:
        return 15;
      case challengeComplete:
        return 30;
    }
  }
}

/// Badge category for zone badges
enum ZoneBadgeCategory {
  engagement,
  learning,
  networking,
  contribution,
  achievement;

  String get displayName {
    switch (this) {
      case engagement:
        return 'Engagement';
      case learning:
        return 'Learning';
      case networking:
        return 'Networking';
      case contribution:
        return 'Contribution';
      case achievement:
        return 'Achievement';
    }
  }
}

/// Point activity record
@immutable
class ZonePointActivity {
  final String id;
  final String userId;
  final String eventId;
  final ZoneActivityType activityType;
  final int points;
  final Map<String, dynamic> metadata;
  final DateTime createdAt;

  const ZonePointActivity({
    required this.id,
    required this.userId,
    required this.eventId,
    required this.activityType,
    required this.points,
    this.metadata = const {},
    required this.createdAt,
  });

  factory ZonePointActivity.fromJson(Map<String, dynamic> json) {
    return ZonePointActivity(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      eventId: json['event_id'] as String,
      activityType: ZoneActivityType.fromDbValue(json['activity_type'] as String),
      points: json['points'] as int? ?? 0,
      metadata: (json['metadata'] as Map<String, dynamic>?) ?? {},
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}

/// Leaderboard entry for a user
@immutable
class ZoneLeaderboardEntry {
  final String id;
  final String oderId;
  final String eventId;
  final int totalPoints;
  final int rank;
  final int badgesEarned;
  final int activityCount;
  final DateTime? lastActivityAt;
  final DateTime updatedAt;
  // Profile info (from join)
  final String? userName;
  final String? userAvatar;

  const ZoneLeaderboardEntry({
    required this.id,
    required this.oderId,
    required this.eventId,
    required this.totalPoints,
    this.rank = 0,
    this.badgesEarned = 0,
    this.activityCount = 0,
    this.lastActivityAt,
    required this.updatedAt,
    this.userName,
    this.userAvatar,
  });

  factory ZoneLeaderboardEntry.fromJson(Map<String, dynamic> json) {
    final profile = json['impact_profiles'] as Map<String, dynamic>?;
    return ZoneLeaderboardEntry(
      id: json['id'] as String,
      oderId: json['user_id'] as String,
      eventId: json['event_id'] as String,
      totalPoints: json['total_points'] as int? ?? 0,
      rank: json['rank'] as int? ?? 0,
      badgesEarned: json['badges_earned'] as int? ?? 0,
      activityCount: json['activity_count'] as int? ?? 0,
      lastActivityAt: json['last_activity_at'] != null
          ? DateTime.parse(json['last_activity_at'] as String)
          : null,
      updatedAt: DateTime.parse(json['updated_at'] as String),
      userName: profile?['full_name'] as String?,
      userAvatar: profile?['avatar_url'] as String?,
    );
  }

  String get userId => oderId;
}

/// Zone badge definition
@immutable
class ZoneBadge {
  final String id;
  final String name;
  final String? description;
  final String icon;
  final ZoneBadgeCategory category;
  final int? pointsThreshold;
  final int? activityThreshold;
  final String? activityType;
  final DateTime createdAt;

  const ZoneBadge({
    required this.id,
    required this.name,
    this.description,
    required this.icon,
    required this.category,
    this.pointsThreshold,
    this.activityThreshold,
    this.activityType,
    required this.createdAt,
  });

  factory ZoneBadge.fromJson(Map<String, dynamic> json) {
    return ZoneBadge(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      icon: json['icon'] as String? ?? 'award',
      category: ZoneBadgeCategory.values.firstWhere(
        (e) => e.name == json['category'],
        orElse: () => ZoneBadgeCategory.engagement,
      ),
      pointsThreshold: json['points_threshold'] as int?,
      activityThreshold: json['activity_threshold'] as int?,
      activityType: json['activity_type'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}

/// User's earned badge
@immutable
class ZoneUserBadge {
  final String id;
  final String oderId;
  final String eventId;
  final String badgeId;
  final DateTime earnedAt;
  // Badge info (from join)
  final ZoneBadge? badge;

  const ZoneUserBadge({
    required this.id,
    required this.oderId,
    required this.eventId,
    required this.badgeId,
    required this.earnedAt,
    this.badge,
  });

  factory ZoneUserBadge.fromJson(Map<String, dynamic> json) {
    final badgeJson = json['zone_badges'] as Map<String, dynamic>?;
    return ZoneUserBadge(
      id: json['id'] as String,
      oderId: json['user_id'] as String,
      eventId: json['event_id'] as String,
      badgeId: json['badge_id'] as String,
      earnedAt: DateTime.parse(json['earned_at'] as String),
      badge: badgeJson != null ? ZoneBadge.fromJson(badgeJson) : null,
    );
  }

  String get userId => oderId;
}

/// User stats summary for quick display
@immutable
class ZoneUserStats {
  final int totalPoints;
  final int rank;
  final int badgesEarned;
  final int activityCount;

  const ZoneUserStats({
    this.totalPoints = 0,
    this.rank = 0,
    this.badgesEarned = 0,
    this.activityCount = 0,
  });

  factory ZoneUserStats.fromLeaderboardEntry(ZoneLeaderboardEntry? entry) {
    if (entry == null) {
      return const ZoneUserStats();
    }
    return ZoneUserStats(
      totalPoints: entry.totalPoints,
      rank: entry.rank,
      badgesEarned: entry.badgesEarned,
      activityCount: entry.activityCount,
    );
  }
}
