/// Event FAQ model for normalized event_faqs table
class EventFaq {
  final String id;
  final String eventId;
  final String question;
  final String answer;
  final int sortOrder;
  final bool isPublished;
  final DateTime createdAt;
  final DateTime updatedAt;

  const EventFaq({
    required this.id,
    required this.eventId,
    required this.question,
    required this.answer,
    this.sortOrder = 0,
    this.isPublished = true,
    required this.createdAt,
    required this.updatedAt,
  });

  factory EventFaq.fromJson(Map<String, dynamic> json) {
    return EventFaq(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      question: json['question'] as String,
      answer: json['answer'] as String,
      sortOrder: json['sort_order'] as int? ?? 0,
      isPublished: json['is_published'] as bool? ?? true,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'event_id': eventId,
        'question': question,
        'answer': answer,
        'sort_order': sortOrder,
        'is_published': isPublished,
        'created_at': createdAt.toIso8601String(),
        'updated_at': updatedAt.toIso8601String(),
      };

  EventFaq copyWith({
    String? id,
    String? eventId,
    String? question,
    String? answer,
    int? sortOrder,
    bool? isPublished,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) =>
      EventFaq(
        id: id ?? this.id,
        eventId: eventId ?? this.eventId,
        question: question ?? this.question,
        answer: answer ?? this.answer,
        sortOrder: sortOrder ?? this.sortOrder,
        isPublished: isPublished ?? this.isPublished,
        createdAt: createdAt ?? this.createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
      );
}
