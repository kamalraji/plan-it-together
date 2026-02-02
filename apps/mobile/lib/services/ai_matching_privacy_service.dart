import 'package:thittam1hub/models/ai_matching_privacy_settings.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/services/logging_service.dart';

/// Service for managing AI Matching Privacy Settings
/// 
/// Handles CRUD operations for the `ai_matching_privacy_settings` table
/// and provides methods for managing hidden users.
class AIMatchingPrivacyService {
  static final AIMatchingPrivacyService _instance = AIMatchingPrivacyService._internal();
  static AIMatchingPrivacyService get instance => _instance;
  
  AIMatchingPrivacyService._internal();

  static const String _tag = 'AIMatchingPrivacyService';
  static final _log = LoggingService.instance;

  /// Get current user's AI matching privacy settings
  Future<AIMatchingPrivacySettings?> getSettings() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) {
      _log.warning('No authenticated user', tag: _tag);
      return null;
    }

    try {
      final response = await SupabaseConfig.client
          .from('ai_matching_privacy_settings')
          .select()
          .eq('user_id', userId)
          .maybeSingle();

      if (response == null) {
        // Return default settings if none exist
        return AIMatchingPrivacySettings.empty(userId);
      }

      return AIMatchingPrivacySettings.fromJson(response);
    } catch (e) {
      _log.error('Failed to get AI matching privacy settings: $e', tag: _tag);
      return AIMatchingPrivacySettings.empty(userId);
    }
  }

  /// Update AI matching privacy settings
  Future<bool> updateSettings(AIMatchingPrivacySettings settings) async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) {
      _log.warning('No authenticated user', tag: _tag);
      return false;
    }

    try {
      await SupabaseConfig.client
          .from('ai_matching_privacy_settings')
          .upsert(
            settings.copyWith(userId: userId).toJson(),
            onConflict: 'user_id',
          );

      _log.info('Updated AI matching privacy settings', tag: _tag);
      return true;
    } catch (e) {
      _log.error('Failed to update AI matching privacy settings: $e', tag: _tag);
      return false;
    }
  }

  /// Toggle AI matching on/off
  Future<bool> toggleAiMatching(bool enabled) async {
    final settings = await getSettings();
    if (settings == null) return false;

    final updated = settings.copyWith(
      aiMatchingEnabled: enabled,
      consentGivenAt: enabled && !settings.hasConsent ? DateTime.now() : settings.consentGivenAt,
    );

    return updateSettings(updated);
  }

  /// Update visibility in recommendations
  Future<bool> setShowInRecommendations(bool show) async {
    final settings = await getSettings();
    if (settings == null) return false;

    return updateSettings(settings.copyWith(showInRecommendations: show));
  }

  /// Update mutual interests only setting
  Future<bool> setOnlyMutualInterests(bool onlyMutual) async {
    final settings = await getSettings();
    if (settings == null) return false;

    return updateSettings(settings.copyWith(onlyShowToMutualInterests: onlyMutual));
  }

  /// Add a user to the hidden list
  Future<bool> hideUser(String userIdToHide) async {
    final settings = await getSettings();
    if (settings == null) return false;

    if (settings.hideFromUsers.contains(userIdToHide)) {
      return true; // Already hidden
    }

    final updatedList = [...settings.hideFromUsers, userIdToHide];
    return updateSettings(settings.copyWith(hideFromUsers: updatedList));
  }

  /// Remove a user from the hidden list
  Future<bool> unhideUser(String userIdToUnhide) async {
    final settings = await getSettings();
    if (settings == null) return false;

    final updatedList = settings.hideFromUsers
        .where((id) => id != userIdToUnhide)
        .toList();

    return updateSettings(settings.copyWith(hideFromUsers: updatedList));
  }

  /// Get list of hidden user IDs
  Future<List<String>> getHiddenUsers() async {
    final settings = await getSettings();
    return settings?.hideFromUsers ?? [];
  }

  /// Clear all hidden users
  Future<bool> clearHiddenUsers() async {
    final settings = await getSettings();
    if (settings == null) return false;

    return updateSettings(settings.copyWith(hideFromUsers: []));
  }

  /// Update data source inclusion settings
  Future<bool> updateDataSources({
    bool? includeActivity,
    bool? includeBio,
    bool? includeInterests,
    bool? includeSkills,
  }) async {
    final settings = await getSettings();
    if (settings == null) return false;

    return updateSettings(settings.copyWith(
      includeActivityInMatching: includeActivity,
      includeBioInMatching: includeBio,
      includeInterestsInMatching: includeInterests,
      includeSkillsInMatching: includeSkills,
    ));
  }

  /// Revoke AI matching consent and disable all features
  Future<bool> revokeConsent() async {
    final settings = await getSettings();
    if (settings == null) return false;

    return updateSettings(settings.copyWith(
      aiMatchingEnabled: false,
      allowAiInsights: false,
      showInRecommendations: false,
      includeActivityInMatching: false,
      includeBioInMatching: false,
      includeInterestsInMatching: false,
      includeSkillsInMatching: false,
    ));
  }
}
