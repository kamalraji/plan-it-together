import 'dart:async';
import 'dart:collection';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart' show IconData;
import 'package:flutter/material.dart' show Icons;
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/services/logging_service.dart';

/// Industry-standard share analytics service with rate limiting, 
/// batch processing, virality scoring, and comprehensive metrics
class ShareAnalyticsService {
  static const String _tag = 'ShareAnalytics';
  static final _log = LoggingService.instance;
  static final _supabase = SupabaseConfig.client;
  
  // ─────────────────────────────────────────────────────────────────────────
  // RATE LIMITING & BATCH PROCESSING
  // ─────────────────────────────────────────────────────────────────────────
  
  /// Pending share events to be batched
  static final Queue<_PendingShareEvent> _pendingShares = Queue();
  
  /// Rate limit: max shares per minute per user
  static const int _maxSharesPerMinute = 30;
  
  /// Batch processing interval
  static const Duration _batchInterval = Duration(seconds: 5);
  
  /// Track share counts per user for rate limiting
  static final Map<String, List<DateTime>> _userShareTimestamps = {};
  
  /// Batch processing timer
  static Timer? _batchTimer;
  
  /// Check if user is rate limited
  static bool _isRateLimited(String userId) {
    final timestamps = _userShareTimestamps[userId] ?? [];
    final cutoff = DateTime.now().subtract(const Duration(minutes: 1));
    final recentShares = timestamps.where((t) => t.isAfter(cutoff)).length;
    return recentShares >= _maxSharesPerMinute;
  }
  
  /// Record share timestamp for rate limiting
  static void _recordShareTimestamp(String userId) {
    _userShareTimestamps.putIfAbsent(userId, () => []);
    _userShareTimestamps[userId]!.add(DateTime.now());
    
    // Clean up old timestamps
    final cutoff = DateTime.now().subtract(const Duration(minutes: 2));
    _userShareTimestamps[userId]!.removeWhere((t) => t.isBefore(cutoff));
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────

  /// Record a share event with rate limiting and batch processing
  static Future<ShareRecordResult> recordShare({
    required String postId,
    required String destinationType,
    String? destinationId,
    String? destinationName,
    required String platform,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) {
        return ShareRecordResult.failure('Not authenticated');
      }

      // Rate limiting check
      if (_isRateLimited(userId)) {
        _log.warning('Share rate limited', tag: _tag, metadata: {'user_id': _maskUserId(userId)});
        return ShareRecordResult.rateLimited();
      }

      _recordShareTimestamp(userId);

      // Queue for batch processing
      _pendingShares.add(_PendingShareEvent(
        postId: postId,
        sharerId: userId,
        destinationType: destinationType,
        destinationId: destinationId,
        destinationName: destinationName,
        platform: platform,
        metadata: metadata,
        queuedAt: DateTime.now(),
      ));

      // Start batch timer if not running
      _startBatchTimer();

      return ShareRecordResult.success();
    } catch (e) {
      _log.error('Share analytics error', tag: _tag, error: e);
      return ShareRecordResult.failure(e.toString());
    }
  }

  /// Force flush pending shares immediately
  static Future<void> flushPendingShares() async {
    await _processBatch();
  }

  /// Get share count for a post
  static Future<int> getShareCount(String postId) async {
    try {
      final result = await _supabase
          .from('spark_posts')
          .select('share_count')
          .eq('id', postId)
          .maybeSingle();
      
      return (result?['share_count'] as int?) ?? 0;
    } catch (e) {
      return 0;
    }
  }

  /// Get comprehensive share analytics for a post
  static Future<ShareAnalytics> getShareAnalytics(String postId) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return ShareAnalytics.empty();

      final shares = await _supabase
          .from('post_shares')
          .select()
          .eq('post_id', postId)
          .order('shared_at', ascending: false);

