import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/models/zone_models.dart';
import 'package:thittam1hub/models/zone_team_member.dart';
import 'package:thittam1hub/models/session_feedback.dart';
import 'package:thittam1hub/models/icebreaker_models.dart';
import 'package:thittam1hub/models/session_material.dart';
import 'package:thittam1hub/models/session_question.dart';
import 'package:thittam1hub/models/session_bookmark.dart';
import 'package:thittam1hub/models/zone_challenge.dart';
import 'package:thittam1hub/models/sponsor_booth.dart';
import 'package:thittam1hub/models/zone_activity.dart' hide ZoneActivityType;
import 'package:thittam1hub/models/zone_gamification_models.dart';
import 'package:thittam1hub/models/zone_notification_models.dart';
import 'package:thittam1hub/models/paginated_list.dart';
import 'package:thittam1hub/utils/result.dart';
import 'base_repository.dart';
import 'zone_repository.dart';

/// Supabase implementation of ZoneRepository
/// Extends BaseRepository for standardized error handling and logging
class SupabaseZoneRepository extends BaseRepository implements ZoneRepository {
  @override
  String get tag => 'ZoneRepository';
  
  final SupabaseClient _client = Supabase.instance.client;

  String? get _userId => _client.auth.currentUser?.id;

  // ========== Event Operations ==========

  @override
  Future<Result<List<ZoneEvent>>> getTodayEvents() async {
    if (_userId == null) {
      return const Failure('Please sign in to view your events');
    }

    return execute(() async {
      final now = DateTime.now();
      final startOfDay = DateTime(now.year, now.month, now.day);
      final endOfDay = startOfDay.add(const Duration(days: 1));

      final response = await _client
          .from('events')
          .select('id, name, description, start_date, end_date, category, branding')
          .gte('end_date', startOfDay.toIso8601String())
          .lte('start_date', endOfDay.toIso8601String())
          .eq('status', 'PUBLISHED')
          .order('start_date');

      final events = <ZoneEvent>[];
      for (final json in response as List) {
        final checkinResponse = await _client
            .from('event_checkins')
            .select('id')
            .eq('event_id', json['id'])
            .eq('user_id', _userId!)
            .isFilter('checkout_time', null)
            .maybeSingle();

        final isCheckedIn = checkinResponse != null;
        events.add(ZoneEvent.fromJson(json as Map<String, dynamic>, isCheckedIn: isCheckedIn));
      }

      logDbOperation('SELECT', 'events', rowCount: events.length);
      return events;
    }, operationName: 'getTodayEvents');
  }

  @override
  Future<Result<ZoneEvent?>> getCurrentEvent() async {
    if (_userId == null) {
      return const Failure('Please sign in to view your events');
    }

    return execute(() async {
      final checkinResponse = await _client
          .from('event_checkins')
          .select('event_id, events(id, name, description, start_date, end_date, category, branding)')
          .eq('user_id', _userId!)
          .isFilter('checkout_time', null)
          .order('checkin_time', ascending: false)
          .limit(1)
          .maybeSingle();

      if (checkinResponse == null) return null;

      final eventData = checkinResponse['events'] as Map<String, dynamic>?;
      if (eventData == null) return null;

      return ZoneEvent.fromJson(eventData, isCheckedIn: true);
    }, operationName: 'getCurrentEvent');
  }

  @override
  Future<Result<bool>> checkIn(String eventId, {String? location}) async {
    if (_userId == null) {
      return const Failure('Please sign in to check in');
    }

    return execute(() async {
      final today = DateTime.now();
      final checkinDate = DateTime(today.year, today.month, today.day);
      final checkinDateStr = checkinDate.toIso8601String().split('T')[0];

      final existing = await _client
          .from('event_checkins')
          .select('id')
          .eq('event_id', eventId)
          .eq('user_id', _userId!)
          .eq('checkin_date', checkinDateStr)
          .maybeSingle();

      if (existing != null) {
        await _client.from('event_checkins').update({
          'checkout_time': null,
          'checkin_time': DateTime.now().toIso8601String(),
          'location': location,
        }).eq('id', existing['id']);
      } else {
        await _client.from('event_checkins').insert({
          'user_id': _userId,
          'event_id': eventId,
          'checkin_date': checkinDateStr,
          'checkin_time': DateTime.now().toIso8601String(),
          'location': location,
        });
      }
      
      logInfo('User checked in to event: $eventId');
      return true;
    }, operationName: 'checkIn');
  }

  @override
  Future<Result<bool>> checkOut(String eventId) async {
    if (_userId == null) {
      return const Failure('Please sign in to check out');
    }

    return execute(() async {
      await _client
          .from('event_checkins')
          .update({'checkout_time': DateTime.now().toIso8601String()})
          .eq('event_id', eventId)
          .eq('user_id', _userId!)
          .isFilter('checkout_time', null);
      
      logInfo('User checked out from event: $eventId');
      return true;
    }, operationName: 'checkOut');
  }

  // ========== Session Operations ==========

  @override
  Future<Result<List<EventSession>>> getLiveSessions(String eventId) async {
    return execute(() async {
      final now = DateTime.now();
      final response = await _client
          .from('event_sessions')
          .select()
          .eq('event_id', eventId)
          .lte('start_time', now.toIso8601String())
          .gte('end_time', now.toIso8601String())
          .order('start_time');

      final sessions = (response as List)
          .map((json) => EventSession.fromJson(json as Map<String, dynamic>))
          .toList();
      
      logDbOperation('SELECT', 'event_sessions', rowCount: sessions.length);
      return sessions;
    }, operationName: 'getLiveSessions');
  }

  @override
  Future<Result<List<EventSession>>> getUpcomingSessions(String eventId, {int limit = 5}) async {
    return execute(() async {
      final now = DateTime.now();
      final response = await _client
          .from('event_sessions')
          .select()
          .eq('event_id', eventId)
          .gt('start_time', now.toIso8601String())
          .order('start_time')
          .limit(limit);

      final sessions = (response as List)
          .map((json) => EventSession.fromJson(json as Map<String, dynamic>))
          .toList();
      
      logDbOperation('SELECT', 'event_sessions', rowCount: sessions.length);
      return sessions;
    }, operationName: 'getUpcomingSessions');
  }

