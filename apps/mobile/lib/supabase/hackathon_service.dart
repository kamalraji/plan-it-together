import 'package:supabase_flutter/supabase_flutter.dart';
export 'package:supabase_flutter/supabase_flutter.dart' show SupabaseClient, Supabase;
import '../models/hackathon_models.dart';
import '../services/group_chat_service.dart';
import '../services/base_service.dart';
import '../utils/result.dart';

/// Service for hackathon-specific Zone features
/// 
/// Industrial best practice: Extends BaseService for standardized
/// error handling, logging, and Result<T> returns.
class HackathonService extends BaseService {
  @override
  String get tag => 'HackathonService';
  
  static HackathonService? _instance;
  static HackathonService get instance => _instance ??= HackathonService._();
  HackathonService._();
  
  final SupabaseClient _supabase = Supabase.instance.client;
  final GroupChatService _groupChatService = GroupChatService();

  String? get _currentUserId => _supabase.auth.currentUser?.id;

  // ==================== STATIC HELPERS ====================
  // Unwrap Result internally for simpler UI consumption
  
  /// Fetch event teams (returns empty list on failure)
  static Future<List<HackathonTeam>> fetchEventTeams(String eventId) async {
    final result = await instance.getEventTeams(eventId);
    return result.isSuccess ? result.data : [];
  }
  
  /// Fetch user's team for an event (returns null on failure)
  static Future<HackathonTeam?> fetchUserTeam(String eventId) async {
    final result = await instance.getUserTeam(eventId);
    return result.isSuccess ? result.data : null;
  }

  // ==================== TEAMS ====================

  /// Get all teams for an event
  Future<Result<List<HackathonTeam>>> getEventTeams(String eventId) => execute(
    () async {
      final response = await _supabase
          .from('hackathon_teams')
          .select('''
            *,
            hackathon_team_members(*)
          ''')
          .eq('event_id', eventId)
          .order('created_at', ascending: false);

      logDbOperation('SELECT', 'hackathon_teams', rowCount: (response as List).length);
      
      return response
          .map((json) => HackathonTeam.fromJson(json as Map<String, dynamic>))
          .toList();
    },
    operationName: 'getEventTeams',
  );

  /// Get teams looking for members
  Future<Result<List<HackathonTeam>>> getTeamsLookingForMembers(String eventId) => execute(
    () async {
      final response = await _supabase
          .from('hackathon_teams')
          .select('''
            *,
            hackathon_team_members(*)
          ''')
          .eq('event_id', eventId)
          .eq('is_looking_for_members', true)
          .order('created_at', ascending: false);

      logDbOperation('SELECT', 'hackathon_teams', rowCount: (response as List).length);
      
      return response
          .map((json) => HackathonTeam.fromJson(json as Map<String, dynamic>))
          .toList();
    },
    operationName: 'getTeamsLookingForMembers',
  );

  /// Get user's team for an event
  Future<Result<HackathonTeam?>> getUserTeam(String eventId) => execute(
    () async {
      if (_currentUserId == null) return null;

      final memberResponse = await _supabase
          .from('hackathon_team_members')
          .select('team_id')
          .eq('user_id', _currentUserId!)
          .maybeSingle();

      if (memberResponse == null) return null;

      final teamResponse = await _supabase
          .from('hackathon_teams')
          .select('''
            *,
            hackathon_team_members(*)
          ''')
          .eq('id', memberResponse['team_id'])
          .eq('event_id', eventId)
          .maybeSingle();

      if (teamResponse == null) return null;
      return HackathonTeam.fromJson(teamResponse as Map<String, dynamic>);
    },
    operationName: 'getUserTeam',
  );

