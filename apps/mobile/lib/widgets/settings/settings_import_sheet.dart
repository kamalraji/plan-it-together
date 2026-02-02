import 'dart:convert';
import 'dart:ui' show Locale;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:file_picker/file_picker.dart';
import 'package:thittam1hub/services/logging_service.dart';
import 'package:thittam1hub/services/profile_service.dart';
import 'package:thittam1hub/services/accessibility_service.dart';
import 'package:thittam1hub/services/locale_service.dart' as locale_svc;
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/styled_button.dart';

/// Bottom sheet for importing user settings from JSON
/// 
/// Validates JSON structure before import and allows selective restore.
class SettingsImportSheet extends StatefulWidget {
  const SettingsImportSheet({super.key});
  
  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const SettingsImportSheet(),
    );
  }

  @override
  State<SettingsImportSheet> createState() => _SettingsImportSheetState();
}

class _SettingsImportSheetState extends State<SettingsImportSheet> {
  static final _log = LoggingService.instance;
  static const _tag = 'SettingsImportSheet';
  
  Map<String, dynamic>? _importData;
  String? _parseError;
  bool _isImporting = false;
  bool _isParsing = false;
  
  // Selective import toggles
  bool _importNotifications = true;
  bool _importPrivacy = true;
  bool _importAccessibility = true;
  bool _importLocale = true;
  bool _importAppearance = true;
  
  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.symmetric(
            horizontal: context.horizontalPadding,
            vertical: AppSpacing.lg,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Handle bar
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: cs.onSurfaceVariant.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              
              // Title
              Row(
                children: [
                  Icon(Icons.file_upload_outlined, color: cs.primary),
                  const SizedBox(width: AppSpacing.sm),
                  Text(
                    'Import Settings',
                    style: tt.titleLarge?.copyWith(fontWeight: FontWeight.w600),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Restore your preferences from a previously exported JSON file.',
                style: tt.bodyMedium?.copyWith(color: cs.onSurfaceVariant),
              ),
              const SizedBox(height: AppSpacing.lg),
              
              // File selection or parsed content
              if (_importData == null) ...[
                _buildFileSelector(),
              ] else ...[
                _buildParsedContent(),
              ],
              
              // Error display
              if (_parseError != null) ...[
                const SizedBox(height: AppSpacing.md),
                Container(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  decoration: BoxDecoration(
                    color: cs.errorContainer.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(AppRadius.md),
                    border: Border.all(color: cs.error.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.error_outline, color: cs.error, size: 20),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: Text(
                          _parseError!,
                          style: tt.bodySmall?.copyWith(color: cs.error),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildFileSelector() {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    
    return Column(
      children: [
        // Pick file button
        InkWell(
          onTap: _isParsing ? null : _pickFile,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          child: Container(
            padding: const EdgeInsets.all(AppSpacing.xl),
            decoration: BoxDecoration(
              border: Border.all(
                color: cs.outlineVariant,
                width: 2,
                strokeAlign: BorderSide.strokeAlignInside,
              ),
              borderRadius: BorderRadius.circular(AppRadius.lg),
            ),
            child: Column(
              children: [
                if (_isParsing)
                  const SizedBox(
                    width: 48,
                    height: 48,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                else
                  Icon(
                    Icons.upload_file,
                    size: 48,
                    color: cs.primary,
                  ),
                const SizedBox(height: AppSpacing.md),
                Text(
                  _isParsing ? 'Parsing file...' : 'Select JSON File',
                  style: tt.titleMedium?.copyWith(fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  'Tap to browse for your settings file',
                  style: tt.bodySmall?.copyWith(color: cs.onSurfaceVariant),
                ),
              ],
            ),
          ),
        ),
        
        const SizedBox(height: AppSpacing.lg),
        
        // Or paste from clipboard
        Row(
          children: [
            const Expanded(child: Divider()),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
              child: Text('or', style: tt.bodySmall?.copyWith(color: cs.onSurfaceVariant)),
            ),
            const Expanded(child: Divider()),
          ],
        ),
        
        const SizedBox(height: AppSpacing.lg),
        
        OutlinedButton.icon(
          onPressed: _isParsing ? null : _pasteFromClipboard,
          icon: const Icon(Icons.paste, size: 18),
          label: const Text('Paste from Clipboard'),
        ),
      ],
    );
  }
  
  Widget _buildParsedContent() {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final settings = _importData?['settings'] as Map<String, dynamic>? ?? {};
    final exportedAt = _importData?['exported_at'] as String?;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Success indicator
        Container(
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: cs.primaryContainer.withOpacity(0.3),
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          child: Row(
            children: [
              Icon(Icons.check_circle, color: cs.primary, size: 20),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Valid settings file',
                      style: tt.bodyMedium?.copyWith(fontWeight: FontWeight.w500),
                    ),
                    if (exportedAt != null)
                      Text(
                        'Exported: ${_formatDate(exportedAt)}',
                        style: tt.bodySmall?.copyWith(color: cs.onSurfaceVariant),
                      ),
                  ],
                ),
              ),
              TextButton(
                onPressed: () => setState(() {
                  _importData = null;
                  _parseError = null;
                }),
                child: const Text('Change'),
              ),
            ],
          ),
        ),
        
        const SizedBox(height: AppSpacing.lg),
        Text('Select settings to import:', style: tt.titleSmall),
        const SizedBox(height: AppSpacing.sm),
        
        // Category toggles based on available data
        if (settings.containsKey('notifications'))
          _buildImportToggle(
            icon: Icons.notifications_outlined,
            label: 'Notification Preferences',
            value: _importNotifications,
            onChanged: (v) => setState(() => _importNotifications = v),
          ),
        if (settings.containsKey('privacy'))
          _buildImportToggle(
            icon: Icons.lock_outline,
            label: 'Privacy Settings',
            value: _importPrivacy,
            onChanged: (v) => setState(() => _importPrivacy = v),
          ),
        if (settings.containsKey('accessibility'))
          _buildImportToggle(
            icon: Icons.accessibility_new,
            label: 'Accessibility Settings',
            value: _importAccessibility,
            onChanged: (v) => setState(() => _importAccessibility = v),
          ),
        if (settings.containsKey('locale'))
          _buildImportToggle(
            icon: Icons.language,
            label: 'Language & Region',
            value: _importLocale,
            onChanged: (v) => setState(() => _importLocale = v),
          ),
        if (settings.containsKey('appearance'))
          _buildImportToggle(
            icon: Icons.palette_outlined,
            label: 'Appearance',
            value: _importAppearance,
            onChanged: (v) => setState(() => _importAppearance = v),
          ),
        
        const SizedBox(height: AppSpacing.lg),
        
        // Warning
        Container(
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: cs.tertiaryContainer.withOpacity(0.3),
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          child: Row(
            children: [
              Icon(Icons.info_outline, color: cs.tertiary, size: 20),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(
                  'This will overwrite your current settings for selected categories.',
                  style: tt.bodySmall?.copyWith(color: cs.onTertiaryContainer),
                ),
              ),
            ],
          ),
        ),
        
        const SizedBox(height: AppSpacing.lg),
        
        // Import button
        StyledButton(
          onPressed: _hasSelection ? _importSettings : null,
          isLoading: _isImporting,
          icon: Icons.file_upload,
          label: 'Import Settings',
        ),
      ],
    );
  }
  
  Widget _buildImportToggle({
    required IconData icon,
    required String label,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
      child: Row(
        children: [
          Icon(icon, size: 20, color: cs.onSurfaceVariant),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Text(label, style: tt.bodyMedium),
          ),
          Switch.adaptive(
            value: value,
            onChanged: (v) {
              HapticFeedback.selectionClick();
              onChanged(v);
            },
          ),
        ],
      ),
    );
  }
  
