import 'package:thittam1hub/models/share_destination.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/models/chat_group.dart';
import 'package:thittam1hub/services/chat_service.dart';
import 'package:thittam1hub/services/group_chat_service.dart';
import 'package:thittam1hub/services/share_analytics_service.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/supabase/spark_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/utils/result.dart';

/// Service for fetching and managing share destinations
/// 
/// Industrial best practice: Extends BaseService for standardized
/// error handling, logging, and Result<T> returns.
class ShareDestinationService extends BaseService {
  @override
  String get tag => 'ShareDestinationService';
  
  static ShareDestinationService? _instance;
  static ShareDestinationService get instance => _instance ??= ShareDestinationService._();
  ShareDestinationService._();
  
  final _supabase = SupabaseConfig.client;

  // ==================== STATIC HELPERS ====================
  // Unwrap Result internally for simpler UI consumption

  /// Fetch recent destinations (returns empty list on failure)
  static Future<List<ShareDestination>> fetchRecentDestinations({int limit = 10}) async {
    final result = await instance.getRecentDestinations(limit: limit);
    return result.isSuccess ? result.data : [];
  }

  /// Search destinations (returns empty list on failure)
  static Future<List<ShareDestination>> fetchSearchResults(String query) async {
    final result = await instance.searchDestinations(query);
    return result.isSuccess ? result.data : [];
  }

  /// Fetch recent conversations (DMs + Groups + Channels combined)
  Future<Result<List<ShareDestination>>> getRecentDestinations({
    int limit = 10,
  }) => execute(
    () async {
      final destinations = <ShareDestination>[];

      // Fetch DMs, Groups, and Channels in parallel
      final results = await Future.wait([
        ChatService.getMyDMThreads(limit: limit),
        GroupChatService.fetchMyGroups(),
        ChatService.getMyChannels(),
      ]);

      final dms = results[0] as List<DMThread>;
      final groups = results[1] as List<ChatGroup>;
      final channels = results[2] as List<WorkspaceChannel>;

      logDebug('Fetched destinations', metadata: {
        'dms': dms.length,
        'groups': groups.length,
        'channels': channels.length,
      });

      // Convert to ShareDestination
      destinations.addAll(dms.map(ShareDestination.fromDMThread));
      destinations.addAll(groups.map(ShareDestination.fromChatGroup));
      destinations.addAll(channels.map(ShareDestination.fromChannel));

      // Sort by last interaction (most recent first)
      destinations.sort((a, b) {
        final aTime = a.lastInteractionAt ?? DateTime(1970);
        final bTime = b.lastInteractionAt ?? DateTime(1970);
        return bTime.compareTo(aTime);
      });

      return destinations.take(limit).toList();
    },
    operationName: 'getRecentDestinations',
  );

  /// Search destinations by name
  Future<Result<List<ShareDestination>>> searchDestinations(String query) => execute(
    () async {
      if (query.trim().isEmpty) return [];

      final destinations = <ShareDestination>[];
      final lowerQuery = query.toLowerCase();

      // Fetch all and filter locally for simplicity
      final results = await Future.wait([
        ChatService.getMyDMThreads(limit: 50),
        GroupChatService.fetchMyGroups(),
        ChatService.getMyChannels(),
      ]);

      final dms = results[0] as List<DMThread>;
      final groups = results[1] as List<ChatGroup>;
      final channels = results[2] as List<WorkspaceChannel>;

      // Filter DMs
      for (final dm in dms) {
        if (dm.partnerName.toLowerCase().contains(lowerQuery)) {
          destinations.add(ShareDestination.fromDMThread(dm));
        }
      }

      // Filter Groups
      for (final group in groups) {
        if (group.name.toLowerCase().contains(lowerQuery)) {
          destinations.add(ShareDestination.fromChatGroup(group));
        }
      }

      // Filter Channels
      for (final channel in channels) {
        if (channel.name.toLowerCase().contains(lowerQuery)) {
          destinations.add(ShareDestination.fromChannel(channel));
        }
      }

      logDebug('Search results', metadata: {
        'query': query,
        'results': destinations.length,
      });

      return destinations;
    },
    operationName: 'searchDestinations',
  );

  /// Share a post to a destination (sends as rich message)
  Future<Result<bool>> sharePostToDestination({
    required SparkPost post,
    required ShareDestination destination,
    String? message,
  }) => execute(
    () async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) {
        throw Exception('User not authenticated');
      }

      // Build message content with post info
      final postLink = 'https://thittam1hub.app/post/${post.id}';
      final contentParts = <String>[];
      
      if (message != null && message.isNotEmpty) {
        contentParts.add(message);
      }
      
      contentParts.add('📝 ${post.title}');
      if (post.content.isNotEmpty) {
        final preview = post.content.length > 100 
            ? '${post.content.substring(0, 100)}...' 
            : post.content;
        contentParts.add('"$preview"');
      }
      contentParts.add('— ${post.authorName}');
      contentParts.add(postLink);

      final fullContent = contentParts.join('\n');

      // Build attachments metadata for rich preview
      final attachments = {
        'type': 'shared_post',
        'post_id': post.id,
        'title': post.title,
        'content_preview': post.content.length > 100 
            ? post.content.substring(0, 100) 
            : post.content,
        'author_name': post.authorName,
        'author_avatar': post.authorAvatar,
        'image_url': post.imageUrl,
        'link': postLink,
      };

      switch (destination.type) {
        case ShareDestinationType.dm:
          await _supabase.from('messages').insert({
            'channel_id': ChatService.dmChannelIdFor(userId, destination.id),
            'sender_id': userId,
            'content': fullContent,
            'attachments': [attachments],
          });
          logDbOperation('INSERT', 'messages', rowCount: 1);
          break;

        case ShareDestinationType.group:
          await _supabase.from('messages').insert({
            'channel_id': 'group_${destination.id}',
            'sender_id': userId,
            'content': fullContent,
            'attachments': [attachments],
          });
          logDbOperation('INSERT', 'messages', rowCount: 1);
          break;

        case ShareDestinationType.channel:
          await _supabase.from('channel_messages').insert({
            'channel_id': destination.id,
            'sender_id': userId,
            'content': fullContent,
            'attachments': [attachments],
          });
          logDbOperation('INSERT', 'channel_messages', rowCount: 1);
          break;
      }

      // Record share analytics
      await ShareAnalyticsService.recordShare(
        postId: post.id,
        destinationType: destination.type.name,
        destinationId: destination.id,
        destinationName: destination.name,
        platform: 'in_app',
      );

      logInfo('Post shared', metadata: {
        'postId': post.id,
        'destinationType': destination.type.name,
        'destinationId': destination.id,
      });

      return true;
    },
    operationName: 'sharePostToDestination',
  );

  /// Share to multiple destinations at once
  Future<Result<Map<String, bool>>> shareToMultipleDestinations({
    required SparkPost post,
    required List<ShareDestination> destinations,
    String? message,
  }) => execute(
    () async {
      final results = <String, bool>{};

      await Future.wait(
        destinations.map((dest) async {
          final result = await sharePostToDestination(
            post: post,
            destination: dest,
            message: message,
          );
          results[dest.id] = result.isSuccess && result.data;
        }),
      );

      logInfo('Multi-share complete', metadata: {
        'postId': post.id,
        'destinations': destinations.length,
        'successes': results.values.where((v) => v).length,
      });

      return results;
    },
    operationName: 'shareToMultipleDestinations',
  );
}
