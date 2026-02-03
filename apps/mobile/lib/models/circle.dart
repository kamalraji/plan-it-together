import 'package:flutter/foundation.dart';

@immutable
class Circle {
  final String id;
  final String? eventId;
  final String name;
  final String? description;
  final String icon;
  final String type; // USER_CREATED, EVENT_GENERATED, SYSTEM
  final String category; // INTEREST, TOPIC, EVENT, NETWORKING
  final int memberCount;
  final bool isPrivate;
  final bool isPublic;
  final int? maxMembers;
  final List<String> tags;
  final String createdBy;
  final DateTime createdAt;

  const Circle({
    required this.id,
    this.eventId,
    required this.name,
    this.description,
    required this.icon,
    required this.type,
    required this.category,
    required this.memberCount,
    required this.isPrivate,
    required this.isPublic,
    this.maxMembers,
    required this.tags,
    required this.createdBy,
    required this.createdAt,
  });

  factory Circle.fromMap(Map<String, dynamic> map) {
    return Circle(
      id: map['id'] as String,
      eventId: map['event_id'] as String?,
      name: map['name'] as String? ?? 'Circle',
      description: map['description'] as String?,
      icon: map['icon'] as String? ?? '💬',
      type: map['type'] as String? ?? 'USER_CREATED',
      category: map['category'] as String? ?? 'INTEREST',
      memberCount: map['member_count'] as int? ?? 0,
      isPrivate: map['is_private'] as bool? ?? false,
      isPublic: map['is_public'] as bool? ?? true,
      maxMembers: map['max_members'] as int?,
      tags: List<String>.from(map['tags'] ?? []),
      createdBy: map['created_by'] as String,
      createdAt: DateTime.parse(map['created_at'] as String),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'event_id': eventId,
      'name': name,
      'description': description,
      'icon': icon,
      'type': type,
      'category': category,
      'member_count': memberCount,
      'is_private': isPrivate,
      'is_public': isPublic,
      'max_members': maxMembers,
      'tags': tags,
      'created_by': createdBy,
      'created_at': createdAt.toIso8601String(),
    };
  }
}

@immutable
class CircleMember {
  final String id;
  final String circleId;
  final String userId;
  final String role; // MEMBER, ADMIN, MODERATOR
  final DateTime joinedAt;
  final bool isMuted;
  final DateTime? mutedUntil;
  final DateTime? lastReadAt;
  final String? invitedBy;

  const CircleMember({
    this.id = '',
    required this.circleId,
    required this.userId,
    required this.role,
    required this.joinedAt,
    this.isMuted = false,
    this.mutedUntil,
    this.lastReadAt,
    this.invitedBy,
  });

  factory CircleMember.fromMap(Map<String, dynamic> map) {
    return CircleMember(
      id: map['id'] as String? ?? '',
      circleId: map['circle_id'] as String,
      userId: map['user_id'] as String,
      role: map['role'] as String? ?? 'MEMBER',
      joinedAt: DateTime.parse(map['joined_at'] as String),
      isMuted: map['is_muted'] as bool? ?? false,
      mutedUntil: map['muted_until'] != null 
          ? DateTime.parse(map['muted_until'] as String) 
          : null,
      lastReadAt: map['last_read_at'] != null 
          ? DateTime.parse(map['last_read_at'] as String) 
          : null,
      invitedBy: map['invited_by'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'circle_id': circleId,
      'user_id': userId,
      'role': role,
      'joined_at': joinedAt.toIso8601String(),
      'is_muted': isMuted,
      'muted_until': mutedUntil?.toIso8601String(),
      'last_read_at': lastReadAt?.toIso8601String(),
      'invited_by': invitedBy,
    };
  }
}

@immutable
class CircleMessage {
  final String id;
  final String circleId;
  final String userId;
  final String content;
  final DateTime createdAt;

  const CircleMessage({
    required this.id,
    required this.circleId,
    required this.userId,
    required this.content,
    required this.createdAt,
  });

  factory CircleMessage.fromMap(Map<String, dynamic> map) {
    return CircleMessage(
      id: map['id'] as String,
      circleId: map['circle_id'] as String,
      userId: map['user_id'] as String,
      content: map['content'] as String,
      createdAt: DateTime.parse(map['created_at'] as String),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'circle_id': circleId,
      'user_id': userId,
      'content': content,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
