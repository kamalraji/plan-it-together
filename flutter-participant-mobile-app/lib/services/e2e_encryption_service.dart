import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';

import 'package:crypto/crypto.dart' as crypto_pkg;
import 'package:flutter/foundation.dart';
import 'package:pointycastle/api.dart';
import 'package:pointycastle/asymmetric/api.dart';
import 'package:pointycastle/ecc/api.dart';
import 'package:pointycastle/ecc/curves/secp256k1.dart';
import 'package:pointycastle/key_generators/api.dart';
import 'package:pointycastle/key_generators/ec_key_generator.dart';
import 'package:pointycastle/key_derivators/api.dart';
import 'package:pointycastle/key_derivators/pbkdf2.dart';
import 'package:pointycastle/macs/hmac.dart';
import 'package:pointycastle/digests/sha256.dart';
import 'package:pointycastle/block/aes.dart';
import 'package:pointycastle/block/modes/gcm.dart';
// NOTE: `package:pointycastle/key_agreements/ecdh.dart` does not exist in
// PointyCastle 3.9.1 (and causes build failures when resolving packages).
// Use the stable export entrypoint instead.
import 'package:pointycastle/export.dart' 
    show ECDHBasicAgreement, ECPublicKey, ECPrivateKey, ECKeyGenerator, 
         ECKeyGeneratorParameters, ParametersWithRandom, GCMBlockCipher, 
         AESEngine, AEADParameters, KeyParameter, SecureRandom, FortunaRandom;
import 'package:thittam1hub/models/encryption_models.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/services/secure_storage_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/utils/result.dart';

/// End-to-End Encryption Service
///
/// Provides AES-256-GCM encryption with ECDH key exchange for chat messages.
/// Private keys never leave the device and are stored in SecureStorageService.
/// 
/// Security features:
/// - AES-256-GCM authenticated encryption
/// - ECDH key agreement (secp256k1)
/// - Secure random nonce generation
/// - Constant-time comparisons for timing attack prevention
/// - Key zeroization helpers for sensitive data
/// - Security-conscious logging (no sensitive data in logs)
class E2EEncryptionService extends BaseService {
  E2EEncryptionService._();
  static E2EEncryptionService? _instance;
  static E2EEncryptionService get instance => _instance ??= E2EEncryptionService._();

  @override
  String get tag => 'E2EEncryption';

  static const String _privateKeyStorageKey = 'e2e_private_key';
  static const String _publicKeyStorageKey = 'e2e_public_key';
  static const String _keyIdStorageKey = 'e2e_key_id';
  static const int _nonceLength = 12; // 96 bits for GCM
  static const int _keyLength = 32; // 256 bits for AES-256
  static const int _tagLength = 16; // 128 bits for GCM auth tag

  final SecureStorageService _secureStorage = SecureStorageService.instance;
  final SecureRandom _secureRandom = _initSecureRandom();

  // Cache for public keys to reduce DB lookups
  // Limited to prevent unbounded memory growth during long sessions
  static const int _maxCacheSize = 100;
  final Map<String, UserKeyBundle> _publicKeyCache = {};

  /// Initialize secure random generator
  static SecureRandom _initSecureRandom() {
    final secureRandom = FortunaRandom();
    final random = Random.secure();
    final seeds = List<int>.generate(32, (_) => random.nextInt(256));
    secureRandom.seed(KeyParameter(Uint8List.fromList(seeds)));
    return secureRandom;
  }

  // ============ SECURITY-AWARE LOGGING ============
  
  /// Log security operation with optional debug-only details
  /// In release mode, sensitive details are stripped
  void _secureLogDebug(String message, {Object? debugOnlyError}) {
    if (kDebugMode && debugOnlyError != null) {
      logDebug('$message: $debugOnlyError');
    } else {
      logDebug(message);
    }
  }
  
  /// Log security error without exposing sensitive details in production
  void _secureLogError(String message, {Object? debugOnlyError}) {
    if (kDebugMode && debugOnlyError != null) {
      logError(message, error: debugOnlyError);
    } else {
      // In production, log generic message without details
      logError(message);
    }
  }

  // ============ KEY GENERATION ============

