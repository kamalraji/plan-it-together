import 'package:flutter/foundation.dart';

@immutable
class ImpactProfile {
  final String id;
  final String userId;
  final String fullName;
  final String? avatarUrl;
  final String? bio;
  final String? organization;
  final String headline;
  final List<String> lookingFor;
  final List<String> interests;
  final List<String> skills;
  final String relationshipStatus;
  final String educationStatus;
  final int impactScore;
  final int level;
  final List<String> badges;
  final String vibeEmoji;
  final String? currentEventId;
  final bool isOnline;
  final DateTime lastSeen;
  final int streakCount;
  final int streakActionsToday;
  final DateTime? lastStreakDate;
  final bool isPremium;
  final bool isVerified;
  final String? verificationType;
  final bool isBoosted;
  final DateTime? boostExpiresAt;
  final int superLikeCount;

  const ImpactProfile({
    required this.id,
    required this.userId,
    required this.fullName,
    this.avatarUrl,
    this.bio,
    this.organization,
    required this.headline,
    required this.lookingFor,
    required this.interests,
    required this.skills,
    required this.relationshipStatus,
    required this.educationStatus,
    required this.impactScore,
    required this.level,
    required this.badges,
    required this.vibeEmoji,
    this.currentEventId,
    required this.isOnline,
    required this.lastSeen,
    this.streakCount = 0,
    this.streakActionsToday = 0,
    this.lastStreakDate,
    this.isPremium = false,
    this.isVerified = false,
    this.verificationType,
    this.isBoosted = false,
    this.boostExpiresAt,
    this.superLikeCount = 0,
  });

  factory ImpactProfile.fromMap(Map<String, dynamic> map) {
    return ImpactProfile(
      id: map['id'] as String,
      userId: map['user_id'] as String,
      fullName: map['full_name'] as String? ?? 'User',
      avatarUrl: map['avatar_url'] as String?,
      bio: map['bio'] as String?,
      organization: map['organization'] as String?,
      headline: map['headline'] as String? ?? '',
      lookingFor: List<String>.from(map['looking_for'] ?? []),
      interests: List<String>.from(map['interests'] ?? []),
      skills: List<String>.from(map['skills'] ?? []),
      relationshipStatus: map['relationship_status'] as String? ?? 'OPEN_TO_CONNECT',
      educationStatus: map['education_status'] as String? ?? 'PROFESSIONAL',
      impactScore: map['impact_score'] as int? ?? 0,
      level: map['level'] as int? ?? 1,
      badges: List<String>.from(map['badges'] ?? []),
      vibeEmoji: map['vibe_emoji'] as String? ?? '🚀',
      currentEventId: map['current_event_id'] as String?,
      isOnline: map['is_online'] as bool? ?? false,
      lastSeen: DateTime.tryParse(map['last_seen'] ?? '') ?? DateTime.now(),
      streakCount: map['streak_count'] as int? ?? 0,
      streakActionsToday: map['streak_actions_today'] as int? ?? 0,
      lastStreakDate: map['last_streak_date'] != null 
          ? DateTime.tryParse(map['last_streak_date']) 
          : null,
      isPremium: map['is_premium'] as bool? ?? false,
      isVerified: map['is_verified'] as bool? ?? false,
      verificationType: map['verification_type'] as String?,
      isBoosted: map['is_boosted'] as bool? ?? false,
      boostExpiresAt: map['boost_expires_at'] != null 
          ? DateTime.tryParse(map['boost_expires_at']) 
          : null,
      superLikeCount: map['super_like_count'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'user_id': userId,
      'full_name': fullName,
      'avatar_url': avatarUrl,
      'bio': bio,
      'organization': organization,
      'headline': headline,
      'looking_for': lookingFor,
      'interests': interests,
      'skills': skills,
      'relationship_status': relationshipStatus,
      'education_status': educationStatus,
      'impact_score': impactScore,
      'level': level,
      'badges': badges,
      'vibe_emoji': vibeEmoji,
      'current_event_id': currentEventId,
      'is_online': isOnline,
      'last_seen': lastSeen.toIso8601String(),
      'streak_count': streakCount,
      'streak_actions_today': streakActionsToday,
      'last_streak_date': lastStreakDate?.toIso8601String(),
      'is_premium': isPremium,
      'is_verified': isVerified,
      'verification_type': verificationType,
      'is_boosted': isBoosted,
      'boost_expires_at': boostExpiresAt?.toIso8601String(),
      'super_like_count': superLikeCount,
    };
  }
}