  @override
  Future<Result<List<EventSession>>> getAllSessions(String eventId) async {
    return execute(() async {
      final response = await _client
          .from('event_sessions')
          .select()
          .eq('event_id', eventId)
          .order('start_time');

      final sessions = (response as List)
          .map((json) => EventSession.fromJson(json as Map<String, dynamic>))
          .toList();
      
      logDbOperation('SELECT', 'event_sessions', rowCount: sessions.length);
      return sessions;
    }, operationName: 'getAllSessions');
  }

  @override
  Future<Result<String>> createSession({
    required String eventId,
    required String title,
    String? description,
    String? speakerName,
    String? speakerAvatar,
    String? room,
    required DateTime startTime,
    required DateTime endTime,
    List<String>? tags,
  }) async {
    return execute(() async {
      final response = await _client.from('event_sessions').insert({
        'event_id': eventId,
        'title': title,
        'description': description,
        'speaker_name': speakerName,
        'speaker_avatar': speakerAvatar,
        'room': room,
        'start_time': startTime.toIso8601String(),
        'end_time': endTime.toIso8601String(),
        'status': 'upcoming',
        'tags': tags ?? [],
      }).select('id').single();

      logInfo('Created session: $title for event: $eventId');
      return response['id'] as String;
    }, operationName: 'createSession');
  }

  @override
  Future<Result<bool>> updateSession({
    required String sessionId,
    String? title,
    String? description,
    String? speakerName,
    String? speakerAvatar,
    String? room,
    DateTime? startTime,
    DateTime? endTime,
    String? status,
    List<String>? tags,
  }) async {
    return execute(() async {
      final updates = <String, dynamic>{};
      if (title != null) updates['title'] = title;
      if (description != null) updates['description'] = description;
      if (speakerName != null) updates['speaker_name'] = speakerName;
      if (speakerAvatar != null) updates['speaker_avatar'] = speakerAvatar;
      if (room != null) updates['room'] = room;
      if (startTime != null) updates['start_time'] = startTime.toIso8601String();
      if (endTime != null) updates['end_time'] = endTime.toIso8601String();
      if (status != null) updates['status'] = status;
      if (tags != null) updates['tags'] = tags;

      await _client.from('event_sessions').update(updates).eq('id', sessionId);
      
      logInfo('Updated session: $sessionId');
      return true;
    }, operationName: 'updateSession');
  }

  @override
  Future<Result<bool>> deleteSession(String sessionId) async {
    return execute(() async {
      await _client.from('event_sessions').delete().eq('id', sessionId);
      logInfo('Deleted session: $sessionId');
      return true;
    }, operationName: 'deleteSession');
  }

  // ========== Attendee Operations ==========

  @override
  Future<Result<List<AttendeeRadar>>> getNearbyAttendees(String eventId, {int limit = 12}) async {
    if (_userId == null) {
      return const Failure('Please sign in to see nearby attendees');
    }

    return execute(() async {
      final response = await _client
          .from('event_checkins')
          .select('user_id, impact_profiles(id, user_id, full_name, avatar_url, headline, is_online)')
          .eq('event_id', eventId)
          .neq('user_id', _userId!)
          .isFilter('checkout_time', null)
          .limit(limit);

      final attendees = <AttendeeRadar>[];
      for (final json in response as List) {
        final profile = json['impact_profiles'] as Map<String, dynamic>?;
        if (profile == null) continue;

        attendees.add(AttendeeRadar(
          id: profile['id'] as String,
          userId: profile['user_id'] as String,
          fullName: profile['full_name'] as String,
          avatarUrl: profile['avatar_url'] as String?,
          headline: profile['headline'] as String?,
          isOnline: profile['is_online'] as bool? ?? false,
        ));
      }

      logDbOperation('SELECT', 'event_checkins', rowCount: attendees.length);
      return attendees;
    }, operationName: 'getNearbyAttendees');
  }

  @override
  Future<Result<int>> getAttendeeCount(String eventId) async {
    return execute(() async {
      final response = await _client
          .from('event_checkins')
          .select('id')
          .eq('event_id', eventId)
          .isFilter('checkout_time', null);

      return (response as List).length;
    }, operationName: 'getAttendeeCount');
  }

  // ========== Poll Operations ==========

  @override
  Future<Result<PaginatedList<EventPoll>>> getActivePolls(
    String eventId, {
    int page = 0,
    int pageSize = 10,
  }) async {
    return execute(() async {
      // Get total count first
      final countResponse = await _client
          .from('event_polls')
          .select('id')
          .eq('event_id', eventId)
          .eq('is_active', true);
      final totalCount = (countResponse as List).length;

      // Get paginated data
      final response = await _client
          .from('event_polls')
          .select('*, event_poll_options(*)')
          .eq('event_id', eventId)
          .eq('is_active', true)
          .order('created_at', ascending: false)
          .range(page * pageSize, (page + 1) * pageSize - 1);

      final polls = await _parsePollsWithVotes(response as List);

      logDbOperation('SELECT', 'event_polls', rowCount: polls.length);
      return PaginatedList(
        items: polls,
        totalCount: totalCount,
        currentPage: page,
        pageSize: pageSize,
      );
    }, operationName: 'getActivePolls');
  }

  @override
  Future<Result<PaginatedList<EventPoll>>> getAllPolls(
    String eventId, {
    int page = 0,
    int pageSize = 20,
  }) async {
    return execute(() async {
      final countResponse = await _client
          .from('event_polls')
          .select('id')
          .eq('event_id', eventId);
      final totalCount = (countResponse as List).length;

      final response = await _client
          .from('event_polls')
          .select('*, event_poll_options(*)')
          .eq('event_id', eventId)
          .order('created_at', ascending: false)
          .range(page * pageSize, (page + 1) * pageSize - 1);

      final polls = await _parsePollsWithoutVotes(response as List);

      logDbOperation('SELECT', 'event_polls', rowCount: polls.length);
      return PaginatedList(
        items: polls,
        totalCount: totalCount,
        currentPage: page,
        pageSize: pageSize,
      );
    }, operationName: 'getAllPolls');
  }

