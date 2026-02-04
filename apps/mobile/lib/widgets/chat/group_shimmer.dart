import 'package:flutter/material.dart';
import '../shimmer_loading.dart';
import '../../theme.dart';

/// Premium shimmer skeleton for group settings page with parallax header
class GroupSettingsShimmer extends StatelessWidget {
  const GroupSettingsShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final size = MediaQuery.of(context).size;

    return CustomScrollView(
      slivers: [
        // Parallax header shimmer
        SliverAppBar(
          expandedHeight: 280,
          pinned: true,
          stretch: true,
          backgroundColor: cs.surface,
          flexibleSpace: FlexibleSpaceBar(
            background: Stack(
              fit: StackFit.expand,
              children: [
                // Blurred background shimmer
                ShimmerLoading(
                  child: Container(
                    color: cs.surfaceContainerHighest,
                  ),
                ),
                // Gradient overlay
                Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        cs.surface.withOpacity(0.8),
                        cs.surface,
                      ],
                    ),
                  ),
                ),
                // Header content
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: AppSpacing.xl,
                  child: Column(
                    children: [
                      // Icon shimmer
                      const ShimmerPlaceholder(
                        width: 100,
                        height: 100,
                        borderRadius: 28,
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      // Name shimmer
                      const ShimmerPlaceholder(
                        width: 180,
                        height: 28,
                        borderRadius: AppRadius.md,
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      // Description shimmer
                      const ShimmerPlaceholder(
                        width: 240,
                        height: 16,
                        borderRadius: AppRadius.sm,
                      ),
                      const SizedBox(height: AppSpacing.md),
                      // Member badge shimmer
                      const ShimmerPlaceholder(
                        width: 100,
                        height: 32,
                        borderRadius: AppRadius.lg,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),

        // Stats row shimmer
        SliverToBoxAdapter(
          child: Container(
            margin: EdgeInsets.symmetric(
              horizontal: context.horizontalPadding,
              vertical: AppSpacing.md,
            ),
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: cs.surfaceContainerLow,
              borderRadius: BorderRadius.circular(AppRadius.lg),
              border: Border.all(color: cs.outline.withOpacity(0.1)),
            ),
            child: Row(
              children: [
                Expanded(child: _AnimatedStatShimmer()),
                _buildDivider(cs),
                Expanded(child: _AnimatedStatShimmer()),
                _buildDivider(cs),
                Expanded(child: _AnimatedStatShimmer()),
              ],
            ),
          ),
        ),

        // Settings sections shimmer
        SliverPadding(
          padding: EdgeInsets.symmetric(horizontal: context.horizontalPadding),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) => Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.md),
                child: _SettingsSectionShimmer(
                  itemCount: index == 0 ? 3 : 2,
                ),
              ),
              childCount: 4,
            ),
          ),
        ),

        // Bottom padding
        const SliverToBoxAdapter(
          child: SizedBox(height: 100),
        ),
      ],
    );
  }

  Widget _buildDivider(ColorScheme cs) {
    return Container(
      width: 1,
      height: 40,
      color: cs.outline.withOpacity(0.1),
    );
  }
}

class _AnimatedStatShimmer extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: const [
        ShimmerPlaceholder(width: 24, height: 24, isCircle: true),
        SizedBox(height: 8),
        ShimmerPlaceholder(width: 48, height: 24, borderRadius: AppRadius.sm),
        SizedBox(height: 4),
        ShimmerPlaceholder(width: 56, height: 12, borderRadius: AppRadius.xs),
      ],
    );
  }
}

class _SettingsSectionShimmer extends StatelessWidget {
  final int itemCount;

  const _SettingsSectionShimmer({this.itemCount = 2});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      decoration: BoxDecoration(
        color: cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: cs.outline.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section header
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Row(
              children: const [
                ShimmerPlaceholder(width: 24, height: 24, isCircle: true),
                SizedBox(width: AppSpacing.sm),
                ShimmerPlaceholder(width: 120, height: 16, borderRadius: AppRadius.sm),
              ],
            ),
          ),
          // Section items
          for (int i = 0; i < itemCount; i++)
            _SettingsItemShimmer(showDivider: i < itemCount - 1),
          const SizedBox(height: AppSpacing.sm),
        ],
      ),
    );
  }
}

