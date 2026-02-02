import 'dart:async';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/models/spark_comment.dart';
import 'package:thittam1hub/utils/url_utils.dart';
import 'package:thittam1hub/services/logging_service.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/utils/result.dart';

// Re-export Supabase realtime types for subscribers
export 'package:supabase_flutter/supabase_flutter.dart' 
    show RealtimeChannel, PostgresChangeEvent, PostgresChangeFilter, PostgresChangeFilterType;

/// Result types for comment operations
enum CommentResultType {
  success,
  rateLimited,
  validationFailed,
  editWindowExpired,
  unauthorized,
  notFound,
  duplicate,
  failure,
}

class CommentResult {
  final CommentResultType type;
  final SparkComment? comment;
  final String? error;
  final int? remainingInWindow;

  const CommentResult._({
    required this.type,
    this.comment,
    this.error,
    this.remainingInWindow,
  });

  factory CommentResult.success(SparkComment comment) => CommentResult._(
        type: CommentResultType.success,
        comment: comment,
      );

  factory CommentResult.rateLimited(int remaining) => CommentResult._(
        type: CommentResultType.rateLimited,
        error: 'Too many comments. Please wait a moment.',
        remainingInWindow: remaining,
      );

  factory CommentResult.validationFailed(String message) => CommentResult._(
        type: CommentResultType.validationFailed,
        error: message,
      );

  factory CommentResult.editWindowExpired() => CommentResult._(
        type: CommentResultType.editWindowExpired,
        error: 'Edit window has expired (5 minutes)',
      );

  factory CommentResult.unauthorized() => CommentResult._(
        type: CommentResultType.unauthorized,
        error: 'You are not authorized to perform this action',
      );

  factory CommentResult.notFound() => CommentResult._(
        type: CommentResultType.notFound,
        error: 'Comment not found',
      );

  factory CommentResult.duplicate() => CommentResult._(
        type: CommentResultType.duplicate,
        error: 'Duplicate comment detected',
      );

  factory CommentResult.failure(String message) => CommentResult._(
        type: CommentResultType.failure,
        error: message,
      );

  bool get isSuccess => type == CommentResultType.success;
  bool get isRateLimited => type == CommentResultType.rateLimited;
}

/// Like operation result
class LikeResult {
  final bool success;
  final bool isLiked;
  final int newCount;
  final String? error;

  const LikeResult({
    required this.success,
    required this.isLiked,
    required this.newCount,
    this.error,
  });

  factory LikeResult.success(bool liked, int count) => LikeResult(
        success: true,
        isLiked: liked,
        newCount: count,
      );

  factory LikeResult.failure(String message) => LikeResult(
        success: false,
        isLiked: false,
        newCount: 0,
        error: message,
      );
}

/// Report reasons
enum CommentReportReason {
  spam,
  harassment,
  hateSpeech,
  misinformation,
  inappropriate,
  other,
}

extension CommentReportReasonX on CommentReportReason {
  String get displayName {
    switch (this) {
      case CommentReportReason.spam:
        return 'Spam';
      case CommentReportReason.harassment:
        return 'Harassment';
      case CommentReportReason.hateSpeech:
        return 'Hate Speech';
      case CommentReportReason.misinformation:
        return 'Misinformation';
      case CommentReportReason.inappropriate:
        return 'Inappropriate Content';
      case CommentReportReason.other:
        return 'Other';
    }
  }

  String get value => name;
}

/// Dedicated comment service with rate limiting and validation.
/// 
/// Extends [BaseService] for standardized error handling and [Result<T>]
/// return types. New methods use [execute] for consistent error wrapping.
class CommentService extends BaseService {
  static CommentService? _instance;
  static CommentService get instance => _instance ??= CommentService._();
  CommentService._();
  
  @override
  String get tag => 'CommentService';
  
  // Backward compatibility accessors for existing code
  static const String _tag = 'CommentService';
  static final LoggingService _log = LoggingService.instance;
  
  final _supabase = Supabase.instance.client;

  // Rate limiting: 10 comments per minute
  static const int _maxCommentsPerMinute = 10;
  static const Duration _rateLimitWindow = Duration(minutes: 1);
  static const Duration _editWindow = Duration(minutes: 5);
  static const int _minLength = 1;
  static const int _maxLength = 1000;

  // In-memory rate limiting cache
  static final Map<String, List<DateTime>> _userCommentTimestamps = {};
  
  // Local like cache for optimistic updates
  static final Set<String> _likedCommentsCache = {}; // Format: "userId_commentId"
  
  // Duplicate detection cache
  static final Map<String, String> _recentContentHashes = {}; // userId -> last content hash

