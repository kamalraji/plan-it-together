import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:workmanager/workmanager.dart';

export 'package:workmanager/workmanager.dart' 
    show Workmanager, Constraints, NetworkType, ExistingWorkPolicy, BackoffPolicy;

import '../database/database_backup_service.dart';
import '../services/logging_service.dart';

/// Background task identifiers
const String kBackupTaskName = 'thittam_weekly_backup';
const String kBackupTaskUniqueName = 'com.thittam.backup.weekly';
const String _bgTag = 'BackupScheduler';

/// Callback dispatcher for workmanager - must be top-level function
@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((taskName, inputData) async {
    // Note: LoggingService may not be available in background isolate, use debugPrint
    debugPrint('[$_bgTag] Executing background task: $taskName');
    
    try {
      switch (taskName) {
        case kBackupTaskName:
          await _performScheduledBackup();
          return true;
        default:
          debugPrint('[$_bgTag] Unknown task: $taskName');
          return false;
      }
    } catch (e) {
      debugPrint('[$_bgTag] Task failed: $e');
      return false;
    }
  });
}

/// Perform the scheduled backup
Future<void> _performScheduledBackup() async {
  // Note: LoggingService may not be available in background isolate
  debugPrint('[$_bgTag] Starting scheduled backup...');
  
  try {
    final prefs = await SharedPreferences.getInstance();
    
    // Check if auto-backup is still enabled
    final isEnabled = prefs.getBool(BackupSchedulerService._kAutoBackupEnabled) ?? false;
    if (!isEnabled) {
      debugPrint('[$_bgTag] Auto-backup disabled, skipping');
      return;
    }
    
    // Get backup password if set
    final password = prefs.getString(BackupSchedulerService._kBackupPassword);
    
    // Create backup
    final backupService = DatabaseBackupService.instance;
    final backup = await backupService.createBackup(
      password: password,
      includeDeletedMessages: false,
    );
    
    // Save to device
    final filePath = await backupService.saveBackupToDevice(backup);
    
    // Update last backup time
    await prefs.setString(
      BackupSchedulerService._kLastBackupTime,
      DateTime.now().toIso8601String(),
    );
    
    // Prune old backups
    final keepCount = prefs.getInt(BackupSchedulerService._kBackupRetentionCount) ?? 5;
    await backupService.pruneOldBackups(keepCount: keepCount);
    
    debugPrint('[$_bgTag] Scheduled backup complete: $filePath');
  } catch (e) {
    debugPrint('[$_bgTag] Scheduled backup failed: $e');
    rethrow;
  }
}

/// Service for managing automatic backup scheduling
class BackupSchedulerService {
  static const String _tag = 'BackupSchedulerService';
  static final _log = LoggingService.instance;
  static BackupSchedulerService? _instance;
  static BackupSchedulerService get instance => _instance ??= BackupSchedulerService._();
  
  BackupSchedulerService._();

  // SharedPreferences keys
  static const String _kAutoBackupEnabled = 'backup_auto_enabled';
  static const String _kBackupFrequency = 'backup_frequency';
  static const String _kBackupPassword = 'backup_password';
  static const String _kLastBackupTime = 'backup_last_time';
  static const String _kNextBackupTime = 'backup_next_time';
  static const String _kBackupRetentionCount = 'backup_retention_count';
  static const String _kBackupOnWifiOnly = 'backup_wifi_only';

  bool _initialized = false;

  /// Initialize the backup scheduler
  Future<void> init() async {
    if (_initialized) return;
    
    try {
      await Workmanager().initialize(
        callbackDispatcher,
        isInDebugMode: kDebugMode,
      );
      
      _initialized = true;
      _log.serviceInitialized('BackupSchedulerService');
      
      // Check if auto-backup should be scheduled
      final settings = await getSettings();
      if (settings.isEnabled) {
        await _scheduleBackupTask(settings.frequency);
      }
    } catch (e) {
      _log.error('Init failed', tag: _tag, error: e);
    }
  }

