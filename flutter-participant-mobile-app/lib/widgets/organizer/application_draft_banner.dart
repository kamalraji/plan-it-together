import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/models/organizer_application.dart';

/// Banner to display draft application progress and continue option
class ApplicationDraftBanner extends StatelessWidget {
  final OrganizerApplication draft;
  final VoidCallback onContinue;
  final VoidCallback? onDiscard;
  final DateTime? lastSaved;

  const ApplicationDraftBanner({
    super.key,
    required this.draft,
    required this.onContinue,
    this.onDiscard,
    this.lastSaved,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final progress = draft.completionPercentage / 100;

    return Card(
      margin: EdgeInsets.zero,
      child: InkWell(
        onTap: () {
          HapticFeedback.lightImpact();
          onContinue();
        },
        borderRadius: BorderRadius.circular(AppRadius.lg),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header row
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: cs.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                    child: Icon(
                      Icons.edit_document,
                      size: 18,
                      color: cs.primary,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Continue Your Application',
                          style: context.textStyles.titleSmall?.semiBold,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _getProgressText(),
                          style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                  Icon(
                    Icons.chevron_right,
                    color: cs.onSurfaceVariant,
                  ),
                ],
              ),

              const SizedBox(height: AppSpacing.md),

              // Progress bar
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: progress,
                  minHeight: 6,
                  backgroundColor: cs.outline.withOpacity(0.2),
                  valueColor: AlwaysStoppedAnimation(cs.primary),
                ),
              ),

              const SizedBox(height: AppSpacing.sm),

              // Progress details
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${draft.completionPercentage}% complete',
                    style: context.textStyles.labelSmall?.semiBold.withColor(cs.primary),
                  ),
                  if (lastSaved != null)
                    Text(
                      'Last saved ${_formatLastSaved(lastSaved!)}',
                      style: context.textStyles.labelSmall?.withColor(cs.onSurfaceVariant),
                    ),
                ],
              ),

              // Actions
              const SizedBox(height: AppSpacing.md),
              Row(
                children: [
                  Expanded(
                    child: FilledButton(
                      onPressed: () {
                        HapticFeedback.lightImpact();
                        onContinue();
                      },
                      child: const Text('Continue'),
                    ),
                  ),
                  if (onDiscard != null) ...[
                    const SizedBox(width: AppSpacing.sm),
                    TextButton(
                      onPressed: () => _confirmDiscard(context),
                      child: Text(
                        'Discard',
                        style: TextStyle(color: cs.error),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _getProgressText() {
    if (draft.completionPercentage == 0) {
      return 'You haven\'t started yet';
    } else if (draft.completionPercentage < 50) {
      return 'Getting started...';
    } else if (draft.completionPercentage < 75) {
      return 'Almost there!';
    } else if (draft.completionPercentage < 100) {
      return 'Final touches needed';
    } else {
      return 'Ready to submit!';
    }
  }

  String _formatLastSaved(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inMinutes < 1) {
      return 'just now';
    } else if (diff.inMinutes < 60) {
      return '${diff.inMinutes}m ago';
    } else if (diff.inHours < 24) {
      return '${diff.inHours}h ago';
    } else if (diff.inDays < 7) {
      return '${diff.inDays}d ago';
    } else {
      return 'over a week ago';
    }
  }

  Future<void> _confirmDiscard(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Discard Application?'),
        content: const Text(
          'Are you sure you want to discard your application progress? This cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(
              'Discard',
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ),
        ],
      ),
    );

    if (confirmed == true && onDiscard != null) {
      HapticFeedback.mediumImpact();
      onDiscard!();
    }
  }
}

/// Compact banner for account settings
class CompactApplicationBanner extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color? iconColor;
  final VoidCallback onTap;
  final Widget? trailing;

  const CompactApplicationBanner({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    this.iconColor,
    required this.onTap,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final effectiveIconColor = iconColor ?? cs.secondary;

    return Card(
      color: effectiveIconColor.withOpacity(0.1),
      margin: EdgeInsets.zero,
      child: InkWell(
        onTap: () {
          HapticFeedback.lightImpact();
          onTap();
        },
        borderRadius: BorderRadius.circular(AppRadius.lg),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Row(
            children: [
              Icon(icon, color: effectiveIconColor),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: context.textStyles.titleSmall?.semiBold,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
              if (trailing != null)
                trailing!
              else
                Icon(Icons.chevron_right, color: cs.onSurfaceVariant),
            ],
          ),
        ),
      ),
    );
  }
}
