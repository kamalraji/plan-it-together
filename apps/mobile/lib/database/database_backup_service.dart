import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'dart:typed_data';

import 'package:crypto/crypto.dart';
import 'package:encrypt/encrypt.dart' as encrypt;
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:cross_file/cross_file.dart' show XFile;

import 'app_database_accessor.dart';

// Re-export encrypt types for inline usage
export 'package:encrypt/encrypt.dart' show Key, IV, AES, AESMode, Encrypter;

import 'package:thittam1hub/services/logging_service.dart';
/// Service for backing up and restoring the local message database
/// Supports encrypted exports, cloud storage, and automatic scheduling
class DatabaseBackupService {
  // Logging
   static final _log = LoggingService.instance;
   static const String _tag = 'DatabaseBackupService';

  static DatabaseBackupService? _instance;
  static DatabaseBackupService get instance => _instance ??= DatabaseBackupService._();
  
  DatabaseBackupService._();

  final AppDatabaseInterface _db = AppDatabaseAccessor.instance;

  // ==========================
  // BACKUP OPERATIONS
  // ==========================

  /// Create a full backup of the database
  /// Returns the backup data as a [BackupPackage]
  Future<BackupPackage> createBackup({
    String? password,
    bool includeDeletedMessages = false,
  }) async {
    _log.debug('📦 DatabaseBackupService: Creating backup...', tag: _tag);
    final startTime = DateTime.now();

    try {
      // 1. Gather all messages
      List<Map<String, dynamic>> messagesData = [];
      final messages = await _db.getAllMessages();
      
      for (final msg in messages) {
        if (!includeDeletedMessages && msg.isDeleted) continue;
        messagesData.add(msg.toMap());
      }

      // 2. Gather sync metadata
      final syncMeta = await _db.getAllChannelMeta();
      final syncMetaData = syncMeta.map((m) => m.toMap()).toList();

      // 3. Create backup manifest
      final manifest = BackupManifest(
        version: 1,
        createdAt: DateTime.now(),
        schemaVersion: _db.schemaVersion,
        messageCount: messagesData.length,
        channelCount: syncMetaData.length,
        isEncrypted: password != null,
        checksum: '', // Will be calculated after serialization
      );

      // 4. Serialize backup data
      final backupData = BackupData(
        manifest: manifest,
        messages: messagesData,
        syncMeta: syncMetaData,
      );

      String jsonData = jsonEncode(backupData.toJson());

      // 5. Calculate checksum
      final checksum = _calculateChecksum(jsonData);
      backupData.manifest.checksum = checksum;
      jsonData = jsonEncode(backupData.toJson());

      // 6. Encrypt if password provided
      Uint8List finalData;
      if (password != null) {
        finalData = await _encryptData(jsonData, password);
      } else {
        finalData = Uint8List.fromList(utf8.encode(jsonData));
      }

      final elapsed = DateTime.now().difference(startTime);
      _log.info('✅ DatabaseBackupService: Backup created in ${elapsed.inMilliseconds}ms', tag: _tag);
      _log.debug('   Messages: ${messagesData.length}, Channels: ${syncMetaData.length}', tag: _tag);

      return BackupPackage(
        data: finalData,
        manifest: backupData.manifest,
        isEncrypted: password != null,
      );
    } catch (e) {
      _log.error('❌ DatabaseBackupService: Backup failed: $e', tag: _tag);
      rethrow;
    }
  }

  /// Save backup to device storage
  Future<String> saveBackupToDevice(BackupPackage backup) async {
    final directory = await getApplicationDocumentsDirectory();
    final backupDir = Directory('${directory.path}/backups');
    
    if (!await backupDir.exists()) {
      await backupDir.create(recursive: true);
    }

    final timestamp = DateTime.now().toIso8601String().replaceAll(':', '-');
    final extension = backup.isEncrypted ? '.thittam.enc' : '.thittam.json';
    final fileName = 'backup_$timestamp$extension';
    final filePath = '${backupDir.path}/$fileName';

    final file = File(filePath);
    await file.writeAsBytes(backup.data);

    _log.debug('💾 DatabaseBackupService: Saved to $filePath', tag: _tag);
    return filePath;
  }

  /// Share backup file via platform share sheet
  Future<void> shareBackup(BackupPackage backup) async {
    final filePath = await saveBackupToDevice(backup);
    await Share.shareXFiles(
      [XFile(filePath)],
      subject: 'Thittam Chat Backup',
      text: 'Thittam chat backup from ${backup.manifest.createdAt.toLocal()}',
    );
  }

