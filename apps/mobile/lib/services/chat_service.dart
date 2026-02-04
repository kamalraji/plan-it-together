import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/services/logging_service.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/services/pagination_mixin.dart';
import 'package:thittam1hub/utils/result.dart';

// Domain-focused services
import 'package:thittam1hub/services/chat/chat_message_service.dart';
import 'package:thittam1hub/services/chat/chat_presence_service.dart';
import 'package:thittam1hub/services/chat/chat_moderation_service.dart';

/// Chat service facade providing a unified API for all chat operations.
/// 
/// This is the primary entry point for chat functionality, delegating to
/// domain-focused services:
/// - [ChatMessageService] - Messages, reactions, read receipts, unread counts
/// - [ChatPresenceService] - Online status, typing, heartbeat
/// - [ChatModerationService] - Blocking, muting, pinned/starred messages
/// 
/// Static methods are preserved for backward compatibility but delegate
/// to the underlying domain services.
/// 
/// Uses cursor-based pagination for scalable channel and message fetching.
class ChatService extends BaseService with CachingServiceMixin, PaginationMixin {
  static ChatService? _instance;
  static ChatService get instance => _instance ??= ChatService._();
  ChatService._();
  
  @override
  String get tag => 'ChatService';

  // Domain service delegates
  final ChatMessageService _messageService = ChatMessageService.instance;
  final ChatPresenceService _presenceService = ChatPresenceService.instance;
  final ChatModerationService _moderationService = ChatModerationService.instance;

  // Expose domain services for direct access when needed
  ChatMessageService get messages => _messageService;
  ChatPresenceService get presence => _presenceService;
  ChatModerationService get moderation => _moderationService;

  static const String channelsTable = 'workspace_channels';
  static const String messagesTable = 'messages';
  static const String profilesTable = 'user_profiles';

  SupabaseClient get _client => SupabaseConfig.client;

  // ============================================================
  // LEGACY STATIC API (delegates to domain services via facade)
  // ============================================================

  /// Get current user ID (convenience getter for sync service)
  static String? getCurrentUserId() => SupabaseConfig.auth.currentUser?.id;

  // Fetch channels for current user (legacy static)
  static Future<List<WorkspaceChannel>> getMyChannels({String? workspaceId}) =>
      instance.fetchMyChannels(workspaceId: workspaceId);

  // Batch fetch last message for channels (legacy static)
  static Future<Map<String, Message?>> getLastMessages(List<String> channelIds) =>
      instance._messageService.fetchLastMessages(channelIds);

  // Fetch DM threads (legacy static)
  static Future<List<DMThread>> getMyDMThreads({int limit = 200}) =>
      instance.fetchMyDMThreads(limit: limit);

  // Search participants (legacy static)
  static Future<List<UserProfile>> searchParticipants(String query, {int limit = 50}) =>
      instance.searchUsers(query, limit: limit);

  // Stream messages (legacy static)
  static Stream<List<Message>> streamMessages(String channelId) =>
      instance._messageService.getMessagesStream(channelId);

  // Send message (legacy static)
  static Future<Message?> sendMessage({
    required String channelId,
    required String content,
    List<MessageAttachment> attachments = const [],
  }) async {
    final result = await instance._messageService.createMessage(
      channelId: channelId,
      content: content,
      attachments: attachments,
    );
    return result is Success<Message> ? result.data : null;
  }

  // Typing channel (legacy static)
  static RealtimeChannel typingChannel(String channelId) =>
      instance._presenceService.typingChannel(channelId);

  // Send typing indicator (legacy static)
  static Future<void> sendTyping(String channelId, {required String name, required String userId}) =>
      instance._presenceService.broadcastTyping(channelId, name: name, userId: userId);

  // Reactions (legacy static)
  static Future<void> addReaction(String messageId, String emoji) =>
      instance._messageService.insertReaction(messageId, emoji);

  static Future<void> removeReaction(String messageId, String emoji) =>
      instance._messageService.deleteReaction(messageId, emoji);

