import 'package:flutter/foundation.dart';
import '../models/models.dart';
import '../repositories/chat_repository.dart';
import '../utils/result.dart';
import '../utils/result_extensions.dart';
import '../services/logging_service.dart';

/// State of the chat loading process.
enum ChatLoadState {
  initial,
  loading,
  loaded,
  error,
  refreshing,
}

/// Filter options for chat list.
enum ChatFilter {
  all,
  unread,
  pinned,
  muted,
  archived,
}

/// Provider for chat state management using ChangeNotifier.
/// 
/// This centralizes chat state (DMs, groups, unread counts, filters)
/// and notifies listeners when state changes.
/// 
/// Usage:
/// ```dart
/// // In main.dart
/// ChangeNotifierProvider(
///   create: (_) => ChatProvider(SupabaseChatRepository()),
///   child: MyApp(),
/// )
/// 
/// // In widgets
/// final chatProvider = context.watch<ChatProvider>();
/// ```
class ChatProvider extends ChangeNotifier {
  static const _tag = 'ChatProvider';

  final ChatRepository _repository;

  ChatProvider(this._repository);

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════

  ChatLoadState _state = ChatLoadState.initial;
  List<DMThread> _dmThreads = [];
  Map<String, int> _unreadCounts = {};
  Map<String, bool> _muteStatuses = {};
  ChatFilter _activeFilter = ChatFilter.all;
  String _searchQuery = '';
  String? _errorMessage;

  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════════════════

  ChatLoadState get state => _state;
  List<DMThread> get dmThreads => _dmThreads;
  Map<String, int> get unreadCounts => _unreadCounts;
  Map<String, bool> get muteStatuses => _muteStatuses;
  ChatFilter get activeFilter => _activeFilter;
  String get searchQuery => _searchQuery;
  String? get errorMessage => _errorMessage;

  bool get isLoading => _state == ChatLoadState.loading;
  bool get isRefreshing => _state == ChatLoadState.refreshing;
  bool get hasError => _state == ChatLoadState.error;
  bool get hasData => _dmThreads.isNotEmpty;

  /// Total unread count across all chats.
  int get totalUnread => _unreadCounts.values.fold(0, (a, b) => a + b);

  /// Filtered DM threads based on active filter and search.
  List<DMThread> get filteredThreads {
    var threads = _dmThreads;

    // Apply filter
    switch (_activeFilter) {
      case ChatFilter.all:
        break;
      case ChatFilter.unread:
        threads = threads.where((t) {
          final count = _unreadCounts[t.channelId] ?? 0;
          return count > 0;
        }).toList();
      case ChatFilter.pinned:
        threads = threads.where((t) => t.isPinned).toList();
      case ChatFilter.muted:
        threads = threads.where((t) {
          return _muteStatuses[t.channelId] ?? false;
        }).toList();
      case ChatFilter.archived:
        threads = threads.where((t) => t.isArchived).toList();
    }

    // Apply search
    if (_searchQuery.isNotEmpty) {
      final query = _searchQuery.toLowerCase();
      threads = threads.where((t) {
        final name = t.partnerName.toLowerCase();
        final lastMsg = t.lastMessage?.content.toLowerCase() ?? '';
        return name.contains(query) || lastMsg.contains(query);
      }).toList();
    }

    return threads;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Loads chat threads from the repository.
  Future<void> loadChats({bool forceRefresh = false}) async {
    if (_state == ChatLoadState.loading) return;

    _state = forceRefresh ? ChatLoadState.refreshing : ChatLoadState.loading;
    _errorMessage = null;
    notifyListeners();

    final result = await _repository.getDMThreads();

    result.handle(
      onSuccess: (threads) async {
        _dmThreads = threads;
        _state = ChatLoadState.loaded;
        log.info('Loaded ${threads.length} chat threads', tag: _tag);

        // Load unread counts and mute statuses in background
        _loadUnreadCounts();
        _loadMuteStatuses();
      },
      onFailure: (message, error) {
        _errorMessage = message;
        _state = ChatLoadState.error;
        log.error('Failed to load chats: $message', tag: _tag, error: error);
      },
    );

    notifyListeners();
  }

  /// Sets the active filter.
  void setFilter(ChatFilter filter) {
    if (_activeFilter == filter) return;
    _activeFilter = filter;
    log.debug('Chat filter changed to ${filter.name}', tag: _tag);
    notifyListeners();
  }

  /// Sets the search query.
  void setSearchQuery(String query) {
    if (_searchQuery == query) return;
    _searchQuery = query;
    notifyListeners();
  }

  /// Clears the search query.
  void clearSearch() {
    if (_searchQuery.isEmpty) return;
    _searchQuery = '';
    notifyListeners();
  }

  /// Marks a chat as read.
  Future<void> markAsRead(String channelId) async {
    final result = await _repository.updateLastRead(channelId);
    if (result.isSuccess) {
      _unreadCounts[channelId] = 0;
      notifyListeners();
    }
  }

  /// Marks all chats as read.
  Future<void> markAllAsRead() async {
    final channelIds = _dmThreads.map((t) => t.channelId).toList();
    final result = await _repository.markAllAsRead(channelIds);
    if (result.isSuccess) {
      _unreadCounts.clear();
      notifyListeners();
    }
  }

  /// Toggles mute status for a channel.
  Future<void> toggleMute(String channelId) async {
    final isMuted = _muteStatuses[channelId] ?? false;
    
    final result = isMuted
        ? await _repository.unmuteConversation(channelId)
        : await _repository.muteConversation(channelId);

    if (result.isSuccess) {
      _muteStatuses[channelId] = !isMuted;
      notifyListeners();
    }
  }

  /// Handles a new message received event.
  void onNewMessageReceived(String channelId, Message message) {
    // Update last message in thread
    final index = _dmThreads.indexWhere((t) => t.channelId == channelId);
    if (index != -1) {
      final thread = _dmThreads[index];
      _dmThreads[index] = thread.copyWith(
        lastMessage: message,
        updatedAt: message.sentAt,
      );
      
      // Move to top
      final updated = _dmThreads.removeAt(index);
      _dmThreads.insert(0, updated);

      // Increment unread if not from current user
      final currentUserId = _repository.getCurrentUserId();
      if (message.senderId != currentUserId) {
        _unreadCounts[channelId] = (_unreadCounts[channelId] ?? 0) + 1;
      }

      notifyListeners();
    }
  }

  /// Clears all state (e.g., on logout).
  void clearAll() {
    _dmThreads.clear();
    _unreadCounts.clear();
    _muteStatuses.clear();
    _activeFilter = ChatFilter.all;
    _searchQuery = '';
    _state = ChatLoadState.initial;
    _errorMessage = null;
    notifyListeners();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  Future<void> _loadUnreadCounts() async {
    final channelIds = _dmThreads.map((t) => t.channelId).toList();
    if (channelIds.isEmpty) return;

    final result = await _repository.getUnreadCounts(channelIds);
    result.handle(
      onSuccess: (counts) {
        _unreadCounts = counts;
        notifyListeners();
      },
      onFailure: (_, __) {
        log.warning('Failed to load unread counts', tag: _tag);
      },
    );
  }

  Future<void> _loadMuteStatuses() async {
    final channelIds = _dmThreads.map((t) => t.channelId).toList();
    if (channelIds.isEmpty) return;

    final result = await _repository.getMuteStatuses(channelIds);
    result.handle(
      onSuccess: (statuses) {
        _muteStatuses = statuses;
        notifyListeners();
      },
      onFailure: (_, __) {
        log.warning('Failed to load mute statuses', tag: _tag);
      },
    );
  }
}
