import 'package:thittam1hub/models/share_destination.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/services/chat_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/utils/result.dart';

/// Service for forwarding messages to multiple destinations
class MessageForwardingService extends BaseService {
  static MessageForwardingService? _instance;
  static MessageForwardingService get instance => _instance ??= MessageForwardingService._();
  MessageForwardingService._();

  @override
  String get tag => 'MessageForwarding';

  static final _supabase = SupabaseConfig.client;

  /// Forward a message to a single destination
  Future<Result<bool>> forwardToDestination({
    required Message message,
    required ShareDestination destination,
  }) => execute(() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return false;

    // Build forwarded message content
    final forwardedContent = _buildForwardedContent(message);
    
    // Build attachments with forward metadata
    final attachments = _buildForwardedAttachments(message);

    switch (destination.type) {
      case ShareDestinationType.dm:
        await _supabase.from('messages').insert({
          'channel_id': ChatService.dmChannelIdFor(userId, destination.id),
          'sender_id': userId,
          'content': forwardedContent,
          'attachments': attachments,
        });
        logDbOperation('INSERT', 'messages', rowCount: 1);
        break;

      case ShareDestinationType.group:
        await _supabase.from('messages').insert({
          'channel_id': 'group_${destination.id}',
          'sender_id': userId,
          'content': forwardedContent,
          'attachments': attachments,
        });
        logDbOperation('INSERT', 'messages', rowCount: 1);
        break;

      case ShareDestinationType.channel:
        await _supabase.from('channel_messages').insert({
          'channel_id': destination.id,
          'sender_id': userId,
          'content': forwardedContent,
          'attachments': attachments,
        });
        logDbOperation('INSERT', 'channel_messages', rowCount: 1);
        break;
    }

    logInfo('Message forwarded', metadata: {
      'destinationType': destination.type.name,
      'destinationId': destination.id,
    });
    return true;
  }, operationName: 'forwardToDestination');

  /// Forward to multiple destinations at once
  Future<Result<Map<String, bool>>> forwardToMultipleDestinations({
    required Message message,
    required List<ShareDestination> destinations,
  }) => execute(() async {
    final results = <String, bool>{};

    await Future.wait(
      destinations.map((dest) async {
        final result = await forwardToDestination(
          message: message,
          destination: dest,
        );
        results[dest.id] = result is Success;
      }),
    );

    logInfo('Batch forward completed', metadata: {
      'total': destinations.length,
      'successful': results.values.where((v) => v).length,
    });
    return results;
  }, operationName: 'forwardToMultipleDestinations');

  /// Build content string for forwarded message
  String _buildForwardedContent(Message message) {
    final parts = <String>[];
    
    // Add forwarded header
    parts.add('↪️ Forwarded from ${message.senderName}');
    parts.add('');
    
    // Add original message content
    if (message.content.isNotEmpty) {
      parts.add(message.content);
    }
    
    // Add attachment info if content is empty but has attachments
    if (message.content.isEmpty && message.attachments.isNotEmpty) {
      final count = message.attachments.length;
      parts.add('[${count} attachment${count != 1 ? 's' : ''}]');
    }

    return parts.join('\n');
  }

  /// Build attachments array with forward metadata
  List<Map<String, dynamic>> _buildForwardedAttachments(Message message) {
    final attachments = <Map<String, dynamic>>[];
    
    // Add forward metadata
    attachments.add({
      'type': 'forwarded_message',
      'original_message_id': message.id,
      'original_sender_name': message.senderName,
      'original_sender_avatar': message.senderAvatar,
      'original_sent_at': message.sentAt.toIso8601String(),
      'original_content': message.content,
    });

    // Copy original attachments
    for (final att in message.attachments) {
      attachments.add({
        'type': att.type,
        'filename': att.filename,
        'url': att.url,
        'size': att.size,
        // MessageAttachment doesn't have mimeType - infer from type
      });
    }

    return attachments;
  }
}
