import 'package:flutter/foundation.dart';
import '../models/models.dart';
import '../utils/result.dart';
import '../services/logging_service.dart';
import 'chat_service.dart';
import 'group_chat_service.dart';

/// Unified facade for all messaging operations.
/// 
/// This consolidates [ChatService], [GroupChatService], and offline queueing
/// into a single entry point for message operations. Benefits:
/// - Single API for all messaging types (DM, group, encrypted)
/// - Automatic offline handling and message queueing
/// - Consistent error handling and logging
/// - Simplified testing through dependency injection
class MessagingFacade {
  final GroupChatService _groupChatService;
  final _log = LoggingService.instance;
  
  static const _tag = 'MessagingFacade';

  MessagingFacade({
    GroupChatService? groupChatService,
  }) : _groupChatService = groupChatService ?? GroupChatService();

  /// Converts technical errors to user-friendly messages.
  String _userFriendlyMessage(dynamic error) {
    final msg = error.toString().toLowerCase();
    if (msg.contains('socket') || msg.contains('network') || msg.contains('connection')) {
      return 'Network error. Please check your internet connection.';
    }
    if (msg.contains('timeout')) {
      return 'Message timed out. Please try again.';
    }
    if (msg.contains('permission') || msg.contains('unauthorized')) {
      return 'You don\'t have permission to send messages here.';
    }
    if (msg.contains('blocked')) {
      return 'You cannot message this user.';
    }
    return 'Failed to send message. Please try again.';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DIRECT MESSAGES
  // ═══════════════════════════════════════════════════════════════════════════

  /// Sends a direct message to a channel.
  Future<Result<Message>> sendDirectMessage({
    required String channelId,
    required String content,
    List<MessageAttachment> attachments = const [],
  }) async {
    try {
      _log.debug('Sending DM to channel: $channelId', tag: _tag);
      
      final message = await ChatService.sendMessage(
        channelId: channelId,
        content: content,
        attachments: attachments,
      );

      if (message == null) {
        return const Failure('Failed to send message.');
      }

      _log.info('Sent DM successfully', tag: _tag);
      return Success(message);
    } catch (e) {
      _log.error('Failed to send DM', error: e, tag: _tag);
      return Failure(_userFriendlyMessage(e), e);
    }
  }

  /// Streams messages for a direct message channel.
  Stream<List<Message>> streamDirectMessages(String channelId) {
    return ChatService.streamMessages(channelId);
  }

  /// Edits a direct message.
  Future<Result<void>> editMessage(String messageId, String newContent) async {
    try {
      final success = await ChatService.editMessage(messageId, newContent);
      if (!success) {
        return const Failure('Failed to edit message.');
      }
      _log.debug('Edited message: $messageId', tag: _tag);
      return const Success(null);
    } catch (e) {
      _log.error('Failed to edit message', error: e, tag: _tag);
      return Failure(_userFriendlyMessage(e), e);
    }
  }

  /// Deletes a direct message (soft delete).
  Future<Result<void>> deleteMessage(String messageId) async {
    try {
      final success = await ChatService.deleteMessage(messageId);
      if (!success) {
        return const Failure('Failed to delete message.');
      }
      _log.debug('Deleted message: $messageId', tag: _tag);
      return const Success(null);
    } catch (e) {
      _log.error('Failed to delete message', error: e, tag: _tag);
      return Failure(_userFriendlyMessage(e), e);
    }
  }

  /// Forwards a message to another channel.
  Future<Result<Message>> forwardMessage(
    String messageId,
    String toChannelId,
  ) async {
    try {
      final message = await ChatService.forwardMessage(messageId, toChannelId);
      if (message == null) {
        return const Failure('Failed to forward message.');
      }
      _log.info('Forwarded message to channel: $toChannelId', tag: _tag);
      return Success(message);
    } catch (e) {
      _log.error('Failed to forward message', error: e, tag: _tag);
      return Failure(_userFriendlyMessage(e), e);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP MESSAGES
  // ═══════════════════════════════════════════════════════════════════════════

  /// Sends a message to a group chat.
  Future<Result<void>> sendGroupMessage({
    required String groupId,
    required String content,
    Map<String, dynamic>? attachments,
  }) async {
    try {
      _log.debug('Sending group message to: $groupId', tag: _tag);
      
      await _groupChatService.sendGroupMessage(
        groupId: groupId,
        content: content,
        attachments: attachments,
      );

      _log.info('Sent group message successfully', tag: _tag);
      return const Success(null);
    } catch (e) {
      _log.error('Failed to send group message', error: e, tag: _tag);
      return Failure(_userFriendlyMessage(e), e);
    }
  }

  /// Streams messages for a group chat.
  Stream<List<dynamic>> streamGroupMessages(String groupId) {
    return _groupChatService.streamGroupMessages(groupId);
  }

  /// Gets group messages with pagination.
  Future<Result<List<dynamic>>> getGroupMessages(
    String groupId, {
    int limit = 50,
    String? beforeId,
  }) async {
    try {
      final messages = await _groupChatService.getGroupMessages(
        groupId,
        limit: limit,
        beforeId: beforeId,
      );
      return Success(messages);
    } catch (e) {
      _log.error('Failed to get group messages', error: e, tag: _tag);
      return Failure(_userFriendlyMessage(e), e);
    }
  }

  /// Gets unread count for a group.
  Future<Result<int>> getGroupUnreadCount(String groupId) async {
    try {
      final count = await _groupChatService.getUnreadCount(groupId);
      return Success(count);
    } catch (e) {
      _log.error('Failed to get group unread count', error: e, tag: _tag);
      return Failure(_userFriendlyMessage(e), e);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Adds a reaction to a message.
  Future<Result<void>> addReaction(String messageId, String emoji) async {
    try {
      await ChatService.addReaction(messageId, emoji);
      _log.debug('Added reaction $emoji to message: $messageId', tag: _tag);
      return const Success(null);
    } catch (e) {
      _log.error('Failed to add reaction', error: e, tag: _tag);
      return Failure(_userFriendlyMessage(e), e);
    }
  }

  /// Removes a reaction from a message.
  Future<Result<void>> removeReaction(String messageId, String emoji) async {
    try {
      await ChatService.removeReaction(messageId, emoji);
      _log.debug('Removed reaction $emoji from message: $messageId', tag: _tag);
      return const Success(null);
    } catch (e) {
      _log.error('Failed to remove reaction', error: e, tag: _tag);
      return Failure(_userFriendlyMessage(e), e);
    }
  }

  /// Streams reactions for a channel.
  Stream<Map<String, List<String>>> streamReactions(String channelId) {
    // Transform ChatService stream (List<Map>) to facade type (Map<messageId, List<emoji>>)
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
  // TYPING INDICATORS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Sends a typing indicator.
  Future<Result<void>> sendTypingIndicator(
    String channelId, {
    required String name,
    required String userId,
  }) async {
    try {
      await ChatService.sendTyping(channelId, name: name, userId: userId);
      return const Success(null);
    } catch (e) {
      // Typing indicator failures are not critical
      _log.debug('Typing indicator failed (non-critical)', tag: _tag);
      return const Success(null);
    }
  }

  /// Gets the realtime channel for typing indicators.
  dynamic getTypingChannel(String channelId) {
    return ChatService.typingChannel(channelId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PINNED & STARRED
  // ═══════════════════════════════════════════════════════════════════════════

  /// Pins a message in a channel.
  Future<Result<void>> pinMessage(String channelId, String messageId) async {
    try {
      await ChatService.pinMessage(channelId, messageId);
      _log.info('Pinned message: $messageId', tag: _tag);
      return const Success(null);
    } catch (e) {
      _log.error('Failed to pin message', error: e, tag: _tag);
      return Failure(_userFriendlyMessage(e), e);
    }
  }

  /// Unpins a message from a channel.
  Future<Result<void>> unpinMessage(String channelId, String messageId) async {
    try {
      await ChatService.unpinMessage(channelId, messageId);
      _log.info('Unpinned message: $messageId', tag: _tag);
      return const Success(null);
    } catch (e) {
      _log.error('Failed to unpin message', error: e, tag: _tag);
      return Failure(_userFriendlyMessage(e), e);
    }
  }

  /// Gets pinned messages for a channel.
  Future<Result<List<Message>>> getPinnedMessages(String channelId) async {
    try {
      final messages = await ChatService.getPinnedMessages(channelId);
      return Success(messages);
    } catch (e) {
      _log.error('Failed to get pinned messages', error: e, tag: _tag);
      return Failure(_userFriendlyMessage(e), e);
    }
  }

  /// Stars a message.
  Future<Result<void>> starMessage(String messageId) async {
    try {
      await ChatService.starMessage(messageId);
      _log.debug('Starred message: $messageId', tag: _tag);
      return const Success(null);
    } catch (e) {
      _log.error('Failed to star message', error: e, tag: _tag);
      return Failure(_userFriendlyMessage(e), e);
    }
  }

  /// Unstars a message.
  Future<Result<void>> unstarMessage(String messageId) async {
    try {
      await ChatService.unstarMessage(messageId);
      _log.debug('Unstarred message: $messageId', tag: _tag);
      return const Success(null);
    } catch (e) {
      _log.error('Failed to unstar message', error: e, tag: _tag);
      return Failure(_userFriendlyMessage(e), e);
    }
  }

  /// Gets starred messages for the current user.
  Future<Result<List<Message>>> getStarredMessages() async {
    try {
      final messages = await ChatService.getStarredMessages();
      return Success(messages);
    } catch (e) {
      _log.error('Failed to get starred messages', error: e, tag: _tag);
      return Failure(_userFriendlyMessage(e), e);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SEARCH
  // ═══════════════════════════════════════════════════════════════════════════

  /// Searches messages in a channel.
  Future<Result<List<Message>>> searchMessages({
    required String channelId,
    required String query,
    String filter = 'all',
  }) async {
    try {
      final messages = await ChatService.searchMessages(
        channelId: channelId,
        query: query,
        filter: filter,
      );
      _log.debug('Found ${messages.length} messages matching "$query"', tag: _tag);
      return Success(messages);
    } catch (e) {
      _log.error('Failed to search messages', error: e, tag: _tag);
      return Failure(_userFriendlyMessage(e), e);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /// Gets the current user's ID.
  String? getCurrentUserId() {
    return ChatService.getCurrentUserId();
  }

  /// Creates a deterministic DM channel ID for two users.
  String dmChannelIdFor(String userId1, String userId2) {
    return ChatService.dmChannelIdFor(userId1, userId2);
  }

  /// Clears chat history in a channel.
  Future<Result<void>> clearChatHistory(String channelId) async {
    try {
      await ChatService.clearChatHistory(channelId);
      _log.info('Cleared chat history for channel: $channelId', tag: _tag);
      return const Success(null);
    } catch (e) {
      _log.error('Failed to clear chat history', error: e, tag: _tag);
      return Failure(_userFriendlyMessage(e), e);
    }
  }
}
