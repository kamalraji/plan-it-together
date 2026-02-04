import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/models/chat_group.dart';
import 'package:thittam1hub/models/circle.dart';
import 'package:thittam1hub/services/chat_service.dart';
import 'package:thittam1hub/services/chat_folder_service.dart';
import 'package:thittam1hub/services/connectivity_service.dart';
import 'package:thittam1hub/services/chat_sync_service.dart';
import 'package:thittam1hub/services/logging_mixin.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/supabase/circle_service.dart';
import 'package:thittam1hub/utils/result.dart';

/// Filter for chat tabs (All, Direct, Groups, Channels)
enum ChatTabFilter { all, direct, groups, channels }

/// Filter for chat list (All, Unread, Media, etc.)
enum ChatListFilter { all, unread, media, archived, muted, pinned }

/// Controller for ChatPage business logic and state management.
/// 
/// Separates all data operations, filtering, and state from the UI layer.
/// Implements server-side persistence for pins, folders, mutes, and archives.
class ChatPageController extends ChangeNotifier with LoggingMixin {
  @override
  String get logTag => 'ChatPageController';
  
  final CircleService _circleService;
  final ChatSyncService _syncService;
  final ChatFolderService _folderService;
  
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════
  
  bool _loading = true;
  bool get loading => _loading;
  
  List<WorkspaceChannel> _channels = [];
  List<WorkspaceChannel> get channels => _channels;
  
  Map<String, Message?> _lastMessages = {};
  Map<String, Message?> get lastMessages => _lastMessages;
  
  List<DMThread> _dmThreads = [];
  List<DMThread> get dmThreads => _dmThreads;
  
  List<ChatGroup> _groups = [];
  List<ChatGroup> get groups => _groups;
  
  List<Circle> _circles = [];
  List<Circle> get circles => _circles;
  
  Map<String, int> _unreadCounts = {};
  Map<String, int> get unreadCounts => _unreadCounts;
  
  // UI state
  ChatTabFilter _selectedTab = ChatTabFilter.all;
  ChatTabFilter get selectedTab => _selectedTab;
  
  ChatListFilter _listFilter = ChatListFilter.all;
  ChatListFilter get listFilter => _listFilter;
  
  Set<String> _pinnedChatIds = {};
  Set<String> get pinnedChatIds => _pinnedChatIds;
  
  Set<String> _mutedChatIds = {};
  Set<String> get mutedChatIds => _mutedChatIds;
  
  Set<String> _archivedChatIds = {};
  Set<String> get archivedChatIds => _archivedChatIds;
  
  int _archivedCount = 0;
  int get archivedCount => _archivedCount;
  
  // Folder state (server-persisted)
  List<ChatFolder> _folders = [];
  List<ChatFolder> get folders => _folders;
  
  String? _selectedFolderId;
  String? get selectedFolderId => _selectedFolderId;
  
  // Cache state
  bool _isFromCache = false;
  bool get isFromCache => _isFromCache;
  
  bool _isStale = false;
  bool get isStale => _isStale;
  
  // Connectivity
  bool _isConnected = true;
  bool get isConnected => _isConnected;
  
  // Search
  String _searchQuery = '';
  String get searchQuery => _searchQuery;
  
  // Realtime
  RealtimeChannel? _messagesChannel;
  
  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED PROPERTIES
  // ═══════════════════════════════════════════════════════════════════════════
  
  int get totalUnread => _unreadCounts.values.fold(0, (a, b) => a + b);
  bool get hasUnread => totalUnread > 0;
  
  int get dmUnread => _dmThreads.fold(0, (sum, dm) => sum + (_unreadCounts[dm.channelId] ?? 0));
  int get groupUnread => _groups.fold(0, (sum, g) => sum + g.unreadCount);
  int get channelUnread => _channels.fold(0, (sum, c) => sum + (_unreadCounts[c.id] ?? 0));
  int get mutedCount => _mutedChatIds.length;
  int get folderCount => _folders.length;
  
  /// Get folder by ID
  ChatFolder? getFolderById(String id) {
    try {
      return _folders.firstWhere((f) => f.id == id);
    } catch (_) {
      return null;
    }
  }
  
