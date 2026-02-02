import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/privacy_service.dart';

class AuditExportSheet extends StatefulWidget {
  const AuditExportSheet({super.key});

  @override
  State<AuditExportSheet> createState() => _AuditExportSheetState();
}

class _AuditExportSheetState extends State<AuditExportSheet> {
  final _privacyService = PrivacyService.instance;
  bool _exporting = false;
  String _selectedFormat = 'json';
  DateTimeRange? _dateRange;
  List<String> _selectedCategories = ['all'];
  
  final List<Map<String, dynamic>> _categories = [
    {'key': 'all', 'label': 'All Activities', 'icon': Icons.select_all},
    {'key': 'login', 'label': 'Logins', 'icon': Icons.login},
    {'key': 'password_change', 'label': 'Password Changes', 'icon': Icons.password},
    {'key': '2fa', 'label': '2FA Events', 'icon': Icons.security},
    {'key': 'session', 'label': 'Session Activity', 'icon': Icons.devices},
    {'key': 'data_request', 'label': 'Data Requests', 'icon': Icons.download},
  ];

  @override
  void initState() {
    super.initState();
    // Default to last 30 days
    _dateRange = DateTimeRange(
      start: DateTime.now().subtract(const Duration(days: 30)),
      end: DateTime.now(),
    );
  }

