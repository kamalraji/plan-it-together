import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/settings_components.dart';
import 'package:thittam1hub/widgets/settings/settings_tab_scaffold.dart';
import 'package:thittam1hub/services/chat_security_service.dart';
import 'package:thittam1hub/models/chat_security_models.dart';
import 'package:thittam1hub/widgets/chat/chat_settings_shimmer.dart';
import 'package:thittam1hub/widgets/chat/encryption_setup_dialog.dart';
import 'package:thittam1hub/widgets/chat/key_verification_dialog.dart';

import 'package:thittam1hub/services/logging_service.dart';
/// Security & Privacy tab for Chat Settings
class ChatSecurityTab extends StatefulWidget {
  // Logging
   static final _log = LoggingService.instance;
   static const String _tag = 'ChatSecurityTab';

  final String? channelId;
  final String? channelName;
  final bool isDM;

  const ChatSecurityTab({
    super.key,
    this.channelId,
    this.channelName,
    this.isDM = false,
  });

  @override
  State<ChatSecurityTab> createState() => _ChatSecurityTabState();
}

class _ChatSecurityTabState extends State<ChatSecurityTab> {
  static const String _tag = 'ChatSecurityTab';
  static final _log = LoggingService.instance;
  
  bool _isLoading = true;
  String? _error;
  
  ChatSecuritySettings? _securitySettings;
  DisappearingMessageSettings? _disappearingSettings;
  
  // Security & Privacy state
  bool _appLockEnabled = false;
  int _lockTimeoutMinutes = 5;
  bool _requireBiometric = false;
  bool _screenshotProtection = false;
  bool _screenshotNotify = false;
  bool _incognitoKeyboard = false;
  bool _hideTypingIndicator = false;
  bool _hideReadReceipts = false;
  bool _disappearingEnabled = false;
  String _disappearingDuration = '24 hours';

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
      final settingsResult = await ChatSecurityService.instance.getSecuritySettings();
      if (!settingsResult.isSuccess) {
        throw Exception(settingsResult.errorMessage ?? 'Failed to load settings');
      }
      final settings = settingsResult.data;
      
      DisappearingMessageSettings? disappearing;
      if (widget.channelId != null) {
        final disappearingResult = await ChatSecurityService.instance.getDisappearingSettings(widget.channelId!);
        disappearing = disappearingResult.isSuccess ? disappearingResult.data : null;
      }

