import 'package:thittam1hub/models/result.dart';
import 'package:thittam1hub/models/session_question.dart';
import 'package:thittam1hub/models/zone_activity.dart';
import 'package:thittam1hub/utils/paginated_result.dart';
import 'package:thittam1hub/config/supabase_config.dart';
import 'package:thittam1hub/services/logging_mixin.dart';
import 'package:thittam1hub/utils/zone_performance_monitor.dart';

/// Repository extension providing cursor-based pagination for high-traffic Zone queries.
/// Optimized for real-time feeds and infinite scroll patterns.
class PaginatedZoneRepository with LoggingMixin {
  @override
  String get logTag => 'PaginatedZoneRepository';

  static final PaginatedZoneRepository _instance = PaginatedZoneRepository._();
  static PaginatedZoneRepository get instance => _instance;
  PaginatedZoneRepository._();

  final _supabase = SupabaseConfig.client;
  final _monitor = ZonePerformanceMonitor.instance;

  // ============= SESSION QUESTIONS (Cursor: created_at) =============

  /// Fetches session questions with cursor-based pagination.
  /// Orders by upvote_count DESC, then created_at DESC for tiebreaker.
  Future<Result<PaginatedResult<SessionQuestion>>> getSessionQuestions(
    String sessionId, {
    PaginationParams params = PaginationParams.defaultParams,
    List<QuestionStatus> statuses = const [QuestionStatus.approved, QuestionStatus.answered],
  }) async {
    return _monitor.measureAsync('getSessionQuestions_paginated', () async {
      try {
        final statusStrings = statuses.map((s) => s.name).toList();
        
        var query = _supabase
            .from('session_questions')
            .select('*, user_profiles!session_questions_user_id_fkey(display_name, avatar_url)')
            .eq('session_id', sessionId)
            .inFilter('status', statusStrings)
            .order('upvote_count', ascending: false)
            .order('created_at', ascending: false);

        // Apply cursor if provided (cursor is the created_at timestamp)
        if (params.cursor != null) {
          query = query.lt('created_at', params.cursor!);
        }

        // Fetch one extra to check if there are more
        final response = await query.limit(params.limit + 1);

        final hasMore = response.length > params.limit;
        final items = (hasMore ? response.take(params.limit) : response)
            .map((json) => SessionQuestion.fromJson(json))
            .toList();

        final nextCursor = hasMore && items.isNotEmpty
            ? items.last.createdAt.toIso8601String()
            : null;

        logDebug('Fetched ${items.length} questions, hasMore: $hasMore');

        return Result.success(PaginatedResult(
          items: items,
          nextCursor: nextCursor,
          hasMore: hasMore,
        ));
      } catch (e, stack) {
        logError('Failed to fetch paginated questions', error: e, stackTrace: stack);
        return Result.failure('Failed to load questions');
      }
    });
  }

  // ============= ACTIVITY FEED (Cursor: created_at) =============

  /// Fetches zone activity feed with cursor-based pagination.
  /// Optimized for infinite scroll in activity feed UI.
  Future<Result<PaginatedResult<ZoneActivity>>> getActivityFeed(
    String eventId, {
    PaginationParams params = PaginationParams.defaultParams,
    List<ZoneActivityType>? filterTypes,
  }) async {
    return _monitor.measureAsync('getActivityFeed_paginated', () async {
      try {
        var query = _supabase
            .from('zone_activity_feed')
            .select()
            .eq('event_id', eventId)
            .order('created_at', ascending: false);

        // Filter by activity types if specified
        if (filterTypes != null && filterTypes.isNotEmpty) {
          final typeStrings = filterTypes.map((t) => t.name).toList();
          query = query.inFilter('activity_type', typeStrings);
        }

        // Apply cursor
        if (params.cursor != null) {
          query = query.lt('created_at', params.cursor!);
        }

        final response = await query.limit(params.limit + 1);

        final hasMore = response.length > params.limit;
        final items = (hasMore ? response.take(params.limit) : response)
            .map((json) => ZoneActivity.fromJson(json))
            .toList();

        final nextCursor = hasMore && items.isNotEmpty
            ? items.last.createdAt.toIso8601String()
            : null;

        logDebug('Fetched ${items.length} activities, hasMore: $hasMore');

        return Result.success(PaginatedResult(
          items: items,
          nextCursor: nextCursor,
          hasMore: hasMore,
        ));
      } catch (e, stack) {
        logError('Failed to fetch paginated activities', error: e, stackTrace: stack);
        return Result.failure('Failed to load activity feed');
      }
    });
  }

