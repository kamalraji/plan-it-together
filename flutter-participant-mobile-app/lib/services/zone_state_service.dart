import 'dart:async';
import 'package:flutter/material.dart';
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
import 'package:thittam1hub/models/zone_activity.dart';
import 'package:thittam1hub/models/zone_gamification_models.dart';
import 'package:thittam1hub/models/paginated_list.dart';
import 'package:thittam1hub/models/live_stream.dart';
import 'package:thittam1hub/utils/result.dart';
import 'package:thittam1hub/repositories/zone_repository.dart';
import 'package:thittam1hub/services/logging_mixin.dart';
import 'package:thittam1hub/services/live_stream_service.dart';

/// Callback for new announcement notifications
typedef AnnouncementCallback = void Function(EventAnnouncement announcement);

/// ZoneStateService - ChangeNotifier for Zone feature state management
/// Handles data fetching, caching, real-time subscriptions, and state updates
class ZoneStateService extends ChangeNotifier with LoggingMixin {
  @override
  String get logTag => 'ZoneStateService';
  
  final ZoneRepository _repository;

  ZoneStateService(this._repository);

  // ========== Zone Inside State ==========
  bool _isInsideZone = false;
  bool get isInsideZone => _isInsideZone;
  
  String _currentSectionId = 'schedule';
  String get currentSectionId => _currentSectionId;
  
  // Track which sections have been loaded for lazy loading optimization
  final Set<String> _loadedSections = {};
  bool isSectionLoaded(String sectionId) => _loadedSections.contains(sectionId);
  
  // Optimistic state tracking for rollback
  bool _optimisticCheckInPending = false;
  ZoneEvent? _pendingEvent;
  
  // ========== Per-Section Loading States ==========
  bool isLoadingEvents = false;
  bool isLoadingSessions = false;
  bool isLoadingPolls = false;
  bool isLoadingAnnouncements = false;
  bool isLoadingAttendees = false;
  bool isLoadingTeam = false;
  bool isLoadingTracks = false;
  bool isLoadingFeedback = false;
  bool isLoadingIcebreaker = false;
  bool isLoadingMaterials = false;
  bool isLoadingMorePolls = false;
  bool isLoadingMoreAnnouncements = false;
  bool _isCheckingIn = false;
  bool get isCheckingIn => _isCheckingIn;

  // ========== Error States ==========
  String? eventsError;
  String? sessionsError;
  String? pollsError;
  String? announcementsError;
  String? attendeesError;
  String? teamError;
  String? tracksError;
  String? feedbackError;
  String? icebreakerError;
  String? materialsError;

  // ========== Data ==========
  List<ZoneEvent> todayEvents = [];
  ZoneEvent? currentEvent;
  List<EventSession> liveSessions = [];
  List<EventSession> upcomingSessions = [];
  List<EventSession> allSessions = [];
  PaginatedList<EventPoll> activePolls = PaginatedList.empty();
  PaginatedList<EventPoll> allPolls = PaginatedList.empty();
  PaginatedList<EventAnnouncement> announcements = PaginatedList.empty();
  List<EventAnnouncement> allAnnouncements = [];
  List<AttendeeRadar> nearbyAttendees = [];
  List<ZoneTeamMember> teamMembers = [];
  List<EventTrack> eventTracks = [];
  Map<String, SessionRatingAggregate> sessionRatings = {};
  Set<String> selectedTrackIds = {};
  EventIcebreaker? todayIcebreaker;
  Map<String, List<SessionMaterial>> sessionMaterials = {};
  int attendeeCount = 0;
  bool canManage = false;

  // ========== Leaderboard State ==========
  List<ZoneLeaderboardEntry> leaderboardEntries = [];
  ZoneLeaderboardEntry? currentUserLeaderboardEntry;
  bool isLoadingLeaderboard = false;

  // ========== Sponsor Booth State ==========
  List<SponsorBooth> sponsorBooths = [];
  bool isLoadingSponsors = false;
  String? sponsorsError;

  // ========== Challenges State ==========
  List<ZoneChallenge> activeChallenges = [];
  List<ZoneChallengeCompletion> completedChallenges = [];
  bool isLoadingChallenges = false;
  String? challengesError;

  // ========== Live Streaming State ==========
  List<LiveStream> eventStreams = [];
  List<LiveStream> liveNowStreams = [];
  LiveStream? currentlyWatching;
  bool isLoadingStreams = false;
  String? streamsError;
  StreamSubscription? _streamsSubscription;

  // ========== Realtime Subscriptions ==========
  RealtimeChannel? _sessionsChannel;
  RealtimeChannel? _pollsChannel;
  RealtimeChannel? _announcementsChannel;
  RealtimeChannel? _checkinsChannel;
  RealtimeChannel? _streamsChannel;

