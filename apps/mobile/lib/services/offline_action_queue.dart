import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:thittam1hub/services/connectivity_service.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/utils/result.dart';

/// Types of actions that can be queued for offline sync
enum OfflineActionType {
  saveEvent,
  unsaveEvent,
  sparkPost,
  toggleReminder,
  addComment,
  // Chat actions
  sendMessage,
  sendGroupMessage,
  addReaction,
  removeReaction,
  markAsRead,
}

/// Sync status for UI feedback
enum SyncStatus {
  idle,
  syncing,
  retrying,
  failed,
}

/// Represents a single action queued for sync
class OfflineAction {
  final String id;
  final OfflineActionType type;
  final Map<String, dynamic> payload;
  final DateTime createdAt;
  int retryCount;
  DateTime? nextRetryAt;
  String? lastError;

  OfflineAction({
    required this.id,
    required this.type,
    required this.payload,
    required this.createdAt,
    this.retryCount = 0,
    this.nextRetryAt,
    this.lastError,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'type': type.name,
    'payload': payload,
    'createdAt': createdAt.toIso8601String(),
    'retryCount': retryCount,
    'nextRetryAt': nextRetryAt?.toIso8601String(),
    'lastError': lastError,
  };

  factory OfflineAction.fromJson(Map<String, dynamic> json) => OfflineAction(
    id: json['id'] as String,
    type: OfflineActionType.values.firstWhere((e) => e.name == json['type']),
    payload: json['payload'] as Map<String, dynamic>,
    createdAt: DateTime.parse(json['createdAt'] as String),
    retryCount: json['retryCount'] as int? ?? 0,
    nextRetryAt: json['nextRetryAt'] != null 
        ? DateTime.parse(json['nextRetryAt'] as String) 
        : null,
    lastError: json['lastError'] as String?,
  );

  /// Check if action is ready to retry
  bool get isReadyToRetry {
    if (nextRetryAt == null) return true;
    return DateTime.now().isAfter(nextRetryAt!);
  }

  /// Time until next retry
  Duration? get timeUntilRetry {
    if (nextRetryAt == null) return null;
    final diff = nextRetryAt!.difference(DateTime.now());
    return diff.isNegative ? null : diff;
  }
}

/// Service for managing offline action queue with exponential backoff
/// Extends BaseService for standardized error handling and logging
class OfflineActionQueue extends BaseService {
  static OfflineActionQueue? _instance;
  static OfflineActionQueue get instance => _instance ??= OfflineActionQueue._();
  OfflineActionQueue._();

  @override
  String get tag => 'OfflineActionQueue';

  static const String _queueKeyPrefix = 'offline_queue_';
  static const String _queueIndexKey = 'offline_queue_index';
  
  // Retry configuration
  static const int _maxRetries = 5;
  static const Duration _baseDelay = Duration(seconds: 2);
  static const Duration _maxDelay = Duration(minutes: 5);
  static const double _jitterFactor = 0.3; // 30% random jitter

  SharedPreferences? _prefs;
  bool _initialized = false;
  bool _isSyncing = false;
  Timer? _retryTimer;
  final Random _random = Random();

  // In-memory cache of action IDs for quick access
  Set<String> _actionIds = {};

  // Current sync status
  SyncStatus _syncStatus = SyncStatus.idle;
  SyncStatus get syncStatus => _syncStatus;

  // Listeners for UI updates
  final List<VoidCallback> _onQueueChangedListeners = [];
  final List<void Function(SyncStatus)> _onStatusChangedListeners = [];

  /// Number of pending actions
  int get pendingCount => _actionIds.length;

  /// Whether there are pending actions
  bool get hasPendingActions => pendingCount > 0;

  /// Number of actions ready to retry now
  int get readyToRetryCount {
    return getPendingActions().where((a) => a.isReadyToRetry).length;
  }

  /// Initialize the queue
  Future<Result<void>> init() {
    return execute(() async {
      if (_initialized) return;

      _prefs = await SharedPreferences.getInstance();
      
      // Load action IDs from index
      final indexJson = _prefs!.getString(_queueIndexKey);
      if (indexJson != null) {
        final List<dynamic> ids = jsonDecode(indexJson);
        _actionIds = ids.cast<String>().toSet();
      }
      
      _initialized = true;
      
      // Listen for reconnection to sync
      ConnectivityService.instance.addOnReconnectListener(_onReconnect);
      
      logInfo('Initialized', metadata: {'pendingActions': pendingCount});
      
      // Try to sync any pending actions on init
      if (ConnectivityService.instance.isOnline && hasPendingActions) {
        _scheduleSync();
      }
    }, operationName: 'init');
  }

