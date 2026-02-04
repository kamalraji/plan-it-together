import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/services/username_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/styled_text_field.dart';

/// Bottom sheet for changing username with availability check and cooldown
class UsernameChangeSheet extends StatefulWidget {
  final String? currentUsername;
  final DateTime? lastUsernameChange;
  final VoidCallback? onUsernameChanged;

  const UsernameChangeSheet({
    super.key,
    this.currentUsername,
    this.lastUsernameChange,
    this.onUsernameChanged,
  });

  /// Show the username change sheet
  static Future<bool?> show(
    BuildContext context, {
    String? currentUsername,
    DateTime? lastUsernameChange,
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => UsernameChangeSheet(
        currentUsername: currentUsername,
        lastUsernameChange: lastUsernameChange,
      ),
    );
  }

  @override
  State<UsernameChangeSheet> createState() => _UsernameChangeSheetState();
}

class _UsernameChangeSheetState extends State<UsernameChangeSheet> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _usernameService = UsernameService.instance;
  
  bool _isLoading = false;
  bool _isCheckingAvailability = false;
  bool? _isAvailable;
  String? _errorMessage;
  String? _availabilityMessage;

  // Cooldown: 90 days between changes
  static const _cooldownDays = 90;

  bool get _isOnCooldown {
    if (widget.lastUsernameChange == null) return false;
    final cooldownEnd = widget.lastUsernameChange!.add(const Duration(days: _cooldownDays));
    return DateTime.now().isBefore(cooldownEnd);
  }

  int get _daysUntilCooldownEnds {
    if (widget.lastUsernameChange == null) return 0;
    final cooldownEnd = widget.lastUsernameChange!.add(const Duration(days: _cooldownDays));
    return cooldownEnd.difference(DateTime.now()).inDays;
  }

  @override
  void initState() {
    super.initState();
    _usernameController.addListener(_onUsernameChanged);
  }

  @override
  void dispose() {
    _usernameController.removeListener(_onUsernameChanged);
    _usernameController.dispose();
    super.dispose();
  }

  void _onUsernameChanged() {
    // Reset availability when typing
    if (_isAvailable != null || _availabilityMessage != null) {
      setState(() {
        _isAvailable = null;
        _availabilityMessage = null;
      });
    }
  }

  String? _validateUsername(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Username is required';
    }
    final trimmed = value.trim().toLowerCase();
    if (trimmed.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (trimmed.length > 30) {
      return 'Username must be at most 30 characters';
    }
    if (!RegExp(r'^[a-z0-9_]+$').hasMatch(trimmed)) {
      return 'Only letters, numbers, and underscores allowed';
    }
    if (trimmed == widget.currentUsername?.toLowerCase()) {
      return 'New username must be different';
    }
    return null;
  }

  Future<void> _checkAvailability() async {
    final validation = _validateUsername(_usernameController.text);
    if (validation != null) {
      setState(() {
        _availabilityMessage = validation;
        _isAvailable = false;
      });
      return;
    }

    setState(() {
      _isCheckingAvailability = true;
      _availabilityMessage = null;
    });

    try {
      final username = _usernameController.text.trim().toLowerCase();
      final result = await _usernameService.checkAvailability(username);
      
      if (mounted) {
        setState(() {
          _isCheckingAvailability = false;
          _isAvailable = result.isAvailable;
          _availabilityMessage = result.isAvailable
              ? '@$username is available!'
              : '@$username is already taken';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isCheckingAvailability = false;
          _isAvailable = false;
          _availabilityMessage = 'Failed to check availability';
        });
      }
    }
  }

  Future<void> _submitUsernameChange() async {
    if (!_formKey.currentState!.validate()) return;
    if (_isAvailable != true) {
      await _checkAvailability();
      if (_isAvailable != true) return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    HapticFeedback.mediumImpact();

    try {
      final userId = SupabaseConfig.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      final username = _usernameController.text.trim().toLowerCase();
      await _usernameService.updateUsername(userId, username);

      if (mounted) {
        HapticFeedback.heavyImpact();
        widget.onUsernameChanged?.call();
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Username changed to @$username'),
            behavior: SnackBarBehavior.floating,
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        String message = 'Failed to update username';
        if (e.toString().contains('already taken')) {
          message = 'This username is no longer available';
        } else if (e.toString().contains('rate limit')) {
          message = 'Too many attempts. Try again later';
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
        child: _isOnCooldown ? _buildCooldownView(cs, textTheme) : _buildFormView(cs, textTheme),
      ),
    );
  }

  Widget _buildCooldownView(ColorScheme cs, TextTheme textTheme) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: const Duration(milliseconds: 500),
      curve: Curves.easeOutCubic,
      builder: (context, value, child) => Opacity(
        opacity: value,
        child: Transform.translate(
          offset: Offset(0, 20 * (1 - value)),
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

          // Animated hourglass icon
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0.0, end: 1.0),
            duration: const Duration(milliseconds: 600),
            curve: Curves.elasticOut,
            builder: (context, value, child) => Transform.scale(
              scale: value,
              child: Transform.rotate(
                angle: (1 - value) * 0.5,
                child: child,
              ),
            ),
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.orange.withOpacity(0.1),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.orange.withOpacity(0.15),
                    blurRadius: 20,
                    spreadRadius: 5,
                  ),
                ],
              ),
              child: const Icon(
                Icons.hourglass_empty_rounded,
                size: 48,
                color: Colors.orange,
              ),
            ),
          ),
          const SizedBox(height: 24),

          Text(
            'Username Change Cooldown',
            style: textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),

          Text(
            'You can only change your username once every $_cooldownDays days.',
            style: textTheme.bodyMedium?.copyWith(
              color: cs.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),

          // Animated countdown badge
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0.0, end: 1.0),
            duration: const Duration(milliseconds: 400),
            curve: Curves.easeOutBack,
            builder: (context, value, child) => Transform.scale(
              scale: value,
              child: child,
            ),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.orange.withOpacity(0.15),
                    Colors.amber.withOpacity(0.1),
                  ],
                ),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.orange.withOpacity(0.3)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.timer_outlined, color: Colors.orange),
                  const SizedBox(width: 8),
                  Text(
                    '$_daysUntilCooldownEnds days remaining',
                    style: textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: Colors.orange,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 32),

          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Got it'),
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
            'Change Username',
            style: textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Choose a unique username for your profile',
            style: textTheme.bodyMedium?.copyWith(
              color: cs.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 24),

          // Current username
          if (widget.currentUsername != null) ...[
            Text(
              'Current Username',
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
                  Icon(Icons.alternate_email, size: 20, color: cs.onSurfaceVariant),
                  const SizedBox(width: 8),
                  Text(
                    widget.currentUsername!,
                    style: textTheme.bodyMedium?.copyWith(
                      color: cs.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],

          // New username input
          Text(
            'New Username',
            style: textTheme.labelMedium?.copyWith(
              color: cs.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: StyledTextField(
                  controller: _usernameController,
                  hintText: 'username',
                  prefixIcon: Icons.alternate_email,
                  validator: _validateUsername,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _checkAvailability(),
                ),
              ),
              const SizedBox(width: 12),
              SizedBox(
                height: 56,
                child: OutlinedButton(
                  onPressed: _isCheckingAvailability ? null : _checkAvailability,
                  child: _isCheckingAvailability
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Check'),
                ),
              ),
            ],
          ),

          // Availability message with animated entrance
          AnimatedSize(
            duration: const Duration(milliseconds: 200),
            child: _availabilityMessage != null
                ? Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: TweenAnimationBuilder<double>(
                      tween: Tween(begin: 0.0, end: 1.0),
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeOutCubic,
                      builder: (context, value, child) => Transform.translate(
                        offset: Offset(0, 10 * (1 - value)),
                        child: Opacity(
                          opacity: value,
                          child: child,
                        ),
                      ),
                      child: Row(
                        children: [
                          TweenAnimationBuilder<double>(
                            tween: Tween(begin: 0.0, end: 1.0),
                            duration: const Duration(milliseconds: 400),
                            curve: Curves.elasticOut,
                            builder: (context, value, child) => Transform.scale(
                              scale: value,
                              child: child,
                            ),
                            child: Icon(
                              _isAvailable == true ? Icons.check_circle : Icons.cancel,
                              size: 16,
                              color: _isAvailable == true ? AppColors.success : cs.error,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            _availabilityMessage!,
                            style: textTheme.bodySmall?.copyWith(
                              color: _isAvailable == true ? AppColors.success : cs.error,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                : const SizedBox.shrink(),
          ),

          const SizedBox(height: 12),

          // Guidelines
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: cs.surfaceContainerHighest.withOpacity(0.3),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Username rules:',
                  style: textTheme.labelSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: cs.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 8),
                _buildRule(cs, textTheme, '3-30 characters'),
                _buildRule(cs, textTheme, 'Letters, numbers, underscores only'),
                _buildRule(cs, textTheme, 'Can only be changed once every $_cooldownDays days'),
              ],
            ),
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

          // Submit button
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: _isLoading || _isAvailable != true ? null : _submitUsernameChange,
              icon: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.check_rounded),
              label: Text(_isLoading ? 'Updating...' : 'Update Username'),
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRule(ColorScheme cs, TextTheme textTheme, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Icon(Icons.circle, size: 4, color: cs.onSurfaceVariant),
          const SizedBox(width: 8),
          Text(
            text,
            style: textTheme.bodySmall?.copyWith(
              color: cs.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}
