import 'package:flutter/material.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/widgets/glassmorphism_bottom_sheet.dart';

/// Shows a glassmorphism event actions bottom sheet
void showEventActionsSheet(
  BuildContext context,
  Event event, {
  VoidCallback? onShare,
  VoidCallback? onAddToCalendar,
  VoidCallback? onSave,
  VoidCallback? onReport,
}) {
  showGlassBottomSheet(
    context: context,
    title: 'Event Actions',
    child: GlassActionList(
      actions: [
        GlassActionButton(
          icon: Icons.share_outlined,
          label: 'Share Event',
          onTap: () {
            Navigator.pop(context);
            onShare?.call();
          },
        ),
        GlassActionButton(
          icon: Icons.calendar_today_outlined,
          label: 'Add to Calendar',
          onTap: () {
            Navigator.pop(context);
            onAddToCalendar?.call();
          },
        ),
        GlassActionButton(
          icon: Icons.bookmark_outline,
          label: 'Save Event',
          onTap: () {
            Navigator.pop(context);
            onSave?.call();
          },
        ),
        GlassActionButton(
          icon: Icons.flag_outlined,
          label: 'Report Event',
          onTap: () {
            Navigator.pop(context);
            onReport?.call();
          },
          isDestructive: true,
        ),
      ],
    ),
  );
}

/// Shows event details in a glassmorphism bottom sheet
void showEventDetailsSheet(
  BuildContext context,
  Event event, {
  VoidCallback? onRegister,
  VoidCallback? onViewDetails,
}) {
  final isDark = Theme.of(context).brightness == Brightness.dark;
  
  showGlassBottomSheet(
    context: context,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Event banner
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Image.network(
            event.branding.bannerUrl,
            height: 160,
            width: double.infinity,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => Container(
              height: 160,
              color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.1),
              child: Icon(
                Icons.event,
                size: 48,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        
        // Event name
        Text(
          event.name,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        
        // Organization
        Row(
          children: [
            CircleAvatar(
              radius: 12,
              backgroundImage: event.organization.logoUrl.isNotEmpty
                  ? NetworkImage(event.organization.logoUrl)
                  : null,
              backgroundColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.2),
              child: event.organization.logoUrl.isEmpty
                  ? Text(
                      event.organization.name.isNotEmpty ? event.organization.name[0] : '?',
                      style: TextStyle(fontSize: 10),
                    )
                  : null,
            ),
            const SizedBox(width: 8),
            Text(
              event.organization.name,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: isDark ? Colors.white70 : Colors.black54,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        
        // Date & Mode
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.03),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Expanded(
                child: Row(
                  children: [
                    Icon(
                      Icons.calendar_today,
                      size: 18,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _formatDateRange(event.startDate, event.endDate),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _getModeIcon(event.mode),
                      size: 14,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      event.mode.name,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        
        // Description
        if (event.description != null) ...[
          Text(
            event.description!,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: isDark ? Colors.white70 : Colors.black87,
            ),
            maxLines: 4,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 16),
        ],
        
        // Action buttons
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () {
                  Navigator.pop(context);
                  onViewDetails?.call();
                },
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text('View Details'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: FilledButton(
                onPressed: () {
                  Navigator.pop(context);
                  onRegister?.call();
                },
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text('Register'),
              ),
            ),
          ],
        ),
      ],
    ),
  );
}

String _formatDateRange(DateTime start, DateTime end) {
  final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (start.year == end.year && start.month == end.month && start.day == end.day) {
    return '${months[start.month - 1]} ${start.day}, ${start.year}';
  }
  return '${months[start.month - 1]} ${start.day} - ${months[end.month - 1]} ${end.day}, ${end.year}';
}

IconData _getModeIcon(EventMode mode) {
  switch (mode) {
    case EventMode.ONLINE:
      return Icons.public;
    case EventMode.OFFLINE:
      return Icons.place;
    case EventMode.HYBRID:
      return Icons.groups;
  }
}
