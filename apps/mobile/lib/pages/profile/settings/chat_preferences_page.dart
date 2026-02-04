import 'package:flutter/material.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/services/profile_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/settings_components.dart';

import 'package:thittam1hub/services/logging_service.dart';
/// Chat Preferences Settings Page
class ChatPreferencesPage extends StatefulWidget {
  // Logging
   static final _log = LoggingService.instance;
   static const String _tag = 'ChatPreferencesPage';

  const ChatPreferencesPage({super.key});

  @override
  State<ChatPreferencesPage> createState() => _ChatPreferencesPageState();
}

class _ChatPreferencesPageState extends State<ChatPreferencesPage> {
  static const String _tag = 'ChatPreferencesPage';
  static final _log = LoggingService.instance;
  
  final _profileService = ProfileService.instance;
  NotificationPreferences? _prefs;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
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

  Future<void> _updatePreference(NotificationPreferences newPrefs) async {
    setState(() => _prefs = newPrefs);
    try {
      await _profileService.updateNotificationPreferences(newPrefs);
    } catch (e) {
      _log.error('Failed to update preferences: $e', tag: _tag);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    if (_isLoading || _prefs == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Chat')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Chat')),
      body: ListView(
        padding: EdgeInsets.symmetric(
          horizontal: context.horizontalPadding,
          vertical: AppSpacing.md,
        ),
        children: [
          // Chat Notifications
          SettingsSection(
            title: 'Chat Notifications',
            icon: Icons.chat_bubble_outline,
            iconColor: Colors.blue,
            helpText: 'Customize how you receive chat notifications. Disabling message previews increases privacy but may make it harder to see what messages are about.',
            children: [
              SettingsToggle(
                label: 'Message Notifications',
                subtitle: 'Receive notifications for new messages',
                icon: Icons.notifications_active,
                value: _prefs!.chatMessagesEnabled,
                onChanged: (value) => _updatePreference(
                  _prefs!.copyWith(chatMessagesEnabled: value),
                ),
              ),
              SettingsToggle(
                label: 'Message Previews',
                subtitle: 'Show message content in notifications',
                icon: Icons.visibility,
                value: _prefs!.messagePreviewsEnabled,
                onChanged: (value) => _updatePreference(
                  _prefs!.copyWith(messagePreviewsEnabled: value),
                ),
                helpText: 'When disabled, notifications will show "New message" instead of the actual content.',
              ),
              SettingsToggle(
                label: 'Sound',
                subtitle: 'Play sound for notifications',
                icon: Icons.volume_up,
                value: _prefs!.soundEnabled,
                onChanged: (value) => _updatePreference(
                  _prefs!.copyWith(soundEnabled: value),
                ),
              ),
              SettingsToggle(
                label: 'Vibration',
                subtitle: 'Vibrate for critical alerts',
                icon: Icons.vibration,
                value: _prefs!.vibrationEnabled,
                onChanged: (value) => _updatePreference(
                  _prefs!.copyWith(vibrationEnabled: value),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),

          // Privacy Controls
          SettingsSection(
            title: 'Privacy Controls',
            icon: Icons.lock_outline,
            iconColor: Colors.green,
            helpText: 'These settings affect how your chat activity is shared with others. Disabling these features means you won\'t see the same information from others.',
            children: [
              SettingsToggle(
                label: 'Typing Indicators',
                subtitle: 'Let others see when you\'re typing',
                icon: Icons.edit,
                value: _prefs!.typingIndicatorsEnabled,
                onChanged: (value) => _updatePreference(
                  _prefs!.copyWith(typingIndicatorsEnabled: value),
                ),
              ),
              SettingsToggle(
                label: 'Read Receipts',
                subtitle: 'Let others know when you\'ve read messages',
                icon: Icons.done_all,
                value: _prefs!.readReceiptsEnabled,
                onChanged: (value) => _updatePreference(
                  _prefs!.copyWith(readReceiptsEnabled: value),
                ),
                helpText: 'When disabled, you also won\'t see when others have read your messages.',
              ),
            ],
          ),
        ],
      ),
    );
  }
}