      return ShareAnalytics.fromShares(
        List<Map<String, dynamic>>.from(shares),
        postId: postId,
      );
    } catch (e) {
      return ShareAnalytics.empty();
    }
  }

  /// Get virality score and metrics for a post
  static Future<ViralityMetrics> getViralityMetrics(String postId) async {
    try {
      final analytics = await getShareAnalytics(postId);
      final post = await _supabase
          .from('spark_posts')
          .select('created_at, spark_count, comment_count, share_count')
          .eq('id', postId)
          .maybeSingle();

      if (post == null) return ViralityMetrics.empty();

      final createdAt = DateTime.parse(post['created_at'] as String);
      final ageInHours = DateTime.now().difference(createdAt).inHours;
      final sparkCount = (post['spark_count'] as int?) ?? 0;
      final commentCount = (post['comment_count'] as int?) ?? 0;
      final shareCount = (post['share_count'] as int?) ?? 0;

      return ViralityMetrics.calculate(
        shareCount: shareCount,
        sparkCount: sparkCount,
        commentCount: commentCount,
        ageInHours: ageInHours,
        analytics: analytics,
      );
    } catch (e) {
      return ViralityMetrics.empty();
    }
  }

  /// Get time-series share data for trending analysis
  static Future<List<ShareTimePoint>> getShareTimeSeries({
    required String postId,
    Duration interval = const Duration(hours: 1),
    int maxPoints = 24,
  }) async {
    try {
      final shares = await _supabase
          .from('post_shares')
          .select('shared_at')
          .eq('post_id', postId)
          .order('shared_at', ascending: true);

      if ((shares as List).isEmpty) return [];

      final points = <ShareTimePoint>[];
      final firstShare = DateTime.parse(shares.first['shared_at'] as String);
      var currentBucket = firstShare;
      var count = 0;

      for (final share in shares) {
        final shareTime = DateTime.parse(share['shared_at'] as String);
        
        while (shareTime.isAfter(currentBucket.add(interval))) {
          points.add(ShareTimePoint(
            timestamp: currentBucket,
            count: count,
            cumulativeCount: points.isEmpty 
                ? count 
                : points.last.cumulativeCount + count,
          ));
          currentBucket = currentBucket.add(interval);
          count = 0;
          
          if (points.length >= maxPoints) break;
        }
        
        count++;
      }

      // Add final bucket
      if (points.length < maxPoints) {
        points.add(ShareTimePoint(
          timestamp: currentBucket,
          count: count,
          cumulativeCount: points.isEmpty 
              ? count 
              : points.last.cumulativeCount + count,
        ));
      }

      return points;
    } catch (e) {
      return [];
    }
  }

  /// Get top sharers for a post
  static Future<List<TopSharer>> getTopSharers(String postId, {int limit = 10}) async {
    try {
      // This would ideally be an RPC, but we can aggregate client-side for now
      final shares = await _supabase
          .from('post_shares')
          .select('sharer_id')
          .eq('post_id', postId);

      final sharerCounts = <String, int>{};
      for (final share in shares as List) {
        final sharerId = share['sharer_id'] as String;
        sharerCounts[sharerId] = (sharerCounts[sharerId] ?? 0) + 1;
      }

      final sorted = sharerCounts.entries.toList()
        ..sort((a, b) => b.value.compareTo(a.value));

      final topSharerIds = sorted.take(limit).map((e) => e.key).toList();
      
      if (topSharerIds.isEmpty) return [];

      final profiles = await _supabase
          .from('user_profiles')
          .select('id, full_name, avatar_url')
          .inFilter('id', topSharerIds);

      return sorted.take(limit).map((entry) {
        final profile = (profiles as List).firstWhere(
          (p) => p['id'] == entry.key,
          orElse: () => <String, dynamic>{},
        );
        return TopSharer(
          userId: entry.key,
          shareCount: entry.value,
          userName: profile['full_name'] as String? ?? 'Unknown',
          avatarUrl: profile['avatar_url'] as String?,
        );
      }).toList();
    } catch (e) {
      return [];
    }
  }

  /// Get recent shares by the current user
  static Future<List<ShareRecord>> getMyRecentShares({int limit = 20}) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return [];

      final shares = await _supabase
          .from('post_shares')
          .select()
          .eq('sharer_id', userId)
          .order('shared_at', ascending: false)
          .limit(limit);

      return (shares as List)
          .map((s) => ShareRecord.fromJson(Map<String, dynamic>.from(s)))
          .toList();
    } catch (e) {
      return [];
    }
  }

  /// Get share reach estimate (unique users exposed via shares)
  static Future<ShareReachMetrics> getShareReach(String postId) async {
    try {
      final shares = await _supabase
          .from('post_shares')
          .select('destination_type, destination_id')
          .eq('post_id', postId);

      final dmCount = (shares as List)
          .where((s) => s['destination_type'] == 'dm')
          .length;
      
      final groupShares = shares.where((s) => s['destination_type'] == 'group');
      final channelShares = shares.where((s) => s['destination_type'] == 'channel');
      final externalShares = shares.where((s) => s['destination_type'] == 'external');

      // Estimate reach based on typical group/channel sizes
      const avgGroupSize = 12;
      const avgChannelSize = 50;
      const avgExternalReach = 25;

      final estimatedReach = dmCount + 
          (groupShares.length * avgGroupSize) +
          (channelShares.length * avgChannelSize) +
          (externalShares.length * avgExternalReach);

      return ShareReachMetrics(
        directReach: dmCount,
        groupReach: groupShares.length * avgGroupSize,
        channelReach: channelShares.length * avgChannelSize,
        externalReach: externalShares.length * avgExternalReach,
        totalEstimatedReach: estimatedReach,
        uniqueDestinations: shares.map((s) => s['destination_id']).toSet().length,
      );
    } catch (e) {
      return ShareReachMetrics.empty();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BATCH PROCESSING
  // ─────────────────────────────────────────────────────────────────────────

  static void _startBatchTimer() {
    _batchTimer ??= Timer.periodic(_batchInterval, (_) => _processBatch());
  }

  static Future<void> _processBatch() async {
    if (_pendingShares.isEmpty) return;

    final batch = <_PendingShareEvent>[];
    while (_pendingShares.isNotEmpty && batch.length < 50) {
      batch.add(_pendingShares.removeFirst());
    }

    if (batch.isEmpty) return;

    try {
      final inserts = batch.map((e) => {
        'post_id': e.postId,
        'sharer_id': e.sharerId,
        'destination_type': e.destinationType,
        'destination_id': e.destinationId,
        'destination_name': e.destinationName,
        'platform': e.platform,
        'metadata': e.metadata,
      }).toList();

      await _supabase.from('post_shares').insert(inserts);
      _log.dbOperation('INSERT', 'post_shares', rowCount: batch.length, tag: _tag);
    } catch (e) {
      _log.error('Batch processing failed', tag: _tag, error: e);
      // Re-queue failed events (with backoff)
      for (final event in batch.where((e) => e.retryCount < 3)) {
        _pendingShares.add(event.copyWithRetry());
      }
    }
  }

  /// Mask user ID for logging (privacy)
  static String _maskUserId(String userId) {
    if (userId.length <= 8) return '***';
    return '${userId.substring(0, 4)}...${userId.substring(userId.length - 4)}';
  }

  /// Dispose resources
  static void dispose() {
    _batchTimer?.cancel();
    _batchTimer = null;
    _pendingShares.clear();
    _userShareTimestamps.clear();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL MODELS
// ─────────────────────────────────────────────────────────────────────────────

class _PendingShareEvent {
  final String postId;
  final String sharerId;
  final String destinationType;
  final String? destinationId;
  final String? destinationName;
  final String platform;
  final Map<String, dynamic>? metadata;
  final DateTime queuedAt;
  final int retryCount;

  const _PendingShareEvent({
    required this.postId,
    required this.sharerId,
    required this.destinationType,
    this.destinationId,
    this.destinationName,
    required this.platform,
    this.metadata,
    required this.queuedAt,
    this.retryCount = 0,
  });

  _PendingShareEvent copyWithRetry() => _PendingShareEvent(
    postId: postId,
    sharerId: sharerId,
    destinationType: destinationType,
    destinationId: destinationId,
    destinationName: destinationName,
    platform: platform,
    metadata: metadata,
    queuedAt: queuedAt,
    retryCount: retryCount + 1,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC MODELS
// ─────────────────────────────────────────────────────────────────────────────

/// Result of recording a share
class ShareRecordResult {
  final bool success;
  final bool rateLimited;
  final String? error;

  const ShareRecordResult._({
    required this.success,
    this.rateLimited = false,
    this.error,
  });

  factory ShareRecordResult.success() => const ShareRecordResult._(success: true);
  factory ShareRecordResult.rateLimited() => const ShareRecordResult._(
    success: false, 
    rateLimited: true,
    error: 'Too many shares. Please slow down.',
  );
  factory ShareRecordResult.failure(String error) => ShareRecordResult._(
    success: false, 
    error: error,
  );
}

/// Individual share record
class ShareRecord {
  final String id;
  final String postId;
  final String sharerId;
  final String destinationType;
  final String? destinationId;
  final String? destinationName;
  final String? platform;
  final DateTime sharedAt;

  const ShareRecord({
    required this.id,
    required this.postId,
    required this.sharerId,
    required this.destinationType,
    this.destinationId,
    this.destinationName,
    this.platform,
    required this.sharedAt,
  });

  factory ShareRecord.fromJson(Map<String, dynamic> json) => ShareRecord(
    id: json['id'] as String,
    postId: json['post_id'] as String,
    sharerId: json['sharer_id'] as String,
    destinationType: json['destination_type'] as String,
    destinationId: json['destination_id'] as String?,
    destinationName: json['destination_name'] as String?,
    platform: json['platform'] as String?,
    sharedAt: DateTime.parse(json['shared_at'] as String),
  );

  String get platformLabel {
    switch (platform) {
      case 'twitter': return 'X (Twitter)';
      case 'linkedin': return 'LinkedIn';
      case 'whatsapp': return 'WhatsApp';
      case 'telegram': return 'Telegram';
      case 'copy_link': return 'Link copied';
      case 'native_share': return 'Share menu';
      case 'in_app': return 'In-app';
      default: return platform ?? 'Unknown';
    }
  }

  String get destinationLabel {
    switch (destinationType) {
      case 'dm': return 'Direct message';
      case 'group': return 'Group chat';
      case 'channel': return 'Channel';
      case 'external': return platformLabel;
      default: return destinationType;
    }
  }

  IconData get platformIcon {
    switch (platform) {
      case 'twitter': return _ShareIcons.twitter;
      case 'linkedin': return _ShareIcons.linkedin;
      case 'whatsapp': return _ShareIcons.whatsapp;
      case 'telegram': return _ShareIcons.telegram;
      case 'copy_link': return _ShareIcons.link;
      default: return _ShareIcons.share;
    }
  }
}

/// Platform icon constants using material icons
class _ShareIcons {
  static IconData get twitter => Icons.alternate_email;
  static IconData get linkedin => Icons.business;
  static IconData get whatsapp => Icons.chat;
  static IconData get telegram => Icons.send;
  static IconData get link => Icons.link;
  static IconData get share => Icons.share;
}

/// Analytics summary for a post's shares
class ShareAnalytics {
  final int totalShares;
  final Map<String, int> byDestinationType;
  final Map<String, int> byPlatform;
  final Map<String, int> byHour; // Hour of day distribution
  final Map<String, int> byDayOfWeek; // Day distribution
  final List<ShareRecord> recentShares;
  final DateTime? firstShareAt;
  final DateTime? lastShareAt;
  final double avgSharesPerDay;

  const ShareAnalytics({
    required this.totalShares,
    required this.byDestinationType,
    required this.byPlatform,
    required this.byHour,
    required this.byDayOfWeek,
    required this.recentShares,
    this.firstShareAt,
    this.lastShareAt,
    required this.avgSharesPerDay,
  });

  factory ShareAnalytics.empty() => const ShareAnalytics(
    totalShares: 0,
    byDestinationType: {},
    byPlatform: {},
    byHour: {},
    byDayOfWeek: {},
    recentShares: [],
    avgSharesPerDay: 0,
  );

  factory ShareAnalytics.fromShares(
    List<Map<String, dynamic>> shares, {
    String? postId,
  }) {
    if (shares.isEmpty) return ShareAnalytics.empty();

    final byDestType = <String, int>{};
    final byPlat = <String, int>{};
    final byHour = <String, int>{};
    final byDayOfWeek = <String, int>{};
    final records = <ShareRecord>[];
    DateTime? firstShare;
    DateTime? lastShare;

    for (final s in shares) {
      final record = ShareRecord.fromJson(s);
      records.add(record);

      byDestType[record.destinationType] = 
          (byDestType[record.destinationType] ?? 0) + 1;
      
      if (record.platform != null) {
        byPlat[record.platform!] = (byPlat[record.platform!] ?? 0) + 1;
      }

      // Time distribution
      final hour = record.sharedAt.hour.toString().padLeft(2, '0');
      byHour[hour] = (byHour[hour] ?? 0) + 1;

      final dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      final dayName = dayNames[record.sharedAt.weekday - 1];
      byDayOfWeek[dayName] = (byDayOfWeek[dayName] ?? 0) + 1;

      firstShare ??= record.sharedAt;
      if (firstShare.isAfter(record.sharedAt)) firstShare = record.sharedAt;
      
      lastShare ??= record.sharedAt;
      if (lastShare!.isBefore(record.sharedAt)) lastShare = record.sharedAt;
    }

    // Calculate average shares per day
    double avgPerDay = 0;
    if (firstShare != null && lastShare != null) {
      final days = lastShare.difference(firstShare).inDays + 1;
      avgPerDay = shares.length / days;
    }

    return ShareAnalytics(
      totalShares: shares.length,
      byDestinationType: byDestType,
      byPlatform: byPlat,
      byHour: byHour,
      byDayOfWeek: byDayOfWeek,
      recentShares: records.take(10).toList(),
      firstShareAt: firstShare,
      lastShareAt: lastShare,
      avgSharesPerDay: avgPerDay,
    );
  }

  /// Get percentage breakdown by destination type
  Map<String, double> get destinationPercentages {
    if (totalShares == 0) return {};
    return byDestinationType.map(
      (k, v) => MapEntry(k, (v / totalShares) * 100),
    );
  }

  /// Get the most popular sharing method
  String? get topPlatform {
    if (byPlatform.isEmpty) return null;
    return byPlatform.entries
        .reduce((a, b) => a.value > b.value ? a : b)
        .key;
  }

  /// Get the most common destination type
  String? get topDestinationType {
    if (byDestinationType.isEmpty) return null;
    return byDestinationType.entries
        .reduce((a, b) => a.value > b.value ? a : b)
        .key;
  }

  /// Get peak sharing hour
  int? get peakHour {
    if (byHour.isEmpty) return null;
    final peak = byHour.entries.reduce((a, b) => a.value > b.value ? a : b);
    return int.tryParse(peak.key);
  }

  /// Get peak sharing day
  String? get peakDay {
    if (byDayOfWeek.isEmpty) return null;
    return byDayOfWeek.entries.reduce((a, b) => a.value > b.value ? a : b).key;
  }
}

/// Virality metrics for a post
class ViralityMetrics {
  final double viralityScore; // 0-100
  final String viralityTier; // 'low', 'moderate', 'high', 'viral'
  final double shareVelocity; // shares per hour
  final double engagementRatio; // (sparks + comments) / shares
  final double amplificationFactor; // total reach / direct shares
  final bool isTrending;
  final String trendDirection; // 'up', 'down', 'stable'

  const ViralityMetrics({
    required this.viralityScore,
    required this.viralityTier,
    required this.shareVelocity,
    required this.engagementRatio,
    required this.amplificationFactor,
    required this.isTrending,
    required this.trendDirection,
  });

  factory ViralityMetrics.empty() => const ViralityMetrics(
    viralityScore: 0,
    viralityTier: 'none',
    shareVelocity: 0,
    engagementRatio: 0,
    amplificationFactor: 1,
    isTrending: false,
    trendDirection: 'stable',
  );

  factory ViralityMetrics.calculate({
    required int shareCount,
    required int sparkCount,
    required int commentCount,
    required int ageInHours,
    required ShareAnalytics analytics,
  }) {
    if (shareCount == 0) return ViralityMetrics.empty();

    // Share velocity (shares per hour, normalized for age)
    final velocity = ageInHours > 0 ? shareCount / ageInHours : shareCount.toDouble();

    // Engagement ratio
    final totalEngagement = sparkCount + commentCount;
    final engagementRatio = totalEngagement > 0 ? shareCount / totalEngagement : 0.0;

    // Amplification (external shares reach more people)
    final externalShares = analytics.byDestinationType['external'] ?? 0;
    final amplification = 1 + (externalShares * 0.5);

    // Calculate virality score (0-100)
    // Factors: velocity, engagement, external reach, recency
    double score = 0;
    
    // Velocity component (max 40 points)
    score += (velocity * 10).clamp(0, 40);
    
    // Share count component (max 30 points)
    score += (shareCount * 2).clamp(0, 30).toDouble();
    
    // External amplification (max 20 points)
    score += (externalShares * 5).clamp(0, 20);
    
    // Recency boost (max 10 points, decay over 24h)
    final recencyBoost = ageInHours < 24 ? 10 * (1 - ageInHours / 24) : 0;
    score += recencyBoost;

    score = score.clamp(0, 100);

    // Determine tier
    String tier;
    if (score >= 75) {
      tier = 'viral';
    } else if (score >= 50) {
      tier = 'high';
    } else if (score >= 25) {
      tier = 'moderate';
    } else {
      tier = 'low';
    }

    // Trending detection (recent acceleration)
    final isTrending = velocity > 2 && ageInHours < 48;

    return ViralityMetrics(
      viralityScore: score,
      viralityTier: tier,
      shareVelocity: velocity,
      engagementRatio: engagementRatio,
      amplificationFactor: amplification,
      isTrending: isTrending,
      trendDirection: velocity > 1 ? 'up' : (velocity > 0.5 ? 'stable' : 'down'),
    );
  }
}

/// Time-series data point for share trends
class ShareTimePoint {
  final DateTime timestamp;
  final int count;
  final int cumulativeCount;

  const ShareTimePoint({
    required this.timestamp,
    required this.count,
    required this.cumulativeCount,
  });
}

/// Top sharer info
class TopSharer {
  final String userId;
  final int shareCount;
  final String userName;
  final String? avatarUrl;

  const TopSharer({
    required this.userId,
    required this.shareCount,
    required this.userName,
    this.avatarUrl,
  });
}

/// Share reach metrics
class ShareReachMetrics {
  final int directReach;
  final int groupReach;
  final int channelReach;
  final int externalReach;
  final int totalEstimatedReach;
  final int uniqueDestinations;

  const ShareReachMetrics({
    required this.directReach,
    required this.groupReach,
    required this.channelReach,
    required this.externalReach,
    required this.totalEstimatedReach,
    required this.uniqueDestinations,
  });

  factory ShareReachMetrics.empty() => const ShareReachMetrics(
    directReach: 0,
    groupReach: 0,
    channelReach: 0,
    externalReach: 0,
    totalEstimatedReach: 0,
    uniqueDestinations: 0,
  );

  String get formattedReach {
    if (totalEstimatedReach >= 1000000) {
      return '${(totalEstimatedReach / 1000000).toStringAsFixed(1)}M';
    } else if (totalEstimatedReach >= 1000) {
      return '${(totalEstimatedReach / 1000).toStringAsFixed(1)}K';
    }
    return totalEstimatedReach.toString();
  }
}
