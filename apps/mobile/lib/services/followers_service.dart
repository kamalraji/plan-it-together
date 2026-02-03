import 'dart:async';
import 'package:thittam1hub/models/follower.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/services/logging_service.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/utils/result.dart';

/// Service for managing unidirectional follower relationships.
///
/// This service implements an Instagram/Twitter-style follow system where:
/// - Users can follow other users (one-way relationship)
/// - Private accounts require follow request approval
/// - Mutual follows are detected when both users follow each other
///
/// ## Rate Limiting
///
/// To prevent spam and abuse, the service enforces rate limits:
/// - **30 follows per hour** per user session
/// - **24-hour cooldown** after unfollowing (prevents follow/unfollow spam)
///
/// Rate limiting is enforced in-memory per session. When rate limited,
/// [followUser] returns [FollowResult.rateLimited] with remaining quota info.
///
/// ## Private Account Flow
///
/// 1. User A calls [followUser] on private User B
/// 2. A `PENDING` follow record is created
/// 3. [FollowResult.requestSent] is returned to User A
/// 4. User B sees request in [getPendingRequests]
/// 5. User B calls [acceptFollowRequest] or [declineFollowRequest]
/// 6. If accepted, User A now follows User B
///
/// ## BaseService Integration
///
/// This service extends [BaseService] for standardized error handling,
/// logging, and [Result<T>] return types for new methods.
class FollowersService extends BaseService {
  static FollowersService? _instance;
  static FollowersService get instance => _instance ??= FollowersService._();
  FollowersService._();
  
  @override
  String get tag => 'FollowersService';
  
  // Backward compatibility accessors for existing code
  static const String _tag = 'FollowersService';
  static final LoggingService _log = LoggingService.instance;
  
  final _supabase = SupabaseConfig.client;

  /// Maximum number of follow actions allowed per hour.
  static const int _maxFollowsPerHour = 30;

  /// Cooldown period after unfollowing before re-following is allowed.
  static const Duration _followCooldown = Duration(hours: 24);

  // In-memory rate limiting (per session)
  static final Map<String, List<DateTime>> _followTimestamps = {};
  static final Map<String, DateTime> _unfollowCooldowns = {};

  // ============================================================
  // FOLLOW ACTIONS
  // ============================================================

  /// Initiates a follow relationship with another user.
  Future<FollowResult> followUser(String targetUserId) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return FollowResult.failure('Not authenticated');
      if (userId == targetUserId) return FollowResult.failure('Cannot follow yourself');

      // Check rate limit
      if (_isRateLimited(userId)) {
        return FollowResult.rateLimited(
          remainingInWindow: _getRemainingInWindow(userId),
        );
      }

      // Check if already following
      final existing = await _supabase
          .from('followers')
          .select('id, status')
          .eq('follower_id', userId)
          .eq('following_id', targetUserId)
          .maybeSingle();

      if (existing != null) {
        return FollowResult.alreadyFollowing();
      }

      // Check if blocked
      final blocked = await _supabase
          .from('blocked_users')
          .select('id')
          .or('and(user_id.eq.$targetUserId,blocked_user_id.eq.$userId),'
              'and(user_id.eq.$userId,blocked_user_id.eq.$targetUserId)')
          .maybeSingle();

      if (blocked != null) {
        return FollowResult.blocked();
      }

      // Check if target is private
      final targetProfile = await _supabase
          .from('impact_profiles')
          .select('is_private')
          .eq('user_id', targetUserId)
          .maybeSingle();

      final isPrivate = targetProfile?['is_private'] as bool? ?? false;
      final status = isPrivate ? 'PENDING' : 'ACCEPTED';

      // Insert follow record
      await _supabase.from('followers').insert({
        'follower_id': userId,
        'following_id': targetUserId,
        'status': status,
        'accepted_at': isPrivate ? null : DateTime.now().toUtc().toIso8601String(),
      });

      // Record timestamp for rate limiting
      _recordFollowTimestamp(userId);

      _log.info('Follow action completed', tag: _tag, metadata: {
        'status': status,
        'targetUserId': targetUserId,
      });

