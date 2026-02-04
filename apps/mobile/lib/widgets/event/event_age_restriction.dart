import 'package:flutter/material.dart';
import 'package:thittam1hub/theme.dart';

/// Displays age restriction information for an event
class EventAgeRestriction extends StatelessWidget {
  final int? minAge;
  final int? maxAge;

  const EventAgeRestriction({
    super.key,
    this.minAge,
    this.maxAge,
  });

  bool get hasRestriction => minAge != null || maxAge != null;

  @override
  Widget build(BuildContext context) {
    if (!hasRestriction) return const SizedBox.shrink();

    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: cs.outline),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.person_outline, size: 16, color: AppColors.textMuted),
          const SizedBox(width: 6),
          Text(
            _formatAgeRange(),
            style: text.labelLarge,
          ),
        ],
      ),
    );
  }

  String _formatAgeRange() {
    if (minAge != null && maxAge != null) {
      return 'Ages $minAge-$maxAge';
    } else if (minAge != null) {
      return '$minAge+ only';
    } else if (maxAge != null) {
      return 'Under $maxAge only';
    }
    return '';
  }
}

/// A more detailed age restriction card with explanation
class EventAgeRestrictionCard extends StatelessWidget {
  final int? minAge;
  final int? maxAge;

  const EventAgeRestrictionCard({
    super.key,
    this.minAge,
    this.maxAge,
  });

  bool get hasRestriction => minAge != null || maxAge != null;

  @override
  Widget build(BuildContext context) {
    if (!hasRestriction) return const SizedBox.shrink();

    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.warning.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.warning.withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.warning.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.badge_outlined,
              color: AppColors.warning,
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Age Restriction',
                  style: text.labelMedium?.copyWith(
                    color: AppColors.warning,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _formatDescription(),
                  style: text.bodySmall?.copyWith(color: AppColors.textMuted),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.warning.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              _formatAgeRange(),
              style: text.labelLarge?.copyWith(
                color: AppColors.warning,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatAgeRange() {
    if (minAge != null && maxAge != null) {
      return '$minAge-$maxAge';
    } else if (minAge != null) {
      return '$minAge+';
    } else if (maxAge != null) {
      return '<$maxAge';
    }
    return '';
  }

  String _formatDescription() {
    if (minAge != null && maxAge != null) {
      return 'This event is for ages $minAge to $maxAge years old';
    } else if (minAge != null) {
      return 'This event is restricted to ages $minAge and above';
    } else if (maxAge != null) {
      return 'This event is for attendees under $maxAge years old';
    }
    return '';
  }
}
