import '../models/spark_comment.dart';
import '../services/comment_service.dart';
import '../utils/result.dart';

/// Abstract repository interface for comment operations.
/// 
/// This provides a clean abstraction over the comment data layer, enabling:
/// - Consistent error handling via Result<T> pattern
/// - Easy testing through mock implementations
/// - Separation of concerns between UI and data access
/// 
/// ## Rate Limiting
/// 
/// Implementations should enforce rate limits to prevent spam:
/// - 10 comments per minute per user
/// - Duplicate detection for rapid submissions
/// 
/// ## Edit Window
/// 
/// Comments can only be edited within 5 minutes of creation.
abstract class CommentRepository {
  // ═══════════════════════════════════════════════════════════════════════════
  // COMMENT CRUD OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Adds a new comment to a post.
  /// 
  /// [postId] - The ID of the post to comment on
  /// [content] - The comment content (1-1000 characters)
  /// [parentId] - Optional parent comment ID for replies
  /// 
  /// Returns [CommentResult] with success, rate limiting, or validation errors.
  Future<CommentResult> addComment(
    String postId,
    String content, {
    String? parentId,
  });

  /// Edits an existing comment.
  /// 
  /// Can only be edited within 5 minutes of creation.
  Future<CommentResult> editComment(String commentId, String newContent);

  /// Soft-deletes a comment (marks as deleted, content replaced).
  Future<Result<void>> deleteComment(String commentId);

  // ═══════════════════════════════════════════════════════════════════════════
  // COMMENT RETRIEVAL
  // ═══════════════════════════════════════════════════════════════════════════

  /// Retrieves comments for a post with pagination.
  /// 
  /// Returns top-level comments with reply counts.
  Future<Result<List<SparkComment>>> getComments(
    String postId, {
    int limit = 20,
    int offset = 0,
    String sortBy = 'newest',
  });

  /// Retrieves replies to a specific comment.
  Future<Result<List<SparkComment>>> getReplies(
    String parentId, {
    int limit = 20,
    int offset = 0,
  });

  /// Gets a single comment by ID.
  Future<Result<SparkComment>> getCommentById(String commentId);

  /// Gets the total comment count for a post.
  Future<Result<int>> getCommentCount(String postId);

  // ═══════════════════════════════════════════════════════════════════════════
  // LIKES
  // ═══════════════════════════════════════════════════════════════════════════

  /// Toggles like on a comment.
  Future<LikeResult> toggleLike(String commentId);

  /// Checks if current user has liked a comment.
  bool isLiked(String commentId);

  /// Loads liked state for multiple comments.
  Future<Set<String>> loadLikedComments(List<String> commentIds);

  // ═══════════════════════════════════════════════════════════════════════════
  // REACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Adds an emoji reaction to a comment.
  Future<Result<void>> addReaction(String commentId, String emoji);

  /// Removes a reaction from a comment.
  Future<Result<void>> removeReaction(String commentId, String emoji);

  /// Gets all reactions for a comment.
  Future<Result<Map<String, int>>> getReactions(String commentId);

  // ═══════════════════════════════════════════════════════════════════════════
  // REPORTING
  // ═══════════════════════════════════════════════════════════════════════════

  /// Reports a comment for moderation.
  Future<Result<void>> reportComment(
    String commentId,
    CommentReportReason reason, {
    String? details,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REAL-TIME
  // ═══════════════════════════════════════════════════════════════════════════

  /// Streams new comments for a post in real-time.
  Stream<SparkComment> streamComments(String postId);

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /// Gets the current user's ID.
  String? getCurrentUserId();

  /// Extracts @mentions from comment content.
  List<String> extractMentions(String content);
}
