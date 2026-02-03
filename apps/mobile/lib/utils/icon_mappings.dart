import 'package:flutter/material.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/supabase/spark_service.dart';

/// Centralized icon mapping utility for consistent icon usage across the app.
/// All icon definitions are consolidated here to ensure visual consistency.
class IconMappings {
  IconMappings._();

  // ============================================
  // SPARK POST TYPE ICONS
  // ============================================

  /// Get icon for a SparkPostType
  static IconData getSparkPostIcon(SparkPostType type) {
    return _sparkPostIcons[type] ?? Icons.article_outlined;
  }

  /// Get color for a SparkPostType
  static Color getSparkPostColor(SparkPostType type, ColorScheme cs) {
    switch (type) {
      case SparkPostType.IDEA:
        return Colors.amber;
      case SparkPostType.SEEKING:
        return Colors.blue;
      case SparkPostType.OFFERING:
        return Colors.green;
      case SparkPostType.QUESTION:
        return Colors.purple;
      case SparkPostType.ANNOUNCEMENT:
        return cs.primary;
    }
  }

  static const Map<SparkPostType, IconData> _sparkPostIcons = {
    SparkPostType.IDEA: Icons.lightbulb_outline_rounded,
    SparkPostType.SEEKING: Icons.search_rounded,
    SparkPostType.OFFERING: Icons.card_giftcard_rounded,
    SparkPostType.QUESTION: Icons.help_outline_rounded,
    SparkPostType.ANNOUNCEMENT: Icons.campaign_outlined,
  };

  // ============================================
  // INTENT / LOOKING FOR ICONS
  // ============================================

  /// Get icon for an intent key
  static IconData getIntentIcon(String key) {
    return _intentIcons[key] ?? Icons.explore_rounded;
  }

  /// Get color for an intent key
  static Color getIntentColor(String key) {
    return _intentColors[key] ?? const Color(0xFF9C27B0);
  }

  static const Map<String, IconData> _intentIcons = {
    'DATING': Icons.favorite_rounded,
    'FRIENDS': Icons.people_rounded,
    'COFOUNDER': Icons.rocket_launch_rounded,
    'PROJECT_PARTNER': Icons.handshake_rounded,
    'STUDY_GROUP': Icons.school_rounded,
    'HACKATHON_TEAM': Icons.code_rounded,
    'MENTOR': Icons.psychology_rounded,
    'MENTEE': Icons.spa_rounded,
    'JOB': Icons.work_rounded,
    'HIRE': Icons.person_search_rounded,
    'NETWORKING': Icons.hub_rounded,
  };

  static const Map<String, Color> _intentColors = {
    'DATING': Color(0xFFE91E63),
    'FRIENDS': Color(0xFF2196F3),
    'COFOUNDER': Color(0xFF673AB7),
    'PROJECT_PARTNER': Color(0xFF009688),
    'STUDY_GROUP': Color(0xFFFF9800),
    'HACKATHON_TEAM': Color(0xFF4CAF50),
    'MENTOR': Color(0xFF3F51B5),
    'MENTEE': Color(0xFF8BC34A),
    'JOB': Color(0xFF607D8B),
    'HIRE': Color(0xFF00BCD4),
    'NETWORKING': Color(0xFF9C27B0),
  };

  // ============================================
  // VIBE / GAME SECTION ICONS
  // ============================================

  static const IconData vibeCheck = Icons.sports_esports_rounded;
  static const IconData liveNow = Icons.whatshot_rounded;
  static const IconData trivia = Icons.emoji_events_rounded;
  static const IconData icebreaker = Icons.ac_unit_rounded;
  static const IconData wouldYouRather = Icons.chat_bubble_outline_rounded;
  static const IconData personality = Icons.psychology_rounded;
  static const IconData compatibility = Icons.favorite_border_rounded;
  static const IconData quickMatch = Icons.bolt_rounded;
  static const IconData timer = Icons.timer_outlined;
  static const IconData streak = Icons.local_fire_department_rounded;

