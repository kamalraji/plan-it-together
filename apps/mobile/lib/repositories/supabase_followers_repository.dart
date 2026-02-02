import '../models/follower.dart';
import '../services/followers_service.dart';
import '../supabase/supabase_config.dart';
import '../utils/result.dart';
import 'base_repository.dart';
import 'followers_repository.dart';

/// Supabase implementation of [FollowersRepository].
/// 
/// Extends [BaseRepository] for standardized error handling and logging.
/// Wraps [FollowersService] with consistent Result<T> return types.
/// 
/// ## Usage
/// 
/// ```dart
/// final repo = SupabaseFollowersRepository();
/// final result = await repo.getFollowers();
/// if (result.isSuccess) {
///   final followers = result.data;
/// }
/// ```
class SupabaseFollowersRepository extends BaseRepository implements FollowersRepository {
  @override
  String get tag => 'FollowersRepository';
  
  final FollowersService _service;

  SupabaseFollowersRepository({
    FollowersService? service,
  }) : _service = service ?? FollowersService.instance;

  // ═══════════════════════════════════════════════════════════════════════════
  // FOLLOW ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<FollowResult> followUser(String targetUserId) async {
    try {
      final result = await _service.followUser(targetUserId);
      logDebug('Follow user result: ${result.type}');
      return result;
    } catch (e) {
      logError('Failed to follow user', error: e);
      return FollowResult.failure(userFriendlyMessage(e));
    }
  }

  @override
  Future<Result<void>> unfollowUser(String targetUserId) {
    return execute(() async {
      await _service.unfollowUser(targetUserId);
      logDebug('Unfollowed user: $targetUserId');
    }, operationName: 'unfollowUser');
  }

  @override
  Future<Result<void>> cancelFollowRequest(String targetUserId) {
    return execute(() async {
      await _service.cancelFollowRequest(targetUserId);
      logDebug('Cancelled follow request to: $targetUserId');
    }, operationName: 'cancelFollowRequest');
  }

  @override
  Future<Result<void>> removeFollower(String followerUserId) {
    return execute(() async {
      await _service.removeFollower(followerUserId);
      logDebug('Removed follower: $followerUserId');
    }, operationName: 'removeFollower');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FOLLOW REQUEST MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<void>> acceptFollowRequest(String requestId) {
    return execute(() async {
      await _service.acceptFollowRequest(requestId);
      logInfo('Accepted follow request: $requestId');
    }, operationName: 'acceptFollowRequest');
  }

  @override
  Future<Result<void>> declineFollowRequest(String requestId) {
    return execute(() async {
      await _service.declineFollowRequest(requestId);
      logDebug('Declined follow request: $requestId');
    }, operationName: 'declineFollowRequest');
  }

  @override
  Future<Result<List<FollowRequest>>> getPendingRequests() {
    return execute(() async {
      final requests = await _service.getPendingRequests();
      logDebug('Loaded ${requests.length} pending follow requests');
      return requests;
    }, operationName: 'getPendingRequests');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FOLLOWERS & FOLLOWING LISTS
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<List<Follower>>> getFollowers({String? userId}) {
    return execute(() async {
      final followers = await _service.getFollowers(userId: userId);
      logDbOperation('SELECT', 'followers', rowCount: followers.length);
      return followers;
    }, operationName: 'getFollowers');
  }

  @override
  Future<Result<List<Follower>>> getFollowing({String? userId}) {
    return execute(() async {
      final following = await _service.getFollowing(userId: userId);
      logDbOperation('SELECT', 'followers', rowCount: following.length);
      return following;
    }, operationName: 'getFollowing');
  }

  @override
  Future<Result<List<Follower>>> getMutualFollowers() {
    return execute(() async {
      final mutuals = await _service.getMutualFollowers();
      logDebug('Loaded ${mutuals.length} mutual followers');
      return mutuals;
    }, operationName: 'getMutualFollowers');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS & STATS
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<FollowStatus>> getFollowStatus(String targetUserId) {
    return execute(() async {
      return await _service.getFollowStatus(targetUserId);
    }, operationName: 'getFollowStatus');
  }

  @override
  Future<Result<bool>> isFollowing(String targetUserId) {
    return execute(() async {
      return await _service.isFollowing(targetUserId);
    }, operationName: 'isFollowing');
  }

  @override
  Future<Result<bool>> checkFollowsMe(String targetUserId) {
    return execute(() async {
      return await _service.checkFollowsMe(targetUserId);
    }, operationName: 'checkFollowsMe');
  }

  @override
  Future<Result<Map<String, bool>>> batchCheckFollowsMe(List<String> userIds) {
    return execute(() async {
      final result = await _service.batchCheckFollowsMe(userIds);
      logDebug('Batch checked ${userIds.length} users, ${result.values.where((v) => v).length} follow me');
      return result;
    }, operationName: 'batchCheckFollowsMe');
  }

  @override
  Future<Result<FollowStats>> getFollowStats({String? userId}) {
    return execute(() async {
      return await _service.getFollowStats(userId: userId);
    }, operationName: 'getFollowStats');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SEARCH
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<List<Follower>>> searchFollowers(String query, {int limit = 20}) {
    return execute(() async {
      final results = await _service.searchFollowers(query, limit: limit);
      logDebug('Search found ${results.length} followers');
      return results;
    }, operationName: 'searchFollowers');
  }

  @override
  Future<Result<List<Follower>>> searchFollowing(String query, {int limit = 20}) {
    return execute(() async {
      final results = await _service.searchFollowing(query, limit: limit);
      logDebug('Search found ${results.length} following');
      return results;
    }, operationName: 'searchFollowing');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  String? getCurrentUserId() => SupabaseConfig.auth.currentUser?.id;
}
