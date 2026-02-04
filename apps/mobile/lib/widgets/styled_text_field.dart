import 'package:flutter/material.dart';
import 'package:thittam1hub/theme.dart';

/// A reusable themed text field component that adapts to light/dark mode
class StyledTextField extends StatelessWidget {
  final TextEditingController? controller;
  final String? hintText;
  final String? labelText;
  final String? label; // Alias for labelText
  final String? hint; // Alias for hintText
  final IconData? prefixIcon;
  final Widget? suffix;
  final Widget? suffixIcon;
  final bool obscureText;
  final int? maxLines;
  final int? minLines;
  final int? maxLength;
  final ValueChanged<String>? onChanged;
  final FormFieldValidator<String>? validator;
  final TextInputType? keyboardType;
  final bool filled;
  final bool enabled;
  final FocusNode? focusNode;
  final TextInputAction? textInputAction;
  final VoidCallback? onEditingComplete;
  final ValueChanged<String>? onSubmitted;
  final ValueChanged<String>? onFieldSubmitted; // Alias for onSubmitted

  const StyledTextField({
    super.key,
    this.controller,
    this.hintText,
    this.labelText,
    this.label,
    this.hint,
    this.prefixIcon,
    this.suffix,
    this.suffixIcon,
    this.obscureText = false,
    this.maxLines = 1,
    this.minLines,
    this.maxLength,
    this.onChanged,
    this.validator,
    this.keyboardType,
    this.filled = true,
    this.enabled = true,
    this.focusNode,
    this.textInputAction,
    this.onEditingComplete,
    this.onSubmitted,
    this.onFieldSubmitted,
  });

  String? get _effectiveLabel => labelText ?? label;
  String? get _effectiveHint => hintText ?? hint;
  ValueChanged<String>? get _effectiveOnFieldSubmitted => onSubmitted ?? onFieldSubmitted;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return TextFormField(
      controller: controller,
      obscureText: obscureText,
      maxLines: maxLines,
      minLines: minLines,
      maxLength: maxLength,
      onChanged: onChanged,
      validator: validator,
      keyboardType: keyboardType,
      enabled: enabled,
      focusNode: focusNode,
      textInputAction: textInputAction,
      onEditingComplete: onEditingComplete,
      onFieldSubmitted: _effectiveOnFieldSubmitted,
      decoration: InputDecoration(
        hintText: _effectiveHint,
        labelText: _effectiveLabel,
        prefixIcon: prefixIcon != null
            ? Icon(prefixIcon, color: cs.onSurfaceVariant)
            : null,
        suffix: suffix,
        suffixIcon: suffixIcon,
        filled: filled,
        fillColor: cs.surfaceContainerHighest,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.sm),
          borderSide: BorderSide(color: cs.outline),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.sm),
          borderSide: BorderSide(color: cs.outline),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.sm),
          borderSide: BorderSide(color: cs.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.sm),
          borderSide: BorderSide(color: cs.error),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.sm),
          borderSide: BorderSide(color: cs.error, width: 2),
        ),
        disabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.sm),
          borderSide: BorderSide(color: cs.outline.withValues(alpha: 0.5)),
        ),
      ),
    );
  }
}

/// A search-optimized text field with rounded styling
class StyledSearchField extends StatelessWidget {
  final TextEditingController? controller;
  final String? hintText;
  final ValueChanged<String>? onChanged;
  final VoidCallback? onClear;

  const StyledSearchField({
    super.key,
    this.controller,
    this.hintText,
    this.onChanged,
    this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final hasText = controller?.text.isNotEmpty ?? false;

    return TextField(
      controller: controller,
      onChanged: onChanged,
      decoration: InputDecoration(
        hintText: hintText ?? 'Search...',
        prefixIcon: Icon(Icons.search, color: cs.onSurfaceVariant),
        suffixIcon: hasText && onClear != null
            ? IconButton(
                icon: Icon(Icons.close, color: cs.onSurfaceVariant),
                onPressed: onClear,
              )
            : null,
        filled: true,
        fillColor: cs.surfaceContainerHighest,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(999),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(999),
          borderSide: BorderSide(color: cs.outline),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(999),
          borderSide: BorderSide(color: cs.primary),
        ),
        contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
      ),
    );
  }
}