  static Stream<List<Map<String, dynamic>>> streamReactions(String channelId) =>
      instance._messageService.getReactionsStream(channelId);

  // Read receipts (legacy static)
  static Future<void> markAsRead(String messageId) =>
      instance._messageService.markMessageAsRead(messageId);

  static Future<Map<String, List<String>>> getReadReceipts(List<String> messageIds) =>
      instance._messageService.fetchReadReceipts(messageIds);

  // Unread counts (legacy static)
  static Future<int> getUnreadCount(String channelId) =>
      instance._messageService.fetchUnreadCount(channelId);

  static Future<Map<String, int>> getUnreadCounts(List<String> channelIds) =>
      instance._messageService.fetchUnreadCounts(channelIds);

  static Future<void> updateLastRead(String channelId) =>
      instance._messageService.updateChannelLastRead(channelId);

  static Future<void> markAllAsRead(List<String> channelIds) =>
      instance._messageService.markChannelsAsRead(channelIds);

  static Future<Map<String, List<Map<String, dynamic>>>> getReactionsForMessages(List<String> messageIds) =>
      instance._messageService.fetchReactionsForMessages(messageIds);

  // Presence (legacy static)
  static Future<void> setOnlineStatus(bool isOnline) =>
      instance._presenceService.updateOnlineStatus(isOnline);

  static Future<void> updateHeartbeat() =>
      instance._presenceService.refreshHeartbeat();

  static Stream<bool> streamUserOnlineStatus(String userId) =>
      instance._presenceService.getUserOnlineStream(userId);

  static Future<DateTime?> getLastSeen(String userId) =>
      instance._presenceService.fetchLastSeen(userId);

  static Future<bool> isUserOnline(String userId) =>
      instance._presenceService.checkUserOnline(userId);

  // Message management (legacy static)
  static Future<bool> deleteMessage(String messageId) async {
    final result = await instance._messageService.removeMessage(messageId);
    return result is Success;
  }

  static Future<Message?> editMessage(String messageId, String newContent) async {
    final result = await instance._messageService.updateMessage(messageId, newContent);
    return result is Success<Message> ? result.data : null;
  }

  static Future<Message?> sendImageMessage({
    required String channelId,
    required String imagePath,
    String? caption,
  }) async {
    final result = await instance._messageService.createImageMessage(
      channelId: channelId,
      imagePath: imagePath,
      caption: caption,
    );
    return result is Success<Message> ? result.data : null;
  }

  // Blocking (legacy static)
  static Future<void> blockUser(String targetUserId) =>
      instance._moderationService.blockUserById(targetUserId);

  static Future<void> unblockUser(String targetUserId) =>
      instance._moderationService.unblockUserById(targetUserId);

  static Future<bool> isUserBlocked(String targetUserId) =>
      instance._moderationService.checkUserBlocked(targetUserId);

  static Future<List<String>> getBlockedUserIds() =>
      instance._moderationService.fetchBlockedUserIds();

  // Muting (legacy static)
  static Future<void> muteConversation(String channelId, {Duration? duration}) =>
      instance._moderationService.muteChannel(channelId, duration: duration);

  static Future<void> unmuteConversation(String channelId) =>
      instance._moderationService.unmuteChannel(channelId);

  static Future<bool> isConversationMuted(String channelId) =>
      instance._moderationService.checkChannelMuted(channelId);

  static Future<Map<String, bool>> getMuteStatuses(List<String> channelIds) =>
      instance._moderationService.fetchMuteStatuses(channelIds);

  // Search (legacy static)
  static Future<List<Message>> searchMessages({
    required String channelId,
    required String query,
    String filter = 'all',
  }) => instance._messageService.searchChannelMessages(channelId: channelId, query: query, filter: filter);

  static Future<Message?> getMessageById(String messageId) async {
    final result = await instance._messageService.fetchMessageById(messageId);
    return result is Success<Message?> ? result.data : null;
  }

