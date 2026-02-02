import 'package:supabase_flutter/supabase_flutter.dart';
export 'package:supabase_flutter/supabase_flutter.dart' show SupabaseClient, Supabase;
import 'package:thittam1hub/models/zone_models.dart';
import 'package:thittam1hub/models/zone_team_member.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/utils/result.dart';

/// Service for Zone tab - Event day activities
/// 
/// Extends BaseService for standardized logging, error handling, and Result types.
class ZoneService extends BaseService {
  static ZoneService? _instance;
  static ZoneService get instance => _instance ??= ZoneService._();
  ZoneService._();

  @override
  String get tag => 'ZoneService';

  final SupabaseClient _client = Supabase.instance.client;

  String? get _userId => _client.auth.currentUser?.id;

  // ==================== Static Helpers ====================
  
  /// Static convenience method for getting today's events (unwraps Result internally)
  static Future<List<ZoneEvent>> fetchTodayEvents() async {
    final result = await instance.getTodayEvents();
    return result.isSuccess ? result.data : <ZoneEvent>[];
  }

  /// Static convenience method for getting current event (unwraps Result internally)
  static Future<ZoneEvent?> fetchCurrentEvent() async {
    final result = await instance.getCurrentEvent();
    return result.isSuccess ? result.data : null;
  }

  // ==================== Event Management ====================

