import 'package:flutter/material.dart';
import 'package:thittam1hub/models/zone_models.dart';
import 'package:thittam1hub/models/session_material.dart';
import 'package:thittam1hub/utils/result.dart';
import 'package:thittam1hub/repositories/zone_repository.dart';
import 'package:thittam1hub/repositories/supabase_zone_repository.dart';
import 'package:thittam1hub/widgets/zone/grouped_materials_view.dart';
import 'package:thittam1hub/widgets/zone/zone_empty_states.dart';

/// Materials section with session-grouped resources
class MaterialsSection extends StatefulWidget {
  final String eventId;

  const MaterialsSection({super.key, required this.eventId});

  @override
  State<MaterialsSection> createState() => _MaterialsSectionState();
}

class _MaterialsSectionState extends State<MaterialsSection> {
  final ZoneRepository _repository = SupabaseZoneRepository();
  Map<String, SessionMaterialGroup> _groupedMaterials = {};
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadMaterials();
  }

  Future<void> _loadMaterials() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      // Fetch materials only - sessions handled separately if needed
      final materialsResult = await _repository.getEventMaterials(widget.eventId);

      if (!mounted) return;

      if (!materialsResult.isSuccess) {
        setState(() {
          _error = materialsResult.error ?? 'Failed to load materials';
          _loading = false;
        });
        return;
      }

      // Build session info map for grouping (empty for now, can be enhanced)
      final sessionInfo = <String, SessionInfo>{};
      // Sessions can be fetched via getAllSessions if needed
      final sessionsResult = await _repository.getAllSessions(widget.eventId);
      if (sessionsResult.isSuccess && sessionsResult.dataOrNull != null) {
        for (final session in sessionsResult.dataOrNull!) {
          sessionInfo[session.id] = SessionInfo(
            id: session.id,
            title: session.title,
            speakerName: session.speakerName,
            startTime: session.startTime,
          );
        }
      }

      // Group materials by session
      final grouped = SessionMaterialGroup.groupBySession(
        materialsResult.dataOrNull ?? [],
        sessionInfo,
      );

      setState(() {
        _groupedMaterials = grouped;
        _loading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Failed to load materials';
          _loading = false;
        });
      }
    }
  }

  void _handleDownload(SessionMaterial material) {
    // Track download analytics with event context
    _repository.trackMaterialDownload(
      material.id,
      eventId: widget.eventId,
      sessionId: material.sessionId,
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return ZoneEmptyStates.error(
        message: _error,
        onRetry: _loadMaterials,
      );
    }

    return GroupedMaterialsView(
      groupedMaterials: _groupedMaterials,
      isLoading: _loading,
      onRefresh: _loadMaterials,
      onDownload: _handleDownload,
    );
  }
}
