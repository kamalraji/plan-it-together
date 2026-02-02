import 'package:thittam1hub/models/space.dart';
import 'package:thittam1hub/repositories/base_repository.dart';
import 'package:thittam1hub/repositories/space_repository.dart';
import 'package:thittam1hub/utils/result.dart';
import 'package:thittam1hub/config/supabase_config.dart';

/// Supabase implementation of SpaceRepository
/// 
/// Provides live audio space management, speaker/audience handling,
/// and real-time participation operations using the Supabase backend.
class SupabaseSpaceRepository extends BaseRepository implements SpaceRepository {
  static SupabaseSpaceRepository? _instance;
  static SupabaseSpaceRepository get instance =>
      _instance ??= SupabaseSpaceRepository._();
  SupabaseSpaceRepository._();

  @override
  String get tag => 'SupabaseSpaceRepository';

  final _supabase = SupabaseConfig.client;

  String? get _currentUserId => _supabase.auth.currentUser?.id;

  @override
  Future<Result<List<Space>>> getLiveSpaces({int limit = 20}) {
    return execute(() async {
      final data = await _supabase
          .from('spaces')
          .select()
          .eq('is_live', true)
          .order('created_at', ascending: false)
          .limit(limit);

      logDbOperation('SELECT', 'spaces', rowCount: (data as List).length);
      return (data).map((json) => Space.fromMap(json)).toList();
    }, operationName: 'getLiveSpaces');
  }

  @override
  Future<Result<Space?>> getSpaceById(String spaceId) {
    return execute(() async {
      final data = await _supabase
          .from('spaces')
          .select()
          .eq('id', spaceId)
          .maybeSingle();

      logDbOperation('SELECT', 'spaces', rowCount: data != null ? 1 : 0);
      return data != null ? Space.fromMap(data) : null;
    }, operationName: 'getSpaceById');
  }

  @override
  Future<Result<List<Space>>> getSpacesByHost(String hostId, {int limit = 20}) {
    return execute(() async {
      final data = await _supabase
          .from('spaces')
          .select()
          .eq('host_id', hostId)
          .order('created_at', ascending: false)
          .limit(limit);

      logDbOperation('SELECT', 'spaces', rowCount: (data as List).length);
      return (data).map((json) => Space.fromMap(json)).toList();
    }, operationName: 'getSpacesByHost');
  }

  @override
  Future<Result<List<Space>>> searchSpaces(String query, {int limit = 20}) {
    return execute(() async {
      final data = await _supabase
          .from('spaces')
          .select()
          .eq('is_live', true)
          .ilike('topic', '%$query%')
          .limit(limit);

      logDbOperation('SELECT', 'spaces', rowCount: (data as List).length);
      return (data).map((json) => Space.fromMap(json)).toList();
    }, operationName: 'searchSpaces');
  }

  @override
  Future<Result<Space>> createSpace({
    required String topic,
    List<String> tags = const [],
  }) {
    return execute(() async {
      final userId = _currentUserId;
      if (userId == null) throw Exception('User not authenticated');

      final data = await _supabase.from('spaces').insert({
        'topic': topic,
        'tags': tags,
        'host_id': userId,
        'created_by': userId,
        'is_live': true,
      }).select().single();

      // Auto-join as speaker
      await _supabase.from('space_speakers').insert({
        'space_id': data['id'],
        'user_id': userId,
        'is_muted': false,
      });

      logDbOperation('INSERT', 'spaces');
      return Space.fromMap(data);
    }, operationName: 'createSpace');
  }

  @override
  Future<Result<Space>> updateSpace({
    required String spaceId,
    String? topic,
    List<String>? tags,
  }) {
    return execute(() async {
      final updates = <String, dynamic>{};
      if (topic != null) updates['topic'] = topic;
      if (tags != null) updates['tags'] = tags;

      final data = await _supabase
          .from('spaces')
          .update(updates)
          .eq('id', spaceId)
          .select()
          .single();

      logDbOperation('UPDATE', 'spaces');
      return Space.fromMap(data);
    }, operationName: 'updateSpace');
  }

  @override
  Future<Result<bool>> endSpace(String spaceId) {
    return execute(() async {
      await _supabase
          .from('spaces')
          .update({'is_live': false})
          .eq('id', spaceId);

      logDbOperation('UPDATE', 'spaces');
      return true;
    }, operationName: 'endSpace');
  }

  @override
  Future<Result<bool>> deleteSpace(String spaceId) {
    return execute(() async {
      await _supabase.from('spaces').delete().eq('id', spaceId);
      logDbOperation('DELETE', 'spaces');
      return true;
    }, operationName: 'deleteSpace');
  }

