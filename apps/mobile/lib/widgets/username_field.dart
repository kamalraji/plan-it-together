import 'dart:async';
import 'package:flutter/material.dart';
import 'package:thittam1hub/models/username_models.dart';
import 'package:thittam1hub/services/username_service.dart';
import 'package:thittam1hub/utils/username_validators.dart';

/// A styled username input field with real-time availability checking.
/// 
/// Features:
/// - Debounced availability checking (500ms) using server-side RPC
/// - Visual feedback for availability status with specific error messages
/// - Username strength indicator
/// - Auto-suggestions based on full name
/// - Format validation as you type
class UsernameField extends StatefulWidget {
  final TextEditingController controller;
  final String? excludeUserId;
  final String? fullName;
  final ValueChanged<bool>? onAvailabilityChanged;
  final bool enabled;
  final String? initialValue;
  final bool showStrengthIndicator;

  const UsernameField({
    super.key,
    required this.controller,
    this.excludeUserId,
    this.fullName,
    this.onAvailabilityChanged,
    this.enabled = true,
    this.initialValue,
    this.showStrengthIndicator = true,
  });

  @override
  State<UsernameField> createState() => _UsernameFieldState();
}

class _UsernameFieldState extends State<UsernameField> {
  final _usernameService = UsernameService.instance;
  Timer? _debounceTimer;
  
  bool _isChecking = false;
  UsernameCheckResult? _checkResult;
  String? _validationError;
  List<String> _suggestions = [];
  bool _showSuggestions = false;

