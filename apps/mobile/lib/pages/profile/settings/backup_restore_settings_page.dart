import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';

import 'package:thittam1hub/services/backup_scheduler_service.dart';
import 'package:thittam1hub/database/database_backup_service.dart';
import 'package:thittam1hub/widgets/settings_components.dart';
import 'package:thittam1hub/widgets/settings/settings_page_scaffold.dart';
import 'package:thittam1hub/widgets/settings/settings_export_sheet.dart';
import 'package:thittam1hub/widgets/settings/settings_import_sheet.dart';
import 'package:thittam1hub/widgets/chat/backup_history_sheet.dart';
import 'package:thittam1hub/widgets/common/settings_feedback.dart';
import 'package:thittam1hub/theme.dart';

/// Backup & Restore Settings Page for Profile Settings
/// Manages database/local backup using BackupSchedulerService
class BackupRestoreSettingsPage extends StatefulWidget {
  const BackupRestoreSettingsPage({super.key});

  @override
  State<BackupRestoreSettingsPage> createState() => _BackupRestoreSettingsPageState();
}

class _BackupRestoreSettingsPageState extends State<BackupRestoreSettingsPage> {
  bool _isLoading = true;
  String? _errorMessage;
  
  // Backup settings state
  bool _autoBackupEnabled = false;
  BackupFrequency _backupFrequency = BackupFrequency.weekly;
  bool _wifiOnly = true;
  bool _hasPassword = false;
  int _retentionCount = 5;
  DateTime? _lastBackupTime;
  DateTime? _nextBackupTime;
  bool _isOverdue = false;
  
  // Action states
  bool _isBackingUp = false;
  bool _isRestoring = false;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final settings = await BackupSchedulerService.instance.getSettings();
      
