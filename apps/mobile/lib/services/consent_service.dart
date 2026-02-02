import '../models/consent_models.dart';
import '../supabase/supabase_config.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/utils/result.dart';

/// Service for managing GDPR/CCPA consent preferences
class ConsentService extends BaseService {
  static ConsentService? _instance;
  static ConsentService get instance => _instance ??= ConsentService._();
  ConsentService._();

  @override
  String get tag => 'ConsentService';

  static const String _consentVersion = '1.0';
  
  List<ConsentCategory>? _categoriesCache;
  Map<String, UserConsent>? _userConsentsCache;

  /// Get all active consent categories
  Future<Result<List<ConsentCategory>>> getConsentCategories() => execute(() async {
    if (_categoriesCache != null) return _categoriesCache!;

    final response = await SupabaseConfig.client
        .from('consent_categories')
        .select()
        .eq('is_active', true)
        .order('sort_order');

    _categoriesCache = (response as List)
        .map((json) => ConsentCategory.fromJson(json))
        .toList();
    
    logDbOperation('SELECT', 'consent_categories', rowCount: _categoriesCache!.length);
    return _categoriesCache!;
  }, operationName: 'getConsentCategories');

  /// Get user's current consent preferences
  Future<Result<Map<String, UserConsent>>> getUserConsents() => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return <String, UserConsent>{};

    if (_userConsentsCache != null) return _userConsentsCache!;

    final response = await SupabaseConfig.client
        .from('user_consents')
        .select()
        .eq('user_id', userId);

    _userConsentsCache = {};
    for (final json in response as List) {
      final consent = UserConsent.fromJson(json);
      _userConsentsCache![consent.categoryKey] = consent;
    }
    
