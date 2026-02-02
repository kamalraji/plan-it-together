import 'package:thittam1hub/services/logging_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';

// ============================================
// ENGAGEMENT ANALYTICS MODELS
// ============================================

/// Engagement metrics for a single post
class EngagementMetrics {
  final String? postId;
  final int sparkCount;
  final int commentCount;
  final int shareCount;
  final int ageHours;
  final double engagementRate;
  final int score;
  final double velocity;
  final EngagementTrend trend;

  const EngagementMetrics({
    this.postId,
    required this.sparkCount,
    required this.commentCount,
    required this.shareCount,
    required this.ageHours,
    required this.engagementRate,
    required this.score,
    required this.velocity,
    required this.trend,
  });

  factory EngagementMetrics.empty() => const EngagementMetrics(
        sparkCount: 0,
        commentCount: 0,
        shareCount: 0,
        ageHours: 1,
        engagementRate: 0,
        score: 0,
        velocity: 0,
        trend: EngagementTrend.stable,
      );

  /// Total engagement actions
  int get totalEngagements => sparkCount + commentCount + shareCount;

  /// Weighted engagement (sparks:1, comments:3, shares:5)
  int get weightedEngagements => sparkCount + (commentCount * 3) + (shareCount * 5);

  /// Check if post is trending (velocity > 5/hr and score > 50)
  bool get isTrending => velocity > 5 && score > 50;

  /// Check if post is viral (velocity > 20/hr and score > 80)
  bool get isViral => velocity > 20 && score > 80;
}

/// Engagement trend direction
enum EngagementTrend {
  rising,
  stable,
  declining,
}

/// User's spark activity statistics
class UserSparkStats {
  final int totalThisWeek;
  final double dailyAverage;
  final String mostActiveDay;
  final Map<String, int> dailyCounts;
  final int currentStreak;
  final int longestStreak;

  const UserSparkStats({
    required this.totalThisWeek,
    required this.dailyAverage,
    required this.mostActiveDay,
    required this.dailyCounts,
    this.currentStreak = 0,
    this.longestStreak = 0,
  });

  factory UserSparkStats.empty() => const UserSparkStats(
        totalThisWeek: 0,
        dailyAverage: 0,
        mostActiveDay: '',
        dailyCounts: {},
      );
}

/// Spark velocity data point for time series
class SparkVelocityPoint {
  final DateTime timestamp;
  final int count;
  final double velocity;

  const SparkVelocityPoint({
    required this.timestamp,
    required this.count,
    required this.velocity,
  });
}

/// Top engaged posts summary
class TopEngagedPost {
  final String postId;
  final String title;
  final int sparkCount;
  final int commentCount;
  final double engagementRate;

  const TopEngagedPost({
    required this.postId,
    required this.title,
    required this.sparkCount,
    required this.commentCount,
    required this.engagementRate,
  });
}

// ============================================
// SPARK ANALYTICS SERVICE
// ============================================

class SparkAnalyticsService {
  static const String _tag = 'SparkAnalyticsService';
  static final _log = LoggingService.instance;
  static final _supabase = SupabaseConfig.client;

  // ============================================
  // POST ENGAGEMENT ANALYTICS
  // ============================================

  /// Get spark velocity (sparks per hour in last 24h)
  static Future<double> getSparkVelocity(String postId) async {
    try {
      final response = await _supabase
          .from('spark_reactions')
          .select('created_at')
          .eq('post_id', postId)
          .gte('created_at',
              DateTime.now().subtract(const Duration(hours: 24)).toIso8601String());

      final count = (response as List).length;
      return count / 24.0; // sparks per hour
    } catch (e) {
      _log.error('Error getting spark velocity', tag: _tag, error: e);
      return 0;
    }
  }

