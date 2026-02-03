import 'package:flutter/material.dart';
import 'package:thittam1hub/models/impact_profile.dart';
import 'package:thittam1hub/utils/intent_config.dart';

/// Filter sheet for the Pulse discovery page.
/// 
/// Allows filtering profiles by:
/// - Looking for (connection intent)
/// - Skills
/// - Interests
class PulseFilterSheet extends StatefulWidget {
  final List<ImpactProfile> allProfiles;
  final List<String> selectedSkills;
  final List<String> selectedInterests;
  final List<String> selectedLookingFor;
  final Function(List<String> skills, List<String> interests, List<String> lookingFor) onApply;

  const PulseFilterSheet({
    super.key,
    required this.allProfiles,
    required this.selectedSkills,
    required this.selectedInterests,
    required this.selectedLookingFor,
    required this.onApply,
  });

  @override
  State<PulseFilterSheet> createState() => _PulseFilterSheetState();
}

class _PulseFilterSheetState extends State<PulseFilterSheet> {
  late List<String> _skills;
  late List<String> _interests;
  late List<String> _lookingFor;

  @override
  void initState() {
    super.initState();
    _skills = List.from(widget.selectedSkills);
    _interests = List.from(widget.selectedInterests);
    _lookingFor = List.from(widget.selectedLookingFor);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    final allSkills = widget.allProfiles.expand((p) => p.skills).toSet().toList()..sort();
    final allInterests = widget.allProfiles.expand((p) => p.interests).toSet().toList()..sort();

    return DraggableScrollableSheet(
      initialChildSize: 0.7,
      minChildSize: 0.4,
      maxChildSize: 0.9,
      expand: false,
      builder: (context, scrollController) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Filters',
                  style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                TextButton(
                  onPressed: () {
                    setState(() {
                      _skills.clear();
                      _interests.clear();
                      _lookingFor.clear();
                    });
                  },
                  child: const Text('Clear All'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ListView(
                controller: scrollController,
                children: [
                  _buildLookingForSection(cs, textTheme),
                  const SizedBox(height: 20),
                  _buildSection('Skills', allSkills, _skills, cs, textTheme),
                  const SizedBox(height: 20),
                  _buildSection('Interests', allInterests, _interests, cs, textTheme),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  widget.onApply(_skills, _interests, _lookingFor);
                  Navigator.pop(context);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: cs.primary,
                  foregroundColor: cs.onPrimary,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: const Text('Apply Filters'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLookingForSection(ColorScheme cs, TextTheme textTheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Looking For',
          style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 4),
        Text(
          'Filter by connection intent',
          style: textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: IntentConfig.all.map((config) {
            final isSelected = _lookingFor.contains(config.key);
            return FilterChip(
              avatar: Icon(
                config.icon,
                size: 16,
                color: isSelected ? config.color : cs.onSurfaceVariant,
              ),
              label: Text(config.label),
              selected: isSelected,
              onSelected: (value) {
                setState(() {
                  if (value) {
                    _lookingFor.add(config.key);
                  } else {
                    _lookingFor.remove(config.key);
                  }
                });
              },
              selectedColor: config.color.withOpacity(0.2),
              checkmarkColor: config.color,
              labelStyle: TextStyle(
                color: isSelected ? config.color : cs.onSurface,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildSection(
    String title,
    List<String> options,
    List<String> selected,
    ColorScheme cs,
    TextTheme textTheme,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: options.map((option) {
            final isSelected = selected.contains(option);
            return FilterChip(
              label: Text(option),
              selected: isSelected,
              onSelected: (value) {
                setState(() {
                  if (value) {
                    selected.add(option);
                  } else {
                    selected.remove(option);
                  }
                });
              },
              selectedColor: cs.primary.withValues(alpha: 0.2),
              checkmarkColor: cs.primary,
            );
          }).toList(),
        ),
      ],
    );
  }
}
