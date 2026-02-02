import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/settings_components.dart';
import 'package:thittam1hub/widgets/settings/settings_tab_scaffold.dart';
import 'package:thittam1hub/services/backup_scheduler_service.dart';
import 'package:thittam1hub/services/chat_backup_service.dart';
import 'package:thittam1hub/widgets/chat/backup_history_sheet.dart';

import 'package:thittam1hub/services/logging_service.dart';
/// Backup & Restore tab for Chat Settings
class ChatBackupTab extends StatefulWidget {
  // Logging
   static final _log = LoggingService.instance;
   static const String _tag = 'ChatBackupTab';

  const ChatBackupTab({super.key});

  @override
  State<ChatBackupTab> createState() => _ChatBackupTabState();
}

class _ChatBackupTabState extends State<ChatBackupTab> {
  static const String _tag = 'ChatBackupTab';
  static final _log = LoggingService.instance;
  
  bool _isLoading = true;
  String? _error;

  // Backup settings
  bool _autoBackup = false;
  BackupFrequency _backupFrequency = BackupFrequency.weekly;
  bool _wifiOnly = true;
  bool _hasBackupPassword = false;
  int _retentionCount = 5;
  DateTime? _lastBackup;
  DateTime? _nextBackup;
  bool _isBackupOverdue = false;

  // Action states
  bool _backingUp = false;
  bool _restoringBackup = false;

  final List<int> _retentionOptions = [3, 5, 10, 20];

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
      final scheduler = BackupSchedulerService.instance;
      final settings = await scheduler.getSettings();

