import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class WouldYouRatherCard extends StatefulWidget {
  final String id;
  final String optionA;
  final String optionB;
  final int? votesA;
  final int? votesB;
  final int? selectedOption; // 0 or 1
  final Function(int) onVote;
  final VoidCallback? onSeeWhoChose;

  const WouldYouRatherCard({
    Key? key,
    required this.id,
    required this.optionA,
    required this.optionB,
    this.votesA,
    this.votesB,
    this.selectedOption,
    required this.onVote,
    this.onSeeWhoChose,
  }) : super(key: key);

  @override
  State<WouldYouRatherCard> createState() => _WouldYouRatherCardState();
}

class _WouldYouRatherCardState extends State<WouldYouRatherCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _percentAnimation;
  bool _hasVoted = false;

  @override
  void initState() {
    super.initState();
    _hasVoted = widget.selectedOption != null;
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _percentAnimation = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOutCubic,
    );
    if (_hasVoted) {
      _animController.value = 1.0;
    }
  }

  @override
  void didUpdateWidget(WouldYouRatherCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.selectedOption != null && !_hasVoted) {
      _hasVoted = true;
      _animController.forward();
    }
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  void _handleVote(int option) {
    if (_hasVoted) return;
    HapticFeedback.mediumImpact();
    widget.onVote(option);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final totalVotes = (widget.votesA ?? 0) + (widget.votesB ?? 0);
    final percentA = totalVotes > 0 ? (widget.votesA ?? 0) / totalVotes : 0.5;
    final percentB = totalVotes > 0 ? (widget.votesB ?? 0) / totalVotes : 0.5;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 0,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  (isDark ? Colors.white : Colors.black).withOpacity(0.08),
                  (isDark ? Colors.white : Colors.black).withOpacity(0.04),
                ],
              ),
              border: Border.all(
                color: cs.outline.withOpacity(0.2),
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        '🤔 WOULD YOU RATHER',
                        style: TextStyle(
                          color: cs.primary,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const Spacer(),
                      if (_hasVoted && widget.onSeeWhoChose != null)
                        TextButton.icon(
                          onPressed: widget.onSeeWhoChose,
                          icon: const Icon(Icons.people, size: 16),
                          label: const Text('Who chose this?'),
                          style: TextButton.styleFrom(
                            visualDensity: VisualDensity.compact,
                            padding: EdgeInsets.zero,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: _OptionButton(
                          label: widget.optionA,
                          isSelected: widget.selectedOption == 0,
                          hasVoted: _hasVoted,
                          percent: percentA,
                          animation: _percentAnimation,
                          color: Colors.blue,
                          onTap: () => _handleVote(0),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: Text(
                          'OR',
                          style: textTheme.labelMedium?.copyWith(
                            color: cs.onSurfaceVariant,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      Expanded(
                        child: _OptionButton(
                          label: widget.optionB,
                          isSelected: widget.selectedOption == 1,
                          hasVoted: _hasVoted,
                          percent: percentB,
                          animation: _percentAnimation,
                          color: Colors.purple,
                          onTap: () => _handleVote(1),
                        ),
                      ),
                    ],
                  ),
                  if (_hasVoted) ...[
                    const SizedBox(height: 12),
                    Text(
                      '${totalVotes} people voted',
                      style: textTheme.bodySmall?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _OptionButton extends StatelessWidget {
  final String label;
  final bool isSelected;
  final bool hasVoted;
  final double percent;
  final Animation<double> animation;
  final Color color;
  final VoidCallback onTap;

  const _OptionButton({
    required this.label,
    required this.isSelected,
    required this.hasVoted,
    required this.percent,
    required this.animation,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        return GestureDetector(
          onTap: hasVoted ? null : onTap,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            height: 120,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isSelected ? color : cs.outline.withOpacity(0.3),
                width: isSelected ? 2 : 1,
              ),
              color: isSelected
                  ? color.withOpacity(0.15)
                  : cs.surfaceContainerHighest,
            ),
            child: Stack(
              children: [
                // Percentage fill
                if (hasVoted)
                  Positioned.fill(
                    child: Align(
                      alignment: Alignment.bottomCenter,
                      child: Container(
                        height: 120 * percent * animation.value,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(11),
                          color: color.withOpacity(0.2),
                        ),
                      ),
                    ),
                  ),
                // Content
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        label,
                        textAlign: TextAlign.center,
                        style: textTheme.bodyMedium?.copyWith(
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          color: isSelected ? color : cs.onSurface,
                        ),
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (hasVoted) ...[
                        const SizedBox(height: 8),
                        Text(
                          '${(percent * 100 * animation.value).toInt()}%',
                          style: textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: color,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
