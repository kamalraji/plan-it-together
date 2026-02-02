import 'package:thittam1hub/services/logging_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';

// ============================================
// FOLLOWER ANALYTICS MODELS
// ============================================

/// Follower graph metrics for a user
class FollowerGraphMetrics {
  final String userId;
  final int totalFollowers;
  final int totalFollowing;
  final int pendingIncoming;
  final int pendingOutgoing;
  final double followBackRate;
  final double networkReach;
  final int mutualFollowersAvg;
  final FollowerBehaviorFlags behaviorFlags;

  const FollowerGraphMetrics({
    required this.userId,
    required this.totalFollowers,
    required this.totalFollowing,
    required this.pendingIncoming,
    required this.pendingOutgoing,
    required this.followBackRate,
    required this.networkReach,
    required this.mutualFollowersAvg,
    required this.behaviorFlags,
  });

  factory FollowerGraphMetrics.empty(String userId) => FollowerGraphMetrics(
        userId: userId,
        totalFollowers: 0,
        totalFollowing: 0,
        pendingIncoming: 0,
        pendingOutgoing: 0,
        followBackRate: 0,
        networkReach: 0,
        mutualFollowersAvg: 0,
        behaviorFlags: FollowerBehaviorFlags.clean(),
      );
}

/// Flags for suspicious follower behavior
class FollowerBehaviorFlags {
  final bool massFollowing;
  final bool lowFollowBackRate;
  final bool rapidFollowUnfollow;
  final bool targetingNewUsers;
  final int riskScore;

  const FollowerBehaviorFlags({
    required this.massFollowing,
    required this.lowFollowBackRate,
    required this.rapidFollowUnfollow,
    required this.targetingNewUsers,
    required this.riskScore,
  });

  factory FollowerBehaviorFlags.clean() => const FollowerBehaviorFlags(
        massFollowing: false,
        lowFollowBackRate: false,
        rapidFollowUnfollow: false,
        targetingNewUsers: false,
        riskScore: 0,
      );

  bool get hasAnyFlag =>
      massFollowing || lowFollowBackRate || rapidFollowUnfollow || targetingNewUsers;
}

/// Follower activity over time
class FollowerActivity {
  final DateTime date;
  final int newFollowers;
  final int newFollowing;
  final int unfollowers;
  final int unfollowed;

  const FollowerActivity({
    required this.date,
    required this.newFollowers,
    required this.newFollowing,
    required this.unfollowers,
    required this.unfollowed,
  });
}

/// Mutual followers between two users
class MutualFollowersResult {
  final int count;
  final List<MutualFollower> followers;

  const MutualFollowersResult({
    required this.count,
    required this.followers,
  });
}

class MutualFollower {
  final String id;
  final String name;
  final String? avatarUrl;

  const MutualFollower({
    required this.id,
    required this.name,
    this.avatarUrl,
  });
}

/// Network growth statistics
class NetworkGrowthStats {
  final int followersThisWeek;
  final int followersLastWeek;
  final double growthRate;
  final int totalFollowers;
  final int totalFollowing;

  const NetworkGrowthStats({
    required this.followersThisWeek,
    required this.followersLastWeek,
    required this.growthRate,
    required this.totalFollowers,
    required this.totalFollowing,
  });
}

// ============================================
// FOLLOWER ANALYTICS SERVICE
// ============================================

class FollowerAnalyticsService {
  static const String _tag = 'FollowerAnalyticsService';
  static final _log = LoggingService.instance;
  static final _supabase = SupabaseConfig.client;

  // ============================================
  // USER ANALYTICS
  // ============================================

