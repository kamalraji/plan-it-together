import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'dart:async';
import 'package:thittam1hub/services/unread_count_manager.dart';
import 'package:thittam1hub/models/circle.dart';
import 'package:thittam1hub/models/chat_group.dart';
import 'package:thittam1hub/models/chat_settings_section.dart';
import 'package:thittam1hub/models/settings_section.dart';
import 'package:thittam1hub/models/space.dart';
import 'package:thittam1hub/models/impact_profile.dart';
import 'package:thittam1hub/models/networking_models.dart';
import 'package:thittam1hub/pages/event_detail_page.dart';
import 'package:thittam1hub/pages/discover_page.dart';
import 'package:thittam1hub/pages/home/home_page.dart';
import 'package:thittam1hub/pages/impact/impact_hub_page.dart';
import 'package:thittam1hub/pages/impact/circle_chat_page.dart';
import 'package:thittam1hub/pages/impact/circle_detail_page.dart';
import 'package:thittam1hub/pages/impact/circle_members_page.dart';
import 'package:thittam1hub/pages/impact/space_room_page.dart';
import 'package:thittam1hub/pages/impact/profile_detail_page.dart';
import 'package:thittam1hub/pages/notifications/notification_center_page.dart';
import 'package:thittam1hub/pages/organization/organization_page.dart';
import 'package:thittam1hub/widgets/modern_bottom_nav.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/pages/splash_screen.dart';
import 'package:thittam1hub/pages/auth/sign_in_page.dart';
import 'package:thittam1hub/pages/auth/sign_up_page.dart';
import 'package:thittam1hub/pages/profile/profile_page.dart';
import 'package:thittam1hub/pages/profile/edit_profile_page.dart';
import 'package:thittam1hub/pages/profile/organizer_application_page.dart';
import 'package:thittam1hub/pages/profile/qr_code_page.dart';
import 'package:thittam1hub/pages/profile/settings_page.dart';
import 'package:thittam1hub/pages/profile/tickets_page.dart';
import 'package:thittam1hub/pages/profile/ticket_detail_page.dart';
import 'package:thittam1hub/pages/profile/followers_page.dart';
import 'package:thittam1hub/pages/profile/saved_events_page.dart';
import 'package:thittam1hub/pages/profile/public_profile_page.dart';
import 'package:thittam1hub/pages/profile/verification_page.dart';
import 'package:thittam1hub/pages/profile/security_settings_page.dart';
import 'package:thittam1hub/pages/profile/security_activity_page.dart';
import 'package:thittam1hub/pages/profile/settings/settings_history_page.dart';
import 'package:thittam1hub/pages/chat/chat_page.dart';
import 'package:thittam1hub/pages/chat/message_thread_page.dart';
import 'package:thittam1hub/pages/chat/new_message_page.dart';
import 'package:thittam1hub/pages/chat/chat_settings_page.dart';
import 'package:thittam1hub/pages/impact/who_liked_you_page.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/models/user_ticket.dart';
import 'package:thittam1hub/utils/hero_animations.dart';

/// Custom fade-slide page transition
CustomTransitionPage<T> _buildPageTransition<T>(Widget child, GoRouterState state) {
  return CustomTransitionPage<T>(
    key: state.pageKey,
    child: child,
    transitionDuration: const Duration(milliseconds: 250),
    reverseTransitionDuration: const Duration(milliseconds: 200),
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      final fadeAnimation = CurvedAnimation(
        parent: animation,
        curve: Curves.easeOutCubic,
      );
      final slideAnimation = Tween<Offset>(
        begin: const Offset(0, 0.03),
        end: Offset.zero,
      ).animate(fadeAnimation);
      return FadeTransition(
        opacity: fadeAnimation,
        child: SlideTransition(
          position: slideAnimation,
          child: child,
        ),
      );
    },
  );
}

/// Hero-enabled page transition for event detail navigation
CustomTransitionPage<T> _buildHeroPageTransition<T>(Widget child, GoRouterState state) {
  return CustomTransitionPage<T>(
    key: state.pageKey,
    child: child,
    transitionDuration: HeroConfig.duration,
    reverseTransitionDuration: HeroConfig.reverseDuration,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      // Fade for non-hero content
      final fadeAnimation = CurvedAnimation(
        parent: animation,
        curve: HeroConfig.curve,
      );
      
      // Subtle scale effect for background
      final scaleAnimation = Tween<double>(
        begin: 0.97,
        end: 1.0,
      ).animate(fadeAnimation);
      
      return FadeTransition(
        opacity: fadeAnimation,
        child: ScaleTransition(
          scale: scaleAnimation,
          child: child,
        ),
      );
    },
  );
}

