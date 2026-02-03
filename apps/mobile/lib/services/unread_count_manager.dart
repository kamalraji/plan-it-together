import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/services/logging_service.dart';

/// WhatsApp-style local-first unread count manager
/// Tracks unread counts locally for instant access, syncs with server in background
class UnreadCountManager {
  static const String _tag = 'UnreadCountManager';
  static final _log = LoggingService.instance;

  static const String _countsKey = 'unread_counts_v1';
  static const String _lastSyncKey = 'unread_last_sync';
  static const Duration _syncInterval = Duration(minutes: 5);
  
  static UnreadCountManager? _instance;
  static UnreadCountManager get instance => _instance ??= UnreadCountManager._();
  
  UnreadCountManager._();

  SharedPreferences? _prefs;
  bool _initialized = false;
  Timer? _syncTimer;
  
  // Local unread counts (primary source of truth)
  Map<String, int> _counts = {};
  
  final List<VoidCallback> _listeners = [];
  
  // Stream controller for reactive updates
  final _countController = StreamController<int>.broadcast();
  Stream<int> get totalUnreadStream => _countController.stream;

  /// Initialize and load from local storage
  Future<void> init() async {
    if (_initialized) return;
    
    try {
      _prefs = await SharedPreferences.getInstance();
      await _loadFromLocal();
      _initialized = true;
      _log.serviceInitialized('UnreadCountManager');
      _log.debug('Loaded channels', tag: _tag, metadata: {'count': _counts.length});
      
      // Start periodic sync
      _startPeriodicSync();
      
      // Initial background sync
      _syncFromServer();
    } catch (e) {
      _log.error('Init error', tag: _tag, error: e);
    }
  }

  void addListener(VoidCallback callback) => _listeners.add(callback);
  void removeListener(VoidCallback callback) => _listeners.remove(callback);
  
  void _notifyListeners() {
    for (final listener in _listeners) {
      listener();
    }
    _countController.add(totalUnread);
  }

  /// Load counts from local storage
  Future<void> _loadFromLocal() async {
    try {
      final json = _prefs?.getString(_countsKey);
      if (json != null) {
        final map = jsonDecode(json) as Map<String, dynamic>;
        _counts = map.map((k, v) => MapEntry(k, v as int));
      }
    } catch (e) {
      _log.error('Load error', tag: _tag, error: e);
      _counts = {};
    }
  }

  /// Save counts to local storage
  Future<void> _saveToLocal() async {
    try {
      await _prefs?.setString(_countsKey, jsonEncode(_counts));
    } catch (e) {
      _log.error('Save error', tag: _tag, error: e);
    }
  }

  /// Start periodic sync timer
  void _startPeriodicSync() {
    _syncTimer?.cancel();
    _syncTimer = Timer.periodic(_syncInterval, (_) {
      _syncFromServer();
    });
  }

  // ==========================================
  // LOCAL OPERATIONS (instant)
  // ==========================================

  /// Get unread count for a channel
  int getCount(String channelId) => _counts[channelId] ?? 0;

  /// Get all unread counts
  Map<String, int> get allCounts => Map.unmodifiable(_counts);

  /// Get total unread count (for bottom nav badge)
  int get totalUnread => _counts.values.fold(0, (sum, count) => sum + count);

  /// Increment unread count (on new message received)
  void onNewMessage(String channelId, {int increment = 1}) {
    _counts[channelId] = (_counts[channelId] ?? 0) + increment;
    _notifyListeners();
    // Debounced save to avoid too many writes
    _debouncedSave();
  }

  /// Set unread count for a channel
  void setCount(String channelId, int count) {
    if (count <= 0) {
      _counts.remove(channelId);
    } else {
      _counts[channelId] = count;
    }
    _notifyListeners();
    _debouncedSave();
  }

  /// Mark channel as read (reset count to 0)
  void markAsRead(String channelId) {
    if (_counts.containsKey(channelId)) {
      _counts.remove(channelId);
      _notifyListeners();
      _saveToLocal();
      
      // Background sync to server
      _syncMarkAsReadToServer(channelId);
    }
  }

  /// Mark all channels as read
  void markAllAsRead() {
    _counts.clear();
    _notifyListeners();
    _saveToLocal();
    _syncMarkAllAsReadToServer();
  }

  /// Batch update counts (after server sync)
  void batchUpdate(Map<String, int> counts) {
    _counts = Map.from(counts);
    _notifyListeners();
    _saveToLocal();
  }

  // ==========================================
  // DEBOUNCED SAVE
  // ==========================================

  Timer? _saveDebounce;
  
