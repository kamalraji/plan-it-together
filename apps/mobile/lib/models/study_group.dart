import 'package:flutter/foundation.dart';

@immutable
class StudyGroup {
  final String id;
  final String name;
  final String? description;
  final String? college;
  final String? major;
  final List<String> courses;
  final int maxMembers;
  final int memberCount;
  final String createdBy;
  final bool isActive;
  final DateTime createdAt;

  const StudyGroup({
    required this.id,
    required this.name,
    this.description,
    this.college,
    this.major,
    required this.courses,
    required this.maxMembers,
    required this.memberCount,
    required this.createdBy,
    required this.isActive,
    required this.createdAt,
  });

  factory StudyGroup.fromMap(Map<String, dynamic> map) {
    return StudyGroup(
      id: map['id'] as String,
      name: map['name'] as String,
      description: map['description'] as String?,
      college: map['college'] as String?,
      major: map['major'] as String?,
      courses: List<String>.from(map['courses'] ?? []),
      maxMembers: map['max_members'] as int? ?? 10,
      memberCount: map['member_count'] as int? ?? 0,
      createdBy: map['created_by'] as String,
      isActive: map['is_active'] as bool? ?? true,
      createdAt: DateTime.tryParse(map['created_at'] ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'college': college,
      'major': major,
      'courses': courses,
      'max_members': maxMembers,
      'member_count': memberCount,
      'created_by': createdBy,
      'is_active': isActive,
      'created_at': createdAt.toIso8601String(),
    };
  }

  bool get isFull => memberCount >= maxMembers;
}

@immutable
class StudyGroupMember {
  final String id;
  final String groupId;
  final String userId;
  final String role;
  final DateTime joinedAt;

  const StudyGroupMember({
    required this.id,
    required this.groupId,
    required this.userId,
    required this.role,
    required this.joinedAt,
  });

  factory StudyGroupMember.fromMap(Map<String, dynamic> map) {
    return StudyGroupMember(
      id: map['id'] as String,
      groupId: map['group_id'] as String,
      userId: map['user_id'] as String,
      role: map['role'] as String? ?? 'member',
      joinedAt: DateTime.tryParse(map['joined_at'] ?? '') ?? DateTime.now(),
    );
  }
}