  /// List available local backups
  Future<List<BackupFileInfo>> listLocalBackups() async {
    final directory = await getApplicationDocumentsDirectory();
    final backupDir = Directory('${directory.path}/backups');

    if (!await backupDir.exists()) {
      return [];
    }

    final files = await backupDir.list().toList();
    final backups = <BackupFileInfo>[];

    for (final entity in files) {
      if (entity is File) {
        final name = entity.path.split('/').last;
        if (name.startsWith('backup_') && 
            (name.endsWith('.thittam.json') || name.endsWith('.thittam.enc'))) {
          final stat = await entity.stat();
          backups.add(BackupFileInfo(
            path: entity.path,
            fileName: name,
            size: stat.size,
            createdAt: stat.modified,
            isEncrypted: name.endsWith('.enc'),
          ));
        }
      }
    }

    // Sort by date, newest first
    backups.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return backups;
  }

  /// Delete old backups, keeping the most recent N
  Future<int> pruneOldBackups({int keepCount = 5}) async {
    final backups = await listLocalBackups();
    
    if (backups.length <= keepCount) return 0;

    int deleted = 0;
    for (int i = keepCount; i < backups.length; i++) {
      try {
        await File(backups[i].path).delete();
        deleted++;
      } catch (e) {
        _log.error('⚠️ DatabaseBackupService: Failed to delete ${backups[i].path}: $e', tag: _tag);
      }
    }

    _log.debug('🗑️ DatabaseBackupService: Pruned $deleted old backups', tag: _tag);
    return deleted;
  }

  // ==========================
  // RESTORE OPERATIONS
  // ==========================

  /// Restore database from backup file
  Future<RestoreResult> restoreFromFile(
    String filePath, {
    String? password,
    bool mergeWithExisting = false,
  }) async {
    _log.debug('📥 DatabaseBackupService: Restoring from $filePath...', tag: _tag);

    try {
      final file = File(filePath);
      if (!await file.exists()) {
        return RestoreResult(
          success: false,
          error: 'Backup file not found',
        );
      }

      final bytes = await file.readAsBytes();
      return restoreFromBytes(
        bytes,
        password: password,
        mergeWithExisting: mergeWithExisting,
      );
    } catch (e) {
      _log.error('❌ DatabaseBackupService: Restore failed: $e', tag: _tag);
      return RestoreResult(
        success: false,
        error: e.toString(),
      );
    }
  }

  /// Restore database from backup bytes
  Future<RestoreResult> restoreFromBytes(
    Uint8List data, {
    String? password,
    bool mergeWithExisting = false,
  }) async {
    try {
      // 1. Decrypt if needed
      String jsonData;
      if (_isEncrypted(data)) {
        if (password == null) {
          return RestoreResult(
            success: false,
            error: 'Backup is encrypted. Please provide a password.',
          );
        }
        jsonData = await _decryptData(data, password);
      } else {
        jsonData = utf8.decode(data);
      }

      // 2. Parse backup data
      final Map<String, dynamic> json = jsonDecode(jsonData);
      final backupData = BackupData.fromJson(json);

      // 3. Verify checksum
      final manifest = backupData.manifest;
      final dataWithoutChecksum = BackupData(
        manifest: BackupManifest(
          version: manifest.version,
          createdAt: manifest.createdAt,
          schemaVersion: manifest.schemaVersion,
          messageCount: manifest.messageCount,
          channelCount: manifest.channelCount,
          isEncrypted: manifest.isEncrypted,
          checksum: '',
        ),
        messages: backupData.messages,
        syncMeta: backupData.syncMeta,
      );
      
      final calculatedChecksum = _calculateChecksum(jsonEncode(dataWithoutChecksum.toJson()));
      if (calculatedChecksum != manifest.checksum) {
        return RestoreResult(
          success: false,
          error: 'Backup checksum mismatch. File may be corrupted.',
        );
      }

      // 4. Check schema compatibility
      if (manifest.schemaVersion > _db.schemaVersion) {
        return RestoreResult(
          success: false,
          error: 'Backup is from a newer app version. Please update the app.',
        );
      }

      // 5. Clear existing data if not merging
      if (!mergeWithExisting) {
        await _db.clearAll();
      }

      // 6. Restore messages
      int messagesRestored = 0;
      for (final msgMap in backupData.messages) {
        try {
          final data = CachedMessageData.fromMap(msgMap);
          await _db.upsertMessage(data);
          messagesRestored++;
        } catch (e) {
          _log.error('⚠️ DatabaseBackupService: Failed to restore message: $e', tag: _tag);
        }
      }

      // 7. Restore sync metadata
      int channelsRestored = 0;
      for (final metaMap in backupData.syncMeta) {
        try {
          final data = ChannelSyncMetaData.fromMap(metaMap);
          await _db.updateChannelMeta(data);
          channelsRestored++;
        } catch (e) {
          _log.error('⚠️ DatabaseBackupService: Failed to restore sync meta: $e', tag: _tag);
        }
      }

      // 8. Note: FTS index rebuild handled by native implementation
      // await _db.rebuildFTSIndex();

      _log.info('✅ DatabaseBackupService: Restored $messagesRestored messages, $channelsRestored channels', tag: _tag);

      return RestoreResult(
        success: true,
        messagesRestored: messagesRestored,
        channelsRestored: channelsRestored,
        backupDate: manifest.createdAt,
      );
    } catch (e) {
      _log.error('❌ DatabaseBackupService: Restore failed: $e', tag: _tag);
      return RestoreResult(
        success: false,
        error: e.toString(),
      );
    }
  }