      return isPrivate 
          ? FollowResult.requestSent() 
          : FollowResult.success();
    } catch (e) {
      _log.error('Follow user failed', tag: _tag, error: e);
      return FollowResult.failure('Failed to follow user');
    }
  }

  /// Removes the follow relationship with a user.
  Future<bool> unfollowUser(String targetUserId) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return false;

      await _supabase
          .from('followers')
          .delete()
          .eq('follower_id', userId)
          .eq('following_id', targetUserId);

      // Set cooldown to prevent spam follow/unfollow
      _setCooldown(userId, targetUserId);

      _log.info('Unfollowed user', tag: _tag, metadata: {'targetUserId': targetUserId});
      return true;
    } catch (e) {
      _log.error('Unfollow user failed', tag: _tag, error: e);
      return false;
    }
  }

  /// Cancels a pending follow request.
  Future<bool> cancelFollowRequest(String targetUserId) async {
    return unfollowUser(targetUserId);
  }

  /// Removes a user from your followers list.
  Future<bool> removeFollower(String followerUserId) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return false;

      await _supabase
          .from('followers')
          .delete()
          .eq('follower_id', followerUserId)
          .eq('following_id', userId);

      _log.info('Removed follower', tag: _tag, metadata: {'followerUserId': followerUserId});
      return true;
    } catch (e) {
      _log.error('Remove follower failed', tag: _tag, error: e);
      return false;
    }
  }

  // ============================================================
  // FOLLOW REQUEST MANAGEMENT (For Private Accounts)
  // ============================================================

  /// Approves a pending follow request from another user.
  Future<bool> acceptFollowRequest(String requestId) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return false;

      await _supabase
          .from('followers')
          .update({
            'status': 'ACCEPTED',
            'accepted_at': DateTime.now().toUtc().toIso8601String(),
          })
          .eq('id', requestId)
          .eq('following_id', userId);

      _log.info('Follow request accepted', tag: _tag, metadata: {'requestId': requestId});
      return true;
    } catch (e) {
      _log.error('Accept follow request failed', tag: _tag, error: e);
      return false;
    }
  }

  /// Rejects and deletes a pending follow request.
  Future<bool> declineFollowRequest(String requestId) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return false;

      await _supabase
          .from('followers')
          .delete()
          .eq('id', requestId)
          .eq('following_id', userId);

      _log.info('Follow request declined', tag: _tag, metadata: {'requestId': requestId});
      return true;
    } catch (e) {
      _log.error('Decline follow request failed', tag: _tag, error: e);
      return false;
    }
  }

  /// Retrieves all pending follow requests for the current user.
  Future<List<FollowRequest>> getPendingRequests() async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return [];

      final response = await _supabase
          .from('followers')
          .select('*')
          .eq('following_id', userId)
          .eq('status', 'PENDING')
          .order('created_at', ascending: false);

      final requestList = response as List;
      if (requestList.isEmpty) return [];

      // Batch fetch requester profiles
      final requesterIds = requestList
          .map((r) => r['follower_id'] as String)
          .toSet()
          .toList();

      final profiles = await _supabase
          .from('impact_profiles')
          .select('user_id, full_name, avatar_url, headline')
          .inFilter('user_id', requesterIds);

      final profileMap = <String, Map<String, dynamic>>{};
      for (final p in profiles as List) {
        profileMap[p['user_id'] as String] = p;
      }

      _log.dbOperation('SELECT pending requests', 'followers', rowCount: requestList.length, tag: _tag);
      return requestList.map((row) {
        final requesterId = row['follower_id'] as String;
        return FollowRequest.fromMap(row, profile: profileMap[requesterId]);
      }).toList();
    } catch (e) {
      _log.error('Get pending requests failed', tag: _tag, error: e);
      return [];
    }
  }

  // ============================================================
  // FOLLOWERS & FOLLOWING LISTS
  // ============================================================

  /// Retrieves all accepted followers for a user.
  Future<List<Follower>> getFollowers({String? userId}) async {
    try {
      final targetUserId = userId ?? _supabase.auth.currentUser?.id;
      if (targetUserId == null) return [];

      final response = await _supabase
          .from('followers')
          .select('*')
          .eq('following_id', targetUserId)
          .eq('status', 'ACCEPTED')
          .order('created_at', ascending: false)
          .limit(500); // Explicit limit for query safety

      final followerList = response as List;
      if (followerList.isEmpty) return [];

      // Batch fetch follower profiles
      final followerIds = followerList
          .map((f) => f['follower_id'] as String)
          .toSet()
          .toList();

      final profiles = await _supabase
          .from('impact_profiles')
          .select('user_id, full_name, avatar_url, headline, organization, is_online')
          .inFilter('user_id', followerIds);

      final profileMap = <String, Map<String, dynamic>>{};
      for (final p in profiles as List) {
        profileMap[p['user_id'] as String] = p;
      }

      _log.dbOperation('SELECT followers', 'followers', rowCount: followerList.length, tag: _tag);
      return followerList.map((row) {
        final oderId = row['follower_id'] as String;
        return Follower.fromMap(row, profile: profileMap[oderId]);
      }).toList();
    } catch (e) {
      _log.error('Get followers failed', tag: _tag, error: e);
      return [];
    }
  }

  /// Retrieves all users that a user follows.
  Future<List<Follower>> getFollowing({String? userId}) async {
    try {
      final targetUserId = userId ?? _supabase.auth.currentUser?.id;
      if (targetUserId == null) return [];

      final response = await _supabase
          .from('followers')
          .select('*')
          .eq('follower_id', targetUserId)
          .eq('status', 'ACCEPTED')
          .order('created_at', ascending: false)
          .limit(500); // Explicit limit for query safety

      final followingList = response as List;
      if (followingList.isEmpty) return [];

      // Batch fetch following profiles
      final followingIds = followingList
          .map((f) => f['following_id'] as String)
          .toSet()
          .toList();

      final profiles = await _supabase
          .from('impact_profiles')
          .select('user_id, full_name, avatar_url, headline, organization, is_online')
          .inFilter('user_id', followingIds);

      final profileMap = <String, Map<String, dynamic>>{};
      for (final p in profiles as List) {
        profileMap[p['user_id'] as String] = p;
      }

      _log.dbOperation('SELECT following', 'followers', rowCount: followingList.length, tag: _tag);
      return followingList.map((row) {
        final oderId = row['following_id'] as String;
        return Follower.fromMap(row, profile: profileMap[oderId]);
      }).toList();
    } catch (e) {
      _log.error('Get following failed', tag: _tag, error: e);
      return [];
    }
  }

  // ============================================================
  // STATUS & STATS
  // ============================================================

  /// Determines the relationship status between current user and target.
  Future<FollowStatus> getFollowStatus(String targetUserId) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return FollowStatus.notFollowing;

      // Check if I follow them
      final iFollow = await _supabase
          .from('followers')
          .select('status')
          .eq('follower_id', userId)
          .eq('following_id', targetUserId)
          .maybeSingle();

      // Check if they follow me
      final theyFollow = await _supabase
          .from('followers')
          .select('status')
          .eq('follower_id', targetUserId)
          .eq('following_id', userId)
          .eq('status', 'ACCEPTED')
          .maybeSingle();

      if (iFollow == null) {
        return FollowStatus.notFollowing;
      }

      if (iFollow['status'] == 'PENDING') {
        return FollowStatus.pending;
      }

      if (theyFollow != null) {
        return FollowStatus.mutualFollow;
      }

      return FollowStatus.following;
    } catch (e) {
      _log.error('Get follow status failed', tag: _tag, error: e);
      return FollowStatus.notFollowing;
    }
  }

  /// Checks if the target user follows the current user.
  Future<bool> checkFollowsMe(String targetUserId) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return false;

      final result = await _supabase
          .from('followers')
          .select('id')
          .eq('follower_id', targetUserId)
          .eq('following_id', userId)
          .eq('status', 'ACCEPTED')
          .maybeSingle();

      return result != null;
    } catch (e) {
      _log.error('Check follows me failed', tag: _tag, error: e);
      return false;
    }
  }

  /// Batch check if multiple users follow the current user.
  /// 
  /// **N+1 Query Optimization**: Use this instead of calling [checkFollowsMe]
  /// in a loop. Reduces N+1 API calls to a single batched query.
  /// 
  /// Example:
  /// ```dart
  /// // Instead of:
  /// for (final profile in profiles) {
  ///   final followsMe = await checkFollowsMe(profile.userId);
  /// }
  /// 
  /// // Use:
  /// final followsMap = await batchCheckFollowsMe(
  ///   profiles.map((p) => p.userId).toList(),
  /// );
  /// ```
  /// 
  /// Returns a map of userId -> whether they follow the current user.
  Future<Map<String, bool>> batchCheckFollowsMe(List<String> userIds) async {
    if (userIds.isEmpty) return {};

    try {
      final myId = _supabase.auth.currentUser?.id;
      if (myId == null) return {for (final id in userIds) id: false};

      final data = await _supabase
          .from('followers')
          .select('follower_id')
          .eq('following_id', myId)
          .inFilter('follower_id', userIds)
          .eq('status', 'ACCEPTED');

      final followersSet = (data as List)
          .map((r) => r['follower_id'] as String)
          .toSet();

      _log.dbOperation('SELECT batch followsMe', 'followers', 
          rowCount: followersSet.length, tag: _tag);

      return {for (final id in userIds) id: followersSet.contains(id)};
    } catch (e) {
      _log.error('Batch check follows me failed', tag: _tag, error: e);
      return {for (final id in userIds) id: false};
    }
  }

  /// Retrieves users who have a mutual follow relationship.
  Future<List<Follower>> getMutualFollowers() async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return [];

      // Get people I follow (limit for query safety)
      final iFollow = await _supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', userId)
          .eq('status', 'ACCEPTED')
          .limit(5000);

      // Get people who follow me (limit for query safety)
      final followMe = await _supabase
          .from('followers')
          .select('follower_id')
          .eq('following_id', userId)
          .eq('status', 'ACCEPTED')
          .limit(5000);

      final myFollowingSet = Set<String>.from(
        (iFollow as List).map((r) => r['following_id'] as String),
      );
      final myFollowersSet = Set<String>.from(
        (followMe as List).map((r) => r['follower_id'] as String),
      );

      // Find intersection
      final mutualIds = myFollowingSet.intersection(myFollowersSet);
      if (mutualIds.isEmpty) return [];

      // Fetch profiles
      final profiles = await _supabase
          .from('impact_profiles')
          .select('user_id, full_name, avatar_url, headline, organization, is_online')
          .inFilter('user_id', mutualIds.toList());

      _log.dbOperation('SELECT mutual followers', 'followers', rowCount: mutualIds.length, tag: _tag);
      return (profiles as List).map((p) => Follower(
        id: p['user_id'] as String,
        userId: p['user_id'] as String,
        otherUserName: p['full_name'] as String? ?? 'Unknown',
        otherUserAvatar: p['avatar_url'] as String?,
        otherUserHeadline: p['headline'] as String?,
        otherUserOrganization: p['organization'] as String?,
        isOnline: p['is_online'] as bool? ?? false,
        createdAt: DateTime.now(),
        status: 'ACCEPTED',
      )).toList();
    } catch (e) {
      _log.error('Get mutual followers failed', tag: _tag, error: e);
      return [];
    }
  }

  /// Quick boolean check if current user follows target.
  Future<bool> isFollowing(String targetUserId) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return false;

      final result = await _supabase
          .from('followers')
          .select('id')
          .eq('follower_id', userId)
          .eq('following_id', targetUserId)
          .eq('status', 'ACCEPTED')
          .maybeSingle();

      return result != null;
    } catch (e) {
      _log.error('Is following check failed', tag: _tag, error: e);
      return false;
    }
  }

  /// Get follower/following counts for a user
  Future<FollowStats> getFollowStats({String? userId}) async {
    try {
      final targetUserId = userId ?? _supabase.auth.currentUser?.id;
      if (targetUserId == null) return FollowStats.empty();

      // Get followers count
      final followersCount = await _supabase
          .from('followers')
          .select('id')
          .eq('following_id', targetUserId)
          .eq('status', 'ACCEPTED')
          .count();

      // Get following count
      final followingCount = await _supabase
          .from('followers')
          .select('id')
          .eq('follower_id', targetUserId)
          .eq('status', 'ACCEPTED')
          .count();

      // Get pending requests count (only for current user)
      int pendingCount = 0;
      if (userId == null || userId == _supabase.auth.currentUser?.id) {
        final pending = await _supabase
            .from('followers')
            .select('id')
            .eq('following_id', targetUserId)
            .eq('status', 'PENDING')
            .count();
        pendingCount = pending.count;
      }

      return FollowStats(
        followersCount: followersCount.count,
        followingCount: followingCount.count,
        pendingRequestsCount: pendingCount,
      );
    } catch (e) {
      _log.error('Get follow stats failed', tag: _tag, error: e);
      return FollowStats.empty();
    }
  }

  // ============================================================
  // PRIVACY SETTINGS
  // ============================================================

  /// Checks whether the current user's account is set to private.
  Future<bool> isAccountPrivate() async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return false;

      final result = await _supabase
          .from('impact_profiles')
          .select('is_private')
          .eq('user_id', userId)
          .maybeSingle();

      return result?['is_private'] as bool? ?? false;
    } catch (e) {
      _log.error('Is account private check failed', tag: _tag, error: e);
      return false;
    }
  }

  /// Sets the privacy mode for the current user's account.
  Future<bool> setAccountPrivacy(bool isPrivate) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return false;

      await _supabase
          .from('impact_profiles')
          .update({'is_private': isPrivate})
          .eq('user_id', userId);

      // If making public, auto-accept all pending requests
      if (!isPrivate) {
        await _supabase
            .from('followers')
            .update({
              'status': 'ACCEPTED',
              'accepted_at': DateTime.now().toUtc().toIso8601String(),
            })
            .eq('following_id', userId)
            .eq('status', 'PENDING');
      }

      _log.info('Account privacy updated', tag: _tag, metadata: {'isPrivate': isPrivate});
      return true;
    } catch (e) {
      _log.error('Set account privacy failed', tag: _tag, error: e);
      return false;
    }
  }

  // ============================================================
  // SUGGESTED USERS
  // ============================================================

  /// Retrieves suggested users for the current user to follow.
  Future<List<Map<String, dynamic>>> getSuggestedUsers({int limit = 15}) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return [];

      // Get users I already follow
      final following = await _supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', userId)
          .limit(500); // Query safety limit

      final followingIds = (following as List)
          .map((f) => f['following_id'] as String)
          .toList();
      followingIds.add(userId); // Exclude self

      // Get profiles I haven't followed
      final profiles = await _supabase
          .from('impact_profiles')
          .select('*')
          .not('user_id', 'in', '(${followingIds.join(',')})')
          .limit(limit);

      _log.dbOperation('SELECT suggested users', 'impact_profiles', rowCount: (profiles as List).length, tag: _tag);
      return profiles.cast<Map<String, dynamic>>();
    } catch (e) {
      _log.error('Get suggested users failed', tag: _tag, error: e);
      return [];
    }
  }

  // ============================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================

  /// Subscribes to real-time notifications of new followers.
  StreamSubscription subscribeToNewFollowers({
    required Function(Follower follower) onNewFollower,
  }) {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) throw Exception('Not authenticated');

    return _supabase
        .from('followers')
        .stream(primaryKey: ['id'])
        .eq('following_id', userId)
        .listen((data) async {
          for (final row in data) {
            if (row['status'] == 'ACCEPTED') {
              final profile = await _supabase
                  .from('impact_profiles')
                  .select('*')
                  .eq('user_id', row['follower_id'])
                  .maybeSingle();
              onNewFollower(Follower.fromMap(row, profile: profile));
            }
          }
        });
  }

  /// Subscribes to real-time pending request count updates.
  StreamSubscription subscribeToPendingRequestCount({
    required Function(int count) onUpdate,
  }) {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) throw Exception('Not authenticated');

    return _supabase
        .from('followers')
        .stream(primaryKey: ['id'])
        .eq('following_id', userId)
        .listen((data) {
          final pendingCount = data.where((r) => r['status'] == 'PENDING').length;
          onUpdate(pendingCount);
        });
  }

  // ============================================================
  // RATE LIMITING HELPERS
  // ============================================================

  bool _isRateLimited(String userId) {
    final timestamps = _followTimestamps[userId] ?? [];
    final cutoff = DateTime.now().subtract(const Duration(hours: 1));
    final recentCount = timestamps.where((t) => t.isAfter(cutoff)).length;
    return recentCount >= _maxFollowsPerHour;
  }

  int _getRemainingInWindow(String userId) {
    final timestamps = _followTimestamps[userId] ?? [];
    final cutoff = DateTime.now().subtract(const Duration(hours: 1));
    final recentCount = timestamps.where((t) => t.isAfter(cutoff)).length;
    return (_maxFollowsPerHour - recentCount).clamp(0, _maxFollowsPerHour);
  }

  void _recordFollowTimestamp(String userId) {
    _followTimestamps.putIfAbsent(userId, () => []);
    _followTimestamps[userId]!.add(DateTime.now());
    // Cleanup old timestamps
    final cutoff = DateTime.now().subtract(const Duration(hours: 2));
    _followTimestamps[userId] =
        _followTimestamps[userId]!.where((t) => t.isAfter(cutoff)).toList();
  }

  void _setCooldown(String userId, String targetUserId) {
    final key = '${userId}_$targetUserId';
    _unfollowCooldowns[key] = DateTime.now().add(_followCooldown);
  }

  /// Clear rate limit data (for testing)
  void clearRateLimitData() {
    _followTimestamps.clear();
    _unfollowCooldowns.clear();
  }
}
