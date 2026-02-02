import 'dart:async';
import 'package:flutter/material.dart';

/// A wrapper widget that provides real-time inline validation feedback
/// for text fields as the user types.
class InlineFieldValidator extends StatefulWidget {
  final TextEditingController controller;
  final String? Function(String?) validator;
  final int debounceMs;
  final Widget child;
  
  const InlineFieldValidator({
    super.key,
    required this.controller,
    required this.validator,
    required this.child,
    this.debounceMs = 300,
  });

  @override
  State<InlineFieldValidator> createState() => _InlineFieldValidatorState();
}

class _InlineFieldValidatorState extends State<InlineFieldValidator> {
  String? _error;
  Timer? _debounceTimer;
  bool _hasInteracted = false;

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_onTextChanged);
  }

  @override
  void dispose() {
    widget.controller.removeListener(_onTextChanged);
    _debounceTimer?.cancel();
    super.dispose();
  }

  void _onTextChanged() {
    if (!_hasInteracted) {
      setState(() => _hasInteracted = true);
    }
    
    _debounceTimer?.cancel();
    _debounceTimer = Timer(Duration(milliseconds: widget.debounceMs), () {
      if (mounted) {
        final error = widget.validator(widget.controller.text);
        setState(() => _error = error);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        widget.child,
        if (_hasInteracted && _error != null) ...[
          const SizedBox(height: 4),
          Row(
            children: [
              Icon(Icons.error_outline, size: 14, color: cs.error),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  _error!,
                  style: TextStyle(
                    fontSize: 12,
                    color: cs.error,
                  ),
                ),
              ),
            ],
          ),
        ],
        if (_hasInteracted && _error == null && widget.controller.text.isNotEmpty) ...[
          const SizedBox(height: 4),
          Row(
            children: [
              Icon(Icons.check_circle, size: 14, color: Colors.green.shade600),
              const SizedBox(width: 4),
              Text(
                'Looks good!',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.green.shade600,
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}

/// A TextFormField with built-in real-time inline validation
class ValidatedTextField extends StatefulWidget {
  final TextEditingController controller;
  final String? Function(String?) validator;
  final InputDecoration? decoration;
  final TextInputType? keyboardType;
  final int? maxLength;
  final int? maxLines;
  final bool obscureText;
  final bool enabled;
  final ValueChanged<String>? onChanged;
  final int debounceMs;
  final bool showSuccessIndicator;

  const ValidatedTextField({
    super.key,
    required this.controller,
    required this.validator,
    this.decoration,
    this.keyboardType,
    this.maxLength,
    this.maxLines = 1,
    this.obscureText = false,
    this.enabled = true,
    this.onChanged,
    this.debounceMs = 300,
    this.showSuccessIndicator = true,
  });

  @override
  State<ValidatedTextField> createState() => _ValidatedTextFieldState();
}

class _ValidatedTextFieldState extends State<ValidatedTextField> {
  String? _error;
  Timer? _debounceTimer;
  bool _hasInteracted = false;

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_onTextChanged);
  }

  @override
  void dispose() {
    widget.controller.removeListener(_onTextChanged);
    _debounceTimer?.cancel();
    super.dispose();
  }

  void _onTextChanged() {
    if (!_hasInteracted) {
      setState(() => _hasInteracted = true);
    }
    
    _debounceTimer?.cancel();
    _debounceTimer = Timer(Duration(milliseconds: widget.debounceMs), () {
      if (mounted) {
        final error = widget.validator(widget.controller.text);
        setState(() => _error = error);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isValid = _hasInteracted && _error == null && widget.controller.text.isNotEmpty;
    
    // Add validation visual feedback to suffix
    Widget? suffixIcon;
    if (_hasInteracted && widget.controller.text.isNotEmpty) {
      if (_error != null) {
        suffixIcon = Icon(Icons.error_outline, color: cs.error);
      } else if (widget.showSuccessIndicator) {
        suffixIcon = const Icon(Icons.check_circle, color: Colors.green);
      }
    }
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextFormField(
          controller: widget.controller,
          keyboardType: widget.keyboardType,
          maxLength: widget.maxLength,
          maxLines: widget.maxLines,
          obscureText: widget.obscureText,
          enabled: widget.enabled,
          onChanged: widget.onChanged,
          decoration: (widget.decoration ?? const InputDecoration()).copyWith(
            suffixIcon: suffixIcon ?? widget.decoration?.suffixIcon,
            errorText: _hasInteracted ? _error : null,
          ),
          validator: widget.validator,
        ),
        if (isValid && widget.showSuccessIndicator) ...[
          const SizedBox(height: 2),
          Row(
            children: [
              Icon(Icons.check_circle, size: 12, color: Colors.green.shade600),
              const SizedBox(width: 4),
              Text(
                'Valid',
                style: TextStyle(
                  fontSize: 11,
                  color: Colors.green.shade600,
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}
