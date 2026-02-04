import 'package:supabase_flutter/supabase_flutter.dart';
export 'package:supabase_flutter/supabase_flutter.dart' 
    show RealtimeChannel, PostgresChangeEvent, PostgresChangeFilter, PostgresChangeFilterType;
import 'package:thittam1hub/models/competition_models.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/utils/result.dart';

/// Service for competition and quiz event features
/// 
/// Extends BaseService for standardized logging, error handling, and Result types.
class CompetitionService extends BaseService {
  static CompetitionService? _instance;
  static CompetitionService get instance => _instance ??= CompetitionService._();
  CompetitionService._();

  @override
  String get tag => 'CompetitionService';

  final _supabase = SupabaseConfig.client;

  String? get _currentUserId => _supabase.auth.currentUser?.id;

  // ==================== Static Helpers ====================
  
  /// Static convenience method for fetching rounds (unwraps Result internally)
  static Future<List<CompetitionRound>> fetchRounds(String eventId) async {
    final result = await instance.getRounds(eventId);
    return result.isSuccess ? result.data : <CompetitionRound>[];
  }

  /// Static convenience method for fetching leaderboard (unwraps Result internally)
  static Future<List<CompetitionLeaderboardEntry>> fetchLeaderboard(String eventId, {int limit = 20}) async {
    final result = await instance.getLeaderboard(eventId, limit: limit);
    return result.isSuccess ? result.data : <CompetitionLeaderboardEntry>[];
  }

  // ============ Rounds ============

  /// Get all rounds for an event
  Future<Result<List<CompetitionRound>>> getRounds(String eventId) => execute(() async {
    final response = await _supabase
        .from('competition_rounds')
        .select('''
          *,
          competition_questions(count)
        ''')
        .eq('event_id', eventId)
        .order('round_number');

    logDbOperation('SELECT', 'competition_rounds', rowCount: (response as List).length);

    return response.map((json) {
      final questionsData = json['competition_questions'] as List?;
      final questionCount = questionsData?.isNotEmpty == true
          ? questionsData!.first['count'] as int? ?? 0
          : 0;

      return CompetitionRound.fromJson({
        ...json,
        'question_count': questionCount,
      });
    }).toList();
  }, operationName: 'getRounds');

  /// Get current active round for an event
  Future<Result<CompetitionRound?>> getCurrentRound(String eventId) => execute(() async {
    final response = await _supabase
        .from('competition_rounds')
        .select()
        .eq('event_id', eventId)
        .eq('status', 'active')
        .maybeSingle();

    logDbOperation('SELECT', 'competition_rounds');

    if (response == null) return null;
    return CompetitionRound.fromJson(response);
  }, operationName: 'getCurrentRound');

  // ============ Questions ============

  /// Get active question for a round
  Future<Result<CompetitionQuestion?>> getActiveQuestion(String roundId) => execute(() async {
    final response = await _supabase
        .from('competition_questions')
        .select()
        .eq('round_id', roundId)
        .eq('status', 'active')
        .maybeSingle();

    logDbOperation('SELECT', 'competition_questions');

    if (response == null) return null;
    return CompetitionQuestion.fromJson(response);
  }, operationName: 'getActiveQuestion');

  /// Get all questions for a round (closed questions only for non-hosts)
  Future<Result<List<CompetitionQuestion>>> getRoundQuestions(String roundId) => execute(() async {
    final response = await _supabase
        .from('competition_questions')
        .select()
        .eq('round_id', roundId)
        .inFilter('status', ['active', 'closed'])
        .order('question_number');

    logDbOperation('SELECT', 'competition_questions', rowCount: (response as List).length);

    return response
        .map((json) => CompetitionQuestion.fromJson(json))
        .toList();
  }, operationName: 'getRoundQuestions');

  // ============ Responses ============