class _SettingsItemShimmer extends StatelessWidget {
  final bool showDivider;

  const _SettingsItemShimmer({this.showDivider = true});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.sm,
          ),
          child: Row(
            children: const [
              ShimmerPlaceholder(width: 20, height: 20, isCircle: true),
              SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ShimmerPlaceholder(
                      width: double.infinity,
                      height: 14,
                      borderRadius: AppRadius.sm,
                    ),
                    SizedBox(height: 4),
                    ShimmerPlaceholder(
                      width: 150,
                      height: 12,
                      borderRadius: AppRadius.xs,
                    ),
                  ],
                ),
              ),
              SizedBox(width: AppSpacing.md),
              ShimmerPlaceholder(width: 44, height: 24, borderRadius: 12),
            ],
          ),
        ),
        if (showDivider)
          Divider(
            height: 1,
            indent: AppSpacing.md + 20 + AppSpacing.md,
            color: cs.outline.withOpacity(0.1),
          ),
      ],
    );
  }
}

/// Shimmer for create group wizard with step indicators
class CreateGroupWizardShimmer extends StatelessWidget {
  final int currentStep;

  const CreateGroupWizardShimmer({super.key, this.currentStep = 0});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Column(
      children: [
        // Progress indicator shimmer
        Padding(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.lg),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(3, (i) {
              final isActive = i <= currentStep;
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  width: isActive ? 24 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: isActive
                        ? cs.primary.withOpacity(0.3)
                        : cs.outline.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              );
            }),
          ),
        ),

        // Step content shimmer
        Expanded(
          child: SingleChildScrollView(
            padding: EdgeInsets.all(context.horizontalPadding),
            child: _buildStepContent(context, currentStep),
          ),
        ),

        // Bottom bar shimmer
        _BottomBarShimmer(currentStep: currentStep),
      ],
    );
  }

  Widget _buildStepContent(BuildContext context, int step) {
    switch (step) {
      case 0:
        return const _Step1Shimmer();
      case 1:
        return const _Step2Shimmer();
      case 2:
        return const _Step3Shimmer();
      default:
        return const _Step1Shimmer();
    }
  }
}

class _Step1Shimmer extends StatelessWidget {
  const _Step1Shimmer();

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Column(
      children: [
        const SizedBox(height: AppSpacing.xl),
        // Icon picker shimmer
        Container(
          width: 120,
          height: 120,
          decoration: BoxDecoration(
            color: cs.surfaceContainerLow,
            borderRadius: BorderRadius.circular(32),
            border: Border.all(color: cs.outline.withOpacity(0.1)),
          ),
          child: const Center(
            child: ShimmerPlaceholder(
              width: 48,
              height: 48,
              isCircle: true,
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        const ShimmerPlaceholder(
          width: 100,
          height: 14,
          borderRadius: AppRadius.sm,
        ),
        const SizedBox(height: AppSpacing.xl * 2),

        // Name field shimmer
        _FormFieldShimmer(
          label: true,
        ),
        const SizedBox(height: AppSpacing.lg),

        // Description field shimmer
        _FormFieldShimmer(
          label: true,
          height: 100,
        ),
      ],
    );
  }
}

class _Step2Shimmer extends StatelessWidget {
  const _Step2Shimmer();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: AppSpacing.lg),
        // Section title
        const ShimmerPlaceholder(
          width: 140,
          height: 20,
          borderRadius: AppRadius.sm,
        ),
        const SizedBox(height: AppSpacing.md),

        // Radio cards shimmer
        for (int i = 0; i < 3; i++) ...[
          const _RadioCardShimmer(),
          const SizedBox(height: AppSpacing.md),
        ],

        const SizedBox(height: AppSpacing.xl),

        // Permissions section
        const ShimmerPlaceholder(
          width: 160,
          height: 20,
          borderRadius: AppRadius.sm,
        ),
        const SizedBox(height: AppSpacing.md),

        // Toggle items
        for (int i = 0; i < 2; i++) ...[
          const _ToggleItemShimmer(),
          const SizedBox(height: AppSpacing.md),
        ],
      ],
    );
  }
}

