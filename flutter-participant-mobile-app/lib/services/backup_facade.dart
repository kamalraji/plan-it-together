import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:thittam1hub/utils/result.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/services/pagination_mixin.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';

/// Types of data that can be backed up.
enum BackupType {
  chatMessages,
  chatMedia,
  profile,
  preferences,
  full,
}

/// Backup format options.
enum BackupFormat {
  json,
  encrypted,
}

/// Result of a backup operation.
@immutable
class BackupResult {
  final String backupId;
  final BackupType type;
  final BackupFormat format;
  final int sizeBytes;
  final DateTime createdAt;
  final String? storageUrl;
  final Map<String, int>? itemCounts;
  
  const BackupResult({
    required this.backupId,
    required this.type,
    required this.format,
    required this.sizeBytes,
    required this.createdAt,
    this.storageUrl,
    this.itemCounts,
  });
  
  String get formattedSize {
    if (sizeBytes < 1024) return '$sizeBytes B';
    if (sizeBytes < 1024 * 1024) return '${(sizeBytes / 1024).toStringAsFixed(1)} KB';
    return '${(sizeBytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
  
  Map<String, dynamic> toJson() => {
    'backup_id': backupId,
    'type': type.name,
    'format': format.name,
    'size_bytes': sizeBytes,
    'created_at': createdAt.toIso8601String(),
    'storage_url': storageUrl,
    'item_counts': itemCounts,
  };
  
  factory BackupResult.fromJson(Map<String, dynamic> json) => BackupResult(
    backupId: json['backup_id'] as String,
    type: BackupType.values.firstWhere(
      (t) => t.name == json['type'],
      orElse: () => BackupType.full,
    ),
    format: BackupFormat.values.firstWhere(
      (f) => f.name == json['format'],
      orElse: () => BackupFormat.json,
    ),
    sizeBytes: json['size_bytes'] as int? ?? 0,
    createdAt: DateTime.parse(json['created_at'] as String),
    storageUrl: json['storage_url'] as String?,
    itemCounts: json['item_counts'] != null 
        ? Map<String, int>.from(json['item_counts'] as Map)
        : null,
  );
}

/// Restore result.
@immutable
class RestoreResult {
  final bool success;
  final Map<String, int> restoredCounts;
  final List<String> warnings;
  final Duration duration;
  
  const RestoreResult({
    required this.success,
    required this.restoredCounts,
    this.warnings = const [],
    required this.duration,
  });
  
  int get totalRestored => restoredCounts.values.fold(0, (a, b) => a + b);
}

/// Unified backup facade consolidating all backup/restore operations.
/// 
/// Industrial best practice: Single point for data export/import
/// with progress tracking and incremental backup support.
class BackupFacade extends BaseService {
  static BackupFacade? _instance;
  static BackupFacade get instance => _instance ??= BackupFacade._();
  BackupFacade._();
  
  @override
  String get tag => 'Backup';
  
  final _supabase = SupabaseConfig.client;
  
  // Progress tracking
  final ValueNotifier<double> progress = ValueNotifier(0.0);
  final ValueNotifier<String> status = ValueNotifier('');
  