  /// Verify a backup file without restoring
  Future<BackupVerifyResult> verifyBackup(
    String filePath, {
    String? password,
  }) async {
    try {
      final file = File(filePath);
      if (!await file.exists()) {
        return BackupVerifyResult(
          isValid: false,
          error: 'File not found',
        );
      }

      final bytes = await file.readAsBytes();
      
      // Check encryption
      final isEncrypted = _isEncrypted(bytes);
      if (isEncrypted && password == null) {
        return BackupVerifyResult(
          isValid: true, // Valid but needs password
          isEncrypted: true,
          needsPassword: true,
        );
      }

      // Decrypt and parse
      String jsonData;
      if (isEncrypted) {
        try {
          jsonData = await _decryptData(bytes, password!);
        } catch (e) {
          return BackupVerifyResult(
            isValid: false,
            isEncrypted: true,
            error: 'Invalid password',
          );
        }
      } else {
        jsonData = utf8.decode(bytes);
      }

      final json = jsonDecode(jsonData);
      final backupData = BackupData.fromJson(json);
      
      return BackupVerifyResult(
        isValid: true,
        isEncrypted: isEncrypted,
        manifest: backupData.manifest,
      );
    } catch (e) {
      return BackupVerifyResult(
        isValid: false,
        error: e.toString(),
      );
    }
  }

  // ==========================
  // AES-GCM ENCRYPTION (Industrial Standard)
  // ==========================

  /// Encrypt data using AES-256-GCM with password-derived key
  /// Format: MAGIC_HEADER(8) + SALT(16) + IV(12) + CIPHERTEXT + AUTH_TAG(16)
  Future<Uint8List> _encryptData(String data, String password) async {
    final random = Random.secure();
    
    // Generate random salt and IV
    final salt = Uint8List.fromList(
      List.generate(16, (_) => random.nextInt(256))
    );
    final iv = encrypt.IV.fromSecureRandom(12);
    
    // Derive 256-bit key using PBKDF2
    final key = _deriveKeyPBKDF2(password, salt, 32);
    final aesKey = encrypt.Key(key);
    
    // Encrypt with AES-256-GCM
    final encrypter = encrypt.Encrypter(
      encrypt.AES(aesKey, mode: encrypt.AESMode.gcm),
    );
    final encrypted = encrypter.encrypt(data, iv: iv);
    
    // Build output: MAGIC + SALT + IV + CIPHERTEXT
    final header = utf8.encode('THITTAM2'); // Version 2 header for AES-GCM
    final output = Uint8List(
      header.length + salt.length + iv.bytes.length + encrypted.bytes.length
    );
    
    int offset = 0;
    output.setRange(offset, offset + header.length, header);
    offset += header.length;
    output.setRange(offset, offset + salt.length, salt);
    offset += salt.length;
    output.setRange(offset, offset + iv.bytes.length, iv.bytes);
    offset += iv.bytes.length;
    output.setRange(offset, offset + encrypted.bytes.length, encrypted.bytes);
    
    return output;
  }