  /// Create a new team with auto-created chat group
  Future<Result<HackathonTeam>> createTeam({
    required String eventId,
    required String name,
    String? description,
    String? projectIdea,
    List<String>? techStack,
    List<String>? lookingForRoles,
    int maxMembers = 5,
  }) => execute(
    () async {
      // Create the chat group for the team first
      final chatGroupResult = await _groupChatService.createGroup(
        name: '🚀 $name',
        description: 'Team chat for $name',
        isPublic: false,
        maxMembers: maxMembers,
      );

      if (!chatGroupResult.isSuccess) {
        throw Exception(chatGroupResult.errorMessage ?? 'Failed to create team chat group');
      }
      final chatGroup = chatGroupResult.data;

      final response = await _supabase
          .from('hackathon_teams')
          .insert({
            'event_id': eventId,
            'name': name,
            'description': description,
            'project_idea': projectIdea,
            'tech_stack': techStack ?? [],
            'looking_for_roles': lookingForRoles ?? [],
            'max_members': maxMembers,
            'created_by': _currentUserId,
            'chat_group_id': chatGroup.id,
          })
          .select()
          .single();

      final team = HackathonTeam.fromJson(response as Map<String, dynamic>);
      logDbOperation('INSERT', 'hackathon_teams', rowCount: 1);

      // Add creator as team lead
      await _supabase.from('hackathon_team_members').insert({
        'team_id': team.id,
        'user_id': _currentUserId,
        'role': 'lead',
      });
      logDbOperation('INSERT', 'hackathon_team_members', rowCount: 1);

      logInfo('Team created', metadata: {'teamId': team.id, 'eventId': eventId});
      return team;
    },
    operationName: 'createTeam',
  );

  /// Join a team and add to team chat group
  Future<Result<void>> joinTeam(String teamId, {List<String>? skills}) => execute(
    () async {
      await _supabase.from('hackathon_team_members').insert({
        'team_id': teamId,
        'user_id': _currentUserId,
        'role': 'member',
        'skills': skills ?? [],
      });
      logDbOperation('INSERT', 'hackathon_team_members', rowCount: 1);

      // Add user to team chat group
      final chatGroupId = await _getTeamChatGroupId(teamId);
      if (chatGroupId != null && _currentUserId != null) {
        await _groupChatService.addMembers(chatGroupId, [_currentUserId!]);
      }
      
      logInfo('User joined team', metadata: {'teamId': teamId});
    },
    operationName: 'joinTeam',
  );

  /// Leave a team and remove from team chat group
  Future<Result<void>> leaveTeam(String teamId) => execute(
    () async {
      // Remove from chat group first
      final chatGroupId = await _getTeamChatGroupId(teamId);
      if (chatGroupId != null && _currentUserId != null) {
        try {
          await _groupChatService.removeMember(chatGroupId, _currentUserId!);
        } catch (e) {
          logDebug('Already removed from chat group', metadata: {'error': e.toString()});
        }
      }

      await _supabase
          .from('hackathon_team_members')
          .delete()
          .eq('team_id', teamId)
          .eq('user_id', _currentUserId!);
      logDbOperation('DELETE', 'hackathon_team_members', rowCount: 1);
      
      logInfo('User left team', metadata: {'teamId': teamId});
    },
    operationName: 'leaveTeam',
  );

  /// Get team's chat group ID (internal helper)
  Future<String?> _getTeamChatGroupId(String teamId) async {
    final response = await _supabase
        .from('hackathon_teams')
        .select('chat_group_id')
        .eq('id', teamId)
        .maybeSingle();

    return response?['chat_group_id'] as String?;
  }

  /// Get team's chat group ID
  Future<Result<String?>> getTeamChatGroupId(String teamId) => execute(
    () => _getTeamChatGroupId(teamId),
    operationName: 'getTeamChatGroupId',
  );

