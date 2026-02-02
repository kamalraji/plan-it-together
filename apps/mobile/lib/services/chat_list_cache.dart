import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/models/chat_group.dart';
import 'package:thittam1hub/services/logging_service.dart';

/// Cached chat list data structure
class ChatListData {
  final List<WorkspaceChannel> channels;
  final List<DMThread> dms;
  final List<ChatGroup> groups;
  final Map<String, int> unreadCounts;
  final DateTime? lastSyncedAt;

  const ChatListData({
    this.channels = const [],
    this.dms = const [],
    this.groups = const [],
    this.unreadCounts = const {},
    this.lastSyncedAt,
  });

  bool get isEmpty => channels.isEmpty && dms.isEmpty && groups.isEmpty;

  Map<String, dynamic> toJson() => {
    'channels': channels.map((c) => c.toJson()).toList(),
    'dms': dms.map((d) => d.toJson()).toList(),
    'groups': groups.map((g) => g.toJson()).toList(),
    'unreadCounts': unreadCounts,
    'lastSyncedAt': lastSyncedAt?.toIso8601String(),
  };

  factory ChatListData.fromJson(Map<String, dynamic> json) {
    return ChatListData(
      channels: (json['channels'] as List<dynamic>?)
          ?.map((c) => WorkspaceChannel.fromJson(c as Map<String, dynamic>))
          .toList() ?? [],
      dms: (json['dms'] as List<dynamic>?)
          ?.map((d) => DMThread.fromJson(d as Map<String, dynamic>))
          .toList() ?? [],
      groups: (json['groups'] as List<dynamic>?)
          ?.map((g) => ChatGroup.fromJson(g as Map<String, dynamic>))
          .toList() ?? [],
      unreadCounts: (json['unreadCounts'] as Map<String, dynamic>?)
          ?.map((k, v) => MapEntry(k, v as int)) ?? {},
      lastSyncedAt: json['lastSyncedAt'] != null 
          ? DateTime.parse(json['lastSyncedAt'] as String)
          : null,
    );
  }
}

/// WhatsApp-style local-first chat list cache
/// Provides instant UI loading with background refresh
class ChatListCache {
  static const String _tag = 'ChatListCache';
  static final _log = LoggingService.instance;
  
  // Bump cache key to invalidate previously persisted chat lists.
  // This prevents users getting stuck with an empty list after backend/RLS fixes.
  static const String _cacheKey = 'chat_list_cache_v2';
  static const Duration _staleDuration = Duration(minutes: 5);
  
  static ChatListCache? _instance;
  static ChatListCache get instance => _instance ??= ChatListCache._();
  
  ChatListCache._();

  SharedPreferences? _prefs;
  ChatListData? _cachedData;
  bool _initialized = false;
  
  final List<VoidCallback> _listeners = [];

  /// Initialize the cache service
  Future<void> init() async {
    if (_initialized) return;
    
    try {
      _prefs = await SharedPreferences.getInstance();
      await _loadFromLocal();
      _initialized = true;
      _log.info('Initialized', tag: _tag);
    } catch (e) {
      _log.error('Init error', tag: _tag, error: e);
    }
  }

  /// Add listener for cache updates
  void addListener(VoidCallback callback) {
    _listeners.add(callback);
  }

  /// Remove listener
  void removeListener(VoidCallback callback) {
    _listeners.remove(callback);
  }

  void _notifyListeners() {
    for (final listener in _listeners) {
      listener();
    }
  }

  /// Load cached data from local storage
  Future<void> _loadFromLocal() async {
    try {
      final json = _prefs?.getString(_cacheKey);
      if (json != null) {
        final data = jsonDecode(json) as Map<String, dynamic>;
        _cachedData = ChatListData.fromJson(data);
        _log.info('Loaded: ${_cachedData!.dms.length} DMs, ${_cachedData!.groups.length} groups', tag: _tag);
      }
    } catch (e) {
      _log.error('Load error', tag: _tag, error: e);
      _cachedData = null;
    }
  }

  /// Save current data to local storage
  Future<void> _saveToLocal() async {
    if (_cachedData == null) return;
    
    try {
      final json = jsonEncode(_cachedData!.toJson());
      await _prefs?.setString(_cacheKey, json);
      _log.debug('Saved', tag: _tag);
    } catch (e) {
      _log.error('Save error', tag: _tag, error: e);
    }
  }

