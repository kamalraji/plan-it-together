import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/utils/result.dart';
import '../models/chat_security_models.dart';

/// Service for managing chat privacy and security features
class ChatSecurityService extends BaseService {
  @override
  String get tag => 'ChatSecurity';
  
  static ChatSecurityService? _instance;
  static ChatSecurityService get instance => _instance ??= ChatSecurityService._();
  ChatSecurityService._();
  
  static final _supabase = Supabase.instance.client;

  // ==================== Disappearing Messages ====================

  /// Get disappearing message settings for a channel
  Future<Result<DisappearingMessageSettings?>> getDisappearingSettings(
      String channelId) => execute(
    () async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return null;

      final response = await _supabase
          .from('disappearing_message_settings')
          .select()
          .eq('channel_id', channelId)
          .eq('user_id', userId)
          .maybeSingle();

      if (response == null) return null;
      return DisappearingMessageSettings.fromJson(response);
    },
    operationName: 'getDisappearingSettings',
  );

  /// Set disappearing message timer for a channel
  Future<Result<void>> setDisappearingTimer({
    required String channelId,
    required int durationSeconds,
    required bool enabled,
  }) => execute(
    () async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      await _supabase.from('disappearing_message_settings').upsert({
        'channel_id': channelId,
        'user_id': userId,
        'duration_seconds': durationSeconds,
        'enabled': enabled,
        'updated_at': DateTime.now().toIso8601String(),
      }, onConflict: 'channel_id,user_id');
      
      logDbOperation('UPSERT', 'disappearing_message_settings', rowCount: 1);
    },
    operationName: 'setDisappearingTimer',
  );

  /// Disable disappearing messages for a channel
  Future<Result<void>> disableDisappearingMessages(String channelId) => execute(
    () async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      await _supabase
          .from('disappearing_message_settings')
          .delete()
          .eq('channel_id', channelId)
          .eq('user_id', userId);
      
      logDbOperation('DELETE', 'disappearing_message_settings', rowCount: 1);
    },
    operationName: 'disableDisappearingMessages',
  );

  // ==================== Message Reporting ====================

  /// Report a message
  Future<Result<void>> reportMessage({
    required String messageId,
    required MessageReportReason reason,
    String? reportedUserId,
    String? details,
  }) => execute(
    () async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      await _supabase.from('message_reports').insert({
        'message_id': messageId,
        'reporter_id': userId,
        'reported_user_id': reportedUserId,
        'reason': reason.name,
        'details': details,
      });
      
      logDbOperation('INSERT', 'message_reports', rowCount: 1);
    },
    operationName: 'reportMessage',
  );

  /// Get user's submitted reports
  Future<Result<List<MessageReport>>> getMyReports() => execute(
    () async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return [];

      final response = await _supabase
          .from('message_reports')
          .select()
          .eq('reporter_id', userId)
          .order('created_at', ascending: false);

      logDbOperation('SELECT', 'message_reports', rowCount: (response as List).length);
      return response
          .map((json) => MessageReport.fromJson(json))
          .toList();
    },
    operationName: 'getMyReports',
  );

  /// Check if a message has been reported by current user
  Future<Result<bool>> hasReported(String messageId) => execute(
    () async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return false;

      final response = await _supabase
          .from('message_reports')
          .select('id')
          .eq('message_id', messageId)
          .eq('reporter_id', userId)
          .maybeSingle();

      return response != null;
    },
    operationName: 'hasReported',
  );

  // ==================== Security Settings ====================

  /// Get chat security settings for current user
  Future<Result<ChatSecuritySettings>> getSecuritySettings() => execute(
    () async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      final response = await _supabase
          .from('chat_security_settings')
          .select()
          .eq('user_id', userId)
          .maybeSingle();

      if (response == null) return ChatSecuritySettings.empty(userId);
      return ChatSecuritySettings.fromJson(response);
    },
    operationName: 'getSecuritySettings',
  );

  /// Update chat security settings
  Future<Result<void>> updateSecuritySettings(
      ChatSecuritySettings settings) => execute(
    () async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      await _supabase.from('chat_security_settings').upsert({
        ...settings.toJson(),
        'updated_at': DateTime.now().toIso8601String(),
      }, onConflict: 'user_id');
      
      logDbOperation('UPSERT', 'chat_security_settings', rowCount: 1);
    },
    operationName: 'updateSecuritySettings',
  );

  /// Toggle app lock
  Future<Result<void>> setAppLock({
    required bool enabled,
    bool? requireBiometric,
    int? timeoutMinutes,
  }) => execute(
    () async {
      final result = await getSecuritySettings();
      if (!result.isSuccess) throw Exception('Failed to get settings');
      
      final current = result.data;
      final updateResult = await updateSecuritySettings(current.copyWith(
        appLockEnabled: enabled,
        requireBiometric: requireBiometric,
        lockTimeoutMinutes: timeoutMinutes,
      ));
      
      if (!updateResult.isSuccess) throw Exception('Failed to update settings');
    },
    operationName: 'setAppLock',
  );

  /// Toggle screenshot protection
  Future<Result<void>> setScreenshotProtection(bool enabled) => execute(
    () async {
      final result = await getSecuritySettings();
      if (!result.isSuccess) throw Exception('Failed to get settings');

      final updateResult = await updateSecuritySettings(result.data.copyWith(
        screenshotProtection: enabled,
      ));
      
      if (!updateResult.isSuccess) throw Exception('Failed to update settings');
    },
    operationName: 'setScreenshotProtection',
  );

  /// Toggle incognito keyboard
  Future<Result<void>> setIncognitoKeyboard(bool enabled) => execute(
    () async {
      final result = await getSecuritySettings();
      if (!result.isSuccess) throw Exception('Failed to get settings');

      final updateResult = await updateSecuritySettings(result.data.copyWith(
        incognitoKeyboard: enabled,
      ));
      
      if (!updateResult.isSuccess) throw Exception('Failed to update settings');
    },
    operationName: 'setIncognitoKeyboard',
  );

  /// Toggle hide typing indicator
  Future<Result<void>> setHideTypingIndicator(bool enabled) => execute(
    () async {
      final result = await getSecuritySettings();
      if (!result.isSuccess) throw Exception('Failed to get settings');

      final updateResult = await updateSecuritySettings(result.data.copyWith(
        hideTypingIndicator: enabled,
      ));
      
      if (!updateResult.isSuccess) throw Exception('Failed to update settings');
    },
    operationName: 'setHideTypingIndicator',
  );

  /// Toggle hide read receipts
  Future<Result<void>> setHideReadReceipts(bool enabled) => execute(
    () async {
      final result = await getSecuritySettings();
      if (!result.isSuccess) throw Exception('Failed to get settings');

      final updateResult = await updateSecuritySettings(result.data.copyWith(
        hideReadReceipts: enabled,
      ));
      
      if (!updateResult.isSuccess) throw Exception('Failed to update settings');
    },
    operationName: 'setHideReadReceipts',
  );

  /// Toggle screenshot notifications
  Future<Result<void>> setScreenshotNotify(bool enabled) => execute(
    () async {
      final result = await getSecuritySettings();
      if (!result.isSuccess) throw Exception('Failed to get settings');

      final updateResult = await updateSecuritySettings(result.data.copyWith(
        screenshotNotify: enabled,
      ));
      
      if (!updateResult.isSuccess) throw Exception('Failed to update settings');
    },
    operationName: 'setScreenshotNotify',
  );

  // ==================== User Blocking ====================

  /// Check if a user is blocked (uses security definer function)
  Future<Result<bool>> isBlocked(String targetUserId) => execute(
    () async {
      final response = await _supabase
          .rpc('check_blocked_status', params: {'target_user_id': targetUserId});
      return response as bool? ?? false;
    },
    operationName: 'isBlocked',
  );

  /// Block a user
  Future<Result<void>> blockUser(String targetUserId) => execute(
    () async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      await _supabase.from('blocked_users').insert({
        'user_id': userId,
        'blocked_user_id': targetUserId,
      });
      
      logDbOperation('INSERT', 'blocked_users', rowCount: 1);
    },
    operationName: 'blockUser',
  );

  /// Unblock a user
  Future<Result<void>> unblockUser(String targetUserId) => execute(
    () async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      await _supabase
          .from('blocked_users')
          .delete()
          .eq('user_id', userId)
          .eq('blocked_user_id', targetUserId);
      
      logDbOperation('DELETE', 'blocked_users', rowCount: 1);
    },
    operationName: 'unblockUser',
  );

  /// Get list of blocked users
  Future<Result<List<String>>> getBlockedUsers() => execute(
    () async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return [];

      final response = await _supabase
          .from('blocked_users')
          .select('blocked_user_id')
          .eq('user_id', userId);

      logDbOperation('SELECT', 'blocked_users', rowCount: (response as List).length);
      return response
          .map((json) => json['blocked_user_id'] as String)
          .toList();
    },
    operationName: 'getBlockedUsers',
  );

  // ==================== Message Deletion ====================

  /// Delete message for current user only (soft delete)
  Future<Result<void>> deleteMessageForMe(String messageId) => execute(
    () async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      // Mark as deleted for this user (add to deleted_for array or separate table)
      // This is a simplified implementation
      await _supabase.from('messages').update({
        'deleted_for': [userId],
      }).eq('id', messageId);
      
      logDbOperation('UPDATE', 'messages', rowCount: 1);
    },
    operationName: 'deleteMessageForMe',
  );

  /// Delete message for everyone (if sender and within time limit)
  Future<Result<bool>> deleteMessageForEveryone(String messageId) => execute(
    () async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return false;

      // Check if user is the sender and within deletion window (e.g., 1 hour)
      final message = await _supabase
          .from('messages')
          .select('sender_id, created_at')
          .eq('id', messageId)
          .single();

      if (message['sender_id'] != userId) return false;

      final createdAt = DateTime.parse(message['created_at']);
      final hourAgo = DateTime.now().subtract(const Duration(hours: 1));
      if (createdAt.isBefore(hourAgo)) return false;

      // Soft delete the message
      await _supabase.from('messages').update({
        'content': 'This message was deleted',
        'deleted_at': DateTime.now().toIso8601String(),
        'attachments': null,
      }).eq('id', messageId);

      logInfo('Message deleted for everyone');
      return true;
    },
    operationName: 'deleteMessageForEveryone',
  );

  // ==================== Data Export ====================

  /// Export chat data as JSON
  Future<Result<Map<String, dynamic>>> exportChatData(String channelId) => execute(
    () async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return {};

      final messages = await _supabase
          .from('messages')
          .select()
          .eq('channel_id', channelId)
          .order('created_at', ascending: true);

      logInfo('Chat data exported', metadata: {'messageCount': (messages as List).length});
      
      return {
        'channel_id': channelId,
        'exported_at': DateTime.now().toIso8601String(),
        'exported_by': userId,
        'message_count': messages.length,
        'messages': messages,
      };
    },
    operationName: 'exportChatData',
  );

  /// Clear all chat data for current user
  Future<Result<void>> clearAllChatData() => execute(
    () async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      // Clear security settings
      await _supabase
          .from('chat_security_settings')
          .delete()
          .eq('user_id', userId);

      // Clear disappearing message settings
      await _supabase
          .from('disappearing_message_settings')
          .delete()
          .eq('user_id', userId);

      // Clear reports
      await _supabase
          .from('message_reports')
          .delete()
          .eq('reporter_id', userId);
      
      logInfo('All chat data cleared');
    },
    operationName: 'clearAllChatData',
  );
}