  /// Get or create chat group for a team (for legacy teams without chat)
  Future<Result<String>> getOrCreateTeamChatGroup(String teamId) => execute(
    () async {
      // Check if team already has a chat group
      final existingGroupId = await _getTeamChatGroupId(teamId);
      if (existingGroupId != null) return existingGroupId;

      // Get team details
      final teamResponse = await _supabase
          .from('hackathon_teams')
          .select('name, max_members')
          .eq('id', teamId)
          .single();

      // Create a new chat group
      final chatGroupResult = await _groupChatService.createGroup(
        name: '🚀 ${teamResponse['name']}',
        description: 'Team chat for ${teamResponse['name']}',
        isPublic: false,
        maxMembers: teamResponse['max_members'] as int? ?? 5,
      );

      if (!chatGroupResult.isSuccess) {
        throw Exception(chatGroupResult.errorMessage ?? 'Failed to create team chat group');
      }
      final chatGroup = chatGroupResult.data;

      // Link it to the team
      await _supabase
          .from('hackathon_teams')
          .update({'chat_group_id': chatGroup.id})
          .eq('id', teamId);
      logDbOperation('UPDATE', 'hackathon_teams', rowCount: 1);

      // Add all existing team members to the chat group
      final members = await _supabase
          .from('hackathon_team_members')
          .select('user_id')
          .eq('team_id', teamId);

      final memberIds = (members as List)
          .map((m) => m['user_id'] as String)
          .where((id) => id != _currentUserId)
          .toList();

      if (memberIds.isNotEmpty) {
        await _groupChatService.addMembers(chatGroup.id, memberIds);
      }

      logInfo('Created team chat group', metadata: {'teamId': teamId, 'groupId': chatGroup.id});
      return chatGroup.id;
    },
    operationName: 'getOrCreateTeamChatGroup',
  );

  // ==================== MENTOR SLOTS ====================

  /// Get available mentor slots for an event
  Future<Result<List<MentorSlot>>> getAvailableMentorSlots(String eventId) => execute(
    () async {
      final response = await _supabase
          .from('mentor_slots')
          .select()
          .eq('event_id', eventId)
          .eq('status', 'available')
          .gte('slot_start', DateTime.now().toIso8601String())
          .order('slot_start');

      logDbOperation('SELECT', 'mentor_slots', rowCount: (response as List).length);
      
      return response
          .map((json) => MentorSlot.fromJson(json as Map<String, dynamic>))
          .toList();
    },
    operationName: 'getAvailableMentorSlots',
  );

  /// Get all mentor slots (including booked) for an event
  Future<Result<List<MentorSlot>>> getAllMentorSlots(String eventId) => execute(
    () async {
      final response = await _supabase
          .from('mentor_slots')
          .select()
          .eq('event_id', eventId)
          .order('slot_start');

      logDbOperation('SELECT', 'mentor_slots', rowCount: (response as List).length);
      
      return response
          .map((json) => MentorSlot.fromJson(json as Map<String, dynamic>))
          .toList();
    },
    operationName: 'getAllMentorSlots',
  );

  /// Get team's booked mentor slots
  Future<Result<List<MentorSlot>>> getTeamMentorSlots(String teamId) => execute(
    () async {
      final response = await _supabase
          .from('mentor_slots')
          .select()
          .eq('booked_by_team_id', teamId)
          .order('slot_start');

      logDbOperation('SELECT', 'mentor_slots', rowCount: (response as List).length);
      
      return response
          .map((json) => MentorSlot.fromJson(json as Map<String, dynamic>))
          .toList();
    },
    operationName: 'getTeamMentorSlots',
  );

  /// Book a mentor slot
  Future<Result<void>> bookMentorSlot(String slotId, String teamId) => execute(
    () async {
      await _supabase.from('mentor_slots').update({
        'booked_by_team_id': teamId,
        'booked_at': DateTime.now().toIso8601String(),
        'status': 'booked',
      }).eq('id', slotId);
      logDbOperation('UPDATE', 'mentor_slots', rowCount: 1);
      
      logInfo('Mentor slot booked', metadata: {'slotId': slotId, 'teamId': teamId});
    },
    operationName: 'bookMentorSlot',
  );

