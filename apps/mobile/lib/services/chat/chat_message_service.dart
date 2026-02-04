import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/services/chat_security_service.dart';
import 'package:thittam1hub/services/pagination_mixin.dart';
import 'package:thittam1hub/utils/result.dart';

/// Domain-focused service for chat message operations.
/// 
/// Handles: messages CRUD, reactions, read receipts, unread counts, search.
/// Uses cursor-based pagination for scalable message fetching.
/// Respects user privacy settings (hideReadReceipts).
class ChatMessageService extends BaseService with CachingServiceMixin, PaginationMixin {
  static ChatMessageService? _instance;
  static ChatMessageService get instance => _instance ??= ChatMessageService._();
  ChatMessageService._();

  @override
  String get tag => 'ChatMessageService';

  static const String messagesTable = 'messages';
  static const String profilesTable = 'user_profiles';

  SupabaseClient get _client => SupabaseConfig.client;

  // ============================================================
  // MESSAGE CRUD
  // ============================================================

  /// Send a message - returns Result<Message>
  Future<Result<Message>> createMessage({
    required String channelId,
    required String content,
    List<MessageAttachment> attachments = const [],
  }) => execute(() async {
    final user = SupabaseConfig.auth.currentUser;
    if (user == null) throw Exception('Not authenticated');

    String senderName = user.email?.split('@').first ?? 'You';
    String? senderAvatar;
    try {
      final profile = await _client
          .from('user_profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle();
      if (profile != null) {
        senderName = (profile['full_name'] as String?)?.trim().isNotEmpty == true
            ? profile['full_name'] as String
            : senderName;
        senderAvatar = profile['avatar_url'] as String?;
      }
    } catch (e) {
      logWarning('Profile lookup failed during sendMessage', error: e);
    }

    final data = {
      'channel_id': channelId,
      'sender_id': user.id,
      'sender_name': senderName,
      'sender_avatar': senderAvatar,
      'content': content,
      'attachments': attachments.map((a) => a.toJson()).toList(),
      'sent_at': DateTime.now().toIso8601String(),
    };
    final inserted = await _client.from(messagesTable).insert(data).select().single();

    logDbOperation('INSERT', messagesTable, rowCount: 1);
    return Message.fromJson(Map<String, dynamic>.from(inserted));
  }, operationName: 'createMessage');

  /// Stream messages for a channel
  Stream<List<Message>> getMessagesStream(String channelId) {
    try {
      return _client
          .from(messagesTable)
          .stream(primaryKey: ['id'])
          .eq('channel_id', channelId)
          .order('sent_at')
          .map((rows) => rows
              .map((e) => Message.fromJson(Map<String, dynamic>.from(e)))
              .toList());
    } catch (e) {
      logError('getMessagesStream failed', error: e);
      return const Stream.empty();
    }
  }

  /// Delete a message (soft delete)
  Future<Result<void>> removeMessage(String messageId) => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) throw Exception('Not authenticated');

    await _client.from(messagesTable).update({
      'deleted_at': DateTime.now().toIso8601String(),
      'is_deleted': true,
      'content': '',
    }).eq('id', messageId).eq('sender_id', userId);

