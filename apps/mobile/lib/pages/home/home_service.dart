import 'package:flutter/foundation.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/supabase/gamification_service.dart';

import 'package:thittam1hub/services/logging_service.dart';

class StreakData {
  final int streakCount;
  final int actionsToday;
  final bool completedToday;
  final DateTime? lastStreakDate;

  StreakData({
    required this.streakCount,
    required this.actionsToday,
    required this.completedToday,
    this.lastStreakDate,
  });

  factory StreakData.fromMap(Map<String, dynamic> map) {
    final actionsToday = map['streak_actions_today'] as int? ?? 0;
    return StreakData(
      streakCount: map['streak_count'] as int? ?? 0,
      actionsToday: actionsToday,
      completedToday: actionsToday >= 1,
      lastStreakDate: map['last_streak_date'] != null 
          ? DateTime.tryParse(map['last_streak_date'].toString())
          : null,
    );
  }
}

class StoryItem {
  final String id;
  final StoryType type;
  final String title;
  final String? avatarUrl;
  final bool isLive;
  final int? participantCount;
  final int? matchScore; // optional match score for discover people

  StoryItem({
    required this.id,
    required this.type,
    required this.title,
    this.avatarUrl,
    this.isLive = false,
    this.participantCount,
    this.matchScore,
  });
}

enum StoryType {
  dailyMission,
  liveSpace,
  activeGame,
  onlineFollowing, // Renamed from onlineConnection
  discoverPeople,
  videoStory, // User video stories
}

class HomeService {
  static const String _tag = 'HomeService';
  static final _log = LoggingService.instance;
  
  final _supabase = SupabaseConfig.client;
  final GamificationService _gamificationService = GamificationService.instance;

  /// Get current user's streak data
  Future<StreakData?> getStreakData() async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return null;

      final response = await _supabase
          .from('impact_profiles')
          .select('streak_count, streak_actions_today, last_streak_date')
          .eq('user_id', userId)
          .maybeSingle();

      if (response == null) return null;
      return StreakData.fromMap(response);
    } catch (e) {
      _log.error('Error fetching streak data: $e', tag: _tag);
      return null;
    }
  }

  /// Get stories data (missions, live spaces, active games, online followers)
  Future<List<StoryItem>> getStoriesData() async {
    try {
      final List<StoryItem> stories = [];
      final userId = _supabase.auth.currentUser?.id;

      // Add daily mission as first item
      stories.add(StoryItem(
        id: 'daily_mission',
        type: StoryType.dailyMission,
        title: 'Daily Mission',
        isLive: true,
      ));

      // Fetch live spaces
      try {
        final spacesResponse = await _supabase
            .from('spaces')
            .select('id, title, host_avatar_url, is_live')
            .eq('is_live', true)
            .limit(5);

        for (final space in spacesResponse) {
          stories.add(StoryItem(
            id: space['id'] as String,
            type: StoryType.liveSpace,
            title: space['title'] as String? ?? 'Live Space',
            avatarUrl: space['host_avatar_url'] as String?,
            isLive: true,
          ));
        }
      } catch (e) {
        _log.error('Error fetching live spaces: $e', tag: _tag);
      }

      // Fetch active games
      try {
        final game = await _gamificationService.getActiveQuickMatch();
        if (game != null) {
          stories.add(StoryItem(
            id: game.id,
            type: StoryType.activeGame,
            title: game.name,
            participantCount: game.participantCount,
          ));
        }
      } catch (e) {
        _log.error('Error fetching active games: $e', tag: _tag);
      }

      // Fetch online followers
      if (userId != null) {
        try {
          final connectionsResponse = await _supabase
              .from('impact_profiles')
              .select('id, full_name, avatar_url, is_online')
              .eq('is_online', true)
              .neq('user_id', userId)
              .limit(20);

          for (final conn in connectionsResponse) {
            stories.add(StoryItem(
              id: conn['id'] as String,
              type: StoryType.onlineFollowing,
              title: conn['full_name'] as String? ?? 'User',
              avatarUrl: conn['avatar_url'] as String?,
            ));
          }
        } catch (e) {
          _log.error('Error fetching online followers: $e', tag: _tag);
        }
      }

      return stories;
    } catch (e) {
      _log.error('Error fetching stories data: $e', tag: _tag);
      return [];
    }
  }

  /// Get trending tags from spark posts
  Future<List<String>> getTrendingTags() async {
    try {
      final response = await _supabase
          .from('spark_posts')
          .select('tags')
          .gte('created_at', DateTime.now().subtract(Duration(hours: 24)).toIso8601String())
          .limit(50);

      final Map<String, int> tagCounts = {};
      for (final row in response) {
        final tags = row['tags'] as List<dynamic>?;
        if (tags != null) {
          for (final tag in tags) {
            final tagStr = tag.toString();
            tagCounts[tagStr] = (tagCounts[tagStr] ?? 0) + 1;
          }
        }
      }

      final sortedTags = tagCounts.entries.toList()
        ..sort((a, b) => b.value.compareTo(a.value));

      return sortedTags.take(10).map((e) => e.key).toList();
    } catch (e) {
      _log.error('Error fetching trending tags: $e', tag: _tag);
      return [];
    }
  }

  /// Get active polls (quick polls)
  Future<List<VibeGameItem>> getActivePolls() async {
    try {
      final quick = await _gamificationService.getActiveQuickMatch();
      if (quick != null) {
        return [quick];
      }
      return [];
    } catch (e) {
      _log.error('Error fetching active polls: $e', tag: _tag);
      return [];
    }
  }

  /// Submit poll vote
  Future<void> submitPollVote(String pollId, int optionIndex) async {
    try {
      await _gamificationService.submitQuickMatch(
        gameId: pollId,
        optionIndex: optionIndex,
      );
    } catch (e) {
      _log.error('Error submitting poll vote: $e', tag: _tag);
    }
  }

  /// Complete a streak action (updates streak count)
  Future<void> completeStreakAction() async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return;

      await _supabase.rpc('update_user_streak', params: {'user_uuid': userId});
    } catch (e) {
      _log.error('Error completing streak action: $e', tag: _tag);
    }
  }

  /// Record a streak action (called when user posts, reacts, etc.)
  Future<void> recordStreakAction() async {
    await completeStreakAction();
  }
}
