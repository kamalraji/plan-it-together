import 'package:thittam1hub/models/spark_post.dart';
import 'package:thittam1hub/utils/result.dart';
import 'package:thittam1hub/models/paginated_list.dart';

/// Abstract repository interface for Spark (social feed) operations
/// 
/// Provides a clean abstraction layer between UI/providers and data source.
/// Implementations handle Supabase-specific logic, caching, and error handling.
abstract class SparkRepository {
  /// Get paginated feed posts
  Future<Result<PaginatedList<SparkPost>>> getFeedPosts({
    int page = 0,
    int pageSize = 20,
    bool forceRefresh = false,
  });

  /// Get a single post by ID
  Future<Result<SparkPost?>> getPostById(String postId);

  /// Get posts by a specific user
  Future<Result<List<SparkPost>>> getUserPosts(String userId, {int limit = 20});

  /// Create a new post
  Future<Result<SparkPost>> createPost({
    required String content,
    List<Map<String, dynamic>>? attachments,
    String? repostId,
    String? linkedEventId,
    List<String>? hashtags,
  });

  /// Update an existing post
  Future<Result<SparkPost>> updatePost({
    required String postId,
    required String content,
    List<String>? hashtags,
  });

  /// Delete a post
  Future<Result<bool>> deletePost(String postId);

  /// Toggle spark (like) on a post
  Future<Result<bool>> toggleSpark(String postId);

  /// Check if current user has sparked a post
  Future<Result<bool>> hasSparked(String postId);

  /// Get posts the current user has sparked
  Future<Result<List<String>>> getSparkedPostIds({int limit = 100});

  /// Bookmark a post
  Future<Result<bool>> bookmarkPost(String postId);

  /// Remove bookmark from a post
  Future<Result<bool>> unbookmarkPost(String postId);

  /// Get bookmarked posts
  Future<Result<List<SparkPost>>> getBookmarkedPosts({int limit = 50});

  /// Search posts by content or hashtag
  Future<Result<List<SparkPost>>> searchPosts(String query, {int limit = 20});

  /// Get trending hashtags
  Future<Result<List<String>>> getTrendingHashtags({int limit = 10});

  /// Report a post
  Future<Result<bool>> reportPost(String postId, String reason, {String? details});
}