  static Future<Message?> forwardMessage(String messageId, String toChannelId) async {
    final result = await instance._messageService.forwardMessageToChannel(messageId, toChannelId);
    return result is Success<Message> ? result.data : null;
  }

  static Future<void> clearChatHistory(String channelId) =>
      instance._messageService.clearChannelHistory(channelId);

  // Pinned messages (legacy static)
  static Future<void> pinMessage(String channelId, String messageId) =>
      instance._moderationService.pinChannelMessage(channelId, messageId);

  static Future<void> unpinMessage(String channelId, String messageId) =>
      instance._moderationService.unpinChannelMessage(channelId, messageId);

  static Future<List<Message>> getPinnedMessages(String channelId) =>
      instance._moderationService.fetchPinnedMessages(channelId);

  static Future<bool> isMessagePinned(String channelId, String messageId) =>
      instance._moderationService.checkMessagePinned(channelId, messageId);

  // Starred messages (legacy static)
  static Future<void> starMessage(String messageId) =>
      instance._moderationService.starMessageById(messageId);

  static Future<void> unstarMessage(String messageId) =>
      instance._moderationService.unstarMessageById(messageId);

  static Future<List<Message>> getStarredMessages() =>
      instance._moderationService.fetchStarredMessages();

  static Future<bool> isMessageStarred(String messageId) =>
      instance._moderationService.checkMessageStarred(messageId);

  static Future<Set<String>> getStarredMessageIds() =>
      instance._moderationService.fetchStarredMessageIds();

  // Pinned & archived chats (legacy static)
  static Future<void> pinChat(String channelId) =>
      instance._moderationService.pinChannelChat(channelId);

  static Future<void> unpinChat(String channelId) =>
      instance._moderationService.unpinChannelChat(channelId);

  static Future<Set<String>> getPinnedChatIds() =>
      instance._moderationService.fetchPinnedChatIds();

  static Future<void> archiveChat(String channelId) =>
      instance._moderationService.archiveChannelChat(channelId);

  static Future<void> unarchiveChat(String channelId) =>
      instance._moderationService.unarchiveChannelChat(channelId);

  static Future<Set<String>> getArchivedChatIds() =>
      instance._moderationService.fetchArchivedChatIds();

  /// Deterministic DM channel id for two users
  static String dmChannelIdFor(String a, String b) {
    final ids = [a, b]..sort();
    return 'dm:${ids[0]}:${ids[1]}';
  }

  // ============================================================
  // INSTANCE METHODS (kept for channels/DM/user search)
  // ============================================================

  /// Fetch channels for current user with pagination.
  /// 
  /// Uses batched fetching for better performance at scale.
  Future<List<WorkspaceChannel>> fetchMyChannels({
    String? workspaceId,
    int pageSize = 100,
  }) async {
    final result = await execute(() async {
      final uid = SupabaseConfig.auth.currentUser?.id;
      if (uid == null) return <WorkspaceChannel>[];

      // Use reasonable limit instead of 500
      final effectivePageSize = normalizePageSize(pageSize);
      
      dynamic query = _client.from(channelsTable).select();
      if (workspaceId != null) {
        query = query.eq('workspace_id', workspaceId);
      }
      query = query.order('name').limit(effectivePageSize);

      final List<dynamic> rows = await query;
      final all = rows.map((e) => WorkspaceChannel.fromJson(Map<String, dynamic>.from(e as Map))).toList();

      final filtered = all.where((c) {
        try {
          if (c.members.isEmpty) return !c.isPrivate;
          return c.members.contains(uid);
        } catch (_) {
          return !c.isPrivate;
        }
      }).toList();

      logDbOperation('SELECT', channelsTable, rowCount: filtered.length);
      return filtered;
    }, operationName: 'fetchMyChannels');

    return result is Success<List<WorkspaceChannel>> ? result.data : [];
  }