  // ============================================
  // COMMON ACTION ICONS
  // ============================================

  static const IconData spark = Icons.bolt_rounded;
  static const IconData comment = Icons.chat_bubble_outline_rounded;
  static const IconData share = Icons.share_outlined;
  static const IconData bookmark = Icons.bookmark_border_rounded;
  static const IconData bookmarkFilled = Icons.bookmark_rounded;
  static const IconData more = Icons.more_horiz;
  static const IconData add = Icons.add_rounded;
  static const IconData close = Icons.close_rounded;
  static const IconData edit = Icons.edit_rounded;
  static const IconData delete = Icons.delete_outline_rounded;
  static const IconData settings = Icons.settings_rounded;
  static const IconData notifications = Icons.notifications_outlined;
  static const IconData notificationsFilled = Icons.notifications_rounded;
  static const IconData search = Icons.search_rounded;

  // ============================================
  // NAVIGATION ICONS
  // ============================================

  static const IconData home = Icons.home_rounded;
  static const IconData homeOutlined = Icons.home_outlined;
  static const IconData discover = Icons.explore_rounded;
  static const IconData discoverOutlined = Icons.explore_outlined;
  static const IconData impact = Icons.hub_rounded;
  static const IconData impactOutlined = Icons.hub_outlined;
  static const IconData chat = Icons.chat_rounded;
  static const IconData chatOutlined = Icons.chat_outlined;
  static const IconData profile = Icons.person_rounded;
  static const IconData profileOutlined = Icons.person_outline_rounded;

  // ============================================
  // FILTER ICONS
  // ============================================

  static const IconData filterAll = Icons.auto_awesome_rounded;

  // ============================================
  // EVENT MODE ICONS & COLORS
  // ============================================

  /// Get icon for an EventMode
  static IconData getEventModeIcon(EventMode mode) {
    return _eventModeIcons[mode] ?? Icons.public_rounded;
  }

  /// Get color for an EventMode
  static Color getEventModeColor(EventMode mode) {
    return _eventModeColors[mode] ?? const Color(0xFF2196F3);
  }

  static const Map<EventMode, IconData> _eventModeIcons = {
    EventMode.ONLINE: Icons.public_rounded,
    EventMode.OFFLINE: Icons.place_rounded,
    EventMode.HYBRID: Icons.sync_alt_rounded,
  };

  static const Map<EventMode, Color> _eventModeColors = {
    EventMode.ONLINE: Color(0xFF2196F3),   // Blue
    EventMode.OFFLINE: Color(0xFF4CAF50),  // Green
    EventMode.HYBRID: Color(0xFF9C27B0),   // Purple
  };

  static const Map<EventMode, String> eventModeLabels = {
    EventMode.ONLINE: 'Online',
    EventMode.OFFLINE: 'Offline',
    EventMode.HYBRID: 'Hybrid',
  };

  // ============================================
  // EMPTY STATE ICONS
  // ============================================

  static const IconData emptyFeed = Icons.dynamic_feed_rounded;
  static const IconData emptyFollowers = Icons.people_outline_rounded;
  /// @deprecated Use emptyFollowers instead - connections model replaced by followers system
  @Deprecated('Use emptyFollowers instead - see lib/models/follower.dart')
  static const IconData emptyConnections = emptyFollowers;
  static const IconData emptyMessages = Icons.forum_outlined;
  static const IconData emptyNotifications = Icons.notifications_none_rounded;
  static const IconData emptySpaces = Icons.mic_none_rounded;
  static const IconData emptyCircles = Icons.group_work_outlined;
  static const IconData emptyLikes = Icons.favorite_outline_rounded;
  static const IconData emptyTickets = Icons.confirmation_number_outlined;
  static const IconData emptySearch = Icons.search_off_rounded;
  static const IconData emptyBookmarks = Icons.bookmark_border_rounded;
  static const IconData emptyProfiles = Icons.person_search_outlined;
  static const IconData allCaughtUp = Icons.check_circle_outline_rounded;
  static const IconData emptyPending = Icons.hourglass_empty_rounded;
  static const IconData emptySuggestions = Icons.lightbulb_outline_rounded;
  static const IconData emptyEvents = Icons.event_busy_rounded;
  static const IconData emptyGroups = Icons.groups_outlined;

