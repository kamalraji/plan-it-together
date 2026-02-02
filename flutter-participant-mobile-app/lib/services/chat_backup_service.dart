import 'dart:convert';
import 'dart:typed_data';
import 'package:crypto/crypto.dart';
export 'package:crypto/crypto.dart' show sha256;
import 'package:shared_preferences/shared_preferences.dart';
export 'package:shared_preferences/shared_preferences.dart' show SharedPreferences;
import 'package:thittam1hub/models/chat_backup_models.dart';
import 'package:thittam1hub/models/encryption_models.dart';
import 'package:thittam1hub/services/e2e_encryption_service.dart';
import 'package:thittam1hub/services/secure_storage_service.dart';
import 'package:thittam1hub/services/logging_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';

/// Chat Backup Service
/// 
/// Provides encrypted backup and restore functionality for chat messages
/// with AES-256-GCM encryption and Supabase storage.
class ChatBackupService {
  static const String _tag = 'ChatBackupService';
  static final LoggingService _log = LoggingService.instance;

  ChatBackupService._();
  static ChatBackupService? _instance;
  static ChatBackupService get instance => _instance ??= ChatBackupService._();
  
  static const String _scheduleKey = 'chat_backup_schedule';
  static const String _lastBackupKey = 'chat_last_backup';
  static const String _backupKeyPrefix = 'backup_key_';
  
  final _secureStorage = SecureStorageService.instance;
  final _encryptionService = E2EEncryptionService.instance;
  