  @override
  Future<Result<bool>> joinAsAudience(String spaceId) {
    return execute(() async {
      final userId = _currentUserId;
      if (userId == null) throw Exception('User not authenticated');

      await _supabase.from('space_audience').upsert({
        'space_id': spaceId,
        'user_id': userId,
      }, onConflict: 'space_id,user_id');

      logDbOperation('UPSERT', 'space_audience');
      return true;
    }, operationName: 'joinAsAudience');
  }

  @override
  Future<Result<bool>> leaveSpace(String spaceId) {
    return execute(() async {
      final userId = _currentUserId;
      if (userId == null) throw Exception('User not authenticated');

      // Remove from speakers if present
      await _supabase
          .from('space_speakers')
          .delete()
          .eq('space_id', spaceId)
          .eq('user_id', userId);

      // Remove from audience if present
      await _supabase
          .from('space_audience')
          .delete()
          .eq('space_id', spaceId)
          .eq('user_id', userId);

      // Remove hand raise if present
      await _supabase
          .from('space_hand_raises')
          .delete()
          .eq('space_id', spaceId)
          .eq('user_id', userId);

      logDbOperation('DELETE', 'space_participants');
      return true;
    }, operationName: 'leaveSpace');
  }

  @override
  Future<Result<bool>> requestToSpeak(String spaceId) {
    return execute(() async {
      final userId = _currentUserId;
      if (userId == null) throw Exception('User not authenticated');

      await _supabase.from('space_hand_raises').upsert({
        'space_id': spaceId,
        'user_id': userId,
      }, onConflict: 'space_id,user_id');

      logDbOperation('UPSERT', 'space_hand_raises');
      return true;
    }, operationName: 'requestToSpeak');
  }

  @override
  Future<Result<bool>> cancelSpeakRequest(String spaceId) {
    return execute(() async {
      final userId = _currentUserId;
      if (userId == null) throw Exception('User not authenticated');

      await _supabase
          .from('space_hand_raises')
          .delete()
          .eq('space_id', spaceId)
          .eq('user_id', userId);

      logDbOperation('DELETE', 'space_hand_raises');
      return true;
    }, operationName: 'cancelSpeakRequest');
  }

  @override
  Future<Result<bool>> promoteToSpeaker(String spaceId, String userId) {
    return execute(() async {
      // Add to speakers
      await _supabase.from('space_speakers').upsert({
        'space_id': spaceId,
        'user_id': userId,
        'is_muted': true,
      }, onConflict: 'space_id,user_id');

      // Remove from audience
      await _supabase
          .from('space_audience')
          .delete()
          .eq('space_id', spaceId)
          .eq('user_id', userId);

      // Remove hand raise
      await _supabase
          .from('space_hand_raises')
          .delete()
          .eq('space_id', spaceId)
          .eq('user_id', userId);

      logDbOperation('PROMOTE', 'space_speakers');
      return true;
    }, operationName: 'promoteToSpeaker');
  }

  @override
  Future<Result<bool>> demoteToAudience(String spaceId, String userId) {
    return execute(() async {
      // Remove from speakers
      await _supabase
          .from('space_speakers')
          .delete()
          .eq('space_id', spaceId)
          .eq('user_id', userId);

      // Add to audience
      await _supabase.from('space_audience').upsert({
        'space_id': spaceId,
        'user_id': userId,
      }, onConflict: 'space_id,user_id');

      logDbOperation('DEMOTE', 'space_speakers');
      return true;
    }, operationName: 'demoteToAudience');
  }

  @override
  Future<Result<bool>> muteSpeaker(String spaceId, String userId) {
    return execute(() async {
      await _supabase
          .from('space_speakers')
          .update({'is_muted': true})
          .eq('space_id', spaceId)
          .eq('user_id', userId);

      logDbOperation('UPDATE', 'space_speakers');
      return true;
    }, operationName: 'muteSpeaker');
  }

  @override
  Future<Result<bool>> unmuteSelf(String spaceId) {
    return execute(() async {
      final userId = _currentUserId;
      if (userId == null) throw Exception('User not authenticated');

      await _supabase
          .from('space_speakers')
          .update({'is_muted': false})
          .eq('space_id', spaceId)
          .eq('user_id', userId);

      logDbOperation('UPDATE', 'space_speakers');
      return true;
    }, operationName: 'unmuteSelf');
  }