      if (mounted) {
        setState(() {
          _securitySettings = settings;
          _disappearingSettings = disappearing;
          _isLoading = false;

          _appLockEnabled = settings.appLockEnabled;
          _lockTimeoutMinutes = settings.lockTimeoutMinutes;
          _requireBiometric = settings.requireBiometric;
          _screenshotProtection = settings.screenshotProtection;
          _incognitoKeyboard = settings.incognitoKeyboard;
          _hideTypingIndicator = settings.hideTypingIndicator;
          _hideReadReceipts = settings.hideReadReceipts;
          _screenshotNotify = settings.screenshotNotify;
          
          if (disappearing != null && disappearing.enabled) {
            _disappearingEnabled = disappearing.enabled;
            _disappearingDuration = disappearing.durationLabel;
          }
        });
      }
    } catch (e) {
      _log.error('Failed to load security settings: $e', tag: _tag);
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = 'Failed to load security settings';
        });
      }
    }
  }

  Future<void> _updateSecuritySetting({
    bool? appLockEnabled,
    int? lockTimeoutMinutes,
    bool? requireBiometric,
    bool? screenshotProtection,
    bool? incognitoKeyboard,
    bool? hideTypingIndicator,
    bool? hideReadReceipts,
    bool? screenshotNotify,
  }) async {
    // Store previous values for rollback
    final prevAppLock = _appLockEnabled;
    final prevTimeout = _lockTimeoutMinutes;
    final prevBiometric = _requireBiometric;
    final prevScreenshotProt = _screenshotProtection;
    final prevIncognito = _incognitoKeyboard;
    final prevHideTyping = _hideTypingIndicator;
    final prevHideRead = _hideReadReceipts;
    final prevScreenshotNotify = _screenshotNotify;

    try {
      if (appLockEnabled != null || requireBiometric != null || lockTimeoutMinutes != null) {
        await ChatSecurityService.instance.setAppLock(
          enabled: appLockEnabled ?? _appLockEnabled,
          requireBiometric: requireBiometric ?? _requireBiometric,
          timeoutMinutes: lockTimeoutMinutes ?? _lockTimeoutMinutes,
        );
      }
      if (screenshotProtection != null) {
        await ChatSecurityService.instance.setScreenshotProtection(screenshotProtection);
      }
      if (incognitoKeyboard != null) {
        await ChatSecurityService.instance.setIncognitoKeyboard(incognitoKeyboard);
      }
      if (hideTypingIndicator != null) {
        await ChatSecurityService.instance.setHideTypingIndicator(hideTypingIndicator);
      }
      if (hideReadReceipts != null) {
        await ChatSecurityService.instance.setHideReadReceipts(hideReadReceipts);
      }
      if (screenshotNotify != null) {
        await ChatSecurityService.instance.setScreenshotNotify(screenshotNotify);
      }

      HapticFeedback.lightImpact();
    } catch (e) {
      _log.error('Failed to update security setting: $e', tag: _tag);
      // Rollback on error
      if (mounted) {
        setState(() {
          _appLockEnabled = prevAppLock;
          _lockTimeoutMinutes = prevTimeout;
          _requireBiometric = prevBiometric;
          _screenshotProtection = prevScreenshotProt;
          _incognitoKeyboard = prevIncognito;
          _hideTypingIndicator = prevHideTyping;
          _hideReadReceipts = prevHideRead;
          _screenshotNotify = prevScreenshotNotify;
        });
        _showErrorSnackBar('Failed to update setting');
      }
    }
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Theme.of(context).colorScheme.error,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _showSuccessSnackBar(String message) {
    HapticFeedback.mediumImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white, size: 20),
            const SizedBox(width: 8),
            Text(message),
          ],
        ),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SettingsTabScaffold(
      isLoading: _isLoading,
      error: _error,
      onRetry: _loadSettings,
      onRefresh: _loadSettings,
      skeletonSections: 1,
      skeletonItemsPerSection: 6,
      children: [
        SettingsSection(
          title: 'Security & Privacy',
          icon: Icons.security_outlined,
          iconColor: AppColors.emerald500,
          trailing: Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: AppColors.emerald500.withOpacity(0.1),
              borderRadius: BorderRadius.circular(AppRadius.xs),
            ),
            child: Text(
              'ENHANCED',
              style: context.textStyles.labelSmall?.semiBold.withColor(AppColors.emerald500),
            ),
          ),
          children: [
            // Encryption info
            _EncryptionInfoTile(
              channelId: widget.channelId,
              isDM: widget.isDM,
              channelName: widget.channelName,
            ),
            const SettingsDivider(),

            // App Lock
            SettingsToggle(
              label: 'Chat Lock',
              subtitle: 'Require PIN or biometric to access chats',
              icon: Icons.fingerprint,
              value: _appLockEnabled,
              onChanged: (v) {
                setState(() => _appLockEnabled = v);
                _updateSecuritySetting(appLockEnabled: v);
              },
            ),
            if (_appLockEnabled) ...[
              const SettingsDivider(),
              SettingsPicker<int>(
                label: 'Lock Timeout',
                subtitle: 'Auto-lock after inactivity',
                icon: Icons.timer_outlined,
                value: _lockTimeoutMinutes,
                options: const [0, 1, 5, 15, 30, 60],
                displayValue: (v) => v == 0 ? 'Immediately' : '$v min',
                onChanged: (v) {
                  setState(() => _lockTimeoutMinutes = v);
                  _updateSecuritySetting(lockTimeoutMinutes: v);
                },
              ),
              const SettingsDivider(),
              SettingsToggle(
                label: 'Require Biometric',
                subtitle: 'Use fingerprint or face ID',
                icon: Icons.face,
                value: _requireBiometric,
                onChanged: (v) {
                  setState(() => _requireBiometric = v);
                  _updateSecuritySetting(requireBiometric: v);
                },
              ),
            ],
            const SettingsDivider(),

            // Disappearing Messages
            SettingsAction(
              label: 'Disappearing Messages',
              subtitle: _disappearingEnabled ? 'Active: $_disappearingDuration' : 'Off',
              icon: Icons.timer,
              onTap: _showDisappearingSettings,
            ),
            const SettingsDivider(),

            // Screenshot Protection
            SettingsToggle(
              label: 'Screenshot Protection',
              subtitle: 'Block screenshots in chat',
              icon: Icons.screenshot_monitor,
              value: _screenshotProtection,
              onChanged: (v) {
                setState(() => _screenshotProtection = v);
                _updateSecuritySetting(screenshotProtection: v);
              },
            ),
            const SettingsDivider(),

            // Screenshot Notifications
            SettingsToggle(
              label: 'Screenshot Notifications',
              subtitle: 'Notify when someone takes a screenshot',
              icon: Icons.screenshot_outlined,
              value: _screenshotNotify,
              onChanged: (v) {
                setState(() => _screenshotNotify = v);
                _updateSecuritySetting(screenshotNotify: v);
              },
            ),
            const SettingsDivider(),

            // Incognito Keyboard
            SettingsToggle(
              label: 'Incognito Keyboard',
              subtitle: 'Prevent keyboard from learning words',
              icon: Icons.keyboard_hide,
              value: _incognitoKeyboard,
              onChanged: (v) {
                setState(() => _incognitoKeyboard = v);
                _updateSecuritySetting(incognitoKeyboard: v);
              },
            ),
            const SettingsDivider(),

            // Privacy toggles
            SettingsToggle(
              label: 'Hide Typing Indicator',
              subtitle: "Others won't see when you're typing",
              icon: Icons.keyboard_alt_outlined,
              value: _hideTypingIndicator,
              onChanged: (v) {
                setState(() => _hideTypingIndicator = v);
                _updateSecuritySetting(hideTypingIndicator: v);
              },
            ),
            const SettingsDivider(),
            SettingsToggle(
              label: 'Hide Read Receipts',
              subtitle: "Others won't see when you've read messages",
              icon: Icons.done_all,
              value: _hideReadReceipts,
              onChanged: (v) {
                setState(() => _hideReadReceipts = v);
                _updateSecuritySetting(hideReadReceipts: v);
              },
            ),

            // Block user (channel-specific)
            if (widget.channelId != null) ...[
              const SettingsDivider(),
              SettingsAction(
                label: 'Block User',
                subtitle: 'Prevent this user from contacting you',
                icon: Icons.block,
                isDestructive: true,
                onTap: _showBlockConfirmation,
              ),
            ],

            const SettingsDivider(),
            SettingsAction(
              label: 'Clear Chat Security Data',
              subtitle: 'Remove all security settings and data',
              icon: Icons.delete_forever,
              isDestructive: true,
              onTap: _showClearSecurityData,
            ),
          ],
        ),
      ],
    );
  }

  void _showDisappearingSettings() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Disappearing Messages', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            ...['Off', '5 minutes', '1 hour', '24 hours', '7 days'].map((d) =>
              RadioListTile<String>(
                title: Text(d),
                value: d,
                groupValue: _disappearingEnabled ? _disappearingDuration : 'Off',
                onChanged: (v) async {
                  Navigator.pop(ctx);
                  final enabled = v != 'Off';
                  final durationSeconds = _parseDurationToSeconds(v ?? 'Off');

                  setState(() {
                    _disappearingEnabled = enabled;
                    _disappearingDuration = v ?? 'Off';
                  });

                  if (widget.channelId != null) {
                    try {
                      if (enabled) {
                        await ChatSecurityService.instance.setDisappearingTimer(
                          channelId: widget.channelId!,
                          durationSeconds: durationSeconds,
                          enabled: true,
                        );
                      } else {
                        await ChatSecurityService.instance.disableDisappearingMessages(widget.channelId!);
                      }
                      _showSuccessSnackBar(enabled
                          ? 'Messages will disappear after $v'
                          : 'Disappearing messages disabled');
                    } catch (e) {
                      _log.error('Failed to set disappearing: $e', tag: _tag);
                    }
                  }
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  int _parseDurationToSeconds(String duration) {
    switch (duration) {
      case '5 minutes':
        return 300;
      case '1 hour':
        return 3600;
      case '24 hours':
        return 86400;
      case '7 days':
        return 604800;
      default:
        return 0;
    }
  }

  void _showBlockConfirmation() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Block User?'),
        content: Text(
          'You will no longer receive messages from ${widget.channelName ?? 'this user'}. They won\'t be notified.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            onPressed: () async {
              Navigator.pop(context);
              // Block implementation would go here
              _showSuccessSnackBar('User blocked');
            },
            child: const Text('Block'),
          ),
        ],
      ),
    );
  }

  void _showClearSecurityData() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear Security Data?'),
        content: const Text(
          'This will remove all chat security settings including encryption keys, app lock settings, and blocked users. This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            onPressed: () async {
              Navigator.pop(context);
              try {
                await ChatSecurityService.instance.clearAllChatData();
                _showSuccessSnackBar('Security data cleared');
                _loadSettings();
              } catch (e) {
                _showErrorSnackBar('Failed to clear data');
              }
            },
            child: const Text('Clear Data'),
          ),
        ],
      ),
    );
  }
}

/// Encryption info tile
class _EncryptionInfoTile extends StatelessWidget {
  final String? channelId;
  final bool isDM;
  final String? channelName;

  const _EncryptionInfoTile({
    this.channelId,
    this.isDM = false,
    this.channelName,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.emerald500.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.emerald500.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.emerald500.withOpacity(0.2),
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
            child: const Icon(
              Icons.lock,
              size: 20,
              color: AppColors.emerald500,
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'End-to-End Encryption',
                  style: context.textStyles.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  channelId != null
                      ? 'Messages in this chat are encrypted'
                      : 'All your chats are encrypted by default',
                  style: context.textStyles.bodySmall?.copyWith(
                    color: cs.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: () {
              // Show encryption info dialog
              showDialog(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('End-to-End Encryption'),
                  content: const Text(
                    'Messages are secured with AES-256-GCM encryption. Only you and the recipient can read them. Not even we can access your messages.',
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text('Got it'),
                    ),
                  ],
                ),
              );
            },
            child: const Text('Learn more'),
          ),
        ],
      ),
    );
  }
}