  // ========== Callbacks ==========
  AnnouncementCallback? onNewAnnouncementCallback;
  void Function(LiveStream)? onStreamStartedCallback;
  void Function(LiveStream)? onStreamEndedCallback;

  // ========== Pagination Helpers ==========
  bool get hasMorePolls => activePolls.hasMore;
  bool get hasMoreAnnouncements => announcements.hasMore;

  // ========== Event Operations ==========

  Future<void> loadTodayEvents() async {
    isLoadingEvents = true;
    eventsError = null;
    notifyListeners();

    final result = await _repository.getTodayEvents();
    switch (result) {
      case Success(data: final events):
        todayEvents = events;
        eventsError = null;
      case Failure(message: final msg):
        eventsError = msg;
    }

    isLoadingEvents = false;
    notifyListeners();
  }

  Future<void> loadCurrentEvent() async {
    final result = await _repository.getCurrentEvent();
    switch (result) {
      case Success(data: final event):
        currentEvent = event;
      case Failure():
        // Keep existing currentEvent on failure
        break;
    }
    notifyListeners();
  }

  Future<bool> checkIn(String eventId, {String? location}) async {
    final result = await _repository.checkIn(eventId, location: location);
    switch (result) {
      case Success():
        await loadCurrentEvent();
        return true;
      case Failure():
        return false;
    }
  }

  Future<bool> checkOut(String eventId) async {
    final result = await _repository.checkOut(eventId);
    switch (result) {
      case Success():
        currentEvent = null;
        _isInsideZone = false;
        _currentSectionId = 'schedule';
        notifyListeners();
        return true;
      case Failure():
        return false;
    }
  }
  
  // ========== Zone Inside State Management ==========
  
  /// Enter the Zone with optimistic UI update
  /// Shows inside view immediately, rolls back on failure
  Future<bool> enterZone(String eventId, {String? location, ZoneEvent? event}) async {
    if (_isCheckingIn) return false;
    
    logInfo('Entering zone for event: $eventId');
    
    // Optimistic update - show inside view immediately
    _optimisticCheckInPending = true;
    _pendingEvent = event ?? todayEvents.firstWhere(
      (e) => e.id == eventId,
      orElse: () => currentEvent!,
    );
    _isInsideZone = true;
    _isCheckingIn = true;
    _currentSectionId = 'schedule';
    _loadedSections.clear();
    _loadedSections.add('schedule');
    notifyListeners();
    
    // Perform actual check-in
    final result = await checkIn(eventId, location: location);
    
    if (result) {
      logInfo('Check-in successful, loading zone data');
      _optimisticCheckInPending = false;
      
      // Load initial section data in parallel
      await Future.wait([
        loadSessions(eventId),
        loadAttendees(eventId),
        loadActivePolls(eventId),
      ]);
      
      // Subscribe to real-time updates
      subscribeToEventUpdates(eventId);
    } else {
      // Rollback optimistic update
      logWarning('Check-in failed, rolling back optimistic state');
      _isInsideZone = false;
      _optimisticCheckInPending = false;
      _pendingEvent = null;
      _loadedSections.clear();
    }
    
    _isCheckingIn = false;
    notifyListeners();
    return result;
  }
  
  /// Exit the Zone (check out and return to lobby)
  Future<bool> exitZone(String eventId) async {
    logInfo('Exiting zone for event: $eventId');
    
    // Optimistic update
    final previousEvent = currentEvent;
    final previousSection = _currentSectionId;
    _isInsideZone = false;
    notifyListeners();
    
    final result = await checkOut(eventId);
    
    if (result) {
      _currentSectionId = 'schedule';
      _loadedSections.clear();
      unsubscribeFromEventUpdates();
      logInfo('Check-out successful');
    } else {
      // Rollback
      logWarning('Check-out failed, rolling back');
      _isInsideZone = true;
      currentEvent = previousEvent;
      _currentSectionId = previousSection;
    }
    
    notifyListeners();
    return result;
  }
  
  /// Switch to a different section inside the Zone
  void switchSection(String sectionId) {
    if (_currentSectionId != sectionId) {
      logInfo('Switching section: $_currentSectionId -> $sectionId');
      _currentSectionId = sectionId;
      notifyListeners();
      
      // Lazy load section data if not already loaded
      if (currentEvent != null && !_loadedSections.contains(sectionId)) {
        _loadSectionData(sectionId, currentEvent!.id);
      }
    }
  }
  
  /// Force reload data for current section
  Future<void> refreshCurrentSection() async {
    if (currentEvent == null) return;
    
    _loadedSections.remove(_currentSectionId);
    await _loadSectionData(_currentSectionId, currentEvent!.id);
  }
  
  /// Set optimistic check-in state for immediate UI feedback
  void setOptimisticCheckIn(bool value) {
    _isInsideZone = value;
    notifyListeners();
  }
  
