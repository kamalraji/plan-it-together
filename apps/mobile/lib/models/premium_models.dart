import 'package:flutter/foundation.dart';

/// Message reaction model
@immutable
class MessageReaction {
  final String id;
  final String messageId;
  final String userId;
  final String emoji;
  final DateTime createdAt;

  const MessageReaction({
    required this.id,
    required this.messageId,
    required this.userId,
    required this.emoji,
    required this.createdAt,
  });

  factory MessageReaction.fromMap(Map<String, dynamic> map) {
    return MessageReaction(
      id: map['id'] as String,
      messageId: map['message_id'] as String,
      userId: map['user_id'] as String,
      emoji: map['emoji'] as String,
      createdAt: DateTime.parse(map['created_at'] as String),
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
}

/// Grouped reaction for display
@immutable
class GroupedReaction {
  final String emoji;
  final int count;
  final bool userReacted;
  final List<String> userIds;

  const GroupedReaction({
    required this.emoji,
    required this.count,
    required this.userReacted,
    required this.userIds,
  });
}

/// Message read receipt model
@immutable
class MessageReadReceipt {
  final String id;
  final String messageId;
  final String userId;
  final DateTime readAt;
  final String? userAvatar;
  final String? userName;

  const MessageReadReceipt({
    required this.id,
    required this.messageId,
    required this.userId,
    required this.readAt,
    this.userAvatar,
    this.userName,
  });

  factory MessageReadReceipt.fromMap(Map<String, dynamic> map) {
    return MessageReadReceipt(
      id: map['id'] as String,
      messageId: map['message_id'] as String,
      userId: map['user_id'] as String,
      readAt: DateTime.parse(map['read_at'] as String),
      userAvatar: map['user_avatar'] as String?,
      userName: map['user_name'] as String?,
    );
  }
}

/// Available reaction emojis
class ReactionEmojis {
  static const List<String> all = ['❤️', '😂', '😮', '😢', '😡', '👍'];
  
  static const String heart = '❤️';
  static const String laugh = '😂';
  static const String wow = '😮';
  static const String sad = '😢';
  static const String angry = '😡';
  static const String thumbsUp = '👍';
}

/// Message delivery status
enum MessageStatus {
  sending,
  sent,
  delivered,
  read,
}

/// Typing status for users
@immutable
class TypingStatus {
  final String userId;
  final String userName;
  final DateTime timestamp;

  const TypingStatus({
    required this.userId,
    required this.userName,
    required this.timestamp,
  });

  bool get isActive => DateTime.now().difference(timestamp).inSeconds < 5;
}
