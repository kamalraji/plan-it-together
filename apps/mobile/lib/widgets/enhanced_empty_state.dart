import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// A beautifully animated empty state widget with gradient styling,
/// floating animations, and optional CTA buttons.
class EnhancedEmptyState extends StatefulWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final String? primaryButtonLabel;
  final VoidCallback? onPrimaryAction;
  final IconData? primaryButtonIcon;
  final String? secondaryButtonLabel;
  final VoidCallback? onSecondaryAction;
  final Color? iconColor;
  final bool animate;

  const EnhancedEmptyState({
    Key? key,
    required this.icon,
    required this.title,
    required this.subtitle,
    this.primaryButtonLabel,
    this.onPrimaryAction,
    this.primaryButtonIcon,
    this.secondaryButtonLabel,
    this.onSecondaryAction,
    this.iconColor,
    this.animate = true,
  }) : super(key: key);

  @override
  State<EnhancedEmptyState> createState() => _EnhancedEmptyStateState();
}

class _EnhancedEmptyStateState extends State<EnhancedEmptyState>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _floatController;
  late AnimationController _entranceController;

  late Animation<double> _pulseAnimation;
  late Animation<double> _floatAnimation;
  late Animation<double> _iconFade;
  late Animation<Offset> _iconSlide;
  late Animation<double> _titleFade;
  late Animation<Offset> _titleSlide;
  late Animation<double> _subtitleFade;
  late Animation<Offset> _subtitleSlide;
  late Animation<double> _buttonFade;
  late Animation<Offset> _buttonSlide;

  @override
  void initState() {
    super.initState();

    // Pulse animation (subtle breathing effect)
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    );
    _pulseAnimation = Tween<double>(begin: 0.95, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    // Float animation (subtle up-down movement)
    _floatController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3000),
    );
    _floatAnimation = Tween<double>(begin: 0, end: 8).animate(
      CurvedAnimation(parent: _floatController, curve: Curves.easeInOut),
    );

    // Entrance animations
    _entranceController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    // Staggered fade-slide animations
    _iconFade = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _entranceController,
        curve: const Interval(0.0, 0.4, curve: Curves.easeOut),
      ),
    );
    _iconSlide = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _entranceController,
        curve: const Interval(0.0, 0.4, curve: Curves.easeOutCubic),
      ),
    );

    _titleFade = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _entranceController,
        curve: const Interval(0.15, 0.55, curve: Curves.easeOut),
      ),
    );
    _titleSlide = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _entranceController,
        curve: const Interval(0.15, 0.55, curve: Curves.easeOutCubic),
      ),
    );

    _subtitleFade = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _entranceController,
        curve: const Interval(0.3, 0.7, curve: Curves.easeOut),
      ),
    );
    _subtitleSlide = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _entranceController,
        curve: const Interval(0.3, 0.7, curve: Curves.easeOutCubic),
      ),
    );

    _buttonFade = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _entranceController,
        curve: const Interval(0.5, 1.0, curve: Curves.easeOut),
      ),
    );
    _buttonSlide = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _entranceController,
        curve: const Interval(0.5, 1.0, curve: Curves.easeOutCubic),
      ),
    );

    if (widget.animate) {
      _startAnimations();
    } else {
      _entranceController.value = 1.0;
    }
  }

  void _startAnimations() {
    _entranceController.forward();
    _pulseController.repeat(reverse: true);
    _floatController.repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _floatController.dispose();
    _entranceController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final iconColor = widget.iconColor ?? cs.primary;

    // Respect reduced motion settings
    final reduceMotion = MediaQuery.maybeOf(context)?.disableAnimations ?? false;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Animated Icon Container
            AnimatedBuilder(
              animation: Listenable.merge([
                _pulseAnimation,
                _floatAnimation,
                _iconFade,
                _iconSlide,
              ]),
              builder: (context, child) {
                return SlideTransition(
                  position: _iconSlide,
                  child: FadeTransition(
                    opacity: _iconFade,
                    child: Transform.translate(
                      offset: Offset(0, reduceMotion ? 0 : -_floatAnimation.value),
                      child: Transform.scale(
                        scale: reduceMotion ? 1.0 : _pulseAnimation.value,
                        child: child,
                      ),
                    ),
                  ),
                );
              },
              child: Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: [
                      iconColor.withValues(alpha: 0.2),
                      cs.tertiary.withValues(alpha: 0.1),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: iconColor.withValues(alpha: 0.15),
                      blurRadius: 20,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: Icon(
                  widget.icon,
                  size: 56,
                  color: iconColor,
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Gradient Title
            SlideTransition(
              position: _titleSlide,
              child: FadeTransition(
                opacity: _titleFade,
                child: ShaderMask(
                  shaderCallback: (bounds) => LinearGradient(
                    colors: [cs.primary, cs.tertiary],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ).createShader(bounds),
                  child: Text(
                    widget.title,
                    style: textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            ),

            const SizedBox(height: 12),

            // Subtitle
            SlideTransition(
              position: _subtitleSlide,
              child: FadeTransition(
                opacity: _subtitleFade,
                child: Text(
                  widget.subtitle,
                  style: textTheme.bodyMedium?.copyWith(
                    color: cs.onSurfaceVariant,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),

            // Primary Button
            if (widget.primaryButtonLabel != null && widget.onPrimaryAction != null) ...[
              const SizedBox(height: 32),
              SlideTransition(
                position: _buttonSlide,
                child: FadeTransition(
                  opacity: _buttonFade,
                  child: _TapScaleButton(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      widget.onPrimaryAction!();
                    },
                    child: FilledButton.icon(
                      onPressed: () {
                        HapticFeedback.lightImpact();
                        widget.onPrimaryAction!();
                      },
                      icon: widget.primaryButtonIcon != null
                          ? Icon(widget.primaryButtonIcon)
                          : const SizedBox.shrink(),
                      label: Text(widget.primaryButtonLabel!),
                    ),
                  ),
                ),
              ),
            ],

            // Secondary Button
            if (widget.secondaryButtonLabel != null &&
                widget.onSecondaryAction != null) ...[
              const SizedBox(height: 12),
              SlideTransition(
                position: _buttonSlide,
                child: FadeTransition(
                  opacity: _buttonFade,
                  child: TextButton(
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      widget.onSecondaryAction!();
                    },
                    child: Text(widget.secondaryButtonLabel!),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// A button wrapper that scales down on press for tactile feedback
class _TapScaleButton extends StatefulWidget {
  final Widget child;
  final VoidCallback onTap;

  const _TapScaleButton({
    required this.child,
    required this.onTap,
  });

  @override
  State<_TapScaleButton> createState() => _TapScaleButtonState();
}

class _TapScaleButtonState extends State<_TapScaleButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) => _controller.reverse(),
      onTapCancel: () => _controller.reverse(),
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: widget.child,
      ),
    );
  }
}
