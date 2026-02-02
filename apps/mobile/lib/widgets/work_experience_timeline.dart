import 'package:flutter/material.dart';
import 'package:thittam1hub/models/work_experience.dart';
import 'package:thittam1hub/widgets/styled_empty_state.dart';

class WorkExperienceTimeline extends StatelessWidget {
  final List<WorkExperience> experiences;
  final bool isEditable;
  final VoidCallback? onAdd;
  final Function(WorkExperience)? onEdit;
  final Function(WorkExperience)? onDelete;

  const WorkExperienceTimeline({
    super.key,
    required this.experiences,
    this.isEditable = false,
    this.onAdd,
    this.onEdit,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;

    if (experiences.isEmpty && !isEditable) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.work_outline, size: 20, color: cs.primary),
            const SizedBox(width: 8),
            Text(
              'Work Experience',
              style: text.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const Spacer(),
            if (isEditable)
              IconButton(
                icon: Icon(Icons.add, color: cs.primary),
                onPressed: onAdd,
                tooltip: 'Add Experience',
              ),
          ],
        ),
        const SizedBox(height: 12),
        if (experiences.isEmpty)
          StyledEmptyState.inline(
            icon: Icons.business_center_outlined,
            title: 'No work experience added yet',
            actionLabel: 'Add Experience',
            onAction: onAdd,
          )
        else
          ...experiences.asMap().entries.map((entry) {
            final index = entry.key;
            final exp = entry.value;
            final isLast = index == experiences.length - 1;
            
            return _TimelineItem(
              experience: exp,
              isLast: isLast,
              isEditable: isEditable,
              onEdit: onEdit != null ? () => onEdit!(exp) : null,
              onDelete: onDelete != null ? () => onDelete!(exp) : null,
            );
          }),
      ],
    );
  }
}

// _WorkExperienceEmptyState removed - now using StyledEmptyState.inline()

class _TimelineItem extends StatelessWidget {
  final WorkExperience experience;
  final bool isLast;
  final bool isEditable;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  const _TimelineItem({
    required this.experience,
    required this.isLast,
    required this.isEditable,
    this.onEdit,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline line and dot
          SizedBox(
            width: 40,
            child: Column(
              children: [
                Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: experience.isCurrent ? cs.primary : cs.surfaceContainerHighest,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: experience.isCurrent ? cs.primary : cs.outlineVariant,
                      width: 2,
                    ),
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: cs.outlineVariant.withValues(alpha: 0.5),
                    ),
                  ),
              ],
            ),
          ),
          // Content
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 20),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark 
                      ? cs.surfaceContainerHighest.withValues(alpha: 0.5)
                      : cs.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: experience.isCurrent 
                        ? cs.primary.withValues(alpha: 0.3)
                        : cs.outlineVariant.withValues(alpha: 0.3),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: cs.shadow.withValues(alpha: 0.05),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        // Company logo or icon
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: cs.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: experience.companyLogoUrl != null
                              ? ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: Image.network(
                                    experience.companyLogoUrl!,
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, __, ___) => Icon(
                                      Icons.business,
                                      color: cs.primary,
                                    ),
                                  ),
                                )
                              : Icon(Icons.business, color: cs.primary),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      experience.title,
                                      style: text.titleSmall?.copyWith(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  if (experience.isCurrent)
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 2,
                                      ),
                                      decoration: BoxDecoration(
                                        color: cs.primary.withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        'Current',
                                        style: text.labelSmall?.copyWith(
                                          color: cs.primary,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                              Text(
                                experience.company,
                                style: text.bodyMedium?.copyWith(
                                  color: cs.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (isEditable)
                          PopupMenuButton<String>(
                            icon: Icon(Icons.more_vert, color: cs.onSurfaceVariant),
                            onSelected: (value) {
                              if (value == 'edit') onEdit?.call();
                              if (value == 'delete') onDelete?.call();
                            },
                            itemBuilder: (context) => [
                              const PopupMenuItem(
                                value: 'edit',
                                child: Row(
                                  children: [
                                    Icon(Icons.edit_outlined, size: 20),
                                    SizedBox(width: 8),
                                    Text('Edit'),
                                  ],
                                ),
                              ),
                              PopupMenuItem(
                                value: 'delete',
                                child: Row(
                                  children: [
                                    Icon(Icons.delete_outline, size: 20, color: Colors.red),
                                    const SizedBox(width: 8),
                                    const Text('Delete', style: TextStyle(color: Colors.red)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    // Date range and duration
                    Row(
                      children: [
                        Icon(Icons.calendar_today_outlined, size: 14, color: cs.onSurfaceVariant),
                        const SizedBox(width: 4),
                        Text(
                          experience.dateRangeString,
                          style: text.bodySmall?.copyWith(color: cs.onSurfaceVariant),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '• ${experience.durationString}',
                          style: text.bodySmall?.copyWith(color: cs.onSurfaceVariant),
                        ),
                      ],
                    ),
                    if (experience.location != null) ...[
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(Icons.location_on_outlined, size: 14, color: cs.onSurfaceVariant),
                          const SizedBox(width: 4),
                          Text(
                            experience.location!,
                            style: text.bodySmall?.copyWith(color: cs.onSurfaceVariant),
                          ),
                        ],
                      ),
                    ],
                    if (experience.description != null && experience.description!.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Text(
                        experience.description!,
                        style: text.bodySmall,
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
