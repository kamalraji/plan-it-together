import 'package:supabase_flutter/supabase_flutter.dart';
export 'package:supabase_flutter/supabase_flutter.dart' show SupabaseClient, Supabase;
import '../models/networking_models.dart';
import '../models/impact_profile.dart';
import '../models/match_insight.dart';
import 'impact_service.dart';

import 'package:thittam1hub/services/logging_service.dart';
/// Service for networking zone features: smart matching, icebreakers, meetings, contact exchange
class NetworkingService {
  // Logging
   static final _log = LoggingService.instance;
   static const String _tag = 'NetworkingService';

  final SupabaseClient _supabase = Supabase.instance.client;
  final ImpactService _impactService = ImpactService();

  String? get _currentUserId => _supabase.auth.currentUser?.id;

  // ============== SMART MATCHING (AI-POWERED) ==============

  /// Get AI-powered smart matches for the current user
  /// Uses the new get_ai_matches_v2 RPC with multi-signal score fusion
  /// [context] - 'pulse' for universal matching, 'zone' for event-scoped
  Future<List<SmartMatch>> getSmartMatches(
    String? eventId, {
    int limit = 20,
    int offset = 0,
    String context = 'pulse',
  }) async {
    final userId = _currentUserId;
    if (userId == null) return [];

    try {
      // Use the new AI matching RPC
      final results = await _supabase.rpc(
        'get_ai_matches_v2',
        params: {
          'p_user_id': userId,
          'p_event_id': eventId,
          'p_context': context,
          'p_limit': limit,
          'p_offset': offset,
        },
      );

      if (results == null) return [];

      final matches = (results as List)
          .map((data) => SmartMatch.fromAIMatch(data as Map<String, dynamic>))
          .toList();

      _log.debug('Got ${matches.length} AI matches for context: $context', tag: _tag);
      return matches;
    } catch (e) {
      _log.error('Error getting AI smart matches: $e', tag: _tag);
      // Fallback to legacy matching if RPC fails
      return _getLegacyMatches(eventId, limit: limit);
    }
  }

  /// Get matches for Zone networking (event-scoped)
  Future<List<SmartMatch>> getZoneMatches(String eventId, {int limit = 20}) async {
    return getSmartMatches(eventId, limit: limit, context: 'zone');
  }

  /// Get matches for Pulse page (universal)
  Future<List<SmartMatch>> getPulseMatches({int limit = 20, int offset = 0}) async {
    return getSmartMatches(null, limit: limit, offset: offset, context: 'pulse');
  }

  /// Get match explanation for a specific user pair
  Future<Map<String, dynamic>?> getMatchExplanation(String targetUserId) async {
    final userId = _currentUserId;
    if (userId == null) return null;

    try {
      final result = await _supabase.rpc(
        'get_match_explanation',
        params: {
          'p_user_id': userId,
          'p_target_user_id': targetUserId,
        },
      );

      if (result != null && (result as List).isNotEmpty) {
        return result[0] as Map<String, dynamic>;
      }
      return null;
    } catch (e) {
      _log.debug('Error getting match explanation: $e', tag: _tag);
      return null;
    }
  }

  /// Legacy fallback matching (used when RPC unavailable)
  Future<List<SmartMatch>> _getLegacyMatches(String? eventId, {int limit = 10}) async {
    final userId = _currentUserId;
    if (userId == null) return [];

    try {
      final myProfile = await _impactService.getMyImpactProfile();
      if (myProfile == null) return [];

      List<String> attendeeIds = [];
      
      if (eventId != null) {
        // Get checked-in attendees for event
        final checkins = await _supabase
            .from('event_checkins')
            .select('user_id')
            .eq('event_id', eventId)
            .neq('user_id', userId);
        attendeeIds = (checkins as List).map((c) => c['user_id'] as String).toList();
      } else {
        // Get recent active profiles for pulse
        final profiles = await _supabase
            .from('impact_profiles')
            .select('user_id')
            .neq('user_id', userId)
            .order('updated_at', ascending: false)
            .limit(100);
        attendeeIds = (profiles as List).map((c) => c['user_id'] as String).toList();
      }

      if (attendeeIds.isEmpty) return [];

      final profiles = await _supabase
          .from('impact_profiles')
          .select()
          .inFilter('user_id', attendeeIds);

      final matches = <SmartMatch>[];
      for (final profileData in profiles) {
        final profile = ImpactProfile.fromMap(profileData);
        final matchResult = _impactService.calculateMatchInsights(myProfile, profile);

        matches.add(SmartMatch(
          profile: profile,
          matchResult: matchResult,
          isOnline: profile.isOnline,
          lastSeen: profile.lastSeen,
        ));
      }

      matches.sort((a, b) => b.matchScore.compareTo(a.matchScore));
      return matches.take(limit).toList();
    } catch (e) {
      _log.debug('Error in legacy matching: $e', tag: _tag);
      return [];
    }
  }

  // ============== ICEBREAKERS ==============