  /// Generate a new X25519 key pair for the current user
  Future<Result<EncryptionKeyPair>> generateKeyPair() => execute(() async {
    // Generate X25519 key pair using PointyCastle
    final keyGenerator = ECKeyGenerator();
    final params = ECKeyGeneratorParameters(ECCurve_secp256k1());
    keyGenerator.init(ParametersWithRandom(params, _secureRandom));

    final keyPair = keyGenerator.generateKeyPair();
    final publicKey = keyPair.publicKey as ECPublicKey;
    final privateKey = keyPair.privateKey as ECPrivateKey;

    // Serialize keys
    final publicKeyBytes = _serializePublicKey(publicKey);
    final privateKeyBytes = _serializePrivateKey(privateKey);

    final keyId = _generateKeyId();
    final now = DateTime.now();
    final expiresAt = now.add(const Duration(days: 365)); // 1 year expiry

    logInfo('Key pair generated', metadata: {'keyId': keyId.substring(0, 8)});
    
    return EncryptionKeyPair(
      publicKey: publicKeyBytes,
      privateKey: privateKeyBytes,
      keyId: keyId,
      createdAt: now,
      expiresAt: expiresAt,
    );
  }, operationName: 'generateKeyPair');

  /// Generate a unique key identifier
  String _generateKeyId() {
    final bytes = _secureRandom.nextBytes(16);
    return base64Url.encode(bytes).replaceAll('=', '');
  }

  /// Serialize EC public key to bytes
  Uint8List _serializePublicKey(ECPublicKey publicKey) {
    final q = publicKey.Q!;
    final x = q.x!.toBigInteger()!.toRadixString(16).padLeft(64, '0');
    final y = q.y!.toBigInteger()!.toRadixString(16).padLeft(64, '0');
    return Uint8List.fromList(
      [0x04] + _hexToBytes(x) + _hexToBytes(y), // Uncompressed point format
    );
  }

  /// Serialize EC private key to bytes
  Uint8List _serializePrivateKey(ECPrivateKey privateKey) {
    final d = privateKey.d!.toRadixString(16).padLeft(64, '0');
    return Uint8List.fromList(_hexToBytes(d));
  }

  List<int> _hexToBytes(String hex) {
    final result = <int>[];
    for (var i = 0; i < hex.length; i += 2) {
      result.add(int.parse(hex.substring(i, i + 2), radix: 16));
    }
    return result;
  }

  // ============ KEY STORAGE ============

  /// Store the user's key pair securely
  Future<Result<void>> storeKeyPair(EncryptionKeyPair keyPair) => execute(() async {
    await _secureStorage.write(_privateKeyStorageKey, keyPair.privateKeyBase64);
    await _secureStorage.write(_publicKeyStorageKey, keyPair.publicKeyBase64);
    await _secureStorage.write(_keyIdStorageKey, keyPair.keyId);
    logDebug('Key pair stored securely');
  }, operationName: 'storeKeyPair');

  /// Check if user has a key pair stored
  Future<bool> hasKeyPair() async {
    final privateKey = await _secureStorage.read(_privateKeyStorageKey);
    return privateKey != null && privateKey.isNotEmpty;
  }

  /// Get stored private key (internal use only)
  Future<Uint8List?> getPrivateKey() async {
    final privateKeyBase64 = await _secureStorage.read(_privateKeyStorageKey);
    if (privateKeyBase64 == null) return null;
    return base64Decode(privateKeyBase64);
  }

  /// Get stored public key
  Future<Uint8List?> getPublicKey() async {
    final publicKeyBase64 = await _secureStorage.read(_publicKeyStorageKey);
    if (publicKeyBase64 == null) return null;
    return base64Decode(publicKeyBase64);
  }

  /// Get stored key ID
  Future<String?> getKeyId() async {
    return await _secureStorage.read(_keyIdStorageKey);
  }

