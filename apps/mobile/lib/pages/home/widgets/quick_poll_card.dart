import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/supabase/gamification_service.dart';
import 'package:thittam1hub/widgets/shimmer_loading.dart';

class QuickPollCard extends StatefulWidget {
  final VibeGameItem poll;
  final Function(int) onVote;

  const QuickPollCard({
    Key? key,
    required this.poll,
    required this.onVote,
  }) : super(key: key);

  @override
  State<QuickPollCard> createState() => _QuickPollCardState();
}

class _QuickPollCardState extends State<QuickPollCard> with TickerProviderStateMixin {
  int? _selectedOption;
  bool _hasVoted = false;
  late AnimationController _voteAnimController;
  late Animation<double> _voteAnimation;

  @override
  void initState() {
    super.initState();
    _voteAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _voteAnimation = CurvedAnimation(
      parent: _voteAnimController,
      curve: Curves.easeOutBack,
    );
  }

  @override
  void dispose() {
    _voteAnimController.dispose();
    super.dispose();
  }

  Future<void> _vote(int optionIndex) async {
    if (_hasVoted) return;
    
    HapticFeedback.mediumImpact();
    
    // Store previous state for rollback
    final previousSelected = _selectedOption;
    final previousHasVoted = _hasVoted;
    
    // Optimistic update
    setState(() {
      _selectedOption = optionIndex;
      _hasVoted = true;
    });
    _voteAnimController.forward();
    
    try {
      await widget.onVote(optionIndex);
    } catch (e) {
      // Rollback on failure
      if (mounted) {
        setState(() {
          _selectedOption = previousSelected;
          _hasVoted = previousHasVoted;
        });
        _voteAnimController.reverse();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Failed to submit vote. Try again.'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }

  String _getTimeLeft() {
    final expiresAt = widget.poll.expiresAt;
    if (expiresAt == null) return '';
    
    final now = DateTime.now();
    final diff = expiresAt.difference(now);
    
    if (diff.isNegative) return 'Ended';
    if (diff.inDays > 0) return '${diff.inDays}d left';
    if (diff.inHours > 0) return '${diff.inHours}h left';
    if (diff.inMinutes > 0) return '${diff.inMinutes}m left';
    return 'Ending soon';
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    final options = widget.poll.options;
    final totalVotes = widget.poll.participantCount ?? 0;
    
    // For demo, simulate vote percentages
    final percentages = options.length == 2
        ? [67, 33]
        : List.generate(options.length, (i) => (100 / options.length).round());

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        boxShadow: isDark ? null : [
          BoxShadow(
            color: cs.primary.withValues(alpha: 0.1),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: BackdropFilter(
          filter: ImageFilter.blur(
            sigmaX: isDark ? 20 : 10,
            sigmaY: isDark ? 20 : 10,
          ),
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              gradient: LinearGradient(
                colors: isDark
                    ? [
                        cs.primaryContainer.withValues(alpha: 0.3),
                        cs.tertiaryContainer.withValues(alpha: 0.2),
                      ]
                    : [
                        cs.primaryContainer.withValues(alpha: 0.5),
                        cs.surfaceContainerLowest,
                      ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              border: Border.all(
                color: isDark
                    ? Colors.white.withValues(alpha: 0.1)
                    : cs.primary.withValues(alpha: 0.15),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [cs.primary, cs.tertiary],
                        ),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.poll_rounded, size: 14, color: Colors.white),
                          const SizedBox(width: 5),
                          Text(
                            'QUICK POLL',
                            style: textTheme.labelSmall?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: cs.surfaceContainerHighest.withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.timer_outlined,
                            size: 12,
                            color: cs.onSurfaceVariant,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _getTimeLeft(),
                            style: textTheme.labelSmall?.copyWith(
                              color: cs.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                
                // Question
                Text(
                  widget.poll.question,
                  style: textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 18),
                
                // Options with animated bars
                ...List.generate(options.length, (index) {
                  final option = options[index];
                  final percentage = percentages[index];
                  final isSelected = _selectedOption == index;
                  
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: GestureDetector(
                      onTap: () => _vote(index),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        curve: Curves.easeOutCubic,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: isSelected 
                                ? cs.primary 
                                : cs.outline.withValues(alpha: 0.25),
                            width: isSelected ? 2 : 1.5,
                          ),
                          color: isSelected 
                              ? cs.primary.withValues(alpha: 0.05)
                              : Colors.transparent,
                        ),
                        child: Stack(
                          children: [
                            // Animated progress bar
                            if (_hasVoted)
                              AnimatedBuilder(
                                animation: _voteAnimation,
                                builder: (context, child) {
                                  return ClipRRect(
                                    borderRadius: BorderRadius.circular(12),
                                    child: FractionallySizedBox(
                                      alignment: Alignment.centerLeft,
                                      widthFactor: (percentage / 100) * _voteAnimation.value,
                                      child: Container(
                                        height: 52,
                                        decoration: BoxDecoration(
                                          gradient: LinearGradient(
                                            colors: isSelected
                                                ? [
                                                    cs.primary.withValues(alpha: 0.2),
                                                    cs.primary.withValues(alpha: 0.1),
                                                  ]
                                                : [
                                                    cs.surfaceContainerHighest.withValues(alpha: 0.8),
                                                    cs.surfaceContainerHighest.withValues(alpha: 0.4),
                                                  ],
                                          ),
                                        ),
                                      ),
                                    ),
                                  );
                                },
                              ),
                            
                            // Content
                            Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 14,
                              ),
                              child: Row(
                                children: [
                                  if (_hasVoted && isSelected)
                                    Container(
                                      margin: const EdgeInsets.only(right: 10),
                                      padding: const EdgeInsets.all(2),
                                      decoration: BoxDecoration(
                                        color: cs.primary,
                                        shape: BoxShape.circle,
                                      ),
                                      child: Icon(
                                        Icons.check,
                                        size: 12,
                                        color: cs.onPrimary,
                                      ),
                                    ),
                                  Expanded(
                                    child: Text(
                                      option,
                                      style: textTheme.bodyMedium?.copyWith(
                                        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                  if (_hasVoted)
                                    AnimatedBuilder(
                                      animation: _voteAnimation,
                                      builder: (context, child) {
                                        return Opacity(
                                          opacity: _voteAnimation.value,
                                          child: Text(
                                            '$percentage%',
                                            style: textTheme.titleSmall?.copyWith(
                                              fontWeight: FontWeight.bold,
                                              color: isSelected ? cs.primary : cs.onSurfaceVariant,
                                            ),
                                          ),
                                        );
                                      },
                                    ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }),
                
                const SizedBox(height: 8),
                
                // Vote count and status
                Row(
                  children: [
                    Icon(
                      Icons.people_outline_rounded,
                      size: 16,
                      color: cs.onSurfaceVariant,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '$totalVotes votes',
                      style: textTheme.labelMedium?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                    if (_hasVoted) ...[
                      const SizedBox(width: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: Colors.green.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.check_circle_outline_rounded,
                              size: 12,
                              color: Colors.green.shade600,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'You voted',
                              style: textTheme.labelSmall?.copyWith(
                                color: Colors.green.shade600,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class QuickPollCardSkeleton extends StatelessWidget {
  const QuickPollCardSkeleton({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: isDark ? cs.surfaceContainerHigh : cs.surfaceContainerLowest,
        border: Border.all(
          color: cs.outline.withValues(alpha: 0.1),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ShimmerPlaceholder(
            width: 100,
            height: 24,
            borderRadius: BorderRadius.circular(10),
          ),
          const SizedBox(height: 16),
          ShimmerPlaceholder(
            width: double.infinity,
            height: 20,
            borderRadius: BorderRadius.circular(8),
          ),
          const SizedBox(height: 18),
          ShimmerPlaceholder(
            width: double.infinity,
            height: 52,
            borderRadius: BorderRadius.circular(14),
          ),
          const SizedBox(height: 10),
          ShimmerPlaceholder(
            width: double.infinity,
            height: 52,
            borderRadius: BorderRadius.circular(14),
          ),
        ],
      ),
    );
  }
}
