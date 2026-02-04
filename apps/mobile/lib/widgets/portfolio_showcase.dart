import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:thittam1hub/models/portfolio_project.dart';
import 'package:thittam1hub/widgets/styled_empty_state.dart';
import 'package:url_launcher/url_launcher.dart';

class PortfolioShowcase extends StatelessWidget {
  final List<PortfolioProject> projects;
  final bool isEditable;
  final VoidCallback? onAdd;
  final Function(PortfolioProject)? onEdit;
  final Function(PortfolioProject)? onDelete;

  const PortfolioShowcase({
    super.key,
    required this.projects,
    this.isEditable = false,
    this.onAdd,
    this.onEdit,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;

    if (projects.isEmpty && !isEditable) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.folder_special_outlined, size: 20, color: cs.secondary),
            const SizedBox(width: 8),
            Text(
              'Portfolio',
              style: text.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const Spacer(),
            if (isEditable)
              IconButton(
                icon: Icon(Icons.add, color: cs.secondary),
                onPressed: onAdd,
                tooltip: 'Add Project',
              ),
          ],
        ),
        const SizedBox(height: 12),
        if (projects.isEmpty)
          StyledEmptyState.inline(
            icon: Icons.collections_outlined,
            title: 'No projects added yet',
            actionLabel: 'Add Project',
            onAction: onAdd,
          )
        else
          SizedBox(
            height: 200,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: projects.length + (isEditable ? 1 : 0),
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                if (isEditable && index == projects.length) {
                  return _AddProjectCard(onTap: onAdd);
                }
                return _ProjectCard(
                  project: projects[index],
                  isEditable: isEditable,
                  onEdit: onEdit != null ? () => onEdit!(projects[index]) : null,
                  onDelete: onDelete != null ? () => onDelete!(projects[index]) : null,
                );
              },
            ),
          ),
      ],
    );
  }
}

// _PortfolioEmptyState removed - now using StyledEmptyState.inline()

class _AddProjectCard extends StatelessWidget {
  final VoidCallback? onTap;

  const _AddProjectCard({this.onTap});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 160,
        decoration: BoxDecoration(
          color: cs.surfaceContainerHighest.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: cs.outlineVariant.withValues(alpha: 0.5),
            style: BorderStyle.solid,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.add_circle_outline, size: 40, color: cs.primary),
            const SizedBox(height: 8),
            Text(
              'Add Project',
              style: TextStyle(color: cs.primary, fontWeight: FontWeight.w500),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProjectCard extends StatelessWidget {
  final PortfolioProject project;
  final bool isEditable;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  const _ProjectCard({
    required this.project,
    required this.isEditable,
    this.onEdit,
    this.onDelete,
  });

  Future<void> _openProject() async {
    if (project.projectUrl != null) {
      final uri = Uri.tryParse(project.projectUrl!);
      if (uri != null && await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;

    return GestureDetector(
      onTap: _openProject,
      child: Container(
        width: 200,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: cs.shadow.withValues(alpha: 0.1),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Background image or gradient
              if (project.imageUrl != null)
                Image.network(
                  project.imageUrl!,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => _GradientBackground(cs: cs),
                )
              else
                _GradientBackground(cs: cs),
              
              // Glassmorphism overlay
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: ClipRRect(
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.black.withValues(alpha: 0.3),
                            Colors.black.withValues(alpha: 0.7),
                          ],
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            project.title,
                            style: text.titleSmall?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (project.description != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              project.description!,
                              style: text.bodySmall?.copyWith(
                                color: Colors.white70,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                          if (project.skills.isNotEmpty) ...[
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 4,
                              runSpacing: 4,
                              children: project.skills.take(3).map((skill) {
                                return Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 6,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.2),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    skill,
                                    style: text.labelSmall?.copyWith(
                                      color: Colors.white,
                                      fontSize: 10,
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
              ),

              // Edit menu
              if (isEditable)
                Positioned(
                  top: 8,
                  right: 8,
                  child: PopupMenuButton<String>(
                    icon: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.3),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.more_vert, color: Colors.white, size: 18),
                    ),
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
                ),

              // External link indicator
              if (project.projectUrl != null)
                Positioned(
                  top: 8,
                  left: 8,
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.3),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.open_in_new, color: Colors.white, size: 14),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _GradientBackground extends StatelessWidget {
  final ColorScheme cs;

  const _GradientBackground({required this.cs});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            cs.secondary,
            cs.primary,
          ],
        ),
      ),
      child: Center(
        child: Icon(
          Icons.code,
          size: 48,
          color: Colors.white.withValues(alpha: 0.5),
        ),
      ),
    );
  }
}
