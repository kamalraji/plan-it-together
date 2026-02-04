import 'dart:async';
import 'package:flutter/material.dart';
import '../../models/chat_security_models.dart';

/// Indicator showing disappearing message timer on a message bubble
class DisappearingMessageIndicator extends StatefulWidget {
  final DateTime expiresAt;
  final double size;
  final Color? color;

  const DisappearingMessageIndicator({
    super.key,
    required this.expiresAt,
    this.size = 14,
    this.color,
  });

  @override
  State<DisappearingMessageIndicator> createState() =>
      _DisappearingMessageIndicatorState();
}

class _DisappearingMessageIndicatorState
    extends State<DisappearingMessageIndicator>
    with SingleTickerProviderStateMixin {
  late Timer _timer;
  late AnimationController _animController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeInOut),
    );

    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    _animController.dispose();
    super.dispose();
  }

  String _formatTimeRemaining() {
    final remaining = widget.expiresAt.difference(DateTime.now());
    if (remaining.isNegative) return 'Expired';

    if (remaining.inDays > 0) {
      return '${remaining.inDays}d';
    } else if (remaining.inHours > 0) {
      return '${remaining.inHours}h';
    } else if (remaining.inMinutes > 0) {
      return '${remaining.inMinutes}m';
    } else {
      return '${remaining.inSeconds}s';
    }
  }

  @override
  Widget build(BuildContext context) {
    final remaining = widget.expiresAt.difference(DateTime.now());
    final isUrgent = remaining.inMinutes < 5 && remaining.inMinutes >= 0;
    final color = widget.color ?? Theme.of(context).colorScheme.onSurface;

    return AnimatedBuilder(
      animation: _pulseAnimation,
      builder: (context, child) {
        return Opacity(
          opacity: isUrgent ? _pulseAnimation.value : 0.7,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.timer_outlined,
                size: widget.size,
                color: isUrgent ? Colors.orange : color.withOpacity(0.7),
              ),
              const SizedBox(width: 2),
              Text(
                _formatTimeRemaining(),
                style: TextStyle(
                  fontSize: widget.size - 2,
                  color: isUrgent ? Colors.orange : color.withOpacity(0.7),
                  fontWeight: isUrgent ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

/// Header indicator showing active disappearing messages timer for a channel
class DisappearingTimerHeader extends StatelessWidget {
  final DisappearingMessageSettings settings;
  final VoidCallback? onTap;

  const DisappearingTimerHeader({
    super.key,
    required this.settings,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    if (!settings.enabled) return const SizedBox.shrink();

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        decoration: BoxDecoration(
          color: cs.primaryContainer.withOpacity(0.3),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: cs.primary.withOpacity(0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.timer_outlined, size: 16, color: cs.primary),
            const SizedBox(width: 6),
            Text(
              'Messages disappear after ${settings.durationLabel}',
              style: theme.textTheme.bodySmall?.copyWith(
                color: cs.primary,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(width: 4),
            Icon(Icons.chevron_right, size: 16, color: cs.primary),
          ],
        ),
      ),
    );
  }
}

/// Sheet for selecting disappearing message duration
class DisappearingTimerSheet extends StatefulWidget {
  final int? currentDuration;
  final bool enabled;

  const DisappearingTimerSheet({
    super.key,
    this.currentDuration,
    this.enabled = false,
  });

  static Future<({int duration, bool enabled})?> show(
    BuildContext context, {
    int? currentDuration,
    bool enabled = false,
  }) {
    return showModalBottomSheet<({int duration, bool enabled})>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => DisappearingTimerSheet(
        currentDuration: currentDuration,
        enabled: enabled,
      ),
    );
  }

  @override
  State<DisappearingTimerSheet> createState() => _DisappearingTimerSheetState();
}

class _DisappearingTimerSheetState extends State<DisappearingTimerSheet> {
  late int _selectedDuration;
  late bool _enabled;

  @override
  void initState() {
    super.initState();
    _selectedDuration = widget.currentDuration ?? 86400;
    _enabled = widget.enabled;
  }

  String _getDurationLabel(int seconds) {
    if (seconds <= 0) return 'Off';
    if (seconds < 60) return '$seconds seconds';
    if (seconds < 3600) return '${seconds ~/ 60} minutes';
    if (seconds < 86400) return '${seconds ~/ 3600} hours';
    return '${seconds ~/ 86400} days';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: cs.onSurface.withOpacity(0.2),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: cs.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(Icons.timer_outlined, color: cs.primary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Disappearing Messages',
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'Messages auto-delete after the timer',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: cs.onSurface.withOpacity(0.6),
                      ),
                    ),
                  ],
                ),
              ),
              Switch(
                value: _enabled,
                onChanged: (v) => setState(() => _enabled = v),
              ),
            ],
          ),
          const SizedBox(height: 24),

          if (_enabled) ...[
            Text(
              'Timer Duration',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),

            ...DisappearingMessageSettings.presetDurations
                .where((d) => d > 0)
                .map((duration) => _DurationTile(
                      duration: duration,
                      label: _getDurationLabel(duration),
                      isSelected: _selectedDuration == duration,
                      onTap: () => setState(() => _selectedDuration = duration),
                    )),
            const SizedBox(height: 16),
          ],

          // Info
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: cs.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline,
                    size: 20, color: cs.onSurface.withOpacity(0.6)),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'New messages will automatically disappear after the set time. This setting only applies to new messages.',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: cs.onSurface.withOpacity(0.6),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Save button
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () => Navigator.of(context).pop((
                duration: _selectedDuration,
                enabled: _enabled,
              )),
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text('Save'),
            ),
          ),
        ],
      ),
    );
  }
}

class _DurationTile extends StatelessWidget {
  final int duration;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _DurationTile({
    required this.duration,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? cs.primaryContainer : cs.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? cs.primary : Colors.transparent,
              width: 2,
            ),
          ),
          child: Row(
            children: [
              Icon(
                Icons.timer,
                size: 20,
                color: isSelected ? cs.primary : cs.onSurface.withOpacity(0.6),
              ),
              const SizedBox(width: 12),
              Text(
                label,
                style: theme.textTheme.bodyMedium?.copyWith(
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                  color: isSelected ? cs.primary : cs.onSurface,
                ),
              ),
              const Spacer(),
              if (isSelected)
                Icon(Icons.check_circle, size: 20, color: cs.primary),
            ],
          ),
        ),
      ),
    );
  }
}