  Future<List<EventPoll>> _parsePollsWithVotes(List<dynamic> response) async {
    final polls = <EventPoll>[];
    for (final json in response) {
      final options = (json['event_poll_options'] as List<dynamic>?)
          ?.map((o) => PollOption(
                id: o['id'] as String,
                text: o['text'] as String,
                voteCount: o['vote_count'] as int? ?? 0,
              ))
          .toList() ?? [];

      String? userVote;
      if (_userId != null) {
        final voteResponse = await _client
            .from('event_poll_votes')
            .select('option_id')
            .eq('poll_id', json['id'])
            .eq('user_id', _userId!)
            .maybeSingle();
        userVote = voteResponse?['option_id'] as String?;
      }

      polls.add(EventPoll(
        id: json['id'] as String,
        eventId: json['event_id'] as String,
        question: json['question'] as String,
        options: options,
        createdAt: DateTime.parse(json['created_at'] as String),
        expiresAt: json['expires_at'] != null
            ? DateTime.parse(json['expires_at'] as String)
            : null,
        isActive: json['is_active'] as bool? ?? true,
        totalVotes: options.fold(0, (sum, o) => sum + o.voteCount),
        userVote: userVote,
      ));
    }
    return polls;
  }

  Future<List<EventPoll>> _parsePollsWithoutVotes(List<dynamic> response) async {
    return response.map((json) {
      final options = (json['event_poll_options'] as List<dynamic>?)
          ?.map((o) => PollOption(
                id: o['id'] as String,
                text: o['text'] as String,
                voteCount: o['vote_count'] as int? ?? 0,
              ))
          .toList() ?? [];

      return EventPoll(
        id: json['id'] as String,
        eventId: json['event_id'] as String,
        question: json['question'] as String,
        options: options,
        createdAt: DateTime.parse(json['created_at'] as String),
        expiresAt: json['expires_at'] != null
            ? DateTime.parse(json['expires_at'] as String)
            : null,
        isActive: json['is_active'] as bool? ?? true,
        totalVotes: options.fold(0, (sum, o) => sum + o.voteCount),
        userVote: null,
      );
    }).toList();
  }

  @override
  Future<Result<bool>> submitPollVote(String pollId, String optionId) async {
    if (_userId == null) {
      return const Failure('Please sign in to vote');
    }

    return execute(() async {
      await _client.from('event_poll_votes').upsert({
        'poll_id': pollId,
        'user_id': _userId,
        'option_id': optionId,
      }, onConflict: 'poll_id,user_id');

      await _client.rpc('increment_poll_vote', params: {'p_option_id': optionId});
      
      logInfo('User voted on poll: $pollId');
      return true;
    }, operationName: 'submitPollVote');
  }

  @override
  Future<Result<String>> createPoll({
    required String eventId,
    required String question,
    required List<String> options,
    DateTime? expiresAt,
  }) async {
    return execute(() async {
      final pollResponse = await _client.from('event_polls').insert({
        'event_id': eventId,
        'question': question,
        'is_active': true,
        'expires_at': expiresAt?.toIso8601String(),
      }).select('id').single();

      final pollId = pollResponse['id'] as String;

      final optionInserts = options.map((text) => {
        'poll_id': pollId,
        'text': text,
        'vote_count': 0,
      }).toList();

      await _client.from('event_poll_options').insert(optionInserts);
      
      logInfo('Created poll: $question for event: $eventId');
      return pollId;
    }, operationName: 'createPoll');
  }

  @override
  Future<Result<bool>> closePoll(String pollId) async {
    return execute(() async {
      await _client.from('event_polls').update({'is_active': false}).eq('id', pollId);
      logInfo('Closed poll: $pollId');
      return true;
    }, operationName: 'closePoll');
  }

  @override
  Future<Result<bool>> deletePoll(String pollId) async {
    return execute(() async {
      await _client.from('event_poll_options').delete().eq('poll_id', pollId);
      await _client.from('event_polls').delete().eq('id', pollId);
      logInfo('Deleted poll: $pollId');
      return true;
    }, operationName: 'deletePoll');
  }

  // ========== Announcement Operations ==========

  @override
  Future<Result<PaginatedList<EventAnnouncement>>> getAnnouncements(
    String eventId, {
    int page = 0,
    int pageSize = 10,
  }) async {
    return execute(() async {
      final countResponse = await _client
          .from('event_announcements')
          .select('id')
          .eq('event_id', eventId);
      final totalCount = (countResponse as List).length;

      final response = await _client
          .from('event_announcements')
          .select()
          .eq('event_id', eventId)
          .order('is_pinned', ascending: false)
          .order('created_at', ascending: false)
          .range(page * pageSize, (page + 1) * pageSize - 1);

      final announcements = (response as List)
          .map((json) => EventAnnouncement.fromJson(json as Map<String, dynamic>))
          .toList();

      logDbOperation('SELECT', 'event_announcements', rowCount: announcements.length);
      return PaginatedList(
        items: announcements,
        totalCount: totalCount,
        currentPage: page,
        pageSize: pageSize,
      );
    }, operationName: 'getAnnouncements');
  }

  @override
  Future<Result<List<EventAnnouncement>>> getAllAnnouncements(String eventId) async {
    return execute(() async {
      final response = await _client
          .from('event_announcements')
          .select()
          .eq('event_id', eventId)
          .order('is_pinned', ascending: false)
          .order('created_at', ascending: false);

      final announcements = (response as List)
          .map((json) => EventAnnouncement.fromJson(json as Map<String, dynamic>))
          .toList();

      logDbOperation('SELECT', 'event_announcements', rowCount: announcements.length);
      return announcements;
    }, operationName: 'getAllAnnouncements');
  }

