import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import 'package:thittam1hub/theme.dart';

/// Quick action buttons for event detail page
class EventQuickActions extends StatelessWidget {
  final String eventId;
  final String eventName;
  final String? eventUrl;
  final bool isSaved;
  final bool isSaving;
  final VoidCallback onToggleSave;
  final VoidCallback? onAddToCalendar;
  final VoidCallback? onReport;

  const EventQuickActions({
    super.key,
    required this.eventId,
    required this.eventName,
    this.eventUrl,
    required this.isSaved,
    this.isSaving = false,
    required this.onToggleSave,
    this.onAddToCalendar,
    this.onReport,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Row(
      children: [
        _ActionButton(
          icon: isSaved ? Icons.bookmark : Icons.bookmark_border,
          label: isSaved ? 'Saved' : 'Save',
          isActive: isSaved,
          isLoading: isSaving,
          onTap: onToggleSave,
          cs: cs,
        ),
        const SizedBox(width: 8),
        _ActionButton(
          icon: Icons.share_outlined,
          label: 'Share',
          onTap: () => _shareEvent(context),
          cs: cs,
        ),
        const SizedBox(width: 8),
        if (onAddToCalendar != null)
          _ActionButton(
            icon: Icons.calendar_today_outlined,
            label: 'Calendar',
            onTap: onAddToCalendar!,
            cs: cs,
          ),
        const Spacer(),
        IconButton(
          icon: const Icon(Icons.more_horiz),
          onPressed: () => _showMoreOptions(context),
          color: AppColors.textMuted,
        ),
      ],
    );
  }

  void _shareEvent(BuildContext context) async {
    HapticFeedback.lightImpact();
    
    final shareText = 'Check out "$eventName" on Thittam1Hub!';
    final shareUrl = eventUrl ?? 'https://thittam1hub.app/events/$eventId';
    
    try {
      await Share.share('$shareText\n\n$shareUrl');
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not share event')),
        );
      }
    }
  }

  void _showMoreOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.link),
                title: const Text('Copy link'),
                onTap: () {
                  final url = eventUrl ?? 'https://thittam1hub.app/events/$eventId';
                  Clipboard.setData(ClipboardData(text: url));
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Link copied to clipboard')),
                  );
                },
              ),
              if (onReport != null)
                ListTile(
                  leading: Icon(Icons.flag_outlined, color: AppColors.error),
                  title: Text('Report event', style: TextStyle(color: AppColors.error)),
                  onTap: () {
                    Navigator.pop(context);
                    onReport!();
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final ColorScheme cs;
  final bool isActive;
  final bool isLoading;

  const _ActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
    required this.cs,
    this.isActive = false,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    
    return Material(
      color: isActive
          ? cs.primary.withValues(alpha: 0.1)
          : cs.surfaceContainerHighest,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: isLoading ? null : onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (isLoading)
                SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: cs.primary,
                  ),
                )
              else
                Icon(
                  icon,
                  size: 18,
                  color: isActive ? cs.primary : AppColors.textMuted,
                ),
              const SizedBox(width: 6),
              Text(
                label,
                style: text.labelMedium?.copyWith(
                  color: isActive ? cs.primary : AppColors.textSecondary,
                  fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
