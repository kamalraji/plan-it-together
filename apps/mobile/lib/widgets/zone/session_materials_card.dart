import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/session_material.dart';
import 'package:url_launcher/url_launcher.dart';

/// Card displaying session materials/resources
class SessionMaterialsCard extends StatelessWidget {
  final List<SessionMaterial> materials;
  final bool isExpanded;
  final VoidCallback? onToggleExpand;
  final Function(SessionMaterial)? onDownload;

  const SessionMaterialsCard({
    super.key,
    required this.materials,
    this.isExpanded = false,
    this.onToggleExpand,
    this.onDownload,
  });

  @override
  Widget build(BuildContext context) {
    if (materials.isEmpty) return const SizedBox.shrink();

    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          InkWell(
            onTap: onToggleExpand,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Icon(
                    Icons.folder_open_rounded,
                    color: cs.primary,
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Session Materials',
                      style: textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: cs.primaryContainer,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${materials.length}',
                      style: textTheme.labelSmall?.copyWith(
                        color: cs.onPrimaryContainer,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Icon(
                    isExpanded
                        ? Icons.keyboard_arrow_up_rounded
                        : Icons.keyboard_arrow_down_rounded,
                    color: cs.onSurfaceVariant,
                  ),
                ],
              ),
            ),
          ),

          // Materials list (collapsible)
          AnimatedCrossFade(
            firstChild: const SizedBox.shrink(),
            secondChild: Column(
              children: [
                const Divider(height: 1),
                ...materials.map((material) => _MaterialListTile(
                      material: material,
                      onTap: () => _openMaterial(context, material),
                    )),
              ],
            ),
            crossFadeState:
                isExpanded ? CrossFadeState.showSecond : CrossFadeState.showFirst,
            duration: const Duration(milliseconds: 200),
          ),
        ],
      ),
    );
  }

  Future<void> _openMaterial(BuildContext context, SessionMaterial material) async {
    HapticFeedback.lightImpact();
    
    // Track download
    onDownload?.call(material);

    final uri = Uri.parse(material.fileUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open material')),
        );
      }
    }
  }
}

class _MaterialListTile extends StatelessWidget {
  final SessionMaterial material;
  final VoidCallback onTap;

  const _MaterialListTile({
    required this.material,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return ListTile(
      onTap: onTap,
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: material.typeColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(
          material.typeIcon,
          color: material.typeColor,
          size: 20,
        ),
      ),
      title: Text(
        material.title,
        style: textTheme.bodyMedium?.copyWith(
          fontWeight: FontWeight.w500,
        ),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: material.description != null || material.formattedSize.isNotEmpty
          ? Text(
              [
                if (material.description != null) material.description!,
                if (material.formattedSize.isNotEmpty) material.formattedSize,
              ].join(' • '),
              style: textTheme.bodySmall?.copyWith(
                color: cs.onSurfaceVariant,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            )
          : null,
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (material.downloadCount > 0)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Text(
                '${material.downloadCount}',
                style: textTheme.labelSmall?.copyWith(
                  color: cs.onSurfaceVariant,
                ),
              ),
            ),
          Icon(
            material.isDownloadable
                ? Icons.download_rounded
                : Icons.open_in_new_rounded,
            size: 18,
            color: cs.onSurfaceVariant,
          ),
        ],
      ),
    );
  }
}

/// Compact inline material chips for session cards
class SessionMaterialChips extends StatelessWidget {
  final List<SessionMaterial> materials;
  final int maxVisible;

  const SessionMaterialChips({
    super.key,
    required this.materials,
    this.maxVisible = 3,
  });

  @override
  Widget build(BuildContext context) {
    if (materials.isEmpty) return const SizedBox.shrink();

    final cs = Theme.of(context).colorScheme;
    final visibleMaterials = materials.take(maxVisible).toList();
    final remaining = materials.length - maxVisible;

    return Wrap(
      spacing: 6,
      runSpacing: 4,
      children: [
        ...visibleMaterials.map((m) => _MaterialChip(material: m)),
        if (remaining > 0)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: cs.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              '+$remaining',
              style: TextStyle(
                fontSize: 11,
                color: cs.onSurfaceVariant,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
      ],
    );
  }
}

class _MaterialChip extends StatelessWidget {
  final SessionMaterial material;

  const _MaterialChip({required this.material});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: material.typeColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: material.typeColor.withOpacity(0.3),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            material.typeIcon,
            size: 12,
            color: material.typeColor,
          ),
          const SizedBox(width: 4),
          Text(
            material.fileType.toUpperCase(),
            style: TextStyle(
              fontSize: 10,
              color: material.typeColor,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
