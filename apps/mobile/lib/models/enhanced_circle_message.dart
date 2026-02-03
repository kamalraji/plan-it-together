import 'package:flutter/foundation.dart';
import 'package:thittam1hub/models/circle.dart';
import 'package:thittam1hub/models/circle_message_attachment.dart';
import 'package:thittam1hub/models/circle_message_reaction.dart';

/// Enhanced circle message with attachments, reactions, and reply support
@immutable
class EnhancedCircleMessage {
  final String id;
  final String circleId;
  final String userId;
  final String content;
  final DateTime createdAt;
  final DateTime? editedAt;
  final bool isDeleted;
  final String? replyToId;
  final List<CircleMessageAttachment> attachments;
  
  // Sender info
  final String? senderName;
  final String? senderAvatar;
  
  // Runtime-loaded data
  final EnhancedCircleMessage? replyTo;
  final List<GroupedCircleReaction> reactions;
  final String? senderRole; // ADMIN, MODERATOR, MEMBER

  const EnhancedCircleMessage({
    required this.id,
    required this.circleId,
    required this.userId,
    required this.content,
    required this.createdAt,
    this.editedAt,
    this.isDeleted = false,
    this.replyToId,
    this.attachments = const [],
    this.senderName,
    this.senderAvatar,
    this.replyTo,
    this.reactions = const [],
    this.senderRole,
  });

  factory EnhancedCircleMessage.fromMap(Map<String, dynamic> map) {
    return EnhancedCircleMessage(
      id: map['id'] as String,
      circleId: map['circle_id'] as String,
      userId: map['user_id'] as String,
      content: map['content'] as String? ?? '',
      createdAt: DateTime.parse(map['created_at'] as String),
      editedAt: map['edited_at'] != null
          ? DateTime.parse(map['edited_at'] as String)
          : null,
      isDeleted: map['is_deleted'] as bool? ?? false,
      replyToId: map['reply_to_id'] as String?,
      attachments: (map['attachments'] as List<dynamic>?)
              ?.map((a) => CircleMessageAttachment.fromMap(a as Map<String, dynamic>))
              .toList() ??
          [],
      senderName: map['sender_name'] as String?,
      senderAvatar: map['sender_avatar'] as String?,
      senderRole: map['sender_role'] as String?,
    );
  }

  /// Create from basic CircleMessage
  factory EnhancedCircleMessage.fromBasic(CircleMessage message) {
    return EnhancedCircleMessage(
      id: message.id,
      circleId: message.circleId,
      userId: message.userId,
      content: message.content,
      createdAt: message.createdAt,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'circle_id': circleId,
      'user_id': userId,
      'content': content,
      'created_at': createdAt.toIso8601String(),
      'edited_at': editedAt?.toIso8601String(),
      'is_deleted': isDeleted,
      'reply_to_id': replyToId,
      'attachments': attachments.map((a) => a.toMap()).toList(),
      'sender_name': senderName,
      'sender_avatar': senderAvatar,
    };
  }

  /// Check if message has been edited
  bool get isEdited => editedAt != null;

  /// Check if message has attachments
  bool get hasAttachments => attachments.isNotEmpty;

  /// Check if message has reactions
  bool get hasReactions => reactions.isNotEmpty;

  /// Check if this is a reply
  bool get isReply => replyToId != null;

  /// Get image attachments
  List<CircleMessageAttachment> get imageAttachments =>
      attachments.where((a) => a.isImage).toList();

  /// Get file attachments (non-image)
  List<CircleMessageAttachment> get fileAttachments =>
      attachments.where((a) => !a.isImage).toList();

  /// Get display content (handles deleted messages)
  String get displayContent {
    if (isDeleted) return 'This message was deleted';
    return content;
  }

  /// Check if sender is an admin
  bool get isSenderAdmin => senderRole == 'ADMIN';

  /// Check if sender is a moderator
  bool get isSenderModerator => senderRole == 'MODERATOR';

  /// Get total reaction count
  int get totalReactionCount =>
      reactions.fold(0, (sum, r) => sum + r.count);

  EnhancedCircleMessage copyWith({
    String? id,
    String? circleId,
    String? userId,
    String? content,
    DateTime? createdAt,
    DateTime? editedAt,
    bool? isDeleted,
    String? replyToId,
    List<CircleMessageAttachment>? attachments,
    String? senderName,
    String? senderAvatar,
    EnhancedCircleMessage? replyTo,
    List<GroupedCircleReaction>? reactions,
    String? senderRole,
  }) {
    return EnhancedCircleMessage(
      id: id ?? this.id,
      circleId: circleId ?? this.circleId,
      userId: userId ?? this.userId,
      content: content ?? this.content,
      createdAt: createdAt ?? this.createdAt,
      editedAt: editedAt ?? this.editedAt,
      isDeleted: isDeleted ?? this.isDeleted,
      replyToId: replyToId ?? this.replyToId,
      attachments: attachments ?? this.attachments,
      senderName: senderName ?? this.senderName,
      senderAvatar: senderAvatar ?? this.senderAvatar,
      replyTo: replyTo ?? this.replyTo,
      reactions: reactions ?? this.reactions,
      senderRole: senderRole ?? this.senderRole,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is EnhancedCircleMessage &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;
}

/// Date separator for message list
@immutable
class CircleDateSeparator {
  final DateTime date;

  const CircleDateSeparator({required this.date});

  String get displayText {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final messageDate = DateTime(date.year, date.month, date.day);
    
    if (messageDate == today) return 'Today';
    if (messageDate == today.subtract(const Duration(days: 1))) return 'Yesterday';
    
    final weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (now.difference(messageDate).inDays < 7) {
      return weekDays[date.weekday - 1];
    }
    
    if (date.year == now.year) {
      return '${months[date.month - 1]} ${date.day}';
    }
    
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }
}
