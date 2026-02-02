/// Group event types for tracking group activities
enum GroupEventType {
  memberJoined,
  memberLeft,
  memberRemoved,
  roleChanged,
  groupUpdated,
  iconUpdated,
  memberInvited;

  String get displayName {
    switch (this) {
      case GroupEventType.memberJoined:
        return 'joined the group';
      case GroupEventType.memberLeft:
        return 'left the group';
      case GroupEventType.memberRemoved:
        return 'was removed from the group';
      case GroupEventType.roleChanged:
        return 'role was changed';
      case GroupEventType.groupUpdated:
        return 'updated the group';
      case GroupEventType.iconUpdated:
        return 'updated the group icon';
      case GroupEventType.memberInvited:
        return 'was invited to the group';
    }
  }

  static GroupEventType fromString(String value) {
    switch (value.toLowerCase()) {
      case 'member_joined':
        return GroupEventType.memberJoined;
      case 'member_left':
        return GroupEventType.memberLeft;
      case 'member_removed':
        return GroupEventType.memberRemoved;
      case 'role_changed':
        return GroupEventType.roleChanged;
      case 'group_updated':
        return GroupEventType.groupUpdated;
      case 'icon_updated':
        return GroupEventType.iconUpdated;
      case 'member_invited':
        return GroupEventType.memberInvited;
      default:
        return GroupEventType.memberJoined;
    }
  }

  String get databaseValue {
    switch (this) {
      case GroupEventType.memberJoined:
        return 'member_joined';
      case GroupEventType.memberLeft:
        return 'member_left';
      case GroupEventType.memberRemoved:
        return 'member_removed';
      case GroupEventType.roleChanged:
        return 'role_changed';
      case GroupEventType.groupUpdated:
        return 'group_updated';
      case GroupEventType.iconUpdated:
        return 'icon_updated';
      case GroupEventType.memberInvited:
        return 'member_invited';
    }
  }
}

/// Group event model for activity tracking
class GroupEvent {
  final String id;
  final String groupId;
  final GroupEventType eventType;
  final String actorId;
  final String? actorName;
  final String? targetId;
  final String? targetName;
  final String? oldValue;
  final String? newValue;
  final DateTime createdAt;

  const GroupEvent({
    required this.id,
    required this.groupId,
    required this.eventType,
    required this.actorId,
    this.actorName,
    this.targetId,
    this.targetName,
    this.oldValue,
    this.newValue,
    required this.createdAt,
  });

  factory GroupEvent.fromJson(Map<String, dynamic> json) {
    return GroupEvent(
      id: json['id'] as String,
      groupId: json['group_id'] as String,
      eventType: GroupEventType.fromString(json['event_type'] as String),
      actorId: json['actor_id'] as String,
      actorName: json['actor_name'] as String?,
      targetId: json['target_id'] as String?,
      targetName: json['target_name'] as String?,
      oldValue: json['old_value'] as String?,
      newValue: json['new_value'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'group_id': groupId,
    'event_type': eventType.databaseValue,
    'actor_id': actorId,
    'actor_name': actorName,
    'target_id': targetId,
    'target_name': targetName,
    'old_value': oldValue,
    'new_value': newValue,
    'created_at': createdAt.toIso8601String(),
  };

  /// Generate a human-readable message for the event
  String get message {
    final actor = actorName ?? 'Someone';
    final target = targetName ?? 'a member';

    switch (eventType) {
      case GroupEventType.memberJoined:
        return '$actor joined the group';
      case GroupEventType.memberLeft:
        return '$actor left the group';
      case GroupEventType.memberRemoved:
        return '$target was removed by $actor';
      case GroupEventType.roleChanged:
        return '$target\'s role was changed to $newValue by $actor';
      case GroupEventType.groupUpdated:
        return '$actor updated the group';
      case GroupEventType.iconUpdated:
        return '$actor updated the group icon';
      case GroupEventType.memberInvited:
        return '$target was invited by $actor';
    }
  }
}
