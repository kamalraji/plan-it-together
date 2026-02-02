import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart' show PostgrestException;
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/models/spark_comment.dart';
import 'package:thittam1hub/services/connectivity_service.dart';
import 'package:thittam1hub/services/offline_action_queue.dart';

import 'package:thittam1hub/services/logging_service.dart';

enum SparkPostType { IDEA, SEEKING, OFFERING, QUESTION, ANNOUNCEMENT }

// ============================================
// SPARK RESULT TYPES
// ============================================

/// Result of a spark operation with detailed status
class SparkResult {
  final bool success;
  final bool rateLimited;
  final bool alreadySparked;
  final bool burstDetected;
  final bool queued;
  final String? error;
  final int? remainingInWindow;

  const SparkResult._({
    this.success = false,
    this.rateLimited = false,
    this.alreadySparked = false,
    this.burstDetected = false,
    this.queued = false,
    this.error,
    this.remainingInWindow,
  });

  factory SparkResult.success({int? remainingInWindow}) => SparkResult._(
        success: true,
        remainingInWindow: remainingInWindow,
      );

  factory SparkResult.rateLimited({int? remainingInWindow}) => SparkResult._(
        rateLimited: true,
        remainingInWindow: remainingInWindow,
      );

  factory SparkResult.alreadySparked() => const SparkResult._(
        alreadySparked: true,
      );

  factory SparkResult.burstDetected() => const SparkResult._(
        burstDetected: true,
      );

  factory SparkResult.queued() => const SparkResult._(
        success: true,
        queued: true,
      );

  factory SparkResult.failure(String error) => SparkResult._(
        error: error,
      );
}

/// Exception thrown when rate limit is exceeded
class SparkRateLimitException implements Exception {
  final int remainingSeconds;
  final String message;

  SparkRateLimitException({
    this.remainingSeconds = 60,
    this.message = 'Too many sparks. Please slow down.',
  });

  @override
  String toString() => message;
}

/// Exception thrown when burst activity is detected
class SparkBurstException implements Exception {
  final String message;

  SparkBurstException({
    this.message = 'Unusual activity detected. Please wait a moment.',
  });

  @override
  String toString() => message;
}

// ============================================
// SPARK POST MODEL
// ============================================

class SparkPost {
  final String id;
  final String authorId;
  final String authorName;
  final String? authorAvatar;
  final SparkPostType type;
  final String title;
  final String content;
  final List<String> tags;
  final int sparkCount;
  final int commentCount;
  final int shareCount;
  final DateTime createdAt;

  // Media fields
  final String? imageUrl;
  final String? gifUrl;
  final String? pollId;
  final String? linkUrl;

  // Optimistic state
  final bool isOptimisticallySparked;
  final int optimisticSparkCount;

  const SparkPost({
    required this.id,
    required this.authorId,
    required this.authorName,
    this.authorAvatar,
    required this.type,
    required this.title,
    required this.content,
    required this.tags,
    required this.sparkCount,
    required this.commentCount,
    this.shareCount = 0,
    required this.createdAt,
    this.imageUrl,
    this.gifUrl,
    this.pollId,
    this.linkUrl,
    this.isOptimisticallySparked = false,
    this.optimisticSparkCount = 0,
  });

  factory SparkPost.fromMap(Map<String, dynamic> map) {
    return SparkPost(
      id: map['id'],
      authorId: map['author_id'],
      authorName: map['author_name'] ?? 'Anonymous',
      authorAvatar: map['author_avatar'],
      type: SparkPostType.values.firstWhere(
        (e) => e.name == map['type'],
        orElse: () => SparkPostType.IDEA,
      ),
      title: map['title'],
      content: map['content'],
      tags: List<String>.from(map['tags'] ?? []),
      sparkCount: map['spark_count'] ?? 0,
      commentCount: map['comment_count'] ?? 0,
      shareCount: map['share_count'] ?? 0,
      createdAt: DateTime.parse(map['created_at']),
      imageUrl: map['image_url'],
      gifUrl: map['gif_url'],
      pollId: map['poll_id'],
      linkUrl: map['link_url'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'author_id': authorId,
      'author_name': authorName,
      'author_avatar': authorAvatar,
      'type': type.name,
      'title': title,
      'content': content,
      'tags': tags,
      'spark_count': sparkCount,
      'comment_count': commentCount,
      'share_count': shareCount,
      'created_at': createdAt.toIso8601String(),
      'image_url': imageUrl,
      'gif_url': gifUrl,
      'poll_id': pollId,
      'link_url': linkUrl,
    };
  }

  /// Create copy with optimistic spark applied
  SparkPost withOptimisticSpark() {
    return SparkPost(
      id: id,
      authorId: authorId,
      authorName: authorName,
      authorAvatar: authorAvatar,
      type: type,
      title: title,
      content: content,
      tags: tags,
      sparkCount: sparkCount,
      commentCount: commentCount,
      shareCount: shareCount,
      createdAt: createdAt,
      imageUrl: imageUrl,
      gifUrl: gifUrl,
      pollId: pollId,
      linkUrl: linkUrl,
      isOptimisticallySparked: true,
      optimisticSparkCount: sparkCount + 1,
    );
  }

  /// Get display spark count (considers optimistic state)
  int get displaySparkCount =>
      isOptimisticallySparked ? optimisticSparkCount : sparkCount;

  /// Check if post has media attachment
  bool get hasMedia =>
      imageUrl != null || gifUrl != null || pollId != null || linkUrl != null;
}

// ============================================
// SPARK SERVICE WITH RATE LIMITING & ANALYTICS
// ============================================

class SparkService {
  static const String _tag = 'SparkService';
  static final _log = LoggingService.instance;
  
