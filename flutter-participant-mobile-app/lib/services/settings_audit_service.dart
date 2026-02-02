import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/services/settings_revert_router.dart';
import 'package:thittam1hub/utils/result.dart';

/// Service for tracking settings change history
/// 
/// Records all preference changes for audit trail and undo functionality.
/// Data is stored in `settings_audit_log` table with RLS ensuring users
/// can only access their own history.
class SettingsAuditService extends BaseService {
  static SettingsAuditService? _instance;
  static SettingsAuditService get instance => _instance ??= SettingsAuditService._();
  SettingsAuditService._();
  
  @override
  String get tag => 'SettingsAuditService';
  
  SupabaseClient get _supabase => Supabase.instance.client;
  String? get _userId => _supabase.auth.currentUser?.id;
  
  /// Log a settings change
  Future<Result<void>> logChange({
    required String settingType,
    required String settingKey,
    dynamic oldValue,
    dynamic newValue,
  }) async {
    return execute(() async {
      if (_userId == null) {
        throw Exception('User not authenticated');
      }
      
      await _supabase.from('settings_audit_log').insert({
        'user_id': _userId,
        'setting_type': settingType,
        'setting_key': settingKey,
        'old_value': oldValue,
        'new_value': newValue,
      });
    }, operationName: 'logChange');
  }
  
  /// Get recent settings changes
  Future<Result<List<SettingsAuditEntry>>> getRecentChanges({
    int limit = 50,
    String? settingType,
  }) async {
    return execute(() async {
      if (_userId == null) {
        throw Exception('User not authenticated');
      }
      
      // Build query with filters before transforms
      var baseQuery = _supabase
          .from('settings_audit_log')
          .select()
          .eq('user_id', _userId!);
      
      final filteredQuery = settingType != null 
          ? baseQuery.eq('setting_type', settingType)
          : baseQuery;
      
      final response = await filteredQuery
          .order('created_at', ascending: false)
          .limit(limit);
      
      return (response as List)
          .map((e) => SettingsAuditEntry.fromJson(e))
          .toList();
    }, operationName: 'getRecentChanges');
  }
  
  /// Revert a specific change
  Future<Result<void>> revertChange(String auditId) async {
    return execute(() async {
      if (_userId == null) {
        throw Exception('User not authenticated');
      }
      
      // Fetch the audit entry
      final response = await _supabase
          .from('settings_audit_log')
          .select()
          .eq('id', auditId)
          .eq('user_id', _userId!)
          .maybeSingle();
      
      if (response == null) {
        throw Exception('Audit entry not found');
      }
      
      final entry = SettingsAuditEntry.fromJson(response);
      
      // Apply the revert via router
      final revertResult = await SettingsRevertRouter.applyRevert(entry);
      if (revertResult.isFailure) {
        throw Exception(revertResult.error ?? 'Revert failed');
      }
      
      // Log the revert action
      await _supabase.from('settings_audit_log').insert({
        'user_id': _userId,
        'setting_type': entry.settingType,
        'setting_key': entry.settingKey,
        'old_value': entry.newValue,
        'new_value': entry.oldValue,
      });
    }, operationName: 'revertChange');
  }
  
  /// Clear all audit history for current user
  Future<Result<void>> clearHistory() async {
    return execute(() async {
      if (_userId == null) {
        throw Exception('User not authenticated');
      }
      
      await _supabase
          .from('settings_audit_log')
          .delete()
          .eq('user_id', _userId!);
    }, operationName: 'clearHistory');
  }
}

/// Represents a single settings audit entry
class SettingsAuditEntry {
  final String id;
  final String userId;
  final String settingType;
  final String settingKey;
  final dynamic oldValue;
  final dynamic newValue;
  final DateTime createdAt;

  const SettingsAuditEntry({
    required this.id,
    required this.userId,
    required this.settingType,
    required this.settingKey,
    this.oldValue,
    this.newValue,
    required this.createdAt,
  });

  /// Get human-readable description of the change
  String get description {
    final keyLabel = settingKey.replaceAll('_', ' ').toLowerCase();
    if (oldValue == null && newValue != null) {
      return 'Set $keyLabel to $newValue';
    } else if (oldValue != null && newValue == null) {
      return 'Cleared $keyLabel';
    } else {
      return 'Changed $keyLabel from $oldValue to $newValue';
    }
  }
  
  /// Get category label for display
  String get categoryLabel {
    switch (settingType) {
      case 'accessibility': return 'Accessibility';
      case 'appearance': return 'Appearance';
      case 'locale': return 'Language';
      case 'notification': return 'Notifications';
      case 'privacy': return 'Privacy';
      case 'security': return 'Security';
      case 'storage': return 'Storage';
      default: return settingType;
    }
  }

  factory SettingsAuditEntry.fromJson(Map<String, dynamic> json) {
    return SettingsAuditEntry(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      settingType: json['setting_type'] as String,
      settingKey: json['setting_key'] as String,
      oldValue: json['old_value'],
      newValue: json['new_value'],
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'user_id': userId,
    'setting_type': settingType,
    'setting_key': settingKey,
    'old_value': oldValue,
    'new_value': newValue,
    'created_at': createdAt.toIso8601String(),
  };
}