  /// Submit an answer to a question
  Future<Result<CompetitionResponse?>> submitAnswer({
    required String questionId,
    required int selectedOption,
    int? responseTimeMs,
  }) => execute(() async {
    if (_currentUserId == null) return null;

    // First get the question to check if answer is correct
    final question = await _supabase
        .from('competition_questions')
        .select()
        .eq('id', questionId)
        .eq('status', 'active')
        .maybeSingle();

    if (question == null) {
      logWarning('Question not found or not active');
      return null;
    }

    final correctIndex = question['correct_option_index'] as int;
    final isCorrect = selectedOption == correctIndex;
    final points = question['points'] as int? ?? 10;
    final pointsEarned = isCorrect ? points : 0;

    final response = await _supabase
        .from('competition_responses')
        .insert({
          'question_id': questionId,
          'user_id': _currentUserId,
          'selected_option': selectedOption,
          'is_correct': isCorrect,
          'points_earned': pointsEarned,
          'response_time_ms': responseTimeMs,
        })
        .select()
        .single();

    logDbOperation('INSERT', 'competition_responses');

    // Update presence to show not answering
    final eventId = await _getEventIdFromQuestion(questionId);
    if (eventId.isNotEmpty) {
      await updatePresence(eventId);
    }

    return CompetitionResponse.fromJson(response);
  }, operationName: 'submitAnswer');

  Future<String> _getEventIdFromQuestion(String questionId) async {
    try {
      final result = await _supabase
          .from('competition_questions')
          .select('competition_rounds!inner(event_id)')
          .eq('id', questionId)
          .single();
      return result['competition_rounds']['event_id'] as String;
    } catch (e) {
      return '';
    }
  }

  /// Check if user has already answered a question
  Future<Result<CompetitionResponse?>> getMyResponse(String questionId) => execute(() async {
    if (_currentUserId == null) return null;

    final response = await _supabase
        .from('competition_responses')
        .select()
        .eq('question_id', questionId)
        .eq('user_id', _currentUserId!)
        .maybeSingle();

    logDbOperation('SELECT', 'competition_responses');

    if (response == null) return null;
    return CompetitionResponse.fromJson(response);
  }, operationName: 'getMyResponse');

  // ============ Scores ============

  /// Get current user's score for an event
  Future<Result<CompetitionScore?>> getMyScore(String eventId) => execute(() async {
    if (_currentUserId == null) return null;

    final response = await _supabase
        .from('competition_scores')
        .select()
        .eq('event_id', eventId)
        .eq('user_id', _currentUserId!)
        .maybeSingle();

    logDbOperation('SELECT', 'competition_scores');

    if (response == null) return null;

    // Get rank
    final rank = await _getUserRank(eventId, _currentUserId!);

    return CompetitionScore.fromJson(response, rank: rank);
  }, operationName: 'getMyScore');

  /// Get user's rank in the competition
  Future<int> _getUserRank(String eventId, String oduserId) async {
    try {
      final response = await _supabase
          .from('competition_scores')
          .select('user_id, total_score')
          .eq('event_id', eventId)
          .order('total_score', ascending: false);

      final scores = response as List;
      for (int i = 0; i < scores.length; i++) {
        if (scores[i]['user_id'] == oduserId) {
          return i + 1;
        }
      }
      return 0;
    } catch (e) {
      return 0;
    }
  }

  // ============ Leaderboard ============

  /// Get competition leaderboard
  Future<Result<List<CompetitionLeaderboardEntry>>> getLeaderboard(
    String eventId, {
    int limit = 20,
  }) => execute(() async {
    final response = await _supabase
        .from('competition_scores')
        .select('''
          *,
          user_profiles:user_id(full_name, avatar_url)
        ''')
        .eq('event_id', eventId)
        .order('total_score', ascending: false)
        .limit(limit);

    logDbOperation('SELECT', 'competition_scores', rowCount: (response as List).length);

    final entries = <CompetitionLeaderboardEntry>[];
    int rank = 1;
    for (final json in response) {
      final profile = json['user_profiles'] as Map<String, dynamic>?;
      entries.add(CompetitionLeaderboardEntry.fromJson(
        {
          ...json,
          'user_name': profile?['full_name'] ?? 'Anonymous',
          'user_avatar': profile?['avatar_url'],
        },
        rank: rank++,
        currentUserId: _currentUserId,
      ));
    }
    return entries;
  }, operationName: 'getLeaderboard');

