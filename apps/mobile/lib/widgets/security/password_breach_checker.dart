import 'dart:async';
import 'package:flutter/material.dart';
import '../../models/security_preferences_models.dart';
import '../../services/enhanced_security_service.dart';

/// A widget that checks passwords against known breaches
class PasswordBreachChecker extends StatefulWidget {
  final TextEditingController passwordController;
  final bool checkOnChange;
  final int debounceMs;
  final void Function(PasswordBreachResult?)? onResult;

  const PasswordBreachChecker({
    super.key,
    required this.passwordController,
    this.checkOnChange = true,
    this.debounceMs = 500,
    this.onResult,
  });

  @override
  State<PasswordBreachChecker> createState() => _PasswordBreachCheckerState();
}

class _PasswordBreachCheckerState extends State<PasswordBreachChecker> {
  final _securityService = EnhancedSecurityService.instance;
  PasswordBreachResult? _result;
  bool _checking = false;
  Timer? _debounceTimer;
  String _lastCheckedPassword = '';

  @override
  void initState() {
    super.initState();
    if (widget.checkOnChange) {
      widget.passwordController.addListener(_onPasswordChanged);
    }
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    widget.passwordController.removeListener(_onPasswordChanged);
    super.dispose();
  }

  void _onPasswordChanged() {
    final password = widget.passwordController.text;
    
    // Don't check if password is too short or same as last
    if (password.length < 8 || password == _lastCheckedPassword) {
      return;
    }

    _debounceTimer?.cancel();
    _debounceTimer = Timer(Duration(milliseconds: widget.debounceMs), () {
      _checkPassword(password);
    });
  }

  Future<void> _checkPassword(String password) async {
    if (password.isEmpty) return;

    setState(() => _checking = true);
    _lastCheckedPassword = password;

    final result = await _securityService.checkPasswordBreach(password);
    
    if (mounted && password == widget.passwordController.text) {
      setState(() {
        _result = result;
        _checking = false;
      });
      widget.onResult?.call(result);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    if (_checking) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerHighest.withOpacity(0.5),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            const SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            const SizedBox(width: 12),
            Text(
              'Checking password security...',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurface.withOpacity(0.6),
              ),
            ),
          ],
        ),
      );
    }

    if (_result == null) {
      return const SizedBox.shrink();
    }

    if (_result!.safe) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.green.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.green.withOpacity(0.3)),
        ),
        child: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.green, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Password not found in known breaches',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: Colors.green.shade700,
                ),
              ),
            ),
          ],
        ),
      );
    }

    // Unsafe password
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.red.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.warning_amber, color: Colors.red, size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  _result!.breached
                      ? 'Password found in ${_formatNumber(_result!.breachCount)} data breaches!'
                      : 'Password was recently used',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: Colors.red.shade700,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          if (_result!.recommendations.isNotEmpty) ...[
            const SizedBox(height: 8),
            ...(_result!.recommendations.map((rec) => Padding(
              padding: const EdgeInsets.only(left: 32, top: 4),
              child: Text(
                '• $rec',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: Colors.red.shade600,
                ),
              ),
            ))),
          ],
        ],
      ),
    );
  }

  String _formatNumber(int number) {
    if (number >= 1000000) {
      return '${(number / 1000000).toStringAsFixed(1)}M';
    } else if (number >= 1000) {
      return '${(number / 1000).toStringAsFixed(1)}K';
    }
    return number.toString();
  }
}

/// Inline password strength indicator with breach checking
class PasswordStrengthWithBreachCheck extends StatefulWidget {
  final TextEditingController controller;
  final void Function(bool)? onStrengthChanged;

  const PasswordStrengthWithBreachCheck({
    super.key,
    required this.controller,
    this.onStrengthChanged,
  });

  @override
  State<PasswordStrengthWithBreachCheck> createState() => _PasswordStrengthWithBreachCheckState();
}

class _PasswordStrengthWithBreachCheckState extends State<PasswordStrengthWithBreachCheck> {
  PasswordBreachResult? _breachResult;
  int _strength = 0;

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_updateStrength);
  }

  @override
  void dispose() {
    widget.controller.removeListener(_updateStrength);
    super.dispose();
  }

  void _updateStrength() {
    final password = widget.controller.text;
    int strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (RegExp(r'[A-Z]').hasMatch(password)) strength++;
    if (RegExp(r'[a-z]').hasMatch(password)) strength++;
    if (RegExp(r'[0-9]').hasMatch(password)) strength++;
    if (RegExp(r'[!@#$%^&*(),.?":{}|<>]').hasMatch(password)) strength++;

    setState(() => _strength = strength);
  }

  void _onBreachResult(PasswordBreachResult? result) {
    setState(() => _breachResult = result);
    
    // Consider password weak if breached
    final isStrong = _strength >= 4 && (result?.safe ?? true);
    widget.onStrengthChanged?.call(isStrong);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final password = widget.controller.text;

    if (password.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Strength bar
        Row(
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: _strength / 6,
                  backgroundColor: theme.colorScheme.surfaceContainerHighest,
                  valueColor: AlwaysStoppedAnimation(_getStrengthColor()),
                  minHeight: 6,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Text(
              _getStrengthLabel(),
              style: theme.textTheme.bodySmall?.copyWith(
                color: _getStrengthColor(),
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        
        const SizedBox(height: 12),
        
        // Breach checker
        PasswordBreachChecker(
          passwordController: widget.controller,
          onResult: _onBreachResult,
        ),
      ],
    );
  }

  Color _getStrengthColor() {
    if (_strength <= 2) return Colors.red;
    if (_strength <= 3) return Colors.orange;
    if (_strength <= 4) return Colors.amber;
    return Colors.green;
  }

  String _getStrengthLabel() {
    if (_strength <= 2) return 'Weak';
    if (_strength <= 3) return 'Fair';
    if (_strength <= 4) return 'Good';
    return 'Strong';
  }
}
