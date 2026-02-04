import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/utils/result.dart';

/// Service for fetching real-time chat information and statistics
/// 
/// Provides dynamic data for chat info sheets including message counts,
/// media counts, storage usage, and channel metadata.
class ChatInfoService extends BaseService {
  ChatInfoService._();
  static ChatInfoService? _instance;
  static ChatInfoService get instance => _instance ??= ChatInfoService._();

  @override
  String get tag => 'ChatInfoService';
  
  /// Get comprehensive information about a chat channel
  Future<Result<ChatInfo?>> getChatInfo(String channelId) {
    return execute(() async {
      // Fetch channel metadata
      final channelResult = await SupabaseConfig.client
          .from('workspace_channels')
          .select('id, name, description, created_at, created_by, is_private')
          .eq('id', channelId)
          .maybeSingle();
      
      if (channelResult == null) {
        // Try DM channels (messages table directly)
        return await _getDMChatInfoInternal(channelId);
      }
      
      // Get message count
      final messagesResult = await SupabaseConfig.client
          .from('channel_messages')
          .select('id')
          .eq('channel_id', channelId);
      
      final messageCount = (messagesResult as List).length;
      logDbOperation('SELECT', 'channel_messages', rowCount: messageCount);
      
      // Get media count (messages with attachments)
      final mediaResult = await SupabaseConfig.client
          .from('channel_messages')
          .select('attachments')
          .eq('channel_id', channelId)
          .not('attachments', 'is', null);
      
      int mediaCount = 0;
      for (final row in mediaResult as List) {
        final attachments = row['attachments'];
        if (attachments is List) {
          mediaCount += attachments.length;
        }
      }
      
      // Get participant count
      final membersResult = await SupabaseConfig.client
          .from('channel_members')
          .select('user_id')
          .eq('channel_id', channelId);
      
      final participantCount = (membersResult as List).length;
      logDbOperation('SELECT', 'channel_members', rowCount: participantCount);
      
      // Estimate storage (rough calculation based on message/media counts)
      // Average message ~500 bytes, average media ~100KB
      final estimatedStorage = (messageCount * 500) + (mediaCount * 100 * 1024);
      
      return ChatInfo(
        channelId: channelId,
        name: channelResult['name'] as String?,
        description: channelResult['description'] as String?,
        createdAt: _parseDateTime(channelResult['created_at']),
        createdBy: channelResult['created_by'] as String?,
        isPrivate: channelResult['is_private'] as bool? ?? false,
        isDM: false,
        messageCount: messageCount,
        mediaCount: mediaCount,
        participantCount: participantCount,
        storageBytesUsed: estimatedStorage,
      );
    }, operationName: 'getChatInfo');
  }
  
  /// Get chat info for a DM conversation (internal, throws on error)
  Future<ChatInfo?> _getDMChatInfoInternal(String channelId) async {
    // For DMs, the channelId might be in format "dm:user1:user2" or just a UUID
    // Fetch messages directly
    final messagesResult = await SupabaseConfig.client
        .from('channel_messages')
        .select('id, created_at, attachments')
        .eq('channel_id', channelId)
        .order('created_at', ascending: true)
        .limit(1);
    
    if ((messagesResult as List).isEmpty) {
      return ChatInfo(
        channelId: channelId,
        isDM: true,
        messageCount: 0,
        mediaCount: 0,
        participantCount: 2,
        storageBytesUsed: 0,
      );
    }
    
    // Get all message stats
    final allMessages = await SupabaseConfig.client
        .from('channel_messages')
        .select('id, attachments')
        .eq('channel_id', channelId);
    
    final messageCount = (allMessages as List).length;
    logDbOperation('SELECT', 'channel_messages', rowCount: messageCount);
    
    int mediaCount = 0;
    for (final row in allMessages) {
      final attachments = row['attachments'];
      if (attachments is List) {
        mediaCount += attachments.length;
      }
    }
    
    final firstMessage = messagesResult.first;
    final createdAt = _parseDateTime(firstMessage['created_at']);
    
    final estimatedStorage = (messageCount * 500) + (mediaCount * 100 * 1024);
    
    return ChatInfo(
      channelId: channelId,
      createdAt: createdAt,
      isDM: true,
      messageCount: messageCount,
      mediaCount: mediaCount,
      participantCount: 2,
      storageBytesUsed: estimatedStorage,
    );
  }
  
