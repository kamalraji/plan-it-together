import 'package:flutter/material.dart';
import 'package:thittam1hub/services/settings_audit_service.dart';

/// Mixin that provides audit logging for settings pages
/// 
/// Usage:
/// ```dart
/// class _MySettingsPageState extends State<MySettingsPage> 
///     with SettingsAuditMixin {
///   
///   @override
///   String get auditSettingType => 'notification';
///   
///   Future<void> _toggleSetting(bool newValue) async {
///     final oldValue = _currentValue;
///     setState(() => _currentValue = newValue);
///     
///     await updateService(...);
///     
///     // Log the change for audit trail
///     logSettingChange(
///       key: 'workspaceEnabled',
///       oldValue: oldValue,
///       newValue: newValue,
///     );
///   }
/// }
/// ```
mixin SettingsAuditMixin<T extends StatefulWidget> on State<T> {
  final _auditService = SettingsAuditService.instance;
  
  /// Override this to specify the setting type (e.g., 'notification', 'privacy')
  String get auditSettingType;
  
  /// Log a single setting change
  void logSettingChange({
    required String key,
    dynamic oldValue,
    dynamic newValue,
  }) {
    // Fire and forget - don't await to keep UI responsive
    _auditService.logChange(
      settingType: auditSettingType,
      settingKey: key,
      oldValue: oldValue,
      newValue: newValue,
    );
  }
  
  /// Log multiple setting changes at once
  void logBatchSettingChanges(List<SettingChange> changes) {
    for (final change in changes) {
      _auditService.logChange(
        settingType: auditSettingType,
        settingKey: change.key,
        oldValue: change.oldValue,
        newValue: change.newValue,
      );
    }
  }
}

/// Represents a single setting change for batch logging
class SettingChange {
  final String key;
  final dynamic oldValue;
  final dynamic newValue;
  
  const SettingChange({
    required this.key,
    this.oldValue,
    this.newValue,
  });
}

