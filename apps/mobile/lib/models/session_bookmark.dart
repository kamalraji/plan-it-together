/// Session Bookmark model for Zone Phase 2
/// Allows users to bookmark sessions and set reminders

class SessionBookmark {
  final String id;
  final String sessionId;
  final String eventId;
  final String userId;
  final int? reminderMinutesBefore;
  final bool reminderSent;
  final DateTime createdAt;

  const SessionBookmark({
    required this.id,
    required this.sessionId,
    required this.eventId,
    required this.userId,
    this.reminderMinutesBefore = 15,
    this.reminderSent = false,
    required this.createdAt,
  });

  /// Check if reminder is enabled
  bool get hasReminder => reminderMinutesBefore != null;

  /// Create from JSON
  factory SessionBookmark.fromJson(Map<String, dynamic> json) {
    return SessionBookmark(
      id: json['id'] as String,
      sessionId: json['session_id'] as String,
      eventId: json['event_id'] as String,
      userId: json['user_id'] as String,
      reminderMinutesBefore: json['reminder_minutes_before'] as int?,
      reminderSent: json['reminder_sent'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  /// Convert to JSON for insert/update
  Map<String, dynamic> toJson() {
    return {
      'session_id': sessionId,
      'event_id': eventId,
      'user_id': userId,
      'reminder_minutes_before': reminderMinutesBefore,
    };
  }

  /// Create a copy with modified fields
  SessionBookmark copyWith({
    int? reminderMinutesBefore,
    bool? reminderSent,
  }) {
    return SessionBookmark(
      id: id,
      sessionId: sessionId,
      eventId: eventId,
      userId: userId,
      reminderMinutesBefore: reminderMinutesBefore ?? this.reminderMinutesBefore,
      reminderSent: reminderSent ?? this.reminderSent,
      createdAt: createdAt,
    );
  }
}
