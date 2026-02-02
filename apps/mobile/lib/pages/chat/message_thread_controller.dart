import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/models/chat_group.dart';
import 'package:thittam1hub/services/chat_service.dart';
import 'package:thittam1hub/services/group_chat_service.dart';
import 'package:thittam1hub/services/chat_offline_service.dart';
import 'package:thittam1hub/services/connectivity_service.dart';
import 'package:thittam1hub/services/link_preview_service.dart';
import 'package:thittam1hub/services/chat_security_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/services/logging_mixin.dart';

/// Controller for MessageThreadPage - handles all business logic
/// Reduces the page to UI-only by extracting state and operations
class MessageThreadController extends ChangeNotifier with LoggingMixin {
  @override
  String get logTag => 'MessageThreadController';

  final String channelId;
  final String? groupId;
  final WorkspaceChannel? channel;
  final ChatGroup? group;

  // Dependencies
  final GroupChatService _groupService;
  final ChatOfflineService _offlineService;
  final LinkPreviewService _linkPreviewService;

  // State
  bool _sending = false;
  bool _showAttachments = false;
  
  // Typing state
  final Map<String, DateTime> _typingUsers = {};
  Timer? _typingCleanup;
  Timer? _typingDebounce;

  // Reactions and read receipts
  Map<String, List<Map<String, dynamic>>> _reactions = {};
  Map<String, List<String>> _readReceipts = {};
  final Set<String> _loadedMessageIds = {};

  // Group member roles
  Map<String, ChatGroupMember> _memberRoles = {};

  // Enhanced features
  List<Message> _pinnedMessages = [];
  Set<String> _starredMessageIds = {};
  Map<String, LinkPreview?> _linkPreviews = {};

  // Offline support
  List<PendingMessage> _pendingMessages = [];

  // Subscriptions
  StreamSubscription? _reactionSubscription;
  StreamSubscription? _memberRolesSubscription;

