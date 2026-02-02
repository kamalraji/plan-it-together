import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/group_event.dart';
import '../models/chat_group.dart';
import '../services/notification_service.dart';
import '../services/logging_service.dart';

/// Service for managing group events and notifications
class GroupEventService {
  static const String _tag = 'GroupEventService';
  static final _log = LoggingService.instance;
  final _supabase = Supabase.instance.client;

  String? get _currentUserId => _supabase.auth.currentUser?.id;

  /// Log a group event
  Future<GroupEvent?> logEvent({
    required String groupId,
    required GroupEventType eventType,
    String? targetId,
    String? targetName,
    String? oldValue,
    String? newValue,
  }) async {
    final userId = _currentUserId;
    if (userId == null) return null;

    try {
      // Get actor name
      String? actorName;
      try {
        final profile = await _supabase
            .from('impact_profiles')
            .select('full_name')
            .eq('user_id', userId)
            .maybeSingle();
        actorName = profile?['full_name'] as String?;
      } catch (e) {
        _log.warning('Failed to get actor name', tag: _tag, error: e);
      }

      final data = await _supabase
          .from('group_events')
          .insert({
            'group_id': groupId,
            'event_type': eventType.databaseValue,
            'actor_id': userId,
            'actor_name': actorName,
            'target_id': targetId,
            'target_name': targetName,
            'old_value': oldValue,
            'new_value': newValue,
          })
          .select()
          .single();

      return GroupEvent.fromJson(data);
    } catch (e) {
      _log.error('Failed to log event', tag: _tag, error: e);
      return null;
    }
  }

  /// Notify all group members about an event
  Future<void> notifyGroupMembers({
    required String groupId,
    required String title,
    required String message,
    String? excludeUserId,
    String? avatarUrl,
    String? actionUrl,
  }) async {
    try {
      // Get all group members
      final members = await _supabase
          .from('chat_group_members')
          .select('user_id')
          .eq('group_id', groupId);

      final memberIds = (members as List)
          .map((m) => m['user_id'] as String)
          .where((id) => id != excludeUserId && id != _currentUserId)
          .toList();

      if (memberIds.isEmpty) return;

      // Insert notifications for all members
      final notifications = memberIds.map((userId) => {
        'user_id': userId,
        'type': 'GROUP_EVENT',
        'title': title,
        'message': message,
        'avatar_url': avatarUrl,
        'action_url': actionUrl ?? '/groups/$groupId',
        'category': 'social',
      }).toList();

      await _supabase.from('notifications').insert(notifications);
    } catch (e) {
      _log.error('Failed to notify group members', tag: _tag, error: e);
    }
  }

  /// Send a system message to the group chat
  Future<void> sendSystemMessage({
    required String groupId,
    required String message,
  }) async {
    try {
      await _supabase.from('messages').insert({
        'group_id': groupId,
        'channel_id': 'group:$groupId',
        'sender_id': _currentUserId ?? 'system',
        'sender_name': 'System',
        'content': message,
        'sent_at': DateTime.now().toIso8601String(),
      });
    } catch (e) {
      _log.error('Failed to send system message', tag: _tag, error: e);
    }
  }

  /// Handle member joined event
  Future<void> onMemberJoined({
    required String groupId,
    required String memberId,
    required String memberName,
    required ChatGroup group,
  }) async {
    // Log event
    await logEvent(
      groupId: groupId,
      eventType: GroupEventType.memberJoined,
      targetId: memberId,
      targetName: memberName,
    );

    // Send system message
    await sendSystemMessage(
      groupId: groupId,
      message: '👋 $memberName joined the group',
    );

    // Notify other members
    await notifyGroupMembers(
      groupId: groupId,
      title: 'New member in ${group.name}',
      message: '$memberName joined the group',
      excludeUserId: memberId,
      avatarUrl: group.iconUrl,
    );
  }

