import 'package:flutter/foundation.dart';
import '../models/models.dart';

import 'package:thittam1hub/services/logging_service.dart';
/// Utility class for event category operations.
/// 
/// Provides centralized parsing, validation, and grouping utilities
/// for [EventCategory] enum values that mirror the Supabase database.
class CategoryUtils {
  // Logging
   static final _log = LoggingService.instance;
   static const String _tag = 'for';

  CategoryUtils._();
  
  /// All valid category names from database (41 categories).
  /// Must stay in sync with the `event_category` enum in Supabase.
  static const Set<String> validCategoryNames = {
    'HACKATHON', 'BOOTCAMP', 'WORKSHOP', 'CONFERENCE', 'MEETUP',
    'STARTUP_PITCH', 'HIRING_CHALLENGE', 'WEBINAR', 'COMPETITION',
    'OTHER', 'SEMINAR', 'SYMPOSIUM', 'CULTURAL_FEST', 'SPORTS_EVENT',
    'ORIENTATION', 'ALUMNI_MEET', 'CAREER_FAIR', 'LECTURE', 'QUIZ',
    'DEBATE', 'PRODUCT_LAUNCH', 'TOWN_HALL', 'TEAM_BUILDING', 'TRAINING',
    'AWARDS_CEREMONY', 'OFFSITE', 'NETWORKING', 'TRADE_SHOW', 'EXPO',
    'SUMMIT', 'PANEL_DISCUSSION', 'DEMO_DAY', 'FUNDRAISER', 'GALA',
    'CHARITY_EVENT', 'VOLUNTEER_DRIVE', 'AWARENESS_CAMPAIGN', 'CONCERT',
    'EXHIBITION', 'FESTIVAL', 'SOCIAL_GATHERING',
  };
  
  /// Parse category string to enum with optional fallback.
  /// 
  /// Returns [fallback] if the string is null, empty, or not a valid category.
  /// Logs unknown categories in debug mode when [logUnknown] is true.
  static EventCategory? parse(String? categoryString, {
    EventCategory? fallback,
    bool logUnknown = true,
  }) {
    if (categoryString == null || categoryString.isEmpty) {
      return fallback;
    }
    
    final upper = categoryString.toUpperCase().trim();
    
    try {
      return EventCategory.values.firstWhere((e) => e.name == upper);
    } catch (_) {
      if (logUnknown && kDebugMode) {
        _log.debug('CategoryUtils: Unknown category "$categoryString"', tag: _tag);
      }
      return fallback;
    }
  }
  
  /// Validate if a string is a valid category name.
  static bool isValid(String? categoryString) {
    if (categoryString == null) return false;
    return validCategoryNames.contains(categoryString.toUpperCase().trim());
  }
  
  /// Get category groups for filtering UI.
  /// 
  /// Categories are organized into logical groups for better UX
  /// in filter sheets and category selection components.
  static Map<String, List<EventCategory>> get groupedCategories => {
    'Tech & Learning': [
      EventCategory.HACKATHON,
      EventCategory.BOOTCAMP,
      EventCategory.WORKSHOP,
      EventCategory.WEBINAR,
      EventCategory.SEMINAR,
      EventCategory.LECTURE,
      EventCategory.TRAINING,
      EventCategory.SYMPOSIUM,
    ],
    'Professional': [
      EventCategory.CONFERENCE,
      EventCategory.MEETUP,
      EventCategory.NETWORKING,
      EventCategory.CAREER_FAIR,
      EventCategory.SUMMIT,
      EventCategory.PANEL_DISCUSSION,
      EventCategory.TOWN_HALL,
      EventCategory.TEAM_BUILDING,
      EventCategory.OFFSITE,
      EventCategory.TRADE_SHOW,
      EventCategory.EXPO,
    ],
    'Startup & Innovation': [
      EventCategory.STARTUP_PITCH,
      EventCategory.DEMO_DAY,
      EventCategory.PRODUCT_LAUNCH,
      EventCategory.HIRING_CHALLENGE,
    ],
    'Academic': [
      EventCategory.COMPETITION,
      EventCategory.QUIZ,
      EventCategory.DEBATE,
      EventCategory.ORIENTATION,
      EventCategory.ALUMNI_MEET,
    ],
    'Cultural': [
      EventCategory.CULTURAL_FEST,
      EventCategory.SPORTS_EVENT,
      EventCategory.CONCERT,
      EventCategory.EXHIBITION,
      EventCategory.FESTIVAL,
    ],
    'Social': [
      EventCategory.SOCIAL_GATHERING,
      EventCategory.AWARDS_CEREMONY,
      EventCategory.GALA,
    ],
    'Charity': [
      EventCategory.FUNDRAISER,
      EventCategory.CHARITY_EVENT,
      EventCategory.VOLUNTEER_DRIVE,
      EventCategory.AWARENESS_CAMPAIGN,
    ],
    'Other': [
      EventCategory.OTHER,
    ],
  };
  
  /// Get all categories as a flat list in grouped order.
  static List<EventCategory> get allCategoriesGrouped {
    return groupedCategories.values.expand((list) => list).toList();
  }
}
