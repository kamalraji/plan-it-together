import 'package:flutter/material.dart';
import 'package:thittam1hub/models/zone_section.dart';
import 'package:thittam1hub/widgets/zone/sections/zone_sections.dart';
import 'package:thittam1hub/widgets/zone/sections/activity_feed_section.dart';

/// Content router for Zone sections
/// Thin router that delegates to focused section widgets
/// 
/// Refactored from 1,748 lines to ~40 lines.
/// Each section is now in its own file under lib/widgets/zone/sections/
class ZoneSectionContent extends StatelessWidget {
  final ZoneSection section;
  final String eventId;
  final String? initialSessionId;

  const ZoneSectionContent({
    super.key,
    required this.section,
    required this.eventId,
    this.initialSessionId,
  });

  @override
  Widget build(BuildContext context) {
    switch (section) {
      case ZoneSection.schedule:
        return ScheduleSection(eventId: eventId, initialSessionId: initialSessionId);
      case ZoneSection.networking:
        return NetworkingSection(eventId: eventId);
      case ZoneSection.polls:
        return PollsSection(eventId: eventId);
      case ZoneSection.qa:
        return QASection(eventId: eventId);
      case ZoneSection.announcements:
        return AnnouncementsSection(eventId: eventId);
      case ZoneSection.leaderboard:
        return LeaderboardSection(eventId: eventId);
      case ZoneSection.materials:
        return MaterialsSection(eventId: eventId);
      case ZoneSection.circles:
        return CirclesSection(eventId: eventId);
      case ZoneSection.icebreaker:
        return IcebreakerSection(eventId: eventId);
      case ZoneSection.sponsors:
        return SponsorsSection(eventId: eventId);
      case ZoneSection.challenges:
        return ChallengesSection(eventId: eventId);
      case ZoneSection.activity:
        return ActivityFeedSection(eventId: eventId);
    }
  }
}
