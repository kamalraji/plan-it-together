import 'package:flutter/material.dart';
import 'package:thittam1hub/widgets/shimmer_loading.dart';

/// Skeleton loading for a single comment
class CommentSkeleton extends StatelessWidget {
  final bool isReply;

  const CommentSkeleton({
    super.key,
    this.isReply = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Padding(
      padding: EdgeInsets.only(
        left: isReply ? 48 : 16,
        right: 16,
        top: 12,
        bottom: 4,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Avatar
          ShimmerPlaceholder(
            width: isReply ? 28 : 36,
            height: isReply ? 28 : 36,
            isCircle: true,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Author name and time
                Row(
                  children: [
                    ShimmerPlaceholder(
                      width: 80,
                      height: 12,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    const SizedBox(width: 8),
                    ShimmerPlaceholder(
                      width: 24,
                      height: 10,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                // Content lines
                ShimmerPlaceholder(
                  width: double.infinity,
                  height: 12,
                  borderRadius: BorderRadius.circular(4),
                ),
                const SizedBox(height: 4),
                ShimmerPlaceholder(
                  width: MediaQuery.of(context).size.width * 0.5,
                  height: 12,
                  borderRadius: BorderRadius.circular(4),
                ),
                const SizedBox(height: 12),
                // Actions row
                Row(
                  children: [
                    ShimmerPlaceholder(
                      width: 40,
                      height: 16,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    const SizedBox(width: 16),
                    ShimmerPlaceholder(
                      width: 40,
                      height: 16,
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Skeleton loading for a list of comments
class CommentListSkeleton extends StatelessWidget {
  final int itemCount;

  const CommentListSkeleton({
    super.key,
    this.itemCount = 5,
  });

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: itemCount,
      itemBuilder: (context, index) {
        // Show some as replies for variety
        final isReply = index == 2 || index == 4;
        return CommentSkeleton(isReply: isReply);
      },
    );
  }
}

/// Animated loading indicator for comments
class CommentLoadingIndicator extends StatefulWidget {
  const CommentLoadingIndicator({super.key});

  @override
  State<CommentLoadingIndicator> createState() => _CommentLoadingIndicatorState();
}

class _CommentLoadingIndicatorState extends State<CommentLoadingIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    )..repeat();
    _animation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
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

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(3, (index) {
            return AnimatedBuilder(
              animation: _animation,
              builder: (context, child) {
                final delay = index * 0.2;
                final value = ((_animation.value + delay) % 1.0);
                final scale = 0.5 + (0.5 * (1 - (value - 0.5).abs() * 2));
                return Transform.scale(
                  scale: scale,
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: cs.primary.withOpacity(0.6),
                      shape: BoxShape.circle,
                    ),
                  ),
                );
              },
            );
          }),
        ),
      ),
    );
  }
}