  bool? get _isAvailable => _checkResult?.available;

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_onUsernameChanged);
    
    // If there's an initial value, it's the current username (already taken by this user)
    if (widget.initialValue != null && widget.initialValue!.isNotEmpty) {
      _checkResult = const UsernameCheckResult(
        available: true,
        message: 'This is your current username',
      );
    }
  }

  @override
  void dispose() {
    widget.controller.removeListener(_onUsernameChanged);
    _debounceTimer?.cancel();
    super.dispose();
  }

  void _onUsernameChanged() {
    final value = widget.controller.text.trim();
    
    // Reset state
    setState(() {
      _checkResult = null;
      _validationError = null;
      _showSuggestions = false;
    });

    // Cancel previous timer
    _debounceTimer?.cancel();

    // Skip if empty
    if (value.isEmpty) {
      widget.onAvailabilityChanged?.call(false);
      return;
    }

    // Skip if same as initial value (unchanged)
    if (value.toLowerCase() == widget.initialValue?.toLowerCase()) {
      setState(() {
        _checkResult = const UsernameCheckResult(
          available: true,
          message: 'This is your current username',
        );
      });
      widget.onAvailabilityChanged?.call(true);
      return;
    }

    // Validate format immediately (client-side for fast feedback)
    final error = UsernameValidators.validateUsername(value);
    if (error != null) {
      setState(() => _validationError = error);
      widget.onAvailabilityChanged?.call(false);
      return;
    }

    // Debounce server-side availability check
    setState(() => _isChecking = true);
    _debounceTimer = Timer(const Duration(milliseconds: 500), () {
      _checkAvailability(value);
    });
  }

  Future<void> _checkAvailability(String username) async {
    if (!mounted) return;

    final result = await _usernameService.checkUsernameAvailability(
      username,
      excludeUserId: widget.excludeUserId,
    );

    if (!mounted) return;

    setState(() {
      _isChecking = false;
      _checkResult = result;
      // Show server error message for specific reasons
      if (!result.available && result.reason != null && result.reason != 'taken') {
        _validationError = result.message;
      }
    });

    widget.onAvailabilityChanged?.call(result.available);

    // If not available and full name provided, suggest alternatives
    if (!result.available && widget.fullName != null) {
      _loadSuggestions();
    }
  }

  Future<void> _loadSuggestions() async {
    if (widget.fullName == null) return;

    final suggestions = await _usernameService.suggestUsernames(widget.fullName!);
    
    if (!mounted) return;

    setState(() {
      _suggestions = suggestions;
      _showSuggestions = suggestions.isNotEmpty;
    });
  }

  void _selectSuggestion(String username) {
    widget.controller.text = username;
    setState(() => _showSuggestions = false);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextFormField(
          controller: widget.controller,
          enabled: widget.enabled,
          textInputAction: TextInputAction.next,
          autocorrect: false,
          enableSuggestions: false,
          decoration: InputDecoration(
            labelText: 'Username',
            hintText: 'Choose a unique username',
            prefixText: '@',
            prefixStyle: TextStyle(
              color: cs.primary,
              fontWeight: FontWeight.w600,
            ),
            border: const OutlineInputBorder(),
            helperText: 'Must start with letter, 3-30 characters',
            helperMaxLines: 2,
            errorText: _validationError,
            errorMaxLines: 2,
            suffixIcon: _buildSuffixIcon(cs),
          ),
          validator: (value) {
            if (value == null || value.trim().isEmpty) {
              return null; // Username is optional
            }
            return UsernameValidators.validateUsername(value);
          },
        ),
        
        // Strength indicator
        if (widget.showStrengthIndicator) _buildStrengthIndicator(cs),
        
        // Availability status
        if (_isAvailable != null && _validationError == null) ...[
          const SizedBox(height: 4),
          _buildAvailabilityStatus(cs),
        ],

        // Suggestions
        if (_showSuggestions && _suggestions.isNotEmpty) ...[
          const SizedBox(height: 8),
          _buildSuggestions(cs),
        ],
      ],
    );
  }

  Widget _buildStrengthIndicator(ColorScheme cs) {
    final username = widget.controller.text.trim();
    if (username.isEmpty || _validationError != null) {
      return const SizedBox.shrink();
    }

    final strength = UsernameValidators.calculateStrength(username);
    final color = strength >= 70
        ? Colors.green
        : strength >= 40
            ? Colors.orange
            : Colors.red;
    final label = strength >= 70
        ? 'Strong'
        : strength >= 40
            ? 'Fair'
            : 'Weak';

    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(2),
            child: LinearProgressIndicator(
              value: strength / 100,
              backgroundColor: cs.surfaceContainerHighest,
              color: color,
              minHeight: 4,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            'Username strength: $label',
            style: TextStyle(
              fontSize: 11,
              color: cs.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSuffixIcon(ColorScheme cs) {
    if (_isChecking) {
      return Container(
        width: 20,
        height: 20,
        padding: const EdgeInsets.all(12),
        child: CircularProgressIndicator(
          strokeWidth: 2,
          color: cs.primary,
        ),
      );
    }

    if (_validationError != null) {
      return Icon(Icons.error_outline, color: cs.error);
    }

    if (_isAvailable == true) {
      return const Icon(Icons.check_circle, color: Colors.green);
    }

    if (_isAvailable == false) {
      return Icon(Icons.cancel, color: cs.error);
    }

    return const SizedBox.shrink();
  }

  Widget _buildAvailabilityStatus(ColorScheme cs) {
    if (_isAvailable == true) {
      return Row(
        children: [
          Icon(Icons.check_circle, size: 14, color: Colors.green.shade600),
          const SizedBox(width: 4),
          Text(
            'Username is available!',
            style: TextStyle(
              fontSize: 12,
              color: Colors.green.shade600,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      );
    }

    // Use server message for specific feedback
    final message = _checkResult?.isReserved == true
        ? 'This username is reserved'
        : _checkResult?.isTaken == true
            ? 'Username is already taken'
            : _checkResult?.message ?? 'Username is not available';

    return Row(
      children: [
        Icon(Icons.cancel, size: 14, color: cs.error),
        const SizedBox(width: 4),
        Expanded(
          child: Text(
            message,
            style: TextStyle(
              fontSize: 12,
              color: cs.error,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSuggestions(ColorScheme cs) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Try one of these:',
          style: TextStyle(
            fontSize: 12,
            color: cs.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 4),
        Wrap(
          spacing: 8,
          runSpacing: 4,
          children: _suggestions.map((suggestion) {
            return ActionChip(
              label: Text('@$suggestion'),
              onPressed: () => _selectSuggestion(suggestion),
              backgroundColor: cs.primaryContainer,
              labelStyle: TextStyle(
                color: cs.onPrimaryContainer,
                fontSize: 12,
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}
