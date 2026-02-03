import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/physics.dart';

enum SwipeDirection { left, right, up }

/// Data class for storing swipe history
class _SwipeHistoryItem {
  final Widget card;
  final SwipeDirection direction;
  final int index;

  _SwipeHistoryItem({
    required this.card,
    required this.direction,
    required this.index,
  });
}

/// Tinder/Hinge-style swipe card stack with physics-based animations and undo support
class SwipeCardStack extends StatefulWidget {
  final List<Widget> cards;
  final Function(int index, SwipeDirection direction)? onSwipe;
  final VoidCallback? onUndo;
  final Function(bool canUndo)? onUndoAvailableChanged;
  final double swipeThreshold;
  final double rotationAngle;
  final bool enableVerticalSwipe;
  final Widget Function(SwipeDirection direction, double progress)? overlayBuilder;
  final int maxUndoHistory;

  const SwipeCardStack({
    Key? key,
    required this.cards,
    this.onSwipe,
    this.onUndo,
    this.onUndoAvailableChanged,
    this.swipeThreshold = 100,
    this.rotationAngle = 0.4,
    this.enableVerticalSwipe = true,
    this.overlayBuilder,
    this.maxUndoHistory = 3,
  }) : super(key: key);

  @override
  State<SwipeCardStack> createState() => _SwipeCardStackState();
}