  /// Reset zone state (e.g., on logout)
  void resetZoneState() {
    _isInsideZone = false;
    _currentSectionId = 'schedule';
    _loadedSections.clear();
    _optimisticCheckInPending = false;
    _pendingEvent = null;
    currentEvent = null;
    todayEvents = [];
    liveSessions = [];
    upcomingSessions = [];
    nearbyAttendees = [];
    activePolls = PaginatedList.empty();
    announcements = PaginatedList.empty();
    notifyListeners();
  }
  
  /// Sync zone state from URL parameters (for deep linking / browser navigation)
  /// Called when URL changes to ensure UI state matches URL
  void syncFromUrl({
    required bool isInside,
    String? eventId,
    String? sectionId,
  }) {
    logInfo('Syncing from URL: inside=$isInside, event=$eventId, section=$sectionId');
    
    bool stateChanged = false;
    
    // Update inside state
    if (_isInsideZone != isInside) {
      _isInsideZone = isInside;
      stateChanged = true;
    }
    
    // Update section (only if inside zone)
    if (isInside && sectionId != null && _currentSectionId != sectionId) {
      _currentSectionId = sectionId;
      stateChanged = true;
      
      // Load section data if not already loaded
      if (eventId != null && !_loadedSections.contains(sectionId)) {
        _loadSectionData(sectionId, eventId);
      }
    }
    
    // Update current event if specified
    if (eventId != null && currentEvent?.id != eventId) {
      final matchingEvent = todayEvents.firstWhere(
        (e) => e.id == eventId,
        orElse: () => currentEvent ?? todayEvents.first,
      );
      if (matchingEvent.id == eventId) {
        currentEvent = matchingEvent;
        stateChanged = true;
      }
    }
    
    if (stateChanged) {
      notifyListeners();
    }
  }
  
  Future<void> _loadSectionData(String sectionId, String eventId) async {
    logInfo('Loading section data: $sectionId');
    
    switch (sectionId) {
      case 'schedule':
        await loadSessions(eventId);
      case 'networking':
        await loadAttendees(eventId);
      case 'polls':
        await loadActivePolls(eventId);
      case 'announcements':
        await loadAnnouncements(eventId);
      case 'leaderboard':
        await loadLeaderboard(eventId);
      case 'sponsors':
        await loadSponsorBooths(eventId);
      case 'challenges':
        await loadChallenges(eventId);
      case 'materials':
        // Materials loaded per-session on demand
        break;
      case 'circles':
        // Circles loaded by CircleService
        break;
      case 'icebreaker':
        await loadTodayIcebreaker(eventId);
      case 'qa':
        // Q&A loaded via session context
        break;
      default:
        logWarning('Unknown section: $sectionId');
    }
    
    _loadedSections.add(sectionId);
  }
  
  /// Pre-load adjacent sections for smooth navigation
  Future<void> preloadAdjacentSections(String currentSectionId) async {
    if (currentEvent == null) return;
    
    const sectionOrder = [
      'schedule', 'networking', 'polls', 'qa', 'announcements',
      'leaderboard', 'materials', 'circles', 'icebreaker'
    ];
    
    final currentIndex = sectionOrder.indexOf(currentSectionId);
    if (currentIndex == -1) return;
    
    final toPreload = <String>[];
    if (currentIndex > 0) toPreload.add(sectionOrder[currentIndex - 1]);
    if (currentIndex < sectionOrder.length - 1) toPreload.add(sectionOrder[currentIndex + 1]);
    
    for (final section in toPreload) {
      if (!_loadedSections.contains(section)) {
        // Fire and forget - don't await
        _loadSectionData(section, currentEvent!.id);
      }
    }
  }

  // ========== Session Operations ==========

  Future<void> loadSessions(String eventId) async {
    isLoadingSessions = true;
    sessionsError = null;
    notifyListeners();

    final results = await Future.wait([
      _repository.getLiveSessions(eventId),
      _repository.getUpcomingSessions(eventId),
    ]);

    switch (results[0]) {
      case Success(data: final sessions):
        liveSessions = sessions;
      case Failure(message: final msg):
        sessionsError = msg;
    }

    switch (results[1]) {
      case Success(data: final sessions):
        upcomingSessions = sessions;
      case Failure(message: final msg):
        sessionsError ??= msg;
    }

    isLoadingSessions = false;
    notifyListeners();
  }

  Future<void> loadAllSessions(String eventId) async {
    isLoadingSessions = true;
    sessionsError = null;
    notifyListeners();

    final result = await _repository.getAllSessions(eventId);
    switch (result) {
      case Success(data: final sessions):
        allSessions = sessions;
      case Failure(message: final msg):
        sessionsError = msg;
    }

    isLoadingSessions = false;
    notifyListeners();
  }