/// GoRouter configuration for app navigation
class AppRouter {
  static GoRouter createRouter() {
    return GoRouter(
      initialLocation: AppRoutes.splash,
      refreshListenable: GoRouterRefreshStream(SupabaseConfig.auth.onAuthStateChange),
      redirect: (context, state) {
        // Allow splash screen without redirect
        if (state.matchedLocation == AppRoutes.splash) {
          return null;
        }

        final loggedIn = SupabaseConfig.auth.currentUser != null;
        final loggingIn = state.matchedLocation == AppRoutes.signIn ||
            state.matchedLocation == AppRoutes.signUp;

        if (!loggedIn) {
          return loggingIn ? null : AppRoutes.signIn;
        }

        if (loggedIn && loggingIn) {
          return AppRoutes.discover;
        }

        return null;
      },
      routes: [
        GoRoute(
          path: AppRoutes.splash,
          pageBuilder: (context, state) => _buildPageTransition(const SplashScreen(), state),
        ),
        GoRoute(
          path: AppRoutes.signIn,
          pageBuilder: (context, state) => _buildPageTransition(const SignInPage(), state),
        ),
        GoRoute(
          path: AppRoutes.signUp,
          pageBuilder: (context, state) => _buildPageTransition(const SignUpPage(), state),
        ),
        ShellRoute(
          builder: (context, state, child) => _RootShell(child: child),
          routes: [
            GoRoute(
              path: AppRoutes.home,
              pageBuilder: (context, state) {
                // Handle filter query parameter for deep linking
                final filter = state.uri.queryParameters['filter'];
                return NoTransitionPage(child: HomePage(initialFilter: filter));
              },
            ),
            GoRoute(
              path: AppRoutes.discover,
              pageBuilder: (context, state) {
                // Handle view, category, mode, sort, and search query parameters for deep linking
                final view = state.uri.queryParameters['view'];
                final category = state.uri.queryParameters['category'];
                final mode = state.uri.queryParameters['mode'];
                final sort = state.uri.queryParameters['sort'];
                final searchQuery = AppRoutes.extractSearchQuery(state.uri.queryParameters);
                return NoTransitionPage(
                  child: DiscoverPage(
                    initialView: view,
                    initialCategory: category,
                    initialMode: mode,
                    initialSort: sort,
                    initialSearch: searchQuery,
                  ),
                );
              },
            ),
            GoRoute(
              path: AppRoutes.impact,
              pageBuilder: (context, state) {
                // Handle tab, intent, mode, eventId, inside, section, and sessionId query parameters with validation
                final queryParams = state.uri.queryParameters;
                final tab = AppRoutes.extractTab(queryParams);
                final eventId = AppRoutes.extractEventId(queryParams);
                final intent = AppRoutes._validateParam(
                  queryParams['intent'], AppRoutes.validPulseIntents);
                final mode = AppRoutes._validateParam(
                  queryParams['mode'], AppRoutes.validPulseModes);
                
                // Zone-specific parameters
                final inside = AppRoutes.extractZoneInside(queryParams);
                final section = AppRoutes.extractZoneSection(queryParams);
                final sessionId = AppRoutes.extractZoneSessionId(queryParams);
                
                return NoTransitionPage(
                  child: ImpactHubPage(
                    initialTab: tab,
                    initialIntent: intent,
                    initialMode: mode,
                    initialEventId: eventId,
                    initialSection: section,
                    initialInside: inside ? true : null,
                    initialSessionId: sessionId,
                  ),
                );
              },
            ),
            GoRoute(
              path: AppRoutes.chat,
              pageBuilder: (context, state) {
                // Handle tab, filter, and search query parameters for deep linking
                final queryParams = state.uri.queryParameters;
                final tab = AppRoutes.extractChatTab(queryParams);
                final filter = AppRoutes.extractChatFilter(queryParams);
                final searchQuery = AppRoutes.extractSearchQuery(queryParams);
                
                return NoTransitionPage(
                  child: ChatPage(
                    initialTab: tab,
                    initialFilter: filter,
                    initialSearch: searchQuery,
                  ),
                );
              },
              routes: [
                GoRoute(
                  path: 'new',
                  pageBuilder: (context, state) => _buildPageTransition(const NewMessagePage(), state),
                ),
                // Settings route with query param support - must be before :channelId
                GoRoute(
                  path: 'settings',
                  pageBuilder: (context, state) {
                    final queryParams = state.uri.queryParameters;
                    
                    // Extract tab from query params (with validation)
                    final tab = AppRoutes.extractChatSettingsTab(queryParams);
                    
                    // Extract channel context from query params
                    final channelId = AppRoutes.extractChannelId(queryParams);
                    final channelName = queryParams['channelName'];
                    final isDM = queryParams['isDM'] == 'true';
                    
                    // Also support state.extra for programmatic navigation
                    final extra = state.extra as Map<String, dynamic>?;
                    
                    return _buildPageTransition(
                      ChatSettingsPage(
                        initialTab: tab,
                        channelId: channelId ?? extra?['channelId'] as String?,
                        channelName: channelName ?? extra?['channelName'] as String?,
                        isDM: isDM || (extra?['isDM'] as bool? ?? false),
                      ),
                      state,
                    );
                  },
                ),
                // Group chat route - must be before :channelId to avoid conflict
                GoRoute(
                  path: 'groups/:groupId',
                  pageBuilder: (context, state) {
                    final groupId = state.pathParameters['groupId']!;
                    final group = state.extra as ChatGroup?;
                    return _buildPageTransition(
                      MessageThreadPage(
                        channelId: 'group:$groupId',
                        groupId: groupId,
                        group: group,
                      ),
                      state,
                    );
                  },
                ),
                // Channel/DM chat route - catch-all, must be last
                GoRoute(
                  path: ':channelId',
                  pageBuilder: (context, state) {
                    final id = state.pathParameters['channelId']!;
                    final extra = state.extra;
                    if (extra is WorkspaceChannel) {
                      return _buildPageTransition(MessageThreadPage(channelId: id, channel: extra), state);
                    }
                    if (extra is Map) {
                      final map = Map<String, dynamic>.from(extra as Map);
                      return _buildPageTransition(
                        MessageThreadPage(
                          channelId: id,
                          dmUserId: map['dmUserId'] as String?,
                          dmUserName: map['dmUserName'] as String?,
                          dmUserAvatar: map['dmUserAvatar'] as String?,
                        ),
                        state,
                      );
                    }
                    return _buildPageTransition(MessageThreadPage(channelId: id), state);
                  },
                ),
              ],
            ),
            GoRoute(
              path: AppRoutes.profile,
              pageBuilder: (context, state) => const NoTransitionPage(child: ProfilePage()),
            ),
            GoRoute(
              path: '/events/:id',
              pageBuilder: (context, state) {
                final id = state.pathParameters['id']!;
                final event = state.extra as Event?;
                return _buildHeroPageTransition(
                  EventDetailPage(eventId: id, event: event),
                  state,
                );
              },
            ),
            GoRoute(
              path: '/circles/:id',
              pageBuilder: (context, state) {
                final circleId = state.pathParameters['id']!;
                final circle = state.extra as Circle?;
                return _buildPageTransition(
                  CircleDetailPage(circleId: circleId, circle: circle),
                  state,
                );
              },
              routes: [
                GoRoute(
                  path: 'chat',
                  pageBuilder: (context, state) {
                    final circleId = state.pathParameters['id']!;
                    final circle = state.extra as Circle?;
                    return _buildPageTransition(
                      CircleChatPage(circleId: circleId, circle: circle),
                      state,
                    );
                  },
                ),
                GoRoute(
                  path: 'members',
                  pageBuilder: (context, state) {
                    final circleId = state.pathParameters['id']!;
                    final circle = state.extra as Circle?;
                    return _buildPageTransition(
                      CircleMembersPage(circleId: circleId, circle: circle),
                      state,
                    );
                  },
                ),
              ],
            ),
            GoRoute(
              path: '/spaces/:id',
              pageBuilder: (context, state) {
                final space = state.extra as Space?;
                if (space != null) {
                  return _buildPageTransition(SpaceRoomPage(space: space), state);
                } else {
                  return _buildPageTransition(const _PlaceholderPage(title: 'Error'), state);
                }
              },
            ),
            GoRoute(
              path: '/impact/profile/:id',
              pageBuilder: (context, state) {
                final id = state.pathParameters['id']!;
                
                // Handle both ImpactProfile directly or Map with profile + smartMatch
                ImpactProfile? profile;
                SmartMatch? smartMatch;
                
                final extra = state.extra;
                if (extra is ImpactProfile) {
                  profile = extra;
                } else if (extra is Map<String, dynamic>) {
                  profile = extra['profile'] as ImpactProfile?;
                  smartMatch = extra['smartMatch'] as SmartMatch?;
                }
                
                return _buildHeroPageTransition(
                  ProfileDetailPage(
                    profileId: id,
                    profile: profile,
                    smartMatch: smartMatch,
                  ),
                  state,
                );
              },
            ),
            GoRoute(
              path: '/profile/edit',
              pageBuilder: (context, state) => _buildPageTransition(const EditProfilePage(), state),
            ),
            GoRoute(
              path: '/profile/qr',
              pageBuilder: (context, state) => _buildPageTransition(const QrCodePage(), state),
            ),
            // Alias for backward compatibility
            GoRoute(
              path: '/profile/qr-code',
              pageBuilder: (context, state) => _buildPageTransition(const QrCodePage(), state),
            ),
            GoRoute(
              path: '/profile/settings',
              pageBuilder: (context, state) {
                // Handle tab query parameter for deep linking
                final tab = state.uri.queryParameters['tab'];
                return _buildPageTransition(SettingsPage(initialTab: tab), state);
              },
              routes: [
                GoRoute(
                  path: 'history',
                  pageBuilder: (context, state) => _buildPageTransition(
                    const SettingsHistoryPage(),
                    state,
                  ),
                ),
              ],
            ),
            // Note: /chat/settings is now a nested route under /chat for proper matching
            GoRoute(
              path: '/profile/tickets',
              pageBuilder: (context, state) {
                // Handle tab query parameter for deep linking
                final tab = AppRoutes.extractTicketsTab(state.uri.queryParameters);
                return _buildPageTransition(
                  TicketsPage(initialTab: tab),
                  state,
                );
              },
            ),
            GoRoute(
              path: '/profile/tickets/:id',
              pageBuilder: (context, state) {
                final id = state.pathParameters['id']!;
                final ticket = state.extra as UserTicket?;
                return _buildHeroPageTransition(
                  TicketDetailPage(registrationId: id, ticket: ticket),
                  state,
                );
              },
            ),
            GoRoute(
              path: '/profile/saved',
              pageBuilder: (context, state) {
                // Handle filter query parameter for deep linking
                final filter = AppRoutes.extractSavedFilter(state.uri.queryParameters);
                return _buildPageTransition(
                  SavedEventsPage(initialFilter: filter),
                  state,
                );
              },
            ),
            // Organizer Application route
            GoRoute(
              path: '/profile/organizer-application',
              pageBuilder: (context, state) {
                final step = int.tryParse(state.uri.queryParameters['step'] ?? '');
                return _buildPageTransition(
                  OrganizerApplicationPage(initialStep: step),
                  state,
                );
              },
            ),
            GoRoute(
              path: '/profile/followers',
              pageBuilder: (context, state) {
                // Handle tab query parameter for deep linking
                final tab = AppRoutes.extractFollowersTab(state.uri.queryParameters);
                return _buildPageTransition(
                  FollowersPage(initialTab: tab),
                  state,
                );
              },
            ),
            GoRoute(
              path: '/profile/verification',
              pageBuilder: (context, state) => _buildPageTransition(
                const VerificationPage(),
                state,
              ),
            ),
            // Note: Security now accessed via ?tab=security query param for consistency
            // Security Activity page
            GoRoute(
              path: '/profile/security-activity',
              pageBuilder: (context, state) => _buildPageTransition(
                const SecurityActivityPage(),
                state,
              ),
            ),
            GoRoute(
              path: '/impact/who-liked-you',
              pageBuilder: (context, state) => _buildPageTransition(
                const WhoLikedYouPage(),
                state,
              ),
            ),
            // Notification Center
            GoRoute(
              path: AppRoutes.notifications,
              pageBuilder: (context, state) {
                // Handle category query parameter for deep linking
                final category = AppRoutes.extractNotificationCategory(state.uri.queryParameters);
                return _buildPageTransition(
                  NotificationCenterPage(initialCategory: category),
                  state,
                );
              },
            ),
            // Public profile deep link route by user ID
            GoRoute(
              path: '/p/:userId',
              pageBuilder: (context, state) {
                final userId = state.pathParameters['userId']!;
                return _buildHeroPageTransition(
                  PublicProfilePage(profileId: userId),
                  state,
                );
              },
            ),
            // Public profile deep link route by username (preferred)
            GoRoute(
              path: '/u/:username',
              pageBuilder: (context, state) {
                final username = state.pathParameters['username']!;
                return _buildHeroPageTransition(
                  PublicProfilePage(username: username),
                  state,
                );
              },
            ),
            // Organization detail page with deep linking
            GoRoute(
              path: '/org/:slug',
              pageBuilder: (context, state) {
                final slug = state.pathParameters['slug']!;
                final org = state.extra as Organization?;
                return _buildHeroPageTransition(
                  OrganizationPage(slug: slug, organization: org),
                  state,
                );
              },
            ),
          ],
        ),
      ],
    );
  }
}

