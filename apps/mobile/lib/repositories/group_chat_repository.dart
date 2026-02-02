import '../models/chat_group.dart';
import '../models/group_stats.dart';
import '../utils/result.dart';

/// Abstract repository interface for group chat operations.
/// 
/// This provides a clean abstraction over the data layer, enabling:
/// - Consistent error handling via Result<T> pattern
/// - Easy testing through mock implementations
/// - Separation of concerns between UI and data access
/// 
/// Follows the same pattern as [ChatRepository] for consistency.
abstract class GroupChatRepository {
  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /// Creates a new group chat with the specified settings.
  Future<Result<ChatGroup>> createGroup({
    required String name,
    String? description,
    String? iconUrl,
    List<String> memberIds = const [],
    bool isPublic = false,
    int maxMembers = 100,
  });

  /// Updates group settings.
  Future<Result<ChatGroup>> updateGroup(
    String groupId, {
    String? name,
    String? description,
    String? iconUrl,
    bool? isPublic,
    int? maxMembers,
  });

  /// Deletes a group (owner only).
  Future<Result<void>> deleteGroup(String groupId);

  /// Gets groups the current user belongs to.
  Future<Result<List<ChatGroup>>> getMyGroups();

  /// Gets a single group by ID.
  Future<Result<ChatGroup>> getGroupById(String groupId);

  /// Leaves a group (transfers ownership if owner).
  Future<Result<void>> leaveGroup(String groupId);

  // ═══════════════════════════════════════════════════════════════════════════
  // MEMBER MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /// Adds members to a group.
  Future<Result<void>> addMembers(String groupId, List<String> userIds);

  /// Removes a member from a group.
  Future<Result<void>> removeMember(String groupId, String memberId);

  /// Updates a member's role.
  Future<Result<void>> updateMemberRole(
    String groupId,
    String memberId,
    GroupMemberRole role,
  );

  /// Gets all members of a group with their profile data.
  Future<Result<List<ChatGroupMember>>> getGroupMembers(String groupId);

  /// Transfers group ownership to another member.
  Future<Result<void>> transferOwnership(String groupId, String newOwnerId);

  /// Gets current user's membership in a group.
  Future<Result<ChatGroupMember?>> getCurrentMembership(String groupId);

  // ═══════════════════════════════════════════════════════════════════════════
  // PERMISSION CHECKS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Checks if current user can manage members in a group.
  Future<Result<bool>> canManageMembers(String groupId);

  /// Checks if current user can edit group settings.
  Future<Result<bool>> canEditGroup(String groupId);

  /// Checks if current user is admin or owner.
  Future<Result<bool>> isGroupAdmin(String groupId);

  // ═══════════════════════════════════════════════════════════════════════════
  // MUTE & READ STATUS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Toggles mute for a group.
  Future<Result<void>> toggleMute(String groupId, {DateTime? mutedUntil});

  /// Updates last read timestamp for a group.
  Future<Result<void>> markAsRead(String groupId);

  // ═══════════════════════════════════════════════════════════════════════════
  // MESSAGING
  // ═══════════════════════════════════════════════════════════════════════════

  /// Sends a message to a group chat.
  Future<Result<void>> sendGroupMessage({
    required String groupId,
    required String content,
    Map<String, dynamic>? attachments,
  });

  /// Streams messages for a group chat in real-time.
  Stream<List<Map<String, dynamic>>> streamGroupMessages(String groupId);

  /// Gets paginated messages for a group.
  Future<Result<List<Map<String, dynamic>>>> getGroupMessages(
    String groupId, {
    int limit = 50,
    String? beforeId,
  });

  /// Gets unread count for a group.
  Future<Result<int>> getUnreadCount(String groupId);

  // ═══════════════════════════════════════════════════════════════════════════
  // SEARCH
  // ═══════════════════════════════════════════════════════════════════════════

  /// Searches for public groups by name.
  Future<Result<List<ChatGroup>>> searchPublicGroups(String query, {int limit = 20});

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /// Gets the current user's ID.
  String? getCurrentUserId();

  // ═══════════════════════════════════════════════════════════════════════════
  // WHATSAPP-LEVEL FEATURES
  // ═══════════════════════════════════════════════════════════════════════════

  /// Gets or creates an invite link for a group.
  Future<Result<GroupInviteLink>> getOrCreateInviteLink(String groupId);

  /// Revokes current invite link and creates a new one.
  Future<Result<GroupInviteLink>> revokeAndCreateInviteLink(String groupId);

  /// Joins a group via invite link code.
  Future<Result<ChatGroup>> joinViaInviteLink(String linkCode);

  /// Sets whether only admins can send messages.
  Future<Result<void>> setOnlyAdminsCanSend(String groupId, bool value);

  /// Sets whether only admins can edit group info.
  Future<Result<void>> setOnlyAdminsCanEdit(String groupId, bool value);

  /// Gets real statistics for a group.
  Future<Result<GroupStats>> getGroupStatistics(String groupId);

  /// Pins or unpins a group for the current user.
  Future<Result<void>> pinGroup(String groupId, bool pinned);

  /// Hides or unhides a group for the current user.
  Future<Result<void>> hideGroup(String groupId, bool hidden);

  /// Clears chat history for the current user.
  Future<Result<void>> clearGroupHistory(String groupId);
}
