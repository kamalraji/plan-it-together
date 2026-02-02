import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/theme.dart';

/// Premium bottom sheet for submitting session feedback with animated star ratings
class SessionFeedbackSheet extends StatefulWidget {
  final String sessionTitle;
  final String? speakerName;
  final Future<bool> Function({
    required int overallRating,
    int? contentRating,
    int? speakerRating,
    String? feedbackText,
    bool? wouldRecommend,
  }) onSubmit;

  const SessionFeedbackSheet({
    super.key,
    required this.sessionTitle,
    this.speakerName,
    required this.onSubmit,
  });

  @override
  State<SessionFeedbackSheet> createState() => _SessionFeedbackSheetState();
}

class _SessionFeedbackSheetState extends State<SessionFeedbackSheet>
    with TickerProviderStateMixin {
  int _overallRating = 0;
  int _contentRating = 0;
  int _speakerRating = 0;
  bool? _wouldRecommend;
  final _feedbackController = TextEditingController();
  bool _isSubmitting = false;
  bool _showDetails = false;
  bool _isSuccess = false;

  // Animation controllers
  late AnimationController _entranceController;
  late AnimationController _successController;
  late AnimationController _starsController;

  @override
  void initState() {
    super.initState();
    _entranceController = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );
    _successController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _starsController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );

    // Trigger entrance animation
    Future.delayed(const Duration(milliseconds: 100), () {
      if (mounted) {
        _entranceController.forward();
        _starsController.forward();
      }
    });
  }

  @override
  void dispose() {
    _entranceController.dispose();
    _successController.dispose();
    _starsController.dispose();
    _feedbackController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_overallRating == 0) {
      HapticFeedback.heavyImpact();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please rate this session'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    HapticFeedback.mediumImpact();

    final success = await widget.onSubmit(
      overallRating: _overallRating,
      contentRating: _contentRating > 0 ? _contentRating : null,
      speakerRating: _speakerRating > 0 ? _speakerRating : null,
      feedbackText: _feedbackController.text.trim().isNotEmpty
          ? _feedbackController.text.trim()
          : null,
      wouldRecommend: _wouldRecommend,
    );

    if (mounted) {
      if (success) {
        setState(() {
          _isSubmitting = false;
          _isSuccess = true;
        });
        HapticFeedback.heavyImpact();
        _successController.forward();
        
        await Future.delayed(const Duration(milliseconds: 1500));
        if (mounted) Navigator.pop(context, true);
      } else {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(
          24,
          16,
          24,
          MediaQuery.of(context).viewInsets.bottom + 24,
        ),
        child: _isSuccess
            ? _buildSuccessView(cs, textTheme)
            : _buildFormView(cs, textTheme),
      ),
    );
  }

  Widget _buildSuccessView(ColorScheme cs, TextTheme textTheme) {
    return AnimatedBuilder(
      animation: _successController,
      builder: (context, child) {
        final scale = Tween<double>(begin: 0.5, end: 1.0).animate(
          CurvedAnimation(
            parent: _successController,
            curve: Curves.elasticOut,
          ),
        );
        final opacity = Tween<double>(begin: 0.0, end: 1.0).animate(
          CurvedAnimation(
            parent: _successController,
            curve: const Interval(0, 0.5),
          ),
        );
        return Opacity(
          opacity: opacity.value,
          child: Transform.scale(
            scale: scale.value,
            child: child,
          ),
        );
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 32),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.success.withOpacity(0.1),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: AppColors.success.withOpacity(0.2),
                  blurRadius: 30,
                  spreadRadius: 10,
                ),
              ],
            ),
            child: const Icon(
              Icons.celebration_rounded,
              size: 56,
              color: AppColors.success,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Thank You!',
            style: textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Your feedback helps improve future sessions',
            style: textTheme.bodyMedium?.copyWith(
              color: cs.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildFormView(ColorScheme cs, TextTheme textTheme) {
    return AnimatedBuilder(
      animation: _entranceController,
      builder: (context, child) {
        final slideUp = Tween<Offset>(
          begin: const Offset(0, 0.1),
          end: Offset.zero,
        ).animate(CurvedAnimation(
          parent: _entranceController,
          curve: Curves.easeOutCubic,
        ));
        final fade = Tween<double>(begin: 0.0, end: 1.0).animate(
          CurvedAnimation(
            parent: _entranceController,
            curve: const Interval(0, 0.7),
          ),
        );
        return SlideTransition(
          position: slideUp,
          child: FadeTransition(
            opacity: fade,
            child: child,
          ),
        );
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: cs.outlineVariant,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Header
          Text(
            'Rate this Session',
            style: textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            widget.sessionTitle,
            style: textTheme.bodyMedium?.copyWith(
              color: cs.onSurfaceVariant,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 24),

          // Overall Rating (Required) with animated stars
          _AnimatedRatingSection(
            label: 'Overall Rating',
            sublabel: 'How was this session?',
            rating: _overallRating,
            onRatingChanged: (r) => setState(() => _overallRating = r),
            isRequired: true,
            animationController: _starsController,
          ),
          
          // Rating label
          const SizedBox(height: 8),
          Center(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 200),
              child: Text(
                _getRatingLabel(_overallRating),
                key: ValueKey(_overallRating),
                style: textTheme.bodySmall?.copyWith(
                  color: _overallRating > 0 ? cs.primary : cs.onSurfaceVariant,
                  fontWeight: _overallRating > 0 ? FontWeight.w600 : null,
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Expand for more details
          if (!_showDetails)
            Center(
              child: TextButton.icon(
                onPressed: () {
                  HapticFeedback.selectionClick();
                  setState(() => _showDetails = true);
                },
                icon: const Icon(Icons.expand_more_rounded, size: 20),
                label: const Text('Add detailed feedback'),
              ),
            ),

          // Detailed feedback with animated entrance
          AnimatedSize(
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOutCubic,
            child: _showDetails
                ? Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Content Rating
                      _RatingSection(
                        label: 'Content Quality',
                        sublabel: 'Was the content valuable?',
                        rating: _contentRating,
                        onRatingChanged: (r) => setState(() => _contentRating = r),
                      ),
                      const SizedBox(height: 16),

                      // Speaker Rating (if speaker exists)
                      if (widget.speakerName != null) ...[
                        _RatingSection(
                          label: 'Speaker Rating',
                          sublabel: widget.speakerName!,
                          rating: _speakerRating,
                          onRatingChanged: (r) => setState(() => _speakerRating = r),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Would Recommend
                      Text(
                        'Would you recommend this session?',
                        style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          _AnimatedRecommendChip(
                            label: 'Yes',
                            icon: Icons.thumb_up_rounded,
                            isSelected: _wouldRecommend == true,
                            onTap: () {
                              HapticFeedback.selectionClick();
                              setState(() => _wouldRecommend = true);
                            },
                          ),
                          const SizedBox(width: 12),
                          _AnimatedRecommendChip(
                            label: 'No',
                            icon: Icons.thumb_down_rounded,
                            isSelected: _wouldRecommend == false,
                            onTap: () {
                              HapticFeedback.selectionClick();
                              setState(() => _wouldRecommend = false);
                            },
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // Feedback Text
                      Text(
                        'Additional Feedback (Optional)',
                        style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _feedbackController,
                        maxLines: 3,
                        maxLength: 500,
                        decoration: InputDecoration(
                          hintText: 'Share your thoughts...',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          filled: true,
                          fillColor: cs.surfaceContainerHighest.withOpacity(0.3),
                        ),
                      ),
                    ],
                  )
                : const SizedBox.shrink(),
          ),

          const SizedBox(height: 24),

          // Submit Button
          _AnimatedSubmitButton(
            isEnabled: _overallRating > 0,
            isSubmitting: _isSubmitting,
            onPressed: _submit,
          ),
        ],
      ),
    );
  }

  String _getRatingLabel(int rating) {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Great';
      case 5: return 'Excellent!';
      default: return 'Tap to rate';
    }
  }
}

/// Animated rating section with staggered star entrance
class _AnimatedRatingSection extends StatelessWidget {
  final String label;
  final String sublabel;
  final int rating;
  final ValueChanged<int> onRatingChanged;
  final bool isRequired;
  final AnimationController animationController;

  const _AnimatedRatingSection({
    required this.label,
    required this.sublabel,
    required this.rating,
    required this.onRatingChanged,
    required this.animationController,
    this.isRequired = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
            ),
            if (isRequired)
              Text(' *', style: TextStyle(color: cs.error)),
          ],
        ),
        Text(
          sublabel,
          style: textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant),
        ),
        const SizedBox(height: 12),
        Center(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: List.generate(5, (index) {
              final starDelay = index * 0.12;
              final starAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
                CurvedAnimation(
                  parent: animationController,
                  curve: Interval(
                    starDelay,
                    (starDelay + 0.4).clamp(0.0, 1.0),
                    curve: Curves.easeOutBack,
                  ),
                ),
              );

              return AnimatedBuilder(
                animation: starAnimation,
                builder: (context, child) => Transform.scale(
                  scale: starAnimation.value,
                  child: child,
                ),
                child: _AnimatedStar(
                  index: index,
                  rating: rating,
                  onTap: () {
                    HapticFeedback.selectionClick();
                    onRatingChanged(index + 1);
                  },
                ),
              );
            }),
          ),
        ),
      ],
    );
  }
}

