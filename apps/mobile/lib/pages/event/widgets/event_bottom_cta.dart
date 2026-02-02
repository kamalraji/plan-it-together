import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/theme.dart';

/// Sticky bottom CTA for event registration
class EventBottomCTA extends StatelessWidget {
  final String priceLabel;
  final bool isRegistered;
  final EventStatus status;
  final bool hasTickets;
  final VoidCallback onRegister;
  final VoidCallback onViewTicket;
  final VoidCallback onJoinLive;

  const EventBottomCTA({
    super.key,
    required this.priceLabel,
    required this.isRegistered,
    required this.status,
    required this.hasTickets,
    required this.onRegister,
    required this.onViewTicket,
    required this.onJoinLive,
  });

  String _buildSemanticLabel() {
    final price = priceLabel.isEmpty ? 'Free' : priceLabel;
    if (isRegistered) return 'Price: $price. Registered. Tap to view ticket.';
    if (!hasTickets) return 'Price: $price. Registration coming soon.';
    if (status == EventStatus.COMPLETED) return 'Price: $price. Event has ended.';
    if (status == EventStatus.ONGOING) return 'Price: $price. Event is live. Tap to join.';
    return 'Price: $price. Tap to register.';
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;

    return Semantics(
      label: _buildSemanticLabel(),
      child: Container(
      padding: EdgeInsets.fromLTRB(16, 12, 16, MediaQuery.of(context).padding.bottom + 12),
      decoration: BoxDecoration(
        color: cs.surface,
        border: Border(top: BorderSide(color: cs.outline)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -4),
          ),
        ],
      ),
        child: Row(children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Price',
                  style: text.labelSmall?.copyWith(color: AppColors.textMuted),
                ),
                Text(
                  priceLabel.isEmpty ? '—' : priceLabel,
                  style: text.titleMedium?.copyWith(fontWeight: FontWeight.w800),
                ),
              ],
            ),
          ),
          _buildButton(context),
        ]),
      ),
    );
  }

  Widget _buildButton(BuildContext context) {
    if (isRegistered) {
      return FilledButton(
        onPressed: onViewTicket,
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.success,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        ),
        child: const Row(children: [
          Icon(Icons.confirmation_number, color: Colors.white),
          SizedBox(width: 8),
          Text('View Ticket'),
        ]),
      );
    }

    if (!hasTickets) {
      return FilledButton(
        onPressed: onRegister,
        style: FilledButton.styleFrom(
          backgroundColor: Colors.grey.shade600,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        ),
        child: const Row(children: [
          Icon(Icons.schedule, color: Colors.white),
          SizedBox(width: 8),
          Text('Coming Soon'),
        ]),
      );
    }

    switch (status) {
      case EventStatus.COMPLETED:
        return FilledButton(
          onPressed: null,
          style: FilledButton.styleFrom(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          ),
          child: const Row(children: [
            Icon(Icons.event_busy, color: Colors.white),
            SizedBox(width: 8),
            Text('Event Ended'),
          ]),
        );
      case EventStatus.ONGOING:
        return FilledButton(
          onPressed: onJoinLive,
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.error,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          ),
          child: const Row(children: [
            Icon(Icons.play_circle, color: Colors.white),
            SizedBox(width: 8),
            Text('Join Live'),
          ]),
        );
      default:
        return FilledButton(
          onPressed: onRegister,
          style: FilledButton.styleFrom(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          ),
          child: const Row(children: [
            Icon(Icons.confirmation_number, color: Colors.white),
            SizedBox(width: 8),
            Text('Register Now'),
          ]),
        );
    }
  }
}