/// Route path constants with sanitized deep link helpers
class AppRoutes {
  static const String splash = '/splash';
  static const String home = '/';
  static const String discover = '/discover';
  static const String impact = '/impact';
  static const String chat = '/chat';
  static const String profile = '/profile';
  static const String notifications = '/notifications';
  static const String signIn = '/signin';
  static const String signUp = '/signup';
  static const String organization = '/org';
  
  // Organizer application routes
  static const String organizerApplication = '/profile/organizer-application';
  static const String applicationStatus = '/profile/application-status';
  
  /// Organizer application with step parameter
  static String organizerApplicationWithStep(int step) {
    return '/profile/organizer-application?step=$step';
  }
  
  // Valid parameter values for sanitization
  static const List<String> validHomeFilters = ['all', 'trending', 'ideas', 'discussions', 'announcements'];
  static const List<String> validImpactTabs = ['pulse', 'zone', 'vibe'];
  static const List<String> validPulseIntents = ['professional', 'student', 'social', 'dating'];
  static const List<String> validPulseModes = ['people', 'groups', 'all'];
  static const List<String> validDiscoverModes = ['online', 'in-person', 'all'];
  static const List<String> validDiscoverViews = ['events', 'products'];
  static const List<String> validProductSorts = ['featured', 'newest', 'price_asc', 'price_desc', 'popular'];
  
