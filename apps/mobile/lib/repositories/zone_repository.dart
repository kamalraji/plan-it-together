import 'package:thittam1hub/models/zone_models.dart';
import 'package:thittam1hub/models/zone_team_member.dart';
import 'package:thittam1hub/models/session_feedback.dart';
import 'package:thittam1hub/models/icebreaker_models.dart';
import 'package:thittam1hub/models/session_material.dart';
import 'package:thittam1hub/models/zone_gamification_models.dart';
import 'package:thittam1hub/models/zone_notification_models.dart';
import 'package:thittam1hub/models/paginated_list.dart';
import 'package:thittam1hub/models/session_question.dart';
import 'package:thittam1hub/models/session_bookmark.dart';
import 'package:thittam1hub/models/zone_challenge.dart';
import 'package:thittam1hub/models/sponsor_booth.dart';
import 'package:thittam1hub/models/zone_activity.dart' hide ZoneActivityType;
import 'package:thittam1hub/utils/result.dart';


/// Abstract repository interface for Zone operations
/// This abstraction allows for easy testing and swapping implementations
abstract class ZoneRepository {
  // ========== Event Operations ==========
  
  /// Get events happening today that the user is registered for
  Future<Result<List<ZoneEvent>>> getTodayEvents();
  
  /// Get current active event (user is checked in)
  Future<Result<ZoneEvent?>> getCurrentEvent();
  
  /// Check in to an event
  Future<Result<bool>> checkIn(String eventId, {String? location});
  
  /// Check out from an event
  Future<Result<bool>> checkOut(String eventId);
  
  // ========== Session Operations ==========
  
  /// Get live sessions for an event
  Future<Result<List<EventSession>>> getLiveSessions(String eventId);
  
  /// Get upcoming sessions for an event
  Future<Result<List<EventSession>>> getUpcomingSessions(String eventId, {int limit = 5});
  
  /// Get all sessions for an event (for management)
  Future<Result<List<EventSession>>> getAllSessions(String eventId);
  
