import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:thittam1hub/services/logging_mixin.dart';

/// Service to manage and persist theme preferences
/// Uses LoggingMixin for standardized logging since it extends ChangeNotifier
class ThemeService extends ChangeNotifier with LoggingMixin {
  @override
  String get logTag => 'ThemeService';
  
  static const String _themeKey = 'theme_mode';
  ThemeMode _themeMode = ThemeMode.system;

  ThemeMode get themeMode => _themeMode;

  /// Load saved theme mode from SharedPreferences
  Future<void> loadThemeMode() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final mode = prefs.getString(_themeKey) ?? 'system';
      _themeMode = ThemeMode.values.firstWhere(
        (e) => e.name == mode,
        orElse: () => ThemeMode.system,
      );
      logInfo('Theme loaded', metadata: {'mode': _themeMode.name});
      notifyListeners();
    } catch (e) {
      logError('Failed to load theme mode', error: e);
    }
  }

  /// Set and persist theme mode
  Future<void> setThemeMode(ThemeMode mode) async {
    if (_themeMode == mode) return;
    
    _themeMode = mode;
    notifyListeners();
    
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_themeKey, mode.name);
      logInfo('Theme saved', metadata: {'mode': mode.name});
    } catch (e) {
      logError('Failed to save theme mode', error: e);
    }
  }

  /// Get display name for theme mode
  String getThemeModeDisplayName(ThemeMode mode) {
    switch (mode) {
      case ThemeMode.system:
        return 'System';
      case ThemeMode.light:
        return 'Light';
      case ThemeMode.dark:
        return 'Dark';
    }
  }

  /// Get icon for theme mode
  IconData getThemeModeIcon(ThemeMode mode) {
    switch (mode) {
      case ThemeMode.system:
        return Icons.brightness_auto;
      case ThemeMode.light:
        return Icons.light_mode;
      case ThemeMode.dark:
        return Icons.dark_mode;
    }
  }
}
