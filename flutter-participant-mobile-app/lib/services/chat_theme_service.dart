import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
export 'package:shared_preferences/shared_preferences.dart' show SharedPreferences;
import 'package:thittam1hub/models/chat_theme_settings.dart';
import 'package:thittam1hub/services/logging_mixin.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';

/// Service for managing chat theme preferences with local cache and cloud sync
class ChatThemeService extends ChangeNotifier with LoggingMixin {
  static const String _localCacheKey = 'chat_theme_settings';
  static const String _tableName = 'chat_theme_settings';

  @override
  String get logTag => 'ChatThemeService';

  ChatThemeSettings? _settings;
  bool _isLoading = false;
  String? _error;

  /// Current theme settings (returns defaults if not loaded)
  ChatThemeSettings? get settings => _settings;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasSettings => _settings != null;

  /// Singleton instance
  static ChatThemeService? _instance;
  static ChatThemeService get instance => _instance ??= ChatThemeService._();

  ChatThemeService._();

  /// Initialize and load settings for the current user
  Future<ChatThemeSettings?> loadSettings() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) {
      _error = 'User not authenticated';
      return null;
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // 1. Try loading from local cache first (instant)
      final localSettings = await _loadFromLocal(userId);
      if (localSettings != null) {
        _settings = localSettings;
        notifyListeners();
      }

      // 2. Fetch from Supabase (async sync)
      final remoteSettings = await _loadFromSupabase(userId);
      if (remoteSettings != null) {
        _settings = remoteSettings;
        // Update local cache with remote data
        await _saveToLocal(remoteSettings);
      } else if (_settings == null) {
        // No remote data, create defaults
        _settings = ChatThemeSettings.defaults(userId);
      }

      _isLoading = false;
      notifyListeners();
      return _settings;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();

      // Return cached or default settings on error
      return _settings ?? ChatThemeSettings.defaults(userId);
    }
  }

  /// Update theme settings (saves to local + syncs to cloud)
  Future<void> updateSettings(ChatThemeSettings newSettings) async {
    final previousSettings = _settings;
    _settings = newSettings;
    notifyListeners();

    try {
      // 1. Save to local immediately (instant feedback)
      await _saveToLocal(newSettings);

      // 2. Sync to Supabase (background)
      await _saveToSupabase(newSettings);
    } catch (e) {
      logWarning('Failed to sync theme settings', error: e);
      // Keep local state even if cloud sync fails
      // Revert is optional - we keep local state
    }
  }

  /// Update a single preference field
  Future<void> updateTheme(String theme) async {
    if (_settings == null) return;
    await updateSettings(_settings!.copyWith(selectedTheme: theme));
  }

  Future<void> updateAccentColor(String colorHex) async {
    if (_settings == null) return;
    await updateSettings(_settings!.copyWith(accentColor: colorHex));
  }

  Future<void> updateBubbleStyle(String style) async {
    if (_settings == null) return;
    await updateSettings(_settings!.copyWith(bubbleStyle: style));
  }

  Future<void> updateFontSize(int size) async {
    if (_settings == null) return;
    final clampedSize = size.clamp(
      ChatThemeSettings.minFontSize,
      ChatThemeSettings.maxFontSize,
    );
    await updateSettings(_settings!.copyWith(fontSize: clampedSize));
  }

  Future<void> updateReducedMotion(bool enabled) async {
    if (_settings == null) return;
    await updateSettings(_settings!.copyWith(reducedMotion: enabled));
  }

  /// Reset to default settings
  Future<void> resetToDefaults() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return;

    final defaults = ChatThemeSettings.defaults(userId);
    await updateSettings(defaults);
  }

  /// Clear all cached data (for logout)
  Future<void> clearCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_localCacheKey);
      _settings = null;
      notifyListeners();
    } catch (e) {
      logWarning('Failed to clear theme cache', error: e);
    }
  }

  // ============= Private Methods =============

  /// Load settings from SharedPreferences
  Future<ChatThemeSettings?> _loadFromLocal(String userId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonString = prefs.getString(_localCacheKey);
      if (jsonString == null) return null;

      final json = jsonDecode(jsonString) as Map<String, dynamic>;
      final settings = ChatThemeSettings.fromJson(json);

      // Verify it's for the current user
      if (settings.userId != userId) return null;

      return settings;
    } catch (e) {
      logWarning('Failed to load local theme settings', error: e);
      return null;
    }
  }

  /// Save settings to SharedPreferences
  Future<void> _saveToLocal(ChatThemeSettings settings) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonString = jsonEncode(settings.toLocalJson());
      await prefs.setString(_localCacheKey, jsonString);
    } catch (e) {
      logWarning('Failed to save local theme settings', error: e);
    }
  }

  /// Load settings from Supabase
  Future<ChatThemeSettings?> _loadFromSupabase(String userId) async {
    try {
      final response = await SupabaseConfig.client
          .from(_tableName)
          .select()
          .eq('user_id', userId)
          .maybeSingle();

      if (response == null) return null;
      return ChatThemeSettings.fromJson(response);
    } catch (e) {
      logWarning('Failed to load remote theme settings', error: e);
      return null;
    }
  }

  /// Save settings to Supabase (upsert)
  Future<void> _saveToSupabase(ChatThemeSettings settings) async {
    try {
      await SupabaseConfig.client.from(_tableName).upsert(
        settings.toJson(),
        onConflict: 'user_id',
      );
    } catch (e) {
      logError('Failed to save remote theme settings', error: e);
      rethrow;
    }
  }
}
