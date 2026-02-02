import 'package:flutter/material.dart';

/// Reusable Thittam1hub branded logo widget with gradient design
/// Can be used in splash screen, header, and auth pages
class Thittam1hubLogo extends StatefulWidget {
  final double size;
  final bool showText;
  final bool animated;
  final bool showGlow;

  const Thittam1hubLogo({
    super.key,
    this.size = 64,
    this.showText = true,
    this.animated = false,
    this.showGlow = true,
  });

  @override
  State<Thittam1hubLogo> createState() => _Thittam1hubLogoState();
}

class _Thittam1hubLogoState extends State<Thittam1hubLogo>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  late Animation<double> _glowAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    );

    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.08).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _glowAnimation = Tween<double>(begin: 0.3, end: 0.6).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    if (widget.animated) {
      _pulseController.repeat(reverse: true);
    }
  }

  @override
  void didUpdateWidget(Thittam1hubLogo oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.animated && !_pulseController.isAnimating) {
      _pulseController.repeat(reverse: true);
    } else if (!widget.animated && _pulseController.isAnimating) {
      _pulseController.stop();
      _pulseController.reset();
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    // Brand colors - purple to cyan gradient
    const gradientStart = Color(0xFF8B5CF6); // Purple
    const gradientEnd = Color(0xFF06B6D4); // Cyan

    Widget logoIcon = Container(
      width: widget.size,
      height: widget.size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [gradientStart, gradientEnd],
        ),
        boxShadow: widget.showGlow
            ? [
                BoxShadow(
                  color: gradientStart.withOpacity(
                    widget.animated ? _glowAnimation.value : 0.4,
                  ),
                  blurRadius: widget.size * 0.3,
                  spreadRadius: widget.size * 0.05,
                ),
              ]
            : null,
      ),
      child: Center(
        child: Icon(
          Icons.hub_rounded,
          size: widget.size * 0.5,
          color: Colors.white,
        ),
      ),
    );

    // Wrap with animation if enabled
    if (widget.animated) {
      logoIcon = AnimatedBuilder(
        animation: _pulseAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _pulseAnimation.value,
            child: Container(
              width: widget.size,
              height: widget.size,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [gradientStart, gradientEnd],
                ),
                boxShadow: widget.showGlow
                    ? [
                        BoxShadow(
                          color: gradientStart.withOpacity(_glowAnimation.value),
                          blurRadius: widget.size * 0.3,
                          spreadRadius: widget.size * 0.05,
                        ),
                      ]
                    : null,
              ),
              child: Center(
                child: Icon(
                  Icons.hub_rounded,
                  size: widget.size * 0.5,
                  color: Colors.white,
                ),
              ),
            ),
          );
        },
      );
    }

    if (!widget.showText) {
      return logoIcon;
    }

    // With text
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        logoIcon,
        SizedBox(height: widget.size * 0.25),
        Text(
          'Thittam1hub',
          style: textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
            color: cs.onSurface,
            letterSpacing: 0.5,
          ),
        ),
      ],
    );
  }
}

/// Small inline logo for header use
class Thittam1hubLogoInline extends StatelessWidget {
  final double iconSize;
  final double? fontSize;

  const Thittam1hubLogoInline({
    super.key,
    this.iconSize = 22,
    this.fontSize,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    // Brand colors
    const gradientStart = Color(0xFF8B5CF6);
    const gradientEnd = Color(0xFF06B6D4);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: iconSize,
          height: iconSize,
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [gradientStart, gradientEnd],
            ),
          ),
          child: Center(
            child: Icon(
              Icons.hub_rounded,
              size: iconSize * 0.6,
              color: Colors.white,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          'Thittam1hub',
          style: textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: cs.onSurface,
            letterSpacing: 0.5,
            fontSize: fontSize,
          ),
        ),
      ],
    );
  }
}