  final _supabase = SupabaseConfig.client;

  /// Default page size for pagination
  static const int pageSize = 15;

  // ============================================
  // RATE LIMITING CONFIGURATION
  // ============================================

  /// Maximum sparks allowed per minute (industry standard: 60/min = 1/sec)
  static const int _maxSparksPerMinute = 60;

  /// Burst detection threshold (10 sparks in 10 seconds = suspicious)
  static const int _burstThreshold = 10;

  /// Burst detection window
  static const Duration _burstWindow = Duration(seconds: 10);

  /// Rate limit window
  static const Duration _rateLimitWindow = Duration(minutes: 1);

  /// User spark timestamps for rate limiting (in-memory)
  static final Map<String, List<DateTime>> _userSparkTimestamps = {};

  /// Local cache of sparked posts to avoid redundant DB queries
  static final Set<String> _sparkedPostsCache = {};

  // ============================================
  // RATE LIMITING METHODS
  // ============================================

  /// Check if user is rate limited
  static bool _isRateLimited(String userId) {
    final timestamps = _userSparkTimestamps[userId] ?? [];
    final cutoff = DateTime.now().subtract(_rateLimitWindow);
    final recentCount = timestamps.where((t) => t.isAfter(cutoff)).length;
    return recentCount >= _maxSparksPerMinute;
  }

  /// Get remaining sparks in current window
  static int _getRemainingInWindow(String userId) {
    final timestamps = _userSparkTimestamps[userId] ?? [];
    final cutoff = DateTime.now().subtract(_rateLimitWindow);
    final recentCount = timestamps.where((t) => t.isAfter(cutoff)).length;
    return (_maxSparksPerMinute - recentCount).clamp(0, _maxSparksPerMinute);
  }

  /// Detect burst activity (spam-like behavior)
  static bool _isBurstDetected(String userId) {
    final timestamps = _userSparkTimestamps[userId] ?? [];
    final cutoff = DateTime.now().subtract(_burstWindow);
    final burstCount = timestamps.where((t) => t.isAfter(cutoff)).length;

    if (burstCount >= _burstThreshold) {
      _log.warning('⚠️ Burst detected for user $userId ($burstCount in ${_burstWindow.inSeconds}s)', tag: _tag);
      return true;
    }
    return false;
  }

  /// Record a spark timestamp for rate limiting
  static void _recordSparkTimestamp(String userId) {
    _userSparkTimestamps.putIfAbsent(userId, () => []);
    _userSparkTimestamps[userId]!.add(DateTime.now());

    // Cleanup old timestamps (>2 min) to prevent memory bloat
    final cutoff = DateTime.now().subtract(const Duration(minutes: 2));
    _userSparkTimestamps[userId]!.removeWhere((t) => t.isBefore(cutoff));
  }

  /// Check local cache for already sparked posts
  static bool _isLocallySparked(String userId, String postId) {
    return _sparkedPostsCache.contains('${userId}_$postId');
  }

  /// Add post to local spark cache
  static void _cacheLocalSpark(String userId, String postId) {
    _sparkedPostsCache.add('${userId}_$postId');
  }

  /// Clear rate limiting data (useful for testing or logout)
  static void clearRateLimitData() {
    _userSparkTimestamps.clear();
    _sparkedPostsCache.clear();
    _log.debug('🧹 Rate limit data cleared', tag: _tag);
  }

