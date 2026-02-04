import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme.dart';

/// Animated expandable section card for settings
class SettingsSection extends StatefulWidget {
  final String title;
  final IconData icon;
  final List<Widget> children;
  final bool initiallyExpanded;
  final Color? iconColor;
  final Widget? trailing;
  final String? helpText;

  const SettingsSection({
    super.key,
    required this.title,
    required this.icon,
    required this.children,
    this.initiallyExpanded = true,
    this.iconColor,
    this.trailing,
    this.helpText,
  });

  @override
  State<SettingsSection> createState() => _SettingsSectionState();
}

class _SettingsSectionState extends State<SettingsSection>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _expandAnimation;
  late Animation<double> _iconRotation;
  late bool _isExpanded;

  @override
  void initState() {
    super.initState();
    _isExpanded = widget.initiallyExpanded;
    _controller = AnimationController(
      duration: const Duration(milliseconds: 250),
      vsync: this,
    );
    _expandAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOutCubic,
    );
    _iconRotation = Tween<double>(begin: 0, end: 0.5).animate(_expandAnimation);

    if (_isExpanded) _controller.value = 1.0;
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _toggle() {
    HapticFeedback.selectionClick();
    setState(() {
      _isExpanded = !_isExpanded;
      if (_isExpanded) {
        _controller.forward();
      } else {
        _controller.reverse();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Card(
      margin: EdgeInsets.zero,
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          InkWell(
            onTap: _toggle,
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: (widget.iconColor ?? cs.primary).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                    child: Icon(
                      widget.icon,
                      size: 18,
                      color: widget.iconColor ?? cs.primary,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Text(
                      widget.title,
                      style: context.textStyles.titleSmall?.semiBold,
                    ),
                  ),
                  if (widget.helpText != null) ...[
                    _HelpTooltipButton(helpText: widget.helpText!),
                    const SizedBox(width: AppSpacing.xs),
                  ],
                  if (widget.trailing != null) ...[
                    widget.trailing!,
                    const SizedBox(width: AppSpacing.sm),
                  ],
                  RotationTransition(
                    turns: _iconRotation,
                    child: Icon(
                      Icons.keyboard_arrow_down,
                      size: 20,
                      color: cs.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Expandable content
          SizeTransition(
            sizeFactor: _expandAnimation,
            child: Column(
              children: [
                Divider(height: 1, color: cs.outline.withOpacity(0.3)),
                ...widget.children,
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Settings toggle row with optional icon and animation
class SettingsToggle extends StatefulWidget {
  final String label;
  final String? subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;
  final IconData? icon;
  final bool enabled;
  final String? helpText;

  const SettingsToggle({
    super.key,
    required this.label,
    this.subtitle,
    required this.value,
    required this.onChanged,
    this.icon,
    this.enabled = true,
    this.helpText,
  });

  @override
  State<SettingsToggle> createState() => _SettingsToggleState();
}

class _SettingsToggleState extends State<SettingsToggle>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 150),
      vsync: this,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onTap() {
    if (!widget.enabled) return;
    HapticFeedback.lightImpact();
    _controller.forward().then((_) => _controller.reverse());
    widget.onChanged(!widget.value);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final scale = 1.0 - (_controller.value * 0.02);
        return Transform.scale(
          scale: scale,
          child: child,
        );
      },
      child: InkWell(
        onTap: _onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.sm + 2,
          ),
          child: Row(
            children: [
              if (widget.icon != null) ...[
                Icon(
                  widget.icon,
                  size: 20,
                  color: widget.enabled
                      ? cs.onSurfaceVariant
                      : cs.onSurfaceVariant.withOpacity(0.5),
                ),
                const SizedBox(width: AppSpacing.md),
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.label,
                      style: context.textStyles.bodyMedium?.copyWith(
                        color: widget.enabled
                            ? cs.onSurface
                            : cs.onSurface.withOpacity(0.5),
                      ),
                    ),
                    if (widget.subtitle != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        widget.subtitle!,
                        style: context.textStyles.bodySmall?.withColor(
                          cs.onSurfaceVariant.withOpacity(widget.enabled ? 1 : 0.5),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (widget.helpText != null) ...[
                _HelpTooltipButton(helpText: widget.helpText!, size: 18),
                const SizedBox(width: AppSpacing.xs),
              ],
              Switch(
                value: widget.value,
                onChanged: widget.enabled ? widget.onChanged : null,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Settings action row with icon, label, and tap action
class SettingsAction extends StatefulWidget {
  final String label;
  final String? subtitle;
  final IconData icon;
  final VoidCallback? onTap;
  final Color? iconColor;
  final Color? labelColor;
  final Widget? trailing;
  final bool showChevron;
  final bool isDestructive;

  const SettingsAction({
    super.key,
    required this.label,
    this.subtitle,
    required this.icon,
    this.onTap,
    this.iconColor,
    this.labelColor,
    this.trailing,
    this.showChevron = true,
    this.isDestructive = false,
  });

  @override
  State<SettingsAction> createState() => _SettingsActionState();
}

class _SettingsActionState extends State<SettingsAction>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onTap() {
    if (widget.onTap == null) return;
    HapticFeedback.lightImpact();
    _controller.forward().then((_) {
      _controller.reverse();
      widget.onTap?.call();
    });
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final effectiveIconColor = widget.isDestructive
        ? AppColors.error
        : widget.iconColor ?? cs.onSurfaceVariant;
    final effectiveLabelColor = widget.isDestructive
        ? AppColors.error
        : widget.labelColor ?? cs.onSurface;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Container(
          color: cs.primary.withOpacity(_controller.value * 0.05),
          child: child,
        );
      },
      child: InkWell(
        onTap: _onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.sm + 4,
          ),
          child: Row(
            children: [
              Icon(widget.icon, size: 20, color: effectiveIconColor),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.label,
                      style: context.textStyles.bodyMedium?.withColor(effectiveLabelColor),
                    ),
                    if (widget.subtitle != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        widget.subtitle!,
                        style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
                      ),
                    ],
                  ],
                ),
              ),
              if (widget.trailing != null) widget.trailing!,
              if (widget.showChevron && widget.trailing == null)
                Icon(
                  Icons.chevron_right,
                  size: 20,
                  color: cs.onSurfaceVariant.withOpacity(0.6),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Settings picker row with current value display
class SettingsPicker<T> extends StatelessWidget {
  final String label;
  final String? subtitle;
  final IconData? icon;
  final T value;
  final List<T> options;
  final String Function(T) displayValue;
  final ValueChanged<T> onChanged;

  const SettingsPicker({
    super.key,
    required this.label,
    this.subtitle,
    this.icon,
    required this.value,
    required this.options,
    required this.displayValue,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return InkWell(
      onTap: () => _showPicker(context),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm + 4,
        ),
        child: Row(
          children: [
            if (icon != null) ...[
              Icon(icon, size: 20, color: cs.onSurfaceVariant),
              const SizedBox(width: AppSpacing.md),
            ],
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: context.textStyles.bodyMedium),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      subtitle!,
                      style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
                    ),
                  ],
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: cs.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(AppRadius.sm),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    displayValue(value),
                    style: context.textStyles.bodySmall?.semiBold.withColor(cs.primary),
                  ),
                  const SizedBox(width: 4),
                  Icon(Icons.unfold_more, size: 14, color: cs.primary),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showPicker(BuildContext context) {
    HapticFeedback.selectionClick();
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Text(
                label,
                style: context.textStyles.titleMedium?.semiBold,
              ),
            ),
            const Divider(height: 1),
            ...options.map((option) => ListTile(
              title: Text(displayValue(option)),
              trailing: option == value
                  ? Icon(Icons.check, color: Theme.of(context).colorScheme.primary)
                  : null,
              onTap: () {
                Navigator.pop(context);
                onChanged(option);
              },
            )),
            const SizedBox(height: AppSpacing.md),
          ],
        ),
      ),
    );
  }
}

/// Dropdown option model for SettingsDropdown
class DropdownOption<T> {
  final T value;
  final String label;
  final IconData? icon;

  const DropdownOption({
    required this.value,
    required this.label,
    this.icon,
  });
}

/// Settings dropdown selector with current value display
class SettingsDropdown<T> extends StatelessWidget {
  final String label;
  final String? subtitle;
  final IconData? icon;
  final T value;
  final List<DropdownOption<T>> options;
  final ValueChanged<T> onChanged;
  final bool enabled;

  const SettingsDropdown({
    super.key,
    required this.label,
    this.subtitle,
    this.icon,
    required this.value,
    required this.options,
    required this.onChanged,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final currentOption = options.firstWhere(
      (o) => o.value == value,
      orElse: () => options.first,
    );

    return InkWell(
      onTap: enabled ? () => _showPicker(context) : null,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm + 4,
        ),
        child: Row(
          children: [
            if (icon != null) ...[
              Icon(
                icon,
                size: 20,
                color: enabled
                    ? cs.onSurfaceVariant
                    : cs.onSurfaceVariant.withOpacity(0.5),
              ),
              const SizedBox(width: AppSpacing.md),
            ],
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: context.textStyles.bodyMedium?.copyWith(
                      color: enabled ? cs.onSurface : cs.onSurface.withOpacity(0.5),
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      subtitle!,
                      style: context.textStyles.bodySmall?.withColor(
                        cs.onSurfaceVariant.withOpacity(enabled ? 1 : 0.5),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: cs.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(AppRadius.sm),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (currentOption.icon != null) ...[
                    Icon(currentOption.icon, size: 14, color: cs.primary),
                    const SizedBox(width: 4),
                  ],
                  Text(
                    currentOption.label,
                    style: context.textStyles.bodySmall?.semiBold.withColor(cs.primary),
                  ),
                  const SizedBox(width: 4),
                  Icon(Icons.unfold_more, size: 14, color: cs.primary),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showPicker(BuildContext context) {
    HapticFeedback.selectionClick();
    final cs = Theme.of(context).colorScheme;
    
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Text(
                label,
                style: context.textStyles.titleMedium?.semiBold,
              ),
            ),
            const Divider(height: 1),
            ...options.map((option) => ListTile(
              leading: option.icon != null
                  ? Icon(option.icon, color: cs.onSurfaceVariant)
                  : null,
              title: Text(option.label),
              trailing: option.value == value
                  ? Icon(Icons.check, color: cs.primary)
                  : null,
              onTap: () {
                Navigator.pop(context);
                onChanged(option.value);
              },
            )),
            const SizedBox(height: AppSpacing.md),
          ],
        ),
      ),
    );
  }
}

/// Settings search bar with animation
class SettingsSearchBar extends StatefulWidget {
  final ValueChanged<String> onChanged;
  final String hintText;

  const SettingsSearchBar({
    super.key,
    required this.onChanged,
    this.hintText = 'Search settings...',
  });

  @override
  State<SettingsSearchBar> createState() => _SettingsSearchBarState();
}

class _SettingsSearchBarState extends State<SettingsSearchBar> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();
  bool _isFocused = false;

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(() {
      setState(() => _isFocused = _focusNode.hasFocus);
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withOpacity(_isFocused ? 0.8 : 0.5),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(
          color: _isFocused ? cs.primary : cs.outline.withOpacity(0.2),
          width: _isFocused ? 1.5 : 1,
        ),
      ),
      child: TextField(
        controller: _controller,
        focusNode: _focusNode,
        onChanged: widget.onChanged,
        decoration: InputDecoration(
          hintText: widget.hintText,
          hintStyle: context.textStyles.bodyMedium?.withColor(cs.onSurfaceVariant),
          prefixIcon: Icon(
            Icons.search,
            size: 20,
            color: _isFocused ? cs.primary : cs.onSurfaceVariant,
          ),
          suffixIcon: _controller.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear, size: 18),
                  onPressed: () {
                    _controller.clear();
                    widget.onChanged('');
                  },
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.sm + 4,
          ),
        ),
      ),
    );
  }
}

/// Animated color picker for settings
class SettingsColorPicker extends StatelessWidget {
  final String label;
  final Color selectedColor;
  final List<Color> colors;
  final ValueChanged<Color> onChanged;

  const SettingsColorPicker({
    super.key,
    required this.label,
    required this.selectedColor,
    required this.colors,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: context.textStyles.bodyMedium),
          const SizedBox(height: AppSpacing.sm),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: colors.map((color) {
              final isSelected = color.value == selectedColor.value;
              return GestureDetector(
                onTap: () {
                  HapticFeedback.selectionClick();
                  onChanged(color);
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isSelected ? cs.onSurface : Colors.transparent,
                      width: 2,
                    ),
                    boxShadow: isSelected
                        ? [
                            BoxShadow(
                              color: color.withOpacity(0.4),
                              blurRadius: 8,
                              spreadRadius: 2,
                            ),
                          ]
                        : null,
                  ),
                  child: isSelected
                      ? Icon(
                          Icons.check,
                          size: 18,
                          color: color.computeLuminance() > 0.5
                              ? Colors.black
                              : Colors.white,
                        )
                      : null,
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

/// Settings slider with labels
class SettingsSlider extends StatelessWidget {
  final String label;
  final String? subtitle;
  final IconData? icon;
  final double value;
  final double min;
  final double max;
  final int? divisions;
  final String Function(double)? valueLabel;
  final ValueChanged<double> onChanged;

  const SettingsSlider({
    super.key,
    required this.label,
    this.subtitle,
    this.icon,
    required this.value,
    this.min = 0,
    this.max = 1,
    this.divisions,
    this.valueLabel,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.xs,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (icon != null) ...[
                Icon(icon, size: 20, color: cs.onSurfaceVariant),
                const SizedBox(width: AppSpacing.md),
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label, style: context.textStyles.bodyMedium),
                    if (subtitle != null)
                      Text(
                        subtitle!,
                        style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
                      ),
                  ],
                ),
              ),
              if (valueLabel != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: cs.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(AppRadius.xs),
                  ),
                  child: Text(
                    valueLabel!(value),
                    style: context.textStyles.labelSmall?.semiBold.withColor(cs.primary),
                  ),
                ),
            ],
          ),
          Slider(
            value: value,
            min: min,
            max: max,
            divisions: divisions,
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }
}

/// Settings info row for displaying read-only information
class SettingsInfo extends StatelessWidget {
  final String label;
  final String value;
  final IconData? icon;
  final bool canCopy;

  const SettingsInfo({
    super.key,
    required this.label,
    required this.value,
    this.icon,
    this.canCopy = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return InkWell(
      onTap: canCopy
          ? () {
              Clipboard.setData(ClipboardData(text: value));
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Copied to clipboard')),
              );
            }
          : null,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm + 2,
        ),
        child: Row(
          children: [
            if (icon != null) ...[
              Icon(icon, size: 20, color: cs.onSurfaceVariant),
              const SizedBox(width: AppSpacing.md),
            ],
            Expanded(
              child: Text(
                label,
                style: context.textStyles.bodyMedium?.withColor(cs.onSurfaceVariant),
              ),
            ),
            Flexible(
              child: Text(
                value,
                style: context.textStyles.bodyMedium?.semiBold,
                textAlign: TextAlign.end,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (canCopy) ...[
              const SizedBox(width: 8),
              Icon(Icons.copy, size: 16, color: cs.onSurfaceVariant.withOpacity(0.6)),
            ],
          ],
        ),
      ),
    );
  }
}

/// Settings divider with optional label
class SettingsDivider extends StatelessWidget {
  final String? label;

  const SettingsDivider({super.key, this.label});

  @override
  Widget build(BuildContext context) {
    if (label == null) {
      return const Divider(height: 1);
    }

    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      child: Row(
        children: [
          Expanded(child: Divider(color: cs.outline.withOpacity(0.3))),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
            child: Text(
              label!,
              style: context.textStyles.labelSmall?.withColor(cs.onSurfaceVariant),
            ),
          ),
          Expanded(child: Divider(color: cs.outline.withOpacity(0.3))),
        ],
      ),
    );
  }
}

/// Help tooltip button for contextual help in settings
class _HelpTooltipButton extends StatelessWidget {
  final String helpText;
  final double size;

  const _HelpTooltipButton({
    required this.helpText,
    this.size = 16,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: () => _showHelpSheet(context),
      child: Tooltip(
        message: 'Learn more',
        child: Icon(
          Icons.help_outline,
          size: size,
          color: cs.onSurfaceVariant.withOpacity(0.6),
        ),
      ),
    );
  }

  void _showHelpSheet(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    showModalBottomSheet(
      context: context,
      backgroundColor: cs.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.lightbulb_outline, color: cs.primary, size: 24),
                  const SizedBox(width: AppSpacing.sm),
                  Text(
                    'Help',
                    style: context.textStyles.titleMedium?.semiBold,
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              Text(
                helpText,
                style: context.textStyles.bodyMedium?.withColor(cs.onSurfaceVariant),
              ),
              const SizedBox(height: AppSpacing.lg),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Got it'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Reusable help tooltip button (public version for external use)
class SettingsHelpButton extends StatelessWidget {
  final String helpText;
  final double size;

  const SettingsHelpButton({
    super.key,
    required this.helpText,
    this.size = 16,
  });

  @override
  Widget build(BuildContext context) {
    return _HelpTooltipButton(helpText: helpText, size: size);
  }
}
