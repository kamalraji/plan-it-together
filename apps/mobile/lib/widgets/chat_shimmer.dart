import 'package:flutter/material.dart';
import 'package:thittam1hub/widgets/shimmer_loading.dart';
import 'package:thittam1hub/theme.dart';

/// Shimmer loading skeleton for chat list
class ChatListShimmer extends StatelessWidget {
  final int itemCount;

  const ChatListShimmer({super.key, this.itemCount = 6});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      itemCount: itemCount,
      itemBuilder: (context, index) => const _ChatTileShimmer(),
    );
  }
}

class _ChatTileShimmer extends StatelessWidget {
  const _ChatTileShimmer();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(
          color: theme.colorScheme.outline.withOpacity(0.3),
        ),
      ),
      child: Row(
        children: [
          // Avatar shimmer
          const ShimmerPlaceholder(
            width: 40,
            height: 40,
            isCircle: true,
          ),
          const SizedBox(width: 12),
          
          // Content shimmer
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: ShimmerPlaceholder(
                        width: 120,
                        height: 14,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ShimmerPlaceholder(
                      width: 40,
                      height: 12,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                ShimmerPlaceholder(
                  width: double.infinity,
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

/// Shimmer for message thread
class MessageShimmer extends StatelessWidget {
  final bool isMe;

  const MessageShimmer({super.key, this.isMe = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
      child: Row(
        mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
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
            crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
            children: [
              if (!isMe)
                Padding(
                  padding: const EdgeInsets.only(left: 6, bottom: 4),
                  child: ShimmerPlaceholder(
                    width: 80,
                    height: 10,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ShimmerPlaceholder(
                      width: 180 + (isMe ? -30 : 0),
                      height: 12,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    const SizedBox(height: 6),
                    ShimmerPlaceholder(
                      width: 120 + (isMe ? -20 : 0),
                      height: 12,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          if (isMe) ...[
            const SizedBox(width: 8),
            const ShimmerPlaceholder(
              width: 32,
              height: 32,
              isCircle: true,
            ),
          ],
        ],
      ),
    );
  }
}

/// Thread loading shimmer
class ThreadShimmer extends StatelessWidget {
  const ThreadShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 16),
      children: const [
        MessageShimmer(isMe: false),
        MessageShimmer(isMe: true),
        MessageShimmer(isMe: false),
        MessageShimmer(isMe: false),
        MessageShimmer(isMe: true),
      ],
    );
  }
}
