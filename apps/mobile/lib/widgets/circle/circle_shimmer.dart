import 'package:flutter/material.dart';
import 'package:thittam1hub/widgets/shimmer_loading.dart';

/// Shimmer skeleton for Circle detail page
class CircleDetailShimmer extends StatelessWidget {
  const CircleDetailShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return CustomScrollView(
      slivers: [
        // Parallax Header Shimmer
        SliverAppBar(
          expandedHeight: 280,
          pinned: true,
          backgroundColor: colorScheme.surface,
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    colorScheme.primary.withOpacity(0.1),
                    colorScheme.secondary.withOpacity(0.1),
                  ],
                ),
              ),
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      // Icon placeholder
                      ShimmerPlaceholder(
                        width: 80,
                        height: 80,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      const SizedBox(height: 16),
                      // Name placeholder
                      ShimmerPlaceholder(
                        width: 180,
                        height: 24,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      const SizedBox(height: 8),
                      // Category badge
                      ShimmerPlaceholder(
                        width: 80,
                        height: 20,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      const SizedBox(height: 8),
                      // Member count
                      ShimmerPlaceholder(
                        width: 140,
                        height: 16,
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),

        // Stats Row Shimmer
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: colorScheme.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: colorScheme.outline.withOpacity(0.1),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: List.generate(3, (index) {
                  return Column(
                    children: [
                      ShimmerPlaceholder(
                        width: 32,
                        height: 32,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      const SizedBox(height: 8),
                      ShimmerPlaceholder(
                        width: 40,
                        height: 20,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      const SizedBox(height: 4),
                      ShimmerPlaceholder(
                        width: 60,
                        height: 12,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ],
                  );
                }),
              ),
            ),
          ),
        ),

        // Quick Actions Shimmer
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Expanded(
                  child: ShimmerPlaceholder(
                    height: 48,
                    borderRadius: BorderRadius.circular(24),
                  ),
                ),
                const SizedBox(width: 12),
                ShimmerPlaceholder(
                  width: 48,
                  height: 48,
                  borderRadius: BorderRadius.circular(24),
                ),
              ],
            ),
          ),
        ),

        // About Section Shimmer
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ShimmerPlaceholder(
                  width: 60,
                  height: 20,
                  borderRadius: BorderRadius.circular(4),
                ),
                const SizedBox(height: 12),
                ShimmerPlaceholder(
                  height: 16,
                  borderRadius: BorderRadius.circular(4),
                ),
                const SizedBox(height: 8),
                ShimmerPlaceholder(
                  width: 200,
                  height: 16,
                  borderRadius: BorderRadius.circular(4),
                ),
                const SizedBox(height: 16),
                // Tags
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: List.generate(4, (index) {
                    return ShimmerPlaceholder(
                      width: 60 + (index * 10).toDouble(),
                      height: 24,
                      borderRadius: BorderRadius.circular(8),
                    );
                  }),
                ),
              ],
            ),
          ),
        ),

        // Member Preview Shimmer
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    ShimmerPlaceholder(
                      width: 80,
                      height: 20,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    ShimmerPlaceholder(
                      width: 60,
                      height: 16,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  height: 50,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: 6,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (_, __) => const ShimmerPlaceholder(
                      width: 36,
                      height: 36,
                      isCircle: true,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),

        const SliverToBoxAdapter(
          child: SizedBox(height: 100),
        ),
      ],
    );
  }
}

/// Shimmer skeleton for Circle members page
class CircleMembersShimmer extends StatelessWidget {
  const CircleMembersShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: 10,
      itemBuilder: (context, index) {
        return const _MemberTileShimmer();
      },
    );
  }
}

class _MemberTileShimmer extends StatelessWidget {
  const _MemberTileShimmer();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          const ShimmerPlaceholder(
            width: 44,
            height: 44,
            isCircle: true,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    ShimmerPlaceholder(
                      width: 120,
                      height: 16,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    const SizedBox(width: 8),
                    ShimmerPlaceholder(
                      width: 50,
                      height: 16,
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                ShimmerPlaceholder(
                  width: 80,
                  height: 12,
                  borderRadius: BorderRadius.circular(4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Shimmer skeleton for Circle chat page
class CircleChatShimmer extends StatelessWidget {
  const CircleChatShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            reverse: true,
            padding: const EdgeInsets.all(16),
            itemCount: 8,
            itemBuilder: (context, index) {
              final isMe = index % 3 == 0;
              return _MessageBubbleShimmer(isMe: isMe);
            },
          ),
        ),
        // Composer shimmer
        Container(
          padding: const EdgeInsets.all(16),
          child: ShimmerPlaceholder(
            height: 48,
            borderRadius: BorderRadius.circular(24),
          ),
        ),
      ],
    );
  }
}

class _MessageBubbleShimmer extends StatelessWidget {
  final bool isMe;

  const _MessageBubbleShimmer({required this.isMe});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isMe) ...[
            const ShimmerPlaceholder(
              width: 32,
              height: 32,
              isCircle: true,
            ),
            const SizedBox(width: 8),
          ],
          Column(
            crossAxisAlignment:
                isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
            children: [
              if (!isMe)
                Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: ShimmerPlaceholder(
                    width: 80,
                    height: 12,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ShimmerPlaceholder(
                width: 180,
                height: 40,
                borderRadius: BorderRadius.circular(16),
              ),
            ],
          ),
          if (isMe) const SizedBox(width: 8),
        ],
      ),
    );
  }
}

/// Shimmer for invite sheet
class CircleInviteShimmer extends StatelessWidget {
  const CircleInviteShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Row(
            children: [
              const ShimmerPlaceholder(
                width: 40,
                height: 40,
                isCircle: true,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ShimmerPlaceholder(
                      width: 160,
                      height: 20,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    const SizedBox(height: 4),
                    ShimmerPlaceholder(
                      width: 120,
                      height: 14,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          // Link box
          ShimmerPlaceholder(
            height: 80,
            borderRadius: BorderRadius.circular(12),
          ),
          const SizedBox(height: 24),
          // Buttons
          Row(
            children: [
              Expanded(
                child: ShimmerPlaceholder(
                  height: 48,
                  borderRadius: BorderRadius.circular(24),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ShimmerPlaceholder(
                  height: 48,
                  borderRadius: BorderRadius.circular(24),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
