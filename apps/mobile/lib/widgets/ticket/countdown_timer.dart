import 'dart:async';

import 'package:flutter/material.dart';
import 'package:thittam1hub/theme.dart';

/// Live countdown timer widget for upcoming events
class CountdownTimer extends StatefulWidget {
  final DateTime targetDate;
  final VoidCallback? onComplete;
  final bool compact;

  const CountdownTimer({
    super.key,
    required this.targetDate,
    this.onComplete,
    this.compact = false,
  });

  @override
  State<CountdownTimer> createState() => _CountdownTimerState();
}

class _CountdownTimerState extends State<CountdownTimer> {
  Timer? _timer;
  late Duration _remaining;

  @override
  void initState() {
    super.initState();
    _updateRemaining();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      _updateRemaining();
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _updateRemaining() {
    final now = DateTime.now();
    final remaining = widget.targetDate.difference(now);
    
    if (remaining.isNegative && widget.onComplete != null) {
      widget.onComplete!();
    }
    
    if (mounted) {
      setState(() => _remaining = remaining.isNegative ? Duration.zero : remaining);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    if (_remaining == Duration.zero) {
      return _buildLiveBadge(cs);
    }

    final days = _remaining.inDays;
    final hours = _remaining.inHours % 24;
    final minutes = _remaining.inMinutes % 60;
    final seconds = _remaining.inSeconds % 60;

    if (widget.compact) {
      return _buildCompactTimer(cs, days, hours, minutes, seconds);
    }

    return _buildFullTimer(cs, days, hours, minutes, seconds);
  }

  Widget _buildLiveBadge(ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.success.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(100),
        border: Border.all(color: AppColors.success.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: AppColors.success,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: AppColors.success.withValues(alpha: 0.5),
                  blurRadius: 6,
                  spreadRadius: 2,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            'LIVE NOW',
            style: context.textStyles.labelSmall?.copyWith(
              color: AppColors.success,
              fontWeight: FontWeight.bold,
              letterSpacing: 1,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCompactTimer(ColorScheme cs, int days, int hours, int minutes, int seconds) {
    String text;
    if (days > 0) {
      text = '${days}d ${hours}h';
    } else if (hours > 0) {
      text = '${hours}h ${minutes}m';
    } else {
      text = '${minutes}m ${seconds}s';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: cs.primary.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(100),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.timer_outlined, size: 14, color: cs.primary),
          const SizedBox(width: 4),
          Text(
            text,
            style: context.textStyles.labelSmall?.copyWith(
              color: cs.primary,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFullTimer(ColorScheme cs, int days, int hours, int minutes, int seconds) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            cs.primary.withValues(alpha: 0.1),
            cs.secondary.withValues(alpha: 0.05),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: cs.primary.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          Text(
            'EVENT STARTS IN',
            style: context.textStyles.labelSmall?.copyWith(
              color: cs.onSurfaceVariant,
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _TimeUnit(value: days, label: 'DAYS', cs: cs),
              _TimeSeparator(cs: cs),
              _TimeUnit(value: hours, label: 'HRS', cs: cs),
              _TimeSeparator(cs: cs),
              _TimeUnit(value: minutes, label: 'MIN', cs: cs),
              _TimeSeparator(cs: cs),
              _TimeUnit(value: seconds, label: 'SEC', cs: cs, isLast: true),
            ],
          ),
        ],
      ),
    );
  }
}

class _TimeUnit extends StatelessWidget {
  final int value;
  final String label;
  final ColorScheme cs;
  final bool isLast;

  const _TimeUnit({
    required this.value,
    required this.label,
    required this.cs,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 52,
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: cs.shadow.withValues(alpha: 0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            value.toString().padLeft(2, '0'),
            style: context.textStyles.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: isLast && value < 60 ? cs.primary : cs.onSurface,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: context.textStyles.labelSmall?.copyWith(
              color: cs.onSurfaceVariant,
              fontSize: 9,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _TimeSeparator extends StatelessWidget {
  final ColorScheme cs;

  const _TimeSeparator({required this.cs});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Text(
        ':',
        style: context.textStyles.titleLarge?.copyWith(
          color: cs.onSurfaceVariant,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
