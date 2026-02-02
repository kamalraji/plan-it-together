/// Route Analytics Service for tracking page visits, session duration, and navigation patterns
/// 
/// Provides offline-first analytics collection with batched uploads to Supabase.
library route_analytics_service;

import 'dart:async';
import 'dart:collection';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';

/// Represents a single page view event
class PageViewEvent {
  final String routeName;
  final String? routeParams;
  final String? referrer;
  final DateTime enteredAt;
  DateTime? exitedAt;
  final Map<String, dynamic>? metadata;

  PageViewEvent({
    required this.routeName,
    this.routeParams,
    this.referrer,
    required this.enteredAt,
    this.exitedAt,
    this.metadata,
  });

  int get durationMs => exitedAt != null 
      ? exitedAt!.difference(enteredAt).inMilliseconds 
      : DateTime.now().difference(enteredAt).inMilliseconds;

  Map<String, dynamic> toJson() => {
    'route_name': routeName,
    'route_params': routeParams,
    'referrer': referrer,
    'entered_at': enteredAt.toIso8601String(),
    'exited_at': exitedAt?.toIso8601String(),
    'duration_ms': durationMs,
    'metadata': metadata,
  };

  factory PageViewEvent.fromJson(Map<String, dynamic> json) => PageViewEvent(
    routeName: json['route_name'] as String,
    routeParams: json['route_params'] as String?,
    referrer: json['referrer'] as String?,
    enteredAt: DateTime.parse(json['entered_at'] as String),
    exitedAt: json['exited_at'] != null ? DateTime.parse(json['exited_at'] as String) : null,
    metadata: json['metadata'] as Map<String, dynamic>?,
  );
}

/// Navigation pattern tracking
class NavigationPattern {
  final String fromRoute;
  final String toRoute;
  final DateTime timestamp;
  final int dwellTimeMs;

  NavigationPattern({
    required this.fromRoute,
    required this.toRoute,
    required this.timestamp,
    required this.dwellTimeMs,
  });

  Map<String, dynamic> toJson() => {
    'from_route': fromRoute,
    'to_route': toRoute,
    'timestamp': timestamp.toIso8601String(),
    'dwell_time_ms': dwellTimeMs,
  };
}

/// Singleton service for route analytics
class RouteAnalyticsService {
  static RouteAnalyticsService? _instance;
  static RouteAnalyticsService get instance => _instance ??= RouteAnalyticsService._();

  RouteAnalyticsService._();

  static const String _boxName = 'route_analytics';
  static const String _eventsKey = 'pending_events';
  static const String _patternsKey = 'pending_patterns';
  static const int _batchSize = 20;
  static const Duration _flushInterval = Duration(minutes: 2);

  Box? _box;
  Timer? _flushTimer;
  final Queue<PageViewEvent> _pendingEvents = Queue();
  final Queue<NavigationPattern> _pendingPatterns = Queue();
  PageViewEvent? _currentPageView;
  String? _lastRoute;
  String? _sessionId;
  bool _initialized = false;

  /// Initialize the analytics service
  Future<void> initialize() async {
    if (_initialized) return;

    try {
      _box = await Hive.openBox(_boxName);
      _sessionId = DateTime.now().millisecondsSinceEpoch.toString();
      
      // Load any pending events from previous session
      _loadPendingEvents();
      
      // Start periodic flush timer
      _flushTimer = Timer.periodic(_flushInterval, (_) => flush());
      
      _initialized = true;
      debugPrint('[RouteAnalytics] Initialized with session $_sessionId');
    } catch (e) {
      debugPrint('[RouteAnalytics] Failed to initialize: $e');
    }
  }

  void _loadPendingEvents() {
    try {
      final eventsJson = _box?.get(_eventsKey) as List<dynamic>?;
      if (eventsJson != null) {
        for (final json in eventsJson) {
          _pendingEvents.add(PageViewEvent.fromJson(Map<String, dynamic>.from(json)));
        }
      }
    } catch (e) {
      debugPrint('[RouteAnalytics] Failed to load pending events: $e');
    }
  }

