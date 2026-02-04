import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/models/privacy_consent_models.dart';
import 'package:thittam1hub/services/profile_service.dart';
import 'package:thittam1hub/services/privacy_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/settings_components.dart';
import 'package:thittam1hub/widgets/settings/settings_page_scaffold.dart';
import 'package:thittam1hub/widgets/settings/debounced_settings_updater.dart';
import 'package:thittam1hub/widgets/common/settings_feedback.dart';
import 'package:thittam1hub/widgets/privacy/tracking_preferences_sheet.dart';
import 'package:thittam1hub/widgets/privacy/profile_visibility_sheet.dart';
import 'package:thittam1hub/widgets/privacy/data_retention_sheet.dart';
import 'package:thittam1hub/widgets/privacy/data_processing_records_sheet.dart';
import 'package:thittam1hub/widgets/privacy/ai_matching_privacy_sheet.dart';
import 'package:thittam1hub/widgets/privacy/gdpr_export_sheet.dart';
import 'package:thittam1hub/widgets/security/trusted_devices_sheet.dart';
import 'package:thittam1hub/mixins/settings_audit_mixin.dart';

import 'package:thittam1hub/services/logging_service.dart';

/// Privacy Settings Page
class PrivacySettingsPage extends StatefulWidget {
  static final _log = LoggingService.instance;
  static const String _tag = 'PrivacySettingsPage';

  const PrivacySettingsPage({super.key});

  @override
  State<PrivacySettingsPage> createState() => _PrivacySettingsPageState();
}