  /// Get active icebreaker for an event
  Future<EventIcebreaker?> getActiveIcebreaker(String eventId) async {
    final userId = _currentUserId;
    if (userId == null) return null;

    try {
      final result = await _supabase
          .from('event_icebreakers')
          .select()
          .eq('event_id', eventId)
          .eq('is_active', true)
          .maybeSingle();

      if (result == null) return null;

      // Get answer count
      final countResult = await _supabase
          .from('icebreaker_answers')
          .select('id')
          .eq('icebreaker_id', result['id']);

      final answerCount = (countResult as List).length;

      // Get my answer if exists
      final myAnswerResult = await _supabase
          .from('icebreaker_answers')
          .select('answer')
          .eq('icebreaker_id', result['id'])
          .eq('user_id', userId)
          .maybeSingle();

      return EventIcebreaker.fromMap({
        ...result,
        'answer_count': answerCount,
        'my_answer': myAnswerResult?['answer'],
      });
    } catch (e) {
      _log.debug('Error getting active icebreaker: $e', tag: _tag);
      return null;
    }
  }

  /// Submit answer to an icebreaker
  Future<bool> submitIcebreakerAnswer(String icebreakerId, String answer) async {
    final userId = _currentUserId;
    if (userId == null) return false;

    try {
      await _supabase.from('icebreaker_answers').upsert({
        'icebreaker_id': icebreakerId,
        'user_id': userId,
        'answer': answer,
      });
      return true;
    } catch (e) {
      _log.debug('Error submitting icebreaker answer: $e', tag: _tag);
      return false;
    }
  }

  /// Get all answers to an icebreaker
  Future<List<IcebreakerAnswer>> getIcebreakerAnswers(String icebreakerId) async {
    try {
      final results = await _supabase
          .from('icebreaker_answers')
          .select('''
            *,
            user_profile:impact_profiles!user_id(full_name, avatar_url)
          ''')
          .eq('icebreaker_id', icebreakerId)
          .order('created_at', ascending: false);

      return (results as List)
          .map((r) => IcebreakerAnswer.fromMap(r))
          .toList();
    } catch (e) {
      _log.debug('Error getting icebreaker answers: $e', tag: _tag);
      return [];
    }
  }

  // ============== MEETING SCHEDULER ==============

  /// Request a 1-on-1 meeting
  Future<bool> requestMeeting({
    required String eventId,
    required String targetUserId,
    required DateTime proposedTime,
    String? location,
    String? message,
  }) async {
    final userId = _currentUserId;
    if (userId == null) return false;

    try {
      await _supabase.from('networking_meetings').insert({
        'event_id': eventId,
        'requester_id': userId,
        'receiver_id': targetUserId,
        'proposed_time': proposedTime.toIso8601String(),
        'proposed_location': location,
        'message': message,
        'status': 'PENDING',
      });

      // Create notification for receiver
      await _supabase.from('notifications').insert({
        'user_id': targetUserId,
        'type': 'MEETING_REQUEST',
        'title': 'New Meeting Request',
        'message': 'Someone wants to meet with you!',
        'category': 'networking',
        'action_url': '/networking/meetings',
      });

      return true;
    } catch (e) {
      _log.debug('Error requesting meeting: $e', tag: _tag);
      return false;
    }
  }

  /// Respond to a meeting request
  Future<bool> respondToMeeting(String meetingId, bool accept) async {
    final userId = _currentUserId;
    if (userId == null) return false;

    try {
      // Get the meeting first
      final meeting = await _supabase
          .from('networking_meetings')
          .select()
          .eq('id', meetingId)
          .single();

      if (meeting['receiver_id'] != userId) {
        _log.debug('Not authorized to respond to this meeting', tag: _tag);
        return false;
      }

      await _supabase.from('networking_meetings').update({
        'status': accept ? 'ACCEPTED' : 'DECLINED',
        'responded_at': DateTime.now().toIso8601String(),
      }).eq('id', meetingId);

      // Notify the requester
      await _supabase.from('notifications').insert({
        'user_id': meeting['requester_id'],
        'type': accept ? 'MEETING_ACCEPTED' : 'MEETING_DECLINED',
        'title': accept ? 'Meeting Accepted!' : 'Meeting Declined',
        'message': accept
            ? 'Your meeting request was accepted!'
            : 'Your meeting request was declined',
        'category': 'networking',
        'action_url': '/networking/meetings',
      });

      return true;
    } catch (e) {
      _log.debug('Error responding to meeting: $e', tag: _tag);
      return false;
    }
  }

  /// Cancel a meeting (by requester)
  Future<bool> cancelMeeting(String meetingId) async {
    final userId = _currentUserId;
    if (userId == null) return false;

    try {
      await _supabase
          .from('networking_meetings')
          .update({'status': 'CANCELLED'})
          .eq('id', meetingId)
          .eq('requester_id', userId);
      return true;
    } catch (e) {
      _log.debug('Error cancelling meeting: $e', tag: _tag);
      return false;
    }
  }

