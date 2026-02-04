import 'package:thittam1hub/services/group_chat_service.dart';
import 'package:thittam1hub/models/chat_group.dart';
import 'package:thittam1hub/models/group_stats.dart';
import 'package:thittam1hub/utils/result.dart';
import 'base_repository.dart';
import 'group_chat_repository.dart';

/// Supabase implementation of [GroupChatRepository].
/// 
/// Extends [BaseRepository] for standardized error handling and logging.
/// Delegates all operations to [GroupChatService] which handles
/// database interactions via BaseService.
class SupabaseGroupChatRepository extends BaseRepository implements GroupChatRepository {
  @override
  String get tag => 'GroupChatRepository';
  
  final GroupChatService _service;

  SupabaseGroupChatRepository({GroupChatService? service})
      : _service = service ?? GroupChatService();

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<ChatGroup>> createGroup({
    required String name,
    String? description,
    String? iconUrl,
    List<String> memberIds = const [],
    bool isPublic = false,
    int maxMembers = 100,
  }) => _service.createGroup(
    name: name,
    description: description,
    iconUrl: iconUrl,
    memberIds: memberIds,
    isPublic: isPublic,
    maxMembers: maxMembers,
  );

  @override
  Future<Result<ChatGroup>> updateGroup(
    String groupId, {
    String? name,
    String? description,
    String? iconUrl,
    bool? isPublic,
    int? maxMembers,
  }) => _service.updateGroup(
    groupId,
    name: name,
    description: description,
    iconUrl: iconUrl,
    isPublic: isPublic,
    maxMembers: maxMembers,
  );

  @override
  Future<Result<void>> deleteGroup(String groupId) => _service.deleteGroup(groupId);

  @override
  Future<Result<List<ChatGroup>>> getMyGroups() => _service.getMyGroups();

  @override
  Future<Result<ChatGroup>> getGroupById(String groupId) => _service.getGroupById(groupId);

  @override
  Future<Result<void>> leaveGroup(String groupId) => _service.leaveGroup(groupId);

  // ═══════════════════════════════════════════════════════════════════════════
  // MEMBER MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<void>> addMembers(String groupId, List<String> userIds) => _service.addMembers(groupId, userIds);

  @override
  Future<Result<void>> removeMember(String groupId, String memberId) => _service.removeMember(groupId, memberId);

  @override
  Future<Result<void>> updateMemberRole(String groupId, String memberId, GroupMemberRole role) =>
      _service.updateMemberRole(groupId, memberId, role);

  @override
  Future<Result<List<ChatGroupMember>>> getGroupMembers(String groupId) => _service.getGroupMembers(groupId);

  @override
  Future<Result<void>> transferOwnership(String groupId, String newOwnerId) =>
      _service.transferOwnership(groupId, newOwnerId);

  @override
  Future<Result<ChatGroupMember?>> getCurrentMembership(String groupId) => _service.getCurrentMembership(groupId);

  // ═══════════════════════════════════════════════════════════════════════════
  // PERMISSION CHECKS
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<bool>> canManageMembers(String groupId) => _service.canManageMembers(groupId);

  @override
  Future<Result<bool>> canEditGroup(String groupId) => _service.canEditGroup(groupId);

  @override
  Future<Result<bool>> isGroupAdmin(String groupId) => _service.isGroupAdmin(groupId);

  // ═══════════════════════════════════════════════════════════════════════════
  // MUTE & READ STATUS
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<void>> toggleMute(String groupId, {DateTime? mutedUntil}) =>
      _service.toggleMute(groupId, mutedUntil: mutedUntil);

  @override
  Future<Result<void>> markAsRead(String groupId) => _service.markAsRead(groupId);

  // ═══════════════════════════════════════════════════════════════════════════
  // MESSAGING
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<void>> sendGroupMessage({
    required String groupId,
    required String content,
    Map<String, dynamic>? attachments,
  }) => _service.sendGroupMessage(groupId: groupId, content: content, attachments: attachments);

  @override
  Stream<List<Map<String, dynamic>>> streamGroupMessages(String groupId) => _service.streamGroupMessages(groupId);

  @override
  Future<Result<List<Map<String, dynamic>>>> getGroupMessages(String groupId, {int limit = 50, String? beforeId}) =>
      _service.getGroupMessages(groupId, limit: limit, beforeId: beforeId);

  @override
  Future<Result<int>> getUnreadCount(String groupId) => _service.getUnreadCount(groupId);

  // ═══════════════════════════════════════════════════════════════════════════
  // SEARCH
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<List<ChatGroup>>> searchPublicGroups(String query, {int limit = 20}) =>
      _service.searchPublicGroups(query, limit: limit);

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  String? getCurrentUserId() => _service.getCurrentUserId();

  // ═══════════════════════════════════════════════════════════════════════════
  // WHATSAPP-LEVEL FEATURES
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<GroupInviteLink>> getOrCreateInviteLink(String groupId) => _service.getOrCreateInviteLink(groupId);

  @override
  Future<Result<GroupInviteLink>> revokeAndCreateInviteLink(String groupId) =>
      _service.revokeAndCreateInviteLink(groupId);

  @override
  Future<Result<ChatGroup>> joinViaInviteLink(String linkCode) => _service.joinViaInviteLink(linkCode);

  @override
  Future<Result<void>> setOnlyAdminsCanSend(String groupId, bool value) =>
      _service.setOnlyAdminsCanSend(groupId, value);

  @override
  Future<Result<void>> setOnlyAdminsCanEdit(String groupId, bool value) =>
      _service.setOnlyAdminsCanEdit(groupId, value);

  @override
  Future<Result<GroupStats>> getGroupStatistics(String groupId) => _service.getGroupStatistics(groupId);

  @override
  Future<Result<void>> pinGroup(String groupId, bool pinned) => _service.pinGroup(groupId, pinned);

  @override
  Future<Result<void>> hideGroup(String groupId, bool hidden) => _service.hideGroup(groupId, hidden);

  @override
  Future<Result<void>> clearGroupHistory(String groupId) => _service.clearGroupHistory(groupId);
}
