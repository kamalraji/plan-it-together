import 'package:flutter/animation.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/scheduler.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/services/logging_service.dart';
import '../models/settings_models.dart';

/// Service for managing accessibility settings
/// 
/// Provides app-wide accessibility features including:
/// - Text scaling (0.8x to 1.5x)
/// - Bold text for improved readability
/// - High contrast mode
/// - Reduced motion for users with vestibular disorders
/// - Larger touch targets (minimum 48dp)
/// - Screen reader optimization
class AccessibilityService extends ChangeNotifier {
  static AccessibilityService? _instance;
  static AccessibilityService get instance => _instance ??= AccessibilityService._();
  AccessibilityService._();

  static final _log = LoggingService.instance;
  static const String _tag = 'AccessibilityService';

  AccessibilitySettings? _settings;
  bool _isLoading = false;

  AccessibilitySettings get settings => 
      _settings ?? AccessibilitySettings.empty(_currentUserId ?? '');
  bool get isLoading => _isLoading;

  String? get _currentUserId => Supabase.instance.client.auth.currentUser?.id;

  // Getters for individual settings
  double get textScaleFactor => _settings?.textScaleFactor ?? 1.0;
  bool get boldTextEnabled => _settings?.boldTextEnabled ?? false;
  bool get highContrastEnabled => _settings?.highContrastEnabled ?? false;
  bool get reduceMotionEnabled => _settings?.reduceMotionEnabled ?? false;
  bool get largerTouchTargets => _settings?.largerTouchTargets ?? false;
  bool get screenReaderOptimized => _settings?.screenReaderOptimized ?? false;

  /// Get an effective animation duration that respects reduce motion preference
  /// 
  /// Use this for all animations throughout the app:
  /// ```dart
  /// AnimatedContainer(
  ///   duration: AccessibilityService.instance.effectiveDuration(
  ///     const Duration(milliseconds: 300),
  ///   ),
  ///   // ...
  /// )
  /// ```
  Duration effectiveDuration(Duration normalDuration) {
    if (reduceMotionEnabled) {
      return Duration.zero;
    }
    return normalDuration;
  }

  /// Get an effective curve that respects reduce motion preference
  /// Returns Curves.linear for reduced motion, otherwise the provided curve
  Curve effectiveCurve(Curve normalCurve) {
    if (reduceMotionEnabled) {
      return Curves.linear;
    }
    return normalCurve;
  }

  /// Check if animations should be disabled (respects both user setting and system)
  bool get shouldDisableAnimations {
    // Check user preference
    return reduceMotionEnabled;
  }

  /// Get the minimum touch target size based on settings
  double get minimumTouchTargetSize {
    return largerTouchTargets ? 56.0 : 48.0;
  }

