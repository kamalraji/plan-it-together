import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';
export 'package:local_auth/local_auth.dart' show LocalAuthentication, AuthenticationOptions;
import 'package:local_auth/error_codes.dart' as auth_error;
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/utils/result.dart';
import 'secure_storage_service.dart';

/// Biometric authentication types
enum BiometricType {
  fingerprint,
  faceId,
  iris,
  none,
}

/// Result of biometric authentication
class BiometricResult {
  final bool success;
  final String? errorMessage;
  final bool isBiometricAvailable;
  final bool isDeviceSupported;
  final bool isLocked;
  final bool permanentlyLocked;
  final BiometricType? usedType;

  const BiometricResult({
    required this.success,
    this.errorMessage,
    this.isBiometricAvailable = true,
    this.isDeviceSupported = true,
    this.isLocked = false,
    this.permanentlyLocked = false,
    this.usedType,
  });

  static const BiometricResult successResult = BiometricResult(success: true);
  
  factory BiometricResult.failed(String message) => BiometricResult(
    success: false,
    errorMessage: message,
  );

  factory BiometricResult.notAvailable() => const BiometricResult(
    success: false,
    errorMessage: 'Biometric authentication not available on this device',
    isBiometricAvailable: false,
  );

  factory BiometricResult.notSupported() => const BiometricResult(
    success: false,
    errorMessage: 'Device does not support biometric authentication',
    isDeviceSupported: false,
  );

  factory BiometricResult.notEnrolled() => const BiometricResult(
    success: false,
    errorMessage: 'No biometrics enrolled. Please set up fingerprint or face unlock in device settings.',
    isBiometricAvailable: false,
  );

  factory BiometricResult.locked({bool permanent = false}) => BiometricResult(
    success: false,
    errorMessage: permanent 
      ? 'Biometric authentication permanently locked. Use passcode instead.'
      : 'Too many failed attempts. Try again later.',
    isLocked: true,
    permanentlyLocked: permanent,
  );

  factory BiometricResult.cancelled() => const BiometricResult(
    success: false,
    errorMessage: 'Authentication was cancelled',
  );
}

/// Service for biometric authentication using local_auth package
/// Supports fingerprint, face ID, and iris recognition
class BiometricService extends BaseService {
  @override
  String get tag => 'Biometric';
  
  static BiometricService? _instance;
  static BiometricService get instance => _instance ??= BiometricService._();
  BiometricService._();

  final LocalAuthentication _localAuth = LocalAuthentication();
  final SecureStorageService _secureStorage = SecureStorageService.instance;

  // Cache for device capability
  bool? _isDeviceSupportedCache;
  List<BiometricType>? _availableBiometricsCache;

  // ========== Device Capability Checks ==========

  /// Check if device hardware supports biometric authentication
  Future<Result<bool>> isDeviceSupported() => execute(
    () async {
      if (_isDeviceSupportedCache != null) {
        return _isDeviceSupportedCache!;
      }
      
      _isDeviceSupportedCache = await _localAuth.isDeviceSupported();
      logDebug('Device support: $_isDeviceSupportedCache');
      return _isDeviceSupportedCache!;
    },
    operationName: 'isDeviceSupported',
  );

  /// Check if biometric authentication can be used (hardware + enrollment)
  Future<Result<bool>> canCheckBiometrics() => execute(
    () async {
      final canCheck = await _localAuth.canCheckBiometrics;
      final supportedResult = await isDeviceSupported();
      final isSupported = supportedResult.isSuccess ? supportedResult.data : false;
      return canCheck && isSupported;
    },
    operationName: 'canCheckBiometrics',
  );

  /// Get list of available biometric types on device
  Future<Result<List<BiometricType>>> getAvailableBiometrics() => execute(
    () async {
      if (_availableBiometricsCache != null) {
        return _availableBiometricsCache!;
      }

      final available = await _localAuth.getAvailableBiometrics();
      _availableBiometricsCache = available.map((biometric) {
        // Compare with local_auth's BiometricType enum (using package type directly, no alias)
        switch (biometric.name) {
          case 'fingerprint':
            return BiometricType.fingerprint;
          case 'face':
            return BiometricType.faceId;
          case 'iris':
            return BiometricType.iris;
          case 'strong':
          case 'weak':
            // Android may return strong/weak for fingerprint
            return BiometricType.fingerprint;
          default:
            return BiometricType.none;
        }
      }).where((b) => b != BiometricType.none).toList();
      
      logDebug('Available biometrics: $_availableBiometricsCache');
      return _availableBiometricsCache!;
    },
    operationName: 'getAvailableBiometrics',
  );

