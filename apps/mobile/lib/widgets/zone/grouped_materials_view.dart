import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/session_material.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/utils/zone_haptics.dart';
import 'package:url_launcher/url_launcher.dart';

/// Grouped session materials with expandable session headers.
/// Groups materials by session for easy navigation.
class GroupedMaterialsView extends StatefulWidget {
  final Map<String, SessionMaterialGroup> groupedMaterials;
  final bool isLoading;
  final VoidCallback? onRefresh;
  final Function(SessionMaterial)? onDownload;

  const GroupedMaterialsView({
    super.key,
    required this.groupedMaterials,
    this.isLoading = false,
    this.onRefresh,
    this.onDownload,
  });

  @override
  State<GroupedMaterialsView> createState() => _GroupedMaterialsViewState();
}

class _GroupedMaterialsViewState extends State<GroupedMaterialsView> {
  final Set<String> _expandedSessions = {};

  @override
  void initState() {
    super.initState();
    // Auto-expand first session if there's only one
    if (widget.groupedMaterials.length == 1) {
      _expandedSessions.add(widget.groupedMaterials.keys.first);
    }
  }

  void _toggleSession(String sessionId) {
    ZoneHaptics.selectionClick();
    setState(() {
      if (_expandedSessions.contains(sessionId)) {
        _expandedSessions.remove(sessionId);
      } else {
        _expandedSessions.add(sessionId);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (widget.isLoading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: CircularProgressIndicator.adaptive(),
        ),
      );
    }

    if (widget.groupedMaterials.isEmpty) {
      return _buildEmptyState(context);
    }

    final sortedGroups = widget.groupedMaterials.entries.toList()
      ..sort((a, b) => (a.value.sessionStartTime ?? DateTime.now())
          .compareTo(b.value.sessionStartTime ?? DateTime.now()));

    return RefreshIndicator(
      onRefresh: () async => widget.onRefresh?.call(),
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: sortedGroups.length + 1, // +1 for header
        itemBuilder: (context, index) {
          if (index == 0) {
            return _buildHeader(context, sortedGroups.length);
          }

          final group = sortedGroups[index - 1].value;
          final isExpanded = _expandedSessions.contains(group.sessionId);

          return _SessionMaterialsGroup(
            group: group,
            isExpanded: isExpanded,
            onToggle: () => _toggleSession(group.sessionId),
            onDownload: widget.onDownload,
          );
        },
      ),
    );
  }

