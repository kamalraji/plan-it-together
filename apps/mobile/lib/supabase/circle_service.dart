import 'package:flutter/foundation.dart';
import 'package:thittam1hub/models/circle.dart';
import 'package:thittam1hub/models/circle_invite_link.dart';
import 'package:thittam1hub/models/circle_invitation.dart';
import 'package:thittam1hub/models/circle_message_attachment.dart';
import 'package:thittam1hub/models/circle_message_reaction.dart';
import 'package:thittam1hub/models/enhanced_circle_message.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:thittam1hub/services/logging_service.dart';
class CircleService {
  // Logging
   static final _log = LoggingService.instance;
   static const String _tag = 'CircleService';

  final _supabase = SupabaseConfig.client;

  // ================== READ Operations ==================

  /// Get a single circle by ID
  Future<Circle?> getCircleById(String circleId) async {
    try {
      final response = await _supabase
          .from('circles')
          .select('*')
          .eq('id', circleId)
          .maybeSingle();

      if (response == null) return null;
      return Circle.fromMap(response as Map<String, dynamic>);
    } catch (e) {
      _log.error('Error fetching circle: $e', tag: _tag);
      return null;
    }
  }

  /// Fetches all public circles
  Future<List<Circle>> getAllPublicCircles({int limit = 50}) async {
    try {
      final response = await _supabase
          .from('circles')
          .select('*')
          .eq('is_public', true)
          .order('member_count', ascending: false)
          .limit(limit);

      return (response as List)
          .map((data) => Circle.fromMap(data as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _log.error('Error fetching public circles: $e', tag: _tag);
      return [];
    }
  }

  /// Fetches circles by category
  Future<List<Circle>> getCirclesByCategory(String category, {int limit = 20}) async {
    try {
      final response = await _supabase
          .from('circles')
          .select('*')
          .eq('category', category)
          .eq('is_public', true)
          .order('member_count', ascending: false)
          .limit(limit);

      return (response as List)
          .map((data) => Circle.fromMap(data as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _log.error('Error fetching circles by category: $e', tag: _tag);
      return [];
    }
  }

  /// Fetches circles for a specific event
  Future<List<Circle>> getCirclesByEvent(String eventId, {int limit = 20}) async {
    try {
      final response = await _supabase
          .from('circles')
          .select('*')
          .eq('event_id', eventId)
          .order('member_count', ascending: false)
          .limit(limit);

      return (response as List)
          .map((data) => Circle.fromMap(data as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _log.error('Error fetching event circles: $e', tag: _tag);
      return [];
    }
  }

  /// Fetches circles created by current user
  Future<List<Circle>> getMyCreatedCircles() async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return [];

      final response = await _supabase
          .from('circles')
          .select('*')
          .eq('created_by', userId)
          .order('created_at', ascending: false);

      return (response as List)
          .map((data) => Circle.fromMap(data as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _log.error('Error fetching my created circles: $e', tag: _tag);
      return [];
    }
  }

  /// Fetches circles the user has joined
  Future<List<Circle>> getMyJoinedCircles() async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return [];

      // Get circle IDs user is member of
      final memberRows = await _supabase
          .from('circle_members')
          .select('circle_id')
          .eq('user_id', userId);

      final circleIds = (memberRows as List)
          .map((e) => e['circle_id'] as String)
          .toList();

      if (circleIds.isEmpty) return [];

      // Fetch circle details
      final response = await _supabase
          .from('circles')
          .select('*')
          .inFilter('id', circleIds)
          .order('created_at', ascending: false);

      return (response as List)
          .map((data) => Circle.fromMap(data as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _log.error('Error fetching my joined circles: $e', tag: _tag);
      return [];
    }
  }

  /// Fetches circle IDs the user has joined
  Future<Set<String>> getUserCircles() async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return {};

      // Get circle IDs user is member of
      final memberRows = await _supabase
          .from('circle_members')
          .select('circle_id')
          .eq('user_id', userId);

      return (memberRows as List)
          .map((e) => e['circle_id'] as String)
          .toSet();
    } catch (e) {
      _log.error('Error fetching user circles: $e', tag: _tag);
      return {};
    }
  }

  /// Fetches auto-matched circles based on user interests
  Future<List<Circle>> getAutoMatchedCircles() async {
    try {
      final response = await _supabase
          .from('circles')
          .select('*')
          .eq('is_public', true)
          .order('member_count', ascending: false)
          .limit(2);

      return (response as List)
          .map((data) => Circle.fromMap(data as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _log.error('Error fetching auto-matched circles: $e', tag: _tag);
      return [];
    }
  }

  /// Fetches popular circles
  Future<List<Circle>> getPopularCircles({int limit = 5}) async {
    try {
      final response = await _supabase
          .from('circles')
          .select('*')
          .eq('is_public', true)
          .order('member_count', ascending: false)
          .limit(limit);

      return (response as List)
          .map((data) => Circle.fromMap(data as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _log.error('Error fetching popular circles: $e', tag: _tag);
      return [];
    }
  }

  /// Fetches recommended circles for the user
  Future<List<Circle>> getRecommendedCircles({int limit = 5}) async {
    try {
      // TODO: Implement smarter recommendation based on user interests/skills
      final response = await _supabase
          .from('circles')
          .select('*')
          .eq('is_public', true)
          .order('created_at', ascending: false)
          .limit(limit);

      return (response as List)
          .map((data) => Circle.fromMap(data as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _log.error('Error fetching recommended circles: $e', tag: _tag);
      return [];
    }
  }

  /// Search circles by name or tags
  Future<List<Circle>> searchCircles(String query, {int limit = 20}) async {
    try {
      final response = await _supabase
          .from('circles')
          .select('*')
          .eq('is_public', true)
          .or('name.ilike.%$query%,tags.cs.{$query}')
          .order('member_count', ascending: false)
          .limit(limit);

      return (response as List)
          .map((data) => Circle.fromMap(data as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _log.error('Error searching circles: $e', tag: _tag);
      return [];
    }
  }

  // ================== CREATE Operations ==================

  /// Create a new circle and auto-join the creator as admin
  Future<String> createCircle({
    required String name,
    String? description,
    required String icon,
    required bool isPublic,
    String? eventId,
    String type = 'USER_CREATED',
    String category = 'INTEREST',
    int? maxMembers,
    List<String> tags = const [],
  }) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      final inserted = await _supabase.from('circles').insert({
        'name': name,
        'description': description,
        'icon': icon,
        'created_by': userId,
        'is_public': isPublic,
        'is_private': !isPublic,
        'event_id': eventId,
        'type': type,
        'category': category,
        'max_members': maxMembers,
        'member_count': 1,
        'tags': tags,
      }).select('id').single();

      final circleId = inserted['id'] as String;

      // Add creator as admin member
      await _supabase.from('circle_members').insert({
        'circle_id': circleId,
        'user_id': userId,
        'role': 'ADMIN',
      });

      _log.info('🆕 Created circle: $circleId', tag: _tag);
      return circleId;
    } catch (e) {
      _log.error('❌ Error creating circle: $e', tag: _tag);
      rethrow;
    }
  }

  // ================== UPDATE Operations ==================

  /// Update circle details (only creator/admin can update)
  Future<void> updateCircle({
    required String circleId,
    String? name,
    String? description,
    String? icon,
    bool? isPublic,
    String? category,
    int? maxMembers,
    List<String>? tags,
  }) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      final updates = <String, dynamic>{};
      if (name != null) updates['name'] = name;
      if (description != null) updates['description'] = description;
      if (icon != null) updates['icon'] = icon;
      if (isPublic != null) {
        updates['is_public'] = isPublic;
        updates['is_private'] = !isPublic;
      }
      if (category != null) updates['category'] = category;
      if (maxMembers != null) updates['max_members'] = maxMembers;
      if (tags != null) updates['tags'] = tags;

      if (updates.isEmpty) return;

      await _supabase
          .from('circles')
          .update(updates)
          .eq('id', circleId)
          .eq('created_by', userId); // Only creator can update

      _log.info('✅ Updated circle: $circleId', tag: _tag);
    } catch (e) {
      _log.error('❌ Error updating circle: $e', tag: _tag);
      rethrow;
    }
  }

  // ================== DELETE Operations ==================

  /// Delete a circle (only creator can delete)
  Future<void> deleteCircle(String circleId) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      await _supabase
          .from('circles')
          .delete()
          .eq('id', circleId)
          .eq('created_by', userId); // Only creator can delete

      _log.debug('🗑️ Deleted circle: $circleId', tag: _tag);
    } catch (e) {
      _log.error('❌ Error deleting circle: $e', tag: _tag);
      rethrow;
    }
  }

  // ================== MEMBERSHIP Operations ==================

  /// Check if user is a member of a circle
  Future<bool> isUserMember(String circleId) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return false;

      final response = await _supabase
          .from('circle_members')
          .select('user_id')
          .eq('circle_id', circleId)
          .eq('user_id', userId)
          .maybeSingle();

      return response != null;
    } catch (e) {
      _log.error('Error checking circle membership: $e', tag: _tag);
      return false;
    }
  }

  /// Get user's role in a circle
  Future<String?> getUserRole(String circleId) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return null;

      final response = await _supabase
          .from('circle_members')
          .select('role')
          .eq('circle_id', circleId)
          .eq('user_id', userId)
          .maybeSingle();

      return response?['role'] as String?;
    } catch (e) {
      _log.error('Error getting user role: $e', tag: _tag);
      return null;
    }
  }

  /// Get all circle IDs the user is a member of
  Future<Set<String>> getUserCircleIds() async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return {};

      final response = await _supabase
          .from('circle_members')
          .select('circle_id')
          .eq('user_id', userId);

      return (response as List)
          .map((e) => e['circle_id'] as String)
          .toSet();
    } catch (e) {
      _log.error('Error fetching user circles: $e', tag: _tag);
      return {};
    }
  }