  /// Get all filter chip configurations for SparkPostType
  static List<FilterChipConfig> getSparkFilterConfigs() {
    return [
      FilterChipConfig(
        label: 'All',
        icon: filterAll,
        type: null,
      ),
      ...SparkPostType.values.map((type) => FilterChipConfig(
            label: _sparkPostLabels[type] ?? type.name,
            icon: getSparkPostIcon(type),
            type: type,
          )),
    ];
  }

  static const Map<SparkPostType, String> _sparkPostLabels = {
    SparkPostType.IDEA: 'Ideas',
    SparkPostType.SEEKING: 'Seeking',
    SparkPostType.OFFERING: 'Offering',
    SparkPostType.QUESTION: 'Q&A',
    SparkPostType.ANNOUNCEMENT: 'Announcements',
  };

  // ============================================
  // CIRCLE / CATEGORY ICONS
  // ============================================

  /// Get icon for a circle based on its category or stored icon string
  static IconData getCircleIcon(String? iconOrCategory) {
    if (iconOrCategory == null) return Icons.group_work_rounded;
    
    // Check if it's a category key
    final categoryIcon = _circleCategoryIcons[iconOrCategory.toUpperCase()];
    if (categoryIcon != null) return categoryIcon;
    
    // Fallback to default
    return Icons.group_work_rounded;
  }

  /// Get color for a circle category
  static Color getCircleCategoryColor(String? category) {
    return _circleCategoryColors[category?.toUpperCase()] ?? const Color(0xFF9C27B0);
  }

  static const Map<String, IconData> _circleCategoryIcons = {
    'INTEREST': Icons.interests_rounded,
    'TOPIC': Icons.topic_rounded,
    'EVENT': Icons.event_rounded,
    'NETWORKING': Icons.hub_rounded,
    'TECH': Icons.code_rounded,
    'DESIGN': Icons.brush_rounded,
    'MUSIC': Icons.music_note_rounded,
    'SPORTS': Icons.sports_soccer_rounded,
    'GAMING': Icons.sports_esports_rounded,
    'STARTUP': Icons.rocket_launch_rounded,
    'CAREER': Icons.work_rounded,
    'EDUCATION': Icons.school_rounded,
    'HEALTH': Icons.favorite_rounded,
    'TRAVEL': Icons.flight_rounded,
    'FOOD': Icons.restaurant_rounded,
    'ART': Icons.palette_rounded,
    'BOOK': Icons.menu_book_rounded,
    'FILM': Icons.movie_rounded,
    'SCIENCE': Icons.science_rounded,
    'FINANCE': Icons.trending_up_rounded,
    'SOCIAL': Icons.people_rounded,
    'GENERAL': Icons.chat_rounded,
  };

  static const Map<String, Color> _circleCategoryColors = {
    'INTEREST': Color(0xFF9C27B0),
    'TOPIC': Color(0xFF2196F3),
    'EVENT': Color(0xFFFF5722),
    'NETWORKING': Color(0xFF673AB7),
    'TECH': Color(0xFF4CAF50),
    'DESIGN': Color(0xFFE91E63),
    'MUSIC': Color(0xFFFF9800),
    'SPORTS': Color(0xFF009688),
    'GAMING': Color(0xFF795548),
    'STARTUP': Color(0xFF3F51B5),
    'CAREER': Color(0xFF607D8B),
    'EDUCATION': Color(0xFF8BC34A),
  };

  // ============================================
  // EVENT CATEGORY ICONS & COLORS
  // ============================================

  /// Get icon for an EventCategory
  static IconData getEventCategoryIcon(EventCategory category) {
    return _eventCategoryIcons[category] ?? Icons.event_rounded;
  }

