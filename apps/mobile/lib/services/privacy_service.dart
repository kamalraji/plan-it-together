import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/services/logging_mixin.dart';
import '../models/privacy_consent_models.dart';
import 'secure_storage_service.dart';

/// Service for managing privacy settings and consent
/// Uses LoggingMixin for standardized logging across ChangeNotifier classes
class PrivacyService extends ChangeNotifier with LoggingMixin {
  @override
  String get logTag => 'PrivacyService';
  
  static PrivacyService? _instance;
  static PrivacyService get instance => _instance ??= PrivacyService._();
  PrivacyService._();

  static final _supabase = Supabase.instance.client;

  PrivacyConsent? _consent;
  ProfileVisibilitySettings? _visibilitySettings;
  DataRetentionSettings? _retentionSettings;
  List<TrustedDevice> _trustedDevices = [];
  List<SecurityActivityEntry> _securityActivity = [];
  List<ConnectedApp> _connectedApps = [];
  bool _isLoading = false;

  // Getters
  PrivacyConsent? get consent => _consent;
  ProfileVisibilitySettings? get visibilitySettings => _visibilitySettings;
  DataRetentionSettings? get retentionSettings => _retentionSettings;
  List<TrustedDevice> get trustedDevices => _trustedDevices;
  List<SecurityActivityEntry> get securityActivity => _securityActivity;
  List<ConnectedApp> get connectedApps => _connectedApps;
  bool get isLoading => _isLoading;

  String? get _currentUserId => _supabase.auth.currentUser?.id;

  // ========== Privacy Consent ==========

  /// Load privacy consent
  Future<void> loadConsent() async {
    final userId = _currentUserId;
    if (userId == null) return;

    try {
      final response = await _supabase
          .from('privacy_consents')
          .select()
          .eq('user_id', userId)
          .maybeSingle();

      if (response != null) {
        _consent = PrivacyConsent.fromJson(response);
      } else {
        _consent = PrivacyConsent.empty(userId);
      }
      logDbOperation('SELECT', 'privacy_consents', rowCount: response != null ? 1 : 0);
      notifyListeners();
    } catch (e) {
      logError('Error loading privacy consent', error: e);
      _consent = PrivacyConsent.empty(userId);
    }
  }

  /// Save privacy consent
  Future<void> saveConsent(PrivacyConsent consent) async {
    final userId = _currentUserId;
    if (userId == null) return;

    try {
      // Hash IP address for privacy
      final ipHash = SecureStorageService.hashIpAddress('user_ip');

      await _supabase.from('privacy_consents').upsert({
        ...consent.copyWith(
          userId: userId,
          ipAddressHash: ipHash,
        ).toJson(),
        'updated_at': DateTime.now().toIso8601String(),
      });

      _consent = consent;
      logDbOperation('UPSERT', 'privacy_consents', rowCount: 1);
      notifyListeners();

      // Log activity
      await logSecurityActivity(
        SecurityActivityType.privacySettingsChanged,
        'Privacy consent updated',
      );
    } catch (e) {
      logError('Error saving privacy consent', error: e);
      rethrow;
    }
  }

  /// Accept all consent
  Future<void> acceptAllConsent() async {
    final userId = _currentUserId;
    if (userId == null) return;

    final consent = PrivacyConsent(
      id: _consent?.id ?? '',
      userId: userId,
      analyticsConsent: true,
      marketingConsent: true,
      personalizationConsent: true,
      thirdPartySharing: true,
      consentVersion: '1.0',
      consentedAt: DateTime.now(),
    );

    await saveConsent(consent);
  }

  /// Reject all optional consent
  Future<void> rejectAllConsent() async {
    final userId = _currentUserId;
    if (userId == null) return;

    final consent = PrivacyConsent(
      id: _consent?.id ?? '',
      userId: userId,
      analyticsConsent: false,
      marketingConsent: false,
      personalizationConsent: false,
      thirdPartySharing: false,
      consentVersion: '1.0',
      consentedAt: DateTime.now(),
    );

    await saveConsent(consent);
  }

