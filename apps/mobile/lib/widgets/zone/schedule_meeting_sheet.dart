import 'package:flutter/material.dart';
import '../../models/networking_models.dart';
import '../../models/impact_profile.dart';
import '../../supabase/networking_service.dart';
import '../styled_avatar.dart';
import '../styled_button.dart';
import '../styled_text_field.dart';

/// Bottom sheet for scheduling a 1-on-1 meeting
class ScheduleMeetingSheet extends StatefulWidget {
  final String eventId;
  final ImpactProfile targetProfile;
  final DateTime eventStartDate;
  final DateTime eventEndDate;
  final VoidCallback? onScheduled;

  const ScheduleMeetingSheet({
    super.key,
    required this.eventId,
    required this.targetProfile,
    required this.eventStartDate,
    required this.eventEndDate,
    this.onScheduled,
  });

  @override
  State<ScheduleMeetingSheet> createState() => _ScheduleMeetingSheetState();
}

class _ScheduleMeetingSheetState extends State<ScheduleMeetingSheet> {
  final NetworkingService _service = NetworkingService();
  final TextEditingController _messageController = TextEditingController();

  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;
  String _selectedLocation = MeetingLocation.defaults.first;
  bool _isLoading = false;

  List<DateTime> get _availableDates {
    final dates = <DateTime>[];
    var current = widget.eventStartDate;
    while (!current.isAfter(widget.eventEndDate)) {
      dates.add(DateTime(current.year, current.month, current.day));
      current = current.add(const Duration(days: 1));
    }
    return dates;
  }

  List<TimeOfDay> get _availableTimeSlots {
    final slots = <TimeOfDay>[];
    // Generate 30-minute slots from 9 AM to 6 PM
    for (int hour = 9; hour < 18; hour++) {
      slots.add(TimeOfDay(hour: hour, minute: 0));
      slots.add(TimeOfDay(hour: hour, minute: 30));
    }
    return slots;
  }

  Future<void> _scheduleMeeting() async {
    if (_selectedDate == null || _selectedTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select date and time')),
      );
      return;
    }

    setState(() => _isLoading = true);

    final proposedTime = DateTime(
      _selectedDate!.year,
      _selectedDate!.month,
      _selectedDate!.day,
      _selectedTime!.hour,
      _selectedTime!.minute,
    );

    final success = await _service.requestMeeting(
      eventId: widget.eventId,
      targetUserId: widget.targetProfile.userId,
      proposedTime: proposedTime,
      location: _selectedLocation,
      message: _messageController.text.trim().isEmpty
          ? null
          : _messageController.text.trim(),
    );

    setState(() => _isLoading = false);

    if (!mounted) return;

    if (success) {
      widget.onScheduled?.call();
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Meeting request sent!'),
          backgroundColor: Colors.green,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to send meeting request'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      decoration: BoxDecoration(
        color: theme.scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header with handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: theme.dividerColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Title
            Text(
              'Schedule a Meeting',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),

            const SizedBox(height: 16),

            // Target profile card
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: theme.cardColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: theme.dividerColor),
              ),
              child: Row(
                children: [
                  StyledAvatar(
                    imageUrl: widget.targetProfile.avatarUrl,
                    name: widget.targetProfile.fullName,
                    size: 48,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.targetProfile.fullName,
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        if (widget.targetProfile.headline.isNotEmpty)
                          Text(
                            widget.targetProfile.headline,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.textTheme.bodySmall?.color
                                  ?.withOpacity(0.7),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Date selection
            Text(
              'Select Date',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 60,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: _availableDates.length,
                itemBuilder: (context, index) {
                  final date = _availableDates[index];
                  final isSelected = _selectedDate == date;

                  return GestureDetector(
                    onTap: () => setState(() => _selectedDate = date),
                    child: Container(
                      width: 60,
                      margin: const EdgeInsets.only(right: 8),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? theme.colorScheme.primary
                            : theme.cardColor,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isSelected
                              ? theme.colorScheme.primary
                              : theme.dividerColor,
                        ),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            _getWeekday(date),
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: isSelected
                                  ? Colors.white
                                  : theme.textTheme.bodySmall?.color,
                            ),
                          ),
                          Text(
                            '${date.day}',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: isSelected
                                  ? Colors.white
                                  : theme.textTheme.titleMedium?.color,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),

            const SizedBox(height: 20),

            // Time selection
            Text(
              'Select Time',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _availableTimeSlots.map((time) {
                final isSelected = _selectedTime == time;
                return GestureDetector(
                  onTap: () => setState(() => _selectedTime = time),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? theme.colorScheme.primary
                          : theme.cardColor,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isSelected
                            ? theme.colorScheme.primary
                            : theme.dividerColor,
                      ),
                    ),
                    child: Text(
                      time.format(context),
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: isSelected
                            ? Colors.white
                            : theme.textTheme.bodySmall?.color,
                        fontWeight:
                            isSelected ? FontWeight.w600 : FontWeight.normal,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),

            const SizedBox(height: 20),

            // Location selection
            Text(
              'Meeting Location',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: MeetingLocation.defaults.map((location) {
                final isSelected = _selectedLocation == location;
                return GestureDetector(
                  onTap: () => setState(() => _selectedLocation = location),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? theme.colorScheme.primary
                          : theme.cardColor,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isSelected
                            ? theme.colorScheme.primary
                            : theme.dividerColor,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          _getLocationIcon(location),
                          size: 16,
                          color: isSelected
                              ? Colors.white
                              : theme.iconTheme.color,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          location,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: isSelected
                                ? Colors.white
                                : theme.textTheme.bodySmall?.color,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),

            const SizedBox(height: 20),

            // Optional message
            Text(
              'Add a Note (Optional)',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            StyledTextField(
              controller: _messageController,
              hintText: "I'd love to discuss...",
              maxLines: 2,
            ),

            const SizedBox(height: 24),

            // Submit button
            SizedBox(
              width: double.infinity,
              child: StyledButton(
                onPressed: _isLoading ? null : _scheduleMeeting,
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text('Send Meeting Request'),
              ),
            ),

            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  String _getWeekday(DateTime date) {
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return weekdays[date.weekday - 1];
  }

  IconData _getLocationIcon(String location) {
    switch (location) {
      case 'Coffee Area':
        return Icons.coffee;
      case 'Networking Lounge':
        return Icons.weekend;
      case 'Main Hall':
        return Icons.meeting_room;
      case 'Food Court':
        return Icons.restaurant;
      case 'Outdoor Area':
        return Icons.park;
      default:
        return Icons.location_on;
    }
  }
}