  /// Get cached chat list with stale indicator
  /// Returns (data, isStale) - always returns data if available
  Future<(ChatListData?, bool)> getChatList() async {
    if (!_initialized) await init();
    
    if (_cachedData == null) {
      return (null, true);
    }
    
    final isStale = _isStale(_cachedData!.lastSyncedAt);
    return (_cachedData, isStale);
  }

  /// Check if cache is stale
  bool _isStale(DateTime? lastSyncedAt) {
    if (lastSyncedAt == null) return true;
    return DateTime.now().difference(lastSyncedAt) > _staleDuration;
  }

  /// Update cache with fresh data from server
  Future<void> updateCache({
    List<WorkspaceChannel>? channels,
    List<DMThread>? dms,
    List<ChatGroup>? groups,
    Map<String, int>? unreadCounts,
  }) async {
    _cachedData = ChatListData(
      channels: channels ?? _cachedData?.channels ?? [],
      dms: dms ?? _cachedData?.dms ?? [],
      groups: groups ?? _cachedData?.groups ?? [],
      unreadCounts: unreadCounts ?? _cachedData?.unreadCounts ?? {},
      lastSyncedAt: DateTime.now(),
    );
    
    await _saveToLocal();
    _notifyListeners();
  }

  /// Update single channel's last message (real-time optimization)
  void updateChannelLastMessage(String channelId, Message message) {
    if (_cachedData == null) return;
    
    // Update DM thread
    final dmIndex = _cachedData!.dms.indexWhere((d) => d.channelId == channelId);
    if (dmIndex >= 0) {
      final dm = _cachedData!.dms[dmIndex];
      final updatedDm = dm.copyWith(
        lastMessage: message,
        updatedAt: message.sentAt,
      );
      final dms = List<DMThread>.from(_cachedData!.dms);
      dms[dmIndex] = updatedDm;
      _cachedData = ChatListData(
        channels: _cachedData!.channels,
        dms: dms,
        groups: _cachedData!.groups,
        unreadCounts: _cachedData!.unreadCounts,
        lastSyncedAt: _cachedData!.lastSyncedAt,
      );
      _saveToLocal();
      _notifyListeners();
    }
    
    // Update workspace channel
    final channelIndex = _cachedData!.channels.indexWhere((c) => c.id == channelId);
    if (channelIndex >= 0) {
      // Channels don't have lastMessage in model, but we can notify listeners
      _notifyListeners();
    }
  }

  /// Update unread count for a channel
  void updateUnreadCount(String channelId, int count) {
    if (_cachedData == null) return;
    
    final counts = Map<String, int>.from(_cachedData!.unreadCounts);
    counts[channelId] = count;
    
    _cachedData = ChatListData(
      channels: _cachedData!.channels,
      dms: _cachedData!.dms,
      groups: _cachedData!.groups,
      unreadCounts: counts,
      lastSyncedAt: _cachedData!.lastSyncedAt,
    );
    
    _notifyListeners();
    // Don't save for every unread update - batch save periodically
  }

  /// Increment unread count (for new message)
  void incrementUnread(String channelId) {
    if (_cachedData == null) return;
    
    final counts = Map<String, int>.from(_cachedData!.unreadCounts);
    counts[channelId] = (counts[channelId] ?? 0) + 1;
    
    _cachedData = ChatListData(
      channels: _cachedData!.channels,
      dms: _cachedData!.dms,
      groups: _cachedData!.groups,
      unreadCounts: counts,
      lastSyncedAt: _cachedData!.lastSyncedAt,
    );
    
    _notifyListeners();
  }

  /// Mark channel as read (reset unread count)
  void markAsRead(String channelId) {
    updateUnreadCount(channelId, 0);
  }

  /// Get total unread count for bottom nav badge
  int get totalUnreadCount {
    if (_cachedData == null) return 0;
    return _cachedData!.unreadCounts.values.fold(0, (sum, count) => sum + count);
  }

  /// Clear all cached data
  Future<void> clearCache() async {
    _cachedData = null;
    await _prefs?.remove(_cacheKey);
    _notifyListeners();
    _log.info('Cache cleared', tag: _tag);
  }

  /// Get cache stats for debugging
  Map<String, dynamic> getStats() {
    return {
      'initialized': _initialized,
      'hasData': _cachedData != null,
      'channelCount': _cachedData?.channels.length ?? 0,
      'dmCount': _cachedData?.dms.length ?? 0,
      'groupCount': _cachedData?.groups.length ?? 0,
      'isStale': _cachedData != null ? _isStale(_cachedData!.lastSyncedAt) : true,
      'lastSyncedAt': _cachedData?.lastSyncedAt?.toIso8601String(),
    };
  }
}
