import 'dart:async';
import 'dart:ui' show VoidCallback;
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/models/chat_group.dart';
import 'package:thittam1hub/services/chat_service.dart';
import 'package:thittam1hub/services/group_chat_service.dart';
import 'package:thittam1hub/services/connectivity_service.dart';
import 'package:thittam1hub/services/chat_list_cache.dart';
import 'package:thittam1hub/services/chat_preferences_store.dart';
import 'package:thittam1hub/services/unread_count_manager.dart';
import 'package:thittam1hub/services/local_message_store.dart';
import 'package:thittam1hub/services/logging_service.dart';

/// Centralized chat sync service
/// Coordinates data loading between local cache and server
/// Implements delta sync strategy for efficient bandwidth usage
class ChatSyncService {
  static const String _tag = 'ChatSyncService';
  static final LoggingService _log = LoggingService.instance;

  static ChatSyncService? _instance;
  static ChatSyncService get instance => _instance ??= ChatSyncService._();
  
  ChatSyncService._();

  final _chatListCache = ChatListCache.instance;
  final _prefsStore = ChatPreferencesStore.instance;
  final _unreadManager = UnreadCountManager.instance;
  final _messageStore = LocalMessageStore.instance;
  final _groupService = GroupChatService();
  
  bool _initialized = false;
  StreamSubscription? _connectivitySub;
  
  final List<VoidCallback> _listeners = [];

  /// Initialize the sync service
  Future<void> init() async {
    if (_initialized) return;
    
    // Initialize sub-services in parallel
    await Future.wait([
      _chatListCache.init(),
      _prefsStore.init(),
      _unreadManager.init(),
      _messageStore.init(),
    ]);
    
    // Listen for reconnection to trigger sync
    ConnectivityService.instance.addOnReconnectListener(_onReconnect);
    _initialized = true;
    _log.info('ChatSyncService initialized', tag: _tag);
  }

  void _onReconnect() {
    _log.debug('Reconnected, performing delta sync', tag: _tag);
    performDeltaSync();
    
  }

  void addListener(VoidCallback callback) => _listeners.add(callback);
  void removeListener(VoidCallback callback) => _listeners.remove(callback);
  
  void _notifyListeners() {
    for (final listener in _listeners) {
      listener();
    }
  }

  // ==========================================
  // LOCAL-FIRST CHAT LIST LOADING
  // ==========================================

  /// Load chat list - local first, then background refresh
  /// Returns (channels, dms, groups, unreadCounts, isFromCache)
  Future<ChatLoadResult> loadChatList({bool forceRefresh = false}) async {
    if (!_initialized) await init();
    
    // Step 1: Try to get from cache
    final (cached, isStale) = await _chatListCache.getChatList();
    
    if (cached != null && !forceRefresh) {
      // Return cached data immediately
      final result = ChatLoadResult(
        channels: cached.channels,
        dms: cached.dms,
        groups: cached.groups,
        unreadCounts: _unreadManager.allCounts,
        pinnedIds: _prefsStore.pinnedIds,
        archivedIds: _prefsStore.archivedIds,
        mutedIds: _prefsStore.mutedIds,
        isFromCache: true,
        isStale: isStale,
      );
      
      // Background refresh if stale
      if (isStale) {
        _refreshInBackground();
      }
      
      return result;
    }
    
    // Step 2: No cache or force refresh - fetch from server
    return await _fetchFromServer();
  }

  /// Fetch fresh data from server
  Future<ChatLoadResult> _fetchFromServer() async {
    try {
      // Parallel fetch from server
      // Note: GroupChatService.fetchMyGroups() unwraps Result internally
      // to match ChatService pattern for type-safe Future.wait usage
      final results = await Future.wait([
        ChatService.getMyChannels().catchError((_) => <WorkspaceChannel>[]),
        ChatService.getMyDMThreads().catchError((_) => <DMThread>[]),
        GroupChatService.fetchMyGroups().catchError((_) => <ChatGroup>[]),
      ]);
      
      final channels = results[0] as List<WorkspaceChannel>;
      final dms = results[1] as List<DMThread>;
      final groups = results[2] as List<ChatGroup>;
      
      // Build unread counts from groups (DMs get count from UnreadCountManager)
      final unreadCounts = <String, int>{};
      for (final group in groups) {
        if (group.unreadCount > 0) {
          unreadCounts[group.id] = group.unreadCount;
        }
      }
      
      // Update caches
      await _chatListCache.updateCache(
        channels: channels,
        dms: dms,
        groups: groups,
        unreadCounts: unreadCounts,
      );
      
      _unreadManager.batchUpdate(unreadCounts);
      
      _notifyListeners();
      
      _log.dbOperation('SELECT chat list', 'multiple', tag: _tag);
      
      return ChatLoadResult(
        channels: channels,
        dms: dms,
        groups: groups,
        unreadCounts: unreadCounts,
        pinnedIds: _prefsStore.pinnedIds,
        archivedIds: _prefsStore.archivedIds,
        mutedIds: _prefsStore.mutedIds,
        isFromCache: false,
        isStale: false,
      );
    } catch (e) {
      _log.error('Fetch error', tag: _tag, error: e);
      
      // Fall back to stale cache if available
      final (cached, _) = await _chatListCache.getChatList();
      if (cached != null) {
        return ChatLoadResult(
          channels: cached.channels,
          dms: cached.dms,
          groups: cached.groups,
          unreadCounts: _unreadManager.allCounts,
          pinnedIds: _prefsStore.pinnedIds,
          archivedIds: _prefsStore.archivedIds,
          mutedIds: _prefsStore.mutedIds,
          isFromCache: true,
          isStale: true,
          error: e.toString(),
        );
      }
      
      rethrow;
    }
  }