  /// Create a backup of specified type.
  Future<Result<BackupResult>> createBackup({
    required BackupType type,
    BackupFormat format = BackupFormat.json,
    bool includeMedia = false,
    void Function(double progress, String status)? onProgress,
  }) async {
    return executeWithRetry(() async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');
      
      final backupId = '${type.name}_${DateTime.now().millisecondsSinceEpoch}';
      final itemCounts = <String, int>{};
      final backupData = <String, dynamic>{};
      
      startTimer('createBackup');
      _updateProgress(0.0, 'Starting backup...', onProgress);
      
      try {
        switch (type) {
          case BackupType.chatMessages:
            final messages = await _backupChatMessages(userId, onProgress);
            backupData['messages'] = messages;
            itemCounts['messages'] = messages.length;
            break;
            
          case BackupType.chatMedia:
            final media = await _backupChatMedia(userId, includeMedia, onProgress);
            backupData['media'] = media;
            itemCounts['media'] = media.length;
            break;
            
          case BackupType.profile:
            final profile = await _backupProfile(userId, onProgress);
            backupData['profile'] = profile;
            itemCounts['profile_fields'] = profile.length;
            break;
            
          case BackupType.preferences:
            final prefs = await _backupPreferences(userId, onProgress);
            backupData['preferences'] = prefs;
            itemCounts['preferences'] = prefs.length;
            break;
            
          case BackupType.full:
            _updateProgress(0.1, 'Backing up messages...', onProgress);
            backupData['messages'] = await _backupChatMessages(userId, onProgress);
            itemCounts['messages'] = (backupData['messages'] as List).length;
            
            _updateProgress(0.4, 'Backing up profile...', onProgress);
            backupData['profile'] = await _backupProfile(userId, onProgress);
            itemCounts['profile_fields'] = (backupData['profile'] as Map).length;
            
            _updateProgress(0.6, 'Backing up preferences...', onProgress);
            backupData['preferences'] = await _backupPreferences(userId, onProgress);
            itemCounts['preferences'] = (backupData['preferences'] as Map).length;
            
            if (includeMedia) {
              _updateProgress(0.7, 'Backing up media...', onProgress);
              backupData['media'] = await _backupChatMedia(userId, true, onProgress);
              itemCounts['media'] = (backupData['media'] as List).length;
            }
            break;
        }
        
        _updateProgress(0.9, 'Saving backup...', onProgress);
        
        // Encode backup data
        final jsonData = jsonEncode({
          'version': '1.0',
          'created_at': DateTime.now().toIso8601String(),
          'user_id': userId,
          'type': type.name,
          'data': backupData,
        });
        
        final bytes = utf8.encode(jsonData);
        
        // Upload to storage
        final storagePath = 'backups/$userId/$backupId.json';
        await _supabase.storage
            .from('user-backups')
            .uploadBinary(storagePath, Uint8List.fromList(bytes));
        
        final storageUrl = _supabase.storage
            .from('user-backups')
            .getPublicUrl(storagePath);
        
        // Record backup metadata
        await _supabase.from('user_backups').insert({
          'id': backupId,
          'user_id': userId,
          'type': type.name,
          'format': format.name,
          'size_bytes': bytes.length,
          'storage_path': storagePath,
          'item_counts': itemCounts,
        });
        
        _updateProgress(1.0, 'Backup complete!', onProgress);
        stopTimer('createBackup');
        
        logInfo('Backup created', metadata: {
          'backup_id': backupId,
          'type': type.name,
          'size': bytes.length,
          'items': itemCounts,
        });
        
        return BackupResult(
          backupId: backupId,
          type: type,
          format: format,
          sizeBytes: bytes.length,
          createdAt: DateTime.now(),
          storageUrl: storageUrl,
          itemCounts: itemCounts,
        );
      } catch (e) {
        _updateProgress(0.0, 'Backup failed', onProgress);
        rethrow;
      }
    }, operationName: 'createBackup', maxAttempts: 2);
  }
  
