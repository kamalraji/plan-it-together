import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/services/logging_service.dart';

/// Analytics event types for comments
enum CommentAnalyticsEvent {
  viewed,
  liked,
  unliked,
  replied,
  edited,
  deleted,
  reported,
  pinned,
  unpinned,
  mentionTapped,
  reactionAdded,
  reactionRemoved,
  expanded,
  collapsed,
}

/// Engagement metrics for a comment thread
class CommentThreadMetrics {
  final String postId;
  final int totalComments;
  final int totalReplies;
  final int totalLikes;
  final int uniqueCommenters;
  final double averageLikesPerComment;
  final double averageReplyDepth;
  final int maxReplyDepth;
  final DateTime? firstCommentAt;
  final DateTime? lastCommentAt;
  final Duration? averageResponseTime;

  const CommentThreadMetrics({
    required this.postId,
    required this.totalComments,
    required this.totalReplies,
    required this.totalLikes,
    required this.uniqueCommenters,
    required this.averageLikesPerComment,
    required this.averageReplyDepth,
    required this.maxReplyDepth,
    this.firstCommentAt,
    this.lastCommentAt,
    this.averageResponseTime,
  });

  double get engagementScore {
    if (totalComments == 0) return 0;
    return (totalLikes * 1.0 + totalReplies * 2.0) / totalComments;
  }

  Map<String, dynamic> toMap() => {
        'post_id': postId,
        'total_comments': totalComments,
        'total_replies': totalReplies,
        'total_likes': totalLikes,
        'unique_commenters': uniqueCommenters,
        'avg_likes_per_comment': averageLikesPerComment,
        'avg_reply_depth': averageReplyDepth,
        'max_reply_depth': maxReplyDepth,
        'first_comment_at': firstCommentAt?.toIso8601String(),
        'last_comment_at': lastCommentAt?.toIso8601String(),
        'avg_response_time_ms': averageResponseTime?.inMilliseconds,
        'engagement_score': engagementScore,
      };
}

/// User interaction patterns for comments
class UserCommentPattern {
  final String userId;
  final int totalComments;
  final int totalReplies;
  final int totalLikesGiven;
  final int totalLikesReceived;
  final int totalMentions;
  final double averageCommentLength;
  final List<String> frequentlyUsedEmojis;
  final Map<int, int> activityByHour;
  final Map<int, int> activityByDay;

  const UserCommentPattern({
    required this.userId,
    required this.totalComments,
    required this.totalReplies,
    required this.totalLikesGiven,
    required this.totalLikesReceived,
    required this.totalMentions,
    required this.averageCommentLength,
    required this.frequentlyUsedEmojis,
    required this.activityByHour,
    required this.activityByDay,
  });

  double get engagementRatio {
    final given = totalLikesGiven + totalReplies;
    final received = totalLikesReceived + totalMentions;
    if (received == 0) return given > 0 ? double.infinity : 0;
    return given / received;
  }

  String get peakActivityHour {
    if (activityByHour.isEmpty) return 'N/A';
    final peak = activityByHour.entries.reduce(
      (a, b) => a.value > b.value ? a : b,
    );
    return '${peak.key}:00';
  }

  Map<String, dynamic> toMap() => {
        'user_id': userId,
        'total_comments': totalComments,
        'total_replies': totalReplies,
        'total_likes_given': totalLikesGiven,
        'total_likes_received': totalLikesReceived,
        'total_mentions': totalMentions,
        'avg_comment_length': averageCommentLength,
        'frequent_emojis': frequentlyUsedEmojis,
        'activity_by_hour': activityByHour,
        'activity_by_day': activityByDay,
        'engagement_ratio': engagementRatio,
        'peak_activity_hour': peakActivityHour,
      };
}

/// Service for tracking and analyzing comment engagement
class CommentAnalyticsService {
  static const String _tag = 'CommentAnalytics';
  static final _log = LoggingService.instance;
  
  static CommentAnalyticsService? _instance;
  static CommentAnalyticsService get instance => _instance ??= CommentAnalyticsService._();
  CommentAnalyticsService._();

  final _supabase = Supabase.instance.client;

