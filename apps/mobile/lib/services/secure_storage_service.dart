import 'dart:convert';
import 'dart:math';
import 'package:crypto/crypto.dart';
export 'package:crypto/crypto.dart' show sha256;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/utils/result.dart';

/// Secure storage service for sensitive data using platform encryption
/// - iOS: Keychain with first_unlock_this_device accessibility
/// - Android: EncryptedSharedPreferences (AES-256-GCM)
/// 
/// Security features:
/// - PIN stored as salted SHA-256 hash (never plaintext)
/// - Automatic lock after timeout
/// - Failed attempt tracking
/// - Secure token storage
class SecureStorageService extends BaseService {
  @override
  String get tag => 'SecureStorage';
  
  static SecureStorageService? _instance;
  static SecureStorageService get instance => _instance ??= SecureStorageService._();
  SecureStorageService._();

  // Platform-specific secure storage configuration
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
      sharedPreferencesName: 'thittam1hub_secure_prefs',
      preferencesKeyPrefix: 'thittam1hub_',
      keyCipherAlgorithm: KeyCipherAlgorithm.RSA_ECB_OAEPwithSHA_256andMGF1Padding,
      storageCipherAlgorithm: StorageCipherAlgorithm.AES_GCM_NoPadding,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
      accountName: 'com.thittam1hub.secure',
      synchronizable: false, // Don't sync to iCloud for security
    ),
    webOptions: WebOptions(
      dbName: 'thittam1hub_secure',
      publicKey: 'thittam1hub_public_key',
    ),
  );

  // Storage keys
  static const String _keyAuthToken = 'auth_token';
  static const String _keyRefreshToken = 'refresh_token';
  static const String _keyPinHash = 'pin_hash';
  static const String _keyPinSalt = 'pin_salt';
  static const String _keyBiometricEnrolled = 'biometric_enrolled';
  static const String _keyAppLockEnabled = 'app_lock_enabled';
  static const String _keyLockTimeout = 'lock_timeout';
  static const String _keyLastUnlockTime = 'last_unlock_time';
  static const String _keyTrustedDevices = 'trusted_devices';
  static const String _keyFailedAttempts = 'failed_attempts';
  static const String _keyLockedUntil = 'locked_until';
  static const String _keyEncryptionKey = 'encryption_key';
  static const String _keySessionId = 'session_id';

  // Security constants
  static const int _maxFailedAttempts = 5;
  static const int _lockDurationSeconds = 300; // 5 minutes
  static const int _saltLength = 32;

  // ========== Authentication Tokens ==========

  /// Store authentication token securely
  Future<void> storeAuthToken(String token) async {
    try {
      await _storage.write(key: _keyAuthToken, value: token);
      logDebug('Auth token stored');
    } catch (e) {
      logError('Error storing auth token', error: e);
      rethrow;
    }
  }

  /// Retrieve authentication token
  Future<String?> getAuthToken() async {
    try {
      return await _storage.read(key: _keyAuthToken);
    } catch (e) {
      logError('Error reading auth token', error: e);
      return null;
    }
  }

  /// Store refresh token securely
  Future<void> storeRefreshToken(String token) async {
    try {
      await _storage.write(key: _keyRefreshToken, value: token);
    } catch (e) {
      logError('Error storing refresh token', error: e);
      rethrow;
    }
  }

  /// Retrieve refresh token
  Future<String?> getRefreshToken() async {
    try {
      return await _storage.read(key: _keyRefreshToken);
    } catch (e) {
      logError('Error reading refresh token', error: e);
      return null;
    }
  }

  /// Clear all authentication tokens
  Future<void> clearAuthTokens() async {
    try {
      await Future.wait([
        _storage.delete(key: _keyAuthToken),
        _storage.delete(key: _keyRefreshToken),
        _storage.delete(key: _keySessionId),
      ]);
      logInfo('Auth tokens cleared');
    } catch (e) {
      logError('Error clearing auth tokens', error: e);
    }
  }

  // ========== PIN/Passcode Management ==========

  /// Generate cryptographically secure random salt
  String _generateSalt() {
    final random = Random.secure();
    final bytes = List<int>.generate(_saltLength, (_) => random.nextInt(256));
    return base64Url.encode(bytes);
  }

  /// Hash PIN using PBKDF2-like approach with SHA-256
  /// Uses multiple rounds for added security
  String _hashPin(String pin, String salt) {
    // Initial hash
    var bytes = utf8.encode('$salt:$pin');
    var hash = sha256.convert(bytes);
    
    // Multiple rounds of hashing (simple PBKDF2-like stretching)
    for (var i = 0; i < 10000; i++) {
      // Combine hash bytes with salt - use List<int> then convert
      final combined = <int>[...hash.bytes, ...utf8.encode(salt)];
      hash = sha256.convert(combined);
    }
    
    return hash.toString();
  }

  /// Set a new PIN (stores as salted hash)
  Future<void> setPin(String pin) async {
    if (pin.length < 4 || pin.length > 8) {
      throw ArgumentError('PIN must be 4-8 digits');
    }
    
    if (!RegExp(r'^\d+$').hasMatch(pin)) {
      throw ArgumentError('PIN must contain only digits');
    }

    try {
      final salt = _generateSalt();
      final hash = _hashPin(pin, salt);
      
      await Future.wait([
        _storage.write(key: _keyPinSalt, value: salt),
        _storage.write(key: _keyPinHash, value: hash),
      ]);
      
      // Reset failed attempts on PIN change
      await _storage.delete(key: _keyFailedAttempts);
      await _storage.delete(key: _keyLockedUntil);
      
      logInfo('PIN set successfully');
    } catch (e) {
      logError('Error storing PIN', error: e);
      rethrow;
    }
  }

  /// Verify PIN against stored hash
  /// Returns false if PIN is wrong or account is locked
  Future<bool> verifyPin(String pin) async {
    try {
      // Check if account is locked
      final lockedUntilStr = await _storage.read(key: _keyLockedUntil);
      if (lockedUntilStr != null) {
        final lockedUntil = DateTime.tryParse(lockedUntilStr);
        if (lockedUntil != null && DateTime.now().isBefore(lockedUntil)) {
          logWarning('Account is locked');
          return false;
        }
        // Lock expired, clear it
        await _storage.delete(key: _keyLockedUntil);
        await _storage.delete(key: _keyFailedAttempts);
      }

      final salt = await _storage.read(key: _keyPinSalt);
      final storedHash = await _storage.read(key: _keyPinHash);
      
      if (salt == null || storedHash == null) {
        logDebug('No PIN set');
        return false;
      }
      
      final inputHash = _hashPin(pin, salt);
      final isValid = storedHash == inputHash;
      
      if (isValid) {
        // Reset failed attempts on success
        await _storage.delete(key: _keyFailedAttempts);
        await _storage.delete(key: _keyLockedUntil);
        logDebug('PIN verified successfully');
      } else {
        // Track failed attempt
        await _trackFailedAttempt();
        logWarning('Invalid PIN attempt');
      }
      
      return isValid;
    } catch (e) {
      logError('Error verifying PIN', error: e);
      return false;
    }
  }

  /// Track failed PIN attempt and lock if exceeded
  Future<void> _trackFailedAttempt() async {
    final attemptsStr = await _storage.read(key: _keyFailedAttempts);
    final attempts = int.tryParse(attemptsStr ?? '0') ?? 0;
    final newAttempts = attempts + 1;
    
    await _storage.write(key: _keyFailedAttempts, value: newAttempts.toString());
    
    if (newAttempts >= _maxFailedAttempts) {
      final lockUntil = DateTime.now().add(const Duration(seconds: _lockDurationSeconds));
      await _storage.write(key: _keyLockedUntil, value: lockUntil.toIso8601String());
      logWarning('Account locked due to failed attempts');
    }
  }

  /// Get remaining failed attempts before lockout
  Future<int> getRemainingAttempts() async {
    final attemptsStr = await _storage.read(key: _keyFailedAttempts);
    final attempts = int.tryParse(attemptsStr ?? '0') ?? 0;
    return _maxFailedAttempts - attempts;
  }

  /// Check if account is locked and get lock end time
  Future<DateTime?> getLockedUntil() async {
    final lockedUntilStr = await _storage.read(key: _keyLockedUntil);
    if (lockedUntilStr == null) return null;
    return DateTime.tryParse(lockedUntilStr);
  }

  /// Check if PIN is set
  Future<bool> hasPinSet() async {
    try {
      final hash = await _storage.read(key: _keyPinHash);
      final salt = await _storage.read(key: _keyPinSalt);
      return hash != null && hash.isNotEmpty && salt != null;
    } catch (e) {
      logError('Error checking PIN', error: e);
      return false;
    }
  }

  /// Remove PIN and related security data
  Future<void> removePin() async {
    try {
      await Future.wait([
        _storage.delete(key: _keyPinHash),
        _storage.delete(key: _keyPinSalt),
        _storage.delete(key: _keyFailedAttempts),
        _storage.delete(key: _keyLockedUntil),
      ]);
      logInfo('PIN removed');
    } catch (e) {
      logError('Error removing PIN', error: e);
    }
  }

  /// Change PIN (requires verification of old PIN)
  Future<bool> changePin(String oldPin, String newPin) async {
    final verified = await verifyPin(oldPin);
    if (!verified) return false;
    
    await setPin(newPin);
    return true;
  }

  // ========== Biometric Settings ==========

  /// Set biometric enrollment status
  Future<void> setBiometricEnrolled(bool enrolled) async {
    try {
      await _storage.write(
        key: _keyBiometricEnrolled, 
        value: enrolled.toString(),
      );
      logDebug('Biometric enrollment set');
    } catch (e) {
      logError('Error storing biometric status', error: e);
    }
  }

  /// Check if biometric is enrolled for this app
  Future<bool> isBiometricEnrolled() async {
    try {
      final value = await _storage.read(key: _keyBiometricEnrolled);
      return value == 'true';
    } catch (e) {
      logError('Error reading biometric status', error: e);
      return false;
    }
  }

  // ========== App Lock Settings ==========

  /// Set app lock enabled status
  Future<void> setAppLockEnabled(bool enabled) async {
    try {
      await _storage.write(key: _keyAppLockEnabled, value: enabled.toString());
      logDebug('App lock set');
    } catch (e) {
      logError('Error storing app lock status', error: e);
    }
  }

  /// Check if app lock is enabled
  Future<bool> isAppLockEnabled() async {
    try {
      final value = await _storage.read(key: _keyAppLockEnabled);
      return value == 'true';
    } catch (e) {
      logError('Error reading app lock status', error: e);
      return false;
    }
  }

  /// Set lock timeout in minutes
  Future<void> setLockTimeout(int minutes) async {
    try {
      await _storage.write(key: _keyLockTimeout, value: minutes.toString());
    } catch (e) {
      logError('Error storing lock timeout', error: e);
    }
  }

  /// Get lock timeout in minutes (default: 1 minute)
  Future<int> getLockTimeout() async {
    try {
      final value = await _storage.read(key: _keyLockTimeout);
      return int.tryParse(value ?? '') ?? 1;
    } catch (e) {
      logError('Error reading lock timeout', error: e);
      return 1;
    }
  }

  /// Record last unlock time
  Future<void> recordUnlockTime() async {
    try {
      await _storage.write(
        key: _keyLastUnlockTime,
        value: DateTime.now().toIso8601String(),
      );
    } catch (e) {
      logError('Error recording unlock time', error: e);
    }
  }

  /// Get last unlock time
  Future<DateTime?> getLastUnlockTime() async {
    try {
      final value = await _storage.read(key: _keyLastUnlockTime);
      return value != null ? DateTime.tryParse(value) : null;
    } catch (e) {
      logError('Error reading unlock time', error: e);
      return null;
    }
  }

  /// Check if lock screen should be shown based on timeout
  Future<bool> shouldShowLock() async {
    try {
      final enabled = await isAppLockEnabled();
      if (!enabled) return false;

      final hasPIN = await hasPinSet();
      if (!hasPIN) return false;

      final lastUnlockStr = await _storage.read(key: _keyLastUnlockTime);
      if (lastUnlockStr == null) return true;

      final lastUnlock = DateTime.tryParse(lastUnlockStr);
      if (lastUnlock == null) return true;

      final timeout = await getLockTimeout();
      final expiryTime = lastUnlock.add(Duration(minutes: timeout));
      
      return DateTime.now().isAfter(expiryTime);
    } catch (e) {
      logError('Error checking lock status', error: e);
      return false;
    }
  }

  // ========== Trusted Devices ==========

  /// Store trusted device IDs
  Future<void> storeTrustedDevices(List<String> deviceIds) async {
    try {
      await _storage.write(
        key: _keyTrustedDevices, 
        value: jsonEncode(deviceIds),
      );
    } catch (e) {
      logError('Error storing trusted devices', error: e);
    }
  }

  /// Get trusted device IDs
  Future<List<String>> getTrustedDevices() async {
    try {
      final value = await _storage.read(key: _keyTrustedDevices);
      if (value == null) return [];
      return List<String>.from(jsonDecode(value));
    } catch (e) {
      logError('Error reading trusted devices', error: e);
      return [];
    }
  }

  /// Add a trusted device
  Future<void> addTrustedDevice(String deviceId) async {
    final devices = await getTrustedDevices();
    if (!devices.contains(deviceId)) {
      devices.add(deviceId);
      await storeTrustedDevices(devices);
    }
  }

  /// Remove a trusted device
  Future<void> removeTrustedDevice(String deviceId) async {
    final devices = await getTrustedDevices();
    devices.remove(deviceId);
    await storeTrustedDevices(devices);
  }

  /// Check if device is trusted
  Future<bool> isDeviceTrusted(String deviceId) async {
    final devices = await getTrustedDevices();
    return devices.contains(deviceId);
  }

  // ========== Session Management ==========

  /// Store session ID
  Future<void> storeSessionId(String sessionId) async {
    try {
      await _storage.write(key: _keySessionId, value: sessionId);
    } catch (e) {
      logError('Error storing session ID', error: e);
    }
  }

  /// Get session ID
  Future<String?> getSessionId() async {
    try {
      return await _storage.read(key: _keySessionId);
    } catch (e) {
      logError('Error reading session ID', error: e);
      return null;
    }
  }

  // ========== Utility Methods ==========

  /// Hash IP address for privacy (one-way hash)
  static String hashIpAddress(String ip) {
    const salt = 'thittam1hub_ip_salt_v1';
    final bytes = utf8.encode('$ip:$salt');
    return sha256.convert(bytes).toString().substring(0, 16);
  }

  /// Hash sensitive data for storage
  static String hashData(String data) {
    final bytes = utf8.encode(data);
    return sha256.convert(bytes).toString();
  }

  /// Generate secure random string
  static String generateSecureToken([int length = 32]) {
    final random = Random.secure();
    final bytes = List<int>.generate(length, (_) => random.nextInt(256));
    return base64Url.encode(bytes).substring(0, length);
  }

  /// Clear all secure storage (for logout)
  Future<void> clearAll() async {
    try {
      await _storage.deleteAll();
      logInfo('All secure data cleared');
    } catch (e) {
      logError('Error clearing secure storage', error: e);
    }
  }

  // ========== Generic Read/Write/Delete ==========

  /// Read a value from secure storage
  Future<String?> read(String key) async {
    try {
      return await _storage.read(key: key);
    } catch (e) {
      logError('Error reading key', error: e);
      return null;
    }
  }

  /// Write a value to secure storage
  Future<void> write(String key, String value) async {
    try {
      await _storage.write(key: key, value: value);
    } catch (e) {
      logError('Error writing key', error: e);
      rethrow;
    }
  }

  /// Delete a value from secure storage
  Future<void> delete(String key) async {
    try {
      await _storage.delete(key: key);
    } catch (e) {
      logError('Error deleting key', error: e);
    }
  }
}