  // ============================================
  // POST RETRIEVAL METHODS
  // ============================================

  /// Get all spark posts, optionally filtered by type
  Future<List<SparkPost>> getSparkPosts({SparkPostType? type}) async {
    try {
      final response = type != null
          ? await _supabase
              .from('spark_posts')
              .select('*')
              .eq('type', type.name)
              .order('created_at', ascending: false)
          : await _supabase
              .from('spark_posts')
              .select('*')
              .order('created_at', ascending: false);

      return (response as List)
          .map((data) => SparkPost.fromMap(data as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _log.error('Error fetching spark posts: $e', tag: _tag);
      return [];
    }
  }

  /// Get spark posts with cursor-based pagination
  Future<({List<SparkPost> posts, bool hasMore, String? nextCursor})>
      getSparkPostsPaginated({
    SparkPostType? type,
    String? cursor,
    int limit = pageSize,
  }) async {
    try {
      var query = _supabase.from('spark_posts').select('*');

      if (type != null) {
        query = query.eq('type', type.name);
      }

      if (cursor != null) {
        query = query.lt('created_at', cursor);
      }

      final response =
          await query.order('created_at', ascending: false).limit(limit + 1);

      final data = response as List;
      final hasMore = data.length > limit;
      final posts = data
          .take(limit)
          .map((d) => SparkPost.fromMap(d as Map<String, dynamic>))
          .toList();

      final nextCursor =
          posts.isNotEmpty ? posts.last.createdAt.toIso8601String() : null;

      return (posts: posts, hasMore: hasMore, nextCursor: nextCursor);
    } catch (e) {
      _log.error('Error fetching paginated posts: $e', tag: _tag);
      return (posts: <SparkPost>[], hasMore: false, nextCursor: null);
    }
  }

  /// Create a new spark post with optional media
  Future<void> createSparkPost({
    required SparkPostType type,
    required String title,
    required String content,
    required List<String> tags,
    String? imageUrl,
    String? gifUrl,
    String? pollId,
    String? linkUrl,
  }) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) {
        throw Exception('Please sign in to post');
      }

      final userProfile = await _supabase
          .from('user_profiles')
          .select('full_name, avatar_url')
          .eq('id', userId)
          .maybeSingle();

      await _supabase.from('spark_posts').insert({
        'author_id': userId,
        'author_name': userProfile?['full_name'] ?? 'Anonymous',
        'author_avatar': userProfile?['avatar_url'],
        'type': type.name,
        'title': title,
        'content': content,
        'tags': tags,
        'image_url': imageUrl,
        'gif_url': gifUrl,
        'poll_id': pollId,
        'link_url': linkUrl,
      });
      _log.info('✅ Spark post created', tag: _tag);
    } on PostgrestException catch (e) {
      _log.error('❌ Database error [${e.code}]: ${e.message}', tag: _tag);
      if (e.message.contains('column') && e.message.contains('does not exist')) {
        throw Exception('Database schema mismatch. Please contact support.');
      } else if (e.code == '42501') {
        throw Exception('Permission denied. Please sign in again.');
      }
      throw Exception('Failed to save post. Please try again.');
    } catch (e) {
      _log.error('❌ Error creating spark post: $e', tag: _tag);
      rethrow;
    }
  }

  // ============================================
  // SPARK (LIKE) METHODS WITH RATE LIMITING
  // ============================================

