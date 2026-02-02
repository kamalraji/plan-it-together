import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/user_ticket.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/ticket/add_to_calendar_button.dart';

/// Quick action bar for ticket cards
class TicketQuickActions extends StatelessWidget {
  final UserTicket ticket;
  final VoidCallback? onDownload;
  final VoidCallback? onShare;
  final bool isDownloading;

  const TicketQuickActions({
    super.key,
    required this.ticket,
    this.onDownload,
    this.onShare,
    this.isDownloading = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Calendar
          _QuickActionButton(
            icon: Icons.calendar_month_outlined,
            label: 'Calendar',
            onTap: () {
              HapticFeedback.lightImpact();
              AddToCalendarButton.showCalendarOptions(context, ticket);
            },
          ),
          _buildDivider(cs),
          // Download
          _QuickActionButton(
            icon: isDownloading ? null : Icons.download_outlined,
            label: 'Save',
            isLoading: isDownloading,
            onTap: isDownloading ? null : () {
              HapticFeedback.lightImpact();
              onDownload?.call();
            },
          ),
          _buildDivider(cs),
          // Share
          _QuickActionButton(
            icon: Icons.share_outlined,
            label: 'Share',
            onTap: () {
              HapticFeedback.lightImpact();
              onShare?.call();
            },
          ),
        ],
      ),
    );
  }

  Widget _buildDivider(ColorScheme cs) {
    return Container(
      width: 1,
      height: 24,
      margin: const EdgeInsets.symmetric(horizontal: AppSpacing.xs),
      color: cs.outlineVariant.withValues(alpha: 0.3),
    );
  }
}

class _QuickActionButton extends StatelessWidget {
  final IconData? icon;
  final String label;
  final VoidCallback? onTap;
  final bool isLoading;

  const _QuickActionButton({
    this.icon,
    required this.label,
    this.onTap,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.sm),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isLoading)
              SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: cs.primary,
                ),
              )
            else
              Icon(icon, size: 20, color: cs.onSurfaceVariant),
            const SizedBox(height: 2),
            Text(
              label,
              style: context.textStyles.labelSmall?.copyWith(
                color: cs.onSurfaceVariant,
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
