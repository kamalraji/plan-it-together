import 'package:flutter/material.dart';
import 'package:thittam1hub/theme.dart';

/// Pill badge for mode (In-Person, Online, Hybrid)
class EventPillBadge extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  const EventPillBadge({super.key, required this.icon, required this.label, required this.color});
  
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(999),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.15),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 6),
        Text(
          label,
          style: Theme.of(context).textTheme.labelMedium?.copyWith(
            color: color,
            fontWeight: FontWeight.w700,
          ),
        ),
      ]),
    );
  }
}

/// Category badge with colored background
class EventCategoryBadge extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  const EventCategoryBadge({super.key, required this.icon, required this.label, required this.color});
  
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.9),
        borderRadius: BorderRadius.circular(999),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.3),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(children: [
        Icon(icon, size: 14, color: Colors.white),
        const SizedBox(width: 6),
        Text(
          label,
          style: Theme.of(context).textTheme.labelMedium?.copyWith(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
      ]),
    );
  }
}

/// Live badge for ongoing events
class EventLiveBadge extends StatelessWidget {
  const EventLiveBadge({super.key});
  
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.error.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(children: [
        Container(
          width: 8,
          height: 8,
          decoration: const BoxDecoration(color: AppColors.error, shape: BoxShape.circle),
        ),
        const SizedBox(width: 6),
        Text(
          'LIVE NOW',
          style: Theme.of(context).textTheme.labelMedium?.copyWith(
            color: AppColors.error,
            fontWeight: FontWeight.w800,
          ),
        ),
      ]),
    );
  }
}

/// Info chip for date/time/capacity
class EventInfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const EventInfoChip({super.key, required this.icon, required this.label});
  
  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: cs.outline.withValues(alpha: 0.3)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 16, color: cs.primary),
        const SizedBox(width: 6),
        Text(
          label,
          style: text.labelMedium?.copyWith(
            color: cs.onSurface,
            fontWeight: FontWeight.w500,
          ),
        ),
      ]),
    );
  }
}

/// Small status chip
class EventStatusChip extends StatelessWidget {
  final String label;
  final Color color;
  const EventStatusChip({super.key, required this.label, required this.color});
  
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: color,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
