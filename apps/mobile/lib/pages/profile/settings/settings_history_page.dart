import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:thittam1hub/services/settings_audit_service.dart';
import 'package:thittam1hub/services/settings_revert_router.dart';
import 'package:thittam1hub/widgets/settings/settings_page_scaffold.dart';
import 'package:thittam1hub/widgets/common/settings_feedback.dart';
import 'package:thittam1hub/theme.dart';

/// Settings Change History Page
///
/// Displays a timeline of all settings changes with undo capability.
class SettingsHistoryPage extends StatefulWidget {
  const SettingsHistoryPage({super.key});

  @override
  State<SettingsHistoryPage> createState() => _SettingsHistoryPageState();
}

class _SettingsHistoryPageState extends State<SettingsHistoryPage> {
  bool _isLoading = true;
  String? _errorMessage;
  List<SettingsAuditEntry> _entries = [];
  String? _filterType;
  
  final _auditService = SettingsAuditService.instance;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final result = await _auditService.getRecentChanges(
      limit: 100,
      settingType: _filterType,
    );

    if (mounted) {
      result.when(
        success: (entries) {
          setState(() {
            _entries = entries;
            _isLoading = false;
          });
        },
        failure: (error) {
          setState(() {
            _errorMessage = error.toString();
            _isLoading = false;
          });
        },
      );
    }
  }

  Future<void> _clearHistory() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear History?'),
        content: const Text(
          'This will permanently delete all settings change history. This action cannot be undone.',
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
            child: const Text('Clear'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      HapticFeedback.mediumImpact();
      final result = await _auditService.clearHistory();
      
      if (mounted) {
        result.when(
          success: (_) {
            setState(() => _entries = []);
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('History cleared')),
            );
          },
          failure: (error) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Failed to clear: $error')),
            );
          },
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return SettingsPageScaffold(
      title: 'Settings History',
      isLoading: _isLoading,
      errorMessage: _errorMessage,
      onRetry: _loadHistory,
      onRefresh: _loadHistory,
      actions: [
        if (_entries.isNotEmpty)
          IconButton(
            icon: const Icon(Icons.delete_sweep),
            tooltip: 'Clear History',
            onPressed: _clearHistory,
          ),
      ],
      body: Column(
        children: [
          // Filter chips
          _buildFilterChips(),
          
          // Timeline
          Expanded(
            child: _entries.isEmpty
                ? _buildEmptyState()
                : _buildTimeline(),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChips() {
    final cs = Theme.of(context).colorScheme;
    final filters = [
      (null, 'All'),
      ('notification', 'Notifications'),
      ('privacy', 'Privacy'),
      ('accessibility', 'Accessibility'),
      ('security', 'Security'),
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: EdgeInsets.symmetric(
        horizontal: context.horizontalPadding,
        vertical: AppSpacing.sm,
      ),
      child: Row(
        children: filters.map((filter) {
          final isSelected = _filterType == filter.$1;
          return Padding(
            padding: const EdgeInsets.only(right: AppSpacing.xs),
            child: FilterChip(
              label: Text(filter.$2),
              selected: isSelected,
              onSelected: (_) {
                HapticFeedback.selectionClick();
                setState(() => _filterType = filter.$1);
                _loadHistory();
              },
              selectedColor: cs.primaryContainer,
              checkmarkColor: cs.onPrimaryContainer,
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildEmptyState() {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.history,
              size: 64,
              color: cs.onSurfaceVariant.withOpacity(0.5),
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              'No History Yet',
              style: tt.titleMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              _filterType != null
                  ? 'No changes found for this category.'
                  : 'Your settings changes will appear here.',
              style: tt.bodyMedium?.copyWith(color: cs.onSurfaceVariant),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimeline() {
    return ListView.builder(
      padding: EdgeInsets.symmetric(
        horizontal: context.horizontalPadding,
        vertical: AppSpacing.sm,
      ),
      itemCount: _entries.length,
      itemBuilder: (context, index) {
        final entry = _entries[index];
        final isFirst = index == 0;
        final isLast = index == _entries.length - 1;
        
        return _TimelineEntry(
          entry: entry,
          isFirst: isFirst,
          isLast: isLast,
          onRevert: () => _revertChange(entry),
        );
      },
    );
  }

  Future<void> _revertChange(SettingsAuditEntry entry) async {
    // Check if this setting type supports auto-revert
    final canAutoRevert = SettingsRevertRouter.canAutoRevert(entry.settingType);
    final limitation = SettingsRevertRouter.getRevertLimitation(entry.settingType);
    
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Revert Change?'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('This will undo: ${entry.description}'),
            const SizedBox(height: 8),
            Text(
              'The setting will be restored to its previous value.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            if (limitation.isNotEmpty) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(
                      canAutoRevert ? Icons.info_outline : Icons.warning_amber,
                      size: 16,
                      color: canAutoRevert 
                          ? Theme.of(context).colorScheme.primary
                          : Theme.of(context).colorScheme.error,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        limitation,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Revert'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      HapticFeedback.mediumImpact();
      
      // Apply the revert via router (for supported types)
      if (canAutoRevert) {
        final routerResult = await SettingsRevertRouter.applyRevert(entry);
        if (!routerResult.isSuccess && mounted) {
          SettingsFeedback.showWarning(
            context, 
            'Some changes may require app restart',
          );
        }
      }
      
      // Log the revert in audit trail
      final result = await _auditService.revertChange(entry.id);
      
      if (mounted) {
        result.when(
          success: (_) {
            SettingsFeedback.showSuccess(context, 'Setting reverted');
            _loadHistory();
          },
          failure: (error) {
            SettingsFeedback.showError(context, 'Failed to revert: $error');
          },
        );
      }
    }
  }
}

class _TimelineEntry extends StatelessWidget {
  final SettingsAuditEntry entry;
  final bool isFirst;
  final bool isLast;
  final VoidCallback onRevert;

  const _TimelineEntry({
    required this.entry,
    required this.isFirst,
    required this.isLast,
    required this.onRevert,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Timeline line & dot
          SizedBox(
            width: 32,
            child: Column(
              children: [
                // Top line
                if (!isFirst)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: cs.outlineVariant,
                    ),
                  )
                else
                  const Spacer(),
                
                // Dot
                Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: _getCategoryColor(cs),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: cs.surface,
                      width: 2,
                    ),
                  ),
                ),
                
                // Bottom line
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: cs.outlineVariant,
                    ),
                  )
                else
                  const Spacer(),
              ],
            ),
          ),
          
          const SizedBox(width: AppSpacing.sm),
          
          // Content card
          Expanded(
            child: Card(
              margin: const EdgeInsets.only(bottom: AppSpacing.sm),
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Category & time
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.xs,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: _getCategoryColor(cs).withOpacity(0.15),
                            borderRadius: BorderRadius.circular(AppRadius.xs),
                          ),
                          child: Text(
                            entry.categoryLabel,
                            style: tt.labelSmall?.copyWith(
                              color: _getCategoryColor(cs),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                        const Spacer(),
                        Text(
                          _formatTime(entry.createdAt),
                          style: tt.labelSmall?.copyWith(
                            color: cs.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    
                    // Description
                    Text(
                      entry.description,
                      style: tt.bodyMedium,
                    ),
                    
                    // Revert button
                    const SizedBox(height: AppSpacing.sm),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton.icon(
                        onPressed: onRevert,
                        icon: const Icon(Icons.undo, size: 16),
                        label: const Text('Revert'),
                        style: TextButton.styleFrom(
                          visualDensity: VisualDensity.compact,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getCategoryColor(ColorScheme cs) {
    switch (entry.settingType) {
      case 'notification':
        return cs.tertiary;
      case 'privacy':
        return cs.error;
      case 'accessibility':
        return cs.secondary;
      case 'security':
        return cs.error;
      default:
        return cs.primary;
    }
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final diff = now.difference(dateTime);

    if (diff.inMinutes < 1) {
      return 'Just now';
    } else if (diff.inMinutes < 60) {
      return '${diff.inMinutes}m ago';
    } else if (diff.inHours < 24) {
      return '${diff.inHours}h ago';
    } else if (diff.inDays < 7) {
      return '${diff.inDays}d ago';
    }
    return DateFormat('MMM d').format(dateTime);
  }
}
