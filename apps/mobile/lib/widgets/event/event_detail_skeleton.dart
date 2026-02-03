import 'package:flutter/material.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/shimmer_loading.dart';

/// Skeleton loading state for event detail page
class EventDetailSkeleton extends StatelessWidget {
  const EventDetailSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      body: CustomScrollView(
        physics: const NeverScrollableScrollPhysics(),
        slivers: [
          // App bar skeleton
          SliverAppBar(
            pinned: true,
            expandedHeight: 260,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: ShimmerLoading(
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        cs.surfaceContainerHighest,
                        cs.surfaceContainerHighest.withValues(alpha: 0.8),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
          // Content skeleton
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Organizer card skeleton
                  _buildCardSkeleton(cs, height: 80),
                  const SizedBox(height: 16),
                  // Quick actions skeleton
                  Row(
                    children: [
                      _buildChipSkeleton(cs, width: 80),
                      const SizedBox(width: 8),
                      _buildChipSkeleton(cs, width: 70),
                      const SizedBox(width: 8),
                      _buildChipSkeleton(cs, width: 90),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Countdown skeleton
                  _buildCardSkeleton(cs, height: 100),
                  const SizedBox(height: 16),
                  // Social proof skeleton
                  _buildCardSkeleton(cs, height: 70),
                  const SizedBox(height: 24),
                  // Info chips skeleton
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _buildChipSkeleton(cs, width: 100),
                      _buildChipSkeleton(cs, width: 80),
                      _buildChipSkeleton(cs, width: 90),
                      _buildChipSkeleton(cs, width: 110),
                    ],
                  ),
                  const SizedBox(height: 24),
                  // About section skeleton
                  _buildTitleSkeleton(cs),
                  const SizedBox(height: 12),
                  _buildTextLineSkeleton(cs, width: double.infinity),
                  const SizedBox(height: 8),
                  _buildTextLineSkeleton(cs, width: 280),
                  const SizedBox(height: 8),
                  _buildTextLineSkeleton(cs, width: 200),
                  const SizedBox(height: 24),
                  // Location skeleton
                  _buildTitleSkeleton(cs),
                  const SizedBox(height: 12),
                  _buildCardSkeleton(cs, height: 180),
                  const SizedBox(height: 24),
                  // Tickets skeleton
                  _buildTitleSkeleton(cs),
                  const SizedBox(height: 12),
                  _buildCardSkeleton(cs, height: 100),
                  const SizedBox(height: 10),
                  _buildCardSkeleton(cs, height: 100),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
        decoration: BoxDecoration(
          color: cs.surface,
          border: Border(top: BorderSide(color: cs.outline)),
        ),
        child: Row(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                ShimmerLoading(
                  child: Container(
                    width: 40,
                    height: 12,
                    decoration: BoxDecoration(
                      color: cs.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                ShimmerLoading(
                  child: Container(
                    width: 80,
                    height: 20,
                    decoration: BoxDecoration(
                      color: cs.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ),
              ],
            ),
            const Spacer(),
            ShimmerLoading(
              child: Container(
                width: 140,
                height: 48,
                decoration: BoxDecoration(
                  color: cs.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCardSkeleton(ColorScheme cs, {required double height}) {
    return ShimmerLoading(
      child: Container(
        height: height,
        decoration: BoxDecoration(
          color: cs.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(AppRadius.lg),
        ),
      ),
    );
  }

  Widget _buildChipSkeleton(ColorScheme cs, {required double width}) {
    return ShimmerLoading(
      child: Container(
        width: width,
        height: 36,
        decoration: BoxDecoration(
          color: cs.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(999),
        ),
      ),
    );
  }

  Widget _buildTitleSkeleton(ColorScheme cs) {
    return ShimmerLoading(
      child: Container(
        width: 120,
        height: 24,
        decoration: BoxDecoration(
          color: cs.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(4),
        ),
      ),
    );
  }

  Widget _buildTextLineSkeleton(ColorScheme cs, {required double width}) {
    return ShimmerLoading(
      child: Container(
        width: width,
        height: 16,
        decoration: BoxDecoration(
          color: cs.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(4),
        ),
      ),
    );
  }
}