  /// Track a page view
  void trackPageView({
    required String routeName,
    String? routeParams,
    Map<String, dynamic>? metadata,
  }) {
    if (!_initialized) return;

    // Complete previous page view
    _completeCurrentPageView();

    // Record navigation pattern
    if (_lastRoute != null) {
      final pattern = NavigationPattern(
        fromRoute: _lastRoute!,
        toRoute: routeName,
        timestamp: DateTime.now(),
        dwellTimeMs: _currentPageView?.durationMs ?? 0,
      );
      _pendingPatterns.add(pattern);
    }

    // Start new page view
    _currentPageView = PageViewEvent(
      routeName: routeName,
      routeParams: routeParams,
      referrer: _lastRoute,
      enteredAt: DateTime.now(),
      metadata: {
        ...?metadata,
        'session_id': _sessionId,
      },
    );

    _lastRoute = routeName;
    debugPrint('[RouteAnalytics] Tracking: $routeName');

    // Auto-flush if batch size reached
    if (_pendingEvents.length >= _batchSize) {
      flush();
    }
  }

  void _completeCurrentPageView() {
    if (_currentPageView != null) {
      _currentPageView!.exitedAt = DateTime.now();
      _pendingEvents.add(_currentPageView!);
      _currentPageView = null;
    }
  }

  /// Track a custom event within a page
  void trackEvent({
    required String eventName,
    required String routeName,
    Map<String, dynamic>? properties,
  }) {
    if (!_initialized) return;

    _pendingEvents.add(PageViewEvent(
      routeName: routeName,
      enteredAt: DateTime.now(),
      exitedAt: DateTime.now(),
      metadata: {
        'event_type': 'custom_event',
        'event_name': eventName,
        'session_id': _sessionId,
        ...?properties,
      },
    ));
  }

  /// Flush pending events to Supabase
  Future<void> flush() async {
    if (_pendingEvents.isEmpty && _pendingPatterns.isEmpty) return;

    try {
      final userId = SupabaseConfig.currentUser?.id;
      if (userId == null) {
        debugPrint('[RouteAnalytics] No user, skipping flush');
        return;
      }

      final events = _pendingEvents.toList();
      final patterns = _pendingPatterns.toList();

      // Clear pending before upload to avoid duplicates on retry
      _pendingEvents.clear();
      _pendingPatterns.clear();
      await _box?.delete(_eventsKey);

      await SupabaseConfig.client.functions.invoke(
        'track-route-analytics',
        body: {
          'user_id': userId,
          'events': events.map((e) => e.toJson()).toList(),
          'patterns': patterns.map((p) => p.toJson()).toList(),
          'session_id': _sessionId,
        },
      );

      debugPrint('[RouteAnalytics] Flushed ${events.length} events, ${patterns.length} patterns');
    } catch (e) {
      debugPrint('[RouteAnalytics] Flush failed: $e');
      // Save events back to box for retry
      await _savePendingEvents();
    }
  }

  Future<void> _savePendingEvents() async {
    try {
      await _box?.put(
        _eventsKey,
        _pendingEvents.map((e) => e.toJson()).toList(),
      );
    } catch (e) {
      debugPrint('[RouteAnalytics] Failed to save pending events: $e');
    }
  }

  /// Mark page exit (call in dispose)
  void trackPageExit() {
    _completeCurrentPageView();
  }

  /// Dispose the service
  Future<void> dispose() async {
    _completeCurrentPageView();
    await flush();
    _flushTimer?.cancel();
    await _box?.close();
    _initialized = false;
  }
}

/// Mixin for easy integration with StatefulWidget pages
mixin RouteAnalyticsMixin<T extends StatefulWidget> on State<T> {
  String get analyticsRouteName;
  String? get analyticsRouteParams => null;
  Map<String, dynamic>? get analyticsMetadata => null;

  @override
  void initState() {
    super.initState();
    _trackPageView();
  }

  void _trackPageView() {
    RouteAnalyticsService.instance.trackPageView(
      routeName: analyticsRouteName,
      routeParams: analyticsRouteParams,
      metadata: analyticsMetadata,
    );
  }

  /// Call this to track custom events within the page
  void trackAnalyticsEvent(String eventName, {Map<String, dynamic>? properties}) {
    RouteAnalyticsService.instance.trackEvent(
      eventName: eventName,
      routeName: analyticsRouteName,
      properties: properties,
    );
  }

  @override
  void dispose() {
    RouteAnalyticsService.instance.trackPageExit();
    super.dispose();
  }
}
