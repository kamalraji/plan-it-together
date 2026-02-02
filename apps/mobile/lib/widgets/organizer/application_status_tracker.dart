import 'package:flutter/material.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/models/organizer_application.dart';
import 'package:intl/intl.dart';

/// Status entry for timeline display
class StatusHistoryEntry {
  final String id;
  final String? previousStatus;
  final String newStatus;
  final String? changedBy;
  final String? reason;
  final DateTime createdAt;

  const StatusHistoryEntry({
    required this.id,
    this.previousStatus,
    required this.newStatus,
    this.changedBy,
    this.reason,
    required this.createdAt,
  });

  factory StatusHistoryEntry.fromJson(Map<String, dynamic> json) {
    return StatusHistoryEntry(
      id: json['id'] as String,
      previousStatus: json['previous_status'] as String?,
      newStatus: json['new_status'] as String,
      changedBy: json['changed_by'] as String?,
      reason: json['reason'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}

/// Visual timeline tracker for application status
class ApplicationStatusTracker extends StatelessWidget {
  final OrganizerApplication application;
  final List<StatusHistoryEntry>? history;
  final VoidCallback? onResubmit;
  final VoidCallback? onViewDetails;
  final bool compact;

  const ApplicationStatusTracker({
    super.key,
    required this.application,
    this.history,
    this.onResubmit,
    this.onViewDetails,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    if (compact) {
      return _buildCompactTracker(context, cs);
    }

    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: _getStatusColor(application.status).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                  child: Icon(
                    _getStatusIcon(application.status),
                    size: 18,
                    color: _getStatusColor(application.status),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Application Status',
                        style: context.textStyles.titleSmall?.semiBold,
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          _StatusBadge(status: application.status),
                          if (application.submittedAt != null) ...[
                            const SizedBox(width: AppSpacing.sm),
                            Text(
                              '• Submitted ${_formatDate(application.submittedAt!)}',
                              style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
                if (onViewDetails != null)
                  IconButton(
                    icon: const Icon(Icons.info_outline, size: 20),
                    onPressed: onViewDetails,
                    visualDensity: VisualDensity.compact,
                  ),
              ],
            ),

            // Status-specific messages
            if (application.status == ApplicationStatus.rejected && 
                application.rejectionReason != null) ...[
              const SizedBox(height: AppSpacing.md),
              _buildRejectionBanner(context, cs),
            ],

            if (application.status == ApplicationStatus.requiresMoreInfo &&
                application.adminRequestMessage != null) ...[
              const SizedBox(height: AppSpacing.md),
              _buildMoreInfoBanner(context, cs),
            ],

            // Timeline
            if (history != null && history!.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.md),
              const Divider(height: 1),
              const SizedBox(height: AppSpacing.md),
              _buildTimeline(context, cs),
            ],

            // Actions
            if (application.canEdit && 
                (application.status == ApplicationStatus.rejected ||
                 application.status == ApplicationStatus.requiresMoreInfo)) ...[
              const SizedBox(height: AppSpacing.md),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: onResubmit,
                  icon: const Icon(Icons.refresh, size: 18),
                  label: Text(
                    application.status == ApplicationStatus.rejected
                        ? 'Resubmit Application'
                        : 'Update & Resubmit',
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildCompactTracker(BuildContext context, ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: _getStatusColor(application.status).withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(
          color: _getStatusColor(application.status).withOpacity(0.3),
        ),
      ),
      child: Row(
        children: [
          Icon(
            _getStatusIcon(application.status),
            size: 20,
            color: _getStatusColor(application.status),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  application.status.displayLabel,
                  style: context.textStyles.bodyMedium?.semiBold.withColor(
                    _getStatusColor(application.status),
                  ),
                ),
                if (application.submittedAt != null)
                  Text(
                    'Submitted ${_formatDate(application.submittedAt!)}',
                    style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
                  ),
              ],
            ),
          ),
          if (onViewDetails != null)
            TextButton(
              onPressed: onViewDetails,
              child: const Text('Details'),
            ),
        ],
      ),
    );
  }

  Widget _buildRejectionBanner(BuildContext context, ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.error.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.error.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.info_outline, size: 18, color: AppColors.error),
              const SizedBox(width: AppSpacing.sm),
              Text(
                'Reason for Rejection',
                style: context.textStyles.labelMedium?.semiBold.withColor(AppColors.error),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            application.rejectionReason!,
            style: context.textStyles.bodySmall?.withColor(cs.onSurface),
          ),
        ],
      ),
    );
  }

  Widget _buildMoreInfoBanner(BuildContext context, ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.warning.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.warning.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.help_outline, size: 18, color: AppColors.warning),
              const SizedBox(width: AppSpacing.sm),
              Text(
                'Additional Information Needed',
                style: context.textStyles.labelMedium?.semiBold.withColor(AppColors.warning),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            application.adminRequestMessage!,
            style: context.textStyles.bodySmall?.withColor(cs.onSurface),
          ),
        ],
      ),
    );
  }

  Widget _buildTimeline(BuildContext context, ColorScheme cs) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Status History',
          style: context.textStyles.labelMedium?.semiBold.withColor(cs.onSurfaceVariant),
        ),
        const SizedBox(height: AppSpacing.md),
        ...history!.asMap().entries.map((entry) {
          final index = entry.key;
          final item = entry.value;
          final isLast = index == history!.length - 1;
          final status = ApplicationStatus.fromString(item.newStatus);

          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Timeline indicator
              Column(
                children: [
                  Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      color: _getStatusColor(status),
                      shape: BoxShape.circle,
                    ),
                  ),
                  if (!isLast)
                    Container(
                      width: 2,
                      height: 40,
                      color: cs.outline.withOpacity(0.3),
                    ),
                ],
              ),
              const SizedBox(width: AppSpacing.md),
              // Content
              Expanded(
                child: Padding(
                  padding: EdgeInsets.only(bottom: isLast ? 0 : AppSpacing.md),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        status.displayLabel,
                        style: context.textStyles.bodyMedium?.semiBold,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _formatDateTime(item.createdAt),
                        style: context.textStyles.bodySmall?.withColor(cs.onSurfaceVariant),
                      ),
                      if (item.reason != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          item.reason!,
                          style: context.textStyles.bodySmall?.withColor(cs.onSurface),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          );
        }),
      ],
    );
  }

  Color _getStatusColor(ApplicationStatus status) {
    return switch (status) {
      ApplicationStatus.draft => AppColors.textMuted,
      ApplicationStatus.submitted => AppColors.info,
      ApplicationStatus.underReview => AppColors.warning,
      ApplicationStatus.approved => AppColors.success,
      ApplicationStatus.rejected => AppColors.error,
      ApplicationStatus.requiresMoreInfo => AppColors.warning,
    };
  }

  IconData _getStatusIcon(ApplicationStatus status) {
    return switch (status) {
      ApplicationStatus.draft => Icons.edit_outlined,
      ApplicationStatus.submitted => Icons.send,
      ApplicationStatus.underReview => Icons.hourglass_empty,
      ApplicationStatus.approved => Icons.check_circle,
      ApplicationStatus.rejected => Icons.cancel,
      ApplicationStatus.requiresMoreInfo => Icons.help_outline,
    };
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inDays == 0) {
      return 'today';
    } else if (diff.inDays == 1) {
      return 'yesterday';
    } else if (diff.inDays < 7) {
      return '${diff.inDays} days ago';
    } else {
      return DateFormat.MMMd().format(date);
    }
  }

  String _formatDateTime(DateTime date) {
    return DateFormat.MMMd().add_jm().format(date);
  }
}

/// Status badge widget
class _StatusBadge extends StatelessWidget {
  final ApplicationStatus status;

  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final color = _getColor();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppRadius.sm),
      ),
      child: Text(
        status.displayLabel,
        style: context.textStyles.labelSmall?.semiBold.withColor(color),
      ),
    );
  }

  Color _getColor() {
    return switch (status) {
      ApplicationStatus.draft => AppColors.textMuted,
      ApplicationStatus.submitted => AppColors.info,
      ApplicationStatus.underReview => AppColors.warning,
      ApplicationStatus.approved => AppColors.success,
      ApplicationStatus.rejected => AppColors.error,
      ApplicationStatus.requiresMoreInfo => AppColors.warning,
    };
  }
}
