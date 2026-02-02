/// Zone Activity Feed model for real-time activity updates
/// Part of Zone Phase 2 implementation

/// Types of activities that can appear in the feed
enum ZoneActivityType {
  checkin('checkin', '📍', 'Checked In'),
  pollResult('poll_result', '📊', 'Poll Updated'),
  leaderboardChange('leaderboard_change', '🏆', 'Leaderboard'),
  badgeEarned('badge_earned', '🏅', 'Badge Earned'),
  sessionLive('session_live', '🔴', 'Now Live'),
  announcement('announcement', '📢', 'Announcement'),
  challengeComplete('challenge_complete', '✅', 'Challenge');

  const ZoneActivityType(this.value, this.emoji, this.label);
  
  final String value;
  final String emoji;
  final String label;

  static ZoneActivityType fromValue(String value) {
    return ZoneActivityType.values.firstWhere(
      (t) => t.value == value,
      orElse: () => ZoneActivityType.announcement,
    );
  }
}

/// Represents a single activity in the Zone feed
class ZoneActivity {
  final String id;
  final String eventId;
  final ZoneActivityType activityType;
  final String title;
  final String? description;
  final String? actorId;
  final String? actorName;
  final String? actorAvatar;
  final Map<String, dynamic> metadata;
  final bool isPublic;
  final DateTime createdAt;

  const ZoneActivity({
    required this.id,
    required this.eventId,
    required this.activityType,
    required this.title,
    this.description,
    this.actorId,
    this.actorName,
    this.actorAvatar,
    this.metadata = const {},
    this.isPublic = true,
    required this.createdAt,
  });

  /// Get time ago string for display
  String get timeAgo {
    final diff = DateTime.now().difference(createdAt);
    
    if (diff.inSeconds < 60) {
      return 'Just now';
    } else if (diff.inMinutes < 60) {
      return '${diff.inMinutes}m ago';
    } else if (diff.inHours < 24) {
      return '${diff.inHours}h ago';
    } else {
      return '${diff.inDays}d ago';
    }
  }

  factory ZoneActivity.fromJson(Map<String, dynamic> json) {
    return ZoneActivity(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      activityType: ZoneActivityType.fromValue(json['activity_type'] as String),
      title: json['title'] as String,
      description: json['description'] as String?,
      actorId: json['actor_id'] as String?,
      actorName: json['actor_name'] as String?,
      actorAvatar: json['actor_avatar'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>? ?? {},
      isPublic: json['is_public'] as bool? ?? true,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}
