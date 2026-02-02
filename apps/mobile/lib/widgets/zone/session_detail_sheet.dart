import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import 'package:thittam1hub/models/zone_models.dart';
import 'package:thittam1hub/models/session_material.dart';
import 'package:thittam1hub/repositories/zone_repository.dart';
import 'package:thittam1hub/repositories/supabase_zone_repository.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/nav.dart';
import 'package:thittam1hub/widgets/zone/grouped_materials_view.dart';
import 'package:thittam1hub/widgets/zone/sections/zone_section_utils.dart';

/// Session detail bottom sheet with tabs for Overview, Materials, Q&A, Feedback
/// Supports deep linking via URL parameters
class SessionDetailSheet extends StatefulWidget {
  final EventSession session;
  final String eventId;
  final VoidCallback? onClose;

  const SessionDetailSheet({
    super.key,
    required this.session,
    required this.eventId,
    this.onClose,
  });

  /// Show the session detail sheet as a modal bottom sheet
  static Future<void> show(
    BuildContext context, {
    required EventSession session,
    required String eventId,
    VoidCallback? onClose,
  }) {
    HapticFeedback.mediumImpact();
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      useSafeArea: true,
      builder: (context) => SessionDetailSheet(
        session: session,
        eventId: eventId,
        onClose: onClose,
      ),
    );
  }

  @override
  State<SessionDetailSheet> createState() => _SessionDetailSheetState();
}

