import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart' show UserAttributes;
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/settings_components.dart';
import 'package:thittam1hub/widgets/styled_text_field.dart';

/// Bottom sheet for changing email address with verification flow
class EmailChangeSheet extends StatefulWidget {
  final String currentEmail;
  final VoidCallback? onEmailChanged;

  const EmailChangeSheet({
    super.key,
    required this.currentEmail,
    this.onEmailChanged,
  });

  /// Show the email change sheet
  static Future<bool?> show(BuildContext context, String currentEmail) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => EmailChangeSheet(currentEmail: currentEmail),
    );
  }

  @override
  State<EmailChangeSheet> createState() => _EmailChangeSheetState();
}

class _EmailChangeSheetState extends State<EmailChangeSheet> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  
  bool _isLoading = false;
  bool _obscurePassword = true;
  String? _errorMessage;
  bool _emailSent = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  String? _validateEmail(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Email is required';
    }
    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!emailRegex.hasMatch(value.trim())) {
      return 'Enter a valid email address';
    }
    if (value.trim().toLowerCase() == widget.currentEmail.toLowerCase()) {
      return 'New email must be different';
    }
    return null;
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required to confirm identity';
    }
    return null;
  }

  Future<void> _submitEmailChange() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    HapticFeedback.mediumImpact();

    try {
      // First verify current password by re-authenticating
      final currentEmail = widget.currentEmail;
      final password = _passwordController.text;
      
      // Try to sign in with current credentials to verify password
      final verifyResult = await SupabaseConfig.auth.signInWithPassword(
        email: currentEmail,
        password: password,
      );

      if (verifyResult.user == null) {
        setState(() {
          _errorMessage = 'Incorrect password';
          _isLoading = false;
        });
        return;
      }

      // Now update the email
      final newEmail = _emailController.text.trim();
      await SupabaseConfig.auth.updateUser(
        UserAttributes(email: newEmail),
      );

      if (mounted) {
        setState(() {
          _isLoading = false;
          _emailSent = true;
        });
        HapticFeedback.heavyImpact();
      }
    } catch (e) {
      if (mounted) {
        String message = 'Failed to update email';
        if (e.toString().contains('Invalid login')) {
          message = 'Incorrect password';
        } else if (e.toString().contains('rate limit')) {
          message = 'Too many attempts. Try again later';
        } else if (e.toString().contains('already registered')) {
          message = 'This email is already in use';
        }
        setState(() {
          _errorMessage = message;
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final bottomPadding = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(24, 16, 24, 24 + bottomPadding),
        child: _emailSent ? _buildSuccessView(cs, textTheme) : _buildFormView(cs, textTheme),
      ),
    );
  }

  Widget _buildSuccessView(ColorScheme cs, TextTheme textTheme) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: const Duration(milliseconds: 600),
      curve: Curves.easeOutBack,
      builder: (context, value, child) => Transform.scale(
        scale: 0.8 + (0.2 * value),
        child: Opacity(
          opacity: value,
          child: child,
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: cs.outlineVariant,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 32),

          // Animated success icon with pulse effect
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0.0, end: 1.0),
            duration: const Duration(milliseconds: 800),
            curve: Curves.elasticOut,
            builder: (context, value, child) => Transform.scale(
              scale: value,
              child: child,
            ),
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.success.withOpacity(0.1),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.success.withOpacity(0.2),
                    blurRadius: 20,
                    spreadRadius: 5,
                  ),
                ],
              ),
              child: const Icon(
                Icons.mark_email_read_rounded,
                size: 48,
                color: AppColors.success,
              ),
            ),
          ),
          const SizedBox(height: 24),

          Text(
            'Verification Email Sent',
            style: textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),

          Text(
            'We\'ve sent a verification link to:',
            style: textTheme.bodyMedium?.copyWith(
              color: cs.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),

          // Highlighted email with animated border
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0.0, end: 1.0),
            duration: const Duration(milliseconds: 400),
            curve: Curves.easeOut,
            builder: (context, value, child) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: cs.primaryContainer.withOpacity(0.3 * value),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: cs.primary.withOpacity(0.3 * value),
                ),
              ),
              child: child,
            ),
            child: Text(
              _emailController.text.trim(),
              style: textTheme.bodyLarge?.copyWith(
                fontWeight: FontWeight.w600,
                color: cs.primary,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 16),

          Text(
            'Click the link in the email to confirm your new address. Your email will be updated once verified.',
            style: textTheme.bodySmall?.copyWith(
              color: cs.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),

          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Done'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormView(ColorScheme cs, TextTheme textTheme) {
    return Form(
      key: _formKey,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: cs.outlineVariant,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Header
          Text(
            'Change Email',
            style: textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'A verification email will be sent to your new address',
            style: textTheme.bodyMedium?.copyWith(
              color: cs.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 24),

          // Current email (read-only)
          Text(
            'Current Email',
            style: textTheme.labelMedium?.copyWith(
              color: cs.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: cs.surfaceContainerHighest.withOpacity(0.5),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(Icons.email_outlined, size: 20, color: cs.onSurfaceVariant),
                const SizedBox(width: 12),
                Text(
                  widget.currentEmail,
                  style: textTheme.bodyMedium?.copyWith(
                    color: cs.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // New email input
          Text(
            'New Email',
            style: textTheme.labelMedium?.copyWith(
              color: cs.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          StyledTextField(
            controller: _emailController,
            hintText: 'Enter new email address',
            keyboardType: TextInputType.emailAddress,
            prefixIcon: Icons.alternate_email_rounded,
            validator: _validateEmail,
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 20),

          // Password confirmation
          Text(
            'Confirm Password',
            style: textTheme.labelMedium?.copyWith(
              color: cs.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          StyledTextField(
            controller: _passwordController,
            hintText: 'Enter your current password',
            obscureText: _obscurePassword,
            prefixIcon: Icons.lock_outline_rounded,
            suffixIcon: IconButton(
              icon: Icon(
                _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                color: cs.onSurfaceVariant,
              ),
              onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
            ),
            validator: _validatePassword,
            textInputAction: TextInputAction.done,
            onFieldSubmitted: (_) => _submitEmailChange(),
          ),

          // Error message
          if (_errorMessage != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: cs.error.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(Icons.error_outline, size: 20, color: cs.error),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _errorMessage!,
                      style: textTheme.bodySmall?.copyWith(color: cs.error),
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 24),

          // Submit button with loading animation
          _AnimatedSubmitButton(
            isLoading: _isLoading,
            onPressed: _submitEmailChange,
            icon: Icons.send_rounded,
            label: 'Send Verification Email',
            loadingLabel: 'Sending...',
          ),
        ],
      ),
    );
  }
}

/// Animated submit button with scale feedback
class _AnimatedSubmitButton extends StatefulWidget {
  final bool isLoading;
  final VoidCallback onPressed;
  final IconData icon;
  final String label;
  final String loadingLabel;

  const _AnimatedSubmitButton({
    required this.isLoading,
    required this.onPressed,
    required this.icon,
    required this.label,
    required this.loadingLabel,
  });

  @override
  State<_AnimatedSubmitButton> createState() => _AnimatedSubmitButtonState();
}

class _AnimatedSubmitButtonState extends State<_AnimatedSubmitButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.98).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) => _controller.reverse(),
      onTapCancel: () => _controller.reverse(),
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) => Transform.scale(
          scale: _scaleAnimation.value,
          child: child,
        ),
        child: SizedBox(
          width: double.infinity,
          child: FilledButton.icon(
            onPressed: widget.isLoading ? null : widget.onPressed,
            icon: widget.isLoading
                ? SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        Theme.of(context).colorScheme.onPrimary,
                      ),
                    ),
                  )
                : Icon(widget.icon),
            label: AnimatedSwitcher(
              duration: const Duration(milliseconds: 200),
              child: Text(
                widget.isLoading ? widget.loadingLabel : widget.label,
                key: ValueKey(widget.isLoading),
              ),
            ),
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
          ),
        ),
      ),
    );
  }
}
