import 'dart:async';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/services/offline_action_queue.dart';
import 'package:thittam1hub/services/connectivity_service.dart';
import 'package:thittam1hub/services/logging_service.dart';

/// Batch processor for spark operations
/// Handles efficient bulk sync of offline spark actions
class SparkBatchProcessor {
  static const String _tag = 'SparkBatchProcessor';
  static final _log = LoggingService.instance;
  static final _supabase = SupabaseConfig.client;

  /// Batch size for processing
  static const int _batchSize = 25;

  /// Process queued spark actions in batches
  /// Returns count of successfully processed sparks
  static Future<int> processPendingSparksBatch() async {
    if (!ConnectivityService.instance.isOnline) {
      _log.debug('Offline - skipping batch process', tag: _tag);
      return 0;
    }

    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) {
      _log.warning('No user - skipping batch process', tag: _tag);
      return 0;
    }

    final pendingActions = OfflineActionQueue.instance.getPendingActions();
    final sparkActions = pendingActions
        .where((a) => a.type == OfflineActionType.sparkPost)
        .toList();

    if (sparkActions.isEmpty) {
      _log.debug('No pending spark actions', tag: _tag);
      return 0;
    }

    _log.info('Processing ${sparkActions.length} pending sparks in batches', tag: _tag);

    int processed = 0;
    int skipped = 0;

    // Process in batches
    for (int i = 0; i < sparkActions.length; i += _batchSize) {
      final batch = sparkActions.skip(i).take(_batchSize).toList();
      final result = await _processBatch(batch, userId);
      processed += result.processed;
      skipped += result.skipped;
    }

    _log.info('Batch complete: $processed processed, $skipped skipped', tag: _tag);
    return processed;
  }

  /// Process a single batch of spark actions
  static Future<({int processed, int skipped})> _processBatch(
    List<OfflineAction> actions,
    String userId,
  ) async {
    if (actions.isEmpty) return (processed: 0, skipped: 0);

    try {
      // Extract post IDs from actions
      final postIds = actions
          .map((a) => a.payload['postId'] as String?)
          .where((id) => id != null)
          .cast<String>()
          .toList();

      if (postIds.isEmpty) return (processed: 0, skipped: 0);

      // Batch check for existing sparks (deduplication)
      final existing = await _supabase
          .from('spark_reactions')
          .select('post_id')
          .eq('user_id', userId)
          .inFilter('post_id', postIds);

      final existingPostIds =
          (existing as List).map((e) => e['post_id'] as String).toSet();

      // Filter out already-sparked posts
      final newSparkPostIds =
          postIds.where((id) => !existingPostIds.contains(id)).toList();

      if (newSparkPostIds.isEmpty) {
        // All were duplicates - remove from queue
        for (final action in actions) {
          await OfflineActionQueue.instance.dequeue(action.id);
        }
        return (processed: 0, skipped: actions.length);
      }

      // Batch insert new sparks
      final insertData = newSparkPostIds
          .map((postId) => {
                'post_id': postId,
                'user_id': userId,
                'type': 'SPARK',
              })
          .toList();

      await _supabase.from('spark_reactions').insert(insertData);

      // Increment spark counts (individual RPCs - Supabase limitation)
      for (final postId in newSparkPostIds) {
        try {
          await _supabase.rpc('increment_spark_count', params: {'post_id': postId});
        } catch (e) {
          _log.warning('Failed to increment count for $postId', tag: _tag, error: e);
        }
      }

      // Remove processed actions from queue
      for (final action in actions) {
        final postId = action.payload['postId'] as String?;
        if (postId != null && newSparkPostIds.contains(postId)) {
          await OfflineActionQueue.instance.dequeue(action.id);
        } else if (postId != null && existingPostIds.contains(postId)) {
          // Also remove duplicates from queue
          await OfflineActionQueue.instance.dequeue(action.id);
        }
      }

      _log.debug('Batch: ${newSparkPostIds.length} new, ${existingPostIds.length} duplicates', tag: _tag);
      return (processed: newSparkPostIds.length, skipped: existingPostIds.length);
    } catch (e) {
      _log.error('Batch processing error', tag: _tag, error: e);
      return (processed: 0, skipped: 0);
    }
  }

  /// Schedule periodic batch processing
  static Timer? _batchTimer;

  static void startPeriodicBatchProcessing({
    Duration interval = const Duration(seconds: 30),
  }) {
    _batchTimer?.cancel();
    _batchTimer = Timer.periodic(interval, (_) async {
      if (ConnectivityService.instance.isOnline) {
        await processPendingSparksBatch();
      }
    });
    _log.info('Started periodic batch processing (${interval.inSeconds}s)', tag: _tag);
  }

  static void stopPeriodicBatchProcessing() {
    _batchTimer?.cancel();
    _batchTimer = null;
    _log.info('Stopped periodic batch processing', tag: _tag);
  }

  /// Verify spark integrity (admin tool)
  /// Checks if spark_count matches actual reaction count
  static Future<List<Map<String, dynamic>>> verifySparkIntegrity({
    int limit = 100,
  }) async {
    try {
      final posts = await _supabase
          .from('spark_posts')
          .select('id, spark_count')
          .order('created_at', ascending: false)
          .limit(limit);

      final mismatches = <Map<String, dynamic>>[];

      for (final post in posts as List) {
        final postId = post['id'] as String;
        final storedCount = post['spark_count'] as int? ?? 0;

        final actualCount = await _supabase
            .from('spark_reactions')
            .select('id')
            .eq('post_id', postId)
            .eq('type', 'SPARK');

        final actualLength = (actualCount as List).length;

        if (storedCount != actualLength) {
          mismatches.add({
            'post_id': postId,
            'stored_count': storedCount,
            'actual_count': actualLength,
            'difference': storedCount - actualLength,
          });
        }
      }

      if (mismatches.isNotEmpty) {
        _log.warning('Found ${mismatches.length} spark count mismatches', tag: _tag);
      }

      return mismatches;
    } catch (e) {
      _log.error('Integrity check error', tag: _tag, error: e);
      return [];
    }
  }

  /// Repair spark count mismatches
  static Future<int> repairSparkCounts(List<String> postIds) async {
    int repaired = 0;

    for (final postId in postIds) {
      try {
        final actualCount = await _supabase
            .from('spark_reactions')
            .select('id')
            .eq('post_id', postId)
            .eq('type', 'SPARK');

        await _supabase
            .from('spark_posts')
            .update({'spark_count': (actualCount as List).length}).eq(
                'id', postId);

        repaired++;
      } catch (e) {
        _log.error('Failed to repair $postId', tag: _tag, error: e);
      }
    }

    _log.info('Repaired $repaired spark counts', tag: _tag);
    return repaired;
  }
}
