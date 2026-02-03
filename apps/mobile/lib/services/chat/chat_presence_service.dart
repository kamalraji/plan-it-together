import 'dart:async';

import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/services/chat_security_service.dart';
import 'package:thittam1hub/utils/result.dart';

/// Domain-focused service for chat presence operations.
/// 
/// Handles: online status, typing indicators, heartbeat, last seen.
/// Respects user privacy settings (hideTypingIndicator).
class ChatPresenceService extends BaseService {
  static ChatPresenceService? _instance;
  static ChatPresenceService get instance => _instance ??= ChatPresenceService._();
  ChatPresenceService._();

  @override
  String get tag => 'ChatPresenceService';

  static const String profilesTable = 'user_profiles';

  SupabaseClient get _client => SupabaseConfig.client;

  // ============================================================
  // ONLINE/OFFLINE STATUS
  // ============================================================

  /// Update current user's online status
  Future<void> updateOnlineStatus(bool isOnline) async {
    await execute(() async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return;

      await _client.from(profilesTable).update({
        'is_online': isOnline,
        'last_seen': isOnline ? null : DateTime.now().toIso8601String(),
      }).eq('id', userId);

      logDebug('Online status set', metadata: {'is_online': isOnline});
    }, operationName: 'updateOnlineStatus');
  }

  /// Refresh heartbeat for current user
  Future<void> refreshHeartbeat() async {
    await execute(() async {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return;

      await _client.from(profilesTable).update({
        'last_seen': DateTime.now().toIso8601String(),
      }).eq('id', userId);
    }, operationName: 'refreshHeartbeat');
  }

  /// Stream a user's online status
  Stream<bool> getUserOnlineStream(String userId) {
    try {
      return _client
          .from(profilesTable)
          .stream(primaryKey: ['id'])
          .eq('id', userId)
          .map((rows) => rows.firstOrNull?['is_online'] == true);
    } catch (e) {
      logError('getUserOnlineStream failed', error: e);
      return const Stream.empty();
    }
  }

  /// Get last seen timestamp for a user
  Future<DateTime?> fetchLastSeen(String userId) async {
    final result = await execute(() async {
      final row = await _client
          .from(profilesTable)
          .select('last_seen, is_online')
          .eq('id', userId)
          .maybeSingle();

      if (row == null) return null;
      if (row['is_online'] == true) return null;

      final lastSeen = row['last_seen'] as String?;
      return lastSeen != null ? DateTime.tryParse(lastSeen) : null;
    }, operationName: 'fetchLastSeen');

    return result is Success<DateTime?> ? result.data : null;
  }

  /// Check if a user is currently online
  Future<bool> checkUserOnline(String userId) async {
    final result = await execute(() async {
      final row = await _client
          .from(profilesTable)
          .select('is_online')
          .eq('id', userId)
          .maybeSingle();

      return row?['is_online'] == true;
    }, operationName: 'checkUserOnline');

    return result is Success<bool> ? result.data : false;
  }

  /// Batch check online status for multiple users
  Future<Map<String, bool>> batchCheckOnline(List<String> userIds) async {
    final Map<String, bool> result = {for (final id in userIds) id: false};
    if (userIds.isEmpty) return result;

    final queryResult = await execute(() async {
      final rows = await _client
          .from(profilesTable)
          .select('id, is_online')
          .inFilter('id', userIds);

      for (final row in rows) {
        final id = row['id'] as String;
        result[id] = row['is_online'] == true;
      }
      return result;
    }, operationName: 'batchCheckOnline');

    return queryResult is Success ? (queryResult as Success).data : result;
  }

  // ============================================================
  // TYPING INDICATORS
  // ============================================================

  /// Get a typing channel for a conversation
  RealtimeChannel typingChannel(String channelId) =>
      _client.channel('typing:$channelId');

  /// Broadcast typing indicator
  /// Respects user's hideTypingIndicator privacy setting
  Future<void> broadcastTyping(String channelId, {required String name, required String userId}) async {
    try {
      // Check if user has disabled typing indicators in privacy settings
      final securityResult = await ChatSecurityService.instance.getSecuritySettings();
      if (securityResult.isSuccess && securityResult.data.hideTypingIndicator) {
        logDebug('Typing broadcast skipped - hideTypingIndicator enabled');
        return;
      }
      
      final ch = _client.channel('typing:$channelId');
      await ch.sendBroadcastMessage(event: 'typing', payload: {
        'userId': userId,
        'name': name,
        'ts': DateTime.now().toIso8601String(),
      });
    } catch (e) {
      logWarning('broadcastTyping failed', error: e);
    }
  }

  /// Subscribe to typing events for a channel
  Stream<Map<String, dynamic>> subscribeToTyping(String channelId) {
    final controller = StreamController<Map<String, dynamic>>.broadcast();

    try {
      final ch = _client.channel('typing:$channelId');

      ch.onBroadcast(
        event: 'typing',
        callback: (payload) {
          try {
            if (payload is Map) {
              controller.add(Map<String, dynamic>.from(payload));
            } else {
              controller.add({'payload': payload});
            }
          } catch (e) {
            // Don't terminate the stream on malformed payloads
            logWarning('Typing payload parse failed', error: e);
          }
        },
      );

      ch.subscribe();

      controller.onCancel = () async {
        try {
          await ch.unsubscribe();
        } catch (_) {
          // ignore
        }
        await controller.close();
      };
    } catch (e) {
      logError('subscribeToTyping failed', error: e);
      // Ensure callers don't hang waiting for events.
      Future.microtask(() async {
        await controller.close();
      });
    }

    return controller.stream;
  }
}