  // Valid chat tabs and filters for deep linking
  static const List<String> validChatTabs = ['all', 'direct', 'groups', 'channels'];
  static const List<String> validChatFilters = ['all', 'unread', 'media', 'archived', 'muted', 'pinned'];
  
  // Valid chat settings tabs for deep linking
  static const List<String> validChatSettingsTabs = [
    'notifications',
    'theme', 
    'security',
    'accessibility',
    'backup',
    'storage',
  ];
  
  // Valid followers tabs for deep linking
  static const List<String> validFollowersTabs = ['followers', 'following', 'mutual', 'requests', 'suggested'];
  
  // Valid zone inside sections for deep linking
  static const List<String> validZoneSections = [
    'schedule', 'networking', 'polls', 'qa', 'announcements', 
    'leaderboard', 'materials', 'circles', 'icebreaker', 'sponsors', 'challenges'
  ];
  
  // Valid tickets tabs for deep linking
  static const List<String> validTicketsTabs = ['upcoming', 'past', 'all'];
  
  // Valid saved events filters for deep linking
  static const List<String> validSavedFilters = ['all', 'upcoming', 'past', 'reminders'];
  
  // Valid notification category filters for deep linking
  static const List<String> validNotificationCategories = ['all', 'followers', 'reactions', 'invites', 'achievements', 'matches'];
  
  // ========== Sanitization Helpers ==========
  
  /// Sanitize a query parameter value - only allow safe characters
  static String _sanitizeParam(String value) {
    // Only allow alphanumeric, hyphens, underscores
    return value.toLowerCase().replaceAll(RegExp(r'[^a-z0-9\-_]'), '');
  }
  
  /// Validate parameter against allowed values
  static String? _validateParam(String? value, List<String> allowed) {
    if (value == null || value.isEmpty) return null;
    final sanitized = _sanitizeParam(value);
    return allowed.contains(sanitized) ? sanitized : null;
  }
  
  /// Validate UUID format for IDs
  static bool _isValidUuid(String? value) {
    if (value == null || value.isEmpty) return false;
    final uuidRegex = RegExp(
      r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    );
    return uuidRegex.hasMatch(value);
  }
  
  /// Encode parameter for URL safety
  static String _encodeParam(String value) {
    return Uri.encodeComponent(value);
  }
  