  Future<Result<String>> createSession({
    required String eventId,
    required String title,
    String? description,
    String? speakerName,
    String? room,
    required DateTime startTime,
    required DateTime endTime,
  }) async {
    final result = await _repository.createSession(
      eventId: eventId,
      title: title,
      description: description,
      speakerName: speakerName,
      room: room,
      startTime: startTime,
      endTime: endTime,
    );

    if (result is Success) {
      await loadAllSessions(eventId);
    }
    return result;
  }

  Future<Result<bool>> updateSession({
    required String sessionId,
    required String eventId,
    String? title,
    String? description,
    String? speakerName,
    String? room,
    DateTime? startTime,
    DateTime? endTime,
    String? status,
  }) async {
    final result = await _repository.updateSession(
      sessionId: sessionId,
      title: title,
      description: description,
      speakerName: speakerName,
      room: room,
      startTime: startTime,
      endTime: endTime,
      status: status,
    );

    if (result is Success) {
      await loadAllSessions(eventId);
    }
    return result;
  }

  Future<Result<bool>> deleteSession(String sessionId, String eventId) async {
    final result = await _repository.deleteSession(sessionId);
    if (result is Success) {
      await loadAllSessions(eventId);
    }
    return result;
  }

  // ========== Attendee Operations ==========

  Future<void> loadAttendees(String eventId) async {
    isLoadingAttendees = true;
    attendeesError = null;
    notifyListeners();

    final results = await Future.wait([
      _repository.getNearbyAttendees(eventId),
      _repository.getAttendeeCount(eventId),
    ]);

    switch (results[0]) {
      case Success(data: final attendees):
        nearbyAttendees = attendees as List<AttendeeRadar>;
      case Failure(message: final msg):
        attendeesError = msg;
    }

    switch (results[1]) {
      case Success(data: final count):
        attendeeCount = count as int;
      case Failure():
        break;
    }

    isLoadingAttendees = false;
    notifyListeners();
  }

  // ========== Poll Operations ==========

  Future<void> loadActivePolls(String eventId, {bool refresh = false}) async {
    if (refresh) {
      activePolls = PaginatedList.empty();
    }

    isLoadingPolls = true;
    pollsError = null;
    notifyListeners();

    final result = await _repository.getActivePolls(eventId, page: 0);
    switch (result) {
      case Success(data: final polls):
        activePolls = polls;
      case Failure(message: final msg):
        pollsError = msg;
    }

    isLoadingPolls = false;
    notifyListeners();
  }

  Future<void> loadMorePolls(String eventId) async {
    if (!hasMorePolls || isLoadingMorePolls) return;

    isLoadingMorePolls = true;
    notifyListeners();

    final result = await _repository.getActivePolls(
      eventId,
      page: activePolls.nextPage,
    );

    switch (result) {
      case Success(data: final polls):
        activePolls = activePolls.merge(polls);
      case Failure():
        break;
    }

    isLoadingMorePolls = false;
    notifyListeners();
  }

  Future<void> loadAllPolls(String eventId) async {
    isLoadingPolls = true;
    pollsError = null;
    notifyListeners();

    final result = await _repository.getAllPolls(eventId, page: 0);
    switch (result) {
      case Success(data: final polls):
        allPolls = polls;
      case Failure(message: final msg):
        pollsError = msg;
    }

    isLoadingPolls = false;
    notifyListeners();
  }

  Future<Result<bool>> submitPollVote(String pollId, String optionId, String eventId) async {
    final result = await _repository.submitPollVote(pollId, optionId);
    if (result is Success) {
      await loadActivePolls(eventId, refresh: true);
    }
    return result;
  }

  Future<Result<String>> createPoll({
    required String eventId,
    required String question,
    required List<String> options,
    DateTime? expiresAt,
  }) async {
    final result = await _repository.createPoll(
      eventId: eventId,
      question: question,
      options: options,
      expiresAt: expiresAt,
    );

    if (result is Success) {
      await loadAllPolls(eventId);
    }
    return result;
  }

  Future<Result<bool>> closePoll(String pollId, String eventId) async {
    final result = await _repository.closePoll(pollId);
    if (result is Success) {
      await loadAllPolls(eventId);
    }
    return result;
  }

  Future<Result<bool>> deletePoll(String pollId, String eventId) async {
    final result = await _repository.deletePoll(pollId);
    if (result is Success) {
      await loadAllPolls(eventId);
    }
    return result;
  }

  // ========== Announcement Operations ==========

  Future<void> loadAnnouncements(String eventId, {bool refresh = false}) async {
    if (refresh) {
      announcements = PaginatedList.empty();
    }

    isLoadingAnnouncements = true;
    announcementsError = null;
    notifyListeners();

    final result = await _repository.getAnnouncements(eventId, page: 0);
    switch (result) {
      case Success(data: final list):
        announcements = list;
      case Failure(message: final msg):
        announcementsError = msg;
    }

    isLoadingAnnouncements = false;
    notifyListeners();
  }