  void _onReconnect() {
    logInfo('Reconnected - scheduling sync');
    _scheduleSync();
  }

  /// Save action IDs index to SharedPreferences
  Future<void> _saveIndex() async {
    await _prefs?.setString(_queueIndexKey, jsonEncode(_actionIds.toList()));
  }

  /// Add listener for queue changes
  void addOnQueueChangedListener(VoidCallback callback) {
    _onQueueChangedListeners.add(callback);
  }

  /// Remove queue change listener
  void removeOnQueueChangedListener(VoidCallback callback) {
    _onQueueChangedListeners.remove(callback);
  }

  /// Add listener for sync status changes
  void addOnStatusChangedListener(void Function(SyncStatus) callback) {
    _onStatusChangedListeners.add(callback);
  }

  /// Remove sync status listener
  void removeOnStatusChangedListener(void Function(SyncStatus) callback) {
    _onStatusChangedListeners.remove(callback);
  }

  void _notifyListeners() {
    for (final listener in List.from(_onQueueChangedListeners)) {
      try {
        listener();
      } catch (e) {
        logError('Queue listener error', error: e);
      }
    }
  }

  void _updateStatus(SyncStatus status) {
    if (_syncStatus == status) return;
    _syncStatus = status;
    for (final listener in List.from(_onStatusChangedListeners)) {
      try {
        listener(status);
      } catch (e) {
        logError('Status listener error', error: e);
      }
    }
  }

  /// Calculate delay with exponential backoff and jitter
  Duration _calculateBackoffDelay(int retryCount) {
    // Exponential backoff: baseDelay * 2^retryCount
    final exponentialMs = _baseDelay.inMilliseconds * pow(2, retryCount);
    
    // Cap at max delay
    final cappedMs = min(exponentialMs.toInt(), _maxDelay.inMilliseconds);
    
    // Add jitter: random value between -jitter% and +jitter%
    final jitterMs = (cappedMs * _jitterFactor * (2 * _random.nextDouble() - 1)).toInt();
    final finalMs = max(cappedMs + jitterMs, _baseDelay.inMilliseconds);
    
    return Duration(milliseconds: finalMs);
  }

  /// Queue an action for offline sync
  Future<Result<void>> enqueue(OfflineAction action) {
    return execute(() async {
      if (_prefs == null) return;

      await _prefs!.setString('$_queueKeyPrefix${action.id}', jsonEncode(action.toJson()));
      _actionIds.add(action.id);
      await _saveIndex();
      
      logDebug('Action queued: ${action.type.name} (${action.id})');
      _notifyListeners();
      
      // Try to sync immediately if online
      if (ConnectivityService.instance.isOnline && !_isSyncing) {
        _scheduleSync();
      }
    }, operationName: 'enqueue');
  }

  /// Remove an action from queue (after successful sync or cancellation)
  Future<Result<void>> dequeue(String actionId) {
    return execute(() async {
      if (_prefs == null) return;

      await _prefs!.remove('$_queueKeyPrefix$actionId');
      _actionIds.remove(actionId);
      await _saveIndex();
      
      logDebug('Action dequeued: $actionId');
      _notifyListeners();
    }, operationName: 'dequeue');
  }

  /// Cancel a pending action (for undo functionality)
  Future<Result<bool>> cancelAction(String actionId) {
    return execute(() async {
      if (_prefs == null) return false;
      
      if (_actionIds.contains(actionId)) {
        await dequeue(actionId);
        logInfo('Action cancelled: $actionId');
        return true;
      }
      return false;
    }, operationName: 'cancelAction');
  }

  /// Get all pending actions
  List<OfflineAction> getPendingActions() {
    if (_prefs == null) return [];

    try {
      final actions = <OfflineAction>[];
      for (final id in _actionIds) {
        final json = _prefs!.getString('$_queueKeyPrefix$id');
        if (json != null) {
          final data = jsonDecode(json) as Map<String, dynamic>;
          actions.add(OfflineAction.fromJson(data));
        }
      }
      actions.sort((a, b) => a.createdAt.compareTo(b.createdAt));
      return actions;
    } catch (e) {
      logError('Get pending actions error', error: e);
      return [];
    }
  }

