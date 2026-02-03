import 'package:flutter/foundation.dart';

@immutable
class Space {
  final String id;
  final String topic;
  final String? hostId;
  final String? createdBy;
  final DateTime createdAt;
  final List<String> tags;
  final bool isLive;

  const Space({
    required this.id,
    required this.topic,
    this.hostId,
    this.createdBy,
    required this.createdAt,
    this.tags = const [],
    required this.isLive,
  });

  factory Space.fromMap(Map<String, dynamic> map) {
    return Space(
      id: map['id'] as String,
      topic: map['topic'] as String? ?? 'Space',
      hostId: map['host_id'] as String?,
      createdBy: map['created_by'] as String?,
      createdAt: DateTime.parse(map['created_at'] as String),
      tags: List<String>.from(map['tags'] ?? []),
      isLive: map['is_live'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'topic': topic,
      'host_id': hostId,
      'created_by': createdBy,
      'created_at': createdAt.toIso8601String(),
      'tags': tags,
      'is_live': isLive,
    };
  }
}

@immutable
class SpaceSpeaker {
  final String spaceId;
  final String userId;
  final DateTime joinedAt;
  final bool isMuted;

  const SpaceSpeaker({
    required this.spaceId,
    required this.userId,
    required this.joinedAt,
    required this.isMuted,
  });

  factory SpaceSpeaker.fromMap(Map<String, dynamic> map) {
    return SpaceSpeaker(
      spaceId: map['space_id'] as String,
      userId: map['user_id'] as String,
      joinedAt: DateTime.parse(map['joined_at'] as String),
      isMuted: map['is_muted'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'space_id': spaceId,
      'user_id': userId,
      'joined_at': joinedAt.toIso8601String(),
      'is_muted': isMuted,
    };
  }
}

@immutable
class SpaceAudience {
  final String spaceId;
  final String userId;
  final DateTime joinedAt;

  const SpaceAudience({
    required this.spaceId,
    required this.userId,
    required this.joinedAt,
  });

  factory SpaceAudience.fromMap(Map<String, dynamic> map) {
    return SpaceAudience(
      spaceId: map['space_id'] as String,
      userId: map['user_id'] as String,
      joinedAt: DateTime.parse(map['joined_at'] as String),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'space_id': spaceId,
      'user_id': userId,
      'joined_at': joinedAt.toIso8601String(),
    };
  }
}
