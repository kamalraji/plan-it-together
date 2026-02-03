import 'package:flutter/foundation.dart';

@immutable
class SkillEndorsement {
  final String id;
  final String endorsedUserId;
  final String endorserUserId;
  final String skill;
  final DateTime createdAt;
  
  // Optional: populated from join
  final String? endorserName;
  final String? endorserAvatarUrl;

  const SkillEndorsement({
    required this.id,
    required this.endorsedUserId,
    required this.endorserUserId,
    required this.skill,
    required this.createdAt,
    this.endorserName,
    this.endorserAvatarUrl,
  });

  factory SkillEndorsement.fromMap(Map<String, dynamic> map) {
    return SkillEndorsement(
      id: map['id'] as String,
      endorsedUserId: map['endorsed_user_id'] as String,
      endorserUserId: map['endorser_user_id'] as String,
      skill: map['skill'] as String? ?? '',
      createdAt: DateTime.tryParse(map['created_at'] ?? '') ?? DateTime.now(),
      endorserName: map['endorser_name'] as String?,
      endorserAvatarUrl: map['endorser_avatar_url'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'endorsed_user_id': endorsedUserId,
      'endorser_user_id': endorserUserId,
      'skill': skill,
    };
  }
}

/// Aggregated endorsement count per skill
@immutable
class SkillEndorsementSummary {
  final String skill;
  final int count;
  final List<EndorserInfo> topEndorsers;

  const SkillEndorsementSummary({
    required this.skill,
    required this.count,
    required this.topEndorsers,
  });
}

@immutable
class EndorserInfo {
  final String userId;
  final String name;
  final String? avatarUrl;

  const EndorserInfo({
    required this.userId,
    required this.name,
    this.avatarUrl,
  });
}