  // In-memory event buffer for batching
  final List<_AnalyticsEvent> _eventBuffer = [];
  Timer? _flushTimer;
  static const int _bufferSize = 20;
  static const Duration _flushInterval = Duration(seconds: 30);

  // Session tracking
  final Map<String, DateTime> _commentViewStartTimes = {};
  final Map<String, int> _sessionInteractions = {};

  /// Track a comment analytics event
  void trackEvent({
    required CommentAnalyticsEvent event,
    required String commentId,
    String? postId,
    String? targetUserId,
    Map<String, dynamic>? metadata,
  }) {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return;

    final analyticsEvent = _AnalyticsEvent(
      event: event,
      commentId: commentId,
      postId: postId,
      userId: userId,
      targetUserId: targetUserId,
      metadata: metadata,
      timestamp: DateTime.now(),
    );

    _eventBuffer.add(analyticsEvent);
    _sessionInteractions[postId ?? 'global'] = 
        (_sessionInteractions[postId ?? 'global'] ?? 0) + 1;

    // Flush if buffer is full
    if (_eventBuffer.length >= _bufferSize) {
      _flushEvents();
    } else {
      _scheduleFlush();
    }

    _log.debug('Comment event: ${event.name}', tag: _tag, metadata: {'comment_id': commentId});
  }

  /// Track when user starts viewing a comment
  void trackCommentViewStart(String commentId) {
    _commentViewStartTimes[commentId] = DateTime.now();
  }

  /// Track when user stops viewing a comment
  void trackCommentViewEnd(String commentId) {
    final startTime = _commentViewStartTimes.remove(commentId);
    if (startTime == null) return;

    final duration = DateTime.now().difference(startTime);
    if (duration.inSeconds >= 2) {
      trackEvent(
        event: CommentAnalyticsEvent.viewed,
        commentId: commentId,
        metadata: {'view_duration_ms': duration.inMilliseconds},
      );
    }
  }

  /// Get engagement metrics for a comment thread
  Future<CommentThreadMetrics?> getThreadMetrics(String postId) async {
    try {
      // Fetch all comments for the post
      final comments = await _supabase
          .from('spark_comments')
          .select('id, user_id, parent_id, like_count, created_at')
          .eq('post_id', postId);

      if (comments.isEmpty) {
        return CommentThreadMetrics(
          postId: postId,
          totalComments: 0,
          totalReplies: 0,
          totalLikes: 0,
          uniqueCommenters: 0,
          averageLikesPerComment: 0,
          averageReplyDepth: 0,
          maxReplyDepth: 0,
        );
      }

      final List<dynamic> commentList = comments;
      final topLevel = commentList.where((c) => c['parent_id'] == null).toList();
      final replies = commentList.where((c) => c['parent_id'] != null).toList();
      
      final totalLikes = commentList.fold<int>(
        0,
        (sum, c) => sum + ((c['like_count'] as int?) ?? 0),
      );

      final uniqueUsers = commentList.map((c) => c['user_id']).toSet();

      // Calculate reply depths
      final depthMap = <String, int>{};
      for (final comment in commentList) {
        depthMap[comment['id']] = 0;
      }
      
      int maxDepth = 0;
      for (final reply in replies) {
        final parentId = reply['parent_id'] as String;
        final parentDepth = depthMap[parentId] ?? 0;
        final depth = parentDepth + 1;
        depthMap[reply['id']] = depth;
        if (depth > maxDepth) maxDepth = depth;
      }

      final totalDepth = depthMap.values.fold(0, (a, b) => a + b);
      final avgDepth = commentList.isNotEmpty 
          ? totalDepth / commentList.length 
          : 0.0;

      // Parse timestamps
      final timestamps = commentList
          .map((c) => DateTime.tryParse(c['created_at'] ?? ''))
          .whereType<DateTime>()
          .toList();
      timestamps.sort();

      // Calculate average response time
      Duration? avgResponseTime;
      if (replies.isNotEmpty) {
        final responseTimes = <Duration>[];
        for (final reply in replies) {
          final parentId = reply['parent_id'] as String;
          final parent = commentList.firstWhere(
            (c) => c['id'] == parentId,
            orElse: () => null,
          );
          if (parent != null) {
            final parentTime = DateTime.tryParse(parent['created_at'] ?? '');
            final replyTime = DateTime.tryParse(reply['created_at'] ?? '');
            if (parentTime != null && replyTime != null) {
              responseTimes.add(replyTime.difference(parentTime));
            }
          }
        }
        if (responseTimes.isNotEmpty) {
          final totalMs = responseTimes.fold<int>(
            0,
            (sum, d) => sum + d.inMilliseconds,
          );
          avgResponseTime = Duration(milliseconds: totalMs ~/ responseTimes.length);
        }
      }

      return CommentThreadMetrics(
        postId: postId,
        totalComments: topLevel.length,
        totalReplies: replies.length,
        totalLikes: totalLikes,
        uniqueCommenters: uniqueUsers.length,
        averageLikesPerComment: commentList.isNotEmpty 
            ? totalLikes / commentList.length 
            : 0,
        averageReplyDepth: avgDepth,
        maxReplyDepth: maxDepth,
        firstCommentAt: timestamps.isNotEmpty ? timestamps.first : null,
        lastCommentAt: timestamps.isNotEmpty ? timestamps.last : null,
        averageResponseTime: avgResponseTime,
      );
    } catch (e) {
      _log.error('Error getting thread metrics', tag: _tag, error: e);
      return null;
    }
  }

