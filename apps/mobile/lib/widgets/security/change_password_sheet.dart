import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../supabase/supabase_config.dart';
import '../../theme.dart';
import '../../models/security_preferences_models.dart';
import 'password_breach_checker.dart';

import 'package:thittam1hub/services/logging_service.dart';
/// Bottom sheet for changing password with strength indicator
class ChangePasswordSheet extends StatefulWidget {
  // Logging
   static final _log = LoggingService.instance;
   static const String _tag = 'ChangePasswordSheet';

  final VoidCallback? onSuccess;
  final bool requireCurrentPassword;

  const ChangePasswordSheet({
    super.key, 
    this.onSuccess,
    this.requireCurrentPassword = true,
  });

  @override
  State<ChangePasswordSheet> createState() => _ChangePasswordSheetState();
}

class _ChangePasswordSheetState extends State<ChangePasswordSheet> 
    with SingleTickerProviderStateMixin {
  static const String _tag = 'ChangePasswordSheet';
  static final _log = LoggingService.instance;
  
  final _formKey = GlobalKey<FormState>();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  
  bool _isLoading = false;
  bool _isVerifying = false;
  bool _currentPasswordVerified = false;
  bool _obscureCurrent = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  bool _signOutOtherDevices = false;
  double _passwordStrength = 0.0;
  String? _errorMessage;
  String? _successMessage;
  PasswordBreachResult? _breachResult;
  bool _isPasswordBreached = false;
  
  late AnimationController _animController;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _newPasswordController.addListener(_updatePasswordStrength);
    
    _animController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _fadeAnim = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeInOut,
    );
    _animController.forward();
    
    // Skip verification if not required (e.g., password reset flow)
    if (!widget.requireCurrentPassword) {
      _currentPasswordVerified = true;
    }
  }

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    _animController.dispose();
    super.dispose();
  }

  void _updatePasswordStrength() {
    final password = _newPasswordController.text;
    double strength = 0.0;

    if (password.length >= 6) strength += 0.15;
    if (password.length >= 8) strength += 0.15;
    if (password.length >= 12) strength += 0.1;
    if (password.length >= 16) strength += 0.1;
    if (password.contains(RegExp(r'[A-Z]'))) strength += 0.15;
    if (password.contains(RegExp(r'[a-z]'))) strength += 0.1;
    if (password.contains(RegExp(r'[0-9]'))) strength += 0.15;
    if (password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'))) strength += 0.1;

    setState(() => _passwordStrength = strength.clamp(0.0, 1.0));
  }

  Color _getStrengthColor(ColorScheme cs) {
    if (_passwordStrength < 0.3) return cs.error;
    if (_passwordStrength < 0.5) return Colors.orange;
    if (_passwordStrength < 0.7) return Colors.amber;
    return Colors.green;
  }

  String _getStrengthLabel() {
    if (_passwordStrength < 0.3) return 'Weak';
    if (_passwordStrength < 0.5) return 'Fair';
    if (_passwordStrength < 0.7) return 'Good';
    if (_passwordStrength < 0.9) return 'Strong';
    return 'Excellent';
  }

  IconData _getStrengthIcon() {
    if (_passwordStrength < 0.3) return Icons.shield_outlined;
    if (_passwordStrength < 0.5) return Icons.shield;
    if (_passwordStrength < 0.7) return Icons.security;
    return Icons.verified_user;
  }

  /// Verify current password before allowing change
  Future<void> _verifyCurrentPassword() async {
    if (_currentPasswordController.text.isEmpty) {
      setState(() => _errorMessage = 'Please enter your current password');
      return;
    }

    setState(() {
      _isVerifying = true;
      _errorMessage = null;
    });

    try {
      final user = SupabaseConfig.auth.currentUser;
      if (user?.email == null) {
        throw Exception('No email found for current user');
      }

      // Re-authenticate by signing in with current password
      await SupabaseConfig.auth.signInWithPassword(
        email: user!.email!,
        password: _currentPasswordController.text,
      );

      setState(() {
        _currentPasswordVerified = true;
        _successMessage = 'Password verified successfully';
      });

      // Clear success message after delay
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) setState(() => _successMessage = null);
      });
    } on AuthException catch (e) {
      String message = 'Verification failed';
      if (e.message.contains('Invalid login credentials')) {
        message = 'Incorrect password. Please try again.';
      } else if (e.message.contains('rate')) {
        message = 'Too many attempts. Please wait a moment.';
      }
      setState(() => _errorMessage = message);
    } catch (e) {
      setState(() => _errorMessage = 'Failed to verify password');
    } finally {
      if (mounted) setState(() => _isVerifying = false);
    }
  }

  Future<void> _changePassword() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // Update password using Supabase
      await SupabaseConfig.auth.updateUser(
        UserAttributes(password: _newPasswordController.text),
      );

      // Record password change in login history
      await _recordPasswordChange();

      // Sign out other devices if requested
      if (_signOutOtherDevices) {
        await _signOutOtherSessions();
      }

      if (mounted) {
        widget.onSuccess?.call();
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _signOutOtherDevices 
                        ? 'Password changed and other devices signed out'
                        : 'Password changed successfully',
                  ),
                ),
              ],
            ),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    } on AuthException catch (e) {
      String message = 'Failed to change password';
      if (e.message.contains('same')) {
        message = 'New password must be different from current password';
      } else if (e.message.contains('weak')) {
        message = 'Password is too weak. Please choose a stronger password.';
      } else if (e.message.contains('session')) {
        message = 'Session expired. Please sign in again.';
      }
      setState(() => _errorMessage = message);
    } catch (e) {
      setState(() => _errorMessage = 'An unexpected error occurred. Please try again.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _recordPasswordChange() async {
    try {
      final user = SupabaseConfig.auth.currentUser;
      if (user == null) return;

      await SupabaseConfig.client.from('login_history').insert({
        'user_id': user.id,
        'event_type': 'password_change',
        'device_info': 'Current Device',
        'success': true,
        'ip_address': 'Unknown',
      });
    } catch (e) {
      _log.error('Failed to record password change: $e', tag: _tag);
    }
  }

  Future<void> _signOutOtherSessions() async {
    try {
      // Sign out globally, then sign back in to current session
      final user = SupabaseConfig.auth.currentUser;
      if (user?.email == null) return;

      await SupabaseConfig.auth.signOut(scope: SignOutScope.global);
      
      // Re-authenticate with new password
      await SupabaseConfig.auth.signInWithPassword(
        email: user!.email!,
        password: _newPasswordController.text,
      );
    } catch (e) {
      _log.error('Failed to sign out other sessions: $e', tag: _tag);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return FadeTransition(
      opacity: _fadeAnim,
      child: Container(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Handle
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: cs.outline.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                
                // Title
                _buildHeader(cs),
                const SizedBox(height: 24),

                // Success message
                if (_successMessage != null) ...[
                  _buildMessageBanner(
                    message: _successMessage!,
                    isError: false,
                    cs: cs,
                  ),
                  const SizedBox(height: 16),
                ],

                // Error message
                if (_errorMessage != null) ...[
                  _buildMessageBanner(
                    message: _errorMessage!,
                    isError: true,
                    cs: cs,
                  ),
                  const SizedBox(height: 16),
                ],

                // Step 1: Verify current password
                if (widget.requireCurrentPassword && !_currentPasswordVerified) ...[
                  _buildVerificationStep(cs, isDark),
                ] else ...[
                  // Step 2: New password entry
                  _buildNewPasswordStep(cs, isDark),
                ],
                
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(ColorScheme cs) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                cs.primary.withOpacity(0.2),
                cs.primary.withOpacity(0.1),
              ],
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(Icons.lock_outline, color: cs.primary),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Change Password',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                _currentPasswordVerified 
                    ? 'Create a strong, unique password'
                    : 'First, verify your current password',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: cs.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
        // Progress indicator
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: cs.primaryContainer,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            _currentPasswordVerified ? '2/2' : '1/2',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: cs.onPrimaryContainer,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMessageBanner({
    required String message,
    required bool isError,
    required ColorScheme cs,
  }) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isError ? cs.errorContainer : Colors.green.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isError ? cs.error.withOpacity(0.3) : Colors.green.withOpacity(0.3),
        ),
      ),
      child: Row(
        children: [
          Icon(
            isError ? Icons.error_outline : Icons.check_circle_outline,
            color: isError ? cs.error : Colors.green,
            size: 20,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                color: isError ? cs.error : Colors.green,
                fontSize: 13,
              ),
            ),
          ),
          if (isError)
            IconButton(
              icon: const Icon(Icons.close, size: 18),
              onPressed: () => setState(() => _errorMessage = null),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
              color: cs.error,
            ),
        ],
      ),
    );
  }

  Widget _buildVerificationStep(ColorScheme cs, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Current password
        _buildPasswordField(
          controller: _currentPasswordController,
          label: 'Current Password',
          hint: 'Enter your current password',
          obscure: _obscureCurrent,
          onToggleObscure: () => setState(() => _obscureCurrent = !_obscureCurrent),
          validator: (v) {
            if (v == null || v.isEmpty) return 'Enter current password';
            return null;
          },
          cs: cs,
          isDark: isDark,
          enabled: !_isVerifying,
        ),
        const SizedBox(height: 16),

        // Forgot password link
        Align(
          alignment: Alignment.centerRight,
          child: TextButton(
            onPressed: _isVerifying ? null : _showForgotPasswordDialog,
            child: Text(
              'Forgot your password?',
              style: TextStyle(
                color: cs.primary,
                fontSize: 13,
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Verify button
        FilledButton.icon(
          onPressed: _isVerifying ? null : _verifyCurrentPassword,
          icon: _isVerifying
              ? SizedBox(
                  height: 18,
                  width: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: cs.onPrimary,
                  ),
                )
              : const Icon(Icons.verified_user_outlined),
          label: Text(_isVerifying ? 'Verifying...' : 'Verify Password'),
        ),
      ],
    );
  }

  Widget _buildNewPasswordStep(ColorScheme cs, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // New password
        _buildPasswordField(
          controller: _newPasswordController,
          label: 'New Password',
          hint: 'Enter your new password',
          obscure: _obscureNew,
          onToggleObscure: () => setState(() => _obscureNew = !_obscureNew),
          validator: (v) {
            if (v == null || v.isEmpty) return 'Enter new password';
            if (v.length < 8) return 'Password must be at least 8 characters';
            if (_passwordStrength < 0.5) return 'Password is too weak';
            return null;
          },
          cs: cs,
          isDark: isDark,
        ),
        
        // Password strength indicator
        if (_newPasswordController.text.isNotEmpty) ...[
          const SizedBox(height: 12),
          _buildPasswordStrengthIndicator(cs),
          const SizedBox(height: 12),
          // Password breach checker
          PasswordBreachChecker(
            passwordController: _newPasswordController,
            onResult: (result) {
              if (mounted) {
                setState(() {
                  _breachResult = result;
                  _isPasswordBreached = result != null && !result.safe;
                });
              }
            },
          ),
        ],
        const SizedBox(height: 16),

        // Confirm password
        _buildPasswordField(
          controller: _confirmPasswordController,
          label: 'Confirm Password',
          hint: 'Confirm your new password',
          obscure: _obscureConfirm,
          onToggleObscure: () => setState(() => _obscureConfirm = !_obscureConfirm),
          validator: (v) {
            if (v == null || v.isEmpty) return 'Confirm your password';
            if (v != _newPasswordController.text) return 'Passwords do not match';
            return null;
          },
          cs: cs,
          isDark: isDark,
        ),
        const SizedBox(height: 20),

        // Password requirements
        _buildPasswordRequirements(cs),
        const SizedBox(height: 20),

        // Sign out other devices option
        _buildSignOutOption(cs),
        const SizedBox(height: 24),

        // Buttons
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: _isLoading ? null : () => Navigator.pop(context),
                child: const Text('Cancel'),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              flex: 2,
              child: FilledButton.icon(
                onPressed: _isLoading || _passwordStrength < 0.5 || _isPasswordBreached
                    ? null 
                    : _changePassword,
                icon: _isLoading
                    ? SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: cs.onPrimary,
                        ),
                      )
                    : const Icon(Icons.lock_reset),
                label: Text(_isLoading ? 'Changing...' : 'Change Password'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildPasswordField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required bool obscure,
    required VoidCallback onToggleObscure,
    required String? Function(String?) validator,
    required ColorScheme cs,
    required bool isDark,
    bool enabled = true,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: obscure,
      validator: validator,
      enabled: enabled,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: const Icon(Icons.lock_outline),
        suffixIcon: IconButton(
          icon: Icon(obscure ? Icons.visibility : Icons.visibility_off),
          onPressed: enabled ? onToggleObscure : null,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        filled: true,
        fillColor: cs.surfaceContainerHighest.withOpacity(isDark ? 0.3 : 0.5),
      ),
    );
  }

  Widget _buildPasswordStrengthIndicator(ColorScheme cs) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                height: 8,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(4),
                  color: cs.surfaceContainerHighest,
                ),
                child: FractionallySizedBox(
                  alignment: Alignment.centerLeft,
                  widthFactor: _passwordStrength,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(4),
                      gradient: LinearGradient(
                        colors: [
                          _getStrengthColor(cs).withOpacity(0.7),
                          _getStrengthColor(cs),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: _getStrengthColor(cs).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: _getStrengthColor(cs).withOpacity(0.3),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    _getStrengthIcon(),
                    size: 14,
                    color: _getStrengthColor(cs),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _getStrengthLabel(),
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: _getStrengthColor(cs),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildPasswordRequirements(ColorScheme cs) {
    final password = _newPasswordController.text;
    
    bool hasMinLength = password.length >= 8;
    bool hasUppercase = password.contains(RegExp(r'[A-Z]'));
    bool hasLowercase = password.contains(RegExp(r'[a-z]'));
    bool hasNumber = password.contains(RegExp(r'[0-9]'));
    bool hasSpecial = password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'));

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outline.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.info_outline, size: 16, color: cs.primary),
              const SizedBox(width: 8),
              Text(
                'Password Requirements',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                  color: cs.onSurface,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _buildRequirementChip('8+ chars', hasMinLength, cs),
              _buildRequirementChip('A-Z', hasUppercase, cs),
              _buildRequirementChip('a-z', hasLowercase, cs),
              _buildRequirementChip('0-9', hasNumber, cs),
              _buildRequirementChip('!@#', hasSpecial, cs),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRequirementChip(String label, bool met, ColorScheme cs) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: met ? Colors.green.withOpacity(0.1) : cs.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: met ? Colors.green.withOpacity(0.5) : cs.outline.withOpacity(0.2),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            met ? Icons.check : Icons.circle_outlined,
            size: 14,
            color: met ? Colors.green : cs.outline,
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: met ? FontWeight.bold : FontWeight.normal,
              color: met ? Colors.green : cs.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSignOutOption(ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cs.primaryContainer.withOpacity(0.3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.primary.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          Icon(Icons.devices, size: 20, color: cs.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Sign out other devices',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                    color: cs.onSurface,
                  ),
                ),
                Text(
                  'Recommended for security',
                  style: TextStyle(
                    fontSize: 11,
                    color: cs.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          Switch.adaptive(
            value: _signOutOtherDevices,
            onChanged: (v) => setState(() => _signOutOtherDevices = v),
          ),
        ],
      ),
    );
  }

  void _showForgotPasswordDialog() {
    final user = SupabaseConfig.auth.currentUser;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reset Password'),
        content: Text(
          'We\'ll send a password reset link to ${user?.email ?? 'your email'}.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              Navigator.pop(context);
              if (user?.email != null) {
                await SupabaseConfig.auth.resetPasswordForEmail(user!.email!);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Password reset email sent'),
                      backgroundColor: Colors.green,
                    ),
                  );
                }
              }
            },
            child: const Text('Send Reset Link'),
          ),
        ],
      ),
    );
  }
}