  /// Get color for an EventCategory
  static Color getEventCategoryColor(EventCategory category) {
    return _eventCategoryColors[category] ?? const Color(0xFF9C27B0);
  }

  static const Map<EventCategory, IconData> _eventCategoryIcons = {
    // Tech & Learning
    EventCategory.HACKATHON: Icons.code_rounded,
    EventCategory.BOOTCAMP: Icons.fitness_center_rounded,
    EventCategory.WORKSHOP: Icons.build_rounded,
    EventCategory.WEBINAR: Icons.videocam_rounded,
    EventCategory.SEMINAR: Icons.school_rounded,
    EventCategory.LECTURE: Icons.record_voice_over_rounded,
    EventCategory.TRAINING: Icons.model_training_rounded,
    EventCategory.SYMPOSIUM: Icons.forum_rounded,
    
    // Professional & Career
    EventCategory.CONFERENCE: Icons.business_center_rounded,
    EventCategory.MEETUP: Icons.groups_rounded,
    EventCategory.NETWORKING: Icons.hub_rounded,
    EventCategory.CAREER_FAIR: Icons.work_rounded,
    EventCategory.SUMMIT: Icons.terrain_rounded,
    EventCategory.PANEL_DISCUSSION: Icons.people_alt_rounded,
    EventCategory.TOWN_HALL: Icons.account_balance_rounded,
    EventCategory.TEAM_BUILDING: Icons.diversity_3_rounded,
    EventCategory.OFFSITE: Icons.flight_rounded,
    EventCategory.TRADE_SHOW: Icons.storefront_rounded,
    EventCategory.EXPO: Icons.local_activity_rounded,
    
    // Startup & Innovation
    EventCategory.STARTUP_PITCH: Icons.rocket_launch_rounded,
    EventCategory.DEMO_DAY: Icons.play_circle_rounded,
    EventCategory.PRODUCT_LAUNCH: Icons.new_releases_rounded,
    EventCategory.HIRING_CHALLENGE: Icons.person_search_rounded,
    
    // Academic & Education
    EventCategory.COMPETITION: Icons.emoji_events_rounded,
    EventCategory.QUIZ: Icons.quiz_rounded,
    EventCategory.DEBATE: Icons.gavel_rounded,
    EventCategory.ORIENTATION: Icons.explore_rounded,
    EventCategory.ALUMNI_MEET: Icons.handshake_rounded,
    
    // Cultural & Entertainment
    EventCategory.CULTURAL_FEST: Icons.celebration_rounded,
    EventCategory.SPORTS_EVENT: Icons.sports_soccer_rounded,
    EventCategory.CONCERT: Icons.music_note_rounded,
    EventCategory.EXHIBITION: Icons.museum_rounded,
    EventCategory.FESTIVAL: Icons.festival_rounded,
    
    // Social & Community
    EventCategory.SOCIAL_GATHERING: Icons.nightlife_rounded,
    EventCategory.AWARDS_CEREMONY: Icons.military_tech_rounded,
    EventCategory.GALA: Icons.diamond_rounded,
    
    // Charity & Cause
    EventCategory.FUNDRAISER: Icons.volunteer_activism_rounded,
    EventCategory.CHARITY_EVENT: Icons.favorite_rounded,
    EventCategory.VOLUNTEER_DRIVE: Icons.front_hand_rounded,
    EventCategory.AWARENESS_CAMPAIGN: Icons.campaign_rounded,
    
    EventCategory.OTHER: Icons.event_rounded,
  };

