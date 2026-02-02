import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/services/storage_service.dart';
import 'package:thittam1hub/mixins/settings_audit_mixin.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/settings_components.dart';
import 'package:thittam1hub/widgets/settings/settings_page_scaffold.dart';
import 'package:thittam1hub/widgets/settings/settings_skeleton.dart';
import 'package:thittam1hub/widgets/common/settings_feedback.dart';
import 'package:thittam1hub/services/logging_service.dart';

/// Storage & Data Settings Page
class StorageSettingsPage extends StatefulWidget {
  const StorageSettingsPage({super.key});

  @override
  State<StorageSettingsPage> createState() => _StorageSettingsPageState();
}

class _StorageSettingsPageState extends State<StorageSettingsPage>
    with SettingsAuditMixin {
  static const String _tag = 'StorageSettingsPage';
  static final _log = LoggingService.instance;
  
  final _storageService = StorageService.instance;
  StorageBreakdown? _breakdown;
  bool _isLoading = true;
  bool _isClearing = false;

  @override
  String get auditSettingType => 'storage';

  @override
  void initState() {
    super.initState();
    _loadStorageData();
  }

  Future<void> _loadStorageData() async {
    setState(() => _isLoading = true);
    
    try {
      final breakdown = await _storageService.calculateStorage();
      if (mounted) {
        setState(() {
          _breakdown = breakdown;
          _isLoading = false;
        });
      }
    } catch (e) {
      _log.error('Failed to load storage data: $e', tag: _tag);
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _clearChatCache() async {
    final confirmed = await _showClearDialog(
      title: 'Clear Chat Cache',
      message: 'This will clear all cached messages. You will need to re-download them when you open chats.',
    );

    if (confirmed == true && mounted) {
      final previousSize = _breakdown?.categories
          .where((c) => c.name == 'Chat')
          .map((c) => c.sizeMB)
          .firstOrNull ?? 0.0;
      
      setState(() => _isClearing = true);
      HapticFeedback.mediumImpact();
      
      try {
        await _storageService.clearChatCache();
        if (mounted) {
          SettingsFeedback.showSuccess(context, 'Chat cache cleared');
          
          // Log the action
          logSettingChange(
            key: 'clearChatCache',
            oldValue: '${previousSize.toStringAsFixed(1)} MB',
            newValue: '0 MB',
          );
          
          await _loadStorageData();
        }
      } catch (e) {
        _log.error('Failed to clear chat cache: $e', tag: _tag);
        if (mounted) {
          SettingsFeedback.showError(context, 'Failed to clear chat cache');
        }
      } finally {
        if (mounted) setState(() => _isClearing = false);
      }
    }
  }

  Future<void> _clearImageCache() async {
    final confirmed = await _showClearDialog(
      title: 'Clear Image Cache',
      message: 'This will remove all cached images. They will be re-downloaded when needed.',
    );

    if (confirmed == true && mounted) {
      final previousSize = _breakdown?.categories
          .where((c) => c.name == 'Images')
          .map((c) => c.sizeMB)
          .firstOrNull ?? 0.0;
      
      setState(() => _isClearing = true);
      HapticFeedback.mediumImpact();
      
      try {
        await _storageService.clearImageCache();
        if (mounted) {
          SettingsFeedback.showSuccess(context, 'Image cache cleared');
          
          // Log the action
          logSettingChange(
            key: 'clearImageCache',
            oldValue: '${previousSize.toStringAsFixed(1)} MB',
            newValue: '0 MB',
          );
          
          await _loadStorageData();
        }
      } catch (e) {
        _log.error('Failed to clear image cache: $e', tag: _tag);
        if (mounted) {
          SettingsFeedback.showError(context, 'Failed to clear image cache');
        }
      } finally {
        if (mounted) setState(() => _isClearing = false);
      }
    }
  }

  Future<void> _clearAllCache() async {
    final confirmed = await _showClearDialog(
      title: 'Clear All Cache',
      message: 'This will clear all cached data including messages, images, and temporary files.',
    );

    if (confirmed == true && mounted) {
      final previousTotal = _breakdown?.formattedTotal ?? '0 MB';
      
      setState(() => _isClearing = true);
      HapticFeedback.heavyImpact();
      
      try {
        await _storageService.clearAllCache();
        if (mounted) {
          SettingsFeedback.showSuccess(context, 'All cache cleared');
          
          // Log the action
          logSettingChange(
            key: 'clearAllCache',
            oldValue: previousTotal,
            newValue: '0 MB',
          );
          
          await _loadStorageData();
        }
      } catch (e) {
        _log.error('Failed to clear all cache: $e', tag: _tag);
        if (mounted) {
          SettingsFeedback.showError(context, 'Failed to clear cache');
        }
      } finally {
        if (mounted) setState(() => _isClearing = false);
      }
    }
  }

  Future<bool?> _showClearDialog({
    required String title,
    required String message,
  }) {
    return showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
              foregroundColor: Theme.of(context).colorScheme.onError,
            ),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Clear'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return SettingsPageScaffold(
      title: 'Storage & Data',
      isLoading: _isLoading,
      onRefresh: _loadStorageData,
      skeletonSections: 3,
      body: Column(
        children: [
          // Storage Usage Card
          _StorageUsageCard(
            breakdown: _breakdown,
            isClearing: _isClearing,
          ),
          const SizedBox(height: AppSpacing.md),

          // Clear Data
          SettingsSection(
            title: 'Clear Data',
            icon: Icons.delete_outline,
            iconColor: cs.error,
            helpText: 'Clear cached data to free up storage space on your device.',
            children: [
              SettingsAction(
                label: 'Clear Chat Cache',
                subtitle: _breakdown != null 
                    ? 'Messages and chat data'
                    : 'Free up storage space',
                icon: Icons.chat_bubble_outline,
                trailing: _isClearing ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ) : null,
                onTap: _isClearing ? null : _clearChatCache,
              ),
              SettingsAction(
                label: 'Clear Image Cache',
                subtitle: 'Cached images and media',
                icon: Icons.image_outlined,
                trailing: _isClearing ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ) : null,
                onTap: _isClearing ? null : _clearImageCache,
              ),
              SettingsAction(
                label: 'Clear All Cache',
                subtitle: 'Remove all temporary files',
                icon: Icons.cleaning_services_outlined,
                iconColor: cs.error,
                trailing: _isClearing ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ) : null,
                onTap: _isClearing ? null : _clearAllCache,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Custom skeleton for storage settings
class _StorageSettingsSkeleton extends StatelessWidget {
  const _StorageSettingsSkeleton();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: const [
        StorageBarSkeleton(),
        SizedBox(height: AppSpacing.md),
        SettingsSkeleton(sectionCount: 1, itemsPerSection: 3),
      ],
    );
  }
}

/// Storage usage card with real data
class _StorageUsageCard extends StatelessWidget {
  final StorageBreakdown? breakdown;
  final bool isClearing;

  const _StorageUsageCard({
    required this.breakdown,
    required this.isClearing,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    if (breakdown == null) {
      return const StorageBarSkeleton();
    }

    final categories = breakdown!.categories;
    final total = breakdown!.totalBytes;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.storage, color: cs.primary, size: 20),
                const SizedBox(width: AppSpacing.sm),
                Text('Storage Usage', style: context.textStyles.titleSmall?.semiBold),
                const Spacer(),
                if (isClearing)
                  SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: cs.primary,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            
            // Storage bar
            if (categories.isNotEmpty) ...[
              _StorageBar(
                items: categories.map((c) => _StorageItem(
                  c.name,
                  c.sizeMB,
                  c.color,
                )).toList(),
              ),
              const SizedBox(height: AppSpacing.sm),
            ],
            
            Text(
              total > 0 
                  ? breakdown!.formattedTotal
                  : 'No cached data',
              style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
            ),
            
            if (total == 0)
              Padding(
                padding: const EdgeInsets.only(top: AppSpacing.sm),
                child: Row(
                  children: [
                    Icon(Icons.check_circle, size: 16, color: cs.primary),
                    const SizedBox(width: AppSpacing.xs),
                    Text(
                      'Your cache is clear',
                      style: context.textStyles.bodySmall?.withColor(cs.primary),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _StorageItem {
  final String label;
  final double sizeMB;
  final Color color;

  _StorageItem(this.label, this.sizeMB, this.color);
}

class _StorageBar extends StatelessWidget {
  final List<_StorageItem> items;

  const _StorageBar({required this.items});

  @override
  Widget build(BuildContext context) {
    final total = items.fold(0.0, (sum, item) => sum + item.sizeMB);

    return Column(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: SizedBox(
            height: 8,
            child: Row(
              children: items.map((item) {
                return Expanded(
                  flex: (item.sizeMB / total * 100).round(),
                  child: Container(color: item.color),
                );
              }).toList(),
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        Wrap(
          spacing: AppSpacing.md,
          runSpacing: AppSpacing.xs,
          children: items.map((item) {
            return Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: item.color,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(width: 4),
                Text(
                  '${item.label} (${item.sizeMB.toStringAsFixed(1)} MB)',
                  style: context.textStyles.labelSmall,
                ),
              ],
            );
          }).toList(),
        ),
      ],
    );
  }
}