  Future<void> loadMoreAnnouncements(String eventId) async {
    if (!hasMoreAnnouncements || isLoadingMoreAnnouncements) return;

    isLoadingMoreAnnouncements = true;
    notifyListeners();

    final result = await _repository.getAnnouncements(
      eventId,
      page: announcements.nextPage,
    );

    switch (result) {
      case Success(data: final list):
        announcements = announcements.merge(list);
      case Failure():
        break;
    }

    isLoadingMoreAnnouncements = false;
    notifyListeners();
  }

  Future<void> loadAllAnnouncements(String eventId) async {
    isLoadingAnnouncements = true;
    announcementsError = null;
    notifyListeners();

    final result = await _repository.getAllAnnouncements(eventId);
    switch (result) {
      case Success(data: final list):
        allAnnouncements = list;
      case Failure(message: final msg):
        announcementsError = msg;
    }

    isLoadingAnnouncements = false;
    notifyListeners();
  }

  Future<Result<String>> createAnnouncement({
    required String eventId,
    required String title,
    required String content,
    String type = 'info',
    bool isPinned = false,
  }) async {
    final result = await _repository.createAnnouncement(
      eventId: eventId,
      title: title,
      content: content,
      type: type,
      isPinned: isPinned,
    );

    if (result is Success) {
      await loadAllAnnouncements(eventId);
    }
    return result;
  }

  Future<Result<bool>> toggleAnnouncementPin(String announcementId, bool isPinned, String eventId) async {
    final result = await _repository.toggleAnnouncementPin(announcementId, isPinned);
    if (result is Success) {
      await loadAllAnnouncements(eventId);
    }
    return result;
  }

  Future<Result<bool>> deleteAnnouncement(String announcementId, String eventId) async {
    final result = await _repository.deleteAnnouncement(announcementId);
    if (result is Success) {
      await loadAllAnnouncements(eventId);
    }
    return result;
  }

  // ========== Permission Check ==========

  Future<void> checkManagePermission(String eventId) async {
    final result = await _repository.canManageZone(eventId);
    switch (result) {
      case Success(data: final canManageZone):
        canManage = canManageZone;
      case Failure():
        canManage = false;
    }
    notifyListeners();
  }

  // ========== Team Operations ==========

  /// Load team members who have Zone management access
  Future<void> loadTeamMembers(String eventId) async {
    isLoadingTeam = true;
    teamError = null;
    notifyListeners();

    final result = await _repository.getZoneTeamMembers(eventId);
    switch (result) {
      case Success(data: final members):
        teamMembers = members;
      case Failure(message: final msg):
        teamError = msg;
    }

    isLoadingTeam = false;
    notifyListeners();
  }

  /// Get team member count for tab display
  int get teamMemberCount => teamMembers.length;

  // ========== Track Operations ==========

  /// Load tracks for an event
  Future<void> loadEventTracks(String eventId) async {
    isLoadingTracks = true;
    tracksError = null;
    notifyListeners();

    final result = await _repository.getEventTracks(eventId);
    switch (result) {
      case Success(data: final tracks):
        eventTracks = tracks;
      case Failure(message: final msg):
        tracksError = msg;
    }

    isLoadingTracks = false;
    notifyListeners();
  }

  /// Filter sessions by selected tracks
  List<EventSession> get filteredSessions {
    if (selectedTrackIds.isEmpty) return allSessions;
    return allSessions.where((s) {
      // If session has track_id, filter by it
      // Otherwise include all sessions when filtering is active
      final trackId = s.trackId;
      return trackId == null || selectedTrackIds.contains(trackId);
    }).toList();
  }

  /// Update selected track filter
  void setSelectedTracks(Set<String> trackIds) {
    selectedTrackIds = trackIds;
    notifyListeners();
  }

  // ========== Feedback Operations ==========

  /// Submit feedback for a session
  Future<Result<bool>> submitSessionFeedback({
    required String sessionId,
    required String eventId,
    required int overallRating,
    int? contentRating,
    int? speakerRating,
    String? feedbackText,
    bool? wouldRecommend,
  }) async {
    final result = await _repository.submitSessionFeedback(
      sessionId: sessionId,
      eventId: eventId,
      overallRating: overallRating,
      contentRating: contentRating,
      speakerRating: speakerRating,
      feedbackText: feedbackText,
      wouldRecommend: wouldRecommend,
    );

    if (result is Success) {
      // Reload rating aggregate for this session
      await _loadSessionRating(sessionId);
    }
    return result;
  }

  /// Load rating aggregate for a session
  Future<void> _loadSessionRating(String sessionId) async {
    final result = await _repository.getSessionRatingAggregate(sessionId);
    if (result is Success<SessionRatingAggregate?> && result.data != null) {
      sessionRatings[sessionId] = result.data!;
      notifyListeners();
    }
  }

  /// Get rating aggregate for a session (cached)
  SessionRatingAggregate? getSessionRating(String sessionId) {
    return sessionRatings[sessionId];
  }