  /// Add a spark (like) to a post with rate limiting and optimistic update
  /// This is the internal method - use toggleSparkOnce for public API
  Future<void> _sparkPostInternal(String postId) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) throw Exception('Not authenticated');

    _log.debug('⚡ Executing spark: $postId', tag: _tag);

    try {
      await _supabase.from('spark_reactions').insert({
        'post_id': postId,
        'user_id': userId,
        'type': 'SPARK',
      });

      await _supabase.rpc('increment_spark_count', params: {'post_id': postId});
      _log.info('⚡ Sparked post successfully', tag: _tag);
    } catch (e) {
      _log.error('❌ Error sparking post: $e', tag: _tag);
      rethrow;
    }
  }

  /// Spark a post with full rate limiting, burst detection, and offline support
  /// Returns SparkResult with detailed status for UI feedback
  Future<SparkResult> sparkPost(String postId) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) {
      return SparkResult.failure('Not authenticated');
    }

    // 1. Check local cache first (no DB hit needed)
    if (_isLocallySparked(userId, postId)) {
      _log.debug('ℹ️ Already sparked (cached): $postId', tag: _tag);
      return SparkResult.alreadySparked();
    }

    // 2. Check burst detection (spam protection)
    if (_isBurstDetected(userId)) {
      _log.debug('🚫 Burst detected, blocking spark', tag: _tag);
      return SparkResult.burstDetected();
    }

    // 3. Check rate limit
    if (_isRateLimited(userId)) {
      _log.debug('🚫 Rate limited: $userId', tag: _tag);
      return SparkResult.rateLimited(
        remainingInWindow: 0,
      );
    }

    // 4. Record timestamp BEFORE action (prevents rapid double-taps)
    _recordSparkTimestamp(userId);
    _cacheLocalSpark(userId, postId);

    // 5. If offline, queue for later sync
    if (!ConnectivityService.instance.isOnline) {
      await OfflineActionQueue.instance.enqueue(OfflineAction(
        id: 'spark_${postId}_${DateTime.now().millisecondsSinceEpoch}',
        type: OfflineActionType.sparkPost,
        payload: {'postId': postId, 'userId': userId},
        createdAt: DateTime.now(),
      ));
      _log.debug('📥 Spark queued for offline sync', tag: _tag);
      return SparkResult.queued();
    }

    // 6. Execute spark with retry on failure
    try {
      await _sparkPostInternal(postId);
      return SparkResult.success(
        remainingInWindow: _getRemainingInWindow(userId),
      );
    } catch (e) {
      // On failure, queue for retry but keep optimistic state
      await OfflineActionQueue.instance.enqueue(OfflineAction(
        id: 'spark_${postId}_${DateTime.now().millisecondsSinceEpoch}',
        type: OfflineActionType.sparkPost,
        payload: {'postId': postId, 'userId': userId},
        createdAt: DateTime.now(),
      ));

      _log.debug('📥 Spark queued for retry after failure', tag: _tag);
      return SparkResult.queued();
    }
  }

  /// Idempotent spark with full protection
  /// Returns SparkResult with detailed status
  Future<SparkResult> toggleSparkOnce(String postId) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) {
      return SparkResult.failure('Not authenticated');
    }

    // Check local cache first
    if (_isLocallySparked(userId, postId)) {
      return SparkResult.alreadySparked();
    }

    // If online, verify with DB before sparking
    if (ConnectivityService.instance.isOnline) {
      try {
        final existing = await _supabase
            .from('spark_reactions')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', userId)
            .eq('type', 'SPARK')
            .maybeSingle();

        if (existing != null) {
          _cacheLocalSpark(userId, postId); // Cache for future
          return SparkResult.alreadySparked();
        }
      } catch (e) {
        _log.error('⚠️ DB check failed, proceeding with spark: $e', tag: _tag);
      }
    }

    // Execute spark with all protections
    return sparkPost(postId);
  }

  /// Remove spark from a post (un-like)
  Future<SparkResult> unsparkPost(String postId) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) {
      return SparkResult.failure('Not authenticated');
    }

    // Check if actually sparked
    if (!_isLocallySparked(userId, postId)) {
      _log.debug('ℹ️ Post not sparked, nothing to unspark', tag: _tag);
      return SparkResult.failure('Post not sparked');
    }

    try {
      // Remove from reactions table
      await _supabase
          .from('spark_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);

      // Decrement count
      await _supabase.rpc('decrement_spark_count', params: {'post_id': postId});

      // Clear from local cache
      _sparkedPostsCache.remove('${userId}_$postId');

      _log.info('💔 Unsparked post successfully', tag: _tag);
      return SparkResult.success(
        remainingInWindow: _getRemainingInWindow(userId),
      );
    } catch (e) {
      _log.error('❌ Error unsparking post: $e', tag: _tag);
      return SparkResult.failure(e.toString());
    }
  }

  /// Get trending posts (most sparks in last 24h)
  Future<List<SparkPost>> getTrendingPosts() async {
    try {
      final response = await _supabase
          .from('spark_posts')
          .select('*')
          .gte('created_at',
              DateTime.now().subtract(Duration(days: 7)).toIso8601String())
          .order('spark_count', ascending: false)
          .limit(10);

      return (response as List)
          .map((data) => SparkPost.fromMap(data as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _log.error('Error fetching trending posts: $e', tag: _tag);
      return [];
    }
  }

  // ============================================
  // COMMENT METHODS
  // ============================================

  /// Get comments for a post with nested replies
  Future<List<SparkComment>> getComments(String postId) async {
    try {
      final response = await _supabase
          .from('spark_comments')
          .select('*')
          .eq('post_id', postId)
          .order('created_at', ascending: true);

      final allComments = (response as List)
          .map((data) => SparkComment.fromMap(data as Map<String, dynamic>))
          .toList();

      final Map<String, SparkComment> commentMap = {};
      final List<SparkComment> topLevel = [];

      for (final comment in allComments) {
        commentMap[comment.id] = comment;
      }

      for (final comment in allComments) {
        if (comment.parentId == null) {
          topLevel.add(comment);
        } else {
          final parent = commentMap[comment.parentId];
          if (parent != null) {
            commentMap[parent.id] = parent.copyWith(
              replies: [...parent.replies, comment],
            );
          }
        }
      }

      return topLevel.map((c) => commentMap[c.id] ?? c).toList();
    } catch (e) {
      _log.error('Error fetching comments: $e', tag: _tag);
      return [];
    }
  }

  /// Add a comment to a post
  Future<SparkComment?> addComment(
    String postId,
    String content, {
    String? parentId,
  }) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      final profileResponse = await _supabase
          .from('impact_profiles')
          .select('full_name, avatar_url')
          .eq('user_id', userId)
          .maybeSingle();

      final authorName = profileResponse?['full_name'] ?? 'Anonymous';
      final authorAvatar = profileResponse?['avatar_url'];

      final response = await _supabase
          .from('spark_comments')
          .insert({
            'post_id': postId,
            'user_id': userId,
            'parent_id': parentId,
            'content': content,
            'author_name': authorName,
            'author_avatar': authorAvatar,
          })
          .select()
          .single();

      _log.debug('💬 Comment added', tag: _tag);
      return SparkComment.fromMap(response);
    } catch (e) {
      _log.error('❌ Error adding comment: $e', tag: _tag);
      rethrow;
    }
  }

  /// Subscribe to real-time comment updates for a post
  StreamSubscription subscribeToComments(
    String postId,
    Function(SparkComment) onNewComment,
  ) {
    return _supabase
        .from('spark_comments')
        .stream(primaryKey: ['id'])
        .eq('post_id', postId)
        .listen((data) {
          if (data.isNotEmpty) {
            final latestComment = SparkComment.fromMap(data.last);
            onNewComment(latestComment);
          }
        });
  }

  // ============================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================

  /// Subscribe to real-time spark count updates for a single post
  /// Returns StreamSubscription that should be cancelled when no longer needed
  StreamSubscription subscribeToSparkCount({
    required String postId,
    required Function(int newCount) onUpdate,
  }) {
    return _supabase
        .from('spark_posts')
        .stream(primaryKey: ['id'])
        .eq('id', postId)
        .listen((data) {
          if (data.isNotEmpty) {
            final newCount = data.first['spark_count'] as int? ?? 0;
            onUpdate(newCount);
          }
        });
  }

  /// Subscribe to real-time updates for multiple posts in feed
  /// More efficient than multiple single subscriptions
  StreamSubscription subscribeToFeedSparkCounts({
    required Function(String postId, int newCount) onUpdate,
  }) {
    return _supabase
        .from('spark_posts')
        .stream(primaryKey: ['id'])
        .listen((data) {
          for (final post in data) {
            final postId = post['id'] as String?;
            final count = post['spark_count'] as int? ?? 0;
            if (postId != null) {
              onUpdate(postId, count);
            }
          }
        });
  }

  /// Subscribe to real-time spark reactions (for showing who sparked)
  StreamSubscription subscribeToSparkReactions({
    required String postId,
    required Function(List<String> userIds) onUpdate,
  }) {
    return _supabase
        .from('spark_reactions')
        .stream(primaryKey: ['id'])
        .eq('post_id', postId)
        .listen((data) {
          final userIds = data
              .map((r) => r['user_id'] as String?)
              .where((id) => id != null)
              .cast<String>()
              .toList();
          onUpdate(userIds);
        });
  }

  /// Check if current user has sparked a post (for UI state)
  Future<bool> hasUserSparked(String postId) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return false;

    // Check local cache first
    if (_isLocallySparked(userId, postId)) return true;

    try {
      final result = await _supabase
          .from('spark_reactions')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', userId)
          .maybeSingle();

      final hasSparked = result != null;
      if (hasSparked) _cacheLocalSpark(userId, postId);
      return hasSparked;
    } catch (e) {
      _log.error('⚠️ Error checking spark status: $e', tag: _tag);
      return false;
    }
  }
}