  static const Map<EventCategory, Color> _eventCategoryColors = {
    // Tech & Learning - Blues/Cyans
    EventCategory.HACKATHON: Color(0xFF2196F3),
    EventCategory.BOOTCAMP: Color(0xFF00BCD4),
    EventCategory.WORKSHOP: Color(0xFF03A9F4),
    EventCategory.WEBINAR: Color(0xFF00ACC1),
    EventCategory.SEMINAR: Color(0xFF0288D1),
    EventCategory.LECTURE: Color(0xFF0097A7),
    EventCategory.TRAINING: Color(0xFF0277BD),
    EventCategory.SYMPOSIUM: Color(0xFF00838F),
    
    // Professional & Career - Indigos/Deep Purples
    EventCategory.CONFERENCE: Color(0xFF3F51B5),
    EventCategory.MEETUP: Color(0xFF5C6BC0),
    EventCategory.NETWORKING: Color(0xFF673AB7),
    EventCategory.CAREER_FAIR: Color(0xFF7E57C2),
    EventCategory.SUMMIT: Color(0xFF512DA8),
    EventCategory.PANEL_DISCUSSION: Color(0xFF5E35B1),
    EventCategory.TOWN_HALL: Color(0xFF4527A0),
    EventCategory.TEAM_BUILDING: Color(0xFF6A1B9A),
    EventCategory.OFFSITE: Color(0xFF7B1FA2),
    EventCategory.TRADE_SHOW: Color(0xFF8E24AA),
    EventCategory.EXPO: Color(0xFF9C27B0),
    
    // Startup & Innovation - Greens
    EventCategory.STARTUP_PITCH: Color(0xFF4CAF50),
    EventCategory.DEMO_DAY: Color(0xFF66BB6A),
    EventCategory.PRODUCT_LAUNCH: Color(0xFF43A047),
    EventCategory.HIRING_CHALLENGE: Color(0xFF2E7D32),
    
    // Academic & Education - Ambers/Oranges
    EventCategory.COMPETITION: Color(0xFFFF9800),
    EventCategory.QUIZ: Color(0xFFFFA726),
    EventCategory.DEBATE: Color(0xFFFFB300),
    EventCategory.ORIENTATION: Color(0xFFF57C00),
    EventCategory.ALUMNI_MEET: Color(0xFFEF6C00),
    
    // Cultural & Entertainment - Pinks/Reds
    EventCategory.CULTURAL_FEST: Color(0xFFE91E63),
    EventCategory.SPORTS_EVENT: Color(0xFFF44336),
    EventCategory.CONCERT: Color(0xFFEC407A),
    EventCategory.EXHIBITION: Color(0xFFD81B60),
    EventCategory.FESTIVAL: Color(0xFFC2185B),
    
    // Social & Community - Teals
    EventCategory.SOCIAL_GATHERING: Color(0xFF009688),
    EventCategory.AWARDS_CEREMONY: Color(0xFFFFD700),
    EventCategory.GALA: Color(0xFF00796B),
    
    // Charity & Cause - Deep Oranges/Browns
    EventCategory.FUNDRAISER: Color(0xFFFF5722),
    EventCategory.CHARITY_EVENT: Color(0xFFE64A19),
    EventCategory.VOLUNTEER_DRIVE: Color(0xFFBF360C),
    EventCategory.AWARENESS_CAMPAIGN: Color(0xFFD84315),
    
    EventCategory.OTHER: Color(0xFF607D8B),
  };

  /// Get filter chip configurations for EventCategory
  static List<EventCategoryFilterConfig> getEventCategoryFilterConfigs() {
    return [
      EventCategoryFilterConfig(label: 'All', icon: filterAll, category: null),
      ...EventCategory.values.map((cat) => EventCategoryFilterConfig(
        label: cat.displayName,
        icon: getEventCategoryIcon(cat),
        category: cat,
      )),
    ];
  }
  
