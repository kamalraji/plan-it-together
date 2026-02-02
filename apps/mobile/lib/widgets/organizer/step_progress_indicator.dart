import 'package:flutter/material.dart';
import 'package:thittam1hub/theme.dart';

/// Step metadata for the progress indicator
class StepInfo {
  final String title;
  final IconData icon;

  const StepInfo({required this.title, required this.icon});
}

/// Horizontal step progress indicator for multi-step forms
class StepProgressIndicator extends StatelessWidget {
  final List<StepInfo> steps;
  final int currentStep;
  final ValueChanged<int>? onStepTapped;

  const StepProgressIndicator({
    super.key,
    required this.steps,
    required this.currentStep,
    this.onStepTapped,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      child: Row(
        children: List.generate(steps.length * 2 - 1, (index) {
          // Connector lines at odd indices
          if (index.isOdd) {
            final stepIndex = index ~/ 2;
            final isCompleted = stepIndex < currentStep;
            return Expanded(
              child: Container(
                height: 2,
                margin: const EdgeInsets.symmetric(horizontal: AppSpacing.xs),
                decoration: BoxDecoration(
                  color: isCompleted
                      ? cs.primary
                      : cs.outline.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(1),
                ),
              ),
            );
          }

          // Step circles at even indices
          final stepIndex = index ~/ 2;
          final step = steps[stepIndex];
          final isCompleted = stepIndex < currentStep;
          final isCurrent = stepIndex == currentStep;
          final isAccessible = stepIndex <= currentStep;

          return GestureDetector(
            onTap: isAccessible && onStepTapped != null
                ? () => onStepTapped!(stepIndex)
                : null,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeOutCubic,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Step circle
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    width: isCurrent ? 40 : 32,
                    height: isCurrent ? 40 : 32,
                    decoration: BoxDecoration(
                      color: isCompleted
                          ? cs.primary
                          : isCurrent
                              ? cs.primary.withOpacity(0.1)
                              : cs.surfaceContainerHighest,
                      shape: BoxShape.circle,
                      border: isCurrent
                          ? Border.all(color: cs.primary, width: 2)
                          : null,
                      boxShadow: isCurrent
                          ? [
                              BoxShadow(
                                color: cs.primary.withOpacity(0.2),
                                blurRadius: 8,
                                spreadRadius: 0,
                              ),
                            ]
                          : null,
                    ),
                    child: Center(
                      child: isCompleted
                          ? Icon(
                              Icons.check,
                              size: 16,
                              color: cs.onPrimary,
                            )
                          : Icon(
                              step.icon,
                              size: isCurrent ? 18 : 14,
                              color: isCurrent
                                  ? cs.primary
                                  : cs.onSurfaceVariant.withOpacity(0.6),
                            ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  // Step label
                  AnimatedDefaultTextStyle(
                    duration: const Duration(milliseconds: 200),
                    style: context.textStyles.labelSmall!.copyWith(
                      color: isCurrent
                          ? cs.primary
                          : isCompleted
                              ? cs.onSurface
                              : cs.onSurfaceVariant.withOpacity(0.6),
                      fontWeight: isCurrent ? FontWeight.w600 : FontWeight.w500,
                    ),
                    child: Text(step.title),
                  ),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }
}

/// Compact step indicator for smaller spaces
class CompactStepIndicator extends StatelessWidget {
  final int totalSteps;
  final int currentStep;

  const CompactStepIndicator({
    super.key,
    required this.totalSteps,
    required this.currentStep,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(totalSteps, (index) {
        final isCompleted = index < currentStep;
        final isCurrent = index == currentStep;

        return Container(
          width: isCurrent ? 20 : 8,
          height: 8,
          margin: EdgeInsets.only(right: index < totalSteps - 1 ? 6 : 0),
          decoration: BoxDecoration(
            color: isCompleted || isCurrent
                ? cs.primary
                : cs.outline.withOpacity(0.3),
            borderRadius: BorderRadius.circular(4),
          ),
        );
      }),
    );
  }
}
