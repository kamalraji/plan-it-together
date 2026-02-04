import 'package:thittam1hub/models/circle.dart';
import 'package:thittam1hub/repositories/base_repository.dart';
import 'package:thittam1hub/repositories/circle_repository.dart';
import 'package:thittam1hub/utils/result.dart';
import 'package:thittam1hub/config/supabase_config.dart';

/// Supabase implementation of CircleRepository
/// 
/// Provides circle management, membership, and messaging
/// operations using the Supabase backend.
class SupabaseCircleRepository extends BaseRepository implements CircleRepository {
  static SupabaseCircleRepository? _instance;
  static SupabaseCircleRepository get instance =>
      _instance ??= SupabaseCircleRepository._();
  SupabaseCircleRepository._();

  @override
  String get tag => 'SupabaseCircleRepository';

  final _supabase = SupabaseConfig.client;

  String? get _currentUserId => _supabase.auth.currentUser?.id;

  @override
  Future<Result<List<Circle>>> getPublicCircles({int limit = 50}) {
    return execute(() async {
      final data = await _supabase
          .from('circles')
          .select()
          .eq('is_public', true)
          .order('member_count', ascending: false)
          .limit(limit);

      logDbOperation('SELECT', 'circles', rowCount: (data as List).length);
      return (data).map((json) => Circle.fromMap(json)).toList();
    }, operationName: 'getPublicCircles');
  }

  @override
  Future<Result<List<Circle>>> getMyCircles() {
    return execute(() async {
      final userId = _currentUserId;
      if (userId == null) throw Exception('User not authenticated');

      final memberData = await _supabase
          .from('circle_members')
          .select('circle_id')
          .eq('user_id', userId);

      final circleIds = (memberData as List)
          .map((m) => m['circle_id'] as String)
          .toList();

      if (circleIds.isEmpty) return <Circle>[];

      final data = await _supabase
          .from('circles')
          .select()
          .inFilter('id', circleIds)
          .order('created_at', ascending: false);

      logDbOperation('SELECT', 'circles', rowCount: (data as List).length);
      return (data).map((json) => Circle.fromMap(json)).toList();
    }, operationName: 'getMyCircles');
  }

  @override
  Future<Result<Circle?>> getCircleById(String circleId) {
    return execute(() async {
      final data = await _supabase
          .from('circles')
          .select()
          .eq('id', circleId)
          .maybeSingle();

      logDbOperation('SELECT', 'circles', rowCount: data != null ? 1 : 0);
      return data != null ? Circle.fromMap(data) : null;
    }, operationName: 'getCircleById');
  }

  @override
  Future<Result<List<Circle>>> getCirclesByEvent(String eventId) {
    return execute(() async {
      final data = await _supabase
          .from('circles')
          .select()
          .eq('event_id', eventId)
          .order('created_at', ascending: false);

      logDbOperation('SELECT', 'circles', rowCount: (data as List).length);
      return (data).map((json) => Circle.fromMap(json)).toList();
    }, operationName: 'getCirclesByEvent');
  }

  @override
  Future<Result<List<Circle>>> searchCircles(String query, {int limit = 20}) {
    return execute(() async {
      final data = await _supabase
          .from('circles')
          .select()
          .eq('is_public', true)
          .or('name.ilike.%$query%,description.ilike.%$query%')
          .limit(limit);

      logDbOperation('SELECT', 'circles', rowCount: (data as List).length);
      return (data).map((json) => Circle.fromMap(json)).toList();
    }, operationName: 'searchCircles');
  }

