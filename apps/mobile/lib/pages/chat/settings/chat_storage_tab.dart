import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/settings_components.dart';
import 'package:thittam1hub/widgets/settings/settings_tab_scaffold.dart';
import 'package:thittam1hub/services/storage_service.dart';
import 'package:thittam1hub/services/chat_media_download_service.dart';
import 'package:thittam1hub/pages/chat/chat_media_gallery_page.dart';

import 'package:thittam1hub/services/logging_service.dart';
/// Media & Storage tab for Chat Settings
class ChatStorageTab extends StatefulWidget {
  // Logging
   static final _log = LoggingService.instance;
   static const String _tag = 'ChatStorageTab';

  final String? channelId;
  final String? channelName;

  const ChatStorageTab({
    super.key,
    this.channelId,
    this.channelName,
  });

  @override
  State<ChatStorageTab> createState() => _ChatStorageTabState();
}

class _ChatStorageTabState extends State<ChatStorageTab> {
  static const String _tag = 'ChatStorageTab';
  static final _log = LoggingService.instance;
  
  bool _isLoading = true;
  String? _error;
  StorageBreakdown? _storageBreakdown;

  // Action states
  bool _clearingCache = false;
  bool _downloadingMedia = false;

  @override
  void initState() {
    super.initState();
    _loadStorageStats();
  }

  Future<void> _loadStorageStats() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final breakdown = await StorageService.instance.calculateStorage();
      if (mounted) {
        setState(() {
          _storageBreakdown = breakdown;
          _isLoading = false;
        });
      }
    } catch (e) {
      _log.error('Failed to load storage stats: $e', tag: _tag);
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = 'Failed to calculate storage';
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

  Future<void> _clearMediaCache() async {
    if (_clearingCache) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear Media Cache'),
        content: const Text(
          'This will remove cached images and files. They will be re-downloaded when needed.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Clear'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _clearingCache = true);
    HapticFeedback.mediumImpact();

    try {
      await StorageService.instance.clearImageCache();
      _showSuccessSnackBar('Media cache cleared');
      _loadStorageStats();
    } catch (e) {
      _log.error('Failed to clear cache: $e', tag: _tag);
      _showErrorSnackBar('Failed to clear cache', _clearMediaCache);
    } finally {
      if (mounted) setState(() => _clearingCache = false);
    }
  }

  Future<void> _downloadAllMedia() async {
    if (_downloadingMedia || widget.channelId == null) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Download All Media'),
        content: const Text(
          'This will download all shared photos, videos, and files from this chat to your device. This may take a while depending on the amount of media.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Download'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _downloadingMedia = true);
    HapticFeedback.mediumImpact();

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Downloading media...'),
        duration: Duration(seconds: 2),
      ),
    );

    try {
      await ChatMediaDownloadService.instance.downloadAllMedia(channelId: widget.channelId!);
      if (mounted) {
        _showSuccessSnackBar('All media downloaded');
        _loadStorageStats();
      }
    } catch (e) {
      _log.error('Failed to download media: $e', tag: _tag);
      if (mounted) {
        _showErrorSnackBar('Failed to download media', _downloadAllMedia);
      }
    } finally {
      if (mounted) setState(() => _downloadingMedia = false);
    }
  }

  void _showMediaGallery() {
    if (widget.channelId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No channel selected')),
      );
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ChatMediaGalleryPage(
          channelId: widget.channelId!,
          channelName: widget.channelName,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SettingsTabScaffold(
      isLoading: _isLoading,
      error: _error,
      onRetry: _loadStorageStats,
      onRefresh: _loadStorageStats,
      skeletonSections: 1,
      children: [
        SettingsSection(
          title: 'Media & Storage',
          icon: Icons.photo_library_outlined,
          iconColor: AppColors.indigo500,
          children: [
            if (_storageBreakdown != null)
              _StorageVisualization(breakdown: _storageBreakdown!)
            else
              Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: const Text('Unable to calculate storage'),
              ),
            const SettingsDivider(),
            SettingsAction(
              label: _clearingCache ? 'Clearing...' : 'Clear Media Cache',
              subtitle: 'Remove cached images and files',
              icon: Icons.delete_outline,
              onTap: _clearingCache ? null : _clearMediaCache,
            ),
            if (widget.channelId != null) ...[
              const SettingsDivider(),
              SettingsAction(
                label: _downloadingMedia ? 'Downloading...' : 'Download All Media',
                subtitle: 'Save all shared media to device',
                icon: Icons.download,
                onTap: _downloadingMedia ? null : _downloadAllMedia,
              ),
              const SettingsDivider(),
              SettingsAction(
                label: 'View Media Gallery',
                subtitle: 'Browse all shared photos and videos',
                icon: Icons.collections,
                onTap: _showMediaGallery,
              ),
            ],
            const SettingsDivider(),
            SettingsAction(
              label: 'Refresh Storage Stats',
              subtitle: 'Recalculate storage usage',
              icon: Icons.refresh,
              onTap: () {
                setState(() => _isLoading = true);
                _loadStorageStats();
              },
            ),
          ],
        ),
      ],
    );
  }
}

/// Storage visualization widget
class _StorageVisualization extends StatelessWidget {
  final StorageBreakdown breakdown;

  const _StorageVisualization({required this.breakdown});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    // Build items from categories in StorageBreakdown
    final items = breakdown.categories.map((cat) => 
      _StorageItem(cat.name, cat.bytes, cat.color)
    ).toList();

    final total = breakdown.totalBytes;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Total storage
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Total Storage Used',
                style: context.textStyles.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                _formatBytes(total),
                style: context.textStyles.titleSmall?.copyWith(
                  color: cs.primary,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),

          // Storage bar
          ClipRRect(
            borderRadius: BorderRadius.circular(AppRadius.sm),
            child: SizedBox(
              height: 12,
              child: Row(
                children: items.where((i) => i.size > 0).map((item) {
                  final percentage = total > 0 ? item.size / total : 0.0;
                  return Expanded(
                    flex: (percentage * 100).round().clamp(1, 100),
                    child: Container(color: item.color),
                  );
                }).toList(),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.md),

          // Legend
          Wrap(
            spacing: AppSpacing.md,
            runSpacing: AppSpacing.sm,
            children: items.where((i) => i.size > 0).map((item) {
              return Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      color: item.color,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '${item.label}: ${_formatBytes(item.size)}',
                    style: context.textStyles.bodySmall?.copyWith(
                      color: cs.onSurfaceVariant,
                    ),
                  ),
                ],
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  String _formatBytes(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    if (bytes < 1024 * 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(2)} GB';
  }
}

class _StorageItem {
  final String label;
  final int size;
  final Color color;

  const _StorageItem(this.label, this.size, this.color);
}
