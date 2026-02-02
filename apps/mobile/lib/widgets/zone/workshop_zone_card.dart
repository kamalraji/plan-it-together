import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/conference_models.dart';
import '../../supabase/conference_service.dart';
import '../styled_card.dart';
import '../styled_chip.dart';
import '../styled_button.dart';
import 'package:thittam1hub/services/logging_service.dart';

/// Workshop-specific Zone card with materials and progress tracking
class WorkshopZoneCard extends StatefulWidget {
  // Logging
   static final _log = LoggingService.instance;
   static const String _tag = 'WorkshopZoneCard';

  final String eventId;
  final int? totalSteps;
  final VoidCallback? onProgressUpdated;

  const WorkshopZoneCard({
    super.key,
    required this.eventId,
    this.totalSteps,
    this.onProgressUpdated,
  });

  @override
  State<WorkshopZoneCard> createState() => _WorkshopZoneCardState();
}

class _WorkshopZoneCardState extends State<WorkshopZoneCard> {
  static const String _tag = 'WorkshopZoneCard';
  static final _log = LoggingService.instance;
  
  final ConferenceService _service = ConferenceService.instance;

  bool _isLoading = true;
  List<EventMaterial> _materials = [];
  Map<String, List<EventMaterial>> _materialsByType = {};
  WorkshopProgress? _progress;
  String _selectedType = 'all';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        _service.getEventMaterials(widget.eventId),
        _service.getMaterialsByType(widget.eventId),
        _service.getWorkshopProgress(widget.eventId),
      ]);

      _materials = results[0] as List<EventMaterial>;
      _materialsByType = results[1] as Map<String, List<EventMaterial>>;
      _progress = results[2] as WorkshopProgress?;
    } catch (e) {
      _log.error('Error loading workshop data: $e', tag: _tag);
    }
    if (mounted) setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    if (_isLoading) {
      return const StyledCard(
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(32),
            child: CircularProgressIndicator(),
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Progress Tracker
        if (widget.totalSteps != null || _progress != null)
          _buildProgressTracker(cs),

        if (widget.totalSteps != null || _progress != null)
          const SizedBox(height: 16),

        // Materials Section
        _buildMaterialsSection(cs),
      ],
    );
  }

  Widget _buildProgressTracker(ColorScheme cs) {
    final currentStep = _progress?.currentStep ?? 0;
    final totalSteps = _progress?.totalSteps ?? widget.totalSteps ?? 5;
    final progress = totalSteps > 0 ? currentStep / totalSteps : 0.0;
    final isComplete = _progress?.isCompleted ?? false;

    return StyledCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: isComplete
                      ? Colors.green.withOpacity(0.15)
                      : cs.primary.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  isComplete ? Icons.emoji_events_rounded : Icons.school_rounded,
                  color: isComplete ? Colors.green : cs.primary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isComplete ? 'Workshop Complete!' : 'Your Progress',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    Text(
                      isComplete
                          ? 'Great job!'
                          : 'Step $currentStep of $totalSteps',
                      style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13),
                    ),
                  ],
                ),
              ),
              Text(
                '${(progress * 100).toInt()}%',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: isComplete ? Colors.green : cs.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Progress bar with steps
          Stack(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: LinearProgressIndicator(
                  value: progress,
                  minHeight: 12,
                  backgroundColor: cs.surfaceContainerHighest,
                  valueColor: AlwaysStoppedAnimation(
                    isComplete ? Colors.green : cs.primary,
                  ),
                ),
              ),
              Positioned.fill(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: List.generate(totalSteps - 1, (index) {
                    return Container(
                      width: 2,
                      color: cs.surface.withOpacity(0.5),
                    );
                  }),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Step controls
          Row(
            children: [
              if (currentStep > 0)
                Expanded(
                  child: StyledButton(
                    onPressed: () => _updateProgress(currentStep - 1, totalSteps),
                    label: 'Previous',
                    icon: Icons.arrow_back_rounded,
                    variant: StyledButtonVariant.outlined,
                  ),
                ),
              if (currentStep > 0 && currentStep < totalSteps)
                const SizedBox(width: 12),
              if (currentStep < totalSteps)
                Expanded(
                  child: StyledButton(
                    onPressed: () => _updateProgress(currentStep + 1, totalSteps),
                    label: currentStep == totalSteps - 1 ? 'Complete' : 'Next Step',
                    icon: currentStep == totalSteps - 1
                        ? Icons.check_rounded
                        : Icons.arrow_forward_rounded,
                    variant: currentStep == totalSteps - 1
                        ? StyledButtonVariant.primary
                        : StyledButtonVariant.secondary,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _updateProgress(int newStep, int totalSteps) async {
    try {
      await _service.upsertProgress(
        eventId: widget.eventId,
        currentStep: newStep,
        totalSteps: totalSteps,
      );
      await _loadData();
      widget.onProgressUpdated?.call();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error updating progress: $e')),
        );
      }
    }
  }

  Widget _buildMaterialsSection(ColorScheme cs) {
    final downloadedCount = _materials.where((m) => m.hasDownloaded).length;
    final types = ['all', ..._materialsByType.keys];

    return StyledCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: cs.secondary.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(Icons.folder_rounded, color: cs.secondary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Workshop Materials',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    Text(
                      '$downloadedCount/${_materials.length} downloaded',
                      style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Type filters
          SizedBox(
            height: 36,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: types.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final type = types[index];
                final isSelected = type == _selectedType;
                final count = type == 'all'
                    ? _materials.length
                    : _materialsByType[type]?.length ?? 0;

                return GestureDetector(
                  onTap: () => setState(() => _selectedType = type),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? cs.primary.withOpacity(0.2)
                          : cs.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(18),
                      border: isSelected
                          ? Border.all(color: cs.primary)
                          : null,
                    ),
                    alignment: Alignment.center,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          type == 'all' ? 'All' : _getTypeName(type),
                          style: TextStyle(
                            color: isSelected ? cs.primary : cs.onSurfaceVariant,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? cs.primary.withOpacity(0.3)
                                : cs.outline.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '$count',
                            style: TextStyle(
                              fontSize: 11,
                              color: isSelected ? cs.primary : cs.onSurfaceVariant,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 16),

          // Materials list
          ..._buildMaterialsList(cs),
        ],
      ),
    );
  }

  List<Widget> _buildMaterialsList(ColorScheme cs) {
    final filteredMaterials = _selectedType == 'all'
        ? _materials
        : _materialsByType[_selectedType] ?? [];

    if (filteredMaterials.isEmpty) {
      return [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: cs.surfaceContainerHighest.withOpacity(0.5),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            children: [
              Icon(Icons.folder_open, size: 40, color: cs.onSurfaceVariant),
              const SizedBox(height: 8),
              Text(
                'No materials available',
                style: TextStyle(color: cs.onSurfaceVariant),
              ),
            ],
          ),
        ),
      ];
    }

    return filteredMaterials.take(5).map((material) {
      return Container(
        margin: const EdgeInsets.only(bottom: 8),
        child: ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          tileColor: material.hasDownloaded
              ? Colors.green.withOpacity(0.08)
              : cs.surfaceContainerHighest.withOpacity(0.5),
          leading: Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: _getMaterialColor(material.materialType).withOpacity(0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(
              child: Text(
                material.typeIcon,
                style: const TextStyle(fontSize: 20),
              ),
            ),
          ),
          title: Text(
            material.title,
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          subtitle: Row(
            children: [
              StyledChip(
                label: material.typeDisplayName,
                size: ChipSize.small,
                variant: ChipVariant.secondary,
              ),
              if (material.fileSize != null) ...[
                const SizedBox(width: 8),
                Text(
                  material.formattedFileSize,
                  style: TextStyle(
                    color: cs.onSurfaceVariant,
                    fontSize: 11,
                  ),
                ),
              ],
            ],
          ),
          trailing: material.hasDownloaded
              ? Icon(Icons.check_circle, color: Colors.green, size: 24)
              : IconButton(
                  onPressed: () => _downloadMaterial(material),
                  icon: Icon(
                    material.isDownloadable
                        ? Icons.download_rounded
                        : Icons.open_in_new,
                    color: cs.primary,
                  ),
                ),
          onTap: () => _downloadMaterial(material),
        ),
      );
    }).toList();
  }

  Future<void> _downloadMaterial(EventMaterial material) async {
    try {
      final url = material.fileUrl ?? material.externalLink;
      if (url != null) {
        await _service.recordDownload(material.id);
        final uri = Uri.parse(url);
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        }
        _loadData();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  String _getTypeName(String type) {
    switch (type) {
      case 'slides': return 'Slides';
      case 'document': return 'Docs';
      case 'code': return 'Code';
      case 'video': return 'Videos';
      case 'link': return 'Links';
      case 'exercise': return 'Exercises';
      case 'template': return 'Templates';
      default: return type;
    }
  }

  Color _getMaterialColor(String type) {
    switch (type) {
      case 'slides': return Colors.orange;
      case 'document': return Colors.blue;
      case 'code': return Colors.green;
      case 'video': return Colors.red;
      case 'link': return Colors.purple;
      case 'exercise': return Colors.teal;
      case 'template': return Colors.indigo;
      default: return Colors.grey;
    }
  }
}