      if (mounted) {
        setState(() {
          _autoBackupEnabled = settings.isEnabled;
          _backupFrequency = settings.frequency;
          _wifiOnly = settings.wifiOnly;
          _hasPassword = settings.hasPassword;
          _retentionCount = settings.retentionCount;
          _lastBackupTime = settings.lastBackupTime;
          _nextBackupTime = settings.nextBackupTime;
          _isOverdue = settings.isOverdue;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to load backup settings';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _toggleAutoBackup(bool enabled) async {
    HapticFeedback.lightImpact();
    
    try {
      if (enabled) {
        await BackupSchedulerService.instance.enableAutoBackup(
          frequency: _backupFrequency,
          retentionCount: _retentionCount,
          wifiOnly: _wifiOnly,
        );
      } else {
        await BackupSchedulerService.instance.disableAutoBackup();
      }
      
      setState(() => _autoBackupEnabled = enabled);
      await _loadSettings();
      
      if (mounted) {
        SettingsFeedback.showSuccess(
          context,
          enabled ? 'Auto-backup enabled' : 'Auto-backup disabled',
        );
      }
    } catch (e) {
      if (mounted) {
        SettingsFeedback.showError(context, 'Failed to update auto-backup');
      }
    }
  }

  Future<void> _updateFrequency(BackupFrequency frequency) async {
    HapticFeedback.lightImpact();
    
    try {
      await BackupSchedulerService.instance.updateFrequency(frequency);
      setState(() => _backupFrequency = frequency);
      await _loadSettings();
      
      if (mounted) {
        SettingsFeedback.showSuccess(context, 'Backup frequency updated');
      }
    } catch (e) {
      if (mounted) {
        SettingsFeedback.showError(context, 'Failed to update frequency');
      }
    }
  }

  Future<void> _updateRetentionCount(int count) async {
    HapticFeedback.lightImpact();
    
    try {
      await BackupSchedulerService.instance.enableAutoBackup(
        frequency: _backupFrequency,
        retentionCount: count,
        wifiOnly: _wifiOnly,
      );
      setState(() => _retentionCount = count);
      
      if (mounted) {
        SettingsFeedback.showSuccess(context, 'Retention count updated');
      }
    } catch (e) {
      if (mounted) {
        SettingsFeedback.showError(context, 'Failed to update retention');
      }
    }
  }

  Future<void> _updateWifiOnly(bool wifiOnly) async {
    HapticFeedback.lightImpact();
    
    try {
      if (_autoBackupEnabled) {
        await BackupSchedulerService.instance.enableAutoBackup(
          frequency: _backupFrequency,
          retentionCount: _retentionCount,
          wifiOnly: wifiOnly,
        );
      }
      setState(() => _wifiOnly = wifiOnly);
      
      if (mounted) {
        SettingsFeedback.showSuccess(
          context,
          wifiOnly ? 'WiFi-only backup enabled' : 'Backup on any network',
        );
      }
    } catch (e) {
      if (mounted) {
        SettingsFeedback.showError(context, 'Failed to update network settings');
      }
    }
  }

  Future<void> _triggerManualBackup() async {
    HapticFeedback.mediumImpact();
    setState(() => _isBackingUp = true);
    
    try {
      final result = await BackupSchedulerService.instance.triggerImmediateBackup();
      
      if (mounted) {
        if (result.success) {
          SettingsFeedback.showSuccess(
            context,
            'Backup created: ${result.messageCount ?? 0} messages',
          );
          await _loadSettings();
        } else {
          SettingsFeedback.showError(context, result.error ?? 'Backup failed');
        }
      }
    } catch (e) {
      if (mounted) {
        SettingsFeedback.showError(context, 'Backup failed: $e');
      }
    } finally {
      if (mounted) setState(() => _isBackingUp = false);
    }
  }

  Future<void> _showSetPasswordDialog() async {
    final passwordController = TextEditingController();
    final confirmController = TextEditingController();
    
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Set Backup Password'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Your backups will be encrypted with AES-256. Keep this password safe - you\'ll need it to restore.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: AppSpacing.md),
            TextField(
              controller: passwordController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Password',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            TextField(
              controller: confirmController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Confirm Password',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              if (passwordController.text.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Password cannot be empty')),
                );
                return;
              }
              if (passwordController.text != confirmController.text) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Passwords do not match')),
                );
                return;
              }
              if (passwordController.text.length < 6) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Password must be at least 6 characters')),
                );
                return;
              }
              Navigator.pop(context, true);
            },
            child: const Text('Set Password'),
          ),
        ],
      ),
    );
    
    if (result == true && mounted) {
      try {
        await BackupSchedulerService.instance.updatePassword(passwordController.text);
        setState(() => _hasPassword = true);
        SettingsFeedback.showSuccess(context, 'Backup password set');
      } catch (e) {
        SettingsFeedback.showError(context, 'Failed to set password');
      }
    }
    
    passwordController.dispose();
    confirmController.dispose();
  }

  Future<void> _removePassword() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove Password Protection?'),
        content: const Text(
          'Future backups will not be encrypted. Existing encrypted backups will still require the password to restore.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text('Remove'),
          ),
        ],
      ),
    );
    
    if (confirm == true && mounted) {
      try {
        await BackupSchedulerService.instance.updatePassword(null);
        setState(() => _hasPassword = false);
        SettingsFeedback.showSuccess(context, 'Password protection removed');
      } catch (e) {
        SettingsFeedback.showError(context, 'Failed to remove password');
      }
    }
  }

  void _showBackupHistory() {
    HapticFeedback.lightImpact();
    BackupHistorySheet.show(
      context,
      onBackupRestored: () {
        _loadSettings();
        SettingsFeedback.showSuccess(context, 'Backup restored successfully');
      },
    );
  }

  String _formatRelativeTime(DateTime? dateTime) {
    if (dateTime == null) return 'Never';
    
    final now = DateTime.now();
    final diff = now.difference(dateTime);
    
    if (diff.isNegative) {
      // Future time
      final futureDiff = dateTime.difference(now);
      if (futureDiff.inMinutes < 60) {
        return 'In ${futureDiff.inMinutes} min';
      } else if (futureDiff.inHours < 24) {
        return 'In ${futureDiff.inHours}h';
      } else if (futureDiff.inDays < 7) {
        return 'In ${futureDiff.inDays} days';
      }
      return DateFormat('MMM d').format(dateTime);
    }
    
    // Past time
    if (diff.inMinutes < 1) {
      return 'Just now';
    } else if (diff.inMinutes < 60) {
      return '${diff.inMinutes} min ago';
    } else if (diff.inHours < 24) {
      return '${diff.inHours}h ago';
    } else if (diff.inDays < 7) {
      return '${diff.inDays} days ago';
    }
    return DateFormat('MMM d, yyyy').format(dateTime);
  }

  @override
  Widget build(BuildContext context) {
    return SettingsPageScaffold(
      title: 'Backup & Restore',
      isLoading: _isLoading,
      errorMessage: _errorMessage,
      onRetry: _loadSettings,
      onRefresh: _loadSettings,
      body: ListView(
        padding: EdgeInsets.symmetric(
          horizontal: context.horizontalPadding,
          vertical: AppSpacing.md,
        ),
        children: [
          // Backup Status Card
          _buildStatusCard(),
          const SizedBox(height: AppSpacing.lg),
          
          // Auto-Backup Section
          _buildAutoBackupSection(),
          const SizedBox(height: AppSpacing.lg),
          
          // Security Section
          _buildSecuritySection(),
          const SizedBox(height: AppSpacing.lg),
          
          // Manual Actions Section
          _buildManualActionsSection(),
          const SizedBox(height: AppSpacing.lg),
          
          // Settings Transfer Section (Export/Import)
          _buildSettingsTransferSection(),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildStatusCard() {
    final cs = Theme.of(context).colorScheme;
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(AppSpacing.sm),
                  decoration: BoxDecoration(
                    color: _isOverdue
                        ? cs.error.withOpacity(0.15)
                        : cs.primary.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                  child: Icon(
                    _isOverdue ? Icons.warning_amber : Icons.backup,
                    color: _isOverdue ? cs.error : cs.primary,
                    size: 24,
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Database Backup',
                        style: context.textStyles.titleMedium?.semiBold,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _autoBackupEnabled
                            ? 'Auto-backup ${_backupFrequency.displayName.toLowerCase()}'
                            : 'Manual backup only',
                        style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
                      ),
                    ],
                  ),
                ),
                if (_hasPassword)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.sm,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: cs.tertiary.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.lock, size: 14, color: cs.tertiary),
                        const SizedBox(width: 4),
                        Text(
                          'Encrypted',
                          style: context.textStyles.labelSmall?.withColor(cs.tertiary),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            const Divider(height: 1),
            const SizedBox(height: AppSpacing.md),
            
            // Last & Next Backup Info
            Row(
              children: [
                Expanded(
                  child: _buildInfoItem(
                    'Last Backup',
                    _formatRelativeTime(_lastBackupTime),
                    Icons.history,
                    _lastBackupTime == null ? cs.onSurfaceVariant : null,
                  ),
                ),
                if (_autoBackupEnabled) ...[
                  Container(
                    width: 1,
                    height: 32,
                    color: cs.outline.withOpacity(0.3),
                  ),
                  Expanded(
                    child: _buildInfoItem(
                      'Next Backup',
                      _formatRelativeTime(_nextBackupTime),
                      Icons.schedule,
                      _isOverdue ? cs.error : null,
                    ),
                  ),
                ],
              ],
            ),
            
            if (_isOverdue) ...[
              const SizedBox(height: AppSpacing.sm),
              Container(
                padding: const EdgeInsets.all(AppSpacing.sm),
                decoration: BoxDecoration(
                  color: cs.error.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                child: Row(
                  children: [
                    Icon(Icons.warning_amber, size: 16, color: cs.error),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: Text(
                        'Backup is overdue. Tap "Backup Now" to create one.',
                        style: context.textStyles.bodySmall?.withColor(cs.error),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInfoItem(String label, String value, IconData icon, Color? color) {
    final cs = Theme.of(context).colorScheme;
    final textColor = color ?? cs.onSurface;
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: context.textStyles.labelSmall?.withColor(cs.onSurfaceVariant),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Icon(icon, size: 16, color: textColor),
              const SizedBox(width: 4),
              Flexible(
                child: Text(
                  value,
                  style: context.textStyles.bodyMedium?.withColor(textColor),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAutoBackupSection() {
    return SettingsSection(
      title: 'Automatic Backup',
      icon: Icons.schedule,
      initiallyExpanded: true,
      children: [
        SettingsToggle(
          label: 'Enable Auto-Backup',
          subtitle: 'Automatically backup your data on a schedule',
          icon: Icons.autorenew,
          value: _autoBackupEnabled,
          onChanged: _toggleAutoBackup,
        ),
        
        if (_autoBackupEnabled) ...[
          const SizedBox(height: AppSpacing.sm),
          
          SettingsDropdown<BackupFrequency>(
            label: 'Backup Frequency',
            icon: Icons.calendar_today,
            value: _backupFrequency,
            options: BackupFrequency.values.map((f) => DropdownOption(
              value: f,
              label: f.displayName,
            )).toList(),
            onChanged: _updateFrequency,
          ),
          
          const SizedBox(height: AppSpacing.sm),
          
          SettingsDropdown<int>(
            label: 'Keep Backups',
            subtitle: 'Older backups are automatically deleted',
            icon: Icons.folder_copy_outlined,
            value: _retentionCount,
            options: const [3, 5, 10, 20].map((c) => DropdownOption(
              value: c,
              label: '$c backups',
            )).toList(),
            onChanged: _updateRetentionCount,
          ),
          
          const SizedBox(height: AppSpacing.sm),
          
          SettingsToggle(
            label: 'WiFi Only',
            subtitle: 'Only backup when connected to WiFi',
            icon: Icons.wifi,
            value: _wifiOnly,
            onChanged: _updateWifiOnly,
          ),
        ],
      ],
    );
  }

  Widget _buildSecuritySection() {
    return SettingsSection(
      title: 'Backup Security',
      icon: Icons.security,
      children: [
        SettingsToggle(
          label: 'Password Protection',
          subtitle: _hasPassword
              ? 'Backups are encrypted with AES-256'
              : 'Encrypt backups with a password',
          icon: Icons.lock_outline,
          value: _hasPassword,
          onChanged: (enabled) {
            if (enabled) {
              _showSetPasswordDialog();
            } else {
              _removePassword();
            }
          },
        ),
        
        if (_hasPassword) ...[
          const SizedBox(height: AppSpacing.sm),
          
          SettingsAction(
            label: 'Change Password',
            subtitle: 'Update your backup encryption password',
            icon: Icons.key,
            onTap: _showSetPasswordDialog,
          ),
        ],
        
        const SizedBox(height: AppSpacing.sm),
        
        SettingsInfo(
          label: 'Security Note',
          value: 'Encrypted backups require the password to restore. If you forget your password, encrypted backups cannot be recovered.',
          icon: Icons.info_outline,
        ),
      ],
    );
  }

  Widget _buildManualActionsSection() {
    return SettingsSection(
      title: 'Manual Actions',
      icon: Icons.touch_app,
      initiallyExpanded: true,
      children: [
        SettingsAction(
          label: 'Backup Now',
          subtitle: 'Create a backup immediately',
          icon: Icons.backup,
          onTap: _isBackingUp ? null : _triggerManualBackup,
          trailing: _isBackingUp
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : null,
        ),
        
        const SizedBox(height: AppSpacing.sm),
        
        SettingsAction(
          label: 'View Backup History',
          subtitle: 'Manage and restore previous backups',
          icon: Icons.history,
          onTap: _showBackupHistory,
        ),
        
        const SizedBox(height: AppSpacing.sm),
        
        SettingsAction(
          label: 'Restore from File',
          subtitle: 'Import a backup from your device',
          icon: Icons.restore,
          onTap: _isRestoring ? null : () async {
            // Open file picker and restore
            HapticFeedback.lightImpact();
            BackupHistorySheet.show(
              context,
              onBackupRestored: () {
                _loadSettings();
                SettingsFeedback.showSuccess(context, 'Backup restored');
              },
            );
          },
        ),
      ],
    );
  }

  Widget _buildSettingsTransferSection() {
    final cs = Theme.of(context).colorScheme;
    
    return SettingsSection(
      title: 'Settings Transfer',
      icon: Icons.swap_horiz,
      children: [
        // Export Settings
        SettingsAction(
          label: 'Export Settings',
          subtitle: 'Save preferences to JSON for backup or transfer',
          icon: Icons.file_upload_outlined,
          onTap: () {
            HapticFeedback.lightImpact();
            SettingsExportSheet.show(context);
          },
        ),
        
        const SizedBox(height: AppSpacing.sm),
        
        // Import Settings
        SettingsAction(
          label: 'Import Settings',
          subtitle: 'Restore preferences from a JSON file',
          icon: Icons.file_download_outlined,
          onTap: () {
            HapticFeedback.lightImpact();
            SettingsImportSheet.show(context);
          },
        ),
        
        const SizedBox(height: AppSpacing.md),
        
        // Info card
        Container(
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: cs.surfaceContainerHighest.withOpacity(0.5),
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          child: Row(
            children: [
              Icon(
                Icons.info_outline,
                size: 20,
                color: cs.onSurfaceVariant,
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(
                  'Settings export includes notification, privacy, accessibility, and appearance preferences. Database backups are handled separately above.',
                  style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
