/// Saved event model for bookmarked events
class SavedEvent {
  final String id;
  final String eventId;
  final String eventName;
  final String? eventBannerUrl;
  final DateTime eventStartDate;
  final DateTime eventEndDate;
  final String? venue;
  final bool reminderEnabled;
  final DateTime? reminderTime;
  final String? notes;
  final DateTime savedAt;

  const SavedEvent({
    required this.id,
    required this.eventId,
    required this.eventName,
    this.eventBannerUrl,
    required this.eventStartDate,
    required this.eventEndDate,
    this.venue,
    this.reminderEnabled = false,
    this.reminderTime,
    this.notes,
    required this.savedAt,
  });

  factory SavedEvent.fromMap(Map<String, dynamic> json) {
    final event = json['events'] as Map<String, dynamic>?;
    final branding = event?['branding'] as Map<String, dynamic>?;
    
    return SavedEvent(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      eventName: event?['name'] as String? ?? 'Unknown Event',
      eventBannerUrl: branding?['banner_url'] as String?,
      eventStartDate: DateTime.parse(event?['start_date'] as String? ?? DateTime.now().toIso8601String()),
      eventEndDate: DateTime.parse(event?['end_date'] as String? ?? DateTime.now().toIso8601String()),
      venue: event?['venue'] as String?,
      reminderEnabled: json['reminder_enabled'] as bool? ?? false,
      reminderTime: json['reminder_time'] != null 
          ? DateTime.parse(json['reminder_time'] as String) 
          : null,
      notes: json['notes'] as String?,
      savedAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toMap() => {
    'id': id,
    'event_id': eventId,
    'reminder_enabled': reminderEnabled,
    'reminder_time': reminderTime?.toIso8601String(),
    'notes': notes,
  };

  SavedEvent copyWith({
    String? id,
    String? eventId,
    String? eventName,
    String? eventBannerUrl,
    DateTime? eventStartDate,
    DateTime? eventEndDate,
    String? venue,
    bool? reminderEnabled,
    DateTime? reminderTime,
    String? notes,
    DateTime? savedAt,
  }) => SavedEvent(
    id: id ?? this.id,
    eventId: eventId ?? this.eventId,
    eventName: eventName ?? this.eventName,
    eventBannerUrl: eventBannerUrl ?? this.eventBannerUrl,
    eventStartDate: eventStartDate ?? this.eventStartDate,
    eventEndDate: eventEndDate ?? this.eventEndDate,
    venue: venue ?? this.venue,
    reminderEnabled: reminderEnabled ?? this.reminderEnabled,
    reminderTime: reminderTime ?? this.reminderTime,
    notes: notes ?? this.notes,
    savedAt: savedAt ?? this.savedAt,
  );

  bool get isUpcoming => eventStartDate.isAfter(DateTime.now());
  bool get isPast => eventEndDate.isBefore(DateTime.now());
}
