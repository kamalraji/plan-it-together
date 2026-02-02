import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme.dart';

/// Premium radio card for WhatsApp-style option selection
/// Features: animated border, check indicator, icon + title + subtitle
class RadioCard<T> extends StatefulWidget {
  final T value;
  final T groupValue;
  final ValueChanged<T> onChanged;
  final IconData icon;
  final String title;
  final String? subtitle;
  final Color? iconColor;
  final bool enabled;

  const RadioCard({
    super.key,
    required this.value,
    required this.groupValue,
    required this.onChanged,
    required this.icon,
    required this.title,
    this.subtitle,
    this.iconColor,
    this.enabled = true,
  });

  @override
  State<RadioCard<T>> createState() => _RadioCardState<T>();
}

class _RadioCardState<T> extends State<RadioCard<T>>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _checkAnimation;

  bool get _isSelected => widget.value == widget.groupValue;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.98).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
    _checkAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.elasticOut,
    );
    
    if (_isSelected) {
      _controller.value = 1.0;
    }
  }

  @override
  void didUpdateWidget(RadioCard<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (_isSelected && oldWidget.groupValue != widget.groupValue) {
      _controller.forward();
    } else if (!_isSelected && oldWidget.groupValue != widget.groupValue) {
      _controller.reverse();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTap() {
    if (!widget.enabled || _isSelected) return;
    
    HapticFeedback.selectionClick();
    widget.onChanged(widget.value);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final iconColor = widget.iconColor ?? cs.primary;

    return ListenableBuilder(
      listenable: _controller,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: child,
        );
      },
      child: GestureDetector(
        onTapDown: (_) => widget.enabled ? _controller.forward() : null,
        onTapUp: (_) => _controller.reverse(),
        onTapCancel: () => _controller.reverse(),
        onTap: _handleTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: _isSelected
                ? cs.primaryContainer.withOpacity(0.5)
                : cs.surfaceContainerLow,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(
              color: _isSelected ? cs.primary : cs.outline.withOpacity(0.2),
              width: _isSelected ? 2 : 1,
            ),
            boxShadow: _isSelected
                ? [
                    BoxShadow(
                      color: cs.primary.withOpacity(0.1),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Row(
            children: [
              // Icon container
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: iconColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(AppRadius.md),
                ),
                child: Icon(
                  widget.icon,
                  size: 22,
                  color: iconColor,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              // Title & subtitle
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.title,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: widget.enabled
                            ? cs.onSurface
                            : cs.onSurface.withOpacity(0.5),
                      ),
                    ),
                    if (widget.subtitle != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        widget.subtitle!,
                        style: TextStyle(
                          fontSize: 13,
                          color: cs.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              // Selection indicator
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _isSelected ? cs.primary : Colors.transparent,
                  border: Border.all(
                    color: _isSelected ? cs.primary : cs.outline,
                    width: 2,
                  ),
                ),
                child: _isSelected
                    ? const Icon(
                        Icons.check,
                        size: 16,
                        color: Colors.white,
                      )
                    : null,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Group of radio cards with title
class RadioCardGroup<T> extends StatelessWidget {
  final String? title;
  final T value;
  final ValueChanged<T> onChanged;
  final List<RadioCardOption<T>> options;

  const RadioCardGroup({
    super.key,
    this.title,
    required this.value,
    required this.onChanged,
    required this.options,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title != null) ...[
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: AppSpacing.sm),
            child: Text(
              title!,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ),
        ],
        ...options.map((option) => Padding(
          padding: const EdgeInsets.only(bottom: AppSpacing.sm),
          child: RadioCard<T>(
            value: option.value,
            groupValue: value,
            onChanged: onChanged,
            icon: option.icon,
            title: option.title,
            subtitle: option.subtitle,
            iconColor: option.iconColor,
            enabled: option.enabled,
          ),
        )),
      ],
    );
  }
}

/// Option data for radio card group
class RadioCardOption<T> {
  final T value;
  final IconData icon;
  final String title;
  final String? subtitle;
  final Color? iconColor;
  final bool enabled;

  const RadioCardOption({
    required this.value,
    required this.icon,
    required this.title,
    this.subtitle,
    this.iconColor,
    this.enabled = true,
  });
}