class _SwipeCardStackState extends State<SwipeCardStack>
    with TickerProviderStateMixin {
  Offset _dragOffset = Offset.zero;
  late AnimationController _resetController;
  late AnimationController _flyAwayController;
  late AnimationController _undoController;
  late Animation<Offset> _resetAnimation;
  late Animation<Offset> _flyAwayAnimation;
  SwipeDirection? _flyDirection;
  bool _isDragging = false;
  bool _isAnimating = false;
  bool _crossedThreshold = false;
  bool _isUndoing = false;
  
  // Undo history
  final List<_SwipeHistoryItem> _swipeHistory = [];
  Widget? _undoingCard;
  Offset _undoStartOffset = Offset.zero;

  @override
  void initState() {
    super.initState();
    _resetController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _flyAwayController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _undoController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _resetAnimation = Tween<Offset>(begin: Offset.zero, end: Offset.zero)
        .animate(_resetController);
    _flyAwayAnimation = Tween<Offset>(begin: Offset.zero, end: Offset.zero)
        .animate(_flyAwayController);
  }

  @override
  void dispose() {
    _resetController.dispose();
    _flyAwayController.dispose();
    _undoController.dispose();
    super.dispose();
  }
  
  bool get canUndo => _swipeHistory.isNotEmpty && !_isAnimating && !_isUndoing;
  
  /// Undo the last swipe with reverse animation
  void undo() {
    if (!canUndo) return;
    
    HapticFeedback.mediumImpact();
    
    final lastSwipe = _swipeHistory.removeLast();
    setState(() {
      _isUndoing = true;
      _undoingCard = lastSwipe.card;
    });
    
    final screenSize = MediaQuery.of(context).size;
    
    // Determine start position based on swipe direction
    switch (lastSwipe.direction) {
      case SwipeDirection.left:
        _undoStartOffset = Offset(-screenSize.width * 1.5, 0);
        break;
      case SwipeDirection.right:
        _undoStartOffset = Offset(screenSize.width * 1.5, 0);
        break;
      case SwipeDirection.up:
        _undoStartOffset = Offset(0, -screenSize.height * 1.5);
        break;
    }
    
    _undoController.forward(from: 0).then((_) {
      widget.onUndo?.call();
      setState(() {
        _isUndoing = false;
        _undoingCard = null;
      });
      _notifyUndoAvailability();
    });
  }
  
  void _notifyUndoAvailability() {
    widget.onUndoAvailableChanged?.call(canUndo);
  }

  void _onPanStart(DragStartDetails details) {
    _resetController.stop();
    _flyAwayController.stop();
    setState(() {
      _isDragging = true;
      _crossedThreshold = false;
    });
  }

  void _onPanUpdate(DragUpdateDetails details) {
    if (_isAnimating) return;

    setState(() {
      _dragOffset += details.delta;
    });

    // Check threshold for haptic feedback
    final horizontalProgress = _dragOffset.dx.abs() / widget.swipeThreshold;
    final verticalProgress = _dragOffset.dy.abs() / widget.swipeThreshold;
    final progress = math.max(horizontalProgress, verticalProgress);

    if (progress >= 1.0 && !_crossedThreshold) {
      _crossedThreshold = true;
      HapticFeedback.lightImpact();
    } else if (progress < 1.0 && _crossedThreshold) {
      _crossedThreshold = false;
    }
  }

  void _onPanEnd(DragEndDetails details) {
    if (_isAnimating) return;

    final velocity = details.velocity.pixelsPerSecond;
    final horizontalVelocity = velocity.dx.abs();
    final verticalVelocity = velocity.dy.abs();

    // Determine swipe direction and whether to complete
    SwipeDirection? direction;
    bool shouldComplete = false;

    if (_dragOffset.dx.abs() > widget.swipeThreshold ||
        horizontalVelocity > 800) {
      direction = _dragOffset.dx > 0 ? SwipeDirection.right : SwipeDirection.left;
      shouldComplete = true;
    } else if (widget.enableVerticalSwipe &&
        _dragOffset.dy < -widget.swipeThreshold ||
        (widget.enableVerticalSwipe && verticalVelocity > 800 && _dragOffset.dy < 0)) {
      direction = SwipeDirection.up;
      shouldComplete = true;
    }

    if (shouldComplete && direction != null) {
      _flyAway(direction);
    } else {
      _resetPosition();
    }

    setState(() {
      _isDragging = false;
    });
  }

  void _flyAway(SwipeDirection direction) {
    HapticFeedback.mediumImpact();
    
    setState(() {
      _isAnimating = true;
      _flyDirection = direction;
    });

    final screenSize = MediaQuery.of(context).size;
    Offset targetOffset;

    switch (direction) {
      case SwipeDirection.left:
        targetOffset = Offset(-screenSize.width * 1.5, _dragOffset.dy);
        break;
      case SwipeDirection.right:
        targetOffset = Offset(screenSize.width * 1.5, _dragOffset.dy);
        break;
      case SwipeDirection.up:
        targetOffset = Offset(_dragOffset.dx, -screenSize.height * 1.5);
        break;
    }

    _flyAwayAnimation = Tween<Offset>(
      begin: _dragOffset,
      end: targetOffset,
    ).animate(CurvedAnimation(
      parent: _flyAwayController,
      curve: Curves.easeOut,
    ));

    _flyAwayController.forward(from: 0).then((_) {
      // Store in undo history before callback
      if (widget.cards.isNotEmpty) {
        _swipeHistory.add(_SwipeHistoryItem(
          card: widget.cards[0],
          direction: direction,
          index: 0,
        ));
        if (_swipeHistory.length > widget.maxUndoHistory) {
          _swipeHistory.removeAt(0);
        }
        _notifyUndoAvailability();
      }
      
      widget.onSwipe?.call(0, direction);
      setState(() {
        _dragOffset = Offset.zero;
        _isAnimating = false;
        _flyDirection = null;
      });
    });
  }

  void _resetPosition() {
    // Use spring physics for natural feel
    final spring = SpringDescription.withDampingRatio(
      mass: 1,
      stiffness: 300,
      ratio: 0.85,
    );

    _resetAnimation = Tween<Offset>(
      begin: _dragOffset,
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _resetController,
      curve: Curves.easeOutBack,
    ));

    _resetController.forward(from: 0).then((_) {
      setState(() {
        _dragOffset = Offset.zero;
      });
    });

    _resetController.addListener(() {
      setState(() {
        _dragOffset = _resetAnimation.value;
      });
    });
  }

  /// Programmatically swipe the card
  void swipe(SwipeDirection direction) {
    HapticFeedback.selectionClick();
    _flyAway(direction);
  }

  @override
  Widget build(BuildContext context) {
    if (widget.cards.isEmpty) {
      return const SizedBox.shrink();
    }

    final currentOffset = _isAnimating && _flyDirection != null
        ? _flyAwayAnimation.value
        : _dragOffset;

    // Calculate progress for overlays
    final horizontalProgress =
        (currentOffset.dx / widget.swipeThreshold).clamp(-1.0, 1.0);
    final verticalProgress =
        (currentOffset.dy / widget.swipeThreshold).clamp(-1.0, 1.0);

    // Determine dominant direction
    SwipeDirection? currentDirection;
    double progress = 0;
    if (horizontalProgress.abs() > verticalProgress.abs().clamp(0, 0.5)) {
      currentDirection =
          horizontalProgress > 0 ? SwipeDirection.right : SwipeDirection.left;
      progress = horizontalProgress.abs();
    } else if (verticalProgress < -0.3) {
      currentDirection = SwipeDirection.up;
      progress = verticalProgress.abs();
    }

    // Calculate rotation (only for horizontal swipes)
    final rotation = currentOffset.dx * 0.001 * widget.rotationAngle;

    // Scale for back card
    final backCardScale = 0.92 + (progress.clamp(0, 1) * 0.08);

    return Stack(
      alignment: Alignment.center,
      children: [
        // Back card (if exists)
        if (widget.cards.length > 1)
          Transform.scale(
            scale: backCardScale,
            child: Opacity(
              opacity: 0.8,
              child: widget.cards[1],
            ),
          ),

        // Front card with gestures
        GestureDetector(
          onPanStart: _onPanStart,
          onPanUpdate: _onPanUpdate,
          onPanEnd: _onPanEnd,
          child: AnimatedBuilder(
            animation: _isAnimating ? _flyAwayController : _resetController,
            builder: (context, child) {
              return Transform.translate(
                offset: currentOffset,
                child: Transform.rotate(
                  angle: rotation,
                  child: Opacity(
                    opacity: _isAnimating
                        ? (1 - _flyAwayController.value).clamp(0.3, 1.0)
                        : 1.0,
                    child: Stack(
                      children: [
                        widget.cards[0],

                        // Swipe overlay
                        if (currentDirection != null && progress > 0.1)
                          Positioned.fill(
                            child: widget.overlayBuilder != null
                                ? widget.overlayBuilder!(
                                    currentDirection, progress)
                                : _DefaultSwipeOverlay(
                                    direction: currentDirection,
                                    progress: progress,
                                  ),
                          ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

/// Default swipe overlay with icons
class _DefaultSwipeOverlay extends StatelessWidget {
  final SwipeDirection direction;
  final double progress;

  const _DefaultSwipeOverlay({
    required this.direction,
    required this.progress,
  });

  @override
  Widget build(BuildContext context) {
    IconData icon;
    Color color;
    String label;
    Alignment alignment;

    switch (direction) {
      case SwipeDirection.left:
        icon = Icons.close;
        color = Colors.red;
        label = 'NOPE';
        alignment = Alignment.centerRight;
        break;
      case SwipeDirection.right:
        icon = Icons.favorite;
        color = Colors.green;
        label = 'LIKE';
        alignment = Alignment.centerLeft;
        break;
      case SwipeDirection.up:
        icon = Icons.star;
        color = Colors.amber;
        label = 'SUPER';
        alignment = Alignment.bottomCenter;
        break;
    }

    return IgnorePointer(
      child: Container(
        margin: const EdgeInsets.all(16),
        child: Align(
          alignment: alignment,
          child: Transform.rotate(
            angle: direction == SwipeDirection.right ? -0.3 : 
                   direction == SwipeDirection.left ? 0.3 : 0,
            child: Opacity(
              opacity: progress.clamp(0, 0.8),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  border: Border.all(color: color, width: 4),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(icon, color: color, size: 32),
                    const SizedBox(width: 8),
                    Text(
                      label,
                      style: TextStyle(
                        color: color,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 2,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// A single swipeable card with enhanced animations
class SwipeableProfileCard extends StatefulWidget {
  final Widget child;
  final VoidCallback? onSwipeLeft;
  final VoidCallback? onSwipeRight;
  final VoidCallback? onSwipeUp;
  final double threshold;

  const SwipeableProfileCard({
    Key? key,
    required this.child,
    this.onSwipeLeft,
    this.onSwipeRight,
    this.onSwipeUp,
    this.threshold = 100,
  }) : super(key: key);

  @override
  State<SwipeableProfileCard> createState() => SwipeableProfileCardState();
}

class SwipeableProfileCardState extends State<SwipeableProfileCard>
    with TickerProviderStateMixin {
  Offset _dragOffset = Offset.zero;
  late AnimationController _resetController;
  late AnimationController _flyAwayController;
  bool _crossedThreshold = false;
  bool _isFlying = false;
  SwipeDirection? _flyDirection;

  @override
  void initState() {
    super.initState();
    _resetController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _flyAwayController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
  }

  @override
  void dispose() {
    _resetController.dispose();
    _flyAwayController.dispose();
    super.dispose();
  }

  void swipe(SwipeDirection direction) {
    HapticFeedback.mediumImpact();
    setState(() {
      _isFlying = true;
      _flyDirection = direction;
    });

    final size = MediaQuery.of(context).size;
    Offset target;
    switch (direction) {
      case SwipeDirection.left:
        target = Offset(-size.width * 1.5, 0);
        break;
      case SwipeDirection.right:
        target = Offset(size.width * 1.5, 0);
        break;
      case SwipeDirection.up:
        target = Offset(0, -size.height * 1.5);
        break;
    }

    final tween = Tween<Offset>(begin: _dragOffset, end: target);
    final animation = tween.animate(CurvedAnimation(
      parent: _flyAwayController,
      curve: Curves.easeOut,
    ));

    animation.addListener(() {
      setState(() => _dragOffset = animation.value);
    });

    _flyAwayController.forward(from: 0).then((_) {
      switch (direction) {
        case SwipeDirection.left:
          widget.onSwipeLeft?.call();
          break;
        case SwipeDirection.right:
          widget.onSwipeRight?.call();
          break;
        case SwipeDirection.up:
          widget.onSwipeUp?.call();
          break;
      }
      setState(() {
        _dragOffset = Offset.zero;
        _isFlying = false;
        _flyDirection = null;
      });
    });
  }

  void _onPanStart(DragStartDetails details) {
    _resetController.stop();
    _flyAwayController.stop();
    _crossedThreshold = false;
  }

  void _onPanUpdate(DragUpdateDetails details) {
    if (_isFlying) return;
    setState(() {
      _dragOffset += details.delta;
    });

    final progress = math.max(
      _dragOffset.dx.abs() / widget.threshold,
      _dragOffset.dy.abs() / widget.threshold,
    );

    if (progress >= 1.0 && !_crossedThreshold) {
      _crossedThreshold = true;
      HapticFeedback.lightImpact();
    } else if (progress < 1.0) {
      _crossedThreshold = false;
    }
  }

  void _onPanEnd(DragEndDetails details) {
    if (_isFlying) return;

    final velocity = details.velocity.pixelsPerSecond;
    
    if (_dragOffset.dx > widget.threshold || velocity.dx > 800) {
      swipe(SwipeDirection.right);
    } else if (_dragOffset.dx < -widget.threshold || velocity.dx < -800) {
      swipe(SwipeDirection.left);
    } else if (_dragOffset.dy < -widget.threshold || velocity.dy < -800) {
      swipe(SwipeDirection.up);
    } else {
      _resetPosition();
    }
  }

  void _resetPosition() {
    final tween = Tween<Offset>(begin: _dragOffset, end: Offset.zero);
    final animation = tween.animate(CurvedAnimation(
      parent: _resetController,
      curve: Curves.easeOutBack,
    ));

    animation.addListener(() {
      setState(() => _dragOffset = animation.value);
    });

    _resetController.forward(from: 0);
  }

  @override
  Widget build(BuildContext context) {
    final rotation = _dragOffset.dx * 0.0008;
    final horizontalProgress = (_dragOffset.dx / widget.threshold).clamp(-1.0, 1.0);
    final verticalProgress = (_dragOffset.dy / widget.threshold).clamp(-1.0, 1.0);

    SwipeDirection? direction;
    double progress = 0;
    
    if (horizontalProgress.abs() > verticalProgress.abs().clamp(0, 0.5)) {
      direction = horizontalProgress > 0 ? SwipeDirection.right : SwipeDirection.left;
      progress = horizontalProgress.abs();
    } else if (verticalProgress < -0.3) {
      direction = SwipeDirection.up;
      progress = verticalProgress.abs();
    }

    return GestureDetector(
      onPanStart: _onPanStart,
      onPanUpdate: _onPanUpdate,
      onPanEnd: _onPanEnd,
      child: Transform.translate(
        offset: _dragOffset,
        child: Transform.rotate(
          angle: rotation,
          child: Opacity(
            opacity: _isFlying ? (1 - _flyAwayController.value).clamp(0.3, 1.0) : 1.0,
            child: Stack(
              children: [
                widget.child,
                if (direction != null && progress > 0.15)
                  _SwipeIndicatorOverlay(direction: direction, progress: progress),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SwipeIndicatorOverlay extends StatelessWidget {
  final SwipeDirection direction;
  final double progress;

  const _SwipeIndicatorOverlay({
    required this.direction,
    required this.progress,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    IconData icon;
    Color color;
    String label;
    Alignment alignment;

    switch (direction) {
      case SwipeDirection.left:
        icon = Icons.close;
        color = cs.error;
        label = 'SKIP';
        alignment = Alignment.centerRight;
        break;
      case SwipeDirection.right:
        icon = Icons.favorite;
        color = Colors.green;
        label = 'FOLLOW';
        alignment = Alignment.centerLeft;
        break;
      case SwipeDirection.up:
        icon = Icons.star;
        color = Colors.amber[600]!;
        label = 'SAVE';
        alignment = Alignment.bottomCenter;
        break;
    }

    return Positioned.fill(
      child: IgnorePointer(
        child: Container(
          margin: const EdgeInsets.all(24),
          child: Align(
            alignment: alignment,
            child: Transform.rotate(
              angle: direction == SwipeDirection.right ? -0.25 :
                     direction == SwipeDirection.left ? 0.25 : 0,
              child: Opacity(
                opacity: (progress * 1.2).clamp(0, 0.9),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.15),
                    border: Border.all(color: color, width: 3),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(icon, color: color, size: 36),
                      const SizedBox(width: 10),
                      Text(
                        label,
                        style: TextStyle(
                          color: color,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