  // ============= LEADERBOARD (Cursor: rank) =============

  /// Fetches leaderboard entries with cursor-based pagination.
  /// Uses rank as cursor for consistent ordering.
  Future<Result<PaginatedResult<Map<String, dynamic>>>> getLeaderboard(
    String eventId, {
    PaginationParams params = PaginationParams.defaultParams,
  }) async {
    return _monitor.measureAsync('getLeaderboard_paginated', () async {
      try {
        var query = _supabase
            .from('zone_leaderboard')
            .select('*, user_profiles!zone_leaderboard_user_id_fkey(display_name, avatar_url)')
            .eq('event_id', eventId)
            .order('total_points', ascending: false)
            .order('updated_at', ascending: true); // Tiebreaker: earlier = higher rank

        // For leaderboard, cursor is the rank position
        if (params.cursor != null) {
          final cursorRank = int.tryParse(params.cursor!) ?? 0;
          // Skip to the cursor position using offset (acceptable for leaderboards)
          query = query.range(cursorRank, cursorRank + params.limit);
        } else {
          query = query.limit(params.limit + 1);
        }

        final response = await query;

        final hasMore = response.length > params.limit;
        final items = hasMore 
            ? response.take(params.limit).toList() 
            : response.toList();

        // Next cursor is the current position + items fetched
        final currentOffset = params.cursor != null ? int.parse(params.cursor!) : 0;
        final nextCursor = hasMore ? '${currentOffset + items.length}' : null;

        logDebug('Fetched ${items.length} leaderboard entries, hasMore: $hasMore');

        return Result.success(PaginatedResult(
          items: items.cast<Map<String, dynamic>>(),
          nextCursor: nextCursor,
          hasMore: hasMore,
        ));
      } catch (e, stack) {
        logError('Failed to fetch paginated leaderboard', error: e, stackTrace: stack);
        return Result.failure('Failed to load leaderboard');
      }
    });
  }

  // ============= CHALLENGES (Simple pagination, lower volume) =============

  /// Fetches active challenges - typically low volume, uses simple limit.
  Future<Result<PaginatedResult<Map<String, dynamic>>>> getActiveChallenges(
    String eventId, {
    int limit = 50,
  }) async {
    return _monitor.measureAsync('getActiveChallenges', () async {
      try {
        final now = DateTime.now().toIso8601String();
        
        final response = await _supabase
            .from('zone_challenges')
            .select()
            .eq('event_id', eventId)
            .eq('is_active', true)
            .or('starts_at.is.null,starts_at.lte.$now')
            .or('ends_at.is.null,ends_at.gte.$now')
            .order('points_reward', ascending: false)
            .limit(limit);

        final items = response.cast<Map<String, dynamic>>();

        logDebug('Fetched ${items.length} active challenges');

        return Result.success(PaginatedResult(
          items: items,
          hasMore: false, // Challenges are typically limited
        ));
      } catch (e, stack) {
        logError('Failed to fetch challenges', error: e, stackTrace: stack);
        return Result.failure('Failed to load challenges');
      }
    });
  }

  // ============= SPONSOR BOOTHS (Simple pagination) =============

  /// Fetches sponsor booths for an event.
  Future<Result<PaginatedResult<Map<String, dynamic>>>> getSponsorBooths(
    String eventId, {
    int limit = 30,
  }) async {
    return _monitor.measureAsync('getSponsorBooths', () async {
      try {
        final response = await _supabase
            .from('sponsor_booths')
            .select('*, booth_visits(user_id)')
            .eq('event_id', eventId)
            .eq('is_active', true)
            .order('tier', ascending: true) // Premium tiers first
            .order('name', ascending: true)
            .limit(limit);

        final items = response.cast<Map<String, dynamic>>();

        logDebug('Fetched ${items.length} sponsor booths');

        return Result.success(PaginatedResult(
          items: items,
          hasMore: false,
        ));
      } catch (e, stack) {
        logError('Failed to fetch sponsor booths', error: e, stackTrace: stack);
        return Result.failure('Failed to load sponsor booths');
      }
    });
  }
}