  /// Get all meetings for current user at an event
  Future<List<NetworkingMeeting>> getMyMeetings(String eventId) async {
    final userId = _currentUserId;
    if (userId == null) return [];

    try {
      final results = await _supabase
          .from('networking_meetings')
          .select('''
            *,
            requester_profile:impact_profiles!requester_id(full_name, avatar_url, headline),
            receiver_profile:impact_profiles!receiver_id(full_name, avatar_url, headline)
          ''')
          .eq('event_id', eventId)
          .or('requester_id.eq.$userId,receiver_id.eq.$userId')
          .order('proposed_time', ascending: true);

      return (results as List)
          .map((r) => NetworkingMeeting.fromMap(r, currentUserId: userId))
          .toList();
    } catch (e) {
      _log.debug('Error getting meetings: $e', tag: _tag);
      return [];
    }
  }

  /// Get pending incoming meeting requests
  Future<List<NetworkingMeeting>> getPendingRequests(String eventId) async {
    final userId = _currentUserId;
    if (userId == null) return [];

    try {
      final results = await _supabase
          .from('networking_meetings')
          .select('''
            *,
            requester_profile:impact_profiles!requester_id(full_name, avatar_url, headline)
          ''')
          .eq('event_id', eventId)
          .eq('receiver_id', userId)
          .eq('status', 'PENDING')
          .order('created_at', ascending: false);

      return (results as List)
          .map((r) => NetworkingMeeting.fromMap(r, currentUserId: userId))
          .toList();
    } catch (e) {
      _log.debug('Error getting pending requests: $e', tag: _tag);
      return [];
    }
  }

  /// Get upcoming confirmed meetings
  Future<List<NetworkingMeeting>> getUpcomingMeetings(String eventId) async {
    final userId = _currentUserId;
    if (userId == null) return [];

    try {
      final results = await _supabase
          .from('networking_meetings')
          .select('''
            *,
            requester_profile:impact_profiles!requester_id(full_name, avatar_url, headline),
            receiver_profile:impact_profiles!receiver_id(full_name, avatar_url, headline)
          ''')
          .eq('event_id', eventId)
          .eq('status', 'ACCEPTED')
          .gte('proposed_time', DateTime.now().toIso8601String())
          .or('requester_id.eq.$userId,receiver_id.eq.$userId')
          .order('proposed_time', ascending: true);

      return (results as List)
          .map((r) => NetworkingMeeting.fromMap(r, currentUserId: userId))
          .toList();
    } catch (e) {
      _log.debug('Error getting upcoming meetings: $e', tag: _tag);
      return [];
    }
  }

  // ============== CONTACT EXCHANGE ==============

  /// Exchange contact info with another user
  Future<bool> exchangeContact({
    required String eventId,
    required String targetUserId,
    required Map<String, bool> sharedFields,
  }) async {
    final userId = _currentUserId;
    if (userId == null) return false;

    try {
      await _supabase.from('contact_exchanges').upsert({
        'event_id': eventId,
        'user_id': userId,
        'target_user_id': targetUserId,
        'shared_fields': sharedFields,
      });

      // Notify the target user
      await _supabase.from('notifications').insert({
        'user_id': targetUserId,
        'type': 'CONTACT_SHARED',
        'title': 'Contact Shared',
        'message': 'Someone shared their contact info with you!',
        'category': 'networking',
        'action_url': '/networking/contacts',
      });

      return true;
    } catch (e) {
      _log.debug('Error exchanging contact: $e', tag: _tag);
      return false;
    }
  }

  /// Get all exchanged contacts at an event
  Future<List<ContactExchange>> getExchangedContacts(String eventId) async {
    final userId = _currentUserId;
    if (userId == null) return [];

    try {
      final results = await _supabase
          .from('contact_exchanges')
          .select('''
            *,
            user_profile:impact_profiles!user_id(full_name, avatar_url, headline),
            target_profile:impact_profiles!target_user_id(full_name, avatar_url, headline)
          ''')
          .eq('event_id', eventId)
          .or('user_id.eq.$userId,target_user_id.eq.$userId')
          .order('created_at', ascending: false);

      return (results as List)
          .map((r) => ContactExchange.fromMap(r, currentUserId: userId))
          .toList();
    } catch (e) {
      _log.debug('Error getting exchanged contacts: $e', tag: _tag);
      return [];
    }
  }

  /// Get count of contacts exchanged at an event
  Future<int> getContactExchangeCount(String eventId) async {
    final userId = _currentUserId;
    if (userId == null) return 0;

    try {
      final results = await _supabase
          .from('contact_exchanges')
          .select('id')
          .eq('event_id', eventId)
          .or('user_id.eq.$userId,target_user_id.eq.$userId');

      return (results as List).length;
    } catch (e) {
      _log.debug('Error getting contact count: $e', tag: _tag);
      return 0;
    }
  }
}