  /// Handle member left event
  Future<void> onMemberLeft({
    required String groupId,
    required String memberId,
    required String memberName,
    required ChatGroup group,
  }) async {
    // Log event
    await logEvent(
      groupId: groupId,
      eventType: GroupEventType.memberLeft,
      targetId: memberId,
      targetName: memberName,
    );

    // Send system message
    await sendSystemMessage(
      groupId: groupId,
      message: '👋 $memberName left the group',
    );
  }

  /// Handle member removed event
  Future<void> onMemberRemoved({
    required String groupId,
    required String memberId,
    required String memberName,
    required ChatGroup group,
  }) async {
    // Log event
    await logEvent(
      groupId: groupId,
      eventType: GroupEventType.memberRemoved,
      targetId: memberId,
      targetName: memberName,
    );

    // Send system message
    await sendSystemMessage(
      groupId: groupId,
      message: '❌ $memberName was removed from the group',
    );

    // Notify the removed user
    try {
      await _supabase.from('notifications').insert({
        'user_id': memberId,
        'type': 'GROUP_REMOVED',
        'title': 'Removed from ${group.name}',
        'message': 'You were removed from the group',
        'avatar_url': group.iconUrl,
        'category': 'social',
      });
    } catch (e) {
      _log.error('Failed to notify removed member', tag: _tag, error: e);
    }
  }

  /// Handle role changed event
  Future<void> onRoleChanged({
    required String groupId,
    required String memberId,
    required String memberName,
    required String oldRole,
    required String newRole,
    required ChatGroup group,
  }) async {
    // Log event
    await logEvent(
      groupId: groupId,
      eventType: GroupEventType.roleChanged,
      targetId: memberId,
      targetName: memberName,
      oldValue: oldRole,
      newValue: newRole,
    );

    // Send system message
    await sendSystemMessage(
      groupId: groupId,
      message: '⭐ $memberName is now ${_formatRole(newRole)}',
    );

    // Notify the affected user
    try {
      await _supabase.from('notifications').insert({
        'user_id': memberId,
        'type': 'GROUP_ROLE_CHANGED',
        'title': 'Role updated in ${group.name}',
        'message': 'You are now ${_formatRole(newRole)}',
        'avatar_url': group.iconUrl,
        'action_url': '/groups/$groupId',
        'category': 'social',
      });
    } catch (e) {
      _log.error('Failed to notify role change', tag: _tag, error: e);
    }
  }

  /// Handle group icon updated event
  Future<void> onIconUpdated({
    required String groupId,
    required ChatGroup group,
  }) async {
    // Log event
    await logEvent(
      groupId: groupId,
      eventType: GroupEventType.iconUpdated,
    );

    // Send system message
    await sendSystemMessage(
      groupId: groupId,
      message: '🖼️ Group icon was updated',
    );
  }

  /// Get recent events for a group
  Future<List<GroupEvent>> getGroupEvents(String groupId, {int limit = 50}) async {
    try {
      final data = await _supabase
          .from('group_events')
          .select()
          .eq('group_id', groupId)
          .order('created_at', ascending: false)
          .limit(limit);

      return (data as List)
          .map((e) => GroupEvent.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _log.error('Failed to get group events', tag: _tag, error: e);
      return [];
    }
  }

  /// Stream group events in real-time
  Stream<List<GroupEvent>> streamGroupEvents(String groupId) {
    return _supabase
        .from('group_events')
        .stream(primaryKey: ['id'])
        .eq('group_id', groupId)
        .order('created_at', ascending: false)
        .map((data) => data
            .map((e) => GroupEvent.fromJson(e as Map<String, dynamic>))
            .toList());
  }

  String _formatRole(String role) {
    switch (role.toLowerCase()) {
      case 'owner':
        return 'the Owner';
      case 'admin':
        return 'an Admin';
      case 'moderator':
        return 'a Moderator';
      default:
        return 'a Member';
    }
  }
}