  // ========== Profile Visibility ==========

  /// Load visibility settings
  Future<void> loadVisibilitySettings() async {
    final userId = _currentUserId;
    if (userId == null) return;

    try {
      final response = await _supabase
          .from('profile_visibility_settings')
          .select()
          .eq('user_id', userId)
          .maybeSingle();

      if (response != null) {
        _visibilitySettings = ProfileVisibilitySettings.fromJson(response);
      } else {
        _visibilitySettings = ProfileVisibilitySettings.empty(userId);
      }
      logDbOperation('SELECT', 'profile_visibility_settings', rowCount: response != null ? 1 : 0);
      notifyListeners();
    } catch (e) {
      logError('Error loading visibility settings', error: e);
      _visibilitySettings = ProfileVisibilitySettings.empty(userId);
    }
  }

  /// Save visibility settings
  Future<void> saveVisibilitySettings(ProfileVisibilitySettings settings) async {
    final userId = _currentUserId;
    if (userId == null) return;

    try {
      await _supabase.from('profile_visibility_settings').upsert({
        ...settings.copyWith(userId: userId).toJson(),
        'updated_at': DateTime.now().toIso8601String(),
      });

      _visibilitySettings = settings;
      logDbOperation('UPSERT', 'profile_visibility_settings', rowCount: 1);
      notifyListeners();

      await logSecurityActivity(
        SecurityActivityType.privacySettingsChanged,
        'Profile visibility settings updated',
      );
    } catch (e) {
      logError('Error saving visibility settings', error: e);
      rethrow;
    }
  }

  // ========== Data Retention ==========

  /// Load retention settings
  Future<void> loadRetentionSettings() async {
    final userId = _currentUserId;
    if (userId == null) return;

    try {
      final response = await _supabase
          .from('data_retention_settings')
          .select()
          .eq('user_id', userId)
          .maybeSingle();

      if (response != null) {
        _retentionSettings = DataRetentionSettings.fromJson(response);
      } else {
        _retentionSettings = DataRetentionSettings.empty(userId);
      }
      logDbOperation('SELECT', 'data_retention_settings', rowCount: response != null ? 1 : 0);
      notifyListeners();
    } catch (e) {
      logError('Error loading retention settings', error: e);
      _retentionSettings = DataRetentionSettings.empty(userId);
    }
  }

  /// Save retention settings
  Future<void> saveRetentionSettings(DataRetentionSettings settings) async {
    final userId = _currentUserId;
    if (userId == null) return;

    try {
      await _supabase.from('data_retention_settings').upsert({
        ...settings.copyWith(userId: userId).toJson(),
        'updated_at': DateTime.now().toIso8601String(),
      });

      _retentionSettings = settings;
      logDbOperation('UPSERT', 'data_retention_settings', rowCount: 1);
      notifyListeners();

      await logSecurityActivity(
        SecurityActivityType.privacySettingsChanged,
        'Data retention settings updated',
      );
    } catch (e) {
      logError('Error saving retention settings', error: e);
      rethrow;
    }
  }

  // ========== Trusted Devices ==========

  /// Load trusted devices
  Future<void> loadTrustedDevices() async {
    final userId = _currentUserId;
    if (userId == null) return;

    try {
      final response = await _supabase
          .from('trusted_devices')
          .select()
          .eq('user_id', userId)
          .order('trusted_at', ascending: false);

      _trustedDevices = (response as List)
          .map((json) => TrustedDevice.fromJson(json))
          .toList();
      logDbOperation('SELECT', 'trusted_devices', rowCount: _trustedDevices.length);
      notifyListeners();
    } catch (e) {
      logError('Error loading trusted devices', error: e);
      _trustedDevices = [];
    }
  }

