import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';

import '../../database/database_backup_service.dart';
import '../../theme.dart';
import '../../theme.dart';

/// Bottom sheet showing backup history with restore, verify, share, and delete options
class BackupHistorySheet extends StatefulWidget {
  final VoidCallback? onBackupRestored;

  const BackupHistorySheet({
    super.key,
    this.onBackupRestored,
  });

  static Future<void> show(BuildContext context, {VoidCallback? onBackupRestored}) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (context) => BackupHistorySheet(onBackupRestored: onBackupRestored),
    );
  }

  @override
  State<BackupHistorySheet> createState() => _BackupHistorySheetState();
}

class _BackupHistorySheetState extends State<BackupHistorySheet> {
  final _backupService = DatabaseBackupService.instance;
  
  List<BackupFileInfo>? _backups;
  bool _isLoading = true;
  String? _error;
  
  // Action states
  String? _processingBackupPath;
  String _processingAction = '';

  @override
  void initState() {
    super.initState();
    _loadBackups();
  }

  Future<void> _loadBackups() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final backups = await _backupService.listLocalBackups();
      if (mounted) {
        setState(() {
          _backups = backups;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Failed to load backups: $e';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _verifyBackup(BackupFileInfo backup) async {
    setState(() {
      _processingBackupPath = backup.path;
      _processingAction = 'verify';
    });
    HapticFeedback.lightImpact();

    try {
      String? password;
      if (backup.isEncrypted) {
        password = await _showPasswordDialog('Enter password to verify');
        if (password == null) {
          setState(() => _processingBackupPath = null);
          return;
        }
      }

      final result = await _backupService.verifyBackup(backup.path, password: password);

      if (mounted) {
        if (result.isValid) {
          _showResultDialog(
            title: 'Backup Valid ✓',
            icon: Icons.check_circle,
            iconColor: AppColors.success,
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildInfoRow('Messages', '${result.manifest?.messageCount ?? 0}'),
                _buildInfoRow('Channels', '${result.manifest?.channelCount ?? 0}'),
                _buildInfoRow('Created', _formatDate(result.manifest?.createdAt)),
                _buildInfoRow('Encrypted', result.isEncrypted ? 'Yes' : 'No'),
              ],
            ),
          );
        } else {
          _showResultDialog(
            title: 'Verification Failed',
            icon: Icons.error,
            iconColor: Theme.of(context).colorScheme.error,
            content: Text(result.error ?? 'Unknown error'),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        _showSnackBar('Verification failed: $e', isError: true);
      }
    } finally {
      if (mounted) setState(() => _processingBackupPath = null);
    }
  }

  Future<void> _restoreBackup(BackupFileInfo backup) async {
    // Confirm restore
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Restore Backup'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'This will restore messages from:',
              style: context.textStyles.bodyMedium,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              _formatDate(backup.createdAt),
              style: context.textStyles.bodyLarge?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              'Current messages will be merged with the backup.',
              style: context.textStyles.bodySmall?.withColor(
                Theme.of(context).colorScheme.onSurfaceVariant,
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
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Restore'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() {
      _processingBackupPath = backup.path;
      _processingAction = 'restore';
    });
    HapticFeedback.mediumImpact();

    try {
      String? password;
      if (backup.isEncrypted) {
        password = await _showPasswordDialog('Enter backup password');
        if (password == null) {
          setState(() => _processingBackupPath = null);
          return;
        }
      }

      final result = await _backupService.restoreFromFile(
        backup.path,
        password: password,
        mergeWithExisting: true,
      );

      if (mounted) {
        if (result.success) {
          _showSnackBar(
            'Restored ${result.messagesRestored} messages from ${result.channelsRestored} channels',
          );
          widget.onBackupRestored?.call();
          Navigator.pop(context);
        } else {
          _showSnackBar(result.error ?? 'Restore failed', isError: true);
        }
      }
    } catch (e) {
      if (mounted) {
        _showSnackBar('Restore failed: $e', isError: true);
      }
    } finally {
      if (mounted) setState(() => _processingBackupPath = null);
    }
  }

  Future<void> _shareBackup(BackupFileInfo backup) async {
    setState(() {
      _processingBackupPath = backup.path;
      _processingAction = 'share';
    });
    HapticFeedback.lightImpact();

    try {
      await Share.shareXFiles(
        [XFile(backup.path)],
        subject: 'Thittam Chat Backup',
        text: 'Chat backup from ${_formatDate(backup.createdAt)}',
      );
    } catch (e) {
      if (mounted) {
        _showSnackBar('Failed to share backup: $e', isError: true);
      }
    } finally {
      if (mounted) setState(() => _processingBackupPath = null);
    }
  }

  Future<void> _deleteBackup(BackupFileInfo backup) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Backup'),
        content: Text(
          'Are you sure you want to delete this backup from ${_formatDate(backup.createdAt)}?\n\nThis action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() {
      _processingBackupPath = backup.path;
      _processingAction = 'delete';
    });
    HapticFeedback.heavyImpact();