  /// Get engagement metrics for a post (0-100 score)
  static Future<EngagementMetrics> getEngagementMetrics(String postId) async {
    try {
      final post = await _supabase
          .from('spark_posts')
          .select('spark_count, comment_count, share_count, created_at')
          .eq('id', postId)
          .maybeSingle();

      if (post == null) return EngagementMetrics.empty();

      final ageHours = DateTime.now()
          .difference(DateTime.parse(post['created_at']))
          .inHours
          .clamp(1, 168); // 1hr to 1 week

      final sparkCount = post['spark_count'] as int? ?? 0;
      final commentCount = post['comment_count'] as int? ?? 0;
      final shareCount = post['share_count'] as int? ?? 0;

      // Weighted engagement rate (sparks:1, comments:3, shares:5)
      final weightedTotal = sparkCount + (commentCount * 3) + (shareCount * 5);
      final engagementRate = weightedTotal / ageHours;

      // Normalize to 0-100 score
      final score = (engagementRate * 10).clamp(0, 100).toInt();

      // Calculate velocity
      final velocity = sparkCount / ageHours;

      // Determine trend based on recent vs older sparks
      final trend = await _calculateTrend(postId);

      return EngagementMetrics(
        postId: postId,
        sparkCount: sparkCount,
        commentCount: commentCount,
        shareCount: shareCount,
        ageHours: ageHours,
        engagementRate: engagementRate,
        score: score,
        velocity: velocity,
        trend: trend,
      );
    } catch (e) {
      _log.error('Error getting engagement metrics', tag: _tag, error: e);
      return EngagementMetrics.empty();
    }
  }

  /// Calculate trend by comparing recent vs older spark rates
  static Future<EngagementTrend> _calculateTrend(String postId) async {
    try {
      final now = DateTime.now();
      final sixHoursAgo = now.subtract(const Duration(hours: 6));
      final twelveHoursAgo = now.subtract(const Duration(hours: 12));

      // Get sparks from last 6 hours
      final recentResponse = await _supabase
          .from('spark_reactions')
          .select('id')
          .eq('post_id', postId)
          .gte('created_at', sixHoursAgo.toIso8601String());

      // Get sparks from 6-12 hours ago
      final olderResponse = await _supabase
          .from('spark_reactions')
          .select('id')
          .eq('post_id', postId)
          .gte('created_at', twelveHoursAgo.toIso8601String())
          .lt('created_at', sixHoursAgo.toIso8601String());

      final recentCount = (recentResponse as List).length;
      final olderCount = (olderResponse as List).length;

      if (recentCount > olderCount * 1.2) {
        return EngagementTrend.rising;
      } else if (recentCount < olderCount * 0.8) {
        return EngagementTrend.declining;
      }
      return EngagementTrend.stable;
    } catch (e) {
      return EngagementTrend.stable;
    }
  }

  // ============================================
  // USER ANALYTICS
  // ============================================

  /// Get user's spark activity summary for the past week
  static Future<UserSparkStats> getUserSparkStats(String userId) async {
    try {
      final weekAgo = DateTime.now().subtract(const Duration(days: 7));

      final sparks = await _supabase
          .from('spark_reactions')
          .select('created_at')
          .eq('user_id', userId)
          .gte('created_at', weekAgo.toIso8601String());

      final dailyCounts = <String, int>{};
      for (final spark in sparks as List) {
        final date =
            DateTime.parse(spark['created_at']).toIso8601String().substring(0, 10);
        dailyCounts[date] = (dailyCounts[date] ?? 0) + 1;
      }

      if (sparks.isEmpty) {
        return UserSparkStats.empty();
      }

      final mostActiveDay = dailyCounts.entries
          .reduce((a, b) => a.value > b.value ? a : b)
          .key;

      // Calculate streak
      final streakData = await _calculateStreak(userId);

      return UserSparkStats(
        totalThisWeek: sparks.length,
        dailyAverage: sparks.length / 7,
        mostActiveDay: mostActiveDay,
        dailyCounts: dailyCounts,
        currentStreak: streakData.current,
        longestStreak: streakData.longest,
      );
    } catch (e) {
      _log.error('Error getting user spark stats', tag: _tag, error: e);
      return UserSparkStats.empty();
    }
  }

  /// Calculate user's engagement streak
  static Future<({int current, int longest})> _calculateStreak(
      String userId) async {
    try {
      final thirtyDaysAgo = DateTime.now().subtract(const Duration(days: 30));

      final sparks = await _supabase
          .from('spark_reactions')
          .select('created_at')
          .eq('user_id', userId)
          .gte('created_at', thirtyDaysAgo.toIso8601String())
          .order('created_at', ascending: false);

      if ((sparks as List).isEmpty) {
        return (current: 0, longest: 0);
      }

      // Get unique active days
      final activeDays = <String>{};
      for (final spark in sparks) {
        final date =
            DateTime.parse(spark['created_at']).toIso8601String().substring(0, 10);
        activeDays.add(date);
      }

      // Calculate current streak
      int currentStreak = 0;
      int longestStreak = 0;
      int tempStreak = 0;
      DateTime checkDate = DateTime.now();

      for (int i = 0; i < 30; i++) {
        final dateStr = checkDate.toIso8601String().substring(0, 10);
        if (activeDays.contains(dateStr)) {
          tempStreak++;
          if (i < 7) currentStreak = tempStreak;
          if (tempStreak > longestStreak) longestStreak = tempStreak;
        } else {
          tempStreak = 0;
        }
        checkDate = checkDate.subtract(const Duration(days: 1));
      }

      return (current: currentStreak, longest: longestStreak);
    } catch (e) {
      return (current: 0, longest: 0);
    }
  }