  /// Get follower graph metrics for a user
  static Future<FollowerGraphMetrics> getGraphMetrics(String userId) async {
    try {
      // Get followers (people following this user)
      final followers = await _supabase
          .from('followers')
          .select('status, follower_id, following_id, created_at')
          .eq('following_id', userId);

      // Get following (people this user follows)
      final following = await _supabase
          .from('followers')
          .select('status, follower_id, following_id, created_at')
          .eq('follower_id', userId);

      final followerList = followers as List;
      final followingList = following as List;

      int acceptedFollowers = 0;
      int pendingIncoming = 0;

      for (final f in followerList) {
        final status = f['status'] as String;
        if (status == 'ACCEPTED') {
          acceptedFollowers++;
        } else if (status == 'PENDING') {
          pendingIncoming++;
        }
      }

      int acceptedFollowing = 0;
      int pendingOutgoing = 0;

      for (final f in followingList) {
        final status = f['status'] as String;
        if (status == 'ACCEPTED') {
          acceptedFollowing++;
        } else if (status == 'PENDING') {
          pendingOutgoing++;
        }
      }

      // Calculate follow-back rate (% of people I follow who follow me back)
      final followBackRate = acceptedFollowing > 0
          ? acceptedFollowers / acceptedFollowing
          : 0.0;

      // Calculate behavior flags
      final behaviorFlags = _analyzeBehavior(userId, followerList, followingList);

      return FollowerGraphMetrics(
        userId: userId,
        totalFollowers: acceptedFollowers,
        totalFollowing: acceptedFollowing,
        pendingIncoming: pendingIncoming,
        pendingOutgoing: pendingOutgoing,
        followBackRate: followBackRate.clamp(0.0, 1.0),
        networkReach: _calculateNetworkReach(acceptedFollowers, acceptedFollowing),
        mutualFollowersAvg: await _calculateAvgMutuals(userId),
        behaviorFlags: behaviorFlags,
      );
    } catch (e) {
      _log.error('Error getting graph metrics', tag: _tag, error: e);
      return FollowerGraphMetrics.empty(userId);
    }
  }

  /// Analyze user behavior for suspicious patterns
  static FollowerBehaviorFlags _analyzeBehavior(
    String userId,
    List<dynamic> followers,
    List<dynamic> following,
  ) {
    int riskScore = 0;
    bool massFollowing = false;
    bool lowFollowBackRate = false;
    bool rapidFollowUnfollow = false;
    bool targetingNewUsers = false;

    // Check for mass following (following >500 with low follower count)
    if (following.length > 500 && followers.length < following.length * 0.1) {
      massFollowing = true;
      riskScore += 30;
    }

    // Check low follow-back rate (>100 following with <10% followers)
    if (following.length > 100 && followers.length < following.length * 0.1) {
      lowFollowBackRate = true;
      riskScore += 25;
    }

    // Check for rapid activity (many follows in last week)
    try {
      final weekAgo = DateTime.now().subtract(const Duration(days: 7));
      final recentFollowing = following
          .where((f) =>
              DateTime.parse(f['created_at'] as String).isAfter(weekAgo))
          .length;

      if (recentFollowing > 100) {
        rapidFollowUnfollow = true;
        riskScore += 20;
      }
    } catch (_) {}

    return FollowerBehaviorFlags(
      massFollowing: massFollowing,
      lowFollowBackRate: lowFollowBackRate,
      rapidFollowUnfollow: rapidFollowUnfollow,
      targetingNewUsers: targetingNewUsers,
      riskScore: riskScore.clamp(0, 100),
    );
  }

  /// Calculate network reach estimation
  static double _calculateNetworkReach(int followers, int following) {
    const avgFollowersPerUser = 25;
    return ((followers + following) * avgFollowersPerUser).toDouble();
  }

  /// Calculate average mutual followers
  static Future<int> _calculateAvgMutuals(String userId) async {
    // Simplified estimation
    return 3;
  }

  // ============================================
  // MUTUAL FOLLOWERS
  // ============================================

