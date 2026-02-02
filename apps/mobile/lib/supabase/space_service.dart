import 'dart:async';
import 'package:thittam1hub/models/space.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/utils/result.dart';

/// Service for Spaces (audio rooms) feature
/// 
/// Extends BaseService for standardized logging, error handling, and Result types.
class SpaceService extends BaseService {
  static SpaceService? _instance;
  static SpaceService get instance => _instance ??= SpaceService._();
  SpaceService._();

  @override
  String get tag => 'SpaceService';

  final _supabase = SupabaseConfig.client;

  // ==================== Static Helpers ====================
  
  /// Static convenience method for fetching live spaces (unwraps Result internally)
  static Future<List<Space>> fetchLiveSpaces() async {
    final result = await instance.getLiveSpaces();
    return result.isSuccess ? result.data : <Space>[];
  }

  // ==================== Main API ====================

  /// Fetches a list of currently live spaces as a stream.
  Stream<List<Space>> streamLiveSpaces() {
    return _supabase
        .from('spaces')
        .stream(primaryKey: ['id'])
        .map((payload) => payload.map((e) => Space.fromMap(e)).toList());
  }

  /// Fetches a list of currently live spaces as a one-time Future.
  Future<Result<List<Space>>> getLiveSpaces() => execute(() async {
    final response = await _supabase.from('spaces').select();
    logDbOperation('SELECT', 'spaces', rowCount: (response as List).length);
    return response.map((e) => Space.fromMap(e)).toList();
  }, operationName: 'getLiveSpaces');

  /// Creates a new space.
  Future<Result<Space?>> createSpace(String topic, List<String> tags) => execute(() async {
    final userId = _supabase.auth.currentUser!.id;
    
    final response = await _supabase.from('spaces').insert({
      'topic': topic,
      'created_by': userId,
      'tags': tags,
    }).select();

    logDbOperation('INSERT', 'spaces');

    final data = response as List;
    if (data.isNotEmpty) {
      return Space.fromMap(data.first as Map<String, dynamic>);
    }
    return null;
  }, operationName: 'createSpace');

  /// Joins the current user to a space, either as a speaker or audience.
  Future<Result<void>> joinSpace(String spaceId, {bool asSpeaker = false}) => execute(() async {
    final userId = _supabase.auth.currentUser!.id;
    final targetTable = asSpeaker ? 'space_speakers' : 'space_audience';
    final otherTable = asSpeaker ? 'space_audience' : 'space_speakers';

    // First, remove the user from the other role to prevent duplicates.
    await _supabase.from(otherTable).delete().match({'space_id': spaceId, 'user_id': userId});

    // Now, add the user to their new role.
    await _supabase.from(targetTable).upsert({
      'space_id': spaceId,
      'user_id': userId,
    });

    logInfo('Joined space', metadata: {'spaceId': spaceId, 'asSpeaker': asSpeaker});
    logDbOperation('UPSERT', targetTable);
  }, operationName: 'joinSpace');

  /// Leaves a space for the current user.
  Future<Result<void>> leaveSpace(String spaceId) => execute(() async {
    final userId = _supabase.auth.currentUser!.id;
    
    // The user can be either a speaker or an audience member, but not both.
    // We can try deleting from both tables in parallel for minor efficiency gain.
    await Future.wait([
      _supabase.from('space_speakers').delete().match({'space_id': spaceId, 'user_id': userId}),
      _supabase.from('space_audience').delete().match({'space_id': spaceId, 'user_id': userId})
    ]);

    logInfo('Left space', metadata: {'spaceId': spaceId});
    logDbOperation('DELETE', 'space_speakers/space_audience');
  }, operationName: 'leaveSpace');

  /// Gets a stream of speakers for a space.
  Stream<List<SpaceSpeaker>> getSpeakersStream(String spaceId) {
    return _supabase
        .from('space_speakers')
        .stream(primaryKey: ['space_id', 'user_id'])
        .eq('space_id', spaceId)
        .map((payload) => payload.map((e) => SpaceSpeaker.fromMap(e)).toList());
  }

  /// Gets a stream of audience members for a space.
  Stream<List<SpaceAudience>> getAudienceStream(String spaceId) {
    return _supabase
        .from('space_audience')
        .stream(primaryKey: ['space_id', 'user_id'])
        .eq('space_id', spaceId)
        .map((payload) => payload.map((e) => SpaceAudience.fromMap(e)).toList());
  }

  /// Mutes a speaker in a space.
  Future<Result<void>> muteSpeaker(String spaceId, String userId) => execute(() async {
    await _supabase
        .from('space_speakers')
        .update({'is_muted': true})
        .match({'space_id': spaceId, 'user_id': userId});
    
    logDbOperation('UPDATE', 'space_speakers');
  }, operationName: 'muteSpeaker');

  /// Unmutes a speaker in a space.
  Future<Result<void>> unmuteSpeaker(String spaceId, String userId) => execute(() async {
    await _supabase
        .from('space_speakers')
        .update({'is_muted': false})
        .match({'space_id': spaceId, 'user_id': userId});
    
    logDbOperation('UPDATE', 'space_speakers');
  }, operationName: 'unmuteSpeaker');
}