  @override
  Future<Result<bool>> toggleMute(String spaceId) {
    return execute(() async {
      final userId = _currentUserId;
      if (userId == null) throw Exception('User not authenticated');

      final data = await _supabase
          .from('space_speakers')
          .select('is_muted')
          .eq('space_id', spaceId)
          .eq('user_id', userId)
          .single();

      final currentMuted = data['is_muted'] as bool? ?? false;

      await _supabase
          .from('space_speakers')
          .update({'is_muted': !currentMuted})
          .eq('space_id', spaceId)
          .eq('user_id', userId);

      logDbOperation('UPDATE', 'space_speakers');
      return !currentMuted;
    }, operationName: 'toggleMute');
  }

  @override
  Future<Result<List<SpaceSpeaker>>> getSpeakers(String spaceId) {
    return execute(() async {
      final data = await _supabase
          .from('space_speakers')
          .select()
          .eq('space_id', spaceId)
          .order('joined_at', ascending: true);

      logDbOperation('SELECT', 'space_speakers', rowCount: (data as List).length);
      return (data).map((json) => SpaceSpeaker.fromMap(json)).toList();
    }, operationName: 'getSpeakers');
  }

  @override
  Future<Result<List<SpaceAudience>>> getAudience(String spaceId, {int limit = 100}) {
    return execute(() async {
      final data = await _supabase
          .from('space_audience')
          .select()
          .eq('space_id', spaceId)
          .order('joined_at', ascending: true)
          .limit(limit);

      logDbOperation('SELECT', 'space_audience', rowCount: (data as List).length);
      return (data).map((json) => SpaceAudience.fromMap(json)).toList();
    }, operationName: 'getAudience');
  }

  @override
  Future<Result<({int speakers, int audience})>> getParticipantCounts(String spaceId) {
    return execute(() async {
      final speakersData = await _supabase
          .from('space_speakers')
          .select('id')
          .eq('space_id', spaceId);

      final audienceData = await _supabase
          .from('space_audience')
          .select('id')
          .eq('space_id', spaceId);

      return (
        speakers: (speakersData as List).length,
        audience: (audienceData as List).length,
      );
    }, operationName: 'getParticipantCounts');
  }

  @override
  Future<Result<bool>> isSpeaker(String spaceId) {
    return execute(() async {
      final userId = _currentUserId;
      if (userId == null) return false;

      final data = await _supabase
          .from('space_speakers')
          .select('id')
          .eq('space_id', spaceId)
          .eq('user_id', userId)
          .maybeSingle();

      return data != null;
    }, operationName: 'isSpeaker');
  }

  @override
  Future<Result<bool>> isHost(String spaceId) {
    return execute(() async {
      final userId = _currentUserId;
      if (userId == null) return false;

      final data = await _supabase
          .from('spaces')
          .select('host_id')
          .eq('id', spaceId)
          .single();

      return data['host_id'] == userId;
    }, operationName: 'isHost');
  }

  @override
  Future<Result<List<String>>> getHandRaises(String spaceId) {
    return execute(() async {
      final data = await _supabase
          .from('space_hand_raises')
          .select('user_id')
          .eq('space_id', spaceId)
          .order('created_at', ascending: true);

      logDbOperation('SELECT', 'space_hand_raises', rowCount: (data as List).length);
      return (data).map((r) => r['user_id'] as String).toList();
    }, operationName: 'getHandRaises');
  }

  @override
  Future<Result<bool>> removeParticipant(String spaceId, String userId) {
    return execute(() async {
      // Remove from all participant tables
      await _supabase
          .from('space_speakers')
          .delete()
          .eq('space_id', spaceId)
          .eq('user_id', userId);

      await _supabase
          .from('space_audience')
          .delete()
          .eq('space_id', spaceId)
          .eq('user_id', userId);

      await _supabase
          .from('space_hand_raises')
          .delete()
          .eq('space_id', spaceId)
          .eq('user_id', userId);

      logDbOperation('DELETE', 'space_participants');
      return true;
    }, operationName: 'removeParticipant');
  }

  @override
  Future<Result<bool>> reportSpace(String spaceId, String reason, {String? details}) {
    return execute(() async {
      final userId = _currentUserId;
      if (userId == null) throw Exception('User not authenticated');

      await _supabase.from('space_reports').insert({
        'space_id': spaceId,
        'reporter_id': userId,
        'reason': reason,
        'details': details,
        'status': 'PENDING',
      });

      logDbOperation('INSERT', 'space_reports');
      return true;
    }, operationName: 'reportSpace');
  }
}