  /// Get unread count for a folder
  int getFolderUnreadCount(String folderId) {
    final folder = getFolderById(folderId);
    if (folder == null) return 0;
    
    int count = 0;
    for (final channelId in folder.channelIds) {
      count += _unreadCounts[channelId] ?? 0;
    }
    return count;
  }
  
  /// Check if a channel is in any folder
  String? getChannelFolderId(String channelId) {
    for (final folder in _folders) {
      if (folder.channelIds.contains(channelId)) {
        return folder.id;
      }
    }
    return null;
  }
  
  /// Filtered channels based on search, list filter, and folder
  List<WorkspaceChannel> get filteredChannels {
    final q = _searchQuery.toLowerCase();
    var result = _channels;
    
    // Filter by selected folder
    if (_selectedFolderId != null) {
      final folder = getFolderById(_selectedFolderId!);
      if (folder != null) {
        result = result.where((c) => folder.channelIds.contains(c.id)).toList();
      }
    }
    
    // Exclude archived by default (unless viewing archived filter)
    if (_listFilter != ChatListFilter.archived) {
      result = result.where((c) => !_archivedChatIds.contains(c.id)).toList();
    }
    
    if (q.isNotEmpty) {
      result = result.where((c) => 
        c.name.toLowerCase().contains(q) || 
        (c.description ?? '').toLowerCase().contains(q)
      ).toList();
    }
    
    if (_listFilter == ChatListFilter.unread) {
      result = result.where((c) => (_unreadCounts[c.id] ?? 0) > 0).toList();
    } else if (_listFilter == ChatListFilter.muted) {
      result = result.where((c) => _mutedChatIds.contains(c.id)).toList();
    } else if (_listFilter == ChatListFilter.pinned) {
      result = result.where((c) => _pinnedChatIds.contains(c.id)).toList();
    } else if (_listFilter == ChatListFilter.archived) {
      result = result.where((c) => _archivedChatIds.contains(c.id)).toList();
    }
    return result;
  }
  
  /// Filtered DM threads based on search, list filter, and folder
  List<DMThread> get filteredDMs {
    final q = _searchQuery.toLowerCase();
    var result = _dmThreads;
    
    // Filter by selected folder
    if (_selectedFolderId != null) {
      final folder = getFolderById(_selectedFolderId!);
      if (folder != null) {
        result = result.where((t) => folder.channelIds.contains(t.channelId)).toList();
      }
    }
    
    if (_listFilter != ChatListFilter.archived) {
      result = result.where((t) => !_archivedChatIds.contains(t.channelId)).toList();
    }
    
    if (q.isNotEmpty) {
      result = result.where((t) => t.partnerName.toLowerCase().contains(q)).toList();
    }
    
    if (_listFilter == ChatListFilter.unread) {
      result = result.where((t) => (_unreadCounts[t.channelId] ?? 0) > 0).toList();
    } else if (_listFilter == ChatListFilter.muted) {
      result = result.where((t) => _mutedChatIds.contains(t.channelId)).toList();
    } else if (_listFilter == ChatListFilter.pinned) {
      result = result.where((t) => _pinnedChatIds.contains(t.channelId)).toList();
    } else if (_listFilter == ChatListFilter.archived) {
      result = result.where((t) => _archivedChatIds.contains(t.channelId)).toList();
    }
    return _sortConversations(result);
  }
  