  @override
  Future<Result<Circle>> createCircle({
    required String name,
    String? description,
    String icon = '💬',
    String type = 'USER_CREATED',
    String category = 'INTEREST',
    bool isPrivate = false,
    int? maxMembers,
    List<String> tags = const [],
    String? eventId,
  }) {
    return execute(() async {
      final userId = _currentUserId;
      if (userId == null) throw Exception('User not authenticated');

      final data = await _supabase.from('circles').insert({
        'name': name,
        'description': description,
        'icon': icon,
        'type': type,
        'category': category,
        'is_private': isPrivate,
        'is_public': !isPrivate,
        'max_members': maxMembers,
        'tags': tags,
        'event_id': eventId,
        'created_by': userId,
        'member_count': 1,
      }).select().single();

      // Auto-join as admin
      await _supabase.from('circle_members').insert({
        'circle_id': data['id'],
        'user_id': userId,
        'role': 'ADMIN',
      });

      logDbOperation('INSERT', 'circles');
      return Circle.fromMap(data);
    }, operationName: 'createCircle');
  }

  @override
  Future<Result<Circle>> updateCircle({
    required String circleId,
    String? name,
    String? description,
    String? icon,
    bool? isPrivate,
    int? maxMembers,
    List<String>? tags,
  }) {
    return execute(() async {
      final updates = <String, dynamic>{};
      if (name != null) updates['name'] = name;
      if (description != null) updates['description'] = description;
      if (icon != null) updates['icon'] = icon;
      if (isPrivate != null) {
        updates['is_private'] = isPrivate;
        updates['is_public'] = !isPrivate;
      }
      if (maxMembers != null) updates['max_members'] = maxMembers;
      if (tags != null) updates['tags'] = tags;

      final data = await _supabase
          .from('circles')
          .update(updates)
          .eq('id', circleId)
          .select()
          .single();

      logDbOperation('UPDATE', 'circles');
      return Circle.fromMap(data);
    }, operationName: 'updateCircle');
  }

  @override
  Future<Result<bool>> deleteCircle(String circleId) {
    return execute(() async {
      await _supabase.from('circles').delete().eq('id', circleId);
      logDbOperation('DELETE', 'circles');
      return true;
    }, operationName: 'deleteCircle');
  }

  @override
  Future<Result<bool>> joinCircle(String circleId) {
    return execute(() async {
      final userId = _currentUserId;
      if (userId == null) throw Exception('User not authenticated');

      await _supabase.from('circle_members').insert({
        'circle_id': circleId,
        'user_id': userId,
        'role': 'MEMBER',
      });

      // Increment member count
      await _supabase.rpc('increment_circle_member_count', params: {
        'p_circle_id': circleId,
      }).catchError((_) async {
        // Fallback: manual increment
        final circle = await _supabase
            .from('circles')
            .select('member_count')
            .eq('id', circleId)
            .single();
        await _supabase
            .from('circles')
            .update({'member_count': (circle['member_count'] as int) + 1})
            .eq('id', circleId);
      });

      logDbOperation('INSERT', 'circle_members');
      return true;
    }, operationName: 'joinCircle');
  }

  @override
  Future<Result<bool>> leaveCircle(String circleId) {
    return execute(() async {
      final userId = _currentUserId;
      if (userId == null) throw Exception('User not authenticated');

      await _supabase
          .from('circle_members')
          .delete()
          .eq('circle_id', circleId)
          .eq('user_id', userId);

      // Decrement member count
      await _supabase.rpc('decrement_circle_member_count', params: {
        'p_circle_id': circleId,
      }).catchError((_) async {
        final circle = await _supabase
            .from('circles')
            .select('member_count')
            .eq('id', circleId)
            .single();
        final newCount = (circle['member_count'] as int) - 1;
        await _supabase
            .from('circles')
            .update({'member_count': newCount < 0 ? 0 : newCount})
            .eq('id', circleId);
      });

      logDbOperation('DELETE', 'circle_members');
      return true;
    }, operationName: 'leaveCircle');
  }

  @override
  Future<Result<bool>> isMember(String circleId) {
    return execute(() async {
      final userId = _currentUserId;
      if (userId == null) return false;

      final data = await _supabase
          .from('circle_members')
          .select('id')
          .eq('circle_id', circleId)
          .eq('user_id', userId)
          .maybeSingle();

      return data != null;
    }, operationName: 'isMember');
  }