  /// Get user interaction patterns
  Future<UserCommentPattern?> getUserPattern(String userId) async {
    try {
      // Fetch user's comments
      final comments = await _supabase
          .from('spark_comments')
          .select('id, parent_id, content, like_count, created_at')
          .eq('user_id', userId);

      // Fetch likes given by user
      final likesGiven = await _supabase
          .from('comment_likes')
          .select('id')
          .eq('user_id', userId);

      // Fetch reactions by user
      final reactions = await _supabase
          .from('comment_reactions')
          .select('emoji')
          .eq('user_id', userId);

      final List<dynamic> commentList = comments;
      final topLevel = commentList.where((c) => c['parent_id'] == null).length;
      final replies = commentList.where((c) => c['parent_id'] != null).length;

      final totalLikesReceived = commentList.fold<int>(
        0,
        (sum, c) => sum + ((c['like_count'] as int?) ?? 0),
      );

      // Calculate average comment length
      final totalLength = commentList.fold<int>(
        0,
        (sum, c) => sum + ((c['content'] as String?)?.length ?? 0),
      );
      final avgLength = commentList.isNotEmpty 
          ? totalLength / commentList.length 
          : 0.0;

      // Count mentions
      final mentionPattern = RegExp(r'@\w+');
      int totalMentions = 0;
      for (final comment in commentList) {
        final content = comment['content'] as String? ?? '';
        totalMentions += mentionPattern.allMatches(content).length;
      }

      // Activity by hour and day
      final activityByHour = <int, int>{};
      final activityByDay = <int, int>{};
      for (final comment in commentList) {
        final createdAt = DateTime.tryParse(comment['created_at'] ?? '');
        if (createdAt != null) {
          activityByHour[createdAt.hour] = 
              (activityByHour[createdAt.hour] ?? 0) + 1;
          activityByDay[createdAt.weekday] = 
              (activityByDay[createdAt.weekday] ?? 0) + 1;
        }
      }

      // Frequently used emojis from reactions
      final emojiCounts = <String, int>{};
      for (final reaction in reactions) {
        final emoji = reaction['emoji'] as String? ?? '';
        emojiCounts[emoji] = (emojiCounts[emoji] ?? 0) + 1;
      }
      final sortedEmojis = emojiCounts.entries.toList()
        ..sort((a, b) => b.value.compareTo(a.value));
      final frequentEmojis = sortedEmojis.take(5).map((e) => e.key).toList();

      return UserCommentPattern(
        userId: userId,
        totalComments: topLevel,
        totalReplies: replies,
        totalLikesGiven: (likesGiven as List).length,
        totalLikesReceived: totalLikesReceived,
        totalMentions: totalMentions,
        averageCommentLength: avgLength,
        frequentlyUsedEmojis: frequentEmojis,
        activityByHour: activityByHour,
        activityByDay: activityByDay,
      );
    } catch (e) {
      _log.error('Error getting user pattern', tag: _tag, error: e);
      return null;
    }
  }