  /// Get top 3 winners
  Future<Result<List<CompetitionLeaderboardEntry>>> getTopThree(String eventId) {
    return getLeaderboard(eventId, limit: 3);
  }

  // ============ Presence Tracking ============

  /// Update user's presence in a competition
  Future<Result<void>> updatePresence(String eventId, {String? currentQuestionId}) => execute(() async {
    if (_currentUserId == null || eventId.isEmpty) return;

    await _supabase.from('competition_presence').upsert({
      'event_id': eventId,
      'user_id': _currentUserId,
      'is_online': true,
      'last_seen': DateTime.now().toIso8601String(),
      'current_question_id': currentQuestionId,
    });

    logDbOperation('UPSERT', 'competition_presence');
  }, operationName: 'updatePresence');

  /// Mark user as offline
  Future<Result<void>> goOffline(String eventId) => execute(() async {
    if (_currentUserId == null) return;

    await _supabase
        .from('competition_presence')
        .update({'is_online': false, 'last_seen': DateTime.now().toIso8601String()})
        .eq('event_id', eventId)
        .eq('user_id', _currentUserId!);

    logDbOperation('UPDATE', 'competition_presence');
  }, operationName: 'goOffline');

  /// Get presence stats for an event
  Future<Result<CompetitionPresence>> getPresenceStats(String eventId) => execute(() async {
    final response = await _supabase
        .from('competition_presence')
        .select('user_id, is_online, current_question_id')
        .eq('event_id', eventId)
        .eq('is_online', true);

    logDbOperation('SELECT', 'competition_presence', rowCount: (response as List).length);

    final presenceList = response;
    final onlineCount = presenceList.length;
    final answeringCount = presenceList
        .where((p) => p['current_question_id'] != null)
        .length;
    final recentIds = presenceList
        .take(10)
        .map((p) => p['user_id'] as String)
        .toList();

    return CompetitionPresence(
      eventId: eventId,
      onlineCount: onlineCount,
      answeringCount: answeringCount,
      recentParticipantIds: recentIds,
    );
  }, operationName: 'getPresenceStats');