  /// Get grouped category configurations for bottom sheet display
  static Map<String, List<EventCategoryFilterConfig>> getGroupedEventCategories() {
    return {
      'Tech & Learning': [
        EventCategory.HACKATHON,
        EventCategory.BOOTCAMP,
        EventCategory.WORKSHOP,
        EventCategory.WEBINAR,
        EventCategory.SEMINAR,
        EventCategory.LECTURE,
        EventCategory.TRAINING,
        EventCategory.SYMPOSIUM,
      ].map((c) => EventCategoryFilterConfig(
        label: c.displayName,
        icon: getEventCategoryIcon(c),
        category: c,
      )).toList(),
      'Professional & Career': [
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
      ].map((c) => EventCategoryFilterConfig(
        label: c.displayName,
        icon: getEventCategoryIcon(c),
        category: c,
      )).toList(),
      'Startup & Innovation': [
        EventCategory.STARTUP_PITCH,
        EventCategory.DEMO_DAY,
        EventCategory.PRODUCT_LAUNCH,
        EventCategory.HIRING_CHALLENGE,
      ].map((c) => EventCategoryFilterConfig(
        label: c.displayName,
        icon: getEventCategoryIcon(c),
        category: c,
      )).toList(),
      'Academic & Education': [
        EventCategory.COMPETITION,
        EventCategory.QUIZ,
        EventCategory.DEBATE,
        EventCategory.ORIENTATION,
        EventCategory.ALUMNI_MEET,
      ].map((c) => EventCategoryFilterConfig(
        label: c.displayName,
        icon: getEventCategoryIcon(c),
        category: c,
      )).toList(),
      'Cultural & Entertainment': [
        EventCategory.CULTURAL_FEST,
        EventCategory.SPORTS_EVENT,
        EventCategory.CONCERT,
        EventCategory.EXHIBITION,
        EventCategory.FESTIVAL,
      ].map((c) => EventCategoryFilterConfig(
        label: c.displayName,
        icon: getEventCategoryIcon(c),
        category: c,
      )).toList(),
      'Social & Community': [
        EventCategory.SOCIAL_GATHERING,
        EventCategory.AWARDS_CEREMONY,
        EventCategory.GALA,
      ].map((c) => EventCategoryFilterConfig(
        label: c.displayName,
        icon: getEventCategoryIcon(c),
        category: c,
      )).toList(),
      'Charity & Cause': [
        EventCategory.FUNDRAISER,
        EventCategory.CHARITY_EVENT,
        EventCategory.VOLUNTEER_DRIVE,
        EventCategory.AWARENESS_CAMPAIGN,
      ].map((c) => EventCategoryFilterConfig(
        label: c.displayName,
        icon: getEventCategoryIcon(c),
        category: c,
      )).toList(),
      'Other': [
        EventCategory.OTHER,
      ].map((c) => EventCategoryFilterConfig(
        label: c.displayName,
        icon: getEventCategoryIcon(c),
        category: c,
      )).toList(),
    };
  }
}

/// Configuration for filter chips
class FilterChipConfig {
  final String label;
  final IconData icon;
  final SparkPostType? type;

  const FilterChipConfig({
    required this.label,
    required this.icon,
    this.type,
  });
}

/// Configuration for event category filter chips
class EventCategoryFilterConfig {
  final String label;
  final IconData icon;
  final EventCategory? category;

  const EventCategoryFilterConfig({
    required this.label,
    required this.icon,
    this.category,
  });
}

/// Preset configurations for common empty state scenarios
class EmptyStateConfig {
  final IconData icon;
  final String title;
  final String subtitle;
  final String? buttonLabel;
  final IconData? buttonIcon;

  const EmptyStateConfig({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.buttonLabel,
    this.buttonIcon,
  });

  /// Empty feed state
  static const feed = EmptyStateConfig(
    icon: IconMappings.emptyFeed,
    title: 'Your feed is empty',
    subtitle: 'Follow people and topics to see posts here',
    buttonLabel: 'Discover People',
    buttonIcon: Icons.explore_rounded,
  );

  /// No followers
  static const followers = EmptyStateConfig(
    icon: IconMappings.emptyFollowers,
    title: 'No followers yet',
    subtitle: 'Share your profile to grow your network',
    buttonLabel: 'Find People',
    buttonIcon: Icons.person_add_rounded,
  );

  @Deprecated('Use followers instead')
  static const connections = followers;