    try {
      final file = await Future.value(backup.path);
      await Future.delayed(const Duration(milliseconds: 100));
      
      // Delete the file
      final fileToDelete = File(backup.path);
      await fileToDelete.delete();
      
      if (mounted) {
        _showSnackBar('Backup deleted');
        _loadBackups(); // Refresh list
      }
    } catch (e) {
      if (mounted) {
        _showSnackBar('Failed to delete backup: $e', isError: true);
      }
    } finally {
      if (mounted) setState(() => _processingBackupPath = null);
    }
  }

  Future<String?> _showPasswordDialog(String title) async {
    final controller = TextEditingController();
    
    return showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: TextField(
          controller: controller,
          obscureText: true,
          autofocus: true,
          decoration: const InputDecoration(
            labelText: 'Password',
            prefixIcon: Icon(Icons.lock_outline),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, controller.text),
            child: const Text('Continue'),
          ),
        ],
      ),
    );
  }

  void _showResultDialog({
    required String title,
    required IconData icon,
    required Color iconColor,
    required Widget content,
  }) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(icon, color: iconColor),
            const SizedBox(width: AppSpacing.sm),
            Text(title),
          ],
        ),
        content: content,
        actions: [
          FilledButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _showSnackBar(String message, {bool isError = false}) {
    HapticFeedback.lightImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(
              isError ? Icons.error : Icons.check_circle,
              color: Colors.white,
              size: 20,
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: isError 
            ? Theme.of(context).colorScheme.error 
            : AppColors.success,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: context.textStyles.bodyMedium),
          Text(
            value,
            style: context.textStyles.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime? date) {
    if (date == null) return 'Unknown';
    final now = DateTime.now();
    final diff = now.difference(date);
    
    if (diff.inDays == 0) {
      return 'Today at ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
    } else if (diff.inDays == 1) {
      return 'Yesterday at ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
    } else if (diff.inDays < 7) {
      return '${diff.inDays} days ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Center(
            child: Container(
              margin: const EdgeInsets.symmetric(vertical: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: cs.onSurfaceVariant.withOpacity(0.4),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            child: Row(
              children: [
                Icon(Icons.history, color: cs.primary),
                const SizedBox(width: AppSpacing.sm),
                Text(
                  'Backup History',
                  style: context.textStyles.titleLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.refresh),
                  onPressed: _loadBackups,
                  tooltip: 'Refresh',
                ),
              ],
            ),
          ),
          
          const Divider(),
          
          // Content
          Flexible(
            child: _buildContent(),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(AppSpacing.xl),
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline, size: 48, color: Theme.of(context).colorScheme.error),
              const SizedBox(height: AppSpacing.md),
              Text(_error!, textAlign: TextAlign.center),
              const SizedBox(height: AppSpacing.md),
              OutlinedButton(
                onPressed: _loadBackups,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    if (_backups == null || _backups!.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.cloud_off,
                size: 64,
                color: Theme.of(context).colorScheme.onSurfaceVariant.withOpacity(0.5),
              ),
              const SizedBox(height: AppSpacing.md),
              Text(
                'No Backups Found',
                style: context.textStyles.titleMedium,
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Create your first backup to see it here',
                style: context.textStyles.bodySmall?.withColor(
                  Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.separated(
      shrinkWrap: true,
      padding: const EdgeInsets.only(bottom: AppSpacing.xl),
      itemCount: _backups!.length,
      separatorBuilder: (_, __) => const Divider(height: 1),
      itemBuilder: (context, index) => _buildBackupTile(_backups![index]),
    );
  }

  Widget _buildBackupTile(BackupFileInfo backup) {
    final cs = Theme.of(context).colorScheme;
    final isProcessing = _processingBackupPath == backup.path;

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.sm,
      ),
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: cs.primaryContainer.withOpacity(0.5),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(
          backup.isEncrypted ? Icons.lock : Icons.cloud_done,
          color: cs.primary,
          size: 24,
        ),
      ),
      title: Text(
        _formatDate(backup.createdAt),
        style: context.textStyles.bodyLarge?.copyWith(fontWeight: FontWeight.w500),
      ),
      subtitle: Row(
        children: [
          Text(
            backup.sizeFormatted,
            style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
          ),
          if (backup.isEncrypted) ...[
            const SizedBox(width: AppSpacing.sm),
            Icon(Icons.lock, size: 14, color: AppColors.success),
            const SizedBox(width: 2),
            Text(
              'Encrypted',
              style: context.textStyles.labelSmall?.withColor(AppColors.success),
            ),
          ],
        ],
      ),
      trailing: isProcessing
          ? SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: cs.primary,
              ),
            )
          : PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert),
              onSelected: (action) {
                switch (action) {
                  case 'restore':
                    _restoreBackup(backup);
                    break;
                  case 'verify':
                    _verifyBackup(backup);
                    break;
                  case 'share':
                    _shareBackup(backup);
                    break;
                  case 'delete':
                    _deleteBackup(backup);
                    break;
                }
              },
              itemBuilder: (context) => [
                const PopupMenuItem(
                  value: 'restore',
                  child: ListTile(
                    leading: Icon(Icons.restore),
                    title: Text('Restore'),
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
                const PopupMenuItem(
                  value: 'verify',
                  child: ListTile(
                    leading: Icon(Icons.verified_outlined),
                    title: Text('Verify'),
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
                const PopupMenuItem(
                  value: 'share',
                  child: ListTile(
                    leading: Icon(Icons.share),
                    title: Text('Share'),
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
                const PopupMenuDivider(),
                PopupMenuItem(
                  value: 'delete',
                  child: ListTile(
                    leading: Icon(Icons.delete_outline, color: cs.error),
                    title: Text('Delete', style: TextStyle(color: cs.error)),
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
              ],
            ),
    );
  }
}
