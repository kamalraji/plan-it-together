import 'dart:async';
import 'package:flutter/material.dart';
import 'package:thittam1hub/theme.dart';

/// Displays registration deadline with countdown
class EventRegistrationDeadline extends StatefulWidget {
  final DateTime deadline;
  final String timezone;
  final VoidCallback? onDeadlinePassed;

  const EventRegistrationDeadline({
    super.key,
    required this.deadline,
    this.timezone = 'UTC',
    this.onDeadlinePassed,
  });

  @override
  State<EventRegistrationDeadline> createState() => _EventRegistrationDeadlineState();
}

class _EventRegistrationDeadlineState extends State<EventRegistrationDeadline> {
  Timer? _timer;
  late Duration _remaining;

  @override
  void initState() {
    super.initState();
    _calculateRemaining();
    _startTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _calculateRemaining() {
    _remaining = widget.deadline.difference(DateTime.now());
    if (_remaining.isNegative) {
      _remaining = Duration.zero;
    }
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() {
        _calculateRemaining();
        if (_remaining == Duration.zero) {
          _timer?.cancel();
          widget.onDeadlinePassed?.call();
        }
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;
    final isPassed = _remaining == Duration.zero;
    final isUrgent = _remaining.inHours < 24 && !isPassed;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isPassed
              ? [
                  AppColors.error.withValues(alpha: 0.15),
                  AppColors.error.withValues(alpha: 0.05),
                ]
              : isUrgent
                  ? [
                      AppColors.warning.withValues(alpha: 0.15),
                      AppColors.warning.withValues(alpha: 0.05),
                    ]
                  : [
                      cs.primary.withValues(alpha: 0.1),
                      cs.primary.withValues(alpha: 0.05),
                    ],
        ),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(
          color: isPassed
              ? AppColors.error.withValues(alpha: 0.3)
              : isUrgent
                  ? AppColors.warning.withValues(alpha: 0.3)
                  : cs.primary.withValues(alpha: 0.2),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isPassed
                  ? AppColors.error.withValues(alpha: 0.2)
                  : isUrgent
                      ? AppColors.warning.withValues(alpha: 0.2)
                      : cs.primary.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isPassed
                  ? Icons.event_busy
                  : isUrgent
                      ? Icons.warning_amber_rounded
                      : Icons.schedule,
              color: isPassed
                  ? AppColors.error
                  : isUrgent
                      ? AppColors.warning
                      : cs.primary,
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isPassed ? 'Registration Closed' : 'Registration Deadline',
                  style: text.labelMedium?.copyWith(
                    color: isPassed
                        ? AppColors.error
                        : isUrgent
                            ? AppColors.warning
                            : cs.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                if (isPassed)
                  Text(
                    'Registration for this event has ended',
                    style: text.bodySmall?.copyWith(color: AppColors.textMuted),
                  )
                else
                  Text(
                    _formatDeadline(),
                    style: text.bodySmall?.copyWith(color: AppColors.textMuted),
                  ),
              ],
            ),
          ),
          if (!isPassed)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: isUrgent
                    ? AppColors.warning.withValues(alpha: 0.15)
                    : cs.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                _formatCountdown(),
                style: text.labelMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                  fontFeatures: const [FontFeature.tabularFigures()],
                  color: isUrgent ? AppColors.warning : null,
                ),
              ),
            ),
        ],
      ),
    );
  }

  String _formatDeadline() {
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final d = widget.deadline.toLocal();
    final hour = d.hour % 12 == 0 ? 12 : d.hour % 12;
    final min = d.minute.toString().padLeft(2, '0');
    final ampm = d.hour < 12 ? 'AM' : 'PM';
    return '${months[d.month - 1]} ${d.day}, ${d.year} at $hour:$min $ampm';
  }

  String _formatCountdown() {
    if (_remaining.inDays > 0) {
      return '${_remaining.inDays}d ${_remaining.inHours % 24}h left';
    } else if (_remaining.inHours > 0) {
      return '${_remaining.inHours}h ${_remaining.inMinutes % 60}m left';
    } else if (_remaining.inMinutes > 0) {
      return '${_remaining.inMinutes}m ${_remaining.inSeconds % 60}s left';
    } else {
      return '${_remaining.inSeconds}s left';
    }
  }
}
