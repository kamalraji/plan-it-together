import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'impact_profile.dart';
import 'match_insight.dart';

/// Represents a 1-on-1 meeting request between two attendees
@immutable
class NetworkingMeeting {
  final String id;
  final String eventId;
  final String requesterId;
  final String receiverId;
  final DateTime proposedTime;
  final String? proposedLocation;
  final String status; // PENDING, ACCEPTED, DECLINED, COMPLETED, CANCELLED
  final String? message;
  final DateTime createdAt;
  final DateTime? respondedAt;

  // Joined profile data for display
  final String? otherUserName;
  final String? otherUserAvatar;
  final String? otherUserHeadline;
  final int matchScore;

  const NetworkingMeeting({
    required this.id,
    required this.eventId,
    required this.requesterId,
    required this.receiverId,
    required this.proposedTime,
    this.proposedLocation,
    required this.status,
    this.message,
    required this.createdAt,
    this.respondedAt,
    this.otherUserName,
    this.otherUserAvatar,
    this.otherUserHeadline,
    this.matchScore = 0,
  });

  bool get isPending => status == 'PENDING';
  bool get isAccepted => status == 'ACCEPTED';
  bool get isDeclined => status == 'DECLINED';
  bool get isCompleted => status == 'COMPLETED';
  bool get isCancelled => status == 'CANCELLED';
  bool get isUpcoming => isAccepted && proposedTime.isAfter(DateTime.now());

  factory NetworkingMeeting.fromMap(Map<String, dynamic> map, {String? currentUserId}) {
    final requesterId = map['requester_id'] as String;
    final isRequester = currentUserId == requesterId;

    // Get the other user's profile data
    String? otherName;
    String? otherAvatar;
    String? otherHeadline;

    if (isRequester && map['receiver_profile'] != null) {
      final profile = map['receiver_profile'] as Map<String, dynamic>;
      otherName = profile['full_name'] as String?;
      otherAvatar = profile['avatar_url'] as String?;
      otherHeadline = profile['headline'] as String?;
    } else if (!isRequester && map['requester_profile'] != null) {
      final profile = map['requester_profile'] as Map<String, dynamic>;
      otherName = profile['full_name'] as String?;
      otherAvatar = profile['avatar_url'] as String?;
      otherHeadline = profile['headline'] as String?;
    }

    return NetworkingMeeting(
      id: map['id'] as String,
      eventId: map['event_id'] as String,
      requesterId: requesterId,
      receiverId: map['receiver_id'] as String,
      proposedTime: DateTime.parse(map['proposed_time'] as String),
      proposedLocation: map['proposed_location'] as String?,
      status: map['status'] as String,
      message: map['message'] as String?,
      createdAt: DateTime.parse(map['created_at'] as String),
      respondedAt: map['responded_at'] != null
          ? DateTime.parse(map['responded_at'] as String)
          : null,
      otherUserName: otherName,
      otherUserAvatar: otherAvatar,
      otherUserHeadline: otherHeadline,
      matchScore: map['match_score'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'event_id': eventId,
      'requester_id': requesterId,
      'receiver_id': receiverId,
      'proposed_time': proposedTime.toIso8601String(),
      'proposed_location': proposedLocation,
      'status': status,
      'message': message,
      'created_at': createdAt.toIso8601String(),
      'responded_at': respondedAt?.toIso8601String(),
    };
  }
}

/// Represents an icebreaker question for an event
@immutable
class EventIcebreaker {
  final String id;
  final String eventId;
  final String question;
  final bool isActive;
  final int orderIndex;
  final DateTime createdAt;
  final int answerCount;
  final String? myAnswer;

  const EventIcebreaker({
    required this.id,
    required this.eventId,
    required this.question,
    required this.isActive,
    required this.orderIndex,
    required this.createdAt,
    this.answerCount = 0,
    this.myAnswer,
  });

  factory EventIcebreaker.fromMap(Map<String, dynamic> map) {
    return EventIcebreaker(
      id: map['id'] as String,
      eventId: map['event_id'] as String,
      question: map['question'] as String,
      isActive: map['is_active'] as bool? ?? false,
      orderIndex: map['order_index'] as int? ?? 0,
      createdAt: DateTime.parse(map['created_at'] as String),
      answerCount: map['answer_count'] as int? ?? 0,
      myAnswer: map['my_answer'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'event_id': eventId,
      'question': question,
      'is_active': isActive,
      'order_index': orderIndex,
      'created_at': createdAt.toIso8601String(),
    };
  }
}

/// Represents a user's answer to an icebreaker question
@immutable
class IcebreakerAnswer {
  final String id;
  final String icebreakerId;
  final String userId;
  final String answer;
  final DateTime createdAt;

  // Joined profile data
  final String? userName;
  final String? userAvatar;

  const IcebreakerAnswer({
    required this.id,
    required this.icebreakerId,
    required this.userId,
    required this.answer,
    required this.createdAt,
    this.userName,
    this.userAvatar,
  });