  /// No pending requests
  static const pending = EmptyStateConfig(
    icon: IconMappings.emptyPending,
    title: 'No pending requests',
    subtitle: 'When someone wants to follow you, they\'ll appear here',
  );

  /// No suggestions
  static const suggestions = EmptyStateConfig(
    icon: IconMappings.emptySuggestions,
    title: 'No suggestions available',
    subtitle: 'Check back later for new follow suggestions',
  );

  /// Empty messages/chat
  static const messages = EmptyStateConfig(
    icon: IconMappings.emptyMessages,
    title: 'No messages yet',
    subtitle: 'Start a conversation with people you follow',
    buttonLabel: 'New Message',
    buttonIcon: Icons.chat_rounded,
  );

  /// All caught up (notifications)
  static const notifications = EmptyStateConfig(
    icon: IconMappings.allCaughtUp,
    title: 'All caught up!',
    subtitle: 'You\'ve seen all your notifications',
  );

  /// No saved events
  static const savedEvents = EmptyStateConfig(
    icon: IconMappings.emptyBookmarks,
    title: 'No saved events yet',
    subtitle: 'Save events you\'re interested in to find them here later!',
    buttonLabel: 'Discover Events',
    buttonIcon: Icons.explore_rounded,
  );

  /// No upcoming saved events
  static const upcomingEvents = EmptyStateConfig(
    icon: IconMappings.emptyEvents,
    title: 'No upcoming saved events',
    subtitle: 'Save events you\'re interested in attending',
    buttonLabel: 'Discover Events',
    buttonIcon: Icons.explore_rounded,
  );

  /// No past saved events
  static const pastEvents = EmptyStateConfig(
    icon: IconMappings.emptyEvents,
    title: 'No past saved events',
    subtitle: 'Your past saved events will appear here',
  );

  /// No events with reminders
  static const reminders = EmptyStateConfig(
    icon: IconMappings.emptyNotifications,
    title: 'No events with reminders',
    subtitle: 'Enable reminders on saved events to get notified',
  );

  /// No live spaces
  static const spaces = EmptyStateConfig(
    icon: IconMappings.emptySpaces,
    title: 'No live spaces right now',
    subtitle: 'Start one and invite others to join!',
    buttonLabel: 'Create Space',
    buttonIcon: Icons.add_circle_outline_rounded,
  );

  /// No circles
  static const circles = EmptyStateConfig(
    icon: IconMappings.emptyCircles,
    title: 'No circles found',
    subtitle: 'Join circles to connect with like-minded people',
    buttonLabel: 'Create Circle',
    buttonIcon: Icons.add_rounded,
  );

  /// No likes
  static const likes = EmptyStateConfig(
    icon: IconMappings.emptyLikes,
    title: 'No likes yet',
    subtitle: 'When someone likes your profile, they\'ll appear here',
  );

  /// No tickets
  static const tickets = EmptyStateConfig(
    icon: IconMappings.emptyTickets,
    title: 'No tickets yet',
    subtitle: 'Register for events to get your tickets here',
    buttonLabel: 'Discover Events',
    buttonIcon: Icons.explore_rounded,
  );

  /// No profiles found
  static const profiles = EmptyStateConfig(
    icon: IconMappings.emptyProfiles,
    title: 'No profiles found',
    subtitle: 'Try adjusting your filters or check back later',
    buttonLabel: 'Clear Filters',
    buttonIcon: Icons.filter_alt_off_rounded,
  );

  /// No groups found
  static const groups = EmptyStateConfig(
    icon: IconMappings.emptyGroups,
    title: 'No groups found',
    subtitle: 'Try adjusting your filters or check back later',
    buttonLabel: 'Clear Filters',
    buttonIcon: Icons.filter_alt_off_rounded,
  );

  /// No search results
  static const searchResults = EmptyStateConfig(
    icon: IconMappings.emptySearch,
    title: 'No results found',
    subtitle: 'Try different keywords or adjust your filters',
    buttonLabel: 'Clear Search',
    buttonIcon: Icons.clear_rounded,
  );
}
