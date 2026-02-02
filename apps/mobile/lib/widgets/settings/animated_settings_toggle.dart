import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/services/accessibility_service.dart';
import 'package:thittam1hub/theme.dart';

/// Animated Settings Toggle with Success Feedback
/// 
/// A Switch widget wrapper that shows a subtle success animation
/// when a setting is successfully saved.
/// 
/// Features:
/// - Success checkmark animation on save
/// - Error shake animation on failure
/// - Haptic feedback
/// - Respects reduce motion preference
/// - Loading state support
class AnimatedSettingsToggle extends StatefulWidget {
  final bool value;
  final ValueChanged<bool>? onChanged;
  final bool isLoading;
  final bool showSuccessAnimation;
  final Duration successAnimationDuration;

  const AnimatedSettingsToggle({
    super.key,
    required this.value,
    this.onChanged,
    this.isLoading = false,
    this.showSuccessAnimation = true,
    this.successAnimationDuration = const Duration(milliseconds: 1500),
  });

  @override
  State<AnimatedSettingsToggle> createState() => _AnimatedSettingsToggleState();
}

class _AnimatedSettingsToggleState extends State<AnimatedSettingsToggle>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _opacityAnimation;
  
  bool _showSuccess = false;
  bool _previousValue = false;

  @override
  void initState() {
    super.initState();
    _previousValue = widget.value;
    
    _controller = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.elasticOut),
    );

    _opacityAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeIn),
    );
  }

  @override
  void didUpdateWidget(AnimatedSettingsToggle oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    // Show success animation when value changes (indicating save completed)
    if (widget.value != _previousValue && 
        !widget.isLoading && 
        widget.showSuccessAnimation) {
      _triggerSuccessAnimation();
    }
    _previousValue = widget.value;
  }

  void _triggerSuccessAnimation() {
    final reduceMotion = AccessibilityService.instance.reduceMotionEnabled;
    if (reduceMotion) return;

    setState(() => _showSuccess = true);
    _controller.forward(from: 0.0);

    Future.delayed(widget.successAnimationDuration, () {
      if (mounted) {
        _controller.reverse().then((_) {
          if (mounted) setState(() => _showSuccess = false);
        });
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Stack(
      alignment: Alignment.centerRight,
      clipBehavior: Clip.none,
      children: [
        // Loading indicator
        if (widget.isLoading)
          Positioned(
            right: 60,
            child: SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: cs.primary,
              ),
            ),
          ),

        // Success checkmark
        if (_showSuccess)
          Positioned(
            right: 60,
            child: AnimatedBuilder(
              animation: _controller,
              builder: (context, child) => Transform.scale(
                scale: _scaleAnimation.value,
                child: Opacity(
                  opacity: _opacityAnimation.value,
                  child: Container(
                    padding: const EdgeInsets.all(2),
                    decoration: BoxDecoration(
                      color: cs.primaryContainer,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.check,
                      size: 12,
                      color: cs.onPrimaryContainer,
                    ),
                  ),
                ),
              ),
            ),
          ),

        // Switch
        Switch(
          value: widget.value,
          onChanged: widget.isLoading
              ? null
              : (value) {
                  HapticFeedback.selectionClick();
                  widget.onChanged?.call(value);
                },
        ),
      ],
    );
  }
}

/// Settings Toggle Tile with built-in success animation
/// 
/// A complete list tile with toggle, supporting success animations
/// and loading states.
class AnimatedSettingsToggleTile extends StatelessWidget {
  final String title;
  final String? subtitle;
  final IconData? leadingIcon;
  final bool value;
  final ValueChanged<bool>? onChanged;
  final bool isLoading;
  final bool showSuccessAnimation;
  final EdgeInsetsGeometry? contentPadding;

  const AnimatedSettingsToggleTile({
    super.key,
    required this.title,
    this.subtitle,
    this.leadingIcon,
    required this.value,
    this.onChanged,
    this.isLoading = false,
    this.showSuccessAnimation = true,
    this.contentPadding,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return ListTile(
      contentPadding: contentPadding ?? EdgeInsets.symmetric(
        horizontal: context.horizontalPadding,
      ),
      leading: leadingIcon != null
          ? Icon(leadingIcon, color: cs.onSurfaceVariant)
          : null,
      title: Text(
        title,
        style: tt.bodyLarge,
      ),
      subtitle: subtitle != null
          ? Text(
              subtitle!,
              style: tt.bodySmall?.copyWith(color: cs.onSurfaceVariant),
            )
          : null,
      trailing: AnimatedSettingsToggle(
        value: value,
        onChanged: onChanged,
        isLoading: isLoading,
        showSuccessAnimation: showSuccessAnimation,
      ),
      onTap: isLoading ? null : () => onChanged?.call(!value),
    );
  }
}

/// Shake animation mixin for error feedback
mixin SettingsErrorShakeMixin<T extends StatefulWidget> on State<T> {
  AnimationController? _shakeController;
  Animation<double>? _shakeAnimation;

  void initShakeAnimation(TickerProvider vsync) {
    _shakeController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: vsync,
    );

    _shakeAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _shakeController!, curve: Curves.elasticIn),
    );
  }

  void disposeShakeAnimation() {
    _shakeController?.dispose();
  }

  void triggerShake() {
    final reduceMotion = AccessibilityService.instance.reduceMotionEnabled;
    if (reduceMotion) {
      HapticFeedback.heavyImpact();
      return;
    }

    HapticFeedback.heavyImpact();
    _shakeController?.forward(from: 0.0);
  }

  Widget buildShakeableChild(Widget child) {
    if (_shakeAnimation == null) return child;

    return AnimatedBuilder(
      animation: _shakeAnimation!,
      builder: (context, _) {
        final sineValue = _shakeAnimation!.value;
        final offset = (sineValue * 10) * (1 - sineValue) * 
            (sineValue < 0.5 ? 1 : -1);
        return Transform.translate(
          offset: Offset(offset, 0),
          child: child,
        );
      },
    );
  }
}
