import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/pages/impact/pulse_page_controller.dart';

/// Toggle widget for switching between People and Groups discovery modes.
class PulseDiscoveryToggle extends StatelessWidget {
  final DiscoveryMode currentMode;
  final ValueChanged<DiscoveryMode> onModeChanged;

  const PulseDiscoveryToggle({
    super.key,
    required this.currentMode,
    required this.onModeChanged,
  });

  static const Map<DiscoveryMode, IconData> _modeIcons = {
    DiscoveryMode.people: Icons.person_rounded,
    DiscoveryMode.groups: Icons.groups_rounded,
  };

  static const Map<DiscoveryMode, String> _modeLabels = {
    DiscoveryMode.people: 'People',
    DiscoveryMode.groups: 'Groups',
  };

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: cs.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: DiscoveryMode.values.map((mode) {
            final isSelected = currentMode == mode;
            return Expanded(
              child: Semantics(
                button: true,
                selected: isSelected,
                label: '${_modeLabels[mode]} discovery mode${isSelected ? ", selected" : ""}',
                child: GestureDetector(
                  onTap: () {
                    HapticFeedback.lightImpact();
                    onModeChanged(mode);
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: isSelected ? cs.primary : Colors.transparent,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          _modeIcons[mode]!,
                          size: 16,
                          color: isSelected ? cs.onPrimary : cs.onSurfaceVariant,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          _modeLabels[mode]!,
                          style: TextStyle(
                            color: isSelected ? cs.onPrimary : cs.onSurface,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}