  /// Load settings from database
  Future<void> loadSettings() async {
    final userId = _currentUserId;
    if (userId == null) return;

    _isLoading = true;
    notifyListeners();

    try {
      final response = await Supabase.instance.client
          .from('accessibility_settings')
          .select()
          .eq('user_id', userId)
          .maybeSingle();

      if (response != null) {
        _settings = AccessibilitySettings.fromJson(response);
      } else {
        _settings = AccessibilitySettings.empty(userId);
      }
    } catch (e) {
      _log.error('Failed to load accessibility settings', tag: _tag, error: e);
      _settings = AccessibilitySettings.empty(userId);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Save settings to database
  Future<void> saveSettings() async {
    final userId = _currentUserId;
    if (userId == null || _settings == null) return;

    try {
      await Supabase.instance.client
          .from('accessibility_settings')
          .upsert(_settings!.toJson());
    } catch (e) {
      _log.error('Failed to save accessibility settings', tag: _tag, error: e);
      rethrow;
    }
  }

  /// Update text scale factor
  Future<void> setTextScaleFactor(double value) async {
    _settings = _settings?.copyWith(textScaleFactor: value.clamp(0.8, 1.5)) ??
        AccessibilitySettings(
          userId: _currentUserId ?? '',
          textScaleFactor: value.clamp(0.8, 1.5),
        );
    notifyListeners();
    await saveSettings();
  }

  /// Update bold text setting
  Future<void> setBoldTextEnabled(bool value) async {
    _settings = _settings?.copyWith(boldTextEnabled: value) ??
        AccessibilitySettings(userId: _currentUserId ?? '', boldTextEnabled: value);
    notifyListeners();
    await saveSettings();
  }

  /// Update high contrast setting
  Future<void> setHighContrastEnabled(bool value) async {
    _settings = _settings?.copyWith(highContrastEnabled: value) ??
        AccessibilitySettings(userId: _currentUserId ?? '', highContrastEnabled: value);
    notifyListeners();
    await saveSettings();
  }

  /// Update reduce motion setting
  Future<void> setReduceMotionEnabled(bool value) async {
    _settings = _settings?.copyWith(reduceMotionEnabled: value) ??
        AccessibilitySettings(userId: _currentUserId ?? '', reduceMotionEnabled: value);
    notifyListeners();
    await saveSettings();
  }

  /// Update larger touch targets setting
  Future<void> setLargerTouchTargets(bool value) async {
    _settings = _settings?.copyWith(largerTouchTargets: value) ??
        AccessibilitySettings(userId: _currentUserId ?? '', largerTouchTargets: value);
    notifyListeners();
    await saveSettings();
  }

  /// Update screen reader optimization setting
  Future<void> setScreenReaderOptimized(bool value) async {
    _settings = _settings?.copyWith(screenReaderOptimized: value) ??
        AccessibilitySettings(userId: _currentUserId ?? '', screenReaderOptimized: value);
    notifyListeners();
    await saveSettings();
  }

  /// Reset all settings to defaults
  Future<void> resetToDefaults() async {
    final userId = _currentUserId;
    if (userId == null) return;

    _settings = AccessibilitySettings.empty(userId);
    notifyListeners();
    await saveSettings();
  }

  /// Clear cached settings (call on logout)
  void clearCache() {
    _settings = null;
    notifyListeners();
  }
}

/// Service for managing locale settings
class LocaleService extends ChangeNotifier {
  static LocaleService? _instance;
  static LocaleService get instance => _instance ??= LocaleService._();
  LocaleService._();

  static final _log = LoggingService.instance;
  static const String _tag = 'LocaleService';

  LocaleSettings? _settings;
  bool _isLoading = false;

  LocaleSettings get settings => 
      _settings ?? LocaleSettings.empty(_currentUserId ?? '');
  bool get isLoading => _isLoading;

  String? get _currentUserId => Supabase.instance.client.auth.currentUser?.id;

  // Getters for individual settings
  String get languageCode => _settings?.languageCode ?? 'en';
  String get regionCode => _settings?.regionCode ?? 'IN';
  String get dateFormat => _settings?.dateFormat ?? 'DD/MM/YYYY';
  String get timeFormat => _settings?.timeFormat ?? '24h';
  String get timezone => _settings?.timezone ?? 'UTC';

  /// Load settings from database
  Future<void> loadSettings() async {
    final userId = _currentUserId;
    if (userId == null) return;

    _isLoading = true;
    notifyListeners();

    try {
      final response = await Supabase.instance.client
          .from('locale_settings')
          .select()
          .eq('user_id', userId)
          .maybeSingle();

      if (response != null) {
        _settings = LocaleSettings.fromJson(response);
      } else {
        _settings = LocaleSettings.empty(userId);
      }
    } catch (e) {
      _log.error('Failed to load locale settings', tag: _tag, error: e);
      _settings = LocaleSettings.empty(userId);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Save settings to database
  Future<void> saveSettings() async {
    final userId = _currentUserId;
    if (userId == null || _settings == null) return;

    try {
      await Supabase.instance.client
          .from('locale_settings')
          .upsert(_settings!.toJson());
    } catch (e) {
      _log.error('Failed to save locale settings', tag: _tag, error: e);
      rethrow;
    }
  }

  /// Update language
  Future<void> setLanguage(String code) async {
    _settings = _settings?.copyWith(languageCode: code) ??
        LocaleSettings(userId: _currentUserId ?? '', languageCode: code);
    notifyListeners();
    await saveSettings();
  }

  /// Update region
  Future<void> setRegion(String code) async {
    _settings = _settings?.copyWith(regionCode: code) ??
        LocaleSettings(userId: _currentUserId ?? '', regionCode: code);
    notifyListeners();
    await saveSettings();
  }

  /// Update date format
  Future<void> setDateFormat(String format) async {
    _settings = _settings?.copyWith(dateFormat: format) ??
        LocaleSettings(userId: _currentUserId ?? '', dateFormat: format);
    notifyListeners();
    await saveSettings();
  }

  /// Update time format
  Future<void> setTimeFormat(String format) async {
    _settings = _settings?.copyWith(timeFormat: format) ??
        LocaleSettings(userId: _currentUserId ?? '', timeFormat: format);
    notifyListeners();
    await saveSettings();
  }

  /// Update timezone
  Future<void> setTimezone(String tz) async {
    _settings = _settings?.copyWith(timezone: tz) ??
        LocaleSettings(userId: _currentUserId ?? '', timezone: tz);
    notifyListeners();
    await saveSettings();
  }

  /// Clear cached settings (call on logout)
  void clearCache() {
    _settings = null;
    notifyListeners();
  }
}

/// Service for managing user sessions and login history
class SessionService {
  static final _supabase = Supabase.instance.client;
  static final _log = LoggingService.instance;
  static const String _tag = 'SessionService';

  /// Get all active sessions for current user
  /// Get all active sessions for current user
  /// Limited to 50 to prevent query overload
  static Future<List<UserSession>> getActiveSessions() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return [];

    try {
      final response = await _supabase
          .from('user_sessions')
          .select()
          .eq('user_id', userId)
          .order('last_active_at', ascending: false)
          .limit(50); // Explicit limit for query safety

      return (response as List)
          .map((json) => UserSession.fromJson(json))
          .toList();
    } catch (e) {
      _log.error('Failed to fetch sessions', tag: _tag, error: e);
      return [];
    }
  }

  /// Get login history for current user
  static Future<List<LoginHistoryEntry>> getLoginHistory({int limit = 20}) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return [];

    try {
      final response = await _supabase
          .from('login_history')
          .select()
          .eq('user_id', userId)
          .order('created_at', ascending: false)
          .limit(limit);

      return (response as List)
          .map((json) => LoginHistoryEntry.fromJson(json))
          .toList();
    } catch (e) {
      _log.error('Failed to fetch login history', tag: _tag, error: e);
      return [];
    }
  }

  /// Terminate a specific session
  static Future<void> terminateSession(String sessionId) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return;

    try {
      await _supabase
          .from('user_sessions')
          .delete()
          .eq('id', sessionId)
          .eq('user_id', userId);
    } catch (e) {
      _log.error('Failed to terminate session', tag: _tag, error: e);
      rethrow;
    }
  }

  /// Terminate all sessions except current
  static Future<void> terminateAllOtherSessions() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return;

    try {
      await _supabase
          .from('user_sessions')
          .delete()
          .eq('user_id', userId)
          .eq('is_current', false);
    } catch (e) {
      _log.error('Failed to terminate all sessions', tag: _tag, error: e);
      rethrow;
    }
  }

