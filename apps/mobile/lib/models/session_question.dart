import 'package:flutter/foundation.dart';

/// Status of a Q&A question
enum QuestionStatus {
  pending('pending'),
  approved('approved'),
  answered('answered'),
  rejected('rejected');

  const QuestionStatus(this.value);
  final String value;

  static QuestionStatus fromString(String value) {
    return QuestionStatus.values.firstWhere(
      (e) => e.value == value,
      orElse: () => QuestionStatus.pending,
    );
  }
}

/// Model for session Q&A questions
@immutable
class SessionQuestion {
  final String id;
  final String sessionId;
  final String eventId;
  final String userId;
  final String questionText;
  final QuestionStatus status;
  final int upvoteCount;
  final String? answerText;
  final DateTime? answeredAt;
  final String? answeredBy;
  final bool isAnonymous;
  final DateTime createdAt;
  final DateTime updatedAt;
  // Transient state for optimistic UI
  final bool hasUpvoted;
  // Profile info from join (optional)
  final String? userName;
  final String? userAvatar;

  const SessionQuestion({
    required this.id,
    required this.sessionId,
    required this.eventId,
    required this.userId,
    required this.questionText,
    this.status = QuestionStatus.pending,
    this.upvoteCount = 0,
    this.answerText,
    this.answeredAt,
    this.answeredBy,
    this.isAnonymous = false,
    required this.createdAt,
    required this.updatedAt,
    this.hasUpvoted = false,
    this.userName,
    this.userAvatar,
  });

  factory SessionQuestion.fromJson(
    Map<String, dynamic> json, {
    bool hasUpvoted = false,
    String? userName,
    String? userAvatar,
  }) {
    final profile = json['impact_profiles'] as Map<String, dynamic>?;
    return SessionQuestion(
      id: json['id'] as String,
      sessionId: json['session_id'] as String,
      eventId: json['event_id'] as String,
      userId: json['user_id'] as String,
      questionText: json['question_text'] as String,
      status: QuestionStatus.fromString(json['status'] as String? ?? 'pending'),
      upvoteCount: json['upvote_count'] as int? ?? 0,
      answerText: json['answer_text'] as String?,
      answeredAt: json['answered_at'] != null
          ? DateTime.parse(json['answered_at'] as String)
          : null,
      answeredBy: json['answered_by'] as String?,
      isAnonymous: json['is_anonymous'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      hasUpvoted: hasUpvoted,
      userName: userName ?? profile?['full_name'] as String?,
      userAvatar: userAvatar ?? profile?['avatar_url'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'session_id': sessionId,
        'event_id': eventId,
        'user_id': userId,
        'question_text': questionText,
        'status': status.value,
        'upvote_count': upvoteCount,
        'answer_text': answerText,
        'answered_at': answeredAt?.toIso8601String(),
        'answered_by': answeredBy,
        'is_anonymous': isAnonymous,
      };

  /// Whether this question is visible to attendees (approved or answered)
  bool get isVisible => status == QuestionStatus.approved || status == QuestionStatus.answered;

  /// Whether this question has been answered
  bool get isAnswered => status == QuestionStatus.answered && answerText != null;

  /// Whether this question is awaiting moderation
  bool get isPending => status == QuestionStatus.pending;

  /// Display name for the author (respecting anonymity)
  String get displayName => isAnonymous ? 'Anonymous' : (userName ?? 'Attendee');

  /// Copy with new values
  SessionQuestion copyWith({
    String? id,
    String? sessionId,
    String? eventId,
    String? userId,
    String? questionText,
    QuestionStatus? status,
    int? upvoteCount,
    String? answerText,
    DateTime? answeredAt,
    String? answeredBy,
    bool? isAnonymous,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? hasUpvoted,
    String? userName,
    String? userAvatar,
  }) {
    return SessionQuestion(
      id: id ?? this.id,
      sessionId: sessionId ?? this.sessionId,
      eventId: eventId ?? this.eventId,
      userId: userId ?? this.userId,
      questionText: questionText ?? this.questionText,
      status: status ?? this.status,
      upvoteCount: upvoteCount ?? this.upvoteCount,
      answerText: answerText ?? this.answerText,
      answeredAt: answeredAt ?? this.answeredAt,
      answeredBy: answeredBy ?? this.answeredBy,
      isAnonymous: isAnonymous ?? this.isAnonymous,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      hasUpvoted: hasUpvoted ?? this.hasUpvoted,
      userName: userName ?? this.userName,
      userAvatar: userAvatar ?? this.userAvatar,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is SessionQuestion &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;
}
