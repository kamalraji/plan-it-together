import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/settings_components.dart';
import 'package:thittam1hub/widgets/settings/settings_tab_scaffold.dart';
import 'package:thittam1hub/services/profile_service.dart';
import 'package:thittam1hub/services/channel_notification_service.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/models/channel_notification_settings.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';

import 'package:thittam1hub/services/logging_service.dart';
/// Notifications tab for Chat Settings
class ChatNotificationsTab extends StatefulWidget {
  // Logging
   static final _log = LoggingService.instance;
   static const String _tag = 'ChatNotificationsTab';

  final String? channelId;
  final String? channelName;
  final bool isDM;

  const ChatNotificationsTab({
    super.key,
    this.channelId,
    this.channelName,
    this.isDM = false,
  });

  @override
  State<ChatNotificationsTab> createState() => _ChatNotificationsTabState();
}

class _ChatNotificationsTabState extends State<ChatNotificationsTab> {
  static const String _tag = 'ChatNotificationsTab';
  static final _log = LoggingService.instance;
  
  final _profileService = ProfileService.instance;
  
  bool _isLoading = true;
  String? _error;
  
  // Per-chat notification settings
  String _muteUntil = 'Off';
  bool _customSound = false;
  String _selectedSound = 'Default';
  bool _vibrate = true;
  bool _showPreviews = true;
  bool _mentionsOnly = false;
  
  NotificationPreferences? _notificationPrefs;
  ChannelNotificationSettings? _channelSettings;

  final List<String> _muteDurations = [
    'Off',
    '1 hour',
    '8 hours',
    '1 day',
    '1 week',
    'Forever',
  ];