    logInfo('Message deleted', metadata: {'message_id': messageId});
  }, operationName: 'removeMessage');

  /// Edit a message
  Future<Result<Message>> updateMessage(String messageId, String newContent) => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) throw Exception('Not authenticated');

    final updated = await _client.from(messagesTable).update({
      'content': newContent,
      'edited_at': DateTime.now().toIso8601String(),
    }).eq('id', messageId).eq('sender_id', userId).select().single();

    logInfo('Message edited', metadata: {'message_id': messageId});
    return Message.fromJson(Map<String, dynamic>.from(updated));
  }, operationName: 'updateMessage');

  /// Send an image message
  Future<Result<Message>> createImageMessage({
    required String channelId,
    required String imagePath,
    String? caption,
  }) => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) throw Exception('Not authenticated');

    final fileName = '${DateTime.now().millisecondsSinceEpoch}_$userId.jpg';
    final storagePath = 'chat-images/$channelId/$fileName';
    final imageUrl = _client.storage.from('media-assets').getPublicUrl(storagePath);

    final result = await createMessage(
      channelId: channelId,
      content: caption ?? '',
      attachments: [
        MessageAttachment(
          filename: fileName,
          url: imageUrl,
          size: 0,
        ),
      ],
    );

    if (result is Success<Message>) {
      return result.data;
    }
    throw Exception('Failed to send image message');
  }, operationName: 'createImageMessage');

  /// Fetch a single message by ID
  Future<Result<Message?>> fetchMessageById(String messageId) => execute(() async {
    final row = await _client
        .from(messagesTable)
        .select()
        .eq('id', messageId)
        .maybeSingle();

    if (row == null) return null;
    return Message.fromJson(Map<String, dynamic>.from(row));
  }, operationName: 'fetchMessageById');

  /// Forward a message to another channel
  Future<Result<Message>> forwardMessageToChannel(String messageId, String toChannelId) => execute(() async {
    final originalResult = await fetchMessageById(messageId);
    if (originalResult is! Success<Message?> || originalResult.data == null) {
      throw Exception('Original message not found');
    }
    final original = originalResult.data!;
    if (original.isDeleted) throw Exception('Cannot forward deleted message');

    final sendResult = await createMessage(
      channelId: toChannelId,
      content: original.content,
      attachments: original.attachments,
    );

    if (sendResult is Success<Message>) {
      return sendResult.data;
    }
    throw Exception('Failed to forward message');
  }, operationName: 'forwardMessageToChannel');

  /// Fetch messages with cursor-based pagination for a channel.
  /// 
  /// [cursor] is the ISO8601 timestamp of the last message from previous page.
  /// Returns [PaginatedResult] with messages and next cursor.
  Future<Result<PaginatedResult<Message>>> fetchMessagesPaginated({
    required String channelId,
    String? cursor,
    int? pageSize,
  }) => execute(() async {
    final effectivePageSize = normalizePageSize(pageSize);
    final cursorTime = parseCursor(cursor);

    final cursorIso = cursorTime?.toIso8601String();

    var query = _client
        .from(messagesTable)
        .select()
        .eq('channel_id', channelId);

    if (cursorIso != null) {
      query = query.lt('sent_at', cursorIso);
    }

    final rows = await query
        .order('sent_at', ascending: false)
        .limit(effectivePageSize + 1);

    final messages = rows
        .map((r) => Message.fromJson(Map<String, dynamic>.from(r as Map)))
        .toList();

    logDbOperation('SELECT', messagesTable, rowCount: messages.length);

    return messages.toPaginatedResult(
      pageSize: effectivePageSize,
      getCursor: (msg) => msg.sentAt?.toIso8601String(),
    );
  }, operationName: 'fetchMessagesPaginated');

  /// Batch fetch last message for channels (optimized with per-channel limit).
  Future<Map<String, Message?>> fetchLastMessages(List<String> channelIds) async {
    final Map<String, Message?> result = {for (final id in channelIds) id: null};
    if (channelIds.isEmpty) return result;

    // Process in batches to avoid overly large queries
    const batchSize = 50;
    final batches = <List<String>>[];
    for (var i = 0; i < channelIds.length; i += batchSize) {
      batches.add(channelIds.sublist(
        i,
        i + batchSize > channelIds.length ? channelIds.length : i + batchSize,
      ));
    }

    for (final batch in batches) {
      final queryResult = await execute(() async {
        // Fetch limited messages per batch, keeping only latest per channel
        final rows = await _client
            .from(messagesTable)
            .select()
            .inFilter('channel_id', batch)
            .order('sent_at', ascending: false)
            .limit(batch.length * 2); // At most 2 per channel for safety

        for (final row in rows) {
          final map = Map<String, dynamic>.from(row as Map);
          final msg = Message.fromJson(map);
          result.putIfAbsent(msg.channelId, () => msg);
        }
        logDbOperation('SELECT', messagesTable, rowCount: rows.length);
        return true;
      }, operationName: 'fetchLastMessages.batch');

      if (queryResult is! Success) break;
    }

    return result;
  }

  // ============================================================
  // REACTIONS
  // ============================================================

  Future<void> insertReaction(String messageId, String emoji) async {
    await execute(() async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      await _client.from('message_reactions').upsert({
        'message_id': messageId,
        'user_id': userId,
        'emoji': emoji,
      });
      logInfo('Reaction added', metadata: {'emoji': emoji});
    }, operationName: 'insertReaction');
  }

  Future<void> deleteReaction(String messageId, String emoji) async {
    await execute(() async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      await _client
          .from('message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', userId)
          .eq('emoji', emoji);
      logInfo('Reaction removed', metadata: {'emoji': emoji});
    }, operationName: 'deleteReaction');
  }

  Stream<List<Map<String, dynamic>>> getReactionsStream(String channelId) {
    try {
      return _client
          .from('message_reactions')
          .stream(primaryKey: ['id'])
          .map((rows) => rows.map((e) => Map<String, dynamic>.from(e)).toList());
    } catch (e) {
      logError('getReactionsStream failed', error: e);
      return const Stream.empty();
    }
  }

  /// Fetch reactions for messages with batched queries.
  Future<Map<String, List<Map<String, dynamic>>>> fetchReactionsForMessages(List<String> messageIds) async {
    final Map<String, List<Map<String, dynamic>>> result = {};
    if (messageIds.isEmpty) return result;

    // Process in batches to avoid exceeding query limits
    const batchSize = 100;
    final batches = <List<String>>[];
    for (var i = 0; i < messageIds.length; i += batchSize) {
      batches.add(messageIds.sublist(
        i,
        i + batchSize > messageIds.length ? messageIds.length : i + batchSize,
      ));
    }

    for (final batch in batches) {
      final queryResult = await execute(() async {
        final rows = await _client
            .from('message_reactions')
            .select('message_id, user_id, emoji')
            .inFilter('message_id', batch)
            .limit(batch.length * 10); // Max ~10 reactions per message

        for (final row in rows) {
          final msgId = row['message_id'] as String;
          result.putIfAbsent(msgId, () => []).add(Map<String, dynamic>.from(row as Map));
        }
        return true;
      }, operationName: 'fetchReactionsForMessages.batch');

      if (queryResult is! Success) break;
    }

    return result;
  }

  // ============================================================
  // READ RECEIPTS
  // ============================================================

  /// Mark a message as read
  /// Respects user's hideReadReceipts privacy setting
  Future<void> markMessageAsRead(String messageId) async {
    await execute(() async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return;

      // Check if user has disabled read receipts in privacy settings
      final securityResult = await ChatSecurityService.instance.getSecuritySettings();
      if (securityResult.isSuccess && securityResult.data.hideReadReceipts) {
        logDebug('Read receipt skipped - hideReadReceipts enabled');
        return;
      }

      await _client.from('message_read_receipts').upsert({
        'message_id': messageId,
        'user_id': userId,
        'read_at': DateTime.now().toIso8601String(),
      });
    }, operationName: 'markMessageAsRead');
  }

  /// Fetch read receipts for messages with batched queries.
  Future<Map<String, List<String>>> fetchReadReceipts(List<String> messageIds) async {
    final Map<String, List<String>> result = {};
    if (messageIds.isEmpty) return result;

    // Process in batches
    const batchSize = 100;
    final batches = <List<String>>[];
    for (var i = 0; i < messageIds.length; i += batchSize) {
      batches.add(messageIds.sublist(
        i,
        i + batchSize > messageIds.length ? messageIds.length : i + batchSize,
      ));
    }

    for (final batch in batches) {
      final queryResult = await execute(() async {
        final rows = await _client
            .from('message_read_receipts')
            .select('message_id, user_id')
            .inFilter('message_id', batch)
            .limit(batch.length * 20); // Max ~20 readers per message

        for (final row in rows) {
          final msgId = row['message_id'] as String;
          final userId = row['user_id'] as String;
          result.putIfAbsent(msgId, () => []).add(userId);
        }
        return true;
      }, operationName: 'fetchReadReceipts.batch');

      if (queryResult is! Success) break;
    }

    return result;
  }

  // ============================================================
  // UNREAD COUNTS
  // ============================================================

  Future<int> fetchUnreadCount(String channelId) async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return 0;

    final result = await execute(() async {
      final membership = await _client
          .from('channel_members')
          .select('last_read_at')
          .eq('channel_id', channelId)
          .eq('user_id', userId)
          .maybeSingle();

      final lastReadAt = membership?['last_read_at'] as String?;

      var query = _client
          .from(messagesTable)
          .select()
          .eq('channel_id', channelId)
          .neq('sender_id', userId);

      if (lastReadAt != null) {
        query = query.gt('sent_at', lastReadAt);
      }

      final rows = await query;
      return (rows as List).length;
    }, operationName: 'fetchUnreadCount');

    return result is Success<int> ? result.data : 0;
  }

  Future<Map<String, int>> fetchUnreadCounts(List<String> channelIds) async {
    final Map<String, int> result = {for (final id in channelIds) id: 0};
    if (channelIds.isEmpty) return result;

    for (final channelId in channelIds) {
      result[channelId] = await fetchUnreadCount(channelId);
    }
    return result;
  }

  Future<void> updateChannelLastRead(String channelId) async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return;

    await execute(() async {
      await _client.from('channel_members').upsert({
        'channel_id': channelId,
        'user_id': userId,
        'last_read_at': DateTime.now().toIso8601String(),
      });
    }, operationName: 'updateChannelLastRead');
  }

  Future<void> markChannelsAsRead(List<String> channelIds) async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null || channelIds.isEmpty) return;

    await execute(() async {
      final now = DateTime.now().toIso8601String();
      final batch = channelIds.map((channelId) => {
        'channel_id': channelId,
        'user_id': userId,
        'last_read_at': now,
      }).toList();

      await _client.from('channel_members').upsert(batch);
      logInfo('Marked channels as read', metadata: {'count': channelIds.length});
    }, operationName: 'markChannelsAsRead');
  }

  // ============================================================
  // SEARCH
  // ============================================================

  Future<List<Message>> searchChannelMessages({
    required String channelId,
    required String query,
    String filter = 'all',
  }) async {
    if (query.trim().isEmpty && filter == 'all') return [];

    final result = await execute(() async {
      var queryBuilder = _client
          .from(messagesTable)
          .select()
          .eq('channel_id', channelId);

      if (query.trim().isNotEmpty) {
        final searchTerm = '%${query.trim()}%';
        queryBuilder = queryBuilder.or('content.ilike.$searchTerm,sender_name.ilike.$searchTerm');
      }

      if (filter == 'media') {
        queryBuilder = queryBuilder.or('content.ilike.%.jpg%,content.ilike.%.png%,content.ilike.%.gif%,content.ilike.%.mp4%');
      } else if (filter == 'links') {
        queryBuilder = queryBuilder.ilike('content', '%http%');
      }

      final rows = await queryBuilder
          .order('sent_at', ascending: false)
          .limit(50);

      return rows
          .map((r) => Message.fromJson(Map<String, dynamic>.from(r as Map)))
          .where((m) => !m.isDeleted)
          .toList();
    }, operationName: 'searchChannelMessages');

    return result is Success<List<Message>> ? result.data : [];
  }

  Future<void> clearChannelHistory(String channelId) async {
    await execute(() async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return;

      await _client.from('channel_members').upsert({
        'channel_id': channelId,
        'user_id': userId,
        'cleared_at': DateTime.now().toIso8601String(),
      });

      logInfo('Chat history cleared', metadata: {'channel_id': channelId});
    }, operationName: 'clearChannelHistory');
  }
}