  /// Clear cached values (call when coming back to foreground)
  void clearCache() {
    _isDeviceSupportedCache = null;
    _availableBiometricsCache = null;
  }

  /// Check if any biometric is enrolled on device
  Future<bool> hasBiometricEnrolled() async {
    final result = await getAvailableBiometrics();
    if (!result.isSuccess) return false;
    return result.data.isNotEmpty;
  }

  /// Get primary biometric type available
  Future<BiometricType> getPrimaryBiometricType() async {
    final result = await getAvailableBiometrics();
    if (!result.isSuccess || result.data.isEmpty) return BiometricType.none;
    
    final biometrics = result.data;
    // Prefer Face ID over fingerprint for better UX
    if (biometrics.contains(BiometricType.faceId)) {
      return BiometricType.faceId;
    }
    return biometrics.first;
  }

  // ========== Authentication ==========

  /// Authenticate using biometric or device credential
  /// 
  /// [reason] - Displayed to user explaining why auth is needed
  /// [biometricOnly] - If true, only accepts biometric (no PIN/password fallback)
  /// [useErrorDialogs] - If true, shows system error dialogs
  /// [stickyAuth] - If true, auth persists after app goes to background
  Future<BiometricResult> authenticate({
    required String reason,
    bool biometricOnly = false,
    bool useErrorDialogs = true,
    bool stickyAuth = true,
  }) async {
    try {
      // local_auth ^3.x no longer exposes `useErrorDialogs` in the public API.
      // Keep the parameter for compatibility with existing call sites.
      if (!useErrorDialogs) {
        // no-op
      }

      // Step 1: Check device support
      final supportResult = await isDeviceSupported();
      if (!supportResult.isSuccess || !supportResult.data) {
        logWarning('Device not supported for biometrics');
        return BiometricResult.notSupported();
      }

      // Step 2: Check if biometrics are available
      final canCheckResult = await canCheckBiometrics();
      if (!canCheckResult.isSuccess || !canCheckResult.data) {
        if (biometricOnly) {
          logWarning('No biometrics available');
          return BiometricResult.notAvailable();
        }
        // Allow device credential fallback
      }

      // Step 3: Check if any biometrics are enrolled
      final hasEnrolled = await hasBiometricEnrolled();
      if (!hasEnrolled && biometricOnly) {
        logWarning('No biometrics enrolled');
        return BiometricResult.notEnrolled();
      }

      // Step 4: Perform authentication
      logDebug('Starting authentication...');
      // local_auth ^3.x removed the old named params (useErrorDialogs/stickyAuth)
      // and also doesn't accept an `options:` param on LocalAuthentication.authenticate.
      // Use the new API surface.
      final authenticated = await _localAuth.authenticate(
        localizedReason: reason,
        options: AuthenticationOptions(
          biometricOnly: biometricOnly,
          stickyAuth: stickyAuth,
          sensitiveTransaction: true,
        ),
      );

      if (authenticated) {
        logInfo('Authentication successful');
        // Record successful authentication time
        await _secureStorage.recordUnlockTime();
        
        final primaryType = await getPrimaryBiometricType();
        return BiometricResult(
          success: true,
          usedType: primaryType,
        );
      }

      logDebug('Authentication failed or cancelled');
      return BiometricResult.cancelled();
      
    } on PlatformException catch (e) {
      logWarning('PlatformException during auth: ${e.code}');
      return _handlePlatformException(e);
    } catch (e) {
      logError('Unexpected auth error', error: e);
      return BiometricResult.failed('Authentication error: ${e.toString()}');
    }
  }

