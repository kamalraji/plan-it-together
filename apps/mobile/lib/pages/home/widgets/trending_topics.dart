import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class TrendingTopics extends StatelessWidget {
  final List<String> tags;
  final Function(String) onTagTap;

  const TrendingTopics({
    Key? key,
    required this.tags,
    required this.onTagTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (tags.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          colors: isDark
              ? [
                  cs.surfaceContainerHigh,
                  cs.surfaceContainerHighest.withValues(alpha: 0.5),
                ]
              : [
                  cs.surfaceContainerLowest,
                  cs.surfaceContainerLow,
                ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(
          color: cs.outline.withValues(alpha: 0.1),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.orange.shade400,
                      Colors.red.shade400,
                    ],
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.local_fire_department_rounded,
                  size: 18,
                  color: Colors.white,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Trending Now',
                      style: textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'Hot topics in your community',
                      style: textTheme.bodySmall?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              TextButton(
                onPressed: () {
                  HapticFeedback.lightImpact();
                  // TODO: See all trending
                },
                style: TextButton.styleFrom(
                  visualDensity: VisualDensity.compact,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                ),
                child: Text(
                  'See all',
                  style: textTheme.labelMedium?.copyWith(
                    color: cs.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          
          // Tags with gradient pills
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: tags.asMap().entries.map((entry) {
                final index = entry.key;
                final tag = entry.value;
                
                // Alternate gradient colors
                final gradientColors = [
                  [cs.primary, cs.tertiary],
                  [Colors.purple, Colors.pink],
                  [Colors.orange, Colors.red],
                  [Colors.teal, Colors.cyan],
                ][index % 4];
                
                return Padding(
                  padding: const EdgeInsets.only(right: 10),
                  child: _TrendingTagChip(
                    tag: tag,
                    gradientColors: gradientColors,
                    onTap: () {
                      HapticFeedback.lightImpact();
                      onTagTap(tag);
                    },
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}

class _TrendingTagChip extends StatefulWidget {
  final String tag;
  final List<Color> gradientColors;
  final VoidCallback onTap;

  const _TrendingTagChip({
    required this.tag,
    required this.gradientColors,
    required this.onTap,
  });

  @override
  State<_TrendingTagChip> createState() => _TrendingTagChipState();
}

class _TrendingTagChipState extends State<_TrendingTagChip> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    
    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) => setState(() => _isPressed = false),
      onTapCancel: () => setState(() => _isPressed = false),
      onTap: widget.onTap,
      child: AnimatedScale(
        scale: _isPressed ? 0.95 : 1.0,
        duration: const Duration(milliseconds: 100),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                widget.gradientColors[0].withValues(alpha: 0.12),
                widget.gradientColors[1].withValues(alpha: 0.08),
              ],
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: widget.gradientColors[0].withValues(alpha: 0.25),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              ShaderMask(
                shaderCallback: (bounds) => LinearGradient(
                  colors: widget.gradientColors,
                ).createShader(bounds),
                child: const Text(
                  '#',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
              const SizedBox(width: 2),
              Text(
                widget.tag,
                style: textTheme.labelLarge?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: cs.onSurface,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