class _SessionDetailSheetState extends State<SessionDetailSheet>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ZoneRepository _repository = SupabaseZoneRepository();
  
  List<SessionMaterial> _materials = [];
  bool _materialsLoading = true;
  bool _isBookmarked = false;
  bool _bookmarkLoading = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    // Load materials and bookmark status in parallel
    await Future.wait([
      _loadMaterials(),
      _checkBookmark(),
    ]);
  }

  Future<void> _loadMaterials() async {
    final result = await _repository.getSessionMaterials(widget.session.id);
    if (mounted) {
      setState(() {
        _materials = result.dataOrNull ?? [];
        _materialsLoading = false;
      });
    }
  }

  Future<void> _checkBookmark() async {
    final result = await _repository.isSessionBookmarked(widget.session.id);
    if (mounted) {
      setState(() {
        _isBookmarked = result.dataOrNull ?? false;
      });
    }
  }

  Future<void> _toggleBookmark() async {
    if (_bookmarkLoading) return;
    
    HapticFeedback.lightImpact();
    setState(() => _bookmarkLoading = true);

    try {
      if (_isBookmarked) {
        await _repository.removeBookmark(widget.session.id);
      } else {
        await _repository.bookmarkSession(
          sessionId: widget.session.id,
          eventId: widget.eventId,
        );
      }
      
      if (mounted) {
        setState(() => _isBookmarked = !_isBookmarked);
      }
    } finally {
      if (mounted) {
        setState(() => _bookmarkLoading = false);
      }
    }
  }

  void _shareSession() {
    HapticFeedback.lightImpact();
    final url = AppRoutes.zoneInside(
      widget.eventId,
      section: 'schedule',
    ) + '&sessionId=${widget.session.id}';
    
    Share.share(
      '${widget.session.title}\n\nCheck out this session: $url',
      subject: widget.session.title,
    );
  }

  void _handleMaterialDownload(SessionMaterial material) {
    _repository.trackMaterialDownload(
      material.id,
      eventId: widget.eventId,
      sessionId: widget.session.id,
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final session = widget.session;
    final isLive = session.status == 'live';

    return DraggableScrollableSheet(
      initialChildSize: 0.75,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: cs.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Drag handle
              Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: cs.onSurface.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              
              // Header
              _SessionHeader(
                session: session,
                isLive: isLive,
                onClose: () {
                  Navigator.pop(context);
                  widget.onClose?.call();
                },
              ),

              // Tab Bar
              TabBar(
                controller: _tabController,
                tabs: const [
                  Tab(text: 'Overview'),
                  Tab(text: 'Materials'),
                  Tab(text: 'Q&A'),
                  Tab(text: 'Feedback'),
                ],
                labelColor: cs.primary,
                unselectedLabelColor: cs.onSurfaceVariant,
                indicatorColor: cs.primary,
              ),

              // Tab Content
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    // Overview Tab
                    _OverviewTab(
                      session: session,
                      isBookmarked: _isBookmarked,
                      bookmarkLoading: _bookmarkLoading,
                      onToggleBookmark: _toggleBookmark,
                      onShare: _shareSession,
                    ),
                    
                    // Materials Tab
                    _MaterialsTab(
                      materials: _materials,
                      isLoading: _materialsLoading,
                      onDownload: _handleMaterialDownload,
                    ),
                    
                    // Q&A Tab
                    _QATab(
                      sessionId: session.id,
                      eventId: widget.eventId,
                    ),
                    
                    // Feedback Tab
                    _FeedbackTab(
                      sessionId: session.id,
                      eventId: widget.eventId,
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

// =============================================================================
// Session Header Component
// =============================================================================

class _SessionHeader extends StatelessWidget {
  final EventSession session;
  final bool isLive;
  final VoidCallback onClose;

  const _SessionHeader({
    required this.session,
    required this.isLive,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 12, 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    if (isLive) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.red,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const PulsingDot(),
                            const SizedBox(width: 6),
                            Text(
                              'LIVE',
                              style: textTheme.labelSmall?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                    ],
                    if (session.room != null)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: cs.surfaceContainerHighest,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.meeting_room_rounded,
                              size: 12,
                              color: cs.onSurfaceVariant,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              session.room!,
                              style: textTheme.labelSmall?.copyWith(
                                color: cs.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  session.title,
                  style: textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close_rounded),
            onPressed: onClose,
          ),
        ],
      ),
    );
  }
}

// =============================================================================
// Overview Tab
// =============================================================================

class _OverviewTab extends StatelessWidget {
  final EventSession session;
  final bool isBookmarked;
  final bool bookmarkLoading;
  final VoidCallback onToggleBookmark;
  final VoidCallback onShare;

  const _OverviewTab({
    required this.session,
    required this.isBookmarked,
    required this.bookmarkLoading,
    required this.onToggleBookmark,
    required this.onShare,
  });

  String _formatTime(DateTime time) {
    return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
  }

  String _formatDuration(DateTime start, DateTime end) {
    final duration = end.difference(start);
    if (duration.inHours > 0) {
      return '${duration.inHours}h ${duration.inMinutes % 60}m';
    }
    return '${duration.inMinutes}m';
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // Time & Duration
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: cs.primaryContainer.withOpacity(0.3),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Icon(Icons.schedule_rounded, color: cs.primary),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${_formatTime(session.startTime)} - ${_formatTime(session.endTime)}',
                    style: textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: cs.primary,
                    ),
                  ),
                  Text(
                    _formatDuration(session.startTime, session.endTime),
                    style: textTheme.bodySmall?.copyWith(
                      color: cs.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        
        const SizedBox(height: 20),

        // Description
        if (session.description != null) ...[
          Text(
            session.description!,
            style: textTheme.bodyLarge?.copyWith(
              color: cs.onSurface,
              height: 1.6,
            ),
          ),
          const SizedBox(height: 20),
        ],

        // Speaker Card
        if (session.speakerName != null) ...[
          Text(
            'Speaker',
            style: textTheme.titleSmall?.copyWith(
              color: cs.onSurfaceVariant,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: cs.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: cs.primary.withOpacity(0.1),
                  backgroundImage: session.speakerAvatar != null
                      ? NetworkImage(session.speakerAvatar!)
                      : null,
                  child: session.speakerAvatar == null
                      ? Text(
                          session.speakerName![0].toUpperCase(),
                          style: textTheme.titleMedium?.copyWith(
                            color: cs.primary,
                            fontWeight: FontWeight.bold,
                          ),
                        )
                      : null,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    session.speakerName!,
                    style: textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
        ],

        // Track Tags
        if (session.tags != null && session.tags!.isNotEmpty) ...[
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: session.tags!.map((tag) => Chip(
              label: Text(tag),
              backgroundColor: cs.secondaryContainer,
              labelStyle: textTheme.labelSmall?.copyWith(
                color: cs.onSecondaryContainer,
              ),
              padding: EdgeInsets.zero,
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
            )).toList(),
          ),
          const SizedBox(height: 20),
        ],

        // Action Buttons
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: bookmarkLoading ? null : onToggleBookmark,
                icon: bookmarkLoading
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Icon(
                        isBookmarked
                            ? Icons.bookmark_rounded
                            : Icons.bookmark_border_rounded,
                      ),
                label: Text(isBookmarked ? 'Saved' : 'Save'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: FilledButton.icon(
                onPressed: onShare,
                icon: const Icon(Icons.share_rounded),
                label: const Text('Share'),
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// =============================================================================
// Materials Tab
// =============================================================================

class _MaterialsTab extends StatelessWidget {
  final List<SessionMaterial> materials;
  final bool isLoading;
  final Function(SessionMaterial)? onDownload;

  const _MaterialsTab({
    required this.materials,
    required this.isLoading,
    this.onDownload,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(
        child: CircularProgressIndicator.adaptive(),
      );
    }

    if (materials.isEmpty) {
      return const ZoneSectionEmpty(
        icon: Icons.folder_open_rounded,
        title: 'No Materials Yet',
        subtitle: 'Session resources will appear here',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: materials.length,
      itemBuilder: (context, index) {
        final material = materials[index];
        return _MaterialListItem(
          material: material,
          onDownload: onDownload,
        );
      },
    );
  }
}

class _MaterialListItem extends StatelessWidget {
  final SessionMaterial material;
  final Function(SessionMaterial)? onDownload;

  const _MaterialListItem({
    required this.material,
    this.onDownload,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: material.typeColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(
            material.typeIcon,
            color: material.typeColor,
          ),
        ),
        title: Text(
          material.title,
          style: textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.w600,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: material.fileSizeFormatted != null
            ? Text(
                material.fileSizeFormatted!,
                style: textTheme.bodySmall?.copyWith(
                  color: cs.onSurfaceVariant,
                ),
              )
            : null,
        trailing: IconButton(
          icon: Icon(Icons.download_rounded, color: cs.primary),
          onPressed: () => onDownload?.call(material),
        ),
      ),
    );
  }
}

// =============================================================================
// Q&A Tab (Placeholder - uses existing Q&A section components)
// =============================================================================

class _QATab extends StatelessWidget {
  final String sessionId;
  final String eventId;

  const _QATab({
    required this.sessionId,
    required this.eventId,
  });

  @override
  Widget build(BuildContext context) {
    return const ZoneSectionEmpty(
      icon: Icons.question_answer_rounded,
      title: 'Session Q&A',
      subtitle: 'Questions and answers for this session',
    );
    // TODO: Integrate with existing QA section components
  }
}

// =============================================================================
// Feedback Tab (Placeholder - uses existing feedback components)
// =============================================================================

class _FeedbackTab extends StatelessWidget {
  final String sessionId;
  final String eventId;

  const _FeedbackTab({
    required this.sessionId,
    required this.eventId,
  });

  @override
  Widget build(BuildContext context) {
    return const ZoneSectionEmpty(
      icon: Icons.rate_review_rounded,
      title: 'Session Feedback',
      subtitle: 'Share your thoughts about this session',
    );
    // TODO: Integrate with existing feedback components
  }
}
