import 'package:flutter/material.dart';
import 'package:thittam1hub/theme.dart';

/// Animated unread message badge with count
class UnreadBadge extends StatefulWidget {
  final int count;
  final bool animate;
  final double size;
  final Color? backgroundColor;

  const UnreadBadge({
    super.key,
    required this.count,
    this.animate = true,
    this.size = 20,
    this.backgroundColor,
  });

  @override
  State<UnreadBadge> createState() => _UnreadBadgeState();
}

class _UnreadBadgeState extends State<UnreadBadge>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scaleAnimation;
  late final Animation<double> _pulseAnimation;
  int _previousCount = 0;

  @override
  void initState() {
    super.initState();
    _previousCount = widget.count;
    
    _controller = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );

    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.3), weight: 1),
      TweenSequenceItem(tween: Tween(begin: 1.3, end: 0.9), weight: 1),
      TweenSequenceItem(tween: Tween(begin: 0.9, end: 1.0), weight: 1),
    ]).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));

    _pulseAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
  }

  @override
  void didUpdateWidget(UnreadBadge oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.count > _previousCount && widget.animate) {
      _controller.forward(from: 0);
    }
    _previousCount = widget.count;
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.count <= 0) return const SizedBox.shrink();

    final theme = Theme.of(context);
    final bgColor = widget.backgroundColor ?? theme.colorScheme.primary;
    final displayText = widget.count > 99 ? '99+' : '${widget.count}';

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Stack(
          clipBehavior: Clip.none,
          children: [
            // Pulse ring
            if (_controller.isAnimating)
              Positioned.fill(
                child: Opacity(
                  opacity: 1.0 - _pulseAnimation.value,
                  child: Transform.scale(
                    scale: 1.0 + (_pulseAnimation.value * 0.5),
                    child: Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: bgColor,
                          width: 2,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            
            // Badge
            Transform.scale(
              scale: _scaleAnimation.value,
              child: Container(
                constraints: BoxConstraints(
                  minWidth: widget.size,
                  minHeight: widget.size,
                ),
                padding: EdgeInsets.symmetric(
                  horizontal: widget.count > 9 ? 6 : 0,
                ),
                decoration: BoxDecoration(
                  color: bgColor,
                  borderRadius: BorderRadius.circular(widget.size / 2),
                  boxShadow: [
                    BoxShadow(
                      color: bgColor.withValues(alpha: 0.4),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    displayText,
                    style: TextStyle(
                      color: theme.colorScheme.onPrimary,
                      fontSize: widget.size * 0.55,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

/// Small dot indicator for unread status
class UnreadDot extends StatefulWidget {
  final bool show;
  final Color? color;
  final double size;

  const UnreadDot({
    super.key,
    required this.show,
    this.color,
    this.size = 10,
  });

  @override
  State<UnreadDot> createState() => _UnreadDotState();
}

class _UnreadDotState extends State<UnreadDot>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    
    if (widget.show) {
      _controller.repeat(reverse: true);
    }
  }

  @override
  void didUpdateWidget(UnreadDot oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.show && !oldWidget.show) {
      _controller.repeat(reverse: true);
    } else if (!widget.show && oldWidget.show) {
      _controller.stop();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.show) return const SizedBox.shrink();

    final theme = Theme.of(context);
    final dotColor = widget.color ?? theme.colorScheme.primary;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Container(
          width: widget.size,
          height: widget.size,
          decoration: BoxDecoration(
            color: dotColor,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: dotColor.withValues(alpha: 0.3 + (_controller.value * 0.4)),
                blurRadius: 4 + (_controller.value * 4),
                spreadRadius: _controller.value * 2,
              ),
            ],
          ),
        );
      },
    );
  }
}

/// Online status indicator
class OnlineIndicator extends StatelessWidget {
  final bool isOnline;
  final double size;

  const OnlineIndicator({
    super.key,
    required this.isOnline,
    this.size = 12,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: isOnline ? AppColors.success : Colors.grey,
        shape: BoxShape.circle,
        border: Border.all(
          color: Theme.of(context).colorScheme.surface,
          width: 2,
        ),
        boxShadow: isOnline
            ? [
                BoxShadow(
                  color: AppColors.success.withValues(alpha: 0.4),
                  blurRadius: 4,
                ),
              ]
            : null,
      ),
    );
  }
}
