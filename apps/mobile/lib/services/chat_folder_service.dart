import 'dart:async';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/services/unread_count_manager.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/utils/result.dart';

/// Chat Folder Service
/// Manages chat organization with custom folders
class ChatFolderService extends BaseService {
  static ChatFolderService? _instance;
  static ChatFolderService get instance => _instance ??= ChatFolderService._();
  ChatFolderService._();

  @override
  String get tag => 'ChatFolder';

  StreamSubscription? _foldersSubscription;
  final List<void Function(List<ChatFolder>)> _listeners = [];

  /// Add listener for folder updates
  void addListener(void Function(List<ChatFolder>) listener) {
    _listeners.add(listener);
  }

  /// Remove listener
  void removeListener(void Function(List<ChatFolder>) listener) {
    _listeners.remove(listener);
  }

  void _notifyListeners(List<ChatFolder> folders) {
    for (final listener in _listeners) {
      listener(folders);
    }
  }

  /// Subscribe to folder updates
  void subscribeToUpdates() {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return;

    _foldersSubscription?.cancel();
    _foldersSubscription = SupabaseConfig.client
        .from('chat_folders')
        .stream(primaryKey: ['id'])
        .eq('user_id', userId)
        .listen((data) async {
          final folders = await _enrichFoldersWithMembers(data);
          _notifyListeners(folders);
        });
    
    logDebug('Subscribed to realtime updates');
  }

  Future<List<ChatFolder>> _enrichFoldersWithMembers(List<Map<String, dynamic>> foldersData) async {
    final folders = <ChatFolder>[];
    
    for (final folderData in foldersData) {
      try {
        final membersResponse = await SupabaseConfig.client
            .from('chat_folder_members')
            .select('channel_id')
            .eq('folder_id', folderData['id']);

        final channelIds = (membersResponse as List)
            .map((e) => e['channel_id'] as String)
            .toList();

        folders.add(ChatFolder.fromJson(folderData, channelIds));
      } catch (e) {
        folders.add(ChatFolder.fromJson(folderData, []));
      }
    }

    folders.sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
    return folders;
  }

  /// Get all folders for current user
  Future<Result<List<ChatFolder>>> getFolders() => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return <ChatFolder>[];

    final response = await SupabaseConfig.client
        .from('chat_folders')
        .select()
        .eq('user_id', userId)
        .order('sort_order', ascending: true);