  /// Add trusted device
  Future<void> addTrustedDevice({
    required String deviceId,
    required String deviceName,
    String? deviceType,
    String? os,
    String? browser,
    int expiryDays = 30,
  }) async {
    final userId = _currentUserId;
    if (userId == null) return;

    try {
      await _supabase.from('trusted_devices').insert({
        'user_id': userId,
        'device_id': deviceId,
        'device_name': deviceName,
        'device_type': deviceType,
        'os': os,
        'browser': browser,
        'trusted_at': DateTime.now().toIso8601String(),
        'expires_at': DateTime.now().add(Duration(days: expiryDays)).toIso8601String(),
        'is_current': true,
      });

      logDbOperation('INSERT', 'trusted_devices', rowCount: 1);
      await loadTrustedDevices();

      await logSecurityActivity(
        SecurityActivityType.deviceTrusted,
        'Device "$deviceName" added as trusted',
      );
    } catch (e) {
      logError('Error adding trusted device', error: e);
      rethrow;
    }
  }

  /// Remove trusted device
  Future<void> removeTrustedDevice(String deviceId) async {
    final userId = _currentUserId;
    if (userId == null) return;

    try {
      final device = _trustedDevices.firstWhere((d) => d.id == deviceId);

      await _supabase
          .from('trusted_devices')
          .delete()
          .eq('id', deviceId)
          .eq('user_id', userId);

      logDbOperation('DELETE', 'trusted_devices', rowCount: 1);
      await loadTrustedDevices();

      await logSecurityActivity(
        SecurityActivityType.deviceRemoved,
        'Device "${device.deviceName}" removed from trusted',
      );
    } catch (e) {
      logError('Error removing trusted device', error: e);
      rethrow;
    }
  }

  // ========== Security Activity Log ==========

  /// Load security activity log
  Future<void> loadSecurityActivity({int limit = 50}) async {
    final userId = _currentUserId;
    if (userId == null) return;

    try {
      final response = await _supabase
          .from('security_activity_log')
          .select()
          .eq('user_id', userId)
          .order('timestamp', ascending: false)
          .limit(limit);

      _securityActivity = (response as List)
          .map((json) => SecurityActivityEntry.fromJson(json))
          .toList();
      logDbOperation('SELECT', 'security_activity_log', rowCount: _securityActivity.length);
      notifyListeners();
    } catch (e) {
      logError('Error loading security activity', error: e);
      _securityActivity = [];
    }
  }

  /// Log security activity
  Future<void> logSecurityActivity(
    SecurityActivityType activityType,
    String description, {
    String? ipAddress,
    String? deviceName,
    String? location,
    Map<String, dynamic>? metadata,
  }) async {
    final userId = _currentUserId;
    if (userId == null) return;

    try {
      await _supabase.from('security_activity_log').insert({
        'user_id': userId,
        'activity_type': activityType.value,
        'description': description,
        'timestamp': DateTime.now().toIso8601String(),
        'ip_address': ipAddress != null 
            ? SecureStorageService.hashIpAddress(ipAddress)
            : null,
        'device_name': deviceName,
        'location': location,
        'metadata': metadata,
      });
      logDbOperation('INSERT', 'security_activity_log', rowCount: 1);
    } catch (e) {
      logError('Error logging security activity', error: e);
    }
  }

  // ========== Connected Apps ==========

  /// Load connected apps
  Future<void> loadConnectedApps() async {
    final userId = _currentUserId;
    if (userId == null) return;

    try {
      final response = await _supabase
          .from('connected_apps')
          .select()
          .eq('user_id', userId)
          .order('authorized_at', ascending: false);

      _connectedApps = (response as List)
          .map((json) => ConnectedApp.fromJson(json))
          .toList();
      logDbOperation('SELECT', 'connected_apps', rowCount: _connectedApps.length);
      notifyListeners();
    } catch (e) {
      logError('Error loading connected apps', error: e);
      _connectedApps = [];
    }
  }

  /// Revoke app access
  Future<void> revokeAppAccess(String appId) async {
    final userId = _currentUserId;
    if (userId == null) return;

    try {
      final app = _connectedApps.firstWhere((a) => a.id == appId);

      await _supabase
          .from('connected_apps')
          .delete()
          .eq('id', appId)
          .eq('user_id', userId);

      logDbOperation('DELETE', 'connected_apps', rowCount: 1);
      await loadConnectedApps();

      await logSecurityActivity(
        SecurityActivityType.other,
        'Revoked access for "${app.appName}"',
      );
    } catch (e) {
      logError('Error revoking app access', error: e);
      rethrow;
    }
  }