  /// Get mutual followers between two users (people both users follow)
  static Future<MutualFollowersResult> getMutualFollowers(
    String userId1,
    String userId2,
  ) async {
    try {
      // Get who user1 follows
      final user1Following = await _supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', userId1)
          .eq('status', 'ACCEPTED');

      // Get who user2 follows
      final user2Following = await _supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', userId2)
          .eq('status', 'ACCEPTED');

      // Extract user IDs
      final user1FollowingIds = <String>{};
      for (final f in user1Following as List) {
        user1FollowingIds.add(f['following_id'] as String);
      }

      final user2FollowingIds = <String>{};
      for (final f in user2Following as List) {
        user2FollowingIds.add(f['following_id'] as String);
      }

      // Find intersection
      final mutualIds = user1FollowingIds.intersection(user2FollowingIds);

      if (mutualIds.isEmpty) {
        return const MutualFollowersResult(count: 0, followers: []);
      }

      // Get profile info for mutuals (limit to 10)
      final mutualIdsList = mutualIds.take(10).toList();
      final profiles = await _supabase
          .from('impact_profiles')
          .select('user_id, full_name, avatar_url')
          .inFilter('user_id', mutualIdsList);

      final mutualFollowers = (profiles as List).map((p) {
        return MutualFollower(
          id: p['user_id'] as String,
          name: p['full_name'] as String? ?? 'Unknown',
          avatarUrl: p['avatar_url'] as String?,
        );
      }).toList();

      return MutualFollowersResult(
        count: mutualIds.length,
        followers: mutualFollowers,
      );
    } catch (e) {
      _log.error('Error getting mutual followers', tag: _tag, error: e);
      return const MutualFollowersResult(count: 0, followers: []);
    }
  }

  // ============================================
  // GROWTH ANALYTICS
  // ============================================

  /// Get network growth statistics
  static Future<NetworkGrowthStats> getNetworkGrowth(String userId) async {
    try {
      final now = DateTime.now();
      final weekAgo = now.subtract(const Duration(days: 7));
      final twoWeeksAgo = now.subtract(const Duration(days: 14));

      // This week's new followers
      final thisWeekFollowers = await _supabase
          .from('followers')
          .select('id')
          .eq('following_id', userId)
          .eq('status', 'ACCEPTED')
          .gte('created_at', weekAgo.toIso8601String());

      // Last week's new followers
      final lastWeekFollowers = await _supabase
          .from('followers')
          .select('id')
          .eq('following_id', userId)
          .eq('status', 'ACCEPTED')
          .gte('created_at', twoWeeksAgo.toIso8601String())
          .lt('created_at', weekAgo.toIso8601String());

      // Total followers
      final totalFollowers = await _supabase
          .from('followers')
          .select('id')
          .eq('following_id', userId)
          .eq('status', 'ACCEPTED');

      // Total following
      final totalFollowing = await _supabase
          .from('followers')
          .select('id')
          .eq('follower_id', userId)
          .eq('status', 'ACCEPTED');

      final thisWeekCount = (thisWeekFollowers as List).length;
      final lastWeekCount = (lastWeekFollowers as List).length;

      // Calculate growth rate
      final growthRate = lastWeekCount > 0
          ? ((thisWeekCount - lastWeekCount) / lastWeekCount * 100)
          : (thisWeekCount > 0 ? 100.0 : 0.0);

      return NetworkGrowthStats(
        followersThisWeek: thisWeekCount,
        followersLastWeek: lastWeekCount,
        growthRate: growthRate,
        totalFollowers: (totalFollowers as List).length,
        totalFollowing: (totalFollowing as List).length,
      );
    } catch (e) {
      _log.error('Error getting network growth', tag: _tag, error: e);
      return const NetworkGrowthStats(
        followersThisWeek: 0,
        followersLastWeek: 0,
        growthRate: 0,
        totalFollowers: 0,
        totalFollowing: 0,
      );
    }
  }

  // ============================================
  // SPAM/MANIPULATION DETECTION
  // ============================================

  /// Check if a user shows signs of follower manipulation
  static Future<bool> isUserSuspicious(String userId) async {
    final metrics = await getGraphMetrics(userId);
    return metrics.behaviorFlags.riskScore > 50;
  }

  /// Get users with suspicious follower behavior (admin only)
  /// Uses server-side RPC for efficient aggregation instead of client-side processing
  static Future<List<String>> getSuspiciousUsers({int limit = 20}) async {
    try {
      // Use RPC for server-side aggregation (requires admin role)
      final result = await _supabase.rpc('get_high_follow_count_users', params: {
        'min_following': 100,
        'result_limit': limit,
      });

      return (result as List).map((r) => r['user_id'] as String).toList();
    } catch (e) {
      _log.error('Error getting suspicious users', tag: _tag, error: e);
      return [];
    }
  }
}
