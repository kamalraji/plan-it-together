import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/theme.dart';

/// Badge shown when user is already registered
class EventRegisteredBadge extends StatelessWidget {
  final VoidCallback onViewTicket;
  const EventRegisteredBadge({super.key, required this.onViewTicket});

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;

    return Semantics(
      button: true,
      label: "You're registered for this event. Tap to view your ticket.",
      child: GestureDetector(
        onTap: () {
          HapticFeedback.lightImpact();
          onViewTicket();
        },
        child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              AppColors.success.withValues(alpha: 0.15),
              AppColors.success.withValues(alpha: 0.05),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: AppColors.success.withValues(alpha: 0.3)),
        ),
        child: Row(children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.success.withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.check_circle, color: AppColors.success, size: 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(
                "You're registered!",
                style: text.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.success,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'Tap to view your ticket',
                style: text.bodySmall?.copyWith(
                  color: AppColors.success.withValues(alpha: 0.8),
                ),
              ),
            ]),
          ),
            const Icon(Icons.arrow_forward_ios, size: 16, color: AppColors.success),
          ]),
        ),
      ),
    );
  }
}
