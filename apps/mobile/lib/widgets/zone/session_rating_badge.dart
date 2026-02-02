import 'package:flutter/material.dart';
import 'package:thittam1hub/models/session_feedback.dart';

/// Compact badge showing session rating with stars
class SessionRatingBadge extends StatelessWidget {
  final SessionRatingAggregate? aggregate;
  final double size;
  final bool showCount;

  const SessionRatingBadge({
    super.key,
    this.aggregate,
    this.size = 14,
    this.showCount = true,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    if (aggregate == null || !aggregate!.hasRatings) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.amber.withOpacity(0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.amber.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.star_rounded, size: size, color: Colors.amber),
          const SizedBox(width: 4),
          Text(
            aggregate!.averageRating.toStringAsFixed(1),
            style: TextStyle(
              fontSize: size - 2,
              fontWeight: FontWeight.bold,
              color: cs.onSurface,
            ),
          ),
          if (showCount) ...[
            const SizedBox(width: 4),
            Text(
              '(${aggregate!.totalRatings})',
              style: TextStyle(
                fontSize: size - 4,
                color: cs.onSurfaceVariant,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Larger rating display with distribution bar
class SessionRatingDisplay extends StatelessWidget {
  final SessionRatingAggregate aggregate;

  const SessionRatingDisplay({
    super.key,
    required this.aggregate,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          // Average rating
          Column(
            children: [
              Text(
                aggregate.averageRating.toStringAsFixed(1),
                style: textTheme.headlineLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: cs.onSurface,
                ),
              ),
              Row(
                children: List.generate(5, (index) {
                  final starValue = index + 1;
                  final filled = aggregate.averageRating >= starValue;
                  final half = aggregate.averageRating >= starValue - 0.5 &&
                      aggregate.averageRating < starValue;
                  return Icon(
                    filled
                        ? Icons.star_rounded
                        : (half ? Icons.star_half_rounded : Icons.star_outline_rounded),
                    size: 16,
                    color: Colors.amber,
                  );
                }),
              ),
              const SizedBox(height: 4),
              Text(
                '${aggregate.totalRatings} ratings',
                style: textTheme.bodySmall?.copyWith(
                  color: cs.onSurfaceVariant,
                ),
              ),
            ],
          ),
          const SizedBox(width: 24),
          // Distribution bars
          Expanded(
            child: Column(
              children: [5, 4, 3, 2, 1].map((star) {
                final count = aggregate.ratingDistribution[star] ?? 0;
                final percentage = aggregate.totalRatings > 0
                    ? count / aggregate.totalRatings
                    : 0.0;
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Row(
                    children: [
                      Text(
                        '$star',
                        style: textTheme.bodySmall?.copyWith(
                          color: cs.onSurfaceVariant,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: percentage,
                            backgroundColor: cs.outlineVariant.withOpacity(0.3),
                            valueColor: const AlwaysStoppedAnimation(Colors.amber),
                            minHeight: 6,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(
                        width: 24,
                        child: Text(
                          '$count',
                          style: textTheme.bodySmall?.copyWith(
                            color: cs.onSurfaceVariant,
                          ),
                          textAlign: TextAlign.end,
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}
