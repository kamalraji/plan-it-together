import 'package:flutter/material.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/utils/icon_mappings.dart';
import 'package:thittam1hub/widgets/zone/hackathon_zone_card.dart';
import 'package:thittam1hub/widgets/zone/conference_zone_card.dart';
import 'package:thittam1hub/widgets/zone/workshop_zone_card.dart';
import 'package:thittam1hub/widgets/zone/networking_zone_card.dart';
import 'package:thittam1hub/widgets/zone/competition_zone_card.dart';

/// Zone-specific features available for different event categories
enum ZoneFeature {
  // Hackathon specific
  teamFinder,
  submissionTracker,
  mentorBooking,
  judgingSchedule,
  
  // Conference specific
  multiTrackSchedule,
  sponsorBooths,
  speakerMeetup,
  
  // Workshop specific
  materials,
  handsonTimer,
  qaQueue,
  
  // Competition specific
  leaderboard,
  roundTracker,
  liveScoring,
  
  // Networking specific
  speedNetworking,
  iceBreakers,
  contactExchange,
  
  // Cultural specific
  stageMap,
  foodZones,
  photoSpots,
  
  // Common
  networking,
  polls,
  announcements,
  sessions,
}

/// Configuration for category-specific Zone features
class ZoneCategoryFeatures {
  /// Get the dedicated zone card widget for a category
  static Widget? getZoneCardWidget(EventCategory? category, String eventId) {
    if (category == null) return null;
    
    switch (category) {
      // Hackathon events
      case EventCategory.HACKATHON:
        return HackathonZoneCard(eventId: eventId);
      
      // Conference/Summit events
      case EventCategory.CONFERENCE:
      case EventCategory.SUMMIT:
        return ConferenceZoneCard(eventId: eventId);
      
      // Workshop/Training events
      case EventCategory.WORKSHOP:
      case EventCategory.BOOTCAMP:
      case EventCategory.TRAINING:
        return WorkshopZoneCard(eventId: eventId);
      
      // Networking/Meetup events
      case EventCategory.MEETUP:
      case EventCategory.NETWORKING:
      case EventCategory.SOCIAL_GATHERING:
        return NetworkingZoneCard(eventId: eventId);
      
      // Competition/Quiz events
      case EventCategory.COMPETITION:
      case EventCategory.QUIZ:
      case EventCategory.DEBATE:
        return CompetitionZoneCard(eventId: eventId);
      
      // Career events - use networking
      case EventCategory.CAREER_FAIR:
        return NetworkingZoneCard(eventId: eventId);
      
      // Hiring challenges - use competition
      case EventCategory.HIRING_CHALLENGE:
        return CompetitionZoneCard(eventId: eventId);
      
      default:
        return null;
    }
  }
  
  /// Check if category has a dedicated zone card
  static bool hasDedicatedZoneCard(EventCategory? category) {
    if (category == null) return false;
    
    return [
      EventCategory.HACKATHON,
      EventCategory.CONFERENCE,
      EventCategory.SUMMIT,
      EventCategory.WORKSHOP,
      EventCategory.BOOTCAMP,
      EventCategory.TRAINING,
      EventCategory.MEETUP,
      EventCategory.NETWORKING,
      EventCategory.SOCIAL_GATHERING,
      EventCategory.COMPETITION,
      EventCategory.QUIZ,
      EventCategory.DEBATE,
      EventCategory.CAREER_FAIR,
      EventCategory.HIRING_CHALLENGE,
    ].contains(category);
  }
  
