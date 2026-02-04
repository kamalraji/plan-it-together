import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:thittam1hub/services/logging_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';

/// Message Translation Service
/// Provides on-demand message translation with caching
class TranslationService {
  static TranslationService? _instance;
  static TranslationService get instance => _instance ??= TranslationService._();
  TranslationService._();

  static const String _tag = 'TranslationService';
  static final _log = LoggingService.instance;
  static const String _preferredLanguageKey = 'preferred_translation_language';
  static const String _autoTranslateKey = 'auto_translate_enabled';
  static const Duration _cacheDuration = Duration(days: 30);

  // Local cache for translations
  final Map<String, CachedTranslation> _cache = {};
  String? _preferredLanguage;
  bool _autoTranslateEnabled = false;

  // Supported languages
  static const Map<String, String> supportedLanguages = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'ta': 'Tamil',
    'te': 'Telugu',
    'ml': 'Malayalam',
    'kn': 'Kannada',
  };

  /// Initialize translation service
  Future<void> initialize() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _preferredLanguage = prefs.getString(_preferredLanguageKey);
      _autoTranslateEnabled = prefs.getBool(_autoTranslateKey) ?? false;
      
      _log.serviceInitialized(_tag);
      _log.debug('Preferred: $_preferredLanguage, auto: $_autoTranslateEnabled', tag: _tag);
    } catch (e) {
      _log.serviceInitFailed(_tag, e);
    }
  }

  /// Get preferred translation language
  String? get preferredLanguage => _preferredLanguage;

  /// Check if auto-translate is enabled
  bool get autoTranslateEnabled => _autoTranslateEnabled;

  /// Set preferred translation language
  Future<void> setPreferredLanguage(String? languageCode) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (languageCode != null) {
        await prefs.setString(_preferredLanguageKey, languageCode);
      } else {
        await prefs.remove(_preferredLanguageKey);
      }
      _preferredLanguage = languageCode;
      
      _log.info('Preferred language set to: $languageCode', tag: _tag);
    } catch (e) {
      _log.error('Failed to set preferred language', tag: _tag, error: e);
    }
  }

  /// Enable/disable auto-translate
  Future<void> setAutoTranslate(bool enabled) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_autoTranslateKey, enabled);
      _autoTranslateEnabled = enabled;
      
      _log.info('Auto-translate: $enabled', tag: _tag);
    } catch (e) {
      _log.error('Failed to set auto-translate', tag: _tag, error: e);
    }
  }

  /// Detect language of text
  Future<String?> detectLanguage(String text) async {
    if (text.length < 3) return null;

    try {
      // TODO: Integrate with actual language detection API
      // For now, use simple heuristics
      
      // Check for common language patterns
      if (RegExp(r'[\u4e00-\u9fff]').hasMatch(text)) return 'zh';
      if (RegExp(r'[\u3040-\u309f\u30a0-\u30ff]').hasMatch(text)) return 'ja';
      if (RegExp(r'[\uac00-\ud7af]').hasMatch(text)) return 'ko';
      if (RegExp(r'[\u0600-\u06ff]').hasMatch(text)) return 'ar';
      if (RegExp(r'[\u0900-\u097f]').hasMatch(text)) return 'hi';
      if (RegExp(r'[\u0b80-\u0bff]').hasMatch(text)) return 'ta';
      if (RegExp(r'[\u0c00-\u0c7f]').hasMatch(text)) return 'te';
      if (RegExp(r'[\u0d00-\u0d7f]').hasMatch(text)) return 'ml';
      if (RegExp(r'[\u0c80-\u0cff]').hasMatch(text)) return 'kn';
      if (RegExp(r'[\u0400-\u04ff]').hasMatch(text)) return 'ru';
      
      // Default to English for Latin script
      return 'en';
    } catch (e) {
      _log.warning('Language detection failed', tag: _tag, error: e);
      return null;
    }
  }

  /// Translate message to target language
  Future<TranslationResult> translateMessage({
    required String messageId,
    required String content,
    required String targetLanguage,
    String? sourceLanguage,
  }) async {
    // Check cache first
    final cacheKey = '$messageId:$targetLanguage';
    final cached = _cache[cacheKey];
    if (cached != null && !cached.isExpired) {
      return TranslationResult(
        originalContent: content,
        translatedContent: cached.translatedContent,
        sourceLanguage: cached.sourceLanguage,
        targetLanguage: targetLanguage,
        isFromCache: true,
      );
    }

    // Check database cache
    final dbCached = await _getFromDatabase(messageId, targetLanguage);
    if (dbCached != null) {
      _cache[cacheKey] = CachedTranslation(
        translatedContent: dbCached.translatedContent,
        sourceLanguage: dbCached.sourceLanguage,
        createdAt: DateTime.now(),
      );
      return dbCached;
    }

    // Perform translation
    try {
      final detectedSource = sourceLanguage ?? await detectLanguage(content) ?? 'en';
      
      // Skip if source and target are the same
      if (detectedSource == targetLanguage) {
        return TranslationResult(
          originalContent: content,
          translatedContent: content,
          sourceLanguage: detectedSource,
          targetLanguage: targetLanguage,
          isFromCache: false,
        );
      }

      // TODO: Integrate with actual translation API (Google Translate, DeepL, etc.)
      // For now, return a placeholder
      final translatedContent = await _performTranslation(
        content, 
        detectedSource, 
        targetLanguage,
      );

      // Cache result
      _cache[cacheKey] = CachedTranslation(
        translatedContent: translatedContent,
        sourceLanguage: detectedSource,
        createdAt: DateTime.now(),
      );

      // Save to database
      await _saveToDatabase(
        messageId: messageId,
        sourceLanguage: detectedSource,
        targetLanguage: targetLanguage,
        translatedContent: translatedContent,
      );

      return TranslationResult(
        originalContent: content,
        translatedContent: translatedContent,
        sourceLanguage: detectedSource,
        targetLanguage: targetLanguage,
        isFromCache: false,
      );
    } catch (e) {
      _log.error('Translation failed', tag: _tag, error: e);
      return TranslationResult(
        originalContent: content,
        translatedContent: content,
        sourceLanguage: sourceLanguage ?? 'unknown',
        targetLanguage: targetLanguage,
        isFromCache: false,
        error: 'Translation failed: $e',
      );
    }
  }

  Future<String> _performTranslation(
    String content,
    String sourceLanguage,
    String targetLanguage,
  ) async {
    // TODO: Implement actual translation API call
    // Example with LibreTranslate (free, self-hosted option):
    // final response = await http.post(
    //   Uri.parse('https://libretranslate.com/translate'),
    //   headers: {'Content-Type': 'application/json'},
    //   body: jsonEncode({
    //     'q': content,
    //     'source': sourceLanguage,
    //     'target': targetLanguage,
    //   }),
    // );
    // return jsonDecode(response.body)['translatedText'];

    // Placeholder - return original with indicator
    _log.debug('Translating from $sourceLanguage to $targetLanguage', tag: _tag);
    return '[Translated to ${supportedLanguages[targetLanguage] ?? targetLanguage}] $content';
  }

  Future<TranslationResult?> _getFromDatabase(String messageId, String targetLanguage) async {
    try {
      final response = await SupabaseConfig.client
          .from('message_translations')
          .select()
          .eq('message_id', messageId)
          .eq('target_language', targetLanguage)
          .limit(1);

      if ((response as List).isEmpty) return null;

      final data = response[0];
      return TranslationResult(
        originalContent: '',
        translatedContent: data['translated_content'] as String,
        sourceLanguage: data['source_language'] as String,
        targetLanguage: targetLanguage,
        isFromCache: true,
      );
    } catch (e) {
      _log.error('Failed to get from database', tag: _tag, error: e);
      return null;
    }
  }

  Future<void> _saveToDatabase({
    required String messageId,
    required String sourceLanguage,
    required String targetLanguage,
    required String translatedContent,
  }) async {
    try {
      await SupabaseConfig.client.from('message_translations').upsert({
        'message_id': messageId,
        'source_language': sourceLanguage,
        'target_language': targetLanguage,
        'translated_content': translatedContent,
      }, onConflict: 'message_id,target_language');
    } catch (e) {
      _log.error('Failed to save translation to database', tag: _tag, error: e);
    }
  }

  /// Clear translation cache
  void clearCache() {
    _cache.clear();
    _log.debug('Cache cleared', tag: _tag);
  }

  /// Get cache statistics
  Map<String, dynamic> getCacheStats() {
    final expired = _cache.values.where((c) => c.isExpired).length;
    return {
      'total': _cache.length,
      'expired': expired,
      'valid': _cache.length - expired,
    };
  }
}

/// Translation result
class TranslationResult {
  final String originalContent;
  final String translatedContent;
  final String sourceLanguage;
  final String targetLanguage;
  final bool isFromCache;
  final String? error;

  const TranslationResult({
    required this.originalContent,
    required this.translatedContent,
    required this.sourceLanguage,
    required this.targetLanguage,
    required this.isFromCache,
    this.error,
  });

  bool get hasError => error != null;
  bool get wasTranslated => originalContent != translatedContent;
  
  String get sourceLanguageName => 
      TranslationService.supportedLanguages[sourceLanguage] ?? sourceLanguage;
  String get targetLanguageName => 
      TranslationService.supportedLanguages[targetLanguage] ?? targetLanguage;
}

/// Cached translation entry
class CachedTranslation {
  final String translatedContent;
  final String sourceLanguage;
  final DateTime createdAt;

  const CachedTranslation({
    required this.translatedContent,
    required this.sourceLanguage,
    required this.createdAt,
  });

  bool get isExpired => 
      DateTime.now().difference(createdAt) > TranslationService._cacheDuration;
}