  // ========== Deep Link URL Builders (with sanitization) ==========
  
  /// Home with filter - validates against allowed filters
  static String homeWithFilter(String filter) {
    final validFilter = _validateParam(filter, validHomeFilters);
    if (validFilter == null) return home;
    return '/?filter=${_encodeParam(validFilter)}';
  }
  
  /// Impact Hub with tab - validates against allowed tabs
  static String impactWithTab(String tab) {
    final validTab = _validateParam(tab, validImpactTabs);
    if (validTab == null) return impact;
    return '/impact?tab=${_encodeParam(validTab)}';
  }
  
  /// Zone tab with optional event ID - validates UUID format
  static String zoneWithEvent(String? eventId) {
    if (eventId == null || !_isValidUuid(eventId)) {
      return '/impact?tab=zone';
    }
    return '/impact?tab=zone&eventId=${_encodeParam(eventId)}';
  }
  
  /// Zone inside (checked-in) with section navigation and optional session deep link
  /// Example: /impact?tab=zone&inside=true&eventId=xxx&section=schedule&sessionId=yyy
  static String zoneInside(String eventId, {String? section, String? sessionId}) {
    if (!_isValidUuid(eventId)) return '/impact?tab=zone';
    
    final params = <String>['tab=zone', 'inside=true', 'eventId=${_encodeParam(eventId)}'];
    
    final validSection = _validateParam(section, validZoneSections);
    if (validSection != null) {
      params.add('section=${_encodeParam(validSection)}');
    }
    
    // Add sessionId for deep-linking to specific session
    if (sessionId != null && _isValidUuid(sessionId)) {
      params.add('sessionId=${_encodeParam(sessionId)}');
    }
    
    return '/impact?${params.join('&')}';
  }
  
  /// Extract Zone inside state from query params
  static bool extractZoneInside(Map<String, String> params) {
    return params['inside'] == 'true';
  }
  
  /// Extract Zone section from query params
  static String? extractZoneSection(Map<String, String> params) {
    return _validateParam(params['section'], validZoneSections);
  }
  
  /// Extract Zone sessionId from query params for deep linking to a specific session
  static String? extractZoneSessionId(Map<String, String> params) {
    final sessionId = params['sessionId'];
    if (sessionId != null && _isValidUuid(sessionId)) {
      return sessionId;
    }
    return null;
  }
  
  /// Pulse with filters - validates all parameters
  static String pulseWithFilters({String? intent, String? mode, String? searchQuery}) {
    final params = <String>['tab=pulse'];
    
    final validIntent = _validateParam(intent, validPulseIntents);
    if (validIntent != null) params.add('intent=${_encodeParam(validIntent)}');
    
    final validMode = _validateParam(mode, validPulseModes);
    if (validMode != null) params.add('mode=${_encodeParam(validMode)}');
    
    // Search query is URL encoded but not validated against a list
    if (searchQuery != null && searchQuery.trim().isNotEmpty) {
      final sanitizedQuery = searchQuery.trim().substring(0, searchQuery.length.clamp(0, 100));
      params.add('q=${_encodeParam(sanitizedQuery)}');
    }
    
    return '/impact?${params.join('&')}';
  }
  
  /// Discover with filters - validates all parameters
  /// Supports search query for products view
  static String discoverWithFilters({
    String? view,
    String? category, 
    String? mode,
    String? sort,
    String? searchQuery,
  }) {
    final params = <String>[];
    
    // View parameter
    final validView = _validateParam(view, validDiscoverViews);
    if (validView != null && validView != 'events') {
      params.add('view=${_encodeParam(validView)}');
    }
    
    // Category is open-ended but sanitized
    if (category != null && category.trim().isNotEmpty) {
      final sanitized = _sanitizeParam(category);
      if (sanitized.isNotEmpty && sanitized.length <= 50) {
        params.add('category=${_encodeParam(sanitized)}');
      }
    }
    
    final validMode = _validateParam(mode, validDiscoverModes);
    if (validMode != null) params.add('mode=${_encodeParam(validMode)}');
    
    // Sort parameter (only for products view)
    final validSort = _validateParam(sort, validProductSorts);
    if (validSort != null && validSort != 'featured') {
      params.add('sort=${_encodeParam(validSort)}');
    }
    
    // Search query (sanitized, max 100 chars)
    if (searchQuery != null && searchQuery.trim().isNotEmpty) {
      final sanitized = searchQuery.trim().substring(0, searchQuery.length.clamp(0, 100));
      params.add('q=${_encodeParam(sanitized)}');
    }
    
    return params.isEmpty ? discover : '/discover?${params.join('&')}';
  }
  
  /// Event detail with validated UUID
  static String eventDetail(String eventId) {
    if (!_isValidUuid(eventId)) return discover;
    return '/events/$eventId';
  }
  
  /// Profile with validated UUID
  static String profileDetail(String userId) {
    if (!_isValidUuid(userId)) return profile;
    return '/p/$userId';
  }
  
  /// Ticket detail with validated UUID
  static String ticketDetail(String registrationId) {
    if (!_isValidUuid(registrationId)) return '/profile/tickets';
    return '/profile/tickets/$registrationId';
  }
  
  /// Organization page with slug
  static String organizationBySlug(String slug) {
    // Sanitize slug - only allow alphanumeric, hyphens, underscores
    final sanitized = slug.toLowerCase().replaceAll(RegExp(r'[^a-z0-9\-_]'), '');
    if (sanitized.isEmpty || sanitized.length > 100) return discover;
    return '/org/$sanitized';
  }
  