  /// Get all members of a circle
  Future<List<CircleMember>> getCircleMembers(String circleId) async {
    try {
      final response = await _supabase
          .from('circle_members')
          .select('*')
          .eq('circle_id', circleId)
          .order('joined_at', ascending: true);

      return (response as List)
          .map((data) => CircleMember.fromMap(data as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _log.error('Error fetching circle members: $e', tag: _tag);
      return [];
    }
  }

  /// Get member count for a circle
  Future<int> getMemberCount(String circleId) async {
    try {
      final response = await _supabase
          .from('circle_members')
          .select('user_id')
          .eq('circle_id', circleId);

      return (response as List).length;
    } catch (e) {
      _log.error('Error getting member count: $e', tag: _tag);
      return 0;
    }
  }

  /// Join a circle
  Future<void> joinCircle(String circleId) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      // Check if circle has max members limit
      final circle = await getCircleById(circleId);
      if (circle != null && circle.maxMembers != null) {
        final currentCount = await getMemberCount(circleId);
        if (currentCount >= circle.maxMembers!) {
          throw Exception('Circle is full');
        }
      }

      await _supabase.from('circle_members').insert({
        'circle_id': circleId,
        'user_id': userId,
        'role': 'MEMBER',
      });

      // Update member count
      await _updateMemberCount(circleId, 1);

      _log.info('✅ Joined circle: $circleId', tag: _tag);
    } catch (e) {
      _log.error('❌ Error joining circle: $e', tag: _tag);
      rethrow;
    }
  }