  /// Get events happening today that the user is registered for
  Future<Result<List<ZoneEvent>>> getTodayEvents() => execute(() async {
    if (_userId == null) return <ZoneEvent>[];

    final now = DateTime.now();
    final startOfDay = DateTime(now.year, now.month, now.day);
    final endOfDay = startOfDay.add(const Duration(days: 1));

    // Get events the user is registered for that are happening today
    final response = await _client
        .from('events')
        .select('id, name, description, start_date, end_date, category, venue, branding')
        .gte('end_date', startOfDay.toIso8601String())
        .lte('start_date', endOfDay.toIso8601String())
        .eq('status', 'PUBLISHED')
        .order('start_date');

    logDbOperation('SELECT', 'events', rowCount: (response as List).length);

    final events = <ZoneEvent>[];
    for (final json in response) {
      // Check if user is checked in
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

    return events;
  }, operationName: 'getTodayEvents');

  /// Get current active event (user is checked in)
  Future<Result<ZoneEvent?>> getCurrentEvent() => execute(() async {
    if (_userId == null) return null;

    // Find active check-in
    final checkinResponse = await _client
        .from('event_checkins')
        .select('event_id, events(id, name, description, start_date, end_date, category, venue, branding)')
        .eq('user_id', _userId!)
        .isFilter('checkout_time', null)
        .order('checkin_time', ascending: false)
        .limit(1)
        .maybeSingle();

    if (checkinResponse == null) return null;

    final eventData = checkinResponse['events'] as Map<String, dynamic>?;
    if (eventData == null) return null;

    logDbOperation('SELECT', 'event_checkins');
    return ZoneEvent.fromJson(eventData, isCheckedIn: true);
  }, operationName: 'getCurrentEvent');

  /// Check in to an event (uses UPSERT to handle re-checking-in on same day)
  Future<Result<bool>> checkIn(String eventId, {String? location}) => execute(() async {
    if (_userId == null) return false;

    final today = DateTime.now();
    final checkinDate = DateTime(today.year, today.month, today.day);
    final checkinDateStr = checkinDate.toIso8601String().split('T')[0];

    // Check if user already has a check-in for today
    final existing = await _client
        .from('event_checkins')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', _userId!)
        .eq('checkin_date', checkinDateStr)
        .maybeSingle();

    if (existing != null) {
      // Re-activate existing check-in (clear checkout_time)
      await _client
          .from('event_checkins')
          .update({
            'checkout_time': null,
            'checkin_time': DateTime.now().toIso8601String(),
            'location': location,
          })
          .eq('id', existing['id']);
      logDbOperation('UPDATE', 'event_checkins');
    } else {
      // Insert new check-in record
      await _client.from('event_checkins').insert({
        'user_id': _userId,
        'event_id': eventId,
        'checkin_date': checkinDateStr,
        'checkin_time': DateTime.now().toIso8601String(),
        'location': location,
      });
      logDbOperation('INSERT', 'event_checkins');
    }
    return true;
  }, operationName: 'checkIn');

  /// Check out from an event
  Future<Result<bool>> checkOut(String eventId) => execute(() async {
    if (_userId == null) return false;

    await _client
        .from('event_checkins')
        .update({'checkout_time': DateTime.now().toIso8601String()})
        .eq('event_id', eventId)
        .eq('user_id', _userId!)
        .isFilter('checkout_time', null);
    
    logDbOperation('UPDATE', 'event_checkins');
    return true;
  }, operationName: 'checkOut');

  // ========== Session Management ==========

  /// Get live sessions for an event
  Future<Result<List<EventSession>>> getLiveSessions(String eventId) => execute(() async {
    final now = DateTime.now();
    final response = await _client
        .from('event_sessions')
        .select()
        .eq('event_id', eventId)
        .lte('start_time', now.toIso8601String())
        .gte('end_time', now.toIso8601String())
        .order('start_time');

    logDbOperation('SELECT', 'event_sessions', rowCount: (response as List).length);
    
    return response
        .map((json) => EventSession.fromJson(json as Map<String, dynamic>)
          ..copyWith(status: 'live'))
        .toList();
  }, operationName: 'getLiveSessions');

  /// Get upcoming sessions for an event
  Future<Result<List<EventSession>>> getUpcomingSessions(String eventId, {int limit = 5}) => execute(() async {
    final now = DateTime.now();
    final response = await _client
        .from('event_sessions')
        .select()
        .eq('event_id', eventId)
        .gt('start_time', now.toIso8601String())
        .order('start_time')
        .limit(limit);

    logDbOperation('SELECT', 'event_sessions', rowCount: (response as List).length);
    
    return response
        .map((json) => EventSession.fromJson(json as Map<String, dynamic>))
        .toList();
  }, operationName: 'getUpcomingSessions');

  /// Get all sessions for an event (for management)
  Future<Result<List<EventSession>>> getAllSessions(String eventId) => execute(() async {
    final response = await _client
        .from('event_sessions')
        .select()
        .eq('event_id', eventId)
        .order('start_time');

    logDbOperation('SELECT', 'event_sessions', rowCount: (response as List).length);
    
    return (response as List)
        .map((json) => EventSession.fromJson(json as Map<String, dynamic>))
        .toList();
  }, operationName: 'getAllSessions');

  /// Create a new session
  Future<Result<String?>> createSession({
    required String eventId,
    required String title,
    String? description,
    String? speakerName,
    String? speakerAvatar,
    String? room,
    required DateTime startTime,
    required DateTime endTime,
    List<String>? tags,
  }) => execute(() async {
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

    logDbOperation('INSERT', 'event_sessions');
    return response['id'] as String?;
  }, operationName: 'createSession');

  /// Update a session
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
  }) => execute(() async {
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
    logDbOperation('UPDATE', 'event_sessions');
    return true;
  }, operationName: 'updateSession');

  /// Delete a session
  Future<Result<bool>> deleteSession(String sessionId) => execute(() async {
    await _client.from('event_sessions').delete().eq('id', sessionId);
    logDbOperation('DELETE', 'event_sessions');
    return true;
  }, operationName: 'deleteSession');

  // ========== Attendee Management ==========

  /// Get nearby attendees at the same event
  Future<Result<List<AttendeeRadar>>> getNearbyAttendees(String eventId, {int limit = 12}) => execute(() async {
    if (_userId == null) return <AttendeeRadar>[];

    // Get other users checked in to the same event
    final response = await _client
        .from('event_checkins')
        .select('user_id, impact_profiles(id, user_id, full_name, avatar_url, headline, is_online)')
        .eq('event_id', eventId)
        .neq('user_id', _userId!)
        .isFilter('checkout_time', null)
        .limit(limit);

    logDbOperation('SELECT', 'event_checkins', rowCount: (response as List).length);

    final attendees = <AttendeeRadar>[];
    for (final json in response) {
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

    return attendees;
  }, operationName: 'getNearbyAttendees');

  // ========== Poll Management ==========

  /// Get active polls for an event
  Future<Result<List<EventPoll>>> getActivePolls(String eventId) => execute(() async {
    final response = await _client
        .from('event_polls')
        .select('*, event_poll_options(*)')
        .eq('event_id', eventId)
        .eq('is_active', true)
        .order('created_at', ascending: false);

    logDbOperation('SELECT', 'event_polls', rowCount: (response as List).length);

    final polls = <EventPoll>[];
    for (final json in response) {
      final options = (json['event_poll_options'] as List<dynamic>?)
          ?.map((o) => PollOption(
                id: o['id'] as String,
                text: o['text'] as String,
                voteCount: o['vote_count'] as int? ?? 0,
              ))
          .toList() ?? [];

      // Check if user has voted
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
  }, operationName: 'getActivePolls');

  /// Get all polls for an event (including inactive)
  Future<Result<List<EventPoll>>> getAllPolls(String eventId) => execute(() async {
    final response = await _client
        .from('event_polls')
        .select('*, event_poll_options(*)')
        .eq('event_id', eventId)
        .order('created_at', ascending: false);

    logDbOperation('SELECT', 'event_polls', rowCount: (response as List).length);

    final polls = <EventPoll>[];
    for (final json in response) {
      final options = (json['event_poll_options'] as List<dynamic>?)
          ?.map((o) => PollOption(
                id: o['id'] as String,
                text: o['text'] as String,
                voteCount: o['vote_count'] as int? ?? 0,
              ))
          .toList() ?? [];

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
        userVote: null,
      ));
    }

    return polls;
  }, operationName: 'getAllPolls');

  /// Submit a vote for a poll
  Future<Result<bool>> submitPollVote(String pollId, String optionId) => execute(() async {
    if (_userId == null) return false;

    await _client.from('event_poll_votes').upsert({
      'poll_id': pollId,
      'option_id': optionId,
      'user_id': _userId,
      'voted_at': DateTime.now().toIso8601String(),
    }, onConflict: 'poll_id,user_id');

    // Increment vote count
    await _client.rpc('increment_poll_vote', params: {'option_id': optionId});

    logDbOperation('UPSERT', 'event_poll_votes');
    return true;
  }, operationName: 'submitPollVote');

  /// Create a new poll
  Future<Result<String?>> createPoll({
    required String eventId,
    required String question,
    required List<String> options,
    DateTime? expiresAt,
  }) => execute(() async {
    // Create poll
    final pollResponse = await _client.from('event_polls').insert({
      'event_id': eventId,
      'question': question,
      'is_active': true,
      'expires_at': expiresAt?.toIso8601String(),
      'created_by': _userId,
    }).select('id').single();

    final pollId = pollResponse['id'] as String;

    // Create options
    for (final optionText in options) {
      await _client.from('event_poll_options').insert({
        'poll_id': pollId,
        'text': optionText,
        'vote_count': 0,
      });
    }

    logDbOperation('INSERT', 'event_polls');
    return pollId;
  }, operationName: 'createPoll');

  /// Close a poll (set inactive)
  Future<Result<bool>> closePoll(String pollId) => execute(() async {
    await _client.from('event_polls').update({'is_active': false}).eq('id', pollId);
    logDbOperation('UPDATE', 'event_polls');
    return true;
  }, operationName: 'closePoll');

  /// Delete a poll
  Future<Result<bool>> deletePoll(String pollId) => execute(() async {
    // Delete options first
    await _client.from('event_poll_options').delete().eq('poll_id', pollId);
    // Delete votes
    await _client.from('event_poll_votes').delete().eq('poll_id', pollId);
    // Delete poll
    await _client.from('event_polls').delete().eq('id', pollId);
    logDbOperation('DELETE', 'event_polls');
    return true;
  }, operationName: 'deletePoll');

  // ========== Announcement Management ==========

  /// Get announcements for an event
  Future<Result<List<EventAnnouncement>>> getAnnouncements(String eventId, {int limit = 10}) => execute(() async {
    final response = await _client
        .from('event_announcements')
        .select()
        .eq('event_id', eventId)
        .order('is_pinned', ascending: false)
        .order('created_at', ascending: false)
        .limit(limit);

    logDbOperation('SELECT', 'event_announcements', rowCount: (response as List).length);

    return response
        .map((json) => EventAnnouncement.fromJson(json as Map<String, dynamic>))
        .toList();
  }, operationName: 'getAnnouncements');

  /// Get all announcements for an event (for management)
  Future<Result<List<EventAnnouncement>>> getAllAnnouncements(String eventId) => execute(() async {
    final response = await _client
        .from('event_announcements')
        .select()
        .eq('event_id', eventId)
        .order('created_at', ascending: false);

    logDbOperation('SELECT', 'event_announcements', rowCount: (response as List).length);

    return (response as List)
        .map((json) => EventAnnouncement.fromJson(json as Map<String, dynamic>))
        .toList();
  }, operationName: 'getAllAnnouncements');

  /// Create an announcement
  Future<Result<String?>> createAnnouncement({
    required String eventId,
    required String title,
    required String content,
    String type = 'info',
    bool isPinned = false,
  }) => execute(() async {
    // Get current user profile for author info
    String? authorName;
    String? authorAvatar;
    if (_userId != null) {
      final profile = await _client
          .from('impact_profiles')
          .select('full_name, avatar_url')
          .eq('user_id', _userId!)
          .maybeSingle();
      if (profile != null) {
        authorName = profile['full_name'] as String?;
        authorAvatar = profile['avatar_url'] as String?;
      }
    }

    final response = await _client.from('event_announcements').insert({
      'event_id': eventId,
      'title': title,
      'content': content,
      'type': type,
      'is_pinned': isPinned,
      'author_id': _userId,
      'author_name': authorName,
      'author_avatar': authorAvatar,
    }).select('id').single();

    logDbOperation('INSERT', 'event_announcements');
    return response['id'] as String?;
  }, operationName: 'createAnnouncement');

  /// Toggle announcement pin status
  Future<Result<bool>> toggleAnnouncementPin(String announcementId, bool isPinned) => execute(() async {
    await _client.from('event_announcements').update({'is_pinned': isPinned}).eq('id', announcementId);
    logDbOperation('UPDATE', 'event_announcements');
    return true;
  }, operationName: 'toggleAnnouncementPin');

  /// Delete an announcement
  Future<Result<bool>> deleteAnnouncement(String announcementId) => execute(() async {
    await _client.from('event_announcements').delete().eq('id', announcementId);
    logDbOperation('DELETE', 'event_announcements');
    return true;
  }, operationName: 'deleteAnnouncement');

  // ========== Stats & Counts ==========

  /// Get count of attendees at an event
  Future<Result<int>> getAttendeeCount(String eventId) => execute(() async {
    final response = await _client
        .from('event_checkins')
        .select('id')
        .eq('event_id', eventId)
        .isFilter('checkout_time', null);

    logDbOperation('SELECT', 'event_checkins', rowCount: (response as List).length);
    return response.length;
  }, operationName: 'getAttendeeCount');

  // ========== Permission Check ==========

  /// Check if current user can manage Zone content for an event
  /// Uses server-side RPC for security and efficiency
  Future<Result<bool>> canManageZone(String eventId) => execute(() async {
    if (_userId == null) return false;

    final result = await _client.rpc(
      'can_manage_zone_content',
      params: {'p_event_id': eventId},
    );
    return result == true;
  }, operationName: 'canManageZone');

  // ========== Team Management (Read-Only) ==========

  /// Get team members who have Zone management access for an event
  /// Returns members grouped by workspace with their roles
  Future<Result<List<ZoneTeamMember>>> getZoneTeamMembers(String eventId) => execute(() async {
    final data = await _client.rpc(
      'get_zone_team_members',
      params: {'p_event_id': eventId},
    );
    
    logDbOperation('RPC', 'get_zone_team_members', rowCount: (data as List).length);
    
    return (data as List)
        .map((j) => ZoneTeamMember.fromJson(j as Map<String, dynamic>))
        .toList();
  }, operationName: 'getZoneTeamMembers');
}

extension on EventSession {
  EventSession copyWith({String? status}) {
    return EventSession(
      id: id,
      eventId: eventId,
      title: title,
      description: description,
      speakerName: speakerName,
      speakerAvatar: speakerAvatar,
      room: room,
      startTime: startTime,
      endTime: endTime,
      status: status ?? this.status,
      attendeeCount: attendeeCount,
      streamUrl: streamUrl,
      tags: tags,
    );
  }
}
