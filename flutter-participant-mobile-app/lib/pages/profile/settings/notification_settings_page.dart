import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/services/profile_service.dart';
import 'package:thittam1hub/services/settings_realtime_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/settings_components.dart';
import 'package:thittam1hub/widgets/settings/settings_page_scaffold.dart';
import 'package:thittam1hub/widgets/settings/debounced_settings_updater.dart';
import 'package:thittam1hub/mixins/settings_audit_mixin.dart';
import 'package:thittam1hub/widgets/common/settings_feedback.dart';

import 'package:thittam1hub/services/logging_service.dart';

/// Notification Settings Page
class NotificationSettingsPage extends StatefulWidget {
  static final _log = LoggingService.instance;
  static const String _tag = 'NotificationSettingsPage';

  const NotificationSettingsPage({super.key});

  @override
  State<NotificationSettingsPage> createState() => _NotificationSettingsPageState();
}

class _NotificationSettingsPageState extends State<NotificationSettingsPage>
    with SettingsAuditMixin, DebouncedSettingsMixin {
  static const String _tag = 'NotificationSettingsPage';
  static final _log = LoggingService.instance;
  
  @override
  String get auditSettingType => 'notification';
  
  final _profileService = ProfileService.instance;
  final _realtimeService = SettingsRealtimeService.instance;
  StreamSubscription<SettingsUpdateEvent>? _realtimeSubscription;
  NotificationPreferences? _prefs;
  bool _isLoading = true;
  String? _errorMessage;

  // Quiet Hours
  bool _quietHoursEnabled = false;
  TimeOfDay _quietHoursStart = const TimeOfDay(hour: 22, minute: 0);
  TimeOfDay _quietHoursEnd = const TimeOfDay(hour: 7, minute: 0);
  bool _allowUrgentInQuietHours = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
    _subscribeToRealtimeUpdates();
  }
  
  void _subscribeToRealtimeUpdates() {
    _realtimeSubscription = _realtimeService.onSettingsUpdated.listen((event) {
      // Only refresh if notification settings were updated from another device
      if (event.type == SettingsUpdateType.notification && mounted) {
        _log.info('Notification settings updated from another device, refreshing...', tag: _tag);
        _loadSettings();
      }
    });
  }

  @override
  void dispose() {
    _realtimeSubscription?.cancel();
    disposeDebouncedUpdater();
    super.dispose();
  }

  Future<void> _loadSettings() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) {
      setState(() {
        _errorMessage = 'Not signed in';
        _isLoading = false;
      });
      return;
    }

    try {
      final prefs = await _profileService.getNotificationPreferences(userId);
      if (mounted) {
        setState(() {
          _prefs = prefs ?? NotificationPreferences(userId: userId);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to load notification settings';
          _isLoading = false;
        });
      }
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
        case 'workspaceEnabled':
          updatedPrefs = updatedPrefs.copyWith(workspaceEnabled: value as bool);
          break;
        case 'eventEnabled':
          updatedPrefs = updatedPrefs.copyWith(eventEnabled: value as bool);
          break;
        case 'marketplaceEnabled':
          updatedPrefs = updatedPrefs.copyWith(marketplaceEnabled: value as bool);
          break;
        case 'organizationEnabled':
          updatedPrefs = updatedPrefs.copyWith(organizationEnabled: value as bool);
          break;
        case 'systemEnabled':
          updatedPrefs = updatedPrefs.copyWith(systemEnabled: value as bool);
          break;
      }
    });
    
    try {
      await _profileService.updateNotificationPreferences(updatedPrefs);
      // Log all changes for audit trail
      changes.forEach((key, value) {
        logSettingChange(key: key, oldValue: null, newValue: value);
      });
      _log.info('Batched ${changes.length} notification settings', tag: _tag);
    } catch (e) {
      _log.error('Failed to flush notification settings: $e', tag: _tag);
      if (mounted) {
        HapticFeedback.heavyImpact();
        SettingsFeedback.showError(context, 'Failed to save preferences');
      }
    }
  }

  void _updatePreference(NotificationPreferences newPrefs, String key, dynamic oldValue, dynamic newValue) {
    // Optimistic update
    setState(() => _prefs = newPrefs);
    HapticFeedback.selectionClick();
    
    // Enqueue change for batched save
    enqueueSettingChange(key, newValue);
  }

  Future<void> _pickQuietHoursStart() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _quietHoursStart,
    );
    if (picked != null) {
      setState(() => _quietHoursStart = picked);
    }
  }

  Future<void> _pickQuietHoursEnd() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _quietHoursEnd,
    );
    if (picked != null) {
      setState(() => _quietHoursEnd = picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return SettingsPageScaffold(
      title: 'Notifications',
      isLoading: _isLoading || _prefs == null,
      errorMessage: _errorMessage,
      onRetry: _loadSettings,
      onRefresh: _loadSettings,
      skeletonSections: 2,
      body: Column(
        children: [
          // Main Notifications
          SettingsSection(
            title: 'Notifications',
            icon: Icons.notifications_outlined,
            iconColor: cs.secondary,
            children: [
              SettingsToggle(
                label: 'Workspaces',
                subtitle: 'Task updates, mentions, invitations',
                icon: Icons.workspaces_outlined,
                value: _prefs?.workspaceEnabled ?? true,
                onChanged: (value) => _updatePreference(
                  _prefs!.copyWith(workspaceEnabled: value),
                  'workspaceEnabled',
                  _prefs?.workspaceEnabled,
                  value,
                ),
              ),
              SettingsToggle(
                label: 'Events',
                subtitle: 'Event reminders and schedule changes',
                icon: Icons.event_outlined,
                value: _prefs?.eventEnabled ?? true,
                onChanged: (value) => _updatePreference(
                  _prefs!.copyWith(eventEnabled: value),
                  'eventEnabled',
                  _prefs?.eventEnabled,
                  value,
                ),
              ),
              SettingsToggle(
                label: 'Marketplace',
                subtitle: 'Booking updates and service messages',
                icon: Icons.storefront_outlined,
                value: _prefs?.marketplaceEnabled ?? true,
                onChanged: (value) => _updatePreference(
                  _prefs!.copyWith(marketplaceEnabled: value),
                  'marketplaceEnabled',
                  _prefs?.marketplaceEnabled,
                  value,
                ),
              ),
              SettingsToggle(
                label: 'Organizations',
                subtitle: 'Updates from organizations you follow',
                icon: Icons.business_outlined,
                value: _prefs?.organizationEnabled ?? true,
                onChanged: (value) => _updatePreference(
                  _prefs!.copyWith(organizationEnabled: value),
                  'organizationEnabled',
                  _prefs?.organizationEnabled,
                  value,
                ),
              ),
              SettingsToggle(
                label: 'System',
                subtitle: 'Product updates and security alerts',
                icon: Icons.security_outlined,
                value: _prefs?.systemEnabled ?? true,
                onChanged: (value) => _updatePreference(
                  _prefs!.copyWith(systemEnabled: value),
                  'systemEnabled',
                  _prefs?.systemEnabled,
                  value,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),

          // Do Not Disturb Section
          SettingsSection(
            title: 'Do Not Disturb',
            icon: Icons.do_not_disturb_on_outlined,
            iconColor: Colors.deepPurple,
            children: [
              SettingsToggle(
                label: 'Enable Quiet Hours',
                subtitle: 'Pause notifications during specific times',
                icon: Icons.bedtime_outlined,
                value: _quietHoursEnabled,
                onChanged: (v) => setState(() => _quietHoursEnabled = v),
              ),
              if (_quietHoursEnabled) ...[
                SettingsAction(
                  label: 'Start Time',
                  subtitle: _quietHoursStart.format(context),
                  icon: Icons.nightlight_outlined,
                  onTap: _pickQuietHoursStart,
                ),
                SettingsAction(
                  label: 'End Time',
                  subtitle: _quietHoursEnd.format(context),
                  icon: Icons.wb_sunny_outlined,
                  onTap: _pickQuietHoursEnd,
                ),
                SettingsToggle(
                  label: 'Allow Urgent Notifications',
                  subtitle: 'Critical alerts bypass quiet hours',
                  icon: Icons.priority_high_outlined,
                  value: _allowUrgentInQuietHours,
                  onChanged: (v) => setState(() => _allowUrgentInQuietHours = v),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
