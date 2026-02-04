import 'package:flutter/material.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/shimmer_loading.dart';

/// Shimmer loading skeleton for settings pages
/// 
/// Matches the visual structure of SettingsSection components
/// with animated shimmer effect for a professional loading experience
class SettingsSkeleton extends StatelessWidget {
  /// Number of settings sections to display
  final int sectionCount;

  /// Number of items per section
  final int itemsPerSection;

  const SettingsSkeleton({
    super.key,
    this.sectionCount = 2,
    this.itemsPerSection = 3,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: context.horizontalPadding,
        vertical: AppSpacing.md,
      ),
      child: Column(
        children: List.generate(
          sectionCount,
          (index) => Padding(
            padding: EdgeInsets.only(
              bottom: index < sectionCount - 1 ? AppSpacing.md : 0,
            ),
            child: _SkeletonSection(itemCount: itemsPerSection),
          ),
        ),
      ),
    );
  }
}

/// Single skeleton section matching SettingsSection layout
class _SkeletonSection extends StatelessWidget {
  final int itemCount;

  const _SkeletonSection({this.itemCount = 3});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Card(
      margin: EdgeInsets.zero,
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header skeleton
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Row(
              children: [
                // Icon placeholder
                ShimmerPlaceholder(
                  width: 34,
                  height: 34,
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                const SizedBox(width: AppSpacing.md),
                // Title placeholder
                const ShimmerPlaceholder(
                  width: 120,
                  height: 16,
                  borderRadius: BorderRadius.all(Radius.circular(4)),
                ),
                const Spacer(),
                // Chevron placeholder
                ShimmerPlaceholder(
                  width: 20,
                  height: 20,
                  borderRadius: BorderRadius.circular(4),
                ),
              ],
            ),
          ),
          Divider(height: 1, color: cs.outline.withOpacity(0.3)),
          // Items skeleton
          ...List.generate(
            itemCount,
            (index) => _SkeletonItem(showDivider: index < itemCount - 1),
          ),
        ],
      ),
    );
  }
}

/// Single skeleton item matching SettingsToggle/SettingsAction layout
class _SkeletonItem extends StatelessWidget {
  final bool showDivider;

  const _SkeletonItem({this.showDivider = true});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.sm + 4,
          ),
          child: Row(
            children: [
              // Icon placeholder
              ShimmerPlaceholder(
                width: 20,
                height: 20,
                borderRadius: BorderRadius.circular(4),
              ),
              const SizedBox(width: AppSpacing.md),
              // Text content placeholder
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ShimmerPlaceholder(
                      width: 140,
                      height: 14,
                      borderRadius: BorderRadius.circular(3),
                    ),
                    const SizedBox(height: 6),
                    ShimmerPlaceholder(
                      width: 200,
                      height: 12,
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ],
                ),
              ),
              // Toggle/chevron placeholder
              ShimmerPlaceholder(
                width: 40,
                height: 24,
                borderRadius: BorderRadius.circular(12),
              ),
            ],
          ),
        ),
        if (showDivider)
          Divider(
            height: 1,
            indent: AppSpacing.md + 20 + AppSpacing.md,
            color: cs.outline.withOpacity(0.2),
          ),
      ],
    );
  }
}

/// Compact skeleton for single card (e.g., account info)
class SettingsCardSkeleton extends StatelessWidget {
  final int rowCount;

