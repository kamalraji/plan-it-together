/// Zone Challenge models for scavenger hunts and gamification
/// Part of Zone Phase 2 implementation

/// Challenge types available in the system
enum ChallengeType {
  checkin('checkin', 'Check-in', '📍'),
  qrScan('qr_scan', 'QR Scan', '📷'),
  quiz('quiz', 'Quiz', '❓'),
  photo('photo', 'Photo', '📸'),
  social('social', 'Social', '📱'),
  session('session', 'Attend Session', '🎤'),
  booth('booth', 'Visit Booth', '🏪');

  const ChallengeType(this.value, this.label, this.emoji);
  
  final String value;
  final String label;
  final String emoji;

  static ChallengeType fromValue(String value) {
    return ChallengeType.values.firstWhere(
      (t) => t.value == value,
      orElse: () => ChallengeType.checkin,
    );
  }
}

/// Represents a zone challenge/scavenger hunt task
class ZoneChallenge {
  final String id;
  final String eventId;
  final String title;
  final String? description;
  final ChallengeType challengeType;
  final int pointsReward;
  final Map<String, dynamic> targetData;
  final int? maxCompletions;
  final int currentCompletions;
  final DateTime? startsAt;
  final DateTime? endsAt;
  final bool isActive;
  final String icon;
  final String? badgeId;
  final DateTime createdAt;
  
  // Client-side state
  final bool isCompleted;

  const ZoneChallenge({
    required this.id,
    required this.eventId,
    required this.title,
    this.description,
    required this.challengeType,
    this.pointsReward = 10,
    this.targetData = const {},
    this.maxCompletions,
    this.currentCompletions = 0,
    this.startsAt,
    this.endsAt,
    this.isActive = true,
    this.icon = '🎯',
    this.badgeId,
    required this.createdAt,
    this.isCompleted = false,
  });

  /// Check if challenge is available
  bool get isAvailable {
    if (!isActive) return false;
    
    final now = DateTime.now();
    if (startsAt != null && now.isBefore(startsAt!)) return false;
    if (endsAt != null && now.isAfter(endsAt!)) return false;
    if (maxCompletions != null && currentCompletions >= maxCompletions!) return false;
    
    return true;
  }

  /// Get progress percentage
  double get progressPercentage {
    if (maxCompletions == null || maxCompletions == 0) return 0;
    return (currentCompletions / maxCompletions!).clamp(0.0, 1.0);
  }

  /// Get remaining slots
  int? get remainingSlots {
    if (maxCompletions == null) return null;
    return (maxCompletions! - currentCompletions).clamp(0, maxCompletions!);
  }

  factory ZoneChallenge.fromJson(Map<String, dynamic> json, {bool isCompleted = false}) {
    return ZoneChallenge(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      challengeType: ChallengeType.fromValue(json['challenge_type'] as String),
      pointsReward: json['points_reward'] as int? ?? 10,
      targetData: json['target_data'] as Map<String, dynamic>? ?? {},
      maxCompletions: json['max_completions'] as int?,
      currentCompletions: json['current_completions'] as int? ?? 0,
      startsAt: json['starts_at'] != null 
          ? DateTime.parse(json['starts_at'] as String) 
          : null,
      endsAt: json['ends_at'] != null 
          ? DateTime.parse(json['ends_at'] as String) 
          : null,
      isActive: json['is_active'] as bool? ?? true,
      icon: json['icon'] as String? ?? '🎯',
      badgeId: json['badge_id'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      isCompleted: isCompleted,
    );
  }
}

/// Represents a challenge completion record
class ZoneChallengeCompletion {
  final String id;
  final String challengeId;
  final String eventId;
  final String userId;
  final Map<String, dynamic>? proofData;
  final int pointsAwarded;
  final DateTime completedAt;

  const ZoneChallengeCompletion({
    required this.id,
    required this.challengeId,
    required this.eventId,
    required this.userId,
    this.proofData,
    required this.pointsAwarded,
    required this.completedAt,
  });

  factory ZoneChallengeCompletion.fromJson(Map<String, dynamic> json) {
    return ZoneChallengeCompletion(
      id: json['id'] as String,
      challengeId: json['challenge_id'] as String,
      eventId: json['event_id'] as String,
      userId: json['user_id'] as String,
      proofData: json['proof_data'] as Map<String, dynamic>?,
      pointsAwarded: json['points_awarded'] as int? ?? 0,
      completedAt: DateTime.parse(json['completed_at'] as String),
    );
  }
}