  @override
  Future<Result<List<CircleMember>>> getMembers(String circleId, {int limit = 100}) {
    return execute(() async {
      final data = await _supabase
          .from('circle_members')
          .select()
          .eq('circle_id', circleId)
          .order('joined_at', ascending: true)
          .limit(limit);

      logDbOperation('SELECT', 'circle_members', rowCount: (data as List).length);
      return (data).map((json) => CircleMember.fromMap(json)).toList();
    }, operationName: 'getMembers');
  }

  @override
  Future<Result<int>> getMemberCount(String circleId) {
    return execute(() async {
      final data = await _supabase
          .from('circles')
          .select('member_count')
          .eq('id', circleId)
          .single();

      return data['member_count'] as int? ?? 0;
    }, operationName: 'getMemberCount');
  }

  @override
  Future<Result<bool>> updateMemberRole(String circleId, String userId, String role) {
    return execute(() async {
      await _supabase
          .from('circle_members')
          .update({'role': role})
          .eq('circle_id', circleId)
          .eq('user_id', userId);

      logDbOperation('UPDATE', 'circle_members');
      return true;
    }, operationName: 'updateMemberRole');
  }

  @override
  Future<Result<bool>> removeMember(String circleId, String userId) {
    return execute(() async {
      await _supabase
          .from('circle_members')
          .delete()
          .eq('circle_id', circleId)
          .eq('user_id', userId);

      logDbOperation('DELETE', 'circle_members');
      return true;
    }, operationName: 'removeMember');
  }

  @override
  Future<Result<List<CircleMessage>>> getMessages(String circleId, {int limit = 50}) {
    return execute(() async {
      final data = await _supabase
          .from('circle_messages')
          .select()
          .eq('circle_id', circleId)
          .order('created_at', ascending: false)
          .limit(limit);

      logDbOperation('SELECT', 'circle_messages', rowCount: (data as List).length);
      return (data).map((json) => CircleMessage.fromMap(json)).toList();
    }, operationName: 'getMessages');
  }

  @override
  Future<Result<CircleMessage>> sendMessage(String circleId, String content) {
    return execute(() async {
      final userId = _currentUserId;
      if (userId == null) throw Exception('User not authenticated');

      final data = await _supabase.from('circle_messages').insert({
        'circle_id': circleId,
        'user_id': userId,
        'content': content,
      }).select().single();

      logDbOperation('INSERT', 'circle_messages');
      return CircleMessage.fromMap(data);
    }, operationName: 'sendMessage');
  }

  @override
  Future<Result<bool>> deleteMessage(String messageId) {
    return execute(() async {
      await _supabase.from('circle_messages').delete().eq('id', messageId);
      logDbOperation('DELETE', 'circle_messages');
      return true;
    }, operationName: 'deleteMessage');
  }

  @override
  Future<Result<List<Circle>>> getTrendingCircles({int limit = 10}) {
    return execute(() async {
      final data = await _supabase
          .from('circles')
          .select()
          .eq('is_public', true)
          .order('member_count', ascending: false)
          .limit(limit);

      logDbOperation('SELECT', 'circles', rowCount: (data as List).length);
      return (data).map((json) => Circle.fromMap(json)).toList();
    }, operationName: 'getTrendingCircles');
  }

  @override
  Future<Result<List<Circle>>> getSuggestedCircles({int limit = 10}) {
    return execute(() async {
      final userId = _currentUserId;
      if (userId == null) throw Exception('User not authenticated');

      // Get user's existing circles
      final memberData = await _supabase
          .from('circle_members')
          .select('circle_id')
          .eq('user_id', userId);

      final joinedIds = (memberData as List)
          .map((m) => m['circle_id'] as String)
          .toList();

      // Get public circles user hasn't joined
      var query = _supabase
          .from('circles')
          .select()
          .eq('is_public', true)
          .order('member_count', ascending: false)
          .limit(limit);

      if (joinedIds.isNotEmpty) {
        query = query.not('id', 'in', joinedIds);
      }

      final data = await query;
      logDbOperation('SELECT', 'circles', rowCount: (data as List).length);
      return (data).map((json) => Circle.fromMap(json)).toList();
    }, operationName: 'getSuggestedCircles');
  }
}
