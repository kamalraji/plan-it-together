import 'package:flutter/material.dart';
import 'package:thittam1hub/services/accessibility_service.dart';
import 'package:thittam1hub/theme.dart';

/// Premium Settings Section Header
/// 
/// A styled section header with optional action button,
/// staggered entry animation, and accessibility support.
class SettingsSectionHeader extends StatefulWidget {
  final String title;
  final String? subtitle;
  final IconData? icon;
  final Widget? trailing;
  final VoidCallback? onTap;
  final int animationIndex;
  final bool enableAnimation;
  final EdgeInsetsGeometry? padding;

  const SettingsSectionHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.icon,
    this.trailing,
    this.onTap,
    this.animationIndex = 0,
    this.enableAnimation = true,
    this.padding,
  });

  @override
  State<SettingsSectionHeader> createState() => _SettingsSectionHeaderState();
}

class _SettingsSectionHeaderState extends State<SettingsSectionHeader>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    
    final reduceMotion = AccessibilityService.instance.reduceMotionEnabled;
    final duration = reduceMotion 
        ? Duration.zero 
        : const Duration(milliseconds: 300);
    final delay = reduceMotion 
        ? Duration.zero 
        : Duration(milliseconds: widget.animationIndex * 50);

    _controller = AnimationController(duration: duration, vsync: this);

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.1),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));

    if (widget.enableAnimation) {
      Future.delayed(delay, () {
        if (mounted) _controller.forward();
      });
    } else {
      _controller.value = 1.0;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    Widget content = Padding(
      padding: widget.padding ?? EdgeInsets.symmetric(
        horizontal: context.horizontalPadding,
        vertical: AppSpacing.sm,
      ),
      child: Row(
        children: [
          if (widget.icon != null) ...[
            Container(
              padding: const EdgeInsets.all(AppSpacing.xs),
              decoration: BoxDecoration(
                color: cs.primaryContainer.withOpacity(0.5),
                borderRadius: BorderRadius.circular(AppRadius.xs),
              ),
              child: Icon(
                widget.icon,
                size: 16,
                color: cs.primary,
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.title,
                  style: tt.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: cs.onSurface,
                  ),
                ),
                if (widget.subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    widget.subtitle!,
                    style: tt.bodySmall?.copyWith(
                      color: cs.onSurfaceVariant,
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (widget.trailing != null) widget.trailing!,
          if (widget.onTap != null && widget.trailing == null)
            Icon(
              Icons.chevron_right,
              size: 20,
              color: cs.onSurfaceVariant,
            ),
        ],
      ),
    );

    if (widget.onTap != null) {
      content = InkWell(
        onTap: widget.onTap,
        child: content,
      );
    }

    return FadeTransition(
      opacity: _fadeAnimation,
      child: SlideTransition(
        position: _slideAnimation,
        child: Semantics(
          header: true,
          label: widget.title,
          child: content,
        ),
      ),
    );
  }
}

/// Collapsible Settings Section
/// 
/// A section that can be expanded/collapsed with smooth animation.
class CollapsibleSettingsSection extends StatefulWidget {
  final String title;
  final String? subtitle;
  final IconData? icon;
  final List<Widget> children;
  final bool initiallyExpanded;
  final int animationIndex;
  final ValueChanged<bool>? onExpansionChanged;

  const CollapsibleSettingsSection({
    super.key,
    required this.title,
    this.subtitle,
    this.icon,
    required this.children,
    this.initiallyExpanded = false,
    this.animationIndex = 0,
    this.onExpansionChanged,
  });

  @override
  State<CollapsibleSettingsSection> createState() =>
      _CollapsibleSettingsSectionState();
}

class _CollapsibleSettingsSectionState extends State<CollapsibleSettingsSection>
    with SingleTickerProviderStateMixin {
  late AnimationController _expandController;
  late Animation<double> _expandAnimation;
  late bool _isExpanded;

  @override
  void initState() {
    super.initState();
    _isExpanded = widget.initiallyExpanded;

    final reduceMotion = AccessibilityService.instance.reduceMotionEnabled;
    _expandController = AnimationController(
      duration: reduceMotion ? Duration.zero : const Duration(milliseconds: 200),
      vsync: this,
    );

    _expandAnimation = CurvedAnimation(
      parent: _expandController,
      curve: Curves.easeInOut,
    );

    if (_isExpanded) {
      _expandController.value = 1.0;
    }
  }

  @override
  void dispose() {
    _expandController.dispose();
    super.dispose();
  }

  void _toggleExpansion() {
    setState(() {
      _isExpanded = !_isExpanded;
      if (_isExpanded) {
        _expandController.forward();
      } else {
        _expandController.reverse();
      }
    });
    widget.onExpansionChanged?.call(_isExpanded);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingsSectionHeader(
          title: widget.title,
          subtitle: widget.subtitle,
          icon: widget.icon,
          animationIndex: widget.animationIndex,
          onTap: _toggleExpansion,
          trailing: AnimatedRotation(
            turns: _isExpanded ? 0.5 : 0,
            duration: AccessibilityService.instance.effectiveDuration(
              const Duration(milliseconds: 200),
            ),
            child: Icon(
              Icons.expand_more,
              color: cs.onSurfaceVariant,
            ),
          ),
        ),
        SizeTransition(
          sizeFactor: _expandAnimation,
          child: Column(
            children: widget.children,
          ),
        ),
      ],
    );
  }
}