  /// Get available zone features for a category
  static List<ZoneFeature> getFeaturesForCategory(EventCategory? category) {
    if (category == null) {
      return _defaultFeatures;
    }
    
    switch (category) {
      // Tech & Competition Events
      case EventCategory.HACKATHON:
        return [
          ZoneFeature.teamFinder,
          ZoneFeature.submissionTracker,
          ZoneFeature.mentorBooking,
          ZoneFeature.judgingSchedule,
          ZoneFeature.announcements,
          ZoneFeature.networking,
        ];
        
      case EventCategory.HIRING_CHALLENGE:
        return [
          ZoneFeature.roundTracker,
          ZoneFeature.leaderboard,
          ZoneFeature.mentorBooking,
          ZoneFeature.announcements,
        ];
        
      case EventCategory.QUIZ:
      case EventCategory.COMPETITION:
      case EventCategory.DEBATE:
        return [
          ZoneFeature.leaderboard,
          ZoneFeature.roundTracker,
          ZoneFeature.liveScoring,
          ZoneFeature.announcements,
        ];
        
      // Learning Events
      case EventCategory.CONFERENCE:
      case EventCategory.SUMMIT:
        return [
          ZoneFeature.multiTrackSchedule,
          ZoneFeature.sponsorBooths,
          ZoneFeature.speakerMeetup,
          ZoneFeature.networking,
          ZoneFeature.polls,
          ZoneFeature.announcements,
        ];
        
      case EventCategory.WORKSHOP:
      case EventCategory.BOOTCAMP:
      case EventCategory.TRAINING:
        return [
          ZoneFeature.materials,
          ZoneFeature.handsonTimer,
          ZoneFeature.qaQueue,
          ZoneFeature.sessions,
          ZoneFeature.announcements,
        ];
        
      case EventCategory.WEBINAR:
      case EventCategory.SEMINAR:
      case EventCategory.LECTURE:
        return [
          ZoneFeature.qaQueue,
          ZoneFeature.polls,
          ZoneFeature.materials,
          ZoneFeature.announcements,
        ];
        
      // Networking Events
      case EventCategory.MEETUP:
      case EventCategory.NETWORKING:
      case EventCategory.SOCIAL_GATHERING:
        return [
          ZoneFeature.speedNetworking,
          ZoneFeature.iceBreakers,
          ZoneFeature.contactExchange,
          ZoneFeature.networking,
          ZoneFeature.announcements,
        ];
        
      case EventCategory.CAREER_FAIR:
        return [
          ZoneFeature.sponsorBooths,
          ZoneFeature.speedNetworking,
          ZoneFeature.contactExchange,
          ZoneFeature.announcements,
        ];
        
      // Startup Events
      case EventCategory.STARTUP_PITCH:
      case EventCategory.DEMO_DAY:
        return [
          ZoneFeature.sessions,
          ZoneFeature.judgingSchedule,
          ZoneFeature.networking,
          ZoneFeature.sponsorBooths,
          ZoneFeature.announcements,
        ];
        
      // Exhibition Events
      case EventCategory.EXPO:
      case EventCategory.TRADE_SHOW:
      case EventCategory.EXHIBITION:
        return [
          ZoneFeature.sponsorBooths,
          ZoneFeature.stageMap,
          ZoneFeature.networking,
          ZoneFeature.announcements,
        ];
        
      // Cultural & Entertainment Events
      case EventCategory.CULTURAL_FEST:
      case EventCategory.FESTIVAL:
        return [
          ZoneFeature.stageMap,
          ZoneFeature.foodZones,
          ZoneFeature.photoSpots,
          ZoneFeature.sessions,
          ZoneFeature.announcements,
        ];
        
      case EventCategory.CONCERT:
        return [
          ZoneFeature.stageMap,
          ZoneFeature.foodZones,
          ZoneFeature.photoSpots,
          ZoneFeature.announcements,
        ];
        
      case EventCategory.GALA:
      case EventCategory.AWARDS_CEREMONY:
        return [
          ZoneFeature.sessions,
          ZoneFeature.networking,
          ZoneFeature.photoSpots,
          ZoneFeature.announcements,
        ];
        
      // Corporate Events
      case EventCategory.TOWN_HALL:
      case EventCategory.PANEL_DISCUSSION:
        return [
          ZoneFeature.sessions,
          ZoneFeature.polls,
          ZoneFeature.qaQueue,
          ZoneFeature.announcements,
        ];
        
      case EventCategory.TEAM_BUILDING:
      case EventCategory.OFFSITE:
        return [
          ZoneFeature.sessions,
          ZoneFeature.iceBreakers,
          ZoneFeature.photoSpots,
          ZoneFeature.announcements,
        ];
        
      // Charity Events
      case EventCategory.FUNDRAISER:
      case EventCategory.CHARITY_EVENT:
      case EventCategory.VOLUNTEER_DRIVE:
      case EventCategory.AWARENESS_CAMPAIGN:
        return [
          ZoneFeature.sessions,
          ZoneFeature.networking,
          ZoneFeature.announcements,
        ];
        
      // Academic Events
      case EventCategory.SYMPOSIUM:
        return [
          ZoneFeature.multiTrackSchedule,
          ZoneFeature.sessions,
          ZoneFeature.networking,
          ZoneFeature.announcements,
        ];
        
      case EventCategory.ORIENTATION:
      case EventCategory.ALUMNI_MEET:
        return [
          ZoneFeature.sessions,
          ZoneFeature.networking,
          ZoneFeature.iceBreakers,
          ZoneFeature.announcements,
        ];
        
      // Sports Events
      case EventCategory.SPORTS_EVENT:
        return [
          ZoneFeature.leaderboard,
          ZoneFeature.liveScoring,
          ZoneFeature.stageMap,
          ZoneFeature.announcements,
        ];
        
      // Product Events
      case EventCategory.PRODUCT_LAUNCH:
        return [
          ZoneFeature.sessions,
          ZoneFeature.networking,
          ZoneFeature.photoSpots,
          ZoneFeature.announcements,
        ];
        
      case EventCategory.OTHER:
      default:
        return _defaultFeatures;
    }
  }
  
  static const List<ZoneFeature> _defaultFeatures = [
    ZoneFeature.sessions,
    ZoneFeature.networking,
    ZoneFeature.polls,
    ZoneFeature.announcements,
  ];
  
