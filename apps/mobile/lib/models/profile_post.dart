import 'package:flutter/foundation.dart';

/// Represents a user's post for display on their profile
@immutable
class ProfilePost {
  final String id;
  final String content;
  final String? imageUrl;
  final String title;
  final String type; // IDEA, SEEKING, OFFERING, etc.
  final List<String> tags;
  final int likesCount;
  final int commentsCount;
  final DateTime createdAt;

  const ProfilePost({
    required this.id,
    required this.content,
    this.imageUrl,
    required this.title,
    required this.type,
    required this.tags,
    required this.likesCount,
    required this.commentsCount,
    required this.createdAt,
  });

  factory ProfilePost.fromMap(Map<String, dynamic> map) {
    return ProfilePost(
      id: map['id'] as String,
      content: map['content'] as String? ?? '',
      imageUrl: map['image_url'] as String?,
      title: map['title'] as String? ?? '',
      type: map['type'] as String? ?? 'IDEA',
      tags: List<String>.from(map['tags'] ?? []),
      likesCount: map['spark_count'] as int? ?? 0,
      commentsCount: map['comment_count'] as int? ?? 0,
      createdAt: DateTime.tryParse(map['created_at'] ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'content': content,
      'image_url': imageUrl,
      'title': title,
      'type': type,
      'tags': tags,
      'spark_count': likesCount,
      'comment_count': commentsCount,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
