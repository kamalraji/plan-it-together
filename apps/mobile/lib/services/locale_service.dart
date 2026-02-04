import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/services/logging_service.dart';
import 'package:thittam1hub/services/result.dart';

/// Service for managing locale/language settings
/// 
/// Provides app-wide locale management including:
/// - Language selection
/// - Locale persistence to Supabase
/// - Locale restoration on app start
class LocaleService extends ChangeNotifier {
  static LocaleService? _instance;
  static LocaleService get instance => _instance ??= LocaleService._();
  LocaleService._();

  static final _log = LoggingService.instance;
  static const String _tag = 'LocaleService';

  Locale _currentLocale = const Locale('en', 'US');
  bool _isLoading = false;

  Locale get currentLocale => _currentLocale;
  bool get isLoading => _isLoading;
  String get languageCode => _currentLocale.languageCode;

  SupabaseClient get _supabase => Supabase.instance.client;
  String? get _userId => _supabase.auth.currentUser?.id;

  /// Supported locales
  static const List<Locale> supportedLocales = [
    Locale('en', 'US'),
    Locale('es', 'ES'),
    Locale('fr', 'FR'),
    Locale('de', 'DE'),
    Locale('ja', 'JP'),
    Locale('zh', 'CN'),
    Locale('hi', 'IN'),
    Locale('ta', 'IN'),
  ];

  /// Get display name for a locale
  static String getLocaleName(Locale locale) {
    switch (locale.languageCode) {
      case 'en':
        return 'English';
      case 'es':
        return 'Español';
      case 'fr':
        return 'Français';
      case 'de':
        return 'Deutsch';
      case 'ja':
        return '日本語';
      case 'zh':
        return '中文';
      case 'hi':
        return 'हिन्दी';
      case 'ta':
        return 'தமிழ்';
      default:
        return locale.languageCode.toUpperCase();
    }
  }

  /// Initialize the service and load saved locale
  Future<void> initialize() async {
    if (_userId == null) return;

    _isLoading = true;
    notifyListeners();

    try {
      final response = await _supabase
          .from('user_profiles')
          .select('preferred_language')
          .eq('id', _userId!)
          .maybeSingle();

      if (response != null && response['preferred_language'] != null) {
        final langCode = response['preferred_language'] as String;
        _currentLocale = Locale(langCode);
        _log.info('Loaded locale: $langCode', tag: _tag);
      }
    } catch (e) {
      _log.error('Failed to load locale', tag: _tag, error: e);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Set the current locale
  Future<Result<void>> setLocale(Locale locale) async {
    if (_userId == null) {
      return Result.failure('User not authenticated');
    }

    final previousLocale = _currentLocale;
    _currentLocale = locale;
    notifyListeners();

    try {
      await _supabase
          .from('user_profiles')
          .update({'preferred_language': locale.languageCode})
          .eq('id', _userId!);

      _log.info('Set locale to: ${locale.languageCode}', tag: _tag);
      return Result.success(null);
    } catch (e) {
      // Rollback on failure
      _currentLocale = previousLocale;
      notifyListeners();
      _log.error('Failed to set locale', tag: _tag, error: e);
      return Result.failure('Failed to update language preference');
    }
  }

  /// Check if a locale is supported
  bool isSupported(Locale locale) {
    return supportedLocales.any((l) => l.languageCode == locale.languageCode);
  }
}
