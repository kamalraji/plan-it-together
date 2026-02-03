import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:thittam1hub/services/zone_state_service.dart';

/// Animated bookmark button for sessions
/// Shows filled/outlined state and triggers haptic feedback
class SessionBookmarkButton extends StatefulWidget {
  final String sessionId;
  final String eventId;
  final bool isBookmarked;
  final VoidCallback? onToggle;
  final double size;

  const SessionBookmarkButton({
    super.key,
    required this.sessionId,
    required this.eventId,
    required this.isBookmarked,
    this.onToggle,
    this.size = 24,
  });

  @override
  State<SessionBookmarkButton> createState() => _SessionBookmarkButtonState();
}

class _SessionBookmarkButtonState extends State<SessionBookmarkButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.3).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _handleTap() async {
    if (_isLoading) return;

    // Haptic feedback
    HapticFeedback.lightImpact();

    // Animate
    await _controller.forward();
    await _controller.reverse();

    setState(() => _isLoading = true);

    final service = context.read<ZoneStateService>();
    await service.toggleSessionBookmark(
      widget.sessionId,
      widget.eventId,
    );

    if (mounted) {
      setState(() => _isLoading = false);
      widget.onToggle?.call();
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: _handleTap,
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _scaleAnimation.value,
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 200),
              transitionBuilder: (child, animation) => ScaleTransition(
                scale: animation,
                child: child,
              ),
              child: _isLoading
                  ? SizedBox(
                      width: widget.size,
                      height: widget.size,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: cs.primary,
                      ),
                    )
                  : Icon(
                      widget.isBookmarked
                          ? Icons.bookmark_rounded
                          : Icons.bookmark_border_rounded,
                      key: ValueKey(widget.isBookmarked),
                      size: widget.size,
                      color: widget.isBookmarked ? cs.primary : cs.onSurfaceVariant,
                    ),
            ),
          );
        },
      ),
    );
  }
}