  /// Background refresh (non-blocking)
  void _refreshInBackground() {
    _fetchFromServer().then((_) {
      _log.debug('Background refresh complete', tag: _tag);
    }).catchError((e) {
      _log.warning('Background refresh failed', tag: _tag, error: e);
    });
  }

  // ==========================================
  // DELTA SYNC
  // ==========================================

  /// Perform delta sync - only fetch changes since last sync
  Future<void> performDeltaSync() async {
    if (!ConnectivityService.instance.isOnline) return;
    
    try {
      // Refresh all data in parallel
      await Future.wait([
        _fetchFromServer(),
        _prefsStore.forceSyncFromServer(),
        _unreadManager.forceSyncFromServer(),
      ]);
      
      _notifyListeners();
      _log.info('Delta sync complete', tag: _tag);
    } catch (e) {
      _log.warning('Delta sync failed', tag: _tag, error: e);
    }
  }

  // ==========================================
  // MESSAGE CACHE OPERATIONS
  // ==========================================

  /// Load messages for a channel - local first with delta sync
  /// Returns (messages, isFromCache, hasMore)
  Future<(List<Message>, bool, bool)> loadMessages(
    String channelId, {
    int limit = 50,
  }) async {
    // Step 1: Get from local cache instantly
    final (cached, isFromCache, hasMore) = await _messageStore.getMessages(
      channelId,
      limit: limit,
    );
    
    if (cached.isNotEmpty) {
      // Return cached data, sync in background
      _messageStore.syncChannel(channelId);
      return (cached, true, hasMore);
    }
    
    // Step 2: No cache - fetch from server
    final newMessages = await _messageStore.syncChannel(channelId);
    return (newMessages, false, newMessages.length >= limit);
  }

  /// Sync messages for a channel (delta only)
  Future<List<Message>> syncMessages(String channelId) async {
    return await _messageStore.syncChannel(channelId);
  }

  /// Add message optimistically
  Future<void> addMessageOptimistic(String channelId, Message message) async {
    await _messageStore.addMessageOptimistic(channelId, message);
  }

  /// Preload messages for visible channels
  Future<void> preloadChannelMessages(List<String> channelIds) async {
    await _messageStore.preloadChannels(channelIds);
  }

  // ==========================================
  // REAL-TIME UPDATES
  // ==========================================

  /// Handle new message received (real-time)
  void onNewMessageReceived(String channelId, Message message) {
    // Add to local message store
    _messageStore.addMessageOptimistic(channelId, message);
    
    // Update chat list cache
    _chatListCache.updateChannelLastMessage(channelId, message);
    
    // Increment unread if not from current user
    final currentUserId = ChatService.getCurrentUserId();
    if (message.senderId != currentUserId) {
      _unreadManager.onNewMessage(channelId);
    }
    
    _notifyListeners();
  }

  /// Handle message read (chat opened)
  void onChatOpened(String channelId) {
    _chatListCache.markAsRead(channelId);
    _unreadManager.markAsRead(channelId);
    _notifyListeners();
  }

  // ==========================================
  // PREFERENCES SHORTCUTS
  // ==========================================

  Future<void> togglePin(String channelId) async {
    await _prefsStore.togglePin(channelId);
    _notifyListeners();
  }

  Future<void> toggleArchive(String channelId) async {
    await _prefsStore.toggleArchive(channelId);
    _notifyListeners();
  }

  Future<void> toggleMute(String channelId) async {
    await _prefsStore.toggleMute(channelId);
    _notifyListeners();
  }

  bool isPinned(String channelId) => _prefsStore.isPinned(channelId);
  bool isArchived(String channelId) => _prefsStore.isArchived(channelId);
  bool isMuted(String channelId) => _prefsStore.isMuted(channelId);

  // ==========================================
  // CLEANUP
  // ==========================================

  /// Clear all cached data (on logout)
  Future<void> clearAll() async {
    await _chatListCache.clearCache();
    await _prefsStore.clearAll();
    await _unreadManager.clearAll();
    await _messageStore.clearAll();
    _notifyListeners();
  }

  /// Dispose resources
  void dispose() {
    ConnectivityService.instance.removeOnReconnectListener(_onReconnect);
    _connectivitySub?.cancel();
    _unreadManager.dispose();
    _listeners.clear();
  }

  /// Get sync stats for debugging
  Map<String, dynamic> getStats() {
    return {
      'initialized': _initialized,
      'cache': _chatListCache.getStats(),
      'preferences': _prefsStore.getStats(),
      'unread': _unreadManager.getStats(),
    };
  }
}

/// Result of chat list loading
class ChatLoadResult {
  final List<WorkspaceChannel> channels;
  final List<DMThread> dms;
  final List<ChatGroup> groups;
  final Map<String, int> unreadCounts;
  final Set<String> pinnedIds;
  final Set<String> archivedIds;
  final Set<String> mutedIds;
  final bool isFromCache;
  final bool isStale;
  final String? error;

  const ChatLoadResult({
    required this.channels,
    required this.dms,
    required this.groups,
    required this.unreadCounts,
    required this.pinnedIds,
    required this.archivedIds,
    required this.mutedIds,
    required this.isFromCache,
    required this.isStale,
    this.error,
  });

  int get totalUnread => unreadCounts.values.fold(0, (sum, c) => sum + c);
}