/// Animated star with bounce effect on selection
class _AnimatedStar extends StatefulWidget {
  final int index;
  final int rating;
  final VoidCallback onTap;

  const _AnimatedStar({
    required this.index,
    required this.rating,
    required this.onTap,
  });

  @override
  State<_AnimatedStar> createState() => _AnimatedStarState();
}

class _AnimatedStarState extends State<_AnimatedStar>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 250),
      vsync: this,
    );
    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.4), weight: 40),
      TweenSequenceItem(tween: Tween(begin: 1.4, end: 0.9), weight: 30),
      TweenSequenceItem(tween: Tween(begin: 0.9, end: 1.0), weight: 30),
    ]).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
  }

  @override
  void didUpdateWidget(_AnimatedStar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.rating > oldWidget.rating && widget.index < widget.rating) {
      _controller.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isSelected = widget.index < widget.rating;

    return GestureDetector(
      onTap: widget.onTap,
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) => Transform.scale(
          scale: isSelected ? _scaleAnimation.value : 1.0,
          child: child,
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            child: Icon(
              isSelected ? Icons.star_rounded : Icons.star_outline_rounded,
              size: 44,
              color: isSelected ? Colors.amber : Colors.grey.shade400,
            ),
          ),
        ),
      ),
    );
  }
}

