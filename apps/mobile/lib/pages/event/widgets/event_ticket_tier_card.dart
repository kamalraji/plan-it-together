import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/theme.dart';
import 'event_badges.dart';

/// Ticket tier card with capacity bar
class EventTicketTierCard extends StatelessWidget {
  final TicketTier tier;
  final bool isAvailable;
  final bool isRegistered;
  final VoidCallback onSelect;

  const EventTicketTierCard({
    super.key,
    required this.tier,
    required this.isAvailable,
    required this.isRegistered,
    required this.onSelect,
  });

  String _buildSemanticLabel() {
    final parts = [tier.name];
    parts.add(tier.price == 0 ? 'Free' : '₹${tier.price.toStringAsFixed(0)}');
    if (tier.quantity != null) {
      final remaining = tier.quantity! - tier.soldCount;
      parts.add('$remaining of ${tier.quantity} left');
    }
    if (!isAvailable) parts.add('unavailable');
    if (isRegistered) parts.add('already registered');
    return parts.join(', ');
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;
    final soldOut = tier.quantity != null && tier.soldCount >= tier.quantity!;
    final priceText = tier.price == 0 ? 'Free' : '₹${tier.price.toStringAsFixed(0)}';

    return Semantics(
      button: true,
      enabled: isAvailable && !isRegistered,
      label: _buildSemanticLabel(),
      child: Opacity(
      opacity: isAvailable ? 1 : 0.6,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(
            color: isAvailable ? cs.outline : cs.outline.withValues(alpha: 0.5),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Text(tier.name, style: text.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                    const SizedBox(width: 8),
                    if (soldOut)
                      const EventStatusChip(label: 'Sold out', color: AppColors.error)
                    else if (!isAvailable)
                      const EventStatusChip(label: 'Unavailable', color: AppColors.warning),
                  ]),
                  if ((tier.description ?? '').isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      tier.description!,
                      style: text.bodyMedium?.copyWith(color: AppColors.textMuted),
                    ),
                  ],
                ]),
              ),
              const SizedBox(width: 12),
              Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Text(
                  priceText,
                  style: text.titleLarge?.copyWith(
                    color: cs.primary,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                if (tier.price > 0)
                  Text(
                    'per ticket',
                    style: text.labelSmall?.copyWith(color: AppColors.textMuted),
                  ),
              ]),
            ]),
            if (tier.quantity != null) ...[
              const SizedBox(height: 12),
              _CapacityBar(total: tier.quantity!, sold: tier.soldCount),
            ],
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: isAvailable && !isRegistered ? () {
                  HapticFeedback.selectionClick();
                  onSelect();
                } : null,
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Icon(isRegistered ? Icons.check : Icons.confirmation_number, size: 18),
                  const SizedBox(width: 8),
                  Text(isRegistered ? 'Already Registered' : 'Select Ticket'),
                ]),
              ),
            ),
          ],
        ),
      ),
    ),
    );
  }
}

class _CapacityBar extends StatelessWidget {
  final int total;
  final int sold;
  const _CapacityBar({required this.total, required this.sold});
  
  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;
    final remaining = (total - sold).clamp(0, total);
    final pct = total == 0 ? 0.0 : sold / total;
    final isLow = pct > 0.8;

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      ClipRRect(
        borderRadius: BorderRadius.circular(6),
        child: SizedBox(
          height: 8,
          child: Stack(children: [
            Container(width: double.infinity, color: cs.surfaceContainerHighest),
            FractionallySizedBox(
              widthFactor: pct.clamp(0.0, 1.0),
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isLow
                        ? [AppColors.warning, AppColors.error]
                        : [cs.primary.withValues(alpha: 0.6), cs.primary],
                  ),
                ),
              ),
            ),
          ]),
        ),
      ),
      const SizedBox(height: 6),
      Row(children: [
        if (isLow)
          Icon(Icons.local_fire_department, size: 14, color: AppColors.warning),
        if (isLow) const SizedBox(width: 4),
        Text(
          '$remaining of $total left',
          style: text.labelSmall?.copyWith(
            color: isLow ? AppColors.warning : AppColors.textMuted,
            fontWeight: isLow ? FontWeight.w700 : FontWeight.normal,
          ),
        ),
      ]),
    ]);
  }
}
