/// Event image model for normalized event_images table
class EventImage {
  final String id;
  final String eventId;
  final String url;
  final String? caption;
  final String? altText;
  final int sortOrder;
  final bool isPrimary;
  final DateTime createdAt;
  final DateTime updatedAt;

  const EventImage({
    required this.id,
    required this.eventId,
    required this.url,
    this.caption,
    this.altText,
    this.sortOrder = 0,
    this.isPrimary = false,
    required this.createdAt,
    required this.updatedAt,
  });

  factory EventImage.fromJson(Map<String, dynamic> json) {
    return EventImage(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      url: json['url'] as String,
      caption: json['caption'] as String?,
      altText: json['alt_text'] as String?,
      sortOrder: json['sort_order'] as int? ?? 0,
      isPrimary: json['is_primary'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'event_id': eventId,
        'url': url,
        'caption': caption,
        'alt_text': altText,
        'sort_order': sortOrder,
        'is_primary': isPrimary,
        'created_at': createdAt.toIso8601String(),
        'updated_at': updatedAt.toIso8601String(),
      };

  EventImage copyWith({
    String? id,
    String? eventId,
    String? url,
    String? caption,
    String? altText,
    int? sortOrder,
    bool? isPrimary,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) =>
      EventImage(
        id: id ?? this.id,
        eventId: eventId ?? this.eventId,
        url: url ?? this.url,
        caption: caption ?? this.caption,
        altText: altText ?? this.altText,
        sortOrder: sortOrder ?? this.sortOrder,
        isPrimary: isPrimary ?? this.isPrimary,
        createdAt: createdAt ?? this.createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
      );
}