  /// Schedule sync with intelligent timing
  void _scheduleSync({Duration delay = Duration.zero}) {
    _retryTimer?.cancel();
    
    if (delay == Duration.zero) {
      _syncQueue();
    } else {
      logDebug('Scheduling sync in ${delay.inSeconds}s');
      _retryTimer = Timer(delay, _syncQueue);
    }
  }

  /// Sync all queued actions to server with exponential backoff
  Future<void> _syncQueue() async {
    if (_isSyncing || !ConnectivityService.instance.isOnline) return;
    if (_prefs == null || _actionIds.isEmpty) {
      _updateStatus(SyncStatus.idle);
      return;
    }

    _isSyncing = true;
    _updateStatus(SyncStatus.syncing);
    logInfo('Syncing $pendingCount offline actions...');

    final actions = getPendingActions();
    int successCount = 0;
    int failCount = 0;
    int skippedCount = 0;
    Duration? nextRetryDelay;

    for (final action in actions) {
      // Skip actions not ready for retry yet
      if (!action.isReadyToRetry) {
        skippedCount++;
        final timeUntil = action.timeUntilRetry;
        if (timeUntil != null && (nextRetryDelay == null || timeUntil < nextRetryDelay)) {
          nextRetryDelay = timeUntil;
        }
        continue;
      }

      try {
        final success = await _executeAction(action);
        
        if (success) {
          await dequeue(action.id);
          successCount++;
          logDebug('Action synced: ${action.type.name}');
        } else {
          await _handleRetry(action, 'Action returned false');
          failCount++;
        }
      } catch (e) {
        logError('Sync action error', error: e);
        await _handleRetry(action, e.toString());
        failCount++;
      }
    }

    _isSyncing = false;
    
    // Determine next status and schedule retry if needed
    if (hasPendingActions) {
      final pendingActions = getPendingActions();
      final hasFailedActions = pendingActions.any((a) => a.retryCount > 0);
      
      if (hasFailedActions) {
        _updateStatus(SyncStatus.retrying);
      }
      
      // Find the soonest retry time
      Duration? soonestRetry;
      for (final action in pendingActions) {
        final timeUntil = action.timeUntilRetry;
        if (timeUntil != null && (soonestRetry == null || timeUntil < soonestRetry)) {
          soonestRetry = timeUntil;
        }
      }
      
      if (soonestRetry != null) {
        _scheduleSync(delay: soonestRetry + const Duration(milliseconds: 100));
      }
    } else {
      _updateStatus(SyncStatus.idle);
    }

    logInfo('Sync complete', metadata: {
      'success': successCount,
      'failed': failCount,
      'skipped': skippedCount,
    });
  }

  /// Handle retry logic with exponential backoff
  Future<void> _handleRetry(OfflineAction action, String error) async {
    action.retryCount++;
    action.lastError = error;
    
    if (action.retryCount >= _maxRetries) {
      logWarning('Action exceeded max retries (${action.retryCount}/$_maxRetries), removing: ${action.id}');
      await dequeue(action.id);
      _updateStatus(SyncStatus.failed);
      return;
    }
    
    // Calculate next retry time with exponential backoff
    final delay = _calculateBackoffDelay(action.retryCount);
    action.nextRetryAt = DateTime.now().add(delay);
    
    logDebug('Retry ${action.retryCount}/$_maxRetries for ${action.type.name} in ${delay.inSeconds}s');
    
    // Update in storage
    await _prefs!.setString('$_queueKeyPrefix${action.id}', jsonEncode(action.toJson()));
    _notifyListeners();
  }