  final List<String> _soundOptions = [
    'Default',
    'Chime',
    'Bell',
    'Pop',
    'Swoosh',
    'None',
  ];

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) {
        setState(() {
          _isLoading = false;
          _error = 'Not authenticated';
        });
        return;
      }

      // Load global notification prefs
      final prefs = await _profileService.getNotificationPreferences(userId);
      
      // Load channel-specific settings if applicable
      ChannelNotificationSettings? channelSettings;
      if (widget.channelId != null) {
        channelSettings = await ChannelNotificationService.instance
            .getOrCreateSettings(widget.channelId!);
      }

      if (mounted) {
        setState(() {
          _notificationPrefs = prefs;
          _channelSettings = channelSettings;
          
          if (channelSettings != null) {
            // Use channel-specific settings
            _muteUntil = channelSettings.muteStatusLabel;
            _vibrate = channelSettings.vibrationEnabled;
            _showPreviews = channelSettings.showPreviews;
            _mentionsOnly = channelSettings.mentionsOnly;
            if (channelSettings.customSoundName != null) {
              _customSound = true;
              _selectedSound = channelSettings.customSoundName!;
            }
          } else if (prefs != null) {
            // Use global settings
            _muteUntil = prefs.chatMuteUntil ?? 'Off';
            _customSound = prefs.customSoundEnabled;
            _selectedSound = prefs.customSoundName ?? 'Default';
            _vibrate = prefs.vibrationEnabled;
            _showPreviews = prefs.messagePreviewsEnabled;
          }
          
          _isLoading = false;
        });
      }
    } catch (e) {
      _log.error('Failed to load notification settings: $e', tag: _tag);
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = 'Failed to load settings';
        });
      }
    }
  }

  Future<void> _updateGlobalPreference(NotificationPreferences newPrefs) async {
    final previousPrefs = _notificationPrefs;
    setState(() => _notificationPrefs = newPrefs);

    try {
      await _profileService.updateNotificationPreferences(newPrefs);
      HapticFeedback.lightImpact();
    } catch (e) {
      _log.error('Failed to update notification preferences: $e', tag: _tag);
      if (mounted) {
        setState(() => _notificationPrefs = previousPrefs);
        _showErrorSnackBar('Failed to save settings');
      }
    }
  }

  Future<void> _updateChannelSetting({
    bool? muted,
    Duration? muteDuration,
    bool? muteForever,
    String? customSoundName,
    bool? vibrationEnabled,
    bool? showPreviews,
    bool? mentionsOnly,
  }) async {
    if (widget.channelId == null) return;

    try {
      ChannelNotificationSettings? updated;
      
      if (muted == true || muteDuration != null || muteForever == true) {
        final result = await ChannelNotificationService.instance.muteChannel(
          widget.channelId!,
          duration: muteDuration,
          forever: muteForever ?? false,
        );
        updated = result.isSuccess ? result.data : null;
      } else if (muted == false) {
        final result = await ChannelNotificationService.instance.unmuteChannel(
          widget.channelId!,
        );
        updated = result.isSuccess ? result.data : null;
      } else {
        final result = await ChannelNotificationService.instance.updateSettings(
          widget.channelId!,
          customSoundName: customSoundName,
          vibrationEnabled: vibrationEnabled,
          showPreviews: showPreviews,
          mentionsOnly: mentionsOnly,
        );
        updated = result.isSuccess ? result.data : null;
      }

      if (mounted && updated != null) {
        setState(() {
          _channelSettings = updated;
          _muteUntil = updated!.muteStatusLabel;
          _vibrate = updated.vibrationEnabled;
          _showPreviews = updated.showPreviews;
          _mentionsOnly = updated.mentionsOnly;
        });
        HapticFeedback.lightImpact();
      }
    } catch (e) {
      _log.error('Failed to update channel setting: $e', tag: _tag);
      if (mounted) {
        _showErrorSnackBar('Failed to save settings');
      }
    }
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Theme.of(context).colorScheme.error,
        behavior: SnackBarBehavior.floating,
        action: SnackBarAction(
          label: 'Retry',
          textColor: Theme.of(context).colorScheme.onError,
          onPressed: _loadSettings,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final userId = SupabaseConfig.auth.currentUser?.id ?? '';
    final isChannelSpecific = widget.channelId != null;

    return SettingsTabScaffold(
      isLoading: _isLoading,
      error: _error,
      onRetry: _loadSettings,
      onRefresh: _loadSettings,
      children: [
        // Channel-specific header
        if (isChannelSpecific) _buildChannelHeader(),

        SettingsSection(
          title: 'Notification Settings',
          icon: Icons.notifications_outlined,
          iconColor: AppColors.violet500,
          children: [
            SettingsPicker<String>(
              label: 'Mute Notifications',
              subtitle: _muteUntil == 'Off' ? 'Notifications enabled' : 'Muted for $_muteUntil',
              icon: Icons.notifications_off_outlined,
              value: _muteUntil,
              options: _muteDurations,
              displayValue: (v) => v,
              onChanged: (v) {
                setState(() => _muteUntil = v);
                if (isChannelSpecific) {
                  _updateChannelMute(v);
                } else {
                  _updateGlobalPreference(
                    (_notificationPrefs ?? NotificationPreferences(userId: userId))
                        .copyWith(chatMuteUntil: v == 'Off' ? null : v),
                  );
                }
              },
            ),
            const SettingsDivider(),
            SettingsToggle(
              label: 'Custom Sound',
              subtitle: 'Use a different notification sound',
              icon: Icons.music_note_outlined,
              value: _customSound,
              onChanged: (v) {
                setState(() => _customSound = v);
                if (isChannelSpecific) {
                  _updateChannelSetting(customSoundName: v ? _selectedSound : null);
                } else {
                  _updateGlobalPreference(
                    (_notificationPrefs ?? NotificationPreferences(userId: userId))
                        .copyWith(customSoundEnabled: v),
                  );
                }
              },
            ),
            if (_customSound) ...[
              const SettingsDivider(),
              SettingsPicker<String>(
                label: 'Notification Sound',
                icon: Icons.volume_up_outlined,
                value: _selectedSound,
                options: _soundOptions,
                displayValue: (v) => v,
                onChanged: (v) {
                  setState(() => _selectedSound = v);
                  if (isChannelSpecific) {
                    _updateChannelSetting(customSoundName: v);
                  } else {
                    _updateGlobalPreference(
                      (_notificationPrefs ?? NotificationPreferences(userId: userId))
                          .copyWith(customSoundName: v),
                    );
                  }
                },
              ),
            ],
            const SettingsDivider(),
            SettingsToggle(
              label: 'Vibrate',
              subtitle: 'Vibrate on new messages',
              icon: Icons.vibration,
              value: _vibrate,
              onChanged: (v) {
                setState(() => _vibrate = v);
                if (isChannelSpecific) {
                  _updateChannelSetting(vibrationEnabled: v);
                } else {
                  _updateGlobalPreference(
                    (_notificationPrefs ?? NotificationPreferences(userId: userId))
                        .copyWith(vibrationEnabled: v),
                  );
                }
              },
            ),
            const SettingsDivider(),
            SettingsToggle(
              label: 'Show Message Previews',
              subtitle: 'Show message content in notifications',
              icon: Icons.preview,
              value: _showPreviews,
              onChanged: (v) {
                setState(() => _showPreviews = v);
                if (isChannelSpecific) {
                  _updateChannelSetting(showPreviews: v);
                } else {
                  _updateGlobalPreference(
                    (_notificationPrefs ?? NotificationPreferences(userId: userId))
                        .copyWith(messagePreviewsEnabled: v),
                  );
                }
              },
            ),
            if (isChannelSpecific) ...[
              const SettingsDivider(),
              SettingsToggle(
                label: 'Mentions Only',
                subtitle: 'Only notify when you\'re mentioned',
                icon: Icons.alternate_email,
                value: _mentionsOnly,
                onChanged: (v) {
                  setState(() => _mentionsOnly = v);
                  _updateChannelSetting(mentionsOnly: v);
                },
              ),
            ],
          ],
        ),
      ],
    );
  }

  Widget _buildChannelHeader() {
    final cs = Theme.of(context).colorScheme;
    
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: cs.primaryContainer.withOpacity(0.3),
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: cs.primary.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: cs.primary,
            child: Icon(
              widget.isDM ? Icons.person : Icons.group,
              color: cs.onPrimary,
              size: 20,
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.channelName ?? 'Chat',
                  style: context.textStyles.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  'Settings apply to this ${widget.isDM ? 'conversation' : 'group'} only',
                  style: context.textStyles.bodySmall?.copyWith(
                    color: cs.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _updateChannelMute(String duration) {
    if (duration == 'Off') {
      _updateChannelSetting(muted: false);
    } else if (duration == 'Forever') {
      _updateChannelSetting(muteForever: true);
    } else {
      final parsed = _parseDuration(duration);
      if (parsed != null) {
        _updateChannelSetting(muteDuration: parsed);
      }
    }
  }

  Duration? _parseDuration(String duration) {
    switch (duration) {
      case '1 hour':
        return const Duration(hours: 1);
      case '8 hours':
        return const Duration(hours: 8);
      case '1 day':
        return const Duration(days: 1);
      case '1 week':
        return const Duration(days: 7);
      default:
        return null;
    }
  }
}
