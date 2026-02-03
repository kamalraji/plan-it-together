import 'dart:ui' show Locale;
import 'package:thittam1hub/services/accessibility_service.dart' hide LocaleService;
import 'package:thittam1hub/services/locale_service.dart';
import 'package:thittam1hub/services/settings_audit_service.dart';
import 'package:thittam1hub/services/logging_service.dart';
import 'package:thittam1hub/utils/result.dart';
import 'package:thittam1hub/services/result.dart' as service_result;

/// Routes settings reverts to the appropriate service controllers
/// 
/// This service bridges the audit log with actual service implementations,
/// allowing users to undo specific settings changes from the history view.
class SettingsRevertRouter {
  static final _log = LoggingService.instance;
  static const String _tag = 'SettingsRevertRouter';
  
  /// Apply a revert action to the appropriate service
  /// 
  /// Returns a Result indicating success or failure.
  /// The entry's oldValue will be applied as the new value.
  static Future<Result<void>> applyRevert(SettingsAuditEntry entry) async {
    try {
      _log.info('Reverting ${entry.settingType}.${entry.settingKey}', tag: _tag);
      
      switch (entry.settingType) {
        case 'appearance':
        case 'accessibility':
          return await _revertAccessibility(entry);
        case 'locale':
          return await _revertLocale(entry);
        case 'notification':
          return await _revertNotification(entry);
        case 'privacy':
          return await _revertPrivacy(entry);
        case 'security':
          return await _revertSecurity(entry);
        case 'storage':
          // Storage clear actions cannot be reverted
          return Result.failure('Storage actions cannot be reverted');
        default:
          _log.warning('Unknown setting type: ${entry.settingType}', tag: _tag);
          return Result.failure('Unknown setting type: ${entry.settingType}');
      }
    } catch (e) {
      _log.error('Failed to apply revert', tag: _tag, error: e);
      return Result.failure('Failed to apply revert: $e');
    }
  }
  
  /// Revert accessibility settings
  static Future<Result<void>> _revertAccessibility(SettingsAuditEntry entry) async {
    final service = AccessibilityService.instance;
    
    try {
      switch (entry.settingKey) {
        case 'text_scale_factor':
          final value = entry.oldValue as double? ?? 1.0;
          await service.setTextScaleFactor(value);
        case 'bold_text_enabled':
          final value = entry.oldValue as bool? ?? false;
          await service.setBoldTextEnabled(value);
        case 'high_contrast_enabled':
          final value = entry.oldValue as bool? ?? false;
          await service.setHighContrastEnabled(value);
        case 'reduce_motion_enabled':
          final value = entry.oldValue as bool? ?? false;
          await service.setReduceMotionEnabled(value);
        case 'larger_touch_targets':
          final value = entry.oldValue as bool? ?? false;
          await service.setLargerTouchTargets(value);
        case 'screen_reader_optimized':
          final value = entry.oldValue as bool? ?? false;
          await service.setScreenReaderOptimized(value);
        default:
          return Result.failure('Unknown accessibility key: ${entry.settingKey}');
      }
      return Result.success(null);
    } catch (e) {
      return Result.failure('Failed to revert accessibility setting: $e');
    }
  }
  
  /// Revert locale settings
  static Future<Result<void>> _revertLocale(SettingsAuditEntry entry) async {
    try {
      if (entry.settingKey == 'language') {
        final langCode = entry.oldValue as String? ?? 'en';
        final locale = Locale(langCode);
        final serviceResult = await LocaleService.instance.setLocale(locale);
        // Convert service Result to utils Result
        if (serviceResult.isSuccess) {
          return Result.success(null);
        }
        return Result.failure(serviceResult.error ?? 'Failed to set locale');
      }
      return Result.failure('Unknown locale key: ${entry.settingKey}');
    } catch (e) {
      return Result.failure('Failed to revert locale setting: $e');
    }
  }
  
  /// Revert notification settings - placeholder
  static Future<Result<void>> _revertNotification(SettingsAuditEntry entry) async {
    // Would implement notification service revert here
    return Result.success(null);
  }
  
  /// Revert privacy settings - placeholder
  static Future<Result<void>> _revertPrivacy(SettingsAuditEntry entry) async {
    // Would implement privacy service revert here
    return Result.success(null);
  }
  
  /// Revert security settings - placeholder
  static Future<Result<void>> _revertSecurity(SettingsAuditEntry entry) async {
    // Would implement security service revert here
    return Result.success(null);
  }
  
  /// Check if a setting type supports automatic revert
  static bool canAutoRevert(String settingType) {
    return ['accessibility', 'appearance', 'locale', 'notification', 'privacy']
        .contains(settingType);
  }
  
  /// Get human-readable limitation message for a setting type
  static String getRevertLimitation(String settingType) {
    switch (settingType) {
      case 'storage':
        return 'Storage operations (clear cache, etc.) cannot be undone.';
      case 'security':
        return 'Some security settings may require re-authentication.';
      default:
        return '';
    }
  }
}

// Locale class for compatibility
class Locale {
  final String languageCode;
  final String? countryCode;
  
  const Locale(this.languageCode, [this.countryCode]);
}
