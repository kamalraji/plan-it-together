/// Virtual meeting link model for normalized event_virtual_links table
class EventVirtualLink {
  final String id;
  final String eventId;
  final String platform; // 'ZOOM', 'MEET', 'TEAMS', 'CUSTOM'
  final String? meetingUrl;
  final String? meetingId;
  final String? password;
  final String? instructions;
  final bool isPrimary;
  final DateTime createdAt;
  final DateTime updatedAt;

  const EventVirtualLink({
    required this.id,
    required this.eventId,
    required this.platform,
    this.meetingUrl,
    this.meetingId,
    this.password,
    this.instructions,
    this.isPrimary = false,
    required this.createdAt,
    required this.updatedAt,
  });

  /// Platform display name
  String get platformDisplayName {
    switch (platform.toUpperCase()) {
      case 'ZOOM':
        return 'Zoom';
      case 'MEET':
      case 'GOOGLE_MEET':
        return 'Google Meet';
      case 'TEAMS':
      case 'MS_TEAMS':
        return 'Microsoft Teams';
      case 'WEBEX':
        return 'Cisco Webex';
      case 'CUSTOM':
        return 'Custom Link';
      default:
        return platform;
    }
  }

  factory EventVirtualLink.fromJson(Map<String, dynamic> json) {
    return EventVirtualLink(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      platform: json['platform'] as String? ?? 'CUSTOM',
      meetingUrl: json['meeting_url'] as String?,
      meetingId: json['meeting_id'] as String?,
      password: json['password'] as String?,
      instructions: json['instructions'] as String?,
      isPrimary: json['is_primary'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'event_id': eventId,
        'platform': platform,
        'meeting_url': meetingUrl,
        'meeting_id': meetingId,
        'password': password,
        'instructions': instructions,
        'is_primary': isPrimary,
        'created_at': createdAt.toIso8601String(),
        'updated_at': updatedAt.toIso8601String(),
      };

  EventVirtualLink copyWith({
    String? id,
    String? eventId,
    String? platform,
    String? meetingUrl,
    String? meetingId,
    String? password,
    String? instructions,
    bool? isPrimary,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) =>
      EventVirtualLink(
        id: id ?? this.id,
        eventId: eventId ?? this.eventId,
        platform: platform ?? this.platform,
        meetingUrl: meetingUrl ?? this.meetingUrl,
        meetingId: meetingId ?? this.meetingId,
        password: password ?? this.password,
        instructions: instructions ?? this.instructions,
        isPrimary: isPrimary ?? this.isPrimary,
        createdAt: createdAt ?? this.createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
      );
}
