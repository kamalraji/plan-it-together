import 'dart:math';

/// Represents a competition round within an event
class CompetitionRound {
  final String id;
  final String eventId;
  final int roundNumber;
  final String name;
  final String? description;
  final String status; // upcoming, active, completed
  final DateTime? startTime;
  final DateTime? endTime;
  final int? maxParticipants;
  final DateTime createdAt;
  final int questionCount;
  final int completedQuestions;

  CompetitionRound({
    required this.id,
    required this.eventId,
    required this.roundNumber,
    required this.name,
    this.description,
    required this.status,
    this.startTime,
    this.endTime,
    this.maxParticipants,
    required this.createdAt,
    this.questionCount = 0,
    this.completedQuestions = 0,
  });

  bool get isActive => status == 'active';
  bool get isUpcoming => status == 'upcoming';
  bool get isCompleted => status == 'completed';
  double get progress => questionCount > 0 ? completedQuestions / questionCount : 0;

  factory CompetitionRound.fromJson(Map<String, dynamic> json) {
    return CompetitionRound(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      roundNumber: json['round_number'] as int? ?? 1,
      name: json['name'] as String,
      description: json['description'] as String?,
      status: json['status'] as String? ?? 'upcoming',
      startTime: json['start_time'] != null
          ? DateTime.parse(json['start_time'] as String)
          : null,
      endTime: json['end_time'] != null
          ? DateTime.parse(json['end_time'] as String)
          : null,
      maxParticipants: json['max_participants'] as int?,
      createdAt: DateTime.parse(json['created_at'] as String),
      questionCount: json['question_count'] as int? ?? 0,
      completedQuestions: json['completed_questions'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'event_id': eventId,
      'round_number': roundNumber,
      'name': name,
      'description': description,
      'status': status,
      'start_time': startTime?.toIso8601String(),
      'end_time': endTime?.toIso8601String(),
      'max_participants': maxParticipants,
      'created_at': createdAt.toIso8601String(),
    };
  }
}

/// Represents a question in a competition round
class CompetitionQuestion {
  final String id;
  final String roundId;
  final int questionNumber;
  final String question;
  final List<String> options;
  final int? correctOptionIndex; // Only visible after question closes
  final int points;
  final int? timeLimitSeconds;
  final String status; // pending, active, closed
  final DateTime? activatedAt;
  final DateTime createdAt;

  CompetitionQuestion({
    required this.id,
    required this.roundId,
    required this.questionNumber,
    required this.question,
    required this.options,
    this.correctOptionIndex,
    required this.points,
    this.timeLimitSeconds,
    required this.status,
    this.activatedAt,
    required this.createdAt,
  });

  bool get isActive => status == 'active';
  bool get isClosed => status == 'closed';
  bool get isPending => status == 'pending';

  int get remainingSeconds {
    if (timeLimitSeconds == null || activatedAt == null) return 0;
    final elapsed = DateTime.now().difference(activatedAt!).inSeconds;
    return max(0, timeLimitSeconds! - elapsed);
  }

  bool get hasTimeLimit => timeLimitSeconds != null && timeLimitSeconds! > 0;

  factory CompetitionQuestion.fromJson(Map<String, dynamic> json) {
    final optionsData = json['options'];
    List<String> options = [];
    if (optionsData is List) {
      options = optionsData.map((e) => e.toString()).toList();
    }

    return CompetitionQuestion(
      id: json['id'] as String,
      roundId: json['round_id'] as String,
      questionNumber: json['question_number'] as int? ?? 1,
      question: json['question'] as String,
      options: options,
      correctOptionIndex: json['correct_option_index'] as int?,
      points: json['points'] as int? ?? 10,
      timeLimitSeconds: json['time_limit_seconds'] as int?,
      status: json['status'] as String? ?? 'pending',
      activatedAt: json['activated_at'] != null
          ? DateTime.parse(json['activated_at'] as String)
          : null,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'round_id': roundId,
      'question_number': questionNumber,
      'question': question,
      'options': options,
      'correct_option_index': correctOptionIndex,
      'points': points,
      'time_limit_seconds': timeLimitSeconds,
      'status': status,
      'activated_at': activatedAt?.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
    };
  }
}

/// Represents a user's response to a competition question
class CompetitionResponse {
  final String id;
  final String questionId;
  final String userId;
  final int selectedOption;
  final bool isCorrect;
  final int pointsEarned;
  final int? responseTimeMs;
  final DateTime createdAt;