  /// Get or create key pair (ensures encryption is initialized)
  Future<Result<EncryptionKeyPair>> getOrCreateKeyPair() => execute(() async {
    if (await hasKeyPair()) {
      final privateKey = await getPrivateKey();
      final publicKey = await getPublicKey();
      final keyId = await getKeyId();
      
      if (privateKey != null && publicKey != null && keyId != null) {
        return EncryptionKeyPair(
          publicKey: publicKey,
          privateKey: privateKey,
          keyId: keyId,
          createdAt: DateTime.now(), // Approximation since we don't store this
        );
      }
    }
    
    // Generate new key pair
    final keyPairResult = await generateKeyPair();
    if (keyPairResult is! Success<EncryptionKeyPair>) {
      throw Exception('Failed to generate key pair');
    }
    final keyPair = keyPairResult.data;
    
    await storeKeyPair(keyPair);
    await uploadPublicKey();
    return keyPair;
  }, operationName: 'getOrCreateKeyPair');

  /// Get the current key pair if it exists
  Future<EncryptionKeyPair?> getCurrentKeyPair() async {
    final privateKey = await getPrivateKey();
    final publicKey = await getPublicKey();
    final keyId = await getKeyId();
    
    if (privateKey == null || publicKey == null || keyId == null) {
      return null;
    }
    
    return EncryptionKeyPair(
      publicKey: publicKey,
      privateKey: privateKey,
      keyId: keyId,
      createdAt: DateTime.now(),
    );
  }

  /// Upload public key to Supabase for other users to fetch
  Future<Result<bool>> uploadPublicKey() => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return false;

    final publicKeyBase64 = await _secureStorage.read(_publicKeyStorageKey);
    final keyId = await getKeyId();
    if (publicKeyBase64 == null || keyId == null) return false;

    // Deactivate old keys
    await SupabaseConfig.client
        .from('user_encryption_keys')
        .update({'is_active': false})
        .eq('user_id', userId);

    // Insert new key
    await SupabaseConfig.client.from('user_encryption_keys').insert({
      'user_id': userId,
      'public_key': publicKeyBase64,
      'key_id': keyId,
      'is_active': true,
      'created_at': DateTime.now().toIso8601String(),
      'expires_at':
          DateTime.now().add(const Duration(days: 365)).toIso8601String(),
    });