  /// Fetch recent DM threads for current user
  Future<List<DMThread>> fetchMyDMThreads({int limit = 200}) async {
    final result = await execute(() async {
      final me = SupabaseConfig.auth.currentUser?.id;
      if (me == null) return <DMThread>[];

      final rows = await _client
          .from(messagesTable)
          .select('channel_id, sender_id, sender_name, sender_avatar, content, sent_at')
          .ilike('channel_id', 'dm:%')
          .ilike('channel_id', '%$me%')
          .order('sent_at', ascending: false)
          .limit(limit);

      final Map<String, Message> latest = {};
      for (final r in rows) {
        final map = Map<String, dynamic>.from(r as Map);
        final msg = Message.fromJson(map);
        latest.putIfAbsent(msg.channelId, () => msg);
      }

      final Map<String, String> partnerByChannel = {};
      for (final chId in latest.keys) {
        final parts = chId.split(':');
        if (parts.length == 3) {
          final id1 = parts[1];
          final id2 = parts[2];
          partnerByChannel[chId] = id1 == me ? id2 : id1;
        }
      }
      final partnerIds = partnerByChannel.values.toSet().toList();

      Map<String, Map<String, dynamic>> profileMap = {};
      if (partnerIds.isNotEmpty) {
        final profs = await _client
            .from(profilesTable)
            .select('id, full_name, avatar_url, email')
            .inFilter('id', partnerIds);
        for (final p in profs) {
          final m = Map<String, dynamic>.from(p as Map);
          profileMap[m['id'] as String] = m;
        }
      }

      final threads = <DMThread>[];
      for (final entry in latest.entries) {
        final chId = entry.key;
        final msg = entry.value;
        final partnerId = partnerByChannel[chId];
        if (partnerId == null) continue;
        final prof = profileMap[partnerId];
        final name = (prof?['full_name'] as String?)?.trim().isNotEmpty == true
            ? prof!['full_name'] as String
            : (prof?['email'] as String? ?? 'User');
        final avatar = prof?['avatar_url'] as String?;
        threads.add(DMThread(
          channelId: chId,
          partnerUserId: partnerId,
          partnerName: name,
          partnerAvatar: avatar,
          lastMessage: msg,
          updatedAt: msg.sentAt,
        ));
      }
      threads.sort((a, b) => b.updatedAt.compareTo(a.updatedAt));

      logDbOperation('SELECT', messagesTable, rowCount: threads.length);
      return threads;
    }, operationName: 'fetchMyDMThreads');

    return result is Success<List<DMThread>> ? result.data : [];
  }

  /// Search users to start a DM
  Future<List<UserProfile>> searchUsers(String query, {int limit = 50}) async {
    final result = await execute(() async {
      final me = SupabaseConfig.auth.currentUser?.id;
      final rows = await _client
          .from(profilesTable)
          .select('id, email, full_name, avatar_url, bio, organization, phone, website, linkedin_url, twitter_url, github_url, qr_code, portfolio_is_public, portfolio_layout, portfolio_accent_color, portfolio_sections, created_at, updated_at')
          .order('full_name')
          .limit(200);
      final users = rows.map((e) => UserProfile.fromJson(Map<String, dynamic>.from(e as Map))).toList();
      final trimmed = query.trim().toLowerCase();
      final filtered = trimmed.isEmpty
          ? users
          : users.where((u) {
              final name = (u.fullName ?? '').toLowerCase();
              final email = (u.email).toLowerCase();
              return name.contains(trimmed) || email.contains(trimmed);
            }).toList();
      return filtered.where((u) => u.id != me).take(limit).toList();
    }, operationName: 'searchUsers');

    return result is Success<List<UserProfile>> ? result.data : [];
  }

