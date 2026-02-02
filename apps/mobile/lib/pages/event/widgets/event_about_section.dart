import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/theme.dart';

/// Collapsible about/description section
class EventAboutSection extends StatelessWidget {
  final String description;
  final bool isExpanded;
  final VoidCallback onToggle;

  const EventAboutSection({
    super.key,
    required this.description,
    required this.isExpanded,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: cs.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(AppRadius.sm),
          ),
          child: Icon(Icons.info_outline, size: 18, color: cs.primary),
        ),
        const SizedBox(width: 12),
        Text('About', style: text.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
      ]),
      const SizedBox(height: 12),
      AnimatedCrossFade(
        duration: const Duration(milliseconds: 200),
        crossFadeState: isExpanded ? CrossFadeState.showSecond : CrossFadeState.showFirst,
        firstChild: Text(
          description,
          maxLines: 3,
          overflow: TextOverflow.ellipsis,
          style: text.bodyMedium?.copyWith(
            color: cs.onSurfaceVariant,
            height: 1.5,
          ),
        ),
        secondChild: Text(
          description,
          style: text.bodyMedium?.copyWith(
            color: cs.onSurfaceVariant,
            height: 1.5,
          ),
        ),
      ),
      if (description.length > 200) ...[
        const SizedBox(height: 8),
        Semantics(
          button: true,
          label: isExpanded ? 'Show less description' : 'Read more description',
          child: TextButton.icon(
            onPressed: () {
              HapticFeedback.lightImpact();
              onToggle();
            },
            icon: Icon(
              isExpanded ? Icons.expand_less : Icons.expand_more,
              color: cs.primary,
            ),
            label: Text(
              isExpanded ? 'Show less' : 'Read more',
              style: TextStyle(color: cs.primary),
            ),
          ),
        ),
      ],
    ]);
  }
}