  /// Get session interaction count
  int getSessionInteractions(String? postId) {
    return _sessionInteractions[postId ?? 'global'] ?? 0;
  }

  /// Get top commenters for a post
  Future<List<Map<String, dynamic>>> getTopCommenters(
    String postId, {
    int limit = 5,
  }) async {
    try {
      final result = await _supabase.rpc(
        'get_top_commenters',
        params: {'p_post_id': postId, 'p_limit': limit},
      );
      return List<Map<String, dynamic>>.from(result ?? []);
    } catch (e) {
      // Fallback: calculate manually
      try {
        final comments = await _supabase
            .from('spark_comments')
            .select('user_id')
            .eq('post_id', postId);

        final userCounts = <String, int>{};
        for (final comment in comments) {
          final userId = comment['user_id'] as String;
          userCounts[userId] = (userCounts[userId] ?? 0) + 1;
        }

        final sorted = userCounts.entries.toList()
          ..sort((a, b) => b.value.compareTo(a.value));

        return sorted.take(limit).map((e) => {
              'user_id': e.key,
              'comment_count': e.value,
            }).toList();
      } catch (e2) {
        _log.error('Error getting top commenters', tag: _tag, error: e2);
        return [];
      }
    }
  }

  /// Get trending comments (high engagement in short time)
  Future<List<String>> getTrendingCommentIds(
    String postId, {
    Duration window = const Duration(hours: 24),
    int limit = 5,
  }) async {
    try {
      final cutoff = DateTime.now().subtract(window).toIso8601String();
      
      final comments = await _supabase
          .from('spark_comments')
          .select('id, like_count, created_at')
          .eq('post_id', postId)
          .gte('created_at', cutoff)
          .order('like_count', ascending: false)
          .limit(limit);

      return (comments as List).map((c) => c['id'] as String).toList();
    } catch (e) {
      _log.error('Error getting trending comments', tag: _tag, error: e);
      return [];
    }
  }

  void _scheduleFlush() {
    _flushTimer?.cancel();
    _flushTimer = Timer(_flushInterval, _flushEvents);
  }

  Future<void> _flushEvents() async {
    if (_eventBuffer.isEmpty) return;

    final eventsToFlush = List<_AnalyticsEvent>.from(_eventBuffer);
    _eventBuffer.clear();
    _flushTimer?.cancel();

    try {
      // Batch insert to analytics table
      final records = eventsToFlush.map((e) => e.toMap()).toList();
      
      await _supabase.from('comment_analytics_events').insert(records);
      
      _log.dbOperation('INSERT', 'comment_analytics_events', rowCount: records.length, tag: _tag);
    } catch (e) {
      // On failure, add back to buffer (with limit)
      if (_eventBuffer.length < _bufferSize * 2) {
        _eventBuffer.insertAll(0, eventsToFlush);
      }
      _log.error('Error flushing analytics', tag: _tag, error: e);
    }
  }

  /// Force flush pending events (call on app background/close)
  Future<void> flush() => _flushEvents();

  /// Clear session data
  void clearSession() {
    _commentViewStartTimes.clear();
    _sessionInteractions.clear();
  }
}

class _AnalyticsEvent {
  final CommentAnalyticsEvent event;
  final String commentId;
  final String? postId;
  final String userId;
  final String? targetUserId;
  final Map<String, dynamic>? metadata;
  final DateTime timestamp;

  const _AnalyticsEvent({
    required this.event,
    required this.commentId,
    this.postId,
    required this.userId,
    this.targetUserId,
    this.metadata,
    required this.timestamp,
  });

  Map<String, dynamic> toMap() => {
        'event_type': event.name,
        'comment_id': commentId,
        'post_id': postId,
        'user_id': userId,
        'target_user_id': targetUserId,
        'metadata': metadata,
        'created_at': timestamp.toIso8601String(),
      };
}