  /// Search users with cursor-based pagination for scalability.
  /// 
  /// Industrial best practice: Cursor pagination scales better than offset
  /// for large user bases (10,000+ users).
  Future<PaginatedResult<UserProfile>> searchUsersPaginated({
    required String query,
    String? cursor,
    int pageSize = 50,
  }) async {
    final result = await execute(() async {
      final me = SupabaseConfig.auth.currentUser?.id;
      final effectivePageSize = normalizePageSize(pageSize);
      
      var queryBuilder = _client
          .from(profilesTable)
          .select('id, email, full_name, avatar_url, bio, created_at, updated_at');
      
      if (cursor != null) {
        queryBuilder = queryBuilder.lt('created_at', cursor);
      }
      
      final rows = await queryBuilder
          .neq('id', me ?? '')
          .order('created_at', ascending: false)
          .limit(effectivePageSize + 1);
      
      final users = rows.map((e) => UserProfile.fromJson(
        Map<String, dynamic>.from(e as Map)
      )).toList();
      
      // Client-side filter by query
      final trimmed = query.trim().toLowerCase();
      final filtered = trimmed.isEmpty ? users : users.where((u) {
        final name = (u.fullName ?? '').toLowerCase();
        final email = (u.email).toLowerCase();
        return name.contains(trimmed) || email.contains(trimmed);
      }).toList();
      
      logDbOperation('SELECT', profilesTable, rowCount: filtered.length);
      
      return filtered.toPaginatedResult(
        pageSize: effectivePageSize,
        getCursor: (user) => user.createdAt?.toIso8601String(),
      );
    }, operationName: 'searchUsersPaginated');

    return result is Success<PaginatedResult<UserProfile>> 
        ? result.data 
        : PaginatedResult.empty();
  }

  // ============================================================
  // DEPRECATED INSTANCE METHODS (delegate to domain services)
  // Kept for backward compatibility - prefer using domain services directly
  // ============================================================

  @Deprecated('Use ChatMessageService.instance.getMessagesStream()')
  Stream<List<Message>> getMessagesStream(String channelId) =>
      _messageService.getMessagesStream(channelId);

  @Deprecated('Use ChatMessageService.instance.createMessage()')
  Future<Result<Message>> createMessage({
    required String channelId,
    required String content,
    List<MessageAttachment> attachments = const [],
  }) => _messageService.createMessage(channelId: channelId, content: content, attachments: attachments);

  @Deprecated('Use ChatPresenceService.instance.broadcastTyping()')
  Future<void> broadcastTyping(String channelId, {required String name, required String userId}) =>
      _presenceService.broadcastTyping(channelId, name: name, userId: userId);

  @Deprecated('Use ChatMessageService.instance.insertReaction()')
  Future<void> insertReaction(String messageId, String emoji) =>
      _messageService.insertReaction(messageId, emoji);

  @Deprecated('Use ChatMessageService.instance.deleteReaction()')
  Future<void> deleteReaction(String messageId, String emoji) =>
      _messageService.deleteReaction(messageId, emoji);

  @Deprecated('Use ChatMessageService.instance.getReactionsStream()')
  Stream<List<Map<String, dynamic>>> getReactionsStream(String channelId) =>
      _messageService.getReactionsStream(channelId);

  @Deprecated('Use ChatMessageService.instance.markMessageAsRead()')
  Future<void> markMessageAsRead(String messageId) =>
      _messageService.markMessageAsRead(messageId);

  @Deprecated('Use ChatMessageService.instance.fetchReadReceipts()')
  Future<Map<String, List<String>>> fetchReadReceipts(List<String> messageIds) =>
      _messageService.fetchReadReceipts(messageIds);

  @Deprecated('Use ChatMessageService.instance.fetchUnreadCount()')
  Future<int> fetchUnreadCount(String channelId) =>
      _messageService.fetchUnreadCount(channelId);

  @Deprecated('Use ChatMessageService.instance.fetchUnreadCounts()')
  Future<Map<String, int>> fetchUnreadCounts(List<String> channelIds) =>
      _messageService.fetchUnreadCounts(channelIds);

  @Deprecated('Use ChatMessageService.instance.updateChannelLastRead()')
  Future<void> updateChannelLastRead(String channelId) =>
      _messageService.updateChannelLastRead(channelId);