  BiometricResult _handlePlatformException(PlatformException e) {
    // local_auth is federated and error-code constants moved between versions.
    // To keep builds stable across platforms and plugin updates, match on strings.
    final code = e.code.toLowerCase();

    if (code.contains('notenrolled')) return BiometricResult.notEnrolled();
    if (code.contains('lockedout')) return BiometricResult.locked();
    if (code.contains('permanentlylockedout')) {
      return BiometricResult.locked(permanent: true);
    }
    if (code.contains('notavailable')) return BiometricResult.notAvailable();
    if (code.contains('passcodenotset')) {
      return BiometricResult.failed(
        'No screen lock set. Please set up a PIN, pattern, or password in device settings first.',
      );
    }
    if (code.contains('otheroperatingsystem')) {
      return BiometricResult.failed('Biometrics not supported on this platform');
    }

    return BiometricResult.failed(e.message ?? 'Authentication failed');
  }

  // ========== App Biometric Enrollment ==========

  /// Check if biometric is enrolled for this app
  Future<bool> isAppBiometricEnrolled() async {
    return await _secureStorage.isBiometricEnrolled();
  }

  /// Enroll biometric for this app
  /// Returns success only if user successfully authenticates
  Future<BiometricResult> enrollBiometric() async {
    // First verify device has biometric capability
    final hasEnrolled = await hasBiometricEnrolled();
    if (!hasEnrolled) {
      return BiometricResult.notEnrolled();
    }

    // Authenticate to confirm enrollment
    final result = await authenticate(
      reason: 'Verify your identity to enable biometric login',
      biometricOnly: true,
    );

    if (result.success) {
      await _secureStorage.setBiometricEnrolled(true);
      logInfo('Biometric enrolled for app');
    }

    return result;
  }

  /// Disable biometric for this app
  Future<void> disableBiometric() async {
    await _secureStorage.setBiometricEnrolled(false);
    logInfo('Biometric disabled for app');
  }

  // ========== App Lock Management ==========

  /// Enable app lock with biometric/PIN
  Future<BiometricResult> enableAppLock() async {
    final result = await authenticate(
      reason: 'Verify your identity to enable app lock',
    );

    if (result.success) {
      await _secureStorage.setAppLockEnabled(true);
      logInfo('App lock enabled');
    }

    return result;
  }

  /// Disable app lock
  Future<BiometricResult> disableAppLock() async {
    final result = await authenticate(
      reason: 'Verify your identity to disable app lock',
    );

    if (result.success) {
      await _secureStorage.setAppLockEnabled(false);
      logInfo('App lock disabled');
    }

    return result;
  }

  /// Check if app lock is enabled
  Future<bool> isAppLockEnabled() async {
    return await _secureStorage.isAppLockEnabled();
  }

  /// Check if lock screen should be shown based on timeout
  Future<bool> shouldShowLock() async {
    return await _secureStorage.shouldShowLock();
  }

  /// Unlock the app
  Future<BiometricResult> unlock() async {
    final result = await authenticate(
      reason: 'Unlock Thittam1Hub to continue',
    );

    if (result.success) {
      await _secureStorage.recordUnlockTime();
    }

    return result;
  }

  // ========== Lock Timeout Management ==========

  /// Set lock timeout duration
  Future<void> setLockTimeout(int minutes) async {
    await _secureStorage.setLockTimeout(minutes);
  }

  /// Get current lock timeout
  Future<int> getLockTimeout() async {
    return await _secureStorage.getLockTimeout();
  }

  // ========== Utility Methods ==========

  /// Get friendly name for biometric type
  String getBiometricTypeName(BiometricType type) {
    switch (type) {
      case BiometricType.fingerprint:
        return 'Fingerprint';
      case BiometricType.faceId:
        return 'Face ID';
      case BiometricType.iris:
        return 'Iris Scan';
      case BiometricType.none:
        return 'None';
    }
  }

  /// Get icon data for biometric type
  String getBiometricTypeEmoji(BiometricType type) {
    switch (type) {
      case BiometricType.fingerprint:
        return '👆';
      case BiometricType.faceId:
        return '🔐';
      case BiometricType.iris:
        return '👁️';
      case BiometricType.none:
        return '❌';
    }
  }

  /// Stop any ongoing authentication (useful when navigating away)
  Future<void> stopAuthentication() async {
    try {
      await _localAuth.stopAuthentication();
    } catch (e) {
      logWarning('Error stopping authentication', error: e);
    }
  }
}
