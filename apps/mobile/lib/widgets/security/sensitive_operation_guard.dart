import 'package:flutter/material.dart';
import '../../services/enhanced_security_service.dart';
import '../../services/biometric_quick_unlock.dart';
import 'step_up_auth_dialog.dart';

/// Type of sensitive operation that requires extra protection
enum SensitiveOperationType {
  passwordChange,
  twoFactorChange,
  accountDeletion,
  dataExport,
  recoveryChange,
  trustedDeviceRemoval,
  sessionTermination,
  emailChange,
  unlinkAccount,
}

/// Extension for getting display info for sensitive operations
extension SensitiveOperationTypeExtension on SensitiveOperationType {
  String get displayName {
    switch (this) {
      case SensitiveOperationType.passwordChange:
        return 'change password';
      case SensitiveOperationType.twoFactorChange:
        return 'modify 2FA settings';
      case SensitiveOperationType.accountDeletion:
        return 'delete your account';
      case SensitiveOperationType.dataExport:
        return 'export your data';
      case SensitiveOperationType.recoveryChange:
        return 'change recovery options';
      case SensitiveOperationType.trustedDeviceRemoval:
        return 'remove trusted device';
      case SensitiveOperationType.sessionTermination:
        return 'terminate sessions';
      case SensitiveOperationType.emailChange:
        return 'change email';
      case SensitiveOperationType.unlinkAccount:
        return 'unlink account';
    }
  }

  String get description {
    switch (this) {
      case SensitiveOperationType.passwordChange:
        return 'Changing your password requires identity verification.';
      case SensitiveOperationType.twoFactorChange:
        return 'Modifying 2FA settings is a sensitive operation.';
      case SensitiveOperationType.accountDeletion:
        return 'This action is irreversible and will delete all your data.';
      case SensitiveOperationType.dataExport:
        return 'Your data export contains sensitive personal information.';
      case SensitiveOperationType.recoveryChange:
        return 'Changing recovery options affects account access.';
      case SensitiveOperationType.trustedDeviceRemoval:
        return 'Removing trusted devices may affect your login experience.';
      case SensitiveOperationType.sessionTermination:
        return 'Terminating sessions will log out those devices.';
      case SensitiveOperationType.emailChange:
        return 'Changing your email requires identity verification.';
      case SensitiveOperationType.unlinkAccount:
        return 'Unlinking this account will remove sign-in access.';
    }
  }

  IconData get icon {
    switch (this) {
      case SensitiveOperationType.passwordChange:
        return Icons.key;
      case SensitiveOperationType.twoFactorChange:
        return Icons.security;
      case SensitiveOperationType.accountDeletion:
        return Icons.delete_forever;
      case SensitiveOperationType.dataExport:
        return Icons.download;
      case SensitiveOperationType.recoveryChange:
        return Icons.restore;
      case SensitiveOperationType.trustedDeviceRemoval:
        return Icons.phone_android;
      case SensitiveOperationType.sessionTermination:
        return Icons.devices;
      case SensitiveOperationType.emailChange:
        return Icons.email;
      case SensitiveOperationType.unlinkAccount:
        return Icons.link_off;
    }
  }
}

/// Guard for sensitive operations requiring step-up authentication
/// 
/// Industrial best practice: Standard singleton pattern per docs/SINGLETON_PATTERN.md
/// 
/// Supports biometric authentication as a faster alternative to password entry
/// when device has biometrics enrolled and user hasn't disabled the option.
class SensitiveOperationGuard {
  static SensitiveOperationGuard? _instance;
  static SensitiveOperationGuard get instance => _instance ??= SensitiveOperationGuard._();
  SensitiveOperationGuard._();

  final _securityService = EnhancedSecurityService.instance;
  
  /// Whether to prefer biometric over password when available
  bool _preferBiometric = true;
  
  /// Set biometric preference
  void setPreferBiometric(bool prefer) => _preferBiometric = prefer;

  /// Check if step-up auth is required for this operation
  Future<bool> isStepUpRequired() async {
    final prefs = await _securityService.getSecurityPreferences();
    return prefs.requireReauthenticationSensitive;
  }
  
  /// Check if biometric can be used for this guard
  Future<bool> canUseBiometric() async {
    if (!_preferBiometric) return false;
    return await BiometricQuickUnlock.isAvailable && 
           await BiometricQuickUnlock.hasEnrolledBiometrics;
  }
  
