import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/utils/result.dart';
import '../models/chat_group.dart';
import '../models/group_stats.dart';

/// Service for managing group chats
/// 
/// Extends BaseService for standardized error handling and logging.
/// All async operations return Result<T> for consistent error propagation.
class GroupChatService extends BaseService {
  @override
  String get tag => 'GroupChatService';

  final _supabase = Supabase.instance.client;

  // ==================== Static Helpers ====================
  
  /// Static convenience method for fetching groups (unwraps Result internally)
  /// 
  /// This matches the pattern used by ChatService methods for type-safe
  /// integration with ChatSyncService and ShareDestinationService.
  static Future<List<ChatGroup>> fetchMyGroups() async {
    final result = await GroupChatService().getMyGroups();
    return result.isSuccess ? result.data : <ChatGroup>[];
  }

  String? get _currentUserId => _supabase.auth.currentUser?.id;

  // ==================== Group Management ====================

  /// Create a new group using atomic RPC
  /// 
  /// Industrial best practice: Single database transaction ensures
  /// group + owner membership are created atomically, preventing
  /// partial states and RLS "RETURNING" conflicts.
  Future<Result<ChatGroup>> createGroup({
    required String name,
    String? description,
    String? iconUrl,
    List<String> memberIds = const [],
    bool isPublic = false,
    int maxMembers = 100,
  }) => execute(() async {
    final userId = _currentUserId;
    if (userId == null) throw Exception('Not authenticated');

    // Use atomic RPC to create group + membership in single transaction
    final response = await _supabase.rpc('create_chat_group', params: {
      'p_name': name,
      'p_description': description,
      'p_icon_url': iconUrl,
      'p_is_public': isPublic,
      'p_max_members': maxMembers,
      'p_member_ids': memberIds,
    });

    // RPC returns JSON, parse it into ChatGroup
    final groupData = response as Map<String, dynamic>;
    final group = ChatGroup.fromJson(groupData);

    logInfo('Group created via RPC', metadata: {
      'groupId': group.id, 
      'memberCount': memberIds.length + 1,
    });
    return group;
  }, operationName: 'createGroup');

  /// Update group settings
  Future<Result<ChatGroup>> updateGroup(
    String groupId, {
    String? name,
    String? description,
    String? iconUrl,
    bool? isPublic,
    int? maxMembers,
  }) => execute(() async {
    final updates = <String, dynamic>{};
    if (name != null) updates['name'] = name;
    if (description != null) updates['description'] = description;
    if (iconUrl != null) updates['icon_url'] = iconUrl;
    if (isPublic != null) updates['is_public'] = isPublic;
    if (maxMembers != null) updates['max_members'] = maxMembers;

    if (updates.isEmpty) {
      final result = await getGroupById(groupId);
      if (result is Success<ChatGroup>) return result.data;
      throw Exception('Group not found');
    }

    final data = await _supabase
        .from('chat_groups')
        .update(updates)
        .eq('id', groupId)
        .select()
        .single();

    logDbOperation('UPDATE', 'chat_groups', rowCount: 1);
    return ChatGroup.fromJson(data);
  }, operationName: 'updateGroup');

  /// Delete a group (owner only)
  Future<Result<void>> deleteGroup(String groupId) => execute(() async {
    await _supabase.from('chat_groups').delete().eq('id', groupId);
    logInfo('Group deleted', metadata: {'groupId': groupId});
  }, operationName: 'deleteGroup');

  /// Get groups the current user belongs to
  Future<Result<List<ChatGroup>>> getMyGroups() => execute(() async {
    final userId = _currentUserId;
    if (userId == null) return <ChatGroup>[];

    final memberData = await _supabase
        .from('chat_group_members')
        .select('group_id')
        .eq('user_id', userId);

    if (memberData.isEmpty) return <ChatGroup>[];

    final groupIds =
        (memberData as List).map((m) => m['group_id'] as String).toList();

    final groupsData = await _supabase
        .from('chat_groups')
        .select()
        .inFilter('id', groupIds)
        .order('updated_at', ascending: false);

    logDbOperation('SELECT', 'chat_groups', rowCount: (groupsData as List).length);
    return groupsData
        .map((g) => ChatGroup.fromJson(g as Map<String, dynamic>))
        .toList();
  }, operationName: 'getMyGroups');

