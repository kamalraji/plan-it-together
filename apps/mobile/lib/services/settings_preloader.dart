import 'dart:async';
import 'package:thittam1hub/services/accessibility_service.dart';
import 'package:thittam1hub/services/logging_service.dart';
import 'package:thittam1hub/services/result.dart';

/// Settings Preloader
/// 
/// Preloads commonly accessed settings in background after authentication
/// to improve navigation performance to settings pages.
/// 
/// Usage:
/// ```dart
/// // After successful authentication
/// await SettingsPreloader.preloadAll();
/// 
/// // Or preload specific categories
/// await SettingsPreloader.preloadAccessibility();
/// ```
class SettingsPreloader {
  static final _log = LoggingService.instance;
  static const String _tag = 'SettingsPreloader';

  static bool _isPreloading = false;
  static bool _hasPreloaded = false;
  static final List<String> _preloadedCategories = [];

  /// Whether preloading is currently in progress
  static bool get isPreloading => _isPreloading;

  /// Whether preloading has completed at least once
  static bool get hasPreloaded => _hasPreloaded;

  /// List of categories that have been preloaded
  static List<String> get preloadedCategories => List.unmodifiable(_preloadedCategories);

  /// Preload all commonly accessed settings
  /// 
  /// This runs in parallel for efficiency and doesn't block the UI.
  /// Failures are logged but don't interrupt other preloads.
  static Future<void> preloadAll() async {
    if (_isPreloading) {
      _log.debug('Preload already in progress, skipping', tag: _tag);
      return;
    }

    _isPreloading = true;
    _log.info('Starting settings preload...', tag: _tag);
    final stopwatch = Stopwatch()..start();

    try {
      await Future.wait([
        _safePreload('accessibility', preloadAccessibility),
        _safePreload('locale', preloadLocale),
        // Add more categories as needed
      ]);

      stopwatch.stop();
      _hasPreloaded = true;
      _log.info(
        'Settings preload completed in ${stopwatch.elapsedMilliseconds}ms '
        '(${_preloadedCategories.length} categories)',
        tag: _tag,
      );
    } finally {
      _isPreloading = false;
    }
  }

  /// Safely execute a preload function, catching errors
  static Future<void> _safePreload(
    String category,
    Future<void> Function() preloader,
  ) async {
    try {
      await preloader();
      if (!_preloadedCategories.contains(category)) {
        _preloadedCategories.add(category);
      }
    } catch (e) {
      _log.warning('Failed to preload $category settings', tag: _tag, error: e);
    }
  }

  /// Preload accessibility settings
  static Future<void> preloadAccessibility() async {
    _log.debug('Preloading accessibility settings...', tag: _tag);
    await AccessibilityService.instance.loadSettings();
  }

  /// Preload locale settings
  static Future<void> preloadLocale() async {
    _log.debug('Preloading locale settings...', tag: _tag);
    // LocaleService.instance.loadSettings() is called during init
    // This ensures it's loaded if not already
    await Future.delayed(Duration.zero); // Placeholder for locale load
  }

  /// Preload notification preferences
  /// 
  /// Note: This requires ProfileService which may not be available
  /// in all contexts. The preload is skipped if profile is not loaded.
  static Future<void> preloadNotifications() async {
    _log.debug('Preloading notification preferences...', tag: _tag);
    // ProfileService handles its own caching, but we can trigger
    // a prefetch here if needed
    await Future.delayed(Duration.zero); // Placeholder
  }

  /// Clear preloaded state (useful on logout)
  static void reset() {
    _hasPreloaded = false;
    _preloadedCategories.clear();
    _log.debug('Settings preloader state reset', tag: _tag);
  }

  /// Check if a specific category has been preloaded
  static bool isCategoryPreloaded(String category) {
    return _preloadedCategories.contains(category);
  }
}

/// Extension to integrate settings preloading with auth state changes
extension SettingsPreloaderIntegration on SettingsPreloader {
  /// Call this after successful authentication to preload settings
  static Future<void> onAuthenticated() async {
    await SettingsPreloader.preloadAll();
  }

  /// Call this on sign out to reset preloaded state
  static void onSignedOut() {
    SettingsPreloader.reset();
  }
}
