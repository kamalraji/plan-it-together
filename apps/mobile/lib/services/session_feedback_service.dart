import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/services/logging_service.dart';

/// Service for managing session feedback
class SessionFeedbackService {
  static final SessionFeedbackService instance = SessionFeedbackService._();
  SessionFeedbackService._();

  static final _log = LoggingService.instance;
  static const String _tag = 'SessionFeedbackService';

  /// Submit feedback for a session
  Future<bool> submitFeedback({
    required String sessionId,
    required int overallRating,
    int? contentRating,
    int? speakerRating,
    List<String>? quickTags,
    String? feedbackText,
    bool? wouldRecommend,
    bool showToSpeaker = true,
  }) async {
    try {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      await SupabaseConfig.client.from('session_feedback').upsert({
        'session_id': sessionId,
        'user_id': userId,
        'overall_rating': overallRating,
        'content_rating': contentRating,
        'speaker_rating': speakerRating,
        'quick_tags': quickTags,
        'feedback_text': feedbackText,
        'would_recommend': wouldRecommend,
        'show_to_speaker': showToSpeaker,
      }, onConflict: 'session_id,user_id');

      _log.info('Submitted session feedback for: $sessionId', tag: _tag);
      return true;
    } catch (e) {
      _log.error('Failed to submit feedback: $e', tag: _tag);
      return false;
    }
  }

  /// Get user's feedback for a session
  Future<SessionFeedback?> getUserFeedback(String sessionId) async {
    try {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return null;

      final response = await SupabaseConfig.client
          .from('session_feedback')
          .select()
          .eq('session_id', sessionId)
          .eq('user_id', userId)
          .maybeSingle();

      if (response == null) return null;
      return SessionFeedback.fromJson(response);
    } catch (e) {
      _log.error('Failed to get user feedback: $e', tag: _tag);
      return null;
    }
  }

  /// Check if user has submitted feedback for a session
  Future<bool> hasFeedback(String sessionId) async {
    final feedback = await getUserFeedback(sessionId);
    return feedback != null;
  }

  /// Get feedback stats for a session (for organizers)
  Future<SessionFeedbackStats?> getFeedbackStats(String sessionId) async {
    try {
      final response = await SupabaseConfig.client
          .from('session_feedback')
          .select('overall_rating, content_rating, speaker_rating, would_recommend')
          .eq('session_id', sessionId);

      if ((response as List).isEmpty) return null;

      final ratings = response.cast<Map<String, dynamic>>();
      
      double avgOverall = 0;
      double avgContent = 0;
      double avgSpeaker = 0;
      int contentCount = 0;
      int speakerCount = 0;
      int recommendYes = 0;
      int recommendNo = 0;

      for (final r in ratings) {
        avgOverall += (r['overall_rating'] as int?) ?? 0;
        if (r['content_rating'] != null) {
          avgContent += r['content_rating'] as int;
          contentCount++;
        }
        if (r['speaker_rating'] != null) {
          avgSpeaker += r['speaker_rating'] as int;
          speakerCount++;
        }
        if (r['would_recommend'] == true) recommendYes++;
        if (r['would_recommend'] == false) recommendNo++;
      }

      return SessionFeedbackStats(
        totalResponses: ratings.length,
        averageOverallRating: avgOverall / ratings.length,
        averageContentRating: contentCount > 0 ? avgContent / contentCount : null,
        averageSpeakerRating: speakerCount > 0 ? avgSpeaker / speakerCount : null,
        recommendPercentage: recommendYes + recommendNo > 0
            ? (recommendYes / (recommendYes + recommendNo)) * 100
            : null,
      );
    } catch (e) {
      _log.error('Failed to get feedback stats: $e', tag: _tag);
      return null;
    }
  }

  /// Get all feedback for a session (for organizers)
  Future<List<SessionFeedback>> getAllFeedback(String sessionId) async {
    try {
      final response = await SupabaseConfig.client
          .from('session_feedback')
          .select()
          .eq('session_id', sessionId)
          .order('created_at', ascending: false);

      return (response as List)
          .map((json) => SessionFeedback.fromJson(json))
          .toList();
    } catch (e) {
      _log.error('Failed to get all feedback: $e', tag: _tag);
      return [];
    }
  }
}

/// Session feedback model
class SessionFeedback {
  final String id;
  final String sessionId;
  final String userId;
  final int overallRating;
  final int? contentRating;
  final int? speakerRating;
  final List<String> quickTags;
  final String? feedbackText;
  final bool? wouldRecommend;
  final bool showToSpeaker;
  final DateTime createdAt;

  SessionFeedback({
    required this.id,
    required this.sessionId,
    required this.userId,
    required this.overallRating,
    this.contentRating,
    this.speakerRating,
    required this.quickTags,
    this.feedbackText,
    this.wouldRecommend,
    required this.showToSpeaker,
    required this.createdAt,
  });

  factory SessionFeedback.fromJson(Map<String, dynamic> json) {
    return SessionFeedback(
      id: json['id'] as String,
      sessionId: json['session_id'] as String,
      userId: json['user_id'] as String,
      overallRating: json['overall_rating'] as int,
      contentRating: json['content_rating'] as int?,
      speakerRating: json['speaker_rating'] as int?,
      quickTags: (json['quick_tags'] as List<dynamic>?)?.cast<String>() ?? [],
      feedbackText: json['feedback_text'] as String?,
      wouldRecommend: json['would_recommend'] as bool?,
      showToSpeaker: json['show_to_speaker'] as bool? ?? true,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}

/// Session feedback statistics
class SessionFeedbackStats {
  final int totalResponses;
  final double averageOverallRating;
  final double? averageContentRating;
  final double? averageSpeakerRating;
  final double? recommendPercentage;

  SessionFeedbackStats({
    required this.totalResponses,
    required this.averageOverallRating,
    this.averageContentRating,
    this.averageSpeakerRating,
    this.recommendPercentage,
  });
}