  /// Filtered groups based on search, list filter, and folder
  List<ChatGroup> get filteredGroups {
    final q = _searchQuery.toLowerCase();
    var result = _groups;
    
    // Filter by selected folder
    if (_selectedFolderId != null) {
      final folder = getFolderById(_selectedFolderId!);
      if (folder != null) {
        result = result.where((g) => folder.channelIds.contains(g.id)).toList();
      }
    }
    
    if (_listFilter != ChatListFilter.archived) {
      result = result.where((g) => !_archivedChatIds.contains(g.id)).toList();
    }
    
    if (q.isNotEmpty) {
      result = result.where((g) => 
        g.name.toLowerCase().contains(q) || 
        (g.description ?? '').toLowerCase().contains(q)
      ).toList();
    }
    
    if (_listFilter == ChatListFilter.unread) {
      result = result.where((g) => g.unreadCount > 0).toList();
    } else if (_listFilter == ChatListFilter.muted) {
      result = result.where((g) => _mutedChatIds.contains(g.id)).toList();
    } else if (_listFilter == ChatListFilter.pinned) {
      result = result.where((g) => _pinnedChatIds.contains(g.id)).toList();
    } else if (_listFilter == ChatListFilter.archived) {
      result = result.where((g) => _archivedChatIds.contains(g.id)).toList();
    }
    return _sortGroups(result);
  }
  