  factory IcebreakerAnswer.fromMap(Map<String, dynamic> map) {
    String? name;
    String? avatar;

    if (map['user_profile'] != null) {
      final profile = map['user_profile'] as Map<String, dynamic>;
      name = profile['full_name'] as String?;
      avatar = profile['avatar_url'] as String?;
    }

    return IcebreakerAnswer(
      id: map['id'] as String,
      icebreakerId: map['icebreaker_id'] as String,
      userId: map['user_id'] as String,
      answer: map['answer'] as String,
      createdAt: DateTime.parse(map['created_at'] as String),
      userName: name,
      userAvatar: avatar,
    );
  }
}

/// Represents a smart match with AI-powered insights
@immutable
class SmartMatch {
  final ImpactProfile profile;
  final MatchResult matchResult;
  final bool isOnline;
  final DateTime? lastSeen;
  final String? sharedIcebreakerAnswer;
  final String? currentLocation;
  
  // AI-enhanced fields
  final double? embeddingSimilarity;
  final double? interactionScore;
  final double? freshnessScore;
  final double? reciprocityScore;
  final double? contextScore;
  final String? matchCategory;
  final List<String> commonSkills;
  final List<String> commonInterests;
  final bool followsYou;
  final bool youFollow;
  final bool hasPendingMeeting;
  
  // AI-generated content
  final String? matchNarrative;
  final List<String> conversationStarters;
  final List<String> collaborationIdeas;

  const SmartMatch({
    required this.profile,
    required this.matchResult,
    this.isOnline = false,
    this.lastSeen,
    this.sharedIcebreakerAnswer,
    this.currentLocation,
    this.embeddingSimilarity,
    this.interactionScore,
    this.freshnessScore,
    this.reciprocityScore,
    this.contextScore,
    this.matchCategory,
    this.commonSkills = const [],
    this.commonInterests = const [],
    this.followsYou = false,
    this.youFollow = false,
    this.hasPendingMeeting = false,
    this.matchNarrative,
    this.conversationStarters = const [],
    this.collaborationIdeas = const [],
  });

  int get matchScore => matchResult.totalScore;
  
  /// Create from AI matches RPC response
  factory SmartMatch.fromAIMatch(Map<String, dynamic> data) {
    // Build profile from RPC data
    final profile = ImpactProfile(
      id: data['user_id'] as String? ?? '',
      userId: data['user_id'] as String? ?? '',
      fullName: data['full_name'] as String? ?? 'Unknown',
      avatarUrl: data['avatar_url'] as String?,
      headline: data['headline'] as String? ?? '',
      bio: data['bio'] as String?,
      organization: data['organization'] as String?,
      skills: List<String>.from(data['skills'] ?? []),
      interests: List<String>.from(data['interests'] ?? []),
      lookingFor: List<String>.from(data['looking_for'] ?? []),
      isOnline: data['is_online'] as bool? ?? false,
      isVerified: data['is_verified'] as bool? ?? false,
      isPremium: data['is_premium'] as bool? ?? false,
      relationshipStatus: data['relationship_status'] as String? ?? 'single',
      educationStatus: data['education_status'] as String? ?? '',
      impactScore: data['impact_score'] as int? ?? 0,
      level: data['level'] as int? ?? 1,
      badges: List<String>.from(data['badges'] ?? []),
      vibeEmoji: data['vibe_emoji'] as String? ?? '✨',
      lastSeen: DateTime.now(),
    );
    
    final finalScore = ((data['final_score'] as num? ?? 0.5) * 100).round();
    final matchCat = data['match_category'] as String? ?? 'discovery';
    
    // Map match category to MatchCategory enum
    MatchCategory? primaryCategory;
    switch (matchCat) {
      case 'professional':
        primaryCategory = MatchCategory.skills;
        break;
      case 'mutual_interest':
        primaryCategory = MatchCategory.network;
        break;
      case 'similar_background':
        primaryCategory = MatchCategory.interests;
        break;
      case 'event_connection':
        primaryCategory = MatchCategory.activity;
        break;
      default:
        primaryCategory = null;
    }
    
    // Build insights from common skills/interests
    final commonSkills = List<String>.from(data['common_skills'] ?? []);
    final commonInterests = List<String>.from(data['common_interests'] ?? []);
    final insights = <MatchInsight>[];
    
    if (commonSkills.isNotEmpty) {
      insights.add(MatchInsight(
        category: MatchCategory.skills,
        title: 'Shared Skills',
        description: 'You both know ${commonSkills.take(3).join(", ")}',
        items: commonSkills,
        contribution: (commonSkills.length * 8).clamp(0, 40),
        icon: MatchInsight.categoryMeta[MatchCategory.skills]!.icon,
        color: MatchInsight.categoryMeta[MatchCategory.skills]!.color,
      ));
    }
    
    if (commonInterests.isNotEmpty) {
      insights.add(MatchInsight(
        category: MatchCategory.interests,
        title: 'Common Interests',
        description: 'You both enjoy ${commonInterests.take(3).join(", ")}',
        items: commonInterests,
        contribution: (commonInterests.length * 6).clamp(0, 30),
        icon: MatchInsight.categoryMeta[MatchCategory.interests]!.icon,
        color: MatchInsight.categoryMeta[MatchCategory.interests]!.color,
      ));
    }
    
    final matchResult = MatchResult(
      totalScore: finalScore,
      insights: insights,
      summaryIcon: _getSummaryIcon(finalScore),
      summaryText: _getSummaryText(finalScore, matchCat),
      primaryCategory: primaryCategory,
    );
    
    return SmartMatch(
      profile: profile,
      matchResult: matchResult,
      isOnline: data['is_online'] as bool? ?? false,
      embeddingSimilarity: (data['embedding_similarity'] as num?)?.toDouble(),
      interactionScore: (data['interaction_score'] as num?)?.toDouble(),
      freshnessScore: (data['freshness_score'] as num?)?.toDouble(),
      reciprocityScore: (data['reciprocity_score'] as num?)?.toDouble(),
      contextScore: (data['context_score'] as num?)?.toDouble(),
      matchCategory: matchCat,
      commonSkills: commonSkills,
      commonInterests: commonInterests,
      followsYou: data['follows_you'] as bool? ?? false,
      youFollow: data['you_follow'] as bool? ?? false,
      hasPendingMeeting: data['has_pending_meeting'] as bool? ?? false,
    );
  }
  