class _PrivacySettingsPageState extends State<PrivacySettingsPage>
    with SettingsAuditMixin, DebouncedSettingsMixin {
  static const String _tag = 'PrivacySettingsPage';
  static final _log = LoggingService.instance;
  
  @override
  String get auditSettingType => 'privacy';
  
  final _profileService = ProfileService.instance;
  NotificationPreferences? _prefs;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  @override
  void dispose() {
    disposeDebouncedUpdater();
    super.dispose();
  }

  Future<void> _loadSettings() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return;

    try {
      final prefs = await _profileService.getNotificationPreferences(userId);
      if (mounted) {
        setState(() {
          _prefs = prefs ?? NotificationPreferences(userId: userId);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  /// Flush batched settings changes to the server
  @override
  Future<void> flushSettings(Map<String, dynamic> changes) async {
    if (_prefs == null || changes.isEmpty) return;
    
    // Build updated preferences from batched changes
    var updatedPrefs = _prefs!;
    changes.forEach((key, value) {
      switch (key) {
        case 'showOnlineStatus':
          updatedPrefs = updatedPrefs.copyWith(showOnlineStatus: value as bool);
          break;
        case 'showLastSeen':
          updatedPrefs = updatedPrefs.copyWith(showLastSeen: value as bool);
          break;
        case 'allowFollowFrom':
          updatedPrefs = updatedPrefs.copyWith(allowFollowFrom: value as String);
          break;
        case 'newFollowerNotifications':
          updatedPrefs = updatedPrefs.copyWith(newFollowerNotifications: value as bool);
          break;
      }
    });
    
    try {
      await _profileService.updateNotificationPreferences(updatedPrefs);
      // Log all changes for audit trail
      changes.forEach((key, value) {
        logSettingChange(key: key, oldValue: null, newValue: value);
      });
      _log.info('Batched ${changes.length} privacy settings', tag: _tag);
    } catch (e) {
      _log.error('Failed to flush privacy settings: $e', tag: _tag);
      if (mounted) {
        HapticFeedback.heavyImpact();
        SettingsFeedback.showError(context, 'Failed to save preferences');
      }
    }
  }

  /// Update preference with optimistic update and batched save
  void _updatePreference(NotificationPreferences newPrefs, String key, dynamic oldValue, dynamic newValue) {
    setState(() => _prefs = newPrefs);
    HapticFeedback.selectionClick();
    
    // Enqueue change for batched save
    enqueueSettingChange(key, newValue);
  }

  String _getFollowFromDescription(String value) {
    switch (value) {
      case 'everyone':
        return 'Anyone can send you a follow request';
      case 'no_one':
        return 'No one can follow you';
      default:
        return 'Anyone can send you a follow request';
    }
  }

  void _showProfileVisibilitySheet() {
    ProfileVisibilitySheet.show(context);
  }

  void _showConsentManagerSheet() {
    TrackingPreferencesSheet.show(context);
  }

  void _showDataRetentionSheet() {
    final userId = SupabaseConfig.auth.currentUser?.id ?? '';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DataRetentionSheet(
        currentSettings: DataRetentionSettings.empty(userId),
        onSaved: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Data retention settings updated')),
          );
        },
      ),
    );
  }

  void _showTrustedDevicesSheet() async {
    final privacyService = PrivacyService.instance;
    await privacyService.loadTrustedDevices();

    if (!mounted) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => TrustedDevicesSheet(
        devices: privacyService.trustedDevices,
        onUpdated: () {},
      ),
    );
  }

  void _showDataProcessingRecordsSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const DataProcessingRecordsSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return SettingsPageScaffold(
      title: 'Privacy',
      isLoading: _isLoading || _prefs == null,
      onRefresh: _loadSettings,
      skeletonSections: 3,
      body: Column(
        children: [
          // Activity Status
          SettingsSection(
            title: 'Activity Status',
            icon: Icons.visibility_outlined,
            iconColor: Colors.green,
            helpText: 'Control how your activity appears to others. Hiding your online status means you also won\'t see others\' status.',
            children: [
              SettingsToggle(
                label: 'Show Online Status',
                subtitle: 'Let others see when you\'re online',
                icon: Icons.circle_outlined,
                value: _prefs?.showOnlineStatus ?? false,
                onChanged: (value) => _updatePreference(
                  _prefs!.copyWith(showOnlineStatus: value),
                  'showOnlineStatus',
                  _prefs?.showOnlineStatus,
                  value,
                ),
              ),
              SettingsToggle(
                label: 'Show Last Seen',
                subtitle: 'Display when you were last active',
                icon: Icons.access_time_outlined,
                value: _prefs?.showLastSeen ?? false,
                onChanged: (value) => _updatePreference(
                  _prefs!.copyWith(showLastSeen: value),
                  'showLastSeen',
                  _prefs?.showLastSeen,
                  value,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),

          // Followers
          SettingsSection(
            title: 'Followers',
            icon: Icons.people_outline,
            iconColor: Colors.teal,
            helpText: 'Control who can follow you and how you\'re notified about new followers.',
            children: [
              SettingsDropdown<String>(
                label: 'Who can follow me',
                subtitle: _getFollowFromDescription(_prefs?.allowFollowFrom ?? 'everyone'),
                icon: Icons.person_add_outlined,
                value: _prefs?.allowFollowFrom ?? 'everyone',
                options: const [
                  DropdownOption(value: 'everyone', label: 'Everyone'),
                  DropdownOption(value: 'no_one', label: 'No one'),
                ],
                onChanged: (value) => _updatePreference(
                  _prefs!.copyWith(allowFollowFrom: value),
                  'allowFollowFrom',
                  _prefs?.allowFollowFrom,
                  value,
                ),
              ),
              SettingsToggle(
                label: 'New follower notifications',
                subtitle: 'Get notified when someone follows you',
                icon: Icons.notifications_outlined,
                value: _prefs?.newFollowerNotifications ?? true,
                onChanged: (value) => _updatePreference(
                  _prefs!.copyWith(newFollowerNotifications: value),
                  'newFollowerNotifications',
                  _prefs?.newFollowerNotifications,
                  value,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),

          // AI Matching Privacy
          SettingsSection(
            title: 'AI Matching',
            icon: Icons.auto_awesome,
            iconColor: Colors.purple,
            helpText: 'Control how AI-powered networking uses your data to find connections.',
            children: [
              SettingsAction(
                label: 'AI Matching Privacy',
                subtitle: 'Manage visibility, data sources & hidden users',
                icon: Icons.psychology_outlined,
                onTap: () => AIMatchingPrivacySheet.show(context),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),

          // Profile & Data
          SettingsSection(
            title: 'Profile & Data',
            icon: Icons.person_outline,
            iconColor: cs.primary,
            helpText: 'Under GDPR, you have the right to access, correct, and delete your personal data. '
                'Use these options to manage your data and privacy preferences.',
            children: [
              SettingsAction(
                label: 'Profile Visibility',
                subtitle: 'Control who can see your profile',
                icon: Icons.visibility_outlined,
                onTap: _showProfileVisibilitySheet,
              ),
              SettingsAction(
                label: 'Consent & Tracking',
                subtitle: 'Manage analytics and personalization',
                icon: Icons.cookie_outlined,
                onTap: _showConsentManagerSheet,
              ),
              SettingsAction(
                label: 'Data Processing Records',
                subtitle: 'GDPR Article 30 compliance',
                icon: Icons.description_outlined,
                onTap: _showDataProcessingRecordsSheet,
              ),
              SettingsAction(
                label: 'Data Retention',
                subtitle: 'Auto-delete messages and activity',
                icon: Icons.auto_delete_outlined,
                onTap: _showDataRetentionSheet,
              ),
              SettingsAction(
                label: 'Export Your Data',
                subtitle: 'Download all your data (GDPR Article 15)',
                icon: Icons.download_outlined,
                onTap: () => GdprExportSheet.show(context),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),

          // Security
          SettingsSection(
            title: 'Security',
            icon: Icons.shield_outlined,
            iconColor: Colors.blue,
            children: [
              SettingsAction(
                label: 'Trusted Devices',
                subtitle: 'Manage devices that skip 2FA',
                icon: Icons.devices_outlined,
                onTap: _showTrustedDevicesSheet,
              ),
              SettingsAction(
                label: 'Security Activity',
                subtitle: 'View login history and security events',
                icon: Icons.history_outlined,
                onTap: () => context.push('/profile/security-activity'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
