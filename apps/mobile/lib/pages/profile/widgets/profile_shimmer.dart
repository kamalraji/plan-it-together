import 'package:flutter/material.dart';
import 'package:thittam1hub/widgets/shimmer_loading.dart';
import 'package:thittam1hub/theme.dart';

/// Shimmer skeleton matching ProfilePage layout.
/// 
/// Provides a premium loading experience by mirroring the exact
/// structure of the profile page during data loading.
class ProfileShimmer extends StatelessWidget {
  const ProfileShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return SafeArea(
      child: SingleChildScrollView(
        physics: const NeverScrollableScrollPhysics(),
        child: Column(
          children: [
            // Cover + Avatar shimmer
            Stack(
              clipBehavior: Clip.none,
              children: [
                ShimmerLoading(
                  child: Container(
                    height: 120,
                    width: double.infinity,
                    color: cs.surfaceContainerHighest,
                  ),
                ),
                Positioned(
                  left: 16,
                  bottom: -40,
                  child: Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: cs.surface, width: 4),
                    ),
                    child: ShimmerPlaceholder(
                      width: 80,
                      height: 80,
                      isCircle: true,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 56),
            
            // Name and handle shimmer
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ShimmerTextPlaceholder(width: 160, height: 24),
                        const SizedBox(height: 8),
                        ShimmerTextPlaceholder(width: 100, height: 16),
                      ],
                    ),
                  ),
                  // Action buttons shimmer
                  Row(
                    children: [
                      ShimmerPlaceholder(width: 70, height: 32, borderRadius: 16.0),
                      const SizedBox(width: 8),
                      ShimmerPlaceholder(width: 36, height: 36, isCircle: true),
                      const SizedBox(width: 8),
                      ShimmerPlaceholder(width: 36, height: 36, isCircle: true),
                    ],
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: AppSpacing.md),
            
            // Stats row shimmer
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                decoration: BoxDecoration(
                  color: cs.surfaceContainerHighest.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: List.generate(4, (index) {
                    return Expanded(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          ShimmerPlaceholder(width: 40, height: 20, borderRadius: 4.0),
                          const SizedBox(height: 4),
                          ShimmerPlaceholder(width: 32, height: 12, borderRadius: 4.0),
                        ],
                      ),
                    );
                  }),
                ),
              ),
            ),
            
            const SizedBox(height: AppSpacing.md),
            
            // Quick actions shimmer
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: List.generate(4, (index) {
                  return ShimmerPlaceholder(
                    width: 70,
                    height: 70,
                    borderRadius: 12.0,
                  );
                }),
              ),
            ),
            
            const SizedBox(height: AppSpacing.lg),
            
            // Tab bar shimmer
            Container(
              height: 48,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: List.generate(4, (index) {
                  return ShimmerPlaceholder(
                    width: 60,
                    height: 32,
                    borderRadius: 8.0,
                  );
                }),
              ),
            ),
            
            // Tab content shimmer (posts grid)
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  crossAxisSpacing: 4,
                  mainAxisSpacing: 4,
                ),
                itemCount: 9,
                itemBuilder: (context, index) {
                  return ShimmerPlaceholder(
                    borderRadius: 4.0,
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Compact shimmer for profile cards in lists
class ProfileCardShimmer extends StatelessWidget {
  const ProfileCardShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          ShimmerPlaceholder(width: 48, height: 48, isCircle: true),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ShimmerTextPlaceholder(width: 120),
                SizedBox(height: 6),
                ShimmerTextPlaceholder(width: 80, height: 12),
              ],
            ),
          ),
          ShimmerPlaceholder(width: 80, height: 32, borderRadius: 16.0),
        ],
      ),
    );
  }
}