  /// Get a single group by ID
  Future<Result<ChatGroup>> getGroupById(String groupId) => execute(() async {
    final data = await _supabase
        .from('chat_groups')
        .select()
        .eq('id', groupId)
        .single();

    return ChatGroup.fromJson(data);
  }, operationName: 'getGroupById');

  /// Leave a group
  Future<Result<void>> leaveGroup(String groupId) => execute(() async {
    final userId = _currentUserId;
    if (userId == null) throw Exception('Not authenticated');

    // Check if user is owner
    final membership = await _supabase
        .from('chat_group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single();

    if (membership['role'] == 'owner') {
      // Check if there are other members
      final members = await _supabase
          .from('chat_group_members')
          .select('id, user_id, role')
          .eq('group_id', groupId)
          .neq('user_id', userId);

      if ((members as List).isEmpty) {
        // No other members, delete the group
        await _supabase.from('chat_groups').delete().eq('id', groupId);
        logInfo('Group deleted (last member left)', metadata: {'groupId': groupId});
        return;
      }

      // Transfer ownership to first admin, or first member
      final admins = members.where((m) => m['role'] == 'admin').toList();
      final newOwnerId = admins.isNotEmpty
          ? admins.first['user_id']
          : members.first['user_id'];

      await _transferOwnershipInternal(groupId, userId, newOwnerId);
    }

    // Remove self from group
    await _supabase
        .from('chat_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);
    
    logInfo('Left group', metadata: {'groupId': groupId});
  }, operationName: 'leaveGroup');

  // ==================== Member Management ====================

  /// Add members to a group
  Future<Result<void>> addMembers(String groupId, List<String> userIds) => execute(() async {
    final userId = _currentUserId;
    if (userId == null) throw Exception('Not authenticated');

    // Get existing members to avoid duplicates
    final existing = await _supabase
        .from('chat_group_members')
        .select('user_id')
        .eq('group_id', groupId);

    final existingIds =
        (existing as List).map((m) => m['user_id'] as String).toSet();

    final newMembers = userIds
        .where((id) => !existingIds.contains(id))
        .map((id) => {
              'group_id': groupId,
              'user_id': id,
              'role': 'member',
              'invited_by': userId,
            })
        .toList();

    if (newMembers.isNotEmpty) {
      await _supabase.from('chat_group_members').insert(newMembers);
      logInfo('Members added', metadata: {'groupId': groupId, 'count': newMembers.length});
    }
  }, operationName: 'addMembers');

  /// Remove a member from a group
  Future<Result<void>> removeMember(String groupId, String memberId) => execute(() async {
    await _supabase
        .from('chat_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', memberId);
    
    logInfo('Member removed', metadata: {'groupId': groupId, 'memberId': memberId});
  }, operationName: 'removeMember');

  /// Update a member's role
  Future<Result<void>> updateMemberRole(
    String groupId,
    String memberId,
    GroupMemberRole role,
  ) => execute(() async {
    await _supabase
        .from('chat_group_members')
        .update({'role': role.name})
        .eq('group_id', groupId)
        .eq('user_id', memberId);
    
    logDbOperation('UPDATE', 'chat_group_members', rowCount: 1);
  }, operationName: 'updateMemberRole');

  /// Get all members of a group with their profile data
  Future<Result<List<ChatGroupMember>>> getGroupMembers(String groupId) => execute(() async {
    final data = await _supabase
        .from('chat_group_members')
        .select('''
          *,
          impact_profiles!chat_group_members_user_id_fkey (
            full_name,
            avatar_url,
            is_online
          )
        ''')
        .eq('group_id', groupId)
        .order('role', ascending: true)
        .order('joined_at', ascending: true);

    logDbOperation('SELECT', 'chat_group_members', rowCount: (data as List).length);
    return data
        .map((m) => ChatGroupMember.fromJson(m as Map<String, dynamic>))
        .toList();
  }, operationName: 'getGroupMembers');

  /// Transfer group ownership to another member
  Future<Result<void>> transferOwnership(String groupId, String newOwnerId) => execute(() async {
    final userId = _currentUserId;
    if (userId == null) throw Exception('Not authenticated');

    await _transferOwnershipInternal(groupId, userId, newOwnerId);
    logInfo('Ownership transferred', metadata: {'groupId': groupId, 'newOwnerId': newOwnerId});
  }, operationName: 'transferOwnership');

  /// Internal helper to transfer ownership without logging
  Future<void> _transferOwnershipInternal(String groupId, String currentOwnerId, String newOwnerId) async {
    // Demote current owner to admin
    await _supabase
        .from('chat_group_members')
        .update({'role': 'admin'})
        .eq('group_id', groupId)
        .eq('user_id', currentOwnerId);

    // Promote new owner
    await _supabase
        .from('chat_group_members')
        .update({'role': 'owner'})
        .eq('group_id', groupId)
        .eq('user_id', newOwnerId);
  }

  // ==================== Permission Checks ====================

  /// Check if current user can manage members in a group
  Future<Result<bool>> canManageMembers(String groupId) => execute(() async {
    final role = await _getCurrentUserRole(groupId);
    return role?.canManageMembers ?? false;
  }, operationName: 'canManageMembers');

  /// Check if current user can edit group settings
  Future<Result<bool>> canEditGroup(String groupId) => execute(() async {
    final role = await _getCurrentUserRole(groupId);
    return role?.canEditGroup ?? false;
  }, operationName: 'canEditGroup');

  /// Check if current user is admin or owner
  Future<Result<bool>> isGroupAdmin(String groupId) => execute(() async {
    final role = await _getCurrentUserRole(groupId);
    return role == GroupMemberRole.admin || role == GroupMemberRole.owner;
  }, operationName: 'isGroupAdmin');

  /// Get current user's role in a group (internal helper)
  Future<GroupMemberRole?> _getCurrentUserRole(String groupId) async {
    final userId = _currentUserId;
    if (userId == null) return null;

    try {
      final data = await _supabase
          .from('chat_group_members')
          .select('role')
          .eq('group_id', groupId)
          .eq('user_id', userId)
          .maybeSingle();

      if (data == null) return null;
      return GroupMemberRole.fromString(data['role'] as String);
    } catch (e) {
      logWarning('Failed to get user role', error: e);
      return null;
    }
  }

  /// Get current user's membership in a group
  Future<Result<ChatGroupMember?>> getCurrentMembership(String groupId) => execute(() async {
    final userId = _currentUserId;
    if (userId == null) return null;

    final data = await _supabase
        .from('chat_group_members')
        .select()
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle();

    if (data == null) return null;
    return ChatGroupMember.fromJson(data);
  }, operationName: 'getCurrentMembership');

  // ==================== Mute Settings ====================

  /// Toggle mute for a group
  Future<Result<void>> toggleMute(String groupId, {DateTime? mutedUntil}) => execute(() async {
    final userId = _currentUserId;
    if (userId == null) throw Exception('Not authenticated');

    final membershipResult = await getCurrentMembership(groupId);
    ChatGroupMember? current;
    if (membershipResult is Success<ChatGroupMember?>) {
      current = membershipResult.data;
    }
    if (current == null) throw Exception('Not a member');

    await _supabase
        .from('chat_group_members')
        .update({
          'is_muted': !current.isMuted,
          'muted_until': mutedUntil?.toIso8601String(),
        })
        .eq('group_id', groupId)
        .eq('user_id', userId);
  }, operationName: 'toggleMute');

  /// Update last read timestamp
  Future<Result<void>> markAsRead(String groupId) => execute(() async {
    final userId = _currentUserId;
    if (userId == null) return;

    await _supabase
        .from('chat_group_members')
        .update({'last_read_at': DateTime.now().toIso8601String()})
        .eq('group_id', groupId)
        .eq('user_id', userId);
  }, operationName: 'markAsRead');

  // ==================== Group Messaging ====================
  
  /// Send a message to a group chat
  /// Uses the group: prefix for channel ID to route messages correctly
  Future<Result<void>> sendGroupMessage({
    required String groupId,
    required String content,
    Map<String, dynamic>? attachments,
  }) => execute(() async {
    final userId = _currentUserId;
    if (userId == null) throw Exception('Not authenticated');
    
    final channelId = 'group:$groupId';
    
    await _supabase.from('messages').insert({
      'channel_id': channelId,
      'sender_id': userId,
      'content': content,
      'attachments': attachments,
      'sent_at': DateTime.now().toIso8601String(),
    });
    
    // Update group's updated_at timestamp
    await _supabase
        .from('chat_groups')
        .update({'updated_at': DateTime.now().toIso8601String()})
        .eq('id', groupId);
    
    logDbOperation('INSERT', 'messages', rowCount: 1);
  }, operationName: 'sendGroupMessage');
  
  /// Stream messages for a group chat
  Stream<List<Map<String, dynamic>>> streamGroupMessages(String groupId) {
    final channelId = 'group:$groupId';
    
    return _supabase
        .from('messages')
        .stream(primaryKey: ['id'])
        .eq('channel_id', channelId)
        .order('sent_at', ascending: false)
        .limit(100);
  }
  
  /// Get paginated messages for a group
  Future<Result<List<Map<String, dynamic>>>> getGroupMessages(
    String groupId, {
    int limit = 50,
    String? beforeId,
  }) => execute(() async {
    final channelId = 'group:$groupId';
    
    // If pagination needed, get reference timestamp first
    String? beforeTimestamp;
    if (beforeId != null) {
      final refMsg = await _supabase
          .from('messages')
          .select('sent_at')
          .eq('id', beforeId)
          .maybeSingle();
      beforeTimestamp = refMsg?['sent_at'] as String?;
    }
    
    // Build query with all filters applied at once
    final query = _supabase
        .from('messages')
        .select();
    
    // Apply filters - chain properly
    final List<Map<String, dynamic>> result;
    if (beforeTimestamp != null) {
      result = await query
          .eq('channel_id', channelId)
          .lt('sent_at', beforeTimestamp)
          .order('sent_at', ascending: false)
          .limit(limit);
    } else {
      result = await query
          .eq('channel_id', channelId)
          .order('sent_at', ascending: false)
          .limit(limit);
    }
    
    logDbOperation('SELECT', 'messages', rowCount: result.length);
    return result;
  }, operationName: 'getGroupMessages');
  
  /// Get unread count for a group
  Future<Result<int>> getUnreadCount(String groupId) => execute(() async {
    final userId = _currentUserId;
    if (userId == null) return 0;
    
    final channelId = 'group:$groupId';
    
    // Get last read timestamp
    final membershipResult = await getCurrentMembership(groupId);
    ChatGroupMember? membership;
    if (membershipResult is Success<ChatGroupMember?>) {
      membership = membershipResult.data;
    }
    if (membership == null) return 0;
    
    final lastRead = membership.lastReadAt;
    if (lastRead == null) {
      // Never read - count all messages not from self
      final result = await _supabase
          .from('messages')
          .select()
          .eq('channel_id', channelId)
          .neq('sender_id', userId);
      
      return (result as List).length;
    }
    
    // Count messages after last read
    final result = await _supabase
        .from('messages')
        .select()
        .eq('channel_id', channelId)
        .neq('sender_id', userId)
        .gt('sent_at', lastRead.toIso8601String());
    
    return (result as List).length;
  }, operationName: 'getUnreadCount');

  // ==================== Search ====================

  /// Search for public groups by name
  Future<Result<List<ChatGroup>>> searchPublicGroups(String query, {int limit = 20}) => execute(() async {
    final data = await _supabase
        .from('chat_groups')
        .select()
        .eq('is_public', true)
        .ilike('name', '%$query%')
        .order('member_count', ascending: false)
        .limit(limit);

    logDbOperation('SELECT', 'chat_groups', rowCount: (data as List).length);
    return data.map((g) => ChatGroup.fromJson(g as Map<String, dynamic>)).toList();
  }, operationName: 'searchPublicGroups');

  // ==================== Utilities ====================

  /// Get current user ID
  String? getCurrentUserId() => _currentUserId;

  // ==================== WhatsApp-Level Features ====================

  /// Get or create an invite link for a group
  Future<Result<GroupInviteLink>> getOrCreateInviteLink(String groupId) => execute(() async {
    final userId = _currentUserId;
    if (userId == null) throw Exception('Not authenticated');

    // Check for existing active link
    final existing = await _supabase
        .from('group_invite_links')
        .select()
        .eq('group_id', groupId)
        .eq('is_active', true)
        .maybeSingle();

    if (existing != null) {
      return GroupInviteLink.fromJson(existing);
    }

    // Create new link
    final data = await _supabase
        .from('group_invite_links')
        .insert({
          'group_id': groupId,
          'created_by': userId,
        })
        .select()
        .single();

    logInfo('Invite link created', metadata: {'groupId': groupId});
    return GroupInviteLink.fromJson(data);
  }, operationName: 'getOrCreateInviteLink');

  /// Revoke an invite link and create a new one
  Future<Result<GroupInviteLink>> revokeAndCreateInviteLink(String groupId) => execute(() async {
    final userId = _currentUserId;
    if (userId == null) throw Exception('Not authenticated');

    // Revoke existing links
    await _supabase
        .from('group_invite_links')
        .update({'is_active': false})
        .eq('group_id', groupId);

    // Create new link
    final data = await _supabase
        .from('group_invite_links')
        .insert({
          'group_id': groupId,
          'created_by': userId,
        })
        .select()
        .single();

    logInfo('Invite link revoked and recreated', metadata: {'groupId': groupId});
    return GroupInviteLink.fromJson(data);
  }, operationName: 'revokeAndCreateInviteLink');

  /// Join a group via invite link
  Future<Result<ChatGroup>> joinViaInviteLink(String linkCode) => execute(() async {
    final userId = _currentUserId;
    if (userId == null) throw Exception('Not authenticated');

    // Find the link
    final linkData = await _supabase
        .from('group_invite_links')
        .select('*, chat_groups!inner(*)')
        .eq('link_code', linkCode)
        .eq('is_active', true)
        .maybeSingle();

    if (linkData == null) {
      throw Exception('Invalid or expired invite link');
    }

    final groupId = linkData['group_id'] as String;
    final groupData = linkData['chat_groups'] as Map<String, dynamic>;

    // Check if already a member
    final existing = await _supabase
        .from('chat_group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle();

    if (existing != null) {
      throw Exception('You are already a member of this group');
    }

    // Check member limit
    final group = ChatGroup.fromJson(groupData);
    if (group.memberCount >= group.maxMembers) {
      throw Exception('This group is full');
    }

    // Add as member
    await _supabase.from('chat_group_members').insert({
      'group_id': groupId,
      'user_id': userId,
      'role': 'member',
    });

    logInfo('Joined group via link', metadata: {'groupId': groupId, 'linkCode': linkCode});
    return group;
  }, operationName: 'joinViaInviteLink');

  /// Set only admins can send messages
  Future<Result<void>> setOnlyAdminsCanSend(String groupId, bool value) => execute(() async {
    await _supabase
        .from('chat_groups')
        .update({'only_admins_can_send': value})
        .eq('id', groupId);
    
    logInfo('Updated only_admins_can_send', metadata: {'groupId': groupId, 'value': value});
  }, operationName: 'setOnlyAdminsCanSend');

  /// Set only admins can edit group info
  Future<Result<void>> setOnlyAdminsCanEdit(String groupId, bool value) => execute(() async {
    await _supabase
        .from('chat_groups')
        .update({'only_admins_can_edit': value})
        .eq('id', groupId);
    
    logInfo('Updated only_admins_can_edit', metadata: {'groupId': groupId, 'value': value});
  }, operationName: 'setOnlyAdminsCanEdit');

  /// Get real statistics for a group
  Future<Result<GroupStats>> getGroupStatistics(String groupId) => execute(() async {
    final channelId = 'group:$groupId';

    // Fetch all messages for this group
    final messages = await _supabase
        .from('messages')
        .select('id, content, attachments')
        .eq('channel_id', channelId)
        .eq('is_deleted', false);

    int messageCount = messages.length;
    int mediaCount = 0;
    int linkCount = 0;
    int fileCount = 0;

    // Parse each message to count media and links
    for (final msg in messages) {
      final content = msg['content'] as String? ?? '';
      final attachments = msg['attachments'];
      
      // Count links in content
      if (content.contains('http://') || content.contains('https://')) {
        linkCount++;
      }
      
      // Count media attachments
      if (attachments != null && attachments is List && attachments.isNotEmpty) {
        for (final att in attachments) {
          if (att is Map) {
            final type = att['type'] as String? ?? '';
            if (type == 'image' || type == 'video' || type == 'audio') {
              mediaCount++;
            } else if (type == 'file' || type == 'document') {
              fileCount++;
            }
          }
        }
      }
    }

    logInfo('Group stats calculated', metadata: {
      'groupId': groupId,
      'messages': messageCount,
      'media': mediaCount,
      'links': linkCount,
      'files': fileCount,
    });

    return GroupStats(
      messageCount: messageCount,
      mediaCount: mediaCount,
      linkCount: linkCount,
      fileCount: fileCount,
    );
  }, operationName: 'getGroupStatistics');

  /// Pin or unpin a group for the current user
  Future<Result<void>> pinGroup(String groupId, bool pinned) => execute(() async {
    final userId = _currentUserId;
    if (userId == null) throw Exception('Not authenticated');

    await _supabase
        .from('chat_group_members')
        .update({'is_pinned': pinned})
        .eq('group_id', groupId)
        .eq('user_id', userId);
  }, operationName: 'pinGroup');

  /// Hide or unhide a group for the current user
  Future<Result<void>> hideGroup(String groupId, bool hidden) => execute(() async {
    final userId = _currentUserId;
    if (userId == null) throw Exception('Not authenticated');

    await _supabase
        .from('chat_group_members')
        .update({'is_hidden': hidden})
        .eq('group_id', groupId)
        .eq('user_id', userId);
  }, operationName: 'hideGroup');

  /// Clear chat history for the current user
  Future<Result<void>> clearGroupHistory(String groupId) => execute(() async {
    final userId = _currentUserId;
    if (userId == null) throw Exception('Not authenticated');

    await _supabase
        .from('chat_group_members')
        .update({'cleared_at': DateTime.now().toIso8601String()})
        .eq('group_id', groupId)
        .eq('user_id', userId);
    
    logInfo('Cleared group history', metadata: {'groupId': groupId});
  }, operationName: 'clearGroupHistory');

  // ==================== Real-time Subscriptions ====================

  /// Stream group membership changes
  Stream<List<ChatGroupMember>> streamGroupMembers(String groupId) {
    return _supabase
        .from('chat_group_members')
        .stream(primaryKey: ['id'])
        .eq('group_id', groupId)
        .map((data) => data
            .map((m) => ChatGroupMember.fromJson(m as Map<String, dynamic>))
            .toList());
  }

  /// Stream user's groups
  Stream<List<ChatGroup>> streamMyGroups() {
    final userId = _currentUserId;
    if (userId == null) return Stream.value([]);

    return _supabase
        .from('chat_group_members')
        .stream(primaryKey: ['id'])
        .eq('user_id', userId)
        .asyncMap((memberData) async {
          if (memberData.isEmpty) return <ChatGroup>[];

          final groupIds =
              memberData.map((m) => m['group_id'] as String).toList();

          final groupsData = await _supabase
              .from('chat_groups')
              .select()
              .inFilter('id', groupIds)
              .order('updated_at', ascending: false);

          return (groupsData as List)
              .map((g) => ChatGroup.fromJson(g as Map<String, dynamic>))
              .toList();
        });
  }
}
