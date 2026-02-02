import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/utils/result.dart';

/// Service for triggering push notifications via Supabase Edge Functions
/// Used to send notifications for messages, mentions, reactions, etc.
class ChatNotificationTrigger extends BaseService {
  static ChatNotificationTrigger? _instance;
  static ChatNotificationTrigger get instance => _instance ??= ChatNotificationTrigger._();
  ChatNotificationTrigger._();

  @override
  String get tag => 'ChatNotification';

  static const String _functionName = 'trigger-chat-notification';
  
  /// Trigger notification for a new message
  Future<Result<bool>> notifyNewMessage({
    required String channelId,
    required String messageId,
    required String senderName,
    String? senderAvatar,
    String? messagePreview,
    String? groupId,
    String? groupName,
  }) => execute(() async {
    return _triggerNotification({
      'event_type': 'new_message',
      'channel_id': channelId,
      'message_id': messageId,
      'sender_id': SupabaseConfig.auth.currentUser?.id ?? '',
      'sender_name': senderName,
      'sender_avatar': senderAvatar,
      'message_preview': messagePreview,
      'group_id': groupId,
      'group_name': groupName,
    });
  }, operationName: 'notifyNewMessage');
  
  /// Trigger notification for mentions
  Future<Result<bool>> notifyMention({
    required String channelId,
    required String messageId,
    required List<String> mentionedUserIds,
    required String senderName,
    String? senderAvatar,
    String? messagePreview,
  }) => execute(() async {
    if (mentionedUserIds.isEmpty) return true;
    
    return _triggerNotification({
      'event_type': 'mention',
      'channel_id': channelId,
      'message_id': messageId,
      'sender_id': SupabaseConfig.auth.currentUser?.id ?? '',
      'sender_name': senderName,
      'sender_avatar': senderAvatar,
      'message_preview': messagePreview,
      'mentioned_user_ids': mentionedUserIds,
    });
  }, operationName: 'notifyMention');
  
  /// Trigger notification for reactions
  Future<Result<bool>> notifyReaction({
    required String channelId,
    required String messageId,
    required String emoji,
    required String senderName,
    String? senderAvatar,
    String? messagePreview,
  }) => execute(() async {
    return _triggerNotification({
      'event_type': 'reaction',
      'channel_id': channelId,
      'message_id': messageId,
      'sender_id': SupabaseConfig.auth.currentUser?.id ?? '',
      'sender_name': senderName,
      'sender_avatar': senderAvatar,
      'reaction_emoji': emoji,
      'message_preview': messagePreview,
    });
  }, operationName: 'notifyReaction');
  
  /// Trigger notification for group invites
  Future<Result<bool>> notifyGroupInvite({
    required List<String> invitedUserIds,
    required String groupId,
    required String groupName,
    required String senderName,
    String? senderAvatar,
  }) => execute(() async {
    if (invitedUserIds.isEmpty) return true;
    
    return _triggerNotification({
      'event_type': 'group_invite',
      'channel_id': groupId,
      'sender_id': SupabaseConfig.auth.currentUser?.id ?? '',
      'sender_name': senderName,
      'sender_avatar': senderAvatar,
      'mentioned_user_ids': invitedUserIds,
      'group_id': groupId,
      'group_name': groupName,
    });
  }, operationName: 'notifyGroupInvite');
  
  /// Send direct push notification to specific users
  Future<Result<bool>> sendDirectPush({
    required List<String> userIds,
    required String title,
    required String body,
    String? type,
    String? channelId,
    String? actionUrl,
    Map<String, dynamic>? extraData,
  }) => execute(() async {
    final response = await SupabaseConfig.client.functions.invoke(
      'send-push-notification',
      body: {
        'user_ids': userIds,
        'title': title,
        'body': body,
        'data': {
          'type': type ?? 'system',
          'channel_id': channelId,
          'action_url': actionUrl,
          ...?extraData,
        },
      },
    );
    
    if (response.status >= 200 && response.status < 300) {
      final data = response.data;
      logInfo('Direct push sent', metadata: {'delivered': data['sent']});
      return true;
    } else {
      logWarning('Direct push failed', metadata: {'status': response.status});
      return false;
    }
  }, operationName: 'sendDirectPush');
  
  /// Internal method to trigger notifications via edge function
  Future<bool> _triggerNotification(Map<String, dynamic> payload) async {
    try {
      final response = await SupabaseConfig.client.functions.invoke(
        _functionName,
        body: payload,
      );
      
      if (response.status >= 200 && response.status < 300) {
        final data = response.data;
        logDebug('Notification triggered', metadata: {
          'eventType': data['event_type'],
          'eligibleUsers': data['eligible_users'],
        });
        return true;
      } else {
        logWarning('Failed to trigger notification', metadata: {'status': response.status});
        return false;
      }
    } catch (e) {
      logError('Error triggering notification', error: e);
      return false;
    }
  }
  
  /// Extract mentions from message content (e.g., @username patterns)
  static List<String> extractMentions(String content, Map<String, String> usernameToIdMap) {
    final mentionPattern = RegExp(r'@(\w+)');
    final matches = mentionPattern.allMatches(content);
    
    final mentionedIds = <String>[];
    for (final match in matches) {
      final username = match.group(1);
      if (username != null && usernameToIdMap.containsKey(username.toLowerCase())) {
        mentionedIds.add(usernameToIdMap[username.toLowerCase()]!);
      }
    }
    
    return mentionedIds;
  }
}

/// Extension to integrate notifications into chat service
extension ChatNotificationExtension on String {
  /// Truncate message for notification preview
  String toNotificationPreview({int maxLength = 80}) {
    final cleaned = replaceAll(RegExp(r'\s+'), ' ').trim();
    if (cleaned.length <= maxLength) return cleaned;
    return '${cleaned.substring(0, maxLength - 3)}...';
  }
  
  /// Check if message contains mentions
  bool containsMentions() {
    return contains(RegExp(r'@\w+'));
  }
}
