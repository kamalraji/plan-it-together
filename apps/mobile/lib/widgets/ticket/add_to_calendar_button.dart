import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/user_ticket.dart';
import 'package:thittam1hub/theme.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:intl/intl.dart';

/// Add to Calendar button with multiple calendar support
class AddToCalendarButton extends StatelessWidget {
  final UserTicket ticket;
  final bool compact;

  const AddToCalendarButton({
    super.key,
    required this.ticket,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    if (compact) {
      return IconButton(
        onPressed: () => showCalendarOptions(context, ticket),
        icon: const Icon(Icons.calendar_month_outlined),
        tooltip: 'Add to Calendar',
        style: IconButton.styleFrom(
          backgroundColor: cs.surfaceContainerHighest,
        ),
      );
    }

    return OutlinedButton.icon(
      onPressed: () => showCalendarOptions(context, ticket),
      icon: const Icon(Icons.calendar_month_outlined, size: 18),
      label: const Text('Add to Calendar'),
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(44),
      ),
    );
  }

  /// Static method to show calendar options - can be called from anywhere
  static void showCalendarOptions(BuildContext context, UserTicket ticket) {
    final cs = Theme.of(context).colorScheme;
    
    showModalBottomSheet(
      context: context,
      backgroundColor: cs.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xl)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: cs.outlineVariant,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              Text(
                'Add to Calendar',
                style: context.textStyles.titleMedium?.bold,
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                ticket.eventName,
                style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: AppSpacing.lg),
              _CalendarOption(
                icon: Icons.event,
                label: 'Google Calendar',
                color: const Color(0xFF4285F4),
                onTap: () {
                  Navigator.pop(context);
                  final button = AddToCalendarButton(ticket: ticket);
                  button._addToGoogleCalendar(context);
                },
              ),
              const SizedBox(height: AppSpacing.sm),
              _CalendarOption(
                icon: Icons.apple,
                label: 'Apple Calendar',
                color: cs.onSurface,
                onTap: () {
                  Navigator.pop(context);
                  final button = AddToCalendarButton(ticket: ticket);
                  button._addToAppleCalendar(context);
                },
              ),
              const SizedBox(height: AppSpacing.sm),
              _CalendarOption(
                icon: Icons.email_outlined,
                label: 'Outlook Calendar',
                color: const Color(0xFF0078D4),
                onTap: () {
                  Navigator.pop(context);
                  final button = AddToCalendarButton(ticket: ticket);
                  button._addToOutlookCalendar(context);
                },
              ),
              const SizedBox(height: AppSpacing.sm),
              _CalendarOption(
                icon: Icons.content_copy,
                label: 'Copy iCal Link',
                color: cs.primary,
                onTap: () {
                  Navigator.pop(context);
                  final button = AddToCalendarButton(ticket: ticket);
                  button._copyICalLink(context);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDateForGoogle(DateTime dt) {
    return DateFormat("yyyyMMdd'T'HHmmss").format(dt);
  }

  String _formatDateForIcal(DateTime dt) {
    return DateFormat("yyyyMMdd'T'HHmmss'Z'").format(dt.toUtc());
  }

  Future<void> _addToGoogleCalendar(BuildContext context) async {
    final url = Uri.parse(
      'https://calendar.google.com/calendar/render?action=TEMPLATE'
      '&text=${Uri.encodeComponent(ticket.eventName)}'
      '&dates=${_formatDateForGoogle(ticket.startDate)}/${_formatDateForGoogle(ticket.endDate)}'
      '&details=${Uri.encodeComponent('Organized by ${ticket.organizationName}\n\nTicket: ${ticket.tierName}\nQuantity: ${ticket.quantity}')}'
      '&sf=true&output=xml',
    );

    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
      _showSuccess(context, 'Opening Google Calendar...');
    } else {
      _showError(context, 'Could not open Google Calendar');
    }
  }

  Future<void> _addToAppleCalendar(BuildContext context) async {
    // Generate iCal content and open with webcal protocol
    final icalContent = _generateICalContent();
    final dataUri = Uri.dataFromString(
      icalContent,
      mimeType: 'text/calendar',
      encoding: null,
    );
    
    if (await canLaunchUrl(dataUri)) {
      await launchUrl(dataUri);
      _showSuccess(context, 'Opening Calendar...');
    } else {
      _copyICalLink(context);
    }
  }

  Future<void> _addToOutlookCalendar(BuildContext context) async {
    final url = Uri.parse(
      'https://outlook.live.com/calendar/0/deeplink/compose?'
      'subject=${Uri.encodeComponent(ticket.eventName)}'
      '&startdt=${ticket.startDate.toUtc().toIso8601String()}'
      '&enddt=${ticket.endDate.toUtc().toIso8601String()}'
      '&body=${Uri.encodeComponent('Organized by ${ticket.organizationName}\n\nTicket: ${ticket.tierName}\nQuantity: ${ticket.quantity}')}'
      '&path=/calendar/action/compose',
    );

    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
      _showSuccess(context, 'Opening Outlook Calendar...');
    } else {
      _showError(context, 'Could not open Outlook Calendar');
    }
  }

  Future<void> _copyICalLink(BuildContext context) async {
    final icalContent = _generateICalContent();
    await Clipboard.setData(ClipboardData(text: icalContent));
    _showSuccess(context, 'iCal content copied to clipboard');
  }

  String _generateICalContent() {
    return '''BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Thittam1Hub//Event Ticket//EN
BEGIN:VEVENT
UID:${ticket.registrationId}@thittam1hub.app
DTSTAMP:${_formatDateForIcal(DateTime.now())}
DTSTART:${_formatDateForIcal(ticket.startDate)}
DTEND:${_formatDateForIcal(ticket.endDate)}
SUMMARY:${ticket.eventName}
DESCRIPTION:Organized by ${ticket.organizationName}\\n\\nTicket: ${ticket.tierName}\\nQuantity: ${ticket.quantity}
ORGANIZER;CN=${ticket.organizationName}:mailto:events@thittam1hub.app
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR''';
  }

  void _showSuccess(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white, size: 20),
            const SizedBox(width: 8),
            Text(message),
          ],
        ),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  void _showError(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error_outline, color: Colors.white, size: 20),
            const SizedBox(width: 8),
            Text(message),
          ],
        ),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}

class _CalendarOption extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _CalendarOption({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
          decoration: BoxDecoration(
            border: Border.all(color: cs.outlineVariant),
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 20, color: color),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Text(
                  label,
                  style: context.textStyles.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              Icon(Icons.chevron_right, color: cs.onSurfaceVariant, size: 20),
            ],
          ),
        ),
      ),
    );
  }
}
