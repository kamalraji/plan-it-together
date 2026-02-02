import 'package:flutter/foundation.dart';

/// Comprehensive stats for user profile display
@immutable
class ProfileStats {
  final int impactScore;
  final int eventsAttended;
  final int badgesEarned;
  final int currentStreak;
  final int longestStreak;
  final int followersCount;
  final int followingCount;
  final int postsCount;
  final int upcomingEvents;
  final int savedEvents;

  const ProfileStats({
    this.impactScore = 0,
    this.eventsAttended = 0,
    this.badgesEarned = 0,
    this.currentStreak = 0,
    this.longestStreak = 0,
    this.followersCount = 0,
    this.followingCount = 0,
    this.postsCount = 0,
    this.upcomingEvents = 0,
    this.savedEvents = 0,
  });

  /// @deprecated Use followersCount instead
  @Deprecated('Use followersCount instead')
  int get connectionsCount => followersCount;

  factory ProfileStats.fromMap(Map<String, dynamic> map) {
    return ProfileStats(
      impactScore: map['impact_score'] as int? ?? 0,
      eventsAttended: map['events_attended'] as int? ?? 0,
      badgesEarned: map['badges_earned'] as int? ?? 0,
      currentStreak: map['current_streak'] as int? ?? 0,
      longestStreak: map['longest_streak'] as int? ?? 0,
      followersCount: map['followers_count'] as int? ?? map['connections_count'] as int? ?? 0,
      followingCount: map['following_count'] as int? ?? 0,
      postsCount: map['posts_count'] as int? ?? 0,
      upcomingEvents: map['upcoming_events'] as int? ?? 0,
      savedEvents: map['saved_events'] as int? ?? 0,
    );
  }

  ProfileStats copyWith({
    int? impactScore,
    int? eventsAttended,
    int? badgesEarned,
    int? currentStreak,
    int? longestStreak,
    int? followersCount,
    int? followingCount,
    int? postsCount,
    int? upcomingEvents,
    int? savedEvents,
  }) {
    return ProfileStats(
      impactScore: impactScore ?? this.impactScore,
      eventsAttended: eventsAttended ?? this.eventsAttended,
      badgesEarned: badgesEarned ?? this.badgesEarned,
      currentStreak: currentStreak ?? this.currentStreak,
      longestStreak: longestStreak ?? this.longestStreak,
      followersCount: followersCount ?? this.followersCount,
      followingCount: followingCount ?? this.followingCount,
      postsCount: postsCount ?? this.postsCount,
      upcomingEvents: upcomingEvents ?? this.upcomingEvents,
      savedEvents: savedEvents ?? this.savedEvents,
    );
  }
}
