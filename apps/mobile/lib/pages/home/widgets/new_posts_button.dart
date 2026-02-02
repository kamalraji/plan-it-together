import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Floating button that shows when new posts are available
class NewPostsButton extends StatefulWidget {
  final int count;
  final VoidCallback onTap;

  const NewPostsButton({
    Key? key,
    required this.count,
    required this.onTap,
  }) : super(key: key);

  @override
  State<NewPostsButton> createState() => _NewPostsButtonState();
}

class _NewPostsButtonState extends State<NewPostsButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _scaleAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    
    _scaleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animController, curve: Curves.elasticOut),
    );
    
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, -1),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _animController, curve: Curves.easeOut));
    
    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  String get _accessibilityLabel {
    if (widget.count == 1) {
      return '1 new post available. Double tap to load.';
    }
    return '${widget.count} new posts available. Double tap to load.';
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Semantics(
      // Live region announces changes to screen readers automatically
      liveRegion: true,
      label: _accessibilityLabel,
      button: true,
      onTap: () {
        HapticFeedback.mediumImpact();
        widget.onTap();
      },
      child: SlideTransition(
        position: _slideAnimation,
        child: ScaleTransition(
          scale: _scaleAnimation,
          child: GestureDetector(
            onTap: () {
              HapticFeedback.mediumImpact();
              widget.onTap();
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [cs.primary, cs.tertiary],
                ),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: cs.primary.withOpacity(0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.arrow_upward_rounded,
                    color: cs.onPrimary,
                    size: 18,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    widget.count == 1 
                        ? '1 new post' 
                        : '${widget.count} new posts',
                    style: TextStyle(
                      color: cs.onPrimary,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