  /// Get display name for a zone feature
  static String getFeatureName(ZoneFeature feature) {
    switch (feature) {
      case ZoneFeature.teamFinder:
        return 'Find Team';
      case ZoneFeature.submissionTracker:
        return 'Submissions';
      case ZoneFeature.mentorBooking:
        return 'Book Mentor';
      case ZoneFeature.judgingSchedule:
        return 'Judging';
      case ZoneFeature.multiTrackSchedule:
        return 'Tracks';
      case ZoneFeature.sponsorBooths:
        return 'Sponsors';
      case ZoneFeature.speakerMeetup:
        return 'Meet Speakers';
      case ZoneFeature.materials:
        return 'Materials';
      case ZoneFeature.handsonTimer:
        return 'Timer';
      case ZoneFeature.qaQueue:
        return 'Q&A';
      case ZoneFeature.leaderboard:
        return 'Leaderboard';
      case ZoneFeature.roundTracker:
        return 'Rounds';
      case ZoneFeature.liveScoring:
        return 'Live Score';
      case ZoneFeature.speedNetworking:
        return 'Speed Meet';
      case ZoneFeature.iceBreakers:
        return 'Ice Breakers';
      case ZoneFeature.contactExchange:
        return 'Exchange';
      case ZoneFeature.stageMap:
        return 'Stage Map';
      case ZoneFeature.foodZones:
        return 'Food';
      case ZoneFeature.photoSpots:
        return 'Photo Spots';
      case ZoneFeature.networking:
        return 'Network';
      case ZoneFeature.polls:
        return 'Polls';
      case ZoneFeature.announcements:
        return 'Updates';
      case ZoneFeature.sessions:
        return 'Sessions';
    }
  }
  
  /// Get icon for a zone feature
  static IconData getFeatureIcon(ZoneFeature feature) {
    switch (feature) {
      case ZoneFeature.teamFinder:
        return Icons.group_add_rounded;
      case ZoneFeature.submissionTracker:
        return Icons.upload_file_rounded;
      case ZoneFeature.mentorBooking:
        return Icons.support_agent_rounded;
      case ZoneFeature.judgingSchedule:
        return Icons.gavel_rounded;
      case ZoneFeature.multiTrackSchedule:
        return Icons.view_timeline_rounded;
      case ZoneFeature.sponsorBooths:
        return Icons.store_rounded;
      case ZoneFeature.speakerMeetup:
        return Icons.record_voice_over_rounded;
      case ZoneFeature.materials:
        return Icons.folder_rounded;
      case ZoneFeature.handsonTimer:
        return Icons.timer_rounded;
      case ZoneFeature.qaQueue:
        return Icons.question_answer_rounded;
      case ZoneFeature.leaderboard:
        return Icons.leaderboard_rounded;
      case ZoneFeature.roundTracker:
        return Icons.format_list_numbered_rounded;
      case ZoneFeature.liveScoring:
        return Icons.scoreboard_rounded;
      case ZoneFeature.speedNetworking:
        return Icons.speed_rounded;
      case ZoneFeature.iceBreakers:
        return Icons.ac_unit_rounded;
      case ZoneFeature.contactExchange:
        return Icons.swap_horiz_rounded;
      case ZoneFeature.stageMap:
        return Icons.map_rounded;
      case ZoneFeature.foodZones:
        return Icons.restaurant_rounded;
      case ZoneFeature.photoSpots:
        return Icons.photo_camera_rounded;
      case ZoneFeature.networking:
        return Icons.connect_without_contact_rounded;
      case ZoneFeature.polls:
        return Icons.poll_rounded;
      case ZoneFeature.announcements:
        return Icons.campaign_rounded;
      case ZoneFeature.sessions:
        return Icons.event_note_rounded;
    }
  }
  
  /// Get the primary category theme color
  static Color getCategoryThemeColor(EventCategory? category) {
    if (category == null) return Colors.blue;
    return IconMappings.getEventCategoryColor(category);
  }
  
  /// Get category-specific tagline for Zone
  static String getCategoryTagline(EventCategory? category) {
    if (category == null) return 'Event Day Hub';
    
    switch (category) {
      case EventCategory.HACKATHON:
        return 'Build • Ship • Win';
      case EventCategory.CONFERENCE:
      case EventCategory.SUMMIT:
        return 'Learn • Connect • Grow';
      case EventCategory.WORKSHOP:
      case EventCategory.BOOTCAMP:
        return 'Hands-on Learning';
      case EventCategory.MEETUP:
      case EventCategory.NETWORKING:
        return 'Meet Your People';
      case EventCategory.QUIZ:
      case EventCategory.COMPETITION:
        return 'Game On!';
      case EventCategory.CULTURAL_FEST:
      case EventCategory.FESTIVAL:
        return 'Celebrate Together';
      case EventCategory.STARTUP_PITCH:
      case EventCategory.DEMO_DAY:
        return 'Pitch • Impress • Fund';
      case EventCategory.CAREER_FAIR:
        return 'Find Your Next Role';
      case EventCategory.CONCERT:
        return 'Feel the Music';
      case EventCategory.SPORTS_EVENT:
        return 'Play to Win';
      default:
        return 'Event Day Hub';
    }
  }
  
  /// Check if a category supports a specific feature
  static bool hasFeature(EventCategory? category, ZoneFeature feature) {
    return getFeaturesForCategory(category).contains(feature);
  }
}
