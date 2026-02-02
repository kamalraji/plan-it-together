import 'package:flutter/material.dart';
import 'package:thittam1hub/models/zone_section.dart';

/// Header component for inside zone experience
/// Shows event name, current section, and navigation controls
class ZoneInsideHeader extends StatelessWidget {
  final String eventName;
  final ZoneSection currentSection;
  final VoidCallback onMenuPressed;
  final VoidCallback onCheckOut;

  const ZoneInsideHeader({
    super.key,
    required this.eventName,
    required this.currentSection,
    required this.onMenuPressed,
    required this.onCheckOut,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final sectionColor = currentSection.getColor(cs);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        color: cs.surface,
        border: Border(
          bottom: BorderSide(color: cs.outline.withOpacity(0.1)),
        ),
      ),
      child: Row(
        children: [
          // Menu Button
          IconButton(
            icon: const Icon(Icons.menu_rounded),
            onPressed: onMenuPressed,
            tooltip: 'Navigation Menu',
          ),
          
          const SizedBox(width: 4),
          
          // Event Name & Section Indicator
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Event name
                Text(
                  eventName,
                  style: textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                // Current section badge
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: sectionColor.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            currentSection.icon,
                            size: 12,
                            color: sectionColor,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            currentSection.label,
                            style: textTheme.labelSmall?.copyWith(
                              color: sectionColor,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    // Live indicator
                    Container(
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: Colors.green,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.green.withOpacity(0.5),
                            blurRadius: 4,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'In Zone',
                      style: textTheme.labelSmall?.copyWith(
                        color: Colors.green,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          // Checkout Button
          TextButton.icon(
            onPressed: onCheckOut,
            icon: Icon(
              Icons.logout_rounded,
              size: 18,
              color: cs.error,
            ),
            label: Text(
              'Exit',
              style: TextStyle(color: cs.error),
            ),
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              backgroundColor: cs.error.withOpacity(0.1),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