  /// Get quick stats for a channel (lightweight version)
  Future<Result<ChatQuickStats?>> getQuickStats(String channelId) {
    return execute(() async {
      // Get message count only (fast query)
      final messagesResult = await SupabaseConfig.client
          .from('channel_messages')
          .select('id')
          .eq('channel_id', channelId);
      
      final count = (messagesResult as List).length;
      logDbOperation('SELECT', 'channel_messages', rowCount: count);
      
      return ChatQuickStats(
        channelId: channelId,
        messageCount: count,
        fetchedAt: DateTime.now(),
      );
    }, operationName: 'getQuickStats');
  }
  
  /// Get the creation date of a chat
  Future<Result<DateTime?>> getChatCreationDate(String channelId) {
    return execute(() async {
      // Check channel table first
      final channelResult = await SupabaseConfig.client
          .from('workspace_channels')
          .select('created_at')
          .eq('id', channelId)
          .maybeSingle();
      
      if (channelResult != null) {
        return _parseDateTime(channelResult['created_at']);
      }
      
      // Fall back to first message
      final firstMessage = await SupabaseConfig.client
          .from('channel_messages')
          .select('created_at')
          .eq('channel_id', channelId)
          .order('created_at', ascending: true)
          .limit(1)
          .maybeSingle();
      
      if (firstMessage != null) {
        return _parseDateTime(firstMessage['created_at']);
      }
      
      return null;
    }, operationName: 'getChatCreationDate');
  }
  
  DateTime? _parseDateTime(dynamic value) {
    if (value == null) return null;
    if (value is DateTime) return value;
    if (value is String) return DateTime.tryParse(value);
    return null;
  }

  // ========== Static Convenience Methods ==========
  
  /// Fetch chat info (unwrapped for simpler consumption)
  static Future<ChatInfo?> fetchChatInfo(String channelId) async {
    final result = await instance.getChatInfo(channelId);
    return result is Success<ChatInfo?> ? result.data : null;
  }
  
  /// Fetch quick stats (unwrapped for simpler consumption)
  static Future<ChatQuickStats?> fetchQuickStats(String channelId) async {
    final result = await instance.getQuickStats(channelId);
    return result is Success<ChatQuickStats?> ? result.data : null;
  }
}

/// Comprehensive chat information
class ChatInfo {
  final String channelId;
  final String? name;
  final String? description;
  final DateTime? createdAt;
  final String? createdBy;
  final bool isPrivate;
  final bool isDM;
  final int messageCount;
  final int mediaCount;
  final int participantCount;
  final int storageBytesUsed;
  
  const ChatInfo({
    required this.channelId,
    this.name,
    this.description,
    this.createdAt,
    this.createdBy,
    this.isPrivate = false,
    this.isDM = false,
    required this.messageCount,
    required this.mediaCount,
    required this.participantCount,
    required this.storageBytesUsed,
  });
  
  String get formattedCreatedAt {
    if (createdAt == null) return 'Unknown';
    final now = DateTime.now();
    final diff = now.difference(createdAt!);
    
    if (diff.inDays > 365) {
      final years = diff.inDays ~/ 365;
      return '$years ${years == 1 ? 'year' : 'years'} ago';
    } else if (diff.inDays > 30) {
      final months = diff.inDays ~/ 30;
      return '$months ${months == 1 ? 'month' : 'months'} ago';
    } else if (diff.inDays > 0) {
      return '${diff.inDays} ${diff.inDays == 1 ? 'day' : 'days'} ago';
    } else if (diff.inHours > 0) {
      return '${diff.inHours} ${diff.inHours == 1 ? 'hour' : 'hours'} ago';
    } else {
      return 'Just now';
    }
  }
  
  String get formattedStorage {
    if (storageBytesUsed < 1024) {
      return '$storageBytesUsed B';
    } else if (storageBytesUsed < 1024 * 1024) {
      return '${(storageBytesUsed / 1024).toStringAsFixed(1)} KB';
    } else if (storageBytesUsed < 1024 * 1024 * 1024) {
      return '${(storageBytesUsed / (1024 * 1024)).toStringAsFixed(1)} MB';
    } else {
      return '${(storageBytesUsed / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
    }
  }
  
  String get formattedMessageCount {
    if (messageCount < 1000) {
      return messageCount.toString();
    } else if (messageCount < 1000000) {
      return '${(messageCount / 1000).toStringAsFixed(1)}K';
    } else {
      return '${(messageCount / 1000000).toStringAsFixed(1)}M';
    }
  }
  
  String get typeLabel => isDM ? 'Direct Message' : (isPrivate ? 'Private Channel' : 'Channel');
}

/// Quick stats for a channel (lightweight)
class ChatQuickStats {
  final String channelId;
  final int messageCount;
  final DateTime fetchedAt;
  
  const ChatQuickStats({
    required this.channelId,
    required this.messageCount,
    required this.fetchedAt,
  });
}