  /// Decrypt AES-256-GCM encrypted data
  Future<String> _decryptData(Uint8List data, String password) async {
    if (data.length < 36) throw Exception('Invalid encrypted data: too short');
    
    // Check for version 2 (AES-GCM) or version 1 (legacy XOR)
    final headerV2 = utf8.decode(data.sublist(0, 8), allowMalformed: true);
    
    if (headerV2 == 'THITTAM2') {
      // AES-GCM decryption
      int offset = 8;
      
      // Extract salt (16 bytes)
      final salt = data.sublist(offset, offset + 16);
      offset += 16;
      
      // Extract IV (12 bytes)
      final iv = encrypt.IV(data.sublist(offset, offset + 12));
      offset += 12;
      
      // Extract ciphertext (remaining bytes)
      final ciphertext = data.sublist(offset);
      
      // Derive key
      final key = _deriveKeyPBKDF2(password, Uint8List.fromList(salt), 32);
      final aesKey = encrypt.Key(key);
      
      // Decrypt
      final encrypter = encrypt.Encrypter(
        encrypt.AES(aesKey, mode: encrypt.AESMode.gcm),
      );
      
      try {
        final decrypted = encrypter.decrypt(
          encrypt.Encrypted(ciphertext),
          iv: iv,
        );
        return decrypted;
      } catch (e) {
        throw Exception('Decryption failed: Invalid password or corrupted data');
      }
    } else if (_isLegacyEncrypted(data)) {
      // Legacy XOR decryption for backward compatibility
      return _decryptLegacy(data, password);
    } else {
      throw Exception('Unrecognized encryption format');
    }
  }

  /// Check if data is encrypted (v1 or v2)
  bool _isEncrypted(Uint8List data) {
    if (data.length < 8) return false;
    final header = utf8.decode(data.sublist(0, 8), allowMalformed: true);
    return header == 'THITTAM2' || header.startsWith('THITTAM');
  }

  /// Check for legacy v1 encryption
  bool _isLegacyEncrypted(Uint8List data) {
    if (data.length < 8) return false;
    final header = utf8.decode(data.sublist(0, 7), allowMalformed: true);
    return header == 'THITTAM';
  }

  /// Legacy XOR decryption for backward compatibility with v1 backups
  String _decryptLegacy(Uint8List data, String password) {
    final key = _deriveKeyLegacy(password, 32);
    final decrypted = Uint8List(data.length - 8);
    
    for (int i = 0; i < decrypted.length; i++) {
      decrypted[i] = data[i + 8] ^ key[i % key.length];
    }
    
    return utf8.decode(decrypted);
  }

  /// PBKDF2 key derivation with SHA-256
  Uint8List _deriveKeyPBKDF2(String password, Uint8List salt, int length) {
    const iterations = 100000; // OWASP recommended minimum
    final passwordBytes = utf8.encode(password);
    
    // PBKDF2-HMAC-SHA256 implementation
    var block = Uint8List(salt.length + 4);
    block.setRange(0, salt.length, salt);
    
    Uint8List result = Uint8List(length);
    int generated = 0;
    int blockNum = 1;
    
    while (generated < length) {
      // Set block number (big-endian)
      block[salt.length] = (blockNum >> 24) & 0xff;
      block[salt.length + 1] = (blockNum >> 16) & 0xff;
      block[salt.length + 2] = (blockNum >> 8) & 0xff;
      block[salt.length + 3] = blockNum & 0xff;
      
      // U1 = PRF(Password, Salt || INT_32_BE(i))
      var u = Hmac(sha256, passwordBytes).convert(block).bytes;
      var xorResult = List<int>.from(u);
      
      // Uk = PRF(Password, U_{k-1})
      for (int i = 1; i < iterations; i++) {
        u = Hmac(sha256, passwordBytes).convert(u).bytes;
        for (int j = 0; j < xorResult.length; j++) {
          xorResult[j] ^= u[j];
        }
      }
      
      // Copy to result
      int toCopy = (length - generated).clamp(0, xorResult.length);
      for (int i = 0; i < toCopy; i++) {
        result[generated + i] = xorResult[i];
      }
      
      generated += toCopy;
      blockNum++;
    }
    
    return result;
  }