  void _debouncedSave() {
    _saveDebounce?.cancel();
    _saveDebounce = Timer(const Duration(seconds: 2), () {
      _saveToLocal();
    });
  }

  // ==========================================
  // SERVER SYNC
  // ==========================================

  /// Sync unread counts from server (background)
  Future<void> _syncFromServer() async {
    try {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return;
      
      // Get unread counts from channel_members table
      final rows = await SupabaseConfig.client
          .from('channel_members')
          .select('channel_id, last_read_at')
          .eq('user_id', userId);
      
      // For each channel, count messages after last_read_at
      // This is a simplified approach - in production, you might want
      // to aggregate this on the server side
      for (final row in rows) {
        final channelId = row['channel_id'] as String;
        final lastReadAt = row['last_read_at'] as String?;
        
        if (lastReadAt != null) {
          try {
            final countResult = await SupabaseConfig.client
                .from('channel_messages')
                .select('id')
                .eq('channel_id', channelId)
                .gt('created_at', lastReadAt)
                .neq('sender_id', userId);
            
            final count = (countResult as List).length;
            if (count > 0) {
              _counts[channelId] = count;
            } else {
              _counts.remove(channelId);
            }
          } catch (e) {
            // Channel might not have messages yet
          }
        }
      }
      
      // Also check group chats
      final groupRows = await SupabaseConfig.client
          .from('chat_group_members')
          .select('group_id, last_read_at')
          .eq('user_id', userId);
      
      for (final row in groupRows) {
        final groupId = row['group_id'] as String;
        final lastReadAt = row['last_read_at'] as String?;
        final channelId = 'group:$groupId';
        
        if (lastReadAt != null) {
          try {
            final countResult = await SupabaseConfig.client
                .from('channel_messages')
                .select('id')
                .eq('channel_id', channelId)
                .gt('created_at', lastReadAt)
                .neq('sender_id', userId);
            
            final count = (countResult as List).length;
            if (count > 0) {
              _counts[channelId] = count;
            } else {
              _counts.remove(channelId);
            }
          } catch (e) {
            // Group might not have messages yet
          }
        }
      }
      
      await _saveToLocal();
      await _prefs?.setString(_lastSyncKey, DateTime.now().toIso8601String());
      
      _notifyListeners();
      _log.info('Unread counts synced from server', tag: _tag);
    } catch (e) {
      _log.warning('Unread sync failed', tag: _tag, error: e);
    }
  }

  /// Sync mark as read to server
  Future<void> _syncMarkAsReadToServer(String channelId) async {
    try {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return;
      
      // Check if it's a group chat
      if (channelId.startsWith('group:')) {
        final groupId = channelId.replaceFirst('group:', '');
        await SupabaseConfig.client
            .from('chat_group_members')
            .update({'last_read_at': DateTime.now().toIso8601String()})
            .eq('group_id', groupId)
            .eq('user_id', userId);
      } else {
        // Regular channel or DM
        await SupabaseConfig.client
            .from('channel_members')
            .update({'last_read_at': DateTime.now().toIso8601String()})
            .eq('channel_id', channelId)
            .eq('user_id', userId);
      }
    } catch (e) {
      _log.warning('Mark as read sync failed', tag: _tag, error: e);
    }
  }

  /// Sync mark all as read to server
  Future<void> _syncMarkAllAsReadToServer() async {
    try {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return;
      
      final now = DateTime.now().toIso8601String();
      
      await SupabaseConfig.client
          .from('channel_members')
          .update({'last_read_at': now})
          .eq('user_id', userId);
      
      await SupabaseConfig.client
          .from('chat_group_members')
          .update({'last_read_at': now})
          .eq('user_id', userId);
    } catch (e) {
      _log.warning('Mark all as read sync failed', tag: _tag, error: e);
    }
  }

  /// Force sync from server
  Future<void> forceSyncFromServer() async {
    await _syncFromServer();
  }

  /// Clear all counts (on logout)
  Future<void> clearAll() async {
    _counts.clear();
    await _prefs?.remove(_countsKey);
    await _prefs?.remove(_lastSyncKey);
    _notifyListeners();
    _log.info('UnreadCounts cleared', tag: _tag);
  }

  /// Dispose resources
  void dispose() {
    _syncTimer?.cancel();
    _saveDebounce?.cancel();
    _countController.close();
    _listeners.clear();
  }

  /// Get stats for debugging
  Map<String, dynamic> getStats() {
    return {
      'initialized': _initialized,
      'channelCount': _counts.length,
      'totalUnread': totalUnread,
    };
  }
}
