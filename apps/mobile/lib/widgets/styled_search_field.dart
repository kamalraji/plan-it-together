import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/theme.dart';

/// Size variants for the search field
enum SearchFieldSize {
  /// Compact size for app bars and tight spaces (height ~40)
  compact,
  /// Normal size for standard use (height ~48)
  normal,
  /// Large size for prominent search (height ~56)
  large,
}

/// An enhanced, theme-aware search field with animations,
/// debounce support, and loading indicators.
/// 
/// Features:
/// - Animated focus state with scale/border transitions
/// - Built-in debounce timer (configurable duration)
/// - Loading spinner overlay
/// - Size variants (compact, normal, large)
/// - Haptic feedback on clear
/// - Reduced motion support
/// 
/// Usage:
/// ```dart
/// StyledSearchField(
///   controller: _searchController,
///   hintText: 'Search messages...',
///   onChanged: (query) => _performSearch(query),
///   debounceDuration: Duration(milliseconds: 300),
/// )
/// ```
class StyledSearchField extends StatefulWidget {
  /// The text editing controller
  final TextEditingController? controller;
  
  /// Hint text shown when the field is empty
  final String? hintText;
  
  /// Callback when the text changes (after debounce)
  final ValueChanged<String>? onChanged;
  
  /// Callback when the clear button is tapped
  final VoidCallback? onClear;
  
  /// Callback when the search is submitted
  final VoidCallback? onSubmitted;
  
  /// Whether to autofocus the field
  final bool autofocus;
  
  /// Whether to show a loading indicator
  final bool isLoading;
  
  /// Whether to show the clear button when text is present
  final bool showClearButton;
  
  /// Debounce duration for onChanged callback
  final Duration debounceDuration;
  
  /// Optional focus node
  final FocusNode? focusNode;
  
  /// Whether the field is enabled
  final bool enabled;
  
  /// Size variant of the search field
  final SearchFieldSize size;

  const StyledSearchField({
    super.key,
    this.controller,
    this.hintText,
    this.onChanged,
    this.onClear,
    this.onSubmitted,
    this.autofocus = false,
    this.isLoading = false,
    this.showClearButton = true,
    this.debounceDuration = const Duration(milliseconds: 300),
    this.focusNode,
    this.enabled = true,
    this.size = SearchFieldSize.normal,
  });

  @override
  State<StyledSearchField> createState() => _StyledSearchFieldState();
}

class _StyledSearchFieldState extends State<StyledSearchField>
    with SingleTickerProviderStateMixin {
  late TextEditingController _controller;
  late FocusNode _focusNode;
  Timer? _debounceTimer;
  bool _isFocused = false;
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = widget.controller ?? TextEditingController();
    _focusNode = widget.focusNode ?? FocusNode();
    _focusNode.addListener(_handleFocusChange);
    
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    
    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.02).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _focusNode.removeListener(_handleFocusChange);
    if (widget.focusNode == null) _focusNode.dispose();
    if (widget.controller == null) _controller.dispose();
    _animationController.dispose();
    super.dispose();
  }

  void _handleFocusChange() {
    final reducedMotion = MediaQuery.of(context).disableAnimations;
    
    setState(() => _isFocused = _focusNode.hasFocus);
    
    if (!reducedMotion) {
      if (_focusNode.hasFocus) {
        _animationController.forward();
      } else {
        _animationController.reverse();
      }
    }
  }

  void _onTextChanged(String value) {
    _debounceTimer?.cancel();
    
    if (widget.onChanged == null) return;
    
    _debounceTimer = Timer(widget.debounceDuration, () {
      widget.onChanged?.call(value);
    });
    
    // Trigger rebuild for clear button visibility
    setState(() {});
  }

  void _handleClear() {
    HapticFeedback.selectionClick();
    _controller.clear();
    widget.onChanged?.call('');
    widget.onClear?.call();
    setState(() {});
  }

  double get _height {
    switch (widget.size) {
      case SearchFieldSize.compact:
        return 40;
      case SearchFieldSize.normal:
        return 48;
      case SearchFieldSize.large:
        return 56;
    }
  }

  double get _iconSize {
    switch (widget.size) {
      case SearchFieldSize.compact:
        return 18;
      case SearchFieldSize.normal:
        return 20;
      case SearchFieldSize.large:
        return 24;
    }
  }

  EdgeInsets get _contentPadding {
    switch (widget.size) {
      case SearchFieldSize.compact:
        return const EdgeInsets.symmetric(horizontal: 12, vertical: 8);
      case SearchFieldSize.normal:
        return const EdgeInsets.symmetric(horizontal: 16, vertical: 12);
      case SearchFieldSize.large:
        return const EdgeInsets.symmetric(horizontal: 20, vertical: 16);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final hasText = _controller.text.isNotEmpty;
    final showClear = widget.showClearButton && hasText && !widget.isLoading;

    return ScaleTransition(
      scale: _scaleAnimation,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        height: _height,
        decoration: BoxDecoration(
          color: cs.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: _isFocused ? cs.primary : cs.outline.withOpacity(0.5),
            width: _isFocused ? 2 : 1,
          ),
          boxShadow: _isFocused
              ? [
                  BoxShadow(
                    color: cs.primary.withOpacity(0.1),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: TextField(
          controller: _controller,
          focusNode: _focusNode,
          autofocus: widget.autofocus,
          enabled: widget.enabled,
          onChanged: _onTextChanged,
          onSubmitted: (_) => widget.onSubmitted?.call(),
          textInputAction: TextInputAction.search,
          style: context.textStyles.bodyMedium,
          decoration: InputDecoration(
            hintText: widget.hintText ?? 'Search...',
            hintStyle: context.textStyles.bodyMedium?.copyWith(
              color: cs.onSurfaceVariant.withOpacity(0.7),
            ),
            prefixIcon: Padding(
              padding: const EdgeInsets.only(left: 12, right: 8),
              child: Icon(
                Icons.search,
                size: _iconSize,
                color: _isFocused ? cs.primary : cs.onSurfaceVariant,
              ),
            ),
            prefixIconConstraints: BoxConstraints(
              minWidth: _iconSize + 20,
              minHeight: _iconSize,
            ),
            suffixIcon: widget.isLoading
                ? Padding(
                    padding: const EdgeInsets.all(12),
                    child: SizedBox(
                      width: _iconSize,
                      height: _iconSize,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: cs.primary,
                      ),
                    ),
                  )
                : showClear
                    ? IconButton(
                        icon: Icon(Icons.close, size: _iconSize),
                        color: cs.onSurfaceVariant,
                        onPressed: _handleClear,
                      )
                    : null,
            border: InputBorder.none,
            contentPadding: _contentPadding,
          ),
        ),
      ),
    );
  }
}