    logDbOperation('SELECT', 'user_consents', rowCount: _userConsentsCache!.length);
    return _userConsentsCache!;
  }, operationName: 'getUserConsents');

  /// Get combined consent preferences (categories with user state)
  Future<List<ConsentPreference>> getConsentPreferences() async {
    final categoriesResult = await getConsentCategories();
    final consentsResult = await getUserConsents();
    
    final categories = categoriesResult is Success<List<ConsentCategory>> 
        ? categoriesResult.data 
        : <ConsentCategory>[];
    final userConsents = consentsResult is Success<Map<String, UserConsent>> 
        ? consentsResult.data 
        : <String, UserConsent>{};

    return categories.map((category) {
      final consent = userConsents[category.key];
      return ConsentPreference(
        category: category,
        isGranted: category.isRequired || (consent?.isGranted ?? false),
        lastUpdated: consent?.updatedAt,
      );
    }).toList();
  }

  /// Update a single consent preference
  Future<Result<bool>> updateConsent(String categoryKey, bool isGranted) => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return false;

    final now = DateTime.now().toIso8601String();
    
    await SupabaseConfig.client.from('user_consents').upsert({
      'user_id': userId,
      'category_key': categoryKey,
      'is_granted': isGranted,
      'granted_at': isGranted ? now : null,
      'withdrawn_at': isGranted ? null : now,
      'consent_version': _consentVersion,
    }, onConflict: 'user_id,category_key');

    // Update cache
    _userConsentsCache?.remove(categoryKey);
    
    logDbOperation('UPSERT', 'user_consents', rowCount: 1);
    logInfo('Consent updated', metadata: {'category': categoryKey, 'granted': isGranted});
    return true;
  }, operationName: 'updateConsent');

  /// Update multiple consent preferences at once
  Future<Result<bool>> updateConsents(Map<String, bool> consents) => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return false;

    final now = DateTime.now().toIso8601String();
    
    final records = consents.entries.map((entry) => {
      'user_id': userId,
      'category_key': entry.key,
      'is_granted': entry.value,
      'granted_at': entry.value ? now : null,
      'withdrawn_at': entry.value ? null : now,
      'consent_version': _consentVersion,
    }).toList();

    await SupabaseConfig.client
        .from('user_consents')
        .upsert(records, onConflict: 'user_id,category_key');

    // Clear cache to force refresh
    _userConsentsCache = null;
    
    logDbOperation('UPSERT', 'user_consents', rowCount: records.length);
    logInfo('Batch consents updated', metadata: {'count': consents.length});
    return true;
  }, operationName: 'updateConsents');

  /// Accept all non-required consents
  Future<Result<bool>> acceptAll() async {
    final categoriesResult = await getConsentCategories();
    if (categoriesResult is! Success<List<ConsentCategory>>) {
      return const Failure('Failed to load categories');
    }
    
    final consents = <String, bool>{};
    for (final category in categoriesResult.data) {
      consents[category.key] = true;
    }
    
    return updateConsents(consents);
  }

  /// Reject all non-required consents (keep required ones)
  Future<Result<bool>> rejectAll() async {
    final categoriesResult = await getConsentCategories();
    if (categoriesResult is! Success<List<ConsentCategory>>) {
      return const Failure('Failed to load categories');
    }
    
    final consents = <String, bool>{};
    for (final category in categoriesResult.data) {
      consents[category.key] = category.isRequired;
    }
    
    return updateConsents(consents);
  }

  /// Check if user has made consent choices
  Future<bool> hasConsentBeenGiven() async {
    final result = await getUserConsents();
    if (result is Success<Map<String, UserConsent>>) {
      return result.data.isNotEmpty;
    }
    return false;
  }

  /// Get consent audit history
  Future<Result<List<ConsentAuditEntry>>> getConsentHistory() => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return <ConsentAuditEntry>[];

    final response = await SupabaseConfig.client
        .from('consent_audit_log')
        .select()
        .eq('user_id', userId)
        .order('created_at', ascending: false)
        .limit(50);

    final entries = (response as List)
        .map((json) => ConsentAuditEntry.fromJson(json))
        .toList();
    
    logDbOperation('SELECT', 'consent_audit_log', rowCount: entries.length);
    return entries;
  }, operationName: 'getConsentHistory');

  /// Submit a data subject request (GDPR rights)
  Future<Result<DataSubjectRequest?>> submitDataRequest({
    required String requestType,
    String? reason,
  }) => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return null;

    // GDPR requires response within 30 days
    final expiresAt = DateTime.now().add(const Duration(days: 30));

    final response = await SupabaseConfig.client
        .from('data_subject_requests')
        .insert({
          'user_id': userId,
          'request_type': requestType,
          'reason': reason,
          'expires_at': expiresAt.toIso8601String(),
        })
        .select()
        .single();

    logDbOperation('INSERT', 'data_subject_requests', rowCount: 1);
    logInfo('Data request submitted', metadata: {'type': requestType});
    return DataSubjectRequest.fromJson(response);
  }, operationName: 'submitDataRequest');

  /// Get user's data subject requests
  Future<Result<List<DataSubjectRequest>>> getDataRequests() => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return <DataSubjectRequest>[];

    final response = await SupabaseConfig.client
        .from('data_subject_requests')
        .select()
        .eq('user_id', userId)
        .order('requested_at', ascending: false);

    final requests = (response as List)
        .map((json) => DataSubjectRequest.fromJson(json))
        .toList();
    
    logDbOperation('SELECT', 'data_subject_requests', rowCount: requests.length);
    return requests;
  }, operationName: 'getDataRequests');

  /// Get current active privacy policy
  Future<Result<PrivacyPolicyVersion?>> getCurrentPolicy() => execute(() async {
    final response = await SupabaseConfig.client
        .from('privacy_policy_versions')
        .select()
        .eq('is_active', true)
        .order('effective_date', ascending: false)
        .limit(1)
        .maybeSingle();

    if (response == null) return null;
    logDbOperation('SELECT', 'privacy_policy_versions', rowCount: 1);
    return PrivacyPolicyVersion.fromJson(response);
  }, operationName: 'getCurrentPolicy');

  /// Acknowledge a privacy policy version
  Future<Result<bool>> acknowledgePolicy(String version) => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return false;

    await SupabaseConfig.client.from('user_policy_acknowledgments').upsert({
      'user_id': userId,
      'policy_version': version,
    }, onConflict: 'user_id,policy_version');

    logDbOperation('UPSERT', 'user_policy_acknowledgments', rowCount: 1);
    logInfo('Policy acknowledged', metadata: {'version': version});
    return true;
  }, operationName: 'acknowledgePolicy');

  /// Check if user has acknowledged the current policy
  Future<bool> hasPolicyBeenAcknowledged() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return false;

    try {
      final policyResult = await getCurrentPolicy();
      if (policyResult is! Success<PrivacyPolicyVersion?> || policyResult.data == null) {
        return true; // No policy = nothing to acknowledge
      }

      final response = await SupabaseConfig.client
          .from('user_policy_acknowledgments')
          .select()
          .eq('user_id', userId)
          .eq('policy_version', policyResult.data!.version)
          .maybeSingle();

      return response != null;
    } catch (e) {
      logError('Error checking policy acknowledgment', error: e);
      return false;
    }
  }

  /// Clear cached data (call on logout)
  void clearCache() {
    _categoriesCache = null;
    _userConsentsCache = null;
    logDebug('Cache cleared');
  }

  /// Check if a specific consent type is granted
  Future<bool> isConsentGranted(String categoryKey) async {
    final result = await getUserConsents();
    if (result is Success<Map<String, UserConsent>>) {
      return result.data[categoryKey]?.isGranted ?? false;
    }
    return false;
  }

  /// Check if analytics tracking is allowed
  Future<bool> isAnalyticsAllowed() => isConsentGranted('analytics');

  /// Check if marketing communications are allowed
  Future<bool> isMarketingAllowed() => isConsentGranted('marketing');

  /// Check if personalization is allowed
  Future<bool> isPersonalizationAllowed() => isConsentGranted('personalization');

  /// Check if third-party data sharing is allowed
  Future<bool> isThirdPartySharingAllowed() => isConsentGranted('third_party');
}