  bool get _hasSelection {
    final settings = _importData?['settings'] as Map<String, dynamic>? ?? {};
    return (settings.containsKey('notifications') && _importNotifications) ||
           (settings.containsKey('privacy') && _importPrivacy) ||
           (settings.containsKey('accessibility') && _importAccessibility) ||
           (settings.containsKey('locale') && _importLocale) ||
           (settings.containsKey('appearance') && _importAppearance);
  }
  
  String _formatDate(String isoDate) {
    try {
      final date = DateTime.parse(isoDate);
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return isoDate;
    }
  }
  
  Future<void> _pickFile() async {
    setState(() {
      _isParsing = true;
      _parseError = null;
    });
    
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['json'],
        withData: true,
      );
      
      if (result != null && result.files.single.bytes != null) {
        final content = utf8.decode(result.files.single.bytes!);
        _parseJson(content);
      }
    } catch (e) {
      _log.error('Failed to pick file: $e', tag: _tag);
      setState(() => _parseError = 'Failed to read file');
    } finally {
      setState(() => _isParsing = false);
    }
  }
  
  Future<void> _pasteFromClipboard() async {
    setState(() {
      _isParsing = true;
      _parseError = null;
    });
    
    try {
      final data = await Clipboard.getData(Clipboard.kTextPlain);
      if (data?.text != null && data!.text!.isNotEmpty) {
        _parseJson(data.text!);
      } else {
        setState(() => _parseError = 'Clipboard is empty');
      }
    } catch (e) {
      _log.error('Failed to paste from clipboard: $e', tag: _tag);
      setState(() => _parseError = 'Failed to read clipboard');
    } finally {
      setState(() => _isParsing = false);
    }
  }
  
  void _parseJson(String content) {
    try {
      final data = jsonDecode(content) as Map<String, dynamic>;
      
      // Validate structure
      if (!data.containsKey('version') || !data.containsKey('settings')) {
        setState(() => _parseError = 'Invalid settings file format');
        return;
      }
      
      final version = data['version'];
      if (version != 1) {
        setState(() => _parseError = 'Unsupported file version: $version');
        return;
      }
      
      final settings = data['settings'];
      if (settings is! Map<String, dynamic> || settings.isEmpty) {
        setState(() => _parseError = 'No settings found in file');
        return;
      }
      
      HapticFeedback.lightImpact();
      setState(() => _importData = data);
    } on FormatException {
      setState(() => _parseError = 'Invalid JSON format');
    } catch (e) {
      _log.error('Failed to parse JSON: $e', tag: _tag);
      setState(() => _parseError = 'Failed to parse file');
    }
  }
  
  Future<void> _importSettings() async {
    setState(() => _isImporting = true);
    HapticFeedback.mediumImpact();
    
    final settings = _importData?['settings'] as Map<String, dynamic>? ?? {};
    int successCount = 0;
    int failCount = 0;
    
    try {
      // Import accessibility
      if (settings.containsKey('accessibility') && _importAccessibility) {
        try {
          final a = settings['accessibility'] as Map<String, dynamic>;
          final service = AccessibilityService.instance;
          
          if (a.containsKey('text_scale_factor')) {
            await service.setTextScaleFactor(
              (a['text_scale_factor'] as num).toDouble(),
            );
          }
          if (a.containsKey('bold_text_enabled')) {
            await service.setBoldTextEnabled(a['bold_text_enabled'] as bool);
          }
          if (a.containsKey('high_contrast_enabled')) {
            await service.setHighContrastEnabled(a['high_contrast_enabled'] as bool);
          }
          if (a.containsKey('reduce_motion_enabled')) {
            await service.setReduceMotionEnabled(a['reduce_motion_enabled'] as bool);
          }
          
          successCount++;
        } catch (e) {
          _log.error('Failed to import accessibility: $e', tag: _tag);
          failCount++;
        }
      }
      
      // Import locale
      if (settings.containsKey('locale') && _importLocale) {
        try {
          final l = settings['locale'] as Map<String, dynamic>;
          final service = locale_svc.LocaleService.instance;
          
          if (l.containsKey('language_code')) {
            await service.setLocale(Locale(
              l['language_code'] as String,
              l['country_code'] as String?,
            ));
          }
          
          successCount++;
        } catch (e) {
          _log.error('Failed to import locale: $e', tag: _tag);
          failCount++;
        }
      }
      
      // TODO: Import notifications, privacy, appearance when services support it
      
      if (mounted) {
        Navigator.of(context).pop();
        
        final message = failCount == 0
            ? 'Settings imported successfully'
            : 'Imported $successCount categories, $failCount failed';
            
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message),
            backgroundColor: failCount == 0
                ? Theme.of(context).colorScheme.primaryContainer
                : Theme.of(context).colorScheme.tertiaryContainer,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
      
      _log.info('Settings import: $successCount success, $failCount failed', tag: _tag);
    } finally {
      if (mounted) {
        setState(() => _isImporting = false);
      }
    }
  }
}
