import '../models/models.dart';
import '../utils/result.dart';

/// Abstract repository interface for chat operations.
/// 
/// This provides a clean abstraction over the data layer, enabling:
/// - Consistent error handling via Result<T> pattern
/// - Easy testing through mock implementations
/// - Separation of concerns between UI and data access
abstract class ChatRepository {
  // ═══════════════════════════════════════════════════════════════════════════
  // CHANNELS & THREADS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Fetches direct message threads for the current user.
  Future<Result<List<DMThread>>> getDMThreads({int limit = 200});

  /// Fetches workspace channels the current user has access to.
  Future<Result<List<WorkspaceChannel>>> getMyChannels({String? workspaceId});

  /// Gets the last message for each channel.
  Future<Result<Map<String, Message?>>> getLastMessages(List<String> channelIds);

  /// Creates a deterministic DM channel ID for two users.
  String dmChannelIdFor(String userId1, String userId2);

  // ═══════════════════════════════════════════════════════════════════════════
  // MESSAGES
  // ═══════════════════════════════════════════════════════════════════════════

  /// Streams messages for a channel in real-time.
  Stream<List<Message>> streamMessages(String channelId);

  /// Fetches messages for a channel with pagination.
  Future<Result<List<Message>>> getMessages(
    String channelId, {
    int limit = 50,
    DateTime? before,
  });

  /// Sends a message to a channel.
  Future<Result<Message>> sendMessage({
    required String channelId,
    required String content,
    List<MessageAttachment> attachments = const [],
  });

  /// Edits an existing message.
  Future<Result<void>> editMessage(String messageId, String newContent);

  /// Deletes a message (soft delete).
  Future<Result<void>> deleteMessage(String messageId);

  /// Gets a single message by ID.
  Future<Result<Message>> getMessageById(String messageId);

  /// Forwards a message to another channel.
  Future<Result<Message>> forwardMessage(String messageId, String toChannelId);

  // ═══════════════════════════════════════════════════════════════════════════
  // REACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Adds a reaction to a message.
  Future<Result<void>> addReaction(String messageId, String emoji);

  /// Removes a reaction from a message.
  Future<Result<void>> removeReaction(String messageId, String emoji);

  /// Streams reactions for a channel in real-time.
  Stream<Map<String, List<String>>> streamReactions(String channelId);

  // ═══════════════════════════════════════════════════════════════════════════
  // READ RECEIPTS & UNREAD
  // ═══════════════════════════════════════════════════════════════════════════

  /// Marks a message as read.
  Future<Result<void>> markAsRead(String messageId);

  /// Updates the last read timestamp for a channel.
  Future<Result<void>> updateLastRead(String channelId);

  /// Marks all messages as read in multiple channels.
  Future<Result<void>> markAllAsRead(List<String> channelIds);

  /// Gets the unread count for a channel.
  Future<Result<int>> getUnreadCount(String channelId);

  /// Gets unread counts for multiple channels.
  Future<Result<Map<String, int>>> getUnreadCounts(List<String> channelIds);

  /// Gets read receipts for messages.
  Future<Result<Map<String, List<String>>>> getReadReceipts(List<String> messageIds);

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPING INDICATORS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Sends a typing indicator.
  Future<Result<void>> sendTyping(
    String channelId, {
    required String name,
    required String userId,
  });

  /// Gets the realtime channel for typing indicators.
  dynamic typingChannel(String channelId);

  // ═══════════════════════════════════════════════════════════════════════════
  // PRESENCE
  // ═══════════════════════════════════════════════════════════════════════════

  /// Sets the current user's online status.
  Future<Result<void>> setOnlineStatus(bool isOnline);

  /// Updates the heartbeat timestamp.
  Future<Result<void>> updateHeartbeat();

  /// Streams a user's online status.
  Stream<bool> streamUserOnlineStatus(String userId);

  /// Gets the last seen timestamp for a user.
  Future<Result<DateTime?>> getLastSeen(String userId);

  /// Checks if a user is currently online.
  Future<Result<bool>> isUserOnline(String userId);

  // ═══════════════════════════════════════════════════════════════════════════
  // PINNED & STARRED
  // ═══════════════════════════════════════════════════════════════════════════

  /// Pins a message in a channel.
  Future<Result<void>> pinMessage(String channelId, String messageId);

  /// Unpins a message from a channel.
  Future<Result<void>> unpinMessage(String channelId, String messageId);

  /// Gets all pinned messages in a channel.
  Future<Result<List<Message>>> getPinnedMessages(String channelId);

  /// Stars a message for the current user.
  Future<Result<void>> starMessage(String messageId);

  /// Unstars a message.
  Future<Result<void>> unstarMessage(String messageId);

  /// Gets all starred messages for the current user.
  Future<Result<List<Message>>> getStarredMessages();

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOCKING & MUTING
  // ═══════════════════════════════════════════════════════════════════════════

  /// Blocks a user.
  Future<Result<void>> blockUser(String targetUserId);

  /// Unblocks a user.
  Future<Result<void>> unblockUser(String targetUserId);

  /// Checks if a user is blocked.
  Future<Result<bool>> isUserBlocked(String targetUserId);

  /// Gets all blocked user IDs.
  Future<Result<List<String>>> getBlockedUserIds();

  /// Mutes a conversation.
  Future<Result<void>> muteConversation(String channelId, {Duration? duration});

  /// Unmutes a conversation.
  Future<Result<void>> unmuteConversation(String channelId);

  /// Checks if a conversation is muted.
  Future<Result<bool>> isConversationMuted(String channelId);

  /// Gets mute statuses for multiple channels.
  Future<Result<Map<String, bool>>> getMuteStatuses(List<String> channelIds);

  // ═══════════════════════════════════════════════════════════════════════════
  // SEARCH & UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /// Searches for users to start a conversation with.
  Future<Result<List<UserProfile>>> searchParticipants(String query, {int limit = 50});

  /// Searches messages in a channel.
  Future<Result<List<Message>>> searchMessages({
    required String channelId,
    required String query,
    String filter = 'all',
  });

  /// Clears chat history in a channel.
  Future<Result<void>> clearChatHistory(String channelId);

  /// Gets the current user's ID.
  String? getCurrentUserId();
}
