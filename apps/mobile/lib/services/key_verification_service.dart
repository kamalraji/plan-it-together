import 'dart:convert';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/utils/result.dart';
import 'secure_storage_service.dart';
import 'e2e_encryption_service.dart';

/// Service for managing key verification status between users
class KeyVerificationService extends BaseService {
  @override
  String get tag => 'KeyVerification';
  
  static KeyVerificationService? _instance;
  static KeyVerificationService get instance => _instance ??= KeyVerificationService._();
  KeyVerificationService._();

  final SecureStorageService _secureStorage = SecureStorageService.instance;
  
  static const String _verifiedUsersKey = 'verified_users';
  static const String _verificationTimestampsKey = 'verification_timestamps';

  /// Check if a user has been verified
  Future<Result<bool>> isUserVerified(String oderId) => execute(
    () async {
      final verifiedUsers = await _getVerifiedUsers();
      return verifiedUsers.contains(oderId);
    },
    operationName: 'isUserVerified',
  );

  /// Mark a user as verified
  Future<Result<void>> markUserVerified(String oderId) => execute(
    () async {
      final verifiedUsers = await _getVerifiedUsers();
      verifiedUsers.add(oderId);
      await _saveVerifiedUsers(verifiedUsers);
      
      // Store verification timestamp
      final timestamps = await _getVerificationTimestamps();
      timestamps[oderId] = DateTime.now().toIso8601String();
      await _saveVerificationTimestamps(timestamps);
      
      logInfo('User marked as verified');
    },
    operationName: 'markUserVerified',
  );

  /// Remove verification for a user (e.g., if their key changes)
  Future<Result<void>> removeVerification(String oderId) => execute(
    () async {
      final verifiedUsers = await _getVerifiedUsers();
      verifiedUsers.remove(oderId);
      await _saveVerifiedUsers(verifiedUsers);
      
      final timestamps = await _getVerificationTimestamps();
      timestamps.remove(oderId);
      await _saveVerificationTimestamps(timestamps);
      
      logInfo('Verification removed for user');
    },
    operationName: 'removeVerification',
  );

  /// Get when a user was verified
  Future<Result<DateTime?>> getVerificationTime(String oderId) => execute(
    () async {
      final timestamps = await _getVerificationTimestamps();
      final timestamp = timestamps[oderId];
      if (timestamp != null) {
        return DateTime.tryParse(timestamp);
      }
      return null;
    },
    operationName: 'getVerificationTime',
  );

  /// Get all verified users
  Future<Set<String>> _getVerifiedUsers() async {
    final data = await _secureStorage.read(_verifiedUsersKey);
    if (data == null) return <String>{};
    
    try {
      final list = jsonDecode(data) as List;
      return list.cast<String>().toSet();
    } catch (e) {
      logWarning('Failed to parse verified users', error: e);
      return <String>{};
    }
  }

  Future<void> _saveVerifiedUsers(Set<String> users) async {
    await _secureStorage.write(_verifiedUsersKey, jsonEncode(users.toList()));
  }

  Future<Map<String, String>> _getVerificationTimestamps() async {
    final data = await _secureStorage.read(_verificationTimestampsKey);
    if (data == null) return {};
    
    try {
      final map = jsonDecode(data) as Map;
      return map.cast<String, String>();
    } catch (e) {
      logWarning('Failed to parse verification timestamps', error: e);
      return {};
    }
  }

  Future<void> _saveVerificationTimestamps(Map<String, String> timestamps) async {
    await _secureStorage.write(_verificationTimestampsKey, jsonEncode(timestamps));
  }

  /// Verify QR code data from another user
  /// Performs full cryptographic verification of keys and safety number
  Future<Result<VerificationResult>> verifyQRCode(String qrData, String expectedUserId) => execute(
    () async {
      final data = jsonDecode(qrData) as Map<String, dynamic>;
      
      if (data['type'] != 'key_verification') {
        return VerificationResult.invalidFormat;
      }
      
      final version = data['version'] as int?;
      if (version != 1) {
        return VerificationResult.versionMismatch;
      }
      
      final theirClaimedKey = data['my_key'] as String?;
      final claimedSafetyNumber = data['safety_number'] as String?;
      
      if (theirClaimedKey == null || claimedSafetyNumber == null) {
        return VerificationResult.invalidFormat;
      }
      
      // Fetch the public key we have stored for this user
      final encryptionService = E2EEncryptionService.instance;
      final storedBundleResult = await encryptionService.fetchUserPublicKey(expectedUserId);
      if (!storedBundleResult.isSuccess) {
        logWarning('Failed to fetch stored key for verification');
        return VerificationResult.keyMismatch;
      }
      final storedBundle = storedBundleResult.data;

      if (storedBundle == null) {
        logWarning('No stored key found for verification');
        return VerificationResult.keyMismatch;
      }
      
      // Constant-time compare their claimed key with what we have stored
      if (!_constantTimeEquals(theirClaimedKey, storedBundle.publicKey)) {
        logWarning('Key mismatch during verification');
        return VerificationResult.keyMismatch;
      }
      
      // Regenerate safety number to verify it matches
      final myPublicKey = await encryptionService.getPublicKey();
      if (myPublicKey == null) {
        return VerificationResult.keyMismatch;
      }
      
      final expectedSafetyNumber = encryptionService.generateSafetyNumber(
        myPublicKey,
        storedBundle.publicKeyBytes,
      );
      
      // Constant-time compare safety numbers
      if (!_constantTimeEquals(claimedSafetyNumber, expectedSafetyNumber)) {
        logWarning('Safety number mismatch during verification');
        return VerificationResult.safetyNumberMismatch;
      }
      
      logInfo('QR verification successful');
      return VerificationResult.success;
    },
    operationName: 'verifyQRCode',
  );
  
  /// Constant-time string comparison to prevent timing attacks
  bool _constantTimeEquals(String a, String b) {
    if (a.length != b.length) return false;
    var result = 0;
    for (var i = 0; i < a.length; i++) {
      result |= a.codeUnitAt(i) ^ b.codeUnitAt(i);
    }
    return result == 0;
  }

  /// Clear all verification data (for logout/key rotation)
  Future<Result<void>> clearAllVerifications() => execute(
    () async {
      await _secureStorage.delete(_verifiedUsersKey);
      await _secureStorage.delete(_verificationTimestampsKey);
      logInfo('All verifications cleared');
    },
    operationName: 'clearAllVerifications',
  );
}

enum VerificationResult {
  success,
  invalidFormat,
  versionMismatch,
  keyMismatch,
  safetyNumberMismatch,
}

extension VerificationResultExtension on VerificationResult {
  String get message {
    switch (this) {
      case VerificationResult.success:
        return 'Verification successful';
      case VerificationResult.invalidFormat:
        return 'Invalid QR code format';
      case VerificationResult.versionMismatch:
        return 'Incompatible encryption version';
      case VerificationResult.keyMismatch:
        return 'Key does not match - possible security issue';
      case VerificationResult.safetyNumberMismatch:
        return 'Safety number mismatch - verify in person';
    }
  }

  bool get isSuccess => this == VerificationResult.success;
}
