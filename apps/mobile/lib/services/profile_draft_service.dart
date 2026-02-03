import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:thittam1hub/services/logging_service.dart';

/// Service for auto-saving profile drafts to local storage
class ProfileDraftService {
  static const String _tag = 'ProfileDraftService';
  static final _log = LoggingService.instance;
  
  static const String _draftKey = 'profile_edit_draft';
  static const String _draftTimestampKey = 'profile_edit_draft_timestamp';
  
  /// Maximum age of a draft in hours before it's considered stale
  static const int _maxDraftAgeHours = 24;

  /// Saves a draft of the profile form data
  Future<void> saveDraft(Map<String, String> fields) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final json = jsonEncode(fields);
      await prefs.setString(_draftKey, json);
      await prefs.setInt(_draftTimestampKey, DateTime.now().millisecondsSinceEpoch);
      _log.debug('Profile draft saved', tag: _tag);
    } catch (e) {
      _log.error('Failed to save profile draft', tag: _tag, error: e);
    }
  }

  /// Loads any existing draft, returns null if no valid draft exists
  Future<Map<String, String>?> loadDraft() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final json = prefs.getString(_draftKey);
      final timestamp = prefs.getInt(_draftTimestampKey);
      
      if (json == null || timestamp == null) return null;
      
      // Check if draft is too old
      final draftAge = DateTime.now().millisecondsSinceEpoch - timestamp;
      final draftAgeHours = draftAge / (1000 * 60 * 60);
      
      if (draftAgeHours > _maxDraftAgeHours) {
        await clearDraft();
        return null;
      }
      
      final decoded = jsonDecode(json) as Map<String, dynamic>;
      return decoded.map((key, value) => MapEntry(key, value.toString()));
    } catch (e) {
      _log.error('Failed to load profile draft', tag: _tag, error: e);
      return null;
    }
  }

  /// Gets the age of the current draft
  Future<Duration?> getDraftAge() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final timestamp = prefs.getInt(_draftTimestampKey);
      
      if (timestamp == null) return null;
      
      final age = DateTime.now().millisecondsSinceEpoch - timestamp;
      return Duration(milliseconds: age);
    } catch (e) {
      return null;
    }
  }

  /// Clears the current draft
  Future<void> clearDraft() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_draftKey);
      await prefs.remove(_draftTimestampKey);
      _log.debug('Profile draft cleared', tag: _tag);
    } catch (e) {
      _log.error('Failed to clear profile draft', tag: _tag, error: e);
    }
  }

  /// Checks if a draft exists
  Future<bool> hasDraft() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.containsKey(_draftKey);
    } catch (e) {
      return false;
    }
  }
}