  /// Chat Settings with tab deep linking - validates all parameters
  /// Example: /chat/settings?tab=security&channelId=xxx&channelName=John
  static String chatSettingsWithTab({
    String? tab,
    String? channelId,
    String? channelName,
    bool? isDM,
  }) {
    final params = <String>[];
    
    // Validate tab against allowed values
    final validTab = _validateParam(tab, validChatSettingsTabs);
    if (validTab != null) {
      params.add('tab=${_encodeParam(validTab)}');
    }
    
    // Channel ID validation (UUID format)
    if (channelId != null && _isValidUuid(channelId)) {
      params.add('channelId=${_encodeParam(channelId)}');
    }
    
    // Channel name (sanitized, max 100 chars)
    if (channelName != null && channelName.trim().isNotEmpty) {
      final sanitizedName = channelName.trim().substring(0, channelName.length.clamp(0, 100));
      params.add('channelName=${_encodeParam(sanitizedName)}');
    }
    
    // isDM boolean flag
    if (isDM == true) {
      params.add('isDM=true');
    }
    
    return params.isEmpty ? '/chat/settings' : '/chat/settings?${params.join('&')}';
  }
  
  /// Chat Settings with type-safe section enum
  /// Usage: AppRoutes.chatSettingsWithSection(ChatSettingsSection.security)
  static String chatSettingsWithSection(
    ChatSettingsSection? section, {
    String? channelId,
    String? channelName,
    bool? isDM,
  }) {
    return chatSettingsWithTab(
      tab: section?.id,
      channelId: channelId,
      channelName: channelName,
      isDM: isDM,
    );
  }
  
  /// Extract ChatSettingsSection from query params (type-safe)
  static ChatSettingsSection? extractChatSettingsSection(Map<String, String> params) {
    final tab = extractChatSettingsTab(params);
    return ChatSettingsSection.fromId(tab);
  }
  
  // ========== Generic Enum-Based Route Builders ==========
  
  /// Generic enum-based tab URL builder
  /// Usage: AppRoutes.withEnumTab('/chat/settings', ChatSettingsSection.security)
  static String withEnumTab<T extends Enum>(String basePath, T? value) {
    if (value == null) return basePath;
    final tabId = value.name.toLowerCase();
    return '$basePath?tab=${_encodeParam(tabId)}';
  }
  
  /// Generic enum-based filter URL builder
  /// Usage: AppRoutes.withEnumFilter('/notifications', NotificationCategory.reactions)
  static String withEnumFilter<T extends Enum>(String basePath, T? value) {
    if (value == null) return basePath;
    final filterId = value.name.toLowerCase();
    return '$basePath?filter=${_encodeParam(filterId)}';
  }
  
  // ========== Parameter Extraction Helpers ==========
  
  /// Safely extract and validate a tab parameter
  static String? extractTab(Map<String, String> params) {
    return _validateParam(params['tab'], validImpactTabs);
  }
  
  /// Safely extract and validate a filter parameter
  static String? extractFilter(Map<String, String> params) {
    return _validateParam(params['filter'], validHomeFilters);
  }
  
  /// Safely extract and validate an event ID
  static String? extractEventId(Map<String, String> params) {
    final eventId = params['eventId'];
    return _isValidUuid(eventId) ? eventId : null;
  }
  
  /// Safely extract and validate a chat settings tab
  static String? extractChatSettingsTab(Map<String, String> params) {
    return _validateParam(params['tab'], validChatSettingsTabs);
  }
  
  /// Safely extract and validate a channel ID from params
  static String? extractChannelId(Map<String, String> params) {
    final channelId = params['channelId'];
    return _isValidUuid(channelId) ? channelId : null;
  }
  
  /// Safely extract and validate a chat tab parameter
  static String? extractChatTab(Map<String, String> params) {
    return _validateParam(params['tab'], validChatTabs);
  }
  
  /// Safely extract and validate a chat filter parameter
  static String? extractChatFilter(Map<String, String> params) {
    return _validateParam(params['filter'], validChatFilters);
  }
  
  /// Safely extract and sanitize a search query (max 100 chars)
  static String? extractSearchQuery(Map<String, String> params) {
    final q = params['q'];
    if (q == null || q.trim().isEmpty) return null;
    return q.trim().substring(0, q.length.clamp(0, 100));
  }
  
  /// Safely extract and validate a followers tab parameter
  static String? extractFollowersTab(Map<String, String> params) {
    return _validateParam(params['tab'], validFollowersTabs);
  }
  
  /// Chat hub with tab/filter/search deep linking
  /// Example: /chat?tab=groups&filter=unread&q=team
  static String chatWithFilters({
    String? tab,
    String? filter,
    String? searchQuery,
  }) {
    final params = <String>[];
    
    final validTab = _validateParam(tab, validChatTabs);
    if (validTab != null && validTab != 'all') {
      params.add('tab=${_encodeParam(validTab)}');
    }
    
    final validFilter = _validateParam(filter, validChatFilters);
    if (validFilter != null && validFilter != 'all') {
      params.add('filter=${_encodeParam(validFilter)}');
    }
    
    // Search query (sanitized, max 100 chars)
    if (searchQuery != null && searchQuery.trim().isNotEmpty) {
      final sanitized = searchQuery.trim().substring(0, searchQuery.length.clamp(0, 100));
      params.add('q=${_encodeParam(sanitized)}');
    }
    
    return params.isEmpty ? chat : '/chat?${params.join('&')}';
  }
  
