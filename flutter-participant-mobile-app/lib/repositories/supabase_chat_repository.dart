import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/models.dart';
import '../utils/result.dart';
import '../services/chat_service.dart';
import '../supabase/supabase_config.dart';
import 'base_repository.dart';
import 'chat_repository.dart';

/// Supabase implementation of [ChatRepository].
/// 
/// Extends [BaseRepository] for standardized error handling and logging.
/// Wraps [ChatService] static methods with consistent Result<T> return types.
class SupabaseChatRepository extends BaseRepository implements ChatRepository {
  @override
  String get tag => 'ChatRepository';

  SupabaseClient get _client => SupabaseConfig.client;

  // ═══════════════════════════════════════════════════════════════════════════
  // CHANNELS & THREADS
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<List<DMThread>>> getDMThreads({int limit = 200}) {
    return execute(() async {
      final threads = await ChatService.getMyDMThreads(limit: limit);
      logDbOperation('SELECT', 'dm_threads', rowCount: threads.length);
      return threads;
    }, operationName: 'getDMThreads');
  }

  @override
  Future<Result<List<WorkspaceChannel>>> getMyChannels({String? workspaceId}) {
    return execute(() async {
      final channels = await ChatService.getMyChannels(workspaceId: workspaceId);
      logDbOperation('SELECT', 'workspace_channels', rowCount: channels.length);
      return channels;
    }, operationName: 'getMyChannels');
  }

  @override
  Future<Result<Map<String, Message?>>> getLastMessages(List<String> channelIds) {
    return execute(() async {
      return await ChatService.getLastMessages(channelIds);
    }, operationName: 'getLastMessages');
  }

