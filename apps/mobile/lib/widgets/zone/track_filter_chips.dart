import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/session_feedback.dart';

/// Horizontal scrolling track filter chips for sessions
class TrackFilterChips extends StatelessWidget {
  final List<EventTrack> tracks;
  final Set<String> selectedTrackIds;
  final ValueChanged<Set<String>> onSelectionChanged;
  final bool showAllOption;

  const TrackFilterChips({
    super.key,
    required this.tracks,
    required this.selectedTrackIds,
    required this.onSelectionChanged,
    this.showAllOption = true,
  });

  @override
  Widget build(BuildContext context) {
    if (tracks.isEmpty) return const SizedBox.shrink();

    final cs = Theme.of(context).colorScheme;

    return SizedBox(
      height: 40,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: showAllOption ? tracks.length + 1 : tracks.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          // "All" chip
          if (showAllOption && index == 0) {
            final isSelected = selectedTrackIds.isEmpty;
            return _TrackChip(
              label: 'All',
              color: cs.primary,
              isSelected: isSelected,
              onTap: () {
                HapticFeedback.selectionClick();
                onSelectionChanged({});
              },
            );
          }

          final trackIndex = showAllOption ? index - 1 : index;
          final track = tracks[trackIndex];
          final isSelected = selectedTrackIds.contains(track.id);
          final chipColor = _parseColor(track.color) ?? cs.tertiary;

          return _TrackChip(
            label: track.name,
            color: chipColor,
            icon: _parseIcon(track.icon),
            isSelected: isSelected,
            onTap: () {
              HapticFeedback.selectionClick();
              final newSelection = Set<String>.from(selectedTrackIds);
              if (isSelected) {
                newSelection.remove(track.id);
              } else {
                newSelection.add(track.id);
              }
              onSelectionChanged(newSelection);
            },
          );
        },
      ),
    );
  }

  Color? _parseColor(String? colorHex) {
    if (colorHex == null || colorHex.isEmpty) return null;
    try {
      final hex = colorHex.replaceFirst('#', '');
      return Color(int.parse('FF$hex', radix: 16));
    } catch (_) {
      return null;
    }
  }

  IconData? _parseIcon(String? iconName) {
    if (iconName == null || iconName.isEmpty) return null;
    // Map common icon names to IconData
    switch (iconName.toLowerCase()) {
      case 'code':
        return Icons.code_rounded;
      case 'design':
        return Icons.design_services_rounded;
      case 'business':
        return Icons.business_center_rounded;
      case 'workshop':
        return Icons.construction_rounded;
      case 'keynote':
        return Icons.mic_rounded;
      case 'networking':
        return Icons.people_rounded;
      case 'panel':
        return Icons.groups_rounded;
      case 'demo':
        return Icons.play_circle_rounded;
      default:
        return null;
    }
  }
}

class _TrackChip extends StatelessWidget {
  final String label;
  final Color color;
  final IconData? icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _TrackChip({
    required this.label,
    required this.color,
    this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? color.withOpacity(0.2) : cs.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? color : cs.outline.withOpacity(0.2),
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(
                icon,
                size: 16,
                color: isSelected ? color : cs.onSurfaceVariant,
              ),
              const SizedBox(width: 6),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                color: isSelected ? color : cs.onSurfaceVariant,
              ),
            ),
            if (isSelected) ...[
              const SizedBox(width: 4),
              Icon(Icons.check_rounded, size: 14, color: color),
            ],
          ],
        ),
      ),
    );
  }
}