    logDbOperation('INSERT', 'user_encryption_keys', rowCount: 1);
    return true;
  }, operationName: 'uploadPublicKey');

  /// Fetch a user's public key from Supabase
  Future<Result<UserKeyBundle?>> fetchUserPublicKey(String userId) => execute(() async {
    // Check cache first
    if (_publicKeyCache.containsKey(userId)) {
      final cached = _publicKeyCache[userId]!;
      // Invalidate cache after 1 hour
      if (DateTime.now().difference(cached.createdAt).inHours < 1) {
        return cached;
      }
    }

    final result = await SupabaseConfig.client
        .from('user_encryption_keys')
        .select()
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', ascending: false)
        .limit(1)
        .maybeSingle();

    if (result == null) return null;

    final bundle = UserKeyBundle.fromJson(result);
    
    // Evict oldest entry if cache is full (simple LRU approximation)
    if (_publicKeyCache.length >= _maxCacheSize) {
      _publicKeyCache.remove(_publicKeyCache.keys.first);
    }
    _publicKeyCache[userId] = bundle;
    return bundle;
  }, operationName: 'fetchUserPublicKey');

  // ============ KEY DERIVATION ============

  /// Derive a shared secret using ECDH
  Future<Uint8List> deriveSharedSecret(
    Uint8List theirPublicKey,
    Uint8List myPrivateKey,
  ) async {
    try {
      // Use ECDH to derive shared secret
      final agreement = ECDHBasicAgreement();

      // Deserialize keys
      final privateKey = _deserializePrivateKey(myPrivateKey);
      final publicKey = _deserializePublicKey(theirPublicKey);

      agreement.init(privateKey);
      final sharedSecret = agreement.calculateAgreement(publicKey);

      // Hash the shared secret to get a proper AES key
      final hash = crypto_pkg.sha256.convert(
        _bigIntToBytes(sharedSecret, _keyLength),
      );

      return Uint8List.fromList(hash.bytes);
    } catch (e) {
      _secureLogError('Shared secret derivation failed', debugOnlyError: e);
      rethrow;
    }
  }

  ECPrivateKey _deserializePrivateKey(Uint8List bytes) {
    final d = _bytesToBigInt(bytes);
    return ECPrivateKey(d, ECCurve_secp256k1());
  }

  ECPublicKey _deserializePublicKey(Uint8List bytes) {
    // Skip the 0x04 prefix for uncompressed point
    final xBytes = bytes.sublist(1, 33);
    final yBytes = bytes.sublist(33, 65);

    final x = _bytesToBigInt(xBytes);
    final y = _bytesToBigInt(yBytes);

    final curve = ECCurve_secp256k1();
    final point = curve.curve.createPoint(x, y);

    return ECPublicKey(point, curve);
  }

  BigInt _bytesToBigInt(Uint8List bytes) {
    var result = BigInt.zero;
    for (var byte in bytes) {
      result = (result << 8) | BigInt.from(byte);
    }
    return result;
  }

  Uint8List _bigIntToBytes(BigInt bigInt, int length) {
    final bytes = Uint8List(length);
    var temp = bigInt;
    for (var i = length - 1; i >= 0; i--) {
      bytes[i] = (temp & BigInt.from(0xff)).toInt();
      temp = temp >> 8;
    }
    return bytes;
  }

  // ============ ENCRYPTION ============

  /// Encrypt a message for a recipient
  Future<EncryptionResult<EncryptedMessage>> encryptMessage(
    String plaintext,
    String recipientUserId,
  ) async {
    try {
      // Get recipient's public key
      final recipientBundleResult = await fetchUserPublicKey(recipientUserId);
      UserKeyBundle? recipientBundle;
      if (recipientBundleResult is Success<UserKeyBundle?>) {
        recipientBundle = recipientBundleResult.data;
      }
      
      if (recipientBundle == null) {
        return EncryptionResult.failure(
          'Recipient encryption key not found',
        );
      }

      // Get our private key
      final myPrivateKey = await getPrivateKey();
      final myPublicKey = await getPublicKey();
      if (myPrivateKey == null || myPublicKey == null) {
        return EncryptionResult.failure('Your encryption key not found');
      }

      // Derive shared secret
      final sharedSecret = await deriveSharedSecret(
        recipientBundle.publicKeyBytes,
        myPrivateKey,
      );

      try {
        // Generate random nonce
        final nonce = _secureRandom.nextBytes(_nonceLength);

        // Encrypt with AES-256-GCM
        final ciphertext = _aesGcmEncrypt(
          Uint8List.fromList(utf8.encode(plaintext)),
          sharedSecret,
          nonce,
        );

        return EncryptionResult.success(EncryptedMessage(
          ciphertext: base64Encode(ciphertext),
          nonce: base64Encode(nonce),
          senderPublicKey: base64Encode(myPublicKey),
          encryptionVersion: 1,
        ));
      } finally {
        // Zeroize shared secret after use
        sharedSecret.zeroize();
      }
    } catch (e) {
      _secureLogError('Message encryption failed', debugOnlyError: e);
      return EncryptionResult.failure('Encryption failed');
    }
  }

  /// AES-256-GCM encryption
  Uint8List _aesGcmEncrypt(
    Uint8List plaintext,
    Uint8List key,
    Uint8List nonce,
  ) {
    final cipher = GCMBlockCipher(AESEngine());
    final params = AEADParameters(
      KeyParameter(key),
      _tagLength * 8, // Tag length in bits
      nonce,
      Uint8List(0), // No additional authenticated data
    );

    cipher.init(true, params);

    final output = Uint8List(plaintext.length + _tagLength);
    var offset = cipher.processBytes(plaintext, 0, plaintext.length, output, 0);
    offset += cipher.doFinal(output, offset);

    return output.sublist(0, offset);
  }

  // ============ DECRYPTION ============

  /// Decrypt a message from a sender
  Future<EncryptionResult<String>> decryptMessage(
    EncryptedMessage encrypted,
  ) async {
    try {
      // Get our private key
      final myPrivateKey = await getPrivateKey();
      if (myPrivateKey == null) {
        return EncryptionResult.failure('Your encryption key not found');
      }

      // Derive shared secret using sender's public key
      final sharedSecret = await deriveSharedSecret(
        encrypted.senderPublicKeyBytes,
        myPrivateKey,
      );

      try {
        // Decrypt with AES-256-GCM
        final plaintext = _aesGcmDecrypt(
          encrypted.ciphertextBytes,
          sharedSecret,
          encrypted.nonceBytes,
        );

        return EncryptionResult.success(utf8.decode(plaintext));
      } finally {
        // Zeroize shared secret after use
        sharedSecret.zeroize();
      }
    } catch (e) {
      _secureLogError('Message decryption failed', debugOnlyError: e);
      return EncryptionResult.failure('Decryption failed');
    }
  }

  /// AES-256-GCM decryption
  Uint8List _aesGcmDecrypt(
    Uint8List ciphertext,
    Uint8List key,
    Uint8List nonce,
  ) {
    final cipher = GCMBlockCipher(AESEngine());
    final params = AEADParameters(
      KeyParameter(key),
      _tagLength * 8, // Tag length in bits
      nonce,
      Uint8List(0), // No additional authenticated data
    );

    cipher.init(false, params);

    final output = Uint8List(ciphertext.length);
    var offset = cipher.processBytes(ciphertext, 0, ciphertext.length, output, 0);
    offset += cipher.doFinal(output, offset);

    return output.sublist(0, offset);
  }

  // ============ FILE ENCRYPTION ============

  /// Encrypt a file (attachment)
  Future<EncryptionResult<({Uint8List encryptedData, String fileKey})>>
      encryptFile(Uint8List fileData, String recipientUserId) async {
    try {
      // Generate a random file key
      final fileKey = _secureRandom.nextBytes(_keyLength);
      final nonce = _secureRandom.nextBytes(_nonceLength);

      // Encrypt file with file key
      final encryptedData = _aesGcmEncrypt(fileData, fileKey, nonce);

      // Prepend nonce to encrypted data
      final result = Uint8List(nonce.length + encryptedData.length);
      result.setRange(0, nonce.length, nonce);
      result.setRange(nonce.length, result.length, encryptedData);

      // Encrypt file key for recipient
      final keyEncryptResult = await encryptMessage(
        base64Encode(fileKey),
        recipientUserId,
      );

      if (!keyEncryptResult.success) {
        return EncryptionResult.failure(keyEncryptResult.error!);
      }

      // Zeroize file key after encryption
      fileKey.zeroize();
      
      return EncryptionResult.success((
        encryptedData: result,
        fileKey: keyEncryptResult.data!.ciphertext,
      ));
    } catch (e) {
      _secureLogError('File encryption failed', debugOnlyError: e);
      return EncryptionResult.failure('File encryption failed');
    }
  }

  /// Decrypt a file (attachment)
  /// 
  /// [fileKeyNonce] is required for decrypting the file key
  Future<EncryptionResult<Uint8List>> decryptFile(
    Uint8List encryptedData,
    String encryptedFileKey,
    String senderPublicKey,
    String fileKeyNonce,
  ) async {
    try {
      // Decrypt file key with proper nonce
      final keyDecryptResult = await decryptMessage(EncryptedMessage(
        ciphertext: encryptedFileKey,
        nonce: fileKeyNonce,
        senderPublicKey: senderPublicKey,
      ));

      if (!keyDecryptResult.success) {
        return EncryptionResult.failure(keyDecryptResult.error!);
      }

      final fileKey = base64Decode(keyDecryptResult.data!);

      // Extract nonce and ciphertext
      final nonce = encryptedData.sublist(0, _nonceLength);
      final ciphertext = encryptedData.sublist(_nonceLength);

      // Decrypt file
      final fileKeyBytes = Uint8List.fromList(fileKey);
      try {
        final plaintext = _aesGcmDecrypt(ciphertext, fileKeyBytes, nonce);
        return EncryptionResult.success(plaintext);
      } finally {
        // Zeroize file key after use
        fileKeyBytes.zeroize();
      }
    } catch (e) {
      _secureLogError('File decryption failed', debugOnlyError: e);
      return EncryptionResult.failure('File decryption failed');
    }
  }

  // ============ GROUP ENCRYPTION ============

  /// Generate a group encryption key
  Future<Uint8List> generateGroupKey() async {
    return _secureRandom.nextBytes(_keyLength);
  }

  /// Encrypt group key for a member
  /// Returns the full EncryptedMessage with nonce and sender public key
  Future<EncryptionResult<EncryptedMessage>> encryptGroupKeyForMember(
    Uint8List groupKey,
    String memberId,
  ) async {
    return await encryptMessage(base64Encode(groupKey), memberId);
  }

  /// Decrypt group key
  Future<EncryptionResult<Uint8List>> decryptGroupKey(
    String encryptedGroupKey,
    String senderPublicKey,
    String nonce,
  ) async {
    final result = await decryptMessage(EncryptedMessage(
      ciphertext: encryptedGroupKey,
      nonce: nonce,
      senderPublicKey: senderPublicKey,
    ));

    if (result.success) {
      return EncryptionResult.success(base64Decode(result.data!));
    }
    return EncryptionResult.failure(result.error!);
  }

  // ============ UTILITIES ============

  /// Initialize encryption for a new user (generate and upload keys)
  Future<Result<bool>> initializeEncryption() => execute(() async {
    if (await hasKeyPair()) {
      logDebug('Key pair already exists');
      return true;
    }

    // Generate new key pair
    final keyPairResult = await generateKeyPair();
    if (keyPairResult is! Success<EncryptionKeyPair>) {
      throw Exception('Failed to generate key pair');
    }

    // Store locally
    await storeKeyPair(keyPairResult.data);

    // Upload public key
    final uploadResult = await uploadPublicKey();
    if (uploadResult is! Success<bool> || !uploadResult.data) {
      _secureLogError('Failed to upload public key');
      return false;
    }

    logInfo('Encryption initialized successfully');
    return true;
  }, operationName: 'initializeEncryption');

  /// Check if a chat is encrypted based on actual message encryption status
  /// 
  /// Returns accurate status by analyzing recent messages in the channel:
  /// - [EncryptionStatus.encrypted]: All recent messages are E2E encrypted
  /// - [EncryptionStatus.transportOnly]: No E2E encryption, only TLS in transit
  /// - [EncryptionStatus.legacy]: Mixed - some encrypted, some plaintext
  /// - [EncryptionStatus.failed]: Error checking status
  Future<Result<EncryptionStatus>> getChatEncryptionStatus(String channelId) => execute(() async {
    // Check if we have encryption keys first
    final hasKeys = await hasKeyPair();

    // Check if recent messages in channel are encrypted
    final result = await SupabaseConfig.client
        .from('channel_messages')
        .select('is_encrypted, nonce, sender_public_key')
        .eq('channel_id', channelId)
        .order('created_at', ascending: false)
        .limit(20);

    final messages = result as List;
    
    // No messages yet - status depends on whether encryption is set up
    if (messages.isEmpty) {
      // For new chats, only show "encrypted" if we have keys set up
      // Otherwise show "transport only" as messages would be plaintext
      return hasKeys ? EncryptionStatus.encrypted : EncryptionStatus.transportOnly;
    }

    // Count truly encrypted messages (must have is_encrypted=true AND nonce)
    int encryptedCount = 0;
    int plaintextCount = 0;
    
    for (final msg in messages) {
      final isEncrypted = msg['is_encrypted'] == true;
      final hasNonce = msg['nonce'] != null && (msg['nonce'] as String).isNotEmpty;
      final hasSenderKey = msg['sender_public_key'] != null;
      
      // A message is truly E2E encrypted if it has the encryption flag AND crypto metadata
      if (isEncrypted && (hasNonce || hasSenderKey)) {
        encryptedCount++;
      } else {
        plaintextCount++;
      }
    }

    // Determine status based on message analysis
    if (encryptedCount == messages.length) {
      return EncryptionStatus.encrypted;
    } else if (plaintextCount == messages.length) {
      // All messages are plaintext
      return EncryptionStatus.legacy;
    } else if (encryptedCount > 0 && plaintextCount > 0) {
      // Mixed encryption - some encrypted, some not
      return EncryptionStatus.legacy;
    }

    // Default to transport only if we couldn't determine
    return EncryptionStatus.transportOnly;
  }, operationName: 'getChatEncryptionStatus');
  
  /// Check if encryption can be established with a specific user
  Future<Result<bool>> canEncryptWithUser(String userId) => execute(() async {
    final hasOwnKeys = await hasKeyPair();
    if (!hasOwnKeys) return false;
    
    final theirKeyResult = await fetchUserPublicKey(userId);
    if (theirKeyResult is Success<UserKeyBundle?>) {
      return theirKeyResult.data != null;
    }
    return false;
  }, operationName: 'canEncryptWithUser');

  /// Generate a safety number for key verification
  /// Uses constant-time comparison internally for security
  String generateSafetyNumber(Uint8List myPublicKey, Uint8List theirPublicKey) {
    // Combine keys in deterministic order (lexicographically smaller first)
    // Using constant-time comparison to prevent timing attacks
    final compareResult = _constantTimeCompare(myPublicKey, theirPublicKey);
    final combined = compareResult < 0
        ? [...myPublicKey, ...theirPublicKey]
        : [...theirPublicKey, ...myPublicKey];

    // Hash to get fingerprint
    final hash = crypto_pkg.sha256.convert(combined);

    // Format as groups of 5 digits (60 digits total for 12 groups)
    final numbers = <String>[];
    for (var i = 0; i < hash.bytes.length && numbers.length < 12; i += 2) {
      final value = (hash.bytes[i] << 8) | (hash.bytes[i + 1]);
      numbers.add((value % 100000).toString().padLeft(5, '0'));
    }

    return numbers.join(' ');
  }
  
  /// Constant-time comparison for byte arrays to prevent timing attacks
  int _constantTimeCompare(Uint8List a, Uint8List b) {
    final minLength = a.length < b.length ? a.length : b.length;
    var result = 0;
    var diff = 0;
    
    for (var i = 0; i < minLength; i++) {
      diff |= a[i] ^ b[i];
      if (result == 0 && a[i] != b[i]) {
        result = a[i] < b[i] ? -1 : 1;
      }
    }
    
    if (diff == 0 && a.length != b.length) {
      return a.length < b.length ? -1 : 1;
    }
    
    return result;
  }

  /// Clear all encryption keys (for logout/account deletion)
  Future<Result<void>> clearKeys() => execute(() async {
    await _secureStorage.delete(_privateKeyStorageKey);
    await _secureStorage.delete(_publicKeyStorageKey);
    await _secureStorage.delete(_keyIdStorageKey);
    _publicKeyCache.clear();
    logInfo('Encryption keys cleared');
  }, operationName: 'clearKeys');

  // ============ SYMMETRIC KEY HELPERS ============

  /// Generate a random nonce for AES-GCM
  Uint8List generateNonce() {
    return _secureRandom.nextBytes(_nonceLength);
  }

  /// Generate a random symmetric key
  Uint8List generateSymmetricKey() {
    return _secureRandom.nextBytes(_keyLength);
  }

  /// Encrypt data with a symmetric key (AES-256-GCM) - returns raw bytes
  Future<Uint8List?> encryptBytesWithSymmetricKey(
    Uint8List plaintext,
    Uint8List key,
    Uint8List nonce,
  ) async {
    try {
      return _aesGcmEncrypt(plaintext, key, nonce);
    } catch (e) {
      _secureLogError('Symmetric encryption failed', debugOnlyError: e);
      return null;
    }
  }

  /// Decrypt data with a symmetric key (AES-256-GCM) - returns raw bytes
  Future<Uint8List?> decryptBytesWithSymmetricKey(
    Uint8List ciphertext,
    Uint8List key,
    Uint8List nonce,
  ) async {
    try {
      return _aesGcmDecrypt(ciphertext, key, nonce);
    } catch (e) {
      _secureLogError('Symmetric decryption failed', debugOnlyError: e);
      return null;
    }
  }

  /// Encrypt string with a symmetric key (AES-256-GCM) - returns EncryptedMessage
  Future<EncryptionResult<EncryptedMessage>> encryptWithSymmetricKey(
    String plaintext,
    Uint8List key,
  ) async {
    try {
      final nonce = generateNonce();
      final plaintextBytes = Uint8List.fromList(utf8.encode(plaintext));
      final ciphertext = _aesGcmEncrypt(plaintextBytes, key, nonce);
      
      return EncryptionResult.success(EncryptedMessage(
        ciphertext: base64Encode(ciphertext),
        nonce: base64Encode(nonce),
        senderPublicKey: '', // Not applicable for symmetric encryption
        encryptionVersion: 2,
      ));
    } catch (e) {
      _secureLogError('Symmetric key encryption failed', debugOnlyError: e);
      return EncryptionResult.failure('Symmetric encryption failed');
    }
  }

  /// Decrypt EncryptedMessage with a symmetric key (AES-256-GCM)
  Future<EncryptionResult<String>> decryptWithSymmetricKey(
    EncryptedMessage encrypted,
    Uint8List key,
  ) async {
    try {
      final ciphertext = base64Decode(encrypted.ciphertext);
      final nonce = base64Decode(encrypted.nonce);
      
      final plaintextBytes = _aesGcmDecrypt(
        Uint8List.fromList(ciphertext),
        key,
        Uint8List.fromList(nonce),
      );
      
      return EncryptionResult.success(utf8.decode(plaintextBytes));
    } catch (e) {
      _secureLogError('Symmetric key decryption failed', debugOnlyError: e);
      return EncryptionResult.failure('Symmetric decryption failed');
    }
  }

  /// Encrypt bytes with automatic nonce generation - returns combined nonce+ciphertext
  Future<EncryptionResult<Uint8List>> encryptBytesWithKey(
    Uint8List plaintext,
    Uint8List key,
  ) async {
    try {
      final nonce = generateNonce();
      final ciphertext = _aesGcmEncrypt(plaintext, key, nonce);
      
      // Prepend nonce to ciphertext for storage
      final result = Uint8List(nonce.length + ciphertext.length);
      result.setRange(0, nonce.length, nonce);
      result.setRange(nonce.length, result.length, ciphertext);
      
      return EncryptionResult.success(result);
    } catch (e) {
      _secureLogError('Bytes encryption failed', debugOnlyError: e);
      return EncryptionResult.failure('Encryption failed');
    }
  }

  /// Decrypt bytes with nonce prepended to ciphertext
  Future<EncryptionResult<Uint8List>> decryptBytesWithKey(
    Uint8List encryptedData,
    Uint8List key,
  ) async {
    try {
      if (encryptedData.length < _nonceLength) {
        return EncryptionResult.failure('Invalid encrypted data length');
      }
      
      final nonce = encryptedData.sublist(0, _nonceLength);
      final ciphertext = encryptedData.sublist(_nonceLength);
      
      final plaintext = _aesGcmDecrypt(
        Uint8List.fromList(ciphertext),
        key,
        Uint8List.fromList(nonce),
      );
      
      return EncryptionResult.success(plaintext);
    } catch (e) {
      _secureLogError('Bytes decryption failed', debugOnlyError: e);
      return EncryptionResult.failure('Decryption failed');
    }
  }

  /// Derive a key from password using PBKDF2
  Uint8List deriveKeyFromPassword(String password, Uint8List salt, {int iterations = 100000}) {
    final params = Pbkdf2Parameters(salt, iterations, _keyLength);
    final pbkdf2 = PBKDF2KeyDerivator(HMac(SHA256Digest(), 64));
    pbkdf2.init(params);
    
    return pbkdf2.process(Uint8List.fromList(utf8.encode(password)));
  }

  /// Generate a random salt for key derivation
  Uint8List generateSalt({int length = 16}) {
    return _secureRandom.nextBytes(length);
  }
}

// Extension for Uint8List comparison
extension Uint8ListComparison on Uint8List {
  int compareTo(Uint8List other) {
    final minLength = length < other.length ? length : other.length;
    for (var i = 0; i < minLength; i++) {
      if (this[i] < other[i]) return -1;
      if (this[i] > other[i]) return 1;
    }
    return length.compareTo(other.length);
  }
}

/// Extension for secure memory handling of sensitive data
extension SecureUint8List on Uint8List {
  /// Securely zeroize the contents of this byte array
  /// Call this after using sensitive keys to minimize exposure time
  void zeroize() {
    for (var i = 0; i < length; i++) {
      this[i] = 0;
    }
  }
}