  /// Leave a circle
  Future<void> leaveCircle(String circleId) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      await _supabase
          .from('circle_members')
          .delete()
          .match({'circle_id': circleId, 'user_id': userId});

      // Update member count
      await _updateMemberCount(circleId, -1);

      _log.debug('🚪 Left circle: $circleId', tag: _tag);
    } catch (e) {
      _log.error('❌ Error leaving circle: $e', tag: _tag);
      rethrow;
    }
  }

  /// Update member role (admin only)
  Future<void> updateMemberRole({
    required String circleId,
    required String targetUserId,
    required String newRole,
  }) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      // Verify current user is admin
      final currentRole = await getUserRole(circleId);
      if (currentRole != 'ADMIN') {
        throw Exception('Only admins can change roles');
      }

      await _supabase
          .from('circle_members')
          .update({'role': newRole})
          .eq('circle_id', circleId)
          .eq('user_id', targetUserId);

      _log.debug('👑 Updated role for $targetUserId to $newRole', tag: _tag);
    } catch (e) {
      _log.error('❌ Error updating member role: $e', tag: _tag);
      rethrow;
    }
  }

  /// Remove a member from circle (admin only)
  Future<void> removeMember({
    required String circleId,
    required String targetUserId,
  }) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      // Verify current user is admin
      final currentRole = await getUserRole(circleId);
      if (currentRole != 'ADMIN') {
        throw Exception('Only admins can remove members');
      }

      await _supabase
          .from('circle_members')
          .delete()
          .eq('circle_id', circleId)
          .eq('user_id', targetUserId);

      // Update member count
      await _updateMemberCount(circleId, -1);

      _log.debug('🚫 Removed member $targetUserId from circle', tag: _tag);
    } catch (e) {
      _log.error('❌ Error removing member: $e', tag: _tag);
      rethrow;
    }
  }

  /// Helper to update member count
  Future<void> _updateMemberCount(String circleId, int delta) async {
    try {
      final circle = await getCircleById(circleId);
      if (circle == null) return;

      final newCount = (circle.memberCount + delta).clamp(0, 999999);
      await _supabase
          .from('circles')
          .update({'member_count': newCount})
          .eq('id', circleId);
    } catch (e) {
      _log.error('Error updating member count: $e', tag: _tag);
    }
  }

  // ================== MESSAGING Operations ==================

  /// Send a message in a circle
  Future<void> sendMessage(String circleId, String content) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      await _supabase.from('circle_messages').insert({
        'circle_id': circleId,
        'user_id': userId,
        'content': content,
      });

      _log.debug('💬 Message sent to circle: $circleId', tag: _tag);
    } catch (e) {
      _log.error('❌ Error sending message: $e', tag: _tag);
      rethrow;
    }
  }

  /// Get messages for a circle
  Future<List<CircleMessage>> getMessages(String circleId, {int limit = 50}) async {
    try {
      final response = await _supabase
          .from('circle_messages')
          .select('*')
          .eq('circle_id', circleId)
          .order('created_at', ascending: false)
          .limit(limit);

      return (response as List)
          .map((data) => CircleMessage.fromMap(data as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _log.error('Error fetching messages: $e', tag: _tag);
      return [];
    }
  }

  /// Get real-time stream of messages for a circle
  Stream<List<CircleMessage>> getMessagesStream(String circleId) {
    return _supabase
        .from('circle_messages')
        .stream(primaryKey: ['id'])
        .eq('circle_id', circleId)
        .order('created_at', ascending: false)
        .map((payload) =>
            payload.map((e) => CircleMessage.fromMap(e)).toList());
  }

  /// Delete a message (only message author or admin)
  Future<void> deleteMessage(String messageId) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      await _supabase
          .from('circle_messages')
          .delete()
          .eq('id', messageId)
          .eq('user_id', userId); // Only author can delete

      _log.debug('🗑️ Deleted message: $messageId', tag: _tag);
    } catch (e) {
      _log.error('❌ Error deleting message: $e', tag: _tag);
      rethrow;
    }
  }

  // ================== REAL-TIME Subscriptions ==================

  /// Subscribe to circle updates
  RealtimeChannel subscribeToCircle(String circleId, Function(Circle) onUpdate) {
    return _supabase
        .channel('circle_$circleId')
        .onPostgresChanges(
          event: PostgresChangeEvent.update,
          schema: 'public',
          table: 'circles',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'id',
            value: circleId,
          ),
          callback: (payload) {
            try {
              final data = payload.newRecord;
              final circle = Circle.fromMap(data);
              onUpdate(circle);
            } catch (e) {
              _log.error('Error in circle update callback: $e', tag: _tag);
            }
          },
        )
        .subscribe();
  }

  /// Subscribe to member changes in a circle
  RealtimeChannel subscribeToMembers(
    String circleId,
    Function(List<CircleMember>) onMembersChange,
  ) {
    return _supabase
        .channel('circle_members_$circleId')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'circle_members',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'circle_id',
            value: circleId,
          ),
          callback: (payload) async {
            try {
              // Refetch all members on any change
              final members = await getCircleMembers(circleId);
              onMembersChange(members);
            } catch (e) {
              _log.error('Error in members callback: $e', tag: _tag);
            }
          },
        )
        .subscribe();
  }

  /// Subscribe to new messages in a circle
  RealtimeChannel subscribeToNewMessages(
    String circleId,
    Function(CircleMessage) onNewMessage,
  ) {
    return _supabase
        .channel('circle_messages_$circleId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'circle_messages',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'circle_id',
            value: circleId,
          ),
          callback: (payload) {
            try {
              final data = payload.newRecord;
              final message = CircleMessage.fromMap(data);
              onNewMessage(message);
            } catch (e) {
              _log.error('Error in new message callback: $e', tag: _tag);
            }
          },
        )
        .subscribe();
  }

  // ================== INVITE LINK Operations ==================

  /// Get or create an invite link for a circle
  Future<CircleInviteLink?> getOrCreateInviteLink(String circleId) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      // Check if user is admin
      final role = await getUserRole(circleId);
      if (role != 'ADMIN' && role != 'MODERATOR') {
        throw Exception('Only admins can create invite links');
      }

      // Check for existing active link
      final existing = await _supabase
          .from('circle_invite_links')
          .select('*')
          .eq('circle_id', circleId)
          .eq('is_active', true)
          .maybeSingle();

      if (existing != null) {
        return CircleInviteLink.fromMap(existing as Map<String, dynamic>);
      }

      // Create new link
      final inserted = await _supabase.from('circle_invite_links').insert({
        'circle_id': circleId,
        'created_by': userId,
        'is_active': true,
      }).select().single();

      _log.info('🔗 Created invite link for circle: $circleId', tag: _tag);
      return CircleInviteLink.fromMap(inserted as Map<String, dynamic>);
    } catch (e) {
      _log.error('Error creating invite link: $e', tag: _tag);
      return null;
    }
  }

  /// Revoke current link and create a new one
  Future<CircleInviteLink?> revokeAndCreateInviteLink(String circleId) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      // Deactivate existing links
      await _supabase
          .from('circle_invite_links')
          .update({'is_active': false})
          .eq('circle_id', circleId);

      // Create new link
      final inserted = await _supabase.from('circle_invite_links').insert({
        'circle_id': circleId,
        'created_by': userId,
        'is_active': true,
      }).select().single();

      _log.info('🔄 Revoked and created new invite link', tag: _tag);
      return CircleInviteLink.fromMap(inserted as Map<String, dynamic>);
    } catch (e) {
      _log.error('Error revoking invite link: $e', tag: _tag);
      return null;
    }
  }

  /// Get invite link info (public preview)
  Future<Map<String, dynamic>?> getInviteLinkInfo(String linkCode) async {
    try {
      final response = await _supabase
          .from('circle_invite_links')
          .select('*, circles(*)')
          .eq('link_code', linkCode)
          .eq('is_active', true)
          .maybeSingle();

      if (response == null) return null;

      // Check expiration
      final expiresAt = response['expires_at'];
      if (expiresAt != null && DateTime.parse(expiresAt).isBefore(DateTime.now())) {
        return null;
      }

      // Check max uses
      final maxUses = response['max_uses'] as int?;
      final useCount = response['use_count'] as int? ?? 0;
      if (maxUses != null && useCount >= maxUses) {
        return null;
      }

      return response as Map<String, dynamic>;
    } catch (e) {
      _log.error('Error getting invite link info: $e', tag: _tag);
      return null;
    }
  }

  /// Join a circle via invite link
  Future<bool> joinViaInviteLink(String linkCode) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      // Get link info
      final linkInfo = await getInviteLinkInfo(linkCode);
      if (linkInfo == null) throw Exception('Invalid or expired invite link');

      final circleId = linkInfo['circle_id'] as String;

      // Check if already a member
      final isMember = await isUserMember(circleId);
      if (isMember) return true; // Already a member

      // Check max members
      final circleData = linkInfo['circles'] as Map<String, dynamic>?;
      if (circleData != null) {
        final maxMembers = circleData['max_members'] as int?;
        final memberCount = circleData['member_count'] as int? ?? 0;
        if (maxMembers != null && memberCount >= maxMembers) {
          throw Exception('Circle is full');
        }
      }

      // Join the circle
      await _supabase.from('circle_members').insert({
        'circle_id': circleId,
        'user_id': userId,
        'role': 'MEMBER',
      });

      // Update member count
      await _updateMemberCount(circleId, 1);

      // Increment use count
      await _supabase
          .from('circle_invite_links')
          .update({'use_count': (linkInfo['use_count'] as int? ?? 0) + 1})
          .eq('id', linkInfo['id']);

      _log.info('✅ Joined circle via invite link: $circleId', tag: _tag);
      return true;
    } catch (e) {
      _log.error('Error joining via invite link: $e', tag: _tag);
      rethrow;
    }
  }

  // ================== INVITATION Operations ==================

  /// Invite a user directly to a circle
  Future<CircleInvitation?> inviteUser(String circleId, String inviteeId) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      // Check if already a member
      final existingMember = await _supabase
          .from('circle_members')
          .select('id')
          .eq('circle_id', circleId)
          .eq('user_id', inviteeId)
          .maybeSingle();

      if (existingMember != null) {
        throw Exception('User is already a member');
      }

      // Check for pending invitation
      final existingInvite = await _supabase
          .from('circle_invitations')
          .select('id')
          .eq('circle_id', circleId)
          .eq('invitee_id', inviteeId)
          .eq('status', 'PENDING')
          .maybeSingle();

      if (existingInvite != null) {
        throw Exception('Invitation already pending');
      }

      final inserted = await _supabase.from('circle_invitations').insert({
        'circle_id': circleId,
        'inviter_id': userId,
        'invitee_id': inviteeId,
        'status': 'PENDING',
      }).select().single();

      _log.info('📨 Sent circle invitation to: $inviteeId', tag: _tag);
      return CircleInvitation.fromMap(inserted as Map<String, dynamic>);
    } catch (e) {
      _log.error('Error inviting user: $e', tag: _tag);
      rethrow;
    }
  }

  /// Get pending invitations for a circle (admin view)
  Future<List<CircleInvitation>> getPendingInvitations(String circleId) async {
    try {
      final response = await _supabase
          .from('circle_invitations')
          .select('*')
          .eq('circle_id', circleId)
          .eq('status', 'PENDING')
          .order('created_at', ascending: false);

      return (response as List)
          .map((data) => CircleInvitation.fromMap(data as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _log.error('Error fetching pending invitations: $e', tag: _tag);
      return [];
    }
  }

  /// Get invitations received by current user
  Future<List<CircleInvitation>> getMyInvitations() async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return [];

      final response = await _supabase
          .from('circle_invitations')
          .select('*, circles(*)')
          .eq('invitee_id', userId)
          .eq('status', 'PENDING')
          .order('created_at', ascending: false);

      return (response as List)
          .map((data) => CircleInvitation.fromMap(data as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _log.error('Error fetching my invitations: $e', tag: _tag);
      return [];
    }
  }

  /// Respond to an invitation
  Future<bool> respondToInvitation(String invitationId, bool accept) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      // Get invitation
      final invitation = await _supabase
          .from('circle_invitations')
          .select('*')
          .eq('id', invitationId)
          .eq('invitee_id', userId)
          .single();

      final circleId = invitation['circle_id'] as String;

      // Update invitation status
      await _supabase
          .from('circle_invitations')
          .update({
            'status': accept ? 'ACCEPTED' : 'DECLINED',
            'responded_at': DateTime.now().toIso8601String(),
          })
          .eq('id', invitationId);

      if (accept) {
        // Join the circle
        await _supabase.from('circle_members').insert({
          'circle_id': circleId,
          'user_id': userId,
          'role': 'MEMBER',
          'invited_by': invitation['inviter_id'],
        });

        await _updateMemberCount(circleId, 1);
        _log.info('✅ Accepted invitation and joined circle: $circleId', tag: _tag);
      } else {
        _log.info('❌ Declined invitation: $invitationId', tag: _tag);
      }

      return true;
    } catch (e) {
      _log.error('Error responding to invitation: $e', tag: _tag);
      return false;
    }
  }

  /// Cancel a pending invitation (inviter only)
  Future<bool> cancelInvitation(String invitationId) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      await _supabase
          .from('circle_invitations')
          .delete()
          .eq('id', invitationId)
          .eq('inviter_id', userId);

      _log.debug('🗑️ Cancelled invitation: $invitationId', tag: _tag);
      return true;
    } catch (e) {
      _log.error('Error cancelling invitation: $e', tag: _tag);
      return false;
    }
  }

  // ================== ENHANCED MESSAGING Operations ==================

  /// Send enhanced message with attachments and reply support
  Future<EnhancedCircleMessage?> sendEnhancedMessage(
    String circleId,
    String content, {
    List<CircleMessageAttachment>? attachments,
    String? replyToId,
  }) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      // Get user profile for sender info
      final profile = await _supabase
          .from('user_profiles')
          .select('full_name, avatar_url')
          .eq('id', userId)
          .maybeSingle();

      final inserted = await _supabase.from('circle_messages').insert({
        'circle_id': circleId,
        'user_id': userId,
        'content': content,
        'attachments': attachments?.map((a) => a.toMap()).toList(),
        'reply_to_id': replyToId,
        'sender_name': profile?['full_name'],
        'sender_avatar': profile?['avatar_url'],
      }).select().single();

      _log.debug('💬 Sent enhanced message to circle: $circleId', tag: _tag);
      return EnhancedCircleMessage.fromMap(inserted as Map<String, dynamic>);
    } catch (e) {
      _log.error('Error sending enhanced message: $e', tag: _tag);
      return null;
    }
  }

  /// Get enhanced messages with reactions
  Future<List<EnhancedCircleMessage>> getEnhancedMessages(
    String circleId, {
    int limit = 50,
    String? before,
  }) async {
    try {
      var query = _supabase
          .from('circle_messages')
          .select('*')
          .eq('circle_id', circleId)
          .eq('is_deleted', false);

      if (before != null) {
        query = query.lt('created_at', before);
      }

      final response = await query
          .order('created_at', ascending: false)
          .limit(limit);

      return (response as List)
          .map((data) => EnhancedCircleMessage.fromMap(data as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _log.error('Error fetching enhanced messages: $e', tag: _tag);
      return [];
    }
  }

  /// Edit a message
  Future<bool> editMessage(String messageId, String newContent) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      await _supabase
          .from('circle_messages')
          .update({
            'content': newContent,
            'edited_at': DateTime.now().toIso8601String(),
          })
          .eq('id', messageId)
          .eq('user_id', userId);

      _log.debug('✏️ Edited message: $messageId', tag: _tag);
      return true;
    } catch (e) {
      _log.error('Error editing message: $e', tag: _tag);
      return false;
    }
  }

  /// Soft delete a message (for "deleted for everyone")
  Future<bool> softDeleteMessage(String messageId) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      await _supabase
          .from('circle_messages')
          .update({
            'is_deleted': true,
            'content': 'This message was deleted',
          })
          .eq('id', messageId)
          .eq('user_id', userId);

      _log.debug('🗑️ Soft deleted message: $messageId', tag: _tag);
      return true;
    } catch (e) {
      _log.error('Error soft deleting message: $e', tag: _tag);
      return false;
    }
  }

  // ================== REACTION Operations ==================

  /// Add a reaction to a message
  Future<bool> addReaction(String messageId, String emoji) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      await _supabase.from('circle_message_reactions').upsert({
        'message_id': messageId,
        'user_id': userId,
        'emoji': emoji,
      }, onConflict: 'message_id,user_id,emoji');

      _log.debug('👍 Added reaction $emoji to message: $messageId', tag: _tag);
      return true;
    } catch (e) {
      _log.error('Error adding reaction: $e', tag: _tag);
      return false;
    }
  }

  /// Remove a reaction from a message
  Future<bool> removeReaction(String messageId, String emoji) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      await _supabase
          .from('circle_message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', userId)
          .eq('emoji', emoji);

      _log.debug('👎 Removed reaction $emoji from message: $messageId', tag: _tag);
      return true;
    } catch (e) {
      _log.error('Error removing reaction: $e', tag: _tag);
      return false;
    }
  }

  /// Get reactions for multiple messages
  Future<List<CircleMessageReaction>> getReactionsForMessages(List<String> messageIds) async {
    if (messageIds.isEmpty) return [];

    try {
      final response = await _supabase
          .from('circle_message_reactions')
          .select('*')
          .inFilter('message_id', messageIds);

      return (response as List)
          .map((data) => CircleMessageReaction.fromMap(data as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _log.error('Error fetching reactions: $e', tag: _tag);
      return [];
    }
  }

  // ================== READ STATUS Operations ==================

  /// Mark circle as read
  Future<void> markAsRead(String circleId) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return;

      await _supabase
          .from('circle_members')
          .update({'last_read_at': DateTime.now().toIso8601String()})
          .eq('circle_id', circleId)
          .eq('user_id', userId);
    } catch (e) {
      _log.error('Error marking as read: $e', tag: _tag);
    }
  }

  /// Get unread count for a circle
  Future<int> getUnreadCount(String circleId) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return 0;

      // Get last read timestamp
      final membership = await _supabase
          .from('circle_members')
          .select('last_read_at')
          .eq('circle_id', circleId)
          .eq('user_id', userId)
          .maybeSingle();

      if (membership == null) return 0;

      final lastRead = membership['last_read_at'] as String?;
      if (lastRead == null) {
        // Never read, count all messages
        final response = await _supabase
            .from('circle_messages')
            .select('id')
            .eq('circle_id', circleId)
            .eq('is_deleted', false);
        return (response as List).length;
      }

      // Count messages after last read
      final response = await _supabase
          .from('circle_messages')
          .select('id')
          .eq('circle_id', circleId)
          .eq('is_deleted', false)
          .gt('created_at', lastRead)
          .neq('user_id', userId);

      return (response as List).length;
    } catch (e) {
      _log.error('Error getting unread count: $e', tag: _tag);
      return 0;
    }
  }

  /// Toggle mute for a circle
  Future<bool> toggleMute(String circleId, {DateTime? mutedUntil}) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      // Get current state
      final membership = await _supabase
          .from('circle_members')
          .select('is_muted')
          .eq('circle_id', circleId)
          .eq('user_id', userId)
          .single();

      final currentlyMuted = membership['is_muted'] as bool? ?? false;

      await _supabase
          .from('circle_members')
          .update({
            'is_muted': !currentlyMuted,
            'muted_until': mutedUntil?.toIso8601String(),
          })
          .eq('circle_id', circleId)
          .eq('user_id', userId);

      _log.debug('🔔 Toggled mute for circle: $circleId', tag: _tag);
      return !currentlyMuted;
    } catch (e) {
      _log.error('Error toggling mute: $e', tag: _tag);
      return false;
    }
  }

  /// Get current user's membership details
  Future<CircleMember?> getCurrentMembership(String circleId) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return null;

      final response = await _supabase
          .from('circle_members')
          .select('*')
          .eq('circle_id', circleId)
          .eq('user_id', userId)
          .maybeSingle();

      if (response == null) return null;
      return CircleMember.fromMap(response as Map<String, dynamic>);
    } catch (e) {
      _log.error('Error getting membership: $e', tag: _tag);
      return null;
    }
  }
}