  /// Get current backup scheduler settings
  Future<BackupScheduleSettings> getSettings() async {
    final prefs = await SharedPreferences.getInstance();
    
    return BackupScheduleSettings(
      isEnabled: prefs.getBool(_kAutoBackupEnabled) ?? false,
      frequency: BackupFrequency.fromString(
        prefs.getString(_kBackupFrequency) ?? 'weekly',
      ),
      hasPassword: prefs.getString(_kBackupPassword)?.isNotEmpty ?? false,
      lastBackupTime: _parseDateTime(prefs.getString(_kLastBackupTime)),
      nextBackupTime: _parseDateTime(prefs.getString(_kNextBackupTime)),
      retentionCount: prefs.getInt(_kBackupRetentionCount) ?? 5,
      wifiOnly: prefs.getBool(_kBackupOnWifiOnly) ?? true,
    );
  }

  /// Enable automatic backups
  Future<void> enableAutoBackup({
    BackupFrequency frequency = BackupFrequency.weekly,
    String? password,
    int retentionCount = 5,
    bool wifiOnly = true,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    
    await prefs.setBool(_kAutoBackupEnabled, true);
    await prefs.setString(_kBackupFrequency, frequency.name);
    await prefs.setInt(_kBackupRetentionCount, retentionCount);
    await prefs.setBool(_kBackupOnWifiOnly, wifiOnly);
    
    if (password != null && password.isNotEmpty) {
      await prefs.setString(_kBackupPassword, password);
    }
    
    // Calculate and store next backup time
    final nextBackup = _calculateNextBackupTime(frequency);
    await prefs.setString(_kNextBackupTime, nextBackup.toIso8601String());
    
    // Schedule the background task
    await _scheduleBackupTask(frequency, wifiOnly: wifiOnly);
    
    _log.info('Auto-backup enabled', tag: _tag, metadata: {'frequency': frequency.name});
  }

  /// Disable automatic backups
  Future<void> disableAutoBackup() async {
    final prefs = await SharedPreferences.getInstance();
    
    await prefs.setBool(_kAutoBackupEnabled, false);
    await prefs.remove(_kNextBackupTime);
    
    // Cancel scheduled task
    await Workmanager().cancelByUniqueName(kBackupTaskUniqueName);
    
    _log.info('Auto-backup disabled', tag: _tag);
  }

  /// Update backup password
  Future<void> updatePassword(String? password) async {
    final prefs = await SharedPreferences.getInstance();
    
    if (password != null && password.isNotEmpty) {
      await prefs.setString(_kBackupPassword, password);
    } else {
      await prefs.remove(_kBackupPassword);
    }
    
    _log.info('Password updated', tag: _tag);
  }

  /// Update backup frequency
  Future<void> updateFrequency(BackupFrequency frequency) async {
    final prefs = await SharedPreferences.getInstance();
    final isEnabled = prefs.getBool(_kAutoBackupEnabled) ?? false;
    
    await prefs.setString(_kBackupFrequency, frequency.name);
    
    if (isEnabled) {
      final nextBackup = _calculateNextBackupTime(frequency);
      await prefs.setString(_kNextBackupTime, nextBackup.toIso8601String());
      
      // Reschedule with new frequency
      final wifiOnly = prefs.getBool(_kBackupOnWifiOnly) ?? true;
      await _scheduleBackupTask(frequency, wifiOnly: wifiOnly);
    }
    
    _log.info('Frequency updated', tag: _tag, metadata: {'frequency': frequency.name});
  }

  /// Trigger an immediate backup
  Future<BackupResult> triggerImmediateBackup() async {
    _log.info('Triggering immediate backup...', tag: _tag);
    
    try {
      final prefs = await SharedPreferences.getInstance();
      final password = prefs.getString(_kBackupPassword);
      
      final backupService = DatabaseBackupService.instance;
      final backup = await backupService.createBackup(
        password: password,
        includeDeletedMessages: false,
      );
      
      final filePath = await backupService.saveBackupToDevice(backup);
      
      // Update last backup time
      await prefs.setString(_kLastBackupTime, DateTime.now().toIso8601String());
      
      // Prune old backups
      final keepCount = prefs.getInt(_kBackupRetentionCount) ?? 5;
      await backupService.pruneOldBackups(keepCount: keepCount);
      
      _log.info('Immediate backup complete', tag: _tag);
      
      return BackupResult(
        success: true,
        filePath: filePath,
        timestamp: DateTime.now(),
        messageCount: backup.manifest.messageCount,
        channelCount: backup.manifest.channelCount,
      );
    } catch (e) {
      _log.error('Immediate backup failed', tag: _tag, error: e);
      return BackupResult(
        success: false,
        error: e.toString(),
        timestamp: DateTime.now(),
      );
    }
  }

  /// Schedule the background backup task
  Future<void> _scheduleBackupTask(
    BackupFrequency frequency, {
    bool wifiOnly = true,
  }) async {
    // Cancel existing task
    await Workmanager().cancelByUniqueName(kBackupTaskUniqueName);
    
    // Determine frequency duration
    final Duration taskFrequency;
    switch (frequency) {
      case BackupFrequency.daily:
        taskFrequency = const Duration(days: 1);
        break;
      case BackupFrequency.weekly:
        taskFrequency = const Duration(days: 7);
        break;
      case BackupFrequency.biweekly:
        taskFrequency = const Duration(days: 14);
        break;
      case BackupFrequency.monthly:
        taskFrequency = const Duration(days: 30);
        break;
    }
    
    // Register periodic task
    await Workmanager().registerPeriodicTask(
      kBackupTaskUniqueName,
      kBackupTaskName,
      frequency: taskFrequency,
      constraints: Constraints(
        networkType: wifiOnly ? NetworkType.unmetered : NetworkType.connected,
        requiresBatteryNotLow: true,
        requiresStorageNotLow: true,
      ),
      existingWorkPolicy: ExistingWorkPolicy.replace,
      backoffPolicy: BackoffPolicy.exponential,
      backoffPolicyDelay: const Duration(minutes: 10),
    );
    
    _log.info('Scheduled backup task', tag: _tag, metadata: {'frequency': frequency.name});
  }

  /// Calculate next backup time based on frequency
  DateTime _calculateNextBackupTime(BackupFrequency frequency) {
    final now = DateTime.now();
    
    switch (frequency) {
      case BackupFrequency.daily:
        return now.add(const Duration(days: 1));
      case BackupFrequency.weekly:
        return now.add(const Duration(days: 7));
      case BackupFrequency.biweekly:
        return now.add(const Duration(days: 14));
      case BackupFrequency.monthly:
        return now.add(const Duration(days: 30));
    }
  }

  DateTime? _parseDateTime(String? dateStr) {
    if (dateStr == null) return null;
    try {
      return DateTime.parse(dateStr);
    } catch (_) {
      return null;
    }
  }
}

/// Backup frequency options
enum BackupFrequency {
  daily,
  weekly,
  biweekly,
  monthly;

