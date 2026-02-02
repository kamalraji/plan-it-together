import 'package:flutter/foundation.dart';

/// Reaction to a circle message
@immutable
class CircleMessageReaction {
  final String id;
  final String messageId;
  final String userId;
  final String emoji;
  final DateTime createdAt;

  // Joined fields (optional)
  final String? userName;
  final String? userAvatar;

  const CircleMessageReaction({
    required this.id,
    required this.messageId,
    required this.userId,
    required this.emoji,
    required this.createdAt,
    this.userName,
    this.userAvatar,
  });

  factory CircleMessageReaction.fromMap(Map<String, dynamic> map) {
    return CircleMessageReaction(
      id: map['id'] as String,
      messageId: map['message_id'] as String,
      userId: map['user_id'] as String,
      emoji: map['emoji'] as String,
      createdAt: DateTime.parse(map['created_at'] as String),
      userName: map['user_name'] as String?,
      userAvatar: map['user_avatar'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'message_id': messageId,
      'user_id': userId,
      'emoji': emoji,
      'created_at': createdAt.toIso8601String(),
    };
  }

  CircleMessageReaction copyWith({
    String? id,
    String? messageId,
    String? userId,
    String? emoji,
    DateTime? createdAt,
    String? userName,
    String? userAvatar,
  }) {
    return CircleMessageReaction(
      id: id ?? this.id,
      messageId: messageId ?? this.messageId,
      userId: userId ?? this.userId,
      emoji: emoji ?? this.emoji,
      createdAt: createdAt ?? this.createdAt,
      userName: userName ?? this.userName,
      userAvatar: userAvatar ?? this.userAvatar,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CircleMessageReaction &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;
}

/// Grouped reactions by emoji for display
@immutable
class GroupedCircleReaction {
  final String emoji;
  final int count;
  final bool reactedByMe;
  final List<String> userIds;
  final List<String> userNames;

  const GroupedCircleReaction({
    required this.emoji,
    required this.count,
    required this.reactedByMe,
    required this.userIds,
    this.userNames = const [],
  });

  /// Create from list of reactions
  factory GroupedCircleReaction.fromReactions(
    String emoji,
    List<CircleMessageReaction> reactions,
    String currentUserId,
  ) {
    return GroupedCircleReaction(
      emoji: emoji,
      count: reactions.length,
      reactedByMe: reactions.any((r) => r.userId == currentUserId),
      userIds: reactions.map((r) => r.userId).toList(),
      userNames: reactions
          .where((r) => r.userName != null)
          .map((r) => r.userName!)
          .toList(),
    );
  }

  /// Group reactions by emoji
  static List<GroupedCircleReaction> groupReactions(
    List<CircleMessageReaction> reactions,
    String currentUserId,
  ) {
    final Map<String, List<CircleMessageReaction>> grouped = {};
    for (final reaction in reactions) {
      grouped.putIfAbsent(reaction.emoji, () => []).add(reaction);
    }
    return grouped.entries
        .map((e) => GroupedCircleReaction.fromReactions(
              e.key,
              e.value,
              currentUserId,
            ))
        .toList()
      ..sort((a, b) => b.count.compareTo(a.count));
  }
}