  Widget _buildHeader(BuildContext context, int sessionCount) {
    final theme = Theme.of(context);
    final totalMaterials = widget.groupedMaterials.values
        .fold<int>(0, (sum, g) => sum + g.materials.length);

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  theme.colorScheme.primary,
                  theme.colorScheme.secondary,
                ],
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.folder_rounded,
              color: Colors.white,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Session Materials',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  '$totalMaterials resources from $sessionCount sessions',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurface.withOpacity(0.6),
                  ),
                ),
              ],
            ),
          ),
          // Expand/Collapse all button
          IconButton(
            onPressed: () {
              ZoneHaptics.selectionClick();
              setState(() {
                if (_expandedSessions.length == widget.groupedMaterials.length) {
                  _expandedSessions.clear();
                } else {
                  _expandedSessions.addAll(widget.groupedMaterials.keys);
                }
              });
            },
            icon: Icon(
              _expandedSessions.length == widget.groupedMaterials.length
                  ? Icons.unfold_less_rounded
                  : Icons.unfold_more_rounded,
              color: theme.colorScheme.primary,
            ),
            tooltip: _expandedSessions.length == widget.groupedMaterials.length
                ? 'Collapse all'
                : 'Expand all',
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    final theme = Theme.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: theme.colorScheme.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Icon(
                Icons.folder_open_rounded,
                size: 36,
                color: theme.colorScheme.primary,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'No Materials Yet',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Session resources will be shared here',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface.withOpacity(0.6),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

/// Group of materials for a single session.
class _SessionMaterialsGroup extends StatelessWidget {
  final SessionMaterialGroup group;
  final bool isExpanded;
  final VoidCallback onToggle;
  final Function(SessionMaterial)? onDownload;

  const _SessionMaterialsGroup({
    required this.group,
    required this.isExpanded,
    required this.onToggle,
    this.onDownload,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      child: Card(
        elevation: isExpanded ? 2 : 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          side: BorderSide(
            color: isExpanded
                ? theme.colorScheme.primary.withOpacity(0.3)
                : theme.colorScheme.outline.withOpacity(0.2),
          ),
        ),
        child: Column(
          children: [
            // Session header
            InkWell(
              onTap: onToggle,
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Row(
                  children: [
                    // Session icon with count
                    Stack(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primaryContainer,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(
                            Icons.event_note_rounded,
                            color: theme.colorScheme.onPrimaryContainer,
                            size: 22,
                          ),
                        ),
                        Positioned(
                          right: -2,
                          top: -2,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  theme.colorScheme.primary,
                                  theme.colorScheme.secondary,
                                ],
                              ),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              '${group.materials.length}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(width: 12),

                    // Session info
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            group.sessionTitle,
                            style: theme.textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (group.speakerName != null) ...[
                            const SizedBox(height: 2),
                            Text(
                              group.speakerName!,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.onSurface.withOpacity(0.6),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ],
                      ),
                    ),

                    // File type badges (collapsed view)
                    if (!isExpanded) ...[
                      _FileTypeBadges(materials: group.materials),
                      const SizedBox(width: 8),
                    ],

                    // Expand/collapse indicator
                    AnimatedRotation(
                      duration: const Duration(milliseconds: 200),
                      turns: isExpanded ? 0.5 : 0,
                      child: Icon(
                        Icons.keyboard_arrow_down_rounded,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Materials list (expandable)
            AnimatedCrossFade(
              firstChild: const SizedBox.shrink(),
              secondChild: Column(
                children: [
                  Divider(
                    height: 1,
                    color: theme.colorScheme.outline.withOpacity(0.2),
                  ),
                  ...group.materials.map((material) => _MaterialTile(
                        material: material,
                        onDownload: onDownload,
                      )),
                ],
              ),
              crossFadeState:
                  isExpanded ? CrossFadeState.showSecond : CrossFadeState.showFirst,
              duration: const Duration(milliseconds: 200),
            ),
          ],
        ),
      ),
    );
  }
}

/// Compact file type badges shown when session is collapsed.
class _FileTypeBadges extends StatelessWidget {
  final List<SessionMaterial> materials;

  const _FileTypeBadges({required this.materials});

  @override
  Widget build(BuildContext context) {
    // Get unique file types
    final types = materials.map((m) => m.fileType).toSet().take(3).toList();

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: types.map((type) {
        final material = materials.firstWhere((m) => m.fileType == type);
        return Padding(
          padding: const EdgeInsets.only(left: 4),
          child: Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: material.typeColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Icon(
              material.typeIcon,
              size: 14,
              color: material.typeColor,
            ),
          ),
        );
      }).toList(),
    );
  }
}

/// Individual material tile with download action.
class _MaterialTile extends StatefulWidget {
  final SessionMaterial material;
  final Function(SessionMaterial)? onDownload;

  const _MaterialTile({
    required this.material,
    this.onDownload,
  });

  @override
  State<_MaterialTile> createState() => _MaterialTileState();
}

class _MaterialTileState extends State<_MaterialTile>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  bool _isDownloading = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.98).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _handleDownload() async {
    if (_isDownloading) return;

    ZoneHaptics.lightImpact();
    setState(() => _isDownloading = true);

    try {
      widget.onDownload?.call(widget.material);

      final uri = Uri.parse(widget.material.fileUrl);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Could not open file')),
          );
        }
      }
    } finally {
      if (mounted) {
        setState(() => _isDownloading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final material = widget.material;

    return GestureDetector(
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) => _controller.reverse(),
      onTapCancel: () => _controller.reverse(),
      onTap: _handleDownload,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            border: Border(
              bottom: BorderSide(
                color: theme.colorScheme.outline.withOpacity(0.1),
              ),
            ),
          ),
          child: Row(
            children: [
              // File type icon
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: material.typeColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  material.typeIcon,
                  color: material.typeColor,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),

              // Material info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      material.title,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Text(
                          material.fileType.toUpperCase(),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: material.typeColor,
                          ),
                        ),
                        if (material.formattedSize.isNotEmpty) ...[
                          Text(
                            ' • ',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurface.withOpacity(0.4),
                            ),
                          ),
                          Text(
                            material.formattedSize,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurface.withOpacity(0.6),
                            ),
                          ),
                        ],
                        if (material.downloadCount > 0) ...[
                          Text(
                            ' • ',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurface.withOpacity(0.4),
                            ),
                          ),
                          Icon(
                            Icons.download_rounded,
                            size: 12,
                            color: theme.colorScheme.onSurface.withOpacity(0.5),
                          ),
                          const SizedBox(width: 2),
                          Text(
                            '${material.downloadCount}',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurface.withOpacity(0.6),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),

              // Download button
              _isDownloading
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator.adaptive(strokeWidth: 2),
                    )
                  : Icon(
                      material.isDownloadable
                          ? Icons.download_rounded
                          : Icons.open_in_new_rounded,
                      size: 20,
                      color: theme.colorScheme.primary,
                    ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Data class for grouped session materials.
class SessionMaterialGroup {
  final String sessionId;
  final String sessionTitle;
  final String? speakerName;
  final DateTime? sessionStartTime;
  final List<SessionMaterial> materials;

  const SessionMaterialGroup({
    required this.sessionId,
    required this.sessionTitle,
    this.speakerName,
    this.sessionStartTime,
    required this.materials,
  });

  /// Creates groups from a flat list of materials and session info.
  static Map<String, SessionMaterialGroup> groupBySession(
    List<SessionMaterial> materials,
    Map<String, SessionInfo> sessionInfo,
  ) {
    final grouped = <String, List<SessionMaterial>>{};

    for (final material in materials) {
      grouped.putIfAbsent(material.sessionId, () => []).add(material);
    }

    return grouped.map((sessionId, materials) {
      final info = sessionInfo[sessionId];
      return MapEntry(
        sessionId,
        SessionMaterialGroup(
          sessionId: sessionId,
          sessionTitle: info?.title ?? 'Session',
          speakerName: info?.speakerName,
          sessionStartTime: info?.startTime,
          materials: materials..sort((a, b) => a.sortOrder.compareTo(b.sortOrder)),
        ),
      );
    });
  }
}

/// Minimal session info for grouping.
class SessionInfo {
  final String id;
  final String title;
  final String? speakerName;
  final DateTime? startTime;

  const SessionInfo({
    required this.id,
    required this.title,
    this.speakerName,
    this.startTime,
  });
}