  /// Load ratings for all sessions in the list
  Future<void> loadSessionRatings(List<String> sessionIds) async {
    isLoadingFeedback = true;
    notifyListeners();

    for (final sessionId in sessionIds) {
      await _loadSessionRating(sessionId);
    }

    isLoadingFeedback = false;
    notifyListeners();
  }

  /// Check if user has already rated a session
  Future<bool> hasUserRatedSession(String sessionId) async {
    final result = await _repository.getUserSessionFeedback(sessionId);
    return result is Success<SessionFeedback?> && result.data != null;
  }

  // ========== Icebreaker Operations ==========

  /// Load today's icebreaker for an event
  Future<void> loadTodayIcebreaker(String eventId) async {
    isLoadingIcebreaker = true;
    icebreakerError = null;
    notifyListeners();

    final result = await _repository.getTodayIcebreaker(eventId);
    switch (result) {
      case Success(data: final icebreaker):
        todayIcebreaker = icebreaker;
      case Failure(message: final msg):
        icebreakerError = msg;
    }

    isLoadingIcebreaker = false;
    notifyListeners();
  }

  /// Submit icebreaker answer
  Future<Result<int>> submitIcebreakerAnswer({
    required String icebreakerId,
    required String eventId,
    required String answer,
  }) async {
    final result = await _repository.submitIcebreakerAnswer(
      icebreakerId: icebreakerId,
      eventId: eventId,
      answer: answer,
    );
    if (result is Success) {
      await loadTodayIcebreaker(eventId);
    }
    return result;
  }

  /// Get icebreaker answers
  Future<Result<List<IcebreakerAnswer>>> getIcebreakerAnswers(String icebreakerId) =>
      _repository.getIcebreakerAnswers(icebreakerId);

  // ========== Materials Operations ==========

  /// Load materials for a session
  Future<void> loadSessionMaterials(String sessionId) async {
    final result = await _repository.getSessionMaterials(sessionId);
    if (result is Success<List<SessionMaterial>>) {
      sessionMaterials[sessionId] = result.data;
      notifyListeners();
    }
  }

  /// Get cached materials for a session
  List<SessionMaterial> getMaterials(String sessionId) => sessionMaterials[sessionId] ?? [];

  /// Track material download
  Future<void> trackMaterialDownload(String materialId) async {
    await _repository.trackMaterialDownload(materialId);
  }

  // ========== Live Streaming Operations ==========

  /// Load all streams for an event
  Future<void> loadEventStreams(String eventId) async {
    isLoadingStreams = true;
    streamsError = null;
    notifyListeners();

    final result = await LiveStreamService.instance.getStreamsForEvent(eventId);
    switch (result) {
      case Success(data: final streams):
        eventStreams = streams;
        liveNowStreams = streams.where((s) => s.isLive).toList();
      case Failure(message: final msg):
        streamsError = msg;
    }

    isLoadingStreams = false;
    notifyListeners();
  }

  /// Load only currently live streams for an event
  Future<void> loadLiveNowStreams(String eventId) async {
    final result = await LiveStreamService.instance.getLiveStreamsForEvent(eventId);
    switch (result) {
      case Success(data: final streams):
        liveNowStreams = streams;
        notifyListeners();
      case Failure():
        break;
    }
  }

  /// Get stream for a specific session
  Future<LiveStream?> getStreamForSession(String sessionId) async {
    final result = await LiveStreamService.instance.getStreamForSession(sessionId);
    return result.dataOrNull;
  }

  /// Start watching a stream
  Future<bool> startWatchingStream(LiveStream stream) async {
    logInfo('Starting to watch stream: ${stream.id}');
    
    final result = await LiveStreamService.instance.startViewerSession(stream.id);
    if (result.isSuccess) {
      currentlyWatching = stream;
      notifyListeners();
      return true;
    }
    return false;
  }

  /// Stop watching current stream
  Future<void> stopWatchingStream() async {
    if (currentlyWatching != null) {
      logInfo('Stopping stream watch: ${currentlyWatching!.id}');
      await LiveStreamService.instance.endViewerSession(currentlyWatching!.id);
      currentlyWatching = null;
      notifyListeners();
    }
  }

  /// Get viewer count for a stream
  Future<int> getStreamViewerCount(String streamId) async {
    final result = await LiveStreamService.instance.getViewerCount(streamId);
    return result.dataOrNull ?? 0;
  }

  /// Subscribe to viewer count updates
  Stream<int> streamViewerCount(String streamId) {
    return LiveStreamService.instance.streamViewerCount(streamId);
  }

  /// Subscribe to stream status updates
  Stream<LiveStream> streamStatusUpdates(String streamId) {
    return LiveStreamService.instance.streamStatusUpdates(streamId);
  }

  /// Check if there are any live streams for the current event
  bool get hasLiveStreams => liveNowStreams.isNotEmpty;

