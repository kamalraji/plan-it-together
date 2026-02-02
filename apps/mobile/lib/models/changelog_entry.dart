import 'package:flutter/material.dart';

/// Category of a changelog entry
enum ChangelogCategory {
  newFeature('New', Colors.green, Icons.new_releases_rounded),
  improved('Improved', Colors.blue, Icons.trending_up_rounded),
  fixed('Fixed', Colors.orange, Icons.build_rounded),
  security('Security', Colors.red, Icons.security_rounded);

  const ChangelogCategory(this.label, this.color, this.icon);
  final String label;
  final Color color;
  final IconData icon;
}

/// A single changelog entry
class ChangelogEntry {
  final String id;
  final String title;
  final String? description;
  final ChangelogCategory category;
  final IconData? customIcon;
  final bool isHighlight;

  const ChangelogEntry({
    required this.id,
    required this.title,
    this.description,
    required this.category,
    this.customIcon,
    this.isHighlight = false,
  });

  IconData get icon => customIcon ?? category.icon;
}

/// A version with its changelog entries
class ChangelogVersion {
  final String version;
  final DateTime releaseDate;
  final String? summary;
  final List<ChangelogEntry> entries;

  const ChangelogVersion({
    required this.version,
    required this.releaseDate,
    this.summary,
    required this.entries,
  });
}

/// Static changelog data
class AppChangelog {
  static final List<ChangelogVersion> versions = [
    ChangelogVersion(
      version: '1.1.0',
      releaseDate: DateTime(2026, 1, 27),
      summary: 'Major engagement features and premium polish',
      entries: [
        const ChangelogEntry(
          id: 'icebreakers',
          title: 'Live Icebreakers',
          description: 'Daily questions to spark conversations at events. Like and view prompts in real-time.',
          category: ChangelogCategory.newFeature,
          customIcon: Icons.celebration_rounded,
          isHighlight: true,
        ),
        const ChangelogEntry(
          id: 'activity_feed',
          title: 'Activity Feed',
          description: 'Real-time event activity stream showing check-ins, poll votes, and more.',
          category: ChangelogCategory.newFeature,
          customIcon: Icons.rss_feed_rounded,
          isHighlight: true,
        ),
        const ChangelogEntry(
          id: 'session_feedback',
          title: 'Session Feedback',
          description: 'Rate sessions and provide detailed feedback to speakers.',
          category: ChangelogCategory.newFeature,
          customIcon: Icons.rate_review_rounded,
        ),
        const ChangelogEntry(
          id: 'account_unlinking',
          title: 'OAuth Account Management',
          description: 'Connect and disconnect social accounts from your profile with safety checks.',
          category: ChangelogCategory.improved,
        ),
        const ChangelogEntry(
          id: 'premium_animations',
          title: 'Premium Animations',
          description: 'Staggered lists, micro-interactions, and smooth transitions throughout the app.',
          category: ChangelogCategory.improved,
          customIcon: Icons.animation_rounded,
        ),
        const ChangelogEntry(
          id: 'qa_realtime',
          title: 'Real-time Q&A',
          description: 'Questions and upvotes update instantly without refreshing.',
          category: ChangelogCategory.improved,
        ),
      ],
    ),
    ChangelogVersion(
      version: '1.0.1',
      releaseDate: DateTime(2026, 1, 15),
      summary: 'Bug fixes and stability improvements',
      entries: [
        const ChangelogEntry(
          id: 'chat_scroll_fix',
          title: 'Chat Scroll Performance',
          description: 'Fixed lag when scrolling through long chat histories.',
          category: ChangelogCategory.fixed,
        ),
        const ChangelogEntry(
          id: 'notification_timing',
          title: 'Notification Timing',
          description: 'Session reminders now fire at the correct time.',
          category: ChangelogCategory.fixed,
        ),
        const ChangelogEntry(
          id: 'auth_token_refresh',
          title: 'Token Refresh',
          description: 'Improved handling of expired authentication tokens.',
          category: ChangelogCategory.security,
        ),
      ],
    ),
    ChangelogVersion(
      version: '1.0.0',
      releaseDate: DateTime(2026, 1, 1),
      summary: 'Initial release',
      entries: [
        const ChangelogEntry(
          id: 'initial_release',
          title: 'Thittam1Hub Launch',
          description: 'Event discovery, registration, networking, and Zone features.',
          category: ChangelogCategory.newFeature,
          customIcon: Icons.rocket_launch_rounded,
          isHighlight: true,
        ),
        const ChangelogEntry(
          id: 'messaging',
          title: 'Direct Messaging',
          description: 'Connect with other attendees through private and group chats.',
          category: ChangelogCategory.newFeature,
          customIcon: Icons.chat_rounded,
        ),
        const ChangelogEntry(
          id: 'circles',
          title: 'Interest Circles',
          description: 'Join communities based on shared interests.',
          category: ChangelogCategory.newFeature,
          customIcon: Icons.group_rounded,
        ),
        const ChangelogEntry(
          id: 'schedule',
          title: 'Personal Schedule',
          description: 'Build and track your personalized event agenda.',
          category: ChangelogCategory.newFeature,
          customIcon: Icons.calendar_today_rounded,
        ),
      ],
    ),
  ];

  /// Get the latest version
  static ChangelogVersion get latest => versions.first;

  /// Get all highlight entries across versions
  static List<ChangelogEntry> get highlights =>
      versions.expand((v) => v.entries.where((e) => e.isHighlight)).toList();
}
