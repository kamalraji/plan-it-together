import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';
import 'package:thittam1hub/services/logging_service.dart';

/// Biometric Quick Unlock for sensitive operations
/// 
/// Provides a streamlined authentication flow using device biometrics
/// (fingerprint, face ID) as an alternative to password re-entry.
/// 
/// Usage:
/// ```dart
/// final authenticated = await BiometricQuickUnlock.authenticate(
///   context,
///   reason: 'Confirm to terminate session',
/// );
/// if (authenticated) { /* proceed */ }
/// ```
class BiometricQuickUnlock {
  static final _log = LoggingService.instance;
  static const _tag = 'BiometricQuickUnlock';
  static final _localAuth = LocalAuthentication();
  
  /// Check if biometric authentication is available on this device
  static Future<bool> get isAvailable async {
    try {
      final canCheck = await _localAuth.canCheckBiometrics;
      final isSupported = await _localAuth.isDeviceSupported();
      return canCheck && isSupported;
    } catch (e) {
      _log.error('Failed to check biometric availability: $e', tag: _tag);
      return false;
    }
  }
  
  /// Get available biometric types (fingerprint, face, iris)
  static Future<List<BiometricType>> get availableTypes async {
    try {
      return await _localAuth.getAvailableBiometrics();
    } catch (e) {
      _log.error('Failed to get biometric types: $e', tag: _tag);
      return [];
    }
  }
  
  /// Check if device has enrolled biometrics
  static Future<bool> get hasEnrolledBiometrics async {
    final types = await availableTypes;
    return types.isNotEmpty;
  }
  
  /// Get a user-friendly name for the primary biometric type
  static Future<String> get biometricName async {
    final types = await availableTypes;
    if (types.contains(BiometricType.face)) {
      return 'Face ID';
    } else if (types.contains(BiometricType.fingerprint)) {
      return 'Fingerprint';
    } else if (types.contains(BiometricType.iris)) {
      return 'Iris';
    }
    return 'Biometric';
  }
  
  /// Authenticate user with biometrics
  /// 
  /// [reason] - Localized reason shown to user (e.g., "Confirm to delete account")
  /// [fallbackToPin] - Allow device PIN/password as fallback (default: true)
  /// [stickyAuth] - Keep auth dialog open if app goes to background (default: true)
  static Future<bool> authenticate(
    BuildContext context, {
    required String reason,
    bool fallbackToPin = true,
    bool stickyAuth = true,
  }) async {
    // Check availability first
    if (!await isAvailable) {
      _log.warn('Biometric not available on device', tag: _tag);
      return false;
    }
    
    // Check for enrolled biometrics
    if (!await hasEnrolledBiometrics) {
      _log.warn('No biometrics enrolled', tag: _tag);
      if (context.mounted) {
        _showEnrollmentPrompt(context);
      }
      return false;
    }
    
    try {
      HapticFeedback.mediumImpact();
      
      final authenticated = await _localAuth.authenticate(
        localizedReason: reason,
        options: AuthenticationOptions(
          stickyAuth: stickyAuth,
          biometricOnly: !fallbackToPin,
          useErrorDialogs: true,
          sensitiveTransaction: true,
        ),
      );
      
      if (authenticated) {
        HapticFeedback.lightImpact();
        _log.info('Biometric authentication successful', tag: _tag);
      } else {
        HapticFeedback.heavyImpact();
        _log.warn('Biometric authentication failed or cancelled', tag: _tag);
      }
      
      return authenticated;
    } on PlatformException catch (e) {
      _log.error('Biometric auth error: ${e.code} - ${e.message}', tag: _tag);
      
      if (context.mounted) {
        _handleAuthError(context, e);
      }
      
      return false;
    }
  }
  
  /// Authenticate with automatic reason based on operation type
  static Future<bool> authenticateForOperation(
    BuildContext context,
    BiometricOperation operation,
  ) {
    return authenticate(
      context,
      reason: operation.reason,
      fallbackToPin: operation.allowPinFallback,
    );
  }
  
  static void _showEnrollmentPrompt(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('No biometrics enrolled. Please set up in device settings.'),
        backgroundColor: cs.errorContainer,
        behavior: SnackBarBehavior.floating,
        action: SnackBarAction(
          label: 'Dismiss',
          textColor: cs.onErrorContainer,
          onPressed: () {},
        ),
      ),
    );
  }
  
  static void _handleAuthError(BuildContext context, PlatformException e) {
    final cs = Theme.of(context).colorScheme;
    String message;
    
    switch (e.code) {
      case 'NotAvailable':
        message = 'Biometric authentication not available';
        break;
      case 'NotEnrolled':
        message = 'No biometrics enrolled on this device';
        break;
      case 'LockedOut':
        message = 'Too many attempts. Try again later.';
        break;
      case 'PermanentlyLockedOut':
        message = 'Biometrics locked. Use device passcode to unlock.';
        break;
      case 'PasscodeNotSet':
        message = 'Device passcode not set. Please configure in settings.';
        break;
      default:
        message = 'Authentication error. Please try again.';
    }
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: cs.errorContainer,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}

/// Predefined operations for biometric authentication
enum BiometricOperation {
  terminateSession(
    reason: 'Confirm your identity to terminate session',
    allowPinFallback: true,
  ),
  terminateAllSessions(
    reason: 'Confirm your identity to sign out all devices',
    allowPinFallback: true,
  ),
  changeEmail(
    reason: 'Confirm your identity to change email',
    allowPinFallback: true,
  ),
  changePassword(
    reason: 'Confirm your identity to change password',
    allowPinFallback: true,
  ),
  enable2FA(
    reason: 'Confirm your identity to enable two-factor authentication',
    allowPinFallback: true,
  ),
  disable2FA(
    reason: 'Confirm your identity to disable two-factor authentication',
    allowPinFallback: false, // More sensitive - biometric only
  ),
  deleteAccount(
    reason: 'Confirm your identity to delete account',
    allowPinFallback: false, // Most sensitive - biometric only
  ),
  exportData(
    reason: 'Confirm your identity to export your data',
    allowPinFallback: true,
  ),
  viewBackupCodes(
    reason: 'Confirm your identity to view backup codes',
    allowPinFallback: true,
  ),
  unlinkAccount(
    reason: 'Confirm your identity to unlink account',
    allowPinFallback: true,
  );
  
  const BiometricOperation({
    required this.reason,
    required this.allowPinFallback,
  });
  
  final String reason;
  final bool allowPinFallback;
}

/// Extension to integrate with SensitiveOperationGuard
extension BiometricGuardExtension on BiometricQuickUnlock {
  /// Check if biometric can be used instead of password for guard
  static Future<bool> canUseBiometricForGuard() async {
    return await BiometricQuickUnlock.isAvailable && 
           await BiometricQuickUnlock.hasEnrolledBiometrics;
  }
}