  /// Check if user is rate limited
  bool _isRateLimited(String userId) {
    final timestamps = _userCommentTimestamps[userId] ?? [];
    final cutoff = DateTime.now().subtract(_rateLimitWindow);
    final recentCount = timestamps.where((t) => t.isAfter(cutoff)).length;
    return recentCount >= _maxCommentsPerMinute;
  }

  /// Get remaining comments in window
  int _getRemainingInWindow(String userId) {
    final timestamps = _userCommentTimestamps[userId] ?? [];
    final cutoff = DateTime.now().subtract(_rateLimitWindow);
    final recentCount = timestamps.where((t) => t.isAfter(cutoff)).length;
    return (_maxCommentsPerMinute - recentCount).clamp(0, _maxCommentsPerMinute);
  }

  /// Record comment timestamp for rate limiting
  void _recordTimestamp(String userId) {
    _userCommentTimestamps[userId] ??= [];
    _userCommentTimestamps[userId]!.add(DateTime.now());
    // Clean old timestamps
    final cutoff = DateTime.now().subtract(_rateLimitWindow * 2);
    _userCommentTimestamps[userId] =
        _userCommentTimestamps[userId]!.where((t) => t.isAfter(cutoff)).toList();
  }

  /// Validate comment content
  CommentResult? _validateContent(String content, String userId) {
    final trimmed = content.trim();

    if (trimmed.length < _minLength) {
      return CommentResult.validationFailed('Comment cannot be empty');
    }

    if (trimmed.length > _maxLength) {
      return CommentResult.validationFailed(
          'Comment is too long (max $_maxLength characters)');
    }

    // Sanitize content
    final sanitized = InputSanitizer.sanitizeDescription(trimmed);
    if (sanitized == null || sanitized.isEmpty) {
      return CommentResult.validationFailed('Invalid comment content');
    }

    // Check for duplicate (same content within short time)
    final contentHash = trimmed.hashCode.toString();
    if (_recentContentHashes[userId] == contentHash) {
      return CommentResult.duplicate();
    }
    _recentContentHashes[userId] = contentHash;

    return null; // Valid
  }