  @override
  Future<Result<String>> createAnnouncement({
    required String eventId,
    required String title,
    required String content,
    String type = 'info',
    bool isPinned = false,
  }) async {
    return execute(() async {
      final response = await _client.from('event_announcements').insert({
        'event_id': eventId,
        'title': title,
        'content': content,
        'type': type,
        'is_pinned': isPinned,
      }).select('id').single();

      logInfo('Created announcement: $title for event: $eventId');
      return response['id'] as String;
    }, operationName: 'createAnnouncement');
  }

  @override
  Future<Result<bool>> toggleAnnouncementPin(String announcementId, bool isPinned) async {
    return execute(() async {
      await _client
          .from('event_announcements')
          .update({'is_pinned': isPinned})
          .eq('id', announcementId);
      
      logInfo('Toggled pin for announcement: $announcementId to $isPinned');
      return true;
    }, operationName: 'toggleAnnouncementPin');
  }

  @override
  Future<Result<bool>> deleteAnnouncement(String announcementId) async {
    return execute(() async {
      await _client.from('event_announcements').delete().eq('id', announcementId);
      logInfo('Deleted announcement: $announcementId');
      return true;
    }, operationName: 'deleteAnnouncement');
  }

  // ========== Permission Operations ==========

  @override
  Future<Result<bool>> canManageZone(String eventId) async {
    if (_userId == null) {
      return const Success(false);
    }

    return execute(() async {
      // Use SECURITY DEFINER RPC for proper permission check
      // This correctly checks: event owner OR active member of ANY workspace linked to event
      final result = await _client.rpc(
        'can_manage_zone_content',
        params: {'p_event_id': eventId},
      );
      return result == true;
    }, operationName: 'canManageZone');
  }

  // ========== Team Operations ==========

  @override
  Future<Result<List<ZoneTeamMember>>> getZoneTeamMembers(String eventId) async {
    return execute(() async {
      final data = await _client.rpc(
        'get_zone_team_members',
        params: {'p_event_id': eventId},
      );
      
      final members = (data as List)
          .map((j) => ZoneTeamMember.fromJson(j as Map<String, dynamic>))
          .toList();
      
      logDbOperation('RPC', 'get_zone_team_members', rowCount: members.length);
      return members;
    }, operationName: 'getZoneTeamMembers');
  }

  // ========== Feedback Operations ==========

  @override
  Future<Result<bool>> submitSessionFeedback({
    required String sessionId,
    required String eventId,
    required int overallRating,
    int? contentRating,
    int? speakerRating,
    String? feedbackText,
    bool? wouldRecommend,
  }) async {
    if (_userId == null) {
      return const Failure('Please sign in to submit feedback');
    }

    return execute(() async {
      await _client.from('event_session_feedback').upsert({
        'session_id': sessionId,
        'event_id': eventId,
        'user_id': _userId,
        'overall_rating': overallRating,
        if (contentRating != null) 'content_rating': contentRating,
        if (speakerRating != null) 'speaker_rating': speakerRating,
        if (feedbackText != null) 'feedback_text': feedbackText,
        if (wouldRecommend != null) 'would_recommend': wouldRecommend,
      }, onConflict: 'session_id,user_id');

      logInfo('Submitted feedback for session: $sessionId');
      return true;
    }, operationName: 'submitSessionFeedback');
  }

  @override
  Future<Result<SessionFeedback?>> getUserSessionFeedback(String sessionId) async {
    if (_userId == null) {
      return const Success(null);
    }

    return execute(() async {
      final response = await _client
          .from('event_session_feedback')
          .select()
          .eq('session_id', sessionId)
          .eq('user_id', _userId!)
          .maybeSingle();

      if (response == null) return null;
      return SessionFeedback.fromJson(response);
    }, operationName: 'getUserSessionFeedback');
  }

  @override
  Future<Result<SessionRatingAggregate?>> getSessionRatingAggregate(String sessionId) async {
    return execute(() async {
      final response = await _client
          .from('event_session_ratings_aggregate')
          .select()
          .eq('session_id', sessionId)
          .maybeSingle();

      if (response == null) return null;
      return SessionRatingAggregate.fromJson(response);
    }, operationName: 'getSessionRatingAggregate');
  }

  @override
  Future<Result<List<SessionFeedback>>> getSessionFeedbackList(String sessionId) async {
    return execute(() async {
      final response = await _client
          .from('event_session_feedback')
          .select()
          .eq('session_id', sessionId)
          .order('created_at', ascending: false)
          .limit(100);

      final feedback = (response as List)
          .map((j) => SessionFeedback.fromJson(j as Map<String, dynamic>))
          .toList();

      logDbOperation('SELECT', 'event_session_feedback', rowCount: feedback.length);
      return feedback;
    }, operationName: 'getSessionFeedbackList');
  }

  // ========== Track Operations ==========

  @override
  Future<Result<List<EventTrack>>> getEventTracks(String eventId) async {
    return execute(() async {
      final response = await _client
          .from('event_tracks')
          .select()
          .eq('event_id', eventId)
          .order('sort_order');

      final tracks = (response as List)
          .map((j) => EventTrack.fromJson(j as Map<String, dynamic>))
          .toList();

      logDbOperation('SELECT', 'event_tracks', rowCount: tracks.length);
      return tracks;
    }, operationName: 'getEventTracks');
  }

  // ========== Icebreaker Operations ==========

  @override
  Future<Result<EventIcebreaker?>> getTodayIcebreaker(String eventId) async {
    return execute(() async {
      final today = DateTime.now().toIso8601String().split('T')[0];
      
      // Get today's icebreaker
      final response = await _client
          .from('event_icebreakers')
          .select()
          .eq('event_id', eventId)
          .eq('active_date', today)
          .eq('is_active', true)
          .maybeSingle();

      if (response == null) return null;

      // Get answer count
      final countResponse = await _client
          .from('event_icebreaker_answers')
          .select('id')
          .eq('icebreaker_id', response['id']);
      final answerCount = (countResponse as List).length;

      // Get user's answer if exists
      String? myAnswer;
      int streakDays = 0;
      
      if (_userId != null) {
        final myAnswerResponse = await _client
            .from('event_icebreaker_answers')
            .select('answer')
            .eq('icebreaker_id', response['id'])
            .eq('user_id', _userId!)
            .maybeSingle();
        myAnswer = myAnswerResponse?['answer'] as String?;

        // Get streak
        final streakResponse = await _client
            .from('event_icebreaker_streaks')
            .select('current_streak')
            .eq('event_id', eventId)
            .eq('user_id', _userId!)
            .maybeSingle();
        streakDays = streakResponse?['current_streak'] as int? ?? 0;
      }

      final json = Map<String, dynamic>.from(response);
      json['answer_count'] = answerCount;
      json['my_answer'] = myAnswer;
      json['streak_days'] = streakDays;

      return EventIcebreaker.fromJson(json);
    }, operationName: 'getTodayIcebreaker');
  }

