/// Models for Event Icebreakers feature

class EventIcebreaker {
  final String id;
  final String eventId;
  final String question;
  final DateTime activeDate;
  final bool isActive;
  final int sortOrder;
  final DateTime createdAt;
  final DateTime? updatedAt;
  
  // Additional data from joins
  final int answerCount;
  final String? myAnswer;
  final int streakDays;

  const EventIcebreaker({
    required this.id,
    required this.eventId,
    required this.question,
    required this.activeDate,
    this.isActive = true,
    this.sortOrder = 0,
    required this.createdAt,
    this.updatedAt,
    this.answerCount = 0,
    this.myAnswer,
    this.streakDays = 0,
  });

  factory EventIcebreaker.fromJson(Map<String, dynamic> json) {
    return EventIcebreaker(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      question: json['question'] as String,
      activeDate: DateTime.parse(json['active_date'] as String),
      isActive: json['is_active'] as bool? ?? true,
      sortOrder: json['sort_order'] as int? ?? 0,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : null,
      answerCount: json['answer_count'] as int? ?? 0,
      myAnswer: json['my_answer'] as String?,
      streakDays: json['streak_days'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'event_id': eventId,
        'question': question,
        'active_date': activeDate.toIso8601String().split('T')[0],
        'is_active': isActive,
        'sort_order': sortOrder,
      };

  EventIcebreaker copyWith({
    String? id,
    String? eventId,
    String? question,
    DateTime? activeDate,
    bool? isActive,
    int? sortOrder,
    DateTime? createdAt,
    DateTime? updatedAt,
    int? answerCount,
    String? myAnswer,
    int? streakDays,
  }) {
    return EventIcebreaker(
      id: id ?? this.id,
      eventId: eventId ?? this.eventId,
      question: question ?? this.question,
      activeDate: activeDate ?? this.activeDate,
      isActive: isActive ?? this.isActive,
      sortOrder: sortOrder ?? this.sortOrder,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      answerCount: answerCount ?? this.answerCount,
      myAnswer: myAnswer ?? this.myAnswer,
      streakDays: streakDays ?? this.streakDays,
    );
  }
}

class IcebreakerAnswer {
  final String id;
  final String icebreakerId;
  final String oderId;
  final String answer;
  final DateTime createdAt;
  final DateTime? updatedAt;
  
  // Joined user data
  final String? userName;
  final String? userAvatar;

  const IcebreakerAnswer({
    required this.id,
    required this.icebreakerId,
    required this.oderId,
    required this.answer,
    required this.createdAt,
    this.updatedAt,
    this.userName,
    this.userAvatar,
  });

  factory IcebreakerAnswer.fromJson(Map<String, dynamic> json) {
    // Handle nested user profile data
    String? userName;
    String? userAvatar;
    
    if (json['impact_profiles'] is Map) {
      final profile = json['impact_profiles'] as Map<String, dynamic>;
      userName = profile['full_name'] as String?;
      userAvatar = profile['avatar_url'] as String?;
    } else {
      userName = json['user_name'] as String?;
      userAvatar = json['user_avatar'] as String?;
    }

    return IcebreakerAnswer(
      id: json['id'] as String,
      icebreakerId: json['icebreaker_id'] as String,
      oderId: json['user_id'] as String,
      answer: json['answer'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : null,
      userName: userName,
      userAvatar: userAvatar,
    );
  }
}

class IcebreakerStreak {
  final String id;
  final String eventId;
  final String userId;
  final int currentStreak;
  final int longestStreak;
  final DateTime? lastAnsweredDate;

  const IcebreakerStreak({
    required this.id,
    required this.eventId,
    required this.userId,
    this.currentStreak = 0,
    this.longestStreak = 0,
    this.lastAnsweredDate,
  });

  factory IcebreakerStreak.fromJson(Map<String, dynamic> json) {
    return IcebreakerStreak(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      userId: json['user_id'] as String,
      currentStreak: json['current_streak'] as int? ?? 0,
      longestStreak: json['longest_streak'] as int? ?? 0,
      lastAnsweredDate: json['last_answered_date'] != null
          ? DateTime.parse(json['last_answered_date'] as String)
          : null,
    );
  }
}
