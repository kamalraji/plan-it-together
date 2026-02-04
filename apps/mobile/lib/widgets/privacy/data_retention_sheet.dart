import 'package:flutter/material.dart';
import '../../models/privacy_consent_models.dart';
import '../../services/privacy_service.dart';
import '../../theme.dart';

/// Bottom sheet for managing data retention settings
class DataRetentionSheet extends StatefulWidget {
  final DataRetentionSettings? currentSettings;
  final VoidCallback? onSaved;

  const DataRetentionSheet({
    super.key,
    this.currentSettings,
    this.onSaved,
  });

  @override
  State<DataRetentionSheet> createState() => _DataRetentionSheetState();
}

class _DataRetentionSheetState extends State<DataRetentionSheet> {
  final _privacyService = PrivacyService.instance;

  late RetentionPeriod _messageRetention;
  late RetentionPeriod _activityRetention;
  late RetentionPeriod _searchHistoryRetention;
  late bool _autoDeleteEnabled;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final settings = widget.currentSettings;
    _messageRetention = settings?.messageRetention ?? RetentionPeriod.forever;
    _activityRetention = settings?.activityRetention ?? RetentionPeriod.oneYear;
    _searchHistoryRetention = settings?.searchHistoryRetention ?? RetentionPeriod.thirtyDays;
    _autoDeleteEnabled = settings?.autoDeleteEnabled ?? false;
  }

  Future<void> _save() async {
    setState(() => _isSaving = true);

    try {
      final settings = DataRetentionSettings(
        id: widget.currentSettings?.id ?? '',
        userId: widget.currentSettings?.userId ?? '',
        messageRetention: _messageRetention,
        activityRetention: _activityRetention,
        searchHistoryRetention: _searchHistoryRetention,
        autoDeleteEnabled: _autoDeleteEnabled,
      );

      await _privacyService.saveRetentionSettings(settings);

      if (mounted) {
        widget.onSaved?.call();
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Data retention settings saved')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _clearAllData() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear All Activity'),
        content: const Text(
          'This will permanently delete all your activity history, including search history and activity logs. This cannot be undone.',
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
            child: const Text('Delete All'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Activity data cleared')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.8,
      ),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: cs.outline.withOpacity(0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: cs.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.auto_delete,
                    color: cs.primary,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Data Retention',
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Control how long we keep your data',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: cs.onSurface.withOpacity(0.6),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const Divider(),

          // Settings
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 8),

                  // Auto-delete toggle
                  _ToggleTile(
                    icon: Icons.auto_delete,
                    iconColor: cs.primary,
                    title: 'Auto-Delete Data',
                    subtitle: 'Automatically delete data after retention period',
                    value: _autoDeleteEnabled,
                    onChanged: (v) => setState(() => _autoDeleteEnabled = v),
                  ),

                  const SizedBox(height: 24),

                  // Message Retention
                  _RetentionSelector(
                    icon: Icons.chat_bubble_outline,
                    iconColor: Colors.blue,
                    title: 'Message Retention',
                    description: 'How long to keep your messages',
                    value: _messageRetention,
                    onChanged: (v) => setState(() => _messageRetention = v),
                  ),

                  const SizedBox(height: 16),

                  // Activity Retention
                  _RetentionSelector(
                    icon: Icons.history,
                    iconColor: Colors.orange,
                    title: 'Activity History',
                    description: 'How long to keep your activity log',
                    value: _activityRetention,
                    onChanged: (v) => setState(() => _activityRetention = v),
                  ),

                  const SizedBox(height: 16),

                  // Search History Retention
                  _RetentionSelector(
                    icon: Icons.search,
                    iconColor: Colors.purple,
                    title: 'Search History',
                    description: 'How long to keep your search history',
                    value: _searchHistoryRetention,
                    onChanged: (v) => setState(() => _searchHistoryRetention = v),
                  ),

                  const SizedBox(height: 24),

                  // Clear All Data
                  InkWell(
                    onTap: _clearAllData,
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: cs.error.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: cs.error.withOpacity(0.2),
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.delete_forever, color: cs.error),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Clear All Activity Data',
                                  style: theme.textTheme.titleSmall?.copyWith(
                                    color: cs.error,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                Text(
                                  'Permanently delete all activity and search history',
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: cs.error.withOpacity(0.7),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Icon(Icons.chevron_right, color: cs.error),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),

          const Divider(),

          // Save Button
          Padding(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _isSaving ? null : _save,
                child: _isSaving
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Save Changes'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ToggleTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _ToggleTile({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  subtitle,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: cs.onSurface.withOpacity(0.6),
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }
}

class _RetentionSelector extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String description;
  final RetentionPeriod value;
  final ValueChanged<RetentionPeriod> onChanged;

  const _RetentionSelector({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.description,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: iconColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: iconColor, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      description,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: cs.onSurface.withOpacity(0.6),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: RetentionPeriod.values.map((period) {
              final isSelected = period == value;
              return ChoiceChip(
                label: Text(period.label),
                selected: isSelected,
                onSelected: (selected) {
                  if (selected) onChanged(period);
                },
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}
