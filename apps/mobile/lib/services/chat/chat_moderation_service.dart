import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/services/pagination_mixin.dart';
import 'package:thittam1hub/utils/result.dart';

/// Domain-focused service for chat moderation operations.
/// 
/// Handles: blocking, muting, pinned/starred messages, archived chats.
/// Uses controlled limits for user-specific data fetching.
class ChatModerationService extends BaseService with PaginationMixin {
  static ChatModerationService? _instance;
  static ChatModerationService get instance => _instance ??= ChatModerationService._();
  ChatModerationService._();

  @override
  String get tag => 'ChatModerationService';

  static const String messagesTable = 'messages';

  SupabaseClient get _client => SupabaseConfig.client;

  // ============================================================
  // USER BLOCKING
  // ============================================================

  Future<void> blockUserById(String targetUserId) async {
    await execute(() async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return;

      await _client.from('blocked_users').upsert({
        'user_id': userId,
        'blocked_user_id': targetUserId,
        'blocked_at': DateTime.now().toIso8601String(),
      });

      logInfo('User blocked', metadata: {'target': targetUserId});
    }, operationName: 'blockUserById');
  }

  Future<void> unblockUserById(String targetUserId) async {
    await execute(() async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return;

      await _client
          .from('blocked_users')
          .delete()
          .eq('user_id', userId)
          .eq('blocked_user_id', targetUserId);

      logInfo('User unblocked', metadata: {'target': targetUserId});
    }, operationName: 'unblockUserById');
  }

  Future<bool> checkUserBlocked(String targetUserId) async {
    final result = await execute(() async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return false;

      final row = await _client
          .from('blocked_users')
          .select()
          .eq('user_id', userId)
          .eq('blocked_user_id', targetUserId)
          .maybeSingle();

      return row != null;
    }, operationName: 'checkUserBlocked');

    return result is Success<bool> ? result.data : false;
  }

  /// Fetch blocked user IDs with reasonable limit.
  Future<List<String>> fetchBlockedUserIds() async {
    final result = await execute(() async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return <String>[];

      // Use normalized page size (max 200) instead of arbitrary 500
      final rows = await _client
          .from('blocked_users')
          .select('blocked_user_id')
          .eq('user_id', userId)
          .limit(normalizePageSize(null)); // Default 50, max 200

      return rows.map((r) => r['blocked_user_id'] as String).toList();
    }, operationName: 'fetchBlockedUserIds');

    return result is Success<List<String>> ? result.data : [];
  }

  // ============================================================
  // CONVERSATION MUTING
  // ============================================================

  Future<void> muteChannel(String channelId, {Duration? duration}) async {
    await execute(() async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return;

      final mutedUntil = duration != null
          ? DateTime.now().add(duration).toIso8601String()
          : null;

      await _client.from('channel_members').upsert({
        'channel_id': channelId,
        'user_id': userId,
        'muted_until': mutedUntil,
        'is_muted': true,
      });

      logInfo('Conversation muted', metadata: {'channel_id': channelId});
    }, operationName: 'muteChannel');
  }

  Future<void> unmuteChannel(String channelId) async {
    await execute(() async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return;

      await _client.from('channel_members').update({
        'is_muted': false,
        'muted_until': null,
      }).eq('channel_id', channelId).eq('user_id', userId);

      logInfo('Conversation unmuted', metadata: {'channel_id': channelId});
    }, operationName: 'unmuteChannel');
  }

  Future<bool> checkChannelMuted(String channelId) async {
    final result = await execute(() async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return false;

      final row = await _client
          .from('channel_members')
          .select('is_muted, muted_until')
          .eq('channel_id', channelId)
          .eq('user_id', userId)
          .maybeSingle();

      if (row == null) return false;
      if (row['is_muted'] != true) return false;

      final mutedUntil = row['muted_until'] as String?;
      if (mutedUntil != null) {
        final expiresAt = DateTime.tryParse(mutedUntil);
        if (expiresAt != null && expiresAt.isBefore(DateTime.now())) {
          await unmuteChannel(channelId);
          return false;
        }
      }

      return true;
    }, operationName: 'checkChannelMuted');

    return result is Success<bool> ? result.data : false;
  }

  Future<Map<String, bool>> fetchMuteStatuses(List<String> channelIds) async {
    final Map<String, bool> result = {for (final id in channelIds) id: false};
    if (channelIds.isEmpty) return result;

    final queryResult = await execute(() async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return result;

      final rows = await _client
          .from('channel_members')
          .select('channel_id, is_muted, muted_until')
          .eq('user_id', userId)
          .inFilter('channel_id', channelIds);

      for (final row in rows) {
        final chId = row['channel_id'] as String;
        final isMuted = row['is_muted'] == true;
        final mutedUntil = row['muted_until'] as String?;

        if (isMuted) {
          if (mutedUntil != null) {
            final expiresAt = DateTime.tryParse(mutedUntil);
            result[chId] = expiresAt == null || expiresAt.isAfter(DateTime.now());
          } else {
            result[chId] = true;
          }
        }
      }
      return result;
    }, operationName: 'fetchMuteStatuses');

    return queryResult is Success ? (queryResult as Success).data : result;
  }

  // ============================================================
  // PINNED MESSAGES
  // ============================================================

  Future<void> pinChannelMessage(String channelId, String messageId) async {
    await execute(() async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return;

      await _client.from('pinned_messages').insert({
        'channel_id': channelId,
        'message_id': messageId,
        'pinned_by': userId,
      });

      logInfo('Message pinned');
    }, operationName: 'pinChannelMessage');
  }

  Future<void> unpinChannelMessage(String channelId, String messageId) async {
    await execute(() async {
      await _client
          .from('pinned_messages')
          .delete()
          .eq('channel_id', channelId)
          .eq('message_id', messageId);

      logInfo('Message unpinned');
    }, operationName: 'unpinChannelMessage');
  }

  Future<List<Message>> fetchPinnedMessages(String channelId) async {
    final result = await execute(() async {
      final rows = await _client
          .from('pinned_messages')
          .select('message_id')
          .eq('channel_id', channelId)
          .order('pinned_at', ascending: false)
          .limit(50);

      final messageIds = rows.map((r) => r['message_id'] as String).toList();
      if (messageIds.isEmpty) return <Message>[];

      final messages = await _client
          .from(messagesTable)
          .select()
          .inFilter('id', messageIds)
          .limit(50);

      return messages
          .map((m) => Message.fromJson(Map<String, dynamic>.from(m as Map)))
          .toList();
    }, operationName: 'fetchPinnedMessages');

    return result is Success<List<Message>> ? result.data : [];
  }

  Future<bool> checkMessagePinned(String channelId, String messageId) async {
    final result = await execute(() async {
      final row = await _client
          .from('pinned_messages')
          .select()
          .eq('channel_id', channelId)
          .eq('message_id', messageId)
          .maybeSingle();

      return row != null;
    }, operationName: 'checkMessagePinned');

    return result is Success<bool> ? result.data : false;
  }

  // ============================================================
  // STARRED MESSAGES
  // ============================================================

  Future<void> starMessageById(String messageId) async {
    await execute(() async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return;

      await _client.from('starred_messages').insert({
        'user_id': userId,
        'message_id': messageId,
      });

      logInfo('Message starred');
    }, operationName: 'starMessageById');
  }

  Future<void> unstarMessageById(String messageId) async {
    await execute(() async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return;

      await _client
          .from('starred_messages')
          .delete()
          .eq('user_id', userId)
          .eq('message_id', messageId);

      logInfo('Message unstarred');
    }, operationName: 'unstarMessageById');
  }

  Future<List<Message>> fetchStarredMessages() async {
    final result = await execute(() async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return <Message>[];

      final rows = await _client
          .from('starred_messages')
          .select('message_id')
          .eq('user_id', userId)
          .order('starred_at', ascending: false)
          .limit(100);

      final messageIds = rows.map((r) => r['message_id'] as String).toList();
      if (messageIds.isEmpty) return <Message>[];

      final messages = await _client
          .from(messagesTable)
          .select()
          .inFilter('id', messageIds)
          .limit(100);

      return messages
          .map((m) => Message.fromJson(Map<String, dynamic>.from(m as Map)))
          .toList();
    }, operationName: 'fetchStarredMessages');

    return result is Success<List<Message>> ? result.data : [];
  }

  Future<bool> checkMessageStarred(String messageId) async {
    final result = await execute(() async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return false;

      final row = await _client
          .from('starred_messages')
          .select()
          .eq('user_id', userId)
          .eq('message_id', messageId)
          .maybeSingle();

      return row != null;
    }, operationName: 'checkMessageStarred');

    return result is Success<bool> ? result.data : false;
  }

  /// Fetch starred message IDs with reasonable limit.
  Future<Set<String>> fetchStarredMessageIds() async {
    final result = await execute(() async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return <String>{};

      // Use normalized page size for consistency
      final rows = await _client
          .from('starred_messages')
          .select('message_id')
          .eq('user_id', userId)
          .order('starred_at', ascending: false)
          .limit(normalizePageSize(200)); // Max 200 starred messages

      return rows.map((r) => r['message_id'] as String).toSet();
    }, operationName: 'fetchStarredMessageIds');

    return result is Success<Set<String>> ? result.data : {};
  }

  // ============================================================
  // PINNED & ARCHIVED CHATS
  // ============================================================

  Future<void> pinChannelChat(String channelId) async {
    await execute(() async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return;

      await _client.from('pinned_chats').upsert({
        'user_id': userId,
        'channel_id': channelId,
        'pinned_at': DateTime.now().toIso8601String(),
      });

      logInfo('Chat pinned', metadata: {'channel_id': channelId});
    }, operationName: 'pinChannelChat');
  }

  Future<void> unpinChannelChat(String channelId) async {
    await execute(() async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return;

      await _client
          .from('pinned_chats')
          .delete()
          .eq('user_id', userId)
          .eq('channel_id', channelId);

      logInfo('Chat unpinned', metadata: {'channel_id': channelId});
    }, operationName: 'unpinChannelChat');
  }

  Future<Set<String>> fetchPinnedChatIds() async {
    final result = await execute(() async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return <String>{};

      final rows = await _client
          .from('pinned_chats')
          .select('channel_id')
          .eq('user_id', userId)
          .limit(100);

      return rows.map((r) => r['channel_id'] as String).toSet();
    }, operationName: 'fetchPinnedChatIds');

    return result is Success<Set<String>> ? result.data : {};
  }

  Future<void> archiveChannelChat(String channelId) async {
    await execute(() async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return;

      await _client.from('archived_chats').upsert({
        'user_id': userId,
        'channel_id': channelId,
        'archived_at': DateTime.now().toIso8601String(),
      });

      logInfo('Chat archived', metadata: {'channel_id': channelId});
    }, operationName: 'archiveChannelChat');
  }

  Future<void> unarchiveChannelChat(String channelId) async {
    await execute(() async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return;

      await _client
          .from('archived_chats')
          .delete()
          .eq('user_id', userId)
          .eq('channel_id', channelId);

      logInfo('Chat unarchived', metadata: {'channel_id': channelId});
    }, operationName: 'unarchiveChannelChat');
  }

  /// Fetch archived chat IDs with reasonable limit.
  Future<Set<String>> fetchArchivedChatIds() async {
    final result = await execute(() async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return <String>{};

      // Use normalized page size for consistency
      final rows = await _client
          .from('archived_chats')
          .select('channel_id')
          .eq('user_id', userId)
          .order('archived_at', ascending: false)
          .limit(normalizePageSize(200)); // Max 200 archived chats

      return rows.map((r) => r['channel_id'] as String).toSet();
    }, operationName: 'fetchArchivedChatIds');

    return result is Success<Set<String>> ? result.data : {};
  }
}