class _Step3Shimmer extends StatelessWidget {
  const _Step3Shimmer();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Search bar shimmer
        const ShimmerPlaceholder(
          width: double.infinity,
          height: 48,
          borderRadius: AppRadius.lg,
        ),
        const SizedBox(height: AppSpacing.lg),

        // Selected chips shimmer
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: List.generate(3, (i) => const _SelectionChipShimmer()),
        ),
        const SizedBox(height: AppSpacing.lg),

        // Section header
        const ShimmerPlaceholder(
          width: 120,
          height: 16,
          borderRadius: AppRadius.sm,
        ),
        const SizedBox(height: AppSpacing.md),

        // Member list shimmer
        for (int i = 0; i < 6; i++) ...[
          const _MemberRowShimmer(),
          const SizedBox(height: AppSpacing.sm),
        ],
      ],
    );
  }
}

class _FormFieldShimmer extends StatelessWidget {
  final bool label;
  final double height;

  const _FormFieldShimmer({
    this.label = false,
    this.height = 52,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label) ...[
          const ShimmerPlaceholder(
            width: 80,
            height: 14,
            borderRadius: AppRadius.xs,
          ),
          const SizedBox(height: AppSpacing.sm),
        ],
        Container(
          height: height,
          decoration: BoxDecoration(
            color: cs.surfaceContainerLow,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(color: cs.outline.withOpacity(0.1)),
          ),
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Row(
            children: const [
              ShimmerPlaceholder(width: 20, height: 20, isCircle: true),
              SizedBox(width: AppSpacing.md),
              ShimmerPlaceholder(width: 120, height: 14, borderRadius: AppRadius.sm),
            ],
          ),
        ),
      ],
    );
  }
}

class _RadioCardShimmer extends StatelessWidget {
  const _RadioCardShimmer();

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: cs.outline.withOpacity(0.1)),
      ),
      child: Row(
        children: [
          const ShimmerPlaceholder(width: 40, height: 40, isCircle: true),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                ShimmerPlaceholder(
                  width: 100,
                  height: 16,
                  borderRadius: AppRadius.sm,
                ),
                SizedBox(height: 4),
                ShimmerPlaceholder(
                  width: 180,
                  height: 12,
                  borderRadius: AppRadius.xs,
                ),
              ],
            ),
          ),
          const ShimmerPlaceholder(width: 20, height: 20, isCircle: true),
        ],
      ),
    );
  }
}

class _ToggleItemShimmer extends StatelessWidget {
  const _ToggleItemShimmer();

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: cs.outline.withOpacity(0.1)),
      ),
      child: Row(
        children: const [
          ShimmerPlaceholder(width: 24, height: 24, isCircle: true),
          SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ShimmerPlaceholder(
                  width: 140,
                  height: 14,
                  borderRadius: AppRadius.sm,
                ),
                SizedBox(height: 4),
                ShimmerPlaceholder(
                  width: 200,
                  height: 12,
                  borderRadius: AppRadius.xs,
                ),
              ],
            ),
          ),
          SizedBox(width: AppSpacing.md),
          ShimmerPlaceholder(width: 44, height: 24, borderRadius: 12),
        ],
      ),
    );
  }
}

class _SelectionChipShimmer extends StatelessWidget {
  const _SelectionChipShimmer();

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: 6,
      ),
      decoration: BoxDecoration(
        color: cs.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: const [
          ShimmerPlaceholder(width: 24, height: 24, isCircle: true),
          SizedBox(width: 6),
          ShimmerPlaceholder(width: 60, height: 12, borderRadius: AppRadius.xs),
          SizedBox(width: 6),
          ShimmerPlaceholder(width: 16, height: 16, isCircle: true),
        ],
      ),
    );
  }
}

class _BottomBarShimmer extends StatelessWidget {
  final int currentStep;

