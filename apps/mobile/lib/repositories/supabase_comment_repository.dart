import 'dart:async';
import '../models/spark_comment.dart';
import '../services/comment_service.dart';
import '../supabase/supabase_config.dart';
import '../utils/result.dart';
import 'base_repository.dart';
import 'comment_repository.dart';

/// Supabase implementation of [CommentRepository].
/// 
/// Extends [BaseRepository] for standardized error handling and logging.
/// Wraps [CommentService] with consistent Result<T> return types.
/// 
/// ## Features
/// 
/// - Rate limiting (10 comments per minute)
/// - 5-minute edit window for comments
/// - Duplicate detection for rapid submissions
/// - Real-time comment streaming
/// - Like state caching
class SupabaseCommentRepository extends BaseRepository implements CommentRepository {
  @override
  String get tag => 'CommentRepository';
  
  final CommentService _service;

  SupabaseCommentRepository({
    CommentService? service,
  }) : _service = service ?? CommentService.instance;

  // ═══════════════════════════════════════════════════════════════════════════
  // COMMENT CRUD OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<CommentResult> addComment(
    String postId,
    String content, {
    String? parentId,
  }) async {
    try {
      final result = await _service.addComment(postId, content, parentId: parentId);
      if (result.isSuccess) {
        logInfo('Added comment to post: $postId');
      } else {
        logWarning('Comment failed: ${result.type}');
      }
      return result;
    } catch (e) {
      logError('Failed to add comment', error: e);
      return CommentResult.failure(userFriendlyMessage(e));
    }
  }

  @override
  Future<CommentResult> editComment(String commentId, String newContent) async {
    try {
      final result = await _service.editComment(commentId, newContent);
      if (result.isSuccess) {
        logDebug('Edited comment: $commentId');
      }
      return result;
    } catch (e) {
      logError('Failed to edit comment', error: e);
      return CommentResult.failure(userFriendlyMessage(e));
    }
  }

  @override
  Future<Result<void>> deleteComment(String commentId) {
    return execute(() async {
      await _service.deleteComment(commentId);
      logDebug('Deleted comment: $commentId');
    }, operationName: 'deleteComment');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMMENT RETRIEVAL
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<List<SparkComment>>> getComments(
    String postId, {
    int limit = 20,
    int offset = 0,
    String sortBy = 'newest',
  }) {
    return execute(() async {
      final comments = await _service.getComments(
        postId,
        limit: limit,
        offset: offset,
        sortBy: sortBy,
      );
      logDbOperation('SELECT', 'spark_comments', rowCount: comments.length);
      return comments;
    }, operationName: 'getComments');
  }

  @override
  Future<Result<List<SparkComment>>> getReplies(
    String parentId, {
    int limit = 20,
    int offset = 0,
  }) {
    return execute(() async {
      final replies = await _service.getReplies(
        parentId,
        limit: limit,
        offset: offset,
      );
      logDbOperation('SELECT', 'spark_comments', rowCount: replies.length);
      return replies;
    }, operationName: 'getReplies');
  }

  @override
  Future<Result<SparkComment>> getCommentById(String commentId) {
    return execute(() async {
      final comment = await _service.getCommentById(commentId);
      if (comment == null) {
        throw Exception('Comment not found');
      }
      return comment;
    }, operationName: 'getCommentById');
  }

  @override
  Future<Result<int>> getCommentCount(String postId) {
    return execute(() async {
      return await _service.getCommentCount(postId);
    }, operationName: 'getCommentCount');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LIKES
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<LikeResult> toggleLike(String commentId) async {
    try {
      final result = await _service.toggleLike(commentId);
      logDebug('Toggled like on comment: $commentId');
      return result;
    } catch (e) {
      logError('Failed to toggle like', error: e);
      return LikeResult.failure(userFriendlyMessage(e));
    }
  }

  @override
  bool isLiked(String commentId) {
    return _service.isLiked(commentId);
  }

  @override
  Future<Set<String>> loadLikedComments(List<String> commentIds) async {
    try {
      return await _service.loadLikedComments(commentIds);
    } catch (e) {
      logError('Failed to load liked comments', error: e);
      return {};
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<void>> addReaction(String commentId, String emoji) {
    return execute(() async {
      await _service.addReaction(commentId, emoji);
      logDebug('Added reaction to comment: $commentId');
    }, operationName: 'addReaction');
  }

  @override
  Future<Result<void>> removeReaction(String commentId, String emoji) {
    return execute(() async {
      await _service.removeReaction(commentId, emoji);
      logDebug('Removed reaction from comment: $commentId');
    }, operationName: 'removeReaction');
  }

  @override
  Future<Result<Map<String, int>>> getReactions(String commentId) {
    return execute(() async {
      return await _service.getReactions(commentId);
    }, operationName: 'getReactions');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REPORTING
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<void>> reportComment(
    String commentId,
    CommentReportReason reason, {
    String? details,
  }) {
    return execute(() async {
      await _service.reportComment(commentId, reason, details: details);
      logInfo('Reported comment: $commentId for $reason');
    }, operationName: 'reportComment');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REAL-TIME
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Stream<SparkComment> streamComments(String postId) {
    return _service.streamComments(postId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  String? getCurrentUserId() => SupabaseConfig.auth.currentUser?.id;

  @override
  List<String> extractMentions(String content) {
    return _service.extractMentions(content);
  }
}