  MessageThreadController({
    required this.channelId,
    this.groupId,
    this.channel,
    this.group,
    GroupChatService? groupService,
    ChatOfflineService? offlineService,
    LinkPreviewService? linkPreviewService,
  })  : _groupService = groupService ?? GroupChatService(),
        _offlineService = offlineService ?? ChatOfflineService.instance,
        _linkPreviewService = linkPreviewService ?? LinkPreviewService() {
    _initialize();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════════════════

  bool get isGroup => groupId != null;
  bool get sending => _sending;
  bool get showAttachments => _showAttachments;
  
  // Group state for permission checking
  ChatGroup? _currentGroup;
  ChatGroup? get currentGroup => _currentGroup;

  /// Check if current user can send messages in this chat
  /// Returns false if group has onlyAdminsCanSend=true and user is not admin/owner
  bool get canSendMessages {
    if (!isGroup || _currentGroup == null) return true;
    if (!_currentGroup!.onlyAdminsCanSend) return true;
    
    final userId = currentUserId;
    if (userId == null) return false;
    
    final membership = _memberRoles[userId];
    if (membership == null) return false;
    
    return membership.role == GroupMemberRole.owner || 
           membership.role == GroupMemberRole.admin;
  }
  Map<String, DateTime> get typingUsers => Map.unmodifiable(_typingUsers);
  Map<String, List<Map<String, dynamic>>> get reactions => Map.unmodifiable(_reactions);
  Map<String, List<String>> get readReceipts => Map.unmodifiable(_readReceipts);
  Map<String, ChatGroupMember> get memberRoles => Map.unmodifiable(_memberRoles);
  List<Message> get pinnedMessages => List.unmodifiable(_pinnedMessages);
  Set<String> get starredMessageIds => Set.unmodifiable(_starredMessageIds);
  Map<String, LinkPreview?> get linkPreviews => Map.unmodifiable(_linkPreviews);
  List<PendingMessage> get pendingMessages => List.unmodifiable(_pendingMessages);

  String? get currentUserId => SupabaseConfig.auth.currentUser?.id;
  String get currentUserName => SupabaseConfig.auth.currentUser?.email?.split('@').first ?? 'User';

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  void _initialize() {
    _subscribeTyping();
    _subscribeToReactions();
    _loadPinnedMessages();
    _loadStarredMessages();

    if (isGroup) {
      _loadMemberRoles();
      _loadGroupDetails();
    }

    // Mark channel as read
    ChatService.updateLastRead(channelId);
    if (isGroup && groupId != null) {
      _groupService.markAsRead(groupId!);
    }

    // Listen for pending message changes
    _offlineService.addListener(_onPendingMessagesChanged);
    _loadPendingMessages();
  }

  void _onPendingMessagesChanged() {
    _loadPendingMessages();
  }

  void _loadPendingMessages() {
    _pendingMessages = _offlineService.getPendingMessages(channelId);
    notifyListeners();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MESSAGE OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  Stream<List<Message>> get messageStream => ChatService.streamMessages(channelId);

  Future<SendResult> sendMessage(String content) async {
    if (content.trim().isEmpty) return SendResult.empty;

    HapticFeedback.lightImpact();
    _sending = true;
    notifyListeners();

    try {
      ChatResult result;

      if (isGroup && groupId != null) {
        result = await _offlineService.sendGroupMessage(
          groupId: groupId!,
          content: content.trim(),
        );
      } else {
        result = await _offlineService.sendMessage(
          channelId: channelId,
          content: content.trim(),
        );
      }

      _sending = false;
      notifyListeners();

      if (result.isQueued) {
        return SendResult.queued(
          isOnline: ConnectivityService.instance.isOnline,
        );
      }
      return SendResult.success;
    } catch (e) {
      logError('Send message error: $e');
      _sending = false;
      notifyListeners();
      return SendResult.failed(content);
    }
  }

  Future<void> sendGif(String gifUrl) async {
    _sending = true;
    notifyListeners();

    try {
      await ChatService.sendMessage(
        channelId: channelId,
        content: gifUrl,
      );
    } finally {
      _sending = false;
      notifyListeners();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPING INDICATORS
  // ═══════════════════════════════════════════════════════════════════════════

  void _subscribeTyping() {
    final channel = ChatService.typingChannel(channelId);
    channel.onBroadcast(
      event: 'typing',
      callback: (payload) {
        final data = payload['payload'] as Map<String, dynamic>?;
        if (data == null) return;

        final userId = data['userId'] as String?;
        final name = data['name'] as String?;
        final me = currentUserId;

        if (userId != null && userId != me && name != null) {
          _typingUsers[name] = DateTime.now();
          notifyListeners();
          _scheduleTypingCleanup();
        }
      },
    ).subscribe();
  }

  void _scheduleTypingCleanup() {
    _typingCleanup?.cancel();
    _typingCleanup = Timer.periodic(const Duration(seconds: 2), (_) {
      final now = DateTime.now();
      _typingUsers.removeWhere((_, ts) => now.difference(ts).inSeconds > 3);
      notifyListeners();
    });
  }

  void onTyping() {
    _typingDebounce?.cancel();
    _typingDebounce = Timer(const Duration(milliseconds: 500), () async {
      try {
        final user = SupabaseConfig.auth.currentUser;
        if (user != null) {
          await ChatService.sendTyping(channelId, name: currentUserName, userId: user.id);
        }
      } catch (e) {
        logError('Typing broadcast error: $e');
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  void _subscribeToReactions() {
    _reactionSubscription?.cancel();
    _reactionSubscription = ChatService.streamReactions(channelId).listen((reactions) {
      final Map<String, List<Map<String, dynamic>>> grouped = {};
      for (final r in reactions) {
        final msgId = r['message_id'] as String?;
        if (msgId != null) {
          grouped.putIfAbsent(msgId, () => []).add(r);
        }
      }
      _reactions = grouped;
      notifyListeners();
    });
  }

  Future<void> toggleReaction(String messageId, String emoji) async {
    HapticFeedback.mediumImpact();

    final me = currentUserId;
    final reactions = _reactions[messageId] ?? [];
    final alreadyReacted = reactions.any((r) =>
        r['user_id'] == me && r['emoji'] == emoji);

    if (alreadyReacted) {
      await _offlineService.removeReaction(messageId: messageId, emoji: emoji);
    } else {
      await _offlineService.addReaction(messageId: messageId, emoji: emoji);
    }
  }

  Future<void> loadReactionsAndReceipts(List<Message> messages) async {
    if (messages.isEmpty) return;

    final me = currentUserId;
    if (me == null) return;

    // Only load for new messages
    final newIds = messages
        .map((m) => m.id)
        .where((id) => !_loadedMessageIds.contains(id))
        .toList();
    if (newIds.isEmpty) return;

    _loadedMessageIds.addAll(newIds);

    try {
      // Batch load reactions
      final reactions = await ChatService.getReactionsForMessages(newIds);

      // Batch load read receipts for own messages
      final ownMessageIds = messages
          .where((m) => m.senderId == me)
          .map((m) => m.id)
          .toList();
      final receipts = await ChatService.getReadReceipts(ownMessageIds);

      _reactions.addAll(reactions);
      _readReceipts.addAll(receipts);
      notifyListeners();
    } catch (e) {
      logError('loadReactionsAndReceipts error: $e');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PINNED & STARRED MESSAGES
  // ═══════════════════════════════════════════════════════════════════════════

  Future<void> _loadPinnedMessages() async {
    try {
      final pinned = await ChatService.getPinnedMessages(channelId);
      _pinnedMessages = pinned;
      notifyListeners();
    } catch (e) {
      logError('Failed to load pinned messages: $e');
    }
  }

  Future<void> _loadStarredMessages() async {
    try {
      final starredIds = await ChatService.getStarredMessageIds();
      _starredMessageIds = starredIds;
      notifyListeners();
    } catch (e) {
      logError('Failed to load starred messages: $e');
    }
  }

  Future<bool> pinMessage(String messageId) async {
    try {
      await ChatService.pinMessage(channelId, messageId);
      await _loadPinnedMessages();
      return true;
    } catch (e) {
      logError('Failed to pin message: $e');
      return false;
    }
  }

  Future<bool> unpinMessage(String messageId) async {
    try {
      await ChatService.unpinMessage(channelId, messageId);
      await _loadPinnedMessages();
      return true;
    } catch (e) {
      logError('Failed to unpin message: $e');
      return false;
    }
  }

  Future<bool> starMessage(String messageId) async {
    // Optimistic update
    _starredMessageIds.add(messageId);
    notifyListeners();
    
    try {
      await ChatService.starMessage(messageId);
      return true;
    } catch (e) {
      // Rollback on failure
      _starredMessageIds.remove(messageId);
      notifyListeners();
      logError('Failed to star message: $e');
      return false;
    }
  }

  Future<bool> unstarMessage(String messageId) async {
    // Optimistic update
    _starredMessageIds.remove(messageId);
    notifyListeners();
    
    try {
      await ChatService.unstarMessage(messageId);
      return true;
    } catch (e) {
      // Rollback on failure
      _starredMessageIds.add(messageId);
      notifyListeners();
      logError('Failed to unstar message: $e');
      return false;
    }
  }

  bool isMessagePinned(String messageId) =>
      _pinnedMessages.any((m) => m.id == messageId);

  bool isMessageStarred(String messageId) =>
      _starredMessageIds.contains(messageId);

  // ═══════════════════════════════════════════════════════════════════════════
  // MESSAGE DELETION
  // ═══════════════════════════════════════════════════════════════════════════

  Future<bool> deleteMessageForMe(String messageId) async {
    try {
      final result = await ChatSecurityService.instance.deleteMessageForMe(messageId);
      return result.isSuccess;
    } catch (e) {
      logError('Failed to delete message: $e');
      return false;
    }
  }

  Future<DeleteResult> deleteMessageForEveryone(String messageId) async {
    try {
      final result =
          await ChatSecurityService.instance.deleteMessageForEveryone(messageId);
      final success = result.isSuccess ? result.data : false;
      return success ? DeleteResult.success : DeleteResult.tooOld;
    } catch (e) {
      logError('Failed to delete message for everyone: $e');
      return DeleteResult.failed;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LINK PREVIEWS
  // ═══════════════════════════════════════════════════════════════════════════

  Future<void> extractLinkPreviews(List<Message> messages) async {
    final urlRegex = RegExp(r'https?://[^\s]+');

    for (final message in messages) {
      if (_linkPreviews.containsKey(message.id)) continue;

      final match = urlRegex.firstMatch(message.content);
      if (match != null) {
        final url = match.group(0)!;
        // Skip GIF URLs
        if (url.contains('giphy.com') || url.endsWith('.gif')) continue;

        final preview = await _linkPreviewService.extractPreview(url);
        if (preview != null && preview.hasContent) {
          _linkPreviews[message.id] = preview;
          notifyListeners();
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP MEMBER ROLES
  // ═══════════════════════════════════════════════════════════════════════════

  Future<void> _loadMemberRoles() async {
    if (groupId == null) return;

    try {
      final membersResult = await _groupService.getGroupMembers(groupId!);
      final members = membersResult.isSuccess
          ? membersResult.data
          : <ChatGroupMember>[];

      _memberRoles = {for (final m in members) m.userId: m};
      notifyListeners();

      // Subscribe to real-time updates
      _memberRolesSubscription?.cancel();
      _memberRolesSubscription =
          _groupService.streamGroupMembers(groupId!).listen((members) {
        _memberRoles = {for (final m in members) m.userId: m};
        notifyListeners();
      });
    } catch (e) {
      logError('Failed to load member roles: $e');
    }
  }

  Future<void> _loadGroupDetails() async {
    if (groupId == null) return;

    try {
      final result = await _groupService.getGroupById(groupId!);
      if (result.isSuccess) {
        _currentGroup = result.data;
        notifyListeners();
      }
    } catch (e) {
      logError('Failed to load group details: $e');
    }
  }

  String? getMemberRole(String senderId) => _memberRoles[senderId]?.role.displayName;

  // ═══════════════════════════════════════════════════════════════════════════
  // UI STATE
  // ═══════════════════════════════════════════════════════════════════════════

  void toggleAttachments() {
    _showAttachments = !_showAttachments;
    notifyListeners();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PENDING MESSAGE OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  void retryPendingMessage(String messageId) {
    _offlineService.retryMessage(messageId);
  }

  void cancelPendingMessage(String messageId) {
    _offlineService.cancelMessage(messageId);
  }

  /// Alias for retryPendingMessage for UI compatibility
  void retryMessage(String messageId) => retryPendingMessage(messageId);

  /// Alias for cancelPendingMessage for UI compatibility
  void cancelMessage(String messageId) => cancelPendingMessage(messageId);

  // ═══════════════════════════════════════════════════════════════════════════
  // MESSAGE LIST BUILDING
  // ═══════════════════════════════════════════════════════════════════════════

  /// Combines real messages with pending messages and adds date separators
  List<dynamic> buildMessageList(List<Message> messages) {
    final List<dynamic> result = [];

    // Add real messages with date separators
    for (int i = 0; i < messages.length; i++) {
      if (i > 0) {
        final gap = messages[i].sentAt.difference(messages[i - 1].sentAt).inMinutes;
        if (gap > 5) {
          result.add(DateSeparator(messages[i].sentAt));
        }
      }
      result.add(messages[i]);
    }

    // Add pending messages at the end
    for (final pending in _pendingMessages) {
      result.add(pending);
    }

    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  void dispose() {
    _typingCleanup?.cancel();
    _typingDebounce?.cancel();
    _reactionSubscription?.cancel();
    _memberRolesSubscription?.cancel();
    _offlineService.removeListener(_onPendingMessagesChanged);
    super.dispose();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RESULT TYPES
// ═══════════════════════════════════════════════════════════════════════════

/// Result of a send operation
sealed class SendResult {
  const SendResult();

  static const SendResult success = SendSuccess();
  static const SendResult empty = SendEmpty();

  factory SendResult.queued({required bool isOnline}) = SendQueued;
  factory SendResult.failed(String content) = SendFailed;
}

class SendSuccess extends SendResult {
  const SendSuccess();
}

class SendEmpty extends SendResult {
  const SendEmpty();
}

class SendQueued extends SendResult {
  final bool isOnline;
  const SendQueued({required this.isOnline});
}

class SendFailed extends SendResult {
  final String content;
  const SendFailed(this.content);
}

/// Result of delete for everyone operation
enum DeleteResult { success, tooOld, failed }

/// Date separator marker for message list
class DateSeparator {
  final DateTime date;
  const DateSeparator(this.date);
}
