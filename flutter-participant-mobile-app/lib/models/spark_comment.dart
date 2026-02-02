import 'package:flutter/foundation.dart';

@immutable
class SparkComment {
  final String id;
  final String postId;
  final String userId;
  final String? parentId;
  final String content;
  final String authorName;
  final String? authorAvatar;
  final int likeCount;
  final DateTime createdAt;
  final List<SparkComment> replies;
  
  // Enhanced fields
  final bool isEdited;
  final DateTime? editedAt;
  final bool isDeleted;
  final bool isPinned;
  final String? pinnedBy;
  final List<String> mentions;
  final bool isAuthorVerified;
  final String? authorBadge; // "Author", "Moderator", etc.

  const SparkComment({
    required this.id,
    required this.postId,
    required this.userId,
    this.parentId,
    required this.content,
    required this.authorName,
    this.authorAvatar,
    required this.likeCount,
    required this.createdAt,
    this.replies = const [],
    this.isEdited = false,
    this.editedAt,
    this.isDeleted = false,
    this.isPinned = false,
    this.pinnedBy,
    this.mentions = const [],
    this.isAuthorVerified = false,
    this.authorBadge,
  });

  factory SparkComment.fromMap(Map<String, dynamic> map) {
    return SparkComment(
      id: map['id'] as String,
      postId: map['post_id'] as String,
      userId: map['user_id'] as String,
      parentId: map['parent_id'] as String?,
      content: map['content'] as String,
      authorName: map['author_name'] as String? ?? 'Anonymous',
      authorAvatar: map['author_avatar'] as String?,
      likeCount: map['like_count'] as int? ?? 0,
      createdAt: DateTime.parse(map['created_at'] as String),
      replies: const [],
      isEdited: map['is_edited'] as bool? ?? false,
      editedAt: map['edited_at'] != null
          ? DateTime.parse(map['edited_at'] as String)
          : null,
      isDeleted: map['is_deleted'] as bool? ?? false,
      isPinned: map['is_pinned'] as bool? ?? false,
      pinnedBy: map['pinned_by'] as String?,
      mentions: (map['mentions'] as List<dynamic>?)?.cast<String>() ?? const [],
      isAuthorVerified: map['is_author_verified'] as bool? ?? false,
      authorBadge: map['author_badge'] as String?,
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'post_id': postId,
        'user_id': userId,
        'parent_id': parentId,
        'content': content,
        'author_name': authorName,
        'author_avatar': authorAvatar,
        'like_count': likeCount,
        'created_at': createdAt.toIso8601String(),
        'is_edited': isEdited,
        'edited_at': editedAt?.toIso8601String(),
        'is_deleted': isDeleted,
        'is_pinned': isPinned,
        'pinned_by': pinnedBy,
        'mentions': mentions,
      };

  SparkComment copyWith({
    List<SparkComment>? replies,
    int? likeCount,
    String? content,
    bool? isEdited,
    DateTime? editedAt,
    bool? isDeleted,
    bool? isPinned,
    String? pinnedBy,
  }) =>
      SparkComment(
        id: id,
        postId: postId,
        userId: userId,
        parentId: parentId,
        content: content ?? this.content,
        authorName: authorName,
        authorAvatar: authorAvatar,
        likeCount: likeCount ?? this.likeCount,
        createdAt: createdAt,
        replies: replies ?? this.replies,
        isEdited: isEdited ?? this.isEdited,
        editedAt: editedAt ?? this.editedAt,
        isDeleted: isDeleted ?? this.isDeleted,
        isPinned: isPinned ?? this.isPinned,
        pinnedBy: pinnedBy ?? this.pinnedBy,
        mentions: mentions,
        isAuthorVerified: isAuthorVerified,
        authorBadge: authorBadge,
      );

  /// Check if comment can still be edited (within 5 min window)
  bool get canEdit {
    if (isDeleted) return false;
    return DateTime.now().difference(createdAt).inMinutes < 5;
  }

  /// Get display content (shows [deleted] for deleted comments)
  String get displayContent => isDeleted ? '[deleted]' : content;
}