  /// Cancel a mentor slot booking
  Future<Result<void>> cancelMentorSlotBooking(String slotId) => execute(
    () async {
      await _supabase.from('mentor_slots').update({
        'booked_by_team_id': null,
        'booked_at': null,
        'status': 'available',
      }).eq('id', slotId);
      logDbOperation('UPDATE', 'mentor_slots', rowCount: 1);
      
      logInfo('Mentor slot booking cancelled', metadata: {'slotId': slotId});
    },
    operationName: 'cancelMentorSlotBooking',
  );

  // ==================== SUBMISSIONS ====================

  /// Get team's submission
  Future<Result<HackathonSubmission?>> getTeamSubmission(
      String eventId, String teamId) => execute(
    () async {
      final response = await _supabase
          .from('hackathon_submissions')
          .select()
          .eq('event_id', eventId)
          .eq('team_id', teamId)
          .maybeSingle();

      if (response == null) return null;
      return HackathonSubmission.fromJson(response as Map<String, dynamic>);
    },
    operationName: 'getTeamSubmission',
  );

  /// Create or update submission
  Future<Result<HackathonSubmission>> upsertSubmission({
    required String eventId,
    required String teamId,
    required String projectName,
    String? description,
    String? demoUrl,
    String? repoUrl,
    String? presentationUrl,
    String? videoUrl,
    List<String>? screenshots,
    List<String>? techStack,
    String? track,
    bool isDraft = true,
  }) => execute(
    () async {
      final response = await _supabase
          .from('hackathon_submissions')
          .upsert({
            'event_id': eventId,
            'team_id': teamId,
            'project_name': projectName,
            'description': description,
            'demo_url': demoUrl,
            'repo_url': repoUrl,
            'presentation_url': presentationUrl,
            'video_url': videoUrl,
            'screenshots': screenshots ?? [],
            'tech_stack': techStack ?? [],
            'track': track,
            'is_draft': isDraft,
            'submitted_at': isDraft ? null : DateTime.now().toIso8601String(),
          })
          .select()
          .single();

      logDbOperation('UPSERT', 'hackathon_submissions', rowCount: 1);
      return HackathonSubmission.fromJson(response as Map<String, dynamic>);
    },
    operationName: 'upsertSubmission',
  );

  /// Submit final submission
  Future<Result<HackathonSubmission>> submitFinal(String submissionId) => execute(
    () async {
      final response = await _supabase
          .from('hackathon_submissions')
          .update({
            'is_draft': false,
            'submitted_at': DateTime.now().toIso8601String(),
          })
          .eq('id', submissionId)
          .select()
          .single();

      logDbOperation('UPDATE', 'hackathon_submissions', rowCount: 1);
      logInfo('Final submission submitted', metadata: {'submissionId': submissionId});
      
      return HackathonSubmission.fromJson(response as Map<String, dynamic>);
    },
    operationName: 'submitFinal',
  );

  // ==================== DEADLINES ====================

  /// Get event deadlines
  Future<Result<List<HackathonDeadline>>> getEventDeadlines(String eventId) => execute(
    () async {
      final response = await _supabase
          .from('hackathon_deadlines')
          .select()
          .eq('event_id', eventId)
          .order('deadline_at');

      logDbOperation('SELECT', 'hackathon_deadlines', rowCount: (response as List).length);
      
      return response
          .map((json) => HackathonDeadline.fromJson(json as Map<String, dynamic>))
          .toList();
    },
    operationName: 'getEventDeadlines',
  );

  /// Get next upcoming deadline
  Future<Result<HackathonDeadline?>> getNextDeadline(String eventId) => execute(
    () async {
      final response = await _supabase
          .from('hackathon_deadlines')
          .select()
          .eq('event_id', eventId)
          .gte('deadline_at', DateTime.now().toIso8601String())
          .order('deadline_at')
          .limit(1)
          .maybeSingle();

      if (response == null) return null;
      return HackathonDeadline.fromJson(response as Map<String, dynamic>);
    },
    operationName: 'getNextDeadline',
  );
}