  @override
  Future<Result<List<IcebreakerAnswer>>> getIcebreakerAnswers(String icebreakerId) async {
    return execute(() async {
      final response = await _client
          .from('event_icebreaker_answers')
          .select('*, impact_profiles(full_name, avatar_url)')
          .eq('icebreaker_id', icebreakerId)
          .order('created_at', ascending: false)
          .limit(100);

      final answers = (response as List)
          .map((j) => IcebreakerAnswer.fromJson(j as Map<String, dynamic>))
          .toList();

      logDbOperation('SELECT', 'event_icebreaker_answers', rowCount: answers.length);
      return answers;
    }, operationName: 'getIcebreakerAnswers');
  }

  @override
  Future<Result<int>> submitIcebreakerAnswer({
    required String icebreakerId,
    required String eventId,
    required String answer,
  }) async {
    if (_userId == null) {
      return const Failure('Please sign in to submit an answer');
    }

    return execute(() async {
      // Upsert the answer
      await _client.from('event_icebreaker_answers').upsert({
        'icebreaker_id': icebreakerId,
        'user_id': _userId,
        'answer': answer,
      }, onConflict: 'icebreaker_id,user_id');

      // Update streak and get new value
      final streakResult = await _client.rpc(
        'update_icebreaker_streak',
        params: {
          'p_event_id': eventId,
          'p_user_id': _userId,
        },
      );

      logInfo('Submitted icebreaker answer for: $icebreakerId');
      return streakResult as int? ?? 1;
    }, operationName: 'submitIcebreakerAnswer');
  }

  @override
  Future<Result<int>> getUserIcebreakerStreak(String eventId) async {
    if (_userId == null) {
      return const Success(0);
    }

    return execute(() async {
      final response = await _client
          .from('event_icebreaker_streaks')
          .select('current_streak')
          .eq('event_id', eventId)
          .eq('user_id', _userId!)
          .maybeSingle();

      return response?['current_streak'] as int? ?? 0;
    }, operationName: 'getUserIcebreakerStreak');
  }

  // ========== Materials Operations ==========

  @override
  Future<Result<List<SessionMaterial>>> getSessionMaterials(String sessionId) async {
    return execute(() async {
      final response = await _client
          .from('session_materials')
          .select()
          .eq('session_id', sessionId)
          .order('sort_order');

      final materials = (response as List)
          .map((j) => SessionMaterial.fromJson(j as Map<String, dynamic>))
          .toList();

      logDbOperation('SELECT', 'session_materials', rowCount: materials.length);
      return materials;
    }, operationName: 'getSessionMaterials');
  }

  @override
  Future<Result<List<SessionMaterial>>> getEventMaterials(String eventId) async {
    return execute(() async {
      final response = await _client
          .from('session_materials')
          .select()
          .eq('event_id', eventId)
          .order('created_at', ascending: false)
          .limit(100);

      final materials = (response as List)
          .map((j) => SessionMaterial.fromJson(j as Map<String, dynamic>))
          .toList();

      logDbOperation('SELECT', 'session_materials', rowCount: materials.length);
      return materials;
    }, operationName: 'getEventMaterials');
  }

  @override
  Future<Result<void>> trackMaterialDownload(String materialId, {String? eventId, String? sessionId}) async {
    return execute(() async {
      // Use edge function for rich analytics if event context is available
      if (eventId != null) {
        try {
          await _client.functions.invoke('track-material-download', body: {
            'material_id': materialId,
            'event_id': eventId,
            'session_id': sessionId,
          });
          logInfo('Tracked download via edge function for material: $materialId');
          return;
        } catch (e) {
          // Fall back to RPC if edge function fails
          logWarning('Edge function failed, falling back to RPC: $e');
        }
      }
      
      // Fallback to simple RPC counter
      await _client.rpc('increment_material_download', params: {
        'p_material_id': materialId,
      });
      logInfo('Tracked download for material: $materialId');
    }, operationName: 'trackMaterialDownload');
  }

  @override
  Future<Result<String>> createMaterial({
    required String sessionId,
    required String eventId,
    required String title,
    String? description,
    required String fileUrl,
    required String fileType,
    int? fileSizeBytes,
    bool isDownloadable = true,
  }) async {
    return execute(() async {
      final response = await _client.from('session_materials').insert({
        'session_id': sessionId,
        'event_id': eventId,
        'title': title,
        'description': description,
        'file_url': fileUrl,
        'file_type': fileType,
        'file_size_bytes': fileSizeBytes,
        'is_downloadable': isDownloadable,
      }).select('id').single();

      logInfo('Created material: $title for session: $sessionId');
      return response['id'] as String;
    }, operationName: 'createMaterial');
  }

  @override
  Future<Result<bool>> deleteMaterial(String materialId) async {
    return execute(() async {
      await _client.from('session_materials').delete().eq('id', materialId);
      logInfo('Deleted material: $materialId');
      return true;
    }, operationName: 'deleteMaterial');
  }

  // ========== Gamification Operations ==========

  @override
  Future<Result<int>> awardPoints({
    required String eventId,
    required ZoneActivityType activityType,
    int? customPoints,
    Map<String, dynamic>? metadata,
  }) async {
    if (_userId == null) return const Failure('Please sign in');
    return execute(() async {
      final points = customPoints ?? activityType.defaultPoints;
      final result = await _client.rpc('award_zone_points', params: {
        'p_user_id': _userId,
        'p_event_id': eventId,
        'p_activity_type': activityType.dbValue,
        'p_points': points,
        'p_metadata': metadata ?? {},
      });
      return result as int;
    }, operationName: 'awardPoints');
  }