  /// Followers page with tab deep linking
  /// Example: /profile/followers?tab=requests
  static String followersWithTab(String? tab) {
    final validTab = _validateParam(tab, validFollowersTabs);
    if (validTab == null) return '/profile/followers';
    return '/profile/followers?tab=${_encodeParam(validTab)}';
  }
  
  /// Tickets page with tab deep linking
  /// Example: /profile/tickets?tab=upcoming
  static String ticketsWithTab(String? tab) {
    final validTab = _validateParam(tab, validTicketsTabs);
    if (validTab == null) return '/profile/tickets';
    return '/profile/tickets?tab=${_encodeParam(validTab)}';
  }
  
  /// Saved events page with filter deep linking
  /// Example: /profile/saved?filter=reminders
  static String savedEventsWithFilter(String? filter) {
    final validFilter = _validateParam(filter, validSavedFilters);
    if (validFilter == null) return '/profile/saved';
    return '/profile/saved?filter=${_encodeParam(validFilter)}';
  }
  
  /// Notifications page with category filter deep linking
  /// Example: /notifications?category=reactions
  static String notificationsWithCategory(String? category) {
    final validCategory = _validateParam(category, validNotificationCategories);
    if (validCategory == null) return notifications;
    return '/notifications?category=${_encodeParam(validCategory)}';
  }
  
  // ========== Additional Route Builders ==========
  
  /// Chat new message page
  static const String chatNew = '/chat/new';
  
  /// Chat channel/DM with validated channel ID
  /// Example: /chat/abc-123
  static String chatChannel(String channelId) {
    if (!_isValidUuid(channelId)) return chat;
    return '/chat/$channelId';
  }
  
  /// Chat group with validated group ID
  /// Example: /chat/groups/abc-123
  static String chatGroup(String groupId) {
    if (!_isValidUuid(groupId)) return chat;
    return '/chat/groups/$groupId';
  }
  
  /// Impact profile with validated user ID
  /// Example: /impact/profile/abc-123
  static String impactProfile(String userId) {
    if (!_isValidUuid(userId)) return impact;
    return '/impact/profile/$userId';
  }
  
  /// Public profile (short URL) with validated user ID
  /// Example: /p/abc-123
  static String publicProfile(String userId) {
    if (!_isValidUuid(userId)) return profile;
    return '/p/$userId';
  }
  
  /// Post/Spark detail with validated post ID
  /// Example: /post/abc-123
  static String postDetail(String postId) {
    if (!_isValidUuid(postId)) return home;
    return '/post/$postId';
  }
  
  /// Space detail with validated space ID
  /// Example: /spaces/abc-123
  static String spaceDetail(String spaceId) {
    if (!_isValidUuid(spaceId)) return impact;
    return '/spaces/$spaceId';
  }
  
  /// Organization page by slug
  /// Example: /org/acme-corp
  static String organizationPage(String slug) {
    if (slug.isEmpty) return discover;
    return '/org/${_encodeParam(slug)}';
  }
  
  /// Circle detail with validated circle ID
  /// Example: /circles/abc-123
  static String circleDetail(String circleId) {
    if (!_isValidUuid(circleId)) return impact;
    return '/circles/$circleId';
  }
  
  /// Settings page with tab deep linking
  /// Example: /profile/settings?tab=security
  static String settingsWithTab(String? tab) {
    if (tab == null || tab.trim().isEmpty) return settings;
    return '/profile/settings?tab=${_encodeParam(tab)}';
  }
  
  /// Settings page with type-safe section enum
  /// Usage: AppRoutes.settingsWithSection(SettingsSection.security)
  static String settingsWithSection(SettingsSection? section) {
    return settingsWithTab(section?.id);
  }
  
  /// Extract SettingsSection from query params (type-safe)
  static SettingsSection? extractSettingsSection(Map<String, String> params) {
    final tab = params['tab'];
    return SettingsSection.fromId(tab);
  }
  
  // Security activity page path defined below in Profile Route Constants
  
  // ========== Parameter Extraction Helpers (Additional) ==========
  
  /// Safely extract and validate a tickets tab parameter
  static String? extractTicketsTab(Map<String, String> params) {
    return _validateParam(params['tab'], validTicketsTabs);
  }
  
  /// Safely extract and validate a saved events filter parameter
  static String? extractSavedFilter(Map<String, String> params) {
    return _validateParam(params['filter'], validSavedFilters);
  }
  
  /// Safely extract and validate a notification category parameter
  static String? extractNotificationCategory(Map<String, String> params) {
    return _validateParam(params['category'], validNotificationCategories);
  }
  
  // ========== Generic Helpers ==========
  
  /// Type-safe enum extractor from query params
  /// Usage: AppRoutes.extractEnum<FollowerTab>(params, 'tab', FollowerTab.values)
  static T? extractEnum<T extends Enum>(
    Map<String, String> params,
    String key,
    List<T> values,
  ) {
    final value = params[key];
    if (value == null || value.isEmpty) return null;
    final sanitized = _sanitizeParam(value);
    return values.cast<T?>().firstWhere(
      (e) => e?.name.toLowerCase() == sanitized,
      orElse: () => null,
    );
  }
  
  // ========== Generic Route Builders ==========
  