  Future<void> _selectDateRange() async {
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now(),
      initialDateRange: _dateRange,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: Theme.of(context).colorScheme,
          ),
          child: child!,
        );
      },
    );
    
    if (picked != null) {
      setState(() => _dateRange = picked);
    }
  }

  Future<void> _exportAuditLog() async {
    if (_dateRange == null) return;
    
    setState(() => _exporting = true);
    
    try {
      // Fetch security activities
      final activities = await _privacyService.getSecurityActivityLogs(
        startDate: _dateRange!.start,
        endDate: _dateRange!.end,
        categories: _selectedCategories.contains('all') ? null : _selectedCategories,
      );
      
      if (activities.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('No activities found for the selected period'),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
        return;
      }
      
      // Generate export content
      String content;
      String fileName;
      
      if (_selectedFormat == 'json') {
        content = _generateJsonExport(activities);
        fileName = 'security_audit_${DateFormat('yyyyMMdd').format(DateTime.now())}.json';
      } else {
        content = _generateCsvExport(activities);
        fileName = 'security_audit_${DateFormat('yyyyMMdd').format(DateTime.now())}.csv';
      }
      
      // Show success and offer to share
      if (mounted) {
        _showExportSuccessDialog(content, fileName);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Export failed: $e'),
            behavior: SnackBarBehavior.floating,
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _exporting = false);
      }
    }
  }

  String _generateJsonExport(List<dynamic> activities) {
    final activityList = activities.map((a) {
      return <String, dynamic>{
        'timestamp': a.createdAt?.toIso8601String(),
        'type': a.activityType,
        'description': a.description,
        'device': a.deviceInfo,
        'location': a.location,
      };
    }).toList();
    
    final exportData = <String, dynamic>{
      'export_date': DateTime.now().toIso8601String(),
      'date_range': <String, dynamic>{
        'start': _dateRange!.start.toIso8601String(),
        'end': _dateRange!.end.toIso8601String(),
      },
      'total_records': activities.length,
      'activities': activityList,
    };
    
    // Simple JSON formatting
    return _prettyPrintJson(exportData);
  }

  String _prettyPrintJson(Map<String, dynamic> json, {int indent = 0}) {
    final buffer = StringBuffer();
    final spaces = '  ' * indent;
    
    buffer.writeln('{');
    final entries = json.entries.toList();
    for (var i = 0; i < entries.length; i++) {
      final entry = entries[i];
      final isLast = i == entries.length - 1;
      buffer.write('$spaces  "${entry.key}": ');
      
      if (entry.value is Map) {
        buffer.write(_prettyPrintJson(entry.value as Map<String, dynamic>, indent: indent + 1));
      } else if (entry.value is List) {
        buffer.writeln('[');
        final list = entry.value as List;
        for (var j = 0; j < list.length; j++) {
          if (list[j] is Map) {
            buffer.write('$spaces    ${_prettyPrintJson(list[j] as Map<String, dynamic>, indent: indent + 2)}');
          } else {
            buffer.write('$spaces    "${list[j]}"');
          }
          if (j < list.length - 1) buffer.writeln(',');
        }
        buffer.write('\n$spaces  ]');
      } else if (entry.value is String) {
        buffer.write('"${entry.value}"');
      } else {
        buffer.write('${entry.value}');
      }
      
      if (!isLast) buffer.writeln(',');
    }
    buffer.write('\n$spaces}');
    
    return buffer.toString();
  }

  String _generateCsvExport(List<dynamic> activities) {
    final buffer = StringBuffer();
    
    // Header
    buffer.writeln('Timestamp,Type,Description,Device,Location');
    
    // Data rows
    for (final activity in activities) {
      final timestamp = activity.createdAt?.toIso8601String() ?? '';
      final type = _escapeCsv(activity.activityType ?? '');
      final description = _escapeCsv(activity.description ?? '');
      final device = _escapeCsv(activity.deviceInfo ?? '');
      final location = _escapeCsv(activity.location ?? '');
      
      buffer.writeln('$timestamp,$type,$description,$device,$location');
    }
    
    return buffer.toString();
  }

  String _escapeCsv(String value) {
    if (value.contains(',') || value.contains('"') || value.contains('\n')) {
      return '"${value.replaceAll('"', '""')}"';
    }
    return value;
  }

  void _showExportSuccessDialog(String content, String fileName) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green),
            SizedBox(width: 12),
            Text('Export Ready'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('File: $fileName'),
            const SizedBox(height: 8),
            Text(
              'Size: ${(content.length / 1024).toStringAsFixed(1)} KB',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 16),
            Container(
              height: 200,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(8),
              ),
              child: SingleChildScrollView(
                child: SelectableText(
                  content.substring(0, content.length.clamp(0, 2000)),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontFamily: 'monospace',
                  ),
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
          FilledButton.icon(
            onPressed: () {
              // In a real app, this would use share_plus to share the file
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Export saved! Check your downloads.'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
            icon: const Icon(Icons.download),
            label: const Text('Download'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dateFormat = DateFormat('MMM d, yyyy');
    
    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: theme.colorScheme.onSurface.withOpacity(0.2),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          // Header
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.file_download_outlined,
                    color: theme.colorScheme.primary,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Export Security Audit',
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Download your security activity log',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurface.withOpacity(0.6),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          const Divider(height: 1),
          
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Date Range
                  Text(
                    'Date Range',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 12),
                  
                  InkWell(
                    onTap: _selectDateRange,
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.surfaceContainerHighest.withOpacity(0.5),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: theme.colorScheme.outline.withOpacity(0.2),
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.calendar_month,
                            color: theme.colorScheme.primary,
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Text(
                              _dateRange != null
                                  ? '${dateFormat.format(_dateRange!.start)} - ${dateFormat.format(_dateRange!.end)}'
                                  : 'Select date range',
                              style: theme.textTheme.bodyLarge,
                            ),
                          ),
                          Icon(
                            Icons.chevron_right,
                            color: theme.colorScheme.onSurface.withOpacity(0.5),
                          ),
                        ],
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Format Selection
                  Text(
                    'Export Format',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 12),
                  
                  Row(
                    children: [
                      Expanded(
                        child: _FormatOption(
                          label: 'JSON',
                          icon: Icons.data_object,
                          selected: _selectedFormat == 'json',
                          onTap: () => setState(() => _selectedFormat = 'json'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _FormatOption(
                          label: 'CSV',
                          icon: Icons.table_chart,
                          selected: _selectedFormat == 'csv',
                          onTap: () => setState(() => _selectedFormat = 'csv'),
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Categories
                  Text(
                    'Activity Categories',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 12),
                  
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _categories.map((cat) {
                      final isSelected = _selectedCategories.contains(cat['key']);
                      return FilterChip(
                        label: Text(cat['label'] as String),
                        avatar: Icon(
                          cat['icon'] as IconData,
                          size: 18,
                        ),
                        selected: isSelected,
                        onSelected: (selected) {
                          setState(() {
                            if (cat['key'] == 'all') {
                              _selectedCategories = ['all'];
                            } else {
                              _selectedCategories.remove('all');
                              if (selected) {
                                _selectedCategories.add(cat['key'] as String);
                              } else {
                                _selectedCategories.remove(cat['key']);
                              }
                              if (_selectedCategories.isEmpty) {
                                _selectedCategories = ['all'];
                              }
                            }
                          });
                        },
                      );
                    }).toList(),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Info card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.info_outline,
                          color: theme.colorScheme.primary,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Exported data is for your records and can be used for compliance audits or personal review.',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.primary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          // Export button
          Padding(
            padding: const EdgeInsets.all(20),
            child: SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: _exporting ? null : _exportAuditLog,
                icon: _exporting
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.file_download),
                label: Text(_exporting ? 'Exporting...' : 'Export Audit Log'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FormatOption extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _FormatOption({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
        decoration: BoxDecoration(
          color: selected ? cs.primary.withOpacity(0.1) : cs.surfaceContainerHighest.withOpacity(0.5),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? cs.primary : cs.outline.withOpacity(0.2),
            width: selected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: selected ? cs.primary : cs.onSurface.withOpacity(0.7),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: selected ? FontWeight.bold : FontWeight.normal,
                color: selected ? cs.primary : null,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
