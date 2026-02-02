import 'package:flutter/foundation.dart';

enum LookingForType {
  COFOUNDER,
  PROJECT_PARTNER,
  MENTOR,
  MENTEE,
  JOB,
  HIRE,
  FRIENDS,
  DATING,
  NETWORKING,
  STUDY_GROUP,
  HACKATHON_TEAM
}

enum RelationshipStatus { OPEN_TO_CONNECT, BUSY, LOOKING_FOR_PARTNER }

enum EducationStatus { STUDENT, GRADUATE, PROFESSIONAL, ENTREPRENEUR }

/// @deprecated Use FollowStatus from follower.dart instead
enum ConnectionStatus { PENDING, ACCEPTED, DECLINED }

enum CircleType { AUTO_GENERATED, USER_CREATED, OFFICIAL }

enum CircleCategory { INTEREST, SKILL, GOAL, LOCATION, RANDOM }

enum CircleMemberRole { ADMIN, MEMBER }

enum SparkPostType { IDEA, SEEKING, OFFERING, QUESTION, ANNOUNCEMENT }

enum SparkPostStatus { ACTIVE, RESOLVED, EXPIRED }

enum SparkReactionType { SPARK, INTERESTED, WORKING_ON_IT }

enum VibeGameType { QUICK_MATCH, TRIVIA, ICEBREAKER, POLL }

enum BadgeCategory { NETWORKING, COMMUNITY, CONTRIBUTION, SPECIAL }

enum BadgeRarity { COMMON, RARE, EPIC, LEGENDARY }

class ImpactProfile {
  final String id;
  final String userId;
  final String fullName;
  final String? avatarUrl;
  final String? bio;
  final String? organization;
  final String headline;
  final List<LookingForType> lookingFor;
  final List<String> interests;
  final List<String> skills;
  final RelationshipStatus relationshipStatus;
  final EducationStatus educationStatus;
  final int impactScore;
  final int level;
  final List<String> badges;
  final String vibeEmoji;
  final String? currentEventId;
  final bool isOnline;
  final DateTime lastSeen;

  ImpactProfile({
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
  });
}

/// @deprecated Use Follower from lib/models/follower.dart instead
/// This class is kept for backwards compatibility only
@Deprecated('Use Follower model instead - migration to unidirectional followers system')
class Connection {
  final String id;
  final String requesterId;
  final String receiverId;
  final ConnectionStatus status;
  final LookingForType connectionType;
  final int matchScore;
  final String? message;
  final DateTime createdAt;
  final DateTime? respondedAt;

  Connection({
    required this.id,
    required this.requesterId,
    required this.receiverId,
    required this.status,
    required this.connectionType,
    required this.matchScore,
    this.message,
    required this.createdAt,
    this.respondedAt,
  });
}

class Circle {
  final String id;
  final String eventId;
  final String name;
  final String description;
  final String icon;
  final CircleType type;
  final CircleCategory category;
  final int memberCount;
  final bool isPrivate;
  final int? maxMembers;
  final String createdBy;
  final DateTime createdAt;

  Circle({
    required this.id,
    required this.eventId,
    required this.name,
    required this.description,
    required this.icon,
    required this.type,
    required this.category,
    required this.memberCount,
    required this.isPrivate,
    this.maxMembers,
    required this.createdBy,
    required this.createdAt,
  });
}

class CircleMember {
  final String id;
  final String circleId;
  final String userId;
  final CircleMemberRole role;
  final DateTime joinedAt;

  CircleMember({
    required this.id,
    required this.circleId,
    required this.userId,
    required this.role,
    required this.joinedAt,
  });
}

class SparkPost {
  final String id;
  final String eventId;
  final String authorId;
  final SparkPostType type;
  final String title;
  final String content;
  final List<String> tags;
  final int sparkCount;
  final int commentCount;
  final bool isAnonymous;
  final SparkPostStatus status;
  final DateTime createdAt;
  final DateTime? expiresAt;

  SparkPost({
    required this.id,
    required this.eventId,
    required this.authorId,
    required this.type,
    required this.title,
    required this.content,
    required this.tags,
    required this.sparkCount,
    required this.commentCount,
    required this.isAnonymous,
    required this.status,
    required this.createdAt,
    this.expiresAt,
  });
}

class SparkReaction {
  final String id;
  final String postId;
  final String userId;
  final SparkReactionType type;
  final DateTime createdAt;

  SparkReaction({
    required this.id,
    required this.postId,
    required this.userId,
    required this.type,
    required this.createdAt,
  });
}

class VibeGame {
  final String id;
  final String eventId;
  final String name;
  final VibeGameType type;
  final String question;
  final List<String> options;
  final int? correctAnswer;
  final DateTime expiresAt;
  final int participantCount;

  VibeGame({
    required this.id,
    required this.eventId,
    required this.name,
    required this.type,
    required this.question,
    required this.options,
    this.correctAnswer,
    required this.expiresAt,
    required this.participantCount,
  });
}

class Badge {
  final String id;
  final String name;
  final String description;
  final String icon;
  final BadgeCategory category;
  final int pointsRequired;
  final BadgeRarity rarity;

  Badge({
    required this.id,
    required this.name,
    required this.description,
    required this.icon,
    required this.category,
    required this.pointsRequired,
    required this.rarity,
  });
}