  /// Get the first live stream (for quick access)
  LiveStream? get firstLiveStream => liveNowStreams.isNotEmpty ? liveNowStreams.first : null;

  /// Check if user is currently watching any stream
  bool get isWatchingStream => currentlyWatching != null;

  // ========== Realtime Subscriptions ==========

  void subscribeToEventUpdates(String eventId) {
    final client = Supabase.instance.client;

    // Sessions channel
    _sessionsChannel = client
        .channel('event_sessions:$eventId')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'event_sessions',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'event_id',
            value: eventId,
          ),
          callback: (payload) => _handleSessionChange(payload, eventId),
        )
        .subscribe();

    // Polls channel
    _pollsChannel = client
        .channel('event_polls:$eventId')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'event_polls',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'event_id',
            value: eventId,
          ),
          callback: (payload) => _handlePollChange(payload, eventId),
        )
        .subscribe();

    // Announcements channel - with toast notifications for new items
    _announcementsChannel = client
        .channel('event_announcements:$eventId')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'event_announcements',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'event_id',
            value: eventId,
          ),
          callback: (payload) => _handleAnnouncementChange(payload, eventId),
        )
        .subscribe();

    // Check-ins channel for live attendee count
    _checkinsChannel = client
        .channel('event_checkins:$eventId')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'event_checkins',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'event_id',
            value: eventId,
          ),
          callback: (payload) => _handleCheckinChange(payload, eventId),
        )
        .subscribe();

    // Live streams channel for stream status updates
    _streamsChannel = client
        .channel('event_live_streams:$eventId')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'event_live_streams',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'event_id',
            value: eventId,
          ),
          callback: (payload) => _handleStreamChange(payload, eventId),
        )
        .subscribe();
  }

  void _handleSessionChange(PostgresChangePayload payload, String eventId) {
    logDebug('Session change detected: ${payload.eventType}');
    loadSessions(eventId);
  }

  void _handlePollChange(PostgresChangePayload payload, String eventId) {
    logDebug('Poll change detected: ${payload.eventType}');
    loadActivePolls(eventId, refresh: true);
  }

  void _handleAnnouncementChange(PostgresChangePayload payload, String eventId) {
    logDebug('Announcement change detected: ${payload.eventType}');
    
    if (payload.eventType == PostgresChangeEvent.insert) {
      // Trigger toast notification for new announcements
      try {
        final newRecord = payload.newRecord;
        if (newRecord.isNotEmpty) {
          final announcement = EventAnnouncement.fromJson(newRecord);
          onNewAnnouncementCallback?.call(announcement);
        }
      } catch (e) {
        logWarning('Error parsing new announcement', error: e);
      }
    }
    
    loadAnnouncements(eventId, refresh: true);
  }

  void _handleCheckinChange(PostgresChangePayload payload, String eventId) {
    logDebug('Checkin change detected: ${payload.eventType}');
    loadAttendees(eventId);
  }

  void _handleStreamChange(PostgresChangePayload payload, String eventId) {
    logDebug('Stream change detected: ${payload.eventType}');
    
    try {
      if (payload.eventType == PostgresChangeEvent.insert ||
          payload.eventType == PostgresChangeEvent.update) {
        final newRecord = payload.newRecord;
        if (newRecord.isNotEmpty) {
          final stream = LiveStream.fromJson(newRecord);
          
          // Update local cache
          final index = eventStreams.indexWhere((s) => s.id == stream.id);
          if (index >= 0) {
            eventStreams[index] = stream;
          } else {
            eventStreams.add(stream);
          }
          
          // Update live now list
          liveNowStreams = eventStreams.where((s) => s.isLive).toList();
          
          // Trigger callbacks for stream status changes
          if (stream.isLive) {
            onStreamStartedCallback?.call(stream);
          } else if (stream.hasEnded) {
            onStreamEndedCallback?.call(stream);
            // If user was watching this stream, clear it
            if (currentlyWatching?.id == stream.id) {
              currentlyWatching = stream; // Update with ended status
            }
          }
          
          notifyListeners();
        }
      } else if (payload.eventType == PostgresChangeEvent.delete) {
        final oldRecord = payload.oldRecord;
        if (oldRecord.isNotEmpty) {
          final deletedId = oldRecord['id'] as String?;
          if (deletedId != null) {
            eventStreams.removeWhere((s) => s.id == deletedId);
            liveNowStreams.removeWhere((s) => s.id == deletedId);
            if (currentlyWatching?.id == deletedId) {
              currentlyWatching = null;
            }
            notifyListeners();
          }
        }
      }
    } catch (e) {
      logWarning('Error handling stream change', error: e);
      // Fallback to full reload
      loadEventStreams(eventId);
    }
  }

  void unsubscribeFromEventUpdates() {
    _sessionsChannel?.unsubscribe();
    _pollsChannel?.unsubscribe();
    _announcementsChannel?.unsubscribe();
    _checkinsChannel?.unsubscribe();
    _streamsChannel?.unsubscribe();
    _streamsSubscription?.cancel();
    
    _sessionsChannel = null;
    _pollsChannel = null;
    _announcementsChannel = null;
    _checkinsChannel = null;
    _streamsChannel = null;
    _streamsSubscription = null;
  }

  // ========== Load All Data ==========

  Future<void> loadAllData(String eventId) async {
    await Future.wait([
      loadSessions(eventId),
      loadAttendees(eventId),
      loadActivePolls(eventId),
      loadAnnouncements(eventId),
      loadEventStreams(eventId),
      checkManagePermission(eventId),
    ]);
    
    // Load team members only if user has management access
    if (canManage) {
      await loadTeamMembers(eventId);
    }
  }

  // ========== Q&A Operations ==========

  Future<Result<List<SessionQuestion>>> getSessionQuestions(String sessionId) async {
    return _repository.getSessionQuestions(sessionId);
  }

  Future<Result<String>> submitQuestion({
    required String sessionId,
    required String eventId,
    required String questionText,
    bool isAnonymous = false,
  }) async {
    return _repository.submitQuestion(
      sessionId: sessionId,
      eventId: eventId,
      questionText: questionText,
      isAnonymous: isAnonymous,
    );
  }

  Future<Result<bool>> toggleQuestionUpvote(String questionId) async {
    return _repository.toggleQuestionUpvote(questionId);
  }

  Future<Result<bool>> updateQuestionStatus(String questionId, QuestionStatus status) async {
    return _repository.updateQuestionStatus(questionId, status);
  }

  // ========== Leaderboard Operations ==========

  Future<void> loadLeaderboard(String eventId) async {
    isLoadingLeaderboard = true;
    notifyListeners();

    final results = await Future.wait([
      _repository.getLeaderboard(eventId),
      _repository.getUserLeaderboardEntry(eventId),
    ]);

    if (results[0].isSuccess) {
      leaderboardEntries = results[0].dataOrNull as List<ZoneLeaderboardEntry>? ?? [];
    }
    if (results[1].isSuccess) {
      currentUserLeaderboardEntry = results[1].dataOrNull as ZoneLeaderboardEntry?;
    }

    isLoadingLeaderboard = false;
    notifyListeners();
  }

  // ========== Sponsor Booth Operations ==========

  /// Load sponsor booths for an event
  Future<void> loadSponsorBooths(String eventId) async {
    isLoadingSponsors = true;
    sponsorsError = null;
    notifyListeners();

    final result = await _repository.getSponsorBooths(eventId);
    switch (result) {
      case Success(data: final booths):
        sponsorBooths = booths;
      case Failure(message: final msg):
        sponsorsError = msg;
    }

    isLoadingSponsors = false;
    notifyListeners();
  }

  /// Visit a sponsor booth
  Future<bool> visitBooth(String boothId, String eventId) async {
    final result = await _repository.visitBooth(boothId, eventId);
    switch (result) {
      case Success():
        // Update local state
        final index = sponsorBooths.indexWhere((b) => b.id == boothId);
        if (index >= 0) {
          sponsorBooths[index] = sponsorBooths[index].copyWith(hasVisited: true);
          notifyListeners();
        }
        return true;
      case Failure():
        return false;
    }
  }

  // ========== Challenges Operations ==========

  /// Load active challenges for an event
  Future<void> loadChallenges(String eventId) async {
    isLoadingChallenges = true;
    challengesError = null;
    notifyListeners();

    final results = await Future.wait([
      _repository.getActiveChallenges(eventId),
      _repository.getUserChallengeCompletions(eventId),
    ]);

    switch (results[0]) {
      case Success(data: final challenges):
        activeChallenges = challenges as List<ZoneChallenge>;
      case Failure(message: final msg):
        challengesError = msg;
    }

    switch (results[1]) {
      case Success(data: final completions):
        completedChallenges = completions as List<ZoneChallengeCompletion>;
      case Failure():
        break;
    }

    isLoadingChallenges = false;
    notifyListeners();
  }

  /// Complete a challenge
  Future<int> completeChallenge({
    required String challengeId,
    required String eventId,
    Map<String, dynamic>? proofData,
  }) async {
    final result = await _repository.completeChallenge(
      challengeId: challengeId,
      eventId: eventId,
      proofData: proofData,
    );

    switch (result) {
      case Success(data: final points):
        // Reload challenges to update completion state
        await loadChallenges(eventId);
        // Reload leaderboard to reflect new points
        loadLeaderboard(eventId);
        return points;
      case Failure():
        return 0;
    }
  }

  // ========== Cleanup ==========

  @override
  void dispose() {
    unsubscribeFromEventUpdates();
    stopWatchingStream();
    LiveStreamService.instance.stopAllHeartbeats();
    super.dispose();
  }
}
