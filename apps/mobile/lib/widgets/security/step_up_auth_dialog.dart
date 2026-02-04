import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
export 'package:supabase_flutter/supabase_flutter.dart' show Supabase, AuthException;
import '../../services/biometric_service.dart';
import '../../services/secure_storage_service.dart';

/// Dialog for step-up authentication before sensitive operations
class StepUpAuthDialog extends StatefulWidget {
  final String operation;
  final String? description;
  final VoidCallback? onSuccess;
  final VoidCallback? onCancel;

  const StepUpAuthDialog({
    super.key,
    required this.operation,
    this.description,
    this.onSuccess,
    this.onCancel,
  });

  /// Show the step-up auth dialog and return true if authentication succeeded
  static Future<bool> show(
    BuildContext context, {
    required String operation,
    String? description,
  }) async {
    final result = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) => StepUpAuthDialog(
        operation: operation,
        description: description,
      ),
    );
    return result ?? false;
  }

  @override
  State<StepUpAuthDialog> createState() => _StepUpAuthDialogState();
}

class _StepUpAuthDialogState extends State<StepUpAuthDialog> {
  final _passwordController = TextEditingController();
  final _biometricService = BiometricService.instance;
  final _secureStorage = SecureStorageService.instance;
  
  bool _loading = false;
  bool _obscurePassword = true;
  String? _error;
  bool _biometricAvailable = false;
  bool _useBiometric = false;

  @override
  void initState() {
    super.initState();
    _checkBiometric();
  }

  @override
  void dispose() {
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _checkBiometric() async {
    final canCheckResult = await _biometricService.canCheckBiometrics();
    final canCheck = canCheckResult.isSuccess ? canCheckResult.data : false;
    final enrolled = await _secureStorage.isBiometricEnrolled();
    
    if (mounted) {
      setState(() {
        _biometricAvailable = canCheck && enrolled;
        _useBiometric = _biometricAvailable;
      });
      
      // Auto-trigger biometric if available
      if (_biometricAvailable) {
        _authenticateWithBiometric();
      }
    }
  }

  Future<void> _authenticateWithBiometric() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final result = await _biometricService.authenticate(
        reason: 'Verify your identity to ${widget.operation.toLowerCase()}',
      );
      
      if (result.success && mounted) {
        Navigator.of(context).pop(true);
        widget.onSuccess?.call();
      } else if (mounted) {
        setState(() {
          _useBiometric = false;
          _loading = false;
          if (result.errorMessage != null) {
            _error = result.errorMessage;
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Biometric authentication failed';
          _useBiometric = false;
          _loading = false;
        });
      }
    }
  }

  Future<void> _authenticateWithPassword() async {
    final password = _passwordController.text.trim();
    if (password.isEmpty) {
      setState(() => _error = 'Please enter your password');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final supabase = Supabase.instance.client;
      final user = supabase.auth.currentUser;
      
      if (user?.email == null) {
        setState(() {
          _error = 'Unable to verify. Please try again.';
          _loading = false;
        });
        return;
      }

      // Re-authenticate by signing in again
      final response = await supabase.auth.signInWithPassword(
        email: user!.email!,
        password: password,
      );

      if (response.user != null && mounted) {
        Navigator.of(context).pop(true);
        widget.onSuccess?.call();
      } else if (mounted) {
        setState(() {
          _error = 'Incorrect password';
          _loading = false;
        });
      }
    } on AuthException catch (e) {
      if (mounted) {
        setState(() {
          _error = e.message;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Authentication failed. Please try again.';
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      contentPadding: EdgeInsets.zero,
      content: Container(
        width: MediaQuery.of(context).size.width * 0.85,
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Security icon
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: theme.colorScheme.error.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.security,
                size: 40,
                color: theme.colorScheme.error,
              ),
            ),
            
            const SizedBox(height: 20),
            
            // Title
            Text(
              'Verify Your Identity',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            
            const SizedBox(height: 8),
            
            // Description
            Text(
              widget.description ?? 
                'For your security, please verify your identity to ${widget.operation.toLowerCase()}.',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface.withOpacity(0.7),
              ),
            ),
            
            const SizedBox(height: 24),
            
            if (_loading && _useBiometric) ...[
              const CircularProgressIndicator(),
              const SizedBox(height: 16),
              Text(
                'Waiting for biometric...',
                style: theme.textTheme.bodySmall,
              ),
            ] else ...[
              // Password field
              TextField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                enabled: !_loading,
                decoration: InputDecoration(
                  labelText: 'Password',
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePassword ? Icons.visibility : Icons.visibility_off,
                    ),
                    onPressed: () {
                      setState(() => _obscurePassword = !_obscurePassword);
                    },
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  errorText: _error,
                ),
                onSubmitted: (_) => _authenticateWithPassword(),
              ),
              
              if (_biometricAvailable) ...[
                const SizedBox(height: 16),
                
                // Or divider
                Row(
                  children: [
                    Expanded(child: Divider(color: theme.colorScheme.outline.withOpacity(0.3))),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        'OR',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurface.withOpacity(0.5),
                        ),
                      ),
                    ),
                    Expanded(child: Divider(color: theme.colorScheme.outline.withOpacity(0.3))),
                  ],
                ),
                
                const SizedBox(height: 16),
                
                // Biometric button
                OutlinedButton.icon(
                  onPressed: _loading ? null : _authenticateWithBiometric,
                  icon: const Icon(Icons.fingerprint),
                  label: const Text('Use Biometric'),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 48),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ],
            ],
            
            const SizedBox(height: 24),
            
            // Action buttons
            if (!(_loading && _useBiometric))
              Row(
                children: [
                  Expanded(
                    child: TextButton(
                      onPressed: _loading
                          ? null
                          : () {
                              Navigator.of(context).pop(false);
                              widget.onCancel?.call();
                            },
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      onPressed: _loading ? null : _authenticateWithPassword,
                      child: _loading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text('Verify'),
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

/// Mixin to add step-up authentication requirement to widgets
mixin StepUpAuthMixin<T extends StatefulWidget> on State<T> {
  /// Require step-up authentication before performing an action
  Future<bool> requireStepUpAuth({
    required String operation,
    String? description,
  }) async {
    return StepUpAuthDialog.show(
      context,
      operation: operation,
      description: description,
    );
  }
  
  /// Perform an action only if step-up auth succeeds
  Future<void> withStepUpAuth({
    required String operation,
    String? description,
    required Future<void> Function() action,
  }) async {
    final authorized = await requireStepUpAuth(
      operation: operation,
      description: description,
    );
    
    if (authorized) {
      await action();
    }
  }
}