  /// Add a new comment
  Future<CommentResult> addComment(
    String postId,
    String content, {
    String? parentId,
  }) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) {
      return CommentResult.unauthorized();
    }

    // Rate limit check
    if (_isRateLimited(userId)) {
      return CommentResult.rateLimited(_getRemainingInWindow(userId));
    }

    // Validate content
    final validation = _validateContent(content, userId);
    if (validation != null) return validation;

    final sanitized = InputSanitizer.sanitizeDescription(content.trim())!;

    try {
      // Get user profile for author info
      final profileRes = await _supabase
          .from('user_profiles')
          .select('name, avatar_url')
          .eq('id', userId)
          .maybeSingle();

      final authorName = profileRes?['name'] as String? ?? 'Anonymous';
      final authorAvatar = profileRes?['avatar_url'] as String?;

      // Extract mentions
      final mentions = extractMentions(sanitized);

      // Insert comment
      final res = await _supabase
          .from('spark_comments')
          .insert({
            'post_id': postId,
            'user_id': userId,
            'parent_id': parentId,
            'content': sanitized,
            'author_name': authorName,
            'author_avatar': authorAvatar,
            'mentions': mentions,
          })
          .select()
          .single();

      _recordTimestamp(userId);

      final comment = SparkComment.fromMap(res);

      // Notify mentioned users (async, don't wait)
      if (mentions.isNotEmpty) {
        _notifyMentionedUsers(comment.id, mentions);
      }

      _log.dbOperation('INSERT', 'spark_comments', rowCount: 1, tag: _tag);
      return CommentResult.success(comment);
    } catch (e) {
      _log.error('Add comment failed', tag: _tag, error: e);
      return CommentResult.failure('Failed to add comment');
    }
  }

  /// Edit an existing comment (within 5 min window)
  Future<CommentResult> editComment(String commentId, String newContent) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) {
      return CommentResult.unauthorized();
    }

    // Validate new content
    final validation = _validateContent(newContent, userId);
    if (validation != null) return validation;

    final sanitized = InputSanitizer.sanitizeDescription(newContent.trim())!;

    try {
      // Fetch existing comment
      final existing = await _supabase
          .from('spark_comments')
          .select()
          .eq('id', commentId)
          .maybeSingle();

      if (existing == null) {
        return CommentResult.notFound();
      }

      if (existing['user_id'] != userId) {
        return CommentResult.unauthorized();
      }

      // Check edit window
      final createdAt = DateTime.parse(existing['created_at'] as String);
      if (DateTime.now().difference(createdAt) > _editWindow) {
        return CommentResult.editWindowExpired();
      }

      // Update comment
      final mentions = extractMentions(sanitized);
      final res = await _supabase
          .from('spark_comments')
          .update({
            'content': sanitized,
            'is_edited': true,
            'edited_at': DateTime.now().toIso8601String(),
            'mentions': mentions,
          })
          .eq('id', commentId)
          .select()
          .single();

      _log.dbOperation('UPDATE', 'spark_comments', rowCount: 1, tag: _tag);
      return CommentResult.success(SparkComment.fromMap(res));
    } catch (e) {
      _log.error('Edit comment failed', tag: _tag, error: e);
      return CommentResult.failure('Failed to edit comment');
    }
  }

  /// Soft delete a comment
  Future<bool> deleteComment(String commentId) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return false;

    try {
      final existing = await _supabase
          .from('spark_comments')
          .select('user_id')
          .eq('id', commentId)
          .maybeSingle();

      if (existing == null || existing['user_id'] != userId) {
        return false;
      }

      await _supabase.from('spark_comments').update({
        'is_deleted': true,
        'content': '[deleted]',
      }).eq('id', commentId);

      _log.info('Comment deleted', tag: _tag, metadata: {'commentId': commentId});
      return true;
    } catch (e) {
      _log.error('Delete comment failed', tag: _tag, error: e);
      return false;
    }
  }

  /// Toggle like on a comment with optimistic update support
  Future<LikeResult> toggleLike(String commentId) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) {
      return LikeResult.failure('Not authenticated');
    }

    final cacheKey = '${userId}_$commentId';

    try {
      // Try RPC first for atomic operation
      final result = await _supabase.rpc('toggle_comment_like', params: {
        'p_comment_id': commentId,
      });

      if (result != null) {
        final liked = result['liked'] as bool;
        final count = result['count'] as int;

        // Update cache
        if (liked) {
          _likedCommentsCache.add(cacheKey);
        } else {
          _likedCommentsCache.remove(cacheKey);
        }

        return LikeResult.success(liked, count);
      }

      // Fallback to manual toggle
      return _toggleLikeFallback(commentId, userId, cacheKey);
    } catch (e) {
      _log.error('Toggle like failed', tag: _tag, error: e);
      // Fallback to manual toggle
      return _toggleLikeFallback(commentId, userId, cacheKey);
    }
  }

  Future<LikeResult> _toggleLikeFallback(
    String commentId,
    String userId,
    String cacheKey,
  ) async {
    try {
      // Check if already liked
      final existing = await _supabase
          .from('comment_likes')
          .select('id')
          .eq('comment_id', commentId)
          .eq('user_id', userId)
          .maybeSingle();

      if (existing != null) {
        // Unlike
        await _supabase.from('comment_likes').delete().eq('id', existing['id']);
        await _supabase.rpc('decrement_comment_like_count',
            params: {'p_comment_id': commentId});
        
        _likedCommentsCache.remove(cacheKey);

        final comment = await _supabase
            .from('spark_comments')
            .select('like_count')
            .eq('id', commentId)
            .single();

        return LikeResult.success(false, comment['like_count'] as int);
      } else {
        // Like
        await _supabase.from('comment_likes').insert({
          'comment_id': commentId,
          'user_id': userId,
        });
        await _supabase.rpc('increment_comment_like_count',
            params: {'p_comment_id': commentId});
        
        _likedCommentsCache.add(cacheKey);

        final comment = await _supabase
            .from('spark_comments')
            .select('like_count')
            .eq('id', commentId)
            .single();

        return LikeResult.success(true, comment['like_count'] as int);
      }
    } catch (e) {
      _log.error('Toggle like fallback failed', tag: _tag, error: e);
      return LikeResult.failure('Failed to update like');
    }
  }

  /// Check if comment is liked (from cache)
  bool isLiked(String commentId) {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return false;
    return _likedCommentsCache.contains('${userId}_$commentId');
  }

  /// Load liked state from database
  Future<Set<String>> loadLikedComments(List<String> commentIds) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return {};

    try {
      final res = await _supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', userId)
          .inFilter('comment_id', commentIds);

      final likedIds = <String>{};
      for (final row in res) {
        final cid = row['comment_id'] as String;
        likedIds.add(cid);
        _likedCommentsCache.add('${userId}_$cid');
      }
      return likedIds;
    } catch (e) {
      _log.error('Load liked comments failed', tag: _tag, error: e);
      return {};
    }
  }

  /// Add emoji reaction to comment
  Future<bool> addReaction(String commentId, String emoji) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return false;

    try {
      await _supabase.from('comment_reactions').upsert({
        'comment_id': commentId,
        'user_id': userId,
        'emoji': emoji,
      }, onConflict: 'comment_id,user_id,emoji');
      return true;
    } catch (e) {
      _log.error('Add reaction failed', tag: _tag, error: e);
      return false;
    }
  }

  /// Remove emoji reaction from comment
  Future<bool> removeReaction(String commentId, String emoji) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return false;

    try {
      await _supabase
          .from('comment_reactions')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', userId)
          .eq('emoji', emoji);
      return true;
    } catch (e) {
      _log.error('Remove reaction failed', tag: _tag, error: e);
      return false;
    }
  }

  /// Get reactions for a comment
  Future<List<CommentReaction>> getReactions(String commentId) async {
    try {
      final res = await _supabase
          .from('comment_reactions')
          .select('emoji, user_id')
          .eq('comment_id', commentId);

      final userId = _supabase.auth.currentUser?.id;
      final grouped = <String, List<String>>{};

      for (final row in res) {
        final emoji = row['emoji'] as String;
        final uid = row['user_id'] as String;
        grouped[emoji] ??= [];
        grouped[emoji]!.add(uid);
      }

      return grouped.entries.map((e) {
        return CommentReaction(
          emoji: e.key,
          count: e.value.length,
          reactedByMe: userId != null && e.value.contains(userId),
          userIds: e.value,
        );
      }).toList();
    } catch (e) {
      _log.error('Get reactions failed', tag: _tag, error: e);
      return [];
    }
  }

  /// Report a comment
  Future<bool> reportComment(
    String commentId,
    CommentReportReason reason, {
    String? details,
  }) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return false;

    try {
      await _supabase.from('comment_reports').insert({
        'comment_id': commentId,
        'reporter_id': userId,
        'reason': reason.value,
        'details': details,
      });
      _log.info('Comment reported', tag: _tag, metadata: {'commentId': commentId, 'reason': reason.value});
      return true;
    } catch (e) {
      _log.error('Report comment failed', tag: _tag, error: e);
      return false;
    }
  }

  /// Pin/unpin a comment (post author only)
  Future<bool> togglePinComment(String commentId, String postId) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return false;

    try {
      // Check if user is post author
      final post = await _supabase
          .from('spark_posts')
          .select('user_id')
          .eq('id', postId)
          .maybeSingle();

      if (post == null || post['user_id'] != userId) {
        return false;
      }

      // Toggle pin
      final comment = await _supabase
          .from('spark_comments')
          .select('is_pinned')
          .eq('id', commentId)
          .single();

      final isPinned = comment['is_pinned'] as bool? ?? false;

      await _supabase.from('spark_comments').update({
        'is_pinned': !isPinned,
        'pinned_by': isPinned ? null : userId,
      }).eq('id', commentId);

      _log.info('Comment pin toggled', tag: _tag, metadata: {'commentId': commentId, 'pinned': !isPinned});
      return true;
    } catch (e) {
      _log.error('Toggle pin failed', tag: _tag, error: e);
      return false;
    }
  }

  /// Extract @mentions from content
  List<String> extractMentions(String content) {
    final regex = RegExp(r'@(\w+)');
    return regex.allMatches(content).map((m) => m.group(1)!).toList();
  }

  /// Notify mentioned users (fire and forget)
  Future<void> _notifyMentionedUsers(
    String commentId,
    List<String> usernames,
  ) async {
    try {
      // Get user IDs from usernames
      final users = await _supabase
          .from('user_profiles')
          .select('id, username')
          .inFilter('username', usernames);

      final currentUserId = _supabase.auth.currentUser?.id;

      for (final user in users) {
        final uid = user['id'] as String;
        if (uid == currentUserId) continue; // Don't notify self

        await _supabase.from('notifications').insert({
          'user_id': uid,
          'type': 'comment_mention',
          'title': 'You were mentioned in a comment',
          'action_url': '/comments/$commentId',
        });
      }
    } catch (e) {
      _log.error('Notify mentioned users failed', tag: _tag, error: e);
    }
  }

  /// Search users for mention autocomplete
  Future<List<MentionSuggestion>> searchMentions(String query) async {
    if (query.isEmpty) return [];

    try {
      final res = await _supabase
          .from('user_profiles')
          .select('id, username, name, avatar_url')
          .or('username.ilike.%$query%,name.ilike.%$query%')
          .limit(10);

      return res.map((row) {
        return MentionSuggestion(
          userId: row['id'] as String,
          username: row['username'] as String? ?? '',
          displayName: row['name'] as String? ?? '',
          avatarUrl: row['avatar_url'] as String?,
        );
      }).toList();
    } catch (e) {
      _log.error('Search mentions failed', tag: _tag, error: e);
      return [];
    }
  }

  /// Get comments with sorting
  Future<List<SparkComment>> getComments(
    String postId, {
    CommentSortOrder sortOrder = CommentSortOrder.top,
    int limit = 50,
  }) async {
    try {
      String orderColumn;
      bool ascending = false;

      switch (sortOrder) {
        case CommentSortOrder.top:
          orderColumn = 'like_count';
          ascending = false;
          break;
        case CommentSortOrder.newest:
          orderColumn = 'created_at';
          ascending = false;
          break;
        case CommentSortOrder.oldest:
          orderColumn = 'created_at';
          ascending = true;
          break;
      }

      final res = await _supabase
          .from('spark_comments')
          .select()
          .eq('post_id', postId)
          .isFilter('parent_id', null)
          .order('is_pinned', ascending: false)
          .order(orderColumn, ascending: ascending)
          .limit(limit);

      final comments = res.map((r) => SparkComment.fromMap(r)).toList();

      // Load replies for each comment
      for (var i = 0; i < comments.length; i++) {
        final replies = await _supabase
            .from('spark_comments')
            .select()
            .eq('parent_id', comments[i].id)
            .order('created_at', ascending: true)
            .limit(10);

        if (replies.isNotEmpty) {
          comments[i] = comments[i].copyWith(
            replies: replies.map((r) => SparkComment.fromMap(r)).toList(),
          );
        }
      }

      _log.dbOperation('SELECT', 'spark_comments', rowCount: comments.length, tag: _tag);
      return comments;
    } catch (e) {
      _log.error('Get comments failed', tag: _tag, error: e);
      return [];
    }
  }

  /// Clear rate limit data (for testing)
  void clearRateLimitData() {
    _userCommentTimestamps.clear();
    _likedCommentsCache.clear();
    _recentContentHashes.clear();
  }

  /// Subscribe to real-time comment updates for a post
  /// Returns a StreamSubscription that should be disposed when done
  RealtimeChannel subscribeToComments({
    required String postId,
    required Function(SparkComment) onInsert,
    required Function(SparkComment) onUpdate,
    required Function(String commentId) onDelete,
  }) {
    final channel = _supabase.channel('comments:$postId');
    
    channel
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'spark_comments',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'post_id',
            value: postId,
          ),
          callback: (payload) {
            try {
              final comment = SparkComment.fromMap(payload.newRecord);
              onInsert(comment);
            } catch (e) {
              _log.error('Parse inserted comment failed', tag: _tag, error: e);
            }
          },
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.update,
          schema: 'public',
          table: 'spark_comments',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'post_id',
            value: postId,
          ),
          callback: (payload) {
            try {
              final comment = SparkComment.fromMap(payload.newRecord);
              onUpdate(comment);
            } catch (e) {
              _log.error('Parse updated comment failed', tag: _tag, error: e);
            }
          },
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.delete,
          schema: 'public',
          table: 'spark_comments',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'post_id',
            value: postId,
          ),
          callback: (payload) {
            final commentId = payload.oldRecord['id'] as String?;
            if (commentId != null) {
              onDelete(commentId);
            }
          },
        )
        .subscribe();

    return channel;
  }

  /// Unsubscribe from comment updates
  Future<void> unsubscribeFromComments(RealtimeChannel channel) async {
    await _supabase.removeChannel(channel);
  }
}

/// Comment sorting options
enum CommentSortOrder { top, newest, oldest }

extension CommentSortOrderX on CommentSortOrder {
  String get displayName {
    switch (this) {
      case CommentSortOrder.top:
        return 'Top';
      case CommentSortOrder.newest:
        return 'Newest';
      case CommentSortOrder.oldest:
        return 'Oldest';
    }
  }
}

/// Comment reaction model
class CommentReaction {
  final String emoji;
  final int count;
  final bool reactedByMe;
  final List<String> userIds;

  const CommentReaction({
    required this.emoji,
    required this.count,
    required this.reactedByMe,
    required this.userIds,
  });
}

/// Mention suggestion for autocomplete
class MentionSuggestion {
  final String userId;
  final String username;
  final String displayName;
  final String? avatarUrl;

  const MentionSuggestion({
    required this.userId,
    required this.username,
    required this.displayName,
    this.avatarUrl,
  });
}