/// Standard rating section (for detailed ratings)
class _RatingSection extends StatelessWidget {
  final String label;
  final String sublabel;
  final int rating;
  final ValueChanged<int> onRatingChanged;
  final bool isRequired;

  const _RatingSection({
    required this.label,
    required this.sublabel,
    required this.rating,
    required this.onRatingChanged,
    this.isRequired = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
            ),
            if (isRequired)
              Text(' *', style: TextStyle(color: cs.error)),
          ],
        ),
        Text(
          sublabel,
          style: textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.start,
          children: List.generate(5, (index) {
            final starValue = index + 1;
            final isSelected = starValue <= rating;
            return GestureDetector(
              onTap: () {
                HapticFeedback.selectionClick();
                onRatingChanged(starValue);
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.all(6),
                child: Icon(
                  isSelected ? Icons.star_rounded : Icons.star_outline_rounded,
                  size: 32,
                  color: isSelected ? Colors.amber : cs.outlineVariant,
                ),
              ),
            );
          }),
        ),
      ],
    );
  }
}

/// Animated recommend chip with scale feedback
class _AnimatedRecommendChip extends StatefulWidget {
  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _AnimatedRecommendChip({
    required this.label,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  State<_AnimatedRecommendChip> createState() => _AnimatedRecommendChipState();
}

class _AnimatedRecommendChipState extends State<_AnimatedRecommendChip>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
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
    final cs = Theme.of(context).colorScheme;

    return GestureDetector(
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) {
        _controller.reverse();
        widget.onTap();
      },
      onTapCancel: () => _controller.reverse(),
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) => Transform.scale(
          scale: _scaleAnimation.value,
          child: child,
        ),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: widget.isSelected ? cs.primaryContainer : cs.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: widget.isSelected ? cs.primary : cs.outline.withOpacity(0.3),
              width: widget.isSelected ? 2 : 1,
            ),
            boxShadow: widget.isSelected
                ? [
                    BoxShadow(
                      color: cs.primary.withOpacity(0.2),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                widget.icon,
                size: 18,
                color: widget.isSelected ? cs.primary : cs.onSurfaceVariant,
              ),
              const SizedBox(width: 6),
              Text(
                widget.label,
                style: TextStyle(
                  color: widget.isSelected ? cs.primary : cs.onSurfaceVariant,
                  fontWeight: widget.isSelected ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Animated submit button
class _AnimatedSubmitButton extends StatefulWidget {
  final bool isEnabled;
  final bool isSubmitting;
  final VoidCallback onPressed;

  const _AnimatedSubmitButton({
    required this.isEnabled,
    required this.isSubmitting,
    required this.onPressed,
  });

  @override
  State<_AnimatedSubmitButton> createState() => _AnimatedSubmitButtonState();
}

class _AnimatedSubmitButtonState extends State<_AnimatedSubmitButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.98).animate(
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
    final cs = Theme.of(context).colorScheme;

    return GestureDetector(
      onTapDown: widget.isEnabled ? (_) => _controller.forward() : null,
      onTapUp: widget.isEnabled ? (_) => _controller.reverse() : null,
      onTapCancel: widget.isEnabled ? () => _controller.reverse() : null,
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) => Transform.scale(
          scale: _scaleAnimation.value,
          child: child,
        ),
        child: SizedBox(
          width: double.infinity,
          child: FilledButton.icon(
            onPressed: widget.isSubmitting || !widget.isEnabled ? null : widget.onPressed,
            icon: widget.isSubmitting
                ? SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(cs.onPrimary),
                    ),
                  )
                : const Icon(Icons.send_rounded),
            label: AnimatedSwitcher(
              duration: const Duration(milliseconds: 200),
              child: Text(
                widget.isSubmitting ? 'Submitting...' : 'Submit Rating',
                key: ValueKey(widget.isSubmitting),
              ),
            ),
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
          ),
        ),
      ),
    );
  }
}