  CompetitionResponse({
    required this.id,
    required this.questionId,
    required this.userId,
    required this.selectedOption,
    required this.isCorrect,
    required this.pointsEarned,
    this.responseTimeMs,
    required this.createdAt,
  });

  factory CompetitionResponse.fromJson(Map<String, dynamic> json) {
    return CompetitionResponse(
      id: json['id'] as String,
      questionId: json['question_id'] as String,
      userId: json['user_id'] as String,
      selectedOption: json['selected_option'] as int,
      isCorrect: json['is_correct'] as bool? ?? false,
      pointsEarned: json['points_earned'] as int? ?? 0,
      responseTimeMs: json['response_time_ms'] as int?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'question_id': questionId,
      'user_id': userId,
      'selected_option': selectedOption,
      'is_correct': isCorrect,
      'points_earned': pointsEarned,
      'response_time_ms': responseTimeMs,
      'created_at': createdAt.toIso8601String(),
    };
  }
}

/// Represents a user's aggregate score in a competition
class CompetitionScore {
  final String id;
  final String eventId;
  final String userId;
  final String? userName;
  final String? userAvatar;
  final int totalScore;
  final int correctAnswers;
  final int totalAnswers;
  final int currentStreak;
  final int bestStreak;
  final DateTime lastUpdated;
  final int rank;

  CompetitionScore({
    required this.id,
    required this.eventId,
    required this.userId,
    this.userName,
    this.userAvatar,
    required this.totalScore,
    required this.correctAnswers,
    required this.totalAnswers,
    required this.currentStreak,
    required this.bestStreak,
    required this.lastUpdated,
    this.rank = 0,
  });

  double get accuracy => totalAnswers > 0 ? correctAnswers / totalAnswers : 0;
  int get accuracyPercent => (accuracy * 100).round();

  factory CompetitionScore.fromJson(Map<String, dynamic> json, {int rank = 0}) {
    return CompetitionScore(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      userId: json['user_id'] as String,
      userName: json['user_name'] as String?,
      userAvatar: json['user_avatar'] as String?,
      totalScore: json['total_score'] as int? ?? 0,
      correctAnswers: json['correct_answers'] as int? ?? 0,
      totalAnswers: json['total_answers'] as int? ?? 0,
      currentStreak: json['current_streak'] as int? ?? 0,
      bestStreak: json['best_streak'] as int? ?? 0,
      lastUpdated: DateTime.parse(json['last_updated'] as String),
      rank: rank,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'event_id': eventId,
      'user_id': userId,
      'total_score': totalScore,
      'correct_answers': correctAnswers,
      'total_answers': totalAnswers,
      'current_streak': currentStreak,
      'best_streak': bestStreak,
      'last_updated': lastUpdated.toIso8601String(),
    };
  }
}

/// Leaderboard entry with rank and user details
class CompetitionLeaderboardEntry {
  final String id;
  final String oduserId;
  final String name;
  final String? avatarUrl;
  final int score;
  final int rank;
  final int correctAnswers;
  final int totalAnswers;
  final int streak;
  final bool isCurrentUser;

  CompetitionLeaderboardEntry({
    required this.id,
    required this.oduserId,
    required this.name,
    this.avatarUrl,
    required this.score,
    required this.rank,
    required this.correctAnswers,
    this.totalAnswers = 0,
    required this.streak,
    this.isCurrentUser = false,
  });

  double get accuracy => totalAnswers > 0 ? correctAnswers / totalAnswers : 0;

  factory CompetitionLeaderboardEntry.fromJson(
    Map<String, dynamic> json, {
    required int rank,
    String? currentUserId,
  }) {
    final oduserId = json['user_id'] as String;
    return CompetitionLeaderboardEntry(
      id: json['id'] as String,
      oduserId: oduserId,
      name: json['user_name'] as String? ?? 'Anonymous',
      avatarUrl: json['user_avatar'] as String?,
      score: json['total_score'] as int? ?? 0,
      rank: rank,
      correctAnswers: json['correct_answers'] as int? ?? 0,
      totalAnswers: json['total_answers'] as int? ?? 0,
      streak: json['current_streak'] as int? ?? 0,
      isCurrentUser: oduserId == currentUserId,
    );
  }
}

/// Real-time presence stats for a competition
class CompetitionPresence {
  final String eventId;
  final int onlineCount;
  final int answeringCount;
  final List<String> recentParticipantIds;
  final DateTime lastUpdated;