  /// List available backups for current user.
  Future<Result<List<BackupResult>>> listBackups({
    BackupType? type,
    int limit = 20,
  }) async {
    return execute(() async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');
      
      var query = _supabase
          .from('user_backups')
          .select()
          .eq('user_id', userId)
          .order('created_at', ascending: false)
          .limit(limit);
      
      if (type != null) {
        query = query.eq('type', type.name);
      }
      
      final data = await query;
      
      logDbOperation('SELECT', 'user_backups', rowCount: data.length);
      
      return (data as List)
          .map((row) => BackupResult.fromJson(row as Map<String, dynamic>))
          .toList();
    }, operationName: 'listBackups');
  }
  
  /// Restore from a backup.
  Future<Result<RestoreResult>> restoreBackup({
    required String backupId,
    bool overwriteExisting = false,
    void Function(double progress, String status)? onProgress,
  }) async {
    return execute(() async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');
      
      final startTime = DateTime.now();
      final restoredCounts = <String, int>{};
      final warnings = <String>[];
      
      startTimer('restoreBackup');
      _updateProgress(0.0, 'Loading backup...', onProgress);
      
      // Fetch backup metadata
      final backupMeta = await _supabase
          .from('user_backups')
          .select()
          .eq('id', backupId)
          .eq('user_id', userId)
          .maybeSingle();
      
      if (backupMeta == null) {
        throw Exception('Backup not found');
      }
      
      // Download backup data
      final storagePath = backupMeta['storage_path'] as String;
      final bytes = await _supabase.storage
          .from('user-backups')
          .download(storagePath);
      
      final jsonData = utf8.decode(bytes);
      final backup = jsonDecode(jsonData) as Map<String, dynamic>;
      final data = backup['data'] as Map<String, dynamic>;
      
      _updateProgress(0.2, 'Restoring data...', onProgress);
      
      // Restore messages
      if (data.containsKey('messages')) {
        final messages = data['messages'] as List;
        _updateProgress(0.4, 'Restoring ${messages.length} messages...', onProgress);
        
        // Batch insert messages
        int restored = 0;
        for (var i = 0; i < messages.length; i += 100) {
          final batch = messages.skip(i).take(100).toList();
          try {
            await _supabase.from('messages').upsert(
              batch.map((m) => {...m as Map<String, dynamic>, 'user_id': userId}).toList(),
              onConflict: 'id',
            );
            restored += batch.length;
          } catch (e) {
            warnings.add('Failed to restore some messages: $e');
          }
        }
        restoredCounts['messages'] = restored;
      }
      
      // Restore profile
      if (data.containsKey('profile')) {
        _updateProgress(0.7, 'Restoring profile...', onProgress);
        try {
          await _supabase.from('user_profiles').upsert({
            'id': userId,
            ...data['profile'] as Map<String, dynamic>,
          });
          restoredCounts['profile'] = 1;
        } catch (e) {
          warnings.add('Failed to restore profile: $e');
        }
      }
      
      // Restore preferences
      if (data.containsKey('preferences')) {
        _updateProgress(0.9, 'Restoring preferences...', onProgress);
        try {
          await _supabase.from('user_preferences').upsert({
            'user_id': userId,
            ...data['preferences'] as Map<String, dynamic>,
          });
          restoredCounts['preferences'] = 1;
        } catch (e) {
          warnings.add('Failed to restore preferences: $e');
        }
      }
      
      _updateProgress(1.0, 'Restore complete!', onProgress);
      stopTimer('restoreBackup');
      
      final duration = DateTime.now().difference(startTime);
      
      logInfo('Backup restored', metadata: {
        'backup_id': backupId,
        'restored': restoredCounts,
        'warnings': warnings.length,
        'duration_ms': duration.inMilliseconds,
      });
      
      return RestoreResult(
        success: warnings.isEmpty,
        restoredCounts: restoredCounts,
        warnings: warnings,
        duration: duration,
      );
    }, operationName: 'restoreBackup');
  }
  
  /// Delete a backup.
  Future<Result<bool>> deleteBackup(String backupId) async {
    return execute(() async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');
      
      // Get backup metadata
      final backup = await _supabase
          .from('user_backups')
          .select('storage_path')
          .eq('id', backupId)
          .eq('user_id', userId)
          .maybeSingle();
      
      if (backup == null) return false;
      
      // Delete from storage
      final storagePath = backup['storage_path'] as String;
      await _supabase.storage.from('user-backups').remove([storagePath]);
      
      // Delete metadata
      await _supabase
          .from('user_backups')
          .delete()
          .eq('id', backupId);
      
      logInfo('Backup deleted: $backupId');
      return true;
    }, operationName: 'deleteBackup');
  }
  
  /// Get total backup storage used.
  Future<Result<int>> getStorageUsed() async {
    return execute(() async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return 0;
      
      final result = await _supabase
          .from('user_backups')
          .select('size_bytes')
          .eq('user_id', userId);
      
      final total = (result as List)
          .fold<int>(0, (sum, row) => sum + (row['size_bytes'] as int? ?? 0));
      
      return total;
    }, operationName: 'getStorageUsed');
  }
  
  // Private backup methods with paginated fetching
  
  /// Backup chat messages using cursor-based pagination to avoid memory issues.
  Future<List<Map<String, dynamic>>> _backupChatMessages(
    String userId,
    void Function(double, String)? onProgress,
  ) async {
    final List<Map<String, dynamic>> allMessages = [];
    String? cursor;
    const pageSize = 500;
    var pageCount = 0;
    
    while (true) {
      var query = _supabase
          .from('messages')
          .select()
          .eq('sender_id', userId)
          .order('created_at', ascending: false)
          .limit(pageSize);
      
      if (cursor != null) {
        query = query.lt('created_at', cursor);
      }
      
      final messages = await query;
      if (messages.isEmpty) break;
      
      allMessages.addAll(List<Map<String, dynamic>>.from(messages));
      pageCount++;
      
      // Update progress
      onProgress?.call(
        0.1 + (0.3 * (pageCount / 20).clamp(0, 1)), // Estimate ~20 pages max
        'Backing up messages (page $pageCount)...',
      );
      
      // Get cursor for next page
      final lastMsg = messages.last as Map;
      cursor = lastMsg['created_at'] as String?;
      
      // Safety limit: max 10,000 messages (20 pages * 500)
      if (pageCount >= 20) {
        logInfo('Backup reached message limit', metadata: {'total': allMessages.length});
        break;
      }
    }
    
    logDbOperation('SELECT', 'messages', rowCount: allMessages.length);
    return allMessages;
  }
  
  Future<List<Map<String, dynamic>>> _backupChatMedia(
    String userId,
    bool includeUrls,
    void Function(double, String)? onProgress,
  ) async {
    final messages = await _supabase
        .from('messages')
        .select('id, attachments, created_at')
        .eq('sender_id', userId)
        .not('attachments', 'is', null)
        .order('created_at', ascending: false);
    
    return List<Map<String, dynamic>>.from(messages);
  }
  
  Future<Map<String, dynamic>> _backupProfile(
    String userId,
    void Function(double, String)? onProgress,
  ) async {
    final profile = await _supabase
        .from('user_profiles')
        .select()
        .eq('id', userId)
        .maybeSingle();
    
    return profile ?? {};
  }
  
  Future<Map<String, dynamic>> _backupPreferences(
    String userId,
    void Function(double, String)? onProgress,
  ) async {
    final prefs = await _supabase
        .from('user_preferences')
        .select()
        .eq('user_id', userId)
        .maybeSingle();
    
    return prefs ?? {};
  }
  
  void _updateProgress(
    double value,
    String message,
    void Function(double, String)? callback,
  ) {
    progress.value = value;
    status.value = message;
    callback?.call(value, message);
  }
}