  @override
  Future<Result<List<ZoneLeaderboardEntry>>> getLeaderboard(String eventId, {int limit = 50}) async {
    return execute(() async {
      final response = await _client
          .from('zone_leaderboard')
          .select('*, impact_profiles(full_name, avatar_url)')
          .eq('event_id', eventId)
          .order('total_points', ascending: false)
          .limit(limit);
      return (response as List).map((j) => ZoneLeaderboardEntry.fromJson(j)).toList();
    }, operationName: 'getLeaderboard');
  }

  @override
  Future<Result<ZoneLeaderboardEntry?>> getUserLeaderboardEntry(String eventId) async {
    if (_userId == null) return const Failure('Please sign in');
    return execute(() async {
      final response = await _client
          .from('zone_leaderboard')
          .select('*, impact_profiles(full_name, avatar_url)')
          .eq('event_id', eventId)
          .eq('user_id', _userId!)
          .maybeSingle();
      return response != null ? ZoneLeaderboardEntry.fromJson(response) : null;
    }, operationName: 'getUserLeaderboardEntry');
  }

  @override
  Future<Result<List<ZoneBadge>>> getAllBadges() async {
    return execute(() async {
      final response = await _client.from('zone_badges').select().order('name');
      return (response as List).map((j) => ZoneBadge.fromJson(j)).toList();
    }, operationName: 'getAllBadges');
  }

  @override
  Future<Result<List<ZoneUserBadge>>> getUserBadges(String eventId) async {
    if (_userId == null) return const Failure('Please sign in');
    return execute(() async {
      final response = await _client
          .from('zone_user_badges')
          .select('*, zone_badges(*)')
          .eq('event_id', eventId)
          .eq('user_id', _userId!)
          .order('earned_at', ascending: false);
      return (response as List).map((j) => ZoneUserBadge.fromJson(j)).toList();
    }, operationName: 'getUserBadges');
  }

  @override
  Future<Result<List<ZoneBadge>>> checkAndAwardBadges(String eventId) async {
    if (_userId == null) return const Failure('Please sign in');
    return execute(() async {
      final response = await _client.rpc('check_zone_badges', params: {
        'p_user_id': _userId,
        'p_event_id': eventId,
      });
      return (response as List).map((j) => ZoneBadge.fromJson(j)).toList();
    }, operationName: 'checkAndAwardBadges');
  }

  @override
  Future<Result<List<ZonePointActivity>>> getPointHistory(String eventId, {int limit = 50}) async {
    if (_userId == null) return const Failure('Please sign in');
    return execute(() async {
      final response = await _client
          .from('zone_point_activities')
          .select()
          .eq('event_id', eventId)
          .eq('user_id', _userId!)
          .order('created_at', ascending: false)
          .limit(limit);
      return (response as List).map((j) => ZonePointActivity.fromJson(j)).toList();
    }, operationName: 'getPointHistory');
  }

  // ========== Zone Notification Operations ==========

  @override
  Future<Result<List<ZoneNotification>>> getZoneNotifications(String eventId, {int limit = 50}) async {
    if (_userId == null) return const Failure('Please sign in');
    return execute(() async {
      final response = await _client
          .from('zone_notifications')
          .select()
          .eq('event_id', eventId)
          .eq('user_id', _userId!)
          .order('created_at', ascending: false)
          .limit(limit);
      return (response as List).map((j) => ZoneNotification.fromJson(j)).toList();
    }, operationName: 'getZoneNotifications');
  }

  @override
  Future<Result<int>> getZoneNotificationUnreadCount(String eventId) async {
    if (_userId == null) return const Failure('Please sign in');
    return execute(() async {
      final response = await _client
          .from('zone_notifications')
          .select('id')
          .eq('event_id', eventId)
          .eq('user_id', _userId!)
          .eq('read', false);
      return (response as List).length;
    }, operationName: 'getZoneNotificationUnreadCount');
  }

  @override
  Future<Result<void>> markZoneNotificationRead(String notificationId) async {
    return execute(() async {
      await _client.from('zone_notifications').update({'read': true}).eq('id', notificationId);
    }, operationName: 'markZoneNotificationRead');
  }

  @override
  Future<Result<void>> markAllZoneNotificationsRead(String eventId) async {
    if (_userId == null) return const Failure('Please sign in');
    return execute(() async {
      await _client.from('zone_notifications').update({'read': true})
          .eq('event_id', eventId).eq('user_id', _userId!);
    }, operationName: 'markAllZoneNotificationsRead');
  }

  @override
  Future<Result<ZoneNotificationPreferences?>> getZoneNotificationPreferences(String eventId) async {
    if (_userId == null) return const Failure('Please sign in');
    return execute(() async {
      final response = await _client
          .from('zone_notification_preferences')
          .select()
          .eq('event_id', eventId)
          .eq('user_id', _userId!)
          .maybeSingle();
      return response != null ? ZoneNotificationPreferences.fromJson(response) : null;
    }, operationName: 'getZoneNotificationPreferences');
  }

  @override
  Future<Result<void>> updateZoneNotificationPreferences(ZoneNotificationPreferences preferences) async {
    return execute(() async {
      await _client.from('zone_notification_preferences').upsert(
        preferences.toJson(),
        onConflict: 'user_id,event_id',
      );
    }, operationName: 'updateZoneNotificationPreferences');
  }

  @override
  Future<Result<void>> createZoneNotification({
    required String eventId,
    required ZoneNotificationType type,
    required String title,
    required String body,
    Map<String, dynamic>? data,
  }) async {
    if (_userId == null) return const Failure('Please sign in');
    return execute(() async {
      await _client.from('zone_notifications').insert({
        'user_id': _userId,
        'event_id': eventId,
        'type': type.dbValue,
        'title': title,
        'body': body,
        'data': data ?? {},
      });
    }, operationName: 'createZoneNotification');
  }

  // ========== Q&A Operations ==========

