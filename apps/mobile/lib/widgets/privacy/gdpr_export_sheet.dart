import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/services/gdpr_export_service.dart';
import 'package:thittam1hub/services/logging_service.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/styled_button.dart';

/// Bottom sheet for GDPR-compliant data export
/// 
/// Allows users to select which data categories to export and download
/// their personal data as a JSON file per GDPR Article 15.
class GdprExportSheet extends StatefulWidget {
  const GdprExportSheet({super.key});

  static Future<void> show(BuildContext context) {
    final isTablet = MediaQuery.of(context).size.width >= 600;
    final screenHeight = MediaQuery.of(context).size.height;
    
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      constraints: isTablet ? BoxConstraints(
        maxHeight: screenHeight * 0.5,
        maxWidth: 500,
      ) : null,
      builder: (_) => Center(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: isTablet ? 500 : double.infinity),
          child: const GdprExportSheet(),
        ),
      ),
    );
  }

  @override
  State<GdprExportSheet> createState() => _GdprExportSheetState();
}

class _GdprExportSheetState extends State<GdprExportSheet> {
  static final _log = LoggingService.instance;
  static const _tag = 'GdprExportSheet';

  final _exportService = GdprExportService.instance;
  GdprExportOptions _options = const GdprExportOptions();
  bool _isExporting = false;
  GdprExportResult? _exportResult;
  String? _errorMessage;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final bottomPadding = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.only(bottom: bottomPadding + 16),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Drag handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: cs.onSurfaceVariant.withOpacity(0.4),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: cs.primaryContainer,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(Icons.download_rounded, color: cs.onPrimaryContainer),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Export Your Data',
                        style: tt.titleLarge?.copyWith(fontWeight: FontWeight.w600),
                      ),
                      Text(
                        'GDPR Article 15 - Right of Access',
                        style: tt.bodySmall?.copyWith(color: cs.onSurfaceVariant),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Description
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: cs.surfaceContainerHighest.withOpacity(0.5),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline, size: 20, color: cs.primary),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Download a copy of all your personal data. The export will be in JSON format.',
                      style: tt.bodySmall?.copyWith(color: cs.onSurfaceVariant),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Category toggles
            if (_exportResult == null) ...[
              Text(
                'Select data to export',
                style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 12),
              
              _buildCategoryToggle(
                icon: Icons.person,
                title: 'Profile',
                subtitle: 'Name, bio, avatar, username history',
                value: _options.includeProfile,
                onChanged: (v) => setState(() => _options = _options.copyWith(includeProfile: v)),
              ),
              _buildCategoryToggle(
                icon: Icons.article,
                title: 'Posts & Comments',
                subtitle: 'Sparks, comments, reactions',
                value: _options.includePosts,
                onChanged: (v) => setState(() => _options = _options.copyWith(includePosts: v)),
              ),
              _buildCategoryToggle(
                icon: Icons.event,
                title: 'Activity & Events',
                subtitle: 'Saved events, attendance, sessions',
                value: _options.includeActivity,
                onChanged: (v) => setState(() => _options = _options.copyWith(includeActivity: v)),
              ),
              _buildCategoryToggle(
                icon: Icons.people,
                title: 'Connections',
                subtitle: 'Followers and following',
                value: _options.includeFollowers,
                onChanged: (v) => setState(() => _options = _options.copyWith(includeFollowers: v)),
              ),
              _buildCategoryToggle(
                icon: Icons.settings,
                title: 'Settings',
                subtitle: 'Preferences, privacy, notifications',
                value: _options.includeSettings,
                onChanged: (v) => setState(() => _options = _options.copyWith(includeSettings: v)),
              ),
              _buildCategoryToggle(
                icon: Icons.emoji_events,
                title: 'Badges & Achievements',
                subtitle: 'Earned badges, metrics',
                value: _options.includeBadges,
                onChanged: (v) => setState(() => _options = _options.copyWith(includeBadges: v)),
              ),
              _buildCategoryToggle(
                icon: Icons.confirmation_number,
                title: 'Registrations',
                subtitle: 'Event registrations, certificates',
                value: _options.includeRegistrations,
                onChanged: (v) => setState(() => _options = _options.copyWith(includeRegistrations: v)),
              ),
              _buildCategoryToggle(
                icon: Icons.message,
                title: 'Messages',
                subtitle: 'Chat messages (may be large)',
                value: _options.includeMessages,
                onChanged: (v) => setState(() => _options = _options.copyWith(includeMessages: v)),
                isOptional: true,
              ),
              
              const SizedBox(height: 8),
              
              // Select all / none
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () => setState(() => _options = GdprExportOptions(
                      includeProfile: true,
                      includePosts: true,
                      includeActivity: true,
                      includeFollowers: true,
                      includeMessages: true,
                      includeSettings: true,
                      includeBadges: true,
                      includeRegistrations: true,
                    )),
                    child: const Text('Select All'),
                  ),
                  TextButton(
                    onPressed: () => setState(() => _options = GdprExportOptions(
                      includeProfile: false,
                      includePosts: false,
                      includeActivity: false,
                      includeFollowers: false,
                      includeMessages: false,
                      includeSettings: false,
                      includeBadges: false,
                      includeRegistrations: false,
                    )),
                    child: const Text('Clear All'),
                  ),
                ],
              ),
            ],

            // Error message
            if (_errorMessage != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: cs.errorContainer,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(Icons.error_outline, color: cs.onErrorContainer, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: tt.bodySmall?.copyWith(color: cs.onErrorContainer),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            // Export result
            if (_exportResult != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: cs.primaryContainer.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: cs.primary.withOpacity(0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.check_circle, color: cs.primary),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Export Ready',
                            style: tt.titleMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                              color: cs.primary,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _buildResultRow('Size', _exportResult!.formattedSize),
                    _buildResultRow('Exported at', _formatDateTime(_exportResult!.exportedAt)),
                    _buildResultRow(
                      'Categories',
                      '${(_exportResult!.data['_metadata'] as Map?)?['dataCategories']?.length ?? 0} included',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              
              // Action buttons for export result
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _copyToClipboard,
                      icon: const Icon(Icons.copy, size: 18),
                      label: const Text('Copy'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: _shareExport,
                      icon: const Icon(Icons.share, size: 18),
                      label: const Text('Share'),
                    ),
                  ),
                ],
              ),
            ],

            const SizedBox(height: 20),

            // Export button
            if (_exportResult == null)
              StyledButton(
                onPressed: _options.hasSelection ? _startExport : null,
                isLoading: _isExporting,
                icon: Icons.file_download,
                label: _isExporting 
                    ? 'Exporting...' 
                    : 'Export ${_options.selectedCount} Categories',
              ),

            const SizedBox(height: 12),

            // Rate limit info
            Center(
              child: Text(
                'You can export data up to 3 times per hour',
                style: tt.bodySmall?.copyWith(color: cs.onSurfaceVariant),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryToggle({
    required IconData icon,
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
    bool isOptional = false,
  }) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: value ? cs.primaryContainer.withOpacity(0.3) : cs.surfaceContainerHighest.withOpacity(0.3),
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: () => onChanged(!value),
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: [
                Icon(icon, size: 20, color: value ? cs.primary : cs.onSurfaceVariant),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            title,
                            style: tt.bodyMedium?.copyWith(fontWeight: FontWeight.w500),
                          ),
                          if (isOptional) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: cs.tertiaryContainer,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                'Optional',
                                style: tt.labelSmall?.copyWith(
                                  color: cs.onTertiaryContainer,
                                  fontSize: 10,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      Text(
                        subtitle,
                        style: tt.bodySmall?.copyWith(color: cs.onSurfaceVariant),
                      ),
                    ],
                  ),
                ),
                Checkbox(
                  value: value,
                  onChanged: (v) => onChanged(v ?? false),
                  visualDensity: VisualDensity.compact,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildResultRow(String label, String value) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: tt.bodySmall?.copyWith(color: cs.onSurfaceVariant)),
          Text(value, style: tt.bodySmall?.copyWith(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  String _formatDateTime(DateTime dt) {
    return '${dt.day}/${dt.month}/${dt.year} ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
  }

  Future<void> _startExport() async {
    setState(() {
      _isExporting = true;
      _errorMessage = null;
    });

    HapticFeedback.lightImpact();

    final result = await _exportService.exportData(options: _options);

    if (!mounted) return;

    if (result.isSuccess) {
      setState(() {
        _isExporting = false;
        _exportResult = result.data;
      });
      HapticFeedback.mediumImpact();
    } else {
      setState(() {
        _isExporting = false;
        _errorMessage = result.error;
      });
      HapticFeedback.heavyImpact();
    }
  }

  Future<void> _copyToClipboard() async {
    if (_exportResult == null) return;

    final jsonString = _exportService.getExportAsString(_exportResult!);
    await Clipboard.setData(ClipboardData(text: jsonString));

    HapticFeedback.lightImpact();

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Data copied to clipboard'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _shareExport() async {
    if (_exportResult == null) return;

    final result = await _exportService.saveAndShareExport(_exportResult!);

    if (!mounted) return;

    if (result.isFailure) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result.error ?? 'Failed to share'),
          backgroundColor: Theme.of(context).colorScheme.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }
}