  /// Create a new session
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
  });
  
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
  });
  
  /// Delete a session
  Future<Result<bool>> deleteSession(String sessionId);
  
  // ========== Attendee Operations ==========
  
  /// Get nearby attendees at the same event
  Future<Result<List<AttendeeRadar>>> getNearbyAttendees(String eventId, {int limit = 12});
  
  /// Get count of attendees at an event
  Future<Result<int>> getAttendeeCount(String eventId);
  
  // ========== Poll Operations ==========
  
  /// Get active polls for an event with pagination
  Future<Result<PaginatedList<EventPoll>>> getActivePolls(
    String eventId, {
    int page = 0,
    int pageSize = 10,
  });
  
  /// Get all polls for an event (for management) with pagination
  Future<Result<PaginatedList<EventPoll>>> getAllPolls(
    String eventId, {
    int page = 0,
    int pageSize = 20,
  });
  
  /// Submit a vote for a poll
  Future<Result<bool>> submitPollVote(String pollId, String optionId);
  
  /// Create a new poll
  Future<Result<String>> createPoll({
    required String eventId,
    required String question,
    required List<String> options,
    DateTime? expiresAt,
  });
  
  /// Close a poll (set inactive)
  Future<Result<bool>> closePoll(String pollId);
  
  /// Delete a poll
  Future<Result<bool>> deletePoll(String pollId);
  
  // ========== Announcement Operations ==========
  
  /// Get announcements for an event with pagination
  Future<Result<PaginatedList<EventAnnouncement>>> getAnnouncements(
    String eventId, {
    int page = 0,
    int pageSize = 10,
  });
  
  /// Get all announcements for an event (for management)
  Future<Result<List<EventAnnouncement>>> getAllAnnouncements(String eventId);
  
  /// Create an announcement
  Future<Result<String>> createAnnouncement({
    required String eventId,
    required String title,
    required String content,
    String type = 'info',
    bool isPinned = false,
  });
  
  /// Toggle announcement pin status
  Future<Result<bool>> toggleAnnouncementPin(String announcementId, bool isPinned);
  
  /// Delete an announcement
  Future<Result<bool>> deleteAnnouncement(String announcementId);
  
  // ========== Permission Operations ==========
  
  /// Check if current user can manage Zone content for an event
  /// Returns true if user is event owner OR active member of any workspace linked to event
  Future<Result<bool>> canManageZone(String eventId);

  // ========== Team Operations ==========
  
  /// Get team members who have Zone management access for an event
  /// Returns list of active team members from all workspaces linked to the event
  Future<Result<List<ZoneTeamMember>>> getZoneTeamMembers(String eventId);

  // ========== Feedback Operations ==========
  
  /// Submit feedback/rating for a session
  Future<Result<bool>> submitSessionFeedback({
    required String sessionId,
    required String eventId,
    required int overallRating,
    int? contentRating,
    int? speakerRating,
    String? feedbackText,
    bool? wouldRecommend,
  });
  
  /// Get user's feedback for a session (if exists)
  Future<Result<SessionFeedback?>> getUserSessionFeedback(String sessionId);
  
  /// Get rating aggregate for a session
  Future<Result<SessionRatingAggregate?>> getSessionRatingAggregate(String sessionId);
  
  /// Get all feedback for a session (organizer only)
  Future<Result<List<SessionFeedback>>> getSessionFeedbackList(String sessionId);

  // ========== Track Operations ==========
  
  /// Get tracks for an event
  Future<Result<List<EventTrack>>> getEventTracks(String eventId);

  // ========== Icebreaker Operations ==========
  
  /// Get today's icebreaker for an event (with user's answer if exists)
  Future<Result<EventIcebreaker?>> getTodayIcebreaker(String eventId);
  
  /// Get all answers for an icebreaker
  Future<Result<List<IcebreakerAnswer>>> getIcebreakerAnswers(String icebreakerId);
  
  /// Submit or update answer to an icebreaker
  Future<Result<int>> submitIcebreakerAnswer({
    required String icebreakerId,
    required String eventId,
    required String answer,
  });
  
  /// Get user's streak for an event
  Future<Result<int>> getUserIcebreakerStreak(String eventId);

  // ========== Materials Operations ==========
  
  /// Get materials for a session
  Future<Result<List<SessionMaterial>>> getSessionMaterials(String sessionId);
  
  /// Get all materials for an event (for management)
  Future<Result<List<SessionMaterial>>> getEventMaterials(String eventId);
  
  /// Track material download with rich analytics
  Future<Result<void>> trackMaterialDownload(String materialId, {String? eventId, String? sessionId});
  
  /// Create a material
  Future<Result<String>> createMaterial({
    required String sessionId,
    required String eventId,
    required String title,
    String? description,
    required String fileUrl,
    required String fileType,
    int? fileSizeBytes,
    bool isDownloadable = true,
  });
  
  /// Delete a material
  Future<Result<bool>> deleteMaterial(String materialId);

  // ========== Gamification Operations ==========
  
  /// Award points for an activity
  Future<Result<int>> awardPoints({
    required String eventId,
    required ZoneActivityType activityType,
    int? customPoints,
    Map<String, dynamic>? metadata,
  });
  
  /// Get leaderboard for an event
  Future<Result<List<ZoneLeaderboardEntry>>> getLeaderboard(
    String eventId, {
    int limit = 50,
  });
  
  /// Get current user's leaderboard entry
  Future<Result<ZoneLeaderboardEntry?>> getUserLeaderboardEntry(String eventId);
  
  /// Get all available badges
  Future<Result<List<ZoneBadge>>> getAllBadges();
  
  /// Get user's earned badges for an event
  Future<Result<List<ZoneUserBadge>>> getUserBadges(String eventId);
  
  /// Check and award any earned badges
  Future<Result<List<ZoneBadge>>> checkAndAwardBadges(String eventId);
  
  /// Get user's point history for an event
  Future<Result<List<ZonePointActivity>>> getPointHistory(
    String eventId, {
    int limit = 50,
  });

  // ========== Zone Notification Operations ==========
  
  /// Get zone notifications for an event
  Future<Result<List<ZoneNotification>>> getZoneNotifications(
    String eventId, {
    int limit = 50,
  });
  
  /// Get unread notification count
  Future<Result<int>> getZoneNotificationUnreadCount(String eventId);
  
  /// Mark notification as read
  Future<Result<void>> markZoneNotificationRead(String notificationId);
  
  /// Mark all notifications as read
  Future<Result<void>> markAllZoneNotificationsRead(String eventId);
  
  /// Get notification preferences for an event
  Future<Result<ZoneNotificationPreferences?>> getZoneNotificationPreferences(String eventId);
  
  /// Update notification preferences
  Future<Result<void>> updateZoneNotificationPreferences(ZoneNotificationPreferences preferences);
  
  /// Create a zone notification (for internal use)
  Future<Result<void>> createZoneNotification({
    required String eventId,
    required ZoneNotificationType type,
    required String title,
    required String body,
    Map<String, dynamic>? data,
  });

  // ========== Q&A Operations ==========
  
  /// Get questions for a session
  Future<Result<List<SessionQuestion>>> getSessionQuestions(
    String sessionId, {
    bool includeAll = false,
  });
  
  /// Submit a new question
  Future<Result<String>> submitQuestion({
    required String sessionId,
    required String eventId,
    required String questionText,
    bool isAnonymous = false,
  });
  
  /// Upvote a question (toggle)
  Future<Result<bool>> toggleQuestionUpvote(String questionId);
  
  /// Update question status (for moderation)
  Future<Result<bool>> updateQuestionStatus(
    String questionId,
    QuestionStatus status, {
    String? answerText,
  });
  
  /// Delete a question
  Future<Result<bool>> deleteQuestion(String questionId);

  // ========== Session Bookmark Operations ==========
  
  /// Get user's bookmarked sessions for an event
  Future<Result<List<SessionBookmark>>> getSessionBookmarks(String eventId);
  
  /// Bookmark a session
  Future<Result<String>> bookmarkSession({
    required String sessionId,
    required String eventId,
    int? reminderMinutesBefore,
  });
  
  /// Remove a session bookmark
  Future<Result<bool>> removeBookmark(String sessionId);
  
  /// Check if a session is bookmarked
  Future<Result<bool>> isSessionBookmarked(String sessionId);

  // ========== Sponsor Booth Operations ==========
  
  /// Get sponsor booths for an event
  Future<Result<List<SponsorBooth>>> getSponsorBooths(String eventId);
  
  /// Record a booth visit
  Future<Result<bool>> visitBooth(String boothId, String eventId);
  
  /// Check if user has visited a booth
  Future<Result<bool>> hasVisitedBooth(String boothId);

  // ========== Zone Challenge Operations ==========
  
  /// Get active challenges for an event
  Future<Result<List<ZoneChallenge>>> getActiveChallenges(String eventId);
  
  /// Get user's challenge completions for an event
  Future<Result<List<ZoneChallengeCompletion>>> getUserChallengeCompletions(String eventId);
  
  /// Complete a challenge
  Future<Result<int>> completeChallenge({
    required String challengeId,
    required String eventId,
    Map<String, dynamic>? proofData,
  });

  // ========== Activity Feed Operations ==========
  
  /// Get recent activities for an event
  Future<Result<List<ZoneActivity>>> getRecentActivities(
    String eventId, {
    int limit = 20,
  });
}