  @override
  Future<Result<List<SessionQuestion>>> getSessionQuestions(
    String sessionId, {
    bool includeAll = false,
  }) async {
    return execute(() async {
      var baseQuery = _client
          .from('session_questions')
          .select('*, impact_profiles(full_name, avatar_url)')
          .eq('session_id', sessionId);

      // Apply filter before transforms
      final filteredQuery = !includeAll 
          ? baseQuery.or('status.in.(approved,answered),user_id.eq.$_userId')
          : baseQuery;

      final response = await filteredQuery
          .order('upvote_count', ascending: false)
          .order('created_at', ascending: false)
          .limit(100);

      // Get user's upvotes for these questions
      final questionIds = (response as List)
          .map((q) => q['id'] as String)
          .toList();

      Set<String> upvotedIds = {};
      if (_userId != null && questionIds.isNotEmpty) {
        final upvotesResponse = await _client
            .from('session_question_upvotes')
            .select('question_id')
            .eq('user_id', _userId!)
            .filter('question_id', 'in', questionIds);
        upvotedIds = (upvotesResponse as List)
            .map((u) => u['question_id'] as String)
            .toSet();
      }

      final questions = response.map((json) {
        return SessionQuestion.fromJson(
          json as Map<String, dynamic>,
          hasUpvoted: upvotedIds.contains(json['id']),
        );
      }).toList();

      logDbOperation('SELECT', 'session_questions', rowCount: questions.length);
      return questions;
    }, operationName: 'getSessionQuestions');
  }

  @override
  Future<Result<String>> submitQuestion({
    required String sessionId,
    required String eventId,
    required String questionText,
    bool isAnonymous = false,
  }) async {
    if (_userId == null) return const Failure('Please sign in to ask a question');

    return execute(() async {
      final response = await _client.from('session_questions').insert({
        'session_id': sessionId,
        'event_id': eventId,
        'user_id': _userId,
        'question_text': questionText,
        'is_anonymous': isAnonymous,
        'status': 'pending',
      }).select('id').single();

      logInfo('Submitted question for session: $sessionId');
      return response['id'] as String;
    }, operationName: 'submitQuestion');
  }

  @override
  Future<Result<bool>> toggleQuestionUpvote(String questionId) async {
    if (_userId == null) return const Failure('Please sign in to upvote');

    return execute(() async {
      // Check if already upvoted
      final existing = await _client
          .from('session_question_upvotes')
          .select('question_id')
          .eq('question_id', questionId)
          .eq('user_id', _userId!)
          .maybeSingle();

      if (existing != null) {
        // Remove upvote
        await _client
            .from('session_question_upvotes')
            .delete()
            .eq('question_id', questionId)
            .eq('user_id', _userId!);
        logInfo('Removed upvote from question: $questionId');
        return false;
      } else {
        // Add upvote
        await _client.from('session_question_upvotes').insert({
          'question_id': questionId,
          'user_id': _userId,
        });
        logInfo('Added upvote to question: $questionId');
        return true;
      }
    }, operationName: 'toggleQuestionUpvote');
  }

  @override
  Future<Result<bool>> updateQuestionStatus(
    String questionId,
    QuestionStatus status, {
    String? answerText,
  }) async {
    return execute(() async {
      final updates = <String, dynamic>{
        'status': status.value,
      };
      if (answerText != null) {
        updates['answer_text'] = answerText;
        updates['answered_at'] = DateTime.now().toIso8601String();
        updates['answered_by'] = _userId;
      }

      await _client.from('session_questions').update(updates).eq('id', questionId);
      logInfo('Updated question status: $questionId -> ${status.value}');
      return true;
    }, operationName: 'updateQuestionStatus');
  }

  @override
  Future<Result<bool>> deleteQuestion(String questionId) async {
    return execute(() async {
      await _client.from('session_questions').delete().eq('id', questionId);
      logInfo('Deleted question: $questionId');
      return true;
    }, operationName: 'deleteQuestion');
  }

  // ========== Session Bookmark Operations ==========

  @override
  Future<Result<List<SessionBookmark>>> getSessionBookmarks(String eventId) async {
    if (_userId == null) return const Failure('Please sign in to view bookmarks');

    return execute(() async {
      final response = await _client
          .from('session_bookmarks')
          .select()
          .eq('event_id', eventId)
          .eq('user_id', _userId!)
          .order('created_at', ascending: false);

      final bookmarks = (response as List)
          .map((json) => SessionBookmark.fromJson(json as Map<String, dynamic>))
          .toList();

      logDbOperation('SELECT', 'session_bookmarks', rowCount: bookmarks.length);
      return bookmarks;
    }, operationName: 'getSessionBookmarks');
  }

  @override
  Future<Result<String>> bookmarkSession({
    required String sessionId,
    required String eventId,
    int? reminderMinutesBefore,
  }) async {
    if (_userId == null) return const Failure('Please sign in to bookmark');

    return execute(() async {
      final response = await _client.from('session_bookmarks').insert({
        'session_id': sessionId,
        'event_id': eventId,
        'user_id': _userId,
        'reminder_minutes_before': reminderMinutesBefore ?? 15,
      }).select('id').single();

      logInfo('Bookmarked session: $sessionId');
      return response['id'] as String;
    }, operationName: 'bookmarkSession');
  }

  @override
  Future<Result<bool>> removeBookmark(String sessionId) async {
    if (_userId == null) return const Failure('Please sign in');

    return execute(() async {
      await _client
          .from('session_bookmarks')
          .delete()
          .eq('session_id', sessionId)
          .eq('user_id', _userId!);

      logInfo('Removed bookmark from session: $sessionId');
      return true;
    }, operationName: 'removeBookmark');
  }

  @override
  Future<Result<bool>> isSessionBookmarked(String sessionId) async {
    if (_userId == null) return const Success(false);

    return execute(() async {
      final response = await _client
          .from('session_bookmarks')
          .select('id')
          .eq('session_id', sessionId)
          .eq('user_id', _userId!)
          .maybeSingle();

      return response != null;
    }, operationName: 'isSessionBookmarked');
  }

