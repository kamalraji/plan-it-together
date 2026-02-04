import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/services/logging_service.dart';
import '../models/security_preferences_models.dart';
import '../supabase/supabase_config.dart';

/// Enhanced security service for advanced security features
class EnhancedSecurityService {
  static const String _tag = 'EnhancedSecurityService';
  static final _log = LoggingService.instance;
  
  static EnhancedSecurityService? _instance;
  static EnhancedSecurityService get instance => _instance ??= EnhancedSecurityService._();
  EnhancedSecurityService._();

  final _supabase = Supabase.instance.client;

  // Cache
  UserSecurityPreferences? _cachedPreferences;
  SecurityNotificationPreferences? _cachedNotificationPrefs;

  /// Check if a password has been breached
  Future<PasswordBreachResult?> checkPasswordBreach(String password, {bool checkHistory = true}) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      
      final response = await http.post(
        Uri.parse('${SupabaseConfig.projectUrl}/functions/v1/check-password-breach'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${SupabaseConfig.anonKey}',
        },
        body: jsonEncode({
          'password': password,
          'userId': userId,
          'checkHistory': checkHistory,
        }),
      );

      if (response.statusCode == 200) {
        return PasswordBreachResult.fromJson(jsonDecode(response.body));
      }
      return null;
    } catch (e) {
      _log.error('Error checking password breach', tag: _tag, error: e);
      return null;
    }
  }

  /// Get user security preferences
  Future<UserSecurityPreferences> getSecurityPreferences() async {
    if (_cachedPreferences != null) return _cachedPreferences!;

    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return UserSecurityPreferences.empty('');

    try {
      final response = await _supabase
          .from('user_security_preferences')
          .select()
          .eq('user_id', userId)
          .maybeSingle();

      if (response != null) {
        _cachedPreferences = UserSecurityPreferences.fromJson(response);
        return _cachedPreferences!;
      }

      // Create default preferences
      final defaultPrefs = UserSecurityPreferences.empty(userId);
      await _supabase.from('user_security_preferences').insert({
        'user_id': userId,
        'session_timeout_minutes': defaultPrefs.sessionTimeoutMinutes,
        'idle_timeout_enabled': defaultPrefs.idleTimeoutEnabled,
        'require_reauthentication_sensitive': defaultPrefs.requireReauthenticationSensitive,
      });

      final newResponse = await _supabase
          .from('user_security_preferences')
          .select()
          .eq('user_id', userId)
          .single();
      
      _cachedPreferences = UserSecurityPreferences.fromJson(newResponse);
      return _cachedPreferences!;
    } catch (e) {
      _log.error('Error getting security preferences', tag: _tag, error: e);
      return UserSecurityPreferences.empty(userId);
    }
  }

  /// Update session timeout
  Future<bool> updateSessionTimeout(int minutes) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return false;

    try {
      await _supabase
          .from('user_security_preferences')
          .update({'session_timeout_minutes': minutes})
          .eq('user_id', userId);

      _cachedPreferences = _cachedPreferences?.copyWith(sessionTimeoutMinutes: minutes);
      _log.debug('Session timeout updated to $minutes minutes', tag: _tag);
      return true;
    } catch (e) {
      _log.error('Error updating session timeout', tag: _tag, error: e);
      return false;
    }
  }

  /// Update idle timeout enabled
  Future<bool> updateIdleTimeoutEnabled(bool enabled) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return false;

    try {
      await _supabase
          .from('user_security_preferences')
          .update({'idle_timeout_enabled': enabled})
          .eq('user_id', userId);

      _cachedPreferences = _cachedPreferences?.copyWith(idleTimeoutEnabled: enabled);
      _log.debug('Idle timeout set to $enabled', tag: _tag);
      return true;
    } catch (e) {
      _log.error('Error updating idle timeout', tag: _tag, error: e);
      return false;
    }
  }

  /// Update require reauthentication for sensitive operations
  Future<bool> updateRequireReauthentication(bool required) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return false;

    try {
      await _supabase
          .from('user_security_preferences')
          .update({'require_reauthentication_sensitive': required})
          .eq('user_id', userId);

      _cachedPreferences = _cachedPreferences?.copyWith(requireReauthenticationSensitive: required);
      _log.debug('Reauthentication requirement set to $required', tag: _tag);
      return true;
    } catch (e) {
      _log.error('Error updating reauthentication requirement', tag: _tag, error: e);
      return false;
    }
  }

  /// Get security notification preferences
  Future<SecurityNotificationPreferences> getNotificationPreferences() async {
    if (_cachedNotificationPrefs != null) return _cachedNotificationPrefs!;

    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return SecurityNotificationPreferences.empty('');

    try {
      final response = await _supabase
          .from('security_notification_preferences')
          .select()
          .eq('user_id', userId)
          .maybeSingle();

      if (response != null) {
        _cachedNotificationPrefs = SecurityNotificationPreferences.fromJson(response);
        return _cachedNotificationPrefs!;
      }

      // Create default preferences
      await _supabase.from('security_notification_preferences').insert({
        'user_id': userId,
      });

      final newResponse = await _supabase
          .from('security_notification_preferences')
          .select()
          .eq('user_id', userId)
          .single();
      
      _cachedNotificationPrefs = SecurityNotificationPreferences.fromJson(newResponse);
      return _cachedNotificationPrefs!;
    } catch (e) {
      _log.error('Error getting notification preferences', tag: _tag, error: e);
      return SecurityNotificationPreferences.empty(userId);
    }
  }

  /// Update notification preferences
  Future<bool> updateNotificationPreferences(SecurityNotificationPreferences prefs) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return false;

    try {
      await _supabase
          .from('security_notification_preferences')
          .update({
            'email_on_new_login': prefs.emailOnNewLogin,
            'email_on_password_change': prefs.emailOnPasswordChange,
            'email_on_2fa_change': prefs.emailOn2faChange,
            'email_on_suspicious_activity': prefs.emailOnSuspiciousActivity,
            'push_on_new_login': prefs.pushOnNewLogin,
            'push_on_password_change': prefs.pushOnPasswordChange,
            'push_on_2fa_change': prefs.pushOn2faChange,
            'push_on_suspicious_activity': prefs.pushOnSuspiciousActivity,
            'weekly_security_digest': prefs.weeklySecurityDigest,
          })
          .eq('user_id', userId);

      _cachedNotificationPrefs = prefs;
      _log.debug('Notification preferences updated', tag: _tag);
      return true;
    } catch (e) {
      _log.error('Error updating notification preferences', tag: _tag, error: e);
      return false;
    }
  }

  /// Get recent login attempts
  Future<List<LoginAttempt>> getRecentLoginAttempts({int limit = 20}) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return [];

    try {
      final response = await _supabase
          .from('login_attempts')
          .select()
          .eq('user_id', userId)
          .order('created_at', ascending: false)
          .limit(limit);

      return (response as List)
          .map((e) => LoginAttempt.fromJson(e))
          .toList();
    } catch (e) {
      _log.error('Error getting login attempts', tag: _tag, error: e);
      return [];
    }
  }

  /// Get failed login attempts count in last 24 hours
  Future<int> getRecentFailedAttempts() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return 0;

    try {
      final yesterday = DateTime.now().subtract(const Duration(hours: 24));
      final response = await _supabase
          .from('login_attempts')
          .select('id')
          .eq('user_id', userId)
          .eq('success', false)
          .gte('created_at', yesterday.toIso8601String());

      return (response as List).length;
    } catch (e) {
      _log.error('Error getting failed attempts', tag: _tag, error: e);
      return 0;
    }
  }

  /// Check geo anomaly for current login
  Future<GeoAnomalyResult?> checkGeoAnomaly({
    required String ipHash,
    String? country,
    String? city,
    double? lat,
    double? lng,
    String? userAgent,
  }) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return null;

    try {
      final response = await http.post(
        Uri.parse('${SupabaseConfig.projectUrl}/functions/v1/geo-anomaly-check'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${SupabaseConfig.anonKey}',
        },
        body: jsonEncode({
          'userId': userId,
          'currentIpHash': ipHash,
          'currentCountry': country,
          'currentCity': city,
          'currentLat': lat,
          'currentLng': lng,
          'userAgent': userAgent,
        }),
      );

      if (response.statusCode == 200) {
        return GeoAnomalyResult.fromJson(jsonDecode(response.body));
      }
      return null;
    } catch (e) {
      _log.error('Error checking geo anomaly', tag: _tag, error: e);
      return null;
    }
  }

  /// Clear cache
  void clearCache() {
    _cachedPreferences = null;
    _cachedNotificationPrefs = null;
    _log.debug('Security cache cleared', tag: _tag);
  }
}