    final folders = await _enrichFoldersWithMembers(response as List<Map<String, dynamic>>);
    logDbOperation('SELECT', 'chat_folders', rowCount: folders.length);
    return folders;
  }, operationName: 'getFolders');

  /// Get folder by ID
  Future<Result<ChatFolder?>> getFolderById(String folderId) => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return null;

    final response = await SupabaseConfig.client
        .from('chat_folders')
        .select()
        .eq('id', folderId)
        .eq('user_id', userId)
        .single();

    final membersResponse = await SupabaseConfig.client
        .from('chat_folder_members')
        .select('channel_id')
        .eq('folder_id', folderId);

    final channelIds = (membersResponse as List)
        .map((e) => e['channel_id'] as String)
        .toList();

    logDbOperation('SELECT', 'chat_folders', rowCount: 1);
    return ChatFolder.fromJson(response, channelIds);
  }, operationName: 'getFolderById');

  /// Create a new folder
  Future<Result<ChatFolder?>> createFolder({
    required String name,
    String icon = 'folder',
    String color = '#6366f1',
  }) => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return null;

    // Get max sort order
    final maxOrderResponse = await SupabaseConfig.client
        .from('chat_folders')
        .select('sort_order')
        .eq('user_id', userId)
        .order('sort_order', ascending: false)
        .limit(1);

    final maxOrder = (maxOrderResponse as List).isNotEmpty
        ? (maxOrderResponse[0]['sort_order'] as int) + 1
        : 0;

    final response = await SupabaseConfig.client
        .from('chat_folders')
        .insert({
          'user_id': userId,
          'name': name,
          'icon': icon,
          'color': color,
          'sort_order': maxOrder,
        })
        .select()
        .single();

    logDbOperation('INSERT', 'chat_folders', rowCount: 1);
    logInfo('Folder created', metadata: {'name': name});
    return ChatFolder.fromJson(response, []);
  }, operationName: 'createFolder');

  /// Update folder properties
  Future<Result<ChatFolder?>> updateFolder({
    required String folderId,
    String? name,
    String? icon,
    String? color,
    bool? isMuted,
  }) => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return null;

    final updates = <String, dynamic>{};
    if (name != null) updates['name'] = name;
    if (icon != null) updates['icon'] = icon;
    if (color != null) updates['color'] = color;
    if (isMuted != null) updates['is_muted'] = isMuted;

    if (updates.isEmpty) return null;

    final response = await SupabaseConfig.client
        .from('chat_folders')
        .update(updates)
        .eq('id', folderId)
        .eq('user_id', userId)
        .select()
        .single();

    logDbOperation('UPDATE', 'chat_folders', rowCount: 1);
    logInfo('Folder updated', metadata: {'folderId': folderId});
    return ChatFolder.fromJson(response, []);
  }, operationName: 'updateFolder');

  /// Delete a folder
  Future<Result<bool>> deleteFolder(String folderId) => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return false;

    await SupabaseConfig.client
        .from('chat_folders')
        .delete()
        .eq('id', folderId)
        .eq('user_id', userId);

    logDbOperation('DELETE', 'chat_folders', rowCount: 1);
    logInfo('Folder deleted', metadata: {'folderId': folderId});
    return true;
  }, operationName: 'deleteFolder');

  /// Reorder folders
  Future<Result<bool>> reorderFolders(List<String> folderIds) => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return false;

    for (var i = 0; i < folderIds.length; i++) {
      await SupabaseConfig.client
          .from('chat_folders')
          .update({'sort_order': i})
          .eq('id', folderIds[i])
          .eq('user_id', userId);
    }

    logDbOperation('UPDATE', 'chat_folders', rowCount: folderIds.length);
    logInfo('Folders reordered');
    return true;
  }, operationName: 'reorderFolders');

  /// Add channel to folder
  Future<Result<bool>> addToFolder(String folderId, String channelId) => execute(() async {
    await SupabaseConfig.client.from('chat_folder_members').upsert({
      'folder_id': folderId,
      'channel_id': channelId,
    }, onConflict: 'folder_id,channel_id');

    logDbOperation('UPSERT', 'chat_folder_members', rowCount: 1);
    logDebug('Channel added to folder', metadata: {'channelId': channelId, 'folderId': folderId});
    return true;
  }, operationName: 'addToFolder');

  /// Remove channel from folder
  Future<Result<bool>> removeFromFolder(String folderId, String channelId) => execute(() async {
    await SupabaseConfig.client
        .from('chat_folder_members')
        .delete()
        .eq('folder_id', folderId)
        .eq('channel_id', channelId);

    logDbOperation('DELETE', 'chat_folder_members', rowCount: 1);
    logDebug('Channel removed from folder', metadata: {'channelId': channelId, 'folderId': folderId});
    return true;
  }, operationName: 'removeFromFolder');

  /// Move channel to a different folder
  Future<Result<bool>> moveToFolder(String channelId, String? fromFolderId, String toFolderId) => execute(() async {
    // Remove from old folder if specified
    if (fromFolderId != null) {
      await removeFromFolder(fromFolderId, channelId);
    }

    // Add to new folder
    await addToFolder(toFolderId, channelId);
    return true;
  }, operationName: 'moveToFolder');

  /// Get folder for a channel
  Future<Result<ChatFolder?>> getFolderForChannel(String channelId) => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return null;

    final response = await SupabaseConfig.client
        .from('chat_folder_members')
        .select('folder_id')
        .eq('channel_id', channelId)
        .limit(1);

    if ((response as List).isEmpty) return null;

    final folderId = response[0]['folder_id'] as String;
    final folderResult = await getFolderById(folderId);
    return folderResult is Success<ChatFolder?> ? folderResult.data : null;
  }, operationName: 'getFolderForChannel');

  /// Get unread count for a folder by aggregating unread counts from all channels
  int getFolderUnreadCount(String folderId, List<String> channelIds) {
    final unreadManager = UnreadCountManager.instance;
    int total = 0;
    for (final channelId in channelIds) {
      total += unreadManager.getCount(channelId);
    }
    return total;
  }
  
  /// Async version that fetches folder channels first
  Future<Result<int>> getFolderUnreadCountAsync(String folderId) => execute(() async {
    final folderResult = await getFolderById(folderId);
    if (!folderResult.isSuccess || folderResult.data == null) {
      return 0;
    }
    
    final folder = folderResult.data!;
    return getFolderUnreadCount(folderId, folder.channelIds);
  }, operationName: 'getFolderUnreadCountAsync');

  /// Dispose resources
  void dispose() {
    _foldersSubscription?.cancel();
    _foldersSubscription = null;
    _listeners.clear();
  }
}

/// Chat folder model
class ChatFolder {
  final String id;
  final String userId;
  final String name;
  final String icon;
  final String color;
  final int sortOrder;
  final bool isMuted;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<String> channelIds;

  const ChatFolder({
    required this.id,
    required this.userId,
    required this.name,
    required this.icon,
    required this.color,
    required this.sortOrder,
    required this.isMuted,
    required this.createdAt,
    required this.updatedAt,
    required this.channelIds,
  });

  factory ChatFolder.fromJson(Map<String, dynamic> json, List<String> channelIds) {
    return ChatFolder(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      name: json['name'] as String,
      icon: json['icon'] as String? ?? 'folder',
      color: json['color'] as String? ?? '#6366f1',
      sortOrder: json['sort_order'] as int? ?? 0,
      isMuted: json['is_muted'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      channelIds: channelIds,
    );
  }

  int get channelCount => channelIds.length;
  bool get isEmpty => channelIds.isEmpty;

  bool containsChannel(String channelId) => channelIds.contains(channelId);
  
  /// Get aggregated unread count from UnreadCountManager
  int get unreadCount {
    final manager = UnreadCountManager.instance;
    return channelIds.fold(0, (sum, id) => sum + manager.getCount(id));
  }
  
  /// Check if folder has any unread messages
  bool get hasUnread => unreadCount > 0;
}