  /// Execute a single action against the server
  Future<bool> _executeAction(OfflineAction action) async {
    final supabase = SupabaseConfig.client;
    final userId = supabase.auth.currentUser?.id;
    if (userId == null) return false;

    switch (action.type) {
      case OfflineActionType.saveEvent:
        await supabase.from('saved_events').insert({
          'user_id': userId,
          'event_id': action.payload['eventId'],
        });
        return true;

      case OfflineActionType.unsaveEvent:
        await supabase
            .from('saved_events')
            .delete()
            .eq('user_id', userId)
            .eq('event_id', action.payload['eventId']);
        return true;

      case OfflineActionType.sparkPost:
        // Check if already sparked
        final existing = await supabase
            .from('spark_reactions')
            .select('id')
            .eq('post_id', action.payload['postId'])
            .eq('user_id', userId)
            .eq('type', 'SPARK')
            .maybeSingle();

        if (existing == null) {
          await supabase.from('spark_reactions').insert({
            'post_id': action.payload['postId'],
            'user_id': userId,
            'type': 'SPARK',
          });
          await supabase.rpc('increment_spark_count', 
            params: {'post_id': action.payload['postId']});
        }
        return true;

      case OfflineActionType.toggleReminder:
        await supabase
            .from('saved_events')
            .update({'reminder_enabled': action.payload['enabled']})
            .eq('id', action.payload['savedEventId']);
        return true;

      case OfflineActionType.addComment:
        await supabase.from('spark_comments').insert({
          'post_id': action.payload['postId'],
          'user_id': userId,
          'parent_id': action.payload['parentId'],
          'content': action.payload['content'],
          'author_name': action.payload['authorName'],
          'author_avatar': action.payload['authorAvatar'],
        });
        return true;

      case OfflineActionType.sendMessage:
        await supabase.from('messages').insert({
          'channel_id': action.payload['channelId'],
          'sender_id': userId,
          'sender_name': action.payload['senderName'],
          'sender_avatar': action.payload['senderAvatar'],
          'content': action.payload['content'],
          'attachments': action.payload['attachments'] ?? [],
          'sent_at': action.payload['sentAt'] ?? DateTime.now().toIso8601String(),
        });
        return true;

      case OfflineActionType.sendGroupMessage:
        final groupId = action.payload['groupId'] as String;
        final channelId = 'group:$groupId';
        await supabase.from('messages').insert({
          'channel_id': channelId,
          'sender_id': userId,
          'sender_name': action.payload['senderName'],
          'sender_avatar': action.payload['senderAvatar'],
          'content': action.payload['content'],
          'attachments': action.payload['attachments'],
          'sent_at': action.payload['sentAt'] ?? DateTime.now().toIso8601String(),
        });
        // Update group's updated_at timestamp
        await supabase
            .from('chat_groups')
            .update({'updated_at': DateTime.now().toIso8601String()})
            .eq('id', groupId);
        return true;

      case OfflineActionType.addReaction:
        await supabase.from('message_reactions').upsert({
          'message_id': action.payload['messageId'],
          'user_id': userId,
          'emoji': action.payload['emoji'],
        });
        return true;

      case OfflineActionType.removeReaction:
        await supabase
            .from('message_reactions')
            .delete()
            .eq('message_id', action.payload['messageId'])
            .eq('user_id', userId)
            .eq('emoji', action.payload['emoji']);
        return true;

      case OfflineActionType.markAsRead:
        await supabase.from('channel_members').upsert({
          'channel_id': action.payload['channelId'],
          'user_id': userId,
          'last_read_at': action.payload['readAt'] ?? DateTime.now().toIso8601String(),
        });
        return true;
    }
  }

  /// Force sync now (for manual retry) - ignores backoff timing
  Future<Result<void>> forceSyncNow() {
    return execute(() async {
      if (!ConnectivityService.instance.isOnline) return;
      
      // Reset all retry timers for immediate sync
      final actions = getPendingActions();
      for (final action in actions) {
        action.nextRetryAt = null;
        await _prefs!.setString('$_queueKeyPrefix${action.id}', jsonEncode(action.toJson()));
      }
      
      _retryTimer?.cancel();
      await _syncQueue();
    }, operationName: 'forceSyncNow');
  }

  /// Retry a specific failed action immediately
  Future<Result<void>> retryAction(String actionId) {
    return execute(() async {
      if (_prefs == null || !_actionIds.contains(actionId)) return;
      
      final json = _prefs!.getString('$_queueKeyPrefix$actionId');
      if (json != null) {
        final action = OfflineAction.fromJson(jsonDecode(json));
        action.nextRetryAt = null; // Clear backoff timer
        await _prefs!.setString('$_queueKeyPrefix$actionId', jsonEncode(action.toJson()));
        _scheduleSync();
      }
    }, operationName: 'retryAction');
  }

  /// Clear all pending actions
  Future<Result<void>> clearAll() {
    return execute(() async {
      _retryTimer?.cancel();
      
      for (final id in _actionIds.toList()) {
        await _prefs?.remove('$_queueKeyPrefix$id');
      }
      _actionIds.clear();
      await _saveIndex();
      
      _updateStatus(SyncStatus.idle);
      _notifyListeners();
      logInfo('Offline action queue cleared');
    }, operationName: 'clearAll');
  }

  void dispose() {
    _retryTimer?.cancel();
    ConnectivityService.instance.removeOnReconnectListener(_onReconnect);
    _onQueueChangedListeners.clear();
    _onStatusChangedListeners.clear();
  }
}
