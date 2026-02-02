import 'package:flutter/foundation.dart';

/// Notification type enum with case-insensitive parsing for database compatibility
/// Uses camelCase names internally but handles UPPER_SNAKE_CASE from database
enum NotificationType {
  // Follower notifications (Instagram/Twitter style)
  newFollower,
  followRequest,
  followAccepted,
  mutualFollow,
  
  // Legacy connection notifications (deprecated, kept for backwards compatibility)
  connectionRequest,
  connectionAccepted,
  mutualConnection,
  
  // Social notifications
  circleInvite,
  sparkReaction,
  highMatchOnline,
  
  // Comment notifications
  comment,
  commentReply,
  mention,
  
  // Achievement notifications
  newBadge,
  levelUp,
  
  // Group notifications
  groupInvite,
  groupMemberJoined,
  groupMemberLeft,
  groupRoleChanged,
  groupRemoved,
  groupEvent,
  
  // System notifications
  system,
  eventReminder,
  workspaceUpdate,
}

/// Extension for display names, icons, and database conversion
extension NotificationTypeX on NotificationType {
  String get displayName {
    switch (this) {
      // Follower notifications
      case NotificationType.newFollower:
        return 'New Follower';
      case NotificationType.followRequest:
        return 'Follow Request';
      case NotificationType.followAccepted:
        return 'Request Accepted';
      case NotificationType.mutualFollow:
        return 'Mutual Follow';
      // Legacy connection notifications (mapped to follower labels)
      case NotificationType.connectionRequest:
        return 'Follow Request';
      case NotificationType.connectionAccepted:
        return 'Follow Accepted';
      case NotificationType.mutualConnection:
        return 'Mutual Follow';
      case NotificationType.circleInvite:
        return 'Circle Invite';
      case NotificationType.sparkReaction:
        return 'Spark Reaction';
      case NotificationType.highMatchOnline:
        return 'Match Online';
      case NotificationType.comment:
        return 'Comment';
      case NotificationType.commentReply:
        return 'Reply';
      case NotificationType.mention:
        return 'Mention';
      case NotificationType.newBadge:
        return 'New Badge';
      case NotificationType.levelUp:
        return 'Level Up';
      case NotificationType.groupInvite:
        return 'Group Invite';
      case NotificationType.groupMemberJoined:
        return 'Member Joined';
      case NotificationType.groupMemberLeft:
        return 'Member Left';
      case NotificationType.groupRoleChanged:
        return 'Role Changed';
      case NotificationType.groupRemoved:
        return 'Removed from Group';
      case NotificationType.groupEvent:
        return 'Group Event';
      case NotificationType.system:
        return 'System';
      case NotificationType.eventReminder:
        return 'Event Reminder';
      case NotificationType.workspaceUpdate:
        return 'Workspace Update';
    }
  }
  
  /// Whether this notification type is considered urgent (bypasses quiet hours)
  bool get isUrgent {
    switch (this) {
      case NotificationType.followRequest:
      case NotificationType.connectionRequest:
      case NotificationType.groupInvite:
      case NotificationType.system:
        return true;
      default:
        return false;
    }
  }
  
  /// Category for grouping in UI
  String get category {
    switch (this) {
      // Followers category
      case NotificationType.newFollower:
      case NotificationType.followRequest:
      case NotificationType.followAccepted:
      case NotificationType.mutualFollow:
        return 'followers';
      // Legacy connections (now grouped with followers)
      case NotificationType.connectionRequest:
      case NotificationType.connectionAccepted:
      case NotificationType.mutualConnection:
        return 'followers';
      case NotificationType.sparkReaction:
      case NotificationType.comment:
      case NotificationType.commentReply:
      case NotificationType.mention:
        return 'reactions';
      case NotificationType.circleInvite:
      case NotificationType.groupInvite:
      case NotificationType.groupMemberJoined:
      case NotificationType.groupMemberLeft:
      case NotificationType.groupRoleChanged:
      case NotificationType.groupRemoved:
      case NotificationType.groupEvent:
        return 'groups';
      case NotificationType.newBadge:
      case NotificationType.levelUp:
        return 'achievements';
      case NotificationType.highMatchOnline:
        return 'matches';
      default:
        return 'system';
    }
  }
  
  /// Convert to database format (UPPER_SNAKE_CASE)
  String get dbValue {
    // Convert camelCase to UPPER_SNAKE_CASE
    final buffer = StringBuffer();
    for (int i = 0; i < name.length; i++) {
      final char = name[i];
      if (char.toUpperCase() == char && i > 0) {
        buffer.write('_');
      }
      buffer.write(char.toUpperCase());
    }
    return buffer.toString();
  }
  
  /// Parse from database value (handles multiple formats)
  static NotificationType fromDbValue(String? value) {
    if (value == null || value.isEmpty) return NotificationType.system;
    
    // Normalize: remove underscores and convert to lowercase for comparison
    final normalized = value.toLowerCase().replaceAll('_', '');
    
    for (final type in NotificationType.values) {
      if (type.name.toLowerCase() == normalized) {
        return type;
      }
    }
    
    // Fallback: try exact name match (for camelCase stored values)
    for (final type in NotificationType.values) {
      if (type.name == value) {
        return type;
      }
    }
    
    return NotificationType.system;
  }
}

/// Represents a single notification item
@immutable
class NotificationItem {
  final String id;
  final String userId;
  final NotificationType type;
  final String title;
  final String message;
  final String? avatarUrl;
  final String? actionUrl;
  final String? groupKey;
  final bool read;
  final DateTime createdAt;

  const NotificationItem({
    required this.id,
    required this.userId,
    required this.type,
    required this.title,
    required this.message,
    this.avatarUrl,
    this.actionUrl,
    this.groupKey,
    this.read = false,
    required this.createdAt,
  });

  /// Alias for backwards compatibility
  bool get isRead => read;

  /// Parse from database map with case-insensitive type matching
  factory NotificationItem.fromMap(Map<String, dynamic> map) {
    return NotificationItem(
      id: map['id'] as String,
      userId: map['user_id'] as String,
      type: NotificationTypeX.fromDbValue(map['type'] as String?),
      title: map['title'] as String? ?? '',
      message: map['message'] as String? ?? '',
      avatarUrl: map['avatar_url'] as String?,
      actionUrl: map['action_url'] as String?,
      groupKey: map['group_key'] as String?,
      read: map['read'] as bool? ?? false,
      createdAt: DateTime.tryParse(map['created_at'] as String? ?? '') ?? DateTime.now(),
    );
  }

  /// Convert to map for database insert
  Map<String, dynamic> toMap() => {
    'id': id,
    'user_id': userId,
    'type': type.dbValue,
    'title': title,
    'message': message,
    'avatar_url': avatarUrl,
    'action_url': actionUrl,
    'group_key': groupKey,
    'read': read,
    'created_at': createdAt.toIso8601String(),
  };

  /// Create copy with updated fields
  NotificationItem copyWith({
    bool? read,
    bool? isRead, // Alias for backwards compatibility
    String? groupKey,
  }) {
    return NotificationItem(
      id: id,
      userId: userId,
      type: type,
      title: title,
      message: message,
      avatarUrl: avatarUrl,
      actionUrl: actionUrl,
      groupKey: groupKey ?? this.groupKey,
      read: read ?? isRead ?? this.read,
      createdAt: createdAt,
    );
  }

  @override
  String toString() => 'NotificationItem(id: $id, type: ${type.name}, title: $title)';
}