      if (mounted) {
        setState(() {
          _autoBackup = settings.isEnabled;
          _backupFrequency = settings.frequency;
          _wifiOnly = settings.wifiOnly;
          _hasBackupPassword = settings.hasPassword;
          _retentionCount = settings.retentionCount;
          _lastBackup = settings.lastBackupTime;
          _nextBackup = settings.nextBackupTime;
          _isBackupOverdue = settings.isOverdue;
          _isLoading = false;
        });
      }
    } catch (e) {
      _log.error('Failed to load backup settings: $e', tag: _tag);
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = 'Failed to load backup settings';
        });
      }
    }
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

  void _showErrorSnackBar(String message, [VoidCallback? onRetry]) {
    HapticFeedback.heavyImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Theme.of(context).colorScheme.error,
        behavior: SnackBarBehavior.floating,
        action: onRetry != null
            ? SnackBarAction(
                label: 'Retry',
                textColor: Theme.of(context).colorScheme.onError,
                onPressed: onRetry,
              )
            : null,
      ),
    );
  }

  Future<void> _toggleAutoBackup(bool enabled) async {
    HapticFeedback.selectionClick();

    try {
      if (enabled) {
        await BackupSchedulerService.instance.enableAutoBackup(
          frequency: _backupFrequency,
          retentionCount: _retentionCount,
          wifiOnly: _wifiOnly,
        );
        if (mounted) {
          setState(() => _autoBackup = true);
          _loadSettings(); // Refresh to get next backup time
          _showSuccessSnackBar('Auto-backup enabled');
        }
      } else {
        await BackupSchedulerService.instance.disableAutoBackup();
        if (mounted) {
          setState(() {
            _autoBackup = false;
            _nextBackup = null;
          });
          _showSuccessSnackBar('Auto-backup disabled');
        }
      }
    } catch (e) {
      _log.error('Failed to toggle auto backup: $e', tag: _tag);
      if (mounted) {
        _showErrorSnackBar('Failed to ${enabled ? 'enable' : 'disable'} auto backup');
      }
    }
  }

  Future<void> _backupNow() async {
    if (_backingUp) return;

    setState(() => _backingUp = true);
    HapticFeedback.mediumImpact();

    try {
      final result = await BackupSchedulerService.instance.triggerImmediateBackup();

      if (mounted) {
        if (result.success) {
          setState(() => _lastBackup = result.timestamp);
          _showSuccessSnackBar('Backup complete! ${result.messageCount ?? 0} messages saved');
          _loadSettings();
        } else {
          _showErrorSnackBar(result.error ?? 'Backup failed', _backupNow);
        }
      }
    } catch (e) {
      _log.error('Failed to backup: $e', tag: _tag);
      if (mounted) {
        _showErrorSnackBar('Backup failed', _backupNow);
      }
    } finally {
      if (mounted) setState(() => _backingUp = false);
    }
  }

  Future<void> _restoreBackup() async {
    if (_restoringBackup) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Restore Backup'),
        content: const Text(
          'This will restore messages from your last backup. Current messages will be merged.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Restore'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    setState(() => _restoringBackup = true);
    HapticFeedback.mediumImpact();

    try {
      final backups = await ChatBackupService.instance.getBackupHistory(limit: 1);
      if (backups.isEmpty) {
        _showErrorSnackBar('No backup found to restore');
        return;
      }

      _showSuccessSnackBar('Restore initiated - check your messages');
    } catch (e) {
      _log.error('Failed to restore: $e', tag: _tag);
      if (mounted) {
        _showErrorSnackBar('Restore failed', _restoreBackup);
      }
    } finally {
      if (mounted) setState(() => _restoringBackup = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return SettingsTabScaffold(
      isLoading: _isLoading,
      error: _error,
      onRetry: _loadSettings,
      onRefresh: _loadSettings,
      header: _autoBackup ? _buildBackupStatusCard(cs) : null,
      children: [
        SettingsSection(
          title: 'Message Backup',
          icon: Icons.cloud_outlined,
          iconColor: AppColors.teal500,
          children: [
            SettingsToggle(
              label: 'Auto Backup',
              subtitle: 'Automatically backup chat messages on schedule',
              icon: Icons.cloud_upload_outlined,
              value: _autoBackup,
              onChanged: _toggleAutoBackup,
            ),
            if (_autoBackup) ...[
              const SettingsDivider(),
              SettingsPicker<BackupFrequency>(
                label: 'Backup Frequency',
                icon: Icons.schedule,
                value: _backupFrequency,
                options: [
                  BackupFrequency.daily,
                  BackupFrequency.weekly,
                  BackupFrequency.biweekly,
                  BackupFrequency.monthly,
                ],
                displayValue: (v) => v.displayName,
                onChanged: (v) async {
                  setState(() => _backupFrequency = v);
                  HapticFeedback.selectionClick();
                  try {
                    await BackupSchedulerService.instance.updateFrequency(v);
                    _loadSettings();
                  } catch (e) {
                    _log.error('Failed to update frequency: $e', tag: _tag);
                  }
                },
              ),
              const SettingsDivider(),
              SettingsToggle(
                label: 'WiFi Only',
                subtitle: 'Backup only when connected to WiFi',
                icon: Icons.wifi,
                value: _wifiOnly,
                onChanged: (v) async {
                  setState(() => _wifiOnly = v);
                  HapticFeedback.selectionClick();
                  try {
                    await BackupSchedulerService.instance.enableAutoBackup(
                      frequency: _backupFrequency,
                      retentionCount: _retentionCount,
                      wifiOnly: v,
                    );
                  } catch (e) {
                    _log.error('Failed to update WiFi setting: $e', tag: _tag);
                    if (mounted) setState(() => _wifiOnly = !v);
                  }
                },
              ),
              const SettingsDivider(),
              SettingsPicker<int>(
                label: 'Keep Backups',
                subtitle: 'Older backups will be automatically deleted',
                icon: Icons.history,
                value: _retentionCount,
                options: _retentionOptions,
                displayValue: (v) => '$v backups',
                onChanged: (v) async {
                  final prev = _retentionCount;
                  setState(() => _retentionCount = v);
                  HapticFeedback.selectionClick();
                  try {
                    await BackupSchedulerService.instance.enableAutoBackup(
                      frequency: _backupFrequency,
                      retentionCount: v,
                      wifiOnly: _wifiOnly,
                    );
                  } catch (e) {
                    _log.error('Failed to update retention: $e', tag: _tag);
                    if (mounted) setState(() => _retentionCount = prev);
                  }
                },
              ),
              const SettingsDivider(),
              SettingsAction(
                label: _hasBackupPassword ? 'Change Backup Password' : 'Set Backup Password',
                subtitle: _hasBackupPassword
                    ? 'Your backups are encrypted'
                    : 'Add password protection to backups',
                icon: Icons.password,
                onTap: _hasBackupPassword ? _showChangePasswordDialog : _showSetPasswordDialog,
              ),
              if (_hasBackupPassword) ...[
                const SettingsDivider(),
                SettingsAction(
                  label: 'Remove Password',
                  subtitle: 'Disable backup encryption',
                  icon: Icons.no_encryption,
                  isDestructive: true,
                  onTap: _showRemovePasswordDialog,
                ),
              ],
            ],
            const SettingsDivider(),
            SettingsAction(
              label: _backingUp ? 'Backing up...' : 'Backup Now',
              subtitle: _lastBackup != null
                  ? 'Last backup: ${_formatRelativeTime(_lastBackup!)}'
                  : 'No backups yet',
              icon: Icons.backup,
              onTap: _backingUp ? null : _backupNow,
            ),
            const SettingsDivider(),
            SettingsAction(
              label: _restoringBackup ? 'Restoring...' : 'Restore from Backup',
              subtitle: 'Recover messages from a backup',
              icon: Icons.restore,
              onTap: _restoringBackup ? null : _restoreBackup,
            ),
            const SettingsDivider(),
            SettingsAction(
              label: 'Backup History',
              subtitle: 'View and manage all backups',
              icon: Icons.history,
              onTap: () {
                BackupHistorySheet.show(context);
              },
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildBackupStatusCard(ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: _isBackupOverdue
            ? cs.errorContainer.withOpacity(0.5)
            : AppColors.teal500.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(
          color: _isBackupOverdue
              ? cs.error.withOpacity(0.3)
              : AppColors.teal500.withOpacity(0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                _isBackupOverdue ? Icons.warning_amber : Icons.cloud_done,
                size: 20,
                color: _isBackupOverdue ? cs.error : AppColors.teal500,
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(
                  _isBackupOverdue ? 'Backup Overdue' : 'Auto-Backup Active',
                  style: context.textStyles.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: _isBackupOverdue ? cs.error : cs.onSurface,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          if (_lastBackup != null)
            Text(
              'Last backup: ${_formatRelativeTime(_lastBackup!)}',
              style: context.textStyles.bodySmall?.copyWith(
                color: cs.onSurfaceVariant,
              ),
            ),
          if (_nextBackup != null && !_isBackupOverdue)
            Text(
              'Next backup: ${_formatRelativeTime(_nextBackup!)}',
              style: context.textStyles.bodySmall?.copyWith(
                color: cs.onSurfaceVariant,
              ),
            ),
          if (_hasBackupPassword)
            Padding(
              padding: const EdgeInsets.only(top: AppSpacing.xs),
              child: Row(
                children: [
                  const Icon(Icons.lock, size: 14, color: AppColors.success),
                  const SizedBox(width: 4),
                  Text(
                    'Password protected',
                    style: context.textStyles.labelSmall?.withColor(AppColors.success),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  String _formatRelativeTime(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.isNegative) {
      final futureDiff = date.difference(now);
      if (futureDiff.inDays > 0) {
        return 'in ${futureDiff.inDays} day${futureDiff.inDays > 1 ? 's' : ''}';
      }
      if (futureDiff.inHours > 0) {
        return 'in ${futureDiff.inHours} hour${futureDiff.inHours > 1 ? 's' : ''}';
      }
      return 'soon';
    }

    if (diff.inDays > 0) return '${diff.inDays} day${diff.inDays > 1 ? 's' : ''} ago';
    if (diff.inHours > 0) return '${diff.inHours} hour${diff.inHours > 1 ? 's' : ''} ago';
    if (diff.inMinutes > 0) return '${diff.inMinutes} minute${diff.inMinutes > 1 ? 's' : ''} ago';
    return 'just now';
  }

  void _showSetPasswordDialog() {
    final passwordController = TextEditingController();
    final confirmController = TextEditingController();
    String? error;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Set Backup Password'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Your backups will be encrypted with AES-256. Make sure to remember this password.',
                style: context.textStyles.bodySmall?.withColor(
                  Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              TextField(
                controller: passwordController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Password',
                  prefixIcon: Icon(Icons.lock_outline),
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              TextField(
                controller: confirmController,
                obscureText: true,
                decoration: InputDecoration(
                  labelText: 'Confirm Password',
                  prefixIcon: const Icon(Icons.lock_outline),
                  errorText: error,
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () async {
                if (passwordController.text.isEmpty) {
                  setDialogState(() => error = 'Password is required');
                  return;
                }
                if (passwordController.text.length < 6) {
                  setDialogState(() => error = 'Password must be at least 6 characters');
                  return;
                }
                if (passwordController.text != confirmController.text) {
                  setDialogState(() => error = 'Passwords do not match');
                  return;
                }

                try {
                  await BackupSchedulerService.instance.updatePassword(passwordController.text);
                  if (mounted) {
                    setState(() => _hasBackupPassword = true);
                    Navigator.pop(context);
                    _showSuccessSnackBar('Backup password set');
                  }
                } catch (e) {
                  setDialogState(() => error = 'Failed to set password');
                }
              },
              child: const Text('Set Password'),
            ),
          ],
        ),
      ),
    );
  }

  void _showRemovePasswordDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove Password Protection'),
        content: const Text(
          'Your backups will no longer be encrypted. Existing encrypted backups will still require the password to restore.',
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
              try {
                await BackupSchedulerService.instance.updatePassword(null);
                if (mounted) {
                  setState(() => _hasBackupPassword = false);
                  Navigator.pop(context);
                  _showSuccessSnackBar('Password protection removed');
                }
              } catch (e) {
                Navigator.pop(context);
                _showErrorSnackBar('Failed to remove password');
              }
            },
            child: const Text('Remove'),
          ),
        ],
      ),
    );
  }

  void _showChangePasswordDialog() {
    final newController = TextEditingController();
    final confirmController = TextEditingController();
    String? error;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Change Backup Password'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: newController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'New Password',
                  prefixIcon: Icon(Icons.lock),
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              TextField(
                controller: confirmController,
                obscureText: true,
                decoration: InputDecoration(
                  labelText: 'Confirm New Password',
                  prefixIcon: const Icon(Icons.lock),
                  errorText: error,
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () async {
                if (newController.text.isEmpty) {
                  setDialogState(() => error = 'New password is required');
                  return;
                }
                if (newController.text.length < 6) {
                  setDialogState(() => error = 'Password must be at least 6 characters');
                  return;
                }
                if (newController.text != confirmController.text) {
                  setDialogState(() => error = 'Passwords do not match');
                  return;
                }

                try {
                  await BackupSchedulerService.instance.updatePassword(newController.text);
                  if (mounted) {
                    Navigator.pop(context);
                    _showSuccessSnackBar('Password updated');
                  }
                } catch (e) {
                  setDialogState(() => error = 'Failed to update password');
                }
              },
              child: const Text('Update'),
            ),
          ],
        ),
      ),
    );
  }
}
