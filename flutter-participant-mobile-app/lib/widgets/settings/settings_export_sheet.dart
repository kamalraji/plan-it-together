import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/services/logging_service.dart';
import 'package:thittam1hub/services/profile_service.dart';
import 'package:thittam1hub/services/accessibility_service.dart';
import 'package:thittam1hub/services/locale_service.dart' as locale_svc;
import 'package:thittam1hub/services/biometric_quick_unlock.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/styled_button.dart';

/// Bottom sheet for exporting user settings to JSON
/// 
/// Exports:
/// - Notification preferences
/// - Privacy settings
/// - Accessibility settings
/// - Locale/language settings
/// - Appearance settings
class SettingsExportSheet extends StatefulWidget {
  const SettingsExportSheet({super.key});
  
  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const SettingsExportSheet(),
    );
  }

  @override
  State<SettingsExportSheet> createState() => _SettingsExportSheetState();
}

class _SettingsExportSheetState extends State<SettingsExportSheet> {
  static final _log = LoggingService.instance;
  static const _tag = 'SettingsExportSheet';
  
  bool _isExporting = false;
  bool _includeNotifications = true;
  bool _includePrivacy = true;
  bool _includeAccessibility = true;
  bool _includeLocale = true;
  bool _includeAppearance = true;
  
  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    
    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        child: Padding(
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
                  Icon(Icons.file_download_outlined, color: cs.primary),
                  const SizedBox(width: AppSpacing.sm),
                  Text(
                    'Export Settings',
                    style: tt.titleLarge?.copyWith(fontWeight: FontWeight.w600),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Export your preferences to a JSON file for backup or transfer to another device.',
                style: tt.bodyMedium?.copyWith(color: cs.onSurfaceVariant),
              ),
              const SizedBox(height: AppSpacing.lg),
              
              // Category toggles
              _buildCategoryToggle(
                icon: Icons.notifications_outlined,
                label: 'Notification Preferences',
                value: _includeNotifications,
                onChanged: (v) => setState(() => _includeNotifications = v),
              ),
              _buildCategoryToggle(
                icon: Icons.lock_outline,
                label: 'Privacy Settings',
                value: _includePrivacy,
                onChanged: (v) => setState(() => _includePrivacy = v),
              ),
              _buildCategoryToggle(
                icon: Icons.accessibility_new,
                label: 'Accessibility Settings',
                value: _includeAccessibility,
                onChanged: (v) => setState(() => _includeAccessibility = v),
              ),
              _buildCategoryToggle(
                icon: Icons.language,
                label: 'Language & Region',
                value: _includeLocale,
                onChanged: (v) => setState(() => _includeLocale = v),
              ),
              _buildCategoryToggle(
                icon: Icons.palette_outlined,
                label: 'Appearance',
                value: _includeAppearance,
                onChanged: (v) => setState(() => _includeAppearance = v),
              ),
              
              const SizedBox(height: AppSpacing.lg),
              
              // Export button
              StyledButton(
                onPressed: _hasSelection ? _exportSettings : null,
                isLoading: _isExporting,
                icon: Icons.file_download,
                label: 'Export Settings',
              ),
              const SizedBox(height: AppSpacing.sm),
              
              // Copy to clipboard option
              TextButton.icon(
                onPressed: _hasSelection && !_isExporting ? _copyToClipboard : null,
                icon: const Icon(Icons.copy, size: 18),
                label: const Text('Copy to Clipboard'),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  bool get _hasSelection =>
      _includeNotifications ||
      _includePrivacy ||
      _includeAccessibility ||
      _includeLocale ||
      _includeAppearance;
  
  Widget _buildCategoryToggle({
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
  
  Future<Map<String, dynamic>> _buildExportData() async {
    final data = <String, dynamic>{
      'version': 1,
      'exported_at': DateTime.now().toUtc().toIso8601String(),
      'app_version': '1.0.0',
      'settings': <String, dynamic>{},
    };
    
    final settings = data['settings'] as Map<String, dynamic>;
    
    if (_includeNotifications) {
      try {
        final userId = Supabase.instance.client.auth.currentUser?.id;
        if (userId != null) {
          final prefs = await ProfileService.instance.getNotificationPreferences(userId);
          if (prefs != null) {
            settings['notifications'] = prefs.toJson();
          }
        }
      } catch (e) {
        _log.error('Failed to export notifications: $e', tag: _tag);
      }
    }
    
    if (_includePrivacy) {
      try {
        final userId = Supabase.instance.client.auth.currentUser?.id;
        if (userId != null) {
          final prefs = await ProfileService.instance.getNotificationPreferences(userId);
          // Privacy settings would be fetched similarly
          settings['privacy'] = {
            'show_online_status': prefs?.showOnlineStatus ?? true,
            'show_last_seen': prefs?.showLastSeen ?? true,
            'show_read_receipts': prefs?.readReceiptsEnabled ?? true,
          };
        }
      } catch (e) {
        _log.error('Failed to export privacy: $e', tag: _tag);
      }
    }
    
    if (_includeAccessibility) {
      try {
        final service = AccessibilityService.instance;
        settings['accessibility'] = {
          'text_scale_factor': service.textScaleFactor,
          'bold_text_enabled': service.boldTextEnabled,
          'high_contrast_enabled': service.highContrastEnabled,
          'reduce_motion_enabled': service.reduceMotionEnabled,
          'screen_reader_optimized': service.screenReaderOptimized,
          'larger_touch_targets': service.largerTouchTargets,
        };
      } catch (e) {
        _log.error('Failed to export accessibility: $e', tag: _tag);
      }
    }
    
    if (_includeLocale) {
      try {
        final service = locale_svc.LocaleService.instance;
        settings['locale'] = {
          'language_code': service.currentLocale.languageCode,
          'country_code': service.currentLocale.countryCode,
        };
      } catch (e) {
        _log.error('Failed to export locale: $e', tag: _tag);
      }
    }
    
    if (_includeAppearance) {
      settings['appearance'] = {
        'theme_mode': 'system', // Would come from ThemeService
        'accent_color': null,
      };
    }
    
    return data;
  }
  
  Future<void> _exportSettings() async {
    // Authenticate first
    final authenticated = await BiometricQuickUnlock.authenticateForOperation(
      context,
      BiometricOperation.exportData,
    );
    
    if (!authenticated && await BiometricQuickUnlock.isAvailable) {
      return; // User cancelled or failed biometric
    }
    
    setState(() => _isExporting = true);
    HapticFeedback.mediumImpact();
    
    try {
      final data = await _buildExportData();
      final jsonString = const JsonEncoder.withIndent('  ').convert(data);
      
      // Share as file
      await Share.share(
        jsonString,
        subject: 'Thittam1Hub Settings Export',
      );
      
      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Settings exported successfully'),
            backgroundColor: Theme.of(context).colorScheme.primaryContainer,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
      
      _log.info('Settings exported successfully', tag: _tag);
    } catch (e) {
      _log.error('Failed to export settings: $e', tag: _tag);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Failed to export settings'),
            backgroundColor: Theme.of(context).colorScheme.errorContainer,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isExporting = false);
      }
    }
  }
  
  Future<void> _copyToClipboard() async {
    setState(() => _isExporting = true);
    
    try {
      final data = await _buildExportData();
      final jsonString = const JsonEncoder.withIndent('  ').convert(data);
      
      await Clipboard.setData(ClipboardData(text: jsonString));
      HapticFeedback.lightImpact();
      
      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Settings copied to clipboard'),
            backgroundColor: Theme.of(context).colorScheme.primaryContainer,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      _log.error('Failed to copy settings: $e', tag: _tag);
    } finally {
      if (mounted) {
        setState(() => _isExporting = false);
      }
    }
  }
}
