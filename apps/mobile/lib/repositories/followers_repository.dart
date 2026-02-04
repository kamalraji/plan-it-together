import '../models/follower.dart';
import '../utils/result.dart';

/// Abstract repository interface for follower relationship operations.
/// 
/// This provides a clean abstraction over the follower data layer, enabling:
/// - Consistent error handling via Result<T> pattern
/// - Easy testing through mock implementations
/// - Separation of concerns between UI and data access
/// 
/// ## Follow System Design
/// 
/// This implements an Instagram/Twitter-style unidirectional follow system:
/// - Users can follow others without requiring approval (unless private)
/// - Private accounts require follow request approval
/// - Mutual follows are detected when both users follow each other
/// 
/// ## Rate Limiting
/// 
/// Implementations should enforce rate limits to prevent abuse:
/// - 30 follows per hour per user
/// - 24-hour cooldown after unfollowing
abstract class FollowersRepository {
  // ═══════════════════════════════════════════════════════════════════════════
  // FOLLOW ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Initiates a follow relationship with another user.
  /// 
  /// Returns [FollowResult] indicating success, pending request,
  /// rate limiting, or failure.
  Future<FollowResult> followUser(String targetUserId);

  /// Removes the follow relationship with a user.
  Future<Result<void>> unfollowUser(String targetUserId);

  /// Cancels a pending follow request.
  Future<Result<void>> cancelFollowRequest(String targetUserId);

  /// Removes a user from the current user's followers list.
  Future<Result<void>> removeFollower(String followerUserId);

  // ═══════════════════════════════════════════════════════════════════════════
  // FOLLOW REQUEST MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /// Approves a pending follow request.
  Future<Result<void>> acceptFollowRequest(String requestId);

  /// Rejects and deletes a pending follow request.
  Future<Result<void>> declineFollowRequest(String requestId);

  /// Retrieves all pending follow requests for the current user.
  Future<Result<List<FollowRequest>>> getPendingRequests();

  // ═══════════════════════════════════════════════════════════════════════════
  // FOLLOWERS & FOLLOWING LISTS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Retrieves all accepted followers for a user.
  /// 
  /// If [userId] is null, returns followers for the current user.
  Future<Result<List<Follower>>> getFollowers({String? userId});

  /// Retrieves all users that a user follows.
  /// 
  /// If [userId] is null, returns following list for the current user.
  Future<Result<List<Follower>>> getFollowing({String? userId});

  /// Retrieves users who have a mutual follow relationship with current user.
  Future<Result<List<Follower>>> getMutualFollowers();

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS & STATS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Determines the relationship status between current user and target.
  Future<Result<FollowStatus>> getFollowStatus(String targetUserId);

  /// Checks if the current user is following the target user.
  Future<Result<bool>> isFollowing(String targetUserId);

  /// Checks if the target user follows the current user.
  Future<Result<bool>> checkFollowsMe(String targetUserId);

  /// Batch checks which users from a list follow the current user.
  /// 
  /// Returns a map of userId -> bool indicating follow status.
  /// Optimized to make a single database query instead of N+1 queries.
  Future<Result<Map<String, bool>>> batchCheckFollowsMe(List<String> userIds);

  /// Retrieves follower and following counts for a user.
  Future<Result<FollowStats>> getFollowStats({String? userId});

  // ═══════════════════════════════════════════════════════════════════════════
  // SEARCH
  // ═══════════════════════════════════════════════════════════════════════════

  /// Searches through followers by name or headline.
  Future<Result<List<Follower>>> searchFollowers(String query, {int limit = 20});

  /// Searches through following list by name or headline.
  Future<Result<List<Follower>>> searchFollowing(String query, {int limit = 20});

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /// Gets the current user's ID.
  String? getCurrentUserId();
}