  /// Active chats for the stories bar
  List<ActiveChatItem> get activeChats {
    final List<ActiveChatItem> items = [];
    
    for (final dm in _dmThreads.take(10)) {
      items.add(ActiveChatItem(
        id: dm.partnerUserId,
        name: dm.partnerName,
        avatarUrl: dm.partnerAvatar,
        isOnline: true,
        hasUnread: (_unreadCounts[dm.channelId] ?? 0) > 0,
        unreadCount: _unreadCounts[dm.channelId] ?? 0,
        channelId: dm.channelId,
      ));
    }
    
    for (final group in _groups.take(5)) {
      items.add(ActiveChatItem(
        id: group.id,
        name: group.name,
        avatarUrl: group.iconUrl,
        hasUnread: group.unreadCount > 0,
        unreadCount: group.unreadCount,
        isGroup: true,
      ));
    }
    
    return items;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTRUCTOR & LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════════
  
  ChatPageController({
    CircleService? circleService,
    ChatSyncService? syncService,
    ChatFolderService? folderService,
    String? initialTab,
    String? initialFilter,
    String? initialSearch,
  }) : _circleService = circleService ?? CircleService(),
       _syncService = syncService ?? ChatSyncService.instance,
       _folderService = folderService ?? ChatFolderService.instance {
    // Initialize from URL parameters
    _selectedTab = _tabFromString(initialTab);
    _listFilter = _filterFromString(initialFilter);
    _searchQuery = initialSearch ?? '';
    
    _setupConnectivity();
    _subscribeToMessages();
    _subscribeToFolders();
  }
  
  void _setupConnectivity() {
    ConnectivityService.instance.addOnReconnectListener(_onReconnect);
    _isConnected = ConnectivityService.instance.isOnline;
  }
  
  void _onReconnect() {
    _isConnected = true;
    notifyListeners();
    loadChats();
  }
  
  void _subscribeToMessages() {
    _messagesChannel = SupabaseConfig.client
      .channel('chat_list_realtime')
      .onPostgresChanges(
        event: PostgresChangeEvent.insert,
        schema: 'public',
        table: 'messages',
        callback: (payload) {
          logDebug('New message received, refreshing chat list');
          loadChats();
        },
      )
      .subscribe();
  }
  
  void _subscribeToFolders() {
    _folderService.addListener(_onFoldersUpdated);
    _folderService.subscribeToUpdates();
  }
  
  void _onFoldersUpdated(List<ChatFolder> folders) {
    _folders = folders;
    notifyListeners();
  }
  
  @override
  void dispose() {
    _messagesChannel?.unsubscribe();
    _folderService.removeListener(_onFoldersUpdated);
    ConnectivityService.instance.removeOnReconnectListener(_onReconnect);
    super.dispose();
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /// Load chat data using local-first pattern
  Future<void> loadChats({bool forceRefresh = false}) async {
    try {
      final results = await Future.wait([
        _syncService.loadChatList(forceRefresh: forceRefresh),
        _folderService.getFolders(),
      ]);
      
      final result = results[0] as ChatLoadResult;
      final foldersResult = results[1] as Result<List<ChatFolder>>;
      
      final last = result.channels.isNotEmpty 
          ? await ChatService.getLastMessages(result.channels.map((e) => e.id).toList())
          : <String, Message?>{};
      
      final circles = await _circleService.getMyJoinedCircles().catchError((_) => <Circle>[]);
      
      _channels = result.channels;
      _lastMessages = last;
      _dmThreads = result.dms;
      _groups = result.groups;
      _circles = circles;
      _unreadCounts = result.unreadCounts;
      _pinnedChatIds = result.pinnedIds;
      _archivedChatIds = result.archivedIds;
      _mutedChatIds = result.mutedIds;
      _archivedCount = result.archivedIds.length;
      _isFromCache = result.isFromCache;
      _isStale = result.isStale;
      _loading = false;
      
      // Update folders from server
      if (foldersResult is Success<List<ChatFolder>>) {
        _folders = foldersResult.data;
      }
      
      if (result.isFromCache) {
        logDebug('ChatPage loaded from cache (stale: ${result.isStale})');
      } else {
        logDebug('ChatPage loaded from server');
      }
      
      notifyListeners();
    } catch (e) {
      logError('ChatPage load error', error: e);
      _loading = false;
      notifyListeners();
    }
  }
  
  /// Mark all messages as read
  Future<void> markAllAsRead() async {
    final allChannelIds = [
      ..._channels.map((e) => e.id),
      ..._dmThreads.map((e) => e.channelId),
    ];
    await ChatService.markAllAsRead(allChannelIds);
    _unreadCounts.clear();
    notifyListeners();
  }
  
  /// Update search query
  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }
  
  /// Update selected tab
  void setSelectedTab(ChatTabFilter tab) {
    _selectedTab = tab;
    notifyListeners();
  }
  
  /// Update list filter
  void setListFilter(ChatListFilter filter) {
    _listFilter = filter;
    notifyListeners();
  }
  
  /// Select a folder for filtering
  void selectFolder(String? folderId) {
    _selectedFolderId = folderId;
    notifyListeners();
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SERVER-PERSISTED ACTIONS (Pin, Mute, Archive, Folders)
  // ═══════════════════════════════════════════════════════════════════════════
  
  /// Toggle pin status for a chat (server-persisted)
  Future<void> togglePin(String id) async {
    // Optimistic update
    final wasPinned = _pinnedChatIds.contains(id);
    if (wasPinned) {
      _pinnedChatIds.remove(id);
    } else {
      _pinnedChatIds.add(id);
    }
    notifyListeners();
    
    // Persist to server via sync service
    try {
      await _syncService.togglePin(id);
      logDebug('Pin toggled for $id (now: ${!wasPinned})');
    } catch (e) {
      // Rollback on failure
      if (wasPinned) {
        _pinnedChatIds.add(id);
      } else {
        _pinnedChatIds.remove(id);
      }
      notifyListeners();
      logError('Failed to toggle pin', error: e);
    }
  }
  
  /// Toggle mute status for a chat (server-persisted)
  Future<void> toggleMute(String id) async {
    // Optimistic update
    final wasMuted = _mutedChatIds.contains(id);
    if (wasMuted) {
      _mutedChatIds.remove(id);
    } else {
      _mutedChatIds.add(id);
    }
    notifyListeners();
    
    // Persist to server via sync service
    try {
      await _syncService.toggleMute(id);
      logDebug('Mute toggled for $id (now: ${!wasMuted})');
    } catch (e) {
      // Rollback on failure
      if (wasMuted) {
        _mutedChatIds.add(id);
      } else {
        _mutedChatIds.remove(id);
      }
      notifyListeners();
      logError('Failed to toggle mute', error: e);
    }
  }
  
  /// Toggle archive status for a chat (server-persisted)
  Future<void> toggleArchive(String id) async {
    // Optimistic update
    final wasArchived = _archivedChatIds.contains(id);
    if (wasArchived) {
      _archivedChatIds.remove(id);
      _archivedCount--;
    } else {
      _archivedChatIds.add(id);
      _archivedCount++;
    }
    notifyListeners();
    
    // Persist to server via sync service
    try {
      await _syncService.toggleArchive(id);
      logDebug('Archive toggled for $id (now: ${!wasArchived})');
    } catch (e) {
      // Rollback on failure
      if (wasArchived) {
        _archivedChatIds.add(id);
        _archivedCount++;
      } else {
        _archivedChatIds.remove(id);
        _archivedCount--;
      }
      notifyListeners();
      logError('Failed to toggle archive', error: e);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FOLDER MANAGEMENT (Server-Persisted)
  // ═══════════════════════════════════════════════════════════════════════════
  
  /// Create a new folder
  Future<ChatFolder?> createFolder({
    required String name,
    String icon = 'folder',
    String color = '#6366f1',
  }) async {
    final result = await _folderService.createFolder(
      name: name,
      icon: icon,
      color: color,
    );
    
    if (result is Success<ChatFolder?> && result.data != null) {
      _folders = [..._folders, result.data!];
      notifyListeners();
      logInfo('Folder created: $name');
      return result.data;
    }
    return null;
  }
  
  /// Update a folder
  Future<void> updateFolder({
    required String folderId,
    String? name,
    String? icon,
    String? color,
    bool? isMuted,
  }) async {
    final result = await _folderService.updateFolder(
      folderId: folderId,
      name: name,
      icon: icon,
      color: color,
      isMuted: isMuted,
    );
    
    if (result is Success<ChatFolder?> && result.data != null) {
      final index = _folders.indexWhere((f) => f.id == folderId);
      if (index >= 0) {
        _folders[index] = result.data!;
        notifyListeners();
      }
      logInfo('Folder updated: $folderId');
    }
  }
  
  /// Delete a folder
  Future<void> deleteFolder(String folderId) async {
    // Optimistic update
    final removedFolder = _folders.firstWhere((f) => f.id == folderId);
    _folders = _folders.where((f) => f.id != folderId).toList();
    
    if (_selectedFolderId == folderId) {
      _selectedFolderId = null;
    }
    notifyListeners();
    
    final result = await _folderService.deleteFolder(folderId);
    
    if (result is Failure) {
      // Rollback
      _folders = [..._folders, removedFolder];
      notifyListeners();
      logError('Failed to delete folder');
    } else {
      logInfo('Folder deleted: $folderId');
    }
  }
  
  /// Add a channel to a folder
  Future<void> addChannelToFolder(String channelId, String folderId) async {
    final result = await _folderService.addToFolder(folderId, channelId);
    
    if (result is Success<bool>) {
      // Refresh folders to get updated channelIds
      final foldersResult = await _folderService.getFolders();
      if (foldersResult is Success<List<ChatFolder>>) {
        _folders = foldersResult.data;
        notifyListeners();
      }
      logDebug('Channel $channelId added to folder $folderId');
    }
  }
  
  /// Remove a channel from a folder
  Future<void> removeChannelFromFolder(String channelId, String folderId) async {
    final result = await _folderService.removeFromFolder(folderId, channelId);
    
    if (result is Success<bool>) {
      // Refresh folders to get updated channelIds
      final foldersResult = await _folderService.getFolders();
      if (foldersResult is Success<List<ChatFolder>>) {
        _folders = foldersResult.data;
        notifyListeners();
      }
      logDebug('Channel $channelId removed from folder $folderId');
    }
  }
  
  /// Move a channel to a different folder
  Future<void> moveChannelToFolder(String channelId, String toFolderId) async {
    final fromFolderId = getChannelFolderId(channelId);
    
    final result = await _folderService.moveToFolder(channelId, fromFolderId, toFolderId);
    
    if (result is Success<bool>) {
      // Refresh folders
      final foldersResult = await _folderService.getFolders();
      if (foldersResult is Success<List<ChatFolder>>) {
        _folders = foldersResult.data;
        notifyListeners();
      }
      logDebug('Channel $channelId moved to folder $toFolderId');
    }
  }
  
  /// Reorder folders
  Future<void> reorderFolders(List<String> folderIds) async {
    // Optimistic update
    final reordered = <ChatFolder>[];
    for (final id in folderIds) {
      final folder = _folders.firstWhere((f) => f.id == id);
      reordered.add(folder);
    }
    _folders = reordered;
    notifyListeners();
    
    final result = await _folderService.reorderFolders(folderIds);
    
    if (result is Failure) {
      // Refresh from server on failure
      final foldersResult = await _folderService.getFolders();
      if (foldersResult is Success<List<ChatFolder>>) {
        _folders = foldersResult.data;
        notifyListeners();
      }
    }
  }
  
  /// Update from external navigation (deep links)
  void updateFromNavigation({
    String? tab,
    String? filter,
    String? search,
  }) {
    bool changed = false;
    
    if (tab != null) {
      final newTab = _tabFromString(tab);
      if (_selectedTab != newTab) {
        _selectedTab = newTab;
        changed = true;
      }
    }
    
    if (filter != null) {
      final newFilter = _filterFromString(filter);
      if (_listFilter != newFilter) {
        _listFilter = newFilter;
        changed = true;
      }
    }
    
    if (search != null && _searchQuery != search) {
      _searchQuery = search;
      changed = true;
    }
    
    if (changed) notifyListeners();
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  ChatTabFilter _tabFromString(String? tab) => switch (tab) {
    'direct' => ChatTabFilter.direct,
    'groups' => ChatTabFilter.groups,
    'channels' => ChatTabFilter.channels,
    _ => ChatTabFilter.all,
  };
  
  ChatListFilter _filterFromString(String? filter) => switch (filter) {
    'unread' => ChatListFilter.unread,
    'media' => ChatListFilter.media,
    'archived' => ChatListFilter.archived,
    'muted' => ChatListFilter.muted,
    'pinned' => ChatListFilter.pinned,
    _ => ChatListFilter.all,
  };
  
  /// Smart sorting: Pinned → Unread → Recency
  List<DMThread> _sortConversations(List<DMThread> items) {
    return List.from(items)..sort((a, b) {
      final aPinned = _pinnedChatIds.contains(a.channelId);
      final bPinned = _pinnedChatIds.contains(b.channelId);
      if (aPinned != bPinned) return aPinned ? -1 : 1;
      
      final aUnread = (_unreadCounts[a.channelId] ?? 0) > 0;
      final bUnread = (_unreadCounts[b.channelId] ?? 0) > 0;
      if (aUnread != bUnread) return aUnread ? -1 : 1;
      
      return b.updatedAt.compareTo(a.updatedAt);
    });
  }
  
  List<ChatGroup> _sortGroups(List<ChatGroup> items) {
    return List.from(items)..sort((a, b) {
      final aPinned = _pinnedChatIds.contains(a.id);
      final bPinned = _pinnedChatIds.contains(b.id);
      if (aPinned != bPinned) return aPinned ? -1 : 1;
      
      final aUnread = a.unreadCount > 0;
      final bUnread = b.unreadCount > 0;
      if (aUnread != bUnread) return aUnread ? -1 : 1;
      
      final aTime = a.lastMessageAt ?? a.createdAt;
      final bTime = b.lastMessageAt ?? b.createdAt;
      return bTime.compareTo(aTime);
    });
  }
  
  /// Group channels by type
  Map<ChannelType, List<WorkspaceChannel>> groupChannelsByType(List<WorkspaceChannel> items) {
    final map = {
      ChannelType.ANNOUNCEMENT: <WorkspaceChannel>[],
      ChannelType.GENERAL: <WorkspaceChannel>[],
      ChannelType.ROLE_BASED: <WorkspaceChannel>[],
      ChannelType.TASK_SPECIFIC: <WorkspaceChannel>[],
    };
    for (final c in items) {
      map[c.type]?.add(c);
    }
    for (final k in map.keys) {
      map[k]!.sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
    }
    return map;
  }
  
  /// Get current tab index
  int get tabIndex => _selectedTab.index;
}

/// Model for active chat items in the stories bar
class ActiveChatItem {
  final String id;
  final String name;
  final String? avatarUrl;
  final bool isOnline;
  final bool hasUnread;
  final int unreadCount;
  final String? channelId;
  final bool isGroup;
  
  const ActiveChatItem({
    required this.id,
    required this.name,
    this.avatarUrl,
    this.isOnline = false,
    this.hasUnread = false,
    this.unreadCount = 0,
    this.channelId,
    this.isGroup = false,
  });
}