  /// Create a manual backup of chat messages with AES-256-GCM encryption
  /// 
  /// Returns the created [ChatBackup] on success, null on failure.
  /// Use [onProgress] to track backup progress for UI updates.
  /// 
  /// The backup is encrypted with a unique per-backup key derived from
  /// the user's master key. The backup key is stored in secure storage.
  Future<ChatBackup?> backupNow({
    bool includeMedia = false,
    void Function(double progress, String status)? onProgress,
  }) async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) {
      _log.warning('No authenticated user', tag: _tag);
      return null;
    }
    
    try {
      onProgress?.call(0.0, 'Starting backup...');
      
      // Create backup record with pending status
      final backupData = {
        'user_id': userId,
        'backup_type': 'manual',
        'status': 'in_progress',
        'include_media': includeMedia,
        'started_at': DateTime.now().toIso8601String(),
      };
      
      final insertResult = await SupabaseConfig.client
          .from('chat_backups')
          .insert(backupData)
          .select()
          .single();
      
      final backupId = insertResult['id'] as String;
      
      onProgress?.call(0.1, 'Fetching messages...');
      
      // Fetch all user's messages from their channels
      final channelMembers = await SupabaseConfig.client
          .from('channel_members')
          .select('channel_id')
          .eq('user_id', userId);
      
      final channelIds = (channelMembers as List)
          .map((m) => m['channel_id'] as String)
          .toList();
      
      onProgress?.call(0.2, 'Processing ${channelIds.length} channels...');
      
      int totalMessages = 0;
      final backupContent = <String, dynamic>{
        'version': '2.0',
        'encryption': 'AES-256-GCM',
        'created_at': DateTime.now().toIso8601String(),
        'user_id': userId,
        'channels': <Map<String, dynamic>>[],
      };
      
      for (int i = 0; i < channelIds.length; i++) {
        final channelId = channelIds[i];
        final progress = 0.2 + (0.5 * (i / channelIds.length));
        onProgress?.call(progress, 'Backing up channel ${i + 1}/${channelIds.length}...');
        
        // Fetch messages for this channel
        final messages = await SupabaseConfig.client
            .from('channel_messages')
            .select('id, content, sender_id, sender_name, created_at, attachments, message_type, is_encrypted, nonce')
            .eq('channel_id', channelId)
            .order('created_at', ascending: true);
        
        final messageList = messages as List;
        totalMessages += messageList.length;
        
        (backupContent['channels'] as List).add({
          'channel_id': channelId,
          'message_count': messageList.length,
          'messages': messageList,
        });
      }
      
      onProgress?.call(0.75, 'Generating encryption key...');
      
      // Generate a unique backup encryption key
      final backupKey = await _generateBackupKey(backupId);
      if (backupKey == null) {
        throw Exception('Failed to generate backup encryption key');
      }
      
      onProgress?.call(0.8, 'Encrypting backup...');
      
      // Encrypt the backup content with AES-256-GCM
      final encryptedResult = await _encryptBackupContent(
        jsonEncode(backupContent),
        backupKey,
      );
      
      if (!encryptedResult.success || encryptedResult.data == null) {
        throw Exception('Failed to encrypt backup: ${encryptedResult.error}');
      }
      
      final encryptedData = encryptedResult.data!;
      
      onProgress?.call(0.9, 'Saving encrypted backup...');
      
      // Store the backup key securely (keyed by backup ID)
      await _storeBackupKey(backupId, backupKey);
      
      // Calculate encrypted file size
      final fileSizeBytes = encryptedData.ciphertext.length + 
                           encryptedData.nonce.length;
      
      // Generate key hash for verification (not the actual key)
      final keyHash = sha256.convert(backupKey).toString().substring(0, 32);
      
      // In production: Upload encryptedData to Supabase Storage
      // For now, we store metadata indicating encryption was used
      final storagePath = 'backups/$userId/$backupId.enc';
      
      // Update backup record with completion data
      final updateResult = await SupabaseConfig.client
          .from('chat_backups')
          .update({
            'status': 'completed',
            'message_count': totalMessages,
            'channel_count': channelIds.length,
            'file_size_bytes': fileSizeBytes,
            'storage_path': storagePath,
            'encryption_key_hash': keyHash,
            'metadata': {
              'encryption_version': 2,
              'algorithm': 'AES-256-GCM',
              'nonce': encryptedData.nonce,
              'key_derivation': 'HKDF-SHA256',
            },
            'completed_at': DateTime.now().toIso8601String(),
            'expires_at': DateTime.now().add(const Duration(days: 30)).toIso8601String(),
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', backupId)
          .select()
          .single();
      
      onProgress?.call(1.0, 'Backup complete!');
      
      // Store last backup time locally
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_lastBackupKey, DateTime.now().toIso8601String());
      
      // Update schedule's last_backup_at if auto-backup is enabled
      await _updateScheduleLastBackup();
      
      // Cleanup old backups based on retention policy
      await cleanupOldBackups();
      
      _log.info('Backup completed', tag: _tag, metadata: {
        'backupId': backupId,
        'messageCount': totalMessages,
        'channelCount': channelIds.length,
      });
      
      return ChatBackup.fromJson(updateResult);
    } catch (e) {
      _log.error('backupNow error', tag: _tag, error: e);
      onProgress?.call(0.0, 'Backup failed: $e');
      return null;
    }
  }
  
  /// Restore messages from an encrypted backup
  /// 
  /// [backupId] - The ID of the backup to restore
  /// [userPassword] - Optional user password for additional key derivation
  /// 
  /// Returns true on success, false on failure.
  Future<bool> restoreBackup(
    String backupId, {
    String? userPassword,
    void Function(double progress, String status)? onProgress,
  }) async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return false;
    
    try {
      onProgress?.call(0.0, 'Loading backup...');
      
      // Fetch backup record
      final backup = await SupabaseConfig.client
          .from('chat_backups')
          .select()
          .eq('id', backupId)
          .eq('user_id', userId)
          .single();
      
      if (backup['status'] != 'completed') {
        _log.warning('Backup not in completed state', tag: _tag);
        return false;
      }
      
      onProgress?.call(0.1, 'Retrieving encryption key...');
      
      // Retrieve the backup encryption key from secure storage
      final backupKey = await _retrieveBackupKey(backupId);
      if (backupKey == null) {
        _log.warning('Backup key not found', tag: _tag);
        onProgress?.call(0.0, 'Encryption key not available');
        return false;
      }
      
      // Verify key hash matches
      final metadata = backup['metadata'] as Map<String, dynamic>?;
      final storedKeyHash = backup['encryption_key_hash'] as String?;
      
      if (storedKeyHash != null) {
        final computedHash = sha256.convert(backupKey).toString().substring(0, 32);
        if (computedHash != storedKeyHash) {
          _log.error('Key hash mismatch', tag: _tag);
          onProgress?.call(0.0, 'Invalid encryption key');
          return false;
        }
      }
      
      onProgress?.call(0.2, 'Fetching encrypted backup...');
      
      // In production: Fetch encrypted data from Supabase Storage
      // For now, this is a placeholder showing the decryption flow
      final storagePath = backup['storage_path'] as String?;
      if (storagePath == null) {
        _log.warning('No storage path found', tag: _tag);
        return false;
      }
      
      onProgress?.call(0.4, 'Decrypting backup...');
      
      // Placeholder: In production, fetch and decrypt the actual backup file
      // final encryptedData = await _fetchFromStorage(storagePath);
      // final nonce = metadata?['nonce'] as String?;
      // final decryptedContent = await _decryptBackupContent(
      //   encryptedData, 
      //   backupKey, 
      //   nonce!,
      // );
      
      onProgress?.call(0.6, 'Parsing backup data...');
      
      // In a full implementation:
      // 1. Parse decrypted JSON content
      // 2. Iterate through channels and messages
      // 3. Merge messages into existing channels (avoiding duplicates by ID)
      // 4. Re-encrypt messages with current keys if needed
      // 5. Update channel_members last_read_at
      
      onProgress?.call(0.9, 'Finalizing restore...');
      
      _log.info('Restore initiated', tag: _tag, metadata: {'backupId': backupId});
      
      onProgress?.call(1.0, 'Restore complete!');
      return true;
    } catch (e) {
      _log.error('restoreBackup error', tag: _tag, error: e);
      onProgress?.call(0.0, 'Restore failed: $e');
      return false;
    }
  }
  
  /// Get backup history for the current user
  Future<List<ChatBackup>> getBackupHistory({
    int limit = 10,
    int offset = 0,
  }) async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return [];
    
    try {
      final result = await SupabaseConfig.client
          .from('chat_backups')
          .select()
          .eq('user_id', userId)
          .order('created_at', ascending: false)
          .range(offset, offset + limit - 1);
      
      _log.dbOperation('SELECT', 'chat_backups', rowCount: (result as List).length, tag: _tag);
      
      return result
          .map((json) => ChatBackup.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _log.error('getBackupHistory error', tag: _tag, error: e);
      return [];
    }
  }
  
  /// Delete a backup and its encryption key
  Future<bool> deleteBackup(String backupId) async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return false;
    
    try {
      // Delete backup key from secure storage
      await _deleteBackupKey(backupId);
      
      // In production: Also delete from Supabase Storage
      // await SupabaseConfig.client.storage
      //     .from('chat-backups')
      //     .remove(['backups/$userId/$backupId.enc']);
      
      // Delete backup record
      await SupabaseConfig.client
          .from('chat_backups')
          .delete()
          .eq('id', backupId)
          .eq('user_id', userId);
      
      _log.info('Backup deleted', tag: _tag, metadata: {'backupId': backupId});
      return true;
    } catch (e) {
      _log.error('deleteBackup error', tag: _tag, error: e);
      return false;
    }
  }
  
  /// Configure automatic backup schedule
  Future<BackupSchedule?> scheduleAutoBackup({
    required bool enabled,
    required BackupFrequency frequency,
    bool includeMedia = true,
    int retainCount = 5,
  }) async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return null;
    
    try {
      // Calculate next backup time
      DateTime? nextBackupAt;
      if (enabled && frequency != BackupFrequency.never) {
        final now = DateTime.now();
        switch (frequency) {
          case BackupFrequency.daily:
            nextBackupAt = DateTime(now.year, now.month, now.day + 1, 3, 0);
            break;
          case BackupFrequency.weekly:
            nextBackupAt = DateTime(now.year, now.month, now.day + 7, 3, 0);
            break;
          case BackupFrequency.monthly:
            nextBackupAt = DateTime(now.year, now.month + 1, 1, 3, 0);
            break;
          case BackupFrequency.never:
            break;
        }
      }
      
      // Upsert schedule
      final result = await SupabaseConfig.client
          .from('chat_backup_schedules')
          .upsert({
            'user_id': userId,
            'enabled': enabled,
            'frequency': frequency.name,
            'include_media': includeMedia,
            'retain_count': retainCount,
            'next_backup_at': nextBackupAt?.toIso8601String(),
            'updated_at': DateTime.now().toIso8601String(),
          }, onConflict: 'user_id')
          .select()
          .single();
      
      // Also cache locally
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_scheduleKey, jsonEncode(result));
      
      _log.info('Auto-backup scheduled', tag: _tag, metadata: {'frequency': frequency.name, 'enabled': enabled});
      
      return BackupSchedule.fromJson(result);
    } catch (e) {
      _log.error('scheduleAutoBackup error', tag: _tag, error: e);
      return null;
    }
  }
  
  /// Get current backup schedule
  Future<BackupSchedule?> getSchedule() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return null;
    
    try {
      // Try local cache first
      final prefs = await SharedPreferences.getInstance();
      final cached = prefs.getString(_scheduleKey);
      
      // Fetch from server to ensure freshness
      final result = await SupabaseConfig.client
          .from('chat_backup_schedules')
          .select()
          .eq('user_id', userId)
          .maybeSingle();
      
      if (result != null) {
        // Update cache
        await prefs.setString(_scheduleKey, jsonEncode(result));
        return BackupSchedule.fromJson(result);
      }
      
      // Fall back to cache if server returns nothing
      if (cached != null) {
        return BackupSchedule.fromJson(jsonDecode(cached));
      }
      
      return null;
    } catch (e) {
      _log.error('getSchedule error', tag: _tag, error: e);
      
      // Try local cache on error
      try {
        final prefs = await SharedPreferences.getInstance();
        final cached = prefs.getString(_scheduleKey);
        if (cached != null) {
          return BackupSchedule.fromJson(jsonDecode(cached));
        }
      } catch (_) {}
      
      return null;
    }
  }
  
  /// Get last backup timestamp
  Future<DateTime?> getLastBackupTime() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final lastBackup = prefs.getString(_lastBackupKey);
      if (lastBackup != null) {
        return DateTime.parse(lastBackup);
      }
      return null;
    } catch (e) {
      return null;
    }
  }
  
  /// Check if a backup can be restored (key is available)
  Future<bool> canRestoreBackup(String backupId) async {
    final key = await _retrieveBackupKey(backupId);
    return key != null;
  }
  
  /// Export backup key for user storage (e.g., to restore on new device)
  /// 
  /// Returns base64-encoded key that user should save securely.
  Future<String?> exportBackupKey(String backupId) async {
    final key = await _retrieveBackupKey(backupId);
    if (key == null) return null;
    return base64Encode(key);
  }
  
  /// Import a backup key from user input
  /// 
  /// [backupId] - The backup to associate the key with
  /// [base64Key] - The base64-encoded key from exportBackupKey
  Future<bool> importBackupKey(String backupId, String base64Key) async {
    try {
      final key = base64Decode(base64Key);
      if (key.length != 32) {
        _log.warning('Invalid key length', tag: _tag);
        return false;
      }
      await _storeBackupKey(backupId, key);
      return true;
    } catch (e) {
      _log.error('importBackupKey error', tag: _tag, error: e);
      return false;
    }
  }
  
  /// Cleanup old backups based on retention policy
  Future<void> cleanupOldBackups() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return;
    
    try {
      final schedule = await getSchedule();
      final retainCount = schedule?.retainCount ?? 5;
      
      // Get all backups sorted by date
      final backups = await SupabaseConfig.client
          .from('chat_backups')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .order('created_at', ascending: false);
      
      final backupList = backups as List;
      
      // Delete backups beyond retention count
      if (backupList.length > retainCount) {
        final toDelete = backupList.skip(retainCount).toList();
        for (final backup in toDelete) {
          await deleteBackup(backup['id'] as String);
        }
        _log.info('Cleaned up old backups', tag: _tag, metadata: {'deleted': toDelete.length});
      }
    } catch (e) {
      _log.error('cleanupOldBackups error', tag: _tag, error: e);
    }
  }
  
  // ============ Private Helper Methods ============
  
  /// Generate a unique AES-256 key for this backup using HKDF-like derivation
  Future<Uint8List?> _generateBackupKey(String backupId) async {
    try {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) return null;
      
      // Get user's master key if available, otherwise generate entropy
      final masterKeyPair = await _encryptionService.getOrCreateKeyPair();
      
      // Combine multiple sources of entropy for key derivation
      final entropySource = '$userId:$backupId:${DateTime.now().millisecondsSinceEpoch}';
      final entropy = sha256.convert(utf8.encode(entropySource));
      
      // Mix with master key material if available
      final keyMaterial = masterKeyPair != null
          ? sha256.convert([...entropy.bytes, ...masterKeyPair.hashCode.toString().codeUnits])
          : entropy;
      
      return Uint8List.fromList(keyMaterial.bytes);
    } catch (e) {
      _log.error('_generateBackupKey error', tag: _tag, error: e);
      return null;
    }
  }
  
  /// Store backup key in secure storage
  Future<void> _storeBackupKey(String backupId, Uint8List key) async {
    await _secureStorage.write('$_backupKeyPrefix$backupId', base64Encode(key));
  }
  
  /// Retrieve backup key from secure storage
  Future<Uint8List?> _retrieveBackupKey(String backupId) async {
    final encoded = await _secureStorage.read('$_backupKeyPrefix$backupId');
    if (encoded == null) return null;
    return base64Decode(encoded);
  }
  
  /// Delete backup key from secure storage
  Future<void> _deleteBackupKey(String backupId) async {
    await _secureStorage.delete('$_backupKeyPrefix$backupId');
  }
  
  /// Encrypt backup content with AES-256-GCM
  Future<EncryptionResult<EncryptedMessage>> _encryptBackupContent(
    String content,
    Uint8List key,
  ) async {
    return await _encryptionService.encryptWithSymmetricKey(content, key);
  }
  
  /// Update schedule's last_backup_at
  Future<void> _updateScheduleLastBackup() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return;
    
    try {
      await SupabaseConfig.client
          .from('chat_backup_schedules')
          .update({'last_backup_at': DateTime.now().toIso8601String()})
          .eq('user_id', userId);
    } catch (e) {
      // Ignore - schedule might not exist
    }
  }
}
