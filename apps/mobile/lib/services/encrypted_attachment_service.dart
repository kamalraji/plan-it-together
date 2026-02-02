import 'dart:convert';
import 'dart:typed_data';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/models/encryption_models.dart';
import 'package:thittam1hub/services/e2e_encryption_service.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/utils/result.dart';

/// Service for encrypting and uploading chat attachments with E2E encryption
class EncryptedAttachmentService extends BaseService {
  @override
  String get tag => 'EncryptedAttachment';
  
  static EncryptedAttachmentService? _instance;
  static EncryptedAttachmentService get instance => _instance ??= EncryptedAttachmentService._();
  EncryptedAttachmentService._();

  static const String _encryptedMediaBucket = 'encrypted-media';
  final _supabase = SupabaseConfig.client;
  final _encryptionService = E2EEncryptionService.instance;

  /// Upload an encrypted file for a specific recipient
  /// 
  /// Returns encrypted attachment metadata including:
  /// - url: Public URL to encrypted blob
  /// - encryptedFileKey: File decryption key encrypted for recipient
  /// - nonce: Encryption nonce for the file
  Future<Result<EncryptedAttachmentResult>> uploadEncryptedFile({
    required Uint8List fileBytes,
    required String fileName,
    required String mimeType,
    required String recipientUserId,
    void Function(double)? onProgress,
  }) => execute(
    () async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      onProgress?.call(0.1);

      // Encrypt the file
      final encryptResult = await _encryptionService.encryptFile(fileBytes, recipientUserId);
      
      if (!encryptResult.success || encryptResult.data == null) {
        throw Exception('Encryption failed: ${encryptResult.error}');
      }

      final encryptedData = encryptResult.data!.encryptedData;
      final encryptedFileKey = encryptResult.data!.fileKey;

      onProgress?.call(0.5);

      // Generate unique file path
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final sanitizedName = fileName.replaceAll(RegExp(r'[^a-zA-Z0-9_.]'), '_');
      final path = 'chat/$userId/$recipientUserId/${timestamp}_$sanitizedName.enc';

      // Upload encrypted blob to Supabase Storage
      await _supabase.storage
          .from(_encryptedMediaBucket)
          .uploadBinary(path, encryptedData, fileOptions: FileOptions(
            contentType: 'application/octet-stream', // Always binary for encrypted files
            upsert: true,
          ));

      onProgress?.call(0.9);

      // Get public URL
      final publicUrl = _supabase.storage
          .from(_encryptedMediaBucket)
          .getPublicUrl(path);

      onProgress?.call(1.0);

      logInfo('Encrypted file uploaded: ${_formatSize(encryptedData.length)}');

      return EncryptedAttachmentResult(
        url: publicUrl,
        encryptedFileKey: encryptedFileKey,
        originalMimeType: mimeType,
        originalFileName: fileName,
        originalSize: fileBytes.length,
        encryptedSize: encryptedData.length,
      );
    },
    operationName: 'uploadEncryptedFile',
  );

  /// Upload an encrypted file for a group chat
  /// 
  /// The file is encrypted with a group-specific key that all members can decrypt
  Future<Result<EncryptedGroupAttachmentResult>> uploadEncryptedGroupFile({
    required Uint8List fileBytes,
    required String fileName,
    required String mimeType,
    required String groupId,
    required Uint8List groupKey,
    void Function(double)? onProgress,
  }) => execute(
    () async {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      onProgress?.call(0.1);

      // Generate a random file key
      final fileKey = await _encryptionService.generateGroupKey();
      
      // Encrypt the file with the file key
      final encryptedFile = await _encryptFileWithKey(fileBytes, fileKey);
      if (encryptedFile == null) {
        throw Exception('Failed to encrypt file for group');
      }

      onProgress?.call(0.4);

      // Encrypt the file key with the group key
      final encryptedFileKey = await _encryptKeyWithGroupKey(fileKey, groupKey);
      if (encryptedFileKey == null) {
        throw Exception('Failed to encrypt file key');
      }

      onProgress?.call(0.6);

      // Generate unique file path
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final sanitizedName = fileName.replaceAll(RegExp(r'[^a-zA-Z0-9_.]'), '_');
      final path = 'groups/$groupId/${timestamp}_$sanitizedName.enc';

      // Upload encrypted blob
      await _supabase.storage
          .from(_encryptedMediaBucket)
          .uploadBinary(path, encryptedFile.ciphertext, fileOptions: FileOptions(
            contentType: 'application/octet-stream',
            upsert: true,
          ));

      onProgress?.call(0.9);

      final publicUrl = _supabase.storage
          .from(_encryptedMediaBucket)
          .getPublicUrl(path);

      onProgress?.call(1.0);

      logInfo('Encrypted group file uploaded: ${_formatSize(encryptedFile.ciphertext.length)}');

      return EncryptedGroupAttachmentResult(
        url: publicUrl,
        encryptedFileKey: encryptedFileKey,
        nonce: base64Encode(encryptedFile.nonce),
        originalMimeType: mimeType,
        originalFileName: fileName,
        originalSize: fileBytes.length,
        encryptedSize: encryptedFile.ciphertext.length,
      );
    },
    operationName: 'uploadEncryptedGroupFile',
  );

  /// Download and decrypt an encrypted attachment
  /// 
  /// [fileKeyNonce] is required for decrypting the file key
  Future<Result<DecryptedAttachment>> downloadAndDecrypt({
    required String encryptedUrl,
    required String encryptedFileKey,
    required String senderPublicKey,
    required String fileKeyNonce,
  }) => execute(
    () async {
      // Download encrypted blob
      final response = await _supabase.storage
          .from(_encryptedMediaBucket)
          .download(_extractPathFromUrl(encryptedUrl));

      // Decrypt the file with proper nonce
      final decryptResult = await _encryptionService.decryptFile(
        response,
        encryptedFileKey,
        senderPublicKey,
        fileKeyNonce,
      );

      if (!decryptResult.success || decryptResult.data == null) {
        throw Exception('Decryption failed');
      }

      logDebug('File decrypted successfully');

      return DecryptedAttachment(
        bytes: decryptResult.data!,
        decryptedAt: DateTime.now(),
      );
    },
    operationName: 'downloadAndDecrypt',
  );

  /// Download and decrypt a group encrypted attachment
  Future<Result<DecryptedAttachment>> downloadAndDecryptGroupFile({
    required String encryptedUrl,
    required String encryptedFileKey,
    required String nonce,
    required Uint8List groupKey,
  }) => execute(
    () async {
      // Download encrypted blob
      final encryptedBytes = await _supabase.storage
          .from(_encryptedMediaBucket)
          .download(_extractPathFromUrl(encryptedUrl));

      // Decrypt the file key with group key
      final fileKey = await _decryptKeyWithGroupKey(encryptedFileKey, groupKey);
      if (fileKey == null) {
        throw Exception('Failed to decrypt file key');
      }

      // Decrypt the file with the file key
      final decryptedBytes = await _decryptFileWithKey(
        encryptedBytes,
        fileKey,
        base64Decode(nonce),
      );

      if (decryptedBytes == null) {
        throw Exception('Failed to decrypt file');
      }

      logDebug('Group file decrypted successfully');

      return DecryptedAttachment(
        bytes: decryptedBytes,
        decryptedAt: DateTime.now(),
      );
    },
    operationName: 'downloadAndDecryptGroupFile',
  );

  // ========== Helper Methods ==========

  String _extractPathFromUrl(String url) {
    // Extract storage path from public URL
    final uri = Uri.parse(url);
    final pathSegments = uri.pathSegments;
    
    // Find 'encrypted-media' bucket index and get everything after
    final bucketIndex = pathSegments.indexOf('encrypted-media');
    if (bucketIndex >= 0 && bucketIndex < pathSegments.length - 1) {
      return pathSegments.sublist(bucketIndex + 1).join('/');
    }
    
    // Fallback: return last segment
    return pathSegments.last;
  }

  String _formatSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  /// Encrypt file with a symmetric key (for group files)
  Future<({Uint8List ciphertext, Uint8List nonce})?> _encryptFileWithKey(
    Uint8List plaintext,
    Uint8List key,
  ) async {
    try {
      // Use the encryption service's bytes encryption which prepends nonce
      final result = await _encryptionService.encryptBytesWithKey(plaintext, key);
      
      if (!result.success || result.data == null) {
        logWarning('Encrypt file with key failed: ${result.error}');
        return null;
      }
      
      // encryptBytesWithKey prepends 12-byte nonce to ciphertext
      final combined = result.data!;
      final nonce = combined.sublist(0, 12);
      final ciphertext = combined.sublist(12);
      
      return (ciphertext: ciphertext, nonce: nonce);
    } catch (e) {
      logError('Encrypt with symmetric key failed', error: e);
      return null;
    }
  }

  /// Decrypt file with a symmetric key
  Future<Uint8List?> _decryptFileWithKey(
    Uint8List ciphertext,
    Uint8List key,
    Uint8List nonce,
  ) async {
    try {
      // Use the bytes decryption method which expects raw ciphertext
      final result = await _encryptionService.decryptBytesWithSymmetricKey(
        ciphertext,
        key,
        nonce,
      );
      return result;
    } catch (e) {
      logError('Decrypt with symmetric key failed', error: e);
      return null;
    }
  }

  /// Encrypt a key using the group key
  Future<String?> _encryptKeyWithGroupKey(Uint8List fileKey, Uint8List groupKey) async {
    try {
      // Use encryptBytesWithKey which handles nonce internally
      final result = await _encryptionService.encryptBytesWithKey(fileKey, groupKey);
      
      if (!result.success || result.data == null) {
        logWarning('Encrypt key with group key failed: ${result.error}');
        return null;
      }
      
      // Result already contains nonce + ciphertext combined
      return base64Encode(result.data!);
    } catch (e) {
      logError('Encrypt key with group key failed', error: e);
      return null;
    }
  }

  /// Decrypt a key using the group key
  Future<Uint8List?> _decryptKeyWithGroupKey(String encryptedKey, Uint8List groupKey) async {
    try {
      final combined = base64Decode(encryptedKey);
      
      // Split nonce and ciphertext (nonce is 12 bytes for GCM)
      final nonce = combined.sublist(0, 12);
      final ciphertext = combined.sublist(12);
      
      return await _encryptionService.decryptWithSymmetricKey(ciphertext, groupKey, nonce);
    } catch (e) {
      logError('Decrypt key with group key failed', error: e);
      return null;
    }
  }
}