  const _BottomBarShimmer({required this.currentStep});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      padding: EdgeInsets.all(context.horizontalPadding),
      decoration: BoxDecoration(
        color: cs.surface,
        border: Border(
          top: BorderSide(color: cs.outline.withOpacity(0.1)),
        ),
      ),
      child: SafeArea(
        child: Row(
          children: [
            if (currentStep > 0) ...[
              const ShimmerPlaceholder(
                width: 100,
                height: 48,
                borderRadius: AppRadius.lg,
              ),
              const SizedBox(width: AppSpacing.md),
            ],
            const Expanded(
              child: ShimmerPlaceholder(
                width: double.infinity,
                height: 48,
                borderRadius: AppRadius.lg,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Shimmer for add members page
class AddMembersShimmer extends StatelessWidget {
  const AddMembersShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Search bar shimmer
        Padding(
          padding: EdgeInsets.all(context.horizontalPadding),
          child: const ShimmerPlaceholder(
            width: double.infinity,
            height: 48,
            borderRadius: AppRadius.lg,
          ),
        ),

        // Selected members preview
        Padding(
          padding: EdgeInsets.symmetric(horizontal: context.horizontalPadding),
          child: SizedBox(
            height: 80,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: 4,
              separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.md),
              itemBuilder: (context, index) => const _SelectedMemberShimmer(),
            ),
          ),
        ),

        const SizedBox(height: AppSpacing.md),

        // Section header
        Padding(
          padding: EdgeInsets.symmetric(horizontal: context.horizontalPadding),
          child: Row(
            children: const [
              ShimmerPlaceholder(
                width: 120,
                height: 14,
                borderRadius: AppRadius.sm,
              ),
              Spacer(),
              ShimmerPlaceholder(
                width: 40,
                height: 14,
                borderRadius: AppRadius.sm,
              ),
            ],
          ),
        ),

        const SizedBox(height: AppSpacing.md),

        // Member list
        Expanded(
          child: ListView.builder(
            padding: EdgeInsets.symmetric(horizontal: context.horizontalPadding),
            itemCount: 10,
            itemBuilder: (context, index) => const Padding(
              padding: EdgeInsets.only(bottom: AppSpacing.sm),
              child: _MemberRowShimmer(showCheckbox: true),
            ),
          ),
        ),

        // Bottom button
        Container(
          padding: EdgeInsets.all(context.horizontalPadding),
          child: const ShimmerPlaceholder(
            width: double.infinity,
            height: 52,
            borderRadius: AppRadius.lg,
          ),
        ),
      ],
    );
  }
}

class _SelectedMemberShimmer extends StatelessWidget {
  const _SelectedMemberShimmer();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Stack(
          children: [
            const ShimmerPlaceholder(width: 56, height: 56, isCircle: true),
            Positioned(
              right: 0,
              top: 0,
              child: Container(
                width: 18,
                height: 18,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  shape: BoxShape.circle,
                ),
                child: const ShimmerPlaceholder(
                  width: 14,
                  height: 14,
                  isCircle: true,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        const ShimmerPlaceholder(
          width: 48,
          height: 12,
          borderRadius: AppRadius.xs,
        ),
      ],
    );
  }
}

class _MemberRowShimmer extends StatelessWidget {
  final bool showCheckbox;

  const _MemberRowShimmer({this.showCheckbox = false});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.sm),
      decoration: BoxDecoration(
        color: cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Row(
        children: [
          // Avatar with online indicator
          Stack(
            children: [
              const ShimmerPlaceholder(width: 48, height: 48, isCircle: true),
              Positioned(
                right: 2,
                bottom: 2,
                child: Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: cs.surface,
                    shape: BoxShape.circle,
                  ),
                  child: const ShimmerPlaceholder(
                    width: 8,
                    height: 8,
                    isCircle: true,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                ShimmerPlaceholder(
                  width: 140,
                  height: 16,
                  borderRadius: AppRadius.sm,
                ),
                SizedBox(height: 4),
                ShimmerPlaceholder(
                  width: 100,
                  height: 12,
                  borderRadius: AppRadius.xs,
                ),
              ],
            ),
          ),
          if (showCheckbox)
            const ShimmerPlaceholder(width: 24, height: 24, borderRadius: 6),
        ],
      ),
    );
  }
}

/// Shimmer for member list in group settings
class MemberListShimmer extends StatelessWidget {
  final int count;

  const MemberListShimmer({super.key, this.count = 5});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(
        count,
        (index) => Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.sm,
          ),
          child: const _MemberRowShimmer(),
        ),
      ),
    );
  }
}