  /// Generic tab URL builder for any tabbed route
  /// Usage: AppRoutes.withTab('/profile/settings', 'security')
  /// Returns base path if tab is null/empty
  static String withTab(String basePath, String? tab) {
    if (tab == null || tab.trim().isEmpty) return basePath;
    final sanitized = _sanitizeParam(tab);
    if (sanitized.isEmpty) return basePath;
    return '$basePath?tab=${_encodeParam(sanitized)}';
  }
  
  /// Generic filter URL builder for filter-based routes
  /// Usage: AppRoutes.withFilter('/profile/saved', 'reminders')
  /// Returns base path if filter is null/empty
  static String withFilter(String basePath, String? filter) {
    if (filter == null || filter.trim().isEmpty) return basePath;
    final sanitized = _sanitizeParam(filter);
    if (sanitized.isEmpty) return basePath;
    return '$basePath?filter=${_encodeParam(sanitized)}';
  }
  
  /// Generic multi-param URL builder
  /// Usage: AppRoutes.withParams('/discover', {'view': 'products', 'sort': 'newest'})
  /// Automatically sanitizes, encodes, and filters empty values
  static String withParams(String basePath, Map<String, String?> params) {
    final validParams = params.entries
        .where((e) => e.value != null && e.value!.trim().isNotEmpty)
        .map((e) {
          final sanitized = _sanitizeParam(e.value!);
          return sanitized.isNotEmpty ? '${e.key}=${_encodeParam(sanitized)}' : null;
        })
        .whereType<String>()
        .toList();
    return validParams.isEmpty ? basePath : '$basePath?${validParams.join('&')}';
  }
  
  // ========== Validated Generic Extractors ==========
  
  /// Validated tab extractor with custom valid values
  /// Usage: AppRoutes.extractValidTab(params, ['upcoming', 'past', 'all'])
  /// Returns null if tab is missing or not in validValues
  static String? extractValidTab(Map<String, String> params, List<String> validValues) {
    return _validateParam(params['tab'], validValues);
  }
  
  /// Validated filter extractor with custom valid values
  /// Usage: AppRoutes.extractValidFilter(params, ['all', 'unread', 'starred'])
  /// Returns null if filter is missing or not in validValues
  static String? extractValidFilter(Map<String, String> params, List<String> validValues) {
    return _validateParam(params['filter'], validValues);
  }
  
  /// Validated category extractor with custom valid values
  /// Usage: AppRoutes.extractValidCategory(params, ['all', 'reactions', 'follows'])
  /// Returns null if category is missing or not in validValues
  static String? extractValidCategory(Map<String, String> params, List<String> validValues) {
    return _validateParam(params['category'], validValues);
  }
  
  // ========== Profile Route Constants ==========
  
  /// Profile sub-route constants for type-safe navigation
  static const String settings = '/profile/settings';
  static const String settingsHistory = '/profile/settings/history';
  static const String tickets = '/profile/tickets';
  static const String saved = '/profile/saved';
  static const String followers = '/profile/followers';
  static const String editProfile = '/profile/edit';
  static const String qrCode = '/profile/qr';
  static const String verification = '/profile/verification';
  static const String securityActivity = '/profile/security-activity';
}

class _RootShell extends StatefulWidget {
  final Widget child;
  const _RootShell({required this.child});
  @override
  State<_RootShell> createState() => _RootShellState();
}

class _RootShellState extends State<_RootShell> {
  final _unreadManager = UnreadCountManager.instance;
  int _chatUnreadCount = 0;
  
  @override
  void initState() {
    super.initState();
    _chatUnreadCount = _unreadManager.totalUnread;
    _unreadManager.addListener(_onUnreadCountChanged);
  }
  
  @override
  void dispose() {
    _unreadManager.removeListener(_onUnreadCountChanged);
    super.dispose();
  }
  
  void _onUnreadCountChanged() {
    if (mounted) {
      setState(() {
        _chatUnreadCount = _unreadManager.totalUnread;
      });
    }
  }

  int _indexFromLocation(String location) {
    if (location.startsWith(AppRoutes.discover)) return 1;
    if (location.startsWith(AppRoutes.impact)) return 2;
    if (location.startsWith(AppRoutes.chat)) return 3;
    if (location.startsWith(AppRoutes.profile)) return 4;
    return 0;
  }

  void _onTap(int index) {
    switch (index) {
      case 0:
        context.go(AppRoutes.home);
        break;
      case 1:
        context.go(AppRoutes.discover);
        break;
      case 2:
        context.go(AppRoutes.impact);
        break;
      case 3:
        context.go(AppRoutes.chat);
        break;
      case 4:
        context.go(AppRoutes.profile);
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final idx = _indexFromLocation(GoRouterState.of(context).uri.toString());
    return Scaffold(
      body: widget.child,
      bottomNavigationBar: ModernBottomNav(
        selectedIndex: idx,
        onTap: _onTap,
        chatUnreadCount: _chatUnreadCount,
      ),
    );
  }
}

/// Simple GoRouter refresh helper that listens to a stream
class GoRouterRefreshStream extends ChangeNotifier {
  late final StreamSubscription<dynamic> _subscription;
  GoRouterRefreshStream(Stream<dynamic> stream) {
    _subscription = stream.asBroadcastStream().listen((_) => notifyListeners());
  }
  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}

class _PlaceholderPage extends StatelessWidget {
  final String title;
  const _PlaceholderPage({required this.title});
  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return SafeArea(
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.hourglass_empty, size: 40, color: cs.primary),
            const SizedBox(height: 10),
            Text(
              '$title coming soon',
              style: Theme.of(context).textTheme.titleSmall,
            ),
          ],
        ),
      ),
    );
  }
}