  /// Map operation type to biometric operation
  BiometricOperation? _mapToBiometricOperation(SensitiveOperationType type) {
    switch (type) {
      case SensitiveOperationType.passwordChange:
        return BiometricOperation.changePassword;
      case SensitiveOperationType.twoFactorChange:
        return BiometricOperation.enable2FA;
      case SensitiveOperationType.accountDeletion:
        return BiometricOperation.deleteAccount;
      case SensitiveOperationType.dataExport:
        return BiometricOperation.exportData;
      case SensitiveOperationType.sessionTermination:
        return BiometricOperation.terminateSession;
      case SensitiveOperationType.emailChange:
        return BiometricOperation.changeEmail;
      case SensitiveOperationType.unlinkAccount:
        return BiometricOperation.unlinkAccount;
      default:
        return null;
    }
  }

  /// Guard a sensitive operation with step-up authentication if enabled
  /// Returns true if operation should proceed, false otherwise
  /// 
  /// If biometric is available and preferred, uses biometric first.
  /// Falls back to password dialog if biometric fails or is unavailable.
  Future<bool> guard(
    BuildContext context, {
    required SensitiveOperationType operation,
  }) async {
    final requireAuth = await isStepUpRequired();
    
    if (!requireAuth) {
      return true; // No step-up required
    }

    return _authenticate(context, operation);
  }

  /// Show step-up auth unconditionally (for critical operations)
  Future<bool> guardAlways(
    BuildContext context, {
    required SensitiveOperationType operation,
  }) async {
    return _authenticate(context, operation);
  }
  
  /// Core authentication logic with biometric fallback
  Future<bool> _authenticate(
    BuildContext context,
    SensitiveOperationType operation,
  ) async {
    // Try biometric first if available
    if (await canUseBiometric()) {
      final biometricOp = _mapToBiometricOperation(operation);
      if (biometricOp != null) {
        final biometricResult = await BiometricQuickUnlock.authenticateForOperation(
          context,
          biometricOp,
        );
        if (biometricResult) {
          return true; // Biometric succeeded
        }
        // Biometric failed or cancelled - fall through to password
      }
    }
    
    // Fall back to password dialog
    return StepUpAuthDialog.show(
      context,
      operation: operation.displayName.capitalize(),
      description: operation.description,
    );
  }

  /// Guard and execute an action if authorized
  Future<bool> guardAndExecute(
    BuildContext context, {
    required SensitiveOperationType operation,
    required Future<void> Function() action,
    bool forceAuth = false,
  }) async {
    final authorized = forceAuth 
        ? await guardAlways(context, operation: operation)
        : await guard(context, operation: operation);
    
    if (authorized) {
      await action();
      return true;
    }
    return false;
  }
}

/// Extension for string capitalization
extension StringCapitalization on String {
  String capitalize() {
    if (isEmpty) return this;
    return '${this[0].toUpperCase()}${substring(1)}';
  }
}

/// Widget that wraps sensitive actions with step-up authentication
class SensitiveActionButton extends StatelessWidget {
  final SensitiveOperationType operation;
  final VoidCallback? onPressed;
  final Widget child;
  final bool forceAuth;
  final ButtonStyle? style;

  const SensitiveActionButton({
    super.key,
    required this.operation,
    required this.onPressed,
    required this.child,
    this.forceAuth = false,
    this.style,
  });

  @override
  Widget build(BuildContext context) {
    return FilledButton(
      style: style,
      onPressed: onPressed == null
          ? null
          : () async {
              final guard = SensitiveOperationGuard.instance;
              final authorized = forceAuth
                  ? await guard.guardAlways(context, operation: operation)
                  : await guard.guard(context, operation: operation);
              
              if (authorized) {
                onPressed?.call();
              }
            },
      child: child,
    );
  }
}

/// Icon button variant for sensitive actions
class SensitiveActionIconButton extends StatelessWidget {
  final SensitiveOperationType operation;
  final VoidCallback? onPressed;
  final Widget icon;
  final String? tooltip;
  final bool forceAuth;

  const SensitiveActionIconButton({
    super.key,
    required this.operation,
    required this.onPressed,
    required this.icon,
    this.tooltip,
    this.forceAuth = false,
  });

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: icon,
      tooltip: tooltip,
      onPressed: onPressed == null
          ? null
          : () async {
              final guard = SensitiveOperationGuard.instance;
              final authorized = forceAuth
                  ? await guard.guardAlways(context, operation: operation)
                  : await guard.guard(context, operation: operation);
              
              if (authorized) {
                onPressed?.call();
              }
            },
    );
  }
}