  String get displayName {
    switch (this) {
      case BackupFrequency.daily:
        return 'Daily';
      case BackupFrequency.weekly:
        return 'Weekly';
      case BackupFrequency.biweekly:
        return 'Every 2 weeks';
      case BackupFrequency.monthly:
        return 'Monthly';
    }
  }

  static BackupFrequency fromString(String value) {
    return BackupFrequency.values.firstWhere(
      (f) => f.name == value,
      orElse: () => BackupFrequency.weekly,
    );
  }
}

/// Settings for backup scheduling
class BackupScheduleSettings {
  final bool isEnabled;
  final BackupFrequency frequency;
  final bool hasPassword;
  final DateTime? lastBackupTime;
  final DateTime? nextBackupTime;
  final int retentionCount;
  final bool wifiOnly;

  const BackupScheduleSettings({
    required this.isEnabled,
    required this.frequency,
    required this.hasPassword,
    this.lastBackupTime,
    this.nextBackupTime,
    required this.retentionCount,
    required this.wifiOnly,
  });

  /// Time since last backup
  Duration? get timeSinceLastBackup {
    if (lastBackupTime == null) return null;
    return DateTime.now().difference(lastBackupTime!);
  }

  /// Time until next backup
  Duration? get timeUntilNextBackup {
    if (nextBackupTime == null) return null;
    final diff = nextBackupTime!.difference(DateTime.now());
    return diff.isNegative ? Duration.zero : diff;
  }

  /// Check if backup is overdue
  bool get isOverdue {
    if (!isEnabled || nextBackupTime == null) return false;
    return DateTime.now().isAfter(nextBackupTime!);
  }
}

/// Result of a backup operation
class BackupResult {
  final bool success;
  final String? filePath;
  final String? error;
  final DateTime timestamp;
  final int? messageCount;
  final int? channelCount;

  const BackupResult({
    required this.success,
    this.filePath,
    this.error,
    required this.timestamp,
    this.messageCount,
    this.channelCount,
  });
}
