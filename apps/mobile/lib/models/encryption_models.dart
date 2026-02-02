import 'dart:convert';
import 'dart:typed_data';

/// Represents an X25519 key pair for E2E encryption
class EncryptionKeyPair {
  final Uint8List publicKey;
  final Uint8List privateKey;
  final String keyId;
  final DateTime createdAt;
  final DateTime? expiresAt;

  const EncryptionKeyPair({
    required this.publicKey,
    required this.privateKey,
    required this.keyId,
    required this.createdAt,
    this.expiresAt,
  });

  /// Base64 encoded public key for storage/transmission
  String get publicKeyBase64 => base64Encode(publicKey);

  /// Base64 encoded private key for secure storage
  String get privateKeyBase64 => base64Encode(privateKey);

  /// Create from base64 encoded strings
  factory EncryptionKeyPair.fromBase64({
    required String publicKeyBase64,
    required String privateKeyBase64,
    required String keyId,
    required DateTime createdAt,
    DateTime? expiresAt,
  }) {
    return EncryptionKeyPair(
      publicKey: base64Decode(publicKeyBase64),
      privateKey: base64Decode(privateKeyBase64),
      keyId: keyId,
      createdAt: createdAt,
      expiresAt: expiresAt,
    );
  }

  /// Check if key pair is expired
  bool get isExpired => expiresAt != null && DateTime.now().isAfter(expiresAt!);

  /// Check if key pair is valid
  bool get isValid => !isExpired && publicKey.isNotEmpty && privateKey.isNotEmpty;

  Map<String, dynamic> toJson() => {
        'public_key': publicKeyBase64,
        'private_key': privateKeyBase64,
        'key_id': keyId,
        'created_at': createdAt.toIso8601String(),
        'expires_at': expiresAt?.toIso8601String(),
      };

  factory EncryptionKeyPair.fromJson(Map<String, dynamic> json) {
    return EncryptionKeyPair.fromBase64(
      publicKeyBase64: json['public_key'] as String,
      privateKeyBase64: json['private_key'] as String,
      keyId: json['key_id'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
      expiresAt: json['expires_at'] != null
          ? DateTime.parse(json['expires_at'] as String)
          : null,
    );
  }
}

/// Represents an encrypted message with all metadata needed for decryption
class EncryptedMessage {
  final String ciphertext; // Base64 encoded ciphertext
  final String nonce; // Base64 encoded 12-byte nonce (IV)
  final String senderPublicKey; // Base64 sender's public key
  final int encryptionVersion;
  final String? authTag; // Base64 GCM auth tag (usually appended to ciphertext)

  const EncryptedMessage({
    required this.ciphertext,
    required this.nonce,
    required this.senderPublicKey,
    this.encryptionVersion = 1,
    this.authTag,
  });

  /// Get ciphertext as bytes
  Uint8List get ciphertextBytes => base64Decode(ciphertext);

  /// Get nonce as bytes
  Uint8List get nonceBytes => base64Decode(nonce);

  /// Get sender public key as bytes
  Uint8List get senderPublicKeyBytes => base64Decode(senderPublicKey);

  Map<String, dynamic> toJson() => {
        'ciphertext': ciphertext,
        'nonce': nonce,
        'sender_public_key': senderPublicKey,
        'encryption_version': encryptionVersion,
        'auth_tag': authTag,
      };

  factory EncryptedMessage.fromJson(Map<String, dynamic> json) {
    return EncryptedMessage(
      ciphertext: json['ciphertext'] as String? ?? json['content'] as String,
      nonce: json['nonce'] as String,
      senderPublicKey: json['sender_public_key'] as String,
      encryptionVersion: json['encryption_version'] as int? ?? 1,
      authTag: json['auth_tag'] as String?,
    );
  }

