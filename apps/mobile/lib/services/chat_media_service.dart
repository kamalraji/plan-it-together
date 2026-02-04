import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/chat_media_models.dart';
import 'base_service.dart';
import '../utils/result.dart';

/// Service for fetching and managing chat media
/// 
/// Industrial best practice: Extends BaseService for standardized
/// error handling, logging, and Result<T> returns.
class ChatMediaService extends BaseService {
  @override
  String get tag => 'ChatMediaService';
  
  static ChatMediaService? _instance;
  static ChatMediaService get instance => _instance ??= ChatMediaService._();
  ChatMediaService._();
  
  final _supabase = Supabase.instance.client;

  // ==================== STATIC HELPERS ====================
  // Unwrap Result internally for simpler UI consumption

  /// Fetch media items (returns empty list on failure)
  static Future<List<ChatMediaItem>> fetchChannelMedia({
    required String channelId,
    MediaType? type,
    int limit = 50,
    int offset = 0,
  }) async {
    final result = await instance.getChannelMedia(
      channelId: channelId,
      type: type,
      limit: limit,
      offset: offset,
    );
    return result.isSuccess ? result.data : [];
  }

  /// Fetch media items for a channel with pagination
  Future<Result<List<ChatMediaItem>>> getChannelMedia({
    required String channelId,
    MediaType? type,
    int limit = 50,
    int offset = 0,
  }) => execute(
    () async {
      // Fetch messages with attachments from the channel
      final response = await _supabase
          .from('channel_messages')
          .select('id, channel_id, sender_id, sender_name, attachments, created_at')
          .eq('channel_id', channelId)
          .not('attachments', 'is', null)
          .order('created_at', ascending: false)
          .range(offset, offset + limit - 1);

      logDbOperation('SELECT', 'channel_messages', rowCount: (response as List).length);

      final List<ChatMediaItem> items = [];

      for (final message in response) {
        final attachments = message['attachments'];
        if (attachments == null) continue;

        final attachmentList = attachments is List ? attachments : [attachments];

        for (int i = 0; i < attachmentList.length; i++) {
          final attachment = attachmentList[i];
          if (attachment is! Map) continue;

          final item = _parseAttachment(
            attachment: attachment,
            messageId: message['id'],
            channelId: channelId,
            senderId: message['sender_id'],
            senderName: message['sender_name'],
            createdAt: message['created_at'],
            index: i,
          );

          if (item != null) {
            if (type == null || item.type == type) {
              items.add(item);
            }
          }
        }
      }

      return items;
    },
    operationName: 'getChannelMedia',
  );

  /// Parse a single attachment into a ChatMediaItem
  ChatMediaItem? _parseAttachment({
    required Map attachment,
    required String messageId,
    required String channelId,
    required String senderId,
    String? senderName,
    required String createdAt,
    required int index,
  }) {
    try {
      final url = attachment['url'] as String? ?? '';
      if (url.isEmpty && attachment['link_url'] == null) return null;

      final mimeType = attachment['mime_type'] as String? ?? '';
      MediaType type;

      if (attachment['link_url'] != null) {
        type = MediaType.link;
      } else if (mimeType.startsWith('image/')) {
        type = MediaType.photo;
      } else if (mimeType.startsWith('video/')) {
        type = MediaType.video;
      } else {
        type = MediaType.document;
      }

      return ChatMediaItem(
        id: '${messageId}_$index',
        messageId: messageId,
        channelId: channelId,
        senderId: senderId,
        senderName: senderName,
        type: type,
        url: url.isNotEmpty ? url : (attachment['link_url'] as String? ?? ''),
        thumbnailUrl: attachment['thumbnail_url'] as String?,
        fileName: attachment['file_name'] as String? ?? attachment['name'] as String?,
        mimeType: mimeType,
        fileSizeBytes: attachment['file_size'] as int? ?? attachment['size'] as int?,
        width: attachment['width'] as int?,
        height: attachment['height'] as int?,
        durationSeconds: attachment['duration'] as int?,
        linkTitle: attachment['link_title'] as String? ?? attachment['title'] as String?,
        linkDescription: attachment['link_description'] as String? ?? attachment['description'] as String?,
        linkDomain: attachment['link_domain'] as String? ?? _extractDomain(attachment['link_url'] as String?),
        createdAt: DateTime.parse(createdAt),
      );
    } catch (e) {
      logWarning('Error parsing attachment', error: e);
      return null;
    }
  }

  /// Extract domain from URL
  String? _extractDomain(String? url) {
    if (url == null) return null;
    try {
      final uri = Uri.parse(url);
      return uri.host;
    } catch (_) {
      return null;
    }
  }

  /// Group media items by date
  List<MediaDateGroup> groupByDate(List<ChatMediaItem> items) {
    final Map<String, List<ChatMediaItem>> grouped = {};

    for (final item in items) {
      final dateKey = '${item.createdAt.year}-${item.createdAt.month}-${item.createdAt.day}';
      grouped.putIfAbsent(dateKey, () => []).add(item);
    }

    final groups = grouped.entries.map((entry) {
      final parts = entry.key.split('-');
      return MediaDateGroup(
        date: DateTime(int.parse(parts[0]), int.parse(parts[1]), int.parse(parts[2])),
        items: entry.value,
      );
    }).toList();

    groups.sort((a, b) => b.date.compareTo(a.date));
    return groups;
  }

  /// Delete media items
  Future<Result<bool>> deleteMediaItems(List<ChatMediaItem> items) => execute(
    () async {
      // Group by message ID for batch deletion
      final messageIds = items.map((e) => e.messageId).toSet();

      for (final messageId in messageIds) {
        // Update message to remove attachments
        // In a real implementation, you'd selectively remove specific attachments
        await _supabase
            .from('channel_messages')
            .update({'attachments': null})
            .eq('id', messageId);
      }

      logDbOperation('UPDATE', 'channel_messages', rowCount: messageIds.length);
      logInfo('Media items deleted', metadata: {'count': items.length});
      return true;
    },
    operationName: 'deleteMediaItems',
  );

  /// Get media counts by type for a channel
  Future<Result<Map<MediaType, int>>> getMediaCounts(String channelId) => execute(
    () async {
      final result = await getChannelMedia(channelId: channelId, limit: 1000);
      
      if (!result.isSuccess) {
        throw Exception(result.errorMessage ?? 'Failed to fetch media');
      }

      final items = result.data;
      final counts = <MediaType, int>{
        MediaType.photo: 0,
        MediaType.video: 0,
        MediaType.document: 0,
        MediaType.link: 0,
      };

      for (final item in items) {
        counts[item.type] = (counts[item.type] ?? 0) + 1;
      }

      return counts;
    },
    operationName: 'getMediaCounts',
  );
}
