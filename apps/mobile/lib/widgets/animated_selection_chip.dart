import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'styled_avatar.dart';
import '../theme.dart';

/// Premium animated selection chip for member selection
/// Features: scale-in animation, shake on remove, avatar + name + close
class AnimatedSelectionChip extends StatefulWidget {
  final String name;
  final String? avatarUrl;
  final VoidCallback onRemove;
  final bool isNew;
  
  const AnimatedSelectionChip({
    super.key,
    required this.name,
    this.avatarUrl,
    required this.onRemove,
    this.isNew = false,
  });

  @override
  State<AnimatedSelectionChip> createState() => _AnimatedSelectionChipState();
}

class _AnimatedSelectionChipState extends State<AnimatedSelectionChip>
    with TickerProviderStateMixin {
  late AnimationController _scaleController;
  late AnimationController _shakeController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _shakeAnimation;
  bool _isRemoving = false;

  @override
  void initState() {
    super.initState();
    _scaleController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _shakeController = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );

    _scaleAnimation = CurvedAnimation(
      parent: _scaleController,
      curve: Curves.elasticOut,
    );
    
    _shakeAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _shakeController, curve: Curves.elasticIn),
    );

    if (widget.isNew) {
      _scaleController.forward();
    } else {
      _scaleController.value = 1.0;
    }
  }

  @override
  void dispose() {
    _scaleController.dispose();
    _shakeController.dispose();
    super.dispose();
  }

  void _handleRemove() async {
    if (_isRemoving) return;
    setState(() => _isRemoving = true);
    
    HapticFeedback.lightImpact();
    
    // Play shake animation
    await _shakeController.forward();
    
    // Scale out
    await _scaleController.reverse();
    
    widget.onRemove();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return ListenableBuilder(
      listenable: Listenable.merge([_scaleAnimation, _shakeAnimation]),
      builder: (context, child) {
        final shakeOffset = _shakeAnimation.value * 
            ((_shakeController.value * 10).toInt().isEven ? 2 : -2);
        
        return Transform.translate(
          offset: Offset(shakeOffset, 0),
          child: Transform.scale(
            scale: _scaleAnimation.value,
            child: child,
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: cs.primaryContainer,
          borderRadius: BorderRadius.circular(AppRadius.xl),
          border: Border.all(
            color: cs.primary.withOpacity(0.3),
          ),
          boxShadow: [
            BoxShadow(
              color: cs.primary.withOpacity(0.1),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            StyledAvatar(
              name: widget.name,
              url: widget.avatarUrl,
              size: 24,
            ),
            const SizedBox(width: 6),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 80),
              child: Text(
                widget.name,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: cs.onPrimaryContainer,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 4),
            GestureDetector(
              onTap: _handleRemove,
              child: Container(
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  color: cs.onPrimaryContainer.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.close,
                  size: 14,
                  color: cs.onPrimaryContainer,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Horizontal scrollable row of selection chips with staggered animations
class SelectionChipRow extends StatelessWidget {
  final List<SelectedMember> members;
  final Function(String userId) onRemove;
  final double height;

  const SelectionChipRow({
    super.key,
    required this.members,
    required this.onRemove,
    this.height = 44,
  });

  @override
  Widget build(BuildContext context) {
    if (members.isEmpty) return const SizedBox.shrink();

    return SizedBox(
      height: height,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
        itemCount: members.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final member = members[index];
          return AnimatedSelectionChip(
            key: ValueKey(member.userId),
            name: member.name,
            avatarUrl: member.avatarUrl,
            isNew: member.isNew,
            onRemove: () => onRemove(member.userId),
          );
        },
      ),
    );
  }
}

/// Data model for selected member
class SelectedMember {
  final String userId;
  final String name;
  final String? avatarUrl;
  final bool isNew;

  const SelectedMember({
    required this.userId,
    required this.name,
    this.avatarUrl,
    this.isNew = false,
  });

  SelectedMember copyWith({bool? isNew}) {
    return SelectedMember(
      userId: userId,
      name: name,
      avatarUrl: avatarUrl,
      isNew: isNew ?? this.isNew,
    );
  }
}
