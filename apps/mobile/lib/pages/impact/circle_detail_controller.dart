import 'package:flutter/foundation.dart';
import 'package:thittam1hub/models/circle.dart';
import 'package:thittam1hub/models/circle_invite_link.dart';
import 'package:thittam1hub/models/circle_invitation.dart';
import 'package:thittam1hub/supabase/circle_service.dart';
import 'package:thittam1hub/services/logging_service.dart';
import 'package:thittam1hub/utils/result.dart';
import 'package:thittam1hub/utils/logging_mixin.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';

/// Controller for Circle detail page
class CircleDetailController extends ChangeNotifier with LoggingMixin {
  final String circleId;
  final CircleService _circleService = CircleService();

  @override
  String get tag => 'CircleDetailController';

  Circle? circle;
  List<CircleMember> members = [];
  CircleMember? currentMembership;
  CircleInviteLink? inviteLink;
  List<CircleInvitation> pendingInvitations = [];

  bool isLoading = true;
  bool isMember = false;
  bool isAdmin = false;
  bool isModerator = false;
  String? error;

  // Stats
  int messageCount = 0;
  int daysActive = 0;

  CircleDetailController({
    required this.circleId,
    Circle? initialCircle,
  }) {
    if (initialCircle != null) {
      circle = initialCircle;
    }
    _initialize();
  }

  String? get _currentUserId => SupabaseConfig.client.auth.currentUser?.id;

  Future<void> _initialize() async {
    await loadData();
  }