  @override
  String dmChannelIdFor(String userId1, String userId2) {
    return ChatService.dmChannelIdFor(userId1, userId2);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MESSAGES
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Stream<List<Message>> streamMessages(String channelId) {
    return ChatService.streamMessages(channelId);
  }

  @override
  Future<Result<List<Message>>> getMessages(
    String channelId, {
    int limit = 50,
    DateTime? before,
  }) {
    return execute(() async {
      final query = _client
          .from('channel_messages')
          .select()
          .eq('channel_id', channelId)
          .order('created_at', ascending: false)
          .limit(limit);

      final data = await query;
      final messages = data.map((e) => Message.fromJson(e)).toList();
      logDbOperation('SELECT', 'channel_messages', rowCount: messages.length);
      return messages;
    }, operationName: 'getMessages');
  }

  @override
  Future<Result<Message>> sendMessage({
    required String channelId,
    required String content,
    List<MessageAttachment> attachments = const [],
  }) {
    return execute(() async {
      final message = await ChatService.sendMessage(
        channelId: channelId,
        content: content,
        attachments: attachments,
      );
      if (message == null) {
        throw Exception('Failed to send message');
      }
      logDebug('Message sent to $channelId');
      return message;
    }, operationName: 'sendMessage');
  }

  @override
  Future<Result<void>> editMessage(String messageId, String newContent) {
    return execute(() async {
      final editedMessage = await ChatService.editMessage(messageId, newContent);
      if (editedMessage == null) {
        throw Exception('Failed to edit message');
      }
      logDebug('Message $messageId edited');
    }, operationName: 'editMessage');
  }

  @override
  Future<Result<void>> deleteMessage(String messageId) {
    return execute(() async {
      final success = await ChatService.deleteMessage(messageId);
      if (!success) {
        throw Exception('Failed to delete message');
      }
      logDebug('Message $messageId deleted');
    }, operationName: 'deleteMessage');
  }

  @override
  Future<Result<Message>> getMessageById(String messageId) {
    return execute(() async {
      final message = await ChatService.getMessageById(messageId);
      if (message == null) {
        throw Exception('Message not found');
      }
      return message;
    }, operationName: 'getMessageById');
  }

  @override
  Future<Result<Message>> forwardMessage(String messageId, String toChannelId) {
    return execute(() async {
      final message = await ChatService.forwardMessage(messageId, toChannelId);
      if (message == null) {
        throw Exception('Failed to forward message');
      }
      logDebug('Message forwarded to $toChannelId');
      return message;
    }, operationName: 'forwardMessage');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<void>> addReaction(String messageId, String emoji) {
    return execute(() async {
      await ChatService.addReaction(messageId, emoji);
    }, operationName: 'addReaction');
  }

  @override
  Future<Result<void>> removeReaction(String messageId, String emoji) {
    return execute(() async {
      await ChatService.removeReaction(messageId, emoji);
    }, operationName: 'removeReaction');
  }

  @override
  Stream<Map<String, List<String>>> streamReactions(String channelId) {
    return ChatService.streamReactions(channelId).map((reactions) {
      final Map<String, List<String>> grouped = {};
      for (final r in reactions) {
        final messageId = r['message_id'] as String?;
        final emoji = r['emoji'] as String?;
        if (messageId != null && emoji != null) {
          grouped.putIfAbsent(messageId, () => []).add(emoji);
        }
      }
      return grouped;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // READ RECEIPTS & UNREAD
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<void>> markAsRead(String messageId) {
    return execute(() async {
      await ChatService.markAsRead(messageId);
    }, operationName: 'markAsRead');
  }

  @override
  Future<Result<void>> updateLastRead(String channelId) {
    return execute(() async {
      await ChatService.updateLastRead(channelId);
    }, operationName: 'updateLastRead');
  }

  @override
  Future<Result<void>> markAllAsRead(List<String> channelIds) {
    return execute(() async {
      await ChatService.markAllAsRead(channelIds);
    }, operationName: 'markAllAsRead');
  }

  @override
  Future<Result<int>> getUnreadCount(String channelId) {
    return execute(() async {
      return await ChatService.getUnreadCount(channelId);
    }, operationName: 'getUnreadCount');
  }

  @override
  Future<Result<Map<String, int>>> getUnreadCounts(List<String> channelIds) {
    return execute(() async {
      return await ChatService.getUnreadCounts(channelIds);
    }, operationName: 'getUnreadCounts');
  }

  @override
  Future<Result<Map<String, List<String>>>> getReadReceipts(List<String> messageIds) {
    return execute(() async {
      return await ChatService.getReadReceipts(messageIds);
    }, operationName: 'getReadReceipts');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPING INDICATORS
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<void>> sendTyping(
    String channelId, {
    required String name,
    required String userId,
  }) {
    return execute(() async {
      await ChatService.sendTyping(channelId, name: name, userId: userId);
    }, operationName: 'sendTyping');
  }

  @override
  dynamic typingChannel(String channelId) {
    return ChatService.typingChannel(channelId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRESENCE
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<void>> setOnlineStatus(bool isOnline) {
    return execute(() async {
      await ChatService.setOnlineStatus(isOnline);
    }, operationName: 'setOnlineStatus');
  }

  @override
  Future<Result<void>> updateHeartbeat() {
    return execute(() async {
      await ChatService.updateHeartbeat();
    }, operationName: 'updateHeartbeat');
  }

  @override
  Stream<bool> streamUserOnlineStatus(String userId) {
    return ChatService.streamUserOnlineStatus(userId);
  }

  @override
  Future<Result<DateTime?>> getLastSeen(String userId) {
    return execute(() async {
      return await ChatService.getLastSeen(userId);
    }, operationName: 'getLastSeen');
  }

  @override
  Future<Result<bool>> isUserOnline(String userId) {
    return execute(() async {
      return await ChatService.isUserOnline(userId);
    }, operationName: 'isUserOnline');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PINNED & STARRED
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<void>> pinMessage(String channelId, String messageId) {
    return execute(() async {
      await ChatService.pinMessage(channelId, messageId);
    }, operationName: 'pinMessage');
  }

  @override
  Future<Result<void>> unpinMessage(String channelId, String messageId) {
    return execute(() async {
      await ChatService.unpinMessage(channelId, messageId);
    }, operationName: 'unpinMessage');
  }

  @override
  Future<Result<List<Message>>> getPinnedMessages(String channelId) {
    return execute(() async {
      return await ChatService.getPinnedMessages(channelId);
    }, operationName: 'getPinnedMessages');
  }

  @override
  Future<Result<void>> starMessage(String messageId) {
    return execute(() async {
      await ChatService.starMessage(messageId);
    }, operationName: 'starMessage');
  }

  @override
  Future<Result<void>> unstarMessage(String messageId) {
    return execute(() async {
      await ChatService.unstarMessage(messageId);
    }, operationName: 'unstarMessage');
  }

  @override
  Future<Result<List<Message>>> getStarredMessages() {
    return execute(() async {
      return await ChatService.getStarredMessages();
    }, operationName: 'getStarredMessages');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOCKING & MUTING
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<void>> blockUser(String targetUserId) {
    return execute(() async {
      await ChatService.blockUser(targetUserId);
      logInfo('Blocked user: $targetUserId');
    }, operationName: 'blockUser');
  }

  @override
  Future<Result<void>> unblockUser(String targetUserId) {
    return execute(() async {
      await ChatService.unblockUser(targetUserId);
      logInfo('Unblocked user: $targetUserId');
    }, operationName: 'unblockUser');
  }

  @override
  Future<Result<bool>> isUserBlocked(String targetUserId) {
    return execute(() async {
      return await ChatService.isUserBlocked(targetUserId);
    }, operationName: 'isUserBlocked');
  }

  @override
  Future<Result<List<String>>> getBlockedUserIds() {
    return execute(() async {
      return await ChatService.getBlockedUserIds();
    }, operationName: 'getBlockedUserIds');
  }

  @override
  Future<Result<void>> muteConversation(String channelId, {Duration? duration}) {
    return execute(() async {
      await ChatService.muteConversation(channelId, duration: duration);
      logDebug('Muted conversation: $channelId');
    }, operationName: 'muteConversation');
  }

  @override
  Future<Result<void>> unmuteConversation(String channelId) {
    return execute(() async {
      await ChatService.unmuteConversation(channelId);
      logDebug('Unmuted conversation: $channelId');
    }, operationName: 'unmuteConversation');
  }

  @override
  Future<Result<bool>> isConversationMuted(String channelId) {
    return execute(() async {
      return await ChatService.isConversationMuted(channelId);
    }, operationName: 'isConversationMuted');
  }

  @override
  Future<Result<Map<String, bool>>> getMuteStatuses(List<String> channelIds) {
    return execute(() async {
      return await ChatService.getMuteStatuses(channelIds);
    }, operationName: 'getMuteStatuses');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SEARCH
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<List<UserProfile>>> searchParticipants(String query, {int limit = 50}) {
    return execute(() async {
      return await ChatService.searchParticipants(query, limit: limit);
    }, operationName: 'searchParticipants');
  }

  @override
  Future<Result<List<Message>>> searchMessages({
    required String channelId,
    required String query,
    String filter = 'all',
  }) {
    return execute(() async {
      return await ChatService.searchMessages(
        channelId: channelId,
        query: query,
        filter: filter,
      );
    }, operationName: 'searchMessages');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<void>> clearChatHistory(String channelId) {
    return execute(() async {
      await ChatService.clearChatHistory(channelId);
      logInfo('Cleared chat history: $channelId');
    }, operationName: 'clearChatHistory');
  }

  @override
  String? getCurrentUserId() => SupabaseConfig.auth.currentUser?.id;
}