  // ========== Sponsor Booth Operations ==========

  @override
  Future<Result<List<SponsorBooth>>> getSponsorBooths(String eventId) async {
    return execute(() async {
      final response = await _client
          .from('sponsor_booths')
          .select()
          .eq('event_id', eventId)
          .eq('is_active', true)
          .order('tier');

      // Get user's visits to mark booths
      final Set<String> visitedBoothIds = {};
      if (_userId != null) {
        final visits = await _client
            .from('booth_visits')
            .select('booth_id')
            .eq('user_id', _userId!);

        for (final v in visits as List) {
          visitedBoothIds.add(v['booth_id'] as String);
        }
      }

      final booths = (response as List)
          .map((json) => SponsorBooth.fromJson(
                json as Map<String, dynamic>,
                hasVisited: visitedBoothIds.contains(json['id']),
              ))
          .toList();

      // Sort by tier order
      booths.sort((a, b) => a.tierOrder.compareTo(b.tierOrder));

      logDbOperation('SELECT', 'sponsor_booths', rowCount: booths.length);
      return booths;
    }, operationName: 'getSponsorBooths');
  }

  @override
  Future<Result<bool>> visitBooth(String boothId, String eventId) async {
    if (_userId == null) return const Failure('Please sign in to visit booth');

    return execute(() async {
      // Check if already visited
      final existing = await _client
          .from('booth_visits')
          .select('id')
          .eq('booth_id', boothId)
          .eq('user_id', _userId!)
          .maybeSingle();

      if (existing != null) {
        return true; // Already visited
      }

      // Record visit
      await _client.from('booth_visits').insert({
        'booth_id': boothId,
        'user_id': _userId,
      });

      // Increment visit count
      await _client.rpc('increment_booth_visit_count', params: {'p_booth_id': boothId});

      // Award points for booth visit
      await awardPoints(
        eventId: eventId,
        activityType: ZoneActivityType.boothVisit,
        metadata: {'booth_id': boothId},
      );

      logInfo('Recorded booth visit: $boothId');
      return true;
    }, operationName: 'visitBooth');
  }

  @override
  Future<Result<bool>> hasVisitedBooth(String boothId) async {
    if (_userId == null) return const Success(false);

    return execute(() async {
      final response = await _client
          .from('booth_visits')
          .select('id')
          .eq('booth_id', boothId)
          .eq('user_id', _userId!)
          .maybeSingle();

      return response != null;
    }, operationName: 'hasVisitedBooth');
  }

  // ========== Zone Challenge Operations ==========

  @override
  Future<Result<List<ZoneChallenge>>> getActiveChallenges(String eventId) async {
    return execute(() async {
      final now = DateTime.now().toIso8601String();

      final response = await _client
          .from('zone_challenges')
          .select()
          .eq('event_id', eventId)
          .eq('is_active', true)
          .or('starts_at.is.null,starts_at.lte.$now')
          .or('ends_at.is.null,ends_at.gte.$now')
          .order('points_reward', ascending: false);

      // Get user's completions
      final Set<String> completedIds = {};
      if (_userId != null) {
        final completions = await _client
            .from('zone_challenge_completions')
            .select('challenge_id')
            .eq('user_id', _userId!)
            .eq('event_id', eventId);

        for (final c in completions as List) {
          completedIds.add(c['challenge_id'] as String);
        }
      }

      final challenges = (response as List)
          .map((json) => ZoneChallenge.fromJson(
                json as Map<String, dynamic>,
                isCompleted: completedIds.contains(json['id']),
              ))
          .toList();

      logDbOperation('SELECT', 'zone_challenges', rowCount: challenges.length);
      return challenges;
    }, operationName: 'getActiveChallenges');
  }

  @override
  Future<Result<List<ZoneChallengeCompletion>>> getUserChallengeCompletions(String eventId) async {
    if (_userId == null) return const Failure('Please sign in');

    return execute(() async {
      final response = await _client
          .from('zone_challenge_completions')
          .select()
          .eq('event_id', eventId)
          .eq('user_id', _userId!)
          .order('completed_at', ascending: false);

      final completions = (response as List)
          .map((json) => ZoneChallengeCompletion.fromJson(json as Map<String, dynamic>))
          .toList();

      logDbOperation('SELECT', 'zone_challenge_completions', rowCount: completions.length);
      return completions;
    }, operationName: 'getUserChallengeCompletions');
  }

  @override
  Future<Result<int>> completeChallenge({
    required String challengeId,
    required String eventId,
    Map<String, dynamic>? proofData,
  }) async {
    if (_userId == null) return const Failure('Please sign in');

    return execute(() async {
      // Get challenge to know point reward
      final challengeResponse = await _client
          .from('zone_challenges')
          .select('points_reward')
          .eq('id', challengeId)
          .single();

      final pointsReward = challengeResponse['points_reward'] as int? ?? 10;

      // Record completion
      await _client.from('zone_challenge_completions').insert({
        'challenge_id': challengeId,
        'event_id': eventId,
        'user_id': _userId,
        'proof_data': proofData,
        'points_awarded': pointsReward,
      });

      // Award points
      await awardPoints(
        eventId: eventId,
        activityType: ZoneActivityType.challengeComplete,
        customPoints: pointsReward,
        metadata: {'challenge_id': challengeId},
      );

      logInfo('Completed challenge: $challengeId for $pointsReward points');
      return pointsReward;
    }, operationName: 'completeChallenge');
  }

  // ========== Activity Feed Operations ==========

  @override
  Future<Result<List<ZoneActivity>>> getRecentActivities(
    String eventId, {
    int limit = 20,
  }) async {
    return execute(() async {
      final response = await _client
          .from('zone_activity_feed')
          .select()
          .eq('event_id', eventId)
          .eq('is_public', true)
          .order('created_at', ascending: false)
          .limit(limit);

      final activities = (response as List)
          .map((json) => ZoneActivity.fromJson(json as Map<String, dynamic>))
          .toList();

      logDbOperation('SELECT', 'zone_activity_feed', rowCount: activities.length);
      return activities;
    }, operationName: 'getRecentActivities');
  }
}