  Future<void> loadData() async {
    isLoading = true;
    error = null;
    notifyListeners();

    try {
      // Load circle details
      final circleResult = await _circleService.getCircleById(circleId);
      if (circleResult == null) {
        error = 'Circle not found';
        isLoading = false;
        notifyListeners();
        return;
      }
      circle = circleResult;

      // Load members (limited preview)
      members = await _circleService.getCircleMembers(circleId);

      // Check current user membership
      await _checkMembership();

      // Load invite link if admin
      if (isAdmin || isModerator) {
        await _loadInviteLink();
        await _loadPendingInvitations();
      }

      // Calculate stats
      await _calculateStats();

      isLoading = false;
      notifyListeners();
    } catch (e, stack) {
      logError('Failed to load circle data', error: e, stackTrace: stack);
      error = 'Failed to load circle';
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> _checkMembership() async {
    final userId = _currentUserId;
    if (userId == null) {
      isMember = false;
      isAdmin = false;
      isModerator = false;
      return;
    }

    isMember = await _circleService.isUserMember(circleId);
    if (isMember) {
      final role = await _circleService.getUserRole(circleId);
      isAdmin = role == 'ADMIN';
      isModerator = role == 'MODERATOR';

      // Find current membership details
      currentMembership = members.cast<CircleMember?>().firstWhere(
            (m) => m?.userId == userId,
            orElse: () => null,
          );
    }
  }

  Future<void> _loadInviteLink() async {
    try {
      inviteLink = await _circleService.getOrCreateInviteLink(circleId);
    } catch (e) {
      logWarning('Failed to load invite link', error: e);
    }
  }

  Future<void> _loadPendingInvitations() async {
    try {
      pendingInvitations = await _circleService.getPendingInvitations(circleId);
      notifyListeners();
    } catch (e) {
      logWarning('Failed to load pending invitations', error: e);
    }
  }

  Future<void> _calculateStats() async {
    if (circle == null) return;
    
    // Days active since creation
    daysActive = DateTime.now().difference(circle!.createdAt).inDays;
    if (daysActive < 1) daysActive = 1;

    // Message count would need a separate query
    // For now, we'll estimate or load separately
  }

  Future<Result<void>> joinCircle() async {
    try {
      await _circleService.joinCircle(circleId);
      isMember = true;
      isAdmin = false;
      isModerator = false;
      
      // Increment member count locally
      if (circle != null) {
        circle = Circle(
          id: circle!.id,
          eventId: circle!.eventId,
          name: circle!.name,
          description: circle!.description,
          icon: circle!.icon,
          type: circle!.type,
          category: circle!.category,
          memberCount: circle!.memberCount + 1,
          isPrivate: circle!.isPrivate,
          isPublic: circle!.isPublic,
          maxMembers: circle!.maxMembers,
          tags: circle!.tags,
          createdBy: circle!.createdBy,
          createdAt: circle!.createdAt,
        );
      }

      notifyListeners();
      return Result.success(null);
    } catch (e, stack) {
      logError('Failed to join circle', error: e, stackTrace: stack);
      return Result.failure('Failed to join circle');
    }
  }

  Future<Result<void>> leaveCircle() async {
    try {
      await _circleService.leaveCircle(circleId);
      isMember = false;
      isAdmin = false;
      isModerator = false;
      currentMembership = null;

      // Decrement member count locally
      if (circle != null) {
        circle = Circle(
          id: circle!.id,
          eventId: circle!.eventId,
          name: circle!.name,
          description: circle!.description,
          icon: circle!.icon,
          type: circle!.type,
          category: circle!.category,
          memberCount: circle!.memberCount - 1,
          isPrivate: circle!.isPrivate,
          isPublic: circle!.isPublic,
          maxMembers: circle!.maxMembers,
          tags: circle!.tags,
          createdBy: circle!.createdBy,
          createdAt: circle!.createdAt,
        );
      }

      notifyListeners();
      return Result.success(null);
    } catch (e, stack) {
      logError('Failed to leave circle', error: e, stackTrace: stack);
      return Result.failure('Failed to leave circle');
    }
  }

  Future<Result<CircleInviteLink>> generateInviteLink() async {
    try {
      final link = await _circleService.getOrCreateInviteLink(circleId);
      if (link != null) {
        inviteLink = link;
        notifyListeners();
        return Result.success(link);
      }
      return Result.failure('Failed to create invite link');
    } catch (e, stack) {
      logError('Failed to generate invite link', error: e, stackTrace: stack);
      return Result.failure('Failed to generate invite link');
    }
  }

  Future<Result<void>> revokeAndRecreateInviteLink() async {
    try {
      final link = await _circleService.revokeAndCreateInviteLink(circleId);
      if (link != null) {
        inviteLink = link;
        notifyListeners();
        return Result.success(null);
      }
      return Result.failure('Failed to revoke invite link');
    } catch (e, stack) {
      logError('Failed to revoke invite link', error: e, stackTrace: stack);
      return Result.failure('Failed to revoke invite link');
    }
  }

  Future<Result<void>> inviteUser(String userId) async {
    try {
      await _circleService.inviteUser(circleId, userId);
      await _loadPendingInvitations();
      return Result.success(null);
    } catch (e, stack) {
      logError('Failed to invite user', error: e, stackTrace: stack);
      return Result.failure('Failed to invite user');
    }
  }

  Future<Result<void>> cancelInvitation(String invitationId) async {
    try {
      await _circleService.cancelInvitation(invitationId);
      pendingInvitations.removeWhere((i) => i.id == invitationId);
      notifyListeners();
      return Result.success(null);
    } catch (e, stack) {
      logError('Failed to cancel invitation', error: e, stackTrace: stack);
      return Result.failure('Failed to cancel invitation');
    }
  }

  Future<Result<void>> updateMemberRole(String userId, String newRole) async {
    try {
      await _circleService.updateMemberRole(
        circleId: circleId,
        targetUserId: userId,
        newRole: newRole,
      );
      
      // Update local state
      final index = members.indexWhere((m) => m.userId == userId);
      if (index != -1) {
        members[index] = CircleMember(
          circleId: members[index].circleId,
          userId: members[index].userId,
          role: newRole,
          joinedAt: members[index].joinedAt,
        );
      }
      
      notifyListeners();
      return Result.success(null);
    } catch (e, stack) {
      logError('Failed to update member role', error: e, stackTrace: stack);
      return Result.failure('Failed to update member role');
    }
  }

  Future<Result<void>> removeMember(String userId) async {
    try {
      await _circleService.removeMember(
        circleId: circleId,
        targetUserId: userId,
      );
      
      members.removeWhere((m) => m.userId == userId);
      notifyListeners();
      return Result.success(null);
    } catch (e, stack) {
      logError('Failed to remove member', error: e, stackTrace: stack);
      return Result.failure('Failed to remove member');
    }
  }

  Future<Result<void>> deleteCircle() async {
    try {
      await _circleService.deleteCircle(circleId);
      return Result.success(null);
    } catch (e, stack) {
      logError('Failed to delete circle', error: e, stackTrace: stack);
      return Result.failure('Failed to delete circle');
    }
  }

  Future<void> toggleMute() async {
    if (currentMembership == null) return;
    
    try {
      await _circleService.toggleMute(circleId);
      await _checkMembership();
      notifyListeners();
    } catch (e) {
      logWarning('Failed to toggle mute', error: e);
    }
  }

  @override
  void dispose() {
    super.dispose();
  }
}