/// Result of encrypting and uploading an attachment for DM
class EncryptedAttachmentResult {
  final String url;
  final String encryptedFileKey;
  final String originalMimeType;
  final String originalFileName;
  final int originalSize;
  final int encryptedSize;

  const EncryptedAttachmentResult({
    required this.url,
    required this.encryptedFileKey,
    required this.originalMimeType,
    required this.originalFileName,
    required this.originalSize,
    required this.encryptedSize,
  });

  Map<String, dynamic> toAttachmentJson() => {
    'url': url,
    'encrypted_file_key': encryptedFileKey,
    'mime_type': originalMimeType,
    'file_name': originalFileName,
    'original_size': originalSize,
    'encrypted_size': encryptedSize,
    'is_encrypted': true,
  };
}

/// Result of encrypting and uploading an attachment for group chat
class EncryptedGroupAttachmentResult {
  final String url;
  final String encryptedFileKey;
  final String nonce;
  final String originalMimeType;
  final String originalFileName;
  final int originalSize;
  final int encryptedSize;

  const EncryptedGroupAttachmentResult({
    required this.url,
    required this.encryptedFileKey,
    required this.nonce,
    required this.originalMimeType,
    required this.originalFileName,
    required this.originalSize,
    required this.encryptedSize,
  });

  Map<String, dynamic> toAttachmentJson() => {
    'url': url,
    'encrypted_file_key': encryptedFileKey,
    'nonce': nonce,
    'mime_type': originalMimeType,
    'file_name': originalFileName,
    'original_size': originalSize,
    'encrypted_size': encryptedSize,
    'is_encrypted': true,
  };
}

/// Decrypted attachment ready for display/save
class DecryptedAttachment {
  final Uint8List bytes;
  final DateTime decryptedAt;

  const DecryptedAttachment({
    required this.bytes,
    required this.decryptedAt,
  });
}