  static IconData _getSummaryIcon(int score) {
    if (score >= 85) return Icons.local_fire_department_rounded;
    if (score >= 70) return Icons.star_rounded;
    if (score >= 50) return Icons.thumb_up_rounded;
    return Icons.person_add_rounded;
  }
  
  static String _getSummaryText(int score, String category) {
    final catLabel = {
      'professional': 'professional match',
      'mutual_interest': 'mutual interest',
      'similar_background': 'similar background',
      'event_connection': 'event connection',
      'discovery': 'new connection',
    }[category] ?? 'match';
    
    if (score >= 85) return 'Excellent $catLabel';
    if (score >= 70) return 'Strong $catLabel';
    if (score >= 50) return 'Good $catLabel';
    return 'Potential $catLabel';
  }
}

/// Represents a contact exchange between two users
@immutable
class ContactExchange {
  final String id;
  final String eventId;
  final String userId;
  final String targetUserId;
  final Map<String, dynamic> sharedFields;
  final DateTime createdAt;

  // Joined profile data
  final String? targetUserName;
  final String? targetUserAvatar;
  final String? targetUserHeadline;

  const ContactExchange({
    required this.id,
    required this.eventId,
    required this.userId,
    required this.targetUserId,
    required this.sharedFields,
    required this.createdAt,
    this.targetUserName,
    this.targetUserAvatar,
    this.targetUserHeadline,
  });

  factory ContactExchange.fromMap(Map<String, dynamic> map, {String? currentUserId}) {
    String? name;
    String? avatar;
    String? headline;

    // Get the other user's profile (the one we exchanged with)
    final userId = map['user_id'] as String;
    final targetUserId = map['target_user_id'] as String;
    final isSharer = currentUserId == userId;

    if (isSharer && map['target_profile'] != null) {
      final profile = map['target_profile'] as Map<String, dynamic>;
      name = profile['full_name'] as String?;
      avatar = profile['avatar_url'] as String?;
      headline = profile['headline'] as String?;
    } else if (!isSharer && map['user_profile'] != null) {
      final profile = map['user_profile'] as Map<String, dynamic>;
      name = profile['full_name'] as String?;
      avatar = profile['avatar_url'] as String?;
      headline = profile['headline'] as String?;
    }

    return ContactExchange(
      id: map['id'] as String,
      eventId: map['event_id'] as String,
      userId: userId,
      targetUserId: targetUserId,
      sharedFields: Map<String, dynamic>.from(map['shared_fields'] ?? {}),
      createdAt: DateTime.parse(map['created_at'] as String),
      targetUserName: name,
      targetUserAvatar: avatar,
      targetUserHeadline: headline,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'event_id': eventId,
      'user_id': userId,
      'target_user_id': targetUserId,
      'shared_fields': sharedFields,
      'created_at': createdAt.toIso8601String(),
    };
  }

  bool get hasEmail => sharedFields['email'] == true;
  bool get hasPhone => sharedFields['phone'] == true;
  bool get hasLinkedIn => sharedFields['linkedin'] == true;
}

/// Predefined meeting locations for networking events
class MeetingLocation {
  static const List<String> defaults = [
    'Coffee Area',
    'Networking Lounge',
    'Main Hall',
    'Food Court',
    'Outdoor Area',
    'Other',
  ];
}
