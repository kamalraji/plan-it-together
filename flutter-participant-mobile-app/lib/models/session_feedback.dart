/// Model for session feedback/rating
class SessionFeedback {
  final String id;
  final String sessionId;
  final String eventId;
  final String userId;
  final int overallRating;
  final int? contentRating;
  final int? speakerRating;
  final String? feedbackText;
  final bool? wouldRecommend;
  final DateTime createdAt;

  const SessionFeedback({
    required this.id,
    required this.sessionId,
    required this.eventId,
    required this.userId,
    required this.overallRating,
    this.contentRating,
    this.speakerRating,
    this.feedbackText,
    this.wouldRecommend,
    required this.createdAt,
  });

  factory SessionFeedback.fromJson(Map<String, dynamic> json) => SessionFeedback(
        id: json['id'] as String,
        sessionId: json['session_id'] as String,
        eventId: json['event_id'] as String,
        userId: json['user_id'] as String,
        overallRating: json['overall_rating'] as int,
        contentRating: json['content_rating'] as int?,
        speakerRating: json['speaker_rating'] as int?,
        feedbackText: json['feedback_text'] as String?,
        wouldRecommend: json['would_recommend'] as bool?,
        createdAt: DateTime.parse(json['created_at'] as String),
      );

  Map<String, dynamic> toJson() => {
        'session_id': sessionId,
        'event_id': eventId,
        'user_id': userId,
        'overall_rating': overallRating,
        if (contentRating != null) 'content_rating': contentRating,
        if (speakerRating != null) 'speaker_rating': speakerRating,
        if (feedbackText != null) 'feedback_text': feedbackText,
        if (wouldRecommend != null) 'would_recommend': wouldRecommend,
      };
}

/// Aggregated rating statistics for a session
class SessionRatingAggregate {
  final String sessionId;
  final double averageRating;
  final int totalRatings;
  final Map<int, int> ratingDistribution;
  final DateTime? updatedAt;

  const SessionRatingAggregate({
    required this.sessionId,
    required this.averageRating,
    required this.totalRatings,
    required this.ratingDistribution,
    this.updatedAt,
  });

  factory SessionRatingAggregate.fromJson(Map<String, dynamic> json) {
    final distribution = json['rating_distribution'] as Map<String, dynamic>? ?? {};
    return SessionRatingAggregate(
      sessionId: json['session_id'] as String,
      averageRating: (json['average_rating'] as num?)?.toDouble() ?? 0.0,
      totalRatings: json['total_ratings'] as int? ?? 0,
      ratingDistribution: {
        1: int.tryParse(distribution['1']?.toString() ?? '0') ?? 0,
        2: int.tryParse(distribution['2']?.toString() ?? '0') ?? 0,
        3: int.tryParse(distribution['3']?.toString() ?? '0') ?? 0,
        4: int.tryParse(distribution['4']?.toString() ?? '0') ?? 0,
        5: int.tryParse(distribution['5']?.toString() ?? '0') ?? 0,
      },
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : null,
    );
  }

  /// Percentage of 5-star ratings
  double get fiveStarPercentage =>
      totalRatings > 0 ? (ratingDistribution[5] ?? 0) / totalRatings * 100 : 0;

  /// Check if session has any ratings
  bool get hasRatings => totalRatings > 0;
}

/// Model for event track (category/stream)
class EventTrack {
  final String id;
  final String eventId;
  final String name;
  final String? description;
  final String? color;
  final String? icon;
  final int sortOrder;
  final DateTime createdAt;

  const EventTrack({
    required this.id,
    required this.eventId,
    required this.name,
    this.description,
    this.color,
    this.icon,
    required this.sortOrder,
    required this.createdAt,
  });

  factory EventTrack.fromJson(Map<String, dynamic> json) => EventTrack(
        id: json['id'] as String,
        eventId: json['event_id'] as String,
        name: json['name'] as String,
        description: json['description'] as String?,
        color: json['color'] as String?,
        icon: json['icon'] as String?,
        sortOrder: json['sort_order'] as int? ?? 0,
        createdAt: DateTime.parse(json['created_at'] as String),
      );
}