  /// Legacy key derivation for backward compatibility
  Uint8List _deriveKeyLegacy(String password, int length) {
    final salt = 'thittam_backup_salt_v1';
    List<int> key = utf8.encode(password + salt);
    
    for (int i = 0; i < 10000; i++) {
      key = sha256.convert(key).bytes;
    }
    
    return Uint8List.fromList(key.take(length).toList());
  }

  String _calculateChecksum(String data) {
    return sha256.convert(utf8.encode(data)).toString().substring(0, 16);
  }

  // ==========================
  // DATA CONVERSION HELPERS
  // ==========================
  // Note: Now using CachedMessageData and ChannelSyncMetaData from database_interface.dart
  // The old Entity-specific helpers have been removed in favor of the .toMap() and .fromMap() methods
}

// ==========================
// DATA MODELS
// ==========================

/// Complete backup package ready for storage/transfer
class BackupPackage {
  final Uint8List data;
  final BackupManifest manifest;
  final bool isEncrypted;

  BackupPackage({
    required this.data,
    required this.manifest,
    required this.isEncrypted,
  });

  /// Size in bytes
  int get size => data.length;
  
  /// Human-readable size
  String get sizeFormatted {
    if (size < 1024) return '$size B';
    if (size < 1024 * 1024) return '${(size / 1024).toStringAsFixed(1)} KB';
    return '${(size / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}

/// Backup metadata
class BackupManifest {
  final int version;
  final DateTime createdAt;
  final int schemaVersion;
  final int messageCount;
  final int channelCount;
  final bool isEncrypted;
  String checksum;

  BackupManifest({
    required this.version,
    required this.createdAt,
    required this.schemaVersion,
    required this.messageCount,
    required this.channelCount,
    required this.isEncrypted,
    required this.checksum,
  });

  Map<String, dynamic> toJson() => {
    'version': version,
    'createdAt': createdAt.toIso8601String(),
    'schemaVersion': schemaVersion,
    'messageCount': messageCount,
    'channelCount': channelCount,
    'isEncrypted': isEncrypted,
    'checksum': checksum,
  };

  factory BackupManifest.fromJson(Map<String, dynamic> json) => BackupManifest(
    version: json['version'] as int,
    createdAt: DateTime.parse(json['createdAt'] as String),
    schemaVersion: json['schemaVersion'] as int,
    messageCount: json['messageCount'] as int,
    channelCount: json['channelCount'] as int,
    isEncrypted: json['isEncrypted'] as bool,
    checksum: json['checksum'] as String,
  );
}

/// Internal backup data structure
class BackupData {
  final BackupManifest manifest;
  final List<Map<String, dynamic>> messages;
  final List<Map<String, dynamic>> syncMeta;

  BackupData({
    required this.manifest,
    required this.messages,
    required this.syncMeta,
  });

  Map<String, dynamic> toJson() => {
    'manifest': manifest.toJson(),
    'messages': messages,
    'syncMeta': syncMeta,
  };

  factory BackupData.fromJson(Map<String, dynamic> json) => BackupData(
    manifest: BackupManifest.fromJson(json['manifest'] as Map<String, dynamic>),
    messages: (json['messages'] as List).cast<Map<String, dynamic>>(),
    syncMeta: (json['syncMeta'] as List).cast<Map<String, dynamic>>(),
  );
}

/// Local backup file information
class BackupFileInfo {
  final String path;
  final String fileName;
  final int size;
  final DateTime createdAt;
  final bool isEncrypted;

  BackupFileInfo({
    required this.path,
    required this.fileName,
    required this.size,
    required this.createdAt,
    required this.isEncrypted,
  });

  String get sizeFormatted {
    if (size < 1024) return '$size B';
    if (size < 1024 * 1024) return '${(size / 1024).toStringAsFixed(1)} KB';
    return '${(size / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}

/// Result of a restore operation
class RestoreResult {
  final bool success;
  final int messagesRestored;
  final int channelsRestored;
  final DateTime? backupDate;
  final String? error;

  RestoreResult({
    required this.success,
    this.messagesRestored = 0,
    this.channelsRestored = 0,
    this.backupDate,
    this.error,
  });
}

/// Result of backup verification
class BackupVerifyResult {
  final bool isValid;
  final bool isEncrypted;
  final bool needsPassword;
  final BackupManifest? manifest;
  final String? error;

  BackupVerifyResult({
    required this.isValid,
    this.isEncrypted = false,
    this.needsPassword = false,
    this.manifest,
    this.error,
  });
}