  const SettingsCardSkeleton({
    super.key,
    this.rowCount = 3,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
        child: Column(
          children: List.generate(
            rowCount,
            (index) => Column(
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.md,
                    vertical: AppSpacing.sm,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      ShimmerPlaceholder(
                        width: 60,
                        height: 14,
                        borderRadius: BorderRadius.circular(3),
                      ),
                      ShimmerPlaceholder(
                        width: 120,
                        height: 14,
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ],
                  ),
                ),
                if (index < rowCount - 1)
                  Divider(height: 1, color: cs.outline.withOpacity(0.2)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Skeleton for storage bar visualization
class StorageBarSkeleton extends StatelessWidget {
  const StorageBarSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const ShimmerPlaceholder(
                  width: 100,
                  height: 16,
                  borderRadius: BorderRadius.all(Radius.circular(4)),
                ),
                ShimmerPlaceholder(
                  width: 60,
                  height: 14,
                  borderRadius: BorderRadius.circular(3),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            ShimmerPlaceholder(
              height: 8,
              borderRadius: BorderRadius.circular(4),
            ),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: List.generate(
                3,
                (index) => Padding(
                  padding: EdgeInsets.only(right: index < 2 ? AppSpacing.lg : 0),
                  child: Row(
                    children: [
                      ShimmerPlaceholder(
                        width: 12,
                        height: 12,
                        borderRadius: BorderRadius.circular(3),
                      ),
                      const SizedBox(width: 6),
                      ShimmerPlaceholder(
                        width: 50,
                        height: 12,
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Skeleton for account info header with avatar
class AccountHeaderSkeleton extends StatelessWidget {
  const AccountHeaderSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Row(
          children: [
            // Avatar skeleton
            ShimmerPlaceholder(
              width: 64,
              height: 64,
              borderRadius: BorderRadius.circular(32),
            ),
            const SizedBox(width: AppSpacing.md),
            // Info skeleton
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ShimmerPlaceholder(
                    width: 140,
                    height: 18,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  const SizedBox(height: 8),
                  ShimmerPlaceholder(
                    width: 180,
                    height: 14,
                    borderRadius: BorderRadius.circular(3),
                  ),
                  const SizedBox(height: 4),
                  ShimmerPlaceholder(
                    width: 100,
                    height: 12,
                    borderRadius: BorderRadius.circular(3),
                  ),
                ],
              ),
            ),
            // Action button skeleton
            ShimmerPlaceholder(
              width: 32,
              height: 32,
              borderRadius: BorderRadius.circular(16),
            ),
          ],
        ),
      ),
    );
  }
}

/// Skeleton for security score card
class SecurityScoreSkeleton extends StatelessWidget {
  const SecurityScoreSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const ShimmerPlaceholder(
                  width: 120,
                  height: 16,
                  borderRadius: BorderRadius.all(Radius.circular(4)),
                ),
                ShimmerPlaceholder(
                  width: 48,
                  height: 24,
                  borderRadius: BorderRadius.circular(12),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            // Score circle skeleton
            Center(
              child: ShimmerPlaceholder(
                width: 80,
                height: 80,
                borderRadius: BorderRadius.circular(40),
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            // Recommendations skeleton
            ...List.generate(
              2,
              (index) => Padding(
                padding: EdgeInsets.only(bottom: index == 0 ? 8 : 0),
                child: Row(
                  children: [
                    ShimmerPlaceholder(
                      width: 16,
                      height: 16,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ShimmerPlaceholder(
                        height: 14,
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Skeleton for toggle list (notifications, privacy settings)
class ToggleListSkeleton extends StatelessWidget {
  final int itemCount;

  const ToggleListSkeleton({
    super.key,
    this.itemCount = 4,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Card(
      child: Column(
        children: List.generate(
          itemCount,
          (index) => Column(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md,
                  vertical: AppSpacing.sm + 4,
                ),
                child: Row(
                  children: [
                    ShimmerPlaceholder(
                      width: 20,
                      height: 20,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ShimmerPlaceholder(
                            width: 120 + (index * 20.0),
                            height: 14,
                            borderRadius: BorderRadius.circular(3),
                          ),
                          const SizedBox(height: 4),
                          ShimmerPlaceholder(
                            width: 180,
                            height: 12,
                            borderRadius: BorderRadius.circular(3),
                          ),
                        ],
                      ),
                    ),
                    ShimmerPlaceholder(
                      width: 44,
                      height: 24,
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ],
                ),
              ),
              if (index < itemCount - 1)
                Divider(
                  height: 1,
                  indent: AppSpacing.md + 20 + AppSpacing.md,
                  color: cs.outline.withOpacity(0.2),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Skeleton for session/device list
class SessionListSkeleton extends StatelessWidget {
  final int itemCount;

  const SessionListSkeleton({
    super.key,
    this.itemCount = 3,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(
        itemCount,
        (index) => Padding(
          padding: EdgeInsets.only(bottom: index < itemCount - 1 ? AppSpacing.sm : 0),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Row(
                children: [
                  ShimmerPlaceholder(
                    width: 40,
                    height: 40,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ShimmerPlaceholder(
                          width: 140,
                          height: 14,
                          borderRadius: BorderRadius.circular(3),
                        ),
                        const SizedBox(height: 4),
                        ShimmerPlaceholder(
                          width: 200,
                          height: 12,
                          borderRadius: BorderRadius.circular(3),
                        ),
                        const SizedBox(height: 4),
                        ShimmerPlaceholder(
                          width: 100,
                          height: 12,
                          borderRadius: BorderRadius.circular(3),
                        ),
                      ],
                    ),
                  ),
                  ShimmerPlaceholder(
                    width: 24,
                    height: 24,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