  @Deprecated('Use ChatMessageService.instance.markChannelsAsRead()')
  Future<void> markChannelsAsRead(List<String> channelIds) =>
      _messageService.markChannelsAsRead(channelIds);

  @Deprecated('Use ChatMessageService.instance.fetchReactionsForMessages()')
  Future<Map<String, List<Map<String, dynamic>>>> fetchReactionsForMessages(List<String> messageIds) =>
      _messageService.fetchReactionsForMessages(messageIds);

  @Deprecated('Use ChatPresenceService.instance.updateOnlineStatus()')
  Future<void> updateOnlineStatus(bool isOnline) =>
      _presenceService.updateOnlineStatus(isOnline);

  @Deprecated('Use ChatPresenceService.instance.refreshHeartbeat()')
  Future<void> refreshHeartbeat() =>
      _presenceService.refreshHeartbeat();

  @Deprecated('Use ChatPresenceService.instance.getUserOnlineStream()')
  Stream<bool> getUserOnlineStream(String userId) =>
      _presenceService.getUserOnlineStream(userId);

  @Deprecated('Use ChatPresenceService.instance.fetchLastSeen()')
  Future<DateTime?> fetchLastSeen(String userId) =>
      _presenceService.fetchLastSeen(userId);

  @Deprecated('Use ChatPresenceService.instance.checkUserOnline()')
  Future<bool> checkUserOnline(String userId) =>
      _presenceService.checkUserOnline(userId);

  @Deprecated('Use ChatMessageService.instance.removeMessage()')
  Future<Result<void>> removeMessage(String messageId) =>
      _messageService.removeMessage(messageId);

  @Deprecated('Use ChatMessageService.instance.updateMessage()')
  Future<Result<Message>> updateMessage(String messageId, String newContent) =>
      _messageService.updateMessage(messageId, newContent);

  @Deprecated('Use ChatMessageService.instance.createImageMessage()')
  Future<Result<Message>> createImageMessage({
    required String channelId,
    required String imagePath,
    String? caption,
  }) => _messageService.createImageMessage(channelId: channelId, imagePath: imagePath, caption: caption);

  @Deprecated('Use ChatModerationService.instance.blockUserById()')
  Future<void> blockUserById(String targetUserId) =>
      _moderationService.blockUserById(targetUserId);

  @Deprecated('Use ChatModerationService.instance.unblockUserById()')
  Future<void> unblockUserById(String targetUserId) =>
      _moderationService.unblockUserById(targetUserId);

  @Deprecated('Use ChatModerationService.instance.checkUserBlocked()')
  Future<bool> checkUserBlocked(String targetUserId) =>
      _moderationService.checkUserBlocked(targetUserId);

  @Deprecated('Use ChatModerationService.instance.fetchBlockedUserIds()')
  Future<List<String>> fetchBlockedUserIds() =>
      _moderationService.fetchBlockedUserIds();

  @Deprecated('Use ChatModerationService.instance.muteChannel()')
  Future<void> muteChannel(String channelId, {Duration? duration}) =>
      _moderationService.muteChannel(channelId, duration: duration);

  @Deprecated('Use ChatModerationService.instance.unmuteChannel()')
  Future<void> unmuteChannel(String channelId) =>
      _moderationService.unmuteChannel(channelId);

  @Deprecated('Use ChatModerationService.instance.checkChannelMuted()')
  Future<bool> checkChannelMuted(String channelId) =>
      _moderationService.checkChannelMuted(channelId);

  @Deprecated('Use ChatModerationService.instance.fetchMuteStatuses()')
  Future<Map<String, bool>> fetchMuteStatuses(List<String> channelIds) =>
      _moderationService.fetchMuteStatuses(channelIds);

  @Deprecated('Use ChatMessageService.instance.searchChannelMessages()')
  Future<List<Message>> searchChannelMessages({
    required String channelId,
    required String query,
    String filter = 'all',
  }) => _messageService.searchChannelMessages(channelId: channelId, query: query, filter: filter);