  // ============================================
  // TRENDING & DISCOVERY ANALYTICS
  // ============================================

  /// Get top engaged posts in the last 24 hours
  static Future<List<TopEngagedPost>> getTopEngagedPosts({int limit = 10}) async {
    try {
      final response = await _supabase
          .from('spark_posts')
          .select('id, title, spark_count, comment_count, created_at')
          .gte('created_at',
              DateTime.now().subtract(const Duration(hours: 24)).toIso8601String())
          .order('spark_count', ascending: false)
          .limit(limit);

      return (response as List).map((post) {
        final ageHours = DateTime.now()
            .difference(DateTime.parse(post['created_at']))
            .inHours
            .clamp(1, 24);
        final sparkCount = post['spark_count'] as int? ?? 0;
        final commentCount = post['comment_count'] as int? ?? 0;

        return TopEngagedPost(
          postId: post['id'],
          title: post['title'],
          sparkCount: sparkCount,
          commentCount: commentCount,
          engagementRate: (sparkCount + commentCount * 3) / ageHours,
        );
      }).toList();
    } catch (e) {
      _log.error('Error getting top engaged posts', tag: _tag, error: e);
      return [];
    }
  }

  /// Get spark velocity time series for a post
  static Future<List<SparkVelocityPoint>> getSparkTimeSeries(
    String postId, {
    Duration interval = const Duration(hours: 1),
    int maxPoints = 24,
  }) async {
    try {
      final response = await _supabase
          .from('spark_reactions')
          .select('created_at')
          .eq('post_id', postId)
          .gte('created_at',
              DateTime.now().subtract(Duration(hours: maxPoints)).toIso8601String())
          .order('created_at', ascending: true);

      if ((response as List).isEmpty) return [];

      // Group by interval
      final points = <SparkVelocityPoint>[];
      final buckets = <DateTime, int>{};

      for (final spark in response) {
        final timestamp = DateTime.parse(spark['created_at']);
        final bucketKey = DateTime(
          timestamp.year,
          timestamp.month,
          timestamp.day,
          timestamp.hour,
        );
        buckets[bucketKey] = (buckets[bucketKey] ?? 0) + 1;
      }

      buckets.forEach((timestamp, count) {
        points.add(SparkVelocityPoint(
          timestamp: timestamp,
          count: count,
          velocity: count.toDouble(),
        ));
      });

      return points;
    } catch (e) {
      _log.error('Error getting spark time series', tag: _tag, error: e);
      return [];
    }
  }

  // ============================================
  // AGGREGATE PLATFORM ANALYTICS
  // ============================================

  /// Get platform-wide engagement summary (admin use)
  static Future<Map<String, dynamic>> getPlatformStats() async {
    try {
      final today = DateTime.now();
      final todayStart = DateTime(today.year, today.month, today.day);

      // Today's sparks
      final todaySparks = await _supabase
          .from('spark_reactions')
          .select('id')
          .gte('created_at', todayStart.toIso8601String());

      // Today's posts
      final todayPosts = await _supabase
          .from('spark_posts')
          .select('id')
          .gte('created_at', todayStart.toIso8601String());

      // Active users (users who sparked today)
      final activeUsers = await _supabase
          .from('spark_reactions')
          .select('user_id')
          .gte('created_at', todayStart.toIso8601String());

      final uniqueUsers = (activeUsers as List)
          .map((r) => r['user_id'] as String)
          .toSet()
          .length;

      return {
        'sparks_today': (todaySparks as List).length,
        'posts_today': (todayPosts as List).length,
        'active_users_today': uniqueUsers,
        'avg_sparks_per_user':
            uniqueUsers > 0 ? (todaySparks as List).length / uniqueUsers : 0,
        'generated_at': DateTime.now().toIso8601String(),
      };
    } catch (e) {
      _log.error('Error getting platform stats', tag: _tag, error: e);
      return {};
    }
  }
}