  /// Create from message row (for decryption)
  factory EncryptedMessage.fromMessageRow(Map<String, dynamic> row) {
    return EncryptedMessage(
      ciphertext: row['content'] as String,
      nonce: row['nonce'] as String,
      senderPublicKey: row['sender_public_key'] as String,
      encryptionVersion: row['encryption_version'] as int? ?? 1,
    );
  }
}

/// Public key bundle for a user (for key exchange)
class UserKeyBundle {
  final String oderId;
  final String publicKey; // Base64 identity public key
  final String keyId;
  final DateTime createdAt;
  final bool isActive;

  const UserKeyBundle({
    required this.oderId,
    required this.publicKey,
    required this.keyId,
    required this.createdAt,
    this.isActive = true,
  });

  Uint8List get publicKeyBytes => base64Decode(publicKey);

  Map<String, dynamic> toJson() => {
        'user_id': oderId,
        'public_key': publicKey,
        'key_id': keyId,
        'created_at': createdAt.toIso8601String(),
        'is_active': isActive,
      };

  factory UserKeyBundle.fromJson(Map<String, dynamic> json) {
    return UserKeyBundle(
      oderId: json['user_id'] as String,
      publicKey: json['public_key'] as String,
      keyId: json['key_id'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
      isActive: json['is_active'] as bool? ?? true,
    );
  }
}

/// Encrypted group key for a member
class GroupEncryptionKey {
  final String groupId;
  final String memberId;
  final String encryptedKey; // Group key encrypted with member's public key
  final String nonce; // Nonce used for encryption
  final String senderPublicKey; // Public key of the user who encrypted the group key
  final int keyVersion;
  final DateTime createdAt;

  const GroupEncryptionKey({
    required this.groupId,
    required this.memberId,
    required this.encryptedKey,
    required this.nonce,
    required this.senderPublicKey,
    required this.keyVersion,
    required this.createdAt,
  });

  Map<String, dynamic> toJson() => {
        'group_id': groupId,
        'member_id': memberId,
        'encrypted_key': encryptedKey,
        'nonce': nonce,
        'sender_public_key': senderPublicKey,
        'key_version': keyVersion,
        'created_at': createdAt.toIso8601String(),
      };

  factory GroupEncryptionKey.fromJson(Map<String, dynamic> json) {
    return GroupEncryptionKey(
      groupId: json['group_id'] as String,
      memberId: json['member_id'] as String,
      encryptedKey: json['encrypted_key'] as String,
      nonce: json['nonce'] as String? ?? '',
      senderPublicKey: json['sender_public_key'] as String? ?? '',
      keyVersion: json['key_version'] as int? ?? 1,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}

/// Encryption status for a chat/channel
enum EncryptionStatus {
  encrypted,
  transportOnly,
  legacy,
  failed,
}

extension EncryptionStatusExtension on EncryptionStatus {
  String get label {
    switch (this) {
      case EncryptionStatus.encrypted:
        return 'End-to-End Encrypted';
      case EncryptionStatus.transportOnly:
        return 'Transport Encryption Only';
      case EncryptionStatus.legacy:
        return 'Legacy (Unencrypted)';
      case EncryptionStatus.failed:
        return 'Encryption Failed';
    }
  }

  String get shortLabel {
    switch (this) {
      case EncryptionStatus.encrypted:
        return 'E2E';
      case EncryptionStatus.transportOnly:
        return 'TLS';
      case EncryptionStatus.legacy:
        return 'None';
      case EncryptionStatus.failed:
        return 'Error';
    }
  }

  bool get isSecure => this == EncryptionStatus.encrypted;
}

/// Result of an encryption/decryption operation
class EncryptionResult<T> {
  final T? data;
  final String? error;
  final bool success;

  const EncryptionResult._({
    this.data,
    this.error,
    required this.success,
  });

  factory EncryptionResult.success(T data) => EncryptionResult._(
        data: data,
        success: true,
      );

  factory EncryptionResult.failure(String error) => EncryptionResult._(
        error: error,
        success: false,
      );

  /// Map result to another type
  EncryptionResult<R> map<R>(R Function(T data) mapper) {
    if (success && data != null) {
      return EncryptionResult.success(mapper(data as T));
    }
    return EncryptionResult.failure(error ?? 'Unknown error');
  }
}
