import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/theme.dart';

/// Displays profile completeness with a progress ring and actionable suggestions
class ProfileCompletenessCard extends StatelessWidget {
  final UserProfile profile;
  final VoidCallback? onFieldTap;

  const ProfileCompletenessCard({
    super.key,
    required this.profile,
    this.onFieldTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final completeness = _calculateCompleteness();
    final incompleteFields = _getIncompleteFields();
    
    if (completeness >= 100) {
      return _buildCompleteBanner(context, cs);
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            cs.primaryContainer.withOpacity(0.3),
            cs.secondaryContainer.withOpacity(0.2),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: cs.primary.withOpacity(0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Progress Ring
              SizedBox(
                width: 64,
                height: 64,
                child: CustomPaint(
                  painter: _ProgressRingPainter(
                    progress: completeness / 100,
                    backgroundColor: cs.outline.withOpacity(0.2),
                    progressColor: _getProgressColor(completeness, cs),
                    strokeWidth: 6,
                  ),
                  child: Center(
                    child: Text(
                      '$completeness%',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: _getProgressColor(completeness, cs),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _getEncouragingMessage(completeness),
                      style: context.textStyles.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${incompleteFields.length} field${incompleteFields.length == 1 ? '' : 's'} remaining',
                      style: context.textStyles.bodySmall?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (incompleteFields.isNotEmpty) ...[
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: incompleteFields.take(4).map((field) {
                return _buildFieldChip(context, field, cs);
              }).toList(),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildCompleteBanner(BuildContext context, ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.green.shade50,
            Colors.teal.shade50,
          ],
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.green.withOpacity(0.3),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.green.shade100,
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.check_circle,
              color: Colors.green.shade700,
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Profile Complete! 🎉',
                  style: context.textStyles.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: Colors.green.shade800,
                  ),
                ),
                Text(
                  'Your profile is ready to shine',
                  style: context.textStyles.bodySmall?.copyWith(
                    color: Colors.green.shade700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFieldChip(BuildContext context, _IncompleteField field, ColorScheme cs) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onFieldTap?.call();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: cs.outline.withOpacity(0.3),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              field.icon,
              size: 14,
              color: cs.primary,
            ),
            const SizedBox(width: 6),
            Text(
              field.name,
              style: context.textStyles.labelSmall?.copyWith(
                color: cs.onSurface,
              ),
            ),
            const SizedBox(width: 4),
            Icon(
              Icons.add_circle_outline,
              size: 14,
              color: cs.primary,
            ),
          ],
        ),
      ),
    );
  }

  int _calculateCompleteness() {
    int filled = 0;
    const total = 10;

    if (profile.fullName?.isNotEmpty ?? false) filled++;
    if (profile.username?.isNotEmpty ?? false) filled++;
    if (profile.bio?.isNotEmpty ?? false) filled++;
    if (profile.organization?.isNotEmpty ?? false) filled++;
    if (profile.phone?.isNotEmpty ?? false) filled++;
    if (profile.website?.isNotEmpty ?? false) filled++;
    if (profile.avatarUrl?.isNotEmpty ?? false) filled++;
    if (profile.linkedinUrl?.isNotEmpty ?? false) filled++;
    if (profile.twitterUrl?.isNotEmpty ?? false) filled++;
    if (profile.githubUrl?.isNotEmpty ?? false) filled++;

    return ((filled / total) * 100).round();
  }

  List<_IncompleteField> _getIncompleteFields() {
    final fields = <_IncompleteField>[];

    if (profile.fullName?.isEmpty ?? true) {
      fields.add(_IncompleteField('Name', Icons.person_outline, 'fullName'));
    }
    if (profile.username?.isEmpty ?? true) {
      fields.add(_IncompleteField('Username', Icons.alternate_email, 'username'));
    }
    if (profile.avatarUrl?.isEmpty ?? true) {
      fields.add(_IncompleteField('Photo', Icons.camera_alt_outlined, 'avatar'));
    }
    if (profile.bio?.isEmpty ?? true) {
      fields.add(_IncompleteField('Bio', Icons.description_outlined, 'bio'));
    }
    if (profile.organization?.isEmpty ?? true) {
      fields.add(_IncompleteField('Organization', Icons.business_outlined, 'organization'));
    }
    if (profile.phone?.isEmpty ?? true) {
      fields.add(_IncompleteField('Phone', Icons.phone_outlined, 'phone'));
    }
    if (profile.website?.isEmpty ?? true) {
      fields.add(_IncompleteField('Website', Icons.language_outlined, 'website'));
    }
    if (profile.linkedinUrl?.isEmpty ?? true) {
      fields.add(_IncompleteField('LinkedIn', Icons.link, 'linkedin'));
    }
    if (profile.twitterUrl?.isEmpty ?? true) {
      fields.add(_IncompleteField('Twitter', Icons.link, 'twitter'));
    }
    if (profile.githubUrl?.isEmpty ?? true) {
      fields.add(_IncompleteField('GitHub', Icons.link, 'github'));
    }

    return fields;
  }

  Color _getProgressColor(int progress, ColorScheme cs) {
    if (progress >= 80) return Colors.green;
    if (progress >= 50) return Colors.orange;
    return cs.primary;
  }

  String _getEncouragingMessage(int progress) {
    if (progress >= 80) return 'Almost there!';
    if (progress >= 50) return 'Looking good!';
    if (progress >= 25) return 'Good start!';
    return 'Complete your profile';
  }
}

class _IncompleteField {
  final String name;
  final IconData icon;
  final String fieldKey;

  _IncompleteField(this.name, this.icon, this.fieldKey);
}

class _ProgressRingPainter extends CustomPainter {
  final double progress;
  final Color backgroundColor;
  final Color progressColor;
  final double strokeWidth;

  _ProgressRingPainter({
    required this.progress,
    required this.backgroundColor,
    required this.progressColor,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    // Background circle
    final bgPaint = Paint()
      ..color = backgroundColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, bgPaint);

    // Progress arc
    final progressPaint = Paint()
      ..color = progressColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    final sweepAngle = 2 * math.pi * progress;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      sweepAngle,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _ProgressRingPainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.progressColor != progressColor;
  }
}
