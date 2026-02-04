import 'package:flutter/material.dart';

/// Zone navigation sections for inside-zone experience
enum ZoneSection {
  schedule('Schedule', Icons.calendar_today_rounded, 'schedule'),
  networking('People', Icons.people_rounded, 'networking'),
  polls('Polls', Icons.poll_rounded, 'polls'),
  qa('Q&A', Icons.question_answer_rounded, 'qa'),
  announcements('Updates', Icons.campaign_rounded, 'announcements'),
  leaderboard('Leaderboard', Icons.leaderboard_rounded, 'leaderboard'),
  materials('Resources', Icons.folder_rounded, 'materials'),
  circles('Circles', Icons.group_work_rounded, 'circles'),
  icebreaker('Icebreaker', Icons.wb_sunny_rounded, 'icebreaker'),
  sponsors('Sponsors', Icons.storefront_rounded, 'sponsors'),
  challenges('Challenges', Icons.emoji_events_rounded, 'challenges'),
  activity('Activity', Icons.timeline_rounded, 'activity');

  const ZoneSection(this.label, this.icon, this.id);
  
  final String label;
  final IconData icon;
  final String id;

  /// Parse from URL section parameter
  static ZoneSection? fromId(String? id) {
    if (id == null) return null;
    for (final section in values) {
      if (section.id == id.toLowerCase()) {
        return section;
      }
    }
    return null;
  }

  /// Get color for this section based on theme
  Color getColor(ColorScheme cs) {
    switch (this) {
      case ZoneSection.schedule:
        return cs.primary;
      case ZoneSection.networking:
        return cs.tertiary;
      case ZoneSection.polls:
        return cs.secondary;
      case ZoneSection.qa:
        return Colors.orange;
      case ZoneSection.announcements:
        return Colors.redAccent;
      case ZoneSection.leaderboard:
        return Colors.amber;
      case ZoneSection.materials:
        return Colors.teal;
      case ZoneSection.circles:
        return Colors.purple;
      case ZoneSection.icebreaker:
        return Colors.cyan;
      case ZoneSection.sponsors:
        return Colors.indigo;
      case ZoneSection.challenges:
        return Colors.deepOrange;
      case ZoneSection.activity:
        return Colors.teal;
    }
  }
}