  // ========== Data Export ==========

  /// Request data export (GDPR right to portability)
  Future<void> requestDataExport() async {
    final userId = _currentUserId;
    if (userId == null) return;

    try {
      // Create export request
      await _supabase.from('data_export_requests').insert({
        'user_id': userId,
        'status': 'pending',
        'requested_at': DateTime.now().toIso8601String(),
      });

      logDbOperation('INSERT', 'data_export_requests', rowCount: 1);
      await logSecurityActivity(
        SecurityActivityType.dataExportRequested,
        'Data export requested',
      );
    } catch (e) {
      logError('Error requesting data export', error: e);
      rethrow;
    }
  }

  // ========== Account Deactivation ==========

  /// Deactivate account temporarily
  Future<void> deactivateAccount() async {
    final userId = _currentUserId;
    if (userId == null) return;

    try {
      await _supabase.from('user_profiles').update({
        'is_deactivated': true,
        'deactivated_at': DateTime.now().toIso8601String(),
      }).eq('id', userId);

      logDbOperation('UPDATE', 'user_profiles', rowCount: 1);
      await logSecurityActivity(
        SecurityActivityType.accountDeactivated,
        'Account temporarily deactivated',
      );
    } catch (e) {
      logError('Error deactivating account', error: e);
      rethrow;
    }
  }

  /// Reactivate account
  Future<void> reactivateAccount() async {
    final userId = _currentUserId;
    if (userId == null) return;

    try {
      await _supabase.from('user_profiles').update({
        'is_deactivated': false,
        'deactivated_at': null,
      }).eq('id', userId);

      logDbOperation('UPDATE', 'user_profiles', rowCount: 1);
      await logSecurityActivity(
        SecurityActivityType.accountReactivated,
        'Account reactivated',
      );
    } catch (e) {
      logError('Error reactivating account', error: e);
      rethrow;
    }
  }

  // ========== Load All Settings ==========

  /// Load all privacy-related settings
  Future<void> loadAllSettings() async {
    _isLoading = true;
    notifyListeners();

    try {
      await Future.wait([
        loadConsent(),
        loadVisibilitySettings(),
        loadRetentionSettings(),
        loadTrustedDevices(),
        loadSecurityActivity(),
        loadConnectedApps(),
      ]);
      logInfo('All privacy settings loaded');
    } catch (e) {
      logError('Error loading all settings', error: e);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Get security activity logs with filters
  Future<List<SecurityActivityEntry>> getSecurityActivityLogs({
    DateTime? startDate,
    DateTime? endDate,
    List<String>? categories,
  }) async {
    final userId = _currentUserId;
    if (userId == null) return [];

    try {
      var query = _supabase
          .from('security_activity_log')
          .select()
          .eq('user_id', userId);

      if (startDate != null) {
        query = query.gte('timestamp', startDate.toIso8601String());
      }
      if (endDate != null) {
        query = query.lte('timestamp', endDate.toIso8601String());
      }

      final response = await query.order('timestamp', ascending: false);

      var entries = (response as List)
          .map((json) => SecurityActivityEntry.fromJson(json))
          .toList();

      if (categories != null && categories.isNotEmpty) {
        entries = entries.where((e) => categories.contains(e.activityType.value)).toList();
      }

      logDbOperation('SELECT', 'security_activity_log', rowCount: entries.length);
      return entries;
    } catch (e) {
      logError('Error getting security activity logs', error: e);
      return [];
    }
  }

  /// Clear all cached data
  void clearCache() {
    _consent = null;
    _visibilitySettings = null;
    _retentionSettings = null;
    _trustedDevices = [];
    _securityActivity = [];
    _connectedApps = [];
    logDebug('Privacy cache cleared');
    notifyListeners();
  }
}