  /// Subscribe to presence changes
  RealtimeChannel subscribeToPresence(
    String eventId, {
    required void Function(CompetitionPresence) onPresenceUpdate,
  }) {
    return _supabase
        .channel('competition_presence_$eventId')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'competition_presence',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'event_id',
            value: eventId,
          ),
          callback: (payload) async {
            final result = await getPresenceStats(eventId);
            if (result.isSuccess) {
              onPresenceUpdate(result.data);
            }
          },
        )
        .subscribe();
  }

  // ============ Badges ============

  /// Get all available competition badges
  Future<Result<List<CompetitionBadge>>> getAllBadges() => execute(() async {
    final response = await _supabase
        .from('competition_badges')
        .select()
        .order('points_value', ascending: false);

    logDbOperation('SELECT', 'competition_badges', rowCount: (response as List).length);

    return response
        .map((json) => CompetitionBadge.fromJson(json))
        .toList();
  }, operationName: 'getAllBadges');

  /// Get user's earned badges for an event
  Future<Result<List<CompetitionBadge>>> getEarnedBadges(String eventId) => execute(() async {
    if (_currentUserId == null) return <CompetitionBadge>[];

    final response = await _supabase
        .from('user_competition_badges')
        .select('''
          *,
          competition_badges(*)
        ''')
        .eq('event_id', eventId)
        .eq('user_id', _currentUserId!);

    logDbOperation('SELECT', 'user_competition_badges', rowCount: (response as List).length);

    return response.map((json) {
      final badgeData = json['competition_badges'] as Map<String, dynamic>;
      return CompetitionBadge.fromJson(
        badgeData,
        earnedAt: DateTime.parse(json['earned_at'] as String),
        metadata: json['metadata'] as Map<String, dynamic>?,
      );
    }).toList();
  }, operationName: 'getEarnedBadges');

  /// Get badges with earned status for display
  Future<Result<List<CompetitionBadge>>> getBadgesWithStatus(String eventId) => execute(() async {
    final allBadgesResult = await getAllBadges();
    if (!allBadgesResult.isSuccess) return <CompetitionBadge>[];
    
    final earnedBadgesResult = await getEarnedBadges(eventId);
    if (!earnedBadgesResult.isSuccess) return allBadgesResult.data;

    final allBadges = allBadgesResult.data;
    final earnedBadges = earnedBadgesResult.data;
    final earnedBadgeIds = earnedBadges.map((b) => b.id).toSet();

    return allBadges.map((badge) {
      if (earnedBadgeIds.contains(badge.id)) {
        return earnedBadges.firstWhere((b) => b.id == badge.id);
      }
      return badge;
    }).toList();
  }, operationName: 'getBadgesWithStatus');

  // ============ Team Competition ============

  /// Check if event is in team competition mode
  Future<Result<bool>> isTeamCompetition(String eventId) => execute(() async {
    // Check if there are any team scores for this event
    final response = await _supabase
        .from('competition_team_scores')
        .select('id')
        .eq('event_id', eventId)
        .limit(1);

    logDbOperation('SELECT', 'competition_team_scores');
    return (response as List).isNotEmpty;
  }, operationName: 'isTeamCompetition');

  /// Get current user's team ID for an event (from hackathon_team_members)
  Future<Result<String?>> getMyTeamId(String eventId) => execute(() async {
    if (_currentUserId == null) return null;

    final response = await _supabase
        .from('hackathon_team_members')
        .select('team_id, hackathon_teams!inner(event_id)')
        .eq('user_id', _currentUserId!)
        .eq('hackathon_teams.event_id', eventId)
        .maybeSingle();

    logDbOperation('SELECT', 'hackathon_team_members');
    return response?['team_id'] as String?;
  }, operationName: 'getMyTeamId');

  /// Get team leaderboard
  Future<Result<List<CompetitionTeamScore>>> getTeamLeaderboard(
    String eventId, {
    int limit = 10,
  }) => execute(() async {
    final response = await _supabase
        .from('competition_team_scores')
        .select('''
          *,
          hackathon_teams(name)
        ''')
        .eq('event_id', eventId)
        .order('total_score', ascending: false)
        .limit(limit);

    logDbOperation('SELECT', 'competition_team_scores', rowCount: (response as List).length);

    final teams = <CompetitionTeamScore>[];
    int rank = 1;
    for (final json in response) {
      teams.add(CompetitionTeamScore.fromJson(json, rank: rank++));
    }
    return teams;
  }, operationName: 'getTeamLeaderboard');

  /// Get current user's team score
  Future<Result<CompetitionTeamScore?>> getMyTeamScore(String eventId) => execute(() async {
    final teamIdResult = await getMyTeamId(eventId);
    if (!teamIdResult.isSuccess || teamIdResult.data == null) return null;
    
    final teamId = teamIdResult.data!;

    final response = await _supabase
        .from('competition_team_scores')
        .select('''
          *,
          hackathon_teams(name)
        ''')
        .eq('event_id', eventId)
        .eq('team_id', teamId)
        .maybeSingle();

    if (response == null) return null;

    logDbOperation('SELECT', 'competition_team_scores');

    // Get team's rank
    final allTeamsResult = await getTeamLeaderboard(eventId, limit: 100);
    final allTeams = allTeamsResult.isSuccess ? allTeamsResult.data : <CompetitionTeamScore>[];
    final rank = allTeams.indexWhere((t) => t.teamId == teamId) + 1;

    // Get member scores
    final memberScoresResult = await getTeamMemberScores(eventId, teamId);
    final memberScores = memberScoresResult.isSuccess ? memberScoresResult.data : <TeamMemberScore>[];

    return CompetitionTeamScore.fromJson(
      response,
      rank: rank,
      memberScores: memberScores,
    );
  }, operationName: 'getMyTeamScore');

  /// Get individual member scores for a team
  Future<Result<List<TeamMemberScore>>> getTeamMemberScores(
    String eventId,
    String teamId,
  ) => execute(() async {
    final response = await _supabase
        .from('competition_scores')
        .select('''
          *,
          user_profiles:user_id(full_name, avatar_url)
        ''')
        .eq('event_id', eventId)
        .eq('team_id', teamId)
        .order('total_score', ascending: false);

    logDbOperation('SELECT', 'competition_scores', rowCount: (response as List).length);

    return response.map((json) {
      final profile = json['user_profiles'] as Map<String, dynamic>?;
      return TeamMemberScore.fromJson({
        ...json,
        'user_name': profile?['full_name'] ?? 'Member',
        'user_avatar': profile?['avatar_url'],
      });
    }).toList();
  }, operationName: 'getTeamMemberScores');

  /// Subscribe to team leaderboard changes
  RealtimeChannel subscribeToTeamLeaderboard(
    String eventId, {
    required void Function() onUpdate,
  }) {
    return _supabase
        .channel('competition_team_scores_$eventId')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'competition_team_scores',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'event_id',
            value: eventId,
          ),
          callback: (payload) => onUpdate(),
        )
        .subscribe();
  }

  // ============ Real-time Subscriptions ============

  /// Subscribe to question changes for a round
  RealtimeChannel subscribeToQuestions(
    String roundId, {
    required void Function(CompetitionQuestion?) onQuestionUpdate,
  }) {
    return _supabase
        .channel('competition_questions_$roundId')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'competition_questions',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'round_id',
            value: roundId,
          ),
          callback: (payload) {
            if (payload.newRecord.isNotEmpty) {
              final question = CompetitionQuestion.fromJson(payload.newRecord);
              onQuestionUpdate(question.isActive ? question : null);
            } else {
              onQuestionUpdate(null);
            }
          },
        )
        .subscribe();
  }

  /// Subscribe to leaderboard changes for an event
  RealtimeChannel subscribeToLeaderboard(
    String eventId, {
    required void Function() onLeaderboardUpdate,
  }) {
    return _supabase
        .channel('competition_scores_$eventId')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'competition_scores',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'event_id',
            value: eventId,
          ),
          callback: (payload) {
            onLeaderboardUpdate();
          },
        )
        .subscribe();
  }

  /// Unsubscribe from a channel
  Future<void> unsubscribe(RealtimeChannel channel) async {
    await _supabase.removeChannel(channel);
  }

  // ============ Statistics ============

  /// Get competition statistics for an event
  Future<Result<Map<String, dynamic>>> getCompetitionStats(String eventId) => execute(() async {
    final scores = await _supabase
        .from('competition_scores')
        .select('total_score, correct_answers, total_answers')
        .eq('event_id', eventId);

    logDbOperation('SELECT', 'competition_scores', rowCount: (scores as List).length);

    final scoresList = scores;
    if (scoresList.isEmpty) {
      return {
        'participant_count': 0,
        'average_score': 0,
        'highest_score': 0,
        'total_questions_answered': 0,
      };
    }

    int totalScore = 0;
    int highestScore = 0;
    int totalAnswers = 0;

    for (final score in scoresList) {
      final s = score['total_score'] as int? ?? 0;
      totalScore += s;
      if (s > highestScore) highestScore = s;
      totalAnswers += score['total_answers'] as int? ?? 0;
    }

    return {
      'participant_count': scoresList.length,
      'average_score': totalScore ~/ scoresList.length,
      'highest_score': highestScore,
      'total_questions_answered': totalAnswers,
    };
  }, operationName: 'getCompetitionStats');
}