  CompetitionPresence({
    required this.eventId,
    required this.onlineCount,
    this.answeringCount = 0,
    this.recentParticipantIds = const [],
    DateTime? lastUpdated,
  }) : lastUpdated = lastUpdated ?? DateTime.now();
}

/// Competition badge definition
class CompetitionBadge {
  final String id;
  final String name;
  final String description;
  final String icon;
  final String badgeType;
  final String rarity;
  final int pointsValue;
  final DateTime? earnedAt;
  final Map<String, dynamic>? metadata;

  CompetitionBadge({
    required this.id,
    required this.name,
    this.description = '',
    required this.icon,
    required this.badgeType,
    this.rarity = 'COMMON',
    this.pointsValue = 50,
    this.earnedAt,
    this.metadata,
  });

  bool get isEarned => earnedAt != null;

  factory CompetitionBadge.fromJson(Map<String, dynamic> json, {DateTime? earnedAt, Map<String, dynamic>? metadata}) {
    return CompetitionBadge(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String? ?? '',
      icon: json['icon'] as String,
      badgeType: json['badge_type'] as String,
      rarity: json['rarity'] as String? ?? 'COMMON',
      pointsValue: json['points_value'] as int? ?? 50,
      earnedAt: earnedAt,
      metadata: metadata,
    );
  }
}

/// Team competition score with member breakdown
class CompetitionTeamScore {
  final String id;
  final String eventId;
  final String teamId;
  final String teamName;
  final String? teamAvatar;
  final int totalScore;
  final int correctAnswers;
  final int totalAnswers;
  final int memberCount;
  final double averageScore;
  final int bestStreak;
  final int rank;
  final List<TeamMemberScore> memberScores;

  CompetitionTeamScore({
    required this.id,
    required this.eventId,
    required this.teamId,
    required this.teamName,
    this.teamAvatar,
    required this.totalScore,
    required this.correctAnswers,
    required this.totalAnswers,
    required this.memberCount,
    required this.averageScore,
    required this.bestStreak,
    this.rank = 0,
    this.memberScores = const [],
  });

  double get accuracy => totalAnswers > 0 ? correctAnswers / totalAnswers : 0;

  factory CompetitionTeamScore.fromJson(Map<String, dynamic> json, {int rank = 0, List<TeamMemberScore>? memberScores}) {
    return CompetitionTeamScore(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      teamId: json['team_id'] as String,
      teamName: json['team_name'] as String? ?? json['hackathon_teams']?['name'] as String? ?? 'Team',
      teamAvatar: json['team_avatar'] as String?,
      totalScore: json['total_score'] as int? ?? 0,
      correctAnswers: json['correct_answers'] as int? ?? 0,
      totalAnswers: json['total_answers'] as int? ?? 0,
      memberCount: json['member_count'] as int? ?? 0,
      averageScore: (json['average_score'] as num?)?.toDouble() ?? 0,
      bestStreak: json['best_streak'] as int? ?? 0,
      rank: rank,
      memberScores: memberScores ?? [],
    );
  }
}

/// Individual team member score contribution
class TeamMemberScore {
  final String oduserId;
  final String userName;
  final String? userAvatar;
  final int score;
  final int correctAnswers;
  final int totalAnswers;

  TeamMemberScore({
    required this.oduserId,
    required this.userName,
    this.userAvatar,
    required this.score,
    required this.correctAnswers,
    this.totalAnswers = 0,
  });

  factory TeamMemberScore.fromJson(Map<String, dynamic> json) {
    return TeamMemberScore(
      oduserId: json['user_id'] as String,
      userName: json['user_name'] as String? ?? 'Member',
      userAvatar: json['user_avatar'] as String?,
      score: json['total_score'] as int? ?? 0,
      correctAnswers: json['correct_answers'] as int? ?? 0,
      totalAnswers: json['total_answers'] as int? ?? 0,
    );
  }
}