  @Deprecated('Use ChatMessageService.instance.fetchMessageById()')
  Future<Result<Message?>> fetchMessageById(String messageId) =>
      _messageService.fetchMessageById(messageId);

  @Deprecated('Use ChatMessageService.instance.forwardMessageToChannel()')
  Future<Result<Message>> forwardMessageToChannel(String messageId, String toChannelId) =>
      _messageService.forwardMessageToChannel(messageId, toChannelId);

  @Deprecated('Use ChatMessageService.instance.clearChannelHistory()')
  Future<void> clearChannelHistory(String channelId) =>
      _messageService.clearChannelHistory(channelId);

  @Deprecated('Use ChatModerationService.instance.pinChannelMessage()')
  Future<void> pinChannelMessage(String channelId, String messageId) =>
      _moderationService.pinChannelMessage(channelId, messageId);

  @Deprecated('Use ChatModerationService.instance.unpinChannelMessage()')
  Future<void> unpinChannelMessage(String channelId, String messageId) =>
      _moderationService.unpinChannelMessage(channelId, messageId);

  @Deprecated('Use ChatModerationService.instance.fetchPinnedMessages()')
  Future<List<Message>> fetchPinnedMessages(String channelId) =>
      _moderationService.fetchPinnedMessages(channelId);

  @Deprecated('Use ChatModerationService.instance.checkMessagePinned()')
  Future<bool> checkMessagePinned(String channelId, String messageId) =>
      _moderationService.checkMessagePinned(channelId, messageId);

  @Deprecated('Use ChatModerationService.instance.starMessageById()')
  Future<void> starMessageById(String messageId) =>
      _moderationService.starMessageById(messageId);

  @Deprecated('Use ChatModerationService.instance.unstarMessageById()')
  Future<void> unstarMessageById(String messageId) =>
      _moderationService.unstarMessageById(messageId);

  @Deprecated('Use ChatModerationService.instance.fetchStarredMessages()')
  Future<List<Message>> fetchStarredMessages() =>
      _moderationService.fetchStarredMessages();

  @Deprecated('Use ChatModerationService.instance.checkMessageStarred()')
  Future<bool> checkMessageStarred(String messageId) =>
      _moderationService.checkMessageStarred(messageId);

  @Deprecated('Use ChatModerationService.instance.fetchStarredMessageIds()')
  Future<Set<String>> fetchStarredMessageIds() =>
      _moderationService.fetchStarredMessageIds();

  @Deprecated('Use ChatModerationService.instance.pinChannelChat()')
  Future<void> pinChannelChat(String channelId) =>
      _moderationService.pinChannelChat(channelId);

  @Deprecated('Use ChatModerationService.instance.unpinChannelChat()')
  Future<void> unpinChannelChat(String channelId) =>
      _moderationService.unpinChannelChat(channelId);

  @Deprecated('Use ChatModerationService.instance.fetchPinnedChatIds()')
  Future<Set<String>> fetchPinnedChatIds() =>
      _moderationService.fetchPinnedChatIds();

  @Deprecated('Use ChatModerationService.instance.archiveChannelChat()')
  Future<void> archiveChannelChat(String channelId) =>
      _moderationService.archiveChannelChat(channelId);

  @Deprecated('Use ChatModerationService.instance.unarchiveChannelChat()')
  Future<void> unarchiveChannelChat(String channelId) =>
      _moderationService.unarchiveChannelChat(channelId);

  @Deprecated('Use ChatModerationService.instance.fetchArchivedChatIds()')
  Future<Set<String>> fetchArchivedChatIds() =>
      _moderationService.fetchArchivedChatIds();

  @Deprecated('Use ChatMessageService.instance.fetchLastMessages()')
  Future<Map<String, Message?>> fetchLastMessages(List<String> channelIds) =>
      _messageService.fetchLastMessages(channelIds);
}