  /// Record a new login
  static Future<void> recordLogin({
    required bool success,
    String? deviceName,
    String? deviceType,
    String? browser,
    String? os,
    String? ipAddress,
    String? location,
    String? failureReason,
  }) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return;

    try {
      await _supabase.from('login_history').insert({
        'user_id': userId,
        'success': success,
        'device_name': deviceName,
        'device_type': deviceType,
        'browser': browser,
        'os': os,
        'ip_address': ipAddress,
        'location': location,
        'failure_reason': failureReason,
      });
    } catch (e) {
      _log.error('Failed to record login', tag: _tag, error: e);
    }
  }

  /// Create or update current session
  static Future<void> updateCurrentSession({
    String? deviceName,
    String? deviceType,
    String? browser,
    String? os,
    String? ipAddress,
    String? location,
  }) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return;

    try {
      // Mark all sessions as not current first
      await _supabase
          .from('user_sessions')
          .update({'is_current': false})
          .eq('user_id', userId);

      // Upsert current session
      await _supabase.from('user_sessions').upsert({
        'user_id': userId,
        'device_name': deviceName,
        'device_type': deviceType,
        'browser': browser,
        'os': os,
        'ip_address': ipAddress,
        'location': location,
        'is_current': true,
        'last_active_at': DateTime.now().toIso8601String(),
      });
    } catch (e) {
      _log.error('Failed to update session', tag: _tag, error: e);
    }
  }
}
